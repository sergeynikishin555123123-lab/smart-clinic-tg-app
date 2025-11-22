import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.WEBAPP_URL || 'http://localhost:3000';

async function healthCheck() {
  console.log('❤️ Проверка здоровья Академии АНБ...\n');

  try {
    // Проверка основного API
    const healthResponse = await axios.get(`${API_BASE}/api/health`);
    console.log('✅ Основной API:', healthResponse.data);

    // Проверка базы данных
    const dbResponse = await axios.get(`${API_BASE}/api/db-health`);
    console.log('✅ База данных:', dbResponse.data);

    // Проверка контента
    const contentResponse = await axios.get(`${API_BASE}/api/content`);
    console.log('✅ Контент:', `Загружено ${contentResponse.data.data?.courses?.length || 0} курсов`);

    console.log('\n🎉 Все системы работают нормально!');

  } catch (error) {
    console.error('❌ Ошибка проверки здоровья:', error.message);
    process.exit(1);
  }
}

healthCheck();
