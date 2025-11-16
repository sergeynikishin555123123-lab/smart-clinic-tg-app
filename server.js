// server.js - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ С АДМИНКОЙ В MINI-APP
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
const ADMIN_IDS = new Set([898508164, 123456789, 12345678, 1234567].map(id => parseInt(id)));

console.log('🚀 Starting Smart Clinic Bot v5.0...');
console.log('👑 Admin IDs:', Array.from(ADMIN_IDS));

// ==================== БАЗА ДАННЫХ ====================
let pool;
let dbConnected = false;

async function initDatabase() {
    try {
        const { Pool } = await import('pg');
        
        pool = new Pool({
            user: 'gen_user',
            host: '45.89.190.49',
            database: 'default_db',
            password: '5-R;mKGYJ<88?1',
            port: 5432,
            ssl: { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
        });

        const client = await pool.connect();
        console.log('✅ Успешное подключение к PostgreSQL!');
        client.release();
        dbConnected = true;

        await createTables();
        await addDemoData();
        
    } catch (error) {
        console.error('❌ Ошибка подключения к PostgreSQL:', error.message);
        dbConnected = false;
    }
}

async function createTables() {
    try {
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
            await pool.query(tableQuery);
        }
        console.log('✅ Все таблицы созданы/проверены');

    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error.message);
    }
}

async function addDemoData() {
    try {
        // Администраторы
        for (const adminId of ADMIN_IDS) {
            await pool.query(`
                INSERT INTO users (id, first_name, username, is_admin, subscription_status, subscription_type, survey_completed) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET 
                    is_admin = EXCLUDED.is_admin,
                    subscription_status = EXCLUDED.subscription_status
            `, [adminId, 'Администратор', 'admin', true, 'active', 'admin', true]);
        }

        // Демо-курсы
        const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(coursesCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO courses (title, description, full_description, price, duration, modules, category, level) VALUES
                ('Мануальные техники в практике', '6 модулей по современным мануальным методикам', 'Комплексный курс по мануальным техникам для практикующих врачей.', 15000, '12 часов', 6, 'Мануальная терапия', 'advanced'),
                ('Неврология для практикующих врачей', 'Основы неврологической диагностики', 'Фундаментальный курс по неврологии с акцентом на практическое применение.', 12000, '10 часов', 5, 'Неврология', 'intermediate'),
                ('Реабилитация после травм', 'Современные методы восстановительного лечения', 'Полный курс по реабилитации пациентов после травм ОДА.', 18000, '15 часов', 8, 'Реабилитация', 'advanced')
            `);
        }

        console.log('✅ Демо-данные добавлены');
    } catch (error) {
        console.error('❌ Ошибка добавления демо-данных:', error.message);
    }
}

// ==================== TELEGRAM BOT ====================
const bot = new Telegraf(BOT_TOKEN);

// Быстрые команды
bot.command('start', async (ctx) => {
    await ctx.reply(`👋 Добро пожаловать в Академию АНБ, ${ctx.from.first_name}!\n\n📱 Откройте приложение для доступа ко всем функциям:`, {
        reply_markup: {
            inline_keyboard: [[
                { text: '📱 Открыть приложение', web_app: { url: WEBAPP_URL } }
            ]]
        }
    });
});

bot.command('admin', async (ctx) => {
    const userId = ctx.from.id;
    if (ADMIN_IDS.has(userId)) {
        await ctx.reply('🔧 Панель администратора доступна в приложении:', {
            reply_markup: {
                inline_keyboard: [[
                    { text: '📱 Открыть админку', web_app: { url: WEBAPP_URL } }
                ]]
            }
        });
    } else {
        await ctx.reply('❌ У вас нет прав администратора');
    }
});

bot.command('stats', async (ctx) => {
    const userId = ctx.from.id;
    if (ADMIN_IDS.has(userId)) {
        try {
            const usersCount = await pool.query('SELECT COUNT(*) FROM users');
            const coursesCount = await pool.query('SELECT COUNT(*) FROM courses');
            
            await ctx.reply(`📊 Статистика системы:\n\n👥 Пользователей: ${usersCount.rows[0].count}\n📚 Курсов: ${coursesCount.rows[0].count}\n\nДля детальной статистики откройте админ-панель.`);
        } catch (error) {
            await ctx.reply('❌ Ошибка получения статистики');
        }
    }
});

// ==================== EXPRESS SERVER ====================
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(join(__dirname, 'webapp')));
app.use(cors());

// ==================== API ENDPOINTS ====================

// 🔐 Проверка прав администратора
app.get('/api/check-admin/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const isAdmin = ADMIN_IDS.has(userId);
        res.json({ success: true, isAdmin });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 👤 Пользователи
app.get('/api/user/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await getOrCreateUser(userId);
        res.json({ success: true, user: formatUser(user) });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/user', async (req, res) => {
    try {
        const { id, firstName, lastName, username } = req.body;
        const user = await getOrCreateUser(id, {
            first_name: firstName,
            last_name: lastName,
            username: username
        });
        res.json({ success: true, user: formatUser(user) });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// 📚 Контент
app.get('/api/content', async (req, res) => {
    try {
        const courses = dbConnected ? await pool.query('SELECT * FROM courses ORDER BY created_at DESC') : { rows: [] };
        
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
        res.json({ success: true, data: getTempContent() });
    }
});

// 📊 Статистика
app.get('/api/stats', async (req, res) => {
    try {
        const usersCount = dbConnected ? await pool.query('SELECT COUNT(*) FROM users') : { rows: [{ count: '1' }] };
        const coursesCount = dbConnected ? await pool.query('SELECT COUNT(*) FROM courses') : { rows: [{ count: '3' }] };
        
        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(usersCount.rows[0].count),
                activeUsers: parseInt(usersCount.rows[0].count),
                totalCourses: parseInt(coursesCount.rows[0].count),
                totalRevenue: parseInt(usersCount.rows[0].count) * 2900
            }
        });
    } catch (error) {
        res.json({
            success: true,
            stats: {
                totalUsers: 1,
                activeUsers: 1,
                totalCourses: 3,
                totalRevenue: 2900
            }
        });
    }
});

// 👥 Список пользователей
app.get('/api/users', async (req, res) => {
    try {
        const users = dbConnected ? await pool.query('SELECT * FROM users ORDER BY joined_at DESC LIMIT 100') : { rows: [] };
        
        res.json({
            success: true,
            users: users.rows.map(formatUser)
        });
    } catch (error) {
        res.json({ success: true, users: [] });
    }
});

// 📝 Добавление контента
app.post('/api/content', async (req, res) => {
    try {
        const { title, description, fullDescription, price, duration, modules, contentType, category, level } = req.body;
        
        if (contentType === 'courses') {
            const result = await pool.query(
                `INSERT INTO courses (title, description, full_description, price, duration, modules, category, level) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [title, description, fullDescription, price, duration, modules, category, level]
            );
            
            res.json({ success: true, content: result.rows[0] });
        } else {
            res.status(400).json({ success: false, error: 'Invalid content type' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Вспомогательные функции
async function getOrCreateUser(userId, userData = {}) {
    if (!dbConnected) {
        return getTempUser(userId);
    }

    try {
        let user = await getUser(userId);
        
        if (!user) {
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
                [newUser.id, newUser.first_name, newUser.last_name, newUser.username, newUser.subscription_status, newUser.subscription_type, newUser.subscription_end_date, newUser.is_admin, newUser.joined_at, newUser.last_activity]
            );
            
            user = newUser;
        }
        
        return user;
    } catch (error) {
        return getTempUser(userId);
    }
}

async function getUser(userId) {
    if (!dbConnected) return null;
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        return result.rows[0] || null;
    } catch (error) {
        return null;
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
        progress_data: {steps: {materialsWatched: 5, eventsParticipated: 3, materialsSaved: 7, coursesBought: 1}},
        favorites_data: {courses: [], podcasts: [], streams: [], videos: [], materials: [], watchLater: []},
        is_admin: isAdmin,
        joined_at: new Date(),
        last_activity: new Date(),
        survey_completed: true,
        profile_image: null
    };
}

function formatUser(user) {
    return {
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
    };
}

function getTempContent() {
    return {
        courses: [
            {
                id: 1,
                title: 'Мануальные техники в практике',
                description: '6 модулей по современным мануальным методикам',
                full_description: 'Комплексный курс по мануальным техникам',
                price: 15000,
                duration: '12 часов',
                modules: 6,
                category: 'Мануальная терапия',
                level: 'advanced',
                rating: 4.8,
                students_count: 124,
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'OK', 
        dbConnected,
        timestamp: new Date().toISOString(),
        version: '5.0.0'
    });
});

// Serve SPA
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startApp() {
    try {
        await initDatabase();
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 WebApp сервер запущен на порту ${PORT}`);
            console.log(`📱 WebApp: ${WEBAPP_URL}`);
            console.log(`👑 Админ ID: ${Array.from(ADMIN_IDS).join(', ')}`);
        });

        await bot.launch();
        console.log('✅ Telegram Bot запущен!');
        
    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

startApp();
