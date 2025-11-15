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

// ==================== БАЗА ДАННЫХ В ПАМЯТИ ====================
const users = new Map();
const userSurveys = new Map();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

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
          materialsSaved: 0,
          coursesBought: 0
        }
      },
      stats: { commands: 0, buttons: 0 }
    });
  }
  return users.get(id);
}

function completeSurvey(userId) {
  const user = getUser(userId);
  user.surveyCompleted = true;
  user.lastActivity = new Date();
  
  user.subscription = {
    status: 'trial',
    type: 'trial_7days',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
}

// ==================== ОПРОС НОВЫХ ПОЛЬЗОВАТЕЛЕЙ ====================
const surveySteps = [
  {
    question: "🎯 Ваша специализация:",
    options: [
      "Невролог", "Ортопед", "Реабилитолог", "Физиотерапевт",
      "Мануальный терапевт", "Спортивный врач", "Другое"
    ],
    field: 'specialization'
  },
  {
    question: "🏙️ Ваш город:",
    options: [
      "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург",
      "Казань", "Нижний Новгород", "Другой город"
    ],
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

// ==================== ГЛАВНЫЙ ОБРАБОТЧИК СООБЩЕНИЙ ====================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const messageText = ctx.message.text;
  const user = getUser(userId);
  
  console.log(`📨 Сообщение от ${user.firstName}: "${messageText}"`);

  // Обработка команд
  if (messageText.startsWith('/')) {
    return; // Команды обрабатываются отдельно
  }

  // Проверяем, находится ли пользователь в процессе опроса
  const survey = userSurveys.get(userId);
  if (survey) {
    await handleSurveyResponse(ctx, survey, messageText);
    return;
  }

  // Обработка основных кнопок меню
  await handleMainMenuButtons(ctx, messageText);
});

// Обработка ответов на опрос
async function handleSurveyResponse(ctx, survey, messageText) {
  const userId = ctx.from.id;
  const currentStep = surveySteps[survey.step];
  
  console.log(`📝 Обработка опроса, шаг ${survey.step}: "${messageText}"`);

  if (currentStep.isTextInput) {
    // Текстовый ввод (email)
    if (currentStep.field === 'email' && !messageText.includes('@')) {
      await ctx.reply('❌ Пожалуйста, введите корректный email адрес:');
      return;
    }
    
    survey.answers[currentStep.field] = messageText;
    survey.step++;
  } else {
    // Кнопочный выбор
    if (messageText !== '🚫 Пропустить вопрос') {
      survey.answers[currentStep.field] = messageText;
    }
    survey.step++;
  }

  if (survey.step < surveySteps.length) {
    await sendSurveyStep(ctx, userId);
  } else {
    await completeSurveyAndShowMenu(ctx, userId, survey.answers);
  }
}

// Обработка основных кнопок меню
async function handleMainMenuButtons(ctx, messageText) {
  const user = getUser(ctx.from.id);
  user.lastActivity = new Date();
  user.stats.buttons++;

  switch (messageText) {
    case '📱 Навигация':
      console.log(`📱 ${user.firstName} открыл навигацию`);
      await ctx.reply('🎯 Открываю навигацию по Академии...', {
        reply_markup: {
          inline_keyboard: [[
            { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
          ]]
        }
      });
      break;

    case '🎁 Акции':
      console.log(`🎁 ${user.firstName} открыл акции`);
      await ctx.reply(
        '🎁 <b>Текущие акции и предложения</b>\n\n' +
        '🔥 <b>Пробный период</b> - 7 дней бесплатного доступа\n' +
        '💎 <b>Приведи друга</b> - получи скидку 20% на подписку\n' +
        '🎯 <b>Пакет "Профи"</b> - 3 месяца по цене 2\n\n' +
        'Подробности в приложении →',
        { 
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
            ]]
          }
        }
      );
      break;

    case '❓ Задать вопрос':
      console.log(`❓ ${user.firstName} открыл форму вопроса`);
      await ctx.reply(
        '❓ <b>Задать вопрос по обучению</b>\n\n' +
        'Пожалуйста, опишите ваш вопрос:\n' +
        '• Тема вопроса\n' + 
        '• Связанный курс (если есть)\n' +
        '• Подробное описание\n\n' +
        'Отправьте сообщение с вашим вопросом, и мы ответим в течение 24 часов.',
        { 
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [[ '🔙 Назад в меню' ]],
            resize_keyboard: true
          }
        }
      );
      break;

    case '💬 Поддержка':
      console.log(`💬 ${user.firstName} открыл поддержку`);
      await ctx.reply(
        '💬 <b>Поддержка Академии АНБ</b>\n\n' +
        '📞 Координатор проекта: @academy_anb\n' +
        '⏰ Часы работы: ПН-ПТ с 11:00 до 19:00\n' +
        '📧 Email: academy@anb.ru\n\n' +
        'Мы поможем с:\n' +
        '• Техническими вопросами\n' +
        '• Оплатой и подписками\n' +
        '• Доступом к материалам\n' +
        '• Любыми другими вопросами',
        { parse_mode: 'HTML' }
      );
      break;

    case '👤 Мой профиль':
      console.log(`👤 ${user.firstName} открыл профиль`);
      const subscriptionStatus = user.subscription.status === 'trial' ? 
        `🆓 Пробный (до ${user.subscription.endDate.toLocaleDateString('ru-RU')})` : 
        '❌ Не активна';
      
      await ctx.reply(
        `👤 <b>Ваш профиль</b>\n\n` +
        `👨‍⚕️ Имя: ${user.firstName}\n` +
        `🎯 Специализация: ${user.specialization}\n` +
        `🏙️ Город: ${user.city}\n` +
        `📧 Email: ${user.email}\n` +
        `💳 Подписка: ${subscriptionStatus}\n` +
        `🎯 Уровень: ${user.progress.level}\n\n` +
        `📊 Активность:\n` +
        `• Материалов просмотрено: ${user.progress.steps.materialsWatched}\n` +
        `• Мероприятий посещено: ${user.progress.steps.eventsParticipated}\n` +
        `• Материалов сохранено: ${user.progress.steps.materialsSaved}`,
        { parse_mode: 'HTML' }
      );
      break;

    case '🔄 Продлить подписку':
      console.log(`💳 ${user.firstName} открыл продление подписки`);
      await ctx.reply(
        '💳 <b>Продление подписки</b>\n\n' +
        'Доступные тарифы:\n\n' +
        '🟢 <b>1 месяц</b> - 2 900 руб.\n' +
        '🔵 <b>3 месяца</b> - 7 500 руб. (экономьте 600 руб.)\n' +
        '🟣 <b>12 месяцев</b> - 24 000 руб. (экономьте 10 800 руб.)\n\n' +
        'Для оформления подписки откройте приложение:',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
            ]]
          }
        }
      );
      break;

    case '🔙 Назад в меню':
      console.log(`🔙 ${user.firstName} вернулся в меню`);
      await showMainMenu(ctx);
      break;

    default:
      console.log(`❓ Неизвестное сообщение: "${messageText}"`);
      await ctx.reply('🤔 Используйте кнопки меню для навигации');
      await showMainMenu(ctx);
      break;
  }
}

// ==================== ОПРОС ====================
async function sendSurveyStep(ctx, userId) {
  const survey = userSurveys.get(userId);
  if (!survey || survey.step >= surveySteps.length) return;

  const currentStep = surveySteps[survey.step];
  
  if (currentStep.isTextInput) {
    await ctx.reply(
      `📝 ${currentStep.question}\n\n` +
      `Пожалуйста, введите ваш ответ текстом:`,
      Markup.removeKeyboard()
    );
  } else {
    const buttons = currentStep.options.map(option => [option]);
    buttons.push(['🚫 Пропустить вопрос']);
    
    await ctx.reply(
      `📝 ${currentStep.question}\n\n` +
      `Выберите вариант ответа:`,
      Markup.keyboard(buttons)
        .resize()
        .oneTime()
    );
  }
}

async function completeSurveyAndShowMenu(ctx, userId, answers) {
  const user = getUser(userId);
  
  user.specialization = answers.specialization || 'Не указано';
  user.city = answers.city || 'Не указан';
  user.email = answers.email || 'Не указан';
  
  completeSurvey(userId);
  userSurveys.delete(userId);

  await ctx.reply(
    `🎉 Спасибо за прохождение опроса, ${user.firstName}!\n\n` +
    `✅ Ваш профиль создан:\n` +
    `🎯 Специализация: ${user.specialization}\n` +
    `🏙️ Город: ${user.city}\n` +
    `📧 Email: ${user.email}\n\n` +
    `🎁 Вам предоставлен пробный доступ на 7 дней!`,
    Markup.removeKeyboard()
  );

  await showMainMenu(ctx);
}

// ==================== КОМАНДЫ ====================
bot.start(async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.commands++;
  user.firstName = ctx.from.first_name;
  user.username = ctx.from.username;

  console.log(`👋 Новый пользователь: ${ctx.from.first_name} (ID: ${ctx.from.id})`);

  if (user.surveyCompleted) {
    await showMainMenu(ctx);
    return;
  }

  userSurveys.set(ctx.from.id, {
    step: 0,
    answers: {}
  });

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
    `📊 <b>Статус подписки</b>\n\n` +
    `✅ Подписка: ${status}\n` +
    `🎯 Уровень: ${user.progress.level}\n` +
    `📧 Email: ${user.email}`,
    { parse_mode: 'HTML' }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    'ℹ️ <b>Помощь по боту Академии АНБ</b>\n\n' +
    'Основные команды:\n' +
    '/start - начать работу с ботом\n' +
    '/menu - главное меню\n' +
    '/status - статус подписки\n' +
    '/help - эта справка\n\n' +
    'Основные разделы:\n' +
    '📱 Навигация - доступ к приложению\n' +
    '🎁 Акции - текущие предложения\n' +
    '❓ Задать вопрос - помощь по обучению\n' +
    '💬 Поддержка - связь с координатором\n' +
    '👤 Мой профиль - информация о вас\n\n' +
    'По всем вопросам: @academy_anb',
    { parse_mode: 'HTML' }
  );
});

// ==================== ГЛАВНОЕ МЕНЮ ====================
async function showMainMenu(ctx) {
  const user = getUser(ctx.from.id);
  
  let menuMessage = `👋 Добро пожаловать в Академию АНБ, ${user.firstName}!\n\n`;
  
  if (isAdmin(ctx.from.id)) {
    menuMessage += `⚡ <b>Вы администратор системы</b>\n\n`;
  }
  
  if (user.subscription.status === 'trial' && user.subscription.endDate) {
    const endDate = user.subscription.endDate.toLocaleDateString('ru-RU');
    menuMessage += `🕒 Пробный доступ до: ${endDate}\n\n`;
  }
  
  menuMessage += `Используйте кнопки для навигации:`;

  await ctx.reply(menuMessage, {
    parse_mode: 'HTML',
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

// API для получения данных пользователя
app.get('/api/user/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.get(userId);
  
  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        specialization: user.specialization,
        city: user.city,
        email: user.email,
        subscription: user.subscription,
        progress: user.progress,
        surveyCompleted: user.surveyCompleted,
        joinedAt: user.joinedAt
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
      console.log(`🌐 WebApp server running on port ${PORT}`);
      console.log(`📱 WebApp URL: ${WEBAPP_URL}`);
    });

    await bot.launch();
    console.log('✅ Bot started successfully!');
    console.log('🔧 Команды: /start, /menu, /status, /help');
    console.log('📊 Готов к приему пользователей!');

  } catch (error) {
    console.error('❌ Failed to start app:', error);
    process.exit(1);
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startApp();
