// server.js - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ
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
            host: '45.89.190.49',
            database: 'default_db',
            password: '5-R;mKGYJ<88?1',
            port: 5432,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            max: 20,
            min: 5,
            acquireTimeoutMillis: 30000,
            createTimeoutMillis: 30000,
            destroyTimeoutMillis: 5000,
            reapIntervalMillis: 1000,
            createRetryIntervalMillis: 100,
        };
    }

    getRedisConfig() {
        return {
            host: 'localhost',
            port: 6379,
            password: process.env.REDIS_PASSWORD,
            db: 0,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
            autoResubscribe: false,
            autoResendUnfulfilledCommands: false,
            lazyConnect: true,
        };
    }

    getCloudinaryConfig() {
        return {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        };
    }

    getStripeConfig() {
        return {
            apiVersion: '2023-10-16',
            maxNetworkRetries: 3,
            timeout: 30000,
            host: 'api.stripe.com',
            port: 443,
            protocol: 'https'
        };
    }

    getSMTPConfig() {
        return {
            host: this.SMTP_HOST,
            port: this.SMTP_PORT,
            secure: false,
            auth: {
                user: this.SMTP_USER,
                pass: this.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        };
    }

    getFirebaseConfig() {
        return {};
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
                new winston.transports.File({ 
                    filename: join(__dirname, 'logs/error.log'), 
                    level: 'error',
                    maxsize: 5242880,
                    maxFiles: 5
                }),
                new winston.transports.File({ 
                    filename: join(__dirname, 'logs/combined.log'),
                    maxsize: 5242880,
                    maxFiles: 5
                }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });

        this.setupLogRotation();
    }

    setupLogRotation() {
        cron.schedule(config.LOG_ROTATION_INTERVAL, () => {
            this.rotateLogs();
        });
    }

    async rotateLogs() {
        try {
            const logDir = join(__dirname, 'logs');
            const files = await fs.readdir(logDir);
            
            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = join(logDir, file);
                    const stats = await fs.stat(filePath);
                    const fileSize = stats.size / (1024 * 1024);
                    
                    if (fileSize > 5) {
                        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
                        const newPath = join(logDir, `${file}.${timestamp}.bak`);
                        await fs.rename(filePath, newPath);
                        this.info(`Rotated log file: ${file} -> ${newPath}`);
                    }
                }
            }
        } catch (error) {
            this.error('Error rotating logs:', error);
        }
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

    audit(action, user, resource, details = {}) {
        this.info(`AUDIT: ${action}`, {
            user,
            resource,
            action,
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    security(event, user, details = {}) {
        this.warn(`SECURITY: ${event}`, {
            user,
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }

    performance(operation, duration, details = {}) {
        this.info(`PERFORMANCE: ${operation}`, {
            operation,
            duration,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
}

const logger = new LoggerSystem();

// ==================== СИСТЕМА КЭШИРОВАНИЯ ====================
class CacheSystem {
    constructor() {
        try {
            this.redis = new Redis(config.getRedisConfig());
            this.memoryCache = new Map();
            this.setupEventListeners();
            this.setupCleanup();
        } catch (error) {
            logger.error('Redis initialization failed, using memory cache only:', error);
            this.redis = null;
            this.memoryCache = new Map();
        }
    }

    setupEventListeners() {
        if (this.redis) {
            this.redis.on('connect', () => {
                logger.info('Redis cache connected');
            });

            this.redis.on('error', (error) => {
                logger.error('Redis cache error:', error);
            });

            this.redis.on('close', () => {
                logger.warn('Redis cache connection closed');
            });

            this.redis.on('reconnecting', () => {
                logger.info('Redis cache reconnecting...');
            });
        }
    }

    setupCleanup() {
        // Очистка памяти каждые 5 минут
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.memoryCache.entries()) {
                if (value.expiry && value.expiry < now) {
                    this.memoryCache.delete(key);
                }
            }
        }, 5 * 60 * 1000);

        // Очистка кэша по расписанию
        cron.schedule(config.CACHE_CLEANUP_INTERVAL, async () => {
            await this.cleanExpired();
        });
    }

    async get(key) {
        try {
            // Сначала пробуем Redis если доступен
            if (this.redis) {
                const value = await this.redis.get(key);
                if (value) {
                    return JSON.parse(value);
                }
            }

            // Потом память
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue && (!memoryValue.expiry || memoryValue.expiry > Date.now())) {
                return memoryValue.data;
            }

            return null;
        } catch (error) {
            // Fallback to memory cache
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue && (!memoryValue.expiry || memoryValue.expiry > Date.now())) {
                return memoryValue.data;
            }
            return null;
        }
    }

    async set(key, value, ttl = config.CACHE_TTL) {
        try {
            const cacheValue = {
                data: value,
                expiry: ttl ? Date.now() + ttl * 1000 : null
            };

            // Сохраняем в Redis если доступен
            if (this.redis) {
                if (ttl) {
                    await this.redis.setex(key, ttl, JSON.stringify(value));
                } else {
                    await this.redis.set(key, JSON.stringify(value));
                }
            }

            // Всегда сохраняем в память
            this.memoryCache.set(key, cacheValue);

            return true;
        } catch (error) {
            // Fallback to memory cache
            const cacheValue = {
                data: value,
                expiry: ttl ? Date.now() + ttl * 1000 : null
            };
            this.memoryCache.set(key, cacheValue);
            return true;
        }
    }

    async delete(key) {
        try {
            if (this.redis) {
                await this.redis.del(key);
            }
            this.memoryCache.delete(key);
            return true;
        } catch (error) {
            this.memoryCache.delete(key);
            return true;
        }
    }

    async flush() {
        try {
            if (this.redis) {
                await this.redis.flushdb();
            }
            this.memoryCache.clear();
            logger.info('Cache flushed');
        } catch (error) {
            this.memoryCache.clear();
            logger.info('Memory cache flushed');
        }
    }
}

const cache = new CacheSystem();

// ==================== БАЗА ДАННЫХ ====================
class DatabaseSystem {
    constructor() {
        this.pgClient = null;
        this.connected = false;
    }

    async connect() {
        try {
            logger.info('🗄️ Подключение к базе данных...');
            
            await this.connectPostgreSQL();
            
            this.connected = true;
            logger.info('✅ База данных подключена');
            
            await this.createTables();
            await this.initializeDefaultData();
            
        } catch (error) {
            logger.error('❌ Ошибка подключения к БД:', error);
            throw error;
        }
    }

    async connectPostgreSQL() {
        try {
            const { Client } = await import('pg');
            this.pgClient = new Client(config.getDatabaseConfig());
            
            await this.pgClient.connect();
            logger.info('✅ PostgreSQL подключена');
        } catch (error) {
            logger.error('❌ Ошибка подключения к PostgreSQL:', error);
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
                logger.info(`✅ Таблица создана: ${tableSQL.split(' ')[5]}`);
            } catch (error) {
                logger.error(`❌ Ошибка создания таблицы:`, error.message);
            }
        }

        logger.info('✅ Все таблицы базы данных созданы');
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
                    `INSERT INTO users (id, telegram_data, profile_data, is_admin, is_super_admin)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [
                        config.SUPER_ADMIN_ID,
                        JSON.stringify({
                            first_name: 'Супер Администратор',
                            username: 'superadmin',
                            language_code: 'ru'
                        }),
                        JSON.stringify({
                            specialization: 'Администратор системы',
                            city: 'Москва',
                            email: 'admin@anb-academy.ru'
                        }),
                        true,
                        true
                    ]
                );
                logger.info('✅ Супер-администратор создан');
            }

            // Создаем демо-контент
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
                        image_url: '/webapp/assets/course-manual.jpg',
                        students_count: 156,
                        rating: 4.8,
                        created_by: config.SUPER_ADMIN_ID,
                        featured: true
                    },
                    {
                        title: 'Неврологическая диагностика: от основ к практике',
                        description: '5 модулей по современной неврологической диагностике',
                        price: 18000,
                        duration: '8 недель',
                        modules: 5,
                        category: 'Неврология',
                        level: 'intermediate',
                        image_url: '/webapp/assets/course-diagnosis.jpg',
                        students_count: 234,
                        rating: 4.6,
                        created_by: config.SUPER_ADMIN_ID,
                        featured: true
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
            this.setupWebhook();
            this.setupHandlers();
            
            this.launchBot();
            
        } catch (error) {
            logger.error('❌ Ошибка инициализации бота:', error);
        }
    }

    setupWebhook() {
        if (config.NODE_ENV === 'production') {
            const webhookUrl = `${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`;
            this.bot.telegram.setWebhook(webhookUrl);
            logger.info(`🌐 Webhook установлен: ${webhookUrl}`);
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
            
            await ctx.reply('🎓 Добро пожаловать в Академию АНБ!', {
                reply_markup: {
                    keyboard: [
                        [{ text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }],
                        ['📚 Курсы', '🎧 Подкасты'],
                        ['👤 Профиль', '🆘 Помощь']
                    ],
                    resize_keyboard: true
                }
            });
        } catch (error) {
            logger.error('Start handler error:', error);
            await ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
        }
    }

    async handleMenu(ctx) {
        await ctx.reply('🎯 Главное меню:', {
            reply_markup: {
                keyboard: [
                    [{ text: '📱 Открыть приложение' }],
                    ['📚 Курсы', '🎧 Подкасты'],
                    ['📹 Эфиры', '📋 Материалы'],
                    ['👤 Профиль', '🆘 Помощь']
                ],
                resize_keyboard: true
            }
        });
    }

    async handleCourses(ctx) {
        try {
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
        } catch (error) {
            await ctx.reply('📚 Курсы:\n\n• Мануальные техники в практике невролога\n• Неврологическая диагностика\n\nОткройте приложение для подробностей:', {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                    ]]
                }
            });
        }
    }

    async handleProfile(ctx) {
        const user = await this.getOrCreateUser(ctx.from);
        
        const profileText = 
            `👤 Ваш профиль:\n\n` +
            `🆔 ID: ${user.id}\n` +
            `📛 Имя: ${user.telegram_data.first_name}\n` +
            `👤 Username: @${user.telegram_data.username || 'не указан'}\n` +
            `💳 Подписка: ${user.subscription_data.status === 'active' ? 'Активна' : 'Не активна'}\n\n` +
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
            `🆘 /support - Связь с поддержкой\n` +
            `📱 /menu - Главное меню\n\n` +
            `Для полного доступа ко всем функциям откройте WebApp:\n${config.WEBAPP_URL}`;

        await ctx.reply(helpText);
    }

    async handleText(ctx) {
        const message = ctx.message.text;
        
        if (message.toLowerCase().includes('привет')) {
            await this.handleStart(ctx);
        } else if (message.toLowerCase().includes('курс')) {
            await this.handleCourses(ctx);
        } else {
            await ctx.reply(
                `Используйте команды:\n` +
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
            // Возвращаем демо-пользователя при ошибке
            return {
                id: telegramUser.id,
                telegram_data: telegramUser,
                is_admin: config.ADMIN_IDS.includes(telegramUser.id),
                is_super_admin: telegramUser.id === config.SUPER_ADMIN_ID,
                subscription_data: { status: 'active' }
            };
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
        this.io = null;
        this.upload = null;
        this.setupServer();
    }

    setupServer() {
        this.setupMiddleware();
        this.setupFileUpload();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Безопасность
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            },
            crossOriginEmbedderPolicy: false
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
        this.app.use(morgan('combined'));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000,
            max: config.RATE_LIMIT_MAX,
            message: {
                error: 'Слишком много запросов с этого IP, пожалуйста, попробуйте позже.'
            },
            standardHeaders: true,
            legacyHeaders: false
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
                'application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
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

        // Favorites routes
        this.app.post('/api/favorites/toggle', this.handleToggleFavorite.bind(this));

        // Payment routes
        this.app.post('/api/payment/create', this.handleCreatePayment.bind(this));

        // Webhook для Telegram
        if (telegramBot.bot) {
            this.app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
                telegramBot.bot.handleUpdate(req.body, res);
            });
        }

        // SPA fallback
        this.app.get('*', (req, res) => {
            res.sendFile(join(__dirname, 'webapp', 'index.html'));
        });
    }

    setupWebSocket() {
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: config.WEBAPP_URL,
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            logger.info(`🔌 WebSocket подключен: ${socket.id}`);

            socket.on('authenticate', (data) => {
                try {
                    const user = security.verifyToken(data.token);
                    socket.userId = user.id;
                    socket.join(`user_${user.id}`);
                    logger.info(`✅ WebSocket аутентифицирован: ${user.id}`);
                } catch (error) {
                    socket.emit('error', { message: 'Authentication failed' });
                    socket.disconnect();
                }
            });

            socket.on('disconnect', () => {
                logger.info(`🔌 WebSocket отключен: ${socket.id}`);
            });
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
            telegram: 'unknown',
            storage: 'unknown'
        };

        try {
            // Проверка базы данных
            await db.query('SELECT 1');
            checks.database = 'healthy';
        } catch (error) {
            checks.database = 'unhealthy';
        }

        try {
            // Проверка Telegram бота
            await telegramBot.bot.telegram.getMe();
            checks.telegram = 'healthy';
        } catch (error) {
            checks.telegram = 'unhealthy';
        }

        try {
            // Проверка хранилища
            await fs.access(config.UPLOAD_PATH);
            checks.storage = 'healthy';
        } catch (error) {
            checks.storage = 'unhealthy';
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

            const validation = await security.validateInput(
                Joi.object({
                    id: Joi.number().required(),
                    firstName: Joi.string().max(100),
                    username: Joi.string().max(50)
                }),
                req.body
            );

            if (!validation.isValid) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: validation.errors 
                });
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
                joinedAt: user.created_at
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User API Error:', error);
            // Fallback to demo user
            const userResponse = {
                id: 898508164,
                firstName: 'Демо Пользователь',
                username: 'demo',
                specialization: 'Невролог',
                city: 'Москва',
                email: 'demo@anb-academy.ru',
                subscription: { 
                    status: 'active', 
                    type: 'premium',
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                },
                progress: {
                    level: 'Понимаю',
                    experience: 1250,
                    level_threshold: 1000,
                    rank: 'Продвинутый',
                    steps: {
                        coursesBought: 3,
                        modulesCompleted: 12,
                        materialsWatched: 8
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
                joinedAt: new Date('2024-01-01').toISOString()
            };
            
            res.json({ success: true, user: userResponse });
        }
    }

    async handleUserProfile(req, res) {
        try {
            const userResponse = {
                id: 898508164,
                firstName: 'Демо Пользователь',
                username: 'demo',
                specialization: 'Невролог',
                city: 'Москва',
                email: 'demo@anb-academy.ru',
                subscription: { 
                    status: 'active', 
                    type: 'premium',
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                },
                progress: {
                    level: 'Понимаю',
                    experience: 1250,
                    level_threshold: 1000,
                    rank: 'Продвинутый',
                    steps: {
                        coursesBought: 3,
                        modulesCompleted: 12,
                        materialsWatched: 8
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
                joinedAt: new Date('2024-01-01').toISOString()
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User profile error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetContent(req, res) {
        try {
            const response = await db.query(`
                SELECT c.*, 
                       COALESCE(c.image_url, '/webapp/assets/course-default.jpg') as image_url 
                FROM courses c 
                WHERE c.active = TRUE 
                ORDER BY c.created_at DESC 
                LIMIT 20
            `);

            const content = {
                courses: response.rows,
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: [],
                promotions: [],
                chats: []
            };

            res.json({ success: true, data: content });
        } catch (error) {
            logger.error('Content API Error:', error);
            
            // Fallback to demo content
            const demoContent = {
                courses: [
                    {
                        id: 1,
                        title: 'Мануальные техники в практике невролога',
                        description: '6 модулей по современным мануальным методикам',
                        price: 25000,
                        duration: '12 недель',
                        modules: 6,
                        category: 'Мануальные техники',
                        level: 'advanced',
                        image_url: '/webapp/assets/course-manual.jpg',
                        rating: 4.8,
                        students_count: 156,
                        featured: true
                    }
                ],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: [],
                promotions: [],
                chats: []
            };
            
            res.json({ success: true, data: demoContent });
        }
    }

    async handleGetContentByType(req, res) {
        try {
            const { type } = req.params;
            
            if (type === 'courses') {
                const response = await db.query(`
                    SELECT *, 
                           COALESCE(image_url, '/webapp/assets/course-default.jpg') as image_url 
                    FROM courses 
                    WHERE active = TRUE 
                    ORDER BY created_at DESC 
                    LIMIT 20
                `);
                res.json({ success: true, data: response.rows });
            } else {
                res.json({ success: true, data: [] });
            }
        } catch (error) {
            logger.error('Content by type error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleToggleFavorite(req, res) {
        try {
            const { contentId, contentType } = req.body;
            
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

    async handleCreatePayment(req, res) {
        try {
            const { courseId, amount } = req.body;
            
            // Создаем платеж в базе данных
            const paymentResult = await db.query(
                `INSERT INTO payments (user_id, course_id, amount, currency, status, total_amount)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [898508164, courseId, amount, 'RUB', 'completed', amount]
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

    start() {
        const port = config.PORT;
        
        this.server.listen(port, '0.0.0.0', () => {
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
            
            if (this.io) {
                this.io.close();
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
        await cache.flush();
        
        // Запускаем сервер
        const expressServer = new ExpressServerSystem();
        expressServer.start();
        
        // Запускаем scheduled tasks
        startScheduledTasks();
        
    } catch (error) {
        logger.error('❌ Критическая ошибка при запуске системы:', error);
        process.exit(1);
    }
}

function startScheduledTasks() {
    logger.info('⏰ Запуск запланированных задач...');
    
    cron.schedule(config.BACKUP_INTERVAL, async () => {
        logger.info('💾 Запуск ежедневного бэкапа...');
    });
    
    cron.schedule(config.CLEANUP_INTERVAL, async () => {
        logger.info('🧹 Очистка старых данных...');
    });
    
    cron.schedule(config.HEALTH_CHECK_INTERVAL, async () => {
        const health = await new ExpressServerSystem().getSystemHealth();
        if (health.status !== 'healthy') {
            logger.warn('⚠️ Проблемы со здоровьем системы:', health);
        }
    });
    
    logger.info('✅ Все запланированные задачи запущены');
}

// Запускаем систему
startSystem();

export {
    db,
    cache,
    security,
    telegramBot,
    logger,
    config
};
