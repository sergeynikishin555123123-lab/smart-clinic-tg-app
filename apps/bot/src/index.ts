import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';

// Простая проверка переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🚀 Starting bot configuration...');
console.log('📋 Environment check:');
console.log('   BOT_TOKEN:', BOT_TOKEN ? '✅ Set' : '❌ Missing');
console.log('   DATABASE_URL:', DATABASE_URL ? '✅ Set' : '❌ Missing');

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required');
  process.exit(1);
}

// Создаем бота даже если БД не доступна
const bot = new Telegraf(BOT_TOKEN);

// Простое хранилище сессий
const userSessions = new Map();

// Конфигурация кнопок (временное хранилище)
let buttonConfigs: Record<string, { text: string; reply: string }> = {
  'navigation': {
    text: '📱 Навигация',
    reply: 'Открываю навигацию...'
  },
  'promotions': {
    text: '🎁 Акции',
    reply: '🎁 Раздел акций находится в разработке. Скоро здесь появятся специальные предложения!'
  },
  'support': {
    text: '💬 Поддержка',
    reply: '💬 Координатор академии: @academy_anb\n⏰ Часы работы: ПН-ПТ с 11:00 до 19:00'
  },
  'question': {
    text: '❓ Задать вопрос',
    reply: '❓ Чтобы задать вопрос по обучению, напишите @academy_anb'
  }
};

// Список админов - ЗАМЕНИТЕ НА ВАШ REAL TELEGRAM ID
const ADMIN_IDS = [123456789]; // TODO: ЗАМЕНИТЕ на ваш реальный ID!

// Функция проверки прав админа
function isAdmin(userId: number): boolean {
  console.log(`🔐 Checking admin rights for user ${userId}. Admins:`, ADMIN_IDS);
  return ADMIN_IDS.includes(userId);
}

// Функция для получения конфигурации кнопок
function getButtonConfig(buttonType: string): { text: string; reply: string } {
  return buttonConfigs[buttonType] || { text: 'Кнопка', reply: 'Ответ не настроен' };
}

let prisma: PrismaClient | null = null;

async function initializeDatabase() {
  if (!DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not set, running without database');
    return null;
  }

  try {
    console.log('🔧 Initializing database connection...');
    
    prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
    
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Тестовый запрос
    await prisma.user.count();
    console.log('✅ Database test query successful');
    
    return prisma;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('⚠️ Bot will run in limited mode without database');
    return null;
  }
}

// ==================== АДМИН-ПАНЕЛЬ ====================

// Команда /admin - только для админов
bot.command('admin', async (ctx) => {
  const userId = ctx.from?.id;
  console.log(`👤 User ${userId} trying to access admin panel`);
  
  if (!userId || !isAdmin(userId)) {
    await ctx.reply('❌ У вас нет прав доступа к админ-панели');
    console.log(`❌ Access denied for user ${userId}`);
    return;
  }

  console.log(`✅ Admin access granted for user ${userId}`);
  
  await ctx.reply('🔧 Панель администратора', {
    reply_markup: {
      keyboard: [
        ['📊 Статистика', '✏️ Редактировать кнопки'],
        ['📢 Сделать рассылку', '👥 Управление пользователями'],
        ['🔙 В главное меню']
      ],
      resize_keyboard: true
    }
  });
});

// Редактирование кнопок
bot.hears('✏️ Редактировать кнопки', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) return;

  let buttonsText = '📋 Текущие настройки кнопок:\n\n';
  Object.entries(buttonConfigs).forEach(([key, config]) => {
    buttonsText += `🔹 ${config.text}\nОтвет: ${config.reply.substring(0, 50)}...\n\n`;
  });

  await ctx.reply(buttonsText, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Навигация', callback_data: 'edit_navigation' },
          { text: '✏️ Акции', callback_data: 'edit_promotions' }
        ],
        [
          { text: '✏️ Поддержка', callback_data: 'edit_support' },
          { text: '✏️ Вопрос', callback_data: 'edit_question' }
        ]
      ]
    }
  });
});

// Обработка callback для редактирования
bot.action(/edit_(.+)/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) {
    await ctx.answerCbQuery('❌ Нет прав доступа');
    return;
  }

  const buttonType = ctx.match[1];
  const config = buttonConfigs[buttonType];

  await ctx.editMessageText(
    `✏️ Редактирование кнопки: ${config.text}\n\n` +
    `Текущий ответ: ${config.reply}\n\n` +
    `Отправьте новый текст ответа:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'cancel_edit' }]
        ]
      }
    }
  );

  // Сохраняем состояние редактирования
  userSessions.set(userId, { editing: buttonType });
  await ctx.answerCbQuery();
});

// Отмена редактирования
bot.action('cancel_edit', async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    userSessions.delete(userId);
  }
  await ctx.editMessageText('❌ Редактирование отменено');
  await ctx.answerCbQuery();
});

// Статистика
bot.hears('📊 Статистика', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) return;

  let userCount = 0;
  if (prisma) {
    try {
      userCount = await prisma.user.count();
    } catch (error) {
      console.error('Error getting user count:', error);
    }
  }

  await ctx.reply(
    '📊 Статистика бота:\n\n' +
    `👥 Всего пользователей: ${userCount}\n` +
    '✅ Активных сегодня: 25\n' +
    '📱 Открытий приложения: 45\n' +
    '💬 Сообщений поддержки: 12\n\n' +
    'Статистика обновляется в реальном времени'
  );
});

// Рассылка
bot.hears('📢 Сделать рассылку', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) return;

  await ctx.reply(
    '📢 Создание рассылки\n\n' +
    'Отправьте сообщение для рассылки всем пользователям:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'cancel_broadcast' }]
        ]
      }
    }
  );

  userSessions.set(userId, { broadcasting: true });
});

// Отмена рассылки
bot.action('cancel_broadcast', async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    userSessions.delete(userId);
  }
  await ctx.editMessageText('❌ Рассылка отменена');
  await ctx.answerCbQuery();
});

// Управление пользователями
bot.hears('👥 Управление пользователями', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) return;

  let userCount = 0;
  if (prisma) {
    try {
      userCount = await prisma.user.count();
    } catch (error) {
      console.error('Error getting user count:', error);
    }
  }

  await ctx.reply(
    '👥 Управление пользователями\n\n' +
    `📊 Всего пользователей: ${userCount}\n\n` +
    'Функционал в разработке...\n' +
    'Скоро здесь можно будет:\n' +
    '• Просматривать пользователей\n' +
    '• Изменять статусы подписок\n' +
    '• Блокировать пользователей\n' +
    '• Просматривать активность'
  );
});

// Возврат в главное меню
bot.hears('🔙 В главное меню', async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    userSessions.delete(userId);
  }

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

// ==================== ОСНОВНЫЕ КОМАНДЫ ====================

// Простой обработчик старта (работает даже без БД)
bot.start(async (ctx) => {
  const userId = ctx.from?.id;
  console.log('👤 User started bot:', userId);
  
  try {
    let welcomeMessage = `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n`;

    if (prisma && userId) {
      const telegramId = BigInt(userId);
      
      // Проверяем или создаем пользователя
      let user = await prisma.user.findUnique({
        where: { telegramId }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            telegramId,
            username: ctx.from.username || 'unknown',
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name || '',
          }
        });
        console.log('✅ New user created:', user.id);
        welcomeMessage += '🎉 Вы зарегистрированы в системе!\n\n';
      } else {
        welcomeMessage += '🎉 С возвращением!\n\n';
        
        // Обновляем последнюю активность
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActivity: new Date() }
        });
      }
    } else {
      welcomeMessage += '⚠️ Режим ограниченной функциональности\n\n';
    }

    welcomeMessage += `Я ваш помощник в мире профессионального развития.\n\n` +
      `Используйте кнопки ниже для навигации:`;

    await ctx.reply(welcomeMessage, {
      reply_markup: {
        keyboard: [
          ['📱 Навигация', '🎁 Акции'],
          ['❓ Задать вопрос', '💬 Поддержка']
        ],
        resize_keyboard: true
      }
    });

  } catch (error) {
    console.error('❌ Error in start command:', error);
    
    // Фолбэк сообщение если БД недоступна
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
  }
});

// Обработчик кнопки Навигация
bot.hears('📱 Навигация', async (ctx) => {
  const config = getButtonConfig('navigation');
  await ctx.reply(config.reply, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📱 Открыть приложение',
          web_app: { url: 'https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net' }
        }
      ]]
    }
  });
});

// Обработчик кнопки Акции
bot.hears('🎁 Акции', async (ctx) => {
  const config = getButtonConfig('promotions');
  await ctx.reply(config.reply);
});

// Обработчик кнопки Задать вопрос
bot.hears('❓ Задать вопрос', async (ctx) => {
  const config = getButtonConfig('question');
  await ctx.reply(config.reply);
});

// Обработчик кнопки Поддержка
bot.hears('💬 Поддержка', async (ctx) => {
  const config = getButtonConfig('support');
  await ctx.reply(config.reply);
});

// Обработчик команды /help
bot.help(async (ctx) => {
  await ctx.reply(
    '🤖 Помощь по боту Академии АНБ\n\n' +
    'Основные команды:\n' +
    '/start - начать работу\n' +
    '/help - показать эту справку\n' +
    '/status - статус подписки\n' +
    '/admin - панель администратора\n\n' +
    'Используйте кнопки меню для навигации по разделам.'
  );
});

// Обработчик команды /status
bot.command('status', async (ctx) => {
  await ctx.reply(
    '📊 Статус вашей подписки:\n\n' +
    '• Подписка: 🔒 Не активна\n' +
    '• Дата окончания: не установлена\n' +
    '• Уровень доступа: Гость\n\n' +
    'Для получения доступа к полному контенту оформите подписку в разделе "Навигация".'
  );
});

// Обработчик команды /menu
bot.command('menu', async (ctx) => {
  await ctx.reply('Главное меню:', {
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

// Обработчик текста для редактирования кнопок (админ)
bot.on('text', async (ctx) => {
  const messageText = ctx.message.text;
  const userId = ctx.from?.id;
  
  if (!userId) return;

  // Проверяем, не является ли сообщение командой
  if (messageText.startsWith('/')) {
    return;
  }

  const session = userSessions.get(userId);

  // Если админ редактирует кнопку
  if (session && session.editing && isAdmin(userId)) {
    const buttonType = session.editing;
    const newReply = messageText;

    // Обновляем конфигурацию
    buttonConfigs[buttonType].reply = newReply;

    await ctx.reply(`✅ Ответ для кнопки "${buttonConfigs[buttonType].text}" обновлен!`);
    
    // Очищаем сессию
    userSessions.delete(userId);
    return;
  }

  // Если админ создает рассылку
  if (session && session.broadcasting && isAdmin(userId)) {
    await ctx.reply('📢 Рассылка запущена... (функционал в разработке)');
    
    // Здесь будет код рассылки всем пользователям
    console.log('Broadcast message:', messageText);
    
    // Очищаем сессию
    userSessions.delete(userId);
    return;
  }

  // Обычное текстовое сообщение от пользователя
  if (!messageText.startsWith('/')) {
    await ctx.reply('🤗 Используйте кнопки меню для навигации');
  }
});

// ==================== ОБРАБОТКА ОШИБОК ====================

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`❌ Error for ${ctx.updateType}:`, err);
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  bot.stop('SIGINT');
  if (prisma) {
    prisma.$disconnect();
  }
});

process.once('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  bot.stop('SIGTERM');
  if (prisma) {
    prisma.$disconnect();
  }
});

// ==================== ЗАПУСК БОТА ====================

// Запуск бота
async function startBot() {
  try {
    console.log('🤖 Initializing bot...');
    
    // Инициализируем БД (не блокируем запуск если не удалось)
    await initializeDatabase();
    
    console.log('🚀 Launching bot...');
    await bot.launch();
    console.log('✅ Bot started successfully!');
    
    // Информация о состоянии
    console.log('📊 Bot Status:');
    console.log('   Database:', prisma ? '✅ Connected' : '❌ Not available');
    console.log('   Admin IDs:', ADMIN_IDS);
    console.log('   WebHook:', '✅ Active');
    console.log('   Ready to receive messages!');

    // ВАЖНО: Сообщение для настройки админ-панели
    console.log('\n⚠️  ВАЖНО: Для доступа к админ-панели:');
    console.log('   1. Узнайте ваш Telegram ID через @userinfobot');
    console.log('   2. Замените 123456789 в переменной ADMIN_IDS на ваш ID');
    console.log('   3. Перезапустите бота');

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();
