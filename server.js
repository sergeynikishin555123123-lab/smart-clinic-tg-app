// server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ ОШИБОК MARKDOWN
import { Telegraf, session, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import os from 'os';
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
    ADMIN_IDS: [898508164, 123456789],
    UPLOAD_PATH: join(__dirname, 'uploads'),
    NODE_ENV: process.env.NODE_ENV || 'production'
};

// ==================== БАЗА ДАННЫХ ====================
class Database {
    constructor() {
        this.client = null;
        this.connected = false;
    }

    async connect() {
        try {
            const { Client } = await import('pg');
            
            this.client = new Client({
                user: 'gen_user',
                host: 'def46fb02c0eac8fefd6f734.twc1.net',
                database: 'default_db',
                password: '5-R;mKGYJ<88?1',
                port: 5432,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 10000,
                idleTimeoutMillis: 30000
            });

            await this.client.connect();
            this.connected = true;
            console.log('✅ База данных подключена');
            
            await this.createTables();
            console.log('✅ Таблицы созданы/проверены');
            
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error);
            this.connected = false;
        }
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB,
                profile_data JSONB DEFAULT '{"specialization": "", "city": "", "email": ""}',
                subscription_data JSONB DEFAULT '{"status": "inactive", "type": null, "end_date": null}',
                progress_data JSONB DEFAULT '{}',
                favorites_data JSONB DEFAULT '{}',
                survey_completed BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

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
                active BOOLEAN DEFAULT TRUE,
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

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

            `CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                stream_date TIMESTAMP,
                live BOOLEAN DEFAULT FALSE,
                participants INTEGER DEFAULT 0,
                type TEXT DEFAULT 'stream',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

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

            `CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                file_url TEXT,
                image_url TEXT,
                material_type TEXT,
                category TEXT,
                downloads INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                event_date TIMESTAMP,
                location TEXT,
                event_type TEXT,
                image_url TEXT,
                registration_url TEXT,
                participants INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS promotions (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                conditions TEXT,
                discount INTEGER DEFAULT 0,
                active BOOLEAN DEFAULT TRUE,
                end_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS chats (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT,
                participants_count INTEGER DEFAULT 0,
                last_message TEXT,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const tableSQL of tables) {
            try {
                await this.client.query(tableSQL);
            } catch (error) {
                console.error(`❌ Ошибка создания таблицы:`, error.message);
            }
        }
    }

    async query(text, params) {
        if (!this.connected) {
            console.log('📊 Используем демо-данные (БД не подключена)');
            return { rows: [], rowCount: 0 };
        }
        try {
            return await this.client.query(text, params);
        } catch (error) {
            console.error('❌ Ошибка запроса к БД:', error);
            return { rows: [], rowCount: 0 };
        }
    }
}

const db = new Database();

// ==================== TELEGRAM BOT ====================
class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.BOT_TOKEN);
        this.userSessions = new Map();
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
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

        // Обработка ошибок
        this.bot.catch((err, ctx) => {
            console.error('❌ Ошибка бота:', err);
            ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.').catch(console.error);
        });
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
            '👋 Добро пожаловать в Академию АНБ, ' + ctx.from.first_name + '!\n\n' +
            '🎯 Давайте познакомимся поближе!\n\n' +
            '1. Ваша специализация:',
            {
                reply_markup: {
                    keyboard: [
                        ['Невролог', 'Реабилитолог'],
                        ['Мануальный терапевт', 'Физиотерапевт'],
                        ['Другая специализация']
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

        // Основное меню
        switch(text) {
            case '📱 Навигация':
                await ctx.reply('🎯 Откройте наше приложение для полного доступа:', {
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
                await ctx.reply('🎁 Специальные предложения:\n\nОткройте приложение для просмотра актуальных акций!', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                });
                break;

            case '❓ Вопрос':
                await ctx.reply(
                    '💬 Задайте вопрос по обучению\n\n' +
                    'Напишите ваш вопрос, и мы обязательно поможем!\n\n' +
                    '📞 Координатор: @academy_anb\n' +
                    '⏰ Время работы: ПН-ПТ 11:00-19:00'
                );
                break;

            case '🔄 Продлить':
                await ctx.reply('💳 Продление подписки\n\nУправляйте подпиской в приложении:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                });
                break;

            case '📢 Анонсы':
                await ctx.reply('📢 Ближайшие мероприятия:\n\nОткройте приложение для просмотра анонсов!', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                });
                break;

            case '🆘 Поддержка':
                await ctx.reply(
                    '🆘 Служба поддержки Академии АНБ\n\n' +
                    '📞 Координатор: @academy_anb\n' +
                    '⏰ Время работы: ПН-ПТ 11:00-19:00\n' +
                    '📧 Email: academy@anb.ru\n\n' +
                    'Мы всегда готовы помочь!'
                );
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
                                ['Новосибирск', 'Екатеринбург'],
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
                    
                    await ctx.reply('3. Ваш email:\n\n(для отправки материалов и уведомлений)', {
                        reply_markup: { remove_keyboard: true }
                    });
                    break;

                case 'email':
                    session.email = text;
                    
                    // Сохраняем данные пользователя
                    await this.updateUserProfile(userId, {
                        specialization: session.specialization,
                        city: session.city,
                        email: session.email
                    });
                    
                    this.userSessions.delete(userId);
                    
                    await ctx.reply(
                        '✅ Отлично! Анкета заполнена!\n\n' +
                        '🏷️ Специализация: ' + session.specialization + '\n' +
                        '🏙️ Город: ' + session.city + '\n' +
                        '📧 Email: ' + session.email + '\n\n' +
                        'Теперь у вас есть полный доступ к Академии АНБ! 🎓'
                    );
                    
                    await this.showMainMenu(ctx);
                    break;
            }
        } catch (error) {
            console.error('Ошибка в handleSurveyStep:', error);
            await ctx.reply('Произошла ошибка. Давайте попробуем еще раз.');
            this.userSessions.delete(userId);
            await this.showMainMenu(ctx);
        }
    }

    async updateUserProfile(userId, profileData) {
        try {
            await db.query(
                'UPDATE users SET profile_data = $1, survey_completed = TRUE WHERE id = $2',
                [profileData, userId]
            );
        } catch (error) {
            console.error('Ошибка обновления профиля:', error);
        }
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
            if (!user.is_admin) {
                await ctx.reply('❌ У вас нет прав доступа к админ-панели');
                return;
            }
            
            await ctx.reply('🔧 Панель администратора', {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📱 Открыть WebApp', web_app: { url: config.WEBAPP_URL } }],
                        [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
                        [{ text: '👥 Пользователи', callback_data: 'admin_users' }]
                    ]
                }
            });
        } catch (error) {
            console.error('Ошибка в handleAdmin:', error);
            await ctx.reply('Произошла ошибка при доступе к админ-панели.');
        }
    }

    async handleHelp(ctx) {
        await ctx.reply(
            '💬 Помощь по Академии АНБ\n\n' +
            '📱 Навигация - полный доступ ко всем функциям\n' +
            '🎁 Акции - специальные предложения\n' +
            '❓ Вопрос - задать вопрос по обучению\n' +
            '🔄 Продлить - управление подпиской\n' +
            '📢 Анонсы - ближайшие мероприятия\n' +
            '🆘 Поддержка - помощь и консультации\n\n' +
            'По всем вопросам: @academy_anb'
        );
    }

    async handleStatus(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            const subscription = user.subscription_data || {};
            
            let statusMessage = '👤 Ваш статус\n\n';
            statusMessage += '🏷️ Имя: ' + user.telegram_data.first_name + '\n';
            statusMessage += '🎯 Уровень: ' + (user.progress_data?.level || 'Начинающий') + '\n\n';
            
            if (subscription.status === 'active') {
                statusMessage += '✅ Подписка активна\n';
                if (subscription.end_date) {
                    statusMessage += '📅 До: ' + new Date(subscription.end_date).toLocaleDateString('ru-RU') + '\n';
                }
            } else {
                statusMessage += '❌ Подписка не активна\n';
            }

            await ctx.reply(statusMessage);
        } catch (error) {
            console.error('Ошибка в handleStatus:', error);
            await ctx.reply('Не удалось загрузить статус. Попробуйте позже.');
        }
    }

    async handleCallbackQuery(ctx) {
        const data = ctx.callbackQuery.data;
        
        try {
            switch(data) {
                case 'admin_stats':
                    const adminUser = await this.getOrCreateUser(ctx.from);
                    if (adminUser.is_admin) {
                        await ctx.reply('📊 Статистика системы\n\nИспользуйте админ-панель в приложении.', {
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
                profile_data: {
                    specialization: '',
                    city: '',
                    email: ''
                },
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
                subscription_data: { status: 'inactive' },
                survey_completed: false
            };
        }
    }

    async launch() {
        try {
            await this.bot.launch();
            console.log('✅ Telegram Bot запущен');
        } catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
            process.exit(1);
        }
    }
}

const telegramBot = new TelegramBot();

// ==================== EXPRESS SERVER ====================
const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(config.UPLOAD_PATH));
app.use(express.static(join(__dirname, 'webapp')));

// ==================== API ROUTES ====================

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        db: db.connected ? 'connected' : 'disconnected'
    });
});

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
                db.query('SELECT * FROM courses WHERE active = TRUE ORDER BY created_at DESC LIMIT 20'),
                db.query('SELECT * FROM podcasts ORDER BY created_at DESC LIMIT 20'),
                db.query('SELECT * FROM streams ORDER BY created_at DESC LIMIT 20'),
                db.query('SELECT * FROM video_tips ORDER BY created_at DESC LIMIT 20'),
                db.query('SELECT * FROM materials ORDER BY created_at DESC LIMIT 20'),
                db.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 20'),
                db.query('SELECT * FROM promotions WHERE active = TRUE ORDER BY created_at DESC LIMIT 20'),
                db.query('SELECT * FROM chats WHERE active = TRUE ORDER BY created_at DESC LIMIT 20')
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
                        rating: 4.8
                    }
                ],
                podcasts: [
                    {
                        id: 1,
                        title: 'АНБ FM: Современная неврология',
                        description: 'Обсуждение новых тенденций в неврологии',
                        duration: '45:20',
                        category: 'Неврология',
                        listens: 234
                    }
                ],
                streams: [
                    {
                        id: 1,
                        title: 'Разбор клинического случая',
                        description: 'Прямой эфир с разбором сложного случая',
                        duration: '1:30:00',
                        participants: 89
                    }
                ],
                videos: [
                    {
                        id: 1,
                        title: 'Шпаргалка: Неврологический осмотр',
                        description: 'Быстрый гайд по основным тестам',
                        duration: '15:30',
                        views: 456
                    }
                ],
                materials: [
                    {
                        id: 1,
                        title: 'МРТ разбор: Рассеянный склероз',
                        description: 'Детальный разбор МРТ с клиническими случаями',
                        material_type: 'mri',
                        downloads: 123
                    }
                ],
                events: [
                    {
                        id: 1,
                        title: 'Конференция: Современная неврология 2024',
                        description: 'Ежегодная конференция с ведущими специалистами',
                        location: 'Москва',
                        participants: 45
                    }
                ],
                promotions: [
                    {
                        id: 1,
                        title: 'Скидка 20% на первую подписку',
                        description: 'Специальное предложение для новых пользователей',
                        discount: 20
                    }
                ],
                chats: [
                    {
                        id: 1,
                        name: 'Общий чат Академии',
                        description: 'Основной чат для общения всех участников',
                        participants_count: 156
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
            console.log(`📱 WebApp доступен`);
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
    if (db.client) {
        db.client.end();
    }
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🛑 Остановка системы...');
    telegramBot.bot.stop('SIGTERM');
    if (db.client) {
        db.client.end();
    }
    process.exit(0);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Необработанное отклонение промиса:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Непойманное исключение:', error);
    process.exit(1);
});

startServer();
