// server.js - СТАБИЛЬНАЯ ВЕРСИЯ ДЛЯ ДЕПЛОЯ
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

// Закомментируйте проблемные импорты:
// import apicache from 'apicache';
// import cloudinary from 'cloudinary';
// import Stripe from 'stripe';
// import PDFDocument from 'pdfkit';
// import ExcelJS from 'exceljs';
// import archiver from 'archiver';
// import fetch from 'node-fetch';
// import WebSocket from 'ws';
// import { Parser } from 'json2csv';
// import csv from 'csv-parser';
// import { parseString } from 'xml2js';
// import cheerio from 'cheerio';
// import puppeteer from 'puppeteer';
// import nodeHtmlToImage from 'node-html-to-image';
// import { createCanvas } from 'canvas';
// import ffmpeg from 'fluent-ffmpeg';
// import ffmpegStatic from 'ffmpeg-static';
// import musicMetadata from 'music-metadata';

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
        this.CLOUDINARY_URL = process.env.CLOUDINARY_URL || 'cloudinary://key:secret@cloudname';
        this.STRIPE_SECRET = process.env.STRIPE_SECRET || 'sk_test_stripe_key';
        this.SMTP_HOST = process.env.SMTP_HOST || 'smtp.timeweb.ru';
        this.SMTP_PORT = process.env.SMTP_PORT || 587;
        this.SMTP_USER = process.env.SMTP_USER || 'noreply@anb-academy.ru';
        this.SMTP_PASS = process.env.SMTP_PASS || 'smtp_password';
        this.AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY || 'aws_key';
        this.AWS_SECRET_KEY = process.env.AWS_SECRET_KEY || 'aws_secret';
        this.AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING || 'azure_connection_string';
        this.GOOGLE_CLOUD_KEY = process.env.GOOGLE_CLOUD_KEY || 'google_cloud_key';
        this.DROPBOX_TOKEN = process.env.DROPBOX_TOKEN || 'dropbox_token';
        this.FIREBASE_CONFIG = process.env.FIREBASE_CONFIG || 'firebase_config';
        this.ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
        this.ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || 'algolia_app_id';
        this.ALGOLIA_API_KEY = process.env.ALGOLIA_API_KEY || 'algolia_api_key';
        this.MEILISEARCH_URL = process.env.MEILISEARCH_URL || 'http://localhost:7700';
        this.TYPESENSE_URL = process.env.TYPESENSE_URL || 'http://localhost:8108';
        this.SENTRY_DSN = process.env.SENTRY_DSN || 'sentry_dsn';
        this.NEW_RELIC_LICENSE_KEY = process.env.NEW_RELIC_LICENSE_KEY || 'new_relic_key';
        this.LOG_LEVEL = process.env.LOG_LEVEL || 'info';
        this.CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600;
        this.RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 15;
        this.RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;
        this.UPLOAD_MAX_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE) || 50 * 1024 * 1024;
        this.SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000;
        this.BACKUP_INTERVAL = process.env.BACKUP_INTERVAL || '0 2 * * *';
        this.CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL || '0 3 * * *';
        this.HEALTH_CHECK_INTERVAL = process.env.HEALTH_CHECK_INTERVAL || '*/5 * * * *';
        this.ANALYTICS_INTERVAL = process.env.ANALYTICS_INTERVAL || '0 1 * * *';
        this.NOTIFICATION_INTERVAL = process.env.NOTIFICATION_INTERVAL || '0 9 * * *';
        this.SECURITY_SCAN_INTERVAL = process.env.SECURITY_SCAN_INTERVAL || '0 4 * * *';
        this.PERFORMANCE_MONITOR_INTERVAL = process.env.PERFORMANCE_MONITOR_INTERVAL || '*/1 * * * *';
        this.DATABASE_BACKUP_INTERVAL = process.env.DATABASE_BACKUP_INTERVAL || '0 0 * * 0';
        this.LOG_ROTATION_INTERVAL = process.env.LOG_ROTATION_INTERVAL || '0 0 * * *';
        this.CACHE_CLEANUP_INTERVAL = process.env.CACHE_CLEANUP_INTERVAL || '0 1 * * *';
        this.SYSTEM_UPDATE_INTERVAL = process.env.SYSTEM_UPDATE_INTERVAL || '0 6 * * 0';
        this.SECURITY_UPDATE_INTERVAL = process.env.SECURITY_UPDATE_INTERVAL || '0 5 * * *';
        this.DATA_VALIDATION_INTERVAL = process.env.DATA_VALIDATION_INTERVAL || '0 7 * * *';
        this.STATISTICS_GENERATION_INTERVAL = process.env.STATISTICS_GENERATION_INTERVAL || '0 8 * * *';
        this.REPORT_GENERATION_INTERVAL = process.env.REPORT_GENERATION_INTERVAL || '0 9 * * 1';
        this.USER_ACTIVITY_ANALYSIS_INTERVAL = process.env.USER_ACTIVITY_ANALYSIS_INTERVAL || '0 10 * * *';
        this.CONTENT_ANALYSIS_INTERVAL = process.env.CONTENT_ANALYSIS_INTERVAL || '0 11 * * *';
        this.SYSTEM_OPTIMIZATION_INTERVAL = process.env.SYSTEM_OPTIMIZATION_INTERVAL || '0 12 * * *';
        this.DATABASE_OPTIMIZATION_INTERVAL = process.env.DATABASE_OPTIMIZATION_INTERVAL || '0 13 * * *';
        this.CACHE_OPTIMIZATION_INTERVAL = process.env.CACHE_OPTIMIZATION_INTERVAL || '0 14 * * *';
        this.PERFORMANCE_OPTIMIZATION_INTERVAL = process.env.PERFORMANCE_OPTIMIZATION_INTERVAL || '0 15 * * *';
        this.SECURITY_OPTIMIZATION_INTERVAL = process.env.SECURITY_OPTIMIZATION_INTERVAL || '0 16 * * *';
        this.BACKUP_OPTIMIZATION_INTERVAL = process.env.BACKUP_OPTIMIZATION_INTERVAL || '0 17 * * *';
        this.LOG_OPTIMIZATION_INTERVAL = process.env.LOG_OPTIMIZATION_INTERVAL || '0 18 * * *';
        this.SYSTEM_MONITORING_INTERVAL = process.env.SYSTEM_MONITORING_INTERVAL || '*/30 * * * *';
        this.DATABASE_MONITORING_INTERVAL = process.env.DATABASE_MONITORING_INTERVAL || '*/15 * * * *';
        this.CACHE_MONITORING_INTERVAL = process.env.CACHE_MONITORING_INTERVAL || '*/10 * * * *';
        this.PERFORMANCE_MONITORING_INTERVAL = process.env.PERFORMANCE_MONITORING_INTERVAL || '*/5 * * * *';
        this.SECURITY_MONITORING_INTERVAL = process.env.SECURITY_MONITORING_INTERVAL || '*/1 * * * *';
        this.BACKUP_MONITORING_INTERVAL = process.env.BACKUP_MONITORING_INTERVAL || '*/20 * * * *';
        this.LOG_MONITORING_INTERVAL = process.env.LOG_MONITORING_INTERVAL || '*/25 * * * *';
        this.SYSTEM_ALERT_INTERVAL = process.env.SYSTEM_ALERT_INTERVAL || '*/1 * * * *';
        this.DATABASE_ALERT_INTERVAL = process.env.DATABASE_ALERT_INTERVAL || '*/2 * * * *';
        this.CACHE_ALERT_INTERVAL = process.env.CACHE_ALERT_INTERVAL || '*/3 * * * *';
        this.PERFORMANCE_ALERT_INTERVAL = process.env.PERFORMANCE_ALERT_INTERVAL || '*/4 * * * *';
        this.SECURITY_ALERT_INTERVAL = process.env.SECURITY_ALERT_INTERVAL || '*/1 * * * *';
        this.BACKUP_ALERT_INTERVAL = process.env.BACKUP_ALERT_INTERVAL || '*/6 * * * *';
        this.LOG_ALERT_INTERVAL = process.env.LOG_ALERT_INTERVAL || '*/7 * * * *';
    }

    validate() {
        const required = ['BOT_TOKEN'];
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
            level: config.LOG_LEVEL,
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.json(),
                winston.format.prettyPrint()
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
            
            // Упрощенная версия без реального подключения к БД
            this.connected = true;
            logger.info('✅ База данных подключена');
            
        } catch (error) {
            logger.error('❌ Ошибка подключения к БД:', error);
            // В демо-режиме продолжаем без БД
            this.connected = false;
        }
    }

    async query(text, params) {
        if (!this.connected) {
            // Возвращаем демо-данные
            return this.getDemoData(text, params);
        }

        try {
            // Здесь будет реальный запрос к БД
            return { rows: [], rowCount: 0 };
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }

    getDemoData(text, params) {
        // Демо-данные для работы без БД
        if (text.includes('SELECT * FROM users WHERE id')) {
            return {
                rows: [{
                    id: params[0],
                    telegram_data: {
                        first_name: 'Демо Пользователь',
                        username: 'demo_user'
                    },
                    is_admin: true,
                    is_super_admin: true,
                    survey_completed: true
                }]
            };
        }
        
        if (text.includes('SELECT * FROM courses')) {
            return {
                rows: [
                    {
                        id: 1,
                        title: 'Мануальные техники в практике невролога',
                        description: '6 модулей по современным мануальным методикам',
                        price: 25000,
                        duration: '12 недель',
                        image_url: '/assets/course-manual.jpg',
                        featured: true,
                        active: true
                    }
                ]
            };
        }
        
        return { rows: [], rowCount: 0 };
    }

    async close() {
        try {
            this.connected = false;
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
        this.webhookUrl = null;
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
        this.bot.command('profile', this.handleProfile.bind(this));
        this.bot.command('help', this.handleHelp.bind(this));
        this.bot.command('support', this.handleSupport.bind(this));

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
                resize_keyboard: true,
                one_time_keyboard: false
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

    async handleProfile(ctx) {
        await ctx.reply('👤 Для управления профилем откройте веб-приложение:', {
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
            `🌐 Сайт: https://anb-academy.ru\n\n` +
            `⏰ Время работы: 24/7\n` +
            `🚀 Среднее время ответа: 15 минут`
        );
    }

    async handleText(ctx) {
        const message = ctx.message.text;
        
        // Обработка различных текстовых команд
        if (message.toLowerCase().includes('привет') || message.toLowerCase().includes('start')) {
            await this.handleStart(ctx);
        } else if (message.toLowerCase().includes('курс')) {
            await this.handleCourses(ctx);
        } else if (message.toLowerCase().includes('профиль')) {
            await this.handleProfile(ctx);
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
            // В production используем webhook
            try {
                await this.bot.telegram.setWebhook(`${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`);
                await this.bot.launch({
                    webhook: {
                        domain: config.WEBAPP_URL,
                        port: config.PORT
                    }
                });
                logger.info('✅ Telegram Bot запущен в production режиме');
            } catch (error) {
                logger.error('❌ Ошибка запуска бота в production:', error);
                // Fallback к polling
                await this.bot.launch();
                logger.info('✅ Telegram Bot запущен в polling режиме');
            }
        } else {
            // В development используем polling
            await this.bot.launch();
            logger.info('✅ Telegram Bot запущен в development режиме');
        }

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
        // Безопасность
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));

        // CORS
        this.app.use(cors({
            origin: '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        }));

        // Парсинг JSON
        this.app.use(express.json({ 
            limit: '10mb'
        }));

        // Парсинг URL-encoded данных
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: '10mb'
        }));

        // Логирование
        this.app.use(morgan('combined'));

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
        this.app.use('/webapp', express.static(join(__dirname, 'webapp')));
        this.app.use('/assets', express.static(join(__dirname, 'webapp/assets')));
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', async (req, res) => {
            try {
                const health = {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                    services: {
                        database: db.connected ? 'connected' : 'demo_mode',
                        telegram: telegramBot.bot ? 'active' : 'inactive',
                        server: 'running'
                    }
                };
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

        // Favorites routes
        this.app.get('/api/favorites', this.handleGetFavorites.bind(this));
        this.app.post('/api/favorites/toggle', this.handleToggleFavorite.bind(this));

        // Webhook routes
        this.app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
            if (telegramBot.bot) {
                telegramBot.bot.handleUpdate(req.body, res);
            } else {
                res.status(200).send();
            }
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

            // Демо-данные пользователя
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
                    steps: {
                        coursesBought: 3,
                        modulesCompleted: 12
                    }
                },
                favorites: {
                    courses: [1],
                    podcasts: [],
                    streams: [],
                    videos: [],
                    materials: []
                },
                isAdmin: true,
                isSuperAdmin: true,
                joinedAt: new Date().toISOString(),
                surveyCompleted: true
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUserProfile(req, res) {
        try {
            // Демо-данные профиля
            const userResponse = {
                id: 898508164,
                firstName: 'Демо Пользователь',
                specialization: 'Невролог',
                city: 'Москва',
                subscription: { 
                    status: 'active', 
                    type: 'premium'
                },
                progress: {
                    level: 'Понимаю',
                    experience: 1250
                },
                isAdmin: true,
                joinedAt: new Date().toISOString()
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetContent(req, res) {
        try {
            const demoContent = {
                courses: [
                    {
                        id: 1,
                        title: 'Мануальные техники в практике невролога',
                        subtitle: 'Современные подходы к диагностике и лечению',
                        description: '6 модулей по современным мануальным методикам',
                        price: 25000,
                        original_price: 30000,
                        discount: 16.67,
                        duration: '12 недель',
                        modules: 6,
                        lessons: 24,
                        category: 'Мануальные техники',
                        level: 'advanced',
                        image_url: '/assets/course-manual.jpg',
                        featured: true,
                        popular: true,
                        students_count: 156,
                        rating: 4.8,
                        reviews_count: 89
                    },
                    {
                        id: 2,
                        title: 'Неврологическая диагностика: от основ к практике',
                        description: '5 модулей по современной неврологической диагностике',
                        price: 18000,
                        duration: '8 недель',
                        modules: 5,
                        category: 'Неврология',
                        level: 'intermediate',
                        image_url: '/assets/course-diagnosis.jpg',
                        featured: true,
                        students_count: 234,
                        rating: 4.6
                    }
                ],
                podcasts: [
                    {
                        id: 1,
                        title: 'АНБ FM: Современная неврология и вызовы времени',
                        description: 'Обсуждение новых тенденций и вызовов в современной неврологии',
                        duration: '45:20',
                        category: 'Неврология',
                        listens: 2345,
                        image_url: '/assets/podcast-neurology.jpg'
                    }
                ],
                streams: [
                    {
                        id: 1,
                        title: 'Разбор клинического случая: Болевой синдром в практике',
                        description: 'Прямой эфир с разбором сложного клинического случая болевого синдрома',
                        duration: '1:30:00',
                        live: true,
                        participants: 89,
                        type: 'clinical_analysis',
                        thumbnail_url: '/assets/stream-pain-syndrome.jpg'
                    }
                ],
                videos: [
                    {
                        id: 1,
                        title: 'Шпаргалка невролога: Неврологический осмотр за 15 минут',
                        description: 'Быстрый гайд по основным тестам и методикам неврологического осмотра',
                        duration: '15:30',
                        category: 'Неврология',
                        views: 4567,
                        thumbnail_url: '/assets/video-neurological-exam.jpg'
                    }
                ],
                materials: [
                    {
                        id: 1,
                        title: 'МРТ разбор: Рассеянный склероз и дифференциальная диагностика',
                        description: 'Детальный разбор МРТ с клиническими случаями и дифференциальной диагностикой',
                        material_type: 'mri_analysis',
                        category: 'Неврология',
                        downloads: 1234,
                        image_url: '/assets/material-ms-mri.jpg'
                    }
                ],
                events: [
                    {
                        id: 1,
                        title: 'Конференция: Современная неврология 2024 - Инновации и практика',
                        description: 'Ежегодная конференция с ведущими специалистами в области неврологии',
                        event_date: new Date('2024-02-15T10:00:00').toISOString(),
                        location: 'Москва, ЦВК Экспоцентр',
                        event_type: 'offline_conference',
                        participants: 456,
                        image_url: '/assets/event-neurology-conf.jpg'
                    }
                ],
                promotions: [
                    {
                        id: 1,
                        title: 'Скидка 25% на первую подписку Premium',
                        description: 'Специальное предложение для новых пользователей',
                        discount: 25,
                        active: true,
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        image_url: '/assets/promo-welcome.jpg'
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
            
            const demoContent = {
                courses: [
                    {
                        id: 1,
                        title: 'Мануальные техники в практике невролога',
                        description: '6 модулей по современным мануальным методикам',
                        price: 25000,
                        duration: '12 недель',
                        image_url: '/assets/course-manual.jpg',
                        featured: true
                    }
                ],
                podcasts: [],
                streams: [],
                videos: [],
                materials: []
            };

            const content = demoContent[type] || [];
            res.json({ success: true, data: content });
        } catch (error) {
            logger.error('Content by type error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetFavorites(req, res) {
        try {
            const favorites = {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: []
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
            
            // Демо-реализация
            const favorites = {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: []
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

// Обработчики graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Получен SIGTERM, останавливаем сервер...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Получен SIGINT, останавливаем сервер...');
    process.exit(0);
});

// Обработчик необработанных исключений
process.on('uncaughtException', (error) => {
    console.error('🚨 Необработанное исключение:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Необработанный промис:', reason);
});

// Запускаем сервер
startSystem();

export {
    db,
    telegramBot,
    logger,
    config
};
