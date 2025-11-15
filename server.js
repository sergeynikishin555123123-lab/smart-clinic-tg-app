// server.js - ОСНОВНОЙ ФАЙЛ БОТА
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || `https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net`;

const ADMIN_IDS = [898508164]; 

console.log('🚀 Starting Smart Clinic Bot...');

// ==================== БАЗА ДАННЫХ В ПАМЯТИ ====================
const users = new Map();
const userSurveys = new Map();
const admins = new Set(ADMIN_IDS);

// Сообщения бота
const botMessages = {
    navigation: `🎯 <b>Навигация по Академии АНБ</b>\n\n📱 Для полного доступа ко всем функциям откройте наше приложение:\n\n• Курсы и обучение\n• Эфиры и разборы\n• Практические материалы\n• Сообщество специалистов\n• Личный кабинет и прогресс`,
    
    promotions: `🎁 <b>Акции и специальные предложения</b>\n\n🔥 <b>Пробный период</b>\n7 дней бесплатного доступа ко всем материалам\n\n💎 <b>Приведи друга</b>\nПолучи скидку 20% на подписку за каждого приглашенного коллегу\n\n🎯 <b>Пакет "Профи"</b>\n3 месяца обучения по цене 2\nЭкономия 600 рублей\n\n📈 <b>Корпоративная подписка</b>\nСпециальные условия для клиник и медицинских центров`,
    
    question: `❓ <b>Задать вопрос по обучению</b>\n\nДля вопросов по обучению заполните форму в нашем приложении:\n\n• Выберите тему вопроса\n• Укажите связанный курс (если есть)\n• Опишите проблему подробно\n• Прикрепите файлы при необходимости\n\n📞 Также вы можете обратиться напрямую к координатору: @academy_anb`,
    
    support: `💬 <b>Поддержка Академии АНБ</b>\n\n📞 Координатор проекта: @academy_anb\n⏰ Часы работы: ПН-ПТ с 11:00 до 19:00\n📧 Email: academy@anb.ru\n\n<b>Мы поможем с:</b>\n• Техническими вопросами\n• Оплатой и подписками\n• Доступом к материалам\n• Проблемами с аккаунтом\n• Любыми другими вопросами`,
    
    profile: `👤 <b>Информация о профиле</b>\n\nВ вашем профиле в приложении доступны:\n\n• Личные данные и специализация\n• Статус подписки и дата окончания\n• Прогресс по системе "Мой путь"\n• Просмотренные материалы\n• Сохраненные избранные элементы\n\n💳 <b>Управление подпиской:</b>\nПодписку можно оформить, продлить или отменить в разделе «Личный кабинет» в приложении.`,
    
    renew: `🔄 <b>Продление подписки</b>\n\n<b>Доступные тарифы:</b>\n\n🟢 <b>1 месяц</b> - 2 900 руб.\n• Полный доступ ко всем материалам\n• Участие в эфирах\n• Доступ к чату специалистов\n\n🔵 <b>3 месяца</b> - 7 500 руб.\n• Экономия 600 рублей\n• Персональный сертификат\n• Приоритетная поддержка\n\n💳 Для оформления подписки откройте приложение.`
};

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
            isAdmin: admins.has(id),
            progress: { 
                level: 'Понимаю', 
                steps: {
                    materialsWatched: 0,
                    eventsParticipated: 0,
                    materialsSaved: 0,
                    coursesBought: 0
                }
            }
        });
    }
    return users.get(id);
}

function isAdmin(userId) {
    return admins.has(userId);
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
    user.isAdmin = isAdmin(ctx.from.id);

    console.log(`👋 START: ${user.firstName} (${ctx.from.id}) ${user.isAdmin ? '👑 ADMIN' : ''}`);

    if (user.surveyCompleted) {
        await showMainMenu(ctx);
        return;
    }

    userSurveys.set(ctx.from.id, { step: 0, answers: {} });
    await sendSurveyStep(ctx, ctx.from.id);
});

bot.command('menu', async (ctx) => {
    await showMainMenu(ctx);
});

bot.command('admin', async (ctx) => {
    const user = getUser(ctx.from.id);
    if (!user.isAdmin) {
        await ctx.reply('❌ Нет прав доступа');
        return;
    }

    await ctx.reply('🔧 <b>Панель управления ботом</b>\n\nЗдесь вы можете редактировать сообщения, которые видят пользователи при нажатии кнопок.', {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✏️ Редактировать сообщения', callback_data: 'edit_messages' },
                    { text: '📊 Статистика бота', callback_data: 'bot_stats' }
                ],
                [
                    { text: '📱 Открыть админ-панель', web_app: { url: `${WEBAPP_URL}/admin` } }
                ]
            ]
        }
    });
});

// ==================== ОБРАБОТКА КНОПОК ====================
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

// ==================== ОБРАБОТКА INLINE КНОПОК ====================
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const user = getUser(ctx.from.id);
    
    console.log(`🔘 CALLBACK: ${user.firstName} - ${data}`);
    
    await ctx.answerCbQuery();
    
    switch (data) {
        case 'edit_messages':
            await ctx.editMessageText('✏️ <b>Редактирование сообщений</b>\n\nЭта функция будет доступна в админ-панели.', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📱 Открыть админ-панель', web_app: { url: `${WEBAPP_URL}/admin` } }],
                        [{ text: '🔙 Назад', callback_data: 'back_to_admin' }]
                    ]
                }
            });
            break;
            
        case 'bot_stats':
            const totalUsers = users.size;
            const activeUsers = Array.from(users.values()).filter(u => 
                u.subscription.status === 'trial' || u.subscription.status === 'active'
            ).length;
            
            await ctx.editMessageText(
                `📊 <b>Статистика бота</b>\n\n` +
                `👥 Всего пользователей: <b>${totalUsers}</b>\n` +
                `✅ Активных подписок: <b>${activeUsers}</b>\n` +
                `📝 Завершенных опросов: <b>${Array.from(users.values()).filter(u => u.surveyCompleted).length}</b>`,
                {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔄 Обновить', callback_data: 'bot_stats' }],
                            [{ text: '🔙 Назад', callback_data: 'back_to_admin' }]
                        ]
                    }
                }
            );
            break;
            
        case 'back_to_admin':
            await ctx.editMessageText('🔧 <b>Панель управления ботом</b>\n\nВыберите действие:', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✏️ Редактировать сообщения', callback_data: 'edit_messages' },
                            { text: '📊 Статистика бота', callback_data: 'bot_stats' }
                        ],
                        [
                            { text: '📱 Открыть админ-панель', web_app: { url: `${WEBAPP_URL}/admin` } }
                        ]
                    ]
                }
            });
            break;
    }
});

// ==================== ОПРОС ====================
async function handleSurvey(ctx, survey, text) {
    const userId = ctx.from.id;
    const currentStep = surveySteps[survey.step];

    if (currentStep.isTextInput) {
        if (currentStep.field === 'email' && !text.includes('@')) {
            await ctx.reply('❌ Введите корректный email:');
            return;
        }
        survey.answers[currentStep.field] = text;
    } else {
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
        `🎁 Пробный доступ на 7 дней активирован!\n\n` +
        `Теперь вы можете пользоваться всеми возможностями Академии.`,
        Markup.removeKeyboard()
    );

    await showMainMenu(ctx);
}

// ==================== ОСНОВНЫЕ КНОПКИ МЕНЮ ====================
async function handleMenuButton(ctx, text) {
    const user = getUser(ctx.from.id);
    user.lastActivity = new Date();

    console.log(`🔘 BUTTON: ${user.firstName} - "${text}"`);

    switch (text) {
        case '📱 Навигация':
            await ctx.reply(botMessages.navigation, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '🎁 Акции':
            await ctx.reply(botMessages.promotions, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '❓ Задать вопрос':
            await ctx.reply(botMessages.question, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '💬 Поддержка':
            await ctx.reply(botMessages.support, {
                parse_mode: 'HTML'
            });
            break;

        case '👤 Мой профиль':
            await ctx.reply(botMessages.profile, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '🔄 Продлить подписку':
            await ctx.reply(botMessages.renew, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '🔧 Управление ботом':
            if (user.isAdmin) {
                await ctx.reply('🔧 <b>Панель управления ботом</b>\n\nВыберите действие:', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '✏️ Редактировать сообщения', callback_data: 'edit_messages' },
                                { text: '📊 Статистика бота', callback_data: 'bot_stats' }
                            ],
                            [
                                { text: '📱 Открыть админ-панель', web_app: { url: `${WEBAPP_URL}/admin` } }
                            ]
                        ]
                    }
                });
            } else {
                await ctx.reply('❌ Нет прав доступа');
            }
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
    
    let message = `👋 Добро пожаловать в Академию АНБ, ${user.firstName}!\n\n`;
    
    if (user.subscription.status === 'trial') {
        message += `🕒 Пробный доступ до: ${user.subscription.endDate.toLocaleDateString('ru-RU')}\n\n`;
    } else if (user.isAdmin) {
        message += `👑 Вы администратор системы\n\n`;
    }
    
    message += `Выберите раздел для получения информации:`;

    const keyboard = [
        ['📱 Навигация', '🎁 Акции'],
        ['❓ Задать вопрос', '💬 Поддержка'],
        ['👤 Мой профиль', '🔄 Продлить подписку']
    ];

    // Добавляем админ-кнопку если пользователь админ
    if (user.isAdmin) {
        keyboard.push(['🔧 Управление ботом']);
    }

    await ctx.reply(message, {
        reply_markup: {
            keyboard: keyboard,
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
        // Для админов делаем подписку активной
        if (user.isAdmin) {
            user.subscription = {
                status: 'active',
                type: 'admin',
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 год
            };
        }
        
        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.firstName,
                specialization: user.specialization,
                city: user.city,
                email: user.email,
                subscription: user.subscription,
                progress: user.progress,
                isAdmin: user.isAdmin,
                joinedAt: user.joinedAt
            }
        });
    } else {
        res.json({ success: false, error: 'User not found' });
    }
});

app.get('/api/bot/messages', (req, res) => {
    res.json({ success: true, messages: botMessages });
});

app.put('/api/bot/messages', (req, res) => {
    if (req.body.messages) {
        Object.assign(botMessages, req.body.messages);
    }
    res.json({ success: true, messages: botMessages });
});

app.get('/api/stats', (req, res) => {
    const totalUsers = users.size;
    const activeUsers = Array.from(users.values()).filter(u => 
        u.subscription.status === 'trial' || u.subscription.status === 'active'
    ).length;
    const completedSurveys = Array.from(users.values()).filter(u => u.surveyCompleted).length;
    
    res.json({ 
        success: true, 
        stats: { totalUsers, activeUsers, completedSurveys } 
    });
});

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК ====================
async function startApp() {
    try {
        // Запускаем Express сервер
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 WebApp сервер запущен на порту ${PORT}`);
            console.log(`📱 WebApp: ${WEBAPP_URL}`);
            console.log(`👑 Админ ID: ${ADMIN_IDS[0]}`);
        });

        // Запускаем бота
        await bot.launch();
        console.log('✅ Telegram Bot запущен!');
        console.log('🔧 Доступные команды: /start, /menu, /admin');

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

// Обработка graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Останавливаем бота...');
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🛑 Останавливаем бота...');
    bot.stop('SIGTERM');
    process.exit(0);
});

// Запускаем приложение
startApp();
