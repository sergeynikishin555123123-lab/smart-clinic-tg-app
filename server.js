// server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { Telegraf, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
const BOT_TOKEN = process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4';
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || `http://localhost:${PORT}`;
// ДОБАВЛЯЕМ ВСЕХ АДМИНОВ СЮДА
const ADMIN_IDS = new Set([898508164, 123456789, 12345678, 1234567].map(id => parseInt(id)));

console.log('🚀 Starting Smart Clinic Bot v4.0...');
console.log('👑 Admin IDs:', Array.from(ADMIN_IDS));

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

        // ДОБАВЛЯЕМ АДМИНИСТРАТОРОВ В БАЗУ
        for (const adminId of ADMIN_IDS) {
            await pool.query(`
                INSERT INTO users (id, first_name, username, is_admin, subscription_status, subscription_type, survey_completed) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET 
                    is_admin = EXCLUDED.is_admin,
                    subscription_status = EXCLUDED.subscription_status
            `, [adminId, 'Администратор', 'admin', true, 'active', 'admin', true]);
        }
        console.log(`✅ Администраторы добавлены: ${Array.from(ADMIN_IDS).join(', ')}`);

        // Демо-курсы
        const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(coursesCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO courses (title, description, full_description, price, duration, modules, category, level) VALUES
                ('Мануальные техники в практике', '6 модулей по современным мануальным методикам', 'Комплексный курс по мануальным техникам для практикующих врачей. Включает диагностику, техники работы и реабилитацию.', 15000, '12 часов', 6, 'Мануальная терапия', 'advanced'),
                ('Неврология для практикующих врачей', 'Основы неврологической диагностики', 'Фундаментальный курс по неврологии с акцентом на практическое применение в клинической практике.', 12000, '10 часов', 5, 'Неврология', 'intermediate'),
                ('Реабилитация после травм', 'Современные методы восстановительного лечения', 'Полный курс по реабилитации пациентов после различных травм опорно-двигательного аппарата.', 18000, '15 часов', 8, 'Реабилитация', 'advanced')
            `);
            console.log('✅ Демо-курсы добавлены');
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
            // ПРОВЕРЯЕМ ЯВЛЯЕТСЯ ЛИ ПОЛЬЗОВАТЕЛЬ АДМИНОМ
            const isAdmin = ADMIN_IDS.has(parseInt(userId));
            
            const newUser = {
                id: userId,
                first_name: userData.first_name || 'User',
                last_name: userData.last_name || '',
                username: userData.username || '',
                specialization: '',
                city: '',
                email: '',
                phone: '',
                subscription_status: isAdmin ? 'active' : 'inactive',
                subscription_type: isAdmin ? 'admin' : null,
                subscription_end_date: isAdmin ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
                progress_level: 'Понимаю',
                progress_data: {steps: {materialsWatched: 0, eventsParticipated: 0, materialsSaved: 0, coursesBought: 0}},
                favorites_data: {courses: [], podcasts: [], streams: [], videos: [], materials: [], watchLater: []},
                is_admin: isAdmin,
                joined_at: new Date(),
                last_activity: new Date(),
                survey_completed: false,
                profile_image: null
            };
            
            await pool.query(
                `INSERT INTO users (id, first_name, last_name, username, subscription_status, subscription_type, subscription_end_date, is_admin, joined_at, last_activity) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    newUser.id, 
                    newUser.first_name, 
                    newUser.last_name, 
                    newUser.username,
                    newUser.subscription_status,
                    newUser.subscription_type,
                    newUser.subscription_end_date,
                    newUser.is_admin,
                    newUser.joined_at,
                    newUser.last_activity
                ]
            );
            
            console.log(`✅ Создан новый пользователь: ${userId}, admin: ${isAdmin}`);
            user = newUser;
        }
        
        return user;
    } catch (error) {
        console.error('❌ Ошибка создания пользователя:', error.message);
        return getTempUser(userId);
    }
}

function getTempUser(userId) {
    const isAdmin = ADMIN_IDS.has(parseInt(userId));
    return {
        id: userId,
        first_name: 'User',
        last_name: '',
        username: '',
        specialization: '',
        city: '',
        email: '',
        phone: '',
        subscription_status: isAdmin ? 'active' : 'inactive',
        subscription_type: isAdmin ? 'admin' : null,
        subscription_end_date: isAdmin ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        progress_level: 'Понимаю',
        progress_data: {steps: {materialsWatched: 0, eventsParticipated: 0, materialsSaved: 0, coursesBought: 0}},
        favorites_data: {courses: [], podcasts: [], streams: [], videos: [], materials: [], watchLater: []},
        is_admin: isAdmin,
        joined_at: new Date(),
        last_activity: new Date(),
        survey_completed: false,
        profile_image: null
    };
}

// ==================== EXPRESS SERVER ====================
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(join(__dirname, 'webapp')));
app.use(cors());

// ==================== API ENDPOINTS ====================

// 🔐 ПРОВЕРКА ПРАВ АДМИНИСТРАТОРА - УПРОЩЕННАЯ ВЕРСИЯ
app.get('/api/check-admin/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        console.log('🔍 Проверка админ-прав для:', userId);
        
        // ПРЯМАЯ ПРОВЕРКА В ADMIN_IDS
        const isAdmin = ADMIN_IDS.has(userId);
        
        console.log('📊 Результат проверки:', { userId, isAdmin });
        
        res.json({ 
            success: true, 
            isAdmin: isAdmin
        });
    } catch (error) {
        console.error('❌ Ошибка проверки админа:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 👤 ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ - УПРОЩЕННАЯ ВЕРСИЯ
app.get('/api/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        console.log('👤 Запрос пользователя:', userId);
        
        const user = await getOrCreateUser(userId);
        
        if (user) {
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

// 📝 СОЗДАНИЕ/ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
app.post('/api/user', async (req, res) => {
    try {
        const { id, firstName, lastName, username } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }

        console.log('📝 Создание/обновление пользователя:', { id, firstName, lastName, username });

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

// 📚 ПОЛУЧЕНИЕ КОНТЕНТА
app.get('/api/content', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.json({
                success: true,
                data: getTempContent()
            });
        }

        const courses = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
        
        res.json({
            success: true,
            data: {
                courses: courses.rows,
                navigation: [
                    { id: 1, title: 'Главная', icon: '🏠', target_page: 'home', position: 1 },
                    { id: 2, title: 'Курсы', icon: '📚', target_page: 'courses', position: 2 },
                    { id: 3, title: 'Профиль', icon: '👤', target_page: 'profile', position: 3 }
                ]
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
                category: 'Мануальная терапия',
                level: 'advanced',
                rating: 4.8,
                students_count: 124,
                created_at: new Date()
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
                rating: 4.6,
                students_count: 89,
                created_at: new Date()
            }
        ],
        navigation: [
            { id: 1, title: 'Главная', icon: '🏠', target_page: 'home', position: 1 },
            { id: 2, title: 'Курсы', icon: '📚', target_page: 'courses', position: 2 },
            { id: 3, title: 'Профиль', icon: '👤', target_page: 'profile', position: 3 }
        ]
    };
}

// ❓ FAQ
app.get('/api/faq', async (req, res) => {
    try {
        const faq = [
            {
                question: "Как оформить подписку?",
                answer: "Подписку можно оформить в разделе «Профиль» через кнопку «Изменить подписку»."
            },
            {
                question: "Что входит в подписку?",
                answer: "Полный доступ ко всем курсам, материалам и участие в сообществе."
            }
        ];
        
        res.json({ success: true, faq });
    } catch (error) {
        console.error('❌ Ошибка получения FAQ:', error);
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
        version: '4.0.0'
    });
});

// Serve SPA
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startApp() {
    try {
        console.log('🚀 Запуск приложения v4.0...');
        
        // Инициализируем базу данных
        await initDatabase();
        
        // Запускаем Express сервер
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 WebApp сервер запущен на порту ${PORT}`);
            console.log(`📱 WebApp: ${WEBAPP_URL}`);
            console.log(`🔧 Admin: ${WEBAPP_URL}/admin.html`);
            console.log(`👑 Админ ID: ${Array.from(ADMIN_IDS).join(', ')}`);
            console.log(`🗄️  База данных: ${dbConnected ? '✅ Подключена' : '❌ Не подключена'}`);
        });

        // Запускаем бота
        await bot.launch();
        console.log('✅ Telegram Bot запущен!');
        
        console.log('🚀 Приложение полностью готово к работе!');

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

// Запускаем приложение
startApp();
