// server.js - ОСНОВНОЙ СЕРВЕР
import { Telegraf, session } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL || `https://your-app.twc1.net`,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@host:5432/db',
    ADMIN_IDS: [898508164, 123456789],
    UPLOAD_PATH: join(__dirname, 'uploads'),
    NODE_ENV: process.env.NODE_ENV || 'development'
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
const app = express();
const bot = new Telegraf(config.BOT_TOKEN);

// ==================== БАЗА ДАННЫХ ====================
class Database {
    constructor() {
        this.pool = null;
        this.connected = false;
    }

    async connect() {
        try {
            const { Pool } = await import('pg');
            this.pool = new Pool({
                connectionString: config.DATABASE_URL,
                ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });

            await this.pool.query('SELECT 1');
            this.connected = true;
            console.log('✅ База данных подключена');
            
            await this.createTables();
            await this.seedInitialData();
            
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error);
            this.connected = false;
        }
    }

    async createTables() {
        const tables = [
            // Пользователи
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB,
                profile_data JSONB DEFAULT '{}',
                subscription_data JSONB DEFAULT '{}',
                progress_data JSONB DEFAULT '{"level": "Понимаю", "steps": {}}',
                favorites_data JSONB DEFAULT '{"watchLater": [], "favorites": [], "materials": []}',
                survey_completed BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Контент - курсы
            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                full_description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                duration TEXT,
                modules INTEGER DEFAULT 1,
                image_url TEXT,
                video_url TEXT,
                file_urls JSONB DEFAULT '[]',
                tags TEXT[] DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Контент - подкасты (АНБ FM)
            `CREATE TABLE IF NOT EXISTS podcasts (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                duration TEXT,
                audio_url TEXT,
                image_url TEXT,
                tags TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Контент - эфиры и разборы
            `CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                stream_date TIMESTAMP,
                is_live BOOLEAN DEFAULT FALSE,
                tags TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Контент - видео-шпаргалки
            `CREATE TABLE IF NOT EXISTS video_tips (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                category TEXT,
                tags TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Контент - практические материалы
            `CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                content TEXT,
                file_url TEXT,
                image_url TEXT,
                material_type TEXT CHECK(material_type IN ('mri', 'case', 'checklist')),
                tags TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Контент - мероприятия
            `CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                event_date TIMESTAMP,
                location TEXT,
                event_type TEXT CHECK(event_type IN ('online', 'offline')),
                image_url TEXT,
                registration_url TEXT,
                tags TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Контент - акции
            `CREATE TABLE IF NOT EXISTS promotions (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                conditions TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Прогресс пользователей
            `CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                content_type TEXT,
                content_id INTEGER,
                progress_percentage INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                time_spent INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, content_type, content_id)
            )`,

            // Платежи и подписки
            `CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                plan_type TEXT CHECK(plan_type IN ('1_month', '3_months', '12_months', 'trial')),
                status TEXT CHECK(status IN ('active', 'expired', 'cancelled')),
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                payment_data JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Загруженные файлы
            `CREATE TABLE IF NOT EXISTS uploaded_files (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                original_name TEXT,
                file_path TEXT,
                file_size INTEGER,
                mime_type TEXT,
                upload_type TEXT,
                uploaded_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const tableSQL of tables) {
            try {
                await this.pool.query(tableSQL);
                console.log(`✅ Таблица создана/проверена`);
            } catch (error) {
                console.error(`❌ Ошибка создания таблицы:`, error.message);
            }
        }
    }

    async seedInitialData() {
        // Проверяем, есть ли уже данные
        const usersCount = await this.pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(usersCount.rows[0].count) > 0) {
            console.log('✅ Данные уже существуют');
            return;
        }

        console.log('📝 Добавление начальных данных...');

        // Добавляем администратора
        await this.pool.query(`
            INSERT INTO users (id, telegram_data, is_admin, survey_completed) 
            VALUES ($1, $2, TRUE, TRUE)
            ON CONFLICT (id) DO NOTHING
        `, [config.ADMIN_IDS[0], JSON.stringify({
            first_name: 'Администратор',
            username: 'admin'
        })]);

        // Добавляем демо-курсы
        const demoCourses = [
            {
                title: 'Мануальные техники в практике',
                description: '6 модулей по современным мануальным методикам',
                full_description: 'Комплексный курс по мануальным техникам для практикующих врачей',
                price: 15000,
                duration: '12 часов',
                modules: 6,
                tags: ['мануальная терапия', 'практика', 'неврология']
            },
            {
                title: 'Неврология для практикующих врачей',
                description: 'Основы неврологической диагностики',
                full_description: 'Фундаментальный курс по неврологии',
                price: 12000,
                duration: '10 часов',
                modules: 5,
                tags: ['неврология', 'диагностика', 'базовый']
            }
        ];

        for (const course of demoCourses) {
            await this.pool.query(`
                INSERT INTO courses (title, description, full_description, price, duration, modules, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [course.title, course.description, course.full_description, course.price, 
                course.duration, course.modules, course.tags]);
        }

        console.log('✅ Начальные данные добавлены');
    }

    async query(text, params) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }
        return await this.pool.query(text, params);
    }
}

const db = new Database();

// ==================== MULTER ДЛЯ ЗАГРУЗКИ ФАЙЛОВ ====================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = config.UPLOAD_PATH;
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop();
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = {
            'image': /jpeg|jpg|png|gif|webp/,
            'video': /mp4|avi|mov|mkv|webm/,
            'audio': /mp3|wav|ogg|m4a/,
            'document': /pdf|doc|docx|ppt|pptx|xls|xlsx/
        };

        const fileType = Object.keys(allowedTypes).find(type => 
            allowedTypes[type].test(file.mimetype) || 
            allowedTypes[type].test(file.originalname.toLowerCase())
        );

        if (fileType) {
            cb(null, true);
        } else {
            cb(new Error(`Неподдерживаемый тип файла: ${file.mimetype}`), false);
        }
    }
});

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(config.UPLOAD_PATH));
app.use('/webapp', express.static(join(__dirname, 'webapp')));
app.use('/admin', express.static(join(__dirname, 'admin-panel')));

// ==================== TELEGRAM BOT ====================
class TelegramBot {
    constructor() {
        this.bot = bot;
        this.userSessions = new Map();
        this.init();
    }

    init() {
        // Сессии для опросов
        this.bot.use(session());

        // Обработчики команд
        this.bot.start(this.handleStart.bind(this));
        this.bot.command('menu', this.handleMenu.bind(this));
        this.bot.command('admin', this.handleAdmin.bind(this));

        // Обработчики сообщений
        this.bot.on('text', this.handleText.bind(this));
        this.bot.on('message', this.handleMessage.bind(this));

        // WebApp данные
        this.bot.on('web_app_data', this.handleWebAppData.bind(this));
    }

    async handleStart(ctx) {
        const userId = ctx.from.id;
        console.log(`🚀 Пользователь ${userId} запустил бота`);

        // Создаем/получаем пользователя
        const user = await this.getOrCreateUser(ctx.from);
        
        if (!user.survey_completed) {
            await this.startSurvey(ctx);
        } else {
            await this.showMainMenu(ctx);
        }
    }

    async handleMenu(ctx) {
        await this.showMainMenu(ctx);
    }

    async handleAdmin(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        if (!user.is_admin && !config.ADMIN_IDS.includes(user.id)) {
            await ctx.reply('❌ У вас нет прав доступа');
            return;
        }
        
        await ctx.reply('🔧 Панель администратора', {
            reply_markup: {
                inline_keyboard: [[
                    { 
                        text: '📱 Открыть админ-панель', 
                        web_app: { url: `${config.WEBAPP_URL}/admin` } 
                    }
                ]]
            }
        });
    }

    async handleText(ctx) {
        const userId = ctx.from.id;
        const text = ctx.message.text;

        // Проверяем сессию опроса
        const session = this.userSessions.get(userId);
        if (session && session.surveyStep !== undefined) {
            await this.handleSurveyAnswer(ctx, session, text);
            return;
        }

        // Обработка кнопок меню
        await this.handleMenuButton(ctx, text);
    }

    async handleMessage(ctx) {
        // Обработка других типов сообщений
        console.log('Получено сообщение:', ctx.message);
    }

    async handleWebAppData(ctx) {
        // Обработка данных из WebApp
        const data = JSON.parse(ctx.webAppData.data);
        console.log('Данные из WebApp:', data);
    }

    async getOrCreateUser(telegramUser) {
        try {
            const result = await db.query(
                `SELECT * FROM users WHERE id = $1`,
                [telegramUser.id]
            );

            if (result.rows.length > 0) {
                return result.rows[0];
            }

            // Создаем нового пользователя
            const newUser = {
                id: telegramUser.id,
                telegram_data: {
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name,
                    username: telegramUser.username,
                    language_code: telegramUser.language_code
                },
                profile_data: {},
                subscription_data: {
                    status: 'inactive',
                    type: null,
                    end_date: null
                },
                progress_data: {
                    level: 'Понимаю',
                    steps: {
                        materialsWatched: 0,
                        eventsParticipated: 0,
                        materialsSaved: 0,
                        coursesBought: 0
                    }
                },
                favorites_data: {
                    watchLater: [],
                    favorites: [],
                    materials: []
                },
                survey_completed: false,
                is_admin: config.ADMIN_IDS.includes(telegramUser.id)
            };

            await db.query(
                `INSERT INTO users (id, telegram_data, profile_data, subscription_data, progress_data, favorites_data, is_admin)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [newUser.id, newUser.telegram_data, newUser.profile_data, 
                 newUser.subscription_data, newUser.progress_data, newUser.favorites_data, newUser.is_admin]
            );

            return newUser;
        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            throw error;
        }
    }

    async startSurvey(ctx) {
        const userId = ctx.from.id;
        
        this.userSessions.set(userId, {
            surveyStep: 0,
            answers: {}
        });

        await this.sendSurveyStep(ctx, userId, 0);
    }

    async sendSurveyStep(ctx, userId, step) {
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

        const currentStep = surveySteps[step];
        if (!currentStep) return;

        if (currentStep.isTextInput) {
            await ctx.reply(`📝 ${currentStep.question}\n\nВведите ваш ответ:`, {
                reply_markup: { remove_keyboard: true }
            });
        } else {
            const buttons = currentStep.options.map(opt => [opt]);
            buttons.push(['🚫 Пропустить вопрос']);
            
            await ctx.reply(`📝 ${currentStep.question}\n\nВыберите вариант:`, {
                reply_markup: {
                    keyboard: buttons,
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        }
    }

    async handleSurveyAnswer(ctx, session, text) {
        const userId = ctx.from.id;
        const currentStep = session.surveyStep;
        const surveySteps = [/* шаги опроса */];

        if (currentStep >= surveySteps.length) {
            await this.finishSurvey(ctx, userId, session.answers);
            return;
        }

        const stepConfig = surveySteps[currentStep];
        
        if (stepConfig.isTextInput) {
            if (stepConfig.field === 'email' && !text.includes('@')) {
                await ctx.reply('❌ Введите корректный email адрес:');
                return;
            }
            session.answers[stepConfig.field] = text;
        } else {
            if (text !== '🚫 Пропустить вопрос') {
                session.answers[stepConfig.field] = text;
            }
        }

        session.surveyStep++;

        if (session.surveyStep < surveySteps.length) {
            await this.sendSurveyStep(ctx, userId, session.surveyStep);
        } else {
            await this.finishSurvey(ctx, userId, session.answers);
        }
    }

    async finishSurvey(ctx, userId, answers) {
        try {
            // Обновляем профиль пользователя
            await db.query(
                `UPDATE users 
                 SET profile_data = $1, survey_completed = TRUE,
                     subscription_data = $2
                 WHERE id = $3`,
                [answers, {
                    status: 'trial',
                    type: 'trial_7days',
                    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }, userId]
            );

            this.userSessions.delete(userId);

            await ctx.reply(
                `🎉 Спасибо за опрос, ${ctx.from.first_name}!\n\n` +
                `✅ Ваш профиль создан:\n` +
                `🎯 Специализация: ${answers.specialization || 'Не указано'}\n` +
                `🏙️ Город: ${answers.city || 'Не указан'}\n` +
                `📧 Email: ${answers.email || 'Не указан'}\n\n` +
                `🎁 Активирован пробный период на 7 дней!\n\n` +
                `Теперь вы можете пользоваться всеми возможностями Академии АНБ.`,
                { reply_markup: { remove_keyboard: true } }
            );

            await this.showMainMenu(ctx);
        } catch (error) {
            console.error('Ошибка завершения опроса:', error);
            await ctx.reply('❌ Произошла ошибка при сохранении данных.');
        }
    }

    async showMainMenu(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        
        const message = `👋 Добро пожаловать в Академию АНБ, ${user.telegram_data.first_name}!\n\n` +
                       `Выберите раздел для навигации:`;

        const keyboard = [
            ['📱 Навигация', '🎁 Акции'],
            ['💬 Поддержка', '👤 Мой профиль'],
            ['🔄 Продлить подписку']
        ];

        if (user.is_admin) {
            keyboard.push(['🔧 Управление ботом']);
        }

        await ctx.reply(message, {
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true
            }
        });
    }

    async handleMenuButton(ctx, text) {
        const user = await this.getOrCreateUser(ctx.from);
        
        switch (text) {
            case '📱 Навигация':
                await ctx.reply('🎯 Для полного доступа ко всем функциям откройте наше приложение:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { 
                                text: '📱 Открыть приложение', 
                                web_app: { url: config.WEBAPP_URL } 
                            }
                        ]]
                    }
                });
                break;

            case '🎁 Акции':
                await ctx.reply('🔥 Специальные предложения и акции доступны в приложении:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { 
                                text: '🎁 Посмотреть акции', 
                                web_app: { url: `${config.WEBAPP_URL}/promotions` } 
                            }
                        ]]
                    }
                });
                break;

            case '💬 Поддержка':
                await ctx.reply(
                    '💬 Поддержка Академии АНБ\n\n' +
                    '📞 Координатор: @academy_anb\n' +
                    '⏰ ПН-ПТ с 11:00 до 19:00\n' +
                    '📧 academy@anb.ru\n\n' +
                    'Сообщите о проблеме, и мы поможем её решить!'
                );
                break;

            case '👤 Мой профиль':
                await this.showUserProfile(ctx, user);
                break;

            case '🔄 Продлить подписку':
                await this.showSubscriptionPlans(ctx);
                break;

            case '🔧 Управление ботом':
                if (user.is_admin) {
                    await ctx.reply('🔧 Панель управления системой:', {
                        reply_markup: {
                            inline_keyboard: [[
                                { 
                                    text: '📱 Открыть админ-панель', 
                                    web_app: { url: `${config.WEBAPP_URL}/admin` } 
                                }
                            ]]
                        }
                    });
                }
                break;

            default:
                await ctx.reply('🤔 Используйте кнопки меню для навигации');
                await this.showMainMenu(ctx);
        }
    }

    async showUserProfile(ctx, user) {
        const profile = user.profile_data || {};
        const subscription = user.subscription_data || {};
        
        let message = `👤 Ваш профиль\n\n`;
        message += `🎯 Специализация: ${profile.specialization || 'Не указана'}\n`;
        message += `🏙️ Город: ${profile.city || 'Не указан'}\n`;
        message += `📧 Email: ${profile.email || 'Не указан'}\n\n`;
        
        if (subscription.status === 'trial') {
            const endDate = subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('ru-RU') : 'неизвестно';
            message += `🆓 Пробный период до: ${endDate}\n`;
        } else if (subscription.status === 'active') {
            message += `✅ Активная подписка\n`;
        } else {
            message += `❌ Подписка не активна\n`;
        }

        await ctx.reply(message, {
            reply_markup: {
                inline_keyboard: [[
                    { 
                        text: '📱 Открыть приложение', 
                        web_app: { url: config.WEBAPP_URL } 
                    }
                ]]
            }
        });
    }

    async showSubscriptionPlans(ctx) {
        await ctx.reply(
            '🔄 Продление подписки\n\n' +
            '💎 Доступные тарифы:\n\n' +
            '🟢 1 месяц - 2 900 руб.\n' +
            '🔵 3 месяца - 7 500 руб.\n' +
            '🟣 12 месяцев - 24 000 руб.\n\n' +
            '💳 Для оформления откройте приложение:',
            {
                reply_markup: {
                    inline_keyboard: [[
                        { 
                            text: '💳 Оформить подписку', 
                            web_app: { url: `${config.WEBAPP_URL}/subscription` } 
                        }
                    ]]
                }
            }
        );
    }

    async launch() {
        try {
            await this.bot.launch();
            console.log('✅ Telegram Bot запущен');
        } catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
        }
    }
}

const telegramBot = new TelegramBot();

// ==================== API ROUTES ====================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        db: db.connected ? 'connected' : 'disconnected',
        version: '1.0.0'
    });
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                telegramData: user.telegram_data,
                profileData: user.profile_data,
                subscription: user.subscription_data,
                progress: user.progress_data,
                favorites: user.favorites_data,
                isAdmin: user.is_admin,
                surveyCompleted: user.survey_completed
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startServer() {
    try {
        console.log('🚀 Запуск сервера...');
        
        // Подключаем базу данных
        await db.connect();
        
        // Запускаем сервер
        app.listen(config.PORT, '0.0.0.0', () => {
            console.log(`🌐 Сервер запущен на порту ${config.PORT}`);
            console.log(`📱 WebApp: ${config.WEBAPP_URL}`);
            console.log(`🔧 Admin: ${config.WEBAPP_URL}/admin`);
            console.log(`👑 Админы: ${config.ADMIN_IDS.join(', ')}`);
        });

        // Запускаем бота
        await telegramBot.launch();

        console.log('✅ Система полностью готова к работе!');

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Остановка системы...');
    telegramBot.bot.stop('SIGINT');
    if (db.pool) {
        db.pool.end();
    }
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🛑 Остановка системы...');
    telegramBot.bot.stop('SIGTERM');
    if (db.pool) {
        db.pool.end();
    }
    process.exit(0);
});

// Запускаем приложение
startServer();
