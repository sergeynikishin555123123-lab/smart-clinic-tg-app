import { Telegraf, Markup } from 'telegraf';
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
const userSurveys = new Map();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      id,
      firstName: 'User',
      username: '',
      joinedAt: new Date(),
      lastActivity: new Date(),
      surveyCompleted: false,
      specialization: '',
      city: '',
      email: '',
      subscription: { 
        status: 'inactive', 
        type: 'none',
        endDate: null 
      },
      progress: { 
        level: 'Понимаю', 
        steps: {
          materialsWatched: 0,
          eventsParticipated: 0,
          materialsSaved: 0
        }
      }
    });
  }
  return users.get(id);
}

function completeSurvey(userId) {
  const user = getUser(userId);
  user.surveyCompleted = true;
  user.subscription = {
    status: 'trial',
    type: 'trial_7days',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
}

// ==================== ОПРОС ====================
const surveySteps = [
  {
    question: "🎯 Ваша специализация:",
    options: ["Невролог", "Ортопед", "Реабилитолог", "Физиотерапевт", "Мануальный терапевт", "Спортивный врач", "Другое"],
    field: 'specialization'
  },
  {
    question: "🏙️ Ваш город:",
    options: ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Другой город"],
    field: 'city'
  },
  {
    question: "📧 Ваш e-mail для доступа к материалам:",
    field: 'email',
    isTextInput: true
  }
];

// ==================== ТЕЛЕГРАМ БОТ ====================
const bot = new Telegraf(BOT_TOKEN);

// ==================== ОБРАБОТКА КОМАНД ====================
bot.start(async (ctx) => {
  const user = getUser(ctx.from.id);
  user.firstName = ctx.from.first_name;
  user.username = ctx.from.username;

  console.log(`👋 START: ${user.firstName} (${ctx.from.id})`);

  if (user.surveyCompleted) {
    await showMainMenu(ctx);
    return;
  }

  // Начинаем опрос
  userSurveys.set(ctx.from.id, { step: 0, answers: {} });
  await sendSurveyStep(ctx, ctx.from.id);
});

bot.command('menu', async (ctx) => {
  await showMainMenu(ctx);
});

bot.command('status', async (ctx) => {
  const user = getUser(ctx.from.id);
  const status = user.subscription.status === 'trial' ? 
    `активна (пробный до ${user.subscription.endDate.toLocaleDateString('ru-RU')})` : 'не активна';
  
  await ctx.reply(
    `📊 Статус подписки: ${status}\n🎯 Уровень: ${user.progress.level}\n📧 Email: ${user.email}`
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    'ℹ️ Помощь по боту Академии АНБ\n\n' +
    'Команды:\n/start - начать\n/menu - меню\n/status - статус\n/help - справка\n\n' +
    'По всем вопросам: @academy_anb'
  );
});

// ==================== ОБРАБОТКА СООБЩЕНИЙ ====================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const text = ctx.message.text;
  const user = getUser(userId);

  console.log(`📨 TEXT: ${user.firstName} - "${text}"`);

  // Если пользователь в процессе опроса
  const survey = userSurveys.get(userId);
  if (survey) {
    await handleSurvey(ctx, survey, text);
    return;
  }

  // Обработка основных кнопок меню
  await handleMenuButton(ctx, text);
});

// Обработка опроса
async function handleSurvey(ctx, survey, text) {
  const userId = ctx.from.id;
  const currentStep = surveySteps[survey.step];

  if (currentStep.isTextInput) {
    // Текстовый ввод (email)
    if (currentStep.field === 'email' && !text.includes('@')) {
      await ctx.reply('❌ Введите корректный email:');
      return;
    }
    survey.answers[currentStep.field] = text;
  } else {
    // Кнопочный выбор
    if (text !== '🚫 Пропустить вопрос') {
      survey.answers[currentStep.field] = text;
    }
  }

  survey.step++;

  if (survey.step < surveySteps.length) {
    await sendSurveyStep(ctx, userId);
  } else {
    await finishSurvey(ctx, userId, survey.answers);
  }
}

async function sendSurveyStep(ctx, userId) {
  const survey = userSurveys.get(userId);
  const step = surveySteps[survey.step];

  if (step.isTextInput) {
    await ctx.reply(
      `📝 ${step.question}\nВведите ваш ответ:`,
      Markup.removeKeyboard()
    );
  } else {
    const buttons = step.options.map(opt => [opt]);
    buttons.push(['🚫 Пропустить вопрос']);
    
    await ctx.reply(
      `📝 ${step.question}\nВыберите вариант:`,
      Markup.keyboard(buttons).resize().oneTime()
    );
  }
}

async function finishSurvey(ctx, userId, answers) {
  const user = getUser(userId);
  
  user.specialization = answers.specialization || 'Не указано';
  user.city = answers.city || 'Не указан';
  user.email = answers.email || 'Не указан';
  
  completeSurvey(userId);
  userSurveys.delete(userId);

  await ctx.reply(
    `🎉 Спасибо за опрос, ${user.firstName}!\n\n` +
    `✅ Ваш профиль:\n` +
    `🎯 Специализация: ${user.specialization}\n` +
    `🏙️ Город: ${user.city}\n` +
    `📧 Email: ${user.email}\n\n` +
    `🎁 Пробный доступ на 7 дней активирован!`
  );

  await showMainMenu(ctx);
}

// Обработка кнопок меню
async function handleMenuButton(ctx, text) {
  const user = getUser(ctx.from.id);
  user.lastActivity = new Date();

  console.log(`🔘 BUTTON: ${user.firstName} - "${text}"`);

  switch (text) {
    case '📱 Навигация':
      await ctx.reply('🎯 Открываю навигацию...', {
        reply_markup: {
          inline_keyboard: [[
            { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
          ]]
        }
      });
      break;

    case '🎁 Акции':
      await ctx.reply(
        '🎁 Текущие акции:\n\n' +
        '🔥 Пробный период - 7 дней бесплатно\n' +
        '💎 Приведи друга - скидка 20%\n' +
        '🎯 Пакет "Профи" - 3 месяца по цене 2\n\n' +
        'Подробности в приложении →',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
            ]]
          }
        }
      );
      break;

    case '❓ Задать вопрос':
      await ctx.reply(
        '❓ Задать вопрос по обучению\n\n' +
        'Опишите ваш вопрос:\n' +
        '• Тема вопроса\n' + 
        '• Связанный курс\n' +
        '• Подробное описание\n\n' +
        'Ответим в течение 24 часов.',
        {
          reply_markup: {
            keyboard: [['🔙 Назад в меню']],
            resize_keyboard: true
          }
        }
      );
      break;

    case '💬 Поддержка':
      await ctx.reply(
        '💬 Поддержка Академии АНБ\n\n' +
        '📞 Координатор: @academy_anb\n' +
        '⏰ ПН-ПТ 11:00-19:00\n' +
        '📧 academy@anb.ru\n\n' +
        'Помощь с:\n' +
        '• Техническими вопросами\n' +
        '• Подписками\n' +
        '• Доступом к материалам'
      );
      break;

    case '👤 Мой профиль':
      const subStatus = user.subscription.status === 'trial' ? 
        `🆓 Пробный (до ${user.subscription.endDate.toLocaleDateString('ru-RU')})` : '❌ Не активна';
      
      await ctx.reply(
        `👤 Ваш профиль\n\n` +
        `👨‍⚕️ Имя: ${user.firstName}\n` +
        `🎯 Специализация: ${user.specialization}\n` +
        `🏙️ Город: ${user.city}\n` +
        `📧 Email: ${user.email}\n` +
        `💳 Подписка: ${subStatus}\n` +
        `🎯 Уровень: ${user.progress.level}\n\n` +
        `📊 Активность:\n` +
        `• Просмотрено: ${user.progress.steps.materialsWatched}\n` +
        `• Мероприятий: ${user.progress.steps.eventsParticipated}\n` +
        `• Сохранено: ${user.progress.steps.materialsSaved}`
      );
      break;

    case '🔄 Продлить подписку':
      await ctx.reply(
        '💳 Продление подписки\n\n' +
        'Тарифы:\n\n' +
        '🟢 1 месяц - 2 900 руб.\n' +
        '🔵 3 месяца - 7 500 руб.\n' +
        '🟣 12 месяцев - 24 000 руб.\n\n' +
        'Оформление в приложении:',
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
            ]]
          }
        }
      );
      break;

    case '🔙 Назад в меню':
      await showMainMenu(ctx);
      break;

    default:
      await ctx.reply('🤔 Используйте кнопки меню для навигации');
      await showMainMenu(ctx);
      break;
  }
}

// Главное меню
async function showMainMenu(ctx) {
  const user = getUser(ctx.from.id);
  
  let message = `👋 Добро пожаловать, ${user.firstName}!\n\n`;
  
  if (user.subscription.status === 'trial') {
    message += `🕒 Пробный доступ до: ${user.subscription.endDate.toLocaleDateString('ru-RU')}\n\n`;
  }
  
  message += `Используйте кнопки для навигации:`;

  await ctx.reply(message, {
    reply_markup: {
      keyboard: [
        ['📱 Навигация', '🎁 Акции'],
        ['❓ Задать вопрос', '💬 Поддержка'],
        ['👤 Мой профиль', '🔄 Продлить подписку']
      ],
      resize_keyboard: true
    }
  });
}

// ==================== WEB APP SERVER ====================
const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'webapp')));

// API для WebApp
app.get('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.get(userId);
  
  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        specialization: user.specialization,
        city: user.city,
        email: user.email,
        subscription: user.subscription,
        progress: user.progress
      }
    });
  } else {
    res.json({ success: false, error: 'User not found' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК ====================
async function startApp() {
  try {
    app.listen(PORT, () => {
      console.log(`🌐 WebApp: http://localhost:${PORT}`);
    });

    await bot.launch();
    console.log('✅ Bot started!');
    console.log('📱 Commands: /start, /menu, /status, /help');

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startApp();
