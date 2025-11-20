#!/bin/bash

# Скрипт деплоя Академии АНБ на TimeWeb Cloud
echo "🚀 Начало деплоя Академии АНБ..."

# Проверка наличия .env
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден. Создайте его из .env.example"
    exit 1
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Проверка установки
if [ $? -ne 0 ]; then
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

# Создание необходимых директорий
echo "📁 Создание директорий..."
mkdir -p uploads
mkdir -p logs
mkdir -p webapp/assets

# Создание демо-ассетов (если нет реальных)
if [ ! -f webapp/assets/course-default.jpg ]; then
    echo "📸 Создание демо-изображений..."
    # Можно добавить создание placeholder изображений
    touch webapp/assets/course-default.jpg
    touch webapp/assets/podcast-default.jpg
    touch webapp/assets/stream-default.jpg
    touch webapp/assets/video-default.jpg
    touch webapp/assets/material-default.jpg
    touch webapp/assets/event-default.jpg
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

# Запуск приложения
echo "🎯 Запуск приложения..."
npm start
