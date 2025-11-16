// server.js - ВЕРСИЯ С FIX ДЛЯ TELEGRAM WEBAPP
import { Telegraf, session } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL || 'https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@45.89.190.49:5432/default_db?sslmode=require',
    ADMIN_IDS: [898508164, 123456789],
    UPLOAD_PATH: join(__dirname, 'uploads'),
    NODE_ENV: process.env.NODE_ENV || 'production'
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
const app = express();
const bot = new Telegraf(config.BOT_TOKEN);

// ==================== БАЗА ДАННЫХ ====================
class Database {
    constructor() {
        this.pool = null;
        this.connected = false;
    }

    async connect() {
        try {
            const { Pool } = await import('pg');
            this.pool = new Pool({
                connectionString: config.DATABASE_URL,
                ssl: { rejectUnauthorized: false },
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000,
            });

            await this.pool.query('SELECT 1');
            this.connected = true;
            console.log('✅ База данных подключена');
            
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error);
            this.connected = false;
        }
    }

    async query(text, params) {
        if (!this.connected) {
            console.log('📊 Используем демо-данные (БД не подключена)');
            return { rows: [], rowCount: 0 };
        }
        return await this.pool.query(text, params);
    }
}

const db = new Database();

// ==================== MIDDLEWARE ====================
// Специальные CORS настройки для Telegram WebApp
app.use(cors({
    origin: [
        'https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net',
        'https://web.telegram.org',
        'https://oauth.telegram.org'
    ],
    credentials: true
}));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://telegram.org"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(config.UPLOAD_PATH));

// Статические файлы с правильными заголовками
app.use('/webapp', express.static(join(__dirname, 'webapp'), {
    setHeaders: (res, path) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    }
}));

// ==================== ОСНОВНЫЕ МАРШРУТЫ ====================

// Главная страница WebApp
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// WebApp endpoint для Telegram
app.get('/webapp', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        db: db.connected ? 'connected' : 'disconnected',
        version: '1.0.0'
    });
});

// Получение пользователя
app.post('/api/user', async (req, res) => {
    try {
        // Добавляем заголовки для WebApp
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        const { id, firstName, lastName, username } = req.body;
        
        // Демо-пользователь
        const user = {
            id: id || 898508164,
            firstName: firstName || 'Демо Пользователь',
            lastName: lastName || '',
            specialization: 'Невролог',
            city: 'Москва',
            email: 'demo@anb.ru',
            subscription: { 
                status: 'active', 
                type: 'admin',
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
            },
            progress: { 
                level: 'Понимаю', 
                steps: {
                    materialsWatched: 12,
                    eventsParticipated: 5,
                    materialsSaved: 8,
                    coursesBought: 3
                }
            },
            favorites: { 
                courses: [1], 
                podcasts: [], 
                streams: [], 
                videos: [], 
                materials: [], 
                watchLater: [] 
            },
            isAdmin: config.ADMIN_IDS.includes(parseInt(id)) || id == 898508164,
            joinedAt: new Date('2024-01-01'),
            surveyCompleted: true
        };

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение контента
app.get('/api/content', async (req, res) => {
    try {
        // Добавляем заголовки для WebApp
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Демо-контент
        const demoContent = {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике',
                    description: '6 модулей по современным мануальным методикам',
                    full_description: 'Комплексный курс по мануальным техникам для практикующих врачей',
                    price: 15000,
                    duration: '12 часов',
                    modules: 6,
                    category: 'Неврология',
                    level: 'advanced',
                    image_url: null,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Неврология для практикующих врачей',
                    description: 'Основы неврологической диагностики',
                    full_description: 'Фундаментальный курс по неврологии',
                    price: 12000,
                    duration: '10 часов',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate',
                    image_url: null,
                    created_at: new Date().toISOString()
                }
            ],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: []
        };

        res.json({
            success: true,
            data: demoContent
        });
    } catch (error) {
        console.error('Content API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Статистика для админки
app.get('/api/stats', async (req, res) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        res.json({
            success: true,
            stats: {
                totalUsers: 150,
                totalCourses: 3,
                activeUsers: 45,
                totalRevenue: 130500
            }
        });
    } catch (error) {
        console.error('Stats API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Пользователи для админки
app.get('/api/users', async (req, res) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const users = [
            {
                id: 898508164,
                firstName: 'Администратор',
                lastName: '',
                email: 'admin@anb.ru',
                specialization: 'Невролог',
                city: 'Москва',
                subscription: { status: 'active' },
                progress: { steps: { materialsWatched: 12, eventsParticipated: 5, materialsSaved: 8, coursesBought: 3 } },
                isAdmin: true,
                joinedAt: new Date('2024-01-01')
            },
            {
                id: 123456789,
                firstName: 'Демо Пользователь',
                lastName: '',
                email: 'user@example.com',
                specialization: 'Ортопед',
                city: 'Санкт-Петербург',
                subscription: { status: 'trial' },
                progress: { steps: { materialsWatched: 5, eventsParticipated: 2, materialsSaved: 3, coursesBought: 1 } },
                isAdmin: false,
                joinedAt: new Date('2024-01-15')
            }
        ];

        res.json({ success: true, users });
    } catch (error) {
        console.error('Users API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Проверка прав администратора
app.get('/api/check-admin/:userId', async (req, res) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const userId = parseInt(req.params.userId);
        res.json({ 
            success: true, 
            isAdmin: config.ADMIN_IDS.includes(userId) || userId === 898508164
        });
    } catch (error) {
        console.error('Check Admin Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// SPA поддержка - все остальные маршруты ведут на index.html
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== TELEGRAM BOT ====================
class TelegramBot {
    constructor() {
        this.bot = bot;
        this.init();
    }

    init() {
        this.bot.use(session());

        this.bot.start(this.handleStart.bind(this));
        this.bot.command('menu', this.handleMenu.bind(this));
        this.bot.command('admin', this.handleAdmin.bind(this));
        this.bot.on('text', this.handleText.bind(this));
    }

    async handleStart(ctx) {
        await ctx.reply('👋 Добро пожаловать в Академию АНБ!');
        await this.showMainMenu(ctx);
    }

    async handleMenu(ctx) {
        await this.showMainMenu(ctx);
    }

    async handleAdmin(ctx) {
        const userId = ctx.from.id;
        if (!config.ADMIN_IDS.includes(userId)) {
            await ctx.reply('❌ У вас нет прав доступа');
            return;
        }
        
        await ctx.reply('🔧 Панель администратора', {
            reply_markup: {
                inline_keyboard: [[
                    { 
                        text: '📱 Открыть WebApp', 
                        web_app: { url: `${config.WEBAPP_URL}/webapp` } 
                    }
                ]]
            }
        });
    }

    async handleText(ctx) {
        const text = ctx.message.text;
        
        if (text === '📱 Открыть приложение') {
            await ctx.reply('Откройте приложение:', {
                reply_markup: {
                    inline_keyboard: [[
                        { 
                            text: '📱 Открыть WebApp', 
                            web_app: { url: `${config.WEBAPP_URL}/webapp` } 
                        }
                    ]]
                }
            });
        } else {
            await this.showMainMenu(ctx);
        }
    }

    async showMainMenu(ctx) {
        const keyboard = [
            ['📱 Открыть приложение'],
            ['💬 Поддержка', '👤 Мой профиль']
        ];

        if (config.ADMIN_IDS.includes(ctx.from.id)) {
            keyboard.push(['🔧 Админ-панель']);
        }

        await ctx.reply('Выберите действие:', {
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true
            }
        });
    }

    async launch() {
        try {
            await this.bot.launch();
            console.log('✅ Telegram Bot запущен');
        } catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
        }
    }
}

const telegramBot = new TelegramBot();

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startServer() {
    try {
        console.log('🚀 Запуск сервера...');
        
        await db.connect();
        
        app.listen(config.PORT, '0.0.0.0', () => {
            console.log(`🌐 Сервер запущен на порту ${config.PORT}`);
            console.log(`📱 WebApp: ${config.WEBAPP_URL}/webapp`);
            console.log(`🔧 Admin: ${config.WEBAPP_URL}/admin`);
            console.log(`👑 Админы: ${config.ADMIN_IDS.join(', ')}`);
        });

        await telegramBot.launch();

        console.log('✅ Система полностью готова к работе!');

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Остановка системы...');
    telegramBot.bot.stop('SIGINT');
    if (db.pool) {
        db.pool.end();
    }
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🛑 Остановка системы...');
    telegramBot.bot.stop('SIGTERM');
    if (db.pool) {
        db.pool.end();
    }
    process.exit(0);
});

startServer();
