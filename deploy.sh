#!/bin/bash

echo "🚀 Начало деплоя Академии АНБ..."

# Проверка наличия .env
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден"
    echo "Создайте .env файл с следующими переменными:"
    echo "BOT_TOKEN=ваш_токен_бота"
    echo "DATABASE_URL=ваша_строка_подключения"
    echo "SUPER_ADMIN_ID=ваш_telegram_id"
    echo "WEBAPP_URL=ваш_домен"
    exit 1
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

# Создание директорий
echo "📁 Создание директорий..."
mkdir -p uploads logs webapp/assets

# Создание демо-ассетов
if [ ! -f webapp/assets/course-default.jpg ]; then
    echo "📸 Создание placeholder изображений..."
    # Можно добавить base64 placeholder изображения
    touch webapp/assets/course-default.jpg
    touch webapp/assets/podcast-default.jpg
    touch webapp/assets/stream-default.jpg
    touch webapp/assets/video-default.jpg
    touch webapp/assets/material-default.jpg
    touch webapp/assets/event-default.jpg
    touch webapp/assets/offer-default.jpg
fi

# Проверка базы данных
echo "🔍 Проверка подключения к базе данных..."
node -e "
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => {
        console.log('✅ Подключение к БД успешно');
        return client.query('SELECT NOW()');
    })
    .then(() => {
        console.log('✅ БД отвечает');
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

echo "✅ Деплой завершен"
echo "🎯 Запуск приложения..."
npm start
