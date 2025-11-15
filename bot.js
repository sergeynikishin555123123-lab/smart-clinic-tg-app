import { Telegraf } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
const PORT = process.env.PORT || 3000;

// ЗАМЕНИТЕ НА ВАШ ТЕЛЕГРАМ ID!
const ADMIN_IDS = [898508164]; 

console.log('🚀 Starting Smart Clinic Bot...');

// ==================== ПРОСТАЯ БАЗА ДАННЫХ В ПАМЯТИ ====================
const users = new Map();
const buttonConfigs = {
  navigation: { text: '📱 Навигация', reply: 'Открываю навигацию...' },
  promotions: { text: '🎁 Акции', reply: '🎁 Раздел акций в разработке. Скоро здесь появятся специальные предложения!' },
  question: { text: '❓ Задать вопрос', reply: '❓ Чтобы задать вопрос по обучению, напишите @academy_anb' },
  support: { text: '💬 Поддержка', reply: '💬 Координатор академии: @academy_anb\n⏰ Часы работы: ПН-ПТ с 11:00 до 19:00' }
};

const userSessions = new Map();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      id,
      username: `user_${id}`,
      firstName: 'User',
      joinedAt: new Date(),
      lastActivity: new Date(),
      stats: { commands: 0, buttons: 0 }
    });
  }
  return users.get(id);
}

function updateUserActivity(userId) {
  const user = getUser(userId);
  user.lastActivity = new Date();
  user.stats.buttons++;
}

function getStats() {
  const totalUsers = users.size;
  const activeToday = Array.from(users.values()).filter(user => 
    (new Date() - user.lastActivity) < 24 * 60 * 60 * 1000
  ).length;
  
  return {
    totalUsers,
    activeToday,
    totalCommands: Array.from(users.values()).reduce((sum, user) => sum + user.stats.commands, 0),
    totalButtons: Array.from(users.values()).reduce((sum, user) => sum + user.stats.buttons, 0)
  };
}

// ==================== ТЕЛЕГРАМ БОТ ====================
const bot = new Telegraf(BOT_TOKEN);

// ==================== ОСНОВНЫЕ КОМАНДЫ ====================
bot.start(async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.commands++;
  user.firstName = ctx.from.first_name;
  user.username = ctx.from.username || `user_${ctx.from.id}`;
  
  console.log(`👤 User ${ctx.from.id} started bot`);
  
  await ctx.reply(
    `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n` +
    `Я ваш помощник в мире профессионального развития.\n\n` +
    `Используйте кнопки ниже для навигации:`,
    {
      reply_markup: {
        keyboard: [
          ['📱 Навигация', '🎁 Акции'],
          ['❓ Задать вопрос', '💬 Поддержка']
        ],
        resize_keyboard: true
      }
    }
  );
});

bot.hears('📱 Навигация', async (ctx) => {
  updateUserActivity(ctx.from.id);
  await ctx.reply(buttonConfigs.navigation.reply, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📱 Открыть приложение',
          web_app: { url: `http://localhost:${PORT}` }
        }
      ]]
    }
  });
});

bot.hears('🎁 Акции', async (ctx) => {
  updateUserActivity(ctx.from.id);
  await ctx.reply(buttonConfigs.promotions.reply);
});

bot.hears('❓ Задать вопрос', async (ctx) => {
  updateUserActivity(ctx.from.id);
  await ctx.reply(buttonConfigs.question.reply);
});

bot.hears('💬 Поддержка', async (ctx) => {
  updateUserActivity(ctx.from.id);
  await ctx.reply(buttonConfigs.support.reply);
});

// ==================== АДМИН-ПАНЕЛЬ ====================
bot.command('admin', async (ctx) => {
  const userId = ctx.from.id;
  
  if (!isAdmin(userId)) {
    await ctx.reply('❌ У вас нет прав доступа к админ-панели');
    console.log(`❌ Admin access denied for user ${userId}`);
    return;
  }

  console.log(`✅ Admin access granted for user ${userId}`);
  
  await ctx.reply('🔧 Панель администратора', {
    reply_markup: {
      keyboard: [
        ['📊 Статистика', '✏️ Редактировать кнопки'],
        ['📢 Сделать рассылку', '👥 Пользователи'],
        ['🔙 В главное меню']
      ],
      resize_keyboard: true
    }
  });
});

bot.hears('📊 Статистика', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  
  const stats = getStats();
  
  await ctx.reply(
    `📊 Статистика бота:\n\n` +
    `👥 Всего пользователей: ${stats.totalUsers}\n` +
    `✅ Активных за 24ч: ${stats.activeToday}\n` +
    `📱 Команд выполнено: ${stats.totalCommands}\n` +
    `🎯 Нажатий кнопок: ${stats.totalButtons}`
  );
});

bot.hears('✏️ Редактировать кнопки', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;

  let message = '📋 Выберите кнопку для редактирования:\n\n';
  Object.entries(buttonConfigs).forEach(([key, config]) => {
    message += `🔹 ${config.text}\n📝 ${config.reply.substring(0, 60)}...\n\n`;
  });

  await ctx.reply(message, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Навигация', callback_data: 'edit_navigation' },
          { text: '✏️ Акции', callback_data: 'edit_promotions' }
        ],
        [
          { text: '✏️ Вопрос', callback_data: 'edit_question' },
          { text: '✏️ Поддержка', callback_data: 'edit_support' }
        ]
      ]
    }
  });
});

bot.action(/edit_(.+)/, async (ctx) => {
  if (!isAdmin(ctx.from.id)) {
    await ctx.answerCbQuery('❌ Нет прав доступа');
    return;
  }

  const buttonType = ctx.match[1];
  userSessions.set(ctx.from.id, { editing: buttonType });

  await ctx.editMessageText(
    `✏️ Редактирование кнопки: ${buttonConfigs[buttonType].text}\n\n` +
    `Текущий ответ:\n${buttonConfigs[buttonType].reply}\n\n` +
    `Отправьте новый текст ответа:`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'cancel_edit' }]]
      }
    }
  );
  
  await ctx.answerCbQuery();
});

bot.action('cancel_edit', async (ctx) => {
  userSessions.delete(ctx.from.id);
  await ctx.editMessageText('❌ Редактирование отменено');
  await ctx.answerCbQuery();
});

bot.hears('📢 Сделать рассылку', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  
  userSessions.set(ctx.from.id, { broadcasting: true });
  await ctx.reply(
    '📢 Создание рассылки\n\nОтправьте сообщение для рассылки всем пользователям:',
    {
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'cancel_broadcast' }]]
      }
    }
  );
});

bot.action('cancel_broadcast', async (ctx) => {
  userSessions.delete(ctx.from.id);
  await ctx.editMessageText('❌ Рассылка отменена');
  await ctx.answerCbQuery();
});

bot.hears('👥 Пользователи', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return;
  
  const recentUsers = Array.from(users.values())
    .sort((a, b) => b.joinedAt - a.joinedAt)
    .slice(0, 10);
  
  const userList = recentUsers
    .map(user => `👤 ${user.firstName} (${user.username})\n📅 ${user.joinedAt.toLocaleDateString()}`)
    .join('\n\n');

  await ctx.reply(
    `👥 Последние пользователи:\n\n${userList || 'Пока нет пользователей'}\n\n` +
    `Всего: ${users.size} пользователей`
  );
});

bot.hears('🔙 В главное меню', async (ctx) => {
  userSessions.delete(ctx.from.id);
  await ctx.reply('Возвращаемся в главное меню...', {
    reply_markup: {
      keyboard: [
        ['📱 Навигация', '🎁 Акции'],
        ['❓ Задать вопрос', '💬 Поддержка']
      ],
      resize_keyboard: true
    }
  });
});

// ==================== ОБРАБОТКА СООБЩЕНИЙ ====================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const session = userSessions.get(userId);

  // Пропускаем команды
  if (text.startsWith('/')) return;

  if (session?.editing && isAdmin(userId)) {
    const buttonType = session.editing;
    buttonConfigs[buttonType].reply = text;
    userSessions.delete(userId);
    await ctx.reply(`✅ Ответ для "${buttonConfigs[buttonType].text}" обновлен!`);
    return;
  }

  if (session?.broadcasting && isAdmin(userId)) {
    let sent = 0;
    const userList = Array.from(users.keys());
    
    for (const userId of userList) {
      try {
        await bot.telegram.sendMessage(userId, `📢 Рассылка от администратора:\n\n${text}`);
        sent++;
      } catch (error) {
        console.log(`❌ Не удалось отправить пользователю ${userId}`);
      }
    }
    
    userSessions.delete(userId);
    await ctx.reply(`✅ Рассылка отправлена ${sent} пользователям из ${userList.length}!`);
    return;
  }

  // Обычные сообщения
  await ctx.reply('🤗 Используйте кнопки меню для навигации');
});

// ==================== WEB APP SERVER ====================
const app = express();

// Раздаем статические файлы из папки webapp
app.use(express.static(join(__dirname, 'webapp')));

// API для статистики
app.get('/api/stats', (req, res) => {
  res.json(getStats());
});

// Все остальные запросы на index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК ====================
async function startApp() {
  try {
    // Запускаем веб-сервер
    app.listen(PORT, () => {
      console.log(`🌐 WebApp server running on port ${PORT}`);
    });

    // Запускаем бота
    await bot.launch();
    console.log('✅ Bot started successfully!');
    console.log('🔧 Admin commands: /admin');
    console.log('📊 WebApp: http://localhost:' + PORT);
    console.log('📊 API Stats: http://localhost:' + PORT + '/api/stats');
    console.log(`⚠️  Don't forget to set your Telegram ID: ${ADMIN_IDS}`);

  } catch (error) {
    console.error('❌ Failed to start app:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  bot.stop('SIGTERM');
  process.exit(0);
});

// Запускаем приложение
startApp();
