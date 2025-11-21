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

// База данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Инициализация бота
let bot;
if (process.env.BOT_TOKEN) {
  bot = new Telegraf(process.env.BOT_TOKEN);
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
  if (!bot) return;

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

    // Обработка покупки курса
    bot.action('buy_course', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('💳 *Выберите курс для покупки:*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: '📚 Мануальные техники - 25 000 ₽',
                        callback_data: 'purchase_course_1'
                    }],
                    [{
                        text: '🧠 Неврологическая диагностика - 18 000 ₽',
                        callback_data: 'purchase_course_2'
                    }],
                    [{
                        text: '🔄 Реабилитация после инсульта - 22 000 ₽',
                        callback_data: 'purchase_course_3'
                    }],
                    [{
                        text: '📱 Открыть все курсы',
                        web_app: { url: `${process.env.WEBAPP_URL}/webapp/#courses` }
                    }]
                ]
            }
        });
    });

    // Обработка выбора курса для покупки
    bot.action(/purchase_course_(.+)/, async (ctx) => {
        const courseId = ctx.match[1];
        await ctx.answerCbQuery();
        await ctx.reply(`✅ *Курс выбран!*\n\nДля завершения покупки откройте Академию:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{
                    text: '💳 Перейти к оплате',
                    web_app: { url: `${process.env.WEBAPP_URL}/webapp/#course-${courseId}` }
                }]]
            }
        });
    });

    // Обработка продления подписки
    bot.action('renew_subscription', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('🔄 *Продление подписки*\n\nВыберите период:', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: '1 месяц - 2 900 ₽',
                        callback_data: 'renew_1'
                    }],
                    [{
                        text: '3 месяца - 7 500 ₽ (скидка 15%)',
                        callback_data: 'renew_3'
                    }],
                    [{
                        text: '12 месяцев - 24 000 ₽ (скидка 30%)',
                        callback_data: 'renew_12'
                    }],
                    [{
                        text: '📱 Управление подпиской',
                        web_app: { url: `${process.env.WEBAPP_URL}/webapp/#subscription` }
                    }]
                ]
            }
        });
    });

    // Обработка информации о тарифах
    bot.action('tariff_info', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply(`📋 *Подробнее о тарифах*

*🔹 Базовый (1 месяц)*
• Доступ ко всем курсам
• Участие в эфирах  
• Закрытое сообщество
• Базовая поддержка

*🔹 Стандарт (3 месяца)*
• Всё из Базового +
• Практические материалы
• Участие в разборах
• Приоритетная поддержка

*🔹 Премиум (12 месяцев)* 
• Всё из Стандартного +
• Персональный куратор
• Ранний доступ к новым курсам
• Участие в офлайн мероприятиях
• Сертификаты о прохождении

*💎 Самый выгодный - Премиум на 12 месяцев!*`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{
                    text: '💳 Выбрать тариф',
                    web_app: { url: `${process.env.WEBAPP_URL}/webapp/#subscription` }
                }]]
            }
        });
    });

    // Обработка продления подписки
    bot.action(/renew_(\d+)/, async (ctx) => {
        const months = ctx.match[1];
        await ctx.answerCbQuery();
        await ctx.reply(`✅ *Подписка на ${months} месяц(ев) выбрана!*\n\nДля завершения оплаты:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{
                    text: '💳 Перейти к оплате',
                    web_app: { url: `${process.env.WEBAPP_URL}/webapp/#subscription` }
                }]]
            }
        });
    });
  
  function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  }

  // Запуск бота
  bot.launch().then(() => {
    console.log('✅ Telegram Bot запущен');
    
    // Запускаем cron-задачи
    setupCronJobs();
    
  }).catch(error => {
    console.error('❌ Ошибка запуска бота:', error);
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
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
      courses,
      podcasts,
      streams,
      videos,
      materials,
      events,
      stats: {
        totalUsers: 1567,
        totalCourses: courses.length,
        totalMaterials: materials.length,
        totalEvents: events.length
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
  } catch (error) {
    console.error('API User error:', error);
    res.status(500).json({ success: false, error: 'Ошибка загрузки пользователя' });
  }
});

// Управление избранным
app.post('/api/favorites/toggle', async (req, res) => {
  try {
    const { userId, contentId, contentType } = req.body;

    const { rows: existing } = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
      [userId, contentId, contentType]
    );

    if (existing.length > 0) {
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
        [userId, contentId, contentType]
      );
    } else {
      await pool.query(
        'INSERT INTO favorites (user_id, content_id, content_type) VALUES ($1, $2, $3)',
        [userId, contentId, contentType]
      );
    }

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

// Обновление прогресса
app.post('/api/progress/update', async (req, res) => {
  try {
    const { userId, activityType, contentId } = req.body;

    await pool.query(
      'INSERT INTO activities (user_id, activity_type, content_id) VALUES ($1, $2, $3)',
      [userId, activityType, contentId]
    );

    // Обновляем прогресс пользователя
    let updateField = '';
    switch (activityType) {
      case 'course_start':
      case 'course_complete':
        updateField = 'courses_bought = courses_bought + 1';
        break;
      case 'module_complete':
        updateField = 'modules_completed = modules_completed + 1';
        break;
      case 'material_view':
        updateField = 'materials_watched = materials_watched + 1';
        break;
      case 'event_attend':
        updateField = 'events_attended = events_attended + 1';
        break;
    }

    if (updateField) {
      await pool.query(
        `UPDATE user_progress 
         SET ${updateField}, experience = experience + 100, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1`,
        [userId]
      );
    }

    res.json({ success: true, message: 'Прогресс обновлен' });
  } catch (error) {
    console.error('API Progress error:', error);
    res.status(500).json({ success: false, error: 'Ошибка обновления прогресса' });
  }
});

// Покупка курса
app.post('/api/purchase/course', async (req, res) => {
  try {
    const { userId, courseId } = req.body;
    
    // Здесь должна быть интеграция с платежной системой
    // Пока просто обновляем прогресс
    
    await pool.query(
      'INSERT INTO activities (user_id, activity_type, content_id) VALUES ($1, $2, $3)',
      [userId, 'course_purchase', courseId]
    );

    await pool.query(
      `UPDATE user_progress 
       SET courses_bought = courses_bought + 1, experience = experience + 500, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ 
      success: true, 
      message: 'Курс успешно приобретен',
      paymentUrl: 'https://example.com/payment' // Заглушка для платежной системы
    });
  } catch (error) {
    console.error('API Purchase error:', error);
    res.status(500).json({ success: false, error: 'Ошибка покупки курса' });
  }
});

// Получение статистики пользователя
app.get('/api/user/:id/stats', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const { rows: progress } = await pool.query(
            `SELECT up.*, u.first_name, u.subscription_end
             FROM user_progress up 
             JOIN users u ON up.user_id = u.id 
             WHERE u.id = $1`,
            [userId]
        );

        const { rows: activities } = await pool.query(
            `SELECT activity_type, COUNT(*) as count 
             FROM activities 
             WHERE user_id = $1 
             GROUP BY activity_type`,
            [userId]
        );

        const { rows: favorites } = await pool.query(
            `SELECT content_type, COUNT(*) as count 
             FROM favorites 
             WHERE user_id = $1 
             GROUP BY content_type`,
            [userId]
        );

        const stats = {
            progress: progress[0] || {},
            activities: activities.reduce((acc, item) => {
                acc[item.activity_type] = parseInt(item.count);
                return acc;
            }, {}),
            favorites: favorites.reduce((acc, item) => {
                acc[item.content_type] = parseInt(item.count);
                return acc;
            }, {}),
            totalXP: progress[0]?.experience || 0,
            level: progress[0]?.level || 'Понимаю'
        };

        res.json({ success: true, stats });
    } catch (error) {
        console.error('API User Stats error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки статистики' });
    }
});

// Управление подпиской
app.post('/api/subscription/manage', async (req, res) => {
    try {
        const { userId, action, period } = req.body;
        
        // Здесь должна быть интеграция с платежной системой
        // Пока возвращаем демо-ответ
        
        let message = '';
        let paymentUrl = '';
        
        switch(action) {
            case 'renew':
                message = `Подписка продлена на ${period} месяцев`;
                paymentUrl = `https://payment.example.com/subscription?user=${userId}&period=${period}`;
                break;
            case 'cancel':
                message = 'Подписка отменена';
                break;
            case 'change':
                message = 'Тарифный план изменен';
                paymentUrl = `https://payment.example.com/change-plan?user=${userId}`;
                break;
        }

        res.json({ 
            success: true, 
            message,
            paymentUrl: paymentUrl || null
        });
    } catch (error) {
        console.error('API Subscription error:', error);
        res.status(500).json({ success: false, error: 'Ошибка управления подпиской' });
    }
});

// Отправка сообщения в поддержку
app.post('/api/support/contact', async (req, res) => {
    try {
        const { userId, topic, courseId, message, attachments } = req.body;
        
        // Здесь должна быть логика отправки email/уведомления
        console.log('Support request:', {
            userId,
            topic,
            courseId,
            message,
            attachments: attachments?.length || 0
        });

        // Сохраняем обращение в базу
        await pool.query(
            `INSERT INTO support_requests (user_id, topic, course_id, message, attachments) 
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, topic, courseId, message, JSON.stringify(attachments)]
        );

        res.json({ 
            success: true, 
            message: 'Сообщение отправлено в поддержку. Ответим в течение 24 часов.' 
        });
    } catch (error) {
        console.error('API Support error:', error);
        res.status(500).json({ success: false, error: 'Ошибка отправки сообщения' });
    }
});

// Получение уведомлений пользователя
app.get('/api/user/:id/notifications', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Демо-уведомления
        const notifications = [
            {
                id: 1,
                type: 'course',
                title: 'Новый курс доступен',
                message: 'Курс "Мануальные техники" теперь в вашем распоряжении',
                date: new Date().toISOString(),
                read: false,
                actionUrl: '/webapp/#courses'
            },
            {
                id: 2,
                type: 'event',
                title: 'Напоминание о эфире',
                message: 'Завтра в 19:00 прямой эфир с разбором клинического случая',
                date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                read: true,
                actionUrl: '/webapp/#streams'
            }
        ];

        res.json({ success: true, notifications });
    } catch (error) {
        console.error('API Notifications error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки уведомлений' });
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
    if (bot) setupBot();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📱 WebApp: ${process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/`}`);
      console.log(`🤖 Bot: ${bot ? 'активен' : 'не настроен'}`);
      console.log(`🔄 Cron: задачи настроены`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer();
