// server.js - УПРОЩЕННАЯ ВЕРСИЯ ДЛЯ TIMEWEB
import { Telegraf, session, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ СИСТЕМЫ ====================
class SystemConfig {
    constructor() {
        this.BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
        this.PORT = process.env.PORT || 3000;
        this.WEBAPP_URL = process.env.WEBAPP_URL || `https://anb-academy.timeweb.ru`;
        this.ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(Number) : [898508164];
        this.SUPER_ADMIN_ID = parseInt(process.env.SUPER_ADMIN_ID) || 898508164;
        this.UPLOAD_PATH = join(__dirname, 'uploads');
        this.NODE_ENV = process.env.NODE_ENV || 'production';
        this.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@def46fb02c0eac8fefd6f734.twc1.net:5432/default_db';
        this.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
        this.JWT_SECRET = process.env.JWT_SECRET || 'anb-academy-super-secret-jwt-key-2024';
        this.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'anb-academy-encryption-key-256-bit-secure';
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
            min: 5
        };
    }
}

const config = new SystemConfig();

// ==================== СИСТЕМА ЛОГИРОВАНИЯ ====================
class LoggerSystem {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'anb-academy' },
            transports: [
                new winston.transports.File({ 
                    filename: join(__dirname, 'logs/error.log'), 
                    level: 'error'
                }),
                new winston.transports.File({ 
                    filename: join(__dirname, 'logs/combined.log')
                }),
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

    info(message, meta = {}) {
        this.log('info', message, meta);
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
            
            const { Client } = await import('pg');
            this.pgClient = new Client(config.getDatabaseConfig());
            
            await this.pgClient.connect();
            this.connected = true;
            logger.info('✅ PostgreSQL подключена');
            
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
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                survey_completed BOOLEAN DEFAULT FALSE,
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
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                time_spent INTEGER DEFAULT 0,
                last_activity TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, course_id)
            )`
        ];

        for (const tableSQL of tables) {
            try {
                await this.pgClient.query(tableSQL);
            } catch (error) {
                logger.error(`Ошибка создания таблицы:`, error.message);
            }
        }

        logger.info('✅ Таблицы базы данных созданы');
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
                    `INSERT INTO users (id, telegram_data, is_admin, is_super_admin, is_verified, survey_completed)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        config.SUPER_ADMIN_ID,
                        JSON.stringify({
                            first_name: 'Супер Администратор',
                            username: 'superadmin'
                        }),
                        true,
                        true,
                        true,
                        true
                    ]
                );
                logger.info('✅ Супер-администратор создан');
            }

            // Создаем демо-курсы
            const coursesCheck = await this.pgClient.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCheck.rows[0].count) === 0) {
                const demoCourses = [
                    {
                        title: 'Мануальные техники в практике невролога',
                        description: '6 модулей по современным мануальным методикам',
                        price: 25000,
                        duration: '12 недель',
                        modules: 6,
                        category: 'Мануальные техники',
                        level: 'advanced',
                        featured: true,
                        students_count: 156,
                        rating: 4.8,
                        created_by: config.SUPER_ADMIN_ID
                    },
                    {
                        title: 'Неврологическая диагностика',
                        description: '5 модулей по современной диагностике',
                        price: 18000,
                        duration: '8 недель',
                        modules: 5,
                        category: 'Неврология',
                        level: 'intermediate',
                        featured: true,
                        students_count: 234,
                        rating: 4.6,
                        created_by: config.SUPER_ADMIN_ID
                    }
                ];

                for (const course of demoCourses) {
                    await this.pgClient.query(
                        `INSERT INTO courses (title, description, price, duration, modules, category, level, featured, students_count, rating, created_by)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                        Object.values(course)
                    );
                }

                logger.info('✅ Демо-курсы созданы');
            }
        } catch (error) {
            logger.error('Ошибка инициализации данных:', error);
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
            logger.info('✅ Соединение с БД закрыто');
        } catch (error) {
            logger.error('Ошибка при закрытии соединения с БД:', error);
        }
    }
}

const db = new DatabaseSystem();

// ==================== TELEGRAM BOT СИСТЕМА ====================
class TelegramBotSystem {
    constructor() {
        this.bot = null;
        this.setupBot();
    }

    setupBot() {
        try {
            logger.info('🤖 Инициализация Telegram бота...');
            
            this.bot = new Telegraf(config.BOT_TOKEN);
            this.setupHandlers();
            this.launchBot();
            
        } catch (error) {
            logger.error('❌ Ошибка инициализации бота:', error);
        }
    }

    setupHandlers() {
        this.bot.start(this.handleStart.bind(this));
        this.bot.command('menu', this.handleMenu.bind(this));
        this.bot.command('courses', this.handleCourses.bind(this));
        this.bot.command('profile', this.handleProfile.bind(this));
        this.bot.command('help', this.handleHelp.bind(this));

        this.bot.on('text', this.handleText.bind(this));
    }

    async handleStart(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            
            await ctx.reply(
                `👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n` +
                `Я - ваш помощник в мире медицинского образования. ` +
                `Здесь вы найдете курсы, материалы и сообщество коллег.\n\n` +
                `Используйте команды:\n` +
                `/courses - Посмотреть курсы\n` +
                `/profile - Ваш профиль\n` +
                `/menu - Главное меню\n` +
                `/help - Помощь`
            );

            if (!user.survey_completed) {
                await this.startSurvey(ctx);
            }
        } catch (error) {
            logger.error('Start handler error:', error);
            await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    async handleMenu(ctx) {
        await ctx.reply('🎯 Главное меню Академии АНБ', {
            reply_markup: {
                keyboard: [
                    ['📱 Открыть приложение'],
                    ['📚 Курсы', '🎧 Подкасты'],
                    ['📹 Эфиры', '📋 Материалы'],
                    ['👤 Профиль', '🆘 Помощь']
                ],
                resize_keyboard: true
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

        await ctx.reply(`📚 Доступные курсы:\n\n${coursesText}\n\nДля подробной информации откройте приложение:`, {
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
            `💳 Подписка: ${user.subscription_data?.status === 'active' ? 'Активна' : 'Не активна'}\n\n` +
            `Для управления профилем откройте приложение:`;

        await ctx.reply(profileText, {
            reply_markup: {
                inline_keyboard: [[
                    { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                ]]
            }
        });
    }

    async handleHelp(ctx) {
        await ctx.reply(
            `🆘 Помощь по Академии АНБ:\n\n` +
            `📚 /courses - Посмотреть курсы\n` +
            `👤 /profile - Ваш профиль\n` +
            `🆘 /support - Связь с поддержкой\n` +
            `📱 /menu - Главное меню\n\n` +
            `💬 Поддержка: @anb_academy_support\n` +
            `📧 Email: support@anb-academy.ru`
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

    async startSurvey(ctx) {
        // Упрощенный опрос
        await ctx.reply(
            '📝 Давайте познакомимся! Какая у вас специализация?',
            {
                reply_markup: {
                    keyboard: [
                        ['Невролог', 'Реабилитолог'],
                        ['Мануальный терапевт', 'Другое']
                    ],
                    resize_keyboard: true
                }
            }
        );
    }

    launchBot() {
        this.bot.launch().then(() => {
            logger.info('✅ Telegram Bot запущен');
        }).catch(error => {
            logger.error('❌ Ошибка запуска бота:', error);
        });

        // Graceful shutdown
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
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
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(morgan('combined'));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100
        });
        this.app.use(limiter);

        // Статические файлы
        this.app.use('/uploads', express.static(join(__dirname, 'uploads')));
        this.app.use('/webapp', express.static(join(__dirname, 'webapp')));
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', async (req, res) => {
            try {
                await db.query('SELECT 1');
                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: '2.0.0'
                });
            } catch (error) {
                res.status(503).json({
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        // User routes
        this.app.post('/api/user', this.handleUserRequest.bind(this));
        
        // Content routes
        this.app.get('/api/content', this.handleGetContent.bind(this));
        this.app.get('/api/content/:type', this.handleGetContentByType.bind(this));

        // Webhook для Telegram
        this.app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
            telegramBot.bot.handleUpdate(req.body, res);
        });

        // SPA fallback
        this.app.get('*', (req, res) => {
            res.sendFile(join(__dirname, 'webapp', 'index.html'));
        });
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

            const userResponse = {
                id: user.id,
                firstName: user.telegram_data?.first_name || firstName,
                username: user.telegram_data?.username || username,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                joinedAt: user.created_at
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetContent(req, res) {
        try {
            const contentTypes = ['courses', 'podcasts', 'streams', 'videos', 'materials', 'events'];
            const content = {};

            for (const type of contentTypes) {
                try {
                    if (type === 'courses') {
                        const result = await db.query(
                            `SELECT *, 
                             COALESCE(image_url, '/webapp/assets/course-default.jpg') as image_url 
                             FROM courses WHERE active = TRUE ORDER BY created_at DESC LIMIT 20`
                        );
                        content[type] = result.rows;
                    } else {
                        content[type] = [];
                    }
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
            
            if (type === 'courses') {
                const result = await db.query(
                    'SELECT * FROM courses WHERE active = TRUE ORDER BY created_at DESC'
                );
                res.json({ success: true, data: result.rows });
            } else {
                res.json({ success: true, data: [] });
            }
        } catch (error) {
            logger.error('Content by type error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    setupErrorHandling() {
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Route not found',
                path: req.path,
                method: req.method
            });
        });

        this.app.use((error, req, res, next) => {
            logger.error('Global error handler:', error);
            res.status(error.status || 500).json({
                error: 'Internal server error'
            });
        });
    }

    start() {
        const port = config.PORT;
        
        this.server = this.app.listen(port, '0.0.0.0', () => {
            logger.info(`🌐 Express сервер запущен на порту ${port}`);
            logger.info(`📱 WebApp доступен: ${config.WEBAPP_URL}`);
            logger.info(`🔧 Режим: ${config.NODE_ENV}`);
            logger.info('✅ Система полностью готова к работе!');
        });

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
    telegramBot,
    logger,
    config
};
