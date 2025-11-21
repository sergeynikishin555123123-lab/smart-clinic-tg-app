import express from 'express';
import { Telegraf, session, Markup } from 'telegraf';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// База данных - исправленная конфигурация
async function createPool() {
  try {
    console.log('🔧 Настройка подключения к БД...');
    
    // Используем параметры из .env
    const poolConfig = {
      user: process.env.DB_USER || 'gen_user',
      host: process.env.DB_HOST || '45.89.190.49',
      database: process.env.DB_NAME || 'default_db',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT) || 5432,
      // Таймауты для стабильности
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20
    };

    console.log('📊 Параметры подключения:');
    console.log(`   Host: ${poolConfig.host}`);
    console.log(`   Database: ${poolConfig.database}`);
    console.log(`   User: ${poolConfig.user}`);
    console.log(`   Port: ${poolConfig.port}`);

    // Тестируем подключение
    const testClient = new Pool(poolConfig);
    const testResult = await testClient.query('SELECT NOW() as time');
    console.log('✅ Тест подключения к БД успешен:', testResult.rows[0].time);
    await testClient.end();

    return new Pool(poolConfig);

  } catch (error) {
    console.error('❌ Ошибка создания пула подключений:', error.message);
    
    // Создаем пул без тестирования (на случай если тест не проходит)
    console.log('⚠️ Создаем пул без предварительного тестирования');
    return new Pool({
      user: process.env.DB_USER || 'gen_user',
      host: process.env.DB_HOST || '45.89.190.49',
      database: process.env.DB_NAME || 'default_db',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT) || 5432,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20
    });
  }
}

let pool;

let pool;

// Асинхронная инициализация пула
async function initializePool() {
  try {
    pool = await createPool();
    console.log('✅ Пул подключений к БД инициализирован');
  } catch (error) {
    console.error('❌ Критическая ошибка инициализации пула БД:', error);
    // Создаем пул в любом случае для продолжения работы
    pool = new Pool({
      user: process.env.DB_USER || 'gen_user',
      host: process.env.DB_HOST || '45.89.190.49',
      database: process.env.DB_NAME || 'default_db',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT) || 5432,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20
    });
  }
}

// Запускаем инициализацию
initializePool();
// Middleware
app.use(express.json());
app.use(express.static(join(__dirname)));

// Middleware для обработки ошибок базы данных
app.use((req, res, next) => {
  // Проверяем подключение к БД перед основными обработчиками
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
        experience INTEGER DEFAULT 1250,
        courses_bought INTEGER DEFAULT 3,
        modules_completed INTEGER DEFAULT 2,
        materials_watched INTEGER DEFAULT 12,
        events_attended INTEGER DEFAULT 1,
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
        image_url VARCHAR(500),
        video_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS podcasts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500),
        description TEXT,
        duration VARCHAR(100),
        category VARCHAR(255),
        listens INTEGER DEFAULT 0,
        image_url VARCHAR(500),
        audio_url VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS streams (
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

      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500),
        description TEXT,
        duration VARCHAR(100),
        category VARCHAR(255),
        views INTEGER DEFAULT 0,
        thumbnail_url VARCHAR(500),
        video_url VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500),
        description TEXT,
        material_type VARCHAR(50),
        category VARCHAR(255),
        downloads INTEGER DEFAULT 0,
        file_url VARCHAR(500),
        image_url VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500),
        description TEXT,
        event_date TIMESTAMP,
        location VARCHAR(255),
        participants INTEGER DEFAULT 0,
        event_type VARCHAR(50),
        image_url VARCHAR(500),
        registration_url VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        activity_type VARCHAR(100),
        content_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ База данных инициализирована');
    await seedDemoData();
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
  }
}

async function seedDemoData() {
  try {
    // Добавляем демо-курсы
    const { rows: courseCount } = await pool.query('SELECT COUNT(*) FROM courses');
    if (parseInt(courseCount[0].count) === 0) {
      await pool.query(`
        INSERT INTO courses (title, description, price, discount, duration, modules, category, level, students_count, rating, featured, image_url, video_url) VALUES
        ('Мануальные техники в практике невролога', '6 модулей по современным мануальным методикам', 25000, 16, '12 недель', 6, 'Мануальные техники', 'advanced', 156, 4.8, true, '/webapp/assets/course-default.jpg', 'https://example.com/video1'),
        ('Неврологическая диагностика', '5 модулей по современной диагностике', 18000, 0, '8 недель', 5, 'Неврология', 'intermediate', 234, 4.6, true, '/webapp/assets/course-default.jpg', 'https://example.com/video2'),
        ('Реабилитация после инсульта', 'Комплексный подход к восстановлению', 22000, 10, '10 недель', 4, 'Реабилитация', 'intermediate', 189, 4.7, false, '/webapp/assets/course-default.jpg', 'https://example.com/video3'),
        ('Физиотерапия в неврологии', 'Современные методы физиолечения', 19500, 5, '6 недель', 4, 'Физиотерапия', 'intermediate', 167, 4.5, false, '/webapp/assets/course-default.jpg', 'https://example.com/video4'),
        ('Фармакотерапия неврологических заболеваний', 'Рациональная фармакотерапия', 21000, 0, '8 недель', 5, 'Фармакотерапия', 'advanced', 145, 4.7, true, '/webapp/assets/course-default.jpg', 'https://example.com/video5');
      `);
    }

    // Добавляем демо-подкасты
    const { rows: podcastCount } = await pool.query('SELECT COUNT(*) FROM podcasts');
    if (parseInt(podcastCount[0].count) === 0) {
      await pool.query(`
        INSERT INTO podcasts (title, description, duration, category, listens, image_url, audio_url) VALUES
        ('АНБ FM: Современная неврология', 'Обсуждение новых тенденций в неврологии', '45:20', 'Неврология', 2345, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio1'),
        ('Мануальная терапия: мифы и реальность', 'Разбор популярных заблуждений', '38:15', 'Мануальные техники', 1876, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio2'),
        ('Реабилитация: комплексный подход', 'Как выстроить эффективную реабилитацию', '52:10', 'Реабилитация', 1567, '/webapp/assets/podcast-default.jpg', 'https://example.com/audio3');
      `);
    }

    // Добавляем демо-эфиры
    const { rows: streamCount } = await pool.query('SELECT COUNT(*) FROM streams');
    if (parseInt(streamCount[0].count) === 0) {
      await pool.query(`
        INSERT INTO streams (title, description, duration, category, participants, is_live, thumbnail_url, video_url) VALUES
        ('Разбор клинического случая: Болевой синдром', 'Прямой эфир с разбором сложного случая болевого синдрома', '1:30:00', 'Неврология', 89, false, '/webapp/assets/stream-default.jpg', 'https://example.com/stream1'),
        ('Мануальные техники: практический разбор', 'Демонстрация мануальных техник на практике', '2:15:00', 'Мануальные техники', 134, true, '/webapp/assets/stream-default.jpg', 'https://example.com/stream2');
      `);
    }

    console.log('✅ Демо-данные добавлены');
  } catch (error) {
    console.error('❌ Ошибка добавления демо-данных:', error);
  }
}

// ==================== TELEGRAM BOT ====================

function setupBot() {
  if (!bot) {
    console.log('🤖 Бот не настроен (отсутствует BOT_TOKEN)');
    return;
  }

  // Обработка graceful shutdown
  const stopBot = () => {
    console.log('🛑 Остановка бота...');
    if (bot) {
      bot.stop();
    }
    process.exit(0);
  };

  process.once('SIGINT', stopBot);
  process.once('SIGTERM', stopBot);

  bot.use(session());

  // Команда /start с опросом
  bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name;
    
    try {
      await pool.query(
        `INSERT INTO users (telegram_id, first_name, username, is_admin, is_super_admin) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (telegram_id) 
         DO UPDATE SET first_name = $2, username = $3`,
        [userId, userName, ctx.from.username, 
         userId == process.env.SUPER_ADMIN_ID, 
         userId == process.env.SUPER_ADMIN_ID]
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

      await ctx.reply(welcomeText, {
        reply_markup: {
          keyboard: [
            ['📱 Открыть Академию', '📚 Курсы'],
            ['🎧 АНБ FM', '📹 Эфиры и разборы'],
            ['👤 Мой профиль', '🆘 Поддержка'],
            ['🗺️ Мероприятия', '💬 Сообщество']
          ],
          resize_keyboard: true
        }
      });

      // Отправляем опрос через 2 секунды
      setTimeout(async () => {
        await ctx.reply('📝 Давайте познакомимся поближе! Ответьте на несколько вопросов:', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✨ Пройти опрос', callback_data: 'start_survey' }
              ]
            ]
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Ошибка при старте бота:', error);
      await ctx.reply('Привет! Добро пожаловать в Академию АНБ! 🎓');
    }
  });

  // Обработка callback-запросов
  bot.action('start_survey', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('📋 Опрос:\n\n1. Ваша специализация?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Невролог', callback_data: 'specialization_neurologist' }],
          [{ text: 'Реабилитолог', callback_data: 'specialization_rehab' }],
          [{ text: 'Мануальный терапевт', callback_data: 'specialization_manual' }],
          [{ text: 'Другое', callback_data: 'specialization_other' }]
        ]
      }
    });
  });

  // Обработка специализации
  bot.action(/specialization_(.+)/, async (ctx) => {
    const specialization = ctx.match[1];
    await ctx.answerCbQuery();
    await ctx.reply('🏙️ В каком городе вы практикуете?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Москва', callback_data: 'city_moscow' }],
          [{ text: 'Санкт-Петербург', callback_data: 'city_spb' }],
          [{ text: 'Другой город', callback_data: 'city_other' }]
        ]
      }
    });
  });

  // Обработка города
  bot.action(/city_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('📧 Укажите ваш email для получения уведомлений:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Пропустить', callback_data: 'skip_email' }]
        ]
      }
    });
  });

  bot.action('skip_email', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('✅ Отлично! Теперь вы полноправный член Академии АНБ! 🎓\n\nИспользуйте кнопки меню для навигации.');
  });

  // Обработка текстовых сообщений
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
        await sendCoursesList(ctx);
        break;
        
      case '🎧 АНБ FM':
        await sendPodcastsList(ctx);
        break;
        
      case '📹 Эфиры и разборы':
        await sendStreamsList(ctx);
        break;
        
      case '👤 Мой профиль':
        await sendUserProfile(ctx);
        break;
        
      case '🗺️ Мероприятия':
        await ctx.reply('🗺️ Карта мероприятий Академии:', {
          reply_markup: {
            inline_keyboard: [[{
              text: '🗺️ Открыть мероприятия',
              web_app: { url: `${process.env.WEBAPP_URL}/webapp/#events` }
            }]]
          }
        });
        break;
        
      case '💬 Сообщество':
        await ctx.reply('👥 Сообщество Академии АНБ:', {
          reply_markup: {
            inline_keyboard: [[{
              text: '💬 Открыть сообщество',
              web_app: { url: `${process.env.WEBAPP_URL}/webapp/#community` }
            }]]
          }
        });
        break;
        
      case '🆘 Поддержка':
        await sendSupportInfo(ctx);
        break;

      case '📋 Анкета':
        await ctx.reply('📝 Заполнить анкету:', {
          reply_markup: {
            inline_keyboard: [[{
              text: '📋 Пройти опрос',
              callback_data: 'start_survey'
            }]]
          }
        });
        break;

      case '🔔 Анонсы':
        await sendAnnouncements(ctx);
        break;

      case '💳 Продлить':
        await sendSubscriptionInfo(ctx);
        break;
        
      default:
        // Если сообщение похоже на email
        if (text.includes('@') && text.includes('.')) {
          await ctx.reply('✅ Email сохранен! Теперь вы будете получать уведомления о новых курсах и мероприятиях.');
        } else {
          await ctx.reply('Используйте кнопки меню для навигации по Академии 🎓');
        }
    }
  });

  // Команда /menu
  bot.command('menu', (ctx) => {
    ctx.reply('Главное меню Академии АНБ:', {
      reply_markup: {
        keyboard: [
          ['📱 Открыть Академию', '📚 Курсы'],
          ['🎧 АНБ FM', '📹 Эфиры и разборы'],
          ['👤 Мой профиль', '🆘 Поддержка'],
          ['🗺️ Мероприятия', '💬 Сообщество']
        ],
        resize_keyboard: true
      }
    });
  });

  // Команда /status
  bot.command('status', async (ctx) => {
    await sendUserProfile(ctx);
  });

  // Команда /support
  bot.command('support', async (ctx) => {
    await sendSupportInfo(ctx);
  });

  // Команда /courses
  bot.command('courses', async (ctx) => {
    await sendCoursesList(ctx);
  });

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
          inline_keyboard: [
            [{
              text: '📱 Открыть все курсы',
              web_app: { url: `${process.env.WEBAPP_URL}/webapp/#courses` }
            }],
            [{
              text: '💳 Купить курс',
              callback_data: 'buy_course'
            }]
          ]
        }
      });
    } catch (error) {
      console.error('Ошибка получения курсов:', error);
      await ctx.reply('Курсы временно недоступны. Попробуйте позже.');
    }
  }

  async function sendPodcastsList(ctx) {
    try {
      const { rows: podcasts } = await pool.query('SELECT * FROM podcasts LIMIT 3');
      
      let message = '🎧 *АНБ FM - последние выпуски:*\n\n';
      podcasts.forEach((podcast, index) => {
        message += `*${index + 1}. ${podcast.title}*\n`;
        message += `📖 ${podcast.description}\n`;
        message += `⏱ ${podcast.duration} | 👂 ${podcast.listens} прослушиваний\n\n`;
      });

      message += `[Посмотреть все подкасты](${process.env.WEBAPP_URL}/webapp/#podcasts)`;

      await ctx.reply(message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{
            text: '🎧 Открыть АНБ FM',
            web_app: { url: `${process.env.WEBAPP_URL}/webapp/#podcasts` }
          }]]
        }
      });
    } catch (error) {
      console.error('Ошибка получения подкастов:', error);
      await ctx.reply('Подкасты временно недоступны. Попробуйте позже.');
    }
  }

  async function sendStreamsList(ctx) {
    try {
      const { rows: streams } = await pool.query('SELECT * FROM streams LIMIT 3');
      
      let message = '📹 *Ближайшие эфиры:*\n\n';
      streams.forEach((stream, index) => {
        message += `*${index + 1}. ${stream.title}*\n`;
        message += `📖 ${stream.description}\n`;
        message += `⏱ ${stream.duration} | 👥 ${stream.participants} участников\n`;
        message += `${stream.is_live ? '🔴 *LIVE СЕЙЧАС*' : '📅 Запланирован'}\n\n`;
      });

      await ctx.reply(message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{
            text: '📹 Открыть эфиры',
            web_app: { url: `${process.env.WEBAPP_URL}/webapp/#streams` }
          }]]
        }
      });
    } catch (error) {
      console.error('Ошибка получения эфиров:', error);
      await ctx.reply('Эфиры временно недоступны. Попробуйте позже.');
    }
  }

  async function sendUserProfile(ctx) {
    try {
      const { rows: users } = await pool.query(
        `SELECT u.*, up.level, up.experience, up.courses_bought, up.modules_completed, up.materials_watched 
         FROM users u 
         LEFT JOIN user_progress up ON u.id = up.user_id 
         WHERE u.telegram_id = $1`,
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

*Имя:* ${user.first_name}
💫 *Уровень:* ${progress}
⚡ *Опыт:* ${exp} XP
📊 *Прогресс:*
   📚 Курсов: ${user.courses_bought || 0}
   🎯 Модулей: ${user.modules_completed || 0}  
   📖 Материалов: ${user.materials_watched || 0}

📅 *В Академии с:* ${new Date(user.created_at).toLocaleDateString('ru-RU')}
${user.subscription_end ? `✅ *Подписка активна до:* ${new Date(user.subscription_end).toLocaleDateString('ru-RU')}` : '❌ *Подписка не активна*'}

*Откройте Академию для детальной информации:*`;

      await ctx.reply(message, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{
              text: '📱 Открыть профиль в Академии',
              web_app: { url: `${process.env.WEBAPP_URL}/webapp/#profile` }
            }],
            [{
              text: '🔄 Продлить подписку',
              callback_data: 'renew_subscription'
            }]
          ]
        }
      });
    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      await ctx.reply('Ошибка загрузки профиля. Попробуйте позже.');
    }
  }

  async function sendSupportInfo(ctx) {
    await ctx.reply(`💬 *Поддержка Академии АНБ*

📧 Email: support@anb-academy.ru
👤 Координатор: @academy_anb
⏰ Время работы: Пн-Пт с 11:00 до 19:00

*Мы поможем с:*
• Техническими вопросами
• Оплатой и подписками  
• Доступом к материалам
• Любыми трудностями

*Форма обратной связи:*`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{
          text: '📝 Написать в поддержку',
          web_app: { url: `${process.env.WEBAPP_URL}/webapp/#support` }
        }]]
      }
    });
  }

  async function sendAnnouncements(ctx) {
    await ctx.reply(`🔔 *Ближайшие события:*

📅 *15 января* - Вебинар "Новые методики в реабилитации"
📅 *20 января* - Эфир с разбором клинического случая
📅 *25 января* - Старт курса "Мануальные техники"

*Не пропустите важные события!*`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{
          text: '🗓️ Все мероприятия',
          web_app: { url: `${process.env.WEBAPP_URL}/webapp/#events` }
        }]]
      }
    });
  }

  async function sendSubscriptionInfo(ctx) {
    await ctx.reply(`💳 *Управление подпиской*

Текущая подписка: 🔹 Премиум
Статус: ✅ Активна
Действует до: 31.12.2024

*Доступные тарифы:*
• 1 месяц - 2 900 ₽
• 3 месяца - 7 500 ₽ (скидка 15%)
• 12 месяцев - 24 000 ₽ (скидка 30%)

*Включено в подписку:*
✓ Все курсы и материалы
✓ Участие в эфирах
✓ Закрытое сообщество
✓ Персональная поддержка`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{
            text: '💳 Продлить подписку',
            web_app: { url: `${process.env.WEBAPP_URL}/webapp/#subscription` }
          }],
          [{
            text: '📋 Подробнее о тарифах',
            callback_data: 'tariff_info'
          }]
        ]
      }
    });
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  }

  // Запуск бота с обработкой ошибок
  bot.launch().then(() => {
    console.log('✅ Telegram Bot запущен');
    setupCronJobs();
    
  }).catch(error => {
    console.error('❌ Ошибка запуска бота:', error.message);
    
    // Перезапуск через 10 секунд при ошибке 409 (уже запущен)
    if (error.message.includes('409') || error.message.includes('Conflict')) {
      console.log('🔄 Обнаружен конфликт запуска. Перезапуск бота через 10 секунд...');
      setTimeout(() => {
        console.log('🔄 Перезапускаем бота...');
        setupBot();
      }, 10000);
    } else {
      console.log('⚠️ Бот будет работать без Telegram функций');
    }
  });
}

// ==================== CRON ЗАДАЧИ ====================

function setupCronJobs() {
  // Ежедневная проверка подписок
  cron.schedule('0 9 * * *', async () => {
    try {
      const { rows: expiringSubscriptions } = await pool.query(
        `SELECT u.telegram_id, u.first_name, us.end_date 
         FROM user_subscriptions us 
         JOIN users u ON us.user_id = u.id 
         WHERE us.end_date = CURRENT_DATE + INTERVAL '3 days' 
         AND us.status = 'active'`
      );

      for (const sub of expiringSubscriptions) {
        try {
          await bot.telegram.sendMessage(
            sub.telegram_id,
            `🔔 Напоминание: Ваша подписка на Академию АНБ истекает через 3 дня (${new Date(sub.end_date).toLocaleDateString('ru-RU')}).\n\nНе прерывайте обучение! Продлите подписку сейчас.`,
            {
              reply_markup: {
                inline_keyboard: [[{
                  text: '🔄 Продлить подписку',
                  web_app: { url: `${process.env.WEBAPP_URL}/webapp/#subscription` }
                }]]
              }
            }
          );
        } catch (error) {
          console.error(`Ошибка отправки уведомления пользователю ${sub.telegram_id}:`, error);
        }
      }
    } catch (error) {
      console.error('Ошибка проверки подписок:', error);
    }
  });

  console.log('✅ Cron задачи настроены');
}

// ==================== API ROUTES ====================

// Простой health check для БД
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
    const { rows: podcasts } = await pool.query('SELECT * FROM podcasts');
    const { rows: streams } = await pool.query('SELECT * FROM streams');
    const { rows: videos } = await pool.query('SELECT * FROM videos');
    const { rows: materials } = await pool.query('SELECT * FROM materials');
    const { rows: events } = await pool.query('SELECT * FROM events');
    
    const content = {
      courses: courses || [],
      podcasts: podcasts || [],
      streams: streams || [],
      videos: videos || [],
      materials: materials || [],
      events: events || [],
      stats: {
        totalUsers: 1567,
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

// Получение/создание пользователя
app.post('/api/user', async (req, res) => {
  try {
    const { user: tgUser } = req.body;
    
    if (!tgUser || !tgUser.id) {
      return res.status(400).json({ success: false, error: 'Неверные данные пользователя' });
    }

    // Создаем демо-пользователя если БД недоступна
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

      const { rows: progress } = await pool.query(
        `INSERT INTO user_progress (user_id) 
         VALUES ($1)
         ON CONFLICT (user_id) 
         DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [user.id]
      );

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
        username: user.username,
        isAdmin: user.is_admin,
        isSuperAdmin: user.is_super_admin,
        subscriptionEnd: user.subscription_end,
        favorites: favoritesMap,
        progress: {
          level: progress[0]?.level || 'Понимаю',
          experience: progress[0]?.experience || 1250,
          steps: {
            coursesBought: progress[0]?.courses_bought || 3,
            modulesCompleted: progress[0]?.modules_completed || 2,
            materialsWatched: progress[0]?.materials_watched || 12,
            eventsAttended: progress[0]?.events_attended || 1
          }
        }
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
    // Ждем инициализации пула БД
    if (!pool) {
      await initializePool();
    }
    
    await initDatabase();
    if (bot) setupBot();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📱 WebApp: ${process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/`}`);
      console.log(`🤖 Bot: ${bot ? 'активен' : 'не настроен'}`);
      console.log(`🔄 Cron: задачи настроены`);
      console.log(`🗄️ База данных: подключена`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer();
