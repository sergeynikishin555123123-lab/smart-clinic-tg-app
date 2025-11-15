import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required');
  process.exit(1);
}

console.log('🚀 Starting bot...');

const bot = new Telegraf(BOT_TOKEN);

// Простое хранилище для админ-конфигурации
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

// ЗАМЕНИТЕ НА ВАШ ТЕЛЕГРАМ ID!
const ADMIN_IDS = [898508164]; 

function isAdmin(userId: number): boolean {
  return ADMIN_IDS.includes(userId);
}

// ==================== ОСНОВНЫЕ КОМАНДЫ ====================

bot.start(async (ctx) => {
  console.log('👤 User started:', ctx.from.id);
  
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
  await ctx.reply(buttonConfigs.navigation.reply, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '📱 Открыть приложение',
          web_app: { url: 'https://your-webapp-url.com' }
        }
      ]]
    }
  });
});

bot.hears('🎁 Акции', async (ctx) => {
  await ctx.reply(buttonConfigs.promotions.reply);
});

bot.hears('❓ Задать вопрос', async (ctx) => {
  await ctx.reply(buttonConfigs.question.reply);
});

bot.hears('💬 Поддержка', async (ctx) => {
  await ctx.reply(buttonConfigs.support.reply);
});

// ==================== АДМИН-ПАНЕЛЬ ====================

bot.command('admin', async (ctx) => {
  const userId = ctx.from?.id;
  
  if (!userId || !isAdmin(userId)) {
    await ctx.reply('❌ У вас нет прав доступа к админ-панели');
    return;
  }

  await ctx.reply('🔧 Панель администратора', {
    reply_markup: {
      keyboard: [
        ['📊 Статистика', '✏️ Редактировать кнопки'],
        ['🔙 В главное меню']
      ],
      resize_keyboard: true
    }
  });
});

bot.hears('✏️ Редактировать кнопки', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) return;

  await ctx.reply('📋 Выберите кнопку для редактирования:', {
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
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) {
    await ctx.answerCbQuery('❌ Нет прав доступа');
    return;
  }

  const buttonType = ctx.match[1] as keyof typeof buttonConfigs;
  const config = buttonConfigs[buttonType];

  await ctx.editMessageText(
    `✏️ Редактирование кнопки: ${config.text}\n\n` +
    `Текущий ответ: ${config.reply}\n\n` +
    `Отправьте новый текст ответа:`
  );

  // Ждем следующее сообщение с новым текстом
  const waitForResponse = (newCtx: any) => {
    if (newCtx.from?.id === userId && newCtx.message?.text) {
      buttonConfigs[buttonType].reply = newCtx.message.text;
      newCtx.reply(`✅ Ответ для "${config.text}" обновлен!`);
      bot.off('message', waitForResponse);
    }
  };

  bot.on('message', waitForResponse);
  await ctx.answerCbQuery();
});

bot.hears('📊 Статистика', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !isAdmin(userId)) return;

  await ctx.reply(
    '📊 Статистика бота:\n\n' +
    '👥 Всего пользователей: 150\n' +
    '✅ Активных сегодня: 25\n' +
    '📱 Открытий приложения: 45\n' +
    '💬 Сообщений поддержки: 12'
  );
});

bot.hears('🔙 В главное меню', async (ctx) => {
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

// ==================== ОБРАБОТКА ОШИБОК ====================

bot.catch((err, ctx) => {
  console.error(`❌ Error:`, err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// ==================== ЗАПУСК ====================

bot.launch()
  .then(() => {
    console.log('✅ Bot started successfully!');
    console.log('🔧 Admin panel: /admin');
    console.log('⚠️  Don\'t forget to set your Telegram ID in ADMIN_IDS');
  })
  .catch((error) => {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  });
