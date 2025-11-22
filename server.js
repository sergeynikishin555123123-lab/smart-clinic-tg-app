// server.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННЫЙ СЕРВЕР
import express from 'express';
import { Telegraf, session, Markup } from 'telegraf';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import compression from 'compression';
import crypto from 'crypto';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== НАСТРОЙКА MULTER ====================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + file.originalname.split('.').pop();
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = {
            'image/jpeg': true,
            'image/jpg': true,
            'image/png': true,
            'image/gif': true,
            'image/webp': true,
            'video/mp4': true,
            'video/mpeg': true,
            'video/quicktime': true,
            'video/webm': true,
            'audio/mpeg': true,
            'audio/mp3': true,
            'audio/wav': true,
            'audio/ogg': true,
            'application/pdf': true,
            'application/msword': true,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
            'text/html': true
        };
        
        if (allowedTypes[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error(`Неподдерживаемый тип файла: ${file.mimetype}`), false);
        }
    }
});

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================

let bot = null;
let pool = null;

// ==================== ИНИЦИАЛИЗАЦИЯ БОТА ====================
  
function initializeBot() {
    if (process.env.BOT_TOKEN) {
        try {
            bot = new Telegraf(process.env.BOT_TOKEN);
            console.log('🤖 Бот инициализирован');
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации бота:', error);
            return false;
        }
    } else {
        console.log('⚠️ Бот не настроен (отсутствует BOT_TOKEN)');
        return false;
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ====================

function initializeDatabase() {
    try {
        console.log('🔧 Настройка подключения к БД...');
        
        const poolConfig = {
            user: process.env.DB_USER || 'gen_user',
            host: process.env.DB_HOST || '45.89.190.49',
            database: process.env.DB_NAME || 'default_db',
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT) || 5432,
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            max: 20,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };

        console.log('📊 Параметры подключения:');
        console.log(`   Host: ${poolConfig.host}`);
        console.log(`   Database: ${poolConfig.database}`);
        console.log(`   User: ${poolConfig.user}`);
        console.log(`   Port: ${poolConfig.port}`);

        pool = new Pool(poolConfig);
        
        // Тестируем подключение
        pool.query('SELECT NOW() as time')
            .then(result => {
                console.log('✅ Тест подключения к БД успешен:', result.rows[0].time);
            })
            .catch(error => {
                console.error('❌ Ошибка тестирования БД:', error.message);
            });

        return true;
    } catch (error) {
        console.error('❌ Ошибка создания пула подключений:', error.message);
        return false;
    }
}

// ==================== MIDDLEWARE ====================

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(compression());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(join(__dirname)));
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/admin', express.static(join(__dirname, 'admin')));

app.use((req, res, next) => {
    if (!pool) {
        return res.status(503).json({ 
            success: false, 
            error: 'База данных недоступна' 
        });
    }
    next();
});

// ==================== БАЗА ДАННЫХ ====================

async function initDatabase() {
    try {
        console.log('🗄️ Проверка структуры базы данных...');
        
        const { rows: tableExists } = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!tableExists[0].exists) {
            console.log('📋 Создаем таблицы...');
            await createTables();
        } else {
            console.log('✅ Таблицы уже существуют');
            await checkTableStructure();
        }
        
        await seedDemoData();
        console.log('✅ База данных готова к работе');
    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error);
    }
}

async function createTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                telegram_id BIGINT UNIQUE,
                first_name VARCHAR(255),
                username VARCHAR(255),
                email VARCHAR(255),
                specialization VARCHAR(255),
                city VARCHAR(255),
                subscription_end DATE,
                is_admin BOOLEAN DEFAULT false,
                is_super_admin BOOLEAN DEFAULT false,
                avatar_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                level VARCHAR(50) DEFAULT 'Понимаю',
                experience INTEGER DEFAULT 1250,
                courses_bought INTEGER DEFAULT 3,
                modules_completed INTEGER DEFAULT 2,
                materials_watched INTEGER DEFAULT 12,
                events_attended INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                content_id INTEGER,
                content_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500),
                description TEXT,
                price INTEGER,
                discount INTEGER DEFAULT 0,
                duration VARCHAR(100),
                modules INTEGER,
                category VARCHAR(255),
                level VARCHAR(50),
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 4.5,
                featured BOOLEAN DEFAULT false,
                image_url VARCHAR(500),
                video_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS podcasts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500),
                description TEXT,
                duration VARCHAR(100),
                category VARCHAR(255),
                listens INTEGER DEFAULT 0,
                image_url VARCHAR(500),
                audio_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500),
                description TEXT,
                duration VARCHAR(100),
                category VARCHAR(255),
                participants INTEGER DEFAULT 0,
                is_live BOOLEAN DEFAULT false,
                thumbnail_url VARCHAR(500),
                video_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS videos (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500),
                description TEXT,
                duration VARCHAR(100),
                category VARCHAR(255),
                views INTEGER DEFAULT 0,
                thumbnail_url VARCHAR(500),
                video_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500),
                description TEXT,
                category VARCHAR(255),
                material_type VARCHAR(100),
                downloads INTEGER DEFAULT 0,
                image_url VARCHAR(500),
                file_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500),
                description TEXT,
                event_type VARCHAR(50),
                event_date TIMESTAMP,
                location VARCHAR(500),
                participants INTEGER DEFAULT 0,
                image_url VARCHAR(500),
                registration_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500),
                description TEXT,
                content TEXT,
                date VARCHAR(100),
                category VARCHAR(255),
                type VARCHAR(100),
                image_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admin_actions (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES users(id),
                action_type VARCHAR(100),
                description TEXT,
                target_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS support_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                topic VARCHAR(255),
                course_id INTEGER,
                message TEXT,
                status VARCHAR(50) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS media_files (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255),
                original_name VARCHAR(255),
                mime_type VARCHAR(100),
                size INTEGER,
                url VARCHAR(500),
                uploaded_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_learning_path (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                current_level VARCHAR(50) DEFAULT 'Понимаю',
                progress_data JSONB DEFAULT '{}',
                completed_requirements JSONB DEFAULT '[]',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                amount INTEGER,
                currency VARCHAR(10) DEFAULT 'RUB',
                status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(100),
                transaction_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Таблицы созданы');
    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error);
        throw error;
    }
}

async function checkTableStructure() {
    try {
        const tablesToCheck = [
            { table: 'users', columns: ['telegram_id', 'avatar_url'] },
            { table: 'courses', columns: ['is_active'] },
            { table: 'podcasts', columns: ['is_active'] },
            { table: 'streams', columns: ['is_active'] },
            { table: 'videos', columns: ['is_active'] },
            { table: 'materials', columns: ['is_active'] },
            { table: 'events', columns: ['is_active'] },
            { table: 'news', columns: ['is_active'] }
        ];

        for (const { table, columns } of tablesToCheck) {
            for (const column of columns) {
                const { rows: columnExists } = await pool.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND table_name = $1 
                        AND column_name = $2
                    );
                `, [table, column]);
                
                if (!columnExists[0].exists) {
                    console.log(`🔄 Добавляем колонку ${column} в таблицу ${table}...`);
                    
                    let columnType = 'VARCHAR(500)';
                    if (column === 'telegram_id') columnType = 'BIGINT';
                    if (column === 'is_active') columnType = 'BOOLEAN DEFAULT true';
                    
                    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnType}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка проверки структуры таблиц:', error);
    }
}

async function seedDemoData() {
    try {
        // Демо-курсы
        const { rows: courseCount } = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(courseCount[0].count) === 0) {
            console.log('📚 Добавляем демо-курсы...');
            await pool.query(`
                INSERT INTO courses (title, description, price, discount, duration, modules, category, level, students_count, rating, featured, image_url, video_url) VALUES
                ('Мануальные техники в практике невролога', '6 модулей по современным мануальным методикам', 25000, 16, '12 недель', 6, 'Мануальные техники', 'advanced', 156, 4.8, true, '/webapp/assets/course-default.jpg', 'https://example.com/video1'),
                ('Неврологическая диагностика', '5 модулей по современной диагностике', 18000, 0, '8 недель', 5, 'Неврология', 'intermediate', 234, 4.6, true, '/webapp/assets/course-default.jpg', 'https://example.com/video2'),
                ('Реабилитация пациентов с инсультом', '4 модуля по современным методикам реабилитации', 22000, 10, '10 недель', 4, 'Реабилитация', 'intermediate', 189, 4.7, false, '/webapp/assets/course-default.jpg', 'https://example.com/video3')
            `);
        }

        // Демо-подкасты
        const { rows: podcastCount } = await pool.query('SELECT COUNT(*) FROM podcasts');
        if (parseInt(podcastCount[0].count) === 0) {
            console.log('🎧 Добавляем демо-подкасты...');
            await pool.query(`
                INSERT INTO podcasts (title, description, duration, category, listens, image_url, audio_url) VALUES
                ('АНБ FM: Современная неврология', 'Обсуждение новых тенденций в неврологии', '45:20', 'Неврология', 2345, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio1'),
                ('Мануальная терапия: мифы и реальность', 'Разбор популярных заблуждений', '38:15', 'Мануальные техники', 1876, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio2')
            `);
        }

        // Демо-стримы
        const { rows: streamCount } = await pool.query('SELECT COUNT(*) FROM streams');
        if (parseInt(streamCount[0].count) === 0) {
            console.log('📹 Добавляем демо-стримы...');
            await pool.query(`
                INSERT INTO streams (title, description, duration, category, participants, is_live, thumbnail_url, video_url) VALUES
                ('Разбор сложного случая: боли в спине', 'Детальный разбор диагностики и лечения', '1:25:00', 'Неврология', 89, false, '/webapp/assets/stream-default.jpg', 'https://example.com/stream1'),
                ('LIVE: Ответы на вопросы по мануальной терапии', 'Прямой эфир с ответами на вопросы', '2:15:00', 'Мануальные техники', 156, true, '/webapp/assets/stream-default.jpg', 'https://example.com/stream2')
            `);
        }

        // Демо-видео
        const { rows: videoCount } = await pool.query('SELECT COUNT(*) FROM videos');
        if (parseInt(videoCount[0].count) === 0) {
            console.log('🎯 Добавляем демо-видео...');
            await pool.query(`
                INSERT INTO videos (title, description, duration, category, views, thumbnail_url, video_url) VALUES
                ('Техника мобилизации шейного отдела', 'Практическая демонстрация техники', '8:30', 'Мануальные техники', 567, '/webapp/assets/video-default.jpg', 'https://example.com/video5'),
                ('Неврологический осмотр: основные приемы', 'Базовые приемы неврологического осмотра', '12:15', 'Неврология', 892, '/webapp/assets/video-default.jpg', 'https://example.com/video6')
            `);
        }

        // Демо-материалы
        const { rows: materialCount } = await pool.query('SELECT COUNT(*) FROM materials');
        if (parseInt(materialCount[0].count) === 0) {
            console.log('📋 Добавляем демо-материалы...');
            await pool.query(`
                INSERT INTO materials (title, description, category, material_type, downloads, image_url, file_url) VALUES
                ('Чек-лист неврологического осмотра', 'Полный чек-лист для стандартного осмотра', 'Неврология', 'checklist', 234, '/webapp/assets/material-default.jpg', 'https://example.com/material1.pdf'),
                ('Протокол ведения пациентов с болями в спине', 'Стандартизированный протокол диагностики и лечения', 'Неврология', 'protocol', 189, '/webapp/assets/material-default.jpg', 'https://example.com/material2.pdf')
            `);
        }

        // Демо-мероприятия
        const { rows: eventCount } = await pool.query('SELECT COUNT(*) FROM events');
        if (parseInt(eventCount[0].count) === 0) {
            console.log('🗺️ Добавляем демо-мероприятия...');
            await pool.query(`
                INSERT INTO events (title, description, event_type, event_date, location, participants, image_url, registration_url) VALUES
                ('Конференция по современной неврологии', 'Ежегодная конференция с ведущими специалистами', 'offline', '2024-12-15 10:00:00', 'Москва, ул. Профессиональная, 15', 250, '/webapp/assets/event-default.jpg', 'https://example.com/register1'),
                ('Онлайн-семинар по мануальной терапии', 'Практический семинар с разбором техник', 'online', '2024-12-10 14:00:00', 'Онлайн', 180, '/webapp/assets/event-default.jpg', 'https://example.com/register2')
            `);
        }

        // Демо-новости
        const { rows: newsCount } = await pool.query('SELECT COUNT(*) FROM news');
        if (parseInt(newsCount[0].count) === 0) {
            console.log('📰 Добавляем демо-новости...');
            await pool.query(`
                INSERT INTO news (title, description, content, date, category, type, image_url) VALUES
                ('Новые методики в реабилитации пациентов с инсультом', 'Обзор современных подходов к реабилитации пациентов с неврологическими нарушениями', 'Полный текст статьи о новых методиках...', '15 дек 2024', 'Реабилитация', 'Статья', '/webapp/assets/news-default.jpg'),
                ('Обновление курса по мануальной терапии', 'Добавлены новые модули по работе с шейным отделом позвоночника', 'Детали обновления курса...', '12 дек 2024', 'Мануальные техники', 'Обновление', '/webapp/assets/news-default.jpg')
            `);
        }

    } catch (error) {
        console.error('❌ Ошибка добавления демо-данных:', error);
    }
}

// ==================== TELEGRAM BOT ====================

function setupBot() {
    if (!bot) {
        console.log('🤖 Бот не настроен');
        return;
    }

    const stopBot = () => {
        console.log('🛑 Остановка бота...');
        if (bot) {
            bot.stop();
        }
    };

    process.once('SIGINT', stopBot);
    process.once('SIGTERM', stopBot);

    bot.use(session());

    // Команда /start
    bot.start(async (ctx) => {
        const userId = ctx.from.id;
        const userName = ctx.from.first_name;
        
        try {
            const { rows: existingUser } = await pool.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [userId]
            );
            
            if (existingUser.length === 0) {
                await pool.query(
                    `INSERT INTO users (telegram_id, first_name, username, is_admin, is_super_admin) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [userId, userName, ctx.from.username, 
                     userId == process.env.SUPER_ADMIN_ID, 
                     userId == process.env.SUPER_ADMIN_ID]
                );
                console.log(`✅ Создан новый пользователь: ${userName}`);
            } else {
                await pool.query(
                    `UPDATE users SET first_name = $1, username = $2 WHERE telegram_id = $3`,
                    [userName, ctx.from.username, userId]
                );
                console.log(`✅ Обновлен пользователь: ${userName}`);
            }

            const welcomeText = `👋 Добро пожаловать в Академию АНБ, ${userName}!`;

            await ctx.reply(welcomeText, {
                reply_markup: {
                    keyboard: [
                        ['📱 Открыть Академию', '📚 Курсы'],
                        ['🎧 АНБ FM', '📹 Эфиры и разборы'],
                        ['👤 Мой профиль', '🆘 Поддержка'],
                        ['🔧 Админ-панель']
                    ],
                    resize_keyboard: true
                }
            });

        } catch (error) {
            console.error('Ошибка при старте бота:', error);
            await ctx.reply(`👋 Привет, ${userName}! Добро пожаловать в Академию АНБ! 🎓`, {
                reply_markup: {
                    keyboard: [
                        ['📱 Открыть Академию', '📚 Курсы'],
                        ['🎧 АНБ FM', '📹 Эфиры и разборы'],
                        ['👤 Мой профиль', '🆘 Поддержка'],
                        ['🔧 Админ-панель']
                    ],
                    resize_keyboard: true
                }
            });
        }
    });

    // Обработка текстовых сообщений
    bot.on('text', async (ctx) => {
        const text = ctx.message.text;
        const userId = ctx.from.id;
        
        try {
            const { rows: users } = await pool.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [userId]
            );
            const user = users[0];
            
            switch(text) {
                case '📱 Открыть Академию':
                    await ctx.reply('Открываю Академию АНБ...', {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '🚀 Открыть Академию',
                                web_app: { url: process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/` }
                            }]]
                        }
                    });
                    break;
                    
                case '📚 Курсы':
                    await ctx.reply('Открываю курсы...', {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '📚 Все курсы',
                                web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/webapp/#courses` }
                            }]]
                        }
                    });
                    break;
                    
                case '🎧 АНБ FM':
                    await ctx.reply('Открываю подкасты...', {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '🎧 АНБ FM',
                                web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/webapp/#podcasts` }
                            }]]
                        }
                    });
                    break;
                    
                case '👤 Мой профиль':
                    await ctx.reply('Открываю профиль...', {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '👤 Мой профиль',
                                web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/webapp/#profile` }
                            }]]
                        }
                    });
                    break;
                    
                case '🔧 Админ-панель':
                    if (user && (user.is_admin || user.is_super_admin)) {
                        await ctx.reply('Открываю админ-панель...', {
                            reply_markup: {
                                inline_keyboard: [[{
                                    text: '🔧 Админ-панель',
                                    web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/admin/` }
                                }]]
                            }
                        });
                    } else {
                        await ctx.reply('❌ У вас нет доступа к админ-панели');
                    }
                    break;
                    
                case '🆘 Поддержка':
                    await ctx.reply('Если у вас возникли вопросы или проблемы, напишите нам: @academy_anb');
                    break;
                    
                default:
                    await ctx.reply('Используйте кнопки меню для навигации по Академии 🎓');
            }
        } catch (error) {
            console.error('Ошибка обработки сообщения:', error);
            await ctx.reply('Произошла ошибка. Попробуйте еще раз.');
        }
    });

    // Команда /menu
    bot.command('menu', (ctx) => {
        ctx.reply('Главное меню Академии АНБ:', {
            reply_markup: {
                keyboard: [
                    ['📱 Открыть Академию', '📚 Курсы'],
                    ['🎧 АНБ FM', '📹 Эфиры и разборы'],
                    ['👤 Мой профиль', '🆘 Поддержка'],
                    ['🔧 Админ-панель']
                ],
                resize_keyboard: true
            }
        });
    });

    // Команда /admin
    bot.command('admin', async (ctx) => {
        const userId = ctx.from.id;
        
        try {
            const { rows: users } = await pool.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [userId]
            );
            const user = users[0];
            
            if (user && (user.is_admin || user.is_super_admin)) {
                await ctx.reply('Открываю админ-панель...', {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '🔧 Админ-панель',
                            web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/admin/` }
                        }]]
                    }
                });
            } else {
                await ctx.reply('❌ У вас нет доступа к админ-панели');
            }
        } catch (error) {
            console.error('Ошибка проверки прав админа:', error);
            await ctx.reply('❌ Ошибка проверки доступа');
        }
    });

    // Запуск бота
    bot.launch().then(() => {
        console.log('✅ Telegram Bot запущен');
    }).catch(error => {
        console.error('❌ Ошибка запуска бота:', error.message);
        
        if (error.message.includes('409') || error.message.includes('Conflict')) {
            console.log('🔄 Перезапуск бота через 10 секунд...');
            setTimeout(() => {
                setupBot();
            }, 10000);
        }
    });
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'ANB Academy API',
        version: '2.0.0'
    });
});

// Database health check
app.get('/api/db-health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ 
            success: true, 
            database: 'connected',
            time: result.rows[0].time 
        });
    } catch (error) {
        res.status(503).json({ 
            success: false, 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// ==================== МЕДИА ОБРАБОТЧИКИ ====================

// Загрузка файлов
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Файл не загружен' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        
        const { rows } = await pool.query(
            'INSERT INTO media_files (filename, original_name, mime_type, size, url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, fileUrl]
        );

        res.json({ 
            success: true, 
            file: rows[0],
            url: fileUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки файла' });
    }
});

// Получение списка медиа файлов
app.get('/api/media', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM media_files ORDER BY created_at DESC');
        res.json({ success: true, files: rows });
    } catch (error) {
        console.error('Media list error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки медиа' });
    }
});

// Удаление медиа файла
app.delete('/api/media/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM media_files WHERE id = $1', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Файл не найден' });
        }

        const filePath = join(__dirname, 'uploads', rows[0].filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await pool.query('DELETE FROM media_files WHERE id = $1', [id]);
        res.json({ success: true, message: 'Файл удален' });
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({ success: false, error: 'Ошибка удаления файла' });
    }
});

// ==================== КОНТЕНТ API ====================

// Получение всего контента
app.get('/api/content', async (req, res) => {
    try {
        const [
            coursesResult,
            podcastsResult,
            streamsResult,
            videosResult,
            materialsResult,
            eventsResult,
            newsResult,
            userCountResult
        ] = await Promise.all([
            pool.query('SELECT * FROM courses WHERE is_active = true ORDER BY created_at DESC'),
            pool.query('SELECT * FROM podcasts WHERE is_active = true ORDER BY created_at DESC'),
            pool.query('SELECT * FROM streams WHERE is_active = true ORDER BY created_at DESC'),
            pool.query('SELECT * FROM videos WHERE is_active = true ORDER BY created_at DESC'),
            pool.query('SELECT * FROM materials WHERE is_active = true ORDER BY created_at DESC'),
            pool.query('SELECT * FROM events WHERE is_active = true ORDER BY created_at DESC'),
            pool.query('SELECT * FROM news WHERE is_active = true ORDER BY created_at DESC'),
            pool.query('SELECT COUNT(*) FROM users')
        ]);

        const content = {
            courses: coursesResult.rows || [],
            podcasts: podcastsResult.rows || [],
            streams: streamsResult.rows || [],
            videos: videosResult.rows || [],
            materials: materialsResult.rows || [],
            events: eventsResult.rows || [],
            news: newsResult.rows || [],
            stats: {
                totalUsers: parseInt(userCountResult.rows[0]?.count) || 1567,
                totalCourses: coursesResult.rows?.length || 0,
                totalMaterials: materialsResult.rows?.length || 0,
                totalEvents: eventsResult.rows?.length || 0
            }
        };

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('API Content error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки контента' });
    }
});

// Получение конкретного контента по ID и типу
app.get('/api/content/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const tableMap = {
            'courses': 'courses',
            'podcasts': 'podcasts',
            'streams': 'streams',
            'videos': 'videos',
            'materials': 'materials',
            'events': 'events',
            'news': 'news'
        };

        const table = tableMap[type];
        if (!table) {
            return res.status(400).json({ success: false, error: 'Неверный тип контента' });
        }

        const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1 AND is_active = true`, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Контент не найден' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Content detail error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки контента' });
    }
});

// ==================== ПОЛЬЗОВАТЕЛИ API ====================

// Создание/обновление пользователя
app.post('/api/user', async (req, res) => {
    try {
        const { user: tgUser } = req.body;
        
        if (!tgUser || !tgUser.id) {
            return res.status(400).json({ success: false, error: 'Неверные данные пользователя' });
        }

        const { rows: users } = await pool.query(
            `INSERT INTO users (telegram_id, first_name, username, is_admin, is_super_admin) 
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (telegram_id) 
             DO UPDATE SET first_name = $2, username = $3
             RETURNING *`,
            [tgUser.id, tgUser.first_name, tgUser.username, 
             tgUser.id == process.env.SUPER_ADMIN_ID, 
             tgUser.id == process.env.SUPER_ADMIN_ID]
        );

        const user = users[0];

        // Получаем или создаем прогресс пользователя
        const { rows: progress } = await pool.query(
            `INSERT INTO user_progress (user_id) 
             VALUES ($1)
             ON CONFLICT (user_id) 
             DO UPDATE SET updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [user.id]
        );

        // Получаем избранное пользователя
        const { rows: favorites } = await pool.query(
            'SELECT * FROM favorites WHERE user_id = $1',
            [user.id]
        );

        // Получаем путь обучения
        const { rows: learningPath } = await pool.query(
            'SELECT * FROM user_learning_path WHERE user_id = $1',
            [user.id]
        );

        const userFavorites = {
            courses: favorites.filter(f => f.content_type === 'courses').map(f => f.content_id),
            podcasts: favorites.filter(f => f.content_type === 'podcasts').map(f => f.content_id),
            streams: favorites.filter(f => f.content_type === 'streams').map(f => f.content_id),
            videos: favorites.filter(f => f.content_type === 'videos').map(f => f.content_id),
            materials: favorites.filter(f => f.content_type === 'materials').map(f => f.content_id),
            events: favorites.filter(f => f.content_type === 'events').map(f => f.content_id)
        };

        const userProgress = progress[0] || {
            level: 'Понимаю',
            experience: 1250,
            courses_bought: 3,
            modules_completed: 2,
            materials_watched: 12,
            events_attended: 1
        };

        const learningPathData = learningPath[0] || {
            current_level: 'Понимаю',
            progress_data: {},
            completed_requirements: []
        };

        const userData = {
            id: user.id,
            telegramId: user.telegram_id,
            firstName: user.first_name,
            username: user.username,
            isAdmin: user.is_admin,
            isSuperAdmin: user.is_super_admin,
            subscriptionEnd: user.subscription_end,
            avatarUrl: user.avatar_url,
            favorites: userFavorites,
            progress: {
                level: userProgress.level,
                experience: userProgress.experience,
                steps: {
                    coursesBought: userProgress.courses_bought,
                    modulesCompleted: userProgress.modules_completed,
                    materialsWatched: userProgress.materials_watched,
                    eventsAttended: userProgress.events_attended
                }
            },
            learningPath: learningPathData
        };

        res.json({ success: true, user: userData });
    } catch (error) {
        console.error('API User error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки пользователя' });
    }
});

// Обновление прогресса пользователя
app.post('/api/user/progress', async (req, res) => {
    try {
        const { userId, progressData } = req.body;
        
        await pool.query(
            `INSERT INTO user_progress (user_id, level, experience, courses_bought, modules_completed, materials_watched, events_attended)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                level = $2, 
                experience = $3, 
                courses_bought = $4, 
                modules_completed = $5, 
                materials_watched = $6, 
                events_attended = $7,
                updated_at = CURRENT_TIMESTAMP`,
            [
                userId,
                progressData.level,
                progressData.experience,
                progressData.coursesBought,
                progressData.modulesCompleted,
                progressData.materialsWatched,
                progressData.eventsAttended
            ]
        );

        res.json({ success: true, message: 'Прогресс обновлен' });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления прогресса' });
    }
});

// ==================== ИЗБРАННОЕ API ====================

// Переключение избранного
app.post('/api/favorites/toggle', async (req, res) => {
    try {
        const { userId, contentId, contentType } = req.body;
        
        const { rows: existing } = await pool.query(
            'SELECT * FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
            [userId, contentId, contentType]
        );

        if (existing.length > 0) {
            await pool.query(
                'DELETE FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
                [userId, contentId, contentType]
            );
            res.json({ success: true, action: 'removed' });
        } else {
            await pool.query(
                'INSERT INTO favorites (user_id, content_id, content_type) VALUES ($1, $2, $3)',
                [userId, contentId, contentType]
            );
            res.json({ success: true, action: 'added' });
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления избранного' });
    }
});

// Получение избранного пользователя
app.get('/api/favorites/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const { rows: favorites } = await pool.query(
            'SELECT * FROM favorites WHERE user_id = $1',
            [userId]
        );

        const userFavorites = {
            courses: favorites.filter(f => f.content_type === 'courses').map(f => f.content_id),
            podcasts: favorites.filter(f => f.content_type === 'podcasts').map(f => f.content_id),
            streams: favorites.filter(f => f.content_type === 'streams').map(f => f.content_id),
            videos: favorites.filter(f => f.content_type === 'videos').map(f => f.content_id),
            materials: favorites.filter(f => f.content_type === 'materials').map(f => f.content_id),
            events: favorites.filter(f => f.content_type === 'events').map(f => f.content_id)
        };

        res.json({ success: true, favorites: userFavorites });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки избранного' });
    }
});

// ==================== АДМИН API ====================

// Получение статистики для админ-панели
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [
            userCount,
            courseCount,
            materialCount,
            eventCount,
            activeUsers
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM users'),
            pool.query('SELECT COUNT(*) FROM courses'),
            pool.query('SELECT COUNT(*) FROM materials'),
            pool.query('SELECT COUNT(*) FROM events'),
            pool.query('SELECT COUNT(*) FROM users WHERE subscription_end > NOW()')
        ]);
        
        const stats = {
            totalUsers: parseInt(userCount.rows[0].count),
            totalCourses: parseInt(courseCount.rows[0].count),
            totalMaterials: parseInt(materialCount.rows[0].count),
            totalEvents: parseInt(eventCount.rows[0].count),
            activeSubscriptions: parseInt(activeUsers.rows[0].count)
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки статистики' });
    }
});

// Получение всех пользователей
app.get('/api/admin/users', async (req, res) => {
    try {
        const { rows: users } = await pool.query(`
            SELECT u.*, up.level, up.experience 
            FROM users u 
            LEFT JOIN user_progress up ON u.id = up.user_id 
            ORDER BY u.created_at DESC
        `);
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки пользователей' });
    }
});

// Создание контента
app.post('/api/admin/content/:type', upload.single('file'), async (req, res) => {
    try {
        const { type } = req.params;
        const data = req.body;
        
        let query = '';
        let values = [];
        let fileUrl = null;

        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
        }

        switch (type) {
            case 'courses':
                query = `INSERT INTO courses (title, description, price, discount, duration, modules, category, level, image_url, video_url) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    parseInt(data.price), 
                    parseInt(data.discount || 0), 
                    data.duration, 
                    parseInt(data.modules), 
                    data.category, 
                    data.level, 
                    data.image_url || fileUrl, 
                    data.video_url
                ];
                break;

            case 'podcasts':
                query = `INSERT INTO podcasts (title, description, duration, category, image_url, audio_url) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    data.duration, 
                    data.category, 
                    data.image_url || fileUrl, 
                    data.audio_url || fileUrl
                ];
                break;

            case 'videos':
                query = `INSERT INTO videos (title, description, duration, category, thumbnail_url, video_url) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    data.duration, 
                    data.category, 
                    data.thumbnail_url || fileUrl, 
                    data.video_url || fileUrl
                ];
                break;

            case 'materials':
                query = `INSERT INTO materials (title, description, category, material_type, image_url, file_url) 
                         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    data.category, 
                    data.material_type, 
                    data.image_url || fileUrl, 
                    data.file_url || fileUrl
                ];
                break;

            case 'events':
                query = `INSERT INTO events (title, description, event_type, event_date, location, image_url, registration_url) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    data.event_type, 
                    data.event_date, 
                    data.location, 
                    data.image_url || fileUrl, 
                    data.registration_url
                ];
                break;

            case 'news':
                query = `INSERT INTO news (title, description, content, date, category, type, image_url) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    data.content, 
                    data.date, 
                    data.category, 
                    data.type, 
                    data.image_url || fileUrl
                ];
                break;

            default:
                return res.status(400).json({ success: false, error: 'Неверный тип контента' });
        }
        
        const { rows } = await pool.query(query, values);
        
        // Логируем действие админа
        await pool.query(
            'INSERT INTO admin_actions (admin_id, action_type, description, target_id) VALUES ($1, $2, $3, $4)',
            [data.adminId, 'create', `Создан ${type}: ${data.title}`, rows[0].id]
        );

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Admin content creation error:', error);
        res.status(500).json({ success: false, error: 'Ошибка создания контента' });
    }
});

// Обновление контента
app.put('/api/admin/content/:type/:id', upload.single('file'), async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = req.body;
        
        let query = '';
        let values = [];
        let fileUrl = null;

        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
        }

        switch (type) {
            case 'courses':
                query = `UPDATE courses SET title=$1, description=$2, price=$3, discount=$4, duration=$5, modules=$6, category=$7, level=$8, image_url=$9, video_url=$10, updated_at=CURRENT_TIMESTAMP WHERE id=$11 RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    parseInt(data.price), 
                    parseInt(data.discount || 0), 
                    data.duration, 
                    parseInt(data.modules), 
                    data.category, 
                    data.level, 
                    data.image_url || fileUrl, 
                    data.video_url,
                    id
                ];
                break;

            case 'podcasts':
                query = `UPDATE podcasts SET title=$1, description=$2, duration=$3, category=$4, image_url=$5, audio_url=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7 RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    data.duration, 
                    data.category, 
                    data.image_url || fileUrl, 
                    data.audio_url || fileUrl,
                    id
                ];
                break;

            case 'videos':
                query = `UPDATE videos SET title=$1, description=$2, duration=$3, category=$4, thumbnail_url=$5, video_url=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7 RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    data.duration, 
                    data.category, 
                    data.thumbnail_url || fileUrl, 
                    data.video_url || fileUrl,
                    id
                ];
                break;

            case 'materials':
                query = `UPDATE materials SET title=$1, description=$2, category=$3, material_type=$4, image_url=$5, file_url=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7 RETURNING *`;
                values = [
                    data.title, 
                    data.description, 
                    data.category, 
                    data.material_type, 
                    data.image_url || fileUrl, 
                    data.file_url || fileUrl,
                    id
                ];
                break;

            default:
                return res.status(400).json({ success: false, error: 'Неверный тип контента' });
        }
        
        const { rows } = await pool.query(query, values);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Контент не найден' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Admin content update error:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления контента' });
    }
});

// Удаление контента
app.delete('/api/admin/content/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const tableMap = {
            'courses': 'courses',
            'podcasts': 'podcasts',
            'streams': 'streams',
            'videos': 'videos',
            'materials': 'materials',
            'events': 'events',
            'news': 'news'
        };

        const table = tableMap[type];
        if (!table) {
            return res.status(400).json({ success: false, error: 'Неверный тип контента' });
        }

        const { rows } = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Контент не найден' });
        }

        res.json({ success: true, message: 'Контент удален' });
    } catch (error) {
        console.error('Admin content delete error:', error);
        res.status(500).json({ success: false, error: 'Ошибка удаления контента' });
    }
});

// ==================== ПЛАТЕЖИ И ПОДПИСКИ ====================

// Создание платежа
app.post('/api/payments/create', async (req, res) => {
    try {
        const { userId, amount, paymentMethod } = req.body;
        
        const transactionId = crypto.randomBytes(16).toString('hex');
        
        const { rows } = await pool.query(
            'INSERT INTO payments (user_id, amount, payment_method, transaction_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, amount, paymentMethod, transactionId]
        );

        res.json({ 
            success: true, 
            payment: rows[0],
            paymentUrl: `/payments/process/${transactionId}`
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ success: false, error: 'Ошибка создания платежа' });
    }
});

// Обновление подписки
app.post('/api/subscription/update', async (req, res) => {
    try {
        const { userId, months } = req.body;
        
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);
        
        await pool.query(
            'UPDATE users SET subscription_end = $1 WHERE id = $2',
            [endDate, userId]
        );

        res.json({ 
            success: true, 
            message: 'Подписка обновлена',
            subscriptionEnd: endDate
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления подписки' });
    }
});

// ==================== SPA FALLBACK ====================

app.get('/webapp*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.get('/admin*', (req, res) => {
    res.sendFile(join(__dirname, 'admin', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================

async function startServer() {
    try {
        console.log('🚀 Запуск Академии АНБ...');
        
        // Инициализация базы данных
        initializeDatabase();
        await initDatabase();
        
        // Инициализация бота
        initializeBot();
        if (bot) {
            setupBot();
        }
        
        // Запуск сервера
        app.listen(PORT, '0.0.0.0', () => {
            console.log('====================================');
            console.log('🚀 Сервер Академии АНБ запущен!');
            console.log('====================================');
            console.log(`📍 Порт: ${PORT}`);
            console.log(`📱 WebApp: ${process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/`}`);
            console.log(`🔧 Админ-панель: ${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/admin/`);
            console.log(`🤖 Bot: ${bot ? 'активен' : 'не настроен'}`);
            console.log(`🗄️ База данных: подключена`);
            console.log(`📁 Загрузка файлов: доступна`);
            console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
            console.log('====================================');
        });
        
    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error);
        process.exit(1);
    }
}

startServer();
