import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';

// Простая проверка переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is required');
  process.exit(1);
}

console.log('🚀 Starting bot with configuration:');
console.log('   Database:', DATABASE_URL ? 'Configured' : 'Missing');
console.log('   Bot Token:', BOT_TOKEN ? 'Configured' : 'Missing');

const prisma = new PrismaClient();
const bot = new Telegraf(BOT_TOKEN);

// Простой обработчик старта
bot.start(async (ctx) => {
  console.log('👤 User started bot:', ctx.from.id);
  
  try {
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
    }

    await ctx.reply(
      `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n` +
      `Я ваш помощник в мире профессионального развития.`,
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

  } catch (error) {
    console.error('❌ Error in start command:', error);
    await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
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
  await ctx.reply('Раздел акций в разработке 🎁');
});

bot.hears('❓ Задать вопрос', async (ctx) => {
  await ctx.reply('Напишите @academy_anb для помощи');
});

bot.hears('💬 Поддержка', async (ctx) => {
  await ctx.reply('Координатор: @academy_anb\nЧасы работы: ПН-ПТ 11:00-19:00');
});

// Обработчик любых текстовых сообщений
bot.on('text', async (ctx) => {
  await ctx.reply('Используйте кнопки меню для навигации 🤗');
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error(`❌ Error for ${ctx.updateType}:`, err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Запуск бота
async function startBot() {
  try {
    console.log('🔧 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');

    console.log('🤖 Starting bot...');
    await bot.launch();
    console.log('✅ Bot started successfully!');

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();
