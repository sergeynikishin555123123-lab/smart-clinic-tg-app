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

async function seedDemoData() {
  try {
    console.log('🌱 Заполнение базы демо-данными...');

    // Демо-курсы
    await pool.query(`
      INSERT INTO courses (title, description, price, discount, duration, modules, category, level, students_count, rating, featured, image_url, video_url) VALUES
      ('Мануальные техники в практике невролога', '6 модулей по современным мануальным методикам', 25000, 16, '12 недель', 6, 'Мануальные техники', 'advanced', 156, 4.8, true, '/webapp/assets/course-default.svg', 'https://example.com/video1'),
      ('Неврологическая диагностика', '5 модулей по современной диагностике', 18000, 0, '8 недель', 5, 'Неврология', 'intermediate', 234, 4.6, true, '/webapp/assets/course-default.svg', 'https://example.com/video2'),
      ('Реабилитация пациентов с инсультом', '4 модуля по современным методикам реабилитации', 22000, 10, '10 недель', 4, 'Реабилитация', 'intermediate', 189, 4.7, false, '/webapp/assets/course-default.svg', 'https://example.com/video3')
      ON CONFLICT DO NOTHING;
    `);

    // Демо-подкасты
    await pool.query(`
      INSERT INTO podcasts (title, description, duration, category, listens, image_url, audio_url) VALUES
      ('АНБ FM: Современная неврология', 'Обсуждение новых тенденций в неврологии', '45:20', 'Неврология', 2345, '/webapp/assets/podcast-default.svg', 'https://example.com/audio1'),
      ('Мануальная терапия: мифы и реальность', 'Разбор популярных заблуждений', '38:15', 'Мануальные техники', 1876, '/webapp/assets/podcast-default.svg', 'https://example.com/audio2')
      ON CONFLICT DO NOTHING;
    `);

    // Демо-стримы
    await pool.query(`
      INSERT INTO streams (title, description, duration, category, participants, is_live, thumbnail_url, video_url) VALUES
      ('LIVE: Ответы на вопросы по мануальной терапии', 'Прямой эфир с ответами на вопросы', '2:15:00', 'Мануальные техники', 156, true, '/webapp/assets/stream-default.svg', 'https://example.com/stream2'),
      ('Разбор сложного случая: боли в спине', 'Детальный разбор диагностики и лечения', '1:25:00', 'Неврология', 89, false, '/webapp/assets/stream-default.svg', 'https://example.com/stream1')
      ON CONFLICT DO NOTHING;
    `);

    // Демо-материалы
    await pool.query(`
      INSERT INTO materials (title, description, category, material_type, downloads, image_url, file_url) VALUES
      ('Чек-лист неврологического осмотра', 'Полный чек-лист для стандартного осмотра', 'Неврология', 'checklist', 234, '/webapp/assets/material-default.svg', 'https://example.com/material1.pdf'),
      ('Протокол ведения пациентов с болями в спине', 'Стандартизированный протокол диагностики и лечения', 'Неврология', 'protocol', 189, '/webapp/assets/material-default.svg', 'https://example.com/material2.pdf')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Демо-данные успешно добавлены!');

  } catch (error) {
    console.error('❌ Ошибка заполнения демо-данными:', error);
  } finally {
    await pool.end();
  }
}

seedDemoData();
