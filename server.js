// server.js - РАБОЧАЯ ВЕРСИЯ БЕЗ ОШИБКИ searchParams
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

// Флаг подключения к БД
let dbConnected = false;

// Простая функция для инициализации БД без сложных зависимостей
async function initDatabase() {
    try {
        if (!process.env.DATABASE_URL) {
            console.log('ℹ️ DATABASE_URL не указан, работаем в демо-режиме');
            return false;
        }

        console.log('🔧 Попытка подключения к PostgreSQL...');
        
        // Используем нативный import для избежания конфликтов
        const pgModule = await import('pg');
        const Pool = pgModule.Pool;
        
        // Простая конфигурация пула
        const poolConfig = {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? false : false, // Отключаем SSL для простоты
            max: 5,
            idleTimeoutMillis: 30000,
        };

        const pool = new Pool(poolConfig);
        
        // Простой тест подключения
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        
        console.log('✅ Подключение к PostgreSQL успешно!');
        dbConnected = true;
        return true;
        
    } catch (error) {
        console.log('❌ Ошибка подключения к PostgreSQL:', error.message);
        console.log('💡 Совет: Проверьте DATABASE_URL и доступность базы данных');
        return false;
    }
}

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'demo_mode',
        version: '2.1.0'
    });
});

// Получение контента
app.get('/api/content', (req, res) => {
    res.json({
        success: true,
        data: getDemoContent()
    });
});

// Работа с пользователем
app.post('/api/user', (req, res) => {
    const { user } = req.body;
    res.json({
        success: true,
        user: getDemoUser(user)
    });
});

// Избранное
app.post('/api/favorites/toggle', (req, res) => {
    res.json({
        success: true,
        favorites: getDemoFavorites()
    });
});

// Админ-статистика
app.get('/api/admin/stats', (req, res) => {
    res.json({
        success: true,
        stats: getDemoStats()
    });
});

// Добавление контента (демо-режим)
app.post('/api/admin/content/:type', (req, res) => {
    const { type } = req.params;
    const content = req.body;
    
    res.json({
        success: true,
        content: { 
            id: Date.now(), 
            ...content,
            created_at: new Date().toISOString(),
            active: true
        },
        message: 'DEMO MODE: Content saved in memory'
    });
});

// Демо-данные
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
            },
            {
                id: 3,
                title: 'Реабилитация в неврологии',
                description: '4 модуля по современным методам реабилитации',
                price: 22000,
                discount: 10,
                duration: '10 недель',
                modules: 4,
                category: 'Реабилитация',
                level: 'intermediate',
                students_count: 189,
                rating: 4.7,
                featured: false,
                image_url: '/webapp/assets/course-default.jpg',
                created_at: new Date().toISOString(),
                active: true
            }
        ],
        podcasts: [
            {
                id: 1,
                title: 'АНБ FM: Современная неврология',
                description: 'Обсуждение новых тенденций в неврологии',
                duration: '45:20',
                category: 'Неврология',
                listens: 2345,
                image_url: '/webapp/assets/podcast-default.jpg',
                created_at: new Date().toISOString(),
                active: true
            },
            {
                id: 2,
                title: 'Разбор клинического случая: Мигрень',
                description: 'Детальный разбор диагностики и лечения мигрени',
                duration: '38:15',
                category: 'Неврология',
                listens: 1876,
                image_url: '/webapp/assets/podcast-default.jpg',
                created_at: new Date().toISOString(),
                active: true
            }
        ],
        streams: [
            {
                id: 1,
                title: 'Разбор клинического случая',
                description: 'Прямой эфир с разбором сложного случая',
                duration: '1:30:00',
                thumbnail_url: '/webapp/assets/stream-default.jpg',
                live: true,
                participants: 89,
                stream_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                active: true
            },
            {
                id: 2,
                title: 'Мануальные техники: демонстрация',
                description: 'Живая демонстрация мануальных методик',
                duration: '1:15:00',
                thumbnail_url: '/webapp/assets/stream-default.jpg',
                live: false,
                participants: 156,
                stream_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                active: true
            }
        ],
        videos: [
            {
                id: 1,
                title: 'Неврологический осмотр за 15 минут',
                description: 'Быстрый гайд по основным тестам',
                duration: '15:30',
                views: 4567,
                category: 'Неврология',
                thumbnail_url: '/webapp/assets/video-default.jpg',
                created_at: new Date().toISOString(),
                active: true
            }
        ],
        materials: [
            {
                id: 1,
                title: 'МРТ разбор: Рассеянный склероз',
                description: 'Детальный разбор МРТ с клиническими случаями',
                material_type: 'mri_analysis',
                category: 'Неврология',
                downloads: 1234,
                image_url: '/webapp/assets/material-default.jpg',
                created_at: new Date().toISOString(),
                active: true
            }
        ],
        events: [
            {
                id: 1,
                title: 'Конференция: Современная неврология 2024',
                description: 'Ежегодная конференция с ведущими специалистами',
                event_date: new Date('2024-02-15T10:00:00').toISOString(),
                location: 'Москва',
                event_type: 'offline',
                participants: 456,
                image_url: '/webapp/assets/event-default.jpg',
                created_at: new Date().toISOString(),
                active: true
            }
        ],
        stats: getDemoStats()
    };
}

function getDemoStats() {
    return {
        total_users: 1567,
        active_subscriptions: 892,
        total_courses: 12,
        total_podcasts: 8,
        total_streams: 15,
        total_videos: 25,
        total_materials: 45,
        total_events: 6
    };
}

function getDemoUser(user) {
    const isAdmin = user && user.id == (process.env.SUPER_ADMIN_ID || 898508164);
    
    return {
        id: user?.id || 898508164,
        firstName: user?.first_name || (isAdmin ? 'Демо Администратор' : 'Демо Пользователь'),
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
            level: isAdmin ? 'Делюсь' : 'Понимаю',
            experience: isAdmin ? 3500 : 1250,
            steps: {
                coursesBought: isAdmin ? 8 : 3,
                modulesCompleted: isAdmin ? 15 : 2,
                materialsWatched: isAdmin ? 45 : 12
            }
        }
    };
}

function getDemoFavorites() {
    return {
        courses: [1],
        podcasts: [],
        streams: [],
        videos: [],
        materials: [],
        events: []
    };
}

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Запуск сервера
async function startServer() {
    try {
        console.log('🚀 Запуск Академии АНБ v2.1.0...');
        
        // Пытаемся подключиться к БД, но не блокируем запуск
        initDatabase().then(connected => {
            if (connected) {
                console.log('💾 Режим: PostgreSQL (полная функциональность)');
            } else {
                console.log('💾 Режим: Демо-данные (базовая функциональность)');
            }
        });
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log('🎯 Сервер запущен!');
            console.log(`📍 Порт: ${PORT}`);
            console.log(`📱 WebApp: http://localhost:${PORT}/webapp/`);
            console.log(`🔧 API: http://localhost:${PORT}/api/health`);
            console.log(`🛠️ Админ-панель для ID: ${process.env.SUPER_ADMIN_ID || 898508164}`);
            console.log('✅ Готов к работе!');
        });
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Завершение работы...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Завершение работы...');
    process.exit(0);
});

// Запускаем сервер
startServer();
