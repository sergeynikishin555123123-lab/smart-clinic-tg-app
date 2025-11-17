// setup.js - Скрипт настройки системы
import { mkdirSync, existsSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Настройка системы Академии АНБ версии 2.0...');

// Создаем необходимые директории
const directories = [
    'uploads/courses',
    'uploads/podcasts', 
    'uploads/streams',
    'uploads/videos',
    'uploads/materials',
    'uploads/events',
    'uploads/promotions',
    'webapp/assets',
    'logs',
    'temp'
];

directories.forEach(dir => {
    const fullPath = join(__dirname, dir);
    if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Создана директория: ${dir}`);
    }
});

// Создаем файлы-заглушки для изображений
const assetFiles = [
    'course-default.jpg',
    'podcast-default.jpg', 
    'stream-default.jpg',
    'video-default.jpg',
    'material-default.jpg',
    'event-default.jpg',
    'promo-default.jpg',
    'chat-default.jpg',
    'pattern.svg'
];

assetFiles.forEach(file => {
    const assetPath = join(__dirname, 'webapp/assets', file);
    if (!existsSync(assetPath)) {
        // Создаем простой SVG как заглушку
        if (file === 'pattern.svg') {
            writeFileSync(assetPath, `
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.05"/>
        </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <circle cx="50" cy="50" r="20" fill="#2563eb" opacity="0.1"/>
    <circle cx="300" cy="150" r="30" fill="#1d4ed8" opacity="0.1"/>
    <circle cx="200" cy="80" r="25" fill="#3b82f6" opacity="0.1"/>
</svg>
            `);
        } else {
            // Для изображений создаем простой SVG placeholder
            writeFileSync(assetPath, `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#334155"/>
    <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#94a3b8" font-family="Arial" font-size="16">
        ${file.replace('-default.jpg', '').toUpperCase()}
    </text>
</svg>
            `);
        }
        console.log(`✅ Создан ассет: ${file}`);
    }
});

// Создаем .env.example если его нет
const envExamplePath = join(__dirname, '.env.example');
if (!existsSync(envExamplePath)) {
    const envExample = `BOT_TOKEN=your_telegram_bot_token_here
PORT=3000
WEBAPP_URL=https://your-domain.com
ADMIN_IDS=898508164
SUPER_ADMIN_ID=898508164
NODE_ENV=production`;
    
    writeFileSync(envExamplePath, envExample);
    console.log('✅ Создан .env.example');
}

console.log('🎯 Настройка системы завершена!');
console.log('🚀 Для запуска выполните: npm start');
