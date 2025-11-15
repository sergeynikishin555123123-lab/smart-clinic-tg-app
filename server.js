// server.js
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Демо-контент
const contentDB = {
    courses: [
        {
            id: 1,
            title: "Мануальные техники в практике",
            description: "6 модулей по современным мануальным методикам",
            fullDescription: "Комплексный курс, охватывающий основные мануальные техники, применяемые в неврологической практике. Изучите диагностику и коррекцию функциональных нарушений.",
            price: 15000,
            duration: "12 часов",
            modules: 6,
            image: "/images/course-1.jpg",
            created: new Date('2024-01-15'),
            updated: new Date('2024-01-15')
        },
        {
            id: 2,
            title: "Неврология для практикующих врачей",
            description: "Основы неврологической диагностики и лечения",
            fullDescription: "Фундаментальный курс по неврологии для врачей различных специальностей.",
            price: 12000,
            duration: "10 часов",
            modules: 5,
            image: "/images/course-2.jpg",
            created: new Date('2024-01-20'),
            updated: new Date('2024-01-20')
        }
    ],
    podcasts: [
        {
            id: 1,
            title: "АНБ FM: Основы неврологии",
            description: "Подкаст о современных подходах в неврологии",
            duration: "45:20",
            audio: "/audio/podcast-1.mp3",
            image: "/images/podcast-1.jpg",
            created: new Date('2024-01-10')
        }
    ],
    streams: [
        {
            id: 1,
            title: "Разбор клинического случая: боль в пояснице",
            description: "Подробный разбор с Ильей Чистяковым",
            duration: "1:15:30",
            video: "/videos/stream-1.mp4",
            image: "/images/stream-1.jpg",
            scheduled: new Date('2024-01-20T19:00:00'),
            created: new Date('2024-01-18')
        }
    ],
    videos: [
        {
            id: 1,
            title: "Техника миофасциального релиза",
            description: "Короткая видео-шпаргалка по технике МФР",
            duration: "08:15",
            video: "/videos/video-1.mp4",
            image: "/images/video-1.jpg",
            created: new Date('2024-01-05')
        }
    ],
    materials: [
        {
            id: 1,
            title: "МРТ разбор: грыжа позвоночника L4-L5",
            description: "Детальный анализ МРТ снимков пациента с грыжей",
            type: "mri",
            file: "/materials/mri-1.pdf",
            image: "/images/mri-preview-1.jpg",
            created: new Date('2024-01-08')
        },
        {
            id: 2,
            title: "Клинический случай: мигрень",
            description: "Разбор диагностики и лечения пациента с мигренью",
            type: "case",
            file: "/materials/case-1.pdf",
            image: "/images/case-preview-1.jpg",
            created: new Date('2024-01-12')
        }
    ],
    events: [
        {
            id: 1,
            title: "Онлайн-вебинар по современной реабилитации",
            description: "Современные методы восстановительного лечения",
            date: "2024-12-15",
            type: "online",
            location: "Zoom",
            image: "/images/event-1.jpg",
            created: new Date('2024-01-12')
        }
    ]
};

// Сообщения бота
const botMessages = {
    navigation: `🎯 <b>Навигация по Академии АНБ</b>\n\n📱 Для полного доступа ко всем функциям откройте наше приложение:\n\n• Курсы и обучение\n• Эфиры и разборы\n• Практические материалы\n• Сообщество специалистов\n• Личный кабинет и прогресс`,
    
    promotions: `🎁 <b>Акции и специальные предложения</b>\n\n🔥 <b>Пробный период</b>\n7 дней бесплатного доступа ко всем материалам\n\n💎 <b>Приведи друга</b>\nПолучи скидку 20% на подписку за каждого приглашенного коллегу\n\n🎯 <b>Пакет "Профи"</b>\n3 месяца обучения по цене 2\nЭкономия 600 рублей`,
    
    question: `❓ <b>Задать вопрос по обучению</b>\n\nДля вопросов по обучению заполните форму в нашем приложении:\n\n• Выберите тему вопроса\n• Укажите связанный курс\n• Опишите проблему подробно\n\n📞 Координатор: @academy_anb`,
    
    support: `💬 <b>Поддержка Академии АНБ</b>\n\n📞 Координатор: @academy_anb\n⏰ ПН-ПТ с 11:00 до 19:00\n📧 academy@anb.ru`,
    
    profile: `👤 <b>Информация о профиле</b>\n\nВ вашем профиле доступны:\n\n• Личные данные и специализация\n• Статус подписки\n• Прогресс по системе "Мой путь"\n• Просмотренные материалы\n\n💳 Подписку можно оформить в разделе «Личный кабинет».`,
    
    renew: `🔄 <b>Продление подписки</b>\n\n<b>Тарифы:</b>\n\n🟢 <b>1 месяц</b> - 2 900 руб.\n🔵 <b>3 месяца</b> - 7 500 руб.\n🟣 <b>12 месяцев</b> - 24 000 руб.\n\n💳 Для оформления откройте приложение.`
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
            isAdmin: isAdmin(id),
            progress: { 
                level: 'Понимаю', 
                steps: {
                    materialsWatched: 5,
                    eventsParticipated: 3,
                    materialsSaved: 7,
                    coursesBought: 1
                }
            },
            favorites: {
                courses: [],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                watchLater: []
            }
        });
    }
    return users.get(id);
}

function isAdmin(userId) {
    console.log(`🔍 Checking admin rights for ${userId}`);
    console.log(`👑 Admin IDs: ${Array.from(admins)}`);
    const result = admins.has(userId);
    console.log(`✅ Result: ${result}`);
    return result;
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

    console.log('=== DEBUG ADMIN CHECK ===');
    console.log('User ID:', ctx.from.id);
    console.log('Admin IDs:', Array.from(admins));
    console.log('Is admin:', user.isAdmin);
    console.log('User object:', user);
    console.log('=========================');

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

    await ctx.reply('🔧 <b>Панель управления ботом</b>', {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📊 Статистика бота', callback_data: 'bot_stats' }
                ],
                [
                    { text: '📱 Открыть админ-панель', web_app: { url: `${WEBAPP_URL}/admin.html` } }
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

    const survey = userSurveys.get(userId);
    if (survey) {
        await handleSurvey(ctx, survey, text);
        return;
    }

    await handleMenuButton(ctx, text);
});

// ==================== ОБРАБОТКА INLINE КНОПОК ====================
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const user = getUser(ctx.from.id);
    
    console.log(`🔘 CALLBACK: ${user.firstName} - ${data}`);
    
    await ctx.answerCbQuery();
    
    switch (data) {
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
                    parse_mode: 'HTML'
                }
            );
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
                await ctx.reply('🔧 <b>Панель управления ботом</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '📊 Статистика бота', callback_data: 'bot_stats' }
                            ],
                            [
                                { text: '📱 Открыть админ-панель', web_app: { url: `${WEBAPP_URL}/admin.html` } }
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
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
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
                favorites: user.favorites,
                isAdmin: user.isAdmin,
                joinedAt: user.joinedAt
            }
        });
    } else {
        res.json({ success: false, error: 'User not found' });
    }
});

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

// API для избранного
app.post('/api/user/:id/favorites', express.json(), (req, res) => {
    const userId = parseInt(req.params.id);
    const { contentType, contentId, action } = req.body;
    const user = users.get(userId);
    
    if (!user) {
        return res.json({ success: false, error: 'User not found' });
    }
    
    if (action === 'add') {
        if (!user.favorites[contentType].includes(contentId)) {
            user.favorites[contentType].push(contentId);
        }
    } else if (action === 'remove') {
        user.favorites[contentType] = user.favorites[contentType].filter(id => id !== contentId);
    }
    
    res.json({ success: true, favorites: user.favorites });
});

app.get('/api/user/:id/favorites', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.get(userId);
    
    if (!user) {
        return res.json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, favorites: user.favorites });
});

// API для проверки админ-прав
app.get('/api/check-admin/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const isAdminUser = isAdmin(userId);
    
    console.log(`🔍 API проверка админа: ${userId} -> ${isAdminUser}`);
    
    res.json({ 
        success: true, 
        isAdmin: isAdminUser 
    });
});

// API для получения списка админов
app.get('/api/admins', (req, res) => {
    const adminUsers = Array.from(admins).map(adminId => {
        const user = users.get(adminId);
        return user ? {
            id: user.id,
            firstName: user.firstName,
            username: user.username,
            joinedAt: user.joinedAt
        } : { id: adminId };
    });
    
    res.json({ success: true, data: adminUsers });
});

// API для добавления админа
app.post('/api/admins', express.json(), (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const userIdNum = parseInt(userId);
    admins.add(userIdNum);
    
    // Обновляем пользователя если он существует
    const user = users.get(userIdNum);
    if (user) {
        user.isAdmin = true;
    }

    console.log(`✅ Добавлен админ: ${userIdNum}`);
    
    res.json({ success: true, data: { userId: userIdNum } });
});

// API для удаления админа
app.delete('/api/admins/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    
    // Не позволяем удалить самого себя если это главный админ
    if (userId === ADMIN_IDS[0]) {
        return res.status(400).json({ success: false, error: 'Cannot remove main admin' });
    }

    admins.delete(userId);
    
    // Обновляем пользователя если он существует
    const user = users.get(userId);
    if (user) {
        user.isAdmin = false;
    }

    console.log(`🗑️ Удален админ: ${userId}`);
    
    res.json({ success: true, data: { userId } });
});

app.get('/api/bot/messages', (req, res) => {
    res.json({ success: true, messages: botMessages });
});

app.put('/api/bot/messages', express.json(), (req, res) => {
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
    
    // Статистика по контенту
    const contentStats = {};
    Object.keys(contentDB).forEach(type => {
        contentStats[type] = contentDB[type].length;
    });
    
    res.json({ 
        success: true, 
        stats: { 
            totalUsers, 
            activeUsers, 
            completedSurveys,
            content: contentStats
        } 
    });
});

// Обновление подписки
app.post('/api/user/:id/subscription', express.json(), (req, res) => {
    const userId = parseInt(req.params.id);
    const { plan } = req.body;
    const user = users.get(userId);
    
    if (!user) {
        return res.json({ success: false, error: 'User not found' });
    }
    
    const plans = {
        '1_month': { months: 1, price: 2900 },
        '3_months': { months: 3, price: 7500 },
        '12_months': { months: 12, price: 24000 }
    };
    
    const selectedPlan = plans[plan];
    if (selectedPlan) {
        user.subscription = {
            status: 'active',
            type: plan,
            endDate: new Date(Date.now() + selectedPlan.months * 30 * 24 * 60 * 60 * 1000)
        };
        
        // Обновляем прогресс
        user.progress.steps.coursesBought++;
    }
    
    res.json({ success: true, subscription: user.subscription });
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
            console.log(`📱 Admin Panel: ${WEBAPP_URL}/admin.html`);
            console.log(`👑 Админ ID: ${ADMIN_IDS[0]}`);
            console.log(`✅ Приложение готово к работе!`);
        });

        // Запускаем бота
        await bot.launch();
        console.log('✅ Telegram Bot запущен!');
        console.log('🔧 Команды: /start, /menu, /admin');

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
