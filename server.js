// server.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ ВЕРСИЯ
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || `https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net`;
const ADMIN_IDS = new Set([898508164, 123456789]); // Добавьте свои ID

console.log('🚀 Starting Smart Clinic Bot...');

// ==================== НАСТРОЙКА MULTER ДЛЯ ЗАГРУЗКИ ФАЙЛОВ ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла'));
    }
  }
});

// ==================== БАЗА ДАННЫХ ====================
let pool;
let dbConnected = false;

async function initDatabase() {
    try {
        const { Pool } = await import('pg');
        
        console.log('🔌 Подключаемся к PostgreSQL...');
        
        pool = new Pool({
            user: 'gen_user',
            host: '45.89.190.49',
            database: 'default_db',
            password: '5-R;mKGYJ<88?1',
            port: 5432,
            ssl: {
                rejectUnauthorized: false
            },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        console.log('✅ Настройки подключения установлены');
        
        // Тестируем подключение
        const client = await pool.connect();
        console.log('✅ Успешное подключение к PostgreSQL!');
        
        const versionResult = await client.query('SELECT version()');
        console.log('📊 Версия PostgreSQL:', versionResult.rows[0].version.split(',')[0]);
        
        client.release();
        dbConnected = true;

        // Создаем таблицы
        await createTables();
        await addDemoData();
        
        console.log('✅ База данных полностью инициализирована');
        
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
                last_name TEXT,
                username TEXT,
                specialization TEXT,
                city TEXT,
                email TEXT,
                phone TEXT,
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
                video_url TEXT,
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
                stream_url TEXT,
                scheduled_time TIMESTAMP,
                image_url TEXT,
                is_live BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS videos (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                content TEXT,
                file_url TEXT,
                image_url TEXT,
                material_type TEXT DEFAULT 'article',
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                event_date TIMESTAMP,
                location TEXT,
                event_type TEXT DEFAULT 'online',
                image_url TEXT,
                registration_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                content_type TEXT,
                content_id INTEGER,
                progress_percentage INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                last_position INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS admin_uploads (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                original_name TEXT,
                file_path TEXT,
                file_size INTEGER,
                mime_type TEXT,
                upload_type TEXT,
                uploaded_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const tableQuery of tables) {
            try {
                await pool.query(tableQuery);
                console.log(`✅ Таблица создана/проверена`);
            } catch (error) {
                console.error(`❌ Ошибка создания таблицы: ${error.message}`);
            }
        }
        console.log('✅ Все таблицы созданы/проверены');

    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error.message);
    }
}

async function addDemoData() {
    try {
        // Проверяем, есть ли уже данные
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(usersCount.rows[0].count) > 0) {
            console.log('✅ Данные уже существуют');
            return;
        }

        console.log('📝 Добавление демо-данных...');

        // Добавляем администратора
        await pool.query(`
            INSERT INTO users (id, first_name, username, is_admin, subscription_status, subscription_type) 
            VALUES (898508164, 'Главный Администратор', 'admin', TRUE, 'active', 'admin')
            ON CONFLICT (id) DO UPDATE SET is_admin = TRUE
        `);

        // Демо-курсы
        const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(coursesCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO courses (title, description, full_description, price, duration, modules) VALUES
                ('Мануальные техники в практике', '6 модулей по современным мануальным методикам', 'Комплексный курс по мануальным техникам для практикующих врачей. Включает диагностику, техники работы и реабилитацию.', 15000, '12 часов', 6),
                ('Неврология для практикующих врачей', 'Основы неврологической диагностики', 'Фундаментальный курс по неврологии с акцентом на практическое применение в клинической практике.', 12000, '10 часов', 5),
                ('Реабилитация после травм', 'Современные методы восстановительного лечения', 'Полный курс по реабилитации пациентов после различных травм опорно-двигательного аппарата.', 18000, '15 часов', 8)
            `);
            console.log('✅ Демо-курсы добавлены');
        }

        // Демо-подкасты
        const podcastsCount = await pool.query('SELECT COUNT(*) FROM podcasts');
        if (parseInt(podcastsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO podcasts (title, description, duration) VALUES
                ('АНБ FM: Основы неврологии', 'Подкаст о современных подходах в неврологии', '45:20'),
                ('АНБ FM: Реабилитация', 'Современные методы восстановительного лечения', '38:15'),
                ('АНБ FM: Мануальная терапия', 'Обсуждение современных мануальных техник', '42:30')
            `);
            console.log('✅ Демо-подкасты добавлены');
        }

        // Демо-новости
        const newsCount = await pool.query('SELECT COUNT(*) FROM news');
        if (parseInt(newsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO news (title, content, category) VALUES
                ('Запуск платформы Академии АНБ', 'Новая образовательная платформа для врачей предлагает современные курсы и материалы', 'development'),
                ('Новый курс по мануальным техникам', 'Доступен курс из 6 модулей по современным мануальным методикам', 'courses'),
                ('Вебинар по реабилитации', 'Онлайн-вебинар 15 декабря по современным методам реабилитации', 'events'),
                ('Обновление базы знаний', 'Добавлены новые материалы и исследования', 'development')
            `);
            console.log('✅ Демо-новости добавлены');
        }

        console.log('✅ Демо-данные успешно добавлены');
    } catch (error) {
        console.error('❌ Ошибка добавления демо-данных:', error.message);
    }
}

// ==================== TELEGRAM BOT ====================
const bot = new Telegraf(BOT_TOKEN);

// Функции для работы с пользователями
async function getUser(userId) {
    if (!dbConnected || !pool) {
        return getTempUser(userId);
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [userId]
        );
        
        if (result.rows.length > 0) {
            return result.rows[0];
        }
        
        return null;
    } catch (error) {
        console.error('❌ Ошибка получения пользователя:', error.message);
        return getTempUser(userId);
    }
}

async function getOrCreateUser(userId, userData = {}) {
    if (!dbConnected || !pool) {
        return getTempUser(userId);
    }

    try {
        let user = await getUser(userId);
        
        if (!user) {
            const newUser = {
                id: userId,
                first_name: userData.first_name || 'User',
                last_name: userData.last_name || '',
                username: userData.username || '',
                specialization: '',
                city: '',
                email: '',
                phone: '',
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
                `INSERT INTO users (id, first_name, last_name, username, joined_at, last_activity, is_admin) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [newUser.id, newUser.first_name, newUser.last_name, newUser.username, newUser.joined_at, newUser.last_activity, newUser.is_admin]
            );
            
            user = newUser;
        }
        
        return user;
    } catch (error) {
        console.error('❌ Ошибка создания пользователя:', error.message);
        return getTempUser(userId);
    }
}

function getTempUser(userId) {
    return {
        id: userId,
        first_name: 'User',
        last_name: '',
        username: '',
        specialization: '',
        city: '',
        email: '',
        phone: '',
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

async function updateUser(userId, updates) {
    if (!dbConnected || !pool) {
        return true;
    }

    try {
        const { last_activity, ...cleanUpdates } = updates;
        
        if (Object.keys(cleanUpdates).length === 0) {
            await pool.query(
                'UPDATE users SET last_activity = NOW() WHERE id = $1',
                [userId]
            );
            return true;
        }

        const setClause = Object.keys(cleanUpdates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');
        
        const values = [userId, ...Object.values(cleanUpdates)];
        
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

const userSurveys = new Map();

// Обработчики бота
bot.start(async (ctx) => {
    try {
        console.log('🔄 Обработка команды /start для пользователя:', ctx.from.id);
        
        const user = await getOrCreateUser(ctx.from.id, {
            first_name: ctx.from.first_name,
            last_name: ctx.from.last_name,
            username: ctx.from.username
        });

        if (user.survey_completed) {
            await showMainMenu(ctx);
            return;
        }

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
    if (!user || !(user.is_admin || ADMIN_IDS.has(ctx.from.id))) {
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

    await updateUser(ctx.from.id, { last_activity: new Date() });

    switch (text) {
        case '📱 Навигация':
            await ctx.reply(getNavigationMessage(), {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '🎁 Акции':
            await ctx.reply(getPromotionsMessage(), {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
                    ]]
                }
            });
            break;

        case '💬 Поддержка':
            await ctx.reply(getSupportMessage(), { parse_mode: 'HTML' });
            break;

        case '👤 Мой профиль':
            await showUserProfile(ctx, user);
            break;

        case '🔄 Продлить подписку':
            await showSubscriptionPlans(ctx);
            break;

        case '🔧 Управление ботом':
            if (user.is_admin || ADMIN_IDS.has(ctx.from.id)) {
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

function getNavigationMessage() {
    return `🎯 <b>Навигация по Академии АНБ</b>\n\n📱 Для полного доступа ко всем функциям откройте наше приложение:\n\n• 📚 Курсы и обучение\n• 📹 Эфиры и разборы\n• 📋 Практические материалы\n• 👥 Сообщество специалистов\n• 👤 Личный кабинет и прогресс`;
}

function getPromotionsMessage() {
    return `🎁 <b>Акции и специальные предложения</b>\n\n🔥 <b>Пробный период</b>\n7 дней бесплатного доступа ко всем материалам\n\n💎 <b>Приведи друга</b>\nПолучи скидку 20% на подписку за каждого приглашенного коллеги\n\n🎯 <b>Пакет "Профи"</b>\n3 месяца обучения по цене 2\nЭкономия 600 рублей`;
}

function getSupportMessage() {
    return `💬 <b>Поддержка Академии АНБ</b>\n\n📞 Координатор: @academy_anb\n⏰ ПН-ПТ с 11:00 до 19:00\n📧 academy@anb.ru`;
}

async function showUserProfile(ctx, user) {
    let profileMessage = `👤 <b>Информация о профиле</b>\n\n`;
    profileMessage += `🎯 Специализация: ${user.specialization || 'Не указана'}\n`;
    profileMessage += `🏙️ Город: ${user.city || 'Не указан'}\n`;
    profileMessage += `📧 Email: ${user.email || 'Не указан'}\n\n`;
    
    if (user.subscription_status === 'trial') {
        const endDate = user.subscription_end_date ? new Date(user.subscription_end_date).toLocaleDateString('ru-RU') : 'неизвестно';
        profileMessage += `🆓 Пробный период до: ${endDate}\n`;
    } else if (user.subscription_status === 'active') {
        profileMessage += `✅ Активная подписка\n`;
    } else {
        profileMessage += `❌ Подписка не активна\n`;
    }
    
    profileMessage += `\n💳 Для управления подпиской откройте приложение.`;

    await ctx.reply(profileMessage, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [[
                { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
            ]]
        }
    });
}

async function showSubscriptionPlans(ctx) {
    await ctx.reply('🔄 <b>Продление подписки</b>\n\n<b>Тарифы:</b>\n\n🟢 <b>1 месяц</b> - 2 900 руб.\n🔵 <b>3 месяца</b> - 7 500 руб.\n🟣 <b>12 месяцев</b> - 24 000 руб.\n\n💳 Для оформления откройте приложение.', {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [[
                { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
            ]]
        }
    });
}

// ==================== EXPRESS SERVER ====================
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(join(__dirname, 'webapp')));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// ==================== API ENDPOINTS ====================

// 🔐 Проверка прав администратора
app.get('/api/check-admin/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        console.log('🔍 Проверка админ-прав для:', userId);
        
        // Сначала проверяем главных админов
        if (ADMIN_IDS.has(userId)) {
            console.log('✅ Пользователь в ADMIN_IDS');
            return res.json({ success: true, isAdmin: true });
        }
        
        // Затем проверяем в базе
        const user = await getUser(userId);
        const isAdmin = user ? user.is_admin : false;
        
        console.log('📊 Результат проверки:', {
            userId,
            inAdminIds: ADMIN_IDS.has(userId),
            dbIsAdmin: user?.is_admin,
            finalResult: isAdmin || ADMIN_IDS.has(userId)
        });
        
        res.json({ 
            success: true, 
            isAdmin: isAdmin || ADMIN_IDS.has(userId)
        });
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
                    lastName: user.last_name,
                    username: user.username,
                    specialization: user.specialization,
                    city: user.city,
                    email: user.email,
                    phone: user.phone,
                    subscription: {
                        status: user.subscription_status,
                        type: user.subscription_type,
                        endDate: user.subscription_end_date
                    },
                    progress: user.progress_data,
                    favorites: user.favorites_data,
                    isAdmin: user.is_admin,
                    joinedAt: user.joined_at,
                    surveyCompleted: user.survey_completed
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

// 📝 Создание/обновление пользователя
app.post('/api/user', async (req, res) => {
    try {
        const { id, firstName, lastName, username } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        const user = await getOrCreateUser(id, {
            first_name: firstName,
            last_name: lastName,
            username: username
        });

        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
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
                joinedAt: user.joined_at,
                surveyCompleted: user.survey_completed
            }
        });
    } catch (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📚 Получение контента
app.get('/api/content', async (req, res) => {
    if (!dbConnected) {
        return res.json({
            success: true,
            data: getTempContent()
        });
    }

    try {
        const [courses, podcasts, streams, videos, materials, events, news] = await Promise.all([
            pool.query('SELECT * FROM courses ORDER BY created_at DESC'),
            pool.query('SELECT * FROM podcasts ORDER BY created_at DESC'),
            pool.query('SELECT * FROM streams ORDER BY created_at DESC'),
            pool.query('SELECT * FROM videos ORDER BY created_at DESC'),
            pool.query('SELECT * FROM materials ORDER BY created_at DESC'),
            pool.query('SELECT * FROM events ORDER BY created_at DESC'),
            pool.query('SELECT * FROM news ORDER BY created_at DESC')
        ]);

        res.json({
            success: true,
            data: {
                courses: courses.rows,
                podcasts: podcasts.rows,
                streams: streams.rows,
                videos: videos.rows,
                materials: materials.rows,
                events: events.rows,
                news: news.rows
            }
        });
    } catch (error) {
        console.error('❌ Ошибка получения контента:', error);
        res.json({
            success: true,
            data: getTempContent()
        });
    }
});

function getTempContent() {
    return {
        courses: [
            {
                id: 1,
                title: 'Мануальные техники в практике',
                description: '6 модулей по современным мануальным методикам',
                full_description: 'Комплексный курс по мануальным техникам для практикующих врачей',
                price: 15000,
                duration: '12 часов',
                modules: 6,
                created_at: new Date()
            }
        ],
        podcasts: [
            {
                id: 1,
                title: 'АНБ FM: Основы неврологии',
                description: 'Подкаст о современных подходах в неврологии',
                duration: '45:20',
                created_at: new Date()
            }
        ],
        streams: [],
        videos: [],
        materials: [],
        events: [],
        news: []
    };
}

// 📤 Загрузка файлов
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const { userId, uploadType } = req.body;
        
        if (!dbConnected) {
            return res.json({
                success: true,
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    path: `/uploads/${req.file.filename}`,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            });
        }

        // Сохраняем информацию о файле в базе
        const result = await pool.query(
            `INSERT INTO admin_uploads (filename, original_name, file_path, file_size, mime_type, upload_type, uploaded_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.file.filename, req.file.originalname, `/uploads/${req.file.filename}`, req.file.size, req.file.mimetype, uploadType, userId]
        );

        res.json({
            success: true,
            file: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Ошибка загрузки файла:', error);
        res.status(500).json({ success: false, error: 'File upload failed' });
    }
});

// 📝 Добавление контента (с поддержкой файлов)
app.post('/api/content', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    if (!dbConnected) {
        return res.status(500).json({ success: false, error: 'Database not available' });
    }

    try {
        const { 
            title, 
            description, 
            fullDescription, 
            duration, 
            price, 
            modules, 
            contentType,
            materialType,
            eventDate,
            location,
            eventType,
            registrationUrl
        } = req.body;
        
        let imageUrl = null;
        let fileUrl = null;
        let videoUrl = null;

        // Обрабатываем загруженные файлы
        if (req.files) {
            if (req.files.image) {
                imageUrl = `/uploads/${req.files.image[0].filename}`;
            }
            if (req.files.file) {
                fileUrl = `/uploads/${req.files.file[0].filename}`;
            }
            if (req.files.video) {
                videoUrl = `/uploads/${req.files.video[0].filename}`;
            }
        }

        let tableName;
        let query;
        let values;

        switch(contentType) {
            case 'courses':
                tableName = 'courses';
                query = `INSERT INTO ${tableName} (title, description, full_description, duration, price, modules, image_url, file_url, video_url) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
                values = [title, description, fullDescription, duration, parseInt(price) || 0, parseInt(modules) || 1, imageUrl, fileUrl, videoUrl];
                break;
                
            case 'podcasts':
                tableName = 'podcasts';
                query = `INSERT INTO ${tableName} (title, description, duration, audio_url, image_url) 
                         VALUES ($1, $2, $3, $4, $5) RETURNING *`;
                values = [title, description, duration, fileUrl, imageUrl];
                break;
                
            case 'streams':
                tableName = 'streams';
                query = `INSERT INTO ${tableName} (title, description, stream_url, scheduled_time, image_url) 
                         VALUES ($1, $2, $3, $4, $5) RETURNING *`;
                values = [title, description, videoUrl, eventDate, imageUrl];
                break;
                
            case 'videos':
                tableName = 'videos';
                query = `INSERT INTO ${tableName} (title, description, video_url, duration, thumbnail_url) 
                         VALUES ($1, $2, $3, $4, $5) RETURNING *`;
                values = [title, description, videoUrl, duration, imageUrl];
                break;
                
            case 'materials':
                tableName = 'materials';
                query = `INSERT INTO ${tableName} (title, description, content, file_url, image_url, material_type) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                values = [title, description, fullDescription, fileUrl, imageUrl, materialType];
                break;
                
            case 'events':
                tableName = 'events';
                query = `INSERT INTO ${tableName} (title, description, event_date, location, event_type, image_url, registration_url) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
                values = [title, description, eventDate, location, eventType, imageUrl, registrationUrl];
                break;
                
            default:
                return res.status(400).json({ success: false, error: 'Invalid content type' });
        }
        
        const result = await pool.query(query, values);
        
        res.json({ success: true, content: result.rows[0] });
    } catch (error) {
        console.error('❌ Ошибка добавления контента:', error);
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
        
        const favorites = user.favorites_data || {courses: [], podcasts: [], streams: [], videos: [], materials: [], watchLater: []};
        
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
        
        const favorites = user.favorites_data || {courses: [], podcasts: [], streams: [], videos: [], materials: [], watchLater: []};
        
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
    if (!dbConnected) {
        return res.json({
            success: true,
            stats: {
                totalUsers: 1,
                activeUsers: 1,
                completedSurveys: 0,
                content: {
                    courses: 1,
                    podcasts: 1,
                    streams: 0,
                    videos: 0,
                    materials: 0,
                    events: 0
                }
            }
        });
    }

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
    if (!dbConnected) {
        return res.json({ 
            success: true, 
            users: [getTempUser(898508164)] 
        });
    }

    try {
        const result = await pool.query(`
            SELECT id, first_name, last_name, username, specialization, city, email, phone,
                   subscription_status, subscription_type, subscription_end_date,
                   progress_level, progress_data, favorites_data, is_admin, joined_at, survey_completed
            FROM users 
            ORDER BY joined_at DESC
            LIMIT 1000
        `);
        
        const users = result.rows.map(row => ({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            username: row.username,
            specialization: row.specialization,
            city: row.city,
            email: row.email,
            phone: row.phone,
            subscription: {
                status: row.subscription_status || 'inactive',
                type: row.subscription_type,
                endDate: row.subscription_end_date
            },
            progress: row.progress_data || {steps: {materialsWatched: 0, eventsParticipated: 0, materialsSaved: 0, coursesBought: 0}},
            favorites: row.favorites_data || {courses: [], podcasts: [], streams: [], videos: [], materials: [], watchLater: []},
            isAdmin: row.is_admin,
            joinedAt: row.joined_at,
            surveyCompleted: row.survey_completed
        }));
        
        res.json({ success: true, users });
    } catch (error) {
        console.error('❌ Ошибка получения пользователей:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 👑 Управление администраторами
app.get('/api/admins', async (req, res) => {
    if (!dbConnected) {
        const adminsList = Array.from(ADMIN_IDS).map(id => ({
            id: id,
            first_name: 'Главный Администратор',
            username: 'admin',
            joined_at: new Date('2024-01-01')
        }));
        return res.json({ success: true, data: adminsList });
    }

    try {
        const result = await pool.query(`
            SELECT id, first_name, last_name, username, joined_at 
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
    if (!dbConnected) {
        return res.status(500).json({ success: false, error: 'База данных недоступна' });
    }

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
    if (!dbConnected) {
        return res.status(500).json({ success: false, error: 'База данных недоступна' });
    }

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
    if (!dbConnected) {
        return res.json({
            success: true,
            news: [
                {
                    id: 1,
                    title: 'Запуск новой образовательной платформы',
                    content: 'Академия АНБ представляет обновленную платформу для профессионального развития врачей',
                    category: 'development',
                    created_at: new Date()
                }
            ]
        });
    }

    try {
        const result = await pool.query('SELECT * FROM news ORDER BY created_at DESC LIMIT 20');
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
            },
            {
                question: "Можно ли смотреть материалы без подписки?",
                answer: "Да, часть контента доступна в пробном периоде для ознакомления. Полный доступ и участие в развитии открываются при активной подписке."
            },
            {
                question: "Как получить сертификат о прохождении курса?",
                answer: "После успешного завершения курса и прохождения итогового тестирования сертификат будет доступен для скачивания в личном кабинете."
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
        const progress = user.progress_data || {steps: {materialsWatched: 0, eventsParticipated: 0, materialsSaved: 0, coursesBought: 0}};
        
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
        dbConnected,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
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
        
        // Инициализируем базу данных
        await initDatabase();
        
        // Запускаем Express сервер
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 WebApp сервер запущен на порту ${PORT}`);
            console.log(`📱 WebApp: ${WEBAPP_URL}`);
            console.log(`🔧 Admin: ${WEBAPP_URL}/admin.html`);
            console.log(`👑 Админ ID: ${Array.from(ADMIN_IDS).join(', ')}`);
            console.log(`🗄️  База данных: ${dbConnected ? '✅ Подключена' : '❌ Не подключена'}`);
            console.log(`📁 Uploads: ${join(__dirname, 'uploads')}`);
        });

        // Запускаем бота с обработкой ошибки 409
        await startBotWithRetry();
        
        console.log('🚀 Приложение полностью готово к работе!');

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

async function startBotWithRetry() {
    let retries = 3;
    
    while (retries > 0) {
        try {
            await bot.launch();
            console.log('✅ Telegram Bot запущен!');
            console.log('🔧 Команды: /start, /menu, /admin');
            return;
        } catch (error) {
            if (error.response?.error_code === 409) {
                console.log(`⚠️  Конфликт бота (409). Повторная попытка... (${retries-1} осталось)`);
                retries--;
                
                // Ждем перед повторной попыткой
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Пробуем остановить бота перед перезапуском
                try {
                    await bot.stop();
                } catch (e) {
                    // Игнорируем ошибки остановки
                }
            } else {
                throw error;
            }
        }
    }
    
    throw new Error('Не удалось запустить бота после нескольких попыток');
}

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Остановка приложения...');
    bot.stop('SIGINT');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🛑 Остановка приложения...');
    bot.stop('SIGTERM');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});

// Запускаем приложение
startApp();
