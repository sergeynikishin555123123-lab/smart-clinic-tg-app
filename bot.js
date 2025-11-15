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
const contentDB = {
  courses: [],
  podcasts: [],
  streams: [],
  videos: [],
  materials: [],
  events: []
};

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
  
  // Даем пробный доступ после опроса
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

// ==================== ОБРАБОТЧИК /start С ОПРОСОМ ====================
bot.start(async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.commands++;
  user.firstName = ctx.from.first_name;
  user.username = ctx.from.username;

  console.log(`👋 Новый пользователь: ${ctx.from.first_name} (ID: ${ctx.from.id})`);

  // Если опрос уже пройден - показываем главное меню
  if (user.surveyCompleted) {
    await showMainMenu(ctx);
    return;
  }

  // Начинаем опрос для новых пользователей
  userSurveys.set(ctx.from.id, {
    step: 0,
    answers: {}
  });

  await sendSurveyStep(ctx, ctx.from.id);
});

// Функция отправки шага опроса
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

// Обработка ответов на опрос (только для пользователей в процессе опроса)
const surveyOptions = [
  "Невролог", "Ортопед", "Реабилитолог", "Физиотерапевт", 
  "Мануальный терапевт", "Спортивный врач", "Другое",
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург",
  "Казань", "Нижний Новгород", "Другой город",
  "🚫 Пропустить вопрос"
];

// Специальный обработчик для опроса
surveyOptions.forEach(option => {
  bot.hears(option, async (ctx) => {
    const userId = ctx.from.id;
    const survey = userSurveys.get(userId);
    
    // Проверяем, что пользователь действительно в процессе опроса
    if (!survey || survey.step >= surveySteps.length) {
      // Если не в опросе, игнорируем и показываем главное меню
      await showMainMenu(ctx);
      return;
    }

    const currentStep = surveySteps[survey.step];
    
    console.log(`📝 Ответ на опрос: ${ctx.message.text} для шага ${survey.step}`);

    // Сохраняем ответ (кроме "пропустить")
    if (ctx.message.text !== '🚫 Пропустить вопрос') {
      survey.answers[currentStep.field] = ctx.message.text;
    }

    // Переходим к следующему шагу
    survey.step++;
    
    if (survey.step < surveySteps.length) {
      await sendSurveyStep(ctx, userId);
    } else {
      // Опрос завершен
      await completeSurveyAndShowMenu(ctx, userId, survey.answers);
    }
  });
});

// Обработка текстовых ответов (email) - только для пользователей в опросе
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const survey = userSurveys.get(userId);
  const messageText = ctx.message.text;
  
  // Пропускаем команды
  if (messageText.startsWith('/')) return;
  
  // Пропускаем если это опросные кнопки (они обрабатываются выше)
  if (surveyOptions.includes(messageText)) return;
  
  // Пропускаем если это основные кнопки меню
  const mainMenuButtons = ['📱 Навигация', '🎁 Акции', '❓ Задать вопрос', '💬 Поддержка', '👤 Мой профиль', '🔄 Продлить подписку', '🔙 Назад в меню'];
  if (mainMenuButtons.includes(messageText)) return;

  // Проверяем, что пользователь в процессе опроса и это шаг с текстовым вводом
  if (!survey || survey.step >= surveySteps.length) {
    // Если не в опросе и не известная команда - показываем меню
    await ctx.reply('🤔 Используйте кнопки меню для навигации');
    await showMainMenu(ctx);
    return;
  }

  const currentStep = surveySteps[survey.step];
  
  // Проверяем, что это шаг с текстовым вводом (email)
  if (currentStep.isTextInput) {
    const answer = ctx.message.text;
    
    // Простая валидация email
    if (currentStep.field === 'email' && !answer.includes('@')) {
      await ctx.reply('❌ Пожалуйста, введите корректный email адрес:');
      return;
    }
    
    survey.answers[currentStep.field] = answer;
    survey.step++;
    
    if (survey.step < surveySteps.length) {
      await sendSurveyStep(ctx, userId);
    } else {
      await completeSurveyAndShowMenu(ctx, userId, survey.answers);
    }
  }
});

// Завершение опроса и показ главного меню
async function completeSurveyAndShowMenu(ctx, userId, answers) {
  const user = getUser(userId);
  
  // Сохраняем ответы в профиль пользователя
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

// ==================== ОСНОВНЫЕ ОБРАБОТЧИКИ КНОПОК ====================
bot.hears('📱 Навигация', async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.buttons++;
  user.lastActivity = new Date();
  
  console.log(`📱 Пользователь ${user.firstName} открыл навигацию`);
  
  await ctx.reply('🎯 Открываю навигацию по Академии...', {
    reply_markup: {
      inline_keyboard: [[
        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
      ]]
    }
  });
});

bot.hears('🎁 Акции', async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.buttons++;
  user.lastActivity = new Date();
  
  console.log(`🎁 Пользователь ${user.firstName} открыл акции`);
  
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
});

bot.hears('❓ Задать вопрос', async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.buttons++;
  user.lastActivity = new Date();
  
  console.log(`❓ Пользователь ${user.firstName} открыл форму вопроса`);
  
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
});

bot.hears('💬 Поддержка', async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.buttons++;
  user.lastActivity = new Date();
  
  console.log(`💬 Пользователь ${user.firstName} открыл поддержку`);
  
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
});

bot.hears('👤 Мой профиль', async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.buttons++;
  user.lastActivity = new Date();
  
  console.log(`👤 Пользователь ${user.firstName} открыл профиль`);
  
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
});

bot.hears('🔄 Продлить подписку', async (ctx) => {
  const user = getUser(ctx.from.id);
  user.stats.buttons++;
  user.lastActivity = new Date();
  
  console.log(`💳 Пользователь ${user.firstName} открыл продление подписки`);
  
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
});

bot.hears('🔙 Назад в меню', async (ctx) => {
  const user = getUser(ctx.from.id);
  user.lastActivity = new Date();
  
  console.log(`🔙 Пользователь ${user.firstName} вернулся в меню`);
  
  await showMainMenu(ctx);
});

// ==================== КОМАНДЫ БОТА ====================
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

// Обработка неизвестных сообщений
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const messageText = ctx.message.text;
  
  // Пропускаем если это команда
  if (messageText.startsWith('/')) return;
  
  // Пропускаем если пользователь в процессе опроса
  const survey = userSurveys.get(userId);
  if (survey) return;
  
  // Пропускаем известные кнопки меню
  const knownButtons = ['📱 Навигация', '🎁 Акции', '❓ Задать вопрос', '💬 Поддержка', '👤 Мой профиль', '🔄 Продлить подписку', '🔙 Назад в меню'];
  if (knownButtons.includes(messageText)) return;
  
  // Для неизвестных сообщений показываем меню
  console.log(`❓ Неизвестное сообщение от ${ctx.from.first_name}: ${messageText}`);
  await ctx.reply('🤔 Используйте кнопки меню для навигации');
  await showMainMenu(ctx);
});

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

// API для получения контента
app.get('/api/content/:type', (req, res) => {
  const contentType = req.params.type;
  if (contentDB[contentType]) {
    res.json({ success: true, data: contentDB[contentType] });
  } else {
    res.status(404).json({ success: false, error: 'Content type not found' });
  }
});

app.get('/api/content', (req, res) => {
  res.json({ success: true, data: contentDB });
});

// API для статистики (для админа)
app.get('/api/stats', (req, res) => {
  const stats = {
    totalUsers: users.size,
    usersWithSurvey: Array.from(users.values()).filter(u => u.surveyCompleted).length,
    activeSubscriptions: Array.from(users.values()).filter(u => u.subscription.status === 'trial' || u.subscription.status === 'active').length,
    recentActivity: Array.from(users.values()).filter(u => Date.now() - u.lastActivity < 24 * 60 * 60 * 1000).length
  };
  res.json({ success: true, stats });
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
    console.log(`⚡ Admin ID: ${ADMIN_IDS[0]}`);
    console.log('🔧 Команды: /start, /menu, /status, /help');
    console.log('📊 Готов к приему пользователей!');

  } catch (error) {
    console.error('❌ Failed to start app:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startApp();
