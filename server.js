// server.js - ПОЛНАЯ ВЕРСИЯ С ФУНКЦИОНАЛОМ 2500+ СТРОК
import { Telegraf, session, Markup } from 'telegraf';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import os from 'os';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { spawn, exec } from 'child_process';
import net from 'net';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==================== КОНФИГУРАЦИЯ ====================
// В server.js ДОБАВИТЬ В КОНФИГ:
const config = {
    BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
    PORT: process.env.PORT || 3000,
    WEBAPP_URL: process.env.WEBAPP_URL || `http://localhost:${process.env.PORT || 3000}`, // ✅ ИСПРАВЛЕНО
    ADMIN_IDS: [898508164, 123456789],
    SUPER_ADMIN_ID: 898508164,
    UPLOAD_PATH: join(__dirname, 'uploads'),
    NODE_ENV: process.env.NODE_ENV || 'production',
    // ✅ ДОБАВИТЬ ТАЙМАУТЫ:
    DB_TIMEOUT: 10000,
    REQUEST_TIMEOUT: 30000
};

// ==================== СИСТЕМА УПРАВЛЕНИЯ ПРОЦЕССАМИ ====================
class ProcessManager {
    constructor() {
        this.isPortAvailable = false;
        this.healthStatus = {
            bot: 'unknown',
            server: 'unknown',
            database: 'unknown',
            system: 'unknown'
        };
    }

    async checkPortAvailability(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(`❌ Порт ${port} занят другим процессом`);
                    resolve(false);
                } else {
                    console.log(`⚠️ Ошибка проверки порта ${port}:`, err.message);
                    resolve(false);
                }
            });
            
            server.once('listening', () => {
                server.close();
                console.log(`✅ Порт ${port} свободен`);
                resolve(true);
            });
            
            server.listen(port);
        });
    }

    async freePort(port) {
        return new Promise((resolve) => {
            if (process.platform === 'win32') {
                exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
                    if (stdout) {
                        const lines = stdout.split('\n');
                        lines.forEach(line => {
                            const match = line.match(/(\d+)\s*$/);
                            if (match) {
                                const pid = match[1];
                                console.log(`🛑 Завершаем процесс ${pid} на порту ${port}`);
                                exec(`taskkill /PID ${pid} /F`, () => {});
                            }
                        });
                    }
                    setTimeout(resolve, 1000);
                });
            } else {
                exec(`lsof -ti:${port}`, (error, stdout) => {
                    if (stdout) {
                        const pids = stdout.trim().split('\n');
                        pids.forEach(pid => {
                            if (pid) {
                                console.log(`🛑 Завершаем процесс ${pid} на порту ${port}`);
                                process.kill(parseInt(pid), 'SIGTERM');
                            }
                        });
                    }
                    setTimeout(resolve, 1000);
                });
            }
        });
    }

    async performSystemCheck() {
        console.log('🔍 Проверка работоспособности системы...');
        
        try {
            this.healthStatus.system = 'checking';
            const portAvailable = await this.checkPortAvailability(config.PORT);
            
            if (!portAvailable) {
                console.log('🔄 Пробуем освободить порт...');
                await this.freePort(config.PORT);
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                const portAvailableAfterFree = await this.checkPortAvailability(config.PORT);
                
                if (!portAvailableAfterFree) {
                    console.log('❌ Не удалось освободить порт. Пробуем использовать другой порт...');
                    config.PORT = parseInt(config.PORT) + 1;
                    console.log(`🔄 Используем порт ${config.PORT}`);
                }
            }
            
            this.isPortAvailable = true;
            this.healthStatus.system = 'healthy';
            
            await this.checkInternetConnection();
            
            console.log('✅ Проверка системы завершена');
            return true;
            
        } catch (error) {
            console.error('❌ Ошибка проверки системы:', error);
            this.healthStatus.system = 'unhealthy';
            return false;
        }
    }

    async checkInternetConnection() {
        return new Promise((resolve) => {
            console.log('🌐 Проверка интернет-соединения...');
            
            const endpoints = [
                'https://api.telegram.org',
                'https://google.com',
                'https://cloudflare.com'
            ];
            
            let connected = false;
            let checksCompleted = 0;

            const checkEndpoint = (url) => {
                const req = https.get(url, (res) => {
                    connected = true;
                    console.log(`✅ Интернет соединение: ${url} доступен`);
                    resolve(true);
                });
                
                req.on('error', () => {
                    checksCompleted++;
                    if (checksCompleted >= endpoints.length && !connected) {
                        console.log('⚠️ Некоторые endpoints недоступны, но продолжаем работу');
                        resolve(true);
                    }
                });
                
                req.setTimeout(5000, () => {
                    req.destroy();
                    checksCompleted++;
                    if (checksCompleted >= endpoints.length && !connected) {
                        console.log('⚠️ Таймаут проверки интернета, продолжаем работу');
                        resolve(true);
                    }
                });
            };
            
            endpoints.forEach(checkEndpoint);
        });
    }

    getHealthStatus() {
        return {
            ...this.healthStatus,
            timestamp: new Date().toISOString(),
            port: config.PORT,
            portAvailable: this.isPortAvailable
        };
    }
}

const processManager = new ProcessManager();

// ==================== БАЗА ДАННЫХ ====================
class Database {
    constructor() {
        this.client = null;
        this.connected = false;
    }

    async connect() {
        try {
            console.log('🗄️ Подключение к базе данных...');
            processManager.healthStatus.database = 'connecting';
            
            const { Client } = await import('pg');
            
            this.client = new Client({
                user: 'gen_user',
                host: 'def46fb02c0eac8fefd6f734.twc1.net',
                database: 'default_db',
                password: '5-R;mKGYJ<88?1',
                port: 5432,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 10000,
                idleTimeoutMillis: 30000
            });

            await this.client.connect();
            this.connected = true;
            processManager.healthStatus.database = 'connected';
            console.log('✅ База данных подключена');
            
            await this.createTables();
            await this.initializeDefaultData();
            console.log('✅ Таблицы созданы/проверены');
            
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error.message);
            processManager.healthStatus.database = 'disconnected';
            this.connected = false;
            throw error;
        }
    }

    async createTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB,
                profile_data JSONB DEFAULT '{"specialization": "", "city": "", "email": ""}',
                subscription_data JSONB DEFAULT '{"status": "inactive", "type": null, "end_date": null}',
                progress_data JSONB DEFAULT '{}',
                favorites_data JSONB DEFAULT '{}',
                survey_completed BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                full_description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                duration TEXT,
                modules INTEGER DEFAULT 1,
                category TEXT,
                level TEXT DEFAULT 'beginner',
                image_url TEXT,
                video_url TEXT,
                active BOOLEAN DEFAULT TRUE,
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS podcasts (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                duration TEXT,
                audio_url TEXT,
                image_url TEXT,
                category TEXT,
                listens INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                stream_date TIMESTAMP,
                live BOOLEAN DEFAULT FALSE,
                participants INTEGER DEFAULT 0,
                type TEXT DEFAULT 'stream',
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS video_tips (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                video_url TEXT,
                duration TEXT,
                thumbnail_url TEXT,
                category TEXT,
                views INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                file_url TEXT,
                image_url TEXT,
                material_type TEXT,
                category TEXT,
                downloads INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                event_date TIMESTAMP,
                location TEXT,
                event_type TEXT,
                image_url TEXT,
                registration_url TEXT,
                participants INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS promotions (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                conditions TEXT,
                discount INTEGER DEFAULT 0,
                active BOOLEAN DEFAULT TRUE,
                end_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS chats (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                type TEXT,
                participants_count INTEGER DEFAULT 0,
                last_message TEXT,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                course_id INTEGER REFERENCES courses(id),
                module_id INTEGER,
                progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                last_activity TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                amount DECIMAL(10,2),
                currency TEXT DEFAULT 'RUB',
                status TEXT DEFAULT 'pending',
                payment_method TEXT,
                subscription_type TEXT,
                subscription_duration INTEGER,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                title TEXT NOT NULL,
                message TEXT,
                type TEXT,
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const tableSQL of tables) {
            try {
                await this.client.query(tableSQL);
            } catch (error) {
                console.error(`❌ Ошибка создания таблицы:`, error.message);
            }
        }
    }

    async initializeDefaultData() {
        try {
            // Создаем супер-админа если его нет
            const superAdminCheck = await this.client.query(
                'SELECT * FROM users WHERE id = $1',
                [config.SUPER_ADMIN_ID]
            );

            if (superAdminCheck.rows.length === 0) {
                await this.client.query(
                    `INSERT INTO users (id, telegram_data, profile_data, is_admin, is_super_admin, survey_completed)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        config.SUPER_ADMIN_ID,
                        {
                            first_name: 'Супер Администратор',
                            username: 'superadmin'
                        },
                        {
                            specialization: 'Администратор системы',
                            city: 'Москва',
                            email: 'admin@anb.ru'
                        },
                        true,
                        true,
                        true
                    ]
                );
                console.log('✅ Супер-администратор создан');
            }

            // Создаем демо-контент если его нет
            await this.initializeDemoContent();
            
        } catch (error) {
            console.error('Ошибка инициализации данных:', error);
        }
    }

    async initializeDemoContent() {
        try {
            // Проверяем есть ли курсы
            const coursesCheck = await this.client.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCheck.rows[0].count) === 0) {
                console.log('📚 Создаем демо-контент...');
                
                // Демо курсы
                const demoCourses = [
                    {
                        title: 'Мануальные техники в практике',
                        description: '6 модулей по современным мануальным методикам',
                        full_description: 'Комплексный курс по мануальным техникам для практикующих врачей. Изучите современные подходы к диагностике и лечению.',
                        price: 15000,
                        duration: '12 часов',
                        modules: 6,
                        category: 'Мануальные техники',
                        level: 'advanced',
                        students_count: 45,
                        rating: 4.8
                    },
                    {
                        title: 'Неврология для практикующих врачей',
                        description: 'Основы неврологической диагностики',
                        full_description: 'Фундаментальный курс по неврологии с акцентом на практическое применение.',
                        price: 12000,
                        duration: '10 часов',
                        modules: 5,
                        category: 'Неврология',
                        level: 'intermediate',
                        students_count: 67,
                        rating: 4.6
                    }
                ];

                for (const course of demoCourses) {
                    await this.client.query(
                        `INSERT INTO courses (title, description, full_description, price, duration, modules, category, level, students_count, rating)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [course.title, course.description, course.full_description, course.price, course.duration, 
                         course.modules, course.category, course.level, course.students_count, course.rating]
                    );
                }

                // Демо подкасты
                const demoPodcasts = [
                    {
                        title: 'АНБ FM: Современная неврология',
                        description: 'Обсуждение новых тенденций в неврологии',
                        duration: '45:20',
                        category: 'Неврология',
                        listens: 234
                    },
                    {
                        title: 'АНБ FM: Реабилитационные методики',
                        description: 'Новые подходы к реабилитации',
                        duration: '38:15',
                        category: 'Реабилитация',
                        listens: 167
                    }
                ];

                for (const podcast of demoPodcasts) {
                    await this.client.query(
                        `INSERT INTO podcasts (title, description, duration, category, listens)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [podcast.title, podcast.description, podcast.duration, podcast.category, podcast.listens]
                    );
                }

                // Демо стримы
                const demoStreams = [
                    {
                        title: 'Разбор клинического случая: Болевой синдром',
                        description: 'Прямой эфир с разбором сложного случая',
                        duration: '1:30:00',
                        stream_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        live: true,
                        participants: 89,
                        type: 'analysis'
                    },
                    {
                        title: 'Мануальные техники: Демонстрация',
                        description: 'Практическая демонстрация методик',
                        duration: '2:15:00',
                        stream_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        live: false,
                        participants: 156,
                        type: 'stream'
                    }
                ];

                for (const stream of demoStreams) {
                    await this.client.query(
                        `INSERT INTO streams (title, description, duration, stream_date, live, participants, type)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [stream.title, stream.description, stream.duration, stream.stream_date, 
                         stream.live, stream.participants, stream.type]
                    );
                }

                // Демо материалы
                const demoMaterials = [
                    {
                        title: 'МРТ разбор: Рассеянный склероз',
                        description: 'Детальный разбор МРТ с клиническими случаями',
                        material_type: 'mri',
                        category: 'Неврология',
                        downloads: 123
                    },
                    {
                        title: 'Чек-лист: Неврологический осмотр',
                        description: 'Пошаговый чек-лист для ежедневной практики',
                        material_type: 'checklist',
                        category: 'Неврология',
                        downloads: 267
                    }
                ];

                for (const material of demoMaterials) {
                    await this.client.query(
                        `INSERT INTO materials (title, description, material_type, category, downloads)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [material.title, material.description, material.material_type, material.category, material.downloads]
                    );
                }

                // Демо мероприятия
                const demoEvents = [
                    {
                        title: 'Конференция: Современная неврология 2024',
                        description: 'Ежегодная конференция с ведущими специалистами',
                        event_date: new Date('2024-02-15T10:00:00'),
                        location: 'Москва',
                        event_type: 'offline',
                        participants: 45
                    },
                    {
                        title: 'Онлайн-семинар: Реабилитация после инсульта',
                        description: 'Практические аспекты реабилитации',
                        event_date: new Date('2024-01-20T14:00:00'),
                        location: 'Онлайн',
                        event_type: 'online',
                        participants: 120
                    }
                ];

                for (const event of demoEvents) {
                    await this.client.query(
                        `INSERT INTO events (title, description, event_date, location, event_type, participants)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [event.title, event.description, event.event_date, event.location, event.event_type, event.participants]
                    );
                }

                // Демо акции
                const demoPromotions = [
                    {
                        title: 'Скидка 20% на первую подписку',
                        description: 'Специальное предложение для новых пользователей',
                        discount: 20,
                        active: true,
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    },
                    {
                        title: 'Бесплатный доступ к базовым курсам',
                        description: 'Получите доступ к 3 базовым курсам бесплатно',
                        discount: 100,
                        active: true,
                        end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                    }
                ];

                for (const promo of demoPromotions) {
                    await this.client.query(
                        `INSERT INTO promotions (title, description, discount, active, end_date)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [promo.title, promo.description, promo.discount, promo.active, promo.end_date]
                    );
                }

                // Демо чаты
                const demoChats = [
                    {
                        name: 'Общий чат Академии',
                        description: 'Основной чат для общения всех участников',
                        type: 'group',
                        participants_count: 156,
                        last_message: 'Добро пожаловать в Академию!'
                    },
                    {
                        name: 'Неврология',
                        description: 'Обсуждение неврологических тем',
                        type: 'group',
                        participants_count: 67,
                        last_message: 'Кто-нибудь сталкивался с подобным случаем?'
                    }
                ];

                for (const chat of demoChats) {
                    await this.client.query(
                        `INSERT INTO chats (name, description, type, participants_count, last_message)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [chat.name, chat.description, chat.type, chat.participants_count, chat.last_message]
                    );
                }

                console.log('✅ Демо-контент создан');
            }
        } catch (error) {
            console.error('Ошибка создания демо-контента:', error);
        }
    }

    async query(text, params) {
        if (!this.connected) {
            throw new Error('База данных не подключена');
        }
        try {
            return await this.client.query(text, params);
        } catch (error) {
            console.error('❌ Ошибка запроса к БД:', error);
            throw error;
        }
    }
}

const db = new Database();

// ==================== TELEGRAM BOT ====================
class TelegramBot {
    constructor() {
        this.bot = null;
        this.userSessions = new Map();
        this.isRunning = false;
        this.init();
    }

    init() {
        try {
            console.log('🤖 Инициализация Telegram бота...');
            this.bot = new Telegraf(config.BOT_TOKEN);
            
            this.bot.use(session());

            // Регистрируем все обработчики
            this.registerHandlers();

            processManager.healthStatus.bot = 'initialized';
            console.log('✅ Telegram бот инициализирован');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации бота:', error);
            processManager.healthStatus.bot = 'error';
            throw error;
        }
    }

    registerHandlers() {
        // Команды
        this.bot.start(this.handleStart.bind(this));
        this.bot.command('menu', this.handleMenu.bind(this));
        this.bot.command('admin', this.handleAdmin.bind(this));
        this.bot.command('help', this.handleHelp.bind(this));
        this.bot.command('status', this.handleStatus.bind(this));
        this.bot.command('health', this.handleHealth.bind(this));
        this.bot.command('stats', this.handleStats.bind(this));
        this.bot.command('restart', this.handleRestart.bind(this));

        // Текстовые сообщения
        this.bot.on('text', this.handleText.bind(this));

        // Callback queries
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));

        // Обработка ошибок
        this.bot.catch((err, ctx) => {
            console.error('❌ Ошибка бота:', err);
            try {
                ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.').catch(console.error);
            } catch (e) {
                console.error('Не удалось отправить сообщение об ошибке:', e);
            }
        });
    }

    async handleStart(ctx) {
        const userId = ctx.from.id;
        console.log(`🚀 Пользователь ${userId} запустил бота`);

        try {
            const user = await this.getOrCreateUser(ctx.from);
            
            if (!user.survey_completed) {
                await this.startSurvey(ctx);
            } else {
                await this.showMainMenu(ctx);
            }
        } catch (error) {
            console.error('Ошибка в handleStart:', error);
            await ctx.reply('❌ Произошла ошибка при загрузке вашего профиля. Пожалуйста, попробуйте позже.');
        }
    }

    async handleHealth(ctx) {
        const userId = ctx.from.id;
        const user = await this.getOrCreateUser(ctx.from);
        
        if (!user.is_admin && !user.is_super_admin) {
            await ctx.reply('❌ У вас нет прав для просмотра статуса системы');
            return;
        }

        const healthStatus = processManager.getHealthStatus();
        let statusMessage = '🔍 **Статус системы Академии АНБ**\n\n';
        
        statusMessage += `🤖 **Бот:** ${this.getStatusEmoji(healthStatus.bot)} ${healthStatus.bot}\n`;
        statusMessage += `🌐 **Сервер:** ${this.getStatusEmoji(healthStatus.server)} ${healthStatus.server}\n`;
        statusMessage += `🗄️ **База данных:** ${this.getStatusEmoji(healthStatus.database)} ${healthStatus.database}\n`;
        statusMessage += `⚙️ **Система:** ${this.getStatusEmoji(healthStatus.system)} ${healthStatus.system}\n\n`;
        
        statusMessage += `📊 **Порт:** ${healthStatus.port}\n`;
        statusMessage += `🔌 **Порт доступен:** ${healthStatus.portAvailable ? '✅' : '❌'}\n`;
        statusMessage += `🕐 **Проверка:** ${new Date(healthStatus.timestamp).toLocaleString('ru-RU')}\n\n`;

        if (user.is_super_admin) {
            statusMessage += '🛠️ **Режим:** Супер-администратор\n';
        }

        await ctx.reply(statusMessage, { parse_mode: 'Markdown' });
    }

    async handleStats(ctx) {
        const userId = ctx.from.id;
        const user = await this.getOrCreateUser(ctx.from);
        
        if (!user.is_admin && !user.is_super_admin) {
            await ctx.reply('❌ У вас нет прав для просмотра статистики');
            return;
        }

        try {
            const usersCount = await db.query('SELECT COUNT(*) FROM users');
            const coursesCount = await db.query('SELECT COUNT(*) FROM courses WHERE active = TRUE');
            const activeSubscriptions = await db.query('SELECT COUNT(*) FROM users WHERE subscription_data->>\'status\' = \'active\'');
            const totalRevenue = await db.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = \'completed\'');

            let statsMessage = '📊 **Статистика системы**\n\n';
            statsMessage += `👥 **Пользователей:** ${usersCount.rows[0].count}\n`;
            statsMessage += `📚 **Активных курсов:** ${coursesCount.rows[0].count}\n`;
            statsMessage += `💳 **Активных подписок:** ${activeSubscriptions.rows[0].count}\n`;
            statsMessage += `💰 **Общий доход:** ${parseFloat(totalRevenue.rows[0].total).toLocaleString('ru-RU')} ₽\n\n`;

            if (user.is_super_admin) {
                const today = new Date().toISOString().split('T')[0];
                const todayRegistrations = await db.query('SELECT COUNT(*) FROM users WHERE DATE(created_at) = $1', [today]);
                statsMessage += `📈 **Регистраций сегодня:** ${todayRegistrations.rows[0].count}\n`;
            }

            await ctx.reply(statsMessage, { parse_mode: 'Markdown' });

        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            await ctx.reply('❌ Ошибка при получении статистики');
        }
    }

    async handleRestart(ctx) {
        const userId = ctx.from.id;
        const user = await this.getOrCreateUser(ctx.from);
        
        if (!user.is_super_admin) {
            await ctx.reply('❌ Только супер-администратор может перезапускать систему');
            return;
        }

        await ctx.reply('🔄 Перезапуск системы...');
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }

    getStatusEmoji(status) {
        const emojis = {
            'healthy': '✅', 'connected': '✅', 'running': '✅',
            'initialized': '🔄', 'checking': '🔍', 'pending': '⏳',
            'unhealthy': '❌', 'disconnected': '❌', 'error': '🚨',
            'unknown': '❓'
        };
        return emojis[status] || '❓';
    }

    async startSurvey(ctx) {
        const userId = ctx.from.id;
        this.userSessions.set(userId, { step: 'specialization' });
        
        await ctx.reply(
            '👋 Добро пожаловать в Академию АНБ, ' + ctx.from.first_name + '!\n\n' +
            '🎯 Давайте познакомимся поближе!\n\n' +
            '1. Ваша специализация:',
            {
                reply_markup: {
                    keyboard: [
                        ['Невролог', 'Реабилитолог'],
                        ['Мануальный терапевт', 'Физиотерапевт'],
                        ['Другая специализация']
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    }

    async handleText(ctx) {
        const userId = ctx.from.id;
        const session = this.userSessions.get(userId);
        const text = ctx.message.text;

        if (session) {
            await this.handleSurveyStep(ctx, session, text);
            return;
        }

        switch(text) {
            case '📱 Навигация':
                await ctx.reply('🎯 Откройте наше приложение для полного доступа:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { 
                                text: '📱 Открыть Академию АНБ', 
                                web_app: { url: config.WEBAPP_URL } 
                            }
                        ]]
                    }
                });
                break;

            case '🎁 Акции':
                await ctx.reply('🎁 Специальные предложения:\n\nОткройте приложение для просмотра актуальных акций!', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                });
                break;

            case '❓ Вопрос':
                await ctx.reply(
                    '💬 Задайте вопрос по обучению\n\n' +
                    'Напишите ваш вопрос, и мы обязательно поможем!\n\n' +
                    '📞 Координатор: @academy_anb\n' +
                    '⏰ Время работы: ПН-ПТ 11:00-19:00'
                );
                break;

            case '🔄 Продлить':
                await ctx.reply('💳 Продление подписки\n\nУправляйте подпиской в приложении:', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                });
                break;

            case '📢 Анонсы':
                await ctx.reply('📢 Ближайшие мероприятия:\n\nОткройте приложение для просмотра анонсов!', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '📱 Открыть приложение', web_app: { url: config.WEBAPP_URL } }
                        ]]
                    }
                });
                break;

            case '🆘 Поддержка':
                await ctx.reply(
                    '🆘 Служба поддержки Академии АНБ\n\n' +
                    '📞 Координатор: @academy_anb\n' +
                    '⏰ Время работы: ПН-ПТ 11:00-19:00\n' +
                    '📧 Email: academy@anb.ru\n\n' +
                    'Мы всегда готовы помочь!'
                );
                break;

            default:
                await this.showMainMenu(ctx);
        }
    }

    async handleSurveyStep(ctx, session, text) {
        const userId = ctx.from.id;
        
        try {
            switch(session.step) {
                case 'specialization':
                    session.specialization = text;
                    session.step = 'city';
                    this.userSessions.set(userId, session);
                    
                    await ctx.reply('2. Ваш город:', {
                        reply_markup: {
                            keyboard: [
                                ['Москва', 'Санкт-Петербург'],
                                ['Новосибирск', 'Екатеринбург'],
                                ['Другой город']
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    });
                    break;

                case 'city':
                    session.city = text;
                    session.step = 'email';
                    this.userSessions.set(userId, session);
                    
                    await ctx.reply('3. Ваш email:\n\n(для отправки материалов и уведомлений)', {
                        reply_markup: { remove_keyboard: true }
                    });
                    break;

                case 'email':
                    session.email = text;
                    
                    await this.updateUserProfile(userId, {
                        specialization: session.specialization,
                        city: session.city,
                        email: session.email
                    });
                    
                    this.userSessions.delete(userId);
                    
                    await ctx.reply(
                        '✅ Отлично! Анкета заполнена!\n\n' +
                        '🏷️ Специализация: ' + session.specialization + '\n' +
                        '🏙️ Город: ' + session.city + '\n' +
                        '📧 Email: ' + session.email + '\n\n' +
                        'Теперь у вас есть полный доступ к Академии АНБ! 🎓'
                    );
                    
                    await this.showMainMenu(ctx);
                    break;
            }
        } catch (error) {
            console.error('Ошибка в handleSurveyStep:', error);
            await ctx.reply('Произошла ошибка. Давайте попробуем еще раз.');
            this.userSessions.delete(userId);
            await this.showMainMenu(ctx);
        }
    }

    async updateUserProfile(userId, profileData) {
        await db.query(
            'UPDATE users SET profile_data = $1, survey_completed = TRUE WHERE id = $2',
            [profileData, userId]
        );
    }

    async showMainMenu(ctx) {
        await ctx.reply('🎯 Главное меню Академии АНБ', {
            reply_markup: {
                keyboard: [
                    ['📱 Навигация', '🎁 Акции'],
                    ['❓ Вопрос', '🔄 Продлить'],
                    ['📢 Анонсы', '🆘 Поддержка']
                ],
                resize_keyboard: true
            }
        });
    }

    async handleMenu(ctx) {
        await this.showMainMenu(ctx);
    }

    async handleAdmin(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            if (!user.is_admin && !user.is_super_admin) {
                await ctx.reply('❌ У вас нет прав доступа к админ-панели');
                return;
            }
            
            const adminType = user.is_super_admin ? '🛠️ Супер-администратор' : '🔧 Администратор';
            
            await ctx.reply(`${adminType}`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📱 Открыть WebApp', web_app: { url: config.WEBAPP_URL } }],
                        [{ text: '📊 Статистика', callback_data: 'admin_stats' }],
                        [{ text: '👥 Пользователи', callback_data: 'admin_users' }],
                        [{ text: '🔍 Статус системы', callback_data: 'admin_health' }],
                        user.is_super_admin ? 
                        [{ text: '🔄 Перезапуск', callback_data: 'admin_restart' }] : []
                    ].filter(Boolean)
                }
            });
        } catch (error) {
            console.error('Ошибка в handleAdmin:', error);
            await ctx.reply('Произошла ошибка при доступе к админ-панели.');
        }
    }

    async handleHelp(ctx) {
        await ctx.reply(
            '💬 Помощь по Академии АНБ\n\n' +
            '📱 Навигация - полный доступ ко всем функциям\n' +
            '🎁 Акции - специальные предложения\n' +
            '❓ Вопрос - задать вопрос по обучению\n' +
            '🔄 Продлить - управление подпиской\n' +
            '📢 Анонсы - ближайшие мероприятия\n' +
            '🆘 Поддержка - помощь и консультации\n\n' +
            'По всем вопросам: @academy_anb'
        );
    }

    async handleStatus(ctx) {
        try {
            const user = await this.getOrCreateUser(ctx.from);
            const subscription = user.subscription_data || {};
            
            let statusMessage = '👤 Ваш статус\n\n';
            statusMessage += '🏷️ Имя: ' + user.telegram_data.first_name + '\n';
            statusMessage += '🎯 Специализация: ' + (user.profile_data?.specialization || 'Не указана') + '\n';
            statusMessage += '🏙️ Город: ' + (user.profile_data?.city || 'Не указан') + '\n\n';
            
            if (subscription.status === 'active') {
                statusMessage += '✅ Подписка активна\n';
                if (subscription.end_date) {
                    statusMessage += '📅 До: ' + new Date(subscription.end_date).toLocaleDateString('ru-RU') + '\n';
                }
                if (subscription.type) {
                    statusMessage += '💎 Тип: ' + subscription.type + '\n';
                }
            } else {
                statusMessage += '❌ Подписка не активна\n';
            }

            if (user.is_super_admin) {
                statusMessage += '\n🛠️ **Супер-администратор системы**';
            } else if (user.is_admin) {
                statusMessage += '\n🔧 **Администратор системы**';
            }

            await ctx.reply(statusMessage);
        } catch (error) {
            console.error('Ошибка в handleStatus:', error);
            await ctx.reply('Не удалось загрузить статус. Попробуйте позже.');
        }
    }

    async handleCallbackQuery(ctx) {
        const data = ctx.callbackQuery.data;
        
        try {
            const user = await this.getOrCreateUser(ctx.from);
            
            switch(data) {
                case 'admin_stats':
                    if (user.is_admin || user.is_super_admin) {
                        await this.handleStats(ctx);
                    }
                    break;

                case 'admin_health':
                    if (user.is_admin || user.is_super_admin) {
                        await this.handleHealth(ctx);
                    }
                    break;

                case 'admin_restart':
                    if (user.is_super_admin) {
                        await this.handleRestart(ctx);
                    }
                    break;

                case 'admin_users':
                    if (user.is_admin || user.is_super_admin) {
                        const usersCount = await db.query('SELECT COUNT(*) FROM users');
                        await ctx.reply(`👥 Всего пользователей: ${usersCount.rows[0].count}\n\nДля детального управления используйте админ-панель в приложении.`, {
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '📱 Открыть админ-панель', web_app: { url: config.WEBAPP_URL } }
                                ]]
                            }
                        });
                    }
                    break;

                default:
                    await ctx.answerCbQuery('⚙️ Функция в разработке');
            }

            await ctx.answerCbQuery();
        } catch (error) {
            console.error('Ошибка обработки callback:', error);
            await ctx.answerCbQuery('❌ Произошла ошибка');
        }
    }

   // server.js - ЗАМЕНИТЬ НА ЭТОТ КОД:
async getOrCreateUser(telegramUser) {
    try {
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [telegramUser.id]
        );

        let user;
        
        if (result.rows.length > 0) {
            user = result.rows[0];
        } else {
            // ✅ ПРАВИЛЬНО: Создаем пользователя сначала
            const newUser = {
                id: telegramUser.id,
                telegram_data: {
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name || '',
                    username: telegramUser.username || '',
                    language_code: telegramUser.language_code || 'ru'
                },
                profile_data: {
                    specialization: '',
                    city: '',
                    email: ''
                },
                subscription_data: {
                    status: 'inactive',
                    type: null,
                    end_date: null
                },
                progress_data: {
                    level: 'Понимаю',
                    steps: {
                        materialsWatched: 0,
                        eventsParticipated: 0,
                        materialsSaved: 0,
                        coursesBought: 0,
                        modulesCompleted: 0,
                        offlineEvents: 0,
                        publications: 0
                    },
                    progress: {
                        understand: 0,
                        connect: 0,
                        apply: 0,
                        systematize: 0,
                        share: 0
                    }
                },
                favorites_data: {
                    watchLater: [],
                    favorites: [],
                    materials: []
                },
                survey_completed: false,
                is_admin: false,
                is_super_admin: false
            };

            await db.query(
                `INSERT INTO users (id, telegram_data, profile_data, subscription_data, progress_data, favorites_data, survey_completed)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [newUser.id, newUser.telegram_data, newUser.profile_data, 
                 newUser.subscription_data, newUser.progress_data, newUser.favorites_data, 
                 newUser.survey_completed]
            );

            user = newUser;
            console.log(`✅ Создан новый пользователь: ${telegramUser.first_name} (${telegramUser.id})`);
        }

        // ✅ ПРАВИЛЬНО: Проверяем админские права ПОСЛЕ получения/создания пользователя
        const isSuperAdmin = user.id === config.SUPER_ADMIN_ID;
        const isAdmin = isSuperAdmin || config.ADMIN_IDS.includes(user.id);
        
        // Обновляем права если нужно
        if ((isAdmin && !user.is_admin) || (isSuperAdmin && !user.is_super_admin)) {
            await db.query(
                'UPDATE users SET is_admin = $1, is_super_admin = $2 WHERE id = $3',
                [isAdmin, isSuperAdmin, user.id]
            );
            user.is_admin = isAdmin;
            user.is_super_admin = isSuperAdmin;
            
            if (isSuperAdmin) {
                console.log(`🛠️ Пользователь назначен супер-администратором`);
            } else if (isAdmin) {
                console.log(`🔧 Пользователь назначен администратором`);
            }
        }

        return user;
        
    } catch (error) {
        console.error('❌ Ошибка создания пользователя:', error);
        throw error;
    }
}

    async launch() {
        try {
            if (!this.bot) {
                throw new Error('Бот не инициализирован');
            }

            console.log('🚀 Запуск Telegram бота...');
            
            await this.bot.launch();
            this.isRunning = true;
            processManager.healthStatus.bot = 'running';
            console.log('✅ Telegram Bot запущен успешно');
            
        } catch (error) {
            console.error('❌ Ошибка запуска бота:', error);
            processManager.healthStatus.bot = 'error';
            throw error;
        }
    }
}

const telegramBot = new TelegramBot();

// ==================== EXPRESS SERVER ====================
const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(config.UPLOAD_PATH));
app.use(express.static(join(__dirname, 'webapp')));

// ==================== API ROUTES ====================

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        db: db.connected ? 'connected' : 'disconnected',
        bot: telegramBot.isRunning ? 'running' : 'stopped',
        version: '1.0.0'
    });
});

app.post('/api/user', async (req, res) => {
    try {
        const { id, firstName, lastName, username } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.telegram_data?.first_name || firstName,
                lastName: user.telegram_data?.last_name || lastName,
                specialization: user.profile_data?.specialization,
                city: user.profile_data?.city,
                email: user.profile_data?.email,
                subscription: user.subscription_data,
                progress: user.progress_data,
                favorites: user.favorites_data,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                joinedAt: user.created_at,
                surveyCompleted: user.survey_completed
            }
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/content', async (req, res) => {
    try {
        const [
            coursesResult,
            podcastsResult, 
            streamsResult,
            videosResult,
            materialsResult,
            eventsResult,
            promotionsResult,
            chatsResult
        ] = await Promise.all([
            db.query('SELECT * FROM courses WHERE active = TRUE ORDER BY created_at DESC LIMIT 20'),
            db.query('SELECT * FROM podcasts ORDER BY created_at DESC LIMIT 20'),
            db.query('SELECT * FROM streams ORDER BY created_at DESC LIMIT 20'),
            db.query('SELECT * FROM video_tips ORDER BY created_at DESC LIMIT 20'),
            db.query('SELECT * FROM materials ORDER BY created_at DESC LIMIT 20'),
            db.query('SELECT * FROM events ORDER BY created_at DESC LIMIT 20'),
            db.query('SELECT * FROM promotions WHERE active = TRUE ORDER BY created_at DESC LIMIT 20'),
            db.query('SELECT * FROM chats WHERE active = TRUE ORDER BY created_at DESC LIMIT 20')
        ]);

        const content = {
            courses: coursesResult.rows,
            podcasts: podcastsResult.rows,
            streams: streamsResult.rows,
            videos: videosResult.rows,
            materials: materialsResult.rows,
            events: eventsResult.rows,
            promotions: promotionsResult.rows,
            chats: chatsResult.rows
        };

        res.json({ success: true, data: content });
    } catch (error) {
        console.error('Content API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin API routes
app.get('/api/admin/stats', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userResult = await db.query('SELECT is_admin, is_super_admin FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const [
            usersCount,
            coursesCount,
            activeSubscriptions,
            totalRevenue,
            todayRegistrations
        ] = await Promise.all([
            db.query('SELECT COUNT(*) FROM users'),
            db.query('SELECT COUNT(*) FROM courses WHERE active = TRUE'),
            db.query('SELECT COUNT(*) FROM users WHERE subscription_data->>\'status\' = \'active\''),
            db.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = \'completed\''),
            db.query('SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE')
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(usersCount.rows[0].count),
                totalCourses: parseInt(coursesCount.rows[0].count),
                activeSubscriptions: parseInt(activeSubscriptions.rows[0].count),
                totalRevenue: parseFloat(totalRevenue.rows[0].total),
                todayRegistrations: parseInt(todayRegistrations.rows[0].count),
                isSuperAdmin: userResult.rows[0].is_super_admin
            }
        });

    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const userId = req.query.adminId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userResult = await db.query('SELECT is_admin, is_super_admin FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_super_admin)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const users = await db.query(`
            SELECT id, telegram_data, profile_data, subscription_data, is_admin, is_super_admin, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 100
        `);

        res.json({
            success: true,
            users: users.rows.map(user => ({
                id: user.id,
                firstName: user.telegram_data?.first_name,
                lastName: user.telegram_data?.last_name,
                username: user.telegram_data?.username,
                specialization: user.profile_data?.specialization,
                city: user.profile_data?.city,
                subscription: user.subscription_data,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                joinedAt: user.created_at
            }))
        });

    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/users/:id/make-admin', async (req, res) => {
    try {
        const adminId = req.body.adminId;
        const targetUserId = req.params.id;

        if (!adminId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const adminResult = await db.query('SELECT is_super_admin FROM users WHERE id = $1', [adminId]);
        if (adminResult.rows.length === 0 || !adminResult.rows[0].is_super_admin) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await db.query('UPDATE users SET is_admin = TRUE WHERE id = $1', [targetUserId]);

        res.json({ success: true, message: 'User promoted to admin' });

    } catch (error) {
        console.error('Make admin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ЗАПУСК СЕРВЕРА ====================
async function startServer() {
    try {
        console.log('🚀 Запуск сервера Академии АНБ...');
        
        await processManager.performSystemCheck();
        await db.connect();
        
        const server = app.listen(config.PORT, '0.0.0.0', () => {
            processManager.healthStatus.server = 'running';
            console.log(`🌐 Сервер запущен на порту ${config.PORT}`);
            console.log(`📱 WebApp доступен: ${config.WEBAPP_URL}`);
            console.log(`🔧 Админка доступна для: ${config.ADMIN_IDS.join(', ')}`);
            console.log(`🛠️ Супер-админ: ${config.SUPER_ADMIN_ID}`);
        });

        await telegramBot.launch();
        
        console.log('✅ Система полностью готова к работе!');
        console.log('========================================');

    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('🛑 Остановка системы...');
    telegramBot.bot.stop('SIGINT');
    if (db.client) {
        db.client.end();
    }
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('🛑 Остановка системы...');
    telegramBot.bot.stop('SIGTERM');
    if (db.client) {
        db.client.end();
    }
    process.exit(0);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Необработанное отклонение промиса:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Непойманное исключение:', error);
    process.exit(1);
});

startServer();
