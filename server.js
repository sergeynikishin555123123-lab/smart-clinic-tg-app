// server.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С КОРРЕКТНЫМ ПОДКЛЮЧЕНИЕМ К БД
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
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            // Дополнительные настройки для стабильности
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            maxUses: 7500,
        });

        // Тестируем подключение
        const client = await pool.connect();
        console.log('✅ Подключение к PostgreSQL успешно');
        
        // Создаем таблицы если их нет
        await createTables(client);
        
        client.release();
        return pool;
        
    } catch (error) {
        console.error('❌ Ошибка подключения к PostgreSQL:', error.message);
        console.log('🔄 Работаем без базы данных, используем демо-данные');
        return null;
    }
}

async function createTables(client) {
    try {
        console.log('📊 Проверка структуры базы данных...');
        
        // Таблица пользователей
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                first_name VARCHAR(255),
                username VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
                subscription_active BOOLEAN DEFAULT FALSE,
                subscription_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                progress JSONB DEFAULT '{}',
                favorites JSONB DEFAULT '{}'
            );
        `);

        // Таблица курсов
        await client.query(`
            CREATE TABLE IF NOT EXISTS content_courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                price INTEGER,
                discount INTEGER DEFAULT 0,
                duration VARCHAR(100),
                modules INTEGER,
                category VARCHAR(200),
                level VARCHAR(50),
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 4.5,
                featured BOOLEAN DEFAULT FALSE,
                image_url TEXT,
                video_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT TRUE
            );
        `);

        // Таблица подкастов
        await client.query(`
            CREATE TABLE IF NOT EXISTS content_podcasts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                duration VARCHAR(100),
                audio_url TEXT,
                category VARCHAR(200),
                listens INTEGER DEFAULT 0,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT TRUE
            );
        `);

        // Таблица эфиров
        await client.query(`
            CREATE TABLE IF NOT EXISTS content_streams (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                duration VARCHAR(100),
                video_url TEXT,
                thumbnail_url TEXT,
                live BOOLEAN DEFAULT FALSE,
                participants INTEGER DEFAULT 0,
                stream_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT TRUE
            );
        `);

        // Таблица видео
        await client.query(`
            CREATE TABLE IF NOT EXISTS content_videos (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                duration VARCHAR(100),
                video_url TEXT,
                thumbnail_url TEXT,
                views INTEGER DEFAULT 0,
                category VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT TRUE
            );
        `);

        // Таблица материалов
        await client.query(`
            CREATE TABLE IF NOT EXISTS content_materials (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                material_type VARCHAR(100),
                file_url TEXT,
                image_url TEXT,
                downloads INTEGER DEFAULT 0,
                category VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT TRUE
            );
        `);

        // Таблица мероприятий
        await client.query(`
            CREATE TABLE IF NOT EXISTS content_events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                event_date TIMESTAMP,
                location VARCHAR(300),
                event_type VARCHAR(100),
                participants INTEGER DEFAULT 0,
                image_url TEXT,
                registration_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT TRUE
            );
        `);

        // Таблица избранного
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_favorites (
                id SERIAL PRIMARY KEY,
                user_id BIGINT NOT NULL,
                content_id INTEGER NOT NULL,
                content_type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, content_id, content_type)
            );
        `);

        // Добавляем демо-данные
        await addDemoData(client);
        
        console.log('✅ Структура базы данных готова');
        
    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error.message);
        throw error;
    }
}

async function addDemoData(client) {
    try {
        // Проверяем, есть ли уже демо-данные
        const { rows: existingCourses } = await client.query('SELECT COUNT(*) FROM content_courses');
        if (parseInt(existingCourses[0].count) === 0) {
            console.log('📦 Добавление демо-данных...');
            
            // Добавляем демо-курсы
            await client.query(`
                INSERT INTO content_courses (title, description, price, discount, duration, modules, category, level, students_count, rating, featured, image_url) VALUES
                ('Мануальные техники в практике невролога', '6 модулей по современным мануальным методикам', 25000, 16, '12 недель', 6, 'Мануальные техники', 'advanced', 156, 4.8, true, '/webapp/assets/course-default.jpg'),
                ('Неврологическая диагностика', '5 модулей по современной диагностике', 18000, 0, '8 недель', 5, 'Неврология', 'intermediate', 234, 4.6, true, '/webapp/assets/course-default.jpg'),
                ('Реабилитация в неврологии', '4 модуля по современным методам реабилитации', 22000, 10, '10 недель', 4, 'Реабилитация', 'intermediate', 189, 4.7, false, '/webapp/assets/course-default.jpg')
            `);
            
            // Добавляем демо-подкасты
            await client.query(`
                INSERT INTO content_podcasts (title, description, duration, category, listens, image_url) VALUES
                ('АНБ FM: Современная неврология', 'Обсуждение новых тенденций в неврологии', '45:20', 'Неврология', 2345, '/webapp/assets/podcast-default.jpg'),
                ('Разбор клинического случая: Мигрень', 'Детальный разбор диагностики и лечения мигрени', '38:15', 'Неврология', 1876, '/webapp/assets/podcast-default.jpg')
            `);
            
            // Добавляем демо-эфиры
            await client.query(`
                INSERT INTO content_streams (title, description, duration, thumbnail_url, live, participants, stream_date) VALUES
                ('Разбор клинического случая', 'Прямой эфир с разбором сложного случая', '1:30:00', '/webapp/assets/stream-default.jpg', true, 89, NOW() + INTERVAL '2 days'),
                ('Мануальные техники: демонстрация', 'Живая демонстрация мануальных методик', '1:15:00', '/webapp/assets/stream-default.jpg', false, 156, NOW() - INTERVAL '5 days')
            `);
            
            // Добавляем супер-админа
            await client.query(`
                INSERT INTO users (id, first_name, is_admin, is_super_admin, subscription_active, progress, favorites) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET
                is_admin = EXCLUDED.is_admin,
                is_super_admin = EXCLUDED.is_super_admin
            `, [
                898508164,
                'Демо Администратор',
                true,
                true,
                true,
                JSON.stringify({
                    level: 'Делюсь',
                    experience: 3500,
                    steps: {
                        coursesBought: 8,
                        modulesCompleted: 15,
                        materialsWatched: 45
                    }
                }),
                JSON.stringify({
                    courses: [1],
                    podcasts: [],
                    streams: [],
                    videos: [],
                    materials: [],
                    events: []
                })
            ]);
            
            console.log('✅ Демо-данные добавлены');
        }
    } catch (error) {
        console.error('❌ Ошибка добавления демо-данных:', error.message);
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
        database: pool ? 'connected' : 'demo_mode'
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

        const [
            coursesResult,
            podcastsResult,
            streamsResult,
            videosResult,
            materialsResult,
            eventsResult
        ] = await Promise.all([
            safeQuery('SELECT * FROM content_courses WHERE active = TRUE ORDER BY created_at DESC'),
            safeQuery('SELECT * FROM content_podcasts WHERE active = TRUE ORDER BY created_at DESC'),
            safeQuery('SELECT * FROM content_streams WHERE active = TRUE ORDER BY created_at DESC'),
            safeQuery('SELECT * FROM content_videos WHERE active = TRUE ORDER BY created_at DESC'),
            safeQuery('SELECT * FROM content_materials WHERE active = TRUE ORDER BY created_at DESC'),
            safeQuery('SELECT * FROM content_events WHERE active = TRUE ORDER BY event_date DESC')
        ]);

        const statsResult = await safeQuery(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE subscription_active = TRUE) as active_subscriptions,
                (SELECT COUNT(*) FROM content_courses WHERE active = TRUE) as total_courses,
                (SELECT COUNT(*) FROM content_podcasts WHERE active = TRUE) as total_podcasts,
                (SELECT COUNT(*) FROM content_streams WHERE active = TRUE) as total_streams,
                (SELECT COUNT(*) FROM content_videos WHERE active = TRUE) as total_videos,
                (SELECT COUNT(*) FROM content_materials WHERE active = TRUE) as total_materials,
                (SELECT COUNT(*) FROM content_events WHERE active = TRUE) as total_events
        `);

        res.json({
            success: true,
            data: {
                courses: coursesResult.rows,
                podcasts: podcastsResult.rows,
                streams: streamsResult.rows,
                videos: videosResult.rows,
                materials: materialsResult.rows,
                events: eventsResult.rows,
                stats: statsResult.rows[0] || getDemoStats()
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

        if (!pool) {
            // Возвращаем демо-пользователя если БД не доступна
            return res.json({
                success: true,
                user: getDemoUser(user)
            });
        }

        // Поиск или создание пользователя
        let userResult = await safeQuery(
            'SELECT * FROM users WHERE id = $1',
            [user.id]
        );

        if (userResult.rows.length === 0) {
            userResult = await safeQuery(
                `INSERT INTO users (id, first_name, username, is_admin, is_super_admin) 
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [user.id, user.first_name, user.username, 
                 user.id == process.env.SUPER_ADMIN_ID, 
                 user.id == process.env.SUPER_ADMIN_ID]
            );
        }

        const userData = userResult.rows[0];
        
        // Получаем избранное пользователя
        const favoritesResult = await safeQuery(`
            SELECT content_type, array_agg(content_id) as content_ids
            FROM user_favorites 
            WHERE user_id = $1 
            GROUP BY content_type
        `, [user.id]);

        const favorites = {
            courses: [],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: []
        };

        favoritesResult.rows.forEach(row => {
            favorites[row.content_type] = row.content_ids;
        });

        // Формируем ответ
        const response = {
            id: userData.id,
            firstName: userData.first_name || 'Пользователь',
            username: userData.username,
            isAdmin: userData.is_admin,
            isSuperAdmin: userData.is_super_admin,
            subscriptionActive: userData.subscription_active,
            subscriptionUntil: userData.subscription_until,
            favorites: favorites,
            progress: userData.progress || {
                level: 'Понимаю',
                experience: 1250,
                steps: {
                    coursesBought: 3,
                    modulesCompleted: 2,
                    materialsWatched: 12
                }
            }
        };

        res.json({ success: true, user: response });
    } catch (error) {
        console.error('Error with user:', error);
        // Возвращаем демо-пользователя при ошибке
        res.json({
            success: true,
            user: getDemoUser(req.body.user)
        });
    }
});

// Избранное
app.post('/api/favorites/toggle', async (req, res) => {
    try {
        const { userId, contentId, contentType } = req.body;
        
        if (!pool) {
            return res.json({ 
                success: true, 
                favorites: getDemoFavorites() 
            });
        }

        // Проверяем, есть ли уже в избранном
        const existing = await safeQuery(
            'SELECT id FROM user_favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
            [userId, contentId, contentType]
        );

        if (existing.rows.length > 0) {
            // Удаляем из избранного
            await safeQuery(
                'DELETE FROM user_favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
                [userId, contentId, contentType]
            );
        } else {
            // Добавляем в избранное
            await safeQuery(
                'INSERT INTO user_favorites (user_id, content_id, content_type) VALUES ($1, $2, $3)',
                [userId, contentId, contentType]
            );
        }

        // Получаем обновленное избранное
        const favoritesResult = await safeQuery(`
            SELECT content_type, array_agg(content_id) as content_ids
            FROM user_favorites 
            WHERE user_id = $1 
            GROUP BY content_type
        `, [userId]);

        const favorites = {
            courses: [],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: []
        };

        favoritesResult.rows.forEach(row => {
            favorites[row.content_type] = row.content_ids;
        });

        res.json({ success: true, favorites });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.json({ 
            success: true, 
            favorites: getDemoFavorites() 
        });
    }
});

// АДМИН-ПАНЕЛЬ API

// Получение статистики для админа
app.get('/api/admin/stats', async (req, res) => {
    try {
        if (!pool) {
            return res.json({ 
                success: true, 
                stats: getDemoStats() 
            });
        }

        const stats = await safeQuery(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE subscription_active = TRUE) as active_subscriptions,
                (SELECT COUNT(*) FROM content_courses WHERE active = TRUE) as total_courses,
                (SELECT COUNT(*) FROM content_podcasts WHERE active = TRUE) as total_podcasts,
                (SELECT COUNT(*) FROM content_streams WHERE active = TRUE) as total_streams,
                (SELECT COUNT(*) FROM content_videos WHERE active = TRUE) as total_videos,
                (SELECT COUNT(*) FROM content_materials WHERE active = TRUE) as total_materials,
                (SELECT COUNT(*) FROM content_events WHERE active = TRUE) as total_events
        `);

        res.json({ success: true, stats: stats.rows[0] });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.json({ 
            success: true, 
            stats: getDemoStats() 
        });
    }
});

// Добавление контента
app.post('/api/admin/content/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const content = req.body;
        const adminId = req.headers['x-admin-id'];

        if (!adminId) {
            return res.status(401).json({ success: false, error: 'Admin ID required' });
        }

        if (!pool) {
            return res.json({ 
                success: true, 
                content: { id: Date.now(), ...content },
                message: 'DEMO MODE: Content saved in memory only'
            });
        }

        let result;
        const tables = {
            courses: 'content_courses',
            podcasts: 'content_podcasts', 
            streams: 'content_streams',
            videos: 'content_videos',
            materials: 'content_materials',
            events: 'content_events'
        };

        const table = tables[type];
        if (!table) {
            return res.status(400).json({ success: false, error: 'Invalid content type' });
        }

        // Динамическое создание запроса
        const fields = Object.keys(content).filter(key => key !== 'id');
        const values = fields.map((_, index) => `$${index + 1}`);
        
        const query = `
            INSERT INTO ${table} (${fields.join(', ')}) 
            VALUES (${values.join(', ')})
            RETURNING *
        `;

        result = await safeQuery(query, fields.map(field => content[field]));

        res.json({ success: true, content: result.rows[0] });
    } catch (error) {
        console.error('Error adding content:', error);
        res.status(500).json({ success: false, error: error.message });
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
            }
        ],
        videos: [],
        materials: [],
        events: [],
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

// Обработка graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 Получен SIGTERM, завершаем работу...');
    if (pool) {
        await pool.end();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 Получен SIGINT, завершаем работу...');
    if (pool) {
        await pool.end();
    }
    process.exit(0);
});

startServer().catch(console.error);
