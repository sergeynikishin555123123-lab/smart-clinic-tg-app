// server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ RATE LIMITING
import { Telegraf } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL || `https://anb-academy.timeweb.ru`,
    ADMIN_IDS: [898508164],
    NODE_ENV: process.env.NODE_ENV || 'production'
};

console.log('🚀 Запуск Академии АНБ...');

// ==================== TELEGRAM BOT ====================
class TelegramBotSystem {
    constructor() {
        this.bot = null;
        this.setupBot();
    }

    setupBot() {
        try {
            if (!config.BOT_TOKEN) {
                console.warn('⚠️ Бот-токен не настроен');
                return;
            }
            
            this.bot = new Telegraf(config.BOT_TOKEN);
            this.setupHandlers();
            this.launchBot();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации бота:', error);
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
            await ctx.reply('👋 Добро пожаловать в Академию АНБ!', {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                    ]]
                }
            });
        } catch (error) {
            console.error('Start error:', error);
        }
    }

    async handleMenu(ctx) {
        await ctx.reply('🎯 Главное меню:', {
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

    async handleProfile(ctx) {
        await ctx.reply('👤 Ваш профиль в приложении:', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                ]]
            }
        });
    }

    async handleHelp(ctx) {
        await ctx.reply(`🆘 Помощь:\n\n📚 /courses - Курсы\n👤 /profile - Профиль\n📱 /menu - Меню`);
    }

    async handleText(ctx) {
        const message = ctx.message.text.toLowerCase();
        
        if (message.includes('привет') || message.includes('start')) {
            await this.handleStart(ctx);
        } else if (message.includes('курс')) {
            await this.handleCourses(ctx);
        } else {
            await ctx.reply('Используйте /menu для навигации');
        }
    }

    async launchBot() {
        try {
            if (config.NODE_ENV === 'production') {
                await this.bot.telegram.setWebhook(`${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`);
                await this.bot.launch({
                    webhook: {
                        domain: config.WEBAPP_URL,
                        port: config.PORT
                    }
                });
                console.log('✅ Бот запущен (webhook)');
            } else {
                await this.bot.launch();
                console.log('✅ Бот запущен (polling)');
            }
        } catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
        }
    }
}

// ==================== EXPRESS SERVER ====================
class ExpressServerSystem {
    constructor() {
        this.app = express();
        this.server = null;
        this.setupServer();
    }

    setupServer() {
        this.setupMiddleware();
        this.setupStaticFiles(); // Отдельно настраиваем статику
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Безопасность
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));

        // CORS
        this.app.use(cors({
            origin: '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        }));

        // Компрессия
        this.app.use(compression());
        
        // Парсинг JSON
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Логирование
        this.app.use(morgan('combined'));
    }

    setupStaticFiles() {
        // Статические файлы БЕЗ rate limiting
        const staticOptions = {
            maxAge: '1d',
            etag: true,
            lastModified: true
        };

        // Основные статические пути
        this.app.use('/webapp', express.static(join(__dirname, 'webapp'), staticOptions));
        this.app.use('/assets', express.static(join(__dirname, 'webapp/assets'), staticOptions));
        this.app.use('/uploads', express.static(join(__dirname, 'uploads'), staticOptions));

        // Fallback для изображений - создаем placeholder если файла нет
        this.app.use('/webapp/assets/:filename', (req, res, next) => {
            const filename = req.params.filename;
            const filePath = join(__dirname, 'webapp/assets', filename);
            
            // Проверяем существует ли файл
            const fs = require('fs');
            if (fs.existsSync(filePath)) {
                next(); // Файл существует, передаем дальше
            } else {
                // Создаем простой placeholder
                const svgPlaceholder = `
                    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100%" height="100%" fill="#f0f0f0"/>
                        <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#666">
                            ${filename}
                        </text>
                    </svg>
                `;
                res.setHeader('Content-Type', 'image/svg+xml');
                res.send(svgPlaceholder);
            }
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                services: {
                    bot: telegramBot.bot ? 'active' : 'inactive',
                    server: 'running'
                }
            });
        });

        // User API
        this.app.post('/api/user', this.handleUserRequest.bind(this));
        this.app.get('/api/user/profile', this.handleUserProfile.bind(this));

        // Content API
        this.app.get('/api/content', this.handleGetContent.bind(this));
        this.app.get('/api/content/:type', this.handleGetContentByType.bind(this));
        this.app.get('/api/content/:type/:id', this.handleGetContentDetail.bind(this));

        // Favorites API
        this.app.get('/api/favorites', this.handleGetFavorites.bind(this));
        this.app.post('/api/favorites/toggle', this.handleToggleFavorite.bind(this));

        // Progress API
        this.app.get('/api/progress', this.handleGetProgress.bind(this));
        this.app.post('/api/progress/update', this.handleUpdateProgress.bind(this));

        // Admin API
        this.app.get('/api/admin/stats', this.handleAdminStats.bind(this));

        // Telegram webhook - БЕЗ rate limiting
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

    // ==================== API HANDLERS ====================

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
                        personal_consultation: true,
                        certificates: true,
                        offline_events: true,
                        community_access: true
                    }
                },
                progress: {
                    level: 'Понимаю',
                    experience: 1250,
                    level_threshold: 1000,
                    rank: 'Продвинутый',
                    badges: ['first_course', 'quick_learner'],
                    steps: {
                        materialsWatched: 12,
                        eventsParticipated: 5,
                        materialsSaved: 8,
                        coursesBought: 3,
                        modulesCompleted: 2,
                        offlineEvents: 1
                    },
                    statistics: {
                        total_time_spent: 15600,
                        average_session_duration: 45,
                        completion_rate: 67,
                        engagement_score: 85,
                        last_active: new Date().toISOString(),
                        streak_days: 7
                    }
                },
                favorites: {
                    courses: [1],
                    podcasts: [],
                    streams: [],
                    videos: [],
                    materials: [],
                    events: [],
                    articles: [],
                    doctors: [],
                    playlists: []
                },
                isAdmin: true,
                isSuperAdmin: true,
                joinedAt: new Date().toISOString(),
                surveyCompleted: true
            };

            res.json({ success: true, user });

        } catch (error) {
            console.error('User API error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    async handleUserProfile(req, res) {
        try {
            const user = {
                id: 898508164,
                firstName: 'Демо Пользователь',
                username: 'demo_user',
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

            res.json({ success: true, user });

        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    async handleGetContent(req, res) {
        try {
            const content = {
                courses: this.getDemoCourses(),
                podcasts: this.getDemoPodcasts(),
                streams: this.getDemoStreams(),
                videos: this.getDemoVideos(),
                materials: this.getDemoMaterials(),
                events: this.getDemoEvents(),
                promotions: this.getDemoPromotions(),
                chats: this.getDemoChats()
            };

            res.json({ success: true, data: content });

        } catch (error) {
            console.error('Content error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    async handleGetContentByType(req, res) {
        try {
            const { type } = req.params;
            let content = [];

            switch (type) {
                case 'courses':
                    content = this.getDemoCourses();
                    break;
                case 'podcasts':
                    content = this.getDemoPodcasts();
                    break;
                case 'streams':
                    content = this.getDemoStreams();
                    break;
                case 'videos':
                    content = this.getDemoVideos();
                    break;
                case 'materials':
                    content = this.getDemoMaterials();
                    break;
                case 'events':
                    content = this.getDemoEvents();
                    break;
                default:
                    content = [];
            }

            res.json({ 
                success: true, 
                data: content,
                pagination: {
                    page: 1,
                    limit: 20,
                    total: content.length,
                    totalPages: 1
                }
            });

        } catch (error) {
            console.error('Content by type error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    async handleGetContentDetail(req, res) {
        try {
            const { type, id } = req.params;
            
            const contentMap = {
                courses: this.getDemoCourses(),
                podcasts: this.getDemoPodcasts(),
                streams: this.getDemoStreams(),
                videos: this.getDemoVideos(),
                materials: this.getDemoMaterials(),
                events: this.getDemoEvents()
            };

            const content = contentMap[type]?.find(item => item.id == id) || null;

            if (!content) {
                return res.status(404).json({ success: false, error: 'Content not found' });
            }

            res.json({ success: true, data: content });

        } catch (error) {
            console.error('Content detail error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    async handleGetFavorites(req, res) {
        try {
            const favorites = {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: [],
                articles: [],
                doctors: [],
                playlists: []
            };

            res.json({ success: true, favorites });

        } catch (error) {
            console.error('Favorites error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
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
                materials: [],
                events: [],
                articles: [],
                doctors: [],
                playlists: []
            };

            res.json({ success: true, favorites });

        } catch (error) {
            console.error('Toggle favorite error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    async handleGetProgress(req, res) {
        try {
            const progress = {
                level: 'Понимаю',
                experience: 1250,
                level_threshold: 1000,
                rank: 'Продвинутый',
                badges: ['first_course', 'quick_learner'],
                steps: {
                    materialsWatched: 12,
                    eventsParticipated: 5,
                    materialsSaved: 8,
                    coursesBought: 3,
                    modulesCompleted: 2,
                    offlineEvents: 1
                },
                statistics: {
                    total_time_spent: 15600,
                    average_session_duration: 45,
                    completion_rate: 67,
                    engagement_score: 85
                }
            };

            res.json({ success: true, progress });

        } catch (error) {
            console.error('Progress error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    async handleUpdateProgress(req, res) {
        try {
            res.json({ success: true });
        } catch (error) {
            console.error('Update progress error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    async handleAdminStats(req, res) {
        try {
            const stats = {
                users: { total: 1567 },
                courses: { total: 25 },
                revenue: { total: 390000 },
                activity: { today: 234 }
            };

            res.json({ success: true, stats });
        } catch (error) {
            console.error('Admin stats error:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // ==================== DEMO DATA ====================

    getDemoCourses() {
        return [
            {
                id: 1,
                title: 'Мануальные техники в практике невролога',
                description: '6 модулей по современным мануальным методикам',
                price: 25000,
                duration: '12 недель',
                image_url: '/assets/course-manual.jpg',
                featured: true,
                active: true
            },
            {
                id: 2,
                title: 'Неврологическая диагностика',
                description: '5 модулей по современной диагностике',
                price: 18000,
                duration: '8 недель',
                image_url: '/assets/course-diagnosis.jpg',
                featured: true,
                active: true
            }
        ];
    }

    getDemoPodcasts() {
        return [{
            id: 1,
            title: 'АНБ FM: Современная неврология',
            description: 'Обсуждение новых тенденций',
            image_url: '/assets/podcast-neurology.jpg',
            active: true
        }];
    }

    getDemoStreams() {
        return [{
            id: 1,
            title: 'Разбор клинического случая',
            description: 'Прямой эфир с разбором',
            thumbnail_url: '/assets/stream-pain-syndrome.jpg',
            active: true
        }];
    }

    getDemoVideos() {
        return [{
            id: 1,
            title: 'Неврологический осмотр',
            description: 'Быстрый гайд',
            thumbnail_url: '/assets/video-neurological-exam.jpg',
            active: true
        }];
    }

    getDemoMaterials() {
        return [{
            id: 1,
            title: 'МРТ разбор',
            description: 'Детальный разбор МРТ',
            image_url: '/assets/material-ms-mri.jpg',
            active: true
        }];
    }

    getDemoEvents() {
        return [{
            id: 1,
            title: 'Конференция по неврологии',
            description: 'Ежегодная конференция',
            image_url: '/assets/event-neurology-conf.jpg',
            active: true
        }];
    }

    getDemoPromotions() {
        return [{
            id: 1,
            title: 'Скидка 25%',
            description: 'Специальное предложение',
            image_url: '/assets/promo-welcome.jpg',
            active: true
        }];
    }

    getDemoChats() {
        return [{
            id: 1,
            name: 'Общий чат',
            description: 'Основной чат',
            image_url: '/assets/chat-main.jpg',
            active: true
        }];
    }

    setupErrorHandling() {
        this.app.use((req, res) => {
            res.status(404).json({ 
                success: false,
                error: 'Route not found'
            });
        });

        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);
            res.status(500).json({ 
                success: false,
                error: 'Internal server error' 
            });
        });
    }

    start() {
        this.server = this.app.listen(config.PORT, '0.0.0.0', () => {
            console.log(`🌐 Сервер запущен на порту ${config.PORT}`);
            console.log(`📱 WebApp: ${config.WEBAPP_URL}`);
            console.log('✅ Система готова к работе!');
        });
    }
}

// ==================== ЗАПУСК СИСТЕМЫ ====================
const telegramBot = new TelegramBotSystem();
const expressServer = new ExpressServerSystem();

expressServer.start();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Остановка сервера...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Остановка сервера...');
    process.exit(0);
});
