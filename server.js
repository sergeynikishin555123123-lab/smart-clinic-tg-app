// server.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ ВЕРСИЯ
import { Telegraf, session, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL || `http://localhost:${process.env.PORT || 3000}`,
    ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(Number) : [898508164],
    SUPER_ADMIN_ID: parseInt(process.env.SUPER_ADMIN_ID) || 898508164,
    UPLOAD_PATH: join(__dirname, 'uploads'),
    NODE_ENV: process.env.NODE_ENV || 'production'
};

console.log('🚀 Запуск Академии АНБ версии 2.0...');

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
                connectionTimeoutMillis: 15000
            });

            await this.client.connect();
            this.connected = true;
            console.log('✅ База данных подключена');
            
            await this.createTables();
            await this.initializeDefaultData();
            
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error);
            throw error;
        }
    }

    async createTables() {
        const tables = [
            // Пользователи
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB NOT NULL,
                profile_data JSONB DEFAULT '{"specialization": "", "city": "", "email": ""}',
                subscription_data JSONB DEFAULT '{"status": "inactive", "type": "free", "end_date": null}',
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
                favorites_data JSONB DEFAULT '{
                    "courses": [],
                    "podcasts": [],
                    "streams": [],
                    "videos": [],
                    "materials": []
                }',
                survey_completed BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
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
                active BOOLEAN DEFAULT TRUE,
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Подкасты
            `CREATE TABLE IF NOT EXISTS podcasts (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                duration TEXT,
                audio_url TEXT,
                image_url TEXT,
                category TEXT,
                listens INTEGER DEFAULT 0,
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Эфиры
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
                created_by BIGINT,
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
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Материалы
            `CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                file_url TEXT,
                image_url TEXT,
                material_type TEXT,
                category TEXT,
                downloads INTEGER DEFAULT 0,
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Мероприятия
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
                created_by BIGINT,
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
                active BOOLEAN DEFAULT TRUE,
                end_date TIMESTAMP,
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Чаты
            `CREATE TABLE IF NOT EXISTS chats (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT,
                image_url TEXT,
                participants_count INTEGER DEFAULT 0,
                last_message TEXT,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Прогресс пользователей
            `CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                content_type TEXT,
                content_id INTEGER,
                progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                last_activity TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, content_type, content_id)
            )`,

            // Платежи
            `CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                amount DECIMAL(10,2),
                currency TEXT DEFAULT 'RUB',
                status TEXT DEFAULT 'pending',
                payment_method TEXT,
                subscription_type TEXT,
                subscription_duration INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Уведомления
            `CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                title TEXT NOT NULL,
                message TEXT,
                type TEXT,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Загрузки файлов
            `CREATE TABLE IF NOT EXISTS uploads (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                original_name TEXT,
                file_path TEXT,
                file_size INTEGER,
                mime_type TEXT,
                upload_type TEXT,
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const tableSQL of tables) {
            try {
                await this.client.query(tableSQL);
            } catch (error) {
                console.error(`Ошибка создания таблицы:`, error.message);
            }
        }
    }

    async initializeDefaultData() {
        try {
            // Создаем супер-админа
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
                        JSON.stringify({
                            first_name: 'Супер Администратор',
                            username: 'superadmin'
                        }),
                        JSON.stringify({
                            specialization: 'Администратор системы',
                            city: 'Москва',
                            email: 'admin@anb.ru'
                        }),
                        true,
                        true,
                        true
                    ]
                );
                console.log('✅ Супер-администратор создан');
            }

            // Создаем демо-контент
            await this.createDemoContent();
            
        } catch (error) {
            console.error('Ошибка инициализации данных:', error);
        }
    }

    async createDemoContent() {
        try {
            // Проверяем есть ли курсы
            const coursesCheck = await this.client.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCheck.rows[0].count) === 0) {
                console.log('📚 Создаем демо-контент...');
                
                const demoContent = {
                    courses: [
                        {
                            title: 'Мануальные техники в практике',
                            description: '6 модулей по современным мануальным методикам',
                            full_description: 'Комплексный курс по мануальным техникам для практикующих врачей. Изучите современные подходы к диагностике и лечению.',
                            price: 15000,
                            duration: '12 часов',
                            modules: 6,
                            category: 'Мануальные техники',
                            level: 'advanced',
                            students_count: 45,
                            rating: 4.8,
                            created_by: config.SUPER_ADMIN_ID
                        },
                        {
                            title: 'Неврология для практикующих врачей',
                            description: 'Основы неврологической диагностики',
                            full_description: 'Фундаментальный курс по неврологии с акцентом на практическое применение.',
                            price: 12000,
                            duration: '10 часов',
                            modules: 5,
                            category: 'Неврология',
                            level: 'intermediate',
                            students_count: 67,
                            rating: 4.6,
                            created_by: config.SUPER_ADMIN_ID
                        }
                    ],
                    podcasts: [
                        {
                            title: 'АНБ FM: Современная неврология',
                            description: 'Обсуждение новых тенденций в неврологии',
                            duration: '45:20',
                            category: 'Неврология',
                            listens: 234,
                            created_by: config.SUPER_ADMIN_ID
                        }
                    ],
                    streams: [
                        {
                            title: 'Разбор клинического случая: Болевой синдром',
                            description: 'Прямой эфир с разбором сложного случая',
                            duration: '1:30:00',
                            stream_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            live: true,
                            participants: 89,
                            type: 'analysis',
                            created_by: config.SUPER_ADMIN_ID
                        }
                    ],
                    videos: [
                        {
                            title: 'Шпаргалка: Неврологический осмотр',
                            description: 'Быстрый гайд по основным тестам',
                            duration: '15:30',
                            category: 'Неврология',
                            views: 456,
                            created_by: config.SUPER_ADMIN_ID
                        }
                    ],
                    materials: [
                        {
                            title: 'МРТ разбор: Рассеянный склероз',
                            description: 'Детальный разбор МРТ с клиническими случаями',
                            material_type: 'mri',
                            category: 'Неврология',
                            downloads: 123,
                            created_by: config.SUPER_ADMIN_ID
                        }
                    ],
                    events: [
                        {
                            title: 'Конференция: Современная неврология 2024',
                            description: 'Ежегодная конференция с ведущими специалистами',
                            event_date: new Date('2024-02-15T10:00:00'),
                            location: 'Москва',
                            event_type: 'offline',
                            participants: 45,
                            created_by: config.SUPER_ADMIN_ID
                        }
                    ],
                    promotions: [
                        {
                            title: 'Скидка 20% на первую подписку',
                            description: 'Специальное предложение для новых пользователей',
                            discount: 20,
                            active: true,
                            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                            created_by: config.SUPER_ADMIN_ID
                        }
                    ],
                    chats: [
                        {
                            name: 'Общий чат Академии',
                            description: 'Основной чат для общения всех участников',
                            type: 'group',
                            participants_count: 156,
                            last_message: 'Добро пожаловать в Академию!'
                        }
                    ]
                };

                // Вставляем демо-контент
                for (const [table, items] of Object.entries(demoContent)) {
                    for (const item of items) {
                        const keys = Object.keys(item);
                        const values = Object.values(item);
                        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                        
                        await this.client.query(
                            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                            values
                        );
                    }
                }

                console.log('✅ Демо-контент создан');
            }
        } catch (error) {
            console.error('Ошибка создания демо-контента:', error);
        }
    }

    async query(text, params) {
        if (!this.connected) {
            throw new Error('База данных не подключена');
        }
        return await this.client.query(text, params);
    }
}

const db = new Database();

// ==================== TELEGRAM BOT ====================
class TelegramBot {
    constructor() {
        this.bot = null;
        this.init();
    }

    init() {
        try {
            console.log('🤖 Инициализация Telegram бота...');
            
            if (!config.BOT_TOKEN) {
                console.log('⚠️ Бот-токен не настроен');
                return;
            }
            
            this.bot = new Telegraf(config.BOT_TOKEN);
            this.setupHandlers();
            console.log('✅ Telegram бот инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации бота:', error);
        }
    }

    setupHandlers() {
        this.bot.start(this.handleStart.bind(this));
        this.bot.command('menu', this.handleMenu.bind(this));
        this.bot.command('admin', this.handleAdmin.bind(this));
        
        this.bot.launch().then(() => {
            console.log('✅ Telegram Bot запущен');
        }).catch(console.error);
    }

    async handleStart(ctx) {
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
        if (!user.is_admin) {
            await ctx.reply('❌ У вас нет прав доступа');
            return;
        }

        await ctx.reply('🔧 Админ-панель', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '📱 Открыть WebApp', web_app: { url: config.WEBAPP_URL } }
                ]]
            }
        });
    }

    async startSurvey(ctx) {
        await ctx.reply(
            '👋 Добро пожаловать в Академию АНБ!\n\n' +
            'Давайте познакомимся!\n\n' +
            '1. Ваша специализация:',
            {
                reply_markup: {
                    keyboard: [
                        ['Невролог', 'Реабилитолог'],
                        ['Мануальный терапевт', 'Физиотерапевт']
                    ],
                    resize_keyboard: true
                }
            }
        );
    }

    async showMainMenu(ctx) {
        await ctx.reply('🎯 Главное меню Академии АНБ', {
            reply_markup: {
                keyboard: [
                    ['📱 Открыть приложение'],
                    ['🎁 Акции', '❓ Помощь']
                ],
                resize_keyboard: true
            }
        });
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

            // Создаем нового пользователя
            const newUser = {
                id: telegramUser.id,
                telegram_data: telegramUser,
                is_admin: config.ADMIN_IDS.includes(telegramUser.id),
                is_super_admin: telegramUser.id === config.SUPER_ADMIN_ID
            };

            await db.query(
                `INSERT INTO users (id, telegram_data, is_admin, is_super_admin)
                 VALUES ($1, $2, $3, $4)`,
                [newUser.id, newUser.telegram_data, newUser.is_admin, newUser.is_super_admin]
            );

            return newUser;
            
        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            throw error;
        }
    }
}

const telegramBot = new TelegramBot();

// ==================== EXPRESS SERVER ====================
const app = express();

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = join(config.UPLOAD_PATH, file.fieldname);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = {
            'courses': ['image/jpeg', 'image/png', 'image/webp'],
            'podcasts': ['audio/mpeg', 'audio/wav'],
            'streams': ['video/mp4', 'video/quicktime'],
            'videos': ['video/mp4', 'video/quicktime'],
            'materials': ['application/pdf', 'image/jpeg', 'image/png']
        };
        
        const fieldName = file.fieldname;
        if (allowedTypes[fieldName] && allowedTypes[fieldName].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Неподдерживаемый тип файла для ${fieldName}`), false);
        }
    }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(config.UPLOAD_PATH));
app.use('/webapp', express.static(join(__dirname, 'webapp')));

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// User API
app.post('/api/user', async (req, res) => {
    try {
        const { id, firstName, username } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        
        let user;
        
        if (result.rows.length === 0) {
            // Создаем нового пользователя
            const newUser = {
                id: id,
                telegram_data: {
                    first_name: firstName || 'Пользователь',
                    username: username || ''
                },
                is_admin: config.ADMIN_IDS.includes(parseInt(id)),
                is_super_admin: parseInt(id) === config.SUPER_ADMIN_ID
            };

            await db.query(
                `INSERT INTO users (id, telegram_data, is_admin, is_super_admin)
                 VALUES ($1, $2, $3, $4)`,
                [newUser.id, newUser.telegram_data, newUser.is_admin, newUser.is_super_admin]
            );

            user = newUser;
        } else {
            user = result.rows[0];
        }

        // Преобразуем данные пользователя для фронтенда
        const userResponse = {
            id: user.id,
            firstName: user.telegram_data?.first_name || firstName,
            username: user.telegram_data?.username || username,
            specialization: user.profile_data?.specialization || '',
            city: user.profile_data?.city || '',
            email: user.profile_data?.email || '',
            subscription: user.subscription_data || { status: 'inactive', type: 'free' },
            progress: user.progress_data || {},
            favorites: user.favorites_data || {},
            isAdmin: user.is_admin,
            isSuperAdmin: user.is_super_admin,
            joinedAt: user.created_at,
            surveyCompleted: user.survey_completed
        };

        res.json({ success: true, user: userResponse });
    } catch (error) {
        console.error('User API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Content API
app.get('/api/content', async (req, res) => {
    try {
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
            db.query(`SELECT *, 
                COALESCE(image_url, '/webapp/assets/course-default.jpg') as image_url 
                FROM courses WHERE active = TRUE ORDER BY created_at DESC`),
            db.query(`SELECT *, 
                COALESCE(image_url, '/webapp/assets/podcast-default.jpg') as image_url 
                FROM podcasts ORDER BY created_at DESC`),
            db.query(`SELECT *, 
                COALESCE(thumbnail_url, '/webapp/assets/stream-default.jpg') as thumbnail_url 
                FROM streams ORDER BY stream_date DESC`),
            db.query(`SELECT *, 
                COALESCE(thumbnail_url, '/webapp/assets/video-default.jpg') as thumbnail_url 
                FROM video_tips ORDER BY created_at DESC`),
            db.query(`SELECT *, 
                COALESCE(image_url, '/webapp/assets/material-default.jpg') as image_url 
                FROM materials ORDER BY created_at DESC`),
            db.query(`SELECT *, 
                COALESCE(image_url, '/webapp/assets/event-default.jpg') as image_url 
                FROM events ORDER BY event_date DESC`),
            db.query(`SELECT *, 
                COALESCE(image_url, '/webapp/assets/promo-default.jpg') as image_url 
                FROM promotions WHERE active = TRUE ORDER BY created_at DESC`),
            db.query(`SELECT *, 
                COALESCE(image_url, '/webapp/assets/chat-default.jpg') as image_url 
                FROM chats WHERE active = TRUE ORDER BY created_at DESC`)
        ]);

        const content = {
            courses: coursesResult.rows,
            podcasts: podcastsResult.rows,
            streams: streamsResult.rows,
            videos: videosResult.rows,
            materials: materialsResult.rows,
            events: eventsResult.rows,
            promotions: promotionsResult.rows,
            chats: chatsResult.rows
        };

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Content API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin API - Добавление контента
app.post('/api/admin/content/:type', upload.single('image'), async (req, res) => {
    try {
        const { type } = req.params;
        const contentData = req.body;
        const userId = req.body.userId;

        // Проверяем права администратора
        const userResult = await db.query(
            'SELECT is_admin, is_super_admin FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Обрабатываем изображение если есть
        if (req.file) {
            const imagePath = `/uploads/${type}/${req.file.filename}`;
            contentData.image_url = imagePath;
            
            // Создаем миниатюру
            await sharp(req.file.path)
                .resize(400, 300)
                .jpeg({ quality: 80 })
                .toFile(req.file.path + '-thumb.jpg');
        }

        contentData.created_by = userId;

        // Вставляем в соответствующую таблицу
        const result = await db.query(
            `INSERT INTO ${type} (${Object.keys(contentData).join(', ')})
             VALUES (${Object.keys(contentData).map((_, i) => `$${i + 1}`).join(', ')})
             RETURNING *`,
            Object.values(contentData)
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Admin Content API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Favorites API
app.post('/api/favorites/toggle', async (req, res) => {
    try {
        const { userId, contentId, contentType } = req.body;

        const userResult = await db.query(
            'SELECT favorites_data FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        let favorites = userResult.rows[0].favorites_data || {};
        if (!favorites[contentType]) {
            favorites[contentType] = [];
        }

        const index = favorites[contentType].indexOf(contentId);
        if (index > -1) {
            favorites[contentType].splice(index, 1);
        } else {
            favorites[contentType].push(contentId);
        }

        await db.query(
            'UPDATE users SET favorites_data = $1 WHERE id = $2',
            [favorites, userId]
        );

        res.json({ success: true, favorites });
    } catch (error) {
        console.error('Favorites API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Progress API
app.post('/api/progress/update', async (req, res) => {
    try {
        const { userId, contentType, contentId, progress } = req.body;

        await db.query(
            `INSERT INTO user_progress (user_id, content_type, content_id, progress)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, content_type, content_id)
             DO UPDATE SET progress = $4, last_activity = NOW()`,
            [userId, contentType, contentId, progress]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Progress API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Статические файлы WebApp
app.use(express.static(join(__dirname, 'webapp')));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startServer() {
    try {
        await db.connect();
        
        const server = app.listen(config.PORT, '0.0.0.0', () => {
            console.log(`🌐 Сервер запущен на порту ${config.PORT}`);
            console.log(`📱 WebApp доступен: ${config.WEBAPP_URL}`);
            console.log('✅ Система полностью готова к работе!');
        });

    } catch (error) {
        console.error('❌ Критическая ошибка при запуске:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Остановка системы...');
    if (telegramBot.bot) {
        telegramBot.bot.stop('SIGINT');
    }
    if (db.client) {
        db.client.end();
    }
    process.exit(0);
});

startServer();
