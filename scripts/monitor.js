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

async function monitor() {
  try {
    console.log('📊 Мониторинг Академии АНБ\n');

    // Статистика пользователей
    const usersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_admin THEN 1 END) as admins,
        COUNT(CASE WHEN subscription_end > NOW() THEN 1 END) as active_subscriptions
      FROM users
    `);

    // Статистика контента
    const contentStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM podcasts) as podcasts,
        (SELECT COUNT(*) FROM streams) as streams,
        (SELECT COUNT(*) FROM materials) as materials,
        (SELECT COUNT(*) FROM events) as events
    `);

    // Активность
    const activityStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM favorites) as favorites,
        (SELECT COUNT(*) FROM support_requests WHERE status = 'open') as open_tickets
    `);

    console.log('👥 Пользователи:');
    console.log(`   Всего: ${usersStats.rows[0].total_users}`);
    console.log(`   Админы: ${usersStats.rows[0].admins}`);
    console.log(`   Активные подписки: ${usersStats.rows[0].active_subscriptions}`);

    console.log('\n📚 Контент:');
    console.log(`   Курсы: ${contentStats.rows[0].courses}`);
    console.log(`   Подкасты: ${contentStats.rows[0].podcasts}`);
    console.log(`   Эфиры: ${contentStats.rows[0].streams}`);
    console.log(`   Материалы: ${contentStats.rows[0].materials}`);
    console.log(`   Мероприятия: ${contentStats.rows[0].events}`);

    console.log('\n📈 Активность:');
    console.log(`   Избранное: ${activityStats.rows[0].favorites}`);
    console.log(`   Открытые тикеты: ${activityStats.rows[0].open_tickets}`);

  } catch (error) {
    console.error('❌ Ошибка мониторинга:', error);
  } finally {
    await pool.end();
  }
}

monitor();
