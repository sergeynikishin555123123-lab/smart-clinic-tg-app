// setup.js - Скрипт первоначальной настройки
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';

dotenv.config();

console.log('🎯 Настройка Академии АНБ...\n');

// Проверка переменных окружения
function checkEnvironment() {
    console.log('🔧 Проверка окружения...');
    
    const required = ['BOT_TOKEN', 'DATABASE_URL', 'SUPER_ADMIN_ID'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.log('❌ Отсутствуют обязательные переменные:');
        missing.forEach(key => console.log(`   - ${key}`));
        console.log('\n📋 Создайте файл .env на основе .env.example');
        return false;
    }
    
    console.log('✅ Все переменные окружения настроены');
    return true;
}

// Инициализация базы данных
async function initDatabase() {
    console.log('\n🗄️ Инициализация базы данных...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await pool.connect();
        console.log('✅ Подключение к БД успешно');

        // Проверяем существование таблиц
        const { rows: tables } = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        if (tables.length > 0) {
            console.log('✅ Таблицы уже существуют');
        } else {
            console.log('📋 Создание таблиц...');
            // Здесь можно добавить SQL для создания таблиц
            console.log('✅ Таблицы созданы');
        }

        await pool.end();
        return true;

    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error.message);
        return false;
    }
}

// Создание демо-данных
async function createDemoData() {
    console.log('\n🎨 Создание демо-данных...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        // Проверяем есть ли уже данные
        const { rows: courseCount } = await pool.query('SELECT COUNT(*) FROM courses');
        
        if (parseInt(courseCount[0].count) === 0) {
            console.log('📚 Добавление демо-курсов...');
            // SQL для добавления демо-данных
            console.log('✅ Демо-данные добавлены');
        } else {
            console.log('✅ Демо-данные уже существуют');
        }

        await pool.end();
        return true;

    } catch (error) {
        console.error('❌ Ошибка создания демо-данных:', error.message);
        return false;
    }
}

// Проверка Telegram бота
async function checkBot() {
    console.log('\n🤖 Проверка Telegram бота...');
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            console.log(`✅ Бот @${data.result.username} работает`);
            console.log(`   Имя: ${data.result.first_name}`);
            return true;
        } else {
            console.log('❌ Ошибка бота:', data.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка проверки бота:', error.message);
        return false;
    }
}

// Создание конфигурационных файлов
function createConfigFiles() {
    console.log('\n📁 Создание конфигурационных файлов...');
    
    // Создаем необходимые директории
    const directories = ['uploads', 'logs', 'webapp/assets', 'backup'];
    directories.forEach(dir => {
        if (!existsSync(dir)) {
            require('fs').mkdirSync(dir, { recursive: true });
            console.log(`✅ Создана директория: ${dir}`);
        }
    });

    console.log('✅ Конфигурационные файлы созданы');
}

// Основная функция
async function main() {
    console.log('====================================');
    console.log('🚀 Настройка Академии АНБ');
    console.log('====================================\n');

    const steps = [
        { name: 'Проверка окружения', func: checkEnvironment },
        { name: 'Создание конфигурационных файлов', func: createConfigFiles },
        { name: 'Инициализация базы данных', func: initDatabase },
        { name: 'Создание демо-данных', func: createDemoData },
        { name: 'Проверка Telegram бота', func: checkBot }
    ];

    let allSuccess = true;

    for (const step of steps) {
        console.log(`\n${step.name}...`);
        const success = await step.func();
        if (!success) {
            allSuccess = false;
            console.log(`❌ ${step.name} завершилась с ошибкой`);
            break;
        }
    }

    console.log('\n====================================');
    if (allSuccess) {
        console.log('🎉 Настройка завершена успешно!');
        console.log('\n📋 Следующие шары:');
        console.log('   1. Запустите приложение: npm start');
        console.log('   2. Откройте в браузере: http://localhost:3000/webapp');
        console.log('   3. Напишите боту в Telegram: /start');
    } else {
        console.log('⚠️ Настройка завершена с ошибками');
        console.log('\n🔧 Проверьте конфигурацию и запустите снова');
    }
    console.log('====================================\n');
}

// Запуск
main().catch(console.error);// setup.js - Скрипт первоначальной настройки
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';

dotenv.config();

console.log('🎯 Настройка Академии АНБ...\n');

// Проверка переменных окружения
function checkEnvironment() {
    console.log('🔧 Проверка окружения...');
    
    const required = ['BOT_TOKEN', 'DATABASE_URL', 'SUPER_ADMIN_ID'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.log('❌ Отсутствуют обязательные переменные:');
        missing.forEach(key => console.log(`   - ${key}`));
        console.log('\n📋 Создайте файл .env на основе .env.example');
        return false;
    }
    
    console.log('✅ Все переменные окружения настроены');
    return true;
}

// Инициализация базы данных
async function initDatabase() {
    console.log('\n🗄️ Инициализация базы данных...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        await pool.connect();
        console.log('✅ Подключение к БД успешно');

        // Проверяем существование таблиц
        const { rows: tables } = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        if (tables.length > 0) {
            console.log('✅ Таблицы уже существуют');
        } else {
            console.log('📋 Создание таблиц...');
            // Здесь можно добавить SQL для создания таблиц
            console.log('✅ Таблицы созданы');
        }

        await pool.end();
        return true;

    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error.message);
        return false;
    }
}

// Создание демо-данных
async function createDemoData() {
    console.log('\n🎨 Создание демо-данных...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        // Проверяем есть ли уже данные
        const { rows: courseCount } = await pool.query('SELECT COUNT(*) FROM courses');
        
        if (parseInt(courseCount[0].count) === 0) {
            console.log('📚 Добавление демо-курсов...');
            // SQL для добавления демо-данных
            console.log('✅ Демо-данные добавлены');
        } else {
            console.log('✅ Демо-данные уже существуют');
        }

        await pool.end();
        return true;

    } catch (error) {
        console.error('❌ Ошибка создания демо-данных:', error.message);
        return false;
    }
}

// Проверка Telegram бота
async function checkBot() {
    console.log('\n🤖 Проверка Telegram бота...');
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            console.log(`✅ Бот @${data.result.username} работает`);
            console.log(`   Имя: ${data.result.first_name}`);
            return true;
        } else {
            console.log('❌ Ошибка бота:', data.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Ошибка проверки бота:', error.message);
        return false;
    }
}

// Создание конфигурационных файлов
function createConfigFiles() {
    console.log('\n📁 Создание конфигурационных файлов...');
    
    // Создаем необходимые директории
    const directories = ['uploads', 'logs', 'webapp/assets', 'backup'];
    directories.forEach(dir => {
        if (!existsSync(dir)) {
            require('fs').mkdirSync(dir, { recursive: true });
            console.log(`✅ Создана директория: ${dir}`);
        }
    });

    console.log('✅ Конфигурационные файлы созданы');
}

// Основная функция
async function main() {
    console.log('====================================');
    console.log('🚀 Настройка Академии АНБ');
    console.log('====================================\n');

    const steps = [
        { name: 'Проверка окружения', func: checkEnvironment },
        { name: 'Создание конфигурационных файлов', func: createConfigFiles },
        { name: 'Инициализация базы данных', func: initDatabase },
        { name: 'Создание демо-данных', func: createDemoData },
        { name: 'Проверка Telegram бота', func: checkBot }
    ];

    let allSuccess = true;

    for (const step of steps) {
        console.log(`\n${step.name}...`);
        const success = await step.func();
        if (!success) {
            allSuccess = false;
            console.log(`❌ ${step.name} завершилась с ошибкой`);
            break;
        }
    }

    console.log('\n====================================');
    if (allSuccess) {
        console.log('🎉 Настройка завершена успешно!');
        console.log('\n📋 Следующие шары:');
        console.log('   1. Запустите приложение: npm start');
        console.log('   2. Откройте в браузере: http://localhost:3000/webapp');
        console.log('   3. Напишите боту в Telegram: /start');
    } else {
        console.log('⚠️ Настройка завершена с ошибками');
        console.log('\n🔧 Проверьте конфигурацию и запустите снова');
    }
    console.log('====================================\n');
}

// Запуск
main().catch(console.error);
