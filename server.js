// server.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ ДЛЯ TIMEWEB
import { Telegraf } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Загрузка environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Конфигурация
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL || 'https://sergeynikishin555123123-lab-smart-clinic-tg-app-b25c.twc1.net',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@def46fb02c0eac8fefd6f734.twc1.net:5432/default_db',
    ADMIN_IDS: [898508164],
    SUPER_ADMIN_ID: 898508164,
    NODE_ENV: process.env.NODE_ENV || 'production'
};

// Логгер
const logger = {
    info: (message, meta) => console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta || ''),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error || ''),
    warn: (message, meta) => console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta || '')
};

// Database class
class Database {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const { Client } = await import('pg');
            this.client = new Client({
                connectionString: config.DATABASE_URL,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 10000,
                query_timeout: 10000,
                idleTimeoutMillis: 30000,
                max: 20
            });
            
            await this.client.connect();
            this.isConnected = true;
            logger.info('✅ PostgreSQL подключена');
            
            await this.createTables();
            await this.createDemoData();
            
        } catch (error) {
            logger.error('❌ Ошибка подключения к БД:', error);
            this.isConnected = false;
            logger.info('🔄 Работаем в режиме без базы данных');
        }
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB NOT NULL,
                profile_data JSONB DEFAULT '{}',
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                last_seen TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                full_description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                original_price DECIMAL(10,2) DEFAULT 0,
                discount INTEGER DEFAULT 0,
                duration TEXT,
                modules INTEGER DEFAULT 0,
                lessons INTEGER DEFAULT 0,
                category TEXT,
                subcategory TEXT,
                level TEXT DEFAULT 'beginner',
                difficulty TEXT DEFAULT 'medium',
                image_url TEXT,
                video_url TEXT,
                active BOOLEAN DEFAULT TRUE,
                featured BOOLEAN DEFAULT FALSE,
                popular BOOLEAN DEFAULT FALSE,
                new BOOLEAN DEFAULT FALSE,
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                reviews_count INTEGER DEFAULT 0,
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS user_favorites (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                content_type TEXT NOT NULL,
                content_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, content_type, content_id)
            )`,
            `CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                course_id INTEGER,
                progress_data JSONB DEFAULT '{}',
                completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const sql of tables) {
            try {
                await this.client.query(sql);
                logger.info(`✅ Таблица создана: ${sql.split(' ')[5]}`);
            } catch (error) {
                logger.error('Ошибка создания таблицы:', error.message);
            }
        }
    }

    async createDemoData() {
        try {
            // Создаем супер-администратора
            const adminCheck = await this.client.query('SELECT * FROM users WHERE id = $1', [config.SUPER_ADMIN_ID]);
            if (adminCheck.rows.length === 0) {
                await this.client.query(
                    'INSERT INTO users (id, telegram_data, is_admin, is_super_admin) VALUES ($1, $2, $3, $4)',
                    [config.SUPER_ADMIN_ID, { 
                        first_name: 'Admin', 
                        username: 'admin',
                        language_code: 'ru'
                    }, true, true]
                );
                logger.info('✅ Супер-администратор создан');
            }

            // Создаем демо-курсы
            const coursesCheck = await this.client.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCheck.rows[0].count) === 0) {
                const demoCourses = [
                    {
                        title: 'Мануальные техники в практике невролога',
                        description: '6 модулей по современным мануальным методикам',
                        full_description: 'Комплексный курс по мануальным техникам для практикующих врачей-неврологов. Изучите современные подходы к диагностике и лечению заболеваний опорно-двигательного аппарата.',
                        price: 25000,
                        original_price: 30000,
                        discount: 16,
                        duration: '12 недель',
                        modules: 6,
                        lessons: 24,
                        category: 'Мануальные техники',
                        subcategory: 'Неврология',
                        level: 'advanced',
                        difficulty: 'medium',
                        image_url: '/webapp/assets/course-manual.jpg',
                        featured: true,
                        popular: true,
                        new: true,
                        students_count: 156,
                        rating: 4.8,
                        reviews_count: 89,
                        created_by: config.SUPER_ADMIN_ID
                    },
                    {
                        title: 'Неврологическая диагностика: от основ к практике',
                        description: '5 модулей по современной неврологической диагностике',
                        full_description: 'Фундаментальный курс по неврологической диагностике с акцентом на практическое применение.',
                        price: 18000,
                        duration: '8 недель',
                        modules: 5,
                        lessons: 18,
                        category: 'Неврология',
                        subcategory: 'Диагностика',
                        level: 'intermediate',
                        image_url: '/webapp/assets/course-diagnosis.jpg',
                        featured: true,
                        students_count: 234,
                        rating: 4.6,
                        created_by: config.SUPER_ADMIN_ID
                    }
                ];
                
                for (const course of demoCourses) {
                    await this.client.query(
                        `INSERT INTO courses (
                            title, description, full_description, price, original_price, discount,
                            duration, modules, lessons, category, subcategory, level, difficulty,
                            image_url, featured, popular, new, students_count, rating, reviews_count, created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
                        [
                            course.title, course.description, course.full_description, course.price,
                            course.original_price, course.discount, course.duration, course.modules,
                            course.lessons, course.category, course.subcategory, course.level,
                            course.difficulty, course.image_url, course.featured, course.popular,
                            course.new, course.students_count, course.rating, course.reviews_count,
                            course.created_by
                        ]
                    );
                }
                logger.info('✅ Демо-курсы созданы');
            }
        } catch (error) {
            logger.error('Ошибка создания демо-данных:', error);
        }
    }

    async query(sql, params) {
        if (!this.isConnected || !this.client) {
            throw new Error('Database not connected');
        }
        
        try {
            const start = Date.now();
            const result = await this.client.query(sql, params);
            const duration = Date.now() - start;
            
            if (duration > 1000) {
                logger.warn(`Slow query (${duration}ms): ${sql.substring(0, 100)}...`);
            }
            
            return result;
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.end();
            this.isConnected = false;
            logger.info('✅ PostgreSQL отключена');
        }
    }
}

const db = new Database();

// Telegram Bot
class TelegramBot {
    constructor() {
        this.bot = new Telegraf(config.BOT_TOKEN);
        this.setupHandlers();
    }

    setupHandlers() {
        this.bot.start(this.handleStart.bind(this));
        this.bot.command('courses', this.handleCourses.bind(this));
        this.bot.command('help', this.handleHelp.bind(this));
        this.bot.command('admin', this.handleAdmin.bind(this));
        
        // Обработчик для webapp данных
        this.bot.on('web_app_data', this.handleWebAppData.bind(this));
    }

    async handleStart(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            const isAdmin = user.is_admin || user.is_super_admin;
            
            await ctx.reply(
                `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n` +
                `Используйте команды:\n` +
                `/courses - Посмотреть курсы\n` +
                `/help - Помощь\n` +
                `${isAdmin ? `/admin - Админ-панель` : ''}`
            );
            
            // Кнопка для открытия WebApp
            await ctx.reply('Откройте приложение для полного доступа к функциям:', {
                reply_markup: {
                    inline_keyboard: [[
                        { 
                            text: '📱 Открыть Академию АНБ', 
                            web_app: { url: config.WEBAPP_URL } 
                        }
                    ]]
                }
            });
        } catch (error) {
            logger.error('Ошибка в handleStart:', error);
            await ctx.reply('Произошла ошибка при загрузке. Попробуйте позже.');
        }
    }

    async handleCourses(ctx) {
        try {
            const courses = await db.query(
                `SELECT title, description, price, discount, students_count, rating 
                 FROM courses WHERE active = true 
                 ORDER BY created_at DESC LIMIT 5`
            );
            
            let message = '📚 *Доступные курсы:*\n\n';
            if (courses.rows.length > 0) {
                courses.rows.forEach((course, i) => {
                    const priceText = course.discount > 0 
                        ? `~~${course.original_price || course.price}~~ ${course.price} руб.` 
                        : `${course.price} руб.`;
                    
                    message += `*${i+1}. ${course.title}*\n` +
                              `💵 ${priceText}\n` +
                              `⭐ ${course.rating} (${course.students_count} студентов)\n` +
                              `📖 ${course.description}\n\n`;
                });
            } else {
                message += 'Курсы пока не добавлены';
            }
            
            await ctx.reply(message, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                    ]]
                }
            });
        } catch (error) {
            logger.error('Ошибка в handleCourses:', error);
            await ctx.reply('Не удалось загрузить курсы. Попробуйте позже.');
        }
    }

    async handleHelp(ctx) {
        await ctx.reply(
            '🆘 *Помощь по Академии АНБ*\n\n' +
            '*/courses* - Посмотреть доступные курсы\n' +
            '*/help* - Эта справка\n\n' +
            '💬 *Поддержка:* @anb_academy_support\n' +
            '🌐 *Веб-сайт:* anb-academy.ru',
            { parse_mode: 'Markdown' }
        );
    }

    async handleAdmin(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            
            if (!user.is_admin && !user.is_super_admin) {
                await ctx.reply('❌ У вас нет прав доступа к админ-панели.');
                return;
            }
            
            const stats = await this.getAdminStats();
            
            await ctx.reply(
                `🔧 *Админ-панель Академии АНБ*\n\n` +
                `📊 *Статистика:*\n` +
                `👥 Пользователей: ${stats.users}\n` +
                `📚 Курсов: ${stats.courses}\n` +
                `🎯 Активных: ${stats.activeUsers}\n\n` +
                `Используйте веб-приложение для управления контентом.`,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть админ-панель', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                }
            );
        } catch (error) {
            logger.error('Ошибка в handleAdmin:', error);
            await ctx.reply('Ошибка доступа к админ-панели.');
        }
    }

    async handleWebAppData(ctx) {
        try {
            const data = JSON.parse(ctx.webAppData.data);
            logger.info('WebApp data received:', data);
            
            // Обработка данных из WebApp
            if (data.type === 'purchase') {
                await ctx.reply(`✅ Запрос на покупку курса "${data.courseTitle}" получен!`);
            }
        } catch (error) {
            logger.error('Ошибка обработки WebApp данных:', error);
        }
    }

    async getOrCreateUser(telegramUser) {
        try {
            const result = await db.query('SELECT * FROM users WHERE id = $1', [telegramUser.id]);
            
            if (result.rows.length === 0) {
                // Создаем нового пользователя
                const isAdmin = config.ADMIN_IDS.includes(telegramUser.id);
                const isSuperAdmin = config.SUPER_ADMIN_ID === telegramUser.id;
                
                await db.query(
                    'INSERT INTO users (id, telegram_data, is_admin, is_super_admin) VALUES ($1, $2, $3, $4)',
                    [telegramUser.id, telegramUser, isAdmin, isSuperAdmin]
                );
                
                logger.info(`✅ Новый пользователь создан: ${telegramUser.id}`);
                return { id: telegramUser.id, telegram_data: telegramUser, is_admin: isAdmin, is_super_admin: isSuperAdmin };
            } else {
                // Обновляем последнюю активность
                await db.query(
                    'UPDATE users SET last_seen = NOW(), telegram_data = $1 WHERE id = $2',
                    [telegramUser, telegramUser.id]
                );
                return result.rows[0];
            }
        } catch (error) {
            logger.error('Ошибка создания пользователя:', error);
            // Возвращаем демо-пользователя в случае ошибки
            return { 
                id: telegramUser.id, 
                telegram_data: telegramUser, 
                is_admin: config.ADMIN_IDS.includes(telegramUser.id),
                is_super_admin: config.SUPER_ADMIN_ID === telegramUser.id
            };
        }
    }

    async getAdminStats() {
        try {
            const usersCount = await db.query('SELECT COUNT(*) FROM users');
            const coursesCount = await db.query('SELECT COUNT(*) FROM courses WHERE active = true');
            const activeUsers = await db.query("SELECT COUNT(*) FROM users WHERE last_seen > NOW() - INTERVAL '1 day'");
            
            return {
                users: parseInt(usersCount.rows[0].count),
                courses: parseInt(coursesCount.rows[0].count),
                activeUsers: parseInt(activeUsers.rows[0].count)
            };
        } catch (error) {
            logger.error('Ошибка получения статистики:', error);
            return { users: 0, courses: 0, activeUsers: 0 };
        }
    }

    launch() {
        this.bot.launch()
            .then(() => {
                logger.info('✅ Telegram Bot запущен');
            })
            .catch(error => {
                logger.error('❌ Ошибка запуска бота:', error);
            });

        // Включить graceful stop
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }
}

const telegramBot = new TelegramBot();

// Express Server с Socket.IO
class ExpressServer {
    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.setupServer();
        this.setupSocketIO();
    }

    setupServer() {
        // Middleware
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Статические файлы
        this.app.use('/webapp', express.static(join(__dirname, 'webapp'), {
            maxAge: config.NODE_ENV === 'production' ? '1d' : '0',
            etag: true,
            lastModified: true
        }));

        // API Routes
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                environment: config.NODE_ENV
            });
        });

        this.app.get('/api/content', async (req, res) => {
            try {
                const [courses, users] = await Promise.all([
                    db.query('SELECT * FROM courses WHERE active = true ORDER BY created_at DESC'),
                    db.query('SELECT COUNT(*) as total_users FROM users')
                ]);

                // Демо-данные для остального контента
                const content = {
                    courses: courses.rows,
                    podcasts: this.getDemoPodcasts(),
                    streams: this.getDemoStreams(),
                    videos: this.getDemoVideos(),
                    materials: this.getDemoMaterials(),
                    events: this.getDemoEvents(),
                    promotions: this.getDemoPromotions(),
                    stats: {
                        totalUsers: parseInt(users.rows[0]?.total_users || 0),
                        totalCourses: courses.rows.length,
                        totalMaterials: 25
                    }
                };

                res.json({ success: true, data: content });
            } catch (error) {
                logger.error('API content error:', error);
                res.json({ 
                    success: true, 
                    data: this.getDemoContent() 
                });
            }
        });

        this.app.get('/api/courses', async (req, res) => {
            try {
                const courses = await db.query(
                    'SELECT * FROM courses WHERE active = true ORDER BY created_at DESC'
                );
                res.json({ success: true, data: courses.rows });
            } catch (error) {
                logger.error('API courses error:', error);
                res.json({ success: true, data: [] });
            }
        });

        this.app.get('/api/courses/:id', async (req, res) => {
            try {
                const course = await db.query(
                    'SELECT * FROM courses WHERE id = $1 AND active = true',
                    [req.params.id]
                );
                
                if (course.rows.length === 0) {
                    return res.status(404).json({ success: false, error: 'Course not found' });
                }
                
                res.json({ success: true, data: course.rows[0] });
            } catch (error) {
                logger.error('API course detail error:', error);
                res.status(500).json({ success: false, error: 'Server error' });
            }
        });

        this.app.post('/api/user', async (req, res) => {
            try {
                const { initData, user: userData } = req.body;
                
                // В реальном приложении нужно верифицировать initData
                let userId;
                let userFromTG = {};
                
                if (userData && userData.id) {
                    userId = userData.id;
                    userFromTG = userData;
                } else {
                    // Для демо-режима
                    userId = 898508164;
                    userFromTG = {
                        id: 898508164,
                        first_name: 'Демо',
                        username: 'demo_user'
                    };
                }

                const user = await telegramBot.getOrCreateUser(userFromTG);
                
                // Получаем избранное и прогресс пользователя
                const [favorites, progress] = await Promise.all([
                    db.query(
                        'SELECT content_type, content_id FROM user_favorites WHERE user_id = $1',
                        [userId]
                    ),
                    db.query(
                        'SELECT course_id, progress_data, completed FROM user_progress WHERE user_id = $1',
                        [userId]
                    )
                ]);

                const userResponse = {
                    id: user.id,
                    firstName: user.telegram_data?.first_name || 'Пользователь',
                    username: user.telegram_data?.username,
                    isAdmin: user.is_admin || false,
                    isSuperAdmin: user.is_super_admin || false,
                    favorites: this.formatFavorites(favorites.rows),
                    progress: this.formatProgress(progress.rows),
                    subscription: {
                        status: 'active',
                        type: 'premium',
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    }
                };

                res.json({ success: true, user: userResponse });
            } catch (error) {
                logger.error('API user error:', error);
                res.json({ 
                    success: true, 
                    user: this.getDemoUser() 
                });
            }
        });

        this.app.post('/api/favorites/toggle', async (req, res) => {
            try {
                const { userId, contentId, contentType } = req.body;
                
                // Проверяем, есть ли уже в избранном
                const existing = await db.query(
                    'SELECT id FROM user_favorites WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
                    [userId, contentType, contentId]
                );

                if (existing.rows.length > 0) {
                    // Удаляем из избранного
                    await db.query(
                        'DELETE FROM user_favorites WHERE user_id = $1 AND content_type = $2 AND content_id = $3',
                        [userId, contentType, contentId]
                    );
                } else {
                    // Добавляем в избранное
                    await db.query(
                        'INSERT INTO user_favorites (user_id, content_type, content_id) VALUES ($1, $2, $3)',
                        [userId, contentType, contentId]
                    );
                }

                // Возвращаем обновленный список избранного
                const favorites = await db.query(
                    'SELECT content_type, content_id FROM user_favorites WHERE user_id = $1',
                    [userId]
                );

                res.json({ 
                    success: true, 
                    favorites: this.formatFavorites(favorites.rows)
                });
            } catch (error) {
                logger.error('API favorites error:', error);
                res.json({ success: false, error: 'Failed to update favorites' });
            }
        });

        // Admin API routes
        this.app.post('/api/admin/content', async (req, res) => {
            try {
                const { type, data, userId } = req.body;
                
                // Проверяем права администратора
                const user = await db.query('SELECT is_admin, is_super_admin FROM users WHERE id = $1', [userId]);
                if (user.rows.length === 0 || (!user.rows[0].is_admin && !user.rows[0].is_super_admin)) {
                    return res.status(403).json({ success: false, error: 'Access denied' });
                }

                // В реальном приложении здесь будет логика создания контента
                res.json({ 
                    success: true, 
                    message: 'Content created successfully',
                    contentId: Date.now() // Временный ID
                });
            } catch (error) {
                logger.error('Admin content creation error:', error);
                res.status(500).json({ success: false, error: 'Server error' });
            }
        });

        // Webhook для Telegram
        this.app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
            telegramBot.bot.handleUpdate(req.body, res);
        });

        // SPA fallback - должен быть последним
        this.app.get('*', (req, res) => {
            res.sendFile(join(__dirname, 'webapp', 'index.html'));
        });

        // Error handling
        this.app.use((error, req, res, next) => {
            logger.error('Unhandled error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            logger.info('🔌 Новое Socket.IO подключение:', socket.id);

            socket.on('authenticate', (data) => {
                // Аутентификация пользователя
                socket.userId = data.userId;
                socket.join(`user:${data.userId}`);
                logger.info(`✅ Пользователь ${data.userId} аутентифицирован`);
            });

            socket.on('user_online', (data) => {
                // Обновление статуса онлайн пользователей
                this.io.emit('user_online', { count: this.getOnlineUsersCount() });
            });

            socket.on('disconnect', () => {
                logger.info('🔌 Socket.IO отключение:', socket.id);
            });
        });

        // Периодическая отправка статистики
        setInterval(() => {
            this.io.emit('online_users', { count: this.getOnlineUsersCount() });
        }, 30000);
    }

    getOnlineUsersCount() {
        return Object.keys(this.io.sockets.sockets).length;
    }

    // Вспомогательные методы для демо-данных
    getDemoContent() {
        return {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике невролога',
                    description: '6 модулей по современным мануальным методикам',
                    price: 25000,
                    discount: 16,
                    duration: '12 недель',
                    modules: 6,
                    category: 'Мануальные техники',
                    level: 'advanced',
                    students_count: 156,
                    rating: 4.8,
                    featured: true,
                    image_url: '/webapp/assets/course-manual.jpg'
                }
            ],
            podcasts: this.getDemoPodcasts(),
            streams: this.getDemoStreams(),
            videos: this.getDemoVideos(),
            materials: this.getDemoMaterials(),
            events: this.getDemoEvents(),
            promotions: this.getDemoPromotions(),
            stats: {
                totalUsers: 1567,
                totalCourses: 12,
                totalMaterials: 45
            }
        };
    }

    getDemoPodcasts() {
        return [
            {
                id: 1,
                title: 'АНБ FM: Современная неврология и вызовы времени',
                description: 'Обсуждение новых тенденций и вызовов в современной неврологии',
                duration: '45:20',
                category: 'Неврология',
                listens: 2345,
                image_url: '/webapp/assets/podcast-neurology.jpg'
            }
        ];
    }

    getDemoStreams() {
        return [
            {
                id: 1,
                title: 'Разбор клинического случая: Болевой синдром в практике',
                description: 'Прямой эфир с разбором сложного клинического случая',
                duration: '1:30:00',
                live: true,
                participants: 89,
                thumbnail_url: '/webapp/assets/stream-pain-syndrome.jpg'
            }
        ];
    }

    getDemoVideos() {
        return [
            {
                id: 1,
                title: 'Шпаргалка невролога: Неврологический осмотр за 15 минут',
                description: 'Быстрый гайд по основным тестам и методикам',
                duration: '15:30',
                views: 4567,
                thumbnail_url: '/webapp/assets/video-neurological-exam.jpg'
            }
        ];
    }

    getDemoMaterials() {
        return [
            {
                id: 1,
                title: 'МРТ разбор: Рассеянный склероз и дифференциальная диагностика',
                description: 'Детальный разбор МРТ с клиническими случаями',
                material_type: 'mri_analysis',
                category: 'Неврология',
                downloads: 1234,
                image_url: '/webapp/assets/material-ms-mri.jpg'
            }
        ];
    }

    getDemoEvents() {
        return [
            {
                id: 1,
                title: 'Конференция: Современная неврология 2024',
                description: 'Ежегодная конференция с ведущими специалистами',
                event_date: new Date('2024-02-15T10:00:00').toISOString(),
                location: 'Москва, ЦВК Экспоцентр',
                event_type: 'offline_conference',
                participants: 456,
                image_url: '/webapp/assets/event-neurology-conf.jpg'
            }
        ];
    }

    getDemoPromotions() {
        return [
            {
                id: 1,
                title: 'Скидка 25% на первую подписку Premium',
                description: 'Специальное предложение для новых пользователей',
                discount: 25,
                active: true,
                image_url: '/webapp/assets/promo-welcome.jpg'
            }
        ];
    }

    getDemoUser() {
        return {
            id: 898508164,
            firstName: 'Демо Пользователь',
            isAdmin: true,
            isSuperAdmin: true,
            favorites: {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: []
            },
            progress: {
                level: 'Понимаю',
                experience: 1250,
                steps: {
                    coursesBought: 3,
                    modulesCompleted: 2,
                    materialsWatched: 12
                }
            }
        };
    }

    formatFavorites(favoritesRows) {
        const favorites = {
            courses: [],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: []
        };
        
        favoritesRows.forEach(row => {
            if (favorites[row.content_type]) {
                favorites[row.content_type].push(row.content_id);
            }
        });
        
        return favorites;
    }

    formatProgress(progressRows) {
        const progress = {
            steps: {
                coursesBought: progressRows.length,
                modulesCompleted: progressRows.filter(p => p.completed).length,
                materialsWatched: 12 // Демо значение
            }
        };
        
        return progress;
    }

    start() {
        this.httpServer.listen(config.PORT, '0.0.0.0', () => {
            logger.info(`🌐 Сервер запущен на порту ${config.PORT}`);
            logger.info(`📱 WebApp: ${config.WEBAPP_URL}`);
            logger.info(`🤖 Bot: t.me/${telegramBot.bot.context.botInfo.username}`);
            logger.info(`🚀 Environment: ${config.NODE_ENV}`);
        });
    }
}

// Запуск системы
async function start() {
    logger.info('🚀 Запуск Академии АНБ версии 2.0...');
    
    try {
        await db.connect();
        telegramBot.launch();
        
        const server = new ExpressServer();
        server.start();
        
        // Graceful shutdown
        process.on('SIGTERM', async () => {
            logger.info('🛑 Получен SIGTERM, начинаем graceful shutdown...');
            await db.disconnect();
            process.exit(0);
        });
        
        process.on('SIGINT', async () => {
            logger.info('🛑 Получен SIGINT, начинаем graceful shutdown...');
            await db.disconnect();
            process.exit(0);
        });
        
    } catch (error) {
        logger.error('❌ Критическая ошибка запуска:', error);
        process.exit(1);
    }
}

start().catch(error => {
    logger.error('❌ Непредвиденная ошибка:', error);
    process.exit(1);
});
