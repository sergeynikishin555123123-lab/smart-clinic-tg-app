import express from 'express';
import { Telegraf, session, Scenes, Markup } from 'telegraf';
import pkg from 'pg';
const { Client } = pkg;
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import moment from 'moment';
import _ from 'lodash';
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import morgan from 'morgan';
import winston from 'winston';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs/promises';
import { createReadStream, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ СИСТЕМЫ ====================
class SystemConfig {
    constructor() {
        this.BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
        this.PORT = process.env.PORT || 3000;
        this.WEBAPP_URL = process.env.WEBAPP_URL || `http://localhost:${this.PORT}`;
        this.ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(Number) : [898508164];
        this.SUPER_ADMIN_ID = parseInt(process.env.SUPER_ADMIN_ID) || 898508164;
        this.UPLOAD_PATH = join(__dirname, 'uploads');
        this.NODE_ENV = process.env.NODE_ENV || 'production';
        this.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@def46fb02c0eac8fefd6f734.twc1.net:5432/default_db';
        this.JWT_SECRET = process.env.JWT_SECRET || 'anb-academy-super-secret-jwt-key-2024';
        this.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'anb-academy-encryption-key-256-bit-secure';
        this.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
        this.CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600;
        this.RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 15;
        this.RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;
        this.UPLOAD_MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE) || 50 * 1024 * 1024;
    }

    validate() {
        const required = ['BOT_TOKEN', 'DATABASE_URL'];
        const missing = required.filter(key => !this[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }

        console.log('✅ Конфигурация системы проверена');
        return true;
    }

    getDatabaseConfig() {
        return {
            user: 'gen_user',
            host: 'def46fb02c0eac8fefd6f734.twc1.net',
            database: 'default_db',
            password: '5-R;mKGYJ<88?1',
            port: 5432,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            max: 20,
        };
    }
}

const config = new SystemConfig();

// ==================== СИСТЕМА ЛОГИРОВАНИЯ ====================
class LoggerSystem {
    constructor() {
        this.logger = winston.createLogger({
            level: config.LOG_LEVEL,
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'anb-academy' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });
    }

    log(level, message, meta = {}) {
        this.logger.log(level, message, meta);
    }

    error(message, error = null) {
        this.log('error', message, { error: error?.stack || error });
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }
}

const logger = new LoggerSystem();

// ==================== БАЗА ДАННЫХ ====================
class DatabaseSystem {
    constructor() {
        this.pgClient = null;
        this.connected = false;
    }

    async connect() {
        try {
            logger.info('🗄️ Подключение к базе данных...');
            
            this.pgClient = new Client(config.getDatabaseConfig());
            await this.pgClient.connect();
            
            this.connected = true;
            logger.info('✅ База данных подключена');
            
            await this.createTables();
            await this.initializeDefaultData();
            
        } catch (error) {
            logger.error('❌ Ошибка подключения к БД:', error);
            throw error;
        }
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB NOT NULL,
                profile_data JSONB DEFAULT '{}',
                subscription_data JSONB DEFAULT '{}',
                progress_data JSONB DEFAULT '{}',
                favorites_data JSONB DEFAULT '{}',
                survey_completed BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                duration TEXT,
                modules INTEGER DEFAULT 1,
                category TEXT,
                level TEXT DEFAULT 'beginner',
                image_url TEXT,
                active BOOLEAN DEFAULT TRUE,
                featured BOOLEAN DEFAULT FALSE,
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id BIGINT,
                content_type TEXT NOT NULL,
                content_id INTEGER NOT NULL,
                progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                last_activity TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, content_type, content_id)
            )`,

            `CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id BIGINT,
                course_id INTEGER,
                amount DECIMAL(10,2) NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const tableSQL of tables) {
            try {
                await this.pgClient.query(tableSQL);
                logger.info(`✅ Таблица создана`);
            } catch (error) {
                logger.error(`❌ Ошибка создания таблицы:`, error.message);
            }
        }
    }

    async initializeDefaultData() {
        try {
            // Создаем супер-админа
            const superAdminCheck = await this.pgClient.query(
                'SELECT * FROM users WHERE id = $1',
                [config.SUPER_ADMIN_ID]
            );

            if (superAdminCheck.rows.length === 0) {
                await this.pgClient.query(
                    `INSERT INTO users (id, telegram_data, is_admin, is_super_admin, survey_completed)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        config.SUPER_ADMIN_ID,
                        JSON.stringify({
                            first_name: 'Супер Администратор',
                            username: 'superadmin'
                        }),
                        true,
                        true,
                        true
                    ]
                );
                logger.info('✅ Супер-администратор создан');
            }

            // Создаем демо-курсы
            await this.createDemoContent();
            
        } catch (error) {
            logger.error('Ошибка инициализации данных:', error);
        }
    }

    async createDemoContent() {
        try {
            const coursesCheck = await this.pgClient.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCheck.rows[0].count) === 0) {
                logger.info('📚 Создаем демо-контент...');
                
                const demoCourses = [
                    {
                        title: 'Мануальные техники в практике невролога',
                        description: '6 модулей по современным мануальным методикам',
                        price: 25000,
                        duration: '12 недель',
                        modules: 6,
                        category: 'Мануальные техники',
                        level: 'advanced',
                        image_url: '/webapp/assets/course-manual.svg',
                        active: true,
                        featured: true,
                        students_count: 156,
                        rating: 4.8,
                        created_by: config.SUPER_ADMIN_ID
                    },
                    {
                        title: 'Неврологическая диагностика: от основ к практике',
                        description: '5 модулей по современной неврологической диагностике',
                        price: 18000,
                        duration: '8 недель',
                        modules: 5,
                        category: 'Неврология',
                        level: 'intermediate',
                        image_url: '/webapp/assets/course-diagnosis.svg',
                        active: true,
                        featured: true,
                        students_count: 234,
                        rating: 4.6,
                        created_by: config.SUPER_ADMIN_ID
                    }
                ];

                for (const course of demoCourses) {
                    const keys = Object.keys(course);
                    const values = Object.values(course);
                    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                    
                    await this.pgClient.query(
                        `INSERT INTO courses (${keys.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }

                logger.info('✅ Демо-контент создан');
            }
        } catch (error) {
            logger.error('Ошибка создания демо-контента:', error);
        }
    }

    async query(text, params) {
        if (!this.connected) {
            throw new Error('База данных не подключена');
        }

        try {
            const result = await this.pgClient.query(text, params);
            return result;
        } catch (error) {
            logger.error('Database query error:', error, { query: text, params });
            throw error;
        }
    }

    async close() {
        try {
            if (this.pgClient) {
                await this.pgClient.end();
            }
            logger.info('✅ Соединение с базой данных закрыто');
        } catch (error) {
            logger.error('Ошибка при закрытии соединения с БД:', error);
        }
    }
}

const db = new DatabaseSystem();

// ==================== СИСТЕМА БЕЗОПАСНОСТИ ====================
class SecuritySystem {
    constructor() {
        this.rateLimiters = new Map();
    }

    createRateLimiter(key, windowMs, max) {
        if (!this.rateLimiters.has(key)) {
            this.rateLimiters.set(key, {
                requests: new Map(),
                windowMs,
                max
            });
        }
        return this.rateLimiters.get(key);
    }

    async checkRateLimit(key, identifier, cost = 1) {
        const limiter = this.createRateLimiter(key, 15 * 60 * 1000, 100);
        
        const now = Date.now();
        const windowStart = now - limiter.windowMs;

        // Очищаем старые записи
        for (const [timestamp, count] of limiter.requests.entries()) {
            if (timestamp < windowStart) {
                limiter.requests.delete(timestamp);
            }
        }

        // Считаем текущие запросы
        let currentCount = 0;
        for (const count of limiter.requests.values()) {
            currentCount += count;
        }

        if (currentCount + cost > limiter.max) {
            return false;
        }

        // Добавляем текущий запрос
        limiter.requests.set(now, (limiter.requests.get(now) || 0) + cost);
        return true;
    }

    async validateInput(schema, data) {
        try {
            const validated = await schema.validateAsync(data, {
                abortEarly: false,
                stripUnknown: true
            });
            return { isValid: true, data: validated };
        } catch (error) {
            return { 
                isValid: false, 
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    type: detail.type
                }))
            };
        }
    }

    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    generateToken(payload, expiresIn = '7d') {
        return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, config.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

const security = new SecuritySystem();

// ==================== TELEGRAM BOT СИСТЕМА ====================
class TelegramBotSystem {
    constructor() {
        this.bot = null;
        this.setupBot();
    }

    setupBot() {
        try {
            logger.info('🤖 Инициализация Telegram бота...');
            
            if (!config.BOT_TOKEN) {
                logger.warn('⚠️ Бот-токен не настроен');
                return;
            }
            
            this.bot = new Telegraf(config.BOT_TOKEN);
            this.setupHandlers();
            this.launchBot();
            
        } catch (error) {
            logger.error('❌ Ошибка инициализации бота:', error);
        }
    }

    setupHandlers() {
        // Команды бота
        this.bot.start(this.handleStart.bind(this));
        this.bot.command('menu', this.handleMenu.bind(this));
        this.bot.command('admin', this.handleAdmin.bind(this));
        this.bot.command('courses', this.handleCourses.bind(this));
        this.bot.command('profile', this.handleProfile.bind(this));
        this.bot.command('help', this.handleHelp.bind(this));
        this.bot.command('support', this.handleSupport.bind(this));

        // Обработчики сообщений
        this.bot.on('text', this.handleText.bind(this));

        // Обработчики callback queries
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    }

    async handleStart(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            
            await ctx.reply(
                `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n` +
                `Я ваш помощник в мире медицинского образования. Вот что я могу:\n\n` +
                `📚 /courses - Посмотреть доступные курсы\n` +
                `👤 /profile - Ваш профиль и прогресс\n` +
                `🔧 /admin - Админ-панель (для администраторов)\n` +
                `🆘 /help - Получить помощь\n\n` +
                `Для полного доступа ко всем функциям откройте WebApp:`,
                {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                }
            );
        } catch (error) {
            logger.error('Start handler error:', error);
            await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    async handleMenu(ctx) {
        await this.showMainMenu(ctx);
    }

    async handleAdmin(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        if (!user.is_admin && !user.is_super_admin) {
            await ctx.reply('❌ У вас нет прав доступа к админ-панели');
            return;
        }

        await ctx.reply('🔧 Админ-панель Академии АНБ', {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📊 Статистика', callback_data: 'admin_stats' },
                        { text: '👥 Пользователи', callback_data: 'admin_users' }
                    ],
                    [
                        { text: '📚 Курсы', callback_data: 'admin_courses' },
                        { text: '📈 Аналитика', callback_data: 'admin_analytics' }
                    ],
                    [
                        { text: '📱 Открыть WebApp', web_app: { url: config.WEBAPP_URL } }
                    ]
                ]
            }
        });
    }

    async handleCourses(ctx) {
        const courses = await db.query(
            'SELECT id, title, description, price FROM courses WHERE active = true ORDER BY created_at DESC LIMIT 5'
        );

        if (courses.rows.length === 0) {
            await ctx.reply('📚 Курсы пока не добавлены.');
            return;
        }

        const coursesText = courses.rows.map((course, index) => 
            `${index + 1}. ${course.title}\n💵 ${course.price} руб.\n📖 ${course.description}\n`
        ).join('\n');

        await ctx.reply(`📚 Доступные курсы:\n\n${coursesText}\n\nДля подробной информации откройте WebApp:`, {
            reply_markup: {
                inline_keyboard: [[
                    { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                ]]
            }
        });
    }

    async handleProfile(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        
        const profileText = 
            `👤 Ваш профиль:\n\n` +
            `🆔 ID: ${user.id}\n` +
            `📛 Имя: ${user.telegram_data.first_name}\n` +
            `👤 Username: @${user.telegram_data.username || 'не указан'}\n` +
            `💳 Подписка: ${user.subscription_data?.status === 'active' ? 'Активна' : 'Не активна'}\n` +
            `📊 Прогресс: Уровень ${user.progress_data?.level || 'Новичок'}\n\n` +
            `Для управления профилем откройте WebApp:`;

        await ctx.reply(profileText, {
            reply_markup: {
                inline_keyboard: [[
                    { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                ]]
            }
        });
    }

    async handleHelp(ctx) {
        const helpText = 
            `🆘 Помощь по Академии АНБ:\n\n` +
            `📚 /courses - Посмотреть доступные курсы\n` +
            `👤 /profile - Посмотреть свой профиль\n` +
            `🔧 /admin - Админ-панель (для администраторов)\n` +
            `🆘 /support - Связь с поддержкой\n` +
            `📱 /menu - Главное меню\n\n` +
            `Для полного доступа ко всем функциям откройте WebApp:\n${config.WEBAPP_URL}`;

        await ctx.reply(helpText);
    }

    async handleSupport(ctx) {
        await ctx.reply(
            `💬 Служба поддержки Академии АНБ:\n\n` +
            `📧 Email: support@anb-academy.ru\n` +
            `📱 Telegram: @anb_academy_support\n` +
            `⏰ Время работы: 24/7\n` +
            `🚀 Среднее время ответа: 15 минут`
        );
    }

    async handleText(ctx) {
        const message = ctx.message.text;
        
        if (message.toLowerCase().includes('привет')) {
            await this.handleStart(ctx);
        } else {
            await ctx.reply(
                `Я вас не понял. Используйте команды:\n` +
                `/start - Начать работу\n` +
                `/menu - Главное меню\n` +
                `/help - Помощь`
            );
        }
    }

    async handleCallbackQuery(ctx) {
        const data = ctx.callbackQuery.data;
        
        try {
            await ctx.answerCbQuery();
            
            if (data.startsWith('admin_')) {
                await this.handleAdminCallback(ctx, data);
            }
            
        } catch (error) {
            logger.error('Callback query error:', error);
            await ctx.answerCbQuery('❌ Произошла ошибка');
        }
    }

    async handleAdminCallback(ctx, data) {
        const user = await this.getOrCreateUser(ctx.from);
        if (!user.is_admin && !user.is_super_admin) {
            await ctx.editMessageText('❌ У вас нет прав доступа');
            return;
        }

        if (data === 'admin_stats') {
            const stats = await this.getAdminStats();
            await ctx.editMessageText(
                `📊 Статистика системы:\n\n` +
                `👥 Пользователей: ${stats.users.total}\n` +
                `📚 Курсов: ${stats.courses.total}\n` +
                `💳 Продаж: ${stats.payments.total}\n` +
                `📈 Доход: ${stats.revenue.total} руб.`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '◀️ Назад', callback_data: 'admin_back' }]
                        ]
                    }
                }
            );
        } else if (data === 'admin_back') {
            await this.handleAdmin(ctx);
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

            logger.info(`✅ Новый пользователь создан: ${telegramUser.first_name} (ID: ${telegramUser.id})`);

            return newUser;
            
        } catch (error) {
            logger.error('Ошибка создания пользователя:', error);
            throw error;
        }
    }

    async getAdminStats() {
        try {
            const [
                usersCount,
                coursesCount,
                paymentsCount,
                revenueResult
            ] = await Promise.all([
                db.query('SELECT COUNT(*) FROM users'),
                db.query('SELECT COUNT(*) FROM courses WHERE active = true'),
                db.query('SELECT COUNT(*) FROM payments WHERE status = $1', ['completed']),
                db.query('SELECT SUM(amount) FROM payments WHERE status = $1', ['completed'])
            ]);

            return {
                users: {
                    total: parseInt(usersCount.rows[0].count)
                },
                courses: {
                    total: parseInt(coursesCount.rows[0].count)
                },
                payments: {
                    total: parseInt(paymentsCount.rows[0].count)
                },
                revenue: {
                    total: parseFloat(revenueResult.rows[0].sum || 0)
                }
            };
        } catch (error) {
            logger.error('Error getting admin stats:', error);
            return {
                users: { total: 0 },
                courses: { total: 0 },
                payments: { total: 0 },
                revenue: { total: 0 }
            };
        }
    }

    async showMainMenu(ctx) {
        await ctx.reply('🎯 Главное меню Академии АНБ', {
            reply_markup: {
                keyboard: [
                    ['📱 Открыть приложение'],
                    ['📚 Курсы', '👤 Профиль'],
                    ['🆘 Помощь']
                ],
                resize_keyboard: true
            }
        });
    }

    launchBot() {
        if (config.NODE_ENV === 'production') {
            this.bot.launch({
                webhook: {
                    domain: config.WEBAPP_URL,
                    port: config.PORT
                }
            }).then(() => {
                logger.info('✅ Telegram Bot запущен в production режиме');
            });
        } else {
            this.bot.launch().then(() => {
                logger.info('✅ Telegram Bot запущен в development режиме');
            });
        }

        // Graceful shutdown
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

    async sendNotification(userId, message, options = {}) {
        try {
            await this.bot.telegram.sendMessage(userId, message, options);
            logger.info(`✅ Уведомление отправлено пользователю ${userId}`);
        } catch (error) {
            logger.error(`❌ Ошибка отправки уведомления пользователю ${userId}:`, error);
        }
    }
}

const telegramBot = new TelegramBotSystem();

// ==================== EXPRESS SERVER СИСТЕМА ====================
class ExpressServerSystem {
    constructor() {
        this.app = express();
        this.server = null;
        this.setupServer();
    }

    setupServer() {
        this.setupMiddleware();
        this.setupFileUpload();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Безопасность
        this.app.use(helmet({
            contentSecurityPolicy: false
        }));

        // Компрессия
        this.app.use(compression());

        // CORS
        this.app.use(cors({
            origin: function(origin, callback) {
                const allowedOrigins = [
                    config.WEBAPP_URL,
                    'https://telegram.org',
                    'https://web.telegram.org',
                    'http://localhost:3000',
                    'http://127.0.0.1:3000'
                ];
                
                if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Парсинг JSON
        this.app.use(express.json({ 
            limit: '50mb'
        }));

        // Парсинг URL-encoded данных
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: '50mb'
        }));

        // Логирование
        this.app.use(morgan('combined', {
            stream: {
                write: (message) => logger.info(message.trim())
            }
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000,
            max: config.RATE_LIMIT_MAX,
            message: {
                error: 'Слишком много запросов. Пожалуйста, подождите немного.'
            }
        });

        this.app.use(limiter);

        // Статические файлы
        this.app.use('/uploads', express.static(join(__dirname, 'uploads')));
        this.app.use('/webapp', express.static(join(__dirname, 'webapp')));
        this.app.use('/assets', express.static(join(__dirname, 'webapp/assets')));
    }

    setupFileUpload() {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadPath = join(config.UPLOAD_PATH, 'general');
                try {
                    await fs.mkdir(uploadPath, { recursive: true });
                    cb(null, uploadPath);
                } catch (error) {
                    cb(error, null);
                }
            },
            filename: (req, file, cb) => {
                const uniqueName = `${uuidv4()}-${file.originalname}`;
                cb(null, uniqueName);
            }
        });

        const fileFilter = (req, file, cb) => {
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/webp', 
                'video/mp4', 'application/pdf'
            ];

            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Неподдерживаемый тип файла: ${file.mimetype}`), false);
            }
        };

        this.upload = multer({
            storage: storage,
            limits: { 
                fileSize: config.UPLOAD_MAX_SIZE
            },
            fileFilter: fileFilter
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', async (req, res) => {
            try {
                const health = await this.getSystemHealth();
                res.json(health);
            } catch (error) {
                logger.error('Health check error:', error);
                res.status(503).json({
                    status: 'error',
                    timestamp: new Date().toISOString(),
                    error: 'Service unavailable'
                });
            }
        });

        // User routes
        this.app.post('/api/user', this.handleUserRequest.bind(this));
        this.app.get('/api/user/profile', this.handleUserProfile.bind(this));

        // Content routes
        this.app.get('/api/content', this.handleGetContent.bind(this));
        this.app.get('/api/content/:type', this.handleGetContentByType.bind(this));
        this.app.get('/api/content/:type/:id', this.handleGetContentDetail.bind(this));

        // Favorites routes
        this.app.post('/api/favorites/toggle', this.handleToggleFavorite.bind(this));

        // Progress routes
        this.app.post('/api/progress/update', this.handleUpdateProgress.bind(this));

        // Payment routes
        this.app.post('/api/payment/create', this.handleCreatePayment.bind(this));

        // Admin routes
        this.app.get('/api/admin/stats', this.handleAdminStats.bind(this));

        // Webhook routes
        this.app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
            telegramBot.bot.handleUpdate(req.body, res);
        });

        // SPA fallback
        this.app.get('*', (req, res) => {
            res.sendFile(join(__dirname, 'webapp', 'index.html'));
        });
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Route not found',
                path: req.path,
                method: req.method
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            logger.error('Global error handler:', error);

            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: 'File too large',
                        maxSize: config.UPLOAD_MAX_SIZE
                    });
                }
            }

            res.status(error.status || 500).json({
                error: config.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        });
    }

    async getSystemHealth() {
        const checks = {
            database: 'unknown',
            telegram: 'unknown'
        };

        try {
            await db.query('SELECT 1');
            checks.database = 'healthy';
        } catch (error) {
            checks.database = 'unhealthy';
        }

        try {
            await telegramBot.bot.telegram.getMe();
            checks.telegram = 'healthy';
        } catch (error) {
            checks.telegram = 'unhealthy';
        }

        const allHealthy = Object.values(checks).every(status => status === 'healthy');

        return {
            status: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            checks
        };
    }

    async handleUserRequest(req, res) {
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
            logger.error('User API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUserProfile(req, res) {
        try {
            const userId = req.query.userId;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            const result = await db.query(
                'SELECT * FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = result.rows[0];
            const userResponse = {
                id: user.id,
                firstName: user.telegram_data?.first_name,
                username: user.telegram_data?.username,
                specialization: user.profile_data?.specialization,
                city: user.profile_data?.city,
                email: user.profile_data?.email,
                subscription: user.subscription_data,
                progress: user.progress_data,
                favorites: user.favorites_data,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                joinedAt: user.created_at
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetContent(req, res) {
        try {
            const contentTypes = ['courses', 'podcasts', 'streams', 'videos', 'materials', 'events', 'promotions', 'chats'];
            const content = {};

            for (const type of contentTypes) {
                try {
                    const result = await db.query(
                        `SELECT * FROM ${type} WHERE active = TRUE ORDER BY created_at DESC LIMIT 10`
                    );
                    content[type] = result.rows;
                } catch (error) {
                    logger.error(`Error loading ${type}:`, error);
                    content[type] = [];
                }
            }

            res.json({ success: true, data: content });
        } catch (error) {
            logger.error('Content API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetContentByType(req, res) {
        try {
            const { type } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const offset = (page - 1) * limit;

            const result = await db.query(
                `SELECT * FROM ${type} WHERE active = TRUE ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
                [parseInt(limit), offset]
            );

            const countResult = await db.query(
                `SELECT COUNT(*) FROM ${type} WHERE active = TRUE`
            );

            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(total / limit);

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages
                }
            });
        } catch (error) {
            logger.error('Content by type error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetContentDetail(req, res) {
        try {
            const { type, id } = req.params;

            const result = await db.query(
                `SELECT * FROM ${type} WHERE id = $1 AND active = TRUE`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            logger.error('Content detail error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleToggleFavorite(req, res) {
        try {
            const { userId, contentId, contentType } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

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
            logger.error('Toggle favorite error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUpdateProgress(req, res) {
        try {
            const { userId, contentType, contentId, progress, completed } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            await db.query(
                `INSERT INTO user_progress (user_id, content_type, content_id, progress, completed, last_activity)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 ON CONFLICT (user_id, content_type, content_id)
                 DO UPDATE SET progress = $4, completed = $5, last_activity = NOW()`,
                [userId, contentType, contentId, progress, completed]
            );

            res.json({ success: true });
        } catch (error) {
            logger.error('Update progress error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleCreatePayment(req, res) {
        try {
            const { userId, courseId, amount, paymentMethod } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            // Создаем платеж в базе данных
            const paymentResult = await db.query(
                `INSERT INTO payments (user_id, course_id, amount, status, payment_method)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [userId, courseId, amount, 'completed', paymentMethod]
            );

            // Записываем enrollment пользователя
            await db.query(
                `INSERT INTO user_progress (user_id, content_type, content_id, progress, completed, last_activity)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [userId, 'course', courseId, 0, false]
            );

            res.json({ 
                success: true, 
                payment: paymentResult.rows[0],
                message: 'Payment completed successfully'
            });
        } catch (error) {
            logger.error('Create payment error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleAdminStats(req, res) {
        try {
            const userId = req.query.userId;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            // Проверяем права администратора
            const userResult = await db.query(
                'SELECT is_admin, is_super_admin FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const stats = await telegramBot.getAdminStats();
            res.json({ success: true, stats });
        } catch (error) {
            logger.error('Admin stats error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    start() {
        const port = config.PORT;
        
        this.server = this.app.listen(port, '0.0.0.0', () => {
            logger.info(`🌐 Express сервер запущен на порту ${port}`);
            logger.info(`📱 WebApp доступен: ${config.WEBAPP_URL}`);
            logger.info(`🔧 Режим: ${config.NODE_ENV}`);
            logger.info('✅ Система полностью готова к работе!');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    async shutdown() {
        logger.info('🛑 Остановка системы...');
        
        try {
            if (this.server) {
                this.server.close();
            }
            
            await db.close();
            
            logger.info('✅ Система остановлена корректно');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Ошибка при остановке системы:', error);
            process.exit(1);
        }
    }
}

// ==================== ЗАПУСК СИСТЕМЫ ====================
async function startSystem() {
    try {
        logger.info('🚀 Запуск Академии АНБ версии 2.0...');
        
        // Проверяем конфигурацию
        config.validate();
        
        // Создаем необходимые директории
        await fs.mkdir(config.UPLOAD_PATH, { recursive: true });
        await fs.mkdir(join(__dirname, 'logs'), { recursive: true });
        
        // Инициализируем системы
        await db.connect();
        
        // Запускаем сервер
        const expressServer = new ExpressServerSystem();
        expressServer.start();
        
    } catch (error) {
        logger.error('❌ Критическая ошибка при запуске системы:', error);
        process.exit(1);
    }
}

// Запускаем систему
startSystem();

export {
    db,
    security,
    telegramBot,
    logger,
    config
};
