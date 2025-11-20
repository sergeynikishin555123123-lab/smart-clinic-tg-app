// server.js - ПОЛНАЯ ВЕРСИЯ С АДМИН-ПАНЕЛЬЮ И БАЗОЙ ДАННЫХ
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(join(__dirname)));

// Подключение к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Инициализация базы данных
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT PRIMARY KEY,
        first_name VARCHAR(255),
        username VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        is_super_admin BOOLEAN DEFAULT FALSE,
        subscription_active BOOLEAN DEFAULT FALSE,
        subscription_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        progress JSONB DEFAULT '{}'
      );
      
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
      
      CREATE TABLE IF NOT EXISTS user_favorites (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        content_id INTEGER NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, content_id, content_type)
      );
      
      CREATE TABLE IF NOT EXISTS admin_actions (
        id SERIAL PRIMARY KEY,
        admin_id BIGINT NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        target_id INTEGER,
        target_type VARCHAR(100),
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Добавляем демо-данные
    await addDemoData();
    
    console.log('✅ База данных инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
  }
}

async function addDemoData() {
  try {
    // Проверяем, есть ли уже демо-данные
    const { rows: existingCourses } = await pool.query('SELECT COUNT(*) FROM content_courses');
    if (parseInt(existingCourses[0].count) === 0) {
      // Добавляем демо-курсы
      await pool.query(`
        INSERT INTO content_courses (title, description, price, discount, duration, modules, category, level, students_count, rating, featured, image_url) VALUES
        ('Мануальные техники в практике невролога', '6 модулей по современным мануальным методикам', 25000, 16, '12 недель', 6, 'Мануальные техники', 'advanced', 156, 4.8, true, '/webapp/assets/course-default.jpg'),
        ('Неврологическая диагностика', '5 модулей по современной диагностике', 18000, 0, '8 недель', 5, 'Неврология', 'intermediate', 234, 4.6, true, '/webapp/assets/course-default.jpg'),
        ('Реабилитация в неврологии', '4 модуля по современным методам реабилитации', 22000, 10, '10 недель', 4, 'Реабилитация', 'intermediate', 189, 4.7, false, '/webapp/assets/course-default.jpg')
      `);
      
      // Добавляем демо-подкасты
      await pool.query(`
        INSERT INTO content_podcasts (title, description, duration, category, listens, image_url) VALUES
        ('АНБ FM: Современная неврология', 'Обсуждение новых тенденций в неврологии', '45:20', 'Неврология', 2345, '/webapp/assets/podcast-default.jpg'),
        ('Разбор клинического случая: Мигрень', 'Детальный разбор диагностики и лечения мигрени', '38:15', 'Неврология', 1876, '/webapp/assets/podcast-default.jpg')
      `);
      
      // Добавляем демо-эфиры
      await pool.query(`
        INSERT INTO content_streams (title, description, duration, thumbnail_url, live, participants, stream_date) VALUES
        ('Разбор клинического случая', 'Прямой эфир с разбором сложного случая', '1:30:00', '/webapp/assets/stream-default.jpg', true, 89, NOW() + INTERVAL '2 days'),
        ('Мануальные техники: демонстрация', 'Живая демонстрация мануальных методик', '1:15:00', '/webapp/assets/stream-default.jpg', false, 156, NOW() - INTERVAL '5 days')
      `);
      
      console.log('✅ Демо-данные добавлены');
    }
  } catch (error) {
    console.error('❌ Ошибка добавления демо-данных:', error);
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Получение всего контента
app.get('/api/content', async (req, res) => {
  try {
    const [
      coursesResult,
      podcastsResult,
      streamsResult,
      videosResult,
      materialsResult,
      eventsResult
    ] = await Promise.all([
      pool.query('SELECT * FROM content_courses WHERE active = TRUE ORDER BY created_at DESC'),
      pool.query('SELECT * FROM content_podcasts WHERE active = TRUE ORDER BY created_at DESC'),
      pool.query('SELECT * FROM content_streams WHERE active = TRUE ORDER BY created_at DESC'),
      pool.query('SELECT * FROM content_videos WHERE active = TRUE ORDER BY created_at DESC'),
      pool.query('SELECT * FROM content_materials WHERE active = TRUE ORDER BY created_at DESC'),
      pool.query('SELECT * FROM content_events WHERE active = TRUE ORDER BY event_date DESC')
    ]);

    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM content_courses WHERE active = TRUE) as total_courses,
        (SELECT COUNT(*) FROM content_materials WHERE active = TRUE) as total_materials
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
        stats: stats.rows[0]
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Работа с пользователем
app.post('/api/user', async (req, res) => {
  try {
    const { user } = req.body;
    
    if (!user || !user.id) {
      return res.status(400).json({ success: false, error: 'User data required' });
    }

    // Поиск или создание пользователя
    let userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        `INSERT INTO users (id, first_name, username, is_admin, is_super_admin) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [user.id, user.first_name, user.username, 
         user.id == process.env.SUPER_ADMIN_ID, 
         user.id == process.env.SUPER_ADMIN_ID]
      );
    }

    const userData = userResult.rows[0];
    
    // Получаем избранное пользователя
    const favoritesResult = await pool.query(`
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// Избранное
app.post('/api/favorites/toggle', async (req, res) => {
  try {
    const { userId, contentId, contentType } = req.body;
    
    // Проверяем, есть ли уже в избранном
    const existing = await pool.query(
      'SELECT id FROM user_favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
      [userId, contentId, contentType]
    );

    if (existing.rows.length > 0) {
      // Удаляем из избранного
      await pool.query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
        [userId, contentId, contentType]
      );
    } else {
      // Добавляем в избранное
      await pool.query(
        'INSERT INTO user_favorites (user_id, content_id, content_type) VALUES ($1, $2, $3)',
        [userId, contentId, contentType]
      );
    }

    // Получаем обновленное избранное
    const favoritesResult = await pool.query(`
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// АДМИН-ПАНЕЛЬ API

// Получение статистики для админа
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
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
    res.status(500).json({ success: false, error: error.message });
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

    result = await pool.query(query, fields.map(field => content[field]));

    // Логируем действие
    await pool.query(
      'INSERT INTO admin_actions (admin_id, action_type, target_id, target_type, details) VALUES ($1, $2, $3, $4, $5)',
      [adminId, 'create', result.rows[0].id, type, { content }]
    );

    res.json({ success: true, content: result.rows[0] });
  } catch (error) {
    console.error('Error adding content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Обновление контента
app.put('/api/admin/content/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const content = req.body;
    const adminId = req.headers['x-admin-id'];

    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Admin ID required' });
    }

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

    const fields = Object.keys(content).filter(key => key !== 'id');
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE ${table} 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${fields.length + 1}
      RETURNING *
    `;

    const result = await pool.query(query, [...fields.map(field => content[field]), id]);

    // Логируем действие
    await pool.query(
      'INSERT INTO admin_actions (admin_id, action_type, target_id, target_type, details) VALUES ($1, $2, $3, $4, $5)',
      [adminId, 'update', id, type, { content }]
    );

    res.json({ success: true, content: result.rows[0] });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Удаление контента
app.delete('/api/admin/content/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const adminId = req.headers['x-admin-id'];

    if (!adminId) {
      return res.status(401).json({ success: false, error: 'Admin ID required' });
    }

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

    // Soft delete
    await pool.query(`UPDATE ${table} SET active = FALSE WHERE id = $1`, [id]);

    // Логируем действие
    await pool.query(
      'INSERT INTO admin_actions (admin_id, action_type, target_id, target_type) VALUES ($1, $2, $3, $4)',
      [adminId, 'delete', id, type]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Запуск сервера
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 WebApp: http://localhost:${PORT}/webapp/`);
    console.log(`🔧 API: http://localhost:${PORT}/api/health`);
    console.log(`🛠️ Админ-панель доступна для пользователя ID: ${process.env.SUPER_ADMIN_ID}`);
  });
}

startServer().catch(console.error);
