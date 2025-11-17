// server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ ФРОНТЕНДА
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
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));

        this.app.use(cors({
            origin: '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        }));

        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(morgan('combined'));

        // Статические файлы
        this.app.use('/webapp', express.static(join(__dirname, 'webapp')));
        this.app.use('/assets', express.static(join(__dirname, 'webapp/assets')));
        this.app.use('/uploads', express.static(join(__dirname, 'uploads')));
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            });
        });

        // User API
        this.app.post('/api/user', this.handleUserRequest.bind(this));
        this.app.get('/api/user/profile', this.handleUserProfile.bind(this));

        // Content API - ОЧЕНЬ ВАЖНО: правильная структура ответа
        this.app.get('/api/content', this.handleGetContent.bind(this));
        this.app.get('/api/content/:type', this.handleGetContentByType.bind(this));
        this.app.get('/api/content/:type/:id', this.handleGetContentDetail.bind(this));

        // Favorites API
        this.app.get('/api/favorites', this.handleGetFavorites.bind(this));
        this.app.post('/api/favorites/toggle', this.handleToggleFavorite.bind(this));

        // Progress API
        this.app.get('/api/progress', this.handleGetProgress.bind(this));
        this.app.post('/api/progress/update', this.handleUpdateProgress.bind(this));

        // Telegram webhook
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
            
            // Для демо - возвращаем первый элемент
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
            
            // Демо-логика переключения избранного
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

    // ==================== DEMO DATA GENERATORS ====================

    getDemoCourses() {
        return [
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
                image_url: '/assets/course-manual.jpg',
                featured: true,
                popular: true,
                students_count: 156,
                rating: 4.8,
                reviews_count: 89,
                active: true,
                curriculum: [
                    {
                        module: 1,
                        title: 'Основы мануальной диагностики',
                        duration: '2 недели',
                        lessons: [
                            {
                                id: 1,
                                title: 'Анатомия позвоночника',
                                duration: 45,
                                type: 'video',
                                resources: 3,
                                completed: true
                            }
                        ]
                    }
                ]
            },
            {
                id: 2,
                title: 'Неврологическая диагностика',
                description: '5 модулей по современной диагностике',
                price: 18000,
                duration: '8 недель',
                modules: 5,
                category: 'Неврология',
                level: 'intermediate',
                image_url: '/assets/course-diagnosis.jpg',
                featured: true,
                students_count: 234,
                rating: 4.6,
                active: true
            }
        ];
    }

    getDemoPodcasts() {
        return [
            {
                id: 1,
                title: 'АНБ FM: Современная неврология',
                description: 'Обсуждение новых тенденций в неврологии',
                duration: '45:20',
                category: 'Неврология',
                listens: 2345,
                image_url: '/assets/podcast-neurology.jpg',
                active: true
            }
        ];
    }

    getDemoStreams() {
        return [
            {
                id: 1,
                title: 'Разбор клинического случая',
                description: 'Прямой эфир с разбором случая',
                duration: '1:30:00',
                live: true,
                participants: 89,
                type: 'clinical_analysis',
                thumbnail_url: '/assets/stream-pain-syndrome.jpg',
                active: true
            }
        ];
    }

    getDemoVideos() {
        return [
            {
                id: 1,
                title: 'Неврологический осмотр за 15 минут',
                description: 'Быстрый гайд по осмотру',
                duration: '15:30',
                category: 'Неврология',
                views: 4567,
                thumbnail_url: '/assets/video-neurological-exam.jpg',
                active: true
            }
        ];
    }

    getDemoMaterials() {
        return [
            {
                id: 1,
                title: 'МРТ разбор: Рассеянный склероз',
                description: 'Детальный разбор МРТ',
                material_type: 'mri_analysis',
                category: 'Неврология',
                downloads: 1234,
                image_url: '/assets/material-ms-mri.jpg',
                active: true
            }
        ];
    }

    getDemoEvents() {
        return [
            {
                id: 1,
                title: 'Конференция: Современная неврология 2024',
                description: 'Ежегодная конференция',
                event_date: new Date('2024-02-15T10:00:00').toISOString(),
                location: 'Москва',
                event_type: 'offline_conference',
                participants: 456,
                image_url: '/assets/event-neurology-conf.jpg',
                active: true
            }
        ];
    }

    getDemoPromotions() {
        return [
            {
                id: 1,
                title: 'Скидка 25% на подписку',
                description: 'Специальное предложение',
                discount: 25,
                active: true,
                image_url: '/assets/promo-welcome.jpg'
            }
        ];
    }

    getDemoChats() {
        return [
            {
                id: 1,
                name: 'Общий чат Академии',
                description: 'Основной чат для общения',
                type: 'group',
                participants_count: 1567,
                image_url: '/assets/chat-main.jpg',
                active: true
            }
        ];
    }

    setupErrorHandling() {
        this.app.use((req, res) => {
            res.status(404).json({ 
                success: false,
                error: 'Route not found',
                path: req.path 
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
            console.log('✅ Система готова!');
        });
    }
}

// ==================== ЗАПУСК СИСТЕМЫ ====================
const telegramBot = new TelegramBotSystem();
const expressServer = new ExpressServerSystem();

// Запускаем сервер
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
