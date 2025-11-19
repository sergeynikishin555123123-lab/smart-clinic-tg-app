// server.js - МИНИМАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
import { Telegraf } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Конфигурация
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL || 'https://anb-academy.timeweb.ru',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@def46fb02c0eac8fefd6f734.twc1.net:5432/default_db',
    ADMIN_IDS: [898508164],
    SUPER_ADMIN_ID: 898508164
};

// Логгер
const logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta),
    error: (message, error) => console.error(`[ERROR] ${message}`, error)
};

// В секции Database class добавляем улучшенную обработку ошибок
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
                query_timeout: 10000
            });
            
            await this.client.connect();
            this.isConnected = true;
            logger.info('✅ PostgreSQL подключена');
            
            await this.createTables();
            await this.createDemoData();
            
        } catch (error) {
            logger.error('❌ Ошибка подключения к БД:', error);
            this.isConnected = false;
            // Продолжаем работу в режиме без БД
            logger.info('🔄 Работаем в режиме без базы данных');
        }
    }

    async query(sql, params) {
        if (!this.isConnected || !this.client) {
            throw new Error('Database not connected');
        }
        
        try {
            return await this.client.query(sql, params);
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }
}

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB NOT NULL,
                profile_data JSONB DEFAULT '{}',
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                category TEXT,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const sql of tables) {
            try {
                await this.client.query(sql);
            } catch (error) {
                logger.error('Ошибка создания таблицы:', error.message);
            }
        }
    }

    async createDemoData() {
        try {
            // Создаем администратора
            const adminCheck = await this.client.query('SELECT * FROM users WHERE id = $1', [config.SUPER_ADMIN_ID]);
            if (adminCheck.rows.length === 0) {
                await this.client.query(
                    'INSERT INTO users (id, telegram_data, is_admin) VALUES ($1, $2, $3)',
                    [config.SUPER_ADMIN_ID, { first_name: 'Admin', username: 'admin' }, true]
                );
            }

            // Создаем демо-курсы
            const coursesCheck = await this.client.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCheck.rows[0].count) === 0) {
                const courses = [
                    ['Мануальные техники в практике невролога', '6 модулей по современным методикам', 25000, 'Неврология'],
                    ['Неврологическая диагностика', '5 модулей по диагностике', 18000, 'Неврология']
                ];
                
                for (const course of courses) {
                    await this.client.query(
                        'INSERT INTO courses (title, description, price, category) VALUES ($1, $2, $3, $4)',
                        course
                    );
                }
            }
        } catch (error) {
            logger.error('Ошибка создания демо-данных:', error);
        }
    }

    async query(sql, params) {
        if (!this.client) {
            throw new Error('Database not connected');
        }
        return await this.client.query(sql, params);
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
    }

    async handleStart(ctx) {
        try {
            await this.getOrCreateUser(ctx.from);
            await ctx.reply(
                `👋 Добро пожаловать в Академию АНБ!\n\n` +
                `Используйте команды:\n` +
                `/courses - Посмотреть курсы\n` +
                `/help - Помощь`
            );
        } catch (error) {
            await ctx.reply('Произошла ошибка');
        }
    }

    async handleCourses(ctx) {
        try {
            const courses = await db.query(
                'SELECT title, description, price FROM courses WHERE active = true LIMIT 5'
            );
            
            let message = '📚 Доступные курсы:\n\n';
            if (courses.rows.length > 0) {
                courses.rows.forEach((course, i) => {
                    message += `${i+1}. ${course.title}\n💵 ${course.price} руб.\n📖 ${course.description}\n\n`;
                });
            } else {
                message += 'Курсы пока не добавлены';
            }
            
            await ctx.reply(message, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                    ]]
                }
            });
        } catch (error) {
            await ctx.reply('Не удалось загрузить курсы');
        }
    }

    async handleHelp(ctx) {
        await ctx.reply(
            '🆘 Помощь:\n\n' +
            '/courses - Посмотреть курсы\n' +
            '/help - Эта справка\n\n' +
            '💬 Поддержка: @anb_academy_support'
        );
    }

    async getOrCreateUser(telegramUser) {
        try {
            const result = await db.query('SELECT * FROM users WHERE id = $1', [telegramUser.id]);
            if (result.rows.length === 0) {
                await db.query(
                    'INSERT INTO users (id, telegram_data, is_admin) VALUES ($1, $2, $3)',
                    [telegramUser.id, telegramUser, config.ADMIN_IDS.includes(telegramUser.id)]
                );
            }
        } catch (error) {
            logger.error('Ошибка создания пользователя:', error);
        }
    }

    launch() {
        this.bot.launch();
        logger.info('✅ Telegram Bot запущен');
    }
}

const telegramBot = new TelegramBot();

// Express Server
class ExpressServer {
    constructor() {
        this.app = express();
        this.setupServer();
    }

    setupServer() {
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json());

        // Статические файлы
        this.app.use('/webapp', express.static(join(__dirname, 'webapp')));

        // API Routes
        this.app.get('/api/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });

        this.app.get('/api/courses', async (req, res) => {
            try {
                const courses = await db.query('SELECT * FROM courses WHERE active = true');
                res.json({ success: true, data: courses.rows });
            } catch (error) {
                res.json({ success: true, data: [] });
            }
        });

        this.app.post('/api/user', async (req, res) => {
            try {
                const { id, firstName } = req.body;
                const user = {
                    id: id,
                    firstName: firstName || 'Пользователь',
                    isAdmin: config.ADMIN_IDS.includes(parseInt(id))
                };
                res.json({ success: true, user });
            } catch (error) {
                res.json({ success: false, error: 'User error' });
            }
        });

        // Webhook для Telegram
        this.app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
            telegramBot.bot.handleUpdate(req.body, res);
        });

        // SPA fallback
        this.app.get('*', (req, res) => {
            res.sendFile(join(__dirname, 'webapp', 'index.html'));
        });
    }

    start() {
        this.app.listen(config.PORT, '0.0.0.0', () => {
            logger.info(`🌐 Сервер запущен на порту ${config.PORT}`);
            logger.info(`📱 WebApp: ${config.WEBAPP_URL}`);
        });
    }
}

// Запуск системы
async function start() {
    logger.info('🚀 Запуск Академии АНБ...');
    
    await db.connect();
    telegramBot.launch();
    
    const server = new ExpressServer();
    server.start();
}

start().catch(console.error);
