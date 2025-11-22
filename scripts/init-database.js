import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initDatabase() {
  try {
    console.log('🗄️ Инициализация базы данных Академии АНБ...');
    
    // Создаем таблицы
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        level VARCHAR(50) DEFAULT 'Понимаю',
        experience INTEGER DEFAULT 0,
        courses_bought INTEGER DEFAULT 0,
        modules_completed INTEGER DEFAULT 0,
        materials_watched INTEGER DEFAULT 0,
        events_attended INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content_id INTEGER,
        content_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, content_id, content_type)
      );

      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        price INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        duration VARCHAR(100),
        modules INTEGER DEFAULT 0,
        category VARCHAR(255),
        level VARCHAR(50),
        students_count INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0.0,
        featured BOOLEAN DEFAULT false,
        image_url VARCHAR(500),
        video_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS podcasts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        duration VARCHAR(100),
        category VARCHAR(255),
        listens INTEGER DEFAULT 0,
        image_url VARCHAR(500),
        audio_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS streams (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        duration VARCHAR(100),
        category VARCHAR(255),
        participants INTEGER DEFAULT 0,
        is_live BOOLEAN DEFAULT false,
        thumbnail_url VARCHAR(500),
        video_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        duration VARCHAR(100),
        category VARCHAR(255),
        views INTEGER DEFAULT 0,
        thumbnail_url VARCHAR(500),
        video_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(255),
        material_type VARCHAR(100),
        downloads INTEGER DEFAULT 0,
        image_url VARCHAR(500),
        file_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        event_type VARCHAR(50),
        event_date TIMESTAMP,
        location VARCHAR(500),
        participants INTEGER DEFAULT 0,
        image_url VARCHAR(500),
        registration_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        content TEXT,
        date VARCHAR(100),
        category VARCHAR(255),
        type VARCHAR(100),
        image_url VARCHAR(500),
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

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        course_id INTEGER,
        amount INTEGER,
        currency VARCHAR(10) DEFAULT 'RUB',
        status VARCHAR(50) DEFAULT 'pending',
        payment_system VARCHAR(50),
        payment_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ База данных инициализирована успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();
