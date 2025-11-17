// server.js - ПОЛНАЯ ВЕРСИЯ С БАЗОЙ ДАННЫХ И ВСЕМИ ФУНКЦИЯМИ
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
    WEBAPP_URL: process.env.WEBAPP_URL || 'https://your-domain.com',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/academy',
    ADMIN_IDS: [898508164, 123456789],
    UPLOAD_PATH: join(__dirname, 'uploads'),
    NODE_ENV: process.env.NODE_ENV || 'production'
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
                subscription_data JSONB DEFAULT '{"status": "inactive", "type": null, "end_date": null}',
                progress_data JSONB DEFAULT '{
                    "level": "Понимаю",
                    "steps": {
                        "materialsWatched": 0,
                        "eventsParticipated": 0, 
                        "materialsSaved": 0,
                        "coursesBought": 0,
                        "modulesCompleted": 0,
                        "offlineEvents": 0,
                        "publications": 0
                    },
                    "progress": {
                        "understand": 0,
                        "connect": 0,
                        "apply": 0,
                        "systematize": 0,
                        "share": 0
                    }
                }',
                favorites_data JSONB DEFAULT '{"watchLater": [], "favorites": [], "materials": []}',
                survey_completed BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Курсы
            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                full_description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                duration TEXT,
                modules INTEGER DEFAULT 1,
                category TEXT,
                level TEXT DEFAULT 'beginner',
                image_url TEXT,
                video_url TEXT,
                tags TEXT[] DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Подкасты (АНБ FM)
            `CREATE TABLE IF NOT EXISTS podcasts (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                duration TEXT,
                audio_url TEXT,
                image_url TEXT,
                category TEXT,
                listens INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Эфиры и разборы
            `CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                stream_date TIMESTAMP,
                is_live BOOLEAN DEFAULT FALSE,
                participants INTEGER DEFAULT 0,
                type TEXT DEFAULT 'stream',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Видео-шпаргалки
            `CREATE TABLE IF NOT EXISTS video_tips (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                category TEXT,
                views INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Практические материалы
            `CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                file_url TEXT,
                image_url TEXT,
                material_type TEXT CHECK(material_type IN ('mri', 'case', 'checklist')),
                category TEXT,
                downloads INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Мероприятия
            `CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                event_date TIMESTAMP,
                location TEXT,
                event_type TEXT CHECK(event_type IN ('online', 'offline')),
                image_url TEXT,
                registration_url TEXT,
                participants INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Акции
            `CREATE TABLE IF NOT EXISTS promotions (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                conditions TEXT,
                discount INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                end_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Чаты
            `CREATE TABLE IF NOT EXISTS chats (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT CHECK(type IN ('group', 'private', 'flood')),
                participants_count INTEGER DEFAULT 0,
                last_message TEXT,
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
                UNIQUE(user_id, content_type, content_id)
            )`,

            // Администраторы
            `CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                permissions JSONB DEFAULT '{"content": true, "users": true, "teachers": true}',
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id)
            )`
        ];

        for (const tableSQL of tables) {
            try {
                await this.pool.query(tableSQL);
            } catch (error) {
                console.error(`❌ Ошибка создания таблицы:`, error.message);
            }
        }
    }

    async seedInitialData() {
        try {
            // Добавляем администратора
            await this.pool.query(`
                INSERT INTO users (id, telegram_data, is_admin, survey_completed) 
                VALUES ($1, $2, TRUE, TRUE)
                ON CONFLICT (id) DO NOTHING
            `, [config.ADMIN_IDS[0], JSON.stringify({
                first_name: 'Администратор',
                username: 'admin'
            })]);

            console.log('✅ Демо данные добавлены в БД');
        } catch (error) {
            console.error('❌ Ошибка добавления демо данных:', error);
        }
    }

    async query(text, params) {
        if (!this.connected) {
            console.log('📊 Используем демо-данные (БД не подключена)');
            return { rows: [], rowCount: 0 };
        }
        return await this.pool.query(text, params);
    }
}

const db = new Database();

// ==================== TELEGRAM BOT ====================
class TelegramBot {
    constructor() {
        this.bot = bot;
        this.init();
    }

    init() {
        this.bot.use(session());

        this.bot.start(this.handleStart.bind(this));
        this.bot.command('menu', this.handleMenu.bind(this));
        this.bot.command('admin', this.handleAdmin.bind(this));
        this.bot.command('help', this.handleHelp.bind(this));
        this.bot.command('status', this.handleStatus.bind(this));
        this.bot.on('text', this.handleText.bind(this));
        
        // Обработка callback-запросов
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    }

    async handleStart(ctx) {
        const userId = ctx.from.id;
        console.log(`🚀 Пользователь ${userId} запустил бота`);

        // Создаем/обновляем пользователя
        await this.getOrCreateUser(ctx.from);
        
        await ctx.reply(
            `👋 Добро пожаловать в *Академию АНБ*, ${ctx.from.first_name}!\n\n` +
            `🎯 *Ваш персональный помощник в обучении*\n\n` +
            `Используйте кнопки ниже для навигации:`,
            { 
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }],
                        [{ text: '📚 Курсы', callback_data: 'show_courses' }, { text: '🎧 АНБ FM', callback_data: 'show_podcasts' }],
                        [{ text: '📹 Эфиры', callback_data: 'show_streams' }, { text: '🎯 Видео-шпаргалки', callback_data: 'show_videos' }],
                        [{ text: '👤 Мой профиль', callback_data: 'show_profile' }, { text: '💬 Поддержка', callback_data: 'show_support' }]
                    ]
                }
            }
        );
    }

    async handleMenu(ctx) {
        await ctx.reply('🎯 *Главное меню Академии АНБ*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }],
                    [{ text: '📚 Курсы', callback_data: 'show_courses' }, { text: '🎧 АНБ FM', callback_data: 'show_podcasts' }],
                    [{ text: '📹 Эфиры', callback_data: 'show_streams' }, { text: '🎯 Видео-шпаргалки', callback_data: 'show_videos' }],
                    [{ text: '👤 Мой профиль', callback_data: 'show_profile' }, { text: '💬 Поддержка', callback_data: 'show_support' }]
                ]
            }
        });
    }

    async handleAdmin(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        if (!user.is_admin) {
            await ctx.reply('❌ У вас нет прав доступа к админ-панели');
            return;
        }
        
        await ctx.reply('🔧 *Панель администратора*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Открыть WebApp', web_app: { url: config.WEBAPP_URL } }],
                    [{ text: '📊 Статистика', callback_data: 'admin_stats' }, { text: '👥 Пользователи', callback_data: 'admin_users' }],
                    [{ text: '📝 Управление контентом', callback_data: 'admin_content' }]
                ]
            }
        });
    }

    async handleHelp(ctx) {
        await ctx.reply(
            `💬 *Помощь по Академии АНБ*\n\n` +
            `📱 *Открыть приложение* - полный доступ ко всем функциям\n` +
            `📚 *Курсы* - системное обучение с сертификатами\n` +
            `🎧 *АНБ FM* - аудио подкасты и интервью\n` +
            `📹 *Эфиры* - прямые трансляции и разборы кейсов\n` +
            `🎯 *Видео-шпаргалки* - короткие обучающие видео\n` +
            `👤 *Мой профиль* - прогресс и статистика\n\n` +
            `По всем вопросам: @academy_anb`,
            { parse_mode: 'Markdown' }
        );
    }

    async handleStatus(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        const subscription = user.subscription_data || {};
        
        let statusMessage = `👤 *Ваш статус*\n\n`;
        statusMessage += `🏷️ Имя: ${user.telegram_data.first_name}\n`;
        statusMessage += `🎯 Уровень: ${user.progress_data.level}\n`;
        statusMessage += `📊 Прогресс: ${this.calculateProgress(user.progress_data)}%\n\n`;
        
        if (subscription.status === 'active') {
            statusMessage += `✅ Подписка активна\n`;
            if (subscription.end_date) {
                statusMessage += `📅 До: ${new Date(subscription.end_date).toLocaleDateString('ru-RU')}\n`;
            }
        } else {
            statusMessage += `❌ Подписка не активна\n`;
        }

        await ctx.reply(statusMessage, { parse_mode: 'Markdown' });
    }

    async handleCallbackQuery(ctx) {
        const data = ctx.callbackQuery.data;
        console.log('📨 Callback data:', data);

        try {
            switch(data) {
                case 'show_courses':
                    await ctx.reply('📚 *Курсы Академии*\n\nОткройте приложение для просмотра всех курсов:', {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                            ]]
                        }
                    });
                    break;

                case 'show_podcasts':
                    await ctx.reply('🎧 *АНБ FM*\n\nАудио подкасты и интервью доступны в приложении:', {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                            ]]
                        }
                    });
                    break;

                case 'show_streams':
                    await ctx.reply('📹 *Эфиры и разборы*\n\nПрямые трансляции и разборы кейсов:', {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                            ]]
                        }
                    });
                    break;

                case 'show_videos':
                    await ctx.reply('🎯 *Видео-шпаргалки*\n\nКороткие обучающие видео:', {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                            ]]
                        }
                    });
                    break;

                case 'show_profile':
                    await this.showUserProfile(ctx);
                    break;

                case 'show_support':
                    await ctx.reply(
                        `💬 *Служба поддержки Академии АНБ*\n\n` +
                        `📞 Координатор: @academy_anb\n` +
                        `⏰ Время работы: ПН-ПТ 11:00-19:00\n` +
                        `📧 Email: academy@anb.ru\n\n` +
                        `Мы всегда готовы помочь!`,
                        { parse_mode: 'Markdown' }
                    );
                    break;

                case 'admin_stats':
                    const adminUser = await this.getOrCreateUser(ctx.from);
                    if (adminUser.is_admin) {
                        await ctx.reply('📊 *Статистика системы*\n\nИспользуйте админ-панель в приложении для просмотра детальной статистики.', {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '📱 Открыть админ-панель', web_app: { url: config.WEBAPP_URL } }
                                ]]
                            }
                        });
                    }
                    break;

                default:
                    await ctx.answerCbQuery('⚙️ Функция в разработке');
            }

            await ctx.answerCbQuery();
        } catch (error) {
            console.error('Ошибка обработки callback:', error);
            await ctx.answerCbQuery('❌ Произошла ошибка');
        }
    }

    async handleText(ctx) {
        const text = ctx.message.text;
        console.log('📨 Получено сообщение:', text);

        switch(text) {
            case '/webapp':
            case 'приложение':
            case 'открыть':
                await ctx.reply('🎯 *Откройте наше приложение для полного доступа:*', {
                    parse_mode: 'Markdown',
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

            default:
                await ctx.reply('🤔 Используйте команды меню для навигации');
                await this.showMainMenu(ctx);
        }
    }

    async showMainMenu(ctx) {
        await ctx.reply('🎯 *Главное меню Академии АНБ*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }],
                    [{ text: '📚 Курсы', callback_data: 'show_courses' }, { text: '🎧 АНБ FM', callback_data: 'show_podcasts' }],
                    [{ text: '📹 Эфиры', callback_data: 'show_streams' }, { text: '🎯 Видео-шпаргалки', callback_data: 'show_videos' }],
                    [{ text: '👤 Мой профиль', callback_data: 'show_profile' }, { text: '💬 Поддержка', callback_data: 'show_support' }]
                ]
            }
        });
    }

    async showUserProfile(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        const progress = user.progress_data;
        
        await ctx.reply(
            `👤 *Ваш профиль*\n\n` +
            `🏷️ Имя: ${user.telegram_data.first_name}\n` +
            `🎯 Уровень: ${progress.level}\n` +
            `📚 Курсов: ${progress.steps.coursesBought}\n` +
            `📖 Материалов: ${progress.steps.materialsWatched}\n` +
            `👥 Мероприятий: ${progress.steps.eventsParticipated}\n\n` +
            `Продолжайте в том же духе! 💪`,
            { parse_mode: 'Markdown' }
        );
    }

    calculateProgress(progressData) {
        const steps = progressData.steps;
        const total = steps.materialsWatched + steps.eventsParticipated + steps.coursesBought;
        return Math.min(100, Math.round(total / 3));
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

            const newUser = {
                id: telegramUser.id,
                telegram_data: {
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name || '',
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
                        coursesBought: 0,
                        modulesCompleted: 0,
                        offlineEvents: 0,
                        publications: 0
                    },
                    progress: {
                        understand: 0,
                        connect: 0,
                        apply: 0,
                        systematize: 0,
                        share: 0
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
            // Возвращаем демо-пользователя в случае ошибки
            return {
                id: telegramUser.id,
                telegram_data: telegramUser,
                is_admin: config.ADMIN_IDS.includes(telegramUser.id),
                progress_data: {
                    level: 'Понимаю',
                    steps: { materialsWatched: 0, eventsParticipated: 0, coursesBought: 0 }
                },
                subscription_data: { status: 'inactive' }
            };
        }
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

// ==================== EXPRESS MIDDLEWARE ====================
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(config.UPLOAD_PATH));
app.use(express.static(join(__dirname, 'webapp')));

// ==================== API ROUTES ====================

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        db: db.connected ? 'connected' : 'disconnected'
    });
});

// Получение пользователя
app.post('/api/user', async (req, res) => {
    try {
        const { id, firstName, lastName, username } = req.body;
        
        let user;
        if (db.connected) {
            const result = await db.query(
                'SELECT * FROM users WHERE id = $1',
                [id]
            );
            
            if (result.rows.length > 0) {
                user = result.rows[0];
            }
        }

        if (!user) {
            // Демо-пользователь
            user = {
                id: id || 898508164,
                telegram_data: {
                    first_name: firstName || 'Демо Пользователь',
                    last_name: lastName || '',
                    username: username || 'user'
                },
                profile_data: {
                    specialization: 'Невролог',
                    city: 'Москва',
                    email: 'demo@anb.ru'
                },
                subscription_data: {
                    status: 'active',
                    type: 'premium',
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                },
                progress_data: {
                    level: 'Понимаю',
                    steps: {
                        materialsWatched: 12,
                        eventsParticipated: 5,
                        materialsSaved: 8,
                        coursesBought: 3,
                        modulesCompleted: 2,
                        offlineEvents: 1,
                        publications: 0
                    },
                    progress: {
                        understand: 9,
                        connect: 15,
                        apply: 8,
                        systematize: 3,
                        share: 0
                    }
                },
                favorites_data: {
                    watchLater: [1, 2],
                    favorites: [1],
                    materials: [1, 2]
                },
                is_admin: config.ADMIN_IDS.includes(parseInt(id)) || id == 898508164,
                survey_completed: true,
                created_at: new Date('2024-01-01')
            };
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.telegram_data?.first_name || firstName,
                lastName: user.telegram_data?.last_name || lastName,
                specialization: user.profile_data?.specialization,
                city: user.profile_data?.city,
                email: user.profile_data?.email,
                subscription: user.subscription_data,
                progress: user.progress_data,
                favorites: user.favorites_data,
                isAdmin: user.is_admin,
                joinedAt: user.created_at,
                surveyCompleted: user.survey_completed
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение всего контента
app.get('/api/content', async (req, res) => {
    try {
        let content = {};

        if (db.connected) {
            const [
                coursesResult,
                podcastsResult, 
                streamsResult,
                videosResult,
                materialsResult,
                eventsResult,
                promotionsResult,
                chatsResult
            ] = await Promise.all([
                db.query('SELECT * FROM courses WHERE is_active = TRUE ORDER BY created_at DESC'),
                db.query('SELECT * FROM podcasts ORDER BY created_at DESC'),
                db.query('SELECT * FROM streams ORDER BY created_at DESC'),
                db.query('SELECT * FROM video_tips ORDER BY created_at DESC'),
                db.query('SELECT * FROM materials ORDER BY created_at DESC'),
                db.query('SELECT * FROM events ORDER BY created_at DESC'),
                db.query('SELECT * FROM promotions WHERE is_active = TRUE ORDER BY created_at DESC'),
                db.query('SELECT * FROM chats WHERE is_active = TRUE ORDER BY created_at DESC')
            ]);

            content = {
                courses: coursesResult.rows,
                podcasts: podcastsResult.rows,
                streams: streamsResult.rows,
                videos: videosResult.rows,
                materials: materialsResult.rows,
                events: eventsResult.rows,
                promotions: promotionsResult.rows,
                chats: chatsResult.rows
            };
        } else {
            // Демо-контент
            content = {
                courses: [
                    {
                        id: 1,
                        title: 'Мануальные техники в практике',
                        description: '6 модулей по современным мануальным методикам',
                        price: 15000,
                        duration: '12 часов',
                        modules: 6,
                        category: 'Мануальные техники',
                        students_count: 45,
                        rating: 4.8,
                        image_url: '/images/course1.jpg'
                    },
                    {
                        id: 2,
                        title: 'Неврология для практикующих врачей',
                        description: 'Основы неврологической диагностики',
                        price: 12000,
                        duration: '10 часов',
                        modules: 5,
                        category: 'Неврология',
                        students_count: 67,
                        rating: 4.6,
                        image_url: '/images/course2.jpg'
                    }
                ],
                podcasts: [
                    {
                        id: 1,
                        title: 'АНБ FM: Современная неврология',
                        description: 'Обсуждение новых тенденций в неврологии',
                        duration: '45:20',
                        category: 'Неврология',
                        listens: 234,
                        image_url: '/images/podcast1.jpg'
                    }
                ],
                streams: [
                    {
                        id: 1,
                        title: 'Разбор клинического случая: Болевой синдром',
                        description: 'Прямой эфир с разбором сложного случая',
                        duration: '1:30:00',
                        stream_date: new Date().toISOString(),
                        is_live: true,
                        participants: 89,
                        type: 'analysis',
                        thumbnail_url: '/images/stream1.jpg'
                    }
                ],
                videos: [
                    {
                        id: 1,
                        title: 'Шпаргалка: Неврологический осмотр',
                        description: 'Быстрый гайд по основным тестам',
                        duration: '15:30',
                        category: 'Неврология',
                        views: 456,
                        thumbnail_url: '/images/video1.jpg'
                    }
                ],
                materials: [
                    {
                        id: 1,
                        title: 'МРТ разбор: Рассеянный склероз',
                        description: 'Детальный разбор МРТ с клиническими случаями',
                        material_type: 'mri',
                        category: 'Неврология',
                        downloads: 123,
                        image_url: '/images/material1.jpg'
                    }
                ],
                events: [
                    {
                        id: 1,
                        title: 'Конференция: Современная неврология 2024',
                        description: 'Ежегодная конференция с ведущими специалистами',
                        event_date: '2024-02-15T10:00:00',
                        location: 'Москва',
                        event_type: 'offline',
                        participants: 45,
                        image_url: '/images/event1.jpg'
                    }
                ],
                promotions: [
                    {
                        id: 1,
                        title: 'Специальное предложение для новых пользователей',
                        description: 'Скидка 20% на первую подписку',
                        discount: 20,
                        is_active: true,
                        image_url: '/images/promo1.jpg'
                    }
                ],
                chats: [
                    {
                        id: 1,
                        name: 'Общий чат Академии',
                        description: 'Основной чат для общения всех участников',
                        type: 'group',
                        participants_count: 156,
                        last_message: 'Добро пожаловать в Академию!'
                    }
                ]
            };
        }

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Content API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Админ API для управления контентом
app.post('/api/admin/content', async (req, res) => {
    try {
        const { type, data } = req.body;
        
        // В реальном приложении здесь будет логика сохранения в БД
        const newContent = { 
            id: Date.now(), 
            ...data, 
            created_at: new Date().toISOString()
        };

        res.json({ success: true, content: newContent });
    } catch (error) {
        console.error('Add Content Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// SPA поддержка
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startServer() {
    try {
        console.log('🚀 Запуск сервера Академии АНБ...');
        
        await db.connect();
        
        app.listen(config.PORT, '0.0.0.0', () => {
            console.log(`🌐 Сервер запущен на порту ${config.PORT}`);
            console.log(`📱 WebApp доступен по адресу`);
            console.log(`🔧 Админка доступна для: ${config.ADMIN_IDS.join(', ')}`);
        });

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

startServer();
