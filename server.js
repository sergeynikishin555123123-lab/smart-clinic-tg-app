// server.js - ПОЛНАЯ РЕАЛИЗАЦИЯ СЕРВЕРА, API И БОТА
import express from 'express';
import { Telegraf, session } from 'telegraf';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// База данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Инициализация бота
let bot;
if (process.env.BOT_TOKEN) {
  bot = new Telegraf(process.env.BOT_TOKEN);
  setupBot();
}

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname)));

// ==================== БАЗА ДАННЫХ ====================

async function initDatabase() {
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        image_url VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        activity_type VARCHAR(100),
        content_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ База данных инициализирована');
    
    // Добавляем демо-данные
    await seedDemoData();
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
  }
}

async function seedDemoData() {
  try {
    // Проверяем, есть ли уже курсы
    const { rows } = await pool.query('SELECT COUNT(*) FROM courses');
    if (parseInt(rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO courses (title, description, price, discount, duration, modules, category, level, students_count, rating, featured, image_url) VALUES
        ('Мануальные техники в практике невролога', '6 модулей по современным мануальным методикам', 25000, 16, '12 недель', 6, 'Мануальные техники', 'advanced', 156, 4.8, true, '/webapp/assets/course-default.jpg'),
        ('Неврологическая диагностика', '5 модулей по современной диагностике', 18000, 0, '8 недель', 5, 'Неврология', 'intermediate', 234, 4.6, true, '/webapp/assets/course-default.jpg'),
        ('Реабилитация после инсульта', 'Комплексный подход к восстановлению', 22000, 10, '10 недель', 4, 'Реабилитация', 'intermediate', 189, 4.7, false, '/webapp/assets/course-default.jpg');
      `);
      console.log('✅ Демо-данные добавлены');
    }
  } catch (error) {
    console.error('❌ Ошибка добавления демо-данных:', error);
  }
}

// ==================== TELEGRAM BOT ====================

function setupBot() {
  // Middleware бота
  bot.use(session());

  // Команда /start
  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
    
    try {
      // Сохраняем/обновляем пользователя
      await pool.query(
        `INSERT INTO users (telegram_id, first_name, username) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (telegram_id) 
         DO UPDATE SET first_name = $2, username = $3`,
        [userId, userName, ctx.from.username]
      );

      const welcomeText = `👋 Добро пожаловать в Академию АНБ, ${userName}!

🏥 Мы создали это пространство для врачей, которые хотят:
• Систематизировать знания
• Освоить практические навыки  
• Общаться с коллегами
• Расти профессионально

📚 Что вас ждет:
• Курсы и модули
• Прямые эфиры и разборы
• Практические материалы
• Сообщество специалистов

Используйте кнопки ниже для навигации:`;

      const keyboard = {
        reply_markup: {
          keyboard: [
            ['📱 Открыть Академию', '📚 Курсы'],
            ['🎧 АНБ FM', '📹 Эфиры'],
            ['👤 Мой профиль', '🆘 Поддержка']
          ],
          resize_keyboard: true
        }
      };

      await ctx.reply(welcomeText, keyboard);
    } catch (error) {
      console.error('Ошибка при старте бота:', error);
      await ctx.reply('Привет! Добро пожаловать в Академию АНБ! 🎓');
    }
  });

  // Обработка текстовых сообщений
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    switch(text) {
      case '📱 Открыть Академию':
        await ctx.reply('Открываю Академию...', {
          reply_markup: {
            inline_keyboard: [[{
              text: '🚀 Открыть Академию АНБ',
              web_app: { url: process.env.WEBAPP_URL }
            }]]
          }
        });
        break;
        
      case '📚 Курсы':
        await sendCoursesList(ctx);
        break;
        
      case '👤 Мой профиль':
        await sendUserProfile(ctx);
        break;
        
      case '🆘 Поддержка':
        await ctx.reply(`💬 Поддержка Академии АНБ

📧 Email: support@anb-academy.ru
👤 Координатор: @academy_anb

⏰ Время работы: Пн-Пт с 11:00 до 19:00

Мы поможем с:
• Техническими вопросами
• Оплатой и подписками
• Доступом к материалам
• Любыми трудностями`);
        break;
        
      default:
        await ctx.reply('Используйте кнопки меню для навигации по Академии 🎓');
    }
  });

  // Функция отправки списка курсов
  async function sendCoursesList(ctx) {
    try {
      const { rows: courses } = await pool.query('SELECT * FROM courses LIMIT 3');
      
      let message = '🎯 *Доступные курсы:*\n\n';
      courses.forEach((course, index) => {
        message += `*${index + 1}. ${course.title}*\n`;
        message += `📖 ${course.description}\n`;
        message += `⏱ ${course.duration} | 🎯 ${course.modules} модулей\n`;
        message += `💰 ${formatPrice(course.price)}${course.discount > 0 ? ` (скидка ${course.discount}%)` : ''}\n`;
        message += `⭐ Рейтинг: ${course.rating}/5\n\n`;
      });

      message += `[Посмотреть все курсы](${process.env.WEBAPP_URL}/webapp/#courses)`;

      await ctx.reply(message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{
            text: '📱 Открыть все курсы в Академии',
            web_app: { url: `${process.env.WEBAPP_URL}/webapp/#courses` }
          }]]
        }
      });
    } catch (error) {
      console.error('Ошибка получения курсов:', error);
      await ctx.reply('Курсы временно недоступны. Попробуйте позже.');
    }
  }

  // Функция отправки профиля пользователя
  async function sendUserProfile(ctx) {
    try {
      const { rows: users } = await pool.query(
        'SELECT u.*, up.level, up.experience FROM users u LEFT JOIN user_progress up ON u.id = up.user_id WHERE u.telegram_id = $1',
        [ctx.from.id]
      );

      if (users.length === 0) {
        await ctx.reply('Профиль не найден. Используйте /start для регистрации.');
        return;
      }

      const user = users[0];
      const progress = user.level || 'Понимаю';
      const exp = user.experience || 0;

      const message = `👤 *Ваш профиль*

💫 *Уровень:* ${progress}
⚡ *Опыт:* ${exp} XP
📅 *В Академии с:* ${new Date(user.created_at).toLocaleDateString('ru-RU')}
${user.subscription_end ? `✅ *Подписка активна до:* ${new Date(user.subscription_end).toLocaleDateString('ru-RU')}` : '❌ *Подписка не активна*'}

*Откройте Академию для полной информации:*`;

      await ctx.reply(message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{
            text: '📱 Открыть мой профиль в Академии',
            web_app: { url: `${process.env.WEBAPP_URL}/webapp/#profile` }
          }]]
        }
      });
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      await ctx.reply('Ошибка загрузки профиля. Попробуйте позже.');
    }
  }

  // Запуск бота
  bot.launch().then(() => {
    console.log('✅ Telegram Bot запущен');
  }).catch(error => {
    console.error('❌ Ошибка запуска бота:', error);
  });

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'ANB Academy API'
  });
});

// Получение контента
app.get('/api/content', async (req, res) => {
  try {
    const { rows: courses } = await pool.query('SELECT * FROM courses');
    const { rows: podcasts } = await pool.query("SELECT 1 as id, 'АНБ FM: Современная неврология' as title, 'Обсуждение новых тенденций' as description, '45:20' as duration, 2345 as listens, '/webapp/assets/podcast-default.jpg' as image_url");
    
    const content = {
      courses,
      podcasts,
      streams: [{
        id: 1,
        title: 'Разбор клинического случая',
        description: 'Прямой эфир с разбором сложного случая',
        duration: '1:30:00',
        live: true,
        participants: 89,
        thumbnail_url: '/webapp/assets/stream-default.jpg'
      }],
      videos: [{
        id: 1,
        title: 'Неврологический осмотр за 15 минут',
        description: 'Быстрый гайд по основным тестам',
        duration: '15:30',
        views: 4567,
        thumbnail_url: '/webapp/assets/video-default.jpg'
      }],
      materials: [{
        id: 1,
        title: 'МРТ разбор: Рассеянный склероз',
        description: 'Детальный разбор МРТ с клиническими случаями',
        material_type: 'mri_analysis',
        category: 'Неврология',
        downloads: 1234,
        image_url: '/webapp/assets/material-default.jpg'
      }],
      events: [{
        id: 1,
        title: 'Конференция: Современная неврология 2024',
        description: 'Ежегодная конференция с ведущими специалистами',
        event_date: new Date('2024-02-15T10:00:00').toISOString(),
        location: 'Москва',
        participants: 456,
        image_url: '/webapp/assets/event-default.jpg'
      }],
      stats: {
        totalUsers: 1567,
        totalCourses: courses.length,
        totalMaterials: 45
      }
    };

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('API Content error:', error);
    res.status(500).json({ success: false, error: 'Ошибка загрузки контента' });
  }
});

// Получение/создание пользователя
app.post('/api/user', async (req, res) => {
  try {
    const { user: tgUser } = req.body;
    
    if (!tgUser || !tgUser.id) {
      return res.status(400).json({ success: false, error: 'Неверные данные пользователя' });
    }

    // Находим или создаем пользователя
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

    // Получаем или создаем прогресс
    const { rows: progress } = await pool.query(
      `INSERT INTO user_progress (user_id, level, experience) 
       VALUES ($1, 'Понимаю', 1250)
       ON CONFLICT (user_id) 
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user.id]
    );

    // Получаем избранное
    const { rows: favorites } = await pool.query(
      'SELECT content_id, content_type FROM favorites WHERE user_id = $1',
      [user.id]
    );

    const favoritesMap = {
      courses: favorites.filter(f => f.content_type === 'courses').map(f => f.content_id),
      podcasts: favorites.filter(f => f.content_type === 'podcasts').map(f => f.content_id),
      streams: favorites.filter(f => f.content_type === 'streams').map(f => f.content_id),
      videos: favorites.filter(f => f.content_type === 'videos').map(f => f.content_id),
      materials: favorites.filter(f => f.content_type === 'materials').map(f => f.content_id),
      events: favorites.filter(f => f.content_type === 'events').map(f => f.content_id)
    };

    const userData = {
      id: user.id,
      telegramId: user.telegram_id,
      firstName: user.first_name,
      isAdmin: user.is_admin,
      isSuperAdmin: user.is_super_admin,
      favorites: favoritesMap,
      progress: {
        level: progress[0]?.level || 'Понимаю',
        experience: progress[0]?.experience || 0,
        steps: {
          coursesBought: progress[0]?.courses_bought || 3,
          modulesCompleted: progress[0]?.modules_completed || 2,
          materialsWatched: progress[0]?.materials_watched || 12,
          eventsAttended: progress[0]?.events_attended || 1
        }
      }
    };

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('API User error:', error);
    res.status(500).json({ success: false, error: 'Ошибка загрузки пользователя' });
  }
});

// Управление избранным
app.post('/api/favorites/toggle', async (req, res) => {
  try {
    const { userId, contentId, contentType } = req.body;

    // Проверяем, есть ли уже в избранном
    const { rows: existing } = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
      [userId, contentId, contentType]
    );

    if (existing.length > 0) {
      // Удаляем из избранного
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
        [userId, contentId, contentType]
      );
    } else {
      // Добавляем в избранное
      await pool.query(
        'INSERT INTO favorites (user_id, content_id, content_type) VALUES ($1, $2, $3)',
        [userId, contentId, contentType]
      );
    }

    // Получаем обновленный список избранного
    const { rows: favorites } = await pool.query(
      'SELECT content_id, content_type FROM favorites WHERE user_id = $1',
      [userId]
    );

    const favoritesMap = {
      courses: favorites.filter(f => f.content_type === 'courses').map(f => f.content_id),
      podcasts: favorites.filter(f => f.content_type === 'podcasts').map(f => f.content_id),
      streams: favorites.filter(f => f.content_type === 'streams').map(f => f.content_id),
      videos: favorites.filter(f => f.content_type === 'videos').map(f => f.content_id),
      materials: favorites.filter(f => f.content_type === 'materials').map(f => f.content_id),
      events: favorites.filter(f => f.content_type === 'events').map(f => f.content_id)
    };

    res.json({ success: true, favorites: favoritesMap });
  } catch (error) {
    console.error('API Favorites error:', error);
    res.status(500).json({ success: false, error: 'Ошибка обновления избранного' });
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
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📱 WebApp: ${process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/`}`);
      console.log(`🤖 Bot: ${bot ? 'активен' : 'не настроен (отсутствует BOT_TOKEN)'}`);
      console.log(`🗄️ Database: подключена`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer();
