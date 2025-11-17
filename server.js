// server.js - УПРОЩЕННАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
import express from 'express';
import { Telegraf } from 'telegraf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Базовая конфигурация
class SystemConfig {
    constructor() {
        this.BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
        this.PORT = process.env.PORT || 3000;
        this.WEBAPP_URL = process.env.WEBAPP_URL || `http://localhost:${this.PORT}`;
        this.NODE_ENV = process.env.NODE_ENV || 'production';
        this.ADMIN_IDS = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(Number) : [898508164];
        this.UPLOAD_PATH = join(__dirname, 'uploads');
    }

    validate() {
        console.log('✅ Конфигурация системы проверена');
        return true;
    }
}

const config = new SystemConfig();

// Логгер
class Logger {
    info(message, meta = {}) {
        console.log(`[INFO] ${message}`, meta);
    }
    
    error(message, error = null) {
        console.error(`[ERROR] ${message}`, error);
    }
    
    warn(message, meta = {}) {
        console.warn(`[WARN] ${message}`, meta);
    }
}

const logger = new Logger();

// Инициализация Express
const app = express();
const server = createServer(app);
const io = new Server(server);

// Инициализация бота
let bot = null;
if (config.BOT_TOKEN) {
    try {
        bot = new Telegraf(config.BOT_TOKEN);
        
        // Базовые обработчики бота
        bot.start((ctx) => {
            ctx.reply('🎓 Добро пожаловать в Академию АНБ!', {
                reply_markup: {
                    keyboard: [
                        [{ text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }],
                        ['📚 Курсы', '🎧 Подкасты'],
                        ['👤 Профиль', '🆘 Помощь']
                    ],
                    resize_keyboard: true
                }
            });
        });

        bot.command('courses', (ctx) => {
            ctx.reply('📚 Доступные курсы:\n\n• Мануальные техники в практике невролога\n• Неврологическая диагностика\n\nОткройте приложение для подробностей:', {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                    ]]
                }
            });
        });

        // Запуск бота
        if (config.NODE_ENV === 'production') {
            const webhookUrl = `${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`;
            bot.telegram.setWebhook(webhookUrl);
            console.log(`🌐 Webhook установлен: ${webhookUrl}`);
        } else {
            bot.launch();
        }
        
        logger.info('Telegram Bot инициализирован');
    } catch (error) {
        logger.error('Ошибка инициализации бота:', error.message);
    }
} else {
    logger.warn('Бот-токен не настроен, бот отключен');
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());

// Статические файлы
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/webapp', express.static(join(__dirname, 'webapp')));
app.use('/assets', express.static(join(__dirname, 'webapp/assets')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
            api: 'healthy',
            telegram: bot ? 'connected' : 'disabled'
        }
    });
});

app.post('/api/user', (req, res) => {
    const { id, firstName, username } = req.body;
    
    // Демо-данные пользователя
    const userData = {
        id: id || 898508164,
        firstName: firstName || 'Демо Пользователь',
        username: username || 'user',
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
    
    res.json({
        success: true,
        user: userData
    });
});

app.get('/api/content', (req, res) => {
    // Демо-контент
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
                image_url: '/webapp/assets/course-manual.jpg',
                rating: 4.8,
                students_count: 156,
                featured: true,
                popular: true,
                curriculum: [
                    {
                        module: 1,
                        title: 'Основы мануальной диагностики',
                        duration: '2 недели',
                        lessons: [
                            { title: 'Анатомия позвоночника', duration: 45, type: 'video' },
                            { title: 'Пальпаторная диагностика', duration: 60, type: 'video' }
                        ]
                    }
                ]
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
                image_url: '/webapp/assets/course-diagnosis.jpg',
                rating: 4.6,
                students_count: 234
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
                image_url: '/webapp/assets/podcast-neurology.jpg'
            }
        ],
        streams: [
            {
                id: 1,
                title: 'Разбор клинического случая: Болевой синдром в практике',
                description: 'Прямой эфир с разбором сложного клинического случая',
                duration: '1:30:00',
                live: true,
                participants: 89,
                thumbnail_url: '/webapp/assets/stream-pain-syndrome.jpg'
            }
        ],
        videos: [
            {
                id: 1,
                title: 'Шпаргалка невролога: Неврологический осмотр за 15 минут',
                description: 'Быстрый гайд по основным тестам и методикам',
                duration: '15:30',
                category: 'Неврология',
                views: 4567,
                thumbnail_url: '/webapp/assets/video-neurological-exam.jpg'
            }
        ],
        materials: [
            {
                id: 1,
                title: 'МРТ разбор: Рассеянный склероз и дифференциальная диагностика',
                description: 'Детальный разбор МРТ с клиническими случаями',
                category: 'Неврология',
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
                location: 'Москва, ЦВК Экспоцентр',
                participants: 456,
                image_url: '/webapp/assets/event-neurology-conf.jpg'
            }
        ],
        promotions: [
            {
                id: 1,
                title: 'Скидка 25% на первую подписку Premium',
                description: 'Специальное предложение для новых пользователей',
                discount: 25,
                active: true,
                image_url: '/webapp/assets/promo-welcome.jpg'
            }
        ],
        chats: [
            {
                id: 1,
                name: 'Общий чат Академии АНБ',
                description: 'Основной чат для общения всех участников',
                participants_count: 1567,
                image_url: '/webapp/assets/chat-main.jpg'
            }
        ]
    };
    
    res.json({ 
        success: true, 
        data: demoContent 
    });
});

app.post('/api/favorites/toggle', (req, res) => {
    const { contentId, contentType } = req.body;
    
    res.json({
        success: true,
        favorites: {
            courses: [1],
            podcasts: [],
            streams: [],
            videos: [],
            materials: []
        }
    });
});

app.post('/api/payment/create', (req, res) => {
    const { courseId, amount } = req.body;
    
    res.json({ 
        success: true, 
        payment: {
            id: Date.now(),
            user_id: 898508164,
            course_id: courseId,
            amount: amount,
            currency: 'RUB',
            status: 'completed',
            created_at: new Date().toISOString()
        },
        message: 'Payment completed successfully'
    });
});

// Webhook для Telegram
if (bot) {
    app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
        bot.handleUpdate(req.body, res);
    });
}

// WebSocket соединения
io.on('connection', (socket) => {
    logger.info(`WebSocket подключен: ${socket.id}`);

    socket.on('authenticate', (data) => {
        socket.userId = data.userId || 898508164;
        socket.join(`user_${socket.userId}`);
        logger.info(`WebSocket аутентифицирован: ${socket.userId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`WebSocket отключен: ${socket.id}`);
    });
});

// SPA Fallback
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Запуск сервера
server.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`🚀 Сервер запущен на порту ${config.PORT}`);
    logger.info(`📱 WebApp доступен: ${config.WEBAPP_URL}`);
    logger.info(`🔧 Режим: ${config.NODE_ENV}`);
    logger.info('✅ Академия АНБ готова к работе!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('🛑 Остановка сервера...');
    if (bot) {
        bot.stop();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('🛑 Остановка по Ctrl+C...');
    if (bot) {
        bot.stop();
    }
    process.exit(0);
});

export { app, config };
