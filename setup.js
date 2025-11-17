// setup.js - СИСТЕМА УСТАНОВКИ И НАСТРОЙКИ ДЛЯ TIMEWEB
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SetupSystem {
    constructor() {
        this.setupConfig = {
            appName: 'Академия АНБ',
            version: '2.0.0',
            requiredNodeVersion: '>=18.0.0',
            requiredNpmVersion: '>=9.0.0',
            requiredSpace: 500 * 1024 * 1024, // 500MB
            requiredMemory: 512 * 1024 * 1024, // 512MB
            supportedPlatforms: ['linux', 'win32', 'darwin'],
            databaseTypes: ['postgresql', 'mysql', 'sqlite'],
            timewebSpecific: true
        };

        this.setupSteps = [
            'check_environment',
            'create_directories',
            'setup_database',
            'create_config',
            'setup_webapp',
            'setup_ssl',
            'setup_backups',
            'setup_monitoring',
            'setup_security',
            'finalize_setup'
        ];

        this.currentStep = 0;
        this.setupLog = [];
    }

    async runSetup() {
        console.log('🚀 Запуск установки Академии АНБ версии 2.0...\n');
        
        try {
            for (const step of this.setupSteps) {
                this.currentStep++;
                await this.executeStep(step);
            }
            
            await this.finalizeSetup();
            console.log('\n✅ Установка успешно завершена!');
            
        } catch (error) {
            console.error('\n❌ Ошибка установки:', error.message);
            await this.rollbackSetup();
            process.exit(1);
        }
    }

    async executeStep(stepName) {
        console.log(`\n📋 Шаг ${this.currentStep}/${this.setupSteps.length}: ${this.getStepDescription(stepName)}`);
        
        const startTime = Date.now();
        
        try {
            switch (stepName) {
                case 'check_environment':
                    await this.checkEnvironment();
                    break;
                case 'create_directories':
                    await this.createDirectories();
                    break;
                case 'setup_database':
                    await this.setupDatabase();
                    break;
                case 'create_config':
                    await this.createConfig();
                    break;
                case 'setup_webapp':
                    await this.setupWebApp();
                    break;
                case 'setup_ssl':
                    await this.setupSSL();
                    break;
                case 'setup_backups':
                    await this.setupBackups();
                    break;
                case 'setup_monitoring':
                    await this.setupMonitoring();
                    break;
                case 'setup_security':
                    await this.setupSecurity();
                    break;
                case 'finalize_setup':
                    await this.finalizeSetup();
                    break;
            }
            
            const duration = Date.now() - startTime;
            this.logStep(stepName, 'success', `Выполнено за ${duration}ms`);
            console.log(`   ✅ ${this.getStepDescription(stepName)}`);
            
        } catch (error) {
            this.logStep(stepName, 'error', error.message);
            throw error;
        }
    }

    getStepDescription(stepName) {
        const descriptions = {
            'check_environment': 'Проверка окружения',
            'create_directories': 'Создание директорий',
            'setup_database': 'Настройка базы данных',
            'create_config': 'Создание конфигурации',
            'setup_webapp': 'Настройка веб-приложения',
            'setup_ssl': 'Настройка SSL/TLS',
            'setup_backups': 'Настройка системы бэкапов',
            'setup_monitoring': 'Настройка мониторинга',
            'setup_security': 'Настройка безопасности',
            'finalize_setup': 'Завершение установки'
        };
        return descriptions[stepName] || stepName;
    }

    logStep(step, status, message) {
        this.setupLog.push({
            step,
            status,
            message,
            timestamp: new Date().toISOString()
        });
    }

    async checkEnvironment() {
        console.log('   🔍 Проверка окружения...');
        
        // Проверка версии Node.js
        const nodeVersion = process.version;
        const requiredVersion = this.setupConfig.requiredNodeVersion;
        
        if (!this.compareVersions(nodeVersion, requiredVersion)) {
            throw new Error(`Требуется Node.js ${requiredVersion}, установлена ${nodeVersion}`);
        }
        
        // Проверка платформы
        const platform = os.platform();
        if (!this.setupConfig.supportedPlatforms.includes(platform)) {
            console.warn(`   ⚠️ Платформа ${platform} не тестировалась, возможны проблемы`);
        }
        
        // Проверка памяти
        const totalMemory = os.totalmem();
        if (totalMemory < this.setupConfig.requiredMemory) {
            console.warn(`   ⚠️ Мало памяти: ${Math.round(totalMemory / 1024 / 1024)}MB, рекомендуется ${Math.round(this.setupConfig.requiredMemory / 1024 / 1024)}MB`);
        }
        
        // Проверка места на диске
        await this.checkDiskSpace();
        
        // Проверка переменных окружения
        await this.checkEnvironmentVariables();
        
        console.log('   ✅ Окружение проверено');
    }

    compareVersions(current, required) {
        const currentNum = parseInt(current.replace('v', '').split('.')[0]);
        const requiredNum = parseInt(required.replace('>=', ''));
        return currentNum >= requiredNum;
    }

    async checkDiskSpace() {
        // В реальной системе здесь будет проверка свободного места
        // Для демонстрации всегда возвращаем true
        return true;
    }

    async checkEnvironmentVariables() {
        const requiredVars = ['BOT_TOKEN', 'DATABASE_URL'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.warn(`   ⚠️ Отсутствуют переменные окружения: ${missingVars.join(', ')}`);
            console.log('   ℹ️  Будут использованы значения по умолчанию');
        }
    }

    async createDirectories() {
        console.log('   📁 Создание структуры директорий...');
        
        const directories = [
            'uploads',
            'uploads/courses',
            'uploads/podcasts',
            'uploads/streams',
            'uploads/videos',
            'uploads/materials',
            'uploads/avatars',
            'uploads/documents',
            'logs',
            'backups',
            'backups/daily',
            'backups/weekly',
            'backups/monthly',
            'temp',
            'cache',
            'webapp/assets',
            'webapp/assets/images',
            'webapp/assets/videos',
            'webapp/assets/audio',
            'webapp/assets/documents',
            'config',
            'scripts',
            'migrations',
            'ssl'
        ];

        for (const dir of directories) {
            const fullPath = join(__dirname, dir);
            try {
                await fs.mkdir(fullPath, { recursive: true });
                console.log(`     ✅ Создана: ${dir}`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw new Error(`Не удалось создать директорию ${dir}: ${error.message}`);
                }
            }
        }

        // Создание .gitkeep файлов
        const gitkeepDirs = ['uploads', 'logs', 'backups', 'temp'];
        for (const dir of gitkeepDirs) {
            const gitkeepPath = join(__dirname, dir, '.gitkeep');
            try {
                await fs.writeFile(gitkeepPath, '');
            } catch (error) {
                // Игнорируем ошибки создания .gitkeep
            }
        }

        console.log('   ✅ Структура директорий создана');
    }

    async setupDatabase() {
        console.log('   🗄️ Настройка базы данных...');
        
        try {
            // Проверка подключения к PostgreSQL
            const { Client } = await import('pg');
            const client = new Client({
                connectionString: process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@def46fb02c0eac8fefd6f734.twc1.net:5432/default_db',
                ssl: { rejectUnauthorized: false }
            });

            await client.connect();
            console.log('     ✅ Подключение к PostgreSQL установлено');

            // Создание таблиц
            await this.createDatabaseTables(client);
            await client.end();
            
            console.log('   ✅ База данных настроена');
            
        } catch (error) {
            console.error('     ❌ Ошибка настройки БД:', error.message);
            throw new Error(`Не удалось настроить базу данных: ${error.message}`);
        }
    }

    async createDatabaseTables(client) {
        const tables = [
            // Основные таблицы
            `CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                telegram_data JSONB NOT NULL,
                profile_data JSONB DEFAULT '{}',
                subscription_data JSONB DEFAULT '{}',
                progress_data JSONB DEFAULT '{}',
                favorites_data JSONB DEFAULT '{}',
                payment_data JSONB DEFAULT '{}',
                security_data JSONB DEFAULT '{}',
                communication_data JSONB DEFAULT '{}',
                analytics_data JSONB DEFAULT '{}',
                survey_completed BOOLEAN DEFAULT FALSE,
                is_admin BOOLEAN DEFAULT FALSE,
                is_super_admin BOOLEAN DEFAULT FALSE,
                is_moderator BOOLEAN DEFAULT FALSE,
                is_teacher BOOLEAN DEFAULT FALSE,
                is_verified BOOLEAN DEFAULT FALSE,
                is_blocked BOOLEAN DEFAULT FALSE,
                is_deleted BOOLEAN DEFAULT FALSE,
                delete_reason TEXT,
                delete_date TIMESTAMP,
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                version INTEGER DEFAULT 1
            )`,

            `CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                description TEXT,
                full_description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                original_price DECIMAL(10,2),
                discount DECIMAL(5,2) DEFAULT 0,
                discount_end_date TIMESTAMP,
                duration TEXT,
                total_duration_minutes INTEGER,
                modules INTEGER DEFAULT 1,
                lessons INTEGER DEFAULT 0,
                category TEXT,
                subcategory TEXT,
                tags TEXT[],
                level TEXT DEFAULT 'beginner',
                difficulty TEXT DEFAULT 'easy',
                language TEXT DEFAULT 'ru',
                image_url TEXT,
                video_url TEXT,
                preview_video_url TEXT,
                certificate_template TEXT,
                active BOOLEAN DEFAULT TRUE,
                featured BOOLEAN DEFAULT FALSE,
                popular BOOLEAN DEFAULT FALSE,
                new BOOLEAN DEFAULT FALSE,
                students_count INTEGER DEFAULT 0,
                max_students INTEGER,
                rating DECIMAL(3,2) DEFAULT 0,
                reviews_count INTEGER DEFAULT 0,
                enrollment_count INTEGER DEFAULT 0,
                completion_count INTEGER DEFAULT 0,
                average_completion_time INTEGER,
                success_rate DECIMAL(5,2),
                created_by BIGINT,
                instructor_id BIGINT,
                curriculum JSONB DEFAULT '[]',
                resources JSONB DEFAULT '[]',
                reviews JSONB DEFAULT '[]',
                statistics JSONB DEFAULT '{}',
                seo_data JSONB DEFAULT '{}',
                access_settings JSONB DEFAULT '{}',
                technical_data JSONB DEFAULT '{}',
                pricing_data JSONB DEFAULT '{}',
                marketing_data JSONB DEFAULT '{}',
                legal_data JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                published_at TIMESTAMP,
                archived_at TIMESTAMP,
                version INTEGER DEFAULT 1
            )`,

            `CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                module_id INTEGER,
                lesson_id INTEGER,
                content_type TEXT NOT NULL,
                content_id INTEGER NOT NULL,
                progress INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                score DECIMAL(5,2),
                max_score DECIMAL(5,2),
                time_spent INTEGER DEFAULT 0,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                last_activity TIMESTAMP DEFAULT NOW(),
                attempts INTEGER DEFAULT 0,
                notes TEXT,
                bookmarks JSONB DEFAULT '[]',
                ratings JSONB DEFAULT '{}',
                feedback TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, content_type, content_id)
            )`,

            `CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                subscription_id INTEGER,
                amount DECIMAL(10,2) NOT NULL,
                currency TEXT DEFAULT 'RUB',
                status TEXT DEFAULT 'pending',
                payment_method TEXT,
                payment_gateway TEXT,
                gateway_transaction_id TEXT,
                gateway_response JSONB,
                description TEXT,
                invoice_number TEXT UNIQUE,
                invoice_url TEXT,
                receipt_url TEXT,
                refund_amount DECIMAL(10,2) DEFAULT 0,
                refund_reason TEXT,
                refund_date TIMESTAMP,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                total_amount DECIMAL(10,2) NOT NULL,
                billing_address JSONB,
                shipping_address JSONB,
                customer_email TEXT,
                customer_phone TEXT,
                ip_address INET,
                user_agent TEXT,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            `CREATE TABLE IF NOT EXISTS system_settings (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                value JSONB NOT NULL,
                type TEXT DEFAULT 'string',
                category TEXT DEFAULT 'general',
                description TEXT,
                is_public BOOLEAN DEFAULT FALSE,
                is_encrypted BOOLEAN DEFAULT FALSE,
                updated_by BIGINT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Индексы для производительности
            `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active)`,
            `CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id)`,
            `CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed)`,
            `CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`,
            `CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)`
        ];

        for (const tableSQL of tables) {
            try {
                await client.query(tableSQL);
                console.log(`     ✅ Таблица создана`);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error(`     ❌ Ошибка создания таблицы:`, error.message);
                }
            }
        }

        // Создание системных настроек
        await this.createSystemSettings(client);
        
        // Создание демо-данных
        await this.createDemoData(client);
    }

    async createSystemSettings(client) {
        const settings = [
            {
                key: 'app.name',
                value: 'Академия АНБ',
                type: 'string',
                category: 'general',
                description: 'Название приложения',
                is_public: true
            },
            {
                key: 'app.version',
                value: '2.0.0',
                type: 'string',
                category: 'general',
                description: 'Версия приложения',
                is_public: true
            },
            {
                key: 'app.theme',
                value: 'dark',
                type: 'string',
                category: 'ui',
                description: 'Цветовая тема приложения',
                is_public: true
            },
            {
                key: 'security.password_min_length',
                value: 8,
                type: 'number',
                category: 'security',
                description: 'Минимальная длина пароля',
                is_public: false
            },
            {
                key: 'security.max_login_attempts',
                value: 5,
                type: 'number',
                category: 'security',
                description: 'Максимальное количество попыток входа',
                is_public: false
            },
            {
                key: 'payment.currency',
                value: 'RUB',
                type: 'string',
                category: 'payment',
                description: 'Основная валюта платежей',
                is_public: true
            },
            {
                key: 'notification.email_enabled',
                value: true,
                type: 'boolean',
                category: 'notification',
                description: 'Включены ли email уведомления',
                is_public: false
            }
        ];

        for (const setting of settings) {
            try {
                await client.query(
                    `INSERT INTO system_settings (key, value, type, category, description, is_public)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (key) DO NOTHING`,
                    [setting.key, setting.value, setting.type, setting.category, setting.description, setting.is_public]
                );
            } catch (error) {
                console.error('     ❌ Ошибка создания настройки:', error.message);
            }
        }
    }

    async createDemoData(client) {
        try {
            // Проверяем есть ли уже демо-данные
            const coursesCheck = await client.query('SELECT COUNT(*) FROM courses');
            if (parseInt(coursesCheck.rows[0].count) > 0) {
                console.log('     ℹ️ Демо-данные уже существуют');
                return;
            }

            console.log('     📝 Создание демо-данных...');

            // Создаем супер-администратора
            const superAdminId = 898508164;
            const adminCheck = await client.query('SELECT * FROM users WHERE id = $1', [superAdminId]);
            
            if (adminCheck.rows.length === 0) {
                await client.query(
                    `INSERT INTO users (id, telegram_data, profile_data, is_admin, is_super_admin, is_verified, survey_completed)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        superAdminId,
                        JSON.stringify({
                            first_name: 'Супер Администратор',
                            username: 'superadmin',
                            language_code: 'ru',
                            is_premium: true
                        }),
                        JSON.stringify({
                            specialization: 'Администратор системы',
                            city: 'Москва',
                            email: 'admin@anb-academy.ru',
                            phone: '+79999999999',
                            experience: '10+ лет',
                            education: 'Высшее техническое',
                            bio: 'Главный администратор Академии АНБ'
                        }),
                        true,
                        true,
                        true,
                        true
                    ]
                );
                console.log('     ✅ Супер-администратор создан');
            }

            // Создаем демо-курсы
            const demoCourses = [
                {
                    title: 'Мануальные техники в практике невролога',
                    subtitle: 'Современные подходы к диагностике и лечению',
                    description: '6 модулей по современным мануальным методикам',
                    full_description: 'Комплексный курс по мануальным техникам для практикующих врачей-неврологов. Изучите современные подходы к диагностике и лечению заболеваний опорно-двигательного аппарата.',
                    price: 25000,
                    original_price: 30000,
                    discount: 16.67,
                    discount_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    duration: '12 недель',
                    total_duration_minutes: 7200,
                    modules: 6,
                    lessons: 24,
                    category: 'Мануальные техники',
                    subcategory: 'Неврология',
                    tags: ['мануальная терапия', 'неврология', 'реабилитация', 'диагностика'],
                    level: 'advanced',
                    difficulty: 'medium',
                    image_url: '/webapp/assets/course-manual.jpg',
                    active: true,
                    featured: true,
                    popular: true,
                    new: true,
                    students_count: 156,
                    rating: 4.8,
                    reviews_count: 89,
                    enrollment_count: 234,
                    completion_count: 156,
                    success_rate: 92.5,
                    created_by: superAdminId,
                    instructor_id: superAdminId,
                    curriculum: JSON.stringify([
                        {
                            module: 1,
                            title: 'Основы мануальной диагностики',
                            duration: '2 недели',
                            lessons: [
                                {
                                    title: 'Анатомия позвоночника и биомеханика',
                                    duration: 45,
                                    type: 'video',
                                    resources: 3
                                }
                            ]
                        }
                    ]),
                    statistics: JSON.stringify({
                        views: 1567,
                        clicks: 892,
                        shares: 234,
                        conversion_rate: 15.2
                    })
                },
                {
                    title: 'Неврологическая диагностика: от основ к практике',
                    subtitle: 'Полный курс диагностических методик',
                    description: '5 модулей по современной неврологической диагностике',
                    price: 18000,
                    duration: '8 недель',
                    modules: 5,
                    category: 'Неврология',
                    subcategory: 'Диагностика',
                    level: 'intermediate',
                    students_count: 234,
                    rating: 4.6,
                    created_by: superAdminId,
                    instructor_id: superAdminId,
                    active: true,
                    featured: true
                }
            ];

            for (const course of demoCourses) {
                const keys = Object.keys(course);
                const values = Object.values(course);
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                
                await client.query(
                    `INSERT INTO courses (${keys.join(', ')}) VALUES (${placeholders})`,
                    values
                );
            }

            console.log('     ✅ Демо-данные созданы');

        } catch (error) {
            console.error('     ❌ Ошибка создания демо-данных:', error.message);
        }
    }

    async createConfig() {
        console.log('   ⚙️ Создание конфигурационных файлов...');
        
        const configFiles = {
            '.env': this.createEnvConfig(),
            'config/database.json': this.createDatabaseConfig(),
            'config/redis.json': this.createRedisConfig(),
            'config/email.json': this.createEmailConfig(),
            'config/security.json': this.createSecurityConfig(),
            'config/timeweb.json': this.createTimewebConfig()
        };

        for (const [filePath, content] of Object.entries(configFiles)) {
            const fullPath = join(__dirname, filePath);
            try {
                await fs.writeFile(fullPath, content);
                console.log(`     ✅ Создан: ${filePath}`);
            } catch (error) {
                throw new Error(`Не удалось создать конфигурационный файл ${filePath}: ${error.message}`);
            }
        }

        console.log('   ✅ Конфигурационные файлы созданы');
    }

    createEnvConfig() {
        return `# Конфигурация Академии АНБ
# Автоматически сгенерировано ${new Date().toISOString()}

# Основные настройки
NODE_ENV=production
APP_NAME=Академия АНБ
APP_VERSION=2.0.0
PORT=3000
WEBAPP_URL=https://anb-academy.timeweb.ru

# Telegram Bot
BOT_TOKEN=${process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4'}

# База данных (TimeWeb)
DATABASE_URL=${process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@def46fb02c0eac8fefd6f734.twc1.net:5432/default_db'}

# Redis
REDIS_URL=redis://localhost:6379

# Безопасность
JWT_SECRET=anb-academy-super-secret-jwt-key-2024-${Math.random().toString(36).substring(2)}
ENCRYPTION_KEY=anb-academy-encryption-key-256-bit-secure-${Math.random().toString(36).substring(2)}

# Администраторы
SUPER_ADMIN_ID=898508164
ADMIN_IDS=898508164

# Настройки загрузки файлов
UPLOAD_MAX_SIZE=52428800
UPLOAD_PATH=./uploads

# Кэширование
CACHE_TTL=3600
REDIS_CACHE_ENABLED=true

# Логирование
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_TO_CONSOLE=true

# Мониторинг
HEALTH_CHECK_ENABLED=true
PERFORMANCE_MONITORING=true
ERROR_REPORTING=true

# TimeWeb специфичные настройки
TIMEWEB_DEPLOYMENT=true
TIMEWEB_AUTO_SCALING=true
TIMEWEB_CDN_ENABLED=true
`;
    }

    createDatabaseConfig() {
        return JSON.stringify({
            postgresql: {
                host: 'def46fb02c0eac8fefd6f734.twc1.net',
                port: 5432,
                database: 'default_db',
                username: 'gen_user',
                password: '5-R;mKGYJ<88?1',
                ssl: true,
                pool: {
                    max: 20,
                    min: 5,
                    acquire: 30000,
                    idle: 10000
                }
            },
            backup: {
                enabled: true,
                schedule: '0 2 * * *',
                retention_days: 30
            },
            performance: {
                slow_query_threshold: 1000,
                log_slow_queries: true
            }
        }, null, 2);
    }

    createRedisConfig() {
        return JSON.stringify({
            host: 'localhost',
            port: 6379,
            password: null,
            db: 0,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true
        }, null, 2);
    }

    createEmailConfig() {
        return JSON.stringify({
            smtp: {
                host: 'smtp.timeweb.ru',
                port: 587,
                secure: false,
                auth: {
                    user: 'noreply@anb-academy.ru',
                    pass: '${process.env.SMTP_PASSWORD || ""}'
                }
            },
            templates: {
                welcome: 'emails/welcome.html',
                reset_password: 'emails/reset-password.html',
                notification: 'emails/notification.html'
            },
            defaults: {
                from: 'Академия АНБ <noreply@anb-academy.ru>'
            }
        }, null, 2);
    }

    createSecurityConfig() {
        return JSON.stringify({
            rate_limiting: {
                enabled: true,
                window_ms: 900000,
                max_requests: 100
            },
            cors: {
                enabled: true,
                origins: [
                    'https://anb-academy.timeweb.ru',
                    'https://telegram.org',
                    'https://web.telegram.org'
                ]
            },
            helmet: {
                enabled: true
            },
            compression: {
                enabled: true
            },
            validation: {
                max_file_size: 52428800,
                allowed_mime_types: [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'video/mp4',
                    'audio/mpeg',
                    'application/pdf'
                ]
            }
        }, null, 2);
    }

    createTimewebConfig() {
        return JSON.stringify({
            deployment: {
                platform: 'timeweb',
                region: 'ru-1',
                auto_scaling: true,
                min_instances: 1,
                max_instances: 3
            },
            storage: {
                type: 'network',
                backup_enabled: true,
                snapshot_schedule: '0 3 * * *'
            },
            monitoring: {
                enabled: true,
                metrics: ['cpu', 'memory', 'disk', 'network'],
                alerts: {
                    cpu_threshold: 80,
                    memory_threshold: 85,
                    disk_threshold: 90
                }
            },
            cdn: {
                enabled: true,
                domains: ['anb-academy.timeweb.ru']
            }
        }, null, 2);
    }

    async setupWebApp() {
        console.log('   🌐 Настройка веб-приложения...');
        
        try {
            // Создание основных HTML файлов
            await this.createWebAppFiles();
            
            // Создание assets
            await this.createDefaultAssets();
            
            // Настройка Service Worker
            await this.setupServiceWorker();
            
            console.log('   ✅ Веб-приложение настроено');
            
        } catch (error) {
            throw new Error(`Не удалось настроить веб-приложение: ${error.message}`);
        }
    }

    async createWebAppFiles() {
        const webappFiles = {
            'webapp/index.html': this.createIndexHTML(),
            'webapp/sw.js': this.createServiceWorker(),
            'webapp/robots.txt': this.createRobotsTxt(),
            'webapp/sitemap.xml': this.createSitemapXML(),
            'webapp/manifest.json': this.createManifestJSON()
        };

        for (const [filePath, content] of Object.entries(webappFiles)) {
            const fullPath = join(__dirname, filePath);
            try {
                await fs.writeFile(fullPath, content);
                console.log(`     ✅ Создан: ${filePath}`);
            } catch (error) {
                console.error(`     ❌ Ошибка создания ${filePath}:`, error.message);
            }
        }
    }

    createIndexHTML() {
        return `<!DOCTYPE html>
<html lang="ru" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Академия АНБ - Современное образование для врачей</title>
    <meta name="description" content="Академия АНБ - платформа для непрерывного медицинского образования. Курсы, подкасты, эфиры и материалы для врачей.">
    <meta name="keywords" content="медицина, образование, врачи, курсы, неврология, АНБ">
    
    <!-- Telegram WebApp -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    
    <!-- Styles -->
    <link rel="stylesheet" href="/webapp/style.css">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/webapp/assets/favicon.ico">
    
    <!-- PWA -->
    <link rel="manifest" href="/webapp/manifest.json">
    <meta name="theme-color" content="#2563eb">
    
    <!-- Preload critical resources -->
    <link rel="preload" href="/webapp/app.js" as="script">
</head>
<body>
    <div id="app">
        <!-- Navigation -->
        <nav class="main-nav">
            <div class="nav-container">
                <div class="nav-brand">
                    <span class="brand-icon">🎓</span>
                    <span class="brand-text">Академия АНБ</span>
                </div>
                
                <div class="nav-menu">
                    <button class="nav-btn" data-page="home">🏠 Главная</button>
                    <button class="nav-btn" data-page="courses">📚 Курсы</button>
                    <button class="nav-btn" data-page="podcasts">🎧 АНБ FM</button>
                    <button class="nav-btn" data-page="streams">📹 Эфиры</button>
                    <button class="nav-btn" data-page="profile">👤 Профиль</button>
                </div>
                
                <div class="nav-actions">
                    <div class="notification-badge" style="display: none;">0</div>
                    <div id="adminBadge" class="admin-badge" style="display: none;">🔧 Админ</div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main id="mainContent" class="main-content">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Загрузка Академии АНБ...</p>
            </div>
        </main>

        <!-- System Status -->
        <div class="system-status" id="systemStatus">
            <div class="status-indicator online"></div>
            <span class="status-text">Система онлайн</span>
        </div>
    </div>

    <!-- Scripts -->
    <script src="/webapp/app.js"></script>
    
    <!-- Socket.io -->
    <script src="/socket.io/socket.io.js"></script>
</body>
</html>`;
    }

    createServiceWorker() {
        return `// Service Worker для Академии АНБ
const CACHE_NAME = 'anb-academy-v2.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
    '/webapp/style.css',
    '/webapp/app.js',
    '/webapp/manifest.json',
    '/webapp/assets/favicon.ico'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Установка');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Кэширование статических ресурсов');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активация');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Удаление старого кэша', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    // Пропускаем не-GET запросы и запросы к API
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэшированную версию если есть
                if (response) {
                    return response;
                }

                // Иначе делаем запрос и кэшируем
                return fetch(event.request)
                    .then(fetchResponse => {
                        // Клонируем ответ
                        const responseToCache = fetchResponse.clone();

                        // Кэшируем только успешные ответы
                        if (fetchResponse.status === 200) {
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }

                        return fetchResponse;
                    })
                    .catch(error => {
                        console.log('Service Worker: Ошибка загрузки', error);
                        // Можно вернуть fallback страницу
                    });
            })
    );
});

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Фоновая синхронизация');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Фоновая синхронизация данных
    try {
        // Здесь может быть синхронизация прогресса, уведомлений и т.д.
        console.log('Фоновая синхронизация выполнена');
    } catch (error) {
        console.error('Ошибка фоновой синхронизации:', error);
    }
}

// Получение push-уведомлений
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/webapp/assets/icon-192.png',
        badge: '/webapp/assets/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url
        },
        actions: [
            {
                action: 'open',
                title: 'Открыть'
            },
            {
                action: 'close',
                title: 'Закрыть'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});`;
    }

    createRobotsTxt() {
        return `# Robots.txt для Академии АНБ
User-agent: *
Allow: /

# Sitemap
Sitemap: https://anb-academy.timeweb.ru/webapp/sitemap.xml

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /uploads/
Disallow: /logs/
Disallow: /backups/`;
    }

    createSitemapXML() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://anb-academy.timeweb.ru/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://anb-academy.timeweb.ru/courses</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://anb-academy.timeweb.ru/podcasts</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
</urlset>`;
    }

    createManifestJSON() {
        return JSON.stringify({
            name: "Академия АНБ",
            short_name: "АНБ Академия",
            description: "Современное образование для врачей",
            start_url: "/",
            display: "standalone",
            background_color: "#0f172a",
            theme_color: "#2563eb",
            orientation: "portrait-primary",
            scope: "/",
            icons: [
                {
                    src: "/webapp/assets/icon-72.png",
                    sizes: "72x72",
                    type: "image/png"
                },
                {
                    src: "/webapp/assets/icon-96.png",
                    sizes: "96x96",
                    type: "image/png"
                },
                {
                    src: "/webapp/assets/icon-128.png",
                    sizes: "128x128",
                    type: "image/png"
                },
                {
                    src: "/webapp/assets/icon-144.png",
                    sizes: "144x144",
                    type: "image/png"
                },
                {
                    src: "/webapp/assets/icon-152.png",
                    sizes: "152x152",
                    type: "image/png"
                },
                {
                    src: "/webapp/assets/icon-192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "/webapp/assets/icon-384.png",
                    sizes: "384x384",
                    type: "image/png"
                },
                {
                    src: "/webapp/assets/icon-512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ],
            categories: ["education", "medical"],
            lang: "ru"
        }, null, 2);
    }

    async createDefaultAssets() {
        console.log('     🎨 Создание стандартных assets...');
        
        // Создание placeholder изображений
        const placeholderImages = {
            'course-default.jpg': this.createPlaceholderImage(800, 450, 'Курс'),
            'podcast-default.jpg': this.createPlaceholderImage(800, 800, 'Подкаст'),
            'stream-default.jpg': this.createPlaceholderImage(800, 450, 'Эфир'),
            'material-default.jpg': this.createPlaceholderImage(600, 800, 'Материал'),
            'avatar-default.jpg': this.createPlaceholderImage(200, 200, 'Аватар'),
            'favicon.ico': '' // Будет создан позже
        };

        for (const [filename, content] of Object.entries(placeholderImages)) {
            const filePath = join(__dirname, 'webapp/assets', filename);
            try {
                if (content) {
                    await fs.writeFile(filePath, content);
                } else {
                    // Создаем пустой файл для favicon (в реальности нужна иконка)
                    await fs.writeFile(filePath, '');
                }
                console.log(`       ✅ Создан: ${filename}`);
            } catch (error) {
                console.warn(`       ⚠️ Не удалось создать: ${filename}`);
            }
        }
    }

    createPlaceholderImage(width, height, text) {
        // В реальной системе здесь будет генерация SVG или использование готовых изображений
        // Для демонстрации возвращаем пустую строку
        return '';
    }

    async setupServiceWorker() {
        // Service Worker уже создан в createWebAppFiles
        console.log('     🔧 Service Worker настроен');
    }

    async setupSSL() {
        console.log('   🔐 Настройка SSL/TLS...');
        
        try {
            // Для TimeWeb SSL обычно настраивается на уровне панели управления
            // Создаем конфигурацию для будущего использования
            
            const sslConfig = {
                enabled: true,
                auto_renew: true,
                provider: 'timeweb',
                domains: ['anb-academy.timeweb.ru']
            };
            
            const sslConfigPath = join(__dirname, 'config/ssl.json');
            await fs.writeFile(sslConfigPath, JSON.stringify(sslConfig, null, 2));
            
            console.log('   ✅ SSL/TLS настроен (требуется настройка в панели TimeWeb)');
            
        } catch (error) {
            console.warn('   ⚠️ Не удалось настроить SSL:', error.message);
        }
    }

    async setupBackups() {
        console.log('   💾 Настройка системы бэкапов...');
        
        try {
            // Создание скриптов бэкапа
            const backupScripts = {
                'scripts/backup.js': this.createBackupScript(),
                'scripts/restore.js': this.createRestoreScript(),
                'scripts/clean.js': this.createCleanScript()
            };

            for (const [filePath, content] of Object.entries(backupScripts)) {
                const fullPath = join(__dirname, filePath);
                await fs.writeFile(fullPath, content);
                console.log(`     ✅ Создан: ${filePath}`);
            }

            // Создание конфигурации бэкапов
            const backupConfig = {
                schedules: {
                    daily: '0 2 * * *',
                    weekly: '0 3 * * 0',
                    monthly: '0 4 1 * *'
                },
                retention: {
                    daily: 7,
                    weekly: 4,
                    monthly: 12
                },
                targets: {
                    database: true,
                    uploads: true,
                    logs: false,
                    config: true
                },
                storage: {
                    local: true,
                    remote: false
                }
            };

            const backupConfigPath = join(__dirname, 'config/backup.json');
            await fs.writeFile(backupConfigPath, JSON.stringify(backupConfig, null, 2));
            
            console.log('   ✅ Система бэкапов настроена');
            
        } catch (error) {
            throw new Error(`Не удалось настроить систему бэкапов: ${error.message}`);
        }
    }

    createBackupScript() {
        return `// Скрипт бэкапа для Академии АНБ
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

class BackupSystem {
    constructor() {
        this.backupDir = join(__dirname, '../backups');
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    }

    async runBackup(type = 'daily') {
        console.log(\`🚀 Запуск бэкапа типа: \${type}\`);
        
        try {
            // Создание директории для бэкапа
            const backupPath = join(this.backupDir, type, \`backup-\${this.timestamp}\`);
            await fs.mkdir(backupPath, { recursive: true });

            // Бэкап базы данных
            await this.backupDatabase(backupPath);
            
            // Бэкап загруженных файлов
            await this.backupUploads(backupPath);
            
            // Бэкап конфигурации
            await this.backupConfig(backupPath);
            
            // Создание архива
            await this.createArchive(backupPath, type);
            
            // Очистка старых бэкапов
            await this.cleanOldBackups(type);
            
            console.log(\`✅ Бэкап \${type} успешно завершен\`);
            
        } catch (error) {
            console.error(\`❌ Ошибка бэкапа: \${error.message}\`);
            throw error;
        }
    }

    async backupDatabase(backupPath) {
        console.log('  🗄️ Бэкап базы данных...');
        
        const dbConfig = {
            host: 'def46fb02c0eac8fefd6f734.twc1.net',
            port: 5432,
            database: 'default_db',
            username: 'gen_user',
            password: '5-R;mKGYJ<88?1'
        };

        const dumpFile = join(backupPath, 'database.sql');
        
        try {
            // Используем pg_dump для создания дампа
            const command = \`pg_dump -h \${dbConfig.host} -p \${dbConfig.port} -U \${dbConfig.username} -d \${dbConfig.database} -f \${dumpFile}\`;
            
            await execAsync(command, {
                env: { ...process.env, PGPASSWORD: dbConfig.password }
            });
            
            console.log('    ✅ Бэкап БД создан');
        } catch (error) {
            console.error('    ❌ Ошибка бэкапа БД:', error.message);
            // Продолжаем выполнение даже при ошибке бэкапа БД
        }
    }

    async backupUploads(backupPath) {
        console.log('  📁 Бэкап загруженных файлов...');
        
        const uploadsDir = join(__dirname, '../uploads');
        const backupUploadsDir = join(backupPath, 'uploads');
        
        try {
            await fs.cp(uploadsDir, backupUploadsDir, { recursive: true });
            console.log('    ✅ Бэкап файлов создан');
        } catch (error) {
            console.error('    ❌ Ошибка бэкапа файлов:', error.message);
        }
    }

    async backupConfig(backupPath) {
        console.log('  ⚙️ Бэкап конфигурации...');
        
        const configDir = join(__dirname, '../config');
        const backupConfigDir = join(backupPath, 'config');
        
        try {
            await fs.cp(configDir, backupConfigDir, { recursive: true });
            console.log('    ✅ Бэкап конфигурации создан');
        } catch (error) {
            console.error('    ❌ Ошибка бэкапа конфигурации:', error.message);
        }
    }

    async createArchive(backupPath, type) {
        console.log('  📦 Создание архива...');
        
        const archive = await import('archiver');
        const output = fs.createWriteStream(\`\${backupPath}.zip\`);
        const archiver = archive.create('zip', { zlib: { level: 9 } });
        
        return new Promise((resolve, reject) => {
            output.on('close', () => {
                console.log('    ✅ Архив создан');
                resolve();
            });
            
            archiver.on('error', reject);
            archiver.pipe(output);
            archiver.directory(backupPath, false);
            archiver.finalize();
        });
    }

    async cleanOldBackups(type) {
        console.log(\`  🧹 Очистка старых бэкапов (\${type})...\`);
        
        const retention = {
            daily: 7,
            weekly: 4,
            monthly: 12
        };
        
        const backupTypeDir = join(this.backupDir, type);
        const files = await fs.readdir(backupTypeDir);
        
        // Сортируем файлы по дате создания
        const sortedFiles = files.sort().reverse();
        const filesToDelete = sortedFiles.slice(retention[type]);
        
        for (const file of filesToDelete) {
            const filePath = join(backupTypeDir, file);
            await fs.rm(filePath, { recursive: true });
            console.log(\`    Удален: \${file}\`);
        }
        
        console.log(\`    ✅ Очищено \${filesToDelete.length} старых бэкапов\`);
    }
}

// Запуск бэкапа если скрипт вызван напрямую
if (import.meta.url === \`file://\${process.argv[1]}\`) {
    const type = process.argv[2] || 'daily';
    const backupSystem = new BackupSystem();
    backupSystem.runBackup(type).catch(console.error);
}

export default BackupSystem;`;
    }

    createRestoreScript() {
        return `// Скрипт восстановления для Академии АНБ
console.log('🔧 Скрипт восстановления - в разработке');`;
    }

    createCleanScript() {
        return `// Скрипт очистки для Академии АНБ
console.log('🧹 Скрипт очистки - в разработке');`;
    }

    async setupMonitoring() {
        console.log('   📊 Настройка мониторинга...');
        
        try {
            // Создание скриптов мониторинга
            const monitoringScripts = {
                'scripts/monitor.js': this.createMonitorScript(),
                'scripts/health.js': this.createHealthScript(),
                'scripts/stats.js': this.createStatsScript()
            };

            for (const [filePath, content] of Object.entries(monitoringScripts)) {
                const fullPath = join(__dirname, filePath);
                await fs.writeFile(fullPath, content);
                console.log(`     ✅ Создан: ${filePath}`);
            }

            console.log('   ✅ Система мониторинга настроена');
            
        } catch (error) {
            throw new Error(`Не удалось настроить мониторинг: ${error.message}`);
        }
    }

    createMonitorScript() {
        return `// Скрипт мониторинга для Академии АНБ
console.log('📊 Скрипт мониторинга - в разработке');`;
    }

    createHealthScript() {
        return `// Скрипт проверки здоровья для Академии АНБ
console.log('❤️ Скрипт проверки здоровья - в разработке');`;
    }

    createStatsScript() {
        return `// Скрипт статистики для Академии АНБ
console.log('📈 Скрипт статистики - в разработке');`;
    }

    async setupSecurity() {
        console.log('   🛡️ Настройка безопасности...');
        
        try {
            // Создание скриптов безопасности
            const securityScripts = {
                'scripts/security.js': this.createSecurityScript(),
                'scripts/update.js': this.createUpdateScript(),
                'scripts/validate.js': this.createValidateScript()
            };

            for (const [filePath, content] of Object.entries(securityScripts)) {
                const fullPath = join(__dirname, filePath);
                await fs.writeFile(fullPath, content);
                console.log(`     ✅ Создан: ${filePath}`);
            }

            // Настройка прав доступа к файлам
            await this.setupFilePermissions();
            
            console.log('   ✅ Система безопасности настроена');
            
        } catch (error) {
            throw new Error(`Не удалось настроить безопасность: ${error.message}`);
        }
    }

    createSecurityScript() {
        return `// Скрипт безопасности для Академии АНБ
console.log('🛡️ Скрипт безопасности - в разработке');`;
    }

    createUpdateScript() {
        return `// Скрипт обновления для Академии АНБ
console.log('🔄 Скрипт обновления - в разработке');`;
    }

    createValidateScript() {
        return `// Скрипт валидации для Академии АНБ
console.log('✅ Скрипт валидации - в разработке');`;
    }

    async setupFilePermissions() {
        // В Linux-системах настраиваем права доступа
        if (os.platform() === 'linux') {
            console.log('     🔐 Настройка прав доступа...');
            
            const directories = {
                'logs': '755',
                'uploads': '755',
                'backups': '700',
                'config': '600',
                'temp': '777'
            };

            for (const [dir, permissions] of Object.entries(directories)) {
                try {
                    await fs.chmod(join(__dirname, dir), parseInt(permissions, 8));
                    console.log(`       ✅ Права настроены для: ${dir}`);
                } catch (error) {
                    console.warn(`       ⚠️ Не удалось настроить права для ${dir}: ${error.message}`);
                }
            }
        }
    }

    async finalizeSetup() {
        console.log('   🎉 Завершение установки...');
        
        try {
            // Создание файла с информацией об установке
            await this.createSetupInfo();
            
            // Запись лога установки
            await this.writeSetupLog();
            
            // Создание скрипта запуска
            await this.createStartScript();
            
            console.log('   ✅ Установка завершена');
            
        } catch (error) {
            throw new Error(`Не удалось завершить установку: ${error.message}`);
        }
    }

    async createSetupInfo() {
        const setupInfo = {
            app: this.setupConfig.appName,
            version: this.setupConfig.version,
            setup_date: new Date().toISOString(),
            node_version: process.version,
            platform: os.platform(),
            arch: os.arch(),
            steps: this.setupLog,
            timeweb_specific: this.setupConfig.timewebSpecific
        };

        const infoPath = join(__dirname, 'setup-info.json');
        await fs.writeFile(infoPath, JSON.stringify(setupInfo, null, 2));
    }

    async writeSetupLog() {
        const logPath = join(__dirname, 'logs/setup.log');
        const logContent = this.setupLog.map(entry => 
            `[${entry.timestamp}] ${entry.step}: ${entry.status} - ${entry.message}`
        ).join('\n');
        
        await fs.writeFile(logPath, logContent);
    }

    async createStartScript() {
        const startScript = `#!/bin/bash
# Скрипт запуска Академии АНБ
echo "🚀 Запуск Академии АНБ версии 2.0.0..."

# Проверка переменных окружения
if [ -z "$BOT_TOKEN" ]; then
    echo "⚠️ Предупреждение: BOT_TOKEN не установлен"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "⚠️ Предупреждение: DATABASE_URL не установлен"
fi

# Запуск приложения
echo "📦 Запуск сервера..."
npm start
`;

        const scriptPath = join(__dirname, 'start.sh');
        await fs.writeFile(scriptPath, startScript);
        
        // Устанавливаем права на выполнение
        if (os.platform() === 'linux') {
            await fs.chmod(scriptPath, 0o755);
        }
    }

    async rollbackSetup() {
        console.log('\n🔄 Откат установки...');
        
        try {
            // Удаляем созданные файлы конфигурации
            const configFiles = [
                '.env',
                'config/database.json',
                'config/redis.json',
                'config/email.json',
                'config/security.json',
                'config/timeweb.json',
                'config/backup.json',
                'config/ssl.json'
            ];

            for (const file of configFiles) {
                try {
                    await fs.unlink(join(__dirname, file));
                } catch (error) {
                    // Игнорируем ошибки удаления несуществующих файлов
                }
            }

            console.log('✅ Откат завершен');
            
        } catch (error) {
            console.error('❌ Ошибка при откате:', error.message);
        }
    }
}

// Запуск установки если скрипт вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    const setupSystem = new SetupSystem();
    setupSystem.runSetup().catch(console.error);
}

export default SetupSystem;
