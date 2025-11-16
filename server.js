// server.js - ПОЛНАЯ ВЕРСИЯ С АВТОСТОПОМ ПРОЦЕССОВ
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || `https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net`;

const ADMIN_IDS = new Set([898508164]); // Главный администратор

console.log('🚀 Starting Smart Clinic Bot...');

// ==================== АВТОСТОП ПРЕДЫДУЩИХ ПРОЦЕССОВ ====================
async function killPreviousProcesses() {
    try {
        console.log('🔫 Останавливаем предыдущие процессы...');
        
        // Останавливаем процессы на том же порту
        try {
            const { stdout } = await execAsync(`fuser -k ${PORT}/tcp`);
            console.log(`✅ Освобожден порт ${PORT}`);
        } catch (e) {
            console.log(`ℹ️  Порт ${PORT} уже свободен`);
        }

        // Останавливаем Node.js процессы с этим файлом
        try {
            await execAsync('pkill -f "node.*server.js" || true');
            console.log('✅ Остановлены предыдущие Node.js процессы');
        } catch (e) {
            console.log('ℹ️  Нет предыдущих Node.js процессов для остановки');
        }

        // Даем время на завершение процессов
        await new Promise(resolve => setTimeout(resolve, 2000));
        
    } catch (error) {
        console.log('⚠️  Не удалось остановить некоторые процессы:', error.message);
    }
}

// ==================== БАЗА ДАННЫХ ====================
let pool;
let dbConnected = false;

async function initDatabase() {
    try {
        const { Pool } = await import('pg');
        
        // Улучшенная конфигурация подключения
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            },
            // Оптимизированные настройки для ограниченных ресурсов
            max: 5, // Меньше соединений для shared hosting
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 15000, // Увеличили таймаут
            maxUses: 5000,
        });

        console.log('🔌 Тестируем подключение к PostgreSQL...');
        
        // Тестируем подключение с повторными попытками
        let retries = 3;
        while (retries > 0) {
            try {
                const client = await pool.connect();
                console.log('✅ Успешное подключение к PostgreSQL');
                client.release();
                dbConnected = true;
                break;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    throw error;
                }
                console.log(`🔄 Повторная попытка подключения... (${retries} осталось)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        await createTables();
        await addDemoData();
        
    } catch (error) {
        console.error('❌ Ошибка подключения к PostgreSQL:', error.message);
        console.log('⚠️  Работаем без базы данных');
        dbConnected = false;
    }
}

async function createTables() {
    try {
        console.log('📦 Создание таблиц...');
        
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                first_name TEXT NOT NULL,
                username TEXT,
                specialization TEXT,
                city TEXT,
                email TEXT,
                subscription_status TEXT DEFAULT 'inactive',
                subscription_type TEXT,
                subscription_end_date TIMESTAMP,
                progress_level TEXT DEFAULT 'Понимаю',
                progress_data JSONB DEFAULT '{"steps": {"materialsWatched": 0, "eventsParticipated": 0, "materialsSaved": 0, "coursesBought": 0}}',
                favorites_data JSONB DEFAULT '{"courses": [], "podcasts": [], "streams": [], "videos": [], "materials": [], "watchLater": []}',
                is_admin BOOLEAN DEFAULT FALSE,
                joined_at TIMESTAMP DEFAULT NOW(),
                last_activity TIMESTAMP DEFAULT NOW(),
                survey_completed BOOLEAN DEFAULT FALSE
            )`,
            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                full_description TEXT,
                price INTEGER DEFAULT 0,
                duration TEXT,
                modules INTEGER DEFAULT 1,
                image_url TEXT,
                file_url TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS podcasts (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                duration TEXT,
                audio_url TEXT,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                duration TEXT,
                video_url TEXT,
                image_url TEXT,
                scheduled TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS videos (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                duration TEXT,
                video_url TEXT,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                type TEXT,
                file_url TEXT,
                image_url TEXT,
                duration TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                type TEXT,
                date TEXT,
                time TEXT,
                location TEXT,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const tableQuery of tables) {
            try {
                await pool.query(tableQuery);
            } catch (error) {
                console.error(`❌ Ошибка создания таблицы: ${error.message}`);
            }
        }
        console.log('✅ Таблицы созданы/проверены');

    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error.message);
    }
}

async function addDemoData() {
    try {
        // Проверяем, есть ли уже данные
        const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(coursesCount.rows[0].count) > 0) {
            console.log('✅ Демо-данные уже существуют');
            return;
        }

        console.log('📝 Добавление демо-данных...');

        // Демо-курсы
        await pool.query(`
            INSERT INTO courses (title, description, full_description, price, duration, modules) VALUES
            ('Мануальные техники в практике', '6 модулей по современным мануальным методикам', 'Комплексный курс, охватывающий основные мануальные техники, применяемые в неврологической практике.', 15000, '12 часов', 6),
            ('Неврология для практикующих врачей', 'Основы неврологической диагностики и лечения', 'Фундаментальный курс по неврологии для врачей различных специальностей.', 12000, '10 часов', 5)
        `);

        // Демо-подкасты
        await pool.query(`
            INSERT INTO podcasts (title, description, duration) VALUES
            ('АНБ FM: Основы неврологии', 'Подкаст о современных подходах в неврологии', '45:20'),
            ('АНБ FM: Реабилитация', 'Современные методы восстановительного лечения', '38:15')
        `);

        // Демо-эфиры
        await pool.query(`
            INSERT INTO streams (title, description, duration, scheduled) VALUES
            ('Разбор клинического случая: боль в пояснице', 'Подробный разбор с Ильей Чистяковым', '1:15:30', NOW() + INTERVAL '2 days'),
            ('Современные методы диагностики', 'Новые подходы в диагностике неврологических заболеваний', '1:30:00', NOW() + INTERVAL '5 days')
        `);

        // Демо-видео
        await pool.query(`
            INSERT INTO videos (title, description, duration) VALUES
            ('Техника миофасциального релиза', 'Короткая видео-шпаргалка по технике МФР', '08:15'),
            ('Основы кинезиотейпирования', 'Базовые техники наложения тейпов', '12:30')
        `);

        // Демо-материалы
        await pool.query(`
            INSERT INTO materials (title, description, type, duration) VALUES
            ('МРТ разбор: грыжа позвоночника L4-L5', 'Детальный анализ МРТ снимков пациента с грыжей', 'mri', '25 мин'),
            ('Клинический случай: мигрень', 'Разбор диагностики и лечения пациента с мигренью', 'case', '20 мин'),
            ('Чек-лист: первичный осмотр неврологического пациента', 'Структурированный подход к осмотру', 'checklist', '15 мин')
        `);

        // Демо-мероприятия
        await pool.query(`
            INSERT INTO events (title, description, type, date, location) VALUES
            ('Онлайн-вебинар по современной реабилитации', 'Современные методы восстановительного лечения', 'online', '2024-12-15', 'Zoom'),
            ('Офлайн-семинар: мануальные техники', 'Практический семинар с отработкой навыков', 'offline', '2024-12-20', 'Москва, ул. Профессиональная, 15')
        `);

        // Демо-новости
        await pool.query(`
            INSERT INTO news (title, content, category) VALUES
            ('Запуск новой образовательной платформы', 'Академия АНБ представляет обновленную платформу для профессионального развития врачей', 'development'),
            ('Новый курс по мануальным техникам', 'Доступен для записи комплексный курс из 6 модулей', 'courses')
        `);

        console.log('✅ Демо-данные добавлены');
    } catch (error) {
        console.error('❌ Ошибка добавления демо-данных:', error.message);
    }
}


// ==================== TELEGRAM BOT ====================
const bot = new Telegraf(BOT_TOKEN);

// Сообщения бота
const botMessages = {
    welcome: `👋 Добро пожаловать в Академию АНБ!\n\n🎯 Профессиональное развитие в неврологии и реабилитации\n\n📱 Для полного доступа ко всем функциям откройте наше приложение:`,
    navigation: `🎯 <b>Навигация по Академии АНБ</b>\n\n📱 Для полного доступа ко всем функциям откройте наше приложение:\n\n• Курсы и обучение\n• Эфиры и разборы\n• Практические материалы\n• Сообщество специалистов\n• Личный кабинет и прогресс`,
    promotions: `🎁 <b>Акции и специальные предложения</b>\n\n🔥 <b>Пробный период</b>\n7 дней бесплатного доступа ко всем материалам\n\n💎 <b>Приведи друга</b>\nПолучи скидку 20% на подписку за каждого приглашенного коллеги\n\n🎯 <b>Пакет "Профи"</b>\n3 месяца обучения по цене 2\nЭкономия 600 рублей`,
    support: `💬 <b>Поддержка Академии АНБ</b>\n\n📞 Координатор: @academy_anb\n⏰ ПН-ПТ с 11:00 до 19:00\n📧 academy@anb.ru`
};

// Опрос при старте
const surveySteps = [
    {
        question: "🎯 Ваша специализация:",
        options: ["Невролог", "Ортопед", "Реабилитолог", "Физиотерапевт", "Мануальный терапевт", "Спортивный врач", "Другое"],
        field: 'specialization'
    },
    {
        question: "🏙️ Ваш город:",
        options: ["Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Другой город"],
        field: 'city'
    },
    {
        question: "📧 Ваш e-mail для доступа к материалам:",
        field: 'email',
        isTextInput: true
    }
];

// Функции для работы с пользователями
async function getUser(userId) {
    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );
        
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        
        // Создаем нового пользователя
        const newUser = {
            id: userId,
            first_name: 'User',
            username: '',
            specialization: '',
            city: '',
            email: '',
            subscription_status: 'inactive',
            subscription_type: null,
            subscription_end_date: null,
            progress_level: 'Понимаю',
            progress_data: {steps: {materialsWatched: 0, eventsParticipated: 0, materialsSaved: 0, coursesBought: 0}},
            favorites_data: {courses: [], podcasts: [], streams: [], videos: [], materials: [], watchLater: []},
            is_admin: ADMIN_IDS.has(parseInt(userId)),
            joined_at: new Date(),
            last_activity: new Date(),
            survey_completed: false
        };
        
        await pool.query(
            `INSERT INTO users (id, first_name, username, joined_at, last_activity, is_admin) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [newUser.id, newUser.first_name, newUser.username, newUser.joined_at, newUser.last_activity, newUser.is_admin]
        );
        
        return newUser;
    } catch (error) {
        console.error('❌ Ошибка получения пользователя:', error.message);
        
        // Возвращаем временного пользователя при ошибке БД
        return {
            id: userId,
            first_name: 'User',
            username: '',
            specialization: '',
            city: '',
            email: '',
            subscription_status: 'inactive',
            subscription_type: null,
            subscription_end_date: null,
            progress_level: 'Понимаю',
            progress_data: {steps: {materialsWatched: 0, eventsParticipated: 0, materialsSaved: 0, coursesBought: 0}},
            favorites_data: {courses: [], podcasts: [], streams: [], videos: [], materials: [], watchLater: []},
            is_admin: ADMIN_IDS.has(parseInt(userId)),
            joined_at: new Date(),
            last_activity: new Date(),
            survey_completed: false
        };
    }
}

async function updateUser(userId, updates) {
    try {
        const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [userId, ...Object.values(updates)];
        
        await pool.query(
            `UPDATE users SET ${setClause}, last_activity = NOW() WHERE id = $1`,
            values
        );
        return true;
    } catch (error) {
        console.error('❌ Ошибка обновления пользователя:', error.message);
        return false;
    }
}

// Обработчики бота
bot.start(async (ctx) => {
    try {
        console.log('🔄 Обработка команды /start для пользователя:', ctx.from.id);
        
        const user = await getUser(ctx.from.id);
        if (!user) {
            await ctx.reply('❌ Произошла ошибка при создании профиля. Попробуйте еще раз.');
            return;
        }

        await updateUser(ctx.from.id, {
            first_name: ctx.from.first_name || 'User',
            username: ctx.from.username || ''
        });

        if (user.survey_completed) {
            await showMainMenu(ctx);
            return;
        }

        // Начинаем опрос
        await ctx.reply(`👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n📝 Для начала ответьте на несколько вопросов:`);
        await sendSurveyStep(ctx, ctx.from.id, 0);
    } catch (error) {
        console.error('❌ Ошибка в start:', error);
        await ctx.reply('❌ Произошла ошибка. Попробуйте еще раз.');
    }
});

bot.command('menu', async (ctx) => {
    await showMainMenu(ctx);
});

bot.command('admin', async (ctx) => {
    const user = await getUser(ctx.from.id);
    if (!user || !user.is_admin) {
        await ctx.reply('❌ Нет прав доступа');
        return;
    }
    
    await ctx.reply('🔧 <b>Панель управления ботом</b>', {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📱 Открыть админ-панель', web_app: { url: `${WEBAPP_URL}/admin.html` } }]
            ]
        }
    });
});

// Опрос
const userSurveys = new Map();

async function sendSurveyStep(ctx, userId, step) {
    const surveyStep = surveySteps[step];
    if (!surveyStep) return;

    userSurveys.set(userId, { step, answers: {} });

    if (surveyStep.isTextInput) {
        await ctx.reply(`📝 ${surveyStep.question}\nВведите ваш ответ:`, Markup.removeKeyboard());
    } else {
        const buttons = surveyStep.options.map(opt => [opt]);
        buttons.push(['🚫 Пропустить вопрос']);
        
        await ctx.reply(
            `📝 ${surveyStep.question}\nВыберите вариант:`,
            Markup.keyboard(buttons).resize().oneTime()
        );
    }
}

// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {
    try {
        const userId = ctx.from.id;
        const text = ctx.message.text;
        
        console.log(`📨 Получено сообщение от ${userId}: ${text}`);
        
        const survey = userSurveys.get(userId);
        if (survey) {
            await handleSurveyAnswer(ctx, survey, text);
            return;
        }

        await handleMenuButton(ctx, text);
    } catch (error) {
        console.error('❌ Ошибка обработки текста:', error);
        await ctx.reply('❌ Произошла ошибка. Попробуйте еще раз.');
    }
});

async function handleSurveyAnswer(ctx, survey, text) {
    const userId = ctx.from.id;
    const currentStep = surveySteps[survey.step];

    if (currentStep.isTextInput) {
        if (currentStep.field === 'email' && !text.includes('@')) {
            await ctx.reply('❌ Введите корректный email:');
            return;
        }
        survey.answers[currentStep.field] = text;
    } else {
        if (text !== '🚫 Пропустить вопрос') {
            survey.answers[currentStep.field] = text;
        }
    }

    survey.step++;

    if (survey.step < surveySteps.length) {
        await sendSurveyStep(ctx, userId, survey.step);
    } else {
        await finishSurvey(ctx, userId, survey.answers);
    }
}

async function finishSurvey(ctx, userId, answers) {
    try {
        await updateUser(userId, {
            specialization: answers.specialization || 'Не указано',
            city: answers.city || 'Не указан',
            email: answers.email || 'Не указан',
            survey_completed: true,
            subscription_status: 'trial',
            subscription_type: 'trial_7days',
            subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        userSurveys.delete(userId);

        await ctx.reply(
            `🎉 Спасибо за опрос, ${ctx.from.first_name}!\n\n` +
            `✅ Ваш профиль:\n` +
            `🎯 Специализация: ${answers.specialization || 'Не указано'}\n` +
            `🏙️ Город: ${answers.city || 'Не указан'}\n` +
            `📧 Email: ${answers.email || 'Не указан'}\n\n` +
            `🎁 Пробный доступ на 7 дней активирован!\n\n` +
            `Теперь вы можете пользоваться всеми возможностями Академии.`,
            Markup.removeKeyboard()
        );

        await showMainMenu(ctx);
    } catch (error) {
        console.error('❌ Ошибка завершения опроса:', error);
        await ctx.reply('❌ Ошибка завершения опроса.');
    }
}

// Главное меню
async function showMainMenu(ctx) {
    const user = await getUser(ctx.from.id);
    if (!user) return;

    let message = `👋 Добро пожаловать в Академию АНБ, ${user.first_name}!\n\n`;
    
    if (user.subscription_status === 'trial') {
        const endDate = user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString('ru-RU') : 'неизвестно';
        message += `🕒 Пробный доступ до: ${endDate}\n\n`;
    } else if (user.is_admin) {
        message += `👑 Вы администратор системы\n\n`;
    }
    
    message += `Выберите раздел для получения информации:`;

    const keyboard = [
        ['📱 Навигация', '🎁 Акции'],
        ['💬 Поддержка', '👤 Мой профиль'],
        ['🔄 Продлить подписку']
    ];

    if (user.is_admin) {
        keyboard.push(['🔧 Управление ботом']);
    }

    await ctx.reply(message, {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    });
}

async function handleMenuButton(ctx, text) {
    const user = await getUser(ctx.from.id);
    if (!user) return;

    await updateUser(ctx.from.id, {}); // Обновляем активность

    switch (text) {
        case '📱 Навигация':
            await ctx.reply(botMessages.navigation, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '🎁 Акции':
            await ctx.reply(botMessages.promotions, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '💬 Поддержка':
            await ctx.reply(botMessages.support, { parse_mode: 'HTML' });
            break;

        case '👤 Мой профиль':
            await ctx.reply('👤 <b>Информация о профиле</b>\n\nВ вашем профиле доступны:\n\n• Личные данные и специализация\n• Статус подписки\n• Прогресс по системе "Мой путь"\n• Просмотренные материалы\n\n💳 Подписку можно оформить в разделе «Личный кабинет».', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '🔄 Продлить подписку':
            await ctx.reply('🔄 <b>Продление подписки</b>\n\n<b>Тарифы:</b>\n\n🟢 <b>1 месяц</b> - 2 900 руб.\n🔵 <b>3 месяца</b> - 7 500 руб.\n🟣 <b>12 месяцев</b> - 24 000 руб.\n\n💳 Для оформления откройте приложение.', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '🔧 Управление ботом':
            if (user.is_admin) {
                await ctx.reply('🔧 <b>Панель управления ботом</b>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '📱 Открыть админ-панель', web_app: { url: `${WEBAPP_URL}/admin.html` } }]
                        ]
                    }
                });
            } else {
                await ctx.reply('❌ Нет прав доступа');
            }
            break;

        default:
            await ctx.reply('🤔 Используйте кнопки меню для навигации');
            await showMainMenu(ctx);
            break;
    }
}

// ==================== EXPRESS SERVER ====================
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(join(__dirname, 'webapp')));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// ==================== API ENDPOINTS ====================

// 🔐 Проверка прав администратора
app.get('/api/check-admin/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Сначала проверяем главных админов
        if (ADMIN_IDS.has(userId)) {
            return res.json({ success: true, isAdmin: true });
        }
        
        // Затем проверяем в базе
        const user = await getUser(userId);
        res.json({ success: true, isAdmin: user ? user.is_admin : false });
    } catch (error) {
        console.error('❌ Ошибка проверки админа:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 👤 Получение данных пользователя
app.get('/api/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await getUser(userId);
        
        if (user) {
            // Для админов делаем подписку активной
            if (user.is_admin) {
                user.subscription_status = 'active';
                user.subscription_type = 'admin';
                user.subscription_end_date = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            }
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    username: user.username,
                    specialization: user.specialization,
                    city: user.city,
                    email: user.email,
                    subscription: {
                        status: user.subscription_status,
                        type: user.subscription_type,
                        endDate: user.subscription_end_date
                    },
                    progress: user.progress_data,
                    favorites: user.favorites_data,
                    isAdmin: user.is_admin,
                    joinedAt: user.joined_at
                }
            });
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        console.error('❌ Ошибка получения пользователя:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📚 Получение контента
app.get('/api/content', async (req, res) => {
    try {
        const [courses, podcasts, streams, videos, materials, events] = await Promise.all([
            pool.query('SELECT * FROM courses ORDER BY created_at DESC'),
            pool.query('SELECT * FROM podcasts ORDER BY created_at DESC'),
            pool.query('SELECT * FROM streams ORDER BY created_at DESC'),
            pool.query('SELECT * FROM videos ORDER BY created_at DESC'),
            pool.query('SELECT * FROM materials ORDER BY created_at DESC'),
            pool.query('SELECT * FROM events ORDER BY created_at DESC')
        ]);

        res.json({
            success: true,
            data: {
                courses: courses.rows,
                podcasts: podcasts.rows,
                streams: streams.rows,
                videos: videos.rows,
                materials: materials.rows,
                events: events.rows
            }
        });
    } catch (error) {
        console.error('❌ Ошибка получения контента:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ⭐ Управление избранным
app.post('/api/user/:id/favorites', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { contentType, contentId, action } = req.body;
        
        const user = await getUser(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const favorites = user.favorites_data;
        
        if (action === 'add') {
            if (!favorites[contentType].includes(contentId)) {
                favorites[contentType].push(contentId);
            }
        } else if (action === 'remove') {
            favorites[contentType] = favorites[contentType].filter(id => id !== contentId);
        }
        
        await updateUser(userId, { favorites_data: favorites });
        
        res.json({ success: true, favorites });
    } catch (error) {
        console.error('❌ Ошибка обновления избранного:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📥 Управление "Посмотреть позже"
app.post('/api/user/:id/watch-later', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { contentType, contentId, action } = req.body;
        
        const user = await getUser(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const favorites = user.favorites_data;
        
        if (action === 'add') {
            if (!favorites.watchLater.includes(contentId)) {
                favorites.watchLater.push(contentId);
            }
        } else if (action === 'remove') {
            favorites.watchLater = favorites.watchLater.filter(id => id !== contentId);
        }
        
        await updateUser(userId, { favorites_data: favorites });
        
        res.json({ success: true, watchLater: favorites.watchLater });
    } catch (error) {
        console.error('❌ Ошибка обновления списка:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📊 Статистика системы
app.get('/api/stats', async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE subscription_status IN ($1, $2)', ['active', 'trial']);
        const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
        const podcastsCount = await pool.query('SELECT COUNT(*) FROM podcasts');
        const streamsCount = await pool.query('SELECT COUNT(*) FROM streams');
        const videosCount = await pool.query('SELECT COUNT(*) FROM videos');
        const materialsCount = await pool.query('SELECT COUNT(*) FROM materials');
        const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
        
        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(usersCount.rows[0].count),
                activeUsers: parseInt(activeUsers.rows[0].count),
                completedSurveys: 0,
                content: {
                    courses: parseInt(coursesCount.rows[0].count),
                    podcasts: parseInt(podcastsCount.rows[0].count),
                    streams: parseInt(streamsCount.rows[0].count),
                    videos: parseInt(videosCount.rows[0].count),
                    materials: parseInt(materialsCount.rows[0].count),
                    events: parseInt(eventsCount.rows[0].count)
                }
            }
        });
    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 👥 Получение списка пользователей (для админки)
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, first_name, username, specialization, city, email,
                   subscription_status, subscription_type, subscription_end_date,
                   progress_level, joined_at, is_admin
            FROM users 
            ORDER BY joined_at DESC
            LIMIT 100
        `);
        
        const users = result.rows.map(row => ({
            id: row.id,
            firstName: row.first_name,
            username: row.username,
            specialization: row.specialization,
            city: row.city,
            email: row.email,
            subscription: {
                status: row.subscription_status || 'inactive',
                type: row.subscription_type,
                endDate: row.subscription_end_date
            },
            progress: {
                level: row.progress_level || 'Понимаю',
                steps: {
                    materialsWatched: 5,
                    eventsParticipated: 3,
                    materialsSaved: 7,
                    coursesBought: 1
                }
            },
            isAdmin: row.is_admin,
            joinedAt: row.joined_at
        }));
        
        res.json({ success: true, users });
    } catch (error) {
        console.error('❌ Ошибка получения пользователей:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📝 Управление контентом (для админки)
app.post('/api/content', async (req, res) => {
    try {
        const { title, description, fullDescription, duration, price, modules, type, contentType, image, file } = req.body;
        
        let tableName;
        switch(contentType) {
            case 'courses': tableName = 'courses'; break;
            case 'podcasts': tableName = 'podcasts'; break;
            case 'streams': tableName = 'streams'; break;
            case 'videos': tableName = 'videos'; break;
            case 'materials': tableName = 'materials'; break;
            case 'events': tableName = 'events'; break;
            default: return res.status(400).json({ success: false, error: 'Invalid content type' });
        }
        
        const result = await pool.query(
            `INSERT INTO ${tableName} (title, description, full_description, duration, price, modules, type, image_url, file_url) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [title, description, fullDescription, duration, price, modules, type, image, file]
        );
        
        res.json({ success: true, content: result.rows[0] });
    } catch (error) {
        console.error('❌ Ошибка добавления контента:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 👑 Управление администраторами
app.get('/api/admins', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, first_name, username, joined_at 
            FROM users 
            WHERE is_admin = true 
            ORDER BY joined_at
        `);
        
        // Добавляем главных админов
        const adminsList = result.rows;
        for (const adminId of ADMIN_IDS) {
            if (!adminsList.find(a => a.id === adminId)) {
                adminsList.push({
                    id: adminId,
                    first_name: 'Главный Администратор',
                    username: 'admin',
                    joined_at: new Date('2024-01-01')
                });
            }
        }
        
        res.json({ success: true, data: adminsList });
    } catch (error) {
        console.error('❌ Ошибка получения админов:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/admins', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        await updateUser(userId, { is_admin: true });
        
        console.log(`✅ Пользователь ${userId} назначен администратором`);
        res.json({ success: true, data: { userId } });
    } catch (error) {
        console.error('❌ Ошибка добавления админа:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.delete('/api/admins/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (ADMIN_IDS.has(userId)) {
            return res.status(400).json({ success: false, error: 'Cannot remove main admin' });
        }

        await updateUser(userId, { is_admin: false });
        
        console.log(`🗑️ Пользователь ${userId} удален из администраторов`);
        res.json({ success: true, data: { userId } });
    } catch (error) {
        console.error('❌ Ошибка удаления админа:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📰 Новости
app.get('/api/news', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM news ORDER BY created_at DESC LIMIT 10');
        res.json({ success: true, news: result.rows });
    } catch (error) {
        console.error('❌ Ошибка получения новостей:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ❓ FAQ
app.get('/api/faq', async (req, res) => {
    try {
        const faq = [
            {
                question: "Как оформить, продлить или отменить подписку?",
                answer: "Подписку можно оформить или продлить в разделе «Личный кабинет». Там же доступна отмена — через кнопку «Изменить подписку»."
            },
            {
                question: "Что входит в подписку Академии?",
                answer: "Доступ к эфирам, разборам (в том числе в записи), практическим материалам, видео-шпаргалкам на разные темы, а также к чату специалистов и интерактивной карте офлайн-мероприятий с предзаписью и голосованиями за новые темы."
            }
        ];
        
        res.json({ success: true, faq });
    } catch (error) {
        console.error('❌ Ошибка получения FAQ:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 💳 Обновление подписки
app.post('/api/user/:id/subscription', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { plan } = req.body;
        
        const plans = {
            '1_month': { months: 1, price: 2900 },
            '3_months': { months: 3, price: 7500 },
            '12_months': { months: 12, price: 24000 }
        };
        
        const selectedPlan = plans[plan];
        if (selectedPlan) {
            await updateUser(userId, {
                subscription_status: 'active',
                subscription_type: plan,
                subscription_end_date: new Date(Date.now() + selectedPlan.months * 30 * 24 * 60 * 60 * 1000)
            });
            
            // Обновляем прогресс
            const user = await getUser(userId);
            const progress = user.progress_data;
            progress.steps.coursesBought = (progress.steps.coursesBought || 0) + 1;
            await updateUser(userId, { progress_data: progress });
        }
        
        const updatedUser = await getUser(userId);
        res.json({ 
            success: true, 
            subscription: {
                status: updatedUser.subscription_status,
                type: updatedUser.subscription_type,
                endDate: updatedUser.subscription_end_date
            }
        });
    } catch (error) {
        console.error('❌ Ошибка обновления подписки:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📈 Обновление прогресса
app.post('/api/user/:id/progress', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { metric } = req.body;
        
        const user = await getUser(userId);
        const progress = user.progress_data;
        
        if (progress.steps[metric] !== undefined) {
            progress.steps[metric] += 1;
            await updateUser(userId, { progress_data: progress });
        }
        
        res.json({ success: true, progress });
    } catch (error) {
        console.error('❌ Ошибка обновления прогресса:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 🎫 Регистрация на мероприятия
app.post('/api/user/:id/events', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { eventId, action } = req.body;
        
        if (action === 'register') {
            // Обновляем прогресс участия в мероприятиях
            const user = await getUser(userId);
            const progress = user.progress_data;
            progress.steps.eventsParticipated = (progress.steps.eventsParticipated || 0) + 1;
            await updateUser(userId, { progress_data: progress });
        }
        
        res.json({ success: true, message: 'Registered for event' });
    } catch (error) {
        console.error('❌ Ошибка регистрации на мероприятие:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('🔥 Server error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
    });
});

// Serve SPA
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startApp() {
    try {
        console.log('🚀 Запуск приложения...');
        
        // Проверяем подключение к базе данных
        const dbConnected = await testDatabaseConnection();
        if (!dbConnected) {
            console.log('⚠️  База данных недоступна, работаем в ограниченном режиме');
        } else {
            // Инициализируем базу данных
            await initDatabase();
        }
        
        // Запускаем Express сервер
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 WebApp сервер запущен на порту ${PORT}`);
            console.log(`📱 WebApp: ${WEBAPP_URL}`);
            console.log(`🔧 Admin: ${WEBAPP_URL}/admin.html`);
            console.log(`👑 Админ ID: ${Array.from(ADMIN_IDS).join(', ')}`);
        });

        // Запускаем бота
        await bot.launch();
        console.log('✅ Telegram Bot запущен!');
        console.log('🔧 Команды: /start, /menu, /admin');
        console.log('🚀 Приложение полностью готово к работе!');

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Запускаем приложение
startApp();
