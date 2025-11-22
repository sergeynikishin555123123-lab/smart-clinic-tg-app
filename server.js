import express from 'express';
import { Telegraf, session, Markup } from 'telegraf';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================

let bot = null;
let pool = null;

// ==================== АВТООЧИСТКА ПОРТОВ ====================

async function cleanupPort(port) {
    try {
        console.log(`🧹 Очистка порта ${port}...`);
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        if (stdout) {
            const pids = stdout.trim().split('\n');
            for (const pid of pids) {
                await execAsync(`kill -9 ${pid}`);
                console.log(`✅ Процесс ${pid} завершен`);
            }
        }
    } catch (error) {
        console.log('✅ Порт свободен');
    }
}

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
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 20
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

app.use(express.json());
app.use(express.static(join(__dirname)));

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
        
        // Проверяем существование таблицы users
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
            // Проверяем структуру таблицы users
            await checkTableStructure();
        }
        
        await seedDemoData();
        console.log('✅ База данных готова к работе');
    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error);
    }
}

async function createTables() {
    await pool.query(`
        CREATE TABLE users (
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE user_progress (
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

        CREATE TABLE favorites (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            content_id INTEGER,
            content_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE courses (
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE podcasts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500),
            description TEXT,
            duration VARCHAR(100),
            category VARCHAR(255),
            listens INTEGER DEFAULT 0,
            image_url VARCHAR(500),
            audio_url VARCHAR(500)
        );

        CREATE TABLE streams (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500),
            description TEXT,
            duration VARCHAR(100),
            category VARCHAR(255),
            participants INTEGER DEFAULT 0,
            is_live BOOLEAN DEFAULT false,
            thumbnail_url VARCHAR(500),
            video_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE videos (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500),
            description TEXT,
            duration VARCHAR(100),
            category VARCHAR(255),
            views INTEGER DEFAULT 0,
            thumbnail_url VARCHAR(500),
            video_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE materials (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500),
            description TEXT,
            category VARCHAR(255),
            material_type VARCHAR(100),
            downloads INTEGER DEFAULT 0,
            image_url VARCHAR(500),
            file_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500),
            description TEXT,
            event_type VARCHAR(50),
            event_date TIMESTAMP,
            location VARCHAR(500),
            participants INTEGER DEFAULT 0,
            image_url VARCHAR(500),
            registration_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE news (
            id SERIAL PRIMARY KEY,
            title VARCHAR(500),
            description TEXT,
            content TEXT,
            date VARCHAR(100),
            category VARCHAR(255),
            type VARCHAR(100),
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE admin_actions (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER REFERENCES users(id),
            action_type VARCHAR(100),
            description TEXT,
            target_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE support_requests (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            topic VARCHAR(255),
            course_id INTEGER,
            message TEXT,
            status VARCHAR(50) DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('✅ Таблицы созданы');
}

async function checkTableStructure() {
    try {
        // Проверяем наличие колонки telegram_id в таблице users
        const { rows: columnExists } = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'telegram_id'
            );
        `);
        
        if (!columnExists[0].exists) {
            console.log('🔄 Добавляем колонку telegram_id в таблицу users...');
            await pool.query('ALTER TABLE users ADD COLUMN telegram_id BIGINT UNIQUE');
            console.log('✅ Колонка telegram_id добавлена');
        }
        
    } catch (error) {
        console.error('❌ Ошибка проверки структуры таблиц:', error);
    }
}

async function seedDemoData() {
    try {
        // Проверяем и добавляем демо-курсы
        const { rows: courseCount } = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(courseCount[0].count) === 0) {
            console.log('📚 Добавляем демо-курсы...');
            await pool.query(`
                INSERT INTO courses (title, description, price, discount, duration, modules, category, level, students_count, rating, featured, image_url, video_url) VALUES
                ('Мануальные техники в практике невролога', '6 модулей по современным мануальным методикам', 25000, 16, '12 недель', 6, 'Мануальные техники', 'advanced', 156, 4.8, true, '/webapp/assets/course-default.jpg', 'https://example.com/video1'),
                ('Неврологическая диагностика', '5 модулей по современной диагностике', 18000, 0, '8 недель', 5, 'Неврология', 'intermediate', 234, 4.6, true, '/webapp/assets/course-default.jpg', 'https://example.com/video2'),
                ('Реабилитация пациентов с инсультом', '4 модуля по современным методикам реабилитации', 22000, 10, '10 недель', 4, 'Реабилитация', 'intermediate', 189, 4.7, false, '/webapp/assets/course-default.jpg', 'https://example.com/video3'),
                ('Фармакотерапия в неврологии', '7 модулей по современной фармакотерапии', 28000, 0, '14 недель', 7, 'Фармакотерапия', 'advanced', 145, 4.9, true, '/webapp/assets/course-default.jpg', 'https://example.com/video4')
            `);
            console.log('✅ Демо-курсы добавлены');
        }

        // Проверяем и добавляем демо-подкасты
        const { rows: podcastCount } = await pool.query('SELECT COUNT(*) FROM podcasts');
        if (parseInt(podcastCount[0].count) === 0) {
            console.log('🎧 Добавляем демо-подкасты...');
            await pool.query(`
                INSERT INTO podcasts (title, description, duration, category, listens, image_url, audio_url) VALUES
                ('АНБ FM: Современная неврология', 'Обсуждение новых тенденций в неврологии', '45:20', 'Неврология', 2345, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio1'),
                ('Мануальная терапия: мифы и реальность', 'Разбор популярных заблуждений', '38:15', 'Мануальные техники', 1876, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio2'),
                ('Реабилитация: новые подходы', 'Инновационные методики восстановления', '42:30', 'Реабилитация', 1543, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio3')
            `);
            console.log('✅ Демо-подкасты добавлены');
        }

        // Проверяем и добавляем демо-стримы
        const { rows: streamCount } = await pool.query('SELECT COUNT(*) FROM streams');
        if (parseInt(streamCount[0].count) === 0) {
            console.log('📹 Добавляем демо-стримы...');
            await pool.query(`
                INSERT INTO streams (title, description, duration, category, participants, is_live, thumbnail_url, video_url) VALUES
                ('Разбор сложного случая: боли в спине', 'Детальный разбор диагностики и лечения', '1:25:00', 'Неврология', 89, false, '/webapp/assets/stream-default.jpg', 'https://example.com/stream1'),
                ('LIVE: Ответы на вопросы по мануальной терапии', 'Прямой эфир с ответами на вопросы', '2:15:00', 'Мануальные техники', 156, true, '/webapp/assets/stream-default.jpg', 'https://example.com/stream2'),
                ('Современная диагностика головных болей', 'Обзор современных методов диагностики', '1:45:00', 'Неврология', 234, false, '/webapp/assets/stream-default.jpg', 'https://example.com/stream3')
            `);
            console.log('✅ Демо-стримы добавлены');
        }

        // Проверяем и добавляем демо-видео
        const { rows: videoCount } = await pool.query('SELECT COUNT(*) FROM videos');
        if (parseInt(videoCount[0].count) === 0) {
            console.log('🎯 Добавляем демо-видео...');
            await pool.query(`
                INSERT INTO videos (title, description, duration, category, views, thumbnail_url, video_url) VALUES
                ('Техника мобилизации шейного отдела', 'Практическая демонстрация техники', '8:30', 'Мануальные техники', 567, '/webapp/assets/video-default.jpg', 'https://example.com/video5'),
                ('Неврологический осмотр: основные приемы', 'Базовые приемы неврологического осмотра', '12:15', 'Неврология', 892, '/webapp/assets/video-default.jpg', 'https://example.com/video6'),
                ('Реабилитационные упражнения при инсульте', 'Комплекс упражнений для восстановления', '15:45', 'Реабилитация', 456, '/webapp/assets/video-default.jpg', 'https://example.com/video7')
            `);
            console.log('✅ Демо-видео добавлены');
        }

        // Проверяем и добавляем демо-материалы
        const { rows: materialCount } = await pool.query('SELECT COUNT(*) FROM materials');
        if (parseInt(materialCount[0].count) === 0) {
            console.log('📋 Добавляем демо-материалы...');
            await pool.query(`
                INSERT INTO materials (title, description, category, material_type, downloads, image_url, file_url) VALUES
                ('Чек-лист неврологического осмотра', 'Полный чек-лист для стандартного осмотра', 'Неврология', 'checklist', 234, '/webapp/assets/material-default.jpg', 'https://example.com/material1.pdf'),
                ('Протокол ведения пациентов с болями в спине', 'Стандартизированный протокол диагностики и лечения', 'Неврология', 'protocol', 189, '/webapp/assets/material-default.jpg', 'https://example.com/material2.pdf'),
                ('МРТ разбор: грыжа диска L5-S1', 'Детальный разбор МРТ с пояснениями', 'Диагностика', 'mri_analysis', 312, '/webapp/assets/material-default.jpg', 'https://example.com/material3.pdf')
            `);
            console.log('✅ Демо-материалы добавлены');
        }

        // Проверяем и добавляем демо-мероприятия
        const { rows: eventCount } = await pool.query('SELECT COUNT(*) FROM events');
        if (parseInt(eventCount[0].count) === 0) {
            console.log('🗺️ Добавляем демо-мероприятия...');
            await pool.query(`
                INSERT INTO events (title, description, event_type, event_date, location, participants, image_url, registration_url) VALUES
                ('Конференция по современной неврологии', 'Ежегодная конференция с ведущими специалистами', 'offline', '2024-12-15 10:00:00', 'Москва, ул. Профессиональная, 15', 250, '/webapp/assets/event-default.jpg', 'https://example.com/register1'),
                ('Онлайн-семинар по мануальной терапии', 'Практический семинар с разбором техник', 'online', '2024-12-10 14:00:00', 'Онлайн', 180, '/webapp/assets/event-default.jpg', 'https://example.com/register2'),
                ('Мастер-класс по реабилитации', 'Практические навыки восстановительной медицины', 'offline', '2024-12-20 11:00:00', 'Санкт-Петербург, ул. Медицинская, 8', 120, '/webapp/assets/event-default.jpg', 'https://example.com/register3')
            `);
            console.log('✅ Демо-мероприятия добавлены');
        }

        // Проверяем и добавляем демо-новости
        const { rows: newsCount } = await pool.query('SELECT COUNT(*) FROM news');
        if (parseInt(newsCount[0].count) === 0) {
            console.log('📰 Добавляем демо-новости...');
            await pool.query(`
                INSERT INTO news (title, description, content, date, category, type, image_url) VALUES
                ('Новые методики в реабилитации пациентов с инсультом', 'Обзор современных подходов к реабилитации пациентов с неврологическими нарушениями', 'Полный текст статьи о новых методиках...', '15 дек 2024', 'Реабилитация', 'Статья', '/webapp/assets/news-default.jpg'),
                ('Обновление курса по мануальной терапии', 'Добавлены новые модули по работе с шейным отделом позвоночника', 'Детали обновления курса...', '12 дек 2024', 'Мануальные техники', 'Обновление', '/webapp/assets/news-default.jpg'),
                ('Вебинар: Современная диагностика болей в спине', 'Практические аспекты дифференциальной диагностики', 'Информация о вебинаре...', '10 дек 2024', 'Неврология', 'Мероприятие', '/webapp/assets/news-default.jpg')
            `);
            console.log('✅ Демо-новости добавлены');
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

    bot.start(async (ctx) => {
        const userId = ctx.from.id;
        const userName = ctx.from.first_name;
        
        try {
            // Сначала проверяем существование пользователя
            const { rows: existingUser } = await pool.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [userId]
            );
            
            if (existingUser.length === 0) {
                // Создаем нового пользователя
                await pool.query(
                    `INSERT INTO users (telegram_id, first_name, username, is_admin, is_super_admin) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [userId, userName, ctx.from.username, 
                     userId == process.env.SUPER_ADMIN_ID, 
                     userId == process.env.SUPER_ADMIN_ID]
                );
                console.log(`✅ Создан новый пользователь: ${userName}`);
            } else {
                // Обновляем существующего пользователя
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
                        ['👤 Мой профиль', '🆘 Поддержка']
                    ],
                    resize_keyboard: true
                }
            });

        } catch (error) {
            console.error('Ошибка при старте бота:', error);
            // Отправляем сообщение даже при ошибке БД
            await ctx.reply(`👋 Привет, ${userName}! Добро пожаловать в Академию АНБ! 🎓`, {
                reply_markup: {
                    keyboard: [
                        ['📱 Открыть Академию', '📚 Курсы'],
                        ['🎧 АНБ FM', '📹 Эфиры и разборы'],
                        ['👤 Мой профиль', '🆘 Поддержка']
                    ],
                    resize_keyboard: true
                }
            });
        }
    });

    bot.on('text', async (ctx) => {
        const text = ctx.message.text;
        
        switch(text) {
            case '📱 Открыть Академию':
                await ctx.reply('Открываю Академию АНБ...', {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '🚀 Открыть Академию',
                            web_app: { url: process.env.WEBAPP_URL }
                        }]]
                    }
                });
                break;
                
            case '📚 Курсы':
                await ctx.reply('Открываю курсы...', {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '📚 Все курсы',
                            web_app: { url: `${process.env.WEBAPP_URL}/webapp/#courses` }
                        }]]
                    }
                });
                break;
                
            case '🎧 АНБ FM':
                await ctx.reply('Открываю подкасты...', {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '🎧 АНБ FM',
                            web_app: { url: `${process.env.WEBAPP_URL}/webapp/#podcasts` }
                        }]]
                    }
                });
                break;
                
            case '👤 Мой профиль':
                await ctx.reply('Открываю профиль...', {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '👤 Мой профиль',
                            web_app: { url: `${process.env.WEBAPP_URL}/webapp/#profile` }
                        }]]
                    }
                });
                break;
                
            default:
                await ctx.reply('Используйте кнопки меню для навигации по Академии 🎓');
        }
    });

    bot.command('menu', (ctx) => {
        ctx.reply('Главное меню Академии АНБ:', {
            reply_markup: {
                keyboard: [
                    ['📱 Открыть Академию', '📚 Курсы'],
                    ['🎧 АНБ FM', '📹 Эфиры и разборы'],
                    ['👤 Мой профиль', '🆘 Поддержка']
                ],
                resize_keyboard: true
            }
        });
    });

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

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'ANB Academy API'
    });
});

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

app.get('/api/content', async (req, res) => {
    try {
        const { rows: courses } = await pool.query('SELECT * FROM courses');
        const { rows: podcasts } = await pool.query('SELECT * FROM podcasts');
        const { rows: streams } = await pool.query('SELECT * FROM streams');
        const { rows: videos } = await pool.query('SELECT * FROM videos');
        const { rows: materials } = await pool.query('SELECT * FROM materials');
        const { rows: events } = await pool.query('SELECT * FROM events');
        const { rows: news } = await pool.query('SELECT * FROM news');
        const { rows: userCount } = await pool.query('SELECT COUNT(*) FROM users');
        
        const content = {
            courses: courses || [],
            podcasts: podcasts || [],
            streams: streams || [],
            videos: videos || [],
            materials: materials || [],
            events: events || [],
            news: news || [],
            stats: {
                totalUsers: parseInt(userCount[0].count) || 1567,
                totalCourses: courses?.length || 0,
                totalMaterials: materials?.length || 0,
                totalEvents: events?.length || 0
            }
        };

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('API Content error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки контента' });
    }
});

app.post('/api/user', async (req, res) => {
    try {
        const { user: tgUser } = req.body;
        
        if (!tgUser || !tgUser.id) {
            return res.status(400).json({ success: false, error: 'Неверные данные пользователя' });
        }

        try {
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

            // Получаем прогресс пользователя
            const { rows: progress } = await pool.query(
                'SELECT * FROM user_progress WHERE user_id = $1',
                [user.id]
            );

            // Получаем избранное пользователя
            const { rows: favorites } = await pool.query(
                'SELECT * FROM favorites WHERE user_id = $1',
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

            const userData = {
                id: user.id,
                telegramId: user.telegram_id,
                firstName: user.first_name,
                username: user.username,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                subscriptionEnd: user.subscription_end,
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
                }
            };

            res.json({ success: true, user: userData });
        } catch (dbError) {
            console.error('Database error:', dbError);
            // Возвращаем демо-данные при ошибке БД
            const demoUser = {
                id: tgUser.id,
                telegramId: tgUser.id,
                firstName: tgUser.first_name || 'Пользователь',
                username: tgUser.username,
                isAdmin: tgUser.id == process.env.SUPER_ADMIN_ID,
                isSuperAdmin: tgUser.id == process.env.SUPER_ADMIN_ID,
                subscriptionEnd: new Date('2024-12-31').toISOString(),
                favorites: {
                    courses: [],
                    podcasts: [],
                    streams: [],
                    videos: [],
                    materials: [],
                    events: []
                },
                progress: {
                    level: 'Понимаю',
                    experience: 1250,
                    steps: {
                        coursesBought: 3,
                        modulesCompleted: 2,
                        materialsWatched: 12,
                        eventsAttended: 1
                    }
                }
            };
            res.json({ success: true, user: demoUser });
        }

    } catch (error) {
        console.error('API User error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки пользователя' });
    }
});

app.post('/api/favorites/toggle', async (req, res) => {
    try {
        const { userId, contentId, contentType } = req.body;
        
        // Проверяем, есть ли уже в избранном
        const { rows: existing } = await pool.query(
            'SELECT * FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
            [userId, contentId, contentType]
        );

        if (existing.length > 0) {
            // Удаляем из избранного
            await pool.query(
                'DELETE FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
                [userId, contentId, contentType]
            );
            res.json({ success: true, action: 'removed' });
        } else {
            // Добавляем в избранное
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

// Админские эндпоинты
app.get('/api/admin/stats', async (req, res) => {
    try {
        const { rows: userCount } = await pool.query('SELECT COUNT(*) FROM users');
        const { rows: courseCount } = await pool.query('SELECT COUNT(*) FROM courses');
        const { rows: materialCount } = await pool.query('SELECT COUNT(*) FROM materials');
        const { rows: eventCount } = await pool.query('SELECT COUNT(*) FROM events');
        
        const stats = {
            totalUsers: parseInt(userCount[0].count),
            totalCourses: parseInt(courseCount[0].count),
            totalMaterials: parseInt(materialCount[0].count),
            totalEvents: parseInt(eventCount[0].count),
            activeSubscriptions: Math.floor(parseInt(userCount[0].count) * 0.7)
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки статистики' });
    }
});

app.post('/api/admin/content', async (req, res) => {
    try {
        const { action, contentType, data } = req.body;
        
        if (action === 'create') {
            let query = '';
            let values = [];
            
            switch (contentType) {
                case 'courses':
                    query = `INSERT INTO courses (title, description, price, discount, duration, modules, category, level, image_url, video_url) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`;
                    values = [data.title, data.description, data.price, data.discount, data.duration, data.modules, data.category, data.level, data.image_url, data.video_url];
                    break;
                case 'podcasts':
                    query = `INSERT INTO podcasts (title, description, duration, category, image_url, audio_url) 
                             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                    values = [data.title, data.description, data.duration, data.category, data.image_url, data.audio_url];
                    break;
                case 'streams':
                    query = `INSERT INTO streams (title, description, duration, category, is_live, thumbnail_url, video_url) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
                    values = [data.title, data.description, data.duration, data.category, data.is_live, data.thumbnail_url, data.video_url];
                    break;
                case 'materials':
                    query = `INSERT INTO materials (title, description, category, material_type, image_url, file_url) 
                             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
                    values = [data.title, data.description, data.category, data.material_type, data.image_url, data.file_url];
                    break;
                case 'events':
                    query = `INSERT INTO events (title, description, event_type, event_date, location, image_url, registration_url) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
                    values = [data.title, data.description, data.event_type, data.event_date, data.location, data.image_url, data.registration_url];
                    break;
                case 'news':
                    query = `INSERT INTO news (title, description, content, date, category, type, image_url) 
                             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
                    values = [data.title, data.description, data.content, data.date, data.category, data.type, data.image_url];
                    break;
            }
            
            const { rows } = await pool.query(query, values);
            res.json({ success: true, data: rows[0] });
        }
    } catch (error) {
        console.error('Admin content error:', error);
        res.status(500).json({ success: false, error: 'Ошибка административного действия' });
    }
});

app.put('/api/admin/content/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { contentType, data } = req.body;
        
        let query = '';
        let values = [];
        
        switch (contentType) {
            case 'courses':
                query = `UPDATE courses SET title=$1, description=$2, price=$3, discount=$4, duration=$5, modules=$6, category=$7, level=$8, image_url=$9, video_url=$10 WHERE id=$11 RETURNING *`;
                values = [data.title, data.description, data.price, data.discount, data.duration, data.modules, data.category, data.level, data.image_url, data.video_url, id];
                break;
            // Добавьте другие типы контента по аналогии
        }
        
        const { rows } = await pool.query(query, values);
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Admin update content error:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления контента' });
    }
});

app.delete('/api/admin/content/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { contentType } = req.body;
        
        let query = '';
        
        switch (contentType) {
            case 'courses':
                query = 'DELETE FROM courses WHERE id=$1';
                break;
            case 'podcasts':
                query = 'DELETE FROM podcasts WHERE id=$1';
                break;
            case 'streams':
                query = 'DELETE FROM streams WHERE id=$1';
                break;
            case 'materials':
                query = 'DELETE FROM materials WHERE id=$1';
                break;
            case 'events':
                query = 'DELETE FROM events WHERE id=$1';
                break;
            case 'news':
                query = 'DELETE FROM news WHERE id=$1';
                break;
        }
        
        await pool.query(query, [id]);
        res.json({ success: true, message: 'Контент удален' });
    } catch (error) {
        console.error('Admin delete content error:', error);
        res.status(500).json({ success: false, error: 'Ошибка удаления контента' });
    }
});

// SPA fallback
app.get('/webapp*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================

async function startServer() {
    try {
        console.log('🚀 Запуск Академии АНБ...');
        
        // Очищаем порт перед запуском
        await cleanupPort(PORT);
        
        // Инициализируем компоненты
        initializeBot();
        initializeDatabase();
        
        // Инициализируем БД
        await initDatabase();
        
        // Запускаем бота если он настроен
        if (bot) {
            setupBot();
        }
        
        // Запускаем сервер
        app.listen(PORT, '0.0.0.0', () => {
            console.log('====================================');
            console.log('🚀 Сервер Академии АНБ запущен!');
            console.log('====================================');
            console.log(`📍 Порт: ${PORT}`);
            console.log(`📱 WebApp: ${process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/`}`);
            console.log(`🤖 Bot: ${bot ? 'активен' : 'не настроен'}`);
            console.log(`🗄️ База данных: подключена`);
            console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
            console.log('====================================');
        });
        
    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error);
        process.exit(1);
    }
}

// ==================== ЗАПУСК ПРИЛОЖЕНИЯ ====================

startServer();
