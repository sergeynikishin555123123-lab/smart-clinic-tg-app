// server.js - ПОЛНОСТЬЮ РАБОЧИЙ СЕРВЕР
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
    WEBAPP_URL: process.env.WEBAPP_URL || 'https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@45.89.190.49:5432/default_db?sslmode=require',
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
                ssl: { rejectUnauthorized: false },
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
                progress_data JSONB DEFAULT '{"level": "Понимаю", "steps": {"materialsWatched": 0, "eventsParticipated": 0, "materialsSaved": 0, "coursesBought": 0}}',
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
                file_urls JSONB DEFAULT '[]',
                tags TEXT[] DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
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
                tags TEXT[] DEFAULT '{}',
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
                is_live BOOLEAN DEFAULT FALSE,
                tags TEXT[] DEFAULT '{}',
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
                tags TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Материалы
            `CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                content TEXT,
                file_url TEXT,
                image_url TEXT,
                material_type TEXT,
                tags TEXT[] DEFAULT '{}',
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
                tags TEXT[] DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Администраторы
            `CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                is_main_admin BOOLEAN DEFAULT FALSE,
                permissions JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
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

            // Добавляем демо-курсы
            const demoCourses = [
                {
                    title: 'Мануальные техники в практике',
                    description: '6 модулей по современным мануальным методикам',
                    full_description: 'Комплексный курс по мануальным техникам для практикующих врачей',
                    price: 15000,
                    duration: '12 часов',
                    modules: 6,
                    category: 'Неврология',
                    level: 'advanced',
                    tags: ['мануальная терапия', 'практика', 'неврология']
                },
                {
                    title: 'Неврология для практикующих врачей',
                    description: 'Основы неврологической диагностики',
                    full_description: 'Фундаментальный курс по неврологии',
                    price: 12000,
                    duration: '10 часов',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate',
                    tags: ['неврология', 'диагностика', 'базовый']
                },
                {
                    title: 'Основы реабилитации',
                    description: 'Современные подходы к реабилитации',
                    full_description: 'Курс по современным методикам реабилитации',
                    price: 8000,
                    duration: '8 часов',
                    modules: 4,
                    category: 'Реабилитация',
                    level: 'beginner',
                    tags: ['реабилитация', 'восстановление', 'базовый']
                }
            ];

            for (const course of demoCourses) {
                await this.pool.query(`
                    INSERT INTO courses (title, description, full_description, price, duration, modules, category, level, tags)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT DO NOTHING
                `, [course.title, course.description, course.full_description, course.price, 
                    course.duration, course.modules, course.category, course.level, course.tags]);
            }

            console.log('✅ Начальные данные добавлены');
        } catch (error) {
            console.error('❌ Ошибка добавления начальных данных:', error);
        }
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
        fileSize: 100 * 1024 * 1024
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
app.use(express.static(join(__dirname, 'webapp')));

// ==================== API ROUTES ====================

// Проверка здоровья
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
                    first_name: firstName,
                    last_name: lastName,
                    username: username
                },
                profile_data: {
                    specialization: 'Невролог',
                    city: 'Москва',
                    email: 'user@example.com'
                },
                subscription_data: {
                    status: 'active',
                    type: 'admin',
                    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                },
                progress_data: {
                    level: 'Понимаю',
                    steps: {
                        materialsWatched: 12,
                        eventsParticipated: 5,
                        materialsSaved: 8,
                        coursesBought: 3
                    }
                },
                favorites_data: {
                    courses: [1],
                    podcasts: [],
                    streams: [],
                    videos: [],
                    materials: [],
                    watchLater: []
                },
                is_admin: config.ADMIN_IDS.includes(parseInt(id)),
                survey_completed: true
            };

            await db.query(
                `INSERT INTO users (id, telegram_data, profile_data, subscription_data, progress_data, favorites_data, is_admin, survey_completed)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [newUser.id, newUser.telegram_data, newUser.profile_data, 
                 newUser.subscription_data, newUser.progress_data, newUser.favorites_data, 
                 newUser.is_admin, newUser.survey_completed]
            );

            user = newUser;
        } else {
            user = result.rows[0];
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
                joinedAt: user.created_at
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение контента
app.get('/api/content', async (req, res) => {
    try {
        const [coursesResult, podcastsResult, streamsResult, videosResult, materialsResult, eventsResult] = await Promise.all([
            db.query('SELECT * FROM courses WHERE is_active = TRUE ORDER BY created_at DESC'),
            db.query('SELECT * FROM podcasts ORDER BY created_at DESC'),
            db.query('SELECT * FROM streams ORDER BY created_at DESC'),
            db.query('SELECT * FROM video_tips ORDER BY created_at DESC'),
            db.query('SELECT * FROM materials ORDER BY created_at DESC'),
            db.query('SELECT * FROM events ORDER BY created_at DESC')
        ]);

        res.json({
            success: true,
            data: {
                courses: coursesResult.rows,
                podcasts: podcastsResult.rows,
                streams: streamsResult.rows,
                videos: videosResult.rows,
                materials: materialsResult.rows,
                events: eventsResult.rows
            }
        });
    } catch (error) {
        console.error('Content API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Статистика для админки
app.get('/api/stats', async (req, res) => {
    try {
        const [usersCount, coursesCount, activeSubscriptions] = await Promise.all([
            db.query('SELECT COUNT(*) FROM users'),
            db.query('SELECT COUNT(*) FROM courses WHERE is_active = TRUE'),
            db.query('SELECT COUNT(*) FROM users WHERE subscription_data->>\'status\' = \'active\'')
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(usersCount.rows[0].count),
                totalCourses: parseInt(coursesCount.rows[0].count),
                activeUsers: parseInt(activeSubscriptions.rows[0].count),
                totalRevenue: parseInt(activeSubscriptions.rows[0].count) * 2900
            }
        });
    } catch (error) {
        console.error('Stats API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Пользователи для админки
app.get('/api/users', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, telegram_data, profile_data, subscription_data, progress_data, 
                   is_admin, created_at, survey_completed
            FROM users 
            ORDER BY created_at DESC
            LIMIT 100
        `);

        const users = result.rows.map(user => ({
            id: user.id,
            firstName: user.telegram_data?.first_name || 'Пользователь',
            lastName: user.telegram_data?.last_name || '',
            email: user.profile_data?.email,
            specialization: user.profile_data?.specialization,
            city: user.profile_data?.city,
            subscription: user.subscription_data,
            progress: user.progress_data,
            isAdmin: user.is_admin,
            joinedAt: user.created_at,
            surveyCompleted: user.survey_completed
        }));

        res.json({ success: true, users });
    } catch (error) {
        console.error('Users API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Администраторы
app.get('/api/admins', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.telegram_data, u.created_at as joined_at,
                   a.is_main_admin
            FROM users u
            LEFT JOIN admins a ON u.id = a.user_id
            WHERE u.is_admin = TRUE
            ORDER BY u.created_at DESC
        `);

        const admins = result.rows.map(admin => ({
            id: admin.id,
            first_name: admin.telegram_data?.first_name,
            last_name: admin.telegram_data?.last_name,
            username: admin.telegram_data?.username,
            is_main_admin: admin.is_main_admin,
            joined_at: admin.joined_at
        }));

        res.json({ success: true, data: admins });
    } catch (error) {
        console.error('Admins API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавление администратора
app.post('/api/admins', async (req, res) => {
    try {
        const { userId } = req.body;
        
        await db.query(
            'UPDATE users SET is_admin = TRUE WHERE id = $1',
            [userId]
        );

        await db.query(
            'INSERT INTO admins (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
            [userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Add Admin Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удаление администратора
app.delete('/api/admins/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        await db.query(
            'UPDATE users SET is_admin = FALSE WHERE id = $1',
            [userId]
        );

        await db.query(
            'DELETE FROM admins WHERE user_id = $1',
            [userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Remove Admin Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавление контента
app.post('/api/content', upload.single('image'), async (req, res) => {
    try {
        const { title, description, fullDescription, contentType, price, duration, modules, category, level } = req.body;
        
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        let result;
        switch (contentType) {
            case 'courses':
                result = await db.query(`
                    INSERT INTO courses (title, description, full_description, price, duration, modules, category, level, image_url)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    RETURNING *
                `, [title, description, fullDescription, price, duration, modules, category, level, imageUrl]);
                break;
                
            case 'podcasts':
                result = await db.query(`
                    INSERT INTO podcasts (title, description, duration, image_url)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                `, [title, description, duration, imageUrl]);
                break;
                
            default:
                throw new Error('Unsupported content type');
        }

        res.json({ success: true, content: result.rows[0] });
    } catch (error) {
        console.error('Add Content Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Проверка прав администратора
app.get('/api/check-admin/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const result = await db.query(
            'SELECT is_admin FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false, isAdmin: false });
        }

        res.json({ 
            success: true, 
            isAdmin: result.rows[0].is_admin || config.ADMIN_IDS.includes(userId)
        });
    } catch (error) {
        console.error('Check Admin Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Активность для дашборда
app.get('/api/activity', async (req, res) => {
    try {
        // Возвращаем демо-активность
        const activities = [
            {
                type: 'user',
                action: 'Новый пользователь',
                user: 'Анна Сидорова',
                time: '2 минуты назад',
                icon: '👤'
            },
            {
                type: 'payment',
                action: 'Оплата подписки',
                user: 'Петр Иванов',
                amount: '2 900 ₽',
                time: '1 час назад',
                icon: '💳'
            },
            {
                type: 'content',
                action: 'Добавлен курс',
                item: 'Мануальные техники',
                time: '3 часа назад',
                icon: '📚'
            }
        ];

        res.json({ success: true, activities });
    } catch (error) {
        console.error('Activity API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Загрузка файлов
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
    try {
        const files = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: `/uploads/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
        }));

        res.json({ success: true, files });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

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
        this.bot.on('text', this.handleText.bind(this));
        this.bot.on('web_app_data', this.handleWebAppData.bind(this));
    }

    async handleStart(ctx) {
        const userId = ctx.from.id;
        console.log(`🚀 Пользователь ${userId} запустил бота`);

        await this.getOrCreateUser(ctx.from);
        await this.showMainMenu(ctx);
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
                        web_app: { url: `${config.WEBAPP_URL}/admin.html` } 
                    }
                ]]
            }
        });
    }

    async handleText(ctx) {
        await this.handleMenuButton(ctx, ctx.message.text);
    }

    async handleWebAppData(ctx) {
        const data = JSON.parse(ctx.webAppData.data);
        console.log('Данные из WebApp:', data);
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

    async showMainMenu(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        
        const message = `👋 Добро пожаловать в Академию АНБ, ${user.telegram_data.first_name}!\n\n` +
                       `Выберите раздел для навигации:`;

        const keyboard = [
            ['📱 Открыть приложение', '🎁 Акции'],
            ['💬 Поддержка', '👤 Мой профиль']
        ];

        if (user.is_admin) {
            keyboard.push(['🔧 Админ-панель']);
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
            case '📱 Открыть приложение':
                await ctx.reply('🎯 Откройте приложение для полного доступа ко всем функциям:', {
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
                                web_app: { url: config.WEBAPP_URL } 
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

            case '🔧 Админ-панель':
                if (user.is_admin) {
                    await ctx.reply('🔧 Панель управления системой:', {
                        reply_markup: {
                            inline_keyboard: [[
                                { 
                                    text: '📱 Открыть админ-панель', 
                                    web_app: { url: `${config.WEBAPP_URL}/admin.html` } 
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

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startServer() {
    try {
        console.log('🚀 Запуск сервера...');
        
        await db.connect();
        
        app.listen(config.PORT, '0.0.0.0', () => {
            console.log(`🌐 Сервер запущен на порту ${config.PORT}`);
            console.log(`📱 WebApp: ${config.WEBAPP_URL}`);
            console.log(`🔧 Admin: ${config.WEBAPP_URL}/admin.html`);
            console.log(`👑 Админы: ${config.ADMIN_IDS.join(', ')}`);
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
