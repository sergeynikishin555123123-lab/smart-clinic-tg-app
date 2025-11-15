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

// Пытаемся подключиться к БД, но не блокируем запуск бота
let prisma: PrismaClient | null = null;

async function initializeDatabase() {
  if (!DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not set, running without database');
    return null;
  }

  try {
    console.log('🔧 Initializing database connection...');
    
    // Логируем DATABASE_URL (без пароля для безопасности)
    const safeUrl = DATABASE_URL.replace(/:[^:]*@/, ':****@');
    console.log('   Database URL:', safeUrl);
    
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

// Простой обработчик старта (работает даже без БД)
bot.start(async (ctx) => {
  console.log('👤 User started bot:', ctx.from.id);
  
  try {
    let welcomeMessage = `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n`;

    if (prisma) {
      const telegramId = BigInt(ctx.from.id);
      
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
  await ctx.reply('Открываю навигацию...', {
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

// Обработчик других кнопок
bot.hears('🎁 Акции', async (ctx) => {
  await ctx.reply('🎁 Раздел акций находится в разработке. Скоро здесь появятся специальные предложения!');
});

bot.hears('❓ Задать вопрос', async (ctx) => {
  await ctx.reply('❓ Чтобы задать вопрос по обучению, напишите @academy_anb');
});

bot.hears('💬 Поддержка', async (ctx) => {
  await ctx.reply('💬 Координатор академии: @academy_anb\n⏰ Часы работы: ПН-ПТ с 11:00 до 19:00');
});

// Обработчик любых текстовых сообщений
bot.on('text', async (ctx) => {
  if (!ctx.message.text.startsWith('/')) {
    await ctx.reply('🤗 Используйте кнопки меню для навигации');
  }
});

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
    console.log('   WebHook:', '✅ Active');
    console.log('   Ready to receive messages!');

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();
