// setup.js - Скрипт настройки и развертывания
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

console.log('🚀 Настройка Академии АНБ...');

async function setupProject() {
    try {
        console.log('📁 Создание структуры папок...');
        
        // Создаем необходимые папки
        const folders = [
            'webapp/assets',
            'webapp/uploads',
            'logs',
            'temp'
        ];
        
        for (const folder of folders) {
            const fullPath = path.join(__dirname, folder);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`✅ Создана папка: ${folder}`);
            }
        }

        // Создаем демо изображения
        console.log('🎨 Создание демо-изображений...');
        const demoImages = {
            'course-default.jpg': 'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=Курс+АНБ',
            'podcast-default.jpg': 'https://via.placeholder.com/400x250/8B5CF6/FFFFFF?text=АНБ+FM',
            'stream-default.jpg': 'https://via.placeholder.com/400x250/10B981/FFFFFF?text=Эфир',
            'video-default.jpg': 'https://via.placeholder.com/400x250/F59E0B/FFFFFF?text=Видео',
            'material-default.jpg': 'https://via.placeholder.com/400x250/EF4444/FFFFFF?text=Материал',
            'event-default.jpg': 'https://via.placeholder.com/400x250/6366F1/FFFFFF?text=Мероприятие',
            'news-default.jpg': 'https://via.placeholder.com/400x250/06B6D4/FFFFFF?text=Новость'
        };

        for (const [filename, url] of Object.entries(demoImages)) {
            const filePath = path.join(__dirname, 'webapp/assets', filename);
            if (!fs.existsSync(filePath)) {
                // Создаем простой SVG как placeholder
                const svgContent = `
                    <svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
                        <rect width="400" height="250" fill="#1e293b"/>
                        <text x="200" y="125" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="16">
                            ${filename.replace('.jpg', '').replace('-', ' ')}
                        </text>
                    </svg>
                `;
                fs.writeFileSync(filePath.replace('.jpg', '.svg'), svgContent);
                console.log(`✅ Создано изображение: ${filename.replace('.jpg', '.svg')}`);
            }
        }

        // Проверяем наличие .env файла
        const envPath = path.join(__dirname, '.env');
        if (!fs.existsSync(envPath)) {
            console.log('⚠️ Файл .env не найден. Создайте его на основе .env.example');
        }

        console.log('✅ Настройка завершена!');
        console.log('\n🎯 Следующие шаги:');
        console.log('1. Настройте переменные окружения в файле .env');
        console.log('2. Запустите сервер: npm start');
        console.log('3. Откройте в браузере: http://localhost:3000');
        console.log('4. Для бота: настройте BOT_TOKEN в .env');

    } catch (error) {
        console.error('❌ Ошибка настройки:', error);
        process.exit(1);
    }
}

setupProject();
