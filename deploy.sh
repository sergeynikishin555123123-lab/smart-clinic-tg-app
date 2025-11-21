#!/bin/bash

echo "🚀 Начало деплоя Академии АНБ..."
echo "📅 $(date)"
echo "======================================"

# Проверка наличия .env
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден"
    echo "Создаю шаблон .env файла..."
    cat > .env.example << EOL
# Конфигурация Академии АНБ
NODE_ENV=production
APP_NAME=Академия АНБ
APP_VERSION=2.0.0
PORT=3000
WEBAPP_URL=https://your-domain.com

# Telegram Bot
BOT_TOKEN=your_telegram_bot_token_here

# База данных
DATABASE_URL=postgresql://username:password@host:port/database

# Администраторы
SUPER_ADMIN_ID=your_telegram_id
ADMIN_IDS=your_telegram_id

# Безопасность
JWT_SECRET=your-super-secret-jwt-key-here

# TimeWeb Cloud
TIMEWEB_DEPLOYMENT=true
EOL
    echo "⚠️ Создан .env.example. Скопируйте его в .env и настройте переменные"
    exit 1
fi

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION"

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
fi

echo "✅ npm $(npm -v)"

# Остановка предыдущего процесса (если есть)
echo "🛑 Остановка предыдущего процесса..."
pkill -f "node server.js" || true
sleep 2

# Резервное копирование (если нужно)
if [ -d "backup" ]; then
    echo "💾 Создание резервной копии..."
    tar -czf "backup/backup-$(date +%Y%m%d-%H%M%S).tar.gz" . --exclude=node_modules --exclude=backup
fi

# Установка/обновление зависимостей
echo "📦 Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

# Создание необходимых директорий
echo "📁 Создание директорий..."
mkdir -p uploads logs webapp/assets backup

# Создание демо-ассетов если их нет
echo "🎨 Проверка ассетов..."
if [ ! -f webapp/assets/course-default.jpg ]; then
    echo "📸 Создание placeholder изображений..."
    # Создаем простые placeholder файлы
    echo "Placeholder" > webapp/assets/course-default.jpg
    echo "Placeholder" > webapp/assets/podcast-default.jpg
    echo "Placeholder" > webapp/assets/stream-default.jpg
    echo "Placeholder" > webapp/assets/video-default.jpg
    echo "Placeholder" > webapp/assets/material-default.jpg
    echo "Placeholder" > webapp/assets/event-default.jpg
    echo "Placeholder" > webapp/assets/offer-default.jpg
    echo "Placeholder" > webapp/assets/news-default.jpg
fi

# Проверка базы данных
echo "🔍 Проверка подключения к базе данных..."
node -e "
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

client.connect()
    .then(() => {
        console.log('✅ Подключение к БД успешно');
        return client.query('SELECT NOW() as time, version() as version');
    })
    .then(result => {
        console.log('🕒 Время БД:', result.rows[0].time);
        console.log('📊 Версия БД:', result.rows[0].version.split(',')[0]);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Ошибка подключения к БД:', err.message);
        process.exit(1);
    });
"

if [ $? -ne 0 ]; then
    echo "⚠️ Продолжаем без проверки БД..."
fi

# Проверка переменных окружения
echo "🔧 Проверка конфигурации..."
if [ -z \"\$BOT_TOKEN\" ]; then
    echo "⚠️ BOT_TOKEN не установлен"
fi

if [ -z \"\$DATABASE_URL\" ]; then
    echo "⚠️ DATABASE_URL не установлен"
fi

# Запуск приложения
echo "🎯 Запуск приложения..."
export NODE_ENV=production

# Используем pm2 если установлен, иначе простой запуск
if command -v pm2 &> /dev/null; then
    echo "🚀 Запуск через PM2..."
    pm2 delete anb-academy || true
    pm2 start server.js --name "anb-academy" --instances 1 --max-memory-restart 512M
    
    echo "✅ Приложение запущено через PM2"
    echo "📊 Статус: pm2 status"
    echo "📋 Логи: pm2 logs anb-academy"
else
    echo "🚀 Запуск напрямую..."
    nohup node server.js > logs/app.log 2>&1 &
    
    echo "✅ Приложение запущено в фоне"
    echo "📋 Логи: tail -f logs/app.log"
fi

# Проверка здоровья
echo "❤️ Проверка здоровья приложения..."
sleep 5

curl -f http://localhost:3000/api/health > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Приложение работает корректно"
    echo "🌐 URL: http://localhost:3000"
    echo "📱 WebApp: http://localhost:3000/webapp"
else
    echo "⚠️ Приложение запущено, но проверка здоровья не удалась"
    echo "🔍 Проверьте логи: tail -f logs/app.log"
fi

echo ""
echo "======================================"
echo "🎉 Деплой завершен!"
echo "📅 $(date)"
echo "======================================"
