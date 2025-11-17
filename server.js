// server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С БЕЗОПАСНОСТЬЮ
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Telegraf } from 'telegraf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Базовая конфигурация
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    WEBAPP_URL: process.env.WEBAPP_URL || `https://sergeynikishin555123123-lab-smart-clinic-tg-app-f84f.twc1.net`,
    NODE_ENV: process.env.NODE_ENV || 'production',
    ADMIN_IDS: [898508164],
    SUPER_ADMIN_ID: 898508164
};

// ==================== СИСТЕМА ЛОГИРОВАНИЯ ====================
class LoggerSystem {
    constructor() {
        this.logger = console;
    }

    info(message, meta = {}) {
        this.logger.log('ℹ️', message, meta);
    }

    error(message, error = null) {
        this.logger.error('❌', message, error);
    }

    warn(message, meta = {}) {
        this.logger.warn('⚠️', message, meta);
    }
}

const logger = new LoggerSystem();

// ==================== TELEGRAM BOT СИСТЕМА ====================
class TelegramBotSystem {
    constructor() {
        this.bot = null;
        this.setupBot();
    }

    setupBot() {
        try {
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
        this.bot.start(this.handleStart.bind(this));
        this.bot.command('menu', this.handleMenu.bind(this));
        this.bot.command('courses', this.handleCourses.bind(this));
        this.bot.command('help', this.handleHelp.bind(this));
        this.bot.command('admin', this.handleAdmin.bind(this));
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

    async handleAdmin(ctx) {
        const userId = ctx.from.id;
        if (config.ADMIN_IDS.includes(userId)) {
            await ctx.reply('🔧 Панель администратора', {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📊 Статистика', callback_data: 'admin_stats' },
                        { text: '👥 Пользователи', callback_data: 'admin_users' }
                    ]]
                }
            });
        } else {
            await ctx.reply('❌ У вас нет доступа к админ-панели');
        }
    }

    async handleHelp(ctx) {
        const helpText = `🆘 Помощь по Академии АНБ:\n\n📚 /courses - Посмотреть курсы\n👤 /profile - Посмотреть профиль\n🆘 /support - Связь с поддержкой\n📱 /menu - Главное меню`;
        await ctx.reply(helpText);
    }

    async launchBot() {
        try {
            if (config.NODE_ENV === 'production') {
                // В production используем webhook
                this.bot.telegram.setWebhook(`${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`);
                this.bot.launch({
                    webhook: {
                        domain: config.WEBAPP_URL,
                        port: PORT
                    }
                });
                logger.info(`✅ Telegram Bot запущен в production режиме с webhook: ${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`);
            } else {
                // В development используем polling
                this.bot.launch();
                logger.info('✅ Telegram Bot запущен в development режиме');
            }
        } catch (error) {
            logger.error('❌ Ошибка запуска бота:', error);
        }
    }
}

// ==================== EXPRESS SERVER ====================
class ExpressServerSystem {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Настройки CORS для Telegram Web App
        this.app.use(cors({
            origin: [
                'https://web.telegram.org',
                'https://telegram.org',
                config.WEBAPP_URL,
                'http://localhost:3000'
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Безопасность с настройками для Telegram
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'", "https://telegram.org", "https://web.telegram.org"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    imgSrc: ["'self'", "data:", "https:", "blob:"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    connectSrc: ["'self'", "https://telegram.org", "https://web.telegram.org", config.WEBAPP_URL]
                }
            },
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));
        
        // Компрессия
        this.app.use(compression());
        
        // Логирование
        this.app.use(morgan('combined'));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: { error: 'Слишком много запросов' },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use(limiter);
        
        // Парсинг JSON
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Статические файлы
        this.app.use('/webapp', express.static(join(__dirname, 'webapp'), {
            setHeaders: (res, path) => {
                // Разрешаем кросс-доменные запросы для статических файлов
                res.setHeader('Access-Control-Allow-Origin', '*');
            }
        }));
        
        this.app.use('/assets', express.static(join(__dirname, 'webapp/assets'), {
            setHeaders: (res, path) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
            }
        }));

        // Обработка OPTIONS запросов для CORS
        this.app.options('*', cors());
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                webapp_url: config.WEBAPP_URL
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

        // Webhook для Telegram
        this.app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
            logger.info('📨 Получен webhook от Telegram');
            if (telegramBot.bot) {
                telegramBot.bot.handleUpdate(req.body, res);
            } else {
                res.status(200).send();
            }
        });

        // Тестовый маршрут для проверки CORS
        this.app.get('/api/test', (req, res) => {
            res.json({ 
                success: true, 
                message: 'CORS работает!',
                timestamp: new Date().toISOString(),
                allowed_origins: ['https://web.telegram.org', 'https://telegram.org', config.WEBAPP_URL]
            });
        });

        // SPA fallback
        this.app.get('*', (req, res) => {
            res.sendFile(join(__dirname, 'webapp', 'index.html'));
        });
    }

    async handleUserRequest(req, res) {
        try {
            const { id, firstName, username } = req.body;
            
            const user = {
                id: id || 898508164,
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

            res.json({ success: true, user });
        } catch (error) {
            logger.error('User API Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleUserProfile(req, res) {
        try {
            const user = {
                id: 898508164,
                firstName: 'Демо Пользователь',
                specialization: 'Невролог',
                city: 'Москва',
                subscription: { status: 'active', type: 'premium' },
                isAdmin: true
            };

            res.json({ success: true, user });
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
                        full_description: 'Комплексный курс по мануальным техникам для практикующих врачей-неврологов.',
                        price: 25000,
                        original_price: 30000,
                        discount: 16.67,
                        duration: '12 недель',
                        modules: 6,
                        lessons: 24,
                        category: 'Мануальные техники',
                        level: 'advanced',
                        students_count: 156,
                        rating: 4.8,
                        image_url: '/webapp/assets/course-manual.jpg',
                        featured: true,
                        popular: true,
                        curriculum: [
                            {
                                module: 1,
                                title: 'Основы мануальной диагностики',
                                duration: '2 недели',
                                lessons: [
                                    {
                                        title: 'Анатомия позвоночника',
                                        duration: 45,
                                        type: 'video'
                                    }
                                ]
                            }
                        ]
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
                videos: [],
                materials: [],
                events: []
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
                data: typeData[type] || []
            });
        } catch (error) {
            logger.error('Content by type error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async handleGetFavorites(req, res) {
        try {
            const favorites = {
                courses: [1, 2],
                podcasts: [1],
                streams: [1],
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
            
            const favorites = {
                courses: [1, 2],
                podcasts: [1],
                streams: [1],
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
        this.app.listen(PORT, '0.0.0.0', () => {
            logger.info(`🌐 Express сервер запущен на порту ${PORT}`);
            logger.info(`📱 WebApp доступен: ${config.WEBAPP_URL}`);
            logger.info(`🤖 Telegram Bot Webhook: ${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`);
            logger.info('✅ Академия АНБ готова к работе!');
        });
    }
}

// ==================== ЗАПУСК СИСТЕМЫ ====================
const telegramBot = new TelegramBotSystem();
const expressServer = new ExpressServerSystem();

expressServer.start();
