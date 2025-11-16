// server.js - РАБОЧАЯ ВЕРСИЯ С БОТОМ
import express from 'express';
import { Telegraf } from 'telegraf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'webapp')));

// Демо данные
const demoData = {
    courses: [
        {
            id: 1,
            title: 'Мануальные техники в практике',
            description: '6 модулей по современным мануальным методикам',
            price: 15000,
            duration: '12 часов',
            modules: 6,
            category: 'Неврология'
        },
        {
            id: 2,
            title: 'Неврология для практикующих врачей',
            description: 'Основы неврологической диагностики',
            price: 12000,
            duration: '10 часов',
            modules: 5,
            category: 'Неврология'
        }
    ],
    user: {
        id: 898508164,
        firstName: 'Демо Пользователь',
        isAdmin: true
    }
};

// ==================== TELEGRAM BOT HANDLERS ====================

// Команда /start
bot.start(async (ctx) => {
    console.log('🚀 Пользователь запустил бота:', ctx.from.id);
    
    await ctx.reply(
        `👋 Добро пожаловать в *Академию АНБ*, ${ctx.from.first_name}!\n\n` +
        `🎯 *Ваш персональный помощник в обучении*\n\n` +
        `Используйте кнопки ниже для навигации:`,
        { 
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    [{ text: '📱 Открыть приложение' }, { text: '📚 Мои курсы' }],
                    [{ text: '👤 Мой профиль' }, { text: '💬 Поддержка' }],
                    [{ text: '🔧 Админ-панель' }]
                ],
                resize_keyboard: true
            }
        }
    );
});

// Команда /menu
bot.command('menu', async (ctx) => {
    await showMainMenu(ctx);
});

// Команда /admin
bot.command('admin', async (ctx) => {
    if (ctx.from.id === 898508164) {
        await ctx.reply('🔧 *Панель администратора*\n\nДоступные действия:', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📱 Открыть WebApp', web_app: { url: `https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net` } }],
                    [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
                    [{ text: '👥 Пользователи', callback_data: 'admin_users' }]
                ]
            }
        });
    } else {
        await ctx.reply('❌ У вас нет прав доступа к админ-панели');
    }
});

// Обработка текстовых сообщений
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    console.log('📨 Получено сообщение:', text);

    switch(text) {
        case '📱 Открыть приложение':
            await ctx.reply('🎯 *Откройте наше приложение для полного доступа:*', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { 
                            text: '📱 Открыть Академию АНБ', 
                            web_app: { url: `https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net` } 
                        }
                    ]]
                }
            });
            break;

        case '📚 Мои курсы':
            await ctx.reply('🎓 *Ваши активные курсы:*\n\n1. Мануальные техники в практике\n2. Неврология для практикующих врачей\n\nПродолжайте обучение в приложении!', {
                parse_mode: 'Markdown'
            });
            break;

        case '👤 Мой профиль':
            await ctx.reply(
                `👤 *Ваш профиль*\n\n` +
                `🏷️ Имя: ${ctx.from.first_name}\n` +
                `🎯 Статус: Активный студент\n` +
                `📚 Курсов: 2\n` +
                `⭐ Прогресс: 65%\n\n` +
                `Продолжайте в том же духе! 💪`,
                { parse_mode: 'Markdown' }
            );
            break;

        case '💬 Поддержка':
            await ctx.reply(
                `💬 *Служба поддержки Академии АНБ*\n\n` +
                `📞 Координатор: @academy_anb\n` +
                `⏰ Время работы: ПН-ПТ 11:00-19:00\n` +
                `📧 Email: academy@anb.ru\n\n` +
                `Мы всегда готовы помочь!`,
                { parse_mode: 'Markdown' }
            );
            break;

        case '🔧 Админ-панель':
            if (ctx.from.id === 898508164) {
                await ctx.reply('🔧 *Панель администратора*\n\nВыберите действие:', {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📱 WebApp', web_app: { url: `https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net` } }],
                            [{ text: '📊 Статистика', callback_data: 'stats' }],
                            [{ text: '➕ Добавить курс', callback_data: 'add_course' }]
                        ]
                    }
                });
            } else {
                await ctx.reply('❌ Эта функция доступна только администраторам');
            }
            break;

        default:
            await ctx.reply('🤔 Используйте кнопки меню для навигации');
            await showMainMenu(ctx);
    }
});

// Обработка callback запросов
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    
    switch(data) {
        case 'stats':
            await ctx.answerCbQuery();
            await ctx.reply('📊 *Статистика системы:*\n\n👥 Пользователей: 156\n📚 Курсов: 8\n💰 Доход: 345,600₽\n⭐ Активных: 89', {
                parse_mode: 'Markdown'
            });
            break;
            
        case 'add_course':
            await ctx.answerCbQuery();
            await ctx.reply('📝 Для добавления нового курса откройте админ-панель в WebApp');
            break;
            
        default:
            await ctx.answerCbQuery();
    }
});

// Функция показа главного меню
async function showMainMenu(ctx) {
    await ctx.reply('🎯 *Главное меню Академии АНБ*\n\nВыберите раздел:', {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                [{ text: '📱 Открыть приложение' }, { text: '📚 Мои курсы' }],
                [{ text: '👤 Мой профиль' }, { text: '💬 Поддержка' }]
            ],
            resize_keyboard: true
        }
    });
}

// ==================== EXPRESS ROUTES ====================

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Академия АНБ работает',
        timestamp: new Date().toISOString()
    });
});

// API для пользователя
app.post('/api/user', (req, res) => {
    res.json({ 
        success: true, 
        user: demoData.user 
    });
});

// API для контента
app.get('/api/content', (req, res) => {
    res.json({ 
        success: true, 
        data: demoData 
    });
});

// API для статистики
app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            totalUsers: 156,
            totalCourses: 8,
            activeUsers: 89,
            totalRevenue: 345600
        }
    });
});

// Все остальные маршруты
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================

async function startServer() {
    try {
        // Запускаем Express сервер
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Сервер запущен на порту ${PORT}`);
            console.log(`🌐 WebApp: https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net`);
        });

        // Запускаем бота
        await bot.launch();
        console.log('✅ Telegram Bot запущен');
        console.log('🤖 Бот готов принимать команды: /start, /menu, /admin');

        // Включим обработку остановки
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

startServer();
