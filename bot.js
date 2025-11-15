import { Telegraf } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || `http://localhost:${PORT}`;

const ADMIN_IDS = [898508164]; 

console.log('🚀 Starting Smart Clinic Bot...');

// ==================== БАЗА ДАННЫХ ====================
const users = new Map();
const contentDB = {
  courses: [],
  podcasts: [],
  streams: [],
  videos: [],
  materials: [],
  events: []
};

const buttonConfigs = {
  navigation: { text: '📱 Навигация', reply: 'Открываю навигацию...' },
  promotions: { text: '🎁 Акции', reply: '🎁 Раздел акций в разработке!' },
  question: { text: '❓ Задать вопрос', reply: '❓ Напишите @academy_anb' },
  support: { text: '💬 Поддержка', reply: '💬 Координатор: @academy_anb' }
};

const userSessions = new Map();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function isAdmin(userId) {
  return userId === ADMIN_IDS[0];
}

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      id, firstName: 'User', joinedAt: new Date(), lastActivity: new Date(),
      stats: { commands: 0, buttons: 0 },
      subscription: { status: 'inactive', type: 'none' },
      progress: { level: 'Понимаю', steps: {} }
    });
  }
  return users.get(id);
}

// ==================== ТЕЛЕГРАМ БОТ ====================
const bot = new Telegraf(BOT_TOKEN);

// ==================== ОСНОВНЫЕ КОМАНДЫ ====================
bot.start(async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.commands++;
  user.firstName = ctx.from.first_name;
  
  let welcomeMessage = `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n`;
  
  if (isAdmin(ctx.from.id)) {
    welcomeMessage += `⚡ <b>Вы администратор системы</b>\n\n`;
  }
  
  welcomeMessage += `Используйте кнопки для навигации:`;
  
  await ctx.reply(welcomeMessage, {
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        ['📱 Навигация', '🎁 Акции'],
        ['❓ Задать вопрос', '💬 Поддержка']
      ],
      resize_keyboard: true
    }
  });
});

// Основные обработчики кнопок
bot.hears('📱 Навигация', async (ctx) => {
  await ctx.reply(buttonConfigs.navigation.reply, {
    reply_markup: {
      inline_keyboard: [[
        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
      ]]
    }
  });
});

bot.hears('🎁 Акции', async (ctx) => await ctx.reply(buttonConfigs.promotions.reply));
bot.hears('❓ Задать вопрос', async (ctx) => await ctx.reply(buttonConfigs.question.reply));
bot.hears('💬 Поддержка', async (ctx) => await ctx.reply(buttonConfigs.support.reply));

// ==================== АДМИН-ПАНЕЛЬ ====================
bot.command('admin', async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.reply('❌ Нет прав доступа');
    return;
  }

  await ctx.reply('🔧 <b>Панель администратора</b>', {
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        ['📊 Статистика', '✏️ Редактировать кнопки'],
        ['📝 Управление контентом', '👥 Пользователи'],
        ['🔙 В главное меню']
      ],
      resize_keyboard: true
    }
  });
});

// Управление контентом
bot.hears('📝 Управление контентом', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;

  await ctx.reply('📝 <b>Управление контентом</b>\n\nВыберите раздел для управления:', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📚 Курсы', callback_data: 'manage_courses' },
          { text: '🎧 АНБ FM', callback_data: 'manage_podcasts' }
        ],
        [
          { text: '📹 Эфиры', callback_data: 'manage_streams' },
          { text: '🎯 Шпаргалки', callback_data: 'manage_videos' }
        ],
        [
          { text: '📋 Материалы', callback_data: 'manage_materials' },
          { text: '🗺️ Мероприятия', callback_data: 'manage_events' }
        ]
      ]
    }
  });
});

// Обработчики управления контентом
bot.action(/manage_(.+)/, async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.answerCbQuery('❌ Нет прав доступа');
    return;
  }

  const contentType = ctx.match[1];
  const contentTypes = {
    courses: 'курсы', podcasts: 'подкасты', streams: 'эфиры', 
    videos: 'видео-шпаргалки', materials: 'материалы', events: 'мероприятия'
  };

  userSessions.set(ctx.from.id, { managing: contentType });

  await ctx.editMessageText(
    `📝 <b>Управление ${contentTypes[contentType]}</b>\n\n` +
    `Выберите действие:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '➕ Добавить', callback_data: `add_${contentType}` },
            { text: '📋 Список', callback_data: `list_${contentType}` }
          ],
          [
            { text: '🔙 Назад', callback_data: 'back_to_content_manage' }
          ]
        ]
      }
    }
  );
  
  await ctx.answerCbQuery();
});

// Добавление контента
bot.action(/add_(.+)/, async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.answerCbQuery('❌ Нет прав доступа');
    return;
  }

  const contentType = ctx.match[1];
  userSessions.set(ctx.from.id, { adding: contentType, step: 'title' });

  const contentNames = {
    courses: 'курс', podcasts: 'подкаст', streams: 'эфир', 
    videos: 'видео-шпаргалку', materials: 'материал', events: 'мероприятие'
  };

  await ctx.editMessageText(
    `➕ <b>Добавление ${contentNames[contentType]}</b>\n\n` +
    `Шаг 1/3: Введите название:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'cancel_add' }]]
      }
    }
  );
});

// Просмотр списка контента
bot.action(/list_(.+)/, async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.answerCbQuery('❌ Нет прав доступа');
    return;
  }

  const contentType = ctx.match[1];
  const content = contentDB[contentType];
  const contentNames = {
    courses: 'Курсы', podcasts: 'Подкасты', streams: 'Эфиры',
    videos: 'Видео-шпаргалки', materials: 'Материалы', events: 'Мероприятия'
  };

  let message = `📋 <b>${contentNames[contentType]}</b>\n\n`;
  
  if (content.length === 0) {
    message += 'Пока нет добавленного контента';
  } else {
    content.forEach((item, index) => {
      message += `${index + 1}. <b>${item.title}</b>\n`;
      if (item.description) message += `   ${item.description.substring(0, 50)}...\n`;
      message += '\n';
    });
  }

  await ctx.editMessageText(message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Добавить новый', callback_data: `add_${contentType}` }],
        [{ text: '🔙 Назад', callback_data: 'back_to_content_manage' }]
      ]
    }
  });
});

// Навигация назад
bot.action('back_to_content_manage', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;

  await ctx.editMessageText('📝 <b>Управление контентом</b>\n\nВыберите раздел для управления:', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📚 Курсы', callback_data: 'manage_courses' },
          { text: '🎧 АНБ FM', callback_data: 'manage_podcasts' }
        ],
        [
          { text: '📹 Эфиры', callback_data: 'manage_streams' },
          { text: '🎯 Шпаргалки', callback_data: 'manage_videos' }
        ],
        [
          { text: '📋 Материалы', callback_data: 'manage_materials' },
          { text: '🗺️ Мероприятия', callback_data: 'manage_events' }
        ]
      ]
    }
  });
});

bot.action('cancel_add', async (ctx) => {
  const userId = ctx.from.id;
  userSessions.delete(userId);
  await ctx.editMessageText('❌ Добавление отменено');
});

// ==================== ОБРАБОТКА СООБЩЕНИЙ ДЛЯ ДОБАВЛЕНИЯ КОНТЕНТА ====================
bot.on('message', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);
  const message = ctx.message;

  if (!session || !isAdmin(userId)) return;

  // Обработка добавления контента
  if (session.adding) {
    const contentType = session.adding;

    if (session.step === 'title') {
      // Сохраняем название
      session.title = message.text;
      session.step = 'description';
      
      await ctx.reply('📝 <b>Шаг 2/3:</b> Введите описание:', { parse_mode: 'HTML' });
    
    } else if (session.step === 'description') {
      // Сохраняем описание
      session.description = message.text;
      session.step = 'photo';
      
      await ctx.reply('🖼️ <b>Шаг 3/3:</b> Отправьте фото для превью:', { parse_mode: 'HTML' });
    
    } else if (session.step === 'photo' && message.photo) {
      // Сохраняем фото и создаем контент
      const photo = message.photo[message.photo.length - 1];
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      
      const newContent = {
        id: Date.now().toString(),
        title: session.title,
        description: session.description,
        photoUrl: fileLink.href,
        createdAt: new Date(),
        type: contentType
      };

      contentDB[contentType].push(newContent);
      userSessions.delete(userId);

      const contentNames = {
        courses: 'курс', podcasts: 'подкаст', streams: 'эфир',
        videos: 'видео-шпаргалку', materials: 'материал', events: 'мероприятие'
      };

      await ctx.replyWithPhoto(photo.file_id, {
        caption: `✅ <b>${contentNames[contentType]} добавлен!</b>\n\n` +
                `<b>Название:</b> ${session.title}\n` +
                `<b>Описание:</b> ${session.description}`,
        parse_mode: 'HTML'
      });
    }
    return;
  }

  // Обычные сообщения
  if (!message.text.startsWith('/')) {
    await ctx.reply('🤗 Используйте кнопки меню для навигации');
  }
});

// ==================== WEB APP SERVER С API ====================
const app = express();
app.use(express.json());

// Раздаем статические файлы
app.use(express.static(join(__dirname, 'webapp')));

// API для получения контента
app.get('/api/content/:type', (req, res) => {
  const contentType = req.params.type;
  if (contentDB[contentType]) {
    res.json(contentDB[contentType]);
  } else {
    res.status(404).json({ error: 'Content type not found' });
  }
});

app.get('/api/content', (req, res) => {
  res.json(contentDB);
});

// Все остальные запросы
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК ====================
async function startApp() {
  try {
    app.listen(PORT, () => {
      console.log(`🌐 WebApp server running on port ${PORT}`);
    });

    await bot.launch();
    console.log('✅ Bot started successfully!');
    console.log(`⚡ Admin ID: ${ADMIN_IDS[0]}`);
    console.log('🔧 Команды: /admin, /start, /help');

  } catch (error) {
    console.error('❌ Failed to start app:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startApp();
