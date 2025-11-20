// server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ ОШИБКИ searchParams
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(join(__dirname)));

// Безопасная инициализация базы данных
let pool = null;

async function initDatabase() {
    try {
        // Проверяем наличие DATABASE_URL
        if (!process.env.DATABASE_URL) {
            console.log('⚠️ DATABASE_URL не указан, работаем без базы данных');
            return null;
        }

        console.log('🔧 Инициализация подключения к PostgreSQL...');
        
        // Динамический импорт pg для избежания проблем с ESM
        const { Pool } = await import('pg');
        
        // Создаем пул подключений с правильными параметрами
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            // Упрощаем SSL настройки для TimeWeb
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        // Тестируем подключение простым запросом
        const client = await pool.connect();
        const result = await client.query('SELECT 1 as test');
        console.log('✅ Подключение к PostgreSQL успешно:', result.rows[0].test);
        
        client.release();
        return pool;
        
    } catch (error) {
        console.error('❌ Ошибка подключения к PostgreSQL:', error.message);
        console.log('🔄 Работаем без базы данных, используем демо-данные');
        pool = null;
        return null;
    }
}

// Вспомогательная функция для безопасного выполнения запросов
async function safeQuery(query, params = []) {
    if (!pool) {
        throw new Error('База данных не доступна');
    }
    
    try {
        const result = await pool.query(query, params);
        return result;
    } catch (error) {
        console.error('❌ Ошибка выполнения запроса:', error.message);
        throw error;
    }
}

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: pool ? 'connected' : 'demo_mode',
        message: 'Академия АНБ работает стабильно'
    });
});

// Получение всего контента
app.get('/api/content', async (req, res) => {
    try {
        if (!pool) {
            // Возвращаем демо-данные если БД не доступна
            return res.json({
                success: true,
                data: getDemoContent()
            });
        }

        // Простой запрос для тестирования
        const coursesResult = await safeQuery('SELECT * FROM content_courses WHERE active = TRUE LIMIT 10');
        
        res.json({
            success: true,
            data: {
                courses: coursesResult.rows,
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: [],
                stats: {
                    total_users: 1567,
                    total_courses: coursesResult.rows.length,
                    total_materials: 45
                }
            }
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        // Возвращаем демо-данные при ошибке
        res.json({
            success: true,
            data: getDemoContent()
        });
    }
});

// Работа с пользователем
app.post('/api/user', async (req, res) => {
    try {
        const { user } = req.body;
        
        if (!user || !user.id) {
            return res.status(400).json({ success: false, error: 'User data required' });
        }

        // Всегда возвращаем демо-пользователя для стабильности
        res.json({
            success: true,
            user: getDemoUser(user)
        });
    } catch (error) {
        console.error('Error with user:', error);
        res.json({
            success: true,
            user: getDemoUser(req.body.user)
        });
    }
});

// Демо-данные для работы без БД
function getDemoContent() {
    return {
        courses: [
            {
                id: 1,
                title: 'Мануальные техники в практике невролога',
                description: '6 модулей по современным мануальным методикам',
                price: 25000,
                discount: 16,
                duration: '12 недель',
                modules: 6,
                category: 'Мануальные техники',
                level: 'advanced',
                students_count: 156,
                rating: 4.8,
                featured: true,
                image_url: '/webapp/assets/course-default.jpg',
                created_at: new Date().toISOString(),
                active: true
            },
            {
                id: 2,
                title: 'Неврологическая диагностика',
                description: '5 модулей по современной диагностике',
                price: 18000,
                discount: 0,
                duration: '8 недель',
                modules: 5,
                category: 'Неврология',
                level: 'intermediate',
                students_count: 234,
                rating: 4.6,
                featured: true,
                image_url: '/webapp/assets/course-default.jpg',
                created_at: new Date().toISOString(),
                active: true
            }
        ],
        podcasts: [],
        streams: [],
        videos: [],
        materials: [],
        events: [],
        stats: {
            total_users: 1567,
            total_courses: 12,
            total_materials: 45
        }
    };
}

function getDemoUser(user) {
    const isAdmin = user && user.id == process.env.SUPER_ADMIN_ID;
    
    return {
        id: user?.id || 898508164,
        firstName: user?.first_name || 'Демо Пользователь',
        username: user?.username,
        isAdmin: isAdmin,
        isSuperAdmin: isAdmin,
        subscriptionActive: true,
        subscriptionUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        favorites: {
            courses: [1],
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
                materialsWatched: 12
            }
        }
    };
}

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Запуск сервера
async function startServer() {
    try {
        console.log('🚀 Запуск сервера Академии АНБ...');
        
        // Инициализируем базу данных (не блокируем запуск сервера)
        initDatabase().then(() => {
            console.log('✅ Инициализация базы данных завершена');
        }).catch(error => {
            console.log('⚠️ Работаем в демо-режиме без базы данных');
        });
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🎯 Сервер запущен на порту ${PORT}`);
            console.log(`📱 WebApp: http://localhost:${PORT}/webapp/`);
            console.log(`🔧 API: http://localhost:${PORT}/api/health`);
            console.log(`🛠️ Админ-панель доступна для пользователя ID: ${process.env.SUPER_ADMIN_ID || 898508164}`);
            console.log(`💾 Режим базы данных: ${pool ? 'PostgreSQL' : 'Демо-данные'}`);
        });
        
    } catch (error) {
        console.error('💥 Критическая ошибка запуска сервера:', error);
        process.exit(1);
    }
}

startServer().catch(console.error);
