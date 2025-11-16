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

// ==================== УТИЛИТЫ ДЛЯ ОБРАБОТКИ КОНФЛИКТОВ ====================
let isShuttingDown = false;
let bot = null;
let server = null;

// Функция для graceful shutdown
async function gracefulShutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    
    console.log('🛑 Starting graceful shutdown...');
    
    try {
        if (bot) {
            console.log('Stopping Telegram bot...');
            try {
                await bot.stop();
                console.log('✅ Bot stopped successfully');
            } catch (botError) {
                if (botError.message === 'Bot is not running!') {
                    console.log('ℹ️ Bot was already stopped');
                } else {
                    console.error('❌ Error stopping bot:', botError.message);
                }
            }
        }

        if (server) {
            console.log('Closing HTTP server...');
            server.close(() => {
                console.log('✅ HTTP server closed');
                process.exit(0);
            });
            
            // Force close after 5 seconds
            setTimeout(() => {
                console.log('⚠️ Forcing shutdown...');
                process.exit(1);
            }, 5000);
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}

// Обработчики сигналов
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (error) => {
    console.error('🔥 Uncaught Exception:', error);
    gracefulShutdown();
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});

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
            fullDescription: "Комплексный курс, охватывающий основные мануальные техники, применяемые в неврологической практике.",
            price: 15000,
            duration: "12 часов",
            modules: 6,
            image: "/images/course-1.jpg",
            created: new Date('2024-01-15')
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
            created: new Date('2024-01-20')
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
    const result = admins.has(userId);
    console.log(`🔍 Admin check: ${userId} -> ${result}`);
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
bot = new Telegraf(BOT_TOKEN);

// Обработка ошибок бота
bot.catch((err, ctx) => {
    console.error(`🔥 Bot error for ${ctx.updateType}:`, err);
});

// ==================== ОБРАБОТКА КОМАНД ====================
bot.start(async (ctx) => {
    try {
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
    } catch (error) {
        console.error('Error in start command:', error);
        await ctx.reply('❌ Произошла ошибка. Попробуйте еще раз.');
    }
});

bot.command('menu', async (ctx) => {
    try {
        await showMainMenu(ctx);
    } catch (error) {
        console.error('Error in menu command:', error);
        await ctx.reply('❌ Произошла ошибка.');
    }
});

bot.command('admin', async (ctx) => {
    try {
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
    } catch (error) {
        console.error('Error in admin command:', error);
        await ctx.reply('❌ Произошла ошибка.');
    }
});

// ==================== ОБРАБОТКА КНОПОК ====================
bot.on('text', async (ctx) => {
    try {
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
    } catch (error) {
        console.error('Error handling text:', error);
    }
});

// ==================== ОБРАБОТКА INLINE КНОПОК ====================
bot.on('callback_query', async (ctx) => {
    try {
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
    } catch (error) {
        console.error('Error handling callback:', error);
    }
});

// ==================== ОПРОС ====================
async function handleSurvey(ctx, survey, text) {
    try {
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
    } catch (error) {
        console.error('Error in survey:', error);
        await ctx.reply('❌ Произошла ошибка в опросе.');
    }
}

async function sendSurveyStep(ctx, userId) {
    try {
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
    } catch (error) {
        console.error('Error sending survey step:', error);
    }
}

async function finishSurvey(ctx, userId, answers) {
    try {
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
    } catch (error) {
        console.error('Error finishing survey:', error);
        await ctx.reply('❌ Ошибка завершения опроса.');
    }
}

// ==================== ОСНОВНЫЕ КНОПКИ МЕНЮ ====================
async function handleMenuButton(ctx, text) {
    try {
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
    } catch (error) {
        console.error('Error handling menu button:', error);
        await ctx.reply('❌ Произошла ошибка.');
    }
}

// Главное меню
async function showMainMenu(ctx) {
    try {
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
    } catch (error) {
        console.error('Error showing main menu:', error);
        await ctx.reply('❌ Ошибка отображения меню.');
    }
}

// ==================== WEB APP SERVER ====================
const app = express();

// Middleware для обработки ошибок
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(join(__dirname, 'webapp')));

// Middleware для обработки CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// API для WebApp
app.get('/api/user/:id', (req, res) => {
    try {
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
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        console.error('Error in /api/user:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.get('/api/content/:type', (req, res) => {
    try {
        const contentType = req.params.type;
        if (contentDB[contentType]) {
            res.json({ success: true, data: contentDB[contentType] });
        } else {
            res.status(404).json({ success: false, error: 'Content type not found' });
        }
    } catch (error) {
        console.error('Error in /api/content/:type:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.get('/api/content', (req, res) => {
    try {
        res.json({ success: true, data: contentDB });
    } catch (error) {
        console.error('Error in /api/content:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API для избранного
app.post('/api/user/:id/favorites', express.json(), (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { contentType, contentId, action } = req.body;
        const user = users.get(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        if (action === 'add') {
            if (!user.favorites[contentType].includes(contentId)) {
                user.favorites[contentType].push(contentId);
            }
        } else if (action === 'remove') {
            user.favorites[contentType] = user.favorites[contentType].filter(id => id !== contentId);
        }
        
        res.json({ success: true, favorites: user.favorites });
    } catch (error) {
        console.error('Error in /api/user/:id/favorites:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.get('/api/user/:id/favorites', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = users.get(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        res.json({ success: true, favorites: user.favorites });
    } catch (error) {
        console.error('Error in /api/user/:id/favorites:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API для проверки админ-прав
app.get('/api/check-admin/:id', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const isAdminUser = isAdmin(userId);
        
        console.log(`🔍 API проверка админа: ${userId} -> ${isAdminUser}`);
        
        res.json({ 
            success: true, 
            isAdmin: isAdminUser 
        });
    } catch (error) {
        console.error('Error in /api/check-admin:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API для получения списка админов
app.get('/api/admins', (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error in /api/admins:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API для добавления админа
app.post('/api/admins', express.json(), (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error in POST /api/admins:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API для удаления админа
app.delete('/api/admins/:userId', (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error in DELETE /api/admins:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.get('/api/bot/messages', (req, res) => {
    try {
        res.json({ success: true, messages: botMessages });
    } catch (error) {
        console.error('Error in /api/bot/messages:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.put('/api/bot/messages', express.json(), (req, res) => {
    try {
        if (req.body.messages) {
            Object.assign(botMessages, req.body.messages);
        }
        res.json({ success: true, messages: botMessages });
    } catch (error) {
        console.error('Error in PUT /api/bot/messages:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.get('/api/stats', (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error in /api/stats:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Обновление подписки
app.post('/api/user/:id/subscription', express.json(), (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { plan } = req.body;
        const user = users.get(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
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
    } catch (error) {
        console.error('Error in /api/user/:id/subscription:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        users: users.size,
        admins: admins.size
    });
});

// Обработка 404
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('🔥 Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
    });
});

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК ====================
async function startApp() {
    try {
        console.log('🚀 Starting application...');

        // Запускаем Express сервер
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 WebApp сервер запущен на порту ${PORT}`);
            console.log(`📱 WebApp: ${WEBAPP_URL}`);
            console.log(`📱 Admin Panel: ${WEBAPP_URL}/admin.html`);
            console.log(`👑 Админ ID: ${ADMIN_IDS[0]}`);
        });

        // Обработка ошибок сервера
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.log(`❌ Port ${PORT} is already in use.`);
                console.log('💡 Try: pkill -f "node.*server.js"');
                process.exit(1);
            } else {
                console.error('Server error:', error);
                process.exit(1);
            }
        });

        // Запускаем бота с обработкой ошибки 409
        try {
            await bot.launch();
            console.log('✅ Telegram Bot запущен!');
            console.log('🔧 Команды: /start, /menu, /admin');
            console.log('✅ Приложение готово к работе!');
        } catch (launchError) {
            if (launchError.code === 409) {
                console.log('⚠️ Bot is already running (409 error). This is normal in some hosting environments.');
                console.log('ℹ️ Bot commands might not work, but WebApp should be functional.');
            } else {
                throw launchError;
            }
        }

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        
        if (error.code === 409) {
            console.log('💡 Bot conflict detected. The WebApp should still work.');
        } else {
            gracefulShutdown();
        }
    }
}

// Запускаем приложение
startApp();
