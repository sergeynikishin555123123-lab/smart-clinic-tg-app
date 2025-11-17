// server.js - СТАБИЛЬНАЯ ВЕРСИЯ
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Telegraf } from 'telegraf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Базовая конфигурация
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    WEBAPP_URL: process.env.WEBAPP_URL || `https://sergeynikishin555123123-lab-smart-clinic-tg-app-f84f.twc1.net`,
    NODE_ENV: process.env.NODE_ENV || 'production'
};

console.log('🚀 Запуск Академии АНБ...');

// ==================== TELEGRAM BOT ====================
let bot = null;

async function initializeBot() {
    try {
        if (!config.BOT_TOKEN) {
            console.warn('⚠️ Бот-токен не настроен');
            return;
        }
        
        bot = new Telegraf(config.BOT_TOKEN);
        
        // Обработчики команд
        bot.start(async (ctx) => {
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
        });

        bot.command('menu', async (ctx) => {
            try {
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
            } catch (error) {
                console.error('Menu error:', error);
            }
        });

        bot.command('courses', async (ctx) => {
            try {
                await ctx.reply('📚 Для просмотра курсов откройте веб-приложение:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                });
            } catch (error) {
                console.error('Courses error:', error);
            }
        });

        bot.command('help', async (ctx) => {
            try {
                const helpText = `🆘 Помощь по Академии АНБ:\n\n📚 /courses - Посмотреть курсы\n👤 /profile - Посмотреть профиль\n🆘 /support - Связь с поддержкой\n📱 /menu - Главное меню`;
                await ctx.reply(helpText);
            } catch (error) {
                console.error('Help error:', error);
            }
        });

        // Обработчик текстовых сообщений
        bot.on('text', async (ctx) => {
            try {
                const message = ctx.message.text;
                
                if (message.includes('привет') || message.includes('start')) {
                    await ctx.reply('👋 Привет! Используйте /menu для навигации');
                } else if (message.includes('курс')) {
                    await ctx.reply('📚 Открываю курсы...', {
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                            ]]
                        }
                    });
                } else {
                    await ctx.reply('Используйте команды:\n/menu - Главное меню\n/help - Помощь');
                }
            } catch (error) {
                console.error('Text handler error:', error);
            }
        });

        // Обработчик ошибок бота
        bot.catch((err, ctx) => {
            console.error(`❌ Ошибка бота для ${ctx.updateType}:`, err);
        });

        // Запуск бота
        if (config.NODE_ENV === 'production') {
            // В production используем webhook
            await bot.telegram.setWebhook(`${config.WEBAPP_URL}/bot${config.BOT_TOKEN}`);
            await bot.launch({
                webhook: {
                    domain: config.WEBAPP_URL,
                    port: PORT
                }
            });
            console.log(`✅ Telegram Bot запущен в production режиме`);
        } else {
            // В development используем polling
            await bot.launch();
            console.log('✅ Telegram Bot запущен в development режиме');
        }

        console.log('🤖 Бот инициализирован и готов к работе');

    } catch (error) {
        console.error('❌ Критическая ошибка инициализации бота:', error);
    }
}

// ==================== EXPRESS SERVER ====================
// Middleware
app.use(cors({
    origin: '*', // Временно разрешаем все домены
    credentials: true
}));

app.use(helmet({
    contentSecurityPolicy: false, // Временно отключаем CSP
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/webapp', express.static(join(__dirname, 'webapp')));
app.use('/assets', express.static(join(__dirname, 'webapp/assets')));

// Маршруты API
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        bot_status: bot ? 'active' : 'inactive'
    });
});

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Сервер работает!',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/user', (req, res) => {
    try {
        const { id, firstName, username } = req.body;
        
        const user = {
            id: id || 898508164,
            firstName: firstName || 'Демо Пользователь',
            username: username || 'demo_user',
            specialization: 'Невролог',
            subscription: { status: 'active', type: 'premium' },
            isAdmin: true,
            joinedAt: new Date().toISOString()
        };

        res.json({ success: true, user });
    } catch (error) {
        console.error('User API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/content', (req, res) => {
    try {
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
        
        res.json({ success: true, data: demoContent });
    } catch (error) {
        console.error('Content API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Webhook для Telegram
app.post(`/bot${config.BOT_TOKEN}`, (req, res) => {
    console.log('📨 Получен webhook от Telegram');
    if (bot) {
        bot.handleUpdate(req.body, res);
    } else {
        res.status(200).send();
    }
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Обработчик ошибок Express
app.use((error, req, res, next) => {
    console.error('🚨 Express error:', error);
    res.status(500).json({ error: 'Something went wrong!' });
});

// ==================== ЗАПУСК СИСТЕМЫ ====================
async function startServer() {
    try {
        // Запускаем сервер
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 Express сервер запущен на порту ${PORT}`);
            console.log(`📱 WebApp: ${config.WEBAPP_URL}`);
            console.log('✅ Сервер готов к работе!');
        });

        // Инициализируем бота после сервера
        setTimeout(() => {
            initializeBot();
        }, 1000);

    } catch (error) {
        console.error('❌ Критическая ошибка запуска сервера:', error);
        process.exit(1);
    }
}

// Обработчики graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Получен SIGTERM, останавливаем сервер...');
    if (bot) {
        bot.stop();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Получен SIGINT, останавливаем сервер...');
    if (bot) {
        bot.stop();
    }
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
startServer();
