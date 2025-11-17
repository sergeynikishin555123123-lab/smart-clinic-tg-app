// setup.js - Скрипт настройки системы
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Настройка системы Академии АНБ...');

// Создаем необходимые директории
const directories = [
    'uploads',
    'webapp',
    'logs',
    'temp'
];

directories.forEach(dir => {
    const fullPath = join(__dirname, dir);
    if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Создана директория: ${dir}`);
    } else {
        console.log(`📁 Директория уже существует: ${dir}`);
    }
});

// Создаем базовый index.html если его нет
const webappPath = join(__dirname, 'webapp', 'index.html');
if (!existsSync(webappPath)) {
    const basicHTML = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Академия АНБ</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .container {
            max-width: 600px;
            margin: 100px auto;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        .status {
            padding: 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 Академия АНБ</h1>
        <p>Современное образование для врачей</p>
        <div class="status">
            <p>🚀 Система запускается...</p>
            <p>Пожалуйста, подождите несколько секунд</p>
        </div>
        <script>
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        </script>
    </div>
</body>
</html>`;
    
    writeFileSync(webappPath, basicHTML);
    console.log('✅ Создан базовый index.html');
}

// Создаем файл .env.example если его нет
const envExamplePath = join(__dirname, '.env.example');
if (!existsSync(envExamplePath)) {
    const envExample = `BOT_TOKEN=your_telegram_bot_token_here
PORT=3000
WEBAPP_URL=https://your-domain.com
NODE_ENV=production`;
    
    writeFileSync(envExamplePath, envExample);
    console.log('✅ Создан .env.example');
}

console.log('✅ Настройка системы завершена!');
console.log('🎯 Для запуска выполните: npm start');
console.log('⚡ Для быстрого запуска: npm run quick');
