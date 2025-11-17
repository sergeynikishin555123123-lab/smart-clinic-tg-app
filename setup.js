// setup.js - ПОЛНЫЙ СКРИПТ УСТАНОВКИ И НАСТРОЙКИ СИСТЕМЫ
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import readline from 'readline';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Добавьте эту функцию для установки зависимостей
async function installDependenciesWithRetry() {
    console.log('📦 Установка зависимостей с флагом legacy-peer-deps...');
    
    try {
        const { stdout, stderr } = await execAsync('npm install --legacy-peer-deps', {
            cwd: process.cwd(),
            timeout: 300000 // 5 минут
        });
        
        if (stderr) {
            console.warn('⚠️ Предупреждения при установке:', stderr);
        }
        
        console.log('✅ Зависимости установлены с флагом legacy-peer-deps');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка установки зависимостей:', error.message);
        
        // Попробуем установить только основные зависимости
        console.log('🔄 Попытка установки только критических зависимостей...');
        try {
            const criticalDeps = [
                'express', 'telegraf', 'pg', 'bcryptjs', 'jsonwebtoken', 
                'cors', 'helmet', 'compression', 'multer', 'sharp'
            ].join(' ');
            
            await execAsync(`npm install ${criticalDeps} --no-save`, {
                cwd: process.cwd(),
                timeout: 300000
            });
            
            console.log('✅ Критические зависимости установлены');
            return true;
            
        } catch (secondError) {
            console.error('❌ Критическая ошибка установки:', secondError.message);
            return false;
        }
    }
}

class SystemSetup {
    constructor() {
        this.baseDir = __dirname;
        this.config = {
            BOT_TOKEN: process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4',
            PORT: process.env.PORT || 3000,
            WEBAPP_URL: process.env.WEBAPP_URL || 'https://anb-academy.timeweb.ru',
            ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(Number) : [898508164],
            SUPER_ADMIN_ID: parseInt(process.env.SUPER_ADMIN_ID) || 898508164,
            DATABASE_URL: process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@def46fb02c0eac8fefd6f734.twc1.net:5432/default_db',
            JWT_SECRET: process.env.JWT_SECRET || 'anb-academy-super-secret-jwt-key-2024',
            NODE_ENV: process.env.NODE_ENV || 'production'
        };
        
        this.directories = [
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
            'backups/database',
            'backups/files',
            'temp',
            'cache',
            'webapp/assets',
            'webapp/assets/courses',
            'webapp/assets/podcasts',
            'webapp/assets/streams',
            'webapp/assets/videos',
            'webapp/assets/materials',
            'webapp/assets/events',
            'webapp/assets/promotions',
            'webapp/assets/chats',
            'migrations',
            'scripts',
            'config'
        ];
        
        this.setupSteps = [
            { name: 'Проверка окружения', method: 'checkEnvironment' },
            { name: 'Создание директорий', method: 'createDirectories' },
            { name: 'Проверка зависимостей', method: 'checkDependencies' },
            { name: 'Настройка базы данных', method: 'setupDatabase' },
            { name: 'Создание демо-данных', method: 'createDemoData' },
            { name: 'Настройка веб-сервера', method: 'setupWebServer' },
            { name: 'Настройка безопасности', method: 'setupSecurity' },
            { name: 'Оптимизация производительности', method: 'optimizePerformance' },
            { name: 'Создание резервных копий', method: 'createBackups' },
            { name: 'Финальная проверка', method: 'finalCheck' }
        ];
        
        this.logFile = join(this.baseDir, 'logs', 'setup.log');
        this.startTime = Date.now();
    }

    async init() {
        console.log('🚀 Запуск установки Академии АНБ версии 2.0...\n');
        
        try {
            await this.setupLogging();
            await this.showWelcome();
            
            for (const [index, step] of this.setupSteps.entries()) {
                await this.executeStep(step, index + 1, this.setupSteps.length);
            }
            
            await this.showCompletion();
            
        } catch (error) {
            await this.logError('Критическая ошибка установки:', error);
            console.error('❌ Установка прервана из-за ошибки:', error.message);
            process.exit(1);
        }
    }

    async setupLogging() {
        try {
            await fs.mkdir(join(this.baseDir, 'logs'), { recursive: true });
            
            const logStream = await fs.open(this.logFile, 'a');
            const originalConsoleLog = console.log;
            const originalConsoleError = console.error;
            
            console.log = (...args) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                
                const timestamp = new Date().toISOString();
                const logMessage = `[${timestamp}] ${message}\n`;
                
                logStream.appendFile(logMessage).catch(() => {});
                originalConsoleLog(...args);
            };
            
            console.error = (...args) => {
                const message = args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                
                const timestamp = new Date().toISOString();
                const logMessage = `[${timestamp}] ERROR: ${message}\n`;
                
                logStream.appendFile(logMessage).catch(() => {});
                originalConsoleError(...args);
            };
            
            process.on('exit', () => {
                logStream.close().catch(() => {});
            });
            
        } catch (error) {
            // Если логирование не настроилось, продолжаем без него
            console.warn('⚠️ Не удалось настроить логирование:', error.message);
        }
    }

    async logError(message, error) {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ${message} ${error?.stack || error}\n`;
        
        try {
            await fs.appendFile(this.logFile, errorMessage);
        } catch {
            // Игнорируем ошибки записи в лог
        }
    }

    async showWelcome() {
        console.log('🎓 АКАДЕМИЯ АНБ - СИСТЕМА УСТАНОВКИ');
        console.log('=' .repeat(50));
        console.log('Версия: 2.0.0');
        console.log('Окружение:', this.config.NODE_ENV);
        console.log('Директория:', this.baseDir);
        console.log('Время начала:', new Date().toLocaleString());
        console.log('=' .repeat(50));
        console.log('');
        
        // Проверяем согласие на установку
        if (process.argv.includes('--non-interactive')) {
            console.log('🚀 Неинтерактивный режим - продолжаем установку...');
            return;
        }
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            rl.question('Продолжить установку? (y/N): ', (answer) => {
                rl.close();
                if (answer.toLowerCase() !== 'y') {
                    console.log('❌ Установка отменена пользователем');
                    process.exit(0);
                }
                resolve();
            });
        });
    }

    async executeStep(step, current, total) {
        console.log(`\n📋 Шаг ${current}/${total}: ${step.name}`);
        console.log('-'.repeat(50));
        
        try {
            const startTime = Date.now();
            await this[step.method]();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            
            console.log(`✅ ${step.name} - завершено за ${duration}с`);
            
        } catch (error) {
            console.error(`❌ Ошибка на шаге "${step.name}":`, error.message);
            await this.logError(`Step ${step.method} failed:`, error);
            throw error;
        }
    }

    async checkEnvironment() {
        console.log('🔍 Проверка окружения...');
        
        // Проверка версии Node.js
        const nodeVersion = process.version;
        const requiredVersion = '18.0.0';
        
        console.log(`• Node.js версия: ${nodeVersion}`);
        
        if (this.compareVersions(nodeVersion, requiredVersion) < 0) {
            throw new Error(`Требуется Node.js ${requiredVersion} или выше. Текущая версия: ${nodeVersion}`);
        }
        
        // Проверка платформы
        const platform = os.platform();
        const arch = os.arch();
        console.log(`• Платформа: ${platform} ${arch}`);
        
        if (!['win32', 'darwin', 'linux'].includes(platform)) {
            console.warn('⚠️ Неподдерживаемая платформа. Возможны проблемы с работой.');
        }
        
        // Проверка памяти
        const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
        const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024));
        console.log(`• Память: ${freeMem}GB свободно из ${totalMem}GB`);
        
        if (freeMem < 1) {
            throw new Error('Недостаточно свободной памяти. Требуется минимум 1GB свободной памяти.');
        }
        
        // Проверка дискового пространства
        try {
            const stats = await fs.statfs(this.baseDir);
            const freeSpace = Math.round((stats.bavail * stats.bsize) / (1024 * 1024 * 1024));
            console.log(`• Дисковое пространство: ${freeSpace}GB свободно`);
            
            if (freeSpace < 5) {
                throw new Error('Недостаточно дискового пространства. Требуется минимум 5GB.');
            }
        } catch (error) {
            console.warn('⚠️ Не удалось проверить дисковое пространство:', error.message);
        }
        
        // Проверка переменных окружения
        console.log('• Проверка переменных окружения...');
        const requiredEnvVars = ['BOT_TOKEN', 'DATABASE_URL'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.warn(`⚠️ Отсутствуют переменные окружения: ${missingVars.join(', ')}`);
            console.log('💡 Будут использованы значения по умолчанию');
        }
        
        // Проверка прав доступа
        try {
            await fs.access(this.baseDir, fs.constants.W_OK);
            console.log('• Права доступа: OK');
        } catch (error) {
            throw new Error('Нет прав на запись в текущую директорию');
        }
        
        console.log('✅ Проверка окружения завершена');
    }

    async createDirectories() {
        console.log('📁 Создание структуры директорий...');
        
        let createdCount = 0;
        let existingCount = 0;
        
        for (const dir of this.directories) {
            const fullPath = join(this.baseDir, dir);
            
            try {
                await fs.mkdir(fullPath, { recursive: true });
                
                if (!existsSync(fullPath)) {
                    await fs.mkdir(fullPath, { recursive: true });
                    createdCount++;
                    console.log(`• Создана: ${dir}`);
                } else {
                    existingCount++;
                }
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw new Error(`Не удалось создать директорию ${dir}: ${error.message}`);
                }
                existingCount++;
            }
        }
        
        // Создание базовых файлов
        await this.createBasicFiles();
        
        console.log(`✅ Директории: создано ${createdCount}, уже существует ${existingCount}`);
    }

    async createBasicFiles() {
        const basicFiles = {
            '.env': `# Конфигурация Академии АНБ
BOT_TOKEN=${this.config.BOT_TOKEN}
PORT=${this.config.PORT}
WEBAPP_URL=${this.config.WEBAPP_URL}
ADMIN_IDS=${this.config.ADMIN_IDS.join(',')}
SUPER_ADMIN_ID=${this.config.SUPER_ADMIN_ID}
DATABASE_URL=${this.config.DATABASE_URL}
JWT_SECRET=${this.config.JWT_SECRET}
NODE_ENV=${this.config.NODE_ENV}

# Дополнительные настройки
LOG_LEVEL=info
CACHE_TTL=3600
UPLOAD_MAX_SIZE=52428800
SESSION_TIMEOUT=86400000

# Безопасность
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Базы данных
REDIS_URL=redis://localhost:6379
MONGODB_URL=mongodb://localhost:27017/anb-academy

# Платежи
STRIPE_SECRET=sk_test_your_stripe_key
YOOMONEY_SECRET=your_yoomoney_key

# Email
SMTP_HOST=smtp.timeweb.ru
SMTP_PORT=587
SMTP_USER=noreply@anb-academy.ru
SMTP_PASS=your_smtp_password

# Облачные хранилища
CLOUDINARY_URL=cloudinary://key:secret@cloudname
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret

# Аналитика
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_newrelic_key
`,
            
            'webapp/.htaccess': `# Настройки для Apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Кэширование
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</FilesMatch>

# Безопасность
<Files ".env">
    Deny from all
</Files>

# Gzip сжатие
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>`,

            'webapp/robots.txt': `# Robots.txt для Академии АНБ
User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.config.WEBAPP_URL}/sitemap.xml`,

            'webapp/sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${this.config.WEBAPP_URL}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${this.config.WEBAPP_URL}/courses</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${this.config.WEBAPP_URL}/podcasts</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
</urlset>`,

            'logs/.gitkeep': '# Директория для логов',
            'backups/.gitkeep': '# Директория для резервных копий',
            'uploads/.gitkeep': '# Директория для загружаемых файлов'
        };
        
        for (const [filePath, content] of Object.entries(basicFiles)) {
            const fullPath = join(this.baseDir, filePath);
            
            if (!existsSync(fullPath)) {
                await fs.writeFile(fullPath, content, 'utf8');
                console.log(`• Создан файл: ${filePath}`);
            }
        }
    }

    async checkDependencies() {
    console.log('📦 Проверка зависимостей...');
    
    try {
        // Проверка package.json
        const packageJsonPath = join(this.baseDir, 'package.json');
        if (!existsSync(packageJsonPath)) {
            throw new Error('package.json не найден');
        }
        
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        console.log(`• Приложение: ${packageJson.name} v${packageJson.version}`);
        
        // Упрощенная проверка зависимостей
        const criticalDeps = ['express', 'telegraf', 'pg', 'bcryptjs', 'jsonwebtoken'];
        const missingDeps = [];
        
        for (const dep of criticalDeps) {
            try {
                await import(dep);
            } catch {
                missingDeps.push(dep);
            }
        }
        
        if (missingDeps.length > 0) {
            console.warn(`⚠️ Отсутствуют критические зависимости: ${missingDeps.join(', ')}`);
            console.log('🚀 Установка зависимостей...');
            
            const success = await installDependenciesWithRetry();
            if (!success) {
                throw new Error('Не удалось установить критические зависимости');
            }
        }
        
        console.log('✅ Проверка зависимостей завершена');
        
    } catch (error) {
        throw new Error(`Ошибка проверки зависимостей: ${error.message}`);
    }
}

    async installDependencies() {
        console.log('📦 Установка зависимостей...');
        
        try {
            const { stdout, stderr } = await execAsync('npm install', {
                cwd: this.baseDir,
                timeout: 300000 // 5 минут
            });
            
            if (stderr) {
                console.warn('⚠️ Предупреждения при установке:', stderr);
            }
            
            console.log('✅ Зависимости установлены');
            
        } catch (error) {
            throw new Error(`Ошибка установки зависимостей: ${error.message}`);
        }
    }

    async setupDatabase() {
        console.log('🗄️ Настройка базы данных...');
        
        try {
            // Проверка подключения к PostgreSQL
            const { Client } = await import('pg');
            const client = new Client({
                connectionString: this.config.DATABASE_URL,
                ssl: this.config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
            
            try {
                await client.connect();
                console.log('• PostgreSQL: подключение успешно');
                
                // Проверка версии PostgreSQL
                const versionResult = await client.query('SELECT version()');
                const versionMatch = versionResult.rows[0].version.match(/PostgreSQL ([\d.]+)/);
                if (versionMatch) {
                    console.log(`• PostgreSQL версия: ${versionMatch[1]}`);
                }
                
                // Создание таблиц через миграции
                await this.runMigrations(client);
                
                await client.end();
                
            } catch (error) {
                await client.end();
                throw new Error(`Ошибка подключения к БД: ${error.message}`);
            }
            
            // Проверка Redis
            try {
                const Redis = (await import('ioredis')).default;
                const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
                
                await redis.ping();
                console.log('• Redis: подключение успешно');
                
                const info = await redis.info('server');
                const versionMatch = info.match(/redis_version:([\d.]+)/);
                if (versionMatch) {
                    console.log(`• Redis версия: ${versionMatch[1]}`);
                }
                
                await redis.quit();
                
            } catch (error) {
                console.warn('⚠️ Redis недоступен:', error.message);
                console.log('💡 Redis будет использоваться в fallback-режиме');
            }
            
            console.log('✅ Настройка базы данных завершена');
            
        } catch (error) {
            throw new Error(`Ошибка настройки БД: ${error.message}`);
        }
    }

    async runMigrations(client) {
        console.log('• Запуск миграций...');
        
        const migrations = [
            // Таблица миграций
            `CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                batch INTEGER NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
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
                created_by BIGINT REFERENCES users(id),
                instructor_id BIGINT REFERENCES users(id),
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
            
            // Индексы для производительности
            `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(active)`
        ];
        
        let executedMigrations = 0;
        
        for (const [index, migration] of migrations.entries()) {
            try {
                await client.query(migration);
                executedMigrations++;
                
                // Записываем миграцию в таблицу миграций
                await client.query(
                    'INSERT INTO migrations (name, batch) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
                    [`migration_${index + 1}`, 1]
                );
                
            } catch (error) {
                if (!error.message.includes('уже существует')) {
                    throw error;
                }
            }
        }
        
        console.log(`• Выполнено миграций: ${executedMigrations}`);
    }

    async createDemoData() {
        console.log('🎨 Создание демо-данных...');
        
        try {
            const { Client } = await import('pg');
            const client = new Client({
                connectionString: this.config.DATABASE_URL,
                ssl: this.config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
            
            await client.connect();
            
            // Проверяем, есть ли уже демо-данные
            const userCheck = await client.query('SELECT COUNT(*) FROM users WHERE id = $1', [this.config.SUPER_ADMIN_ID]);
            const courseCheck = await client.query('SELECT COUNT(*) FROM courses');
            
            if (parseInt(userCheck.rows[0].count) === 0) {
                console.log('• Создание супер-администратора...');
                
                await client.query(
                    `INSERT INTO users (id, telegram_data, profile_data, is_admin, is_super_admin, is_verified, survey_completed)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        this.config.SUPER_ADMIN_ID,
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
                            bio: 'Главный администратор Академии АНБ',
                            avatar_url: '/webapp/assets/admin-avatar.jpg'
                        }),
                        true,
                        true,
                        true,
                        true
                    ]
                );
            }
            
            if (parseInt(courseCheck.rows[0].count) === 0) {
                console.log('• Создание демо-курсов...');
                
                const demoCourses = [
                    {
                        title: 'Мануальные техники в практике невролога',
                        subtitle: 'Современные подходы к диагностике и лечению',
                        description: '6 модулей по современным мануальным методикам',
                        full_description: 'Комплексный курс по мануальным техникам для практикующих врачей-неврологов.',
                        price: 25000,
                        original_price: 30000,
                        discount: 16.67,
                        discount_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        duration: '12 недель',
                        modules: 6,
                        lessons: 24,
                        category: 'Мануальные техники',
                        subcategory: 'Неврология',
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
                        created_by: this.config.SUPER_ADMIN_ID,
                        instructor_id: this.config.SUPER_ADMIN_ID
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
                        image_url: '/webapp/assets/course-diagnosis.jpg',
                        active: true,
                        featured: true,
                        students_count: 234,
                        rating: 4.6,
                        created_by: this.config.SUPER_ADMIN_ID,
                        instructor_id: this.config.SUPER_ADMIN_ID
                    }
                ];
                
                for (const course of demoCourses) {
                    await client.query(
                        `INSERT INTO courses (
                            title, subtitle, description, full_description, price, original_price, discount,
                            discount_end_date, duration, modules, lessons, category, subcategory, level,
                            difficulty, image_url, active, featured, popular, new, students_count, rating,
                            reviews_count, created_by, instructor_id
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
                        )`,
                        Object.values(course)
                    );
                }
                
                console.log(`• Создано демо-курсов: ${demoCourses.length}`);
            }
            
            await client.end();
            console.log('✅ Демо-данные созданы');
            
        } catch (error) {
            console.warn('⚠️ Не удалось создать демо-данные:', error.message);
        }
    }

    async setupWebServer() {
        console.log('🌐 Настройка веб-сервера...');
        
        try {
            // Проверка порта
            const net = await import('net');
            const isPortAvailable = await new Promise((resolve) => {
                const server = net.createServer();
                server.once('error', () => resolve(false));
                server.once('listening', () => {
                    server.close();
                    resolve(true);
                });
                server.listen(this.config.PORT);
            });
            
            if (!isPortAvailable) {
                throw new Error(`Порт ${this.config.PORT} уже занят`);
            }
            
            console.log(`• Порт ${this.config.PORT}: доступен`);
            
            // Создание конфигурации для веб-сервера
            const nginxConfig = `# Nginx конфигурация для Академии АНБ
server {
    listen 80;
    server_name ${new URL(this.config.WEBAPP_URL).hostname};
    
    # Основное приложение
    location / {
        proxy_pass http://localhost:${this.config.PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Статические файлы
    location /webapp/ {
        alias ${join(this.baseDir, 'webapp')}/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /uploads/ {
        alias ${join(this.baseDir, 'uploads')}/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Безопасность
    location ~ /\. {
        deny all;
    }
    
    location ~ /\\.env$ {
        deny all;
    }
    
    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}`;

            const nginxPath = join(this.baseDir, 'config', 'nginx.conf');
            await fs.writeFile(nginxPath, nginxConfig, 'utf8');
            console.log('• Конфигурация Nginx создана');
            
            // Создание systemd service
            if (os.platform() === 'linux') {
                const systemdService = `[Unit]
Description=ANB Academy Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${this.baseDir}
ExecStart=/usr/bin/node ${join(this.baseDir, 'server.js')}
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target`;
                
                const systemdPath = join(this.baseDir, 'config', 'anb-academy.service');
                await fs.writeFile(systemdPath, systemdService, 'utf8');
                console.log('• Конфигурация systemd создана');
            }
            
            console.log('✅ Настройка веб-сервера завершена');
            
        } catch (error) {
            throw new Error(`Ошибка настройки веб-сервера: ${error.message}`);
        }
    }

    async setupSecurity() {
        console.log('🔒 Настройка безопасности...');
        
        try {
            // Создание SSL сертификатов (для разработки)
            if (this.config.NODE_ENV === 'development') {
                await this.generateDevSSL();
            }
            
            // Настройка CORS
            const corsConfig = {
                origin: [
                    this.config.WEBAPP_URL,
                    'https://telegram.org',
                    'https://web.telegram.org'
                ],
                credentials: true
            };
            
            const securityConfig = {
                cors: corsConfig,
                rateLimit: {
                    windowMs: 15 * 60 * 1000, // 15 минут
                    max: 100 // максимум 100 запросов за окно
                },
                helmet: {
                    contentSecurityPolicy: {
                        directives: {
                            defaultSrc: ["'self'"],
                            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                            fontSrc: ["'self'", "https://fonts.gstatic.com"],
                            imgSrc: ["'self'", "data:", "https:", "blob:"],
                            scriptSrc: ["'self'", "'unsafe-inline'"],
                            connectSrc: ["'self'", "ws:", "wss:"]
                        }
                    }
                }
            };
            
            const securityPath = join(this.baseDir, 'config', 'security.json');
            await fs.writeFile(securityPath, JSON.stringify(securityConfig, null, 2), 'utf8');
            console.log('• Конфигурация безопасности создана');
            
            // Создание .htaccess для Apache
            const htaccess = `# Безопасность Apache
<Files ".env">
    Deny from all
</Files>

<Files "*.log">
    Deny from all
</Files>

# Запрет доступа к системным файлам
<FilesMatch "(^#.*#|\\..~|~)$">
    Deny from all
</FilesMatch>

# Защита от XSS
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"`;
            
            const htaccessPath = join(this.baseDir, '.htaccess');
            await fs.writeFile(htaccessPath, htaccess, 'utf8');
            console.log('• Конфигурация .htaccess создана');
            
            console.log('✅ Настройка безопасности завершена');
            
        } catch (error) {
            throw new Error(`Ошибка настройки безопасности: ${error.message}`);
        }
    }

    async generateDevSSL() {
        try {
            const certDir = join(this.baseDir, 'ssl');
            await fs.mkdir(certDir, { recursive: true });
            
            // Генерация самоподписанного сертификата для разработки
            const { generate } = await import('selfsigned');
            const attrs = [{ name: 'commonName', value: 'anb-academy.local' }];
            const options = { days: 365, keySize: 2048 };
            
            const pems = generate(attrs, options);
            
            await fs.writeFile(join(certDir, 'cert.pem'), pems.cert, 'utf8');
            await fs.writeFile(join(certDir, 'key.pem'), pems.private, 'utf8');
            
            console.log('• SSL сертификаты для разработки созданы');
            
        } catch (error) {
            console.warn('⚠️ Не удалось создать SSL сертификаты:', error.message);
        }
    }

    async optimizePerformance() {
        console.log('⚡ Оптимизация производительности...');
        
        try {
            // Конфигурация кэширования
            const cacheConfig = {
                redis: {
                    host: 'localhost',
                    port: 6379,
                    ttl: 3600
                },
                memory: {
                    max: 100,
                    ttl: 300
                },
                static: {
                    maxAge: 31536000 // 1 год
                }
            };
            
            const cachePath = join(this.baseDir, 'config', 'cache.json');
            await fs.writeFile(cachePath, JSON.stringify(cacheConfig, null, 2), 'utf8');
            console.log('• Конфигурация кэширования создана');
            
            // Настройка кластеризации
            const clusterConfig = {
                enabled: this.config.NODE_ENV === 'production',
                workers: os.cpus().length,
                respawn: true,
                timeout: 5000
            };
            
            const clusterPath = join(this.baseDir, 'config', 'cluster.json');
            await fs.writeFile(clusterPath, JSON.stringify(clusterConfig, null, 2), 'utf8');
            console.log('• Конфигурация кластеризации создана');
            
            // Создание скриптов оптимизации
            const optimizeScript = `#!/bin/bash
# Скрипт оптимизации Академии АНБ

echo "🔄 Оптимизация производительности..."

# Очистка кэша
npm run clean:cache

# Оптимизация базы данных
npm run db:optimize

# Сборка фронтенда
npm run build:webapp

# Очистка логов
find ./logs -name "*.log" -type f -mtime +7 -delete

echo "✅ Оптимизация завершена"`;
            
            const scriptPath = join(this.baseDir, 'scripts', 'optimize.sh');
            await fs.writeFile(scriptPath, optimizeScript, 'utf8');
            await fs.chmod(scriptPath, 0o755);
            console.log('• Скрипт оптимизации создан');
            
            console.log('✅ Оптимизация производительности завершена');
            
        } catch (error) {
            throw new Error(`Ошибка оптимизации производительности: ${error.message}`);
        }
    }

    async createBackups() {
        console.log('💾 Создание резервных копий...');
        
        try {
            const backupDir = join(this.baseDir, 'backups', 'initial');
            await fs.mkdir(backupDir, { recursive: true });
            
            // Резервное копирование конфигурации
            const configFiles = [
                'package.json',
                '.env',
                'config/security.json',
                'config/cache.json',
                'config/cluster.json'
            ];
            
            for (const file of configFiles) {
                const source = join(this.baseDir, file);
                const target = join(backupDir, file);
                
                if (existsSync(source)) {
                    await fs.mkdir(dirname(target), { recursive: true });
                    await fs.copyFile(source, target);
                }
            }
            
            // Создание скрипта восстановления
            const restoreScript = `#!/bin/bash
# Скрипт восстановления Академии АНБ из резервной копии

BACKUP_DIR="./backups/initial"
RESTORE_DIR="./"

echo "🔄 Восстановление системы из резервной копии..."

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Директория с резервной копией не найдена: $BACKUP_DIR"
    exit 1
fi

# Копирование конфигурационных файлов
cp -r "$BACKUP_DIR"/* "$RESTORE_DIR"/

echo "✅ Восстановление завершено"
echo "💡 Не забудьте:"
echo "   - Проверить настройки в .env"
echo "   - Запустить: npm install"
echo "   - Запустить: npm run setup"`;
            
            const restorePath = join(this.baseDir, 'scripts', 'restore.sh');
            await fs.writeFile(restorePath, restoreScript, 'utf8');
            await fs.chmod(restorePath, 0o755);
            
            console.log('• Резервные копии созданы');
            console.log('• Скрипт восстановления создан');
            console.log('✅ Создание резервных копий завершено');
            
        } catch (error) {
            throw new Error(`Ошибка создания резервных копий: ${error.message}`);
        }
    }

    async finalCheck() {
        console.log('🔍 Финальная проверка системы...');
        
        const checks = [];
        
        // Проверка директорий
        for (const dir of this.directories) {
            const exists = existsSync(join(this.baseDir, dir));
            checks.push({
                name: `Директория ${dir}`,
                status: exists ? '✅' : '❌',
                message: exists ? 'Существует' : 'Отсутствует'
            });
        }
        
        // Проверка критических файлов
        const criticalFiles = [
            'package.json',
            'server.js',
            'webapp/app.js',
            'webapp/style.css',
            'webapp/index.html',
            '.env'
        ];
        
        for (const file of criticalFiles) {
            const exists = existsSync(join(this.baseDir, file));
            checks.push({
                name: `Файл ${file}`,
                status: exists ? '✅' : '❌',
                message: exists ? 'Существует' : 'Отсутствует'
            });
        }
        
        // Проверка подключения к БД
        try {
            const { Client } = await import('pg');
            const client = new Client({
                connectionString: this.config.DATABASE_URL,
                ssl: this.config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });
            await client.connect();
            await client.end();
            checks.push({
                name: 'Подключение к PostgreSQL',
                status: '✅',
                message: 'Успешно'
            });
        } catch (error) {
            checks.push({
                name: 'Подключение к PostgreSQL',
                status: '❌',
                message: error.message
            });
        }
        
        // Проверка порта
        try {
            const net = await import('net');
            const isPortAvailable = await new Promise((resolve) => {
                const server = net.createServer();
                server.once('error', () => resolve(false));
                server.once('listening', () => {
                    server.close();
                    resolve(true);
                });
                server.listen(this.config.PORT);
            });
            
            checks.push({
                name: `Порт ${this.config.PORT}`,
                status: isPortAvailable ? '✅' : '❌',
                message: isPortAvailable ? 'Доступен' : 'Занят'
            });
        } catch (error) {
            checks.push({
                name: `Порт ${this.config.PORT}`,
                status: '❌',
                message: error.message
            });
        }
        
        // Вывод результатов проверки
        console.log('\n📊 Результаты проверки:');
        console.log('-'.repeat(60));
        
        for (const check of checks) {
            console.log(`${check.status} ${check.name}: ${check.message}`);
        }
        
        const failedChecks = checks.filter(check => check.status === '❌').length;
        
        if (failedChecks > 0) {
            console.log(`\n⚠️ Обнаружено ${failedChecks} проблем`);
            console.log('💡 Рекомендуется устранить проблемы перед запуском');
        } else {
            console.log('\n🎉 Все проверки пройдены успешно!');
        }
        
        console.log('✅ Финальная проверка завершена');
    }

    async showCompletion() {
        const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 УСТАНОВКА АКАДЕМИИ АНБ ЗАВЕРШЕНА!');
        console.log('='.repeat(60));
        console.log(`⏱️ Общее время установки: ${totalTime} секунд`);
        console.log(`📁 Директория: ${this.baseDir}`);
        console.log(`🌐 Окружение: ${this.config.NODE_ENV}`);
        console.log('');
        console.log('🚀 ДЛЯ ЗАПУСКА ВЫПОЛНИТЕ:');
        console.log('   npm start                    # Запуск продакшн сервера');
        console.log('   npm run dev                  # Запуск в режиме разработки');
        console.log('');
        console.log('🔧 ДОПОЛНИТЕЛЬНЫЕ КОМАНДЫ:');
        console.log('   npm run setup               # Переустановка системы');
        console.log('   npm run backup              # Создание резервной копии');
        console.log('   npm run optimize            # Оптимизация производительности');
        console.log('   npm run monitor             # Мониторинг системы');
        console.log('');
        console.log('📞 ПОДДЕРЖКА:');
        console.log('   📧 Email: support@anb-academy.ru');
        console.log('   📱 Telegram: @anb_academy_support');
        console.log('   🌐 Сайт: https://anb-academy.ru');
        console.log('='.repeat(60));
        
        // Создание файла с информацией об установке
        const installInfo = {
            version: '2.0.0',
            installTime: new Date().toISOString(),
            installDuration: totalTime,
            nodeVersion: process.version,
            platform: os.platform(),
            arch: os.arch(),
            config: {
                port: this.config.PORT,
                webappUrl: this.config.WEBAPP_URL,
                environment: this.config.NODE_ENV
            }
        };
        
        const infoPath = join(this.baseDir, 'INSTALLATION.json');
        await fs.writeFile(infoPath, JSON.stringify(installInfo, null, 2), 'utf8');
    }

    // Вспомогательные методы
    compareVersions(version1, version2) {
        const v1 = version1.replace('v', '').split('.').map(Number);
        const v2 = version2.replace('v', '').split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        
        return 0;
    }
}

// Запуск установки
const setup = new SystemSetup();

// Обработка аргументов командной строки
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎓 Академия АНБ - Система установки

Использование:
  node setup.js [опции]

Опции:
  --non-interactive    Неинтерактивный режим
  --install-deps       Автоматическая установка зависимостей
  --help, -h          Показать эту справку

Примеры:
  node setup.js                     # Интерактивная установка
  node setup.js --non-interactive   # Автоматическая установка
  node setup.js --install-deps      # Установка с авто-зависимостями
    `);
    process.exit(0);
}

setup.init().catch(error => {
    console.error('❌ Критическая ошибка:', error.message);
    process.exit(1);
});
