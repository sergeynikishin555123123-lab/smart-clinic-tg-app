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
import bcrypt from 'bcryptjs';
import cors from 'cors';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || `https://sergeynikishin555123123-lab-smart-clinic-tg-app-a472.twc1.net`;
const ADMIN_IDS = new Set([898508164, 123456789].map(id => parseInt(id)));
const JWT_SECRET = process.env.JWT_SECRET || 'anb_academy_secret_key_2024';

console.log('🚀 Starting Smart Clinic Bot v3.0...');

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
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|mp3|wav|webp/;
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
            max: 20,
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
                survey_completed BOOLEAN DEFAULT FALSE,
                profile_image TEXT
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
                category TEXT DEFAULT 'general',
                level TEXT DEFAULT 'beginner',
                rating DECIMAL(3,2) DEFAULT 0.0,
                students_count INTEGER DEFAULT 0,
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
                category TEXT DEFAULT 'general',
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
                viewers_count INTEGER DEFAULT 0,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS videos (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                category TEXT DEFAULT 'general',
                views_count INTEGER DEFAULT 0,
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
                category TEXT DEFAULT 'general',
                downloads_count INTEGER DEFAULT 0,
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
                participants_count INTEGER DEFAULT 0,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT,
                image_url TEXT,
                author TEXT DEFAULT 'АНБ Академия',
                views_count INTEGER DEFAULT 0,
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
            )`,
            `CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                color TEXT DEFAULT '#58b8e7',
                icon TEXT DEFAULT '📁',
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            `CREATE TABLE IF NOT EXISTS navigation_items (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                icon TEXT,
                image_url TEXT,
                target_page TEXT,
                position INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
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
        console.log('📝 Добавление демо-данных...');

        // Добавляем администратора
        await pool.query(`
            INSERT INTO users (id, first_name, username, is_admin, subscription_status, subscription_type, profile_image) 
            VALUES (898508164, 'Главный Администратор', 'admin', TRUE, 'active', 'admin', '/uploads/admin-avatar.jpg')
            ON CONFLICT (id) DO UPDATE SET is_admin = TRUE
        `);

        // Добавляем категории
        const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories');
        if (parseInt(categoriesCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO categories (name, type, color, icon) VALUES
                ('Неврология', 'courses', '#58b8e7', '🧠'),
                ('Ортопедия', 'courses', '#28a745', '🦴'),
                ('Реабилитация', 'courses', '#ffc107', '🏃'),
                ('Мануальная терапия', 'courses', '#dc3545', '✋'),
                ('Диагностика', 'courses', '#6f42c1', '🔍'),
                ('Клинические случаи', 'materials', '#20c997', '📋'),
                ('МРТ разборы', 'materials', '#17a2b8', '🩻'),
                ('Чек-листы', 'materials', '#fd7e14', '✅')
            `);
            console.log('✅ Демо-категории добавлены');
        }

        // Демо-курсы
        const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(coursesCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO courses (title, description, full_description, price, duration, modules, category, level, image_url) VALUES
                ('Мануальные техники в практике', '6 модулей по современным мануальным методикам', 'Комплексный курс по мануальным техникам для практикующих врачей. Включает диагностику, техники работы и реабилитацию.', 15000, '12 часов', 6, 'Мануальная терапия', 'advanced', '/uploads/course-manual.jpg'),
                ('Неврология для практикующих врачей', 'Основы неврологической диагностики', 'Фундаментальный курс по неврологии с акцентом на практическое применение в клинической практике.', 12000, '10 часов', 5, 'Неврология', 'intermediate', '/uploads/course-neurology.jpg'),
                ('Реабилитация после травм', 'Современные методы восстановительного лечения', 'Полный курс по реабилитации пациентов после различных травм опорно-двигательного аппарата.', 18000, '15 часов', 8, 'Реабилитация', 'advanced', '/uploads/course-rehab.jpg'),
                ('Основы ортопедии', 'Диагностика и лечение заболеваний ОДА', 'Базовый курс по ортопедии для начинающих специалистов.', 8000, '8 часов', 4, 'Ортопедия', 'beginner', '/uploads/course-ortho.jpg'),
                ('Спортивная медицина', 'Реабилитация спортсменов', 'Специализированный курс по работе со спортсменами.', 20000, '20 часов', 10, 'Реабилитация', 'advanced', '/uploads/course-sport.jpg')
            `);
            console.log('✅ Демо-курсы добавлены');
        }

        // Демо-подкасты
        const podcastsCount = await pool.query('SELECT COUNT(*) FROM podcasts');
        if (parseInt(podcastsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO podcasts (title, description, duration, category, image_url) VALUES
                ('АНБ FM: Основы неврологии', 'Подкаст о современных подходах в неврологии', '45:20', 'Неврология', '/uploads/podcast-neuro.jpg'),
                ('АНБ FM: Реабилитация', 'Современные методы восстановительного лечения', '38:15', 'Реабилитация', '/uploads/podcast-rehab.jpg'),
                ('АНБ FM: Мануальная терапия', 'Обсуждение современных мануальных техник', '42:30', 'Мануальная терапия', '/uploads/podcast-manual.jpg'),
                ('АНБ FM: Ортопедия в практике', 'Практические аспекты ортопедии', '35:45', 'Ортопедия', '/uploads/podcast-ortho.jpg')
            `);
            console.log('✅ Демо-подкасты добавлены');
        }

        // Демо-материалы
        const materialsCount = await pool.query('SELECT COUNT(*) FROM materials');
        if (parseInt(materialsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO materials (title, description, material_type, category, image_url) VALUES
                ('МРТ поясничного отдела - разбор', 'Детальный разбор МРТ с клиническим случаем', 'mri', 'МРТ разборы', '/uploads/mri-lumbar.jpg'),
                ('Чек-лист неврологического осмотра', 'Полный алгоритм неврологического обследования', 'checklist', 'Чек-листы', '/uploads/checklist-neuro.jpg'),
                ('Клинический случай: боль в шее', 'Разбор сложного случая цервикалгии', 'case', 'Клинические случаи', '/uploads/case-neck.jpg'),
                ('Протокол реабилитации после эндопротезирования', 'Поэтапный план восстановления', 'checklist', 'Чек-листы', '/uploads/protocol-hip.jpg')
            `);
            console.log('✅ Демо-материалы добавлены');
        }

        // Демо-новости
        const newsCount = await pool.query('SELECT COUNT(*) FROM news');
        if (parseInt(newsCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO news (title, content, category, image_url) VALUES
                ('Запуск новой образовательной платформы Академии АНБ', 'Мы рады представить полностью обновленную платформу для профессионального развития врачей. Новый интерфейс, расширенный функционал и современный подход к обучению.', 'development', '/uploads/news-launch.jpg'),
                ('Новый курс по мануальным техникам', 'Доступен для записи комплексный курс из 6 модулей по современным мануальным методикам. Ведущий - доктор медицинских наук.', 'courses', '/uploads/news-course.jpg'),
                ('Вебинар по реабилитации после спортивных травм', 'Приглашаем на онлайн-вебинар 15 декабря по современным методам реабилитации. Бесплатное участие для всех подписчиков.', 'events', '/uploads/news-webinar.jpg'),
                ('Обновление базы знаний', 'Добавлены новые материалы и исследования по неврологии и ортопедии. Расширена библиотека клинических случаев.', 'development', '/uploads/news-update.jpg'),
                ('Новые методические рекомендации', 'Опубликованы обновленные клинические рекомендации по лечению заболеваний опорно-двигательного аппарата.', 'materials', '/uploads/news-guidelines.jpg')
            `);
            console.log('✅ Демо-новости добавлены');
        }

        // Навигационные элементы
        const navCount = await pool.query('SELECT COUNT(*) FROM navigation_items');
        if (parseInt(navCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO navigation_items (title, icon, image_url, target_page, position) VALUES
                ('Главная', '🏠', '/uploads/nav-home.jpg', 'home', 1),
                ('Курсы', '📚', '/uploads/nav-courses.jpg', 'courses', 2),
                ('Подкасты', '🎧', '/uploads/nav-podcasts.jpg', 'podcasts', 3),
                ('Эфиры', '📹', '/uploads/nav-streams.jpg', 'streams', 4),
                ('Материалы', '📋', '/uploads/nav-materials.jpg', 'materials', 5),
                ('Сообщество', '👥', '/uploads/nav-community.jpg', 'community', 6),
                ('Профиль', '👤', '/uploads/nav-profile.jpg', 'profile', 7)
            `);
            console.log('✅ Навигационные элементы добавлены');
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
                survey_completed: false,
                profile_image: null
            };
            
            await pool.query(
                `INSERT INTO users (id, first_name, last_name, username, joined_at, last_activity, is_admin, profile_image) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [newUser.id, newUser.first_name, newUser.last_name, newUser.username, newUser.joined_at, newUser.last_activity, newUser.is_admin, newUser.profile_image]
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
        survey_completed: false,
        profile_image: null
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

        await ctx.reply(`👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n📝 Для персонализации опыта ответьте на несколько вопросов:`);
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
            `✅ Ваш профиль создан:\n` +
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
app.use(cors());

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
                    surveyCompleted: user.survey_completed,
                    profileImage: user.profile_image
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
                surveyCompleted: user.survey_completed,
                profileImage: user.profile_image
            }
        });
    } catch (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📚 Получение контента с пагинацией и фильтрацией
app.get('/api/content', async (req, res) => {
    try {
        const { type, category, page = 1, limit = 20 } = req.query;
        
        if (!dbConnected) {
            return res.json({
                success: true,
                data: getTempContent(),
                pagination: { page: 1, limit, total: 1, pages: 1 }
            });
        }

        let contentTypes = ['courses', 'podcasts', 'streams', 'videos', 'materials', 'events', 'news'];
        if (type && contentTypes.includes(type)) {
            contentTypes = [type];
        }

        const contentData = {};
        const promises = [];

        for (const contentType of contentTypes) {
            let query = `SELECT * FROM ${contentType}`;
            let countQuery = `SELECT COUNT(*) FROM ${contentType}`;
            const queryParams = [];
            let whereConditions = [];

            if (category) {
                whereConditions.push(`category = $${queryParams.length + 1}`);
                queryParams.push(category);
            }

            if (whereConditions.length > 0) {
                query += ' WHERE ' + whereConditions.join(' AND ');
                countQuery += ' WHERE ' + whereConditions.join(' AND ');
            }

            query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
            queryParams.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

            promises.push(
                pool.query(query, queryParams),
                pool.query(countQuery, queryParams.slice(0, -2))
            );
        }

        const results = await Promise.all(promises);

        for (let i = 0; i < contentTypes.length; i++) {
            const contentType = contentTypes[i];
            const contentResult = results[i * 2];
            const countResult = results[i * 2 + 1];
            
            contentData[contentType] = contentResult.rows;
            contentData[`${contentType}Count`] = parseInt(countResult.rows[0].count);
        }

        // Получаем категории
        const categoriesResult = await pool.query('SELECT * FROM categories ORDER BY name');
        contentData.categories = categoriesResult.rows;

        // Получаем навигацию
        const navigationResult = await pool.query('SELECT * FROM navigation_items WHERE is_active = true ORDER BY position');
        contentData.navigation = navigationResult.rows;

        res.json({
            success: true,
            data: contentData,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: contentData[`${type}Count`] || Object.values(contentData).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0),
                pages: Math.ceil((contentData[`${type}Count`] || 1) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ Ошибка получения контента:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
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
                image_url: '/uploads/course-manual.jpg',
                category: 'Мануальная терапия',
                level: 'advanced',
                rating: 4.8,
                students_count: 124,
                created_at: new Date()
            }
        ],
        podcasts: [
            {
                id: 1,
                title: 'АНБ FM: Основы неврологии',
                description: 'Подкаст о современных подходах в неврологии',
                duration: '45:20',
                image_url: '/uploads/podcast-neuro.jpg',
                category: 'Неврология',
                created_at: new Date()
            }
        ],
        streams: [],
        videos: [],
        materials: [
            {
                id: 1,
                title: 'МРТ поясничного отдела - разбор',
                description: 'Детальный разбор МРТ с клиническим случаем',
                material_type: 'mri',
                image_url: '/uploads/mri-lumbar.jpg',
                category: 'МРТ разборы',
                downloads_count: 89,
                created_at: new Date()
            }
        ],
        events: [],
        news: [
            {
                id: 1,
                title: 'Запуск новой образовательной платформы',
                content: 'Академия АНБ представляет обновленную платформу для профессионального развития врачей',
                category: 'development',
                image_url: '/uploads/news-launch.jpg',
                author: 'АНБ Академия',
                views_count: 156,
                created_at: new Date()
            }
        ],
        categories: [
            { id: 1, name: 'Неврология', type: 'courses', color: '#58b8e7', icon: '🧠' },
            { id: 2, name: 'Ортопедия', type: 'courses', color: '#28a745', icon: '🦴' },
            { id: 3, name: 'Реабилитация', type: 'courses', color: '#ffc107', icon: '🏃' }
        ],
        navigation: [
            { id: 1, title: 'Главная', icon: '🏠', image_url: '/uploads/nav-home.jpg', target_page: 'home', position: 1 },
            { id: 2, title: 'Курсы', icon: '📚', image_url: '/uploads/nav-courses.jpg', target_page: 'courses', position: 2 }
        ]
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
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
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
            registrationUrl,
            category,
            level
        } = req.body;
        
        let imageUrl = null;
        let fileUrl = null;
        let videoUrl = null;
        let audioUrl = null;

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
            if (req.files.audio) {
                audioUrl = `/uploads/${req.files.audio[0].filename}`;
            }
        }

        let tableName;
        let query;
        let values;

        switch(contentType) {
            case 'courses':
                tableName = 'courses';
                query = `INSERT INTO ${tableName} (title, description, full_description, duration, price, modules, image_url, file_url, video_url, category, level) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
                values = [title, description, fullDescription, duration, parseInt(price) || 0, parseInt(modules) || 1, imageUrl, fileUrl, videoUrl, category, level];
                break;
                
            case 'podcasts':
                tableName = 'podcasts';
                query = `INSERT INTO ${tableName} (title, description, duration, audio_url, image_url, category) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                values = [title, description, duration, audioUrl, imageUrl, category];
                break;
                
            case 'streams':
                tableName = 'streams';
                query = `INSERT INTO ${tableName} (title, description, stream_url, scheduled_time, image_url, category) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                values = [title, description, videoUrl, eventDate, imageUrl, category];
                break;
                
            case 'videos':
                tableName = 'videos';
                query = `INSERT INTO ${tableName} (title, description, video_url, duration, thumbnail_url, category) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                values = [title, description, videoUrl, duration, imageUrl, category];
                break;
                
            case 'materials':
                tableName = 'materials';
                query = `INSERT INTO ${tableName} (title, description, content, file_url, image_url, material_type, category) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
                values = [title, description, fullDescription, fileUrl, imageUrl, materialType, category];
                break;
                
            case 'events':
                tableName = 'events';
                query = `INSERT INTO ${tableName} (title, description, event_date, location, event_type, image_url, registration_url, category) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
                values = [title, description, eventDate, location, eventType, imageUrl, registrationUrl, category];
                break;
                
            case 'news':
                tableName = 'news';
                query = `INSERT INTO ${tableName} (title, content, category, image_url) 
                         VALUES ($1, $2, $3, $4) RETURNING *`;
                values = [title, fullDescription, category, imageUrl];
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
                completedSurveys: 1,
                totalRevenue: 2900,
                content: {
                    courses: 5,
                    podcasts: 4,
                    streams: 0,
                    videos: 0,
                    materials: 4,
                    events: 0,
                    news: 5
                }
            }
        });
    }

    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE subscription_status IN ($1, $2)', ['active', 'trial']);
        const completedSurveys = await pool.query('SELECT COUNT(*) FROM users WHERE survey_completed = true');
        
        const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
        const podcastsCount = await pool.query('SELECT COUNT(*) FROM podcasts');
        const streamsCount = await pool.query('SELECT COUNT(*) FROM streams');
        const videosCount = await pool.query('SELECT COUNT(*) FROM videos');
        const materialsCount = await pool.query('SELECT COUNT(*) FROM materials');
        const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
        const newsCount = await pool.query('SELECT COUNT(*) FROM news');
        
        // Расчет дохода (примерный)
        const activeSubs = parseInt(activeUsers.rows[0].count);
        const totalRevenue = activeSubs * 2900; // Примерная выручка
        
        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(usersCount.rows[0].count),
                activeUsers: activeSubs,
                completedSurveys: parseInt(completedSurveys.rows[0].count),
                totalRevenue: totalRevenue,
                content: {
                    courses: parseInt(coursesCount.rows[0].count),
                    podcasts: parseInt(podcastsCount.rows[0].count),
                    streams: parseInt(streamsCount.rows[0].count),
                    videos: parseInt(videosCount.rows[0].count),
                    materials: parseInt(materialsCount.rows[0].count),
                    events: parseInt(eventsCount.rows[0].count),
                    news: parseInt(newsCount.rows[0].count)
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
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT id, first_name, last_name, username, specialization, city, email, phone,
                   subscription_status, subscription_type, subscription_end_date,
                   progress_level, progress_data, favorites_data, is_admin, joined_at, survey_completed, profile_image
            FROM users 
        `;
        let countQuery = 'SELECT COUNT(*) FROM users';
        const queryParams = [];
        
        if (search) {
            const whereClause = ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR specialization ILIKE $1`;
            query += whereClause;
            countQuery += whereClause;
            queryParams.push(`%${search}%`);
        }
        
        query += ` ORDER BY joined_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(parseInt(limit), offset);
        
        const [usersResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);
        
        const users = usersResult.rows.map(row => ({
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
            surveyCompleted: row.survey_completed,
            profileImage: row.profile_image
        }));
        
        res.json({ 
            success: true, 
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
            }
        });
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
            joined_at: new Date('2024-01-01'),
            profile_image: '/uploads/admin-avatar.jpg'
        }));
        return res.json({ success: true, data: adminsList });
    }

    try {
        const result = await pool.query(`
            SELECT id, first_name, last_name, username, joined_at, profile_image
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
                    joined_at: new Date('2024-01-01'),
                    profile_image: '/uploads/admin-avatar.jpg'
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
                    image_url: '/uploads/news-launch.jpg',
                    author: 'АНБ Академия',
                    views_count: 156,
                    created_at: new Date()
                }
            ]
        });
    }

    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const result = await pool.query(
            'SELECT * FROM news ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [parseInt(limit), offset]
        );
        
        const countResult = await pool.query('SELECT COUNT(*) FROM news');
        
        res.json({ 
            success: true, 
            news: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
            }
        });
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

// 🗂️ Получение категорий
app.get('/api/categories', async (req, res) => {
    if (!dbConnected) {
        return res.json({
            success: true,
            categories: [
                { id: 1, name: 'Неврология', type: 'courses', color: '#58b8e7', icon: '🧠' },
                { id: 2, name: 'Ортопедия', type: 'courses', color: '#28a745', icon: '🦴' }
            ]
        });
    }

    try {
        const { type } = req.query;
        let query = 'SELECT * FROM categories';
        const queryParams = [];
        
        if (type) {
            query += ' WHERE type = $1';
            queryParams.push(type);
        }
        
        query += ' ORDER BY name';
        
        const result = await pool.query(query, queryParams);
        res.json({ success: true, categories: result.rows });
    } catch (error) {
        console.error('❌ Ошибка получения категорий:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 🧭 Получение навигации
app.get('/api/navigation', async (req, res) => {
    if (!dbConnected) {
        return res.json({
            success: true,
            navigation: [
                { id: 1, title: 'Главная', icon: '🏠', image_url: '/uploads/nav-home.jpg', target_page: 'home', position: 1 },
                { id: 2, title: 'Курсы', icon: '📚', image_url: '/uploads/nav-courses.jpg', target_page: 'courses', position: 2 }
            ]
        });
    }

    try {
        const result = await pool.query('SELECT * FROM navigation_items WHERE is_active = true ORDER BY position');
        res.json({ success: true, navigation: result.rows });
    } catch (error) {
        console.error('❌ Ошибка получения навигации:', error);
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
        version: '3.0.0'
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
        console.log('🚀 Запуск приложения v3.0...');
        
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
