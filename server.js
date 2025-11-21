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
                ('Неврологическая диагностика', '5 модулей по современной диагностике', 18000, 0, '8 недель', 5, 'Неврология', 'intermediate', 234, 4.6, true, '/webapp/assets/course-default.jpg', 'https://example.com/video2')
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
                ('Мануальная терапия: мифы и реальность', 'Разбор популярных заблуждений', '38:15', 'Мануальные техники', 1876, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio2')
            `);
            console.log('✅ Демо-подкасты добавлены');
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
        
        const content = {
            courses: courses || [],
            podcasts: podcasts || [],
            stats: {
                totalUsers: 1567,
                totalCourses: courses?.length || 0,
                totalMaterials: 0,
                totalEvents: 0
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

            const userData = {
                id: user.id,
                telegramId: user.telegram_id,
                firstName: user.first_name,
                username: user.username,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                subscriptionEnd: user.subscription_end,
                favorites: demoUser.favorites,
                progress: demoUser.progress
            };

            res.json({ success: true, user: userData });
        } catch (dbError) {
            console.error('Database error, using demo user:', dbError);
            res.json({ success: true, user: demoUser });
        }

    } catch (error) {
        console.error('API User error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки пользователя' });
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
