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

// ВАШ ТЕЛЕГРАМ ID - ОБЯЗАТЕЛЬНО ПРОВЕРЬТЕ ЧЕРЕЗ @userinfobot
const ADMIN_IDS = [898508164]; 

console.log('🚀 Starting Smart Clinic Bot...');
console.log('🔧 Admin ID:', ADMIN_IDS[0]);

// ==================== ПРОСТАЯ БАЗА ДАННЫХ ====================
const users = new Map();
const buttonConfigs = {
  navigation: { 
    text: '📱 Навигация', 
    reply: 'Открываю навигацию...' 
  },
  promotions: { 
    text: '🎁 Акции', 
    reply: '🎁 Раздел акций в разработке. Скоро здесь появятся специальные предложения!' 
  },
  question: { 
    text: '❓ Задать вопрос', 
    reply: '❓ Чтобы задать вопрос по обучению, напишите @academy_anb' 
  },
  support: { 
    text: '💬 Поддержка', 
    reply: '💬 Координатор академии: @academy_anb\n⏰ Часы работы: ПН-ПТ с 11:00 до 19:00' 
  }
};

const userSessions = new Map();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function isAdmin(userId) {
  console.log(`🔐 Проверка прав: ${userId} == ${ADMIN_IDS[0]} -> ${userId === ADMIN_IDS[0]}`);
  return userId === ADMIN_IDS[0];
}

function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      id,
      username: `user_${id}`,
      firstName: 'User',
      joinedAt: new Date(),
      lastActivity: new Date(),
      stats: { commands: 0, buttons: 0 },
      subscription: {
        status: 'inactive',
        type: 'none',
        startDate: null,
        endDate: null
      },
      progress: {
        level: 'Понимаю',
        steps: {
          'Понимаю': { completed: true, progress: 100 },
          'Связываю': { completed: false, progress: 60 },
          'Применяю': { completed: false, progress: 20 },
          'Систематизирую': { completed: false, progress: 0 },
          'Делюсь': { completed: false, progress: 0 }
        }
      }
    });
    console.log(`✅ Создан новый пользователь: ${id}`);
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
  const userId = ctx.from.id;
  const user = getUser(userId);
  
  user.stats.commands++;
  user.firstName = ctx.from.first_name;
  user.username = ctx.from.username || `user_${userId}`;
  
  console.log(`👤 Пользователь ${userId} запустил бота`);
  
  let welcomeMessage = `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n`;
  
  // Проверяем админские права
  if (isAdmin(userId)) {
    welcomeMessage += `⚡ <b>Вы администратор системы</b>\n\n`;
    console.log(`⭐ Пользователь ${userId} - АДМИНИСТРАТОР`);
  }
  
  welcomeMessage += `Я ваш помощник в мире профессионального развития.\n\nИспользуйте кнопки ниже для навигации:`;
  
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

// Обработчики кнопок
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

// ==================== КОМАНДЫ БОТА ====================
bot.help(async (ctx) => {
  let helpText = `🤖 <b>Помощь по боту Академии АНБ</b>\n\n<b>Основные команды:</b>\n/start - начать работу\n/help - показать справку\n/menu - показать меню\n/status - статус подписки`;
  
  if (isAdmin(ctx.from.id)) {
    helpText += `\n/admin - панель администратора`;
  }
  
  helpText += `\n\n<b>Используйте кнопки для навигации!</b>`;
  
  await ctx.reply(helpText, { parse_mode: 'HTML' });
});

bot.command('menu', async (ctx) => {
  await ctx.reply('📋 Главное меню:', {
    reply_markup: {
      keyboard: [
        ['📱 Навигация', '🎁 Акции'],
        ['❓ Задать вопрос', '💬 Поддержка']
      ],
      resize_keyboard: true
    }
  });
});

bot.command('status', async (ctx) => {
  const user = getUser(ctx.from.id);
  const stats = getStats();
  
  let subscriptionText = '🔒 Не активна';
  if (user.subscription.status === 'active') {
    subscriptionText = `✅ Активна (${user.subscription.type})`;
  }
  
  let statusMessage = `📊 <b>Ваш статус:</b>\n\n👤 Пользователь: ${user.firstName}\n💳 Подписка: ${subscriptionText}\n🎯 Уровень: ${user.progress.level}\n📅 Зарегистрирован: ${user.joinedAt.toLocaleDateString()}\n🎯 Активность: ${user.stats.buttons} действий`;
  
  if (isAdmin(ctx.from.id)) {
    statusMessage += `\n\n⚡ <b>Вы администратор системы</b>`;
  }
  
  statusMessage += `\n\n📈 <b>Общая статистика:</b>\n👥 Пользователей: ${stats.totalUsers}\n✅ Активных сегодня: ${stats.activeToday}`;
  
  await ctx.reply(statusMessage, { parse_mode: 'HTML' });
});

// ==================== АДМИН-ПАНЕЛЬ ====================
bot.command('admin', async (ctx) => {
  const userId = ctx.from.id;
  
  console.log(`🔧 Пользователь ${userId} пытается открыть админ-панель`);
  
  if (!isAdmin(userId)) {
    console.log(`❌ Доступ запрещен для пользователя ${userId}`);
    await ctx.reply('❌ У вас нет прав доступа к админ-панели');
    return;
  }

  console.log(`✅ Доступ разрешен для администратора ${userId}`);
  
  await ctx.reply('🔧 <b>Панель администратора</b>', {
    parse_mode: 'HTML',
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

// Обработчики админ-меню
bot.hears('📊 Статистика', async (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    await ctx.reply('❌ Нет прав доступа');
    return;
  }
  
  const stats = getStats();
  
  await ctx.reply(
    `📊 <b>Статистика бота:</b>\n\n` +
    `👥 Всего пользователей: <b>${stats.totalUsers}</b>\n` +
    `✅ Активных за 24ч: <b>${stats.activeToday}</b>\n` +
    `📱 Команд выполнено: <b>${stats.totalCommands}</b>\n` +
    `🎯 Нажатий кнопок: <b>${stats.totalButtons}</b>\n\n` +
    `🔄 Бот запущен и работает стабильно`,
    { parse_mode: 'HTML' }
  );
});

bot.hears('✏️ Редактировать кнопки', async (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    await ctx.reply('❌ Нет прав доступа');
    return;
  }

  let message = '📋 <b>Выберите кнопку для редактирования:</b>\n\n';
  Object.entries(buttonConfigs).forEach(([key, config]) => {
    message += `🔹 <b>${config.text}</b>\n📝 ${config.reply.substring(0, 50)}...\n\n`;
  });

  await ctx.reply(message, {
    parse_mode: 'HTML',
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

// Обработка callback кнопок
bot.action(/edit_(.+)/, async (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    await ctx.answerCbQuery('❌ Нет прав доступа');
    return;
  }

  const buttonType = ctx.match[1];
  userSessions.set(userId, { editing: buttonType });

  await ctx.editMessageText(
    `✏️ <b>Редактирование кнопки:</b> ${buttonConfigs[buttonType].text}\n\n` +
    `<b>Текущий ответ:</b>\n${buttonConfigs[buttonType].reply}\n\n` +
    `<b>Отправьте новый текст ответа:</b>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'cancel_edit' }]]
      }
    }
  );
  
  await ctx.answerCbQuery();
});

bot.action('cancel_edit', async (ctx) => {
  const userId = ctx.from.id;
  userSessions.delete(userId);
  await ctx.editMessageText('❌ Редактирование отменено');
  await ctx.answerCbQuery();
});

bot.hears('📢 Сделать рассылку', async (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    await ctx.reply('❌ Нет прав доступа');
    return;
  }
  
  userSessions.set(userId, { broadcasting: true });
  await ctx.reply(
    '📢 <b>Создание рассылки</b>\n\nОтправьте сообщение для рассылки всем пользователям:',
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'cancel_broadcast' }]]
      }
    }
  );
});

bot.action('cancel_broadcast', async (ctx) => {
  const userId = ctx.from.id;
  userSessions.delete(userId);
  await ctx.editMessageText('❌ Рассылка отменена');
  await ctx.answerCbQuery();
});

bot.hears('👥 Пользователи', async (ctx) => {
  const userId = ctx.from.id;
  if (!isAdmin(userId)) {
    await ctx.reply('❌ Нет прав доступа');
    return;
  }
  
  const recentUsers = Array.from(users.values())
    .sort((a, b) => b.joinedAt - a.joinedAt)
    .slice(0, 5);
  
  let userList = '';
  recentUsers.forEach((user, index) => {
    const subscriptionStatus = user.subscription.status === 'active' ? '✅' : '🔒';
    userList += `${index + 1}. ${user.firstName} (${user.username}) ${subscriptionStatus}\n`;
  });

  await ctx.reply(
    `👥 <b>Последние пользователи:</b>\n\n${userList || 'Пока нет пользователей'}\n\n` +
    `<b>Всего:</b> ${users.size} пользователей`,
    { parse_mode: 'HTML' }
  );
});

bot.hears('🔙 В главное меню', async (ctx) => {
  const userId = ctx.from.id;
  userSessions.delete(userId);
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

  console.log(`📨 Сообщение от ${userId}: "${text}"`);

  // Пропускаем команды
  if (text.startsWith('/')) return;

  if (session?.editing && isAdmin(userId)) {
    const buttonType = session.editing;
    const oldReply = buttonConfigs[buttonType].reply;
    buttonConfigs[buttonType].reply = text;
    userSessions.delete(userId);
    
    await ctx.reply(
      `✅ <b>Ответ обновлен!</b>\n\n` +
      `🔹 Кнопка: <b>${buttonConfigs[buttonType].text}</b>\n\n` +
      `<b>Было:</b>\n${oldReply}\n\n` +
      `<b>Стало:</b>\n${text}`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  if (session?.broadcasting && isAdmin(userId)) {
    let sent = 0;
    const userList = Array.from(users.keys());
    
    await ctx.reply(`🔄 Начинаю рассылку для ${userList.length} пользователей...`);
    
    for (const userId of userList) {
      try {
        await bot.telegram.sendMessage(userId, 
          `📢 <b>Рассылка от Академии АНБ</b>\n\n${text}\n\n` +
          `<i>С уважением,\nКоманда Академии АНБ</i>`,
          { parse_mode: 'HTML' }
        );
        sent++;
        
        // Небольшая задержка чтобы не превысить лимиты Telegram
        if (sent % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.log(`❌ Не удалось отправить пользователю ${userId}`);
      }
    }
    
    userSessions.delete(userId);
    await ctx.reply(`✅ <b>Рассылка завершена!</b>\n\nОтправлено: <b>${sent}</b> пользователям\nНе удалось: <b>${userList.length - sent}</b>`, { parse_mode: 'HTML' });
    return;
  }

  // Обычные сообщения
  if (!text.startsWith('/')) {
    await ctx.reply('🤗 Используйте кнопки меню для навигации');
  }
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
      console.log(`📱 WebApp URL: ${WEBAPP_URL}`);
      console.log(`📊 API Stats: http://localhost:${PORT}/api/stats`);
    });

    // Запускаем бота
    await bot.launch();
    console.log('✅ Bot started successfully!');
    console.log('🔧 Admin commands: /admin');
    console.log('📊 Available commands: /start, /help, /menu, /status');
    console.log(`⚡ Admin ID: ${ADMIN_IDS[0]}`);
    console.log(`🔧 Для тестирования админ-панели используйте команду: /admin`);

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
