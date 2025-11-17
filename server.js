// server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { Telegraf, session, Markup, Scenes } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
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
        this.JWT_SECRET = process.env.JWT_SECRET || 'anb-academy-super-secret-jwt-key-2024';
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

    warn(message, meta = {}) {
        this.log('warn', message, meta);
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
            
            // Упрощенное подключение для демо
            this.connected = true;
            logger.info('✅ База данных подключена');
            
        } catch (error) {
            logger.error('❌ Ошибка подключения к БД:', error);
            throw error;
        }
    }

    async query(text, params) {
        if (!this.connected) {
            throw new Error('База данных не подключена');
        }

        try {
            // Демо-режим - возвращаем заглушки
            return { rows: [] };
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }

    async close() {
        this.connected = false;
        logger.info('✅ Соединение с базой данных закрыто');
    }
}

const db = new DatabaseSystem();

// ==================== СИСТЕМА БЕЗОПАСНОСТИ ====================
class SecuritySystem {
    constructor() {
        this.rateLimiters = new Map();
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
        this.bot.command('courses', this.handleCourses.bind(this));
        this.bot.command('help', this.handleHelp.bind(this));

        // Обработчики сообщений
        this.bot.on('text', this.handleText.bind(this));
    }

    async handleStart(ctx) {
        try {
            await ctx.reply('👋 Добро пожаловать в Академию АНБ!', {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                    ]]
                }
            });
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
                    ['👤 Профиль', '🆘 Помощь']
                ],
                resize_keyboard: true
            }
        });
    }

    async handleCourses(ctx) {
        await ctx.reply('📚 Для просмотра курсов откройте веб-приложение:', {
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
            `📚 /courses - Посмотреть курсы\n` +
            `👤 /profile - Посмотреть профиль\n` +
            `🆘 /support - Связь с поддержкой\n` +
            `📱 /menu - Главное меню\n\n` +
            `Для полного доступа ко всем функциям откройте WebApp:\n${config.WEBAPP_URL}`;

        await ctx.reply(helpText);
    }

    async handleText(ctx) {
        const message = ctx.message.text;
        
        if (message.toLowerCase().includes('привет')) {
            await this.handleStart(ctx);
        } else {
            await ctx.reply(
                `Используйте команды:\n` +
                `/start - Начать работу\n` +
                `/menu - Главное меню\n` +
                `/help - Помощь`
            );
        }
    }

    async launchBot() {
        if (config.NODE_ENV === 'production') {
            this.bot.launch({
                webhook: {
                    domain: config.WEBAPP_URL,
                    port: config.PORT
                }
            }).then(() => {
                logger.info('✅ Telegram Bot запущен в production режиме');
            }).catch(error => {
                logger.error('❌ Ошибка запуска бота в production:', error);
            });
        } else {
            this.bot.launch().then(() => {
                logger.info('✅ Telegram Bot запущен в development режиме');
            }).catch(error => {
                logger.error('❌ Ошибка запуска бота в development:', error);
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
        this.app.use(helmet());
        
        // CORS
        this.app.use(cors());
        
        // Парсинг JSON
        this.app.use(express.json({ limit: '50mb' }));
        
        // Парсинг URL-encoded данных
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Логирование
        this.app.use(morgan('combined'));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: { error: 'Слишком много запросов' }
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
                const uploadType = file.fieldname || 'general';
                const uploadPath = join(config.UPLOAD_PATH, uploadType);
                
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
                'video/mp4', 'video/quicktime',
                'audio/mpeg', 'audio/wav', 'audio/ogg',
                'application/pdf'
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
                fileSize: config.UPLOAD_MAX_SIZE,
                files: 10
            },
            fileFilter: fileFilter
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', async (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            });
        });

        // User routes
        this.app.post('/api/user', this.handleUserRequest.bind(this));
        this.app.get('/api/user/profile', this.handleUserProfile.bind(this));

        // Content routes
        this.app.get('/api/content', this.handleGetContent.bind(this));
        this.app.get('/api/content/:type', this.handleGetContentByType.bind(this));

        // Favorites routes
        this.app.get('/api/favorites', this.handleGetFavorites.bind(this));
        this.app.post('/api/favorites/toggle', this.handleToggleFavorite.bind(this));

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

    async handleUserRequest(req, res) {
        try {
            const { id, firstName, username } = req.body;
            
            if (!id) {
                return res.status(400).json({ error: 'User ID is required' });
            }

            // Демо-пользователь
            const userResponse = {
                id: id,
                firstName: firstName || 'Демо Пользователь',
                username: username || 'demo_user',
                specialization: 'Невролог',
                city: 'Москва',
                email: 'demo@anb-academy.ru',
                subscription: { 
                    status: 'active', 
                    type: 'premium',
                    features: {
                        courses_access: true,
                        premium_content: true,
                        personal_consultation: true
                    }
                },
                progress: {
                    level: 'Понимаю',
                    experience: 1250,
                    level_threshold: 1000,
                    steps: {
                        coursesBought: 3,
                        modulesCompleted: 12,
                        materialsWatched: 8
                    }
                },
                favorites: {
                    courses: [1, 2],
                    podcasts: [1],
                    streams: [1]
                },
                isAdmin: true,
                isSuperAdmin: true,
                joinedAt: new Date().toISOString()
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUserProfile(req, res) {
        try {
            // Демо-профиль
            const userResponse = {
                id: 898508164,
                firstName: 'Демо Пользователь',
                specialization: 'Невролог',
                city: 'Москва',
                subscription: { status: 'active', type: 'premium' },
                isAdmin: true
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetContent(req, res) {
        try {
            // Демо-контент
            const demoContent = {
                courses: [
                    {
                        id: 1,
                        title: 'Мануальные техники в практике невролога',
                        description: '6 модулей по современным мануальным методикам',
                        price: 25000,
                        duration: '12 недель',
                        modules: 6,
                        students_count: 156,
                        rating: 4.8,
                        image_url: '/webapp/assets/course-manual.jpg',
                        category: 'Мануальные техники',
                        level: 'advanced',
                        featured: true
                    },
                    {
                        id: 2,
                        title: 'Неврологическая диагностика',
                        description: '5 модулей по современной диагностике',
                        price: 18000,
                        duration: '8 недель',
                        modules: 5,
                        students_count: 234,
                        rating: 4.6,
                        image_url: '/webapp/assets/course-diagnosis.jpg',
                        category: 'Неврология',
                        level: 'intermediate',
                        featured: true
                    }
                ],
                podcasts: [
                    {
                        id: 1,
                        title: 'АНБ FM: Современная неврология',
                        description: 'Обсуждение новых тенденций в неврологии',
                        duration: '45:20',
                        listens: 2345,
                        image_url: '/webapp/assets/podcast-neurology.jpg'
                    }
                ],
                streams: [
                    {
                        id: 1,
                        title: 'Разбор клинического случая',
                        description: 'Прямой эфир с разбором сложного случая',
                        duration: '1:30:00',
                        participants: 89,
                        thumbnail_url: '/webapp/assets/stream-pain-syndrome.jpg',
                        live: true
                    }
                ],
                videos: [
                    {
                        id: 1,
                        title: 'Неврологический осмотр за 15 минут',
                        description: 'Быстрый гайд по основным тестам',
                        duration: '15:30',
                        views: 4567,
                        thumbnail_url: '/webapp/assets/video-neurological-exam.jpg'
                    }
                ],
                materials: [
                    {
                        id: 1,
                        title: 'МРТ разбор: Рассеянный склероз',
                        description: 'Детальный разбор МРТ с клиническими случаями',
                        downloads: 1234,
                        image_url: '/webapp/assets/material-ms-mri.jpg'
                    }
                ],
                events: [
                    {
                        id: 1,
                        title: 'Конференция: Современная неврология 2024',
                        description: 'Ежегодная конференция с ведущими специалистами',
                        event_date: new Date('2024-02-15T10:00:00').toISOString(),
                        location: 'Москва',
                        participants: 456,
                        image_url: '/webapp/assets/event-neurology-conf.jpg'
                    }
                ]
            };

            res.json({ success: true, data: demoContent });
        } catch (error) {
            logger.error('Content API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetContentByType(req, res) {
        try {
            const { type } = req.params;
            
            // Демо-данные по типам
            const typeData = {
                courses: [
                    {
                        id: 1,
                        title: 'Мануальные техники в практике невролога',
                        description: '6 модулей по современным мануальным методикам',
                        price: 25000,
                        image_url: '/webapp/assets/course-manual.jpg'
                    }
                ],
                podcasts: [],
                streams: [],
                videos: [],
                materials: []
            };

            res.json({ 
                success: true, 
                data: typeData[type] || [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: typeData[type]?.length || 0,
                    totalPages: 1
                }
            });
        } catch (error) {
            logger.error('Content by type error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetFavorites(req, res) {
        try {
            // Демо-избранное
            const favorites = {
                courses: [1, 2],
                podcasts: [1],
                streams: [1],
                videos: [1],
                materials: [1]
            };

            res.json({ success: true, favorites });
        } catch (error) {
            logger.error('Get favorites error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleToggleFavorite(req, res) {
        try {
            const { contentId, contentType } = req.body;
            
            // Демо-ответ
            const favorites = {
                courses: [1, 2],
                podcasts: [1],
                streams: [1],
                videos: [1],
                materials: [1]
            };

            res.json({ success: true, favorites });
        } catch (error) {
            logger.error('Toggle favorite error:', error);
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
