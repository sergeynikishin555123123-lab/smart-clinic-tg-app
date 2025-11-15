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
const WEBAPP_URL = process.env.WEBAPP_URL || `http://localhost:${PORT}`;

const ADMIN_IDS = [898508164]; 

console.log('🚀 Starting Smart Clinic Bot...');

// Создаем папки для загрузки файлов
const uploadsDir = join(__dirname, 'uploads');
const imagesDir = join(uploadsDir, 'images');
const videosDir = join(uploadsDir, 'videos');
const audioDir = join(uploadsDir, 'audio');

[uploadsDir, imagesDir, videosDir, audioDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// ==================== НАСТРОЙКА MULTER ДЛЯ ЗАГРУЗКИ ФАЙЛОВ ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, imagesDir);
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, videosDir);
        } else if (file.mimetype.startsWith('audio/')) {
            cb(null, audioDir);
        } else {
            cb(null, uploadsDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// ==================== БАЗА ДАННЫХ ====================
const users = new Map();
const userSurveys = new Map();
const admins = new Set(ADMIN_IDS);
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
            image: "/uploads/images/course-1.jpg",
            created: new Date('2024-01-15'),
            updated: new Date('2024-01-15')
        }
    ],
    podcasts: [
        {
            id: 1,
            title: "АНБ FM: Основы неврологии для практикующих врачей",
            description: "Подкаст о современных подходах в неврологии",
            duration: "45:20",
            audio: "/uploads/audio/podcast-1.mp3",
            image: "/uploads/images/podcast-1.jpg",
            created: new Date('2024-01-10')
        }
    ],
    streams: [
        {
            id: 1,
            title: "Разбор клинического случая: боль в пояснице",
            description: "Подробный разбор с Ильей Чистяковым",
            duration: "1:15:30",
            video: "/uploads/videos/stream-1.mp4",
            image: "/uploads/images/stream-1.jpg",
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
            video: "/uploads/videos/video-1.mp4",
            image: "/uploads/images/video-1.jpg",
            created: new Date('2024-01-05')
        }
    ],
    materials: [
        {
            id: 1,
            title: "МРТ разбор: грыжа позвоночника L4-L5",
            description: "Детальный анализ МРТ снимков пациента с грыжей",
            type: "mri",
            file: "/uploads/images/mri-1.jpg",
            image: "/uploads/images/mri-preview-1.jpg",
            created: new Date('2024-01-08')
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
            image: "/uploads/images/event-1.jpg",
            created: new Date('2024-01-12')
        }
    ]
};

const botMessages = {
    navigation: `🎯 <b>Навигация по Академии АНБ</b>\n\n📱 Для полного доступа ко всем функциям откройте наше приложение:\n\n• Курсы и обучение\n• Эфиры и разборы\n• Практические материалы\n• Сообщество специалистов\n• Личный кабинет и прогресс`,
    
    promotions: `🎁 <b>Акции и специальные предложения</b>\n\n🔥 <b>Пробный период</b>\n7 дней бесплатного доступа ко всем материалам\n\n💎 <b>Приведи друга</b>\nПолучи скидку 20% на подписку за каждого приглашенного коллегу\n\n🎯 <b>Пакет "Профи"</b>\n3 месяца обучения по цене 2\nЭкономия 600 рублей\n\n📈 <b>Корпоративная подписка</b>\nСпециальные условия для клиник и медицинских центров`,
    
    question: `❓ <b>Задать вопрос по обучению</b>\n\nДля вопросов по обучению заполните форму в нашем приложении:\n\n• Выберите тему вопроса\n• Укажите связанный курс (если есть)\n• Опишите проблему подробно\n• Прикрепите файлы при необходимости\n\n📞 Также вы можете обратиться напрямую к координатору: @academy_anb`,
    
    support: `💬 <b>Поддержка Академии АНБ</b>\n\n📞 Координатор проекта: @academy_anb\n⏰ Часы работы: ПН-ПТ с 11:00 до 19:00\n📧 Email: academy@anb.ru\n\n<b>Мы поможем с:</b>\n• Техническими вопросами\n• Оплатой и подписками\n• Доступом к материалам\n• Проблемами с аккаунтом\n• Любыми другими вопросами\n\n<b>Сообщить о нарушении:</b>\nЕсли вы получаете нежелательные сообщения (спам, реклама) или замечаете другие нарушения правил сообщества — сообщите нам, мы обязательно разберёмся.`,
    
    profile: `👤 <b>Информация о профиле</b>\n\nВ вашем профиле в приложении доступны:\n\n• Личные данные и специализация\n• Статус подписки и дата окончания\n• Прогресс по системе "Мой путь"\n• Просмотренные материалы\n• Сохраненные избранные элементы\n• Статистика активности\n\n💳 <b>Управление подпиской:</b>\nПодписку можно оформить, продлить или отменить в разделе «Личный кабинет» в приложении.`,
    
    renew: `🔄 <b>Продление подписки</b>\n\n<b>Доступные тарифы:</b>\n\n🟢 <b>1 месяц</b> - 2 900 руб.\n• Полный доступ ко всем материалам\n• Участие в эфирах\n• Доступ к чату специалистов\n\n🔵 <b>3 месяца</b> - 7 500 руб. (экономьте 600 руб.)\n• Все преимущества месячной подписки\n• Персональный сертификат\n• Приоритетная поддержка\n\n🟣 <b>12 месяцев</b> - 24 000 руб. (экономьте 10 800 руб.)\n• Максимальная экономия\n• Доступ к закрытым мероприятиям\n• Индивидуальные консультации\n\n💳 Для оформления подписки откройте приложение.`
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

function getNextId(collection) {
    return Math.max(0, ...collection.map(item => item.id)) + 1;
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
app.use('/uploads', express.static(uploadsDir));

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

// API для добавления контента
app.post('/api/content/:type', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), (req, res) => {
    const contentType = req.params.type;
    const contentData = req.body;
    const files = req.files;

    if (!contentDB[contentType]) {
        return res.status(404).json({ success: false, error: 'Content type not found' });
    }

    const newContent = {
        id: getNextId(contentDB[contentType]),
        title: contentData.title,
        description: contentData.description,
        fullDescription: contentData.fullDescription,
        created: new Date(),
        updated: new Date()
    };

    // Добавляем специфичные поля в зависимости от типа контента
    switch (contentType) {
        case 'courses':
            newContent.price = parseInt(contentData.price) || 0;
            newContent.duration = contentData.duration;
            newContent.modules = parseInt(contentData.modules) || 1;
            break;
        case 'podcasts':
            newContent.duration = contentData.duration;
            break;
        case 'streams':
            newContent.duration = contentData.duration;
            newContent.scheduled = contentData.scheduled ? new Date(contentData.scheduled) : null;
            break;
        case 'videos':
            newContent.duration = contentData.duration;
            break;
        case 'materials':
            newContent.type = contentData.materialType || 'other';
            break;
        case 'events':
            newContent.type = contentData.eventType || 'online';
            newContent.location = contentData.location;
            newContent.date = contentData.date;
            break;
    }

    // Обрабатываем загруженные файлы
    if (files) {
        if (files.image) {
            newContent.image = `/uploads/images/${files.image[0].filename}`;
        }
        if (files.video) {
            newContent.video = `/uploads/videos/${files.video[0].filename}`;
        }
        if (files.audio) {
            newContent.audio = `/uploads/audio/${files.audio[0].filename}`;
        }
        if (files.file) {
            newContent.file = `/uploads/${files.file[0].filename}`;
        }
    }

    contentDB[contentType].push(newContent);

    res.json({ success: true, data: newContent });
});

// API для удаления контента
app.delete('/api/content/:type/:id', (req, res) => {
    const contentType = req.params.type;
    const contentId = parseInt(req.params.id);

    if (!contentDB[contentType]) {
        return res.status(404).json({ success: false, error: 'Content type not found' });
    }

    const index = contentDB[contentType].findIndex(item => item.id === contentId);
    if (index === -1) {
        return res.status(404).json({ success: false, error: 'Content not found' });
    }

    const deletedContent = contentDB[contentType].splice(index, 1)[0];

    // Удаляем связанные файлы
    if (deletedContent.image && fs.existsSync(join(__dirname, deletedContent.image))) {
        fs.unlinkSync(join(__dirname, deletedContent.image));
    }
    if (deletedContent.video && fs.existsSync(join(__dirname, deletedContent.video))) {
        fs.unlinkSync(join(__dirname, deletedContent.video));
    }
    if (deletedContent.audio && fs.existsSync(join(__dirname, deletedContent.audio))) {
        fs.unlinkSync(join(__dirname, deletedContent.audio));
    }
    if (deletedContent.file && fs.existsSync(join(__dirname, deletedContent.file))) {
        fs.unlinkSync(join(__dirname, deletedContent.file));
    }

    res.json({ success: true, data: deletedContent });
});

// API для управления админами
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

app.post('/api/admins', (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    admins.add(parseInt(userId));
    
    // Обновляем пользователя если он существует
    const user = users.get(parseInt(userId));
    if (user) {
        user.isAdmin = true;
    }

    res.json({ success: true, data: { userId: parseInt(userId) } });
});

app.delete('/api/admins/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    
    // Не позволяем удалить самого себя
    if (userId === ADMIN_IDS[0]) {
        return res.status(400).json({ success: false, error: 'Cannot remove main admin' });
    }

    admins.delete(userId);
    
    // Обновляем пользователя если он существует
    const user = users.get(userId);
    if (user) {
        user.isAdmin = false;
    }

    res.json({ success: true, data: { userId } });
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

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК ====================
async function startApp() {
    try {
        app.listen(PORT, () => {
            console.log(`🌐 WebApp: http://localhost:${PORT}`);
            console.log(`📱 Admin Panel: ${WEBAPP_URL}/admin`);
            console.log(`📁 Uploads: ${uploadsDir}`);
        });

        await bot.launch();
        console.log('✅ Bot started!');
        console.log('🔧 Команды: /start, /menu, /admin');
        console.log('👑 Админ ID:', ADMIN_IDS[0]);

    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startApp();
