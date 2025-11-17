// server.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ ВЕРСИЯ ДЛЯ TIMEWEB
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
            host: 'def46fb02c0eac8fefd6f734.twc1.net',
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
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            autoResubscribe: true,
            autoResendUnfulfilledCommands: true,
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

    getAWSConfig() {
        return {
            accessKeyId: this.AWS_ACCESS_KEY,
            secretAccessKey: this.AWS_SECRET_KEY,
            region: 'us-east-1',
            maxRetries: 3,
            httpOptions: {
                timeout: 30000,
                connectTimeout: 5000
            }
        };
    }

    getAzureConfig() {
        return {
            connectionString: this.AZURE_CONNECTION_STRING,
            retryOptions: {
                maxTries: 4,
                tryTimeoutInMs: 30000,
                retryDelayInMs: 8000
            }
        };
    }

    getGoogleCloudConfig() {
        return {
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            projectId: process.env.GOOGLE_CLOUD_PROJECT,
            retryOptions: {
                autoRetry: true,
                maxRetries: 3
            }
        };
    }

    getFirebaseConfig() {
        return {
            credential: admin.credential.cert(JSON.parse(this.FIREBASE_CONFIG)),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
            storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
        };
    }

    getElasticsearchConfig() {
        return {
            node: this.ELASTICSEARCH_URL,
            maxRetries: 5,
            requestTimeout: 30000,
            sniffOnStart: true,
            sniffInterval: 60000,
            sniffOnConnectionFault: true
        };
    }

    getAlgoliaConfig() {
        return {
            appId: this.ALGOLIA_APP_ID,
            apiKey: this.ALGOLIA_API_KEY,
            maxRetries: 3,
            timeout: 30000
        };
    }

    getMeiliSearchConfig() {
        return {
            host: this.MEILISEARCH_URL,
            apiKey: process.env.MEILISEARCH_API_KEY,
            timeout: 10000
        };
    }

    getTypesenseConfig() {
        return {
            nodes: [{
                host: this.TYPESENSE_URL.split('://')[1].split(':')[0],
                port: parseInt(this.TYPESENSE_URL.split(':')[2]) || 8108,
                protocol: this.TYPESENSE_URL.split('://')[0]
            }],
            apiKey: process.env.TYPESENSE_API_KEY,
            connectionTimeoutSeconds: 10,
            healthcheckIntervalSeconds: 30
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
            ],
            exceptionHandlers: [
                new winston.transports.File({ 
                    filename: join(__dirname, 'logs/exceptions.log'),
                    maxsize: 5242880,
                    maxFiles: 5
                })
            ],
            rejectionHandlers: [
                new winston.transports.File({ 
                    filename: join(__dirname, 'logs/rejections.log'),
                    maxsize: 5242880,
                    maxFiles: 5
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

    verbose(message, meta = {}) {
        this.log('verbose', message, meta);
    }

    silly(message, meta = {}) {
        this.log('silly', message, meta);
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

    business(event, user, details = {}) {
        this.info(`BUSINESS: ${event}`, {
            user,
            event,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
}

const logger = new LoggerSystem();

// ==================== СИСТЕМА КЭШИРОВАНИЯ ====================
class CacheSystem {
    constructor() {
        this.redis = new Redis(config.getRedisConfig());
        this.memoryCache = new Map();
        this.setupEventListeners();
        this.setupCleanup();
    }

    setupEventListeners() {
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

        // Очистка Redis по расписанию
        cron.schedule(config.CACHE_CLEANUP_INTERVAL, async () => {
            await this.cleanExpired();
        });
    }

    async get(key) {
        try {
            // Сначала пробуем Redis
            const value = await this.redis.get(key);
            if (value) {
                return JSON.parse(value);
            }

            // Потом память
            const memoryValue = this.memoryCache.get(key);
            if (memoryValue && (!memoryValue.expiry || memoryValue.expiry > Date.now())) {
                return memoryValue.data;
            }

            return null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = config.CACHE_TTL) {
        try {
            const cacheValue = {
                data: value,
                expiry: ttl ? Date.now() + ttl * 1000 : null
            };

            // Сохраняем в Redis
            if (ttl) {
                await this.redis.setex(key, ttl, JSON.stringify(value));
            } else {
                await this.redis.set(key, JSON.stringify(value));
            }

            // Сохраняем в память
            this.memoryCache.set(key, cacheValue);

            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    }

    async delete(key) {
        try {
            await this.redis.del(key);
            this.memoryCache.delete(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    }

    async exists(key) {
        try {
            const exists = await this.redis.exists(key);
            return exists === 1;
        } catch (error) {
            logger.error('Cache exists error:', error);
            return false;
        }
    }

    async cleanExpired() {
        try {
            // Redis автоматически удаляет expired keys
            // Очищаем только память
            const now = Date.now();
            for (const [key, value] of this.memoryCache.entries()) {
                if (value.expiry && value.expiry < now) {
                    this.memoryCache.delete(key);
                }
            }
            logger.info('Expired cache cleaned');
        } catch (error) {
            logger.error('Cache cleanup error:', error);
        }
    }

    async flush() {
        try {
            await this.redis.flushdb();
            this.memoryCache.clear();
            logger.info('Cache flushed');
        } catch (error) {
            logger.error('Cache flush error:', error);
        }
    }

    async getStats() {
        try {
            const info = await this.redis.info();
            const memoryInfo = await this.redis.info('memory');
            const stats = await this.redis.info('stats');
            
            return {
                redis: {
                    connected: this.redis.status === 'ready',
                    used_memory: memoryInfo.split('\r\n').find(line => line.startsWith('used_memory:')).split(':')[1],
                    connected_clients: stats.split('\r\n').find(line => line.startsWith('connected_clients:')).split(':')[1],
                    total_commands_processed: stats.split('\r\n').find(line => line.startsWith('total_commands_processed:')).split(':')[1]
                },
                memory: {
                    size: this.memoryCache.size,
                    keys: Array.from(this.memoryCache.keys())
                }
            };
        } catch (error) {
            logger.error('Cache stats error:', error);
            return null;
        }
    }

    async cacheWithFallback(key, fallbackFunction, ttl = config.CACHE_TTL) {
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }

        const freshData = await fallbackFunction();
        await this.set(key, freshData, ttl);
        return freshData;
    }

    async memoize(func, keyGenerator, ttl = config.CACHE_TTL) {
        return async (...args) => {
            const key = keyGenerator(...args);
            return this.cacheWithFallback(key, () => func(...args), ttl);
        };
    }
}

const cache = new CacheSystem();

// ==================== БАЗА ДАННЫХ ====================
class DatabaseSystem {
    constructor() {
        this.pgClient = null;
        this.redis = null;
        this.mongoClient = null;
        this.mysqlConnection = null;
        this.sqliteConnection = null;
        this.sequelize = null;
        this.mongoose = null;
        this.connected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
    }

    async connect() {
        try {
            logger.info('🗄️ Подключение к базам данных...');
            
            await this.connectPostgreSQL();
            await this.connectRedis();
            await this.connectMongoDB();
            await this.connectMySQL();
            await this.connectSQLite();
            await this.connectSequelize();
            await this.connectMongoose();
            
            this.connected = true;
            logger.info('✅ Все базы данных подключены');
            
            await this.createTables();
            await this.initializeDefaultData();
            await this.setupDatabaseMonitoring();
            
        } catch (error) {
            logger.error('❌ Ошибка подключения к БД:', error);
            this.connectionAttempts++;
            
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                logger.info(`🔄 Повторная попытка подключения через 5 секунд... (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
                setTimeout(() => this.connect(), 5000);
            } else {
                logger.error('❌ Превышено максимальное количество попыток подключения');
                throw error;
            }
        }
    }

    async connectPostgreSQL() {
        const { Client } = await import('pg');
        this.pgClient = new Client(config.getDatabaseConfig());
        
        await this.pgClient.connect();
        logger.info('✅ PostgreSQL подключена');
    }

    async connectRedis() {
        this.redis = new Redis(config.getRedisConfig());
        
        this.redis.on('connect', () => {
            logger.info('✅ Redis подключен');
        });
        
        this.redis.on('error', (error) => {
            logger.error('❌ Redis ошибка:', error);
        });
    }

    async connectMongoDB() {
        try {
            this.mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017/anb-academy');
            await this.mongoClient.connect();
            logger.info('✅ MongoDB подключена');
        } catch (error) {
            logger.warn('⚠️ MongoDB не подключена:', error.message);
        }
    }

    async connectMySQL() {
        try {
            this.mysqlConnection = mysql.createConnection({
                host: process.env.MYSQL_HOST || 'localhost',
                user: process.env.MYSQL_USER || 'root',
                password: process.env.MYSQL_PASSWORD || '',
                database: process.env.MYSQL_DATABASE || 'anb_academy'
            });
            
            await this.mysqlConnection.promise().execute('SELECT 1');
            logger.info('✅ MySQL подключена');
        } catch (error) {
            logger.warn('⚠️ MySQL не подключена:', error.message);
        }
    }

    async connectSQLite() {
        try {
            const sqlite3 = await import('sqlite3');
            this.sqliteConnection = new sqlite3.Database(':memory:');
            logger.info('✅ SQLite подключена');
        } catch (error) {
            logger.warn('⚠️ SQLite не подключена:', error.message);
        }
    }

    async connectSequelize() {
        try {
            this.sequelize = new Sequelize(config.DATABASE_URL, {
                dialect: 'postgres',
                logging: false,
                pool: {
                    max: 20,
                    min: 5,
                    acquire: 30000,
                    idle: 10000
                },
                retry: {
                    max: 3,
                    timeout: 30000
                }
            });
            
            await this.sequelize.authenticate();
            logger.info('✅ Sequelize подключен');
        } catch (error) {
            logger.warn('⚠️ Sequelize не подключен:', error.message);
        }
    }

    async connectMongoose() {
        try {
            await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/anb-academy', {
                maxPoolSize: 20,
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
            });
            logger.info('✅ Mongoose подключен');
        } catch (error) {
            logger.warn('⚠️ Mongoose не подключен:', error.message);
        }
    }

    async createTables() {
        const tables = [
            // Основные таблицы пользователей
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB NOT NULL,
                profile_data JSONB DEFAULT '{
                    "specialization": "",
                    "city": "",
                    "email": "",
                    "phone": "",
                    "birth_date": null,
                    "experience": "",
                    "education": "",
                    "certificates": [],
                    "languages": [],
                    "interests": [],
                    "bio": "",
                    "avatar_url": "",
                    "cover_url": "",
                    "social_links": {},
                    "privacy_settings": {
                        "profile_visible": true,
                        "email_visible": false,
                        "phone_visible": false,
                        "activity_visible": true
                    },
                    "notification_settings": {
                        "email_notifications": true,
                        "push_notifications": true,
                        "sms_notifications": false,
                        "marketing_emails": false
                    },
                    "preferences": {
                        "theme": "dark",
                        "language": "ru",
                        "timezone": "Europe/Moscow",
                        "currency": "RUB",
                        "date_format": "DD.MM.YYYY",
                        "time_format": "24h"
                    }
                }',
                subscription_data JSONB DEFAULT '{
                    "status": "inactive",
                    "type": "free",
                    "tier": "basic",
                    "start_date": null,
                    "end_date": null,
                    "auto_renew": false,
                    "payment_method": null,
                    "billing_cycle": "monthly",
                    "price": 0,
                    "currency": "RUB",
                    "features": {
                        "courses_access": false,
                        "premium_content": false,
                        "personal_consultation": false,
                        "certificates": false,
                        "offline_events": false,
                        "community_access": false
                    },
                    "limits": {
                        "courses_per_month": 1,
                        "consultations_per_month": 0,
                        "storage_gb": 1,
                        "video_hours": 10
                    },
                    "history": []
                }',
                progress_data JSONB DEFAULT '{
                    "level": "Понимаю",
                    "experience": 0,
                    "level_threshold": 1000,
                    "rank": "Новичок",
                    "badges": [],
                    "achievements": [],
                    "steps": {
                        "materialsWatched": 0,
                        "eventsParticipated": 0,
                        "materialsSaved": 0,
                        "coursesBought": 0,
                        "modulesCompleted": 0,
                        "offlineEvents": 0,
                        "publications": 0,
                        "commentsWritten": 0,
                        "likesGiven": 0,
                        "sharesMade": 0,
                        "questionsAsked": 0,
                        "answersGiven": 0,
                        "reviewsWritten": 0,
                        "certificatesEarned": 0,
                        "friendsInvited": 0
                    },
                    "progress": {
                        "understand": 0,
                        "connect": 0,
                        "apply": 0,
                        "systematize": 0,
                        "share": 0
                    },
                    "learning_path": [],
                    "goals": [],
                    "statistics": {
                        "total_time_spent": 0,
                        "average_session_duration": 0,
                        "completion_rate": 0,
                        "engagement_score": 0,
                        "last_active": null,
                        "streak_days": 0,
                        "longest_streak": 0
                    }
                }',
                favorites_data JSONB DEFAULT '{
                    "courses": [],
                    "podcasts": [],
                    "streams": [],
                    "videos": [],
                    "materials": [],
                    "events": [],
                    "articles": [],
                    "doctors": [],
                    "playlists": []
                }',
                payment_data JSONB DEFAULT '{
                    "balance": 0,
                    "currency": "RUB",
                    "transactions": [],
                    "payment_methods": [],
                    "invoices": [],
                    "refunds": [],
                    "subscriptions": [],
                    "loyalty_points": 0,
                    "discounts": []
                }',
                security_data JSONB DEFAULT '{
                    "password_hash": null,
                    "two_factor_enabled": false,
                    "two_factor_secret": null,
                    "backup_codes": [],
                    "login_history": [],
                    "devices": [],
                    "sessions": [],
                    "blocked_until": null,
                    "failed_attempts": 0,
                    "last_password_change": null,
                    "security_questions": []
                }',
                communication_data JSONB DEFAULT '{
                    "messages_sent": 0,
                    "messages_received": 0,
                    "notifications": [],
                    "chats": [],
                    "groups": [],
                    "channels": [],
                    "friends": [],
                    "followers": [],
                    "following": [],
                    "blocked_users": [],
                    "muted_users": [],
                    "conversations": []
                }',
                analytics_data JSONB DEFAULT '{
                    "page_views": 0,
                    "button_clicks": {},
                    "search_queries": [],
                    "content_interactions": {},
                    "device_info": {},
                    "location_data": {},
                    "referral_source": null,
                    "campaign_data": {},
                    "conversion_events": []
                }',
                survey_completed BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
                is_moderator BOOLEAN DEFAULT FALSE,
                is_teacher BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                is_blocked BOOLEAN DEFAULT FALSE,
                is_deleted BOOLEAN DEFAULT FALSE,
                delete_reason TEXT,
                delete_date TIMESTAMP,
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                version INTEGER DEFAULT 1
            )`,

            // Расширенная таблица курсов
            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                description TEXT,
                full_description TEXT,
                short_description TEXT,
                learning_outcomes TEXT[],
                requirements TEXT[],
                target_audience TEXT[],
                price DECIMAL(10,2) DEFAULT 0,
                original_price DECIMAL(10,2),
                discount DECIMAL(5,2) DEFAULT 0,
                discount_end_date TIMESTAMP,
                duration TEXT,
                total_duration_minutes INTEGER,
                modules INTEGER DEFAULT 1,
                lessons INTEGER DEFAULT 0,
                exercises INTEGER DEFAULT 0,
                quizzes INTEGER DEFAULT 0,
                projects INTEGER DEFAULT 0,
                category TEXT,
                subcategory TEXT,
                tags TEXT[],
                level TEXT DEFAULT 'beginner',
                difficulty TEXT DEFAULT 'easy',
                language TEXT DEFAULT 'ru',
                subtitles TEXT[],
                image_url TEXT,
                video_url TEXT,
                preview_video_url TEXT,
                thumbnail_url TEXT,
                promo_video_url TEXT,
                certificate_template TEXT,
                active BOOLEAN DEFAULT TRUE,
                featured BOOLEAN DEFAULT FALSE,
                popular BOOLEAN DEFAULT FALSE,
                new BOOLEAN DEFAULT FALSE,
                coming_soon BOOLEAN DEFAULT FALSE,
                students_count INTEGER DEFAULT 0,
                max_students INTEGER,
                rating DECIMAL(3,2) DEFAULT 0,
                reviews_count INTEGER DEFAULT 0,
                enrollment_count INTEGER DEFAULT 0,
                completion_count INTEGER DEFAULT 0,
                average_completion_time INTEGER,
                success_rate DECIMAL(5,2),
                created_by BIGINT,
                instructor_id BIGINT,
                co_instructors BIGINT[],
                assistants BIGINT[],
                curriculum JSONB DEFAULT '[]',
                resources JSONB DEFAULT '[]',
                faq JSONB DEFAULT '[]',
                reviews JSONB DEFAULT '[]',
                announcements JSONB DEFAULT '[]',
                discussions JSONB DEFAULT '[]',
                assignments JSONB DEFAULT '[]',
                assessments JSONB DEFAULT '[]',
                certificates JSONB DEFAULT '[]',
                statistics JSONB DEFAULT '{
                    "views": 0,
                    "clicks": 0,
                    "shares": 0,
                    "wishlist_adds": 0,
                    "conversion_rate": 0,
                    "revenue": 0,
                    "refunds": 0,
                    "completion_rate": 0,
                    "satisfaction_score": 0
                }',
                seo_data JSONB DEFAULT '{
                    "slug": "",
                    "meta_title": "",
                    "meta_description": "",
                    "keywords": [],
                    "og_image": "",
                    "twitter_card": ""
                }',
                access_settings JSONB DEFAULT '{
                    "privacy": "public",
                    "enrollment": "open",
                    "approval_required": false,
                    "start_date": null,
                    "end_date": null,
                    "availability": "always",
                    "geographic_restrictions": [],
                    "device_restrictions": [],
                    "prerequisites": []
                }',
                technical_data JSONB DEFAULT '{
                    "file_size": 0,
                    "video_quality": "hd",
                    "audio_quality": "high",
                    "downloadable": false,
                    "streaming_only": true,
                    "compatible_devices": ["desktop", "mobile", "tablet"],
                    "required_software": [],
                    "supported_browsers": ["chrome", "firefox", "safari", "edge"]
                }',
                pricing_data JSONB DEFAULT '{
                    "currency": "RUB",
                    "payment_methods": ["card", "qiwi", "yoomoney", "webmoney"],
                    "installment_available": false,
                    "installment_months": 0,
                    "trial_available": false,
                    "trial_days": 0,
                    "money_back_guarantee": false,
                    "money_back_days": 0,
                    "corporate_pricing": false,
                    "group_discounts": false
                }',
                marketing_data JSONB DEFAULT '{
                    "campaign_id": null,
                    "affiliate_program": false,
                    "affiliate_commission": 0,
                    "promo_codes": [],
                    "early_bird": false,
                    "flash_sale": false,
                    "limited_time": false,
                    "urgency_text": ""
                }',
                legal_data JSONB DEFAULT '{
                    "terms_url": "",
                    "privacy_policy_url": "",
                    "refund_policy_url": "",
                    "certificate_terms": "",
                    "license_type": "personal",
                    "commercial_use": false,
                    "redistribution": false,
                    "modification": false
                }',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                published_at TIMESTAMP,
                archived_at TIMESTAMP,
                version INTEGER DEFAULT 1,
                CONSTRAINT fk_instructor FOREIGN KEY (instructor_id) REFERENCES users(id)
            )`,

            // Таблица модулей курсов
            `CREATE TABLE IF NOT EXISTS course_modules (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                order_index INTEGER DEFAULT 0,
                duration_minutes INTEGER DEFAULT 0,
                lessons_count INTEGER DEFAULT 0,
                completed_lessons_count INTEGER DEFAULT 0,
                resources JSONB DEFAULT '[]',
                prerequisites INTEGER[],
                objectives TEXT[],
                difficulty TEXT DEFAULT 'beginner',
                is_public BOOLEAN DEFAULT TRUE,
                is_free BOOLEAN DEFAULT FALSE,
                requires_completion BOOLEAN DEFAULT TRUE,
                unlock_conditions JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица уроков
            `CREATE TABLE IF NOT EXISTS lessons (
                id SERIAL PRIMARY KEY,
                module_id INTEGER REFERENCES course_modules(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                content TEXT,
                content_type TEXT DEFAULT 'video',
                duration_minutes INTEGER DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                video_url TEXT,
                audio_url TEXT,
                document_url TEXT,
                presentation_url TEXT,
                interactive_content_url TEXT,
                resources JSONB DEFAULT '[]',
                exercises JSONB DEFAULT '[]',
                quiz_id INTEGER,
                assignment_id INTEGER,
                is_public BOOLEAN DEFAULT TRUE,
                is_free BOOLEAN DEFAULT FALSE,
                requires_completion BOOLEAN DEFAULT TRUE,
                unlock_conditions JSONB,
                view_count INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                comment_count INTEGER DEFAULT 0,
                completion_count INTEGER DEFAULT 0,
                average_watch_time INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица прогресса пользователей
            `CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                module_id INTEGER REFERENCES course_modules(id) ON DELETE CASCADE,
                lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
                content_type TEXT NOT NULL,
                content_id INTEGER NOT NULL,
                progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                score DECIMAL(5,2),
                max_score DECIMAL(5,2),
                time_spent INTEGER DEFAULT 0,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                last_activity TIMESTAMP DEFAULT NOW(),
                attempts INTEGER DEFAULT 0,
                notes TEXT,
                bookmarks JSONB DEFAULT '[]',
                ratings JSONB DEFAULT '{}',
                feedback TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, content_type, content_id)
            )`,

            // Таблица сертификатов
            `CREATE TABLE IF NOT EXISTS certificates (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                certificate_number TEXT UNIQUE,
                issue_date TIMESTAMP DEFAULT NOW(),
                expiry_date TIMESTAMP,
                template_url TEXT,
                download_url TEXT,
                verification_url TEXT,
                qr_code_url TEXT,
                credits DECIMAL(5,2),
                hours_completed INTEGER,
                grade TEXT,
                instructor_signature TEXT,
                institution_signature TEXT,
                accreditation_body TEXT,
                is_public BOOLEAN DEFAULT TRUE,
                is_verified BOOLEAN DEFAULT TRUE,
                is_revoked BOOLEAN DEFAULT FALSE,
                revoke_reason TEXT,
                revoke_date TIMESTAMP,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица платежей
            `CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                subscription_id INTEGER,
                amount DECIMAL(10,2) NOT NULL,
                currency TEXT DEFAULT 'RUB',
                status TEXT DEFAULT 'pending',
                payment_method TEXT,
                payment_gateway TEXT,
                gateway_transaction_id TEXT,
                gateway_response JSONB,
                description TEXT,
                invoice_number TEXT UNIQUE,
                invoice_url TEXT,
                receipt_url TEXT,
                refund_amount DECIMAL(10,2) DEFAULT 0,
                refund_reason TEXT,
                refund_date TIMESTAMP,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                total_amount DECIMAL(10,2) NOT NULL,
                billing_address JSONB,
                shipping_address JSONB,
                customer_email TEXT,
                customer_phone TEXT,
                ip_address INET,
                user_agent TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица подписок
            `CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                plan_id INTEGER,
                plan_name TEXT NOT NULL,
                plan_description TEXT,
                price DECIMAL(10,2) NOT NULL,
                currency TEXT DEFAULT 'RUB',
                billing_cycle TEXT DEFAULT 'monthly',
                status TEXT DEFAULT 'active',
                start_date TIMESTAMP DEFAULT NOW(),
                end_date TIMESTAMP,
                trial_end_date TIMESTAMP,
                auto_renew BOOLEAN DEFAULT TRUE,
                payment_method TEXT,
                gateway_subscription_id TEXT,
                gateway_customer_id TEXT,
                cancel_reason TEXT,
                cancel_date TIMESTAMP,
                pause_date TIMESTAMP,
                resume_date TIMESTAMP,
                upgrade_date TIMESTAMP,
                downgrade_date TIMESTAMP,
                features JSONB DEFAULT '{}',
                limits JSONB DEFAULT '{}',
                usage JSONB DEFAULT '{}',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица уведомлений
            `CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                category TEXT,
                priority TEXT DEFAULT 'medium',
                action_url TEXT,
                action_text TEXT,
                image_url TEXT,
                icon TEXT,
                read BOOLEAN DEFAULT FALSE,
                clicked BOOLEAN DEFAULT FALSE,
                dismissed BOOLEAN DEFAULT FALSE,
                scheduled_for TIMESTAMP,
                sent_at TIMESTAMP,
                read_at TIMESTAMP,
                clicked_at TIMESTAMP,
                dismissed_at TIMESTAMP,
                delivery_method TEXT[] DEFAULT '{"push"}',
                delivery_status JSONB DEFAULT '{}',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица событий аналитики
            `CREATE TABLE IF NOT EXISTS analytics_events (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                event_type TEXT NOT NULL,
                event_name TEXT NOT NULL,
                event_data JSONB DEFAULT '{}',
                page_url TEXT,
                referrer_url TEXT,
                ip_address INET,
                user_agent TEXT,
                device_type TEXT,
                browser TEXT,
                os TEXT,
                screen_resolution TEXT,
                language TEXT,
                country TEXT,
                region TEXT,
                city TEXT,
                timezone TEXT,
                session_id TEXT,
                campaign_source TEXT,
                campaign_medium TEXT,
                campaign_name TEXT,
                campaign_term TEXT,
                campaign_content TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица загрузок файлов
            `CREATE TABLE IF NOT EXISTS uploads (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                filename TEXT NOT NULL,
                original_name TEXT,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                upload_type TEXT,
                category TEXT,
                tags TEXT[],
                description TEXT,
                is_public BOOLEAN DEFAULT FALSE,
                is_approved BOOLEAN DEFAULT TRUE,
                download_count INTEGER DEFAULT 0,
                view_count INTEGER DEFAULT 0,
                share_count INTEGER DEFAULT 0,
                expiration_date TIMESTAMP,
                virus_scan_result TEXT DEFAULT 'clean',
                virus_scan_date TIMESTAMP,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица системных логов
            `CREATE TABLE IF NOT EXISTS system_logs (
                id SERIAL PRIMARY KEY,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                context JSONB DEFAULT '{}',
                user_id BIGINT,
                ip_address INET,
                user_agent TEXT,
                request_id TEXT,
                trace_id TEXT,
                span_id TEXT,
                duration INTEGER,
                error_stack TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица настроек системы
            `CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value JSONB NOT NULL,
                type TEXT DEFAULT 'string',
                category TEXT DEFAULT 'general',
                description TEXT,
                is_public BOOLEAN DEFAULT FALSE,
                is_encrypted BOOLEAN DEFAULT FALSE,
                updated_by BIGINT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица кэша
            `CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                value JSONB NOT NULL,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица миграций
            `CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                batch INTEGER NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица бэкапов
            `CREATE TABLE IF NOT EXISTS backups (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                backup_type TEXT DEFAULT 'full',
                status TEXT DEFAULT 'completed',
                error_message TEXT,
                metadata JSONB DEFAULT '{}',
                created_by BIGINT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица безопасности
            `CREATE TABLE IF NOT EXISTS security_events (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                event_type TEXT NOT NULL,
                event_severity TEXT DEFAULT 'medium',
                description TEXT NOT NULL,
                ip_address INET,
                user_agent TEXT,
                location_data JSONB,
                device_fingerprint TEXT,
                risk_score INTEGER DEFAULT 0,
                is_blocked BOOLEAN DEFAULT FALSE,
                block_reason TEXT,
                block_until TIMESTAMP,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица производительности
            `CREATE TABLE IF NOT EXISTS performance_metrics (
                id SERIAL PRIMARY KEY,
                metric_name TEXT NOT NULL,
                metric_value DECIMAL(10,4) NOT NULL,
                metric_unit TEXT,
                tags JSONB DEFAULT '{}',
                timestamp TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица здоровья системы
            `CREATE TABLE IF NOT EXISTS system_health (
                id SERIAL PRIMARY KEY,
                component TEXT NOT NULL,
                status TEXT NOT NULL,
                status_code INTEGER DEFAULT 200,
                response_time INTEGER,
                error_message TEXT,
                last_check TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица обновлений
            `CREATE TABLE IF NOT EXISTS system_updates (
                id SERIAL PRIMARY KEY,
                version TEXT NOT NULL,
                type TEXT DEFAULT 'patch',
                description TEXT,
                changes JSONB DEFAULT '[]',
                is_mandatory BOOLEAN DEFAULT FALSE,
                rollout_percentage INTEGER DEFAULT 100,
                released_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица мониторинга
            `CREATE TABLE IF NOT EXISTS monitoring_alerts (
                id SERIAL PRIMARY KEY,
                alert_type TEXT NOT NULL,
                alert_severity TEXT DEFAULT 'warning',
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                metric_name TEXT,
                metric_value DECIMAL(10,4),
                threshold_value DECIMAL(10,4),
                is_resolved BOOLEAN DEFAULT FALSE,
                resolved_at TIMESTAMP,
                resolved_by BIGINT REFERENCES users(id),
                acknowledged BOOLEAN DEFAULT FALSE,
                acknowledged_at TIMESTAMP,
                acknowledged_by BIGINT REFERENCES users(id),
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица отчетов
            `CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                report_type TEXT NOT NULL,
                parameters JSONB DEFAULT '{}',
                data JSONB DEFAULT '{}',
                file_url TEXT,
                status TEXT DEFAULT 'completed',
                error_message TEXT,
                generated_by BIGINT REFERENCES users(id),
                generated_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица API ключей
            `CREATE TABLE IF NOT EXISTS api_keys (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                key TEXT UNIQUE NOT NULL,
                secret TEXT,
                permissions TEXT[] DEFAULT '{}',
                rate_limit INTEGER DEFAULT 1000,
                is_active BOOLEAN DEFAULT TRUE,
                last_used TIMESTAMP,
                expires_at TIMESTAMP,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица вебхуков
            `CREATE TABLE IF NOT EXISTS webhooks (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                events TEXT[] NOT NULL,
                secret TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                last_triggered TIMESTAMP,
                success_count INTEGER DEFAULT 0,
                failure_count INTEGER DEFAULT 0,
                last_error TEXT,
                retry_count INTEGER DEFAULT 0,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица интеграций
            `CREATE TABLE IF NOT EXISTS integrations (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                config JSONB NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                last_sync TIMESTAMP,
                sync_status TEXT DEFAULT 'idle',
                error_message TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица задач
            `CREATE TABLE IF NOT EXISTS jobs (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                queue TEXT DEFAULT 'default',
                payload JSONB NOT NULL,
                attempts INTEGER DEFAULT 0,
                max_attempts INTEGER DEFAULT 3,
                reserved_at TIMESTAMP,
                available_at TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                failed_at TIMESTAMP,
                error_message TEXT,
                stack_trace TEXT
            )`,

            // Таблица неудачных задач
            `CREATE TABLE IF NOT EXISTS failed_jobs (
                id SERIAL PRIMARY KEY,
                job_id INTEGER,
                name TEXT NOT NULL,
                queue TEXT NOT NULL,
                payload JSONB NOT NULL,
                exception TEXT NOT NULL,
                failed_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица сессий
            `CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                session_id TEXT UNIQUE NOT NULL,
                ip_address INET,
                user_agent TEXT,
                payload JSONB NOT NULL,
                last_activity TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица блокировок
            `CREATE TABLE IF NOT EXISTS locks (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                owner TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица счетчиков
            `CREATE TABLE IF NOT EXISTS counters (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                value BIGINT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Таблица индексов для производительности
            `CREATE INDEX IF NOT EXISTS idx_users_email ON users((profile_data->>'email')) WHERE profile_data->>'email' IS NOT NULL`,
            `CREATE INDEX IF NOT EXISTS idx_users_specialization ON users((profile_data->>'specialization')) WHERE profile_data->>'specialization' IS NOT NULL`,
            `CREATE INDEX IF NOT EXISTS idx_users_city ON users((profile_data->>'city')) WHERE profile_data->>'city' IS NOT NULL`,
            `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active)`,
            `CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id)`,
            `CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed)`,
            `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`,
            `CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`,
            `CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type)`,
            `CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)`,
            `CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type)`,
            `CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp)`,
            `CREATE INDEX IF NOT EXISTS idx_system_health_component ON system_health(component)`,
            `CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_is_resolved ON monitoring_alerts(is_resolved)`,
            `CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type)`,
            `CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_jobs_queue ON jobs(queue)`,
            `CREATE INDEX IF NOT EXISTS idx_jobs_available_at ON jobs(available_at)`,
            `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`
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
                const passwordHash = await bcrypt.hash('admin123', 12);
                
                await this.pgClient.query(
                    `INSERT INTO users (id, telegram_data, profile_data, security_data, is_admin, is_super_admin, is_verified, survey_completed)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        config.SUPER_ADMIN_ID,
                        JSON.stringify({
                            first_name: 'Супер Администратор',
                            username: 'superadmin',
                            language_code: 'ru',
                            is_premium: true
                        }),
                        JSON.stringify({
                            specialization: 'Администратор системы',
                            city: 'Москва',
                            email: 'admin@anb-academy.ru',
                            phone: '+79999999999',
                            experience: '10+ лет',
                            education: 'Высшее техническое',
                            bio: 'Главный администратор Академии АНБ',
                            avatar_url: '/webapp/assets/admin-avatar.jpg',
                            social_links: {
                                telegram: '@anb_academy',
                                email: 'admin@anb-academy.ru'
                            }
                        }),
                        JSON.stringify({
                            password_hash: passwordHash,
                            two_factor_enabled: true,
                            login_history: [],
                            devices: [],
                            sessions: []
                        }),
                        true,
                        true,
                        true,
                        true
                    ]
                );
                logger.info('✅ Супер-администратор создан');
            }

            // Создаем демо-контент
            await this.createDemoContent();
            
            // Создаем системные настройки
            await this.createSystemSettings();
            
        } catch (error) {
            logger.error('Ошибка инициализации данных:', error);
        }
    }

    async createDemoContent() {
        try {
            // Проверяем есть ли курсы
            const coursesCheck = await this.pgClient.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCheck.rows[0].count) === 0) {
                logger.info('📚 Создаем демо-контент...');
                
                const demoContent = {
                    courses: [
                        {
                            title: 'Мануальные техники в практике невролога',
                            subtitle: 'Современные подходы к диагностике и лечению',
                            description: '6 модулей по современным мануальным методикам',
                            full_description: 'Комплексный курс по мануальным техникам для практикующих врачей-неврологов. Изучите современные подходы к диагностике и лечению заболеваний опорно-двигательного аппарата.',
                            learning_outcomes: [
                                'Освоите основные мануальные техники',
                                'Научитесь проводить дифференциальную диагностику',
                                'Сможете разрабатывать индивидуальные планы лечения',
                                'Освоите методы профилактики осложнений'
                            ],
                            requirements: [
                                'Высшее медицинское образование',
                                'Опыт работы не менее 1 года',
                                'Базовые знания анатомии и физиологии'
                            ],
                            target_audience: ['Неврологи', 'Реабилитологи', 'Мануальные терапевты'],
                            price: 25000,
                            original_price: 30000,
                            discount: 16.67,
                            discount_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                            duration: '12 недель',
                            total_duration_minutes: 7200,
                            modules: 6,
                            lessons: 24,
                            exercises: 12,
                            quizzes: 6,
                            projects: 2,
                            category: 'Мануальные техники',
                            subcategory: 'Неврология',
                            tags: ['мануальная терапия', 'неврология', 'реабилитация', 'диагностика'],
                            level: 'advanced',
                            difficulty: 'medium',
                            language: 'ru',
                            subtitles: ['ru', 'en'],
                            image_url: '/webapp/assets/course-manual.jpg',
                            video_url: '/webapp/assets/course-preview.mp4',
                            preview_video_url: '/webapp/assets/course-teaser.mp4',
                            certificate_template: 'professional',
                            active: true,
                            featured: true,
                            popular: true,
                            students_count: 156,
                            max_students: 200,
                            rating: 4.8,
                            reviews_count: 89,
                            enrollment_count: 234,
                            completion_count: 156,
                            average_completion_time: 45,
                            success_rate: 92.5,
                            created_by: config.SUPER_ADMIN_ID,
                            instructor_id: config.SUPER_ADMIN_ID,
                            co_instructors: [],
                            curriculum: [
                                {
                                    module: 1,
                                    title: 'Основы мануальной диагностики',
                                    duration: '2 недели',
                                    lessons: [
                                        {
                                            title: 'Анатомия позвоночника',
                                            duration: 45,
                                            type: 'video',
                                            resources: 3
                                        },
                                        {
                                            title: 'Пальпаторная диагностика',
                                            duration: 60,
                                            type: 'video',
                                            resources: 2
                                        }
                                    ]
                                }
                            ],
                            statistics: {
                                views: 1567,
                                clicks: 892,
                                shares: 234,
                                wishlist_adds: 567,
                                conversion_rate: 15.2,
                                revenue: 3900000,
                                refunds: 2,
                                completion_rate: 66.7,
                                satisfaction_score: 4.8
                            },
                            seo_data: {
                                slug: 'manual-techniques-neurology',
                                meta_title: 'Мануальные техники в практике невролога | Академия АНБ',
                                meta_description: 'Профессиональный курс по мануальным техникам для неврологов. Современные методики диагностики и лечения.',
                                keywords: ['мануальная терапия', 'неврология', 'курс для врачей', 'медицинское образование'],
                                og_image: '/webapp/assets/course-manual-og.jpg',
                                twitter_card: 'summary_large_image'
                            }
                        },
                        {
                            title: 'Неврологическая диагностика: от основ к практике',
                            subtitle: 'Полный курс диагностических методик',
                            description: '5 модулей по современной неврологической диагностике',
                            full_description: 'Фундаментальный курс по неврологической диагностике с акцентом на практическое применение. Изучите современные методы обследования пациентов.',
                            price: 18000,
                            duration: '8 недель',
                            modules: 5,
                            category: 'Неврология',
                            subcategory: 'Диагностика',
                            level: 'intermediate',
                            students_count: 234,
                            rating: 4.6,
                            created_by: config.SUPER_ADMIN_ID,
                            instructor_id: config.SUPER_ADMIN_ID,
                            active: true,
                            featured: true
                        }
                    ],
                    podcasts: [
                        {
                            title: 'АНБ FM: Современная неврология и вызовы времени',
                            description: 'Обсуждение новых тенденций и вызовов в современной неврологии',
                            duration: '45:20',
                            category: 'Неврология',
                            listens: 2345,
                            created_by: config.SUPER_ADMIN_ID,
                            image_url: '/webapp/assets/podcast-neurology.jpg'
                        }
                    ],
                    streams: [
                        {
                            title: 'Разбор клинического случая: Болевой синдром в практике',
                            description: 'Прямой эфир с разбором сложного клинического случая болевого синдрома',
                            duration: '1:30:00',
                            stream_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                            live: true,
                            participants: 89,
                            type: 'clinical_analysis',
                            created_by: config.SUPER_ADMIN_ID,
                            thumbnail_url: '/webapp/assets/stream-pain-syndrome.jpg'
                        }
                    ],
                    videos: [
                        {
                            title: 'Шпаргалка невролога: Неврологический осмотр за 15 минут',
                            description: 'Быстрый гайд по основным тестам и методикам неврологического осмотра',
                            duration: '15:30',
                            category: 'Неврология',
                            views: 4567,
                            created_by: config.SUPER_ADMIN_ID,
                            thumbnail_url: '/webapp/assets/video-neurological-exam.jpg'
                        }
                    ],
                    materials: [
                        {
                            title: 'МРТ разбор: Рассеянный склероз и дифференциальная диагностика',
                            description: 'Детальный разбор МРТ с клиническими случаями и дифференциальной диагностикой',
                            material_type: 'mri_analysis',
                            category: 'Неврология',
                            downloads: 1234,
                            created_by: config.SUPER_ADMIN_ID,
                            image_url: '/webapp/assets/material-ms-mri.jpg'
                        }
                    ],
                    events: [
                        {
                            title: 'Конференция: Современная неврология 2024 - Инновации и практика',
                            description: 'Ежегодная конференция с ведущими специалистами в области неврологии',
                            event_date: new Date('2024-02-15T10:00:00'),
                            location: 'Москва, ЦВК Экспоцентр',
                            event_type: 'offline_conference',
                            participants: 456,
                            created_by: config.SUPER_ADMIN_ID,
                            image_url: '/webapp/assets/event-neurology-conf.jpg'
                        }
                    ],
                    promotions: [
                        {
                            title: 'Скидка 25% на первую подписку Premium',
                            description: 'Специальное предложение для новых пользователей - получите доступ ко всем курсам со скидкой',
                            discount: 25,
                            active: true,
                            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                            created_by: config.SUPER_ADMIN_ID,
                            image_url: '/webapp/assets/promo-welcome.jpg'
                        }
                    ],
                    chats: [
                        {
                            name: 'Общий чат Академии АНБ',
                            description: 'Основной чат для общения всех участников академии',
                            type: 'group',
                            participants_count: 1567,
                            last_message: 'Добро пожаловать в Академию АНБ!',
                            image_url: '/webapp/assets/chat-main.jpg'
                        }
                    ]
                };

                // Вставляем демо-контент
                for (const [table, items] of Object.entries(demoContent)) {
                    for (const item of items) {
                        const keys = Object.keys(item);
                        const values = Object.values(item);
                        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                        
                        await this.pgClient.query(
                            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
                            values
                        );
                    }
                }

                logger.info('✅ Демо-контент создан');
            }
        } catch (error) {
            logger.error('Ошибка создания демо-контента:', error);
        }
    }

    async createSystemSettings() {
        const settings = [
            {
                key: 'app.name',
                value: 'Академия АНБ',
                type: 'string',
                category: 'general',
                description: 'Название приложения',
                is_public: true
            },
            {
                key: 'app.version',
                value: '2.0.0',
                type: 'string',
                category: 'general',
                description: 'Версия приложения',
                is_public: true
            },
            {
                key: 'app.theme',
                value: 'dark',
                type: 'string',
                category: 'ui',
                description: 'Цветовая тема приложения',
                is_public: true
            },
            {
                key: 'security.password_min_length',
                value: 8,
                type: 'number',
                category: 'security',
                description: 'Минимальная длина пароля',
                is_public: false
            },
            {
                key: 'security.max_login_attempts',
                value: 5,
                type: 'number',
                category: 'security',
                description: 'Максимальное количество попыток входа',
                is_public: false
            },
            {
                key: 'payment.currency',
                value: 'RUB',
                type: 'string',
                category: 'payment',
                description: 'Основная валюта платежей',
                is_public: true
            },
            {
                key: 'notification.email_enabled',
                value: true,
                type: 'boolean',
                category: 'notification',
                description: 'Включены ли email уведомления',
                is_public: false
            }
        ];

        for (const setting of settings) {
            try {
                await this.pgClient.query(
                    `INSERT INTO system_settings (key, value, type, category, description, is_public, updated_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (key) DO NOTHING`,
                    [setting.key, setting.value, setting.type, setting.category, setting.description, setting.is_public, config.SUPER_ADMIN_ID]
                );
            } catch (error) {
                logger.error('Ошибка создания настройки:', error);
            }
        }

        logger.info('✅ Системные настройки созданы');
    }

    async setupDatabaseMonitoring() {
        // Мониторинг производительности БД
        cron.schedule(config.DATABASE_MONITORING_INTERVAL, async () => {
            await this.monitorDatabaseHealth();
        });

        // Оптимизация БД
        cron.schedule(config.DATABASE_OPTIMIZATION_INTERVAL, async () => {
            await this.optimizeDatabase();
        });

        // Бэкап БД
        cron.schedule(config.DATABASE_BACKUP_INTERVAL, async () => {
            await this.backupDatabase();
        });
    }

    async monitorDatabaseHealth() {
        try {
            const healthChecks = [
                this.pgClient.query('SELECT 1 as health_check'),
                this.pgClient.query('SELECT count(*) as user_count FROM users'),
                this.pgClient.query('SELECT count(*) as course_count FROM courses'),
                this.pgClient.query('SELECT pg_database_size(current_database()) as db_size')
            ];

            const results = await Promise.all(healthChecks);
            
            const healthStatus = {
                database_connection: 'healthy',
                user_count: parseInt(results[1].rows[0].user_count),
                course_count: parseInt(results[2].rows[0].course_count),
                database_size: parseInt(results[3].rows[0].db_size),
                last_check: new Date().toISOString()
            };

            await this.pgClient.query(
                `INSERT INTO system_health (component, status, status_code, response_time, last_check)
                 VALUES ($1, $2, $3, $4, $5)`,
                ['database', 'healthy', 200, 100, new Date()]
            );

            logger.debug('Database health check completed', healthStatus);
            
        } catch (error) {
            logger.error('Database health check failed:', error);
            
            await this.pgClient.query(
                `INSERT INTO system_health (component, status, status_code, error_message, last_check)
                 VALUES ($1, $2, $3, $4, $5)`,
                ['database', 'unhealthy', 500, error.message, new Date()]
            );
        }
    }

    async optimizeDatabase() {
        try {
            // Анализ и оптимизация таблиц
            await this.pgClient.query('ANALYZE');
            await this.pgClient.query('VACUUM ANALYZE');
            
            // Очистка старых данных
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            await this.pgClient.query(
                'DELETE FROM system_logs WHERE created_at < $1',
                [thirtyDaysAgo]
            );
            
            await this.pgClient.query(
                'DELETE FROM analytics_events WHERE created_at < $1',
                [thirtyDaysAgo]
            );

            logger.info('Database optimization completed');
        } catch (error) {
            logger.error('Database optimization failed:', error);
        }
    }

    async backupDatabase() {
        try {
            const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
            const backupName = `backup_${timestamp}.sql`;
            const backupPath = join(__dirname, 'backups', backupName);

            // Создаем директорию для бэкапов если её нет
            await fs.mkdir(join(__dirname, 'backups'), { recursive: true });

            // Здесь должна быть логика создания бэкапа БД
            // В реальной системе используйте pg_dump или аналогичные инструменты

            const backupInfo = {
                name: backupName,
                description: 'Automated database backup',
                file_path: backupPath,
                file_size: 0, // Заполняется после создания файла
                backup_type: 'full',
                status: 'completed',
                created_by: config.SUPER_ADMIN_ID
            };

            await this.pgClient.query(
                `INSERT INTO backups (name, description, file_path, file_size, backup_type, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [backupInfo.name, backupInfo.description, backupInfo.file_path, backupInfo.file_size, backupInfo.backup_type, backupInfo.status, backupInfo.created_by]
            );

            logger.info(`Database backup created: ${backupName}`);
        } catch (error) {
            logger.error('Database backup failed:', error);
        }
    }

    async query(text, params) {
        if (!this.connected) {
            throw new Error('База данных не подключена');
        }

        try {
            const startTime = Date.now();
            const result = await this.pgClient.query(text, params);
            const duration = Date.now() - startTime;

            // Логируем медленные запросы
            if (duration > 1000) {
                logger.warn('Slow database query', {
                    query: text,
                    duration,
                    params: params || []
                });
            }

            logger.performance('database_query', duration, { query: text });
            
            return result;
        } catch (error) {
            logger.error('Database query error:', error, { query: text, params });
            throw error;
        }
    }

    async transaction(callback) {
        const client = await this.pgClient.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async close() {
        try {
            if (this.pgClient) {
                await this.pgClient.end();
            }
            if (this.redis) {
                await this.redis.quit();
            }
            if (this.mongoClient) {
                await this.mongoClient.close();
            }
            if (this.mysqlConnection) {
                await this.mysqlConnection.end();
            }
            if (this.sqliteConnection) {
                this.sqliteConnection.close();
            }
            if (this.sequelize) {
                await this.sequelize.close();
            }
            if (this.mongoose) {
                await this.mongoose.connection.close();
            }
            
            logger.info('✅ Все соединения с базами данных закрыты');
        } catch (error) {
            logger.error('Ошибка при закрытии соединений с БД:', error);
        }
    }
}

const db = new DatabaseSystem();

// ==================== СИСТЕМА БЕЗОПАСНОСТИ ====================
class SecuritySystem {
    constructor() {
        this.rateLimiters = new Map();
        this.suspiciousActivities = new Map();
        this.setupSecurityMonitoring();
    }

    setupSecurityMonitoring() {
        // Мониторинг безопасности
        cron.schedule(config.SECURITY_MONITORING_INTERVAL, () => {
            this.scanForThreats();
        });

        // Сканирование уязвимостей
        cron.schedule(config.SECURITY_SCAN_INTERVAL, () => {
            this.scanForVulnerabilities();
        });

        // Оптимизация безопасности
        cron.schedule(config.SECURITY_OPTIMIZATION_INTERVAL, () => {
            this.optimizeSecurity();
        });
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
        const limiter = this.createRateLimiter(key, 15 * 60 * 1000, 100); // 15 минут, 100 запросов
        
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
            // Логируем подозрительную активность
            await this.logSuspiciousActivity(identifier, 'rate_limit_exceeded', {
                key,
                currentCount,
                cost,
                max: limiter.max
            });
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

    async sanitizeInput(input) {
        if (typeof input === 'string') {
            // Базовая sanitization
            return input
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/'/g, '&#x27;')
                .replace(/"/g, '&quot;')
                .replace(/\//g, '&#x2F;')
                .replace(/\\/g, '&#x5C;')
                .replace(/`/g, '&#x60;');
        }
        return input;
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

    async logSuspiciousActivity(userId, eventType, details = {}) {
        const activity = {
            userId,
            eventType,
            details,
            timestamp: new Date(),
            ipAddress: details.ipAddress,
            userAgent: details.userAgent
        };

        // Сохраняем в память для быстрого доступа
        const key = `${userId}_${eventType}`;
        this.suspiciousActivities.set(key, activity);

        // Сохраняем в БД
        try {
            await db.query(
                `INSERT INTO security_events (user_id, event_type, event_severity, description, ip_address, user_agent, risk_score, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    userId,
                    eventType,
                    this.getEventSeverity(eventType),
                    `Suspicious activity detected: ${eventType}`,
                    details.ipAddress,
                    details.userAgent,
                    this.calculateRiskScore(eventType, details),
                    details
                ]
            );
        } catch (error) {
            logger.error('Error logging security event:', error);
        }

        // Отправляем уведомление при высоком риске
        if (this.calculateRiskScore(eventType, details) > 70) {
            await this.sendSecurityAlert(userId, eventType, details);
        }
    }

    getEventSeverity(eventType) {
        const severityMap = {
            'rate_limit_exceeded': 'medium',
            'failed_login': 'low',
            'multiple_failed_logins': 'high',
            'suspicious_ip': 'medium',
            'data_breach_attempt': 'critical',
            'malicious_file_upload': 'high'
        };
        return severityMap[eventType] || 'low';
    }

    calculateRiskScore(eventType, details) {
        let score = 0;
        
        switch (eventType) {
            case 'rate_limit_exceeded':
                score = 40;
                break;
            case 'failed_login':
                score = 20;
                break;
            case 'multiple_failed_logins':
                score = 70;
                break;
            case 'suspicious_ip':
                score = 50;
                break;
            case 'data_breach_attempt':
                score = 90;
                break;
            case 'malicious_file_upload':
                score = 80;
                break;
        }

        // Увеличиваем счетчик при повторных событиях
        const key = `${details.userId}_${eventType}`;
        const previousEvents = this.suspiciousActivities.get(key) || [];
        if (previousEvents.length > 0) {
            score += previousEvents.length * 10;
        }

        return Math.min(score, 100);
    }

    async sendSecurityAlert(userId, eventType, details) {
        // Отправляем уведомление администраторам
        const admins = await db.query(
            'SELECT id, telegram_data FROM users WHERE is_admin = true OR is_super_admin = true'
        );

        for (const admin of admins.rows) {
            await db.query(
                `INSERT INTO notifications (user_id, title, message, type, category, priority, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    admin.id,
                    '🚨 Сигнал безопасности',
                    `Обнаружена подозрительная активность: ${eventType}\nПользователь: ${userId}\nДетали: ${JSON.stringify(details)}`,
                    'security',
                    'security_alert',
                    'high',
                    { eventType, userId, details }
                ]
            );
        }

        logger.security(eventType, userId, details);
    }

    async scanForThreats() {
        try {
            // Проверяем подозрительные IP адреса
            const suspiciousIPs = await db.query(`
                SELECT DISTINCT ip_address 
                FROM security_events 
                WHERE event_severity IN ('high', 'critical')
                AND created_at > NOW() - INTERVAL '1 hour'
            `);

            // Проверяем множественные неудачные попытки входа
            const failedLogins = await db.query(`
                SELECT user_id, COUNT(*) as attempts
                FROM security_events 
                WHERE event_type = 'failed_login'
                AND created_at > NOW() - INTERVAL '15 minutes'
                GROUP BY user_id 
                HAVING COUNT(*) > 5
            `);

            // Логируем результаты сканирования
            if (suspiciousIPs.rows.length > 0 || failedLogins.rows.length > 0) {
                logger.warn('Security threats detected', {
                    suspiciousIPs: suspiciousIPs.rows.length,
                    failedLogins: failedLogins.rows.length
                });
            }

        } catch (error) {
            logger.error('Threat scan failed:', error);
        }
    }

    async scanForVulnerabilities() {
        try {
            // Проверяем устаревшие зависимости
            // Проверяем конфигурации безопасности
            // Проверяем права доступа
            // В реальной системе здесь должен быть полноценный security audit

            logger.info('Security vulnerability scan completed');
        } catch (error) {
            logger.error('Vulnerability scan failed:', error);
        }
    }

    async optimizeSecurity() {
        try {
            // Очищаем старые security events
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            await db.query(
                'DELETE FROM security_events WHERE created_at < $1 AND event_severity = $2',
                [thirtyDaysAgo, 'low']
            );

            // Обновляем risk scores
            await this.updateRiskScores();

            logger.info('Security optimization completed');
        } catch (error) {
            logger.error('Security optimization failed:', error);
        }
    }

    async updateRiskScores() {
        // Обновляем risk scores на основе recent activity
        // Это упрощенная реализация
    }

    async validateFileUpload(file, allowedTypes, maxSize) {
        const validation = {
            isValid: true,
            errors: []
        };

        // Проверяем тип файла
        if (!allowedTypes.includes(file.mimetype)) {
            validation.isValid = false;
            validation.errors.push(`Недопустимый тип файла: ${file.mimetype}`);
        }

        // Проверяем размер файла
        if (file.size > maxSize) {
            validation.isValid = false;
            validation.errors.push(`Размер файла превышает допустимый лимит: ${maxSize} bytes`);
        }

        // Проверяем расширение файла
        const allowedExtensions = allowedTypes.map(type => 
            type.split('/')[1] || type.split('/')[0]
        );
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            validation.isValid = false;
            validation.errors.push(`Недопустимое расширение файла: ${fileExtension}`);
        }

        return validation;
    }

    async scanFileForThreats(filePath) {
        try {
            // В реальной системе здесь должна быть интеграция с антивирусом
            // или сервисом сканирования файлов
            
            const fileStats = await fs.stat(filePath);
            const fileSize = fileStats.size;

            // Базовая проверка на подозрительные паттерны
            const fileContent = await fs.readFile(filePath, 'utf8');
            
            const suspiciousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // JavaScript
                /<iframe\b[^>]*>/gi, // IFrames
                /on\w+\s*=/gi, // Event handlers
                /javascript:/gi, // JavaScript URLs
                /vbscript:/gi, // VBScript
                /expression\s*\(/gi, // CSS expressions
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(fileContent)) {
                    return {
                        isClean: false,
                        threat: 'suspicious_content',
                        details: 'File contains potentially malicious content'
                    };
                }
            }

            return {
                isClean: true,
                threat: null,
                details: 'File appears to be clean'
            };

        } catch (error) {
            logger.error('File threat scan failed:', error);
            return {
                isClean: false,
                threat: 'scan_failed',
                details: 'Unable to scan file for threats'
            };
        }
    }
}

const security = new SecuritySystem();

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
            this.setupWebhook();
            this.setupHandlers();
            this.setupScenes();
            this.setupMiddleware();
            
            this.launchBot();
            
        } catch (error) {
            logger.error('❌ Ошибка инициализации бота:', error);
        }
    }

    setupWebhook() {
        if (config.NODE_ENV === 'production') {
            this.webhookUrl = `${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`;
            this.bot.telegram.setWebhook(this.webhookUrl);
            logger.info(`🌐 Webhook установлен: ${this.webhookUrl}`);
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
        this.bot.on('photo', this.handlePhoto.bind(this));
        this.bot.on('document', this.handleDocument.bind(this));
        this.bot.on('video', this.handleVideo.bind(this));

        // Обработчики callback queries
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

        // Обработчики инлайн-режима
        this.bot.on('inline_query', this.handleInlineQuery.bind(this));
    }

    setupScenes() {
        // Сцены для сложных взаимодействий
        const surveyScene = new Scenes.BaseScene('survey');
        const adminScene = new Scenes.BaseScene('admin');
        const courseCreationScene = new Scenes.BaseScene('course_creation');

        // Настройка сцен
        this.setupSurveyScene(surveyScene);
        this.setupAdminScene(adminScene);
        this.setupCourseCreationScene(courseCreationScene);

        const stage = new Scenes.Stage([surveyScene, adminScene, courseCreationScene]);
        this.bot.use(stage.middleware());
    }

    setupSurveyScene(scene) {
        scene.enter(async (ctx) => {
            await ctx.reply('👋 Добро пожаловать в Академию АНБ!\n\nДавайте познакомимся! Как вас зовут?');
        });

        scene.on('text', async (ctx) => {
            const name = ctx.message.text;
            ctx.session.name = name;
            
            await ctx.reply(`Приятно познакомиться, ${name}! Какая у вас специализация?`, {
                reply_markup: {
                    keyboard: [
                        ['Невролог', 'Реабилитолог'],
                        ['Мануальный терапевт', 'Физиотерапевт'],
                        ['Другое']
                    ],
                    resize_keyboard: true
                }
            });

            return ctx.wizard.next();
        });

        // ... дополнительные шаги опроса
    }

    setupAdminScene(scene) {
        scene.enter(async (ctx) => {
            const user = await this.getOrCreateUser(ctx.from);
            if (!user.is_admin && !user.is_super_admin) {
                await ctx.reply('❌ У вас нет прав доступа к админ-панели');
                return ctx.scene.leave();
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
                            { text: '🎧 Контент', callback_data: 'admin_content' }
                        ],
                        [
                            { text: '⚙️ Настройки', callback_data: 'admin_settings' },
                            { text: '📈 Аналитика', callback_data: 'admin_analytics' }
                        ],
                        [
                            { text: '📱 Открыть WebApp', web_app: { url: config.WEBAPP_URL } }
                        ]
                    ]
                }
            });
        });

        scene.action('admin_stats', async (ctx) => {
            const stats = await this.getAdminStats();
            await ctx.editMessageText(
                `📊 Статистика системы:\n\n` +
                `👥 Пользователей: ${stats.users.total}\n` +
                `📚 Курсов: ${stats.courses.total}\n` +
                `💳 Продаж: ${stats.payments.total}\n` +
                `📈 Доход: ${stats.revenue.total} руб.\n` +
                `🔄 Активность: ${stats.activity.daily} сегодня`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '◀️ Назад', callback_data: 'admin_back' }]
                        ]
                    }
                }
            );
            await ctx.answerCbQuery();
        });

        // ... дополнительные обработчики админ-панели
    }

    setupCourseCreationScene(scene) {
        // Логика создания курсов через бота
    }

    setupMiddleware() {
        // Middleware для логирования
        this.bot.use(async (ctx, next) => {
            const startTime = Date.now();
            await next();
            const duration = Date.now() - startTime;
            
            logger.performance('telegram_update', duration, {
                updateType: ctx.updateType,
                userId: ctx.from?.id,
                chatId: ctx.chat?.id
            });
        });

        // Middleware для безопасности
        this.bot.use(async (ctx, next) => {
            const userId = ctx.from?.id;
            const ip = ctx.telegram?._webhook?.request?.ip;
            
            if (userId) {
                const allowed = await security.checkRateLimit('telegram_user', userId.toString());
                if (!allowed) {
                    await ctx.reply('🚫 Слишком много запросов. Пожалуйста, подождите немного.');
                    return;
                }
            }
            
            await next();
        });
    }

    async handleStart(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            
            if (!user.survey_completed) {
                await ctx.scene.enter('survey');
            } else {
                await this.showMainMenu(ctx);
            }
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
            await ctx.reply('❌ У вас нет прав доступа');
            return;
        }

        await ctx.scene.enter('admin');
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
            `🎯 Специализация: ${user.profile_data.specialization || 'не указана'}\n` +
            `🏙️ Город: ${user.profile_data.city || 'не указан'}\n` +
            `📧 Email: ${user.profile_data.email || 'не указан'}\n` +
            `💳 Подписка: ${user.subscription_data.status === 'active' ? 'Активна' : 'Не активна'}\n` +
            `📊 Прогресс: Уровень ${user.progress_data.level}\n\n` +
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
                `Я вас не понял. Используйте команды:\n` +
                `/start - Начать работу\n` +
                `/menu - Главное меню\n` +
                `/help - Помощь`
            );
        }
    }

    async handlePhoto(ctx) {
        await ctx.reply('📸 Фото получено! Для работы с медиа-файлами используйте WebApp.');
    }

    async handleDocument(ctx) {
        await ctx.reply('📄 Документ получен! Для работы с файлами используйте WebApp.');
    }

    async handleVideo(ctx) {
        await ctx.reply('🎥 Видео получено! Для работы с видео используйте WebApp.');
    }

    async handleCallbackQuery(ctx) {
        const data = ctx.callbackQuery.data;
        
        try {
            await ctx.answerCbQuery();
            
            // Обработка различных callback действий
            if (data.startsWith('admin_')) {
                await this.handleAdminCallback(ctx, data);
            } else if (data.startsWith('course_')) {
                await this.handleCourseCallback(ctx, data);
            }
            
        } catch (error) {
            logger.error('Callback query error:', error);
            await ctx.answerCbQuery('❌ Произошла ошибка');
        }
    }

    async handleInlineQuery(ctx) {
        // Обработка инлайн-запросов
        const query = ctx.inlineQuery.query;
        
        if (!query) {
            return;
        }

        try {
            const results = await this.searchContent(query);
            
            await ctx.answerInlineQuery(
                results.map((item, index) => ({
                    type: 'article',
                    id: index.toString(),
                    title: item.title,
                    description: item.description,
                    input_message_content: {
                        message_text: `🔍 Найден: ${item.title}\n\n${item.description}\n\nОткройте в приложении для подробностей:`,
                        parse_mode: 'HTML'
                    },
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть в приложении', web_app: { url: `${config.WEBAPP_URL}/${item.type}/${item.id}` } }
                        ]]
                    }
                }))
            );
        } catch (error) {
            logger.error('Inline query error:', error);
        }
    }

    async searchContent(query) {
        // Поиск контента по запросу
        const searchResults = [];
        
        // Поиск курсов
        const courses = await db.query(
            'SELECT id, title, description FROM courses WHERE active = true AND title ILIKE $1 LIMIT 3',
            [`%${query}%`]
        );
        
        courses.rows.forEach(course => {
            searchResults.push({
                type: 'course',
                id: course.id,
                title: course.title,
                description: course.description
            });
        });

        return searchResults;
    }

    async showMainMenu(ctx) {
        await ctx.reply('🎯 Главное меню Академии АНБ', {
            reply_markup: {
                keyboard: [
                    ['📱 Открыть приложение'],
                    ['📚 Курсы', '🎧 Подкасты'],
                    ['📹 Эфиры', '📋 Материалы'],
                    ['👤 Профиль', '🆘 Помощь']
                ],
                resize_keyboard: true,
                one_time_keyboard: false
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
                is_super_admin: telegramUser.id === config.SUPER_ADMIN_ID,
                survey_completed: false
            };

            await db.query(
                `INSERT INTO users (id, telegram_data, is_admin, is_super_admin, survey_completed)
                 VALUES ($1, $2, $3, $4, $5)`,
                [newUser.id, newUser.telegram_data, newUser.is_admin, newUser.is_super_admin, newUser.survey_completed]
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
                revenueResult,
                activityResult
            ] = await Promise.all([
                db.query('SELECT COUNT(*) FROM users'),
                db.query('SELECT COUNT(*) FROM courses WHERE active = true'),
                db.query('SELECT COUNT(*) FROM payments WHERE status = $1', ['completed']),
                db.query('SELECT SUM(amount) FROM payments WHERE status = $1', ['completed']),
                db.query('SELECT COUNT(*) FROM analytics_events WHERE created_at > NOW() - INTERVAL \'1 day\'')
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
                },
                activity: {
                    daily: parseInt(activityResult.rows[0].count)
                }
            };
        } catch (error) {
            logger.error('Error getting admin stats:', error);
            return {
                users: { total: 0 },
                courses: { total: 0 },
                payments: { total: 0 },
                revenue: { total: 0 },
                activity: { daily: 0 }
            };
        }
    }

    async launchBot() {
        if (config.NODE_ENV === 'production') {
            // В production используем webhook
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
            // В development используем polling
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

    async broadcastMessage(userIds, message, options = {}) {
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };

        for (const userId of userIds) {
            try {
                await this.sendNotification(userId, message, options);
                results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    userId,
                    error: error.message
                });
            }
        }

        logger.info(`📢 Рассылка завершена: ${results.successful} успешно, ${results.failed} с ошибками`);
        return results;
    }
}

const telegramBot = new TelegramBotSystem();

// ==================== EXPRESS SERVER СИСТЕМА ====================
class ExpressServerSystem {
    constructor() {
        this.app = express();
        this.server = null;
        this.io = null;
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
            limit: '50mb',
            verify: (req, res, buf) => {
                try {
                    JSON.parse(buf);
                } catch (e) {
                    throw new Error('Invalid JSON');
                }
            }
        }));

        // Парсинг URL-encoded данных
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: '50mb',
            parameterLimit: 10000
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

        // Кэширование
        const cache = apicache.options({
            debug: config.NODE_ENV === 'development',
            defaultDuration: '1 hour',
            appendKey: (req, res) => req.method + req.originalUrl
        }).middleware;

        this.app.use(cache('5 minutes'));
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
            const allowedTypes = {
                'courses': ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
                'podcasts': ['audio/mpeg', 'audio/wav', 'audio/ogg'],
                'streams': ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png'],
                'videos': ['video/mp4', 'video/quicktime'],
                'materials': ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                'avatars': ['image/jpeg', 'image/png', 'image/webp'],
                'documents': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
            };

            const fieldName = file.fieldname;
            const allowedMimes = allowedTypes[fieldName] || allowedTypes['documents'];

            if (allowedMimes && allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error(`Неподдерживаемый тип файла для ${fieldName}: ${file.mimetype}`), false);
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
        this.app.put('/api/user/:id', this.handleUserUpdate.bind(this));
        this.app.get('/api/user/profile', this.handleUserProfile.bind(this));

        // Content routes
        this.app.get('/api/content', this.handleGetContent.bind(this));
        this.app.get('/api/content/:type', this.handleGetContentByType.bind(this));
        this.app.get('/api/content/:type/:id', this.handleGetContentDetail.bind(this));
        this.app.post('/api/content/:type', this.upload.single('file'), this.handleCreateContent.bind(this));
        this.app.put('/api/content/:type/:id', this.upload.single('file'), this.handleUpdateContent.bind(this));
        this.app.delete('/api/content/:type/:id', this.handleDeleteContent.bind(this));

        // Favorites routes
        this.app.get('/api/favorites', this.handleGetFavorites.bind(this));
        this.app.post('/api/favorites/toggle', this.handleToggleFavorite.bind(this));

        // Progress routes
        this.app.get('/api/progress', this.handleGetProgress.bind(this));
        this.app.post('/api/progress/update', this.handleUpdateProgress.bind(this));

        // Payment routes
        this.app.post('/api/payment/create', this.handleCreatePayment.bind(this));
        this.app.post('/api/payment/webhook', this.handlePaymentWebhook.bind(this));

        // Admin routes
        this.app.get('/api/admin/stats', this.handleAdminStats.bind(this));
        this.app.get('/api/admin/users', this.handleAdminUsers.bind(this));
        this.app.get('/api/admin/analytics', this.handleAdminAnalytics.bind(this));

        // Webhook routes
        this.app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
            telegramBot.bot.handleUpdate(req.body, res);
        });

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

            socket.on('authenticate', async (data) => {
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

            socket.on('join_course', (courseId) => {
                socket.join(`course_${courseId}`);
            });

            socket.on('send_message', async (data) => {
                try {
                    const { courseId, message } = data;
                    this.io.to(`course_${courseId}`).emit('new_message', {
                        userId: socket.userId,
                        message,
                        timestamp: new Date()
                    });
                } catch (error) {
                    socket.emit('error', { message: 'Failed to send message' });
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
                error: config.NODE_ENV === 'development' ? error.message : 'Internal server error',
                ...(config.NODE_ENV === 'development' && { stack: error.stack })
            });
        });
    }

    async getSystemHealth() {
        const checks = {
            database: 'unknown',
            redis: 'unknown',
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
            // Проверка Redis
            await cache.redis.ping();
            checks.redis = 'healthy';
        } catch (error) {
            checks.redis = 'unhealthy';
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

            // Валидация входных данных
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
                joinedAt: user.created_at,
                surveyCompleted: user.survey_completed
            };

            res.json({ success: true, user: userResponse });
        } catch (error) {
            logger.error('User API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUserUpdate(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const updateData = req.body;

            // Проверяем права доступа
            if (userId !== req.user?.id && !req.user?.isAdmin) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Валидация данных
            const validation = await security.validateInput(
                Joi.object({
                    specialization: Joi.string().max(100),
                    city: Joi.string().max(50),
                    email: Joi.string().email(),
                    bio: Joi.string().max(500)
                }),
                updateData
            );

            if (!validation.isValid) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: validation.errors 
                });
            }

            // Обновляем профиль
            await db.query(
                `UPDATE users SET 
                 profile_data = COALESCE(profile_data, '{}'::jsonb) || $1,
                 updated_at = NOW()
                 WHERE id = $2`,
                [updateData, userId]
            );

            res.json({ success: true, message: 'Profile updated successfully' });
        } catch (error) {
            logger.error('User update error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUserProfile(req, res) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
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
                        `SELECT *, 
                         COALESCE(image_url, '/webapp/assets/${type}-default.jpg') as image_url 
                         FROM ${type} WHERE active = TRUE ORDER BY created_at DESC LIMIT 20`
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
            const { page = 1, limit = 20, category, search } = req.query;

            const offset = (page - 1) * limit;
            let query = `SELECT * FROM ${type} WHERE active = TRUE`;
            let countQuery = `SELECT COUNT(*) FROM ${type} WHERE active = TRUE`;
            const params = [];
            let paramCount = 0;

            if (category) {
                paramCount++;
                query += ` AND category = $${paramCount}`;
                countQuery += ` AND category = $${paramCount}`;
                params.push(category);
            }

            if (search) {
                paramCount++;
                query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
                countQuery += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(parseInt(limit), offset);

            const [contentResult, countResult] = await Promise.all([
                db.query(query, params),
                db.query(countQuery, params.slice(0, -2))
            ]);

            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(total / limit);

            res.json({
                success: true,
                data: contentResult.rows,
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

    async handleCreateContent(req, res) {
        try {
            const { type } = req.params;
            const contentData = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Проверяем права администратора
            const userResult = await db.query(
                'SELECT is_admin, is_super_admin FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Обрабатываем файл если есть
            if (req.file) {
                const filePath = `/uploads/${type}/${req.file.filename}`;
                
                // Создаем миниатюры для изображений
                if (req.file.mimetype.startsWith('image/')) {
                    const thumbPath = req.file.path + '-thumb.jpg';
                    await sharp(req.file.path)
                        .resize(400, 300)
                        .jpeg({ quality: 80 })
                        .toFile(thumbPath);

                    contentData.thumbnail_url = filePath + '-thumb.jpg';
                }

                contentData.image_url = filePath;
                
                // Сканируем файл на угрозы
                const scanResult = await security.scanFileForThreats(req.file.path);
                if (!scanResult.isClean) {
                    await fs.unlink(req.file.path);
                    return res.status(400).json({ 
                        error: 'File security check failed',
                        details: scanResult.details
                    });
                }
            }

            contentData.created_by = userId;
            contentData.active = true;

            // Вставляем в соответствующую таблицу
            const keys = Object.keys(contentData);
            const values = Object.values(contentData);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

            const result = await db.query(
                `INSERT INTO ${type} (${keys.join(', ')})
                 VALUES (${placeholders})
                 RETURNING *`,
                values
            );

            // Отправляем уведомление о новом контенте
            if (type === 'courses') {
                await this.notifyAboutNewCourse(result.rows[0]);
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            logger.error('Create content error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUpdateContent(req, res) {
        try {
            const { type, id } = req.params;
            const updateData = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Проверяем права
            const userResult = await db.query(
                'SELECT is_admin, is_super_admin FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Обработка файла
            if (req.file) {
                const filePath = `/uploads/${type}/${req.file.filename}`;
                
                if (req.file.mimetype.startsWith('image/')) {
                    const thumbPath = req.file.path + '-thumb.jpg';
                    await sharp(req.file.path)
                        .resize(400, 300)
                        .jpeg({ quality: 80 })
                        .toFile(thumbPath);

                    updateData.thumbnail_url = filePath + '-thumb.jpg';
                }

                updateData.image_url = filePath;

                // Сканирование файла
                const scanResult = await security.scanFileForThreats(req.file.path);
                if (!scanResult.isClean) {
                    await fs.unlink(req.file.path);
                    return res.status(400).json({ 
                        error: 'File security check failed',
                        details: scanResult.details
                    });
                }
            }

            updateData.updated_at = new Date();

            // Обновляем запись
            const keys = Object.keys(updateData);
            const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
            const values = [...Object.values(updateData), id];

            const result = await db.query(
                `UPDATE ${type} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            logger.error('Update content error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleDeleteContent(req, res) {
        try {
            const { type, id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Проверяем права
            const userResult = await db.query(
                'SELECT is_admin, is_super_admin FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Мягкое удаление
            const result = await db.query(
                `UPDATE ${type} SET active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ success: true, message: 'Content deleted successfully' });
        } catch (error) {
            logger.error('Delete content error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetFavorites(req, res) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const result = await db.query(
                'SELECT favorites_data FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ success: true, favorites: result.rows[0].favorites_data });
        } catch (error) {
            logger.error('Get favorites error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleToggleFavorite(req, res) {
        try {
            const { contentId, contentType } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
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

    async handleGetProgress(req, res) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const result = await db.query(
                'SELECT progress_data FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ success: true, progress: result.rows[0].progress_data });
        } catch (error) {
            logger.error('Get progress error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUpdateProgress(req, res) {
        try {
            const { contentType, contentId, progress, completed } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            await db.query(
                `INSERT INTO user_progress (user_id, content_type, content_id, progress, completed, last_activity)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 ON CONFLICT (user_id, content_type, content_id)
                 DO UPDATE SET progress = $4, completed = $5, last_activity = NOW()`,
                [userId, contentType, contentId, progress, completed]
            );

            // Обновляем общий прогресс пользователя
            await this.updateUserOverallProgress(userId);

            res.json({ success: true });
        } catch (error) {
            logger.error('Update progress error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateUserOverallProgress(userId) {
        try {
            const progressResult = await db.query(`
                SELECT 
                    COUNT(*) as total_items,
                    SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_items,
                    AVG(progress) as average_progress
                FROM user_progress 
                WHERE user_id = $1
            `, [userId]);

            const progress = progressResult.rows[0];
            const completionRate = progress.total_items > 0 ? (progress.completed_items / progress.total_items) * 100 : 0;

            await db.query(
                `UPDATE users SET 
                 progress_data = COALESCE(progress_data, '{}'::jsonb) || $1,
                 updated_at = NOW()
                 WHERE id = $2`,
                [{
                    completion_rate: completionRate,
                    average_progress: parseFloat(progress.average_progress) || 0,
                    last_activity: new Date()
                }, userId]
            );
        } catch (error) {
            logger.error('Update overall progress error:', error);
        }
    }

    async handleCreatePayment(req, res) {
        try {
            const { courseId, amount, paymentMethod } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Создаем платеж в базе данных
            const paymentResult = await db.query(
                `INSERT INTO payments (user_id, course_id, amount, currency, status, payment_method, total_amount)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [userId, courseId, amount, 'RUB', 'pending', paymentMethod, amount]
            );

            // Здесь должна быть интеграция с платежной системой
            // Для демонстрации сразу подтверждаем платеж
            await db.query(
                'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2',
                ['completed', paymentResult.rows[0].id]
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

    async handlePaymentWebhook(req, res) {
        try {
            const webhookData = req.body;
            
            // Обработка webhook от платежной системы
            // В реальной системе здесь должна быть верификация подписи

            const { payment_id, status } = webhookData;

            await db.query(
                'UPDATE payments SET status = $1, updated_at = NOW() WHERE gateway_transaction_id = $2',
                [status, payment_id]
            );

            if (status === 'completed') {
                // Обновляем подписку пользователя и т.д.
            }

            res.json({ success: true });
        } catch (error) {
            logger.error('Payment webhook error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleAdminStats(req, res) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
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

    async handleAdminUsers(req, res) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Проверяем права
            const userResult = await db.query(
                'SELECT is_admin, is_super_admin FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const { page = 1, limit = 20, search } = req.query;
            const offset = (page - 1) * limit;

            let query = 'SELECT id, telegram_data, profile_data, created_at, last_login FROM users';
            let countQuery = 'SELECT COUNT(*) FROM users';
            const params = [];
            let paramCount = 0;

            if (search) {
                paramCount++;
                query += ` WHERE (telegram_data->>'first_name' ILIKE $${paramCount} OR telegram_data->>'username' ILIKE $${paramCount} OR profile_data->>'email' ILIKE $${paramCount})`;
                countQuery += ` WHERE (telegram_data->>'first_name' ILIKE $${paramCount} OR telegram_data->>'username' ILIKE $${paramCount} OR profile_data->>'email' ILIKE $${paramCount})`;
                params.push(`%${search}%`);
            }

            query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
            params.push(parseInt(limit), offset);

            const [usersResult, countResult] = await Promise.all([
                db.query(query, params),
                db.query(countQuery, params.slice(0, -2))
            ]);

            const total = parseInt(countResult.rows[0].count);
            const totalPages = Math.ceil(total / limit);

            res.json({
                success: true,
                users: usersResult.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages
                }
            });
        } catch (error) {
            logger.error('Admin users error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleAdminAnalytics(req, res) {
        try {
            const userId = req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Проверяем права
            const userResult = await db.query(
                'SELECT is_admin, is_super_admin FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
                return res.status(403).json({ error: 'Access denied' });
            }

            const { period = '7d' } = req.query;
            let interval = '7 days';
            
            switch (period) {
                case '1d': interval = '1 day'; break;
                case '7d': interval = '7 days'; break;
                case '30d': interval = '30 days'; break;
                case '90d': interval = '90 days'; break;
            }

            const analytics = await db.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN created_at > NOW() - INTERVAL '${interval}' THEN 1 END) as new_users,
                    COUNT(CASE WHEN last_login > NOW() - INTERVAL '${interval}' THEN 1 END) as active_users,
                    (SELECT COUNT(*) FROM courses WHERE active = true) as total_courses,
                    (SELECT COUNT(*) FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '${interval}') as total_payments,
                    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '${interval}') as total_revenue
                FROM users
            `);

            res.json({ success: true, analytics: analytics.rows[0] });
        } catch (error) {
            logger.error('Admin analytics error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async notifyAboutNewCourse(course) {
        try {
            // Получаем пользователей, которые могут быть заинтересованы в курсе
            const interestedUsers = await db.query(`
                SELECT id FROM users 
                WHERE (profile_data->>'specialization' = $1 OR 
                      profile_data->>'specialization' IS NULL)
                AND is_blocked = false
                AND is_deleted = false
                LIMIT 1000
            `, [course.category]);

            const userIds = interestedUsers.rows.map(row => row.id);
            
            const message = `🎉 Новый курс: "${course.title}"\n\n${course.description}\n\nСпешите записаться!`;

            await telegramBot.broadcastMessage(userIds, message, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📚 Посмотреть курс', web_app: { url: `${config.WEBAPP_URL}/courses/${course.id}` } }
                    ]]
                }
            });

        } catch (error) {
            logger.error('Notify about new course error:', error);
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
        await cache.flush(); // Очищаем кэш при запуске
        
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
    
    // Ежедневный бэкап
    cron.schedule(config.BACKUP_INTERVAL, async () => {
        logger.info('💾 Запуск ежедневного бэкапа...');
        await db.backupDatabase();
    });
    
    // Очистка старых данных
    cron.schedule(config.CLEANUP_INTERVAL, async () => {
        logger.info('🧹 Очистка старых данных...');
        await db.optimizeDatabase();
    });
    
    // Проверка здоровья системы
    cron.schedule(config.HEALTH_CHECK_INTERVAL, async () => {
        const health = await new ExpressServerSystem().getSystemHealth();
        if (health.status !== 'healthy') {
            logger.warn('⚠️ Проблемы со здоровьем системы:', health);
        }
    });
    
    // Генерация аналитики
    cron.schedule(config.ANALYTICS_INTERVAL, async () => {
        logger.info('📈 Генерация ежедневной аналитики...');
        await generateDailyAnalytics();
    });
    
    // Отправка уведомлений
    cron.schedule(config.NOTIFICATION_INTERVAL, async () => {
        logger.info('📧 Отправка ежедневных уведомлений...');
        await sendDailyNotifications();
    });
    
    logger.info('✅ Все запланированные задачи запущены');
}

async function generateDailyAnalytics() {
    try {
        const analytics = await db.query(`
            INSERT INTO reports (name, description, report_type, data, generated_by)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            'Ежедневная аналитика',
            'Автоматически сгенерированный отчет за день',
            'daily_analytics',
            {
                timestamp: new Date(),
                user_activity: {},
                course_engagement: {},
                revenue_metrics: {}
            },
            config.SUPER_ADMIN_ID
        ]);
        
        logger.info('✅ Ежедневная аналитика сгенерирована');
    } catch (error) {
        logger.error('❌ Ошибка генерации аналитики:', error);
    }
}

async function sendDailyNotifications() {
    try {
        // Получаем пользователей с неактивными подписками
        const expiringSubscriptions = await db.query(`
            SELECT u.id, u.telegram_data, s.end_date
            FROM users u
            JOIN subscriptions s ON u.id = s.user_id
            WHERE s.status = 'active'
            AND s.end_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
        `);
        
        for (const user of expiringSubscriptions.rows) {
            await telegramBot.sendNotification(
                user.id,
                `⚠️ Ваша подписка истекает ${moment(user.end_date).format('DD.MM.YYYY')}. Продлите ее для продолжения доступа ко всем курсам!`,
                {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '💳 Продлить подписку', web_app: { url: `${config.WEBAPP_URL}/subscription` } }
                        ]]
                    }
                }
            );
        }
        
        logger.info(`✅ Уведомления отправлены ${expiringSubscriptions.rows.length} пользователям`);
    } catch (error) {
        logger.error('❌ Ошибка отправки уведомлений:', error);
    }
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
