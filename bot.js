import { Telegraf } from 'telegraf';
import express from 'express';

// ==================== КОНФИГУРАЦИЯ ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-webapp-url.com';
const ADMIN_IDS = [123456789]; // ЗАМЕНИТЕ НА ВАШ ТЕЛЕГРАМ ID!

console.log('🚀 Starting Smart Clinic Bot...');

// ==================== БАЗА ДАННЫХ В ПАМЯТИ ====================
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
      createdAt: new Date(),
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

// ==================== ТЕЛЕГРАМ БОТ ====================
const bot = new Telegraf(BOT_TOKEN);

// ==================== ОСНОВНЫЕ КОМАНДЫ ====================
bot.start(async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.commands++;
  
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
          web_app: { url: WEBAPP_URL }
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
  
  const totalUsers = users.size;
  const activeToday = Array.from(users.values()).filter(user => 
    (new Date() - user.lastActivity) < 24 * 60 * 60 * 1000
  ).length;

  await ctx.reply(
    `📊 Статистика бота:\n\n` +
    `👥 Всего пользователей: ${totalUsers}\n` +
    `✅ Активных за 24ч: ${activeToday}\n` +
    `📱 Команд выполнено: ${Array.from(users.values()).reduce((sum, user) => sum + user.stats.commands, 0)}\n` +
    `🎯 Нажатий кнопок: ${Array.from(users.values()).reduce((sum, user) => sum + user.stats.buttons, 0)}`
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
  
  const userList = Array.from(users.values())
    .slice(-10)
    .map(user => `👤 ${user.id} (${new Date(user.createdAt).toLocaleDateString()})`)
    .join('\n');

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

  if (session?.editing && isAdmin(userId)) {
    const buttonType = session.editing;
    buttonConfigs[buttonType].reply = text;
    userSessions.delete(userId);
    await ctx.reply(`✅ Ответ для "${buttonConfigs[buttonType].text}" обновлен!`);
    return;
  }

  if (session?.broadcasting && isAdmin(userId)) {
    let sent = 0;
    for (const [id, user] of users) {
      try {
        await bot.telegram.sendMessage(id, `📢 Рассылка:\n\n${text}`);
        sent++;
      } catch (error) {
        console.log(`❌ Не удалось отправить пользователю ${id}`);
      }
    }
    userSessions.delete(userId);
    await ctx.reply(`✅ Рассылка отправлена ${sent} пользователям!`);
    return;
  }

  // Обычные сообщения
  if (!text.startsWith('/')) {
    await ctx.reply('🤗 Используйте кнопки меню для навигации');
  }
});

// ==================== WEB APP SERVER ====================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('webapp'));

app.get('/api/stats', (req, res) => {
  res.json({
    users: users.size,
    buttons: Array.from(users.values()).reduce((sum, user) => sum + user.stats.buttons, 0),
    commands: Array.from(users.values()).reduce((sum, user) => sum + user.stats.commands, 0)
  });
});

app.listen(PORT, () => {
  console.log(`🌐 WebApp server running on port ${PORT}`);
});

// ==================== ЗАПУСК БОТА ====================
bot.launch()
  .then(() => {
    console.log('✅ Bot started successfully!');
    console.log('🔧 Admin commands: /admin');
    console.log('📊 WebApp stats: http://localhost:3000/api/stats');
    console.log(`⚠️  Don't forget to set your Telegram ID: ${ADMIN_IDS}`);
  })
  .catch(error => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
