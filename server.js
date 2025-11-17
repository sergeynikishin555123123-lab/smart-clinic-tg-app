// server.js - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ ДЛЯ БЫСТРОГО ДЕПЛОЯ
import { Telegraf, session, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { exec } from 'child_process';
import net from 'net';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL || `https://${process.env.PROJECT_DOMAIN || 'localhost'}:${process.env.PORT || 3000}`,
    ADMIN_IDS: [898508164, 123456789],
    SUPER_ADMIN_ID: 898508164,
    UPLOAD_PATH: join(__dirname, 'uploads'),
    NODE_ENV: process.env.NODE_ENV || 'production',
    SKIP_DEMO_CONTENT: true // Пропускаем создание демо-контента для быстрого старта
};

// ==================== БАЗА ДАННЫХ ====================
class Database {
    constructor() {
        this.client = null;
        this.connected = false;
    }

    async connect() {
        try {
            console.log('🗄️ Подключение к базе данных...');
            
            const { Client } = await import('pg');
            
            this.client = new Client({
                user: 'gen_user',
                host: 'def46fb02c0eac8fefd6f734.twc1.net',
                database: 'default_db',
                password: '5-R;mKGYJ<88?1',
                port: 5432,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 5000, // Уменьшаем таймаут
                idleTimeoutMillis: 30000
            });

            await this.client.connect();
            this.connected = true;
            console.log('✅ База данных подключена');
            
            // Быстрая проверка таблиц без создания демо-контента
            await this.checkTables();
            console.log('✅ Таблицы проверены');
            
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error.message);
            this.connected = false;
            throw error;
        }
    }

    async checkTables() {
        try {
            // Быстрая проверка основных таблиц
            const tables = ['users', 'courses', 'podcasts', 'streams', 'materials', 'events', 'promotions', 'chats'];
            
            for (const table of tables) {
                try {
                    await this.client.query(`SELECT 1 FROM ${table} LIMIT 1`);
                } catch (error) {
                    console.log(`⚠️ Таблица ${table} не существует, будет создана при первом использовании`);
                }
            }

            // Создаем только супер-админа
            await this.createSuperAdmin();
            
        } catch (error) {
            console.error('Ошибка проверки таблиц:', error);
        }
    }

    async createSuperAdmin() {
        try {
            const superAdminCheck = await this.client.query(
                'SELECT * FROM users WHERE id = $1',
                [config.SUPER_ADMIN_ID]
            );

            if (superAdminCheck.rows.length === 0) {
                await this.client.query(
                    `INSERT INTO users (id, telegram_data, profile_data, is_admin, is_super_admin, survey_completed)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        config.SUPER_ADMIN_ID,
                        {
                            first_name: 'Супер Администратор',
                            username: 'superadmin'
                        },
                        {
                            specialization: 'Администратор системы',
                            city: 'Москва',
                            email: 'admin@anb.ru'
                        },
                        true,
                        true,
                        true
                    ]
                );
                console.log('✅ Супер-администратор создан');
            }
        } catch (error) {
            console.error('Ошибка создания супер-админа:', error);
        }
    }

    async query(text, params) {
        if (!this.connected) {
            throw new Error('База данных не подключена');
        }
        try {
            return await this.client.query(text, params);
        } catch (error) {
            console.error('❌ Ошибка запроса к БД:', error);
            throw error;
        }
    }
}

const db = new Database();

// ==================== TELEGRAM BOT ====================
class TelegramBot {
    constructor() {
        this.bot = null;
        this.userSessions = new Map();
        this.isRunning = false;
    }

    async init() {
        try {
            console.log('🤖 Инициализация Telegram бота...');
            this.bot = new Telegraf(config.BOT_TOKEN);
            
            this.bot.use(session());

            // Только основные обработчики для быстрого старта
            this.bot.start(this.handleStart.bind(this));
            this.bot.command('menu', this.handleMenu.bind(this));
            this.bot.command('admin', this.handleAdmin.bind(this));
            this.bot.command('help', this.handleHelp.bind(this));
            this.bot.on('text', this.handleText.bind(this));

            this.bot.catch((err, ctx) => {
                console.error('❌ Ошибка бота:', err);
            });

            console.log('✅ Telegram бот инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации бота:', error);
            throw error;
        }
    }

    async handleStart(ctx) {
        const userId = ctx.from.id;
        console.log(`🚀 Пользователь ${userId} запустил бота`);

        try {
            const user = await this.getOrCreateUser(ctx.from);
            
            if (!user.survey_completed) {
                await this.startSurvey(ctx);
            } else {
                await this.showMainMenu(ctx);
            }
        } catch (error) {
            console.error('Ошибка в handleStart:', error);
            await ctx.reply('Добро пожаловать в Академию АНБ! Используйте кнопки меню для навигации.');
            await this.showMainMenu(ctx);
        }
    }

    async startSurvey(ctx) {
        const userId = ctx.from.id;
        this.userSessions.set(userId, { step: 'specialization' });
        
        await ctx.reply(
            '👋 Добро пожаловать в Академию АНБ!\n\n1. Ваша специализация:',
            {
                reply_markup: {
                    keyboard: [
                        ['Невролог', 'Реабилитолог'],
                        ['Мануальный терапевт', 'Физиотерапевт']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    }

    async handleText(ctx) {
        const userId = ctx.from.id;
        const session = this.userSessions.get(userId);
        const text = ctx.message.text;

        if (session) {
            await this.handleSurveyStep(ctx, session, text);
            return;
        }

        switch(text) {
            case '📱 Навигация':
                await ctx.reply('🎯 Откройте наше приложение:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { 
                                text: '📱 Открыть Академию АНБ', 
                                web_app: { url: config.WEBAPP_URL } 
                            }
                        ]]
                    }
                });
                break;

            case '🎁 Акции':
            case '❓ Вопрос':
            case '🔄 Продлить':
            case '📢 Анонсы':
            case '🆘 Поддержка':
                await ctx.reply('📱 Откройте приложение для полного доступа:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                });
                break;

            default:
                await this.showMainMenu(ctx);
        }
    }

    async handleSurveyStep(ctx, session, text) {
        const userId = ctx.from.id;
        
        try {
            switch(session.step) {
                case 'specialization':
                    session.specialization = text;
                    session.step = 'city';
                    this.userSessions.set(userId, session);
                    
                    await ctx.reply('2. Ваш город:', {
                        reply_markup: {
                            keyboard: [
                                ['Москва', 'Санкт-Петербург'],
                                ['Другой город']
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    });
                    break;

                case 'city':
                    session.city = text;
                    session.step = 'email';
                    this.userSessions.set(userId, session);
                    
                    await ctx.reply('3. Ваш email:', {
                        reply_markup: { remove_keyboard: true }
                    });
                    break;

                case 'email':
                    session.email = text;
                    
                    await this.updateUserProfile(userId, {
                        specialization: session.specialization,
                        city: session.city,
                        email: session.email
                    });
                    
                    this.userSessions.delete(userId);
                    
                    await ctx.reply('✅ Анкета заполнена! Доступ к Академии открыт! 🎓');
                    await this.showMainMenu(ctx);
                    break;
            }
        } catch (error) {
            console.error('Ошибка в опросе:', error);
            await ctx.reply('Произошла ошибка. Давайте попробуем еще раз.');
            this.userSessions.delete(userId);
            await this.showMainMenu(ctx);
        }
    }

    async updateUserProfile(userId, profileData) {
        await db.query(
            'UPDATE users SET profile_data = $1, survey_completed = TRUE WHERE id = $2',
            [profileData, userId]
        );
    }

    async showMainMenu(ctx) {
        await ctx.reply('🎯 Главное меню Академии АНБ', {
            reply_markup: {
                keyboard: [
                    ['📱 Навигация', '🎁 Акции'],
                    ['❓ Вопрос', '🔄 Продлить'],
                    ['📢 Анонсы', '🆘 Поддержка']
                ],
                resize_keyboard: true
            }
        });
    }

    async handleMenu(ctx) {
        await this.showMainMenu(ctx);
    }

    async handleAdmin(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            if (!user.is_admin && !user.is_super_admin) {
                await ctx.reply('❌ Нет прав доступа');
                return;
            }
            
            await ctx.reply('🔧 Админ-панель доступна в приложении:', {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть WebApp', web_app: { url: config.WEBAPP_URL } }
                    ]]
                }
            });
        } catch (error) {
            console.error('Ошибка админ-панели:', error);
            await ctx.reply('Ошибка доступа к админ-панели.');
        }
    }

    async handleHelp(ctx) {
        await ctx.reply(
            '💬 Помощь по Академии АНБ\n\n' +
            '📱 Навигация - полный доступ\n' +
            '🎁 Акции - предложения\n' +
            '❓ Вопрос - помощь\n' +
            '🔄 Продлить - подписка\n' +
            '📢 Анонсы - мероприятия\n' +
            '🆘 Поддержка - консультации\n\n' +
            'По всем вопросам: @academy_anb'
        );
    }

    async getOrCreateUser(telegramUser) {
        try {
            const result = await db.query(
                'SELECT * FROM users WHERE id = $1',
                [telegramUser.id]
            );

            if (result.rows.length > 0) {
                return result.rows[0];
            }

            const isSuperAdmin = telegramUser.id === config.SUPER_ADMIN_ID;
            const isAdmin = isSuperAdmin || config.ADMIN_IDS.includes(telegramUser.id);

            const newUser = {
                id: telegramUser.id,
                telegram_data: {
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name || '',
                    username: telegramUser.username
                },
                profile_data: {
                    specialization: '',
                    city: '',
                    email: ''
                },
                subscription_data: {
                    status: 'inactive'
                },
                progress_data: {},
                favorites_data: {},
                survey_completed: false,
                is_admin: isAdmin,
                is_super_admin: isSuperAdmin
            };

            await db.query(
                `INSERT INTO users (id, telegram_data, profile_data, subscription_data, progress_data, favorites_data, is_admin, is_super_admin)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [newUser.id, newUser.telegram_data, newUser.profile_data, 
                 newUser.subscription_data, newUser.progress_data, newUser.favorites_data, 
                 newUser.is_admin, newUser.is_super_admin]
            );

            console.log(`✅ Новый пользователь: ${telegramUser.first_name}`);
            return newUser;

        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            throw error;
        }
    }

    async launch() {
        try {
            if (!this.bot) {
                await this.init();
            }

            console.log('🚀 Запуск Telegram бота...');
            await this.bot.launch();
            this.isRunning = true;
            console.log('✅ Telegram Bot запущен');
            
        } catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
            throw error;
        }
    }
}

const telegramBot = new TelegramBot();

// ==================== EXPRESS SERVER ====================
const app = express();

// Минимальные middleware для быстрого старта
app.use(helmet({
    contentSecurityPolicy: false, // Упрощаем для быстрого старта
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'webapp')));

// ==================== API ROUTES ====================

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        db: db.connected
    });
});

app.post('/api/user', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.telegram_data?.first_name,
                lastName: user.telegram_data?.last_name,
                specialization: user.profile_data?.specialization,
                city: user.profile_data?.city,
                email: user.profile_data?.email,
                subscription: user.subscription_data,
                progress: user.progress_data,
                favorites: user.favorites_data,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                joinedAt: user.created_at,
                surveyCompleted: user.survey_completed
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/content', async (req, res) => {
    try {
        // Минимальный контент для быстрого старта
        const content = {
            courses: [],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: [],
            promotions: [],
            chats: []
        };

        // Пробуем загрузить реальные данные, но не блокируем старт
        try {
            const coursesResult = await db.query('SELECT * FROM courses WHERE active = TRUE LIMIT 10');
            content.courses = coursesResult.rows;
        } catch (error) {
            console.log('⚠️ Курсы еще не загружены');
        }

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Content API Error:', error);
        res.json({ success: true, data: {
            courses: [], podcasts: [], streams: [], videos: [],
            materials: [], events: [], promotions: [], chats: []
        }});
    }
});

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== БЫСТРЫЙ ЗАПУСК СЕРВЕРА ====================
async function startServer() {
    try {
        console.log('🚀 Быстрый запуск сервера Академии АНБ...');
        
        // 1. Быстрое подключение к БД
        await db.connect();
        
        // 2. Быстрый запуск сервера
        const server = app.listen(config.PORT, '0.0.0.0', () => {
            console.log(`🌐 Сервер запущен на порту ${config.PORT}`);
            console.log(`📱 WebApp: ${config.WEBAPP_URL}`);
            console.log(`🛠️ Супер-админ: ${config.SUPER_ADMIN_ID}`);
        });

        // 3. Запуск бота в фоне (не блокирует старт)
        telegramBot.launch().catch(error => {
            console.error('❌ Бот запустится позже:', error.message);
        });

        console.log('✅ Система готова! Бот запускается...');
        
        // 4. Фоновая инициализация контента
        setTimeout(async () => {
            try {
                await initializeContentInBackground();
            } catch (error) {
                console.log('⚠️ Фоновая инициализация контента завершилась с ошибкой');
            }
        }, 5000);

    } catch (error) {
        console.error('❌ Ошибка запуска:', error);
        process.exit(1);
    }
}

// Фоновая инициализация контента
async function initializeContentInBackground() {
    console.log('🔄 Фоновая инициализация контента...');
    
    try {
        // Проверяем и создаем недостающие таблицы
        await createMissingTables();
        
        // Создаем минимальный демо-контент если нужно
        await createMinimalDemoContent();
        
        console.log('✅ Фоновая инициализация завершена');
    } catch (error) {
        console.error('❌ Ошибка фоновой инициализации:', error);
    }
}

async function createMissingTables() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) DEFAULT 0,
            duration TEXT,
            modules INTEGER DEFAULT 1,
            category TEXT,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS podcasts (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            duration TEXT,
            category TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )`
    ];

    for (const tableSQL of tables) {
        try {
            await db.query(tableSQL);
        } catch (error) {
            console.log(`⚠️ Таблица уже существует`);
        }
    }
}

async function createMinimalDemoContent() {
    try {
        // Только самый необходимый контент
        const coursesCheck = await db.query('SELECT COUNT(*) FROM courses');
        if (parseInt(coursesCheck.rows[0].count) === 0) {
            console.log('📚 Создаем минимальный демо-контент...');
            
            await db.query(
                `INSERT INTO courses (title, description, price, duration, modules, category)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['Мануальные техники в практике', 'Основы мануальных методик', 15000, '12 часов', 6, 'Мануальные техники']
            );
            
            console.log('✅ Минимальный контент создан');
        }
    } catch (error) {
        console.log('⚠️ Демо-контент будет создан позже');
    }
}

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Остановка системы...');
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🛑 Остановка системы...');
    process.exit(0);
});

// Быстрый старт
startServer();
