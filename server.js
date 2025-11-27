import express from 'express';
import { Telegraf, session, Markup } from 'telegraf';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import compression from 'compression';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ==================== НАСТРОЙКА MULTER ====================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + file.originalname.split('.').pop();
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = {
            'image/jpeg': true,
            'image/jpg': true,
            'image/png': true,
            'image/gif': true,
            'image/webp': true,
            'video/mp4': true,
            'video/mpeg': true,
            'video/quicktime': true,
            'video/webm': true,
            'audio/mpeg': true,
            'audio/mp3': true,
            'audio/wav': true,
            'audio/ogg': true,
            'application/pdf': true,
            'application/msword': true,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
            'application/vnd.ms-excel': true,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
            'text/plain': true
        };
        
        if (allowedTypes[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error(`Неподдерживаемый тип файла: ${file.mimetype}`), false);
        }
    }
});

// ==================== ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ MULTER ====================

const contentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.params.type;
        const uploadDir = join(__dirname, 'uploads', type);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.' + file.originalname.split('.').pop();
        cb(null, uniqueName);
    }
});

const contentUpload = multer({
    storage: contentStorage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
    }
});

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================

let bot = null;
let pool = null;

// ==================== ИНИЦИАЛИЗАЦИЯ БОТА ====================
  
function initializeBot() {
    if (process.env.BOT_TOKEN) {
        try {
            bot = new Telegraf(process.env.BOT_TOKEN);
            console.log('🤖 Бот инициализирован');
            return true;
        } catch (error) {
            console.error('❌ Ошибка инициализации бота:', error);
            return false;
        }
    } else {
        console.log('⚠️ Бот не настроен (отсутствует BOT_TOKEN)');
        return false;
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ====================

function initializeDatabase() {
    try {
        console.log('🔧 Настройка подключения к БД...');
        
        const poolConfig = {
            user: process.env.DB_USER || 'gen_user',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'anb_academy',
            password: process.env.DB_PASSWORD || 'password',
            port: parseInt(process.env.DB_PORT) || 5432,
            connectionTimeoutMillis: 30000,
            idleTimeoutMillis: 30000,
            max: 20,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };

        console.log('📊 Параметры подключения:');
        console.log(`   Host: ${poolConfig.host}`);
        console.log(`   Database: ${poolConfig.database}`);
        console.log(`   User: ${poolConfig.user}`);
        console.log(`   Port: ${poolConfig.port}`);

        pool = new Pool(poolConfig);
        
        // Тестируем подключение
        pool.query('SELECT NOW() as time')
            .then(result => {
                console.log('✅ Тест подключения к БД успешен:', result.rows[0].time);
            })
            .catch(error => {
                console.error('❌ Ошибка тестирования БД:', error.message);
            });

        return true;
    } catch (error) {
        console.error('❌ Ошибка создания пула подключений:', error.message);
        return false;
    }
}

// ==================== MIDDLEWARE ====================

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use('/api/*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// СТАТИЧЕСКИЕ ФАЙЛЫ
app.use(express.static(join(__dirname)));
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use('/webapp', express.static(join(__dirname, 'webapp')));
app.use('/admin', express.static(join(__dirname, 'admin')));

// Middleware для проверки базы данных
app.use((req, res, next) => {
    if (!pool) {
        return res.status(503).json({ 
            success: false, 
            error: 'База данных недоступна' 
        });
    }
    next();
});

// Middleware для аутентификации
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ success: false, error: 'Токен доступа отсутствует' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, error: 'Неверный токен' });
        req.user = user;
        next();
    });
};

// Middleware для проверки админских прав
const requireAdmin = (req, res, next) => {
    if (!req.user || (!req.user.is_admin && !req.user.is_super_admin)) {
        return res.status(403).json({ success: false, error: 'Требуются права администратора' });
    }
    next();
};

// Middleware для проверки супер-админских прав
const requireSuperAdmin = (req, res, next) => {
    if (!req.user || !req.user.is_super_admin) {
        return res.status(403).json({ success: false, error: 'Требуются права супер-администратора' });
    }
    next();
};

// ==================== ПЕРЕСОЗДАНИЕ ТАБЛИЦ ====================

async function recreateTables() {
    try {
        console.log('🔄 Принудительное пересоздание таблиц...');
        
        const tables = [
            'user_course_progress',
            'course_modules',
            'module_lessons',
            'lesson_materials',
            'quiz_questions',
            'user_quiz_attempts',
            'quiz_attempt_answers',
            'course_reviews',
            'user_achievements',
            'achievements',
            'notifications',
            'user_notifications',
            'payment_transactions',
            'refund_requests',
            'content_comments',
            'comment_likes',
            'user_sessions',
            'password_reset_tokens',
            'email_verification_tokens',
            'media_files',
            'support_requests',
            'support_messages',
            'admin_actions',
            'content_instructors',
            'subscriptions',
            'subscription_plans',
            'instructors',
            'favorites',
            'user_progress',
            'news',
            'events',
            'materials',
            'videos',
            'streams',
            'podcasts',
            'courses',
            'categories',
            'navigation_items',
            'users'
        ];
        
        for (const table of tables) {
            try {
                await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.log(`✅ Таблица ${table} удалена`);
            } catch (error) {
                console.log(`⚠️ Не удалось удалить таблицу ${table}:`, error.message);
            }
        }
        
        await createTables();
        console.log('✅ Все таблицы пересозданы');
        
    } catch (error) {
        console.error('❌ Ошибка пересоздания таблиц:', error);
    }
}

// ==================== БАЗА ДАННЫХ ====================
async function initDatabase() {
    try {
        console.log('🗄️ Проверка структуры базы данных...');
        
        const { rows: tableExists } = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!tableExists[0].exists) {
            console.log('📋 Создаем таблицы...');
            await createTables();
        } else {
            console.log('✅ Таблицы уже существуют');
            await checkAndUpdateTables();
        }
        
        await seedDemoData();
        console.log('✅ База данных готова к работе');
    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error);
        await recreateTables();
        await seedDemoData();
    }
}

async function checkAndUpdateTables() {
    try {
        // Проверяем и добавляем недостающие таблицы и колонки
        const tablesToCheck = [
            {
                name: 'user_course_progress',
                columns: [
                    'id SERIAL PRIMARY KEY',
                    'user_id INTEGER REFERENCES users(id)',
                    'course_id INTEGER REFERENCES courses(id)',
                    'module_id INTEGER',
                    'lesson_id INTEGER',
                    'progress_percentage INTEGER DEFAULT 0',
                    'completed BOOLEAN DEFAULT false',
                    'last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                    'time_spent INTEGER DEFAULT 0',
                    'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                    'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
                ]
            },
            {
                name: 'course_modules',
                columns: [
                    'id SERIAL PRIMARY KEY',
                    'course_id INTEGER REFERENCES courses(id)',
                    'title VARCHAR(500) NOT NULL',
                    'description TEXT',
                    'order_index INTEGER DEFAULT 0',
                    'duration INTEGER DEFAULT 0',
                    'is_active BOOLEAN DEFAULT true',
                    'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
                ]
            },
            {
                name: 'payment_transactions',
                columns: [
                    'id SERIAL PRIMARY KEY',
                    'user_id INTEGER REFERENCES users(id)',
                    'amount DECIMAL(10,2)',
                    'currency VARCHAR(10) DEFAULT \"RUB\"',
                    'payment_method VARCHAR(100)',
                    'status VARCHAR(50) DEFAULT \"pending\"',
                    'transaction_id VARCHAR(255)',
                    'description TEXT',
                    'metadata JSONB',
                    'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
                ]
            }
        ];

        for (const table of tablesToCheck) {
            const { rows: exists } = await pool.query(
                `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
                [table.name]
            );
            
            if (!exists[0].exists) {
                console.log(`🔄 Создаем таблицу ${table.name}...`);
                await pool.query(`CREATE TABLE ${table.name} (${table.columns.join(', ')})`);
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении таблиц:', error);
    }
}

async function createTables() {
    try {
        await pool.query(`
            -- ==================== ОСНОВНЫЕ ТАБЛИЦЫ ====================
            
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                telegram_id BIGINT UNIQUE,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                username VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(50),
                specialization VARCHAR(255),
                city VARCHAR(255),
                country VARCHAR(255),
                bio TEXT,
                subscription_end DATE,
                is_admin BOOLEAN DEFAULT false,
                is_super_admin BOOLEAN DEFAULT false,
                is_verified BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                avatar_url VARCHAR(500),
                password_hash VARCHAR(255),
                email_verification_token VARCHAR(255),
                reset_password_token VARCHAR(255),
                reset_password_expires TIMESTAMP,
                last_login TIMESTAMP,
                login_count INTEGER DEFAULT 0,
                timezone VARCHAR(50) DEFAULT 'Europe/Moscow',
                language VARCHAR(10) DEFAULT 'ru',
                notification_preferences JSONB DEFAULT '{"email": true, "push": true, "newsletter": true}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) UNIQUE,
                level VARCHAR(50) DEFAULT 'Новичок',
                experience INTEGER DEFAULT 0,
                points INTEGER DEFAULT 0,
                rank INTEGER DEFAULT 1,
                courses_started INTEGER DEFAULT 0,
                courses_completed INTEGER DEFAULT 0,
                courses_bought INTEGER DEFAULT 0,
                modules_completed INTEGER DEFAULT 0,
                materials_watched INTEGER DEFAULT 0,
                events_attended INTEGER DEFAULT 0,
                total_study_time INTEGER DEFAULT 0,
                streak_days INTEGER DEFAULT 0,
                last_study_date DATE,
                achievements_unlocked INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                icon VARCHAR(100),
                color VARCHAR(20),
                is_active BOOLEAN DEFAULT true,
                parent_id INTEGER REFERENCES categories(id),
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS navigation_items (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                icon VARCHAR(50),
                image_url VARCHAR(500),
                page VARCHAR(100) NOT NULL,
                position INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                required_subscription BOOLEAN DEFAULT false,
                required_role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ==================== КОНТЕНТНЫЕ ТАБЛИЦЫ ====================

            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                subtitle VARCHAR(500),
                description TEXT,
                full_description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                discount DECIMAL(10,2) DEFAULT 0,
                discount_end_date TIMESTAMP,
                duration VARCHAR(100),
                total_duration_minutes INTEGER DEFAULT 0,
                modules_count INTEGER DEFAULT 0,
                lessons_count INTEGER DEFAULT 0,
                category_id INTEGER REFERENCES categories(id),
                level VARCHAR(50) DEFAULT 'beginner',
                difficulty VARCHAR(50) DEFAULT 'medium',
                students_count INTEGER DEFAULT 0,
                rating DECIMAL(3,2) DEFAULT 4.5,
                review_count INTEGER DEFAULT 0,
                featured BOOLEAN DEFAULT false,
                popular BOOLEAN DEFAULT false,
                new BOOLEAN DEFAULT false,
                image_url VARCHAR(500),
                video_url VARCHAR(500),
                trailer_url VARCHAR(500),
                requirements TEXT,
                learning_outcomes JSONB,
                resources JSONB,
                certificate_available BOOLEAN DEFAULT false,
                certificate_template VARCHAR(500),
                access_type VARCHAR(50) DEFAULT 'free',
                max_students INTEGER,
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                enrollment_end_date TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                is_published BOOLEAN DEFAULT false,
                published_at TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS course_modules (
                id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                order_index INTEGER DEFAULT 0,
                duration_minutes INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_free BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS module_lessons (
                id SERIAL PRIMARY KEY,
                module_id INTEGER REFERENCES course_modules(id) ON DELETE CASCADE,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                content TEXT,
                lesson_type VARCHAR(50) DEFAULT 'video',
                duration_minutes INTEGER DEFAULT 0,
                order_index INTEGER DEFAULT 0,
                video_url VARCHAR(500),
                audio_url VARCHAR(500),
                document_url VARCHAR(500),
                thumbnail_url VARCHAR(500),
                is_preview BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS lesson_materials (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES module_lessons(id) ON DELETE CASCADE,
                title VARCHAR(500) NOT NULL,
                file_url VARCHAR(500),
                file_size INTEGER,
                file_type VARCHAR(100),
                description TEXT,
                order_index INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS podcasts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                full_description TEXT,
                duration VARCHAR(100),
                duration_seconds INTEGER DEFAULT 0,
                category_id INTEGER REFERENCES categories(id),
                listens INTEGER DEFAULT 0,
                image_url VARCHAR(500),
                audio_url VARCHAR(500),
                transcript TEXT,
                show_notes TEXT,
                guests JSONB,
                episode_number INTEGER,
                season_number INTEGER,
                is_active BOOLEAN DEFAULT true,
                is_published BOOLEAN DEFAULT false,
                published_at TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS streams (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                full_description TEXT,
                duration VARCHAR(100),
                category_id INTEGER REFERENCES categories(id),
                participants INTEGER DEFAULT 0,
                max_participants INTEGER,
                is_live BOOLEAN DEFAULT false,
                is_upcoming BOOLEAN DEFAULT false,
                scheduled_start TIMESTAMP,
                scheduled_end TIMESTAMP,
                actual_start TIMESTAMP,
                actual_end TIMESTAMP,
                thumbnail_url VARCHAR(500),
                video_url VARCHAR(500),
                chat_enabled BOOLEAN DEFAULT true,
                recording_available BOOLEAN DEFAULT false,
                requires_registration BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS videos (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                full_description TEXT,
                duration VARCHAR(100),
                duration_seconds INTEGER DEFAULT 0,
                category_id INTEGER REFERENCES categories(id),
                views INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                dislikes INTEGER DEFAULT 0,
                thumbnail_url VARCHAR(500),
                video_url VARCHAR(500),
                quality VARCHAR(50) DEFAULT 'hd',
                transcript TEXT,
                is_active BOOLEAN DEFAULT true,
                is_published BOOLEAN DEFAULT false,
                published_at TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                full_description TEXT,
                category_id INTEGER REFERENCES categories(id),
                material_type VARCHAR(100),
                file_url VARCHAR(500),
                file_size INTEGER,
                file_type VARCHAR(100),
                pages INTEGER DEFAULT 0,
                downloads INTEGER DEFAULT 0,
                image_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                is_published BOOLEAN DEFAULT false,
                published_at TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                full_description TEXT,
                event_type VARCHAR(50),
                event_date TIMESTAMP,
                event_end_date TIMESTAMP,
                timezone VARCHAR(50) DEFAULT 'Europe/Moscow',
                location VARCHAR(500),
                online_url VARCHAR(500),
                max_participants INTEGER,
                participants INTEGER DEFAULT 0,
                price DECIMAL(10,2) DEFAULT 0,
                image_url VARCHAR(500),
                registration_url VARCHAR(500),
                status VARCHAR(50) DEFAULT 'scheduled',
                is_active BOOLEAN DEFAULT true,
                is_published BOOLEAN DEFAULT false,
                published_at TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                content TEXT,
                excerpt TEXT,
                date VARCHAR(100),
                publish_date TIMESTAMP,
                category_id INTEGER REFERENCES categories(id),
                type VARCHAR(100),
                image_url VARCHAR(500),
                gallery JSONB,
                tags JSONB,
                is_active BOOLEAN DEFAULT true,
                is_published BOOLEAN DEFAULT false,
                published_at TIMESTAMP,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ==================== ПРЕПОДАВАТЕЛИ И КОНТЕНТ ====================

            CREATE TABLE IF NOT EXISTS instructors (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                name VARCHAR(255) NOT NULL,
                specialization VARCHAR(255),
                bio TEXT,
                short_bio TEXT,
                experience_years INTEGER,
                avatar_url VARCHAR(500),
                cover_image_url VARCHAR(500),
                email VARCHAR(255),
                phone VARCHAR(50),
                social_links JSONB,
                rating DECIMAL(3,2) DEFAULT 4.5,
                review_count INTEGER DEFAULT 0,
                courses_count INTEGER DEFAULT 0,
                students_count INTEGER DEFAULT 0,
                is_featured BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                verified BOOLEAN DEFAULT false,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS content_instructors (
                id SERIAL PRIMARY KEY,
                content_id INTEGER NOT NULL,
                content_type VARCHAR(50) NOT NULL,
                instructor_id INTEGER REFERENCES instructors(id),
                role VARCHAR(100),
                is_primary BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(content_id, content_type, instructor_id)
            );

            -- ==================== ПОДПИСКИ И ПЛАТЕЖИ ====================

            CREATE TABLE IF NOT EXISTS subscription_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price_monthly DECIMAL(10,2),
                price_quarterly DECIMAL(10,2),
                price_yearly DECIMAL(10,2),
                currency VARCHAR(10) DEFAULT 'RUB',
                features JSONB,
                max_courses INTEGER,
                max_storage_mb INTEGER,
                priority_support BOOLEAN DEFAULT false,
                certificate_included BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                is_popular BOOLEAN DEFAULT false,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                plan_id INTEGER REFERENCES subscription_plans(id),
                plan_type VARCHAR(50) DEFAULT 'monthly',
                price DECIMAL(10,2),
                status VARCHAR(50) DEFAULT 'active',
                starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ends_at TIMESTAMP,
                trial_ends_at TIMESTAMP,
                canceled_at TIMESTAMP,
                payment_data JSONB,
                auto_renew BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS payment_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                subscription_id INTEGER REFERENCES subscriptions(id),
                amount DECIMAL(10,2),
                currency VARCHAR(10) DEFAULT 'RUB',
                payment_method VARCHAR(100),
                payment_gateway VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                transaction_id VARCHAR(255),
                gateway_transaction_id VARCHAR(255),
                description TEXT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ==================== ПРОГРЕСС И АКТИВНОСТИ ====================

            CREATE TABLE IF NOT EXISTS user_course_progress (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                course_id INTEGER REFERENCES courses(id),
                module_id INTEGER REFERENCES course_modules(id),
                lesson_id INTEGER REFERENCES module_lessons(id),
                progress_percentage INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT false,
                last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                time_spent INTEGER DEFAULT 0,
                notes TEXT,
                rating INTEGER,
                review TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, course_id, lesson_id)
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                content_id INTEGER,
                content_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, content_id, content_type)
            );

            CREATE TABLE IF NOT EXISTS course_reviews (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                course_id INTEGER REFERENCES courses(id),
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review TEXT,
                is_verified BOOLEAN DEFAULT false,
                is_approved BOOLEAN DEFAULT true,
                helpful_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, course_id)
            );

            -- ==================== ТЕСТИРОВАНИЕ И КВИЗЫ ====================

            CREATE TABLE IF NOT EXISTS quiz_questions (
                id SERIAL PRIMARY KEY,
                lesson_id INTEGER REFERENCES module_lessons(id),
                question TEXT NOT NULL,
                question_type VARCHAR(50) DEFAULT 'multiple_choice',
                options JSONB,
                correct_answers JSONB,
                explanation TEXT,
                points INTEGER DEFAULT 1,
                order_index INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_quiz_attempts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                lesson_id INTEGER REFERENCES module_lessons(id),
                score INTEGER DEFAULT 0,
                max_score INTEGER DEFAULT 0,
                passed BOOLEAN DEFAULT false,
                time_spent INTEGER DEFAULT 0,
                completed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
                id SERIAL PRIMARY KEY,
                attempt_id INTEGER REFERENCES user_quiz_attempts(id),
                question_id INTEGER REFERENCES quiz_questions(id),
                user_answer JSONB,
                is_correct BOOLEAN DEFAULT false,
                points_earned INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ==================== ДОСТИЖЕНИЯ И НОТИФИКАЦИИ ====================

            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                icon VARCHAR(100),
                type VARCHAR(50),
                condition_type VARCHAR(50),
                condition_value INTEGER,
                points_reward INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_achievements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                achievement_id INTEGER REFERENCES achievements(id),
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, achievement_id)
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                type VARCHAR(50),
                action_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                notification_id INTEGER REFERENCES notifications(id),
                is_read BOOLEAN DEFAULT false,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ==================== КОММЕНТАРИИ И СООБЩЕСТВО ====================

            CREATE TABLE IF NOT EXISTS content_comments (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                content_id INTEGER,
                content_type VARCHAR(50),
                parent_id INTEGER REFERENCES content_comments(id),
                comment TEXT NOT NULL,
                is_approved BOOLEAN DEFAULT true,
                likes_count INTEGER DEFAULT 0,
                dislikes_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS comment_likes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                comment_id INTEGER REFERENCES content_comments(id),
                is_like BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, comment_id)
            );

            -- ==================== ПОДДЕРЖКА И АДМИНИСТРИРОВАНИЕ ====================

            CREATE TABLE IF NOT EXISTS support_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                subject VARCHAR(255),
                message TEXT,
                category VARCHAR(100),
                priority VARCHAR(50) DEFAULT 'medium',
                status VARCHAR(50) DEFAULT 'open',
                assigned_to INTEGER REFERENCES users(id),
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS support_messages (
                id SERIAL PRIMARY KEY,
                request_id INTEGER REFERENCES support_requests(id),
                user_id INTEGER REFERENCES users(id),
                message TEXT,
                attachments JSONB,
                is_read BOOLEAN DEFAULT false,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS admin_actions (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES users(id),
                action_type VARCHAR(100),
                description TEXT,
                target_id INTEGER,
                target_type VARCHAR(50),
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS media_files (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255),
                original_name VARCHAR(255),
                mime_type VARCHAR(100),
                size INTEGER,
                url VARCHAR(500),
                thumbnail_url VARCHAR(500),
                uploaded_by INTEGER REFERENCES users(id),
                folder VARCHAR(255),
                is_public BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ==================== СЕССИИ И АУТЕНТИФИКАЦИЯ ====================

            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                session_token VARCHAR(255) UNIQUE,
                ip_address VARCHAR(45),
                user_agent TEXT,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                token VARCHAR(255) UNIQUE,
                expires_at TIMESTAMP,
                used BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS email_verification_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                token VARCHAR(255) UNIQUE,
                expires_at TIMESTAMP,
                used BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ==================== ВОЗВРАТЫ И ОТМЕНЫ ====================

            CREATE TABLE IF NOT EXISTS refund_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                course_id INTEGER REFERENCES courses(id),
                subscription_id INTEGER REFERENCES subscriptions(id),
                reason TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                amount DECIMAL(10,2),
                processed_by INTEGER REFERENCES users(id),
                processed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- ==================== ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ ====================

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
            CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
            
            CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
            CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
            CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
            CREATE INDEX IF NOT EXISTS idx_courses_price ON courses(price);
            CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating);
            
            CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_course ON user_course_progress(user_id, course_id);
            CREATE INDEX IF NOT EXISTS idx_favorites_user_content ON favorites(user_id, content_type);
            
            CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
            CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
            CREATE INDEX IF NOT EXISTS idx_subscriptions_ends_at ON subscriptions(ends_at);
            
            CREATE INDEX IF NOT EXISTS idx_content_instructors_content ON content_instructors(content_id, content_type);
            CREATE INDEX IF NOT EXISTS idx_course_reviews_user_course ON course_reviews(user_id, course_id);
            CREATE INDEX IF NOT EXISTS idx_support_requests_user_status ON support_requests(user_id, status);
            
            CREATE INDEX IF NOT EXISTS idx_module_lessons_module ON module_lessons(module_id);
            CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson ON lesson_materials(lesson_id);
            CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson ON quiz_questions(lesson_id);
            
            CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
            CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
            
            CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

        `);
        
        console.log('✅ Все таблицы и индексы созданы');
    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error);
        throw error;
    }
}

// ==================== ФИКС ДОСТУПА АДМИНА ====================

async function createSuperAdmin() {
    try {
        const superAdminId = parseInt(process.env.SUPER_ADMIN_ID) || 898508164;
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@anb.ru';
        
        const { rows: existingAdmin } = await pool.query(
            'SELECT * FROM users WHERE telegram_id = $1 OR email = $2',
            [superAdminId, superAdminEmail]
        );
        
        if (existingAdmin.length === 0) {
            const passwordHash = await bcrypt.hash('admin123', 12);
            
            await pool.query(
                `INSERT INTO users (telegram_id, first_name, username, email, is_admin, is_super_admin, is_verified, subscription_end, password_hash) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    superAdminId, 
                    'Главный Админ', 
                    'superadmin', 
                    superAdminEmail,
                    true, 
                    true, 
                    true,
                    '2030-12-31',
                    passwordHash
                ]
            );
            console.log('✅ Супер-админ создан');
        } else {
            await pool.query(
                `UPDATE users SET is_admin = true, is_super_admin = true, is_verified = true WHERE telegram_id = $1 OR email = $2`,
                [superAdminId, superAdminEmail]
            );
            console.log('✅ Права супер-админа обновлены');
        }

        // Создаем прогресс для админа
        const { rows: admin } = await pool.query('SELECT id FROM users WHERE telegram_id = $1', [superAdminId]);
        if (admin.length > 0) {
            const { rows: existingProgress } = await pool.query(
                'SELECT * FROM user_progress WHERE user_id = $1',
                [admin[0].id]
            );
            
            if (existingProgress.length === 0) {
                await pool.query(
                    `INSERT INTO user_progress (user_id, level, experience, points, courses_completed, modules_completed, materials_watched) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [admin[0].id, 'Эксперт', 5000, 2500, 15, 45, 89]
                );
            }
        }
    } catch (error) {
        console.error('❌ Ошибка создания супер-админа:', error);
    }
}

// ==================== ЗАПОЛНЕНИЕ ДЕМО-ДАННЫМИ ====================

async function seedDemoData() {
    try {
        // Создаем супер-админа
        await createSuperAdmin();
        
        // Демо-категории
        const { rows: categoryCount } = await pool.query('SELECT COUNT(*) FROM categories');
        if (parseInt(categoryCount[0].count) === 0) {
            console.log('📂 Добавляем демо-категории...');
            await pool.query(`
                INSERT INTO categories (name, type, description, icon, color, sort_order) VALUES
                ('Неврология', 'courses', 'Курсы по неврологии', '🧠', '#4CAF50', 1),
                ('Мануальные техники', 'courses', 'Курсы по мануальной терапии', '💆', '#FF9800', 2),
                ('Реабилитация', 'courses', 'Курсы по реабилитации', '🏥', '#2196F3', 3),
                ('Диагностика', 'courses', 'Курсы по диагностике', '🔍', '#9C27B0', 4),
                ('Педиатрия', 'courses', 'Курсы по педиатрии', '👶', '#FF5722', 5),
                
                ('Неврология', 'podcasts', 'Подкасты по неврологии', '🎧', '#4CAF50', 1),
                ('Мануальные техники', 'podcasts', 'Подкасты по мануальной терапии', '💆', '#FF9800', 2),
                ('Интервью', 'podcasts', 'Интервью с экспертами', '🎙️', '#2196F3', 3),
                
                ('Неврология', 'videos', 'Видео по неврологии', '🎬', '#4CAF50', 1),
                ('Мануальные техники', 'videos', 'Видео по мануальной терапии', '💆', '#FF9800', 2),
                ('Операции', 'videos', 'Записи операций', '🔪', '#F44336', 3),
                
                ('Чек-листы', 'materials', 'Чек-листы для врачей', '✅', '#4CAF50', 1),
                ('Протоколы', 'materials', 'Протоколы лечения', '📋', '#FF9800', 2),
                ('Исследования', 'materials', 'Научные исследования', '📊', '#2196F3', 3),
                
                ('Конференции', 'events', 'Медицинские конференции', '🎪', '#4CAF50', 1),
                ('Семинары', 'events', 'Обучающие семинары', '📚', '#FF9800', 2),
                ('Воркшопы', 'events', 'Практические воркшопы', '🔧', '#2196F3', 3),
                
                ('Новости', 'news', 'Новости медицины', '📰', '#4CAF50', 1),
                ('Статьи', 'news', 'Научные статьи', '📄', '#FF9800', 2),
                ('Обзоры', 'news', 'Обзоры исследований', '🔍', '#2196F3', 3)
            `);
        }

        // Демо-преподаватели
        const { rows: instructorCount } = await pool.query('SELECT COUNT(*) FROM instructors');
        if (parseInt(instructorCount[0].count) === 0) {
            console.log('👨‍🏫 Добавляем демо-преподаватели...');
            await pool.query(`
                INSERT INTO instructors (name, specialization, bio, short_bio, experience_years, avatar_url, email, social_links, rating, courses_count, students_count, is_featured, display_order) VALUES
                ('Доктор Иванов А.В.', 'Неврология, Мануальная терапия', 'Ведущий специалист по мануальной терапии с 15-летним опытом работы. Автор инновационных методик лечения болей в спине и реабилитации пациентов с неврологическими нарушениями. Член Европейской ассоциации неврологов.', 'Специалист по мануальной терапии, 15 лет опыта', 15, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face', 'ivanov@anb.ru', '{"telegram": "@ivanov_neuro", "instagram": "dr_ivanov", "website": "ivanov-clinic.ru"}', 4.8, 8, 1250, true, 1),
                ('Профессор Петрова С.М.', 'Реабилитация, Физиотерапия', 'Эксперт по реабилитации пациентов с неврологическими нарушениями. Доктор медицинских наук, автор более 50 научных работ. Руководитель центра реабилитации, специалист по современным методам физиотерапии.', 'Эксперт по реабилитации, доктор медицинских наук', 20, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face', 'petrova@anb.ru', '{"telegram": "@petrova_rehab", "website": "petrova-clinic.ru", "email": "petrova@clinic.ru"}', 4.9, 12, 890, true, 2),
                ('Доктор Сидоров К.Д.', 'Диагностика, Неврология', 'Специалист по современным методам диагностики неврологических заболеваний. Внедрил более 10 новых диагностических методик в клиническую практику. Эксперт в области МРТ и КТ диагностики.', 'Специалист по диагностике, 12 лет опыта', 12, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&h=300&fit=crop&crop=face', 'sidorov@anb.ru', '{"telegram": "@sidorov_diagnostic", "instagram": "dr_sidorov"}', 4.7, 6, 670, true, 3),
                ('Доктор Козлова Е.В.', 'Педиатрическая неврология', 'Специалист по детской неврологии с 10-летним опытом. Автор методик ранней диагностики неврологических нарушений у детей. Член ассоциации детских неврологов.', 'Специалист по детской неврологии', 10, 'https://images.unsplash.com/photo-1594824947933-d0501ba2fe65?w=300&h=300&fit=crop&crop=face', 'kozlova@anb.ru', '{"telegram": "@kozlova_pediatric", "email": "kozlova@children-clinic.ru"}', 4.6, 4, 450, false, 4),
                ('Профессор Николаев П.С.', 'Нейрохирургия', 'Ведущий нейрохирург с 25-летним опытом. Провел более 2000 успешных операций. Специалист по микрохирургии и эндоскопическим операциям на позвоночнике.', 'Ведущий нейрохирург, 25 лет опыта', 25, 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&h=300&fit=crop&crop=face', 'nikolaev@anb.ru', '{"website": "nikolaev-surgery.ru", "email": "nikolaev@surgery.ru"}', 4.9, 3, 320, true, 5)
            `);
        }

        // Демо-курсы
        const { rows: courseCount } = await pool.query('SELECT COUNT(*) FROM courses');
        if (parseInt(courseCount[0].count) === 0) {
            console.log('📚 Добавляем демо-курсы...');
            
            // Получаем ID категорий
            const { rows: categories } = await pool.query('SELECT id, name FROM categories WHERE type = $1', ['courses']);
            const categoryMap = {};
            categories.forEach(cat => {
                categoryMap[cat.name] = cat.id;
            });

            await pool.query(`
                INSERT INTO courses (title, subtitle, description, full_description, price, discount, duration, modules_count, lessons_count, category_id, level, difficulty, students_count, rating, review_count, featured, popular, new, image_url, video_url, certificate_available, access_type, is_published, published_at, learning_outcomes) VALUES
                ('Мануальные техники в практике невролога', 'Современные подходы к лечению болей в спине', '6 модулей по современным мануальным методикам диагностики и лечения заболеваний позвоночника', 'Этот курс предоставляет комплексное обучение современным мануальным техникам, которые могут быть применены в практике невролога. Вы изучите анатомию и биомеханику позвоночника, освоите методы диагностики и научитесь применять различные мануальные техники для лечения болей в спине, шее и других неврологических нарушений.', 25000, 3000, '12 недель', 6, 24, $1, 'advanced', 'hard', 156, 4.8, 34, true, true, false, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop', 'https://example.com/video1', true, 'premium', true, NOW(), '["Освоение основных мануальных техник", "Диагностика нарушений позвоночника", "Разработка индивидуальных планов лечения", "Профилактика рецидивов"]'),
                ('Неврологическая диагностика', 'От основ к сложным случаям', '5 модулей по современной диагностике неврологических заболеваний', 'Курс охватывает все аспекты неврологической диагностики - от базового неврологического осмотра до сложных диагностических случаев. Особое внимание уделяется интерпретации результатов МРТ, КТ и других методов визуализации.', 18000, 0, '8 недель', 5, 20, $2, 'intermediate', 'medium', 234, 4.6, 28, true, true, true, 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop', 'https://example.com/video2', true, 'premium', true, NOW(), '["Проведение полного неврологического осмотра", "Интерпретация результатов МРТ/КТ", "Дифференциальная диагностика", "Составление диагностических алгоритмов"]'),
                ('Реабилитация пациентов с инсультом', 'Современные протоколы и методики', '4 модуля по современным методикам реабилитации после инсульта', 'Комплексный курс по реабилитации пациентов, перенесших инсульт. Рассматриваются как ранние, так и поздние этапы реабилитации, включая физическую, когнитивную и социальную адаптацию.', 22000, 2000, '10 недель', 4, 16, $3, 'intermediate', 'medium', 189, 4.7, 22, false, true, false, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop', 'https://example.com/video3', true, 'premium', true, NOW(), '["Разработка индивидуальных программ реабилитации", "Применение современных реабилитационных техник", "Оценка эффективности реабилитации", "Работа с когнитивными нарушениями"]'),
                               ('Детская неврология для практикующих врачей', 'Особенности диагностики и лечения', '7 модулей по педиатрической неврологии', 'Специализированный курс, посвященный особенностям неврологических заболеваний у детей. Рассматриваются возрастные особенности, методы диагностики и современные подходы к лечению.', 28000, 3500, '14 недель', 7, 28, $4, 'advanced', 'hard', 98, 4.9, 18, true, false, true, 'https://images.unsplash.com/photo-1532938911079-9b136c5c8c5a?w=600&h=400&fit=crop', 'https://example.com/video4', true, 'premium', true, NOW(), '["Диагностика неврологических нарушений у детей", "Возрастные особенности развития", "Современные методы лечения", "Работа с родителями"]'),
                ('Основы нейрофизиологии', 'Для начинающих специалистов', '3 модуля по основам нейрофизиологии', 'Базовый курс по нейрофизиологии, предназначенный для начинающих врачей и студентов медицинских вузов. Рассматриваются основы функционирования нервной системы, методы исследования и основные патологические состояния.', 12000, 1500, '6 недель', 3, 12, $1, 'beginner', 'easy', 345, 4.5, 45, false, true, false, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&h=400&fit=crop', 'https://example.com/video5', true, 'free', true, NOW(), '["Понимание основ нейрофизиологии", "Методы исследования нервной системы", "Диагностика базовых нарушений", "Основы лечения"]')
            `, [
                categoryMap['Мануальные техники'],
                categoryMap['Неврология'], 
                categoryMap['Реабилитация'],
                categoryMap['Педиатрия']
            ]);
        }

        // Демо-подкасты
        const { rows: podcastCount } = await pool.query('SELECT COUNT(*) FROM podcasts');
        if (parseInt(podcastCount[0].count) === 0) {
            console.log('🎧 Добавляем демо-подкасты...');
            
            const { rows: podcastCategories } = await pool.query('SELECT id, name FROM categories WHERE type = $1', ['podcasts']);
            const podcastCategoryMap = {};
            podcastCategories.forEach(cat => {
                podcastCategoryMap[cat.name] = cat.id;
            });

            await pool.query(`
                INSERT INTO podcasts (title, description, full_description, duration, duration_seconds, category_id, listens, image_url, audio_url, transcript, show_notes, episode_number, season_number, is_published, published_at) VALUES
                ('АНБ FM: Современная неврология', 'Обсуждение новых тенденций в неврологии', 'В этом выпуске мы обсуждаем последние тенденции в современной неврологии, новые методы диагностики и лечения. Наши эксперты делятся клиническим опытом и отвечают на вопросы слушателей.', '45:20', 2720, $1, 2345, 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=400&fit=crop', 'https://example.com/audio1', 'Полная расшифровка подкаста...', 'Подробные заметки к выпуску...', 1, 1, true, NOW()),
                ('Мануальная терапия: мифы и реальность', 'Разбор популярных заблуждений', 'Разбираем популярные мифы и заблуждения, связанные с мануальной терапией. Обсуждаем научно обоснованные методы и противопоказания.', '38:15', 2295, $2, 1876, 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd61b?w=600&h=400&fit=crop', 'https://example.com/audio2', 'Полная расшифровка подкаста...', 'Подробные заметки к выпуску...', 2, 1, true, NOW()),
                ('Интервью с профессором Петровой', 'О реабилитации после инсульта', 'Эксклюзивное интервью с профессором Петровой о современных подходах к реабилитации пациентов после инсульта. Обсуждаем новые методики и клинические случаи.', '52:30', 3150, $3, 1567, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop', 'https://example.com/audio3', 'Полная расшифровка подкаста...', 'Подробные заметки к выпуску...', 1, 2, true, NOW())
            `, [
                podcastCategoryMap['Неврология'],
                podcastCategoryMap['Мануальные техники'],
                podcastCategoryMap['Интервью']
            ]);
        }

        // Демо-стримы
        const { rows: streamCount } = await pool.query('SELECT COUNT(*) FROM streams');
        if (parseInt(streamCount[0].count) === 0) {
            console.log('📹 Добавляем демо-стримы...');
            
            const { rows: streamCategories } = await pool.query('SELECT id, name FROM categories WHERE type = $1', ['courses']);
            
            await pool.query(`
                INSERT INTO streams (title, description, full_description, duration, category_id, participants, max_participants, is_live, is_upcoming, scheduled_start, scheduled_end, thumbnail_url, video_url, chat_enabled, recording_available, requires_registration, is_active) VALUES
                ('Разбор сложного случая: боли в спине', 'Детальный разбор диагностики и лечения', 'Подробный разбор сложного клинического случая пациента с хроническими болями в спине. Обсуждение дифференциальной диагностики, методов лечения и реабилитации.', '1:25:00', $1, 89, 200, false, false, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '85 minutes', '/webapp/assets/stream-default.jpg', 'https://example.com/stream1', true, true, false, true),
                ('LIVE: Ответы на вопросы по мануальной терапии', 'Прямой эфир с ответами на вопросы', 'Прямой эфир с ведущим специалистом по мануальной терапии. Ответы на вопросы зрителей, разбор техник, демонстрация методик.', '2:15:00', $2, 156, 300, true, false, NOW(), NOW() + INTERVAL '135 minutes', '/webapp/assets/stream-default.jpg', 'https://example.com/stream2', true, false, true, true),
                ('Нейрохирургические операции: современные подходы', 'Обзор современных хирургических методик', 'Обзор современных подходов в нейрохирургии, демонстрация операционных техник, обсуждение показаний и противопоказаний.', '1:45:00', $1, 67, 150, false, true, NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '105 minutes', '/webapp/assets/stream-default.jpg', 'https://example.com/stream3', true, false, true, true)
            `, [
                streamCategories[0].id, // Неврология
                streamCategories[1].id  // Мануальные техники
            ]);
        }

        // Демо-видео
        const { rows: videoCount } = await pool.query('SELECT COUNT(*) FROM videos');
        if (parseInt(videoCount[0].count) === 0) {
            console.log('🎯 Добавляем демо-видео...');
            
            const { rows: videoCategories } = await pool.query('SELECT id, name FROM categories WHERE type = $1', ['videos']);

            await pool.query(`
                INSERT INTO videos (title, description, full_description, duration, duration_seconds, category_id, views, likes, dislikes, thumbnail_url, video_url, quality, is_published, published_at) VALUES
                ('Техника мобилизации шейного отдела', 'Практическая демонстрация техники', 'Подробная демонстрация техники мобилизации шейного отдела позвоночника. Показаны основные приемы, меры предосторожности и возможные ошибки.', '8:30', 510, $1, 567, 45, 2, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop', 'https://example.com/video5', 'hd', true, NOW()),
                ('Неврологический осмотр: основные приемы', 'Базовые приемы неврологического осмотра', 'Демонстрация базовых приемов неврологического осмотра: оценка черепно-мозговых нервов, моторных и сенсорных функций, координации и рефлексов.', '12:15', 735, $2, 892, 67, 1, 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop', 'https://example.com/video6', 'hd', true, NOW()),
                ('Эндоскопическая дискэктомия: этапы операции', 'Запись реальной операции', 'Полная запись операции эндоскопической дискэктомии с комментариями хирурга. Показаны все этапы операции и используемое оборудование.', '25:40', 1540, $3, 234, 23, 0, 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop', 'https://example.com/video7', 'hd', true, NOW())
            `, [
                videoCategories[1].id, // Мануальные техники
                videoCategories[0].id, // Неврология
                videoCategories[2].id  // Операции
            ]);
        }

        // Демо-материалы
        const { rows: materialCount } = await pool.query('SELECT COUNT(*) FROM materials');
        if (parseInt(materialCount[0].count) === 0) {
            console.log('📋 Добавляем демо-материалы...');
            
            const { rows: materialCategories } = await pool.query('SELECT id, name FROM categories WHERE type = $1', ['materials']);

            await pool.query(`
                INSERT INTO materials (title, description, full_description, category_id, material_type, file_url, file_size, file_type, pages, downloads, image_url, is_published, published_at) VALUES
                ('Чек-лист неврологического осмотра', 'Полный чек-лист для стандартного осмотра', 'Подробный чек-лист, содержащий все необходимые элементы стандартного неврологического осмотра. Включает оценку всех систем и функций.', $1, 'checklist', 'https://example.com/material1.pdf', 2048576, 'application/pdf', 12, 234, 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=400&fit=crop', true, NOW()),
                ('Протокол ведения пациентов с болями в спине', 'Стандартизированный протокол диагностики и лечения', 'Детальный протокол ведения пациентов с острыми и хроническими болями в спине. Включает алгоритмы диагностики, лечения и реабилитации.', $2, 'protocol', 'https://example.com/material2.pdf', 3072000, 'application/pdf', 18, 189, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop', true, NOW()),
                ('Мета-анализ эффективности мануальной терапии', 'Обзор современных исследований', 'Подробный мета-анализ современных исследований эффективности мануальной терапии при различных заболеваниях опорно-двигательного аппарата.', $3, 'research', 'https://example.com/material3.pdf', 5124096, 'application/pdf', 24, 156, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop', true, NOW())
            `, [
                materialCategories[0].id, // Чек-листы
                materialCategories[1].id, // Протоколы
                materialCategories[2].id  // Исследования
            ]);
        }

        // Демо-мероприятия
        const { rows: eventCount } = await pool.query('SELECT COUNT(*) FROM events');
        if (parseInt(eventCount[0].count) === 0) {
            console.log('🗺️ Добавляем демо-мероприятия...');
            
            const { rows: eventCategories } = await pool.query('SELECT id, name FROM categories WHERE type = $1', ['events']);

            await pool.query(`
                INSERT INTO events (title, description, full_description, event_type, event_date, event_end_date, location, online_url, max_participants, participants, price, image_url, registration_url, status, is_published, published_at) VALUES
                ('Конференция по современной неврологии', 'Ежегодная конференция с ведущими специалистами', 'Крупнейшая ежегодная конференция, посвященная современным достижениям в неврологии. Участие ведущих специалистов, разбор клинических случаев, мастер-классы.', 'offline', '2024-12-15 10:00:00', '2024-12-17 18:00:00', 'Москва, ул. Профессиональная, 15', 'https://example.com/online1', 250, 250, 5000, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop', 'https://example.com/register1', 'scheduled', true, NOW()),
                ('Онлайн-семинар по мануальной терапии', 'Практический семинар с разбором техник', 'Практический онлайн-семинар с детальным разбором современных мануальных техник. Демонстрации, практические задания, ответы на вопросы.', 'online', '2024-12-10 14:00:00', '2024-12-10 18:00:00', 'Онлайн', 'https://example.com/online2', 180, 156, 2000, 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop', 'https://example.com/register2', 'scheduled', true, NOW()),
                ('Воркшоп по реабилитации после инсульта', 'Практическое обучение современным методикам', 'Интенсивный практический воркшоп, посвященный современным методикам реабилитации пациентов после инсульта. Работа с оборудованием, разбор кейсов.', 'hybrid', '2024-11-20 09:00:00', '2024-11-21 17:00:00', 'Санкт-Петербург, ул. Медицинская, 8', 'https://example.com/online3', 100, 89, 7500, 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop', 'https://example.com/register3', 'scheduled', true, NOW())
            `, [
                eventCategories[0].id, // Конференции
                eventCategories[1].id, // Семинары
                eventCategories[2].id  // Воркшопы
            ]);
        }

        // Демо-новости
        const { rows: newsCount } = await pool.query('SELECT COUNT(*) FROM news');
        if (parseInt(newsCount[0].count) === 0) {
            console.log('📰 Добавляем демо-новости...');
            
            const { rows: newsCategories } = await pool.query('SELECT id, name FROM categories WHERE type = $1', ['news']);

            await pool.query(`
                INSERT INTO news (title, description, content, excerpt, date, publish_date, category_id, type, image_url, tags, is_published, published_at) VALUES
                ('Новые методики в реабилитации пациентов с инсультом', 'Обзор современных подходов к реабилитации пациентов с неврологическими нарушениями', 'Полный текст статьи о новых методиках реабилитации...', 'Краткое описание новых методик реабилитации...', '15 дек 2024', '2024-12-15 10:00:00', $1, 'Статья', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&h=400&fit=crop', '["реабилитация", "инсульт", "неврология"]', true, NOW()),
                ('Обновление курса по мануальной терапии', 'Добавлены новые модули по работе с шейным отделом позвоночника', 'Детали обновления курса по мануальной терапии...', 'Анонс новых модулей курса...', '12 дек 2024', '2024-12-12 14:00:00', $2, 'Обновление', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=600&h=400&fit=crop', '["курсы", "мануальная терапия", "обновление"]', true, NOW()),
                ('Исследование: эффективность новых нейропротекторов', 'Результаты клинических исследований новых препаратов', 'Подробные результаты исследований новых нейропротекторов...', 'Анонс результатов исследований...', '10 дек 2024', '2024-12-10 09:00:00', $3, 'Исследование', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&h=400&fit=crop', '["исследование", "нейропротекторы", "фармакология"]', true, NOW())
            `, [
                newsCategories[0].id, // Новости
                newsCategories[1].id, // Статьи
                newsCategories[2].id  // Обзоры
            ]);
        }

        // Демо-планы подписок
        const { rows: planCount } = await pool.query('SELECT COUNT(*) FROM subscription_plans');
        if (parseInt(planCount[0].count) === 0) {
            console.log('💰 Добавляем планы подписок...');
            await pool.query(`
                INSERT INTO subscription_plans (name, description, price_monthly, price_quarterly, price_yearly, features, max_courses, max_storage_mb, priority_support, certificate_included, is_active, is_popular, display_order) VALUES
                ('Базовый', 'Доступ к базовым курсам и материалам для начинающих специалистов', 2900, 7500, 27000, '["Доступ к 5 базовым курсам", "Просмотр вебинаров", "База материалов", "Поддержка по email", "Сертификаты о прохождении"]', 5, 1024, false, true, true, false, 1),
                ('Профессиональный', 'Полный доступ ко всем курсам для практикующих врачей', 5900, 15000, 54000, '["Все курсы Академии", "Прямые эфиры", "Закрытый чат", "Персональная поддержка", "Сертификаты", "Доступ к материалам", "Участие в вебинарах"]', 999, 5120, true, true, true, true, 2),
                ('Премиум', 'Максимальные возможности + персональное менторство для специалистов', 9900, 27000, 99000, '["Все курсы + будущие", "Личное менторство", "Разбор кейсов", "Участие в воркшопах", "Премиум-поддержка", "Персональный куратор", "Ранний доступ к новым курсам", "Индивидуальные консультации"]', 999, 10240, true, true, true, false, 3)
            `);
        }

        // Демо-навигация
        const { rows: navCount } = await pool.query('SELECT COUNT(*) FROM navigation_items');
        if (parseInt(navCount[0].count) === 0) {
            console.log('🧭 Добавляем демо-навигацию...');
            await pool.query(`
                INSERT INTO navigation_items (title, description, icon, image_url, page, position, is_active, required_subscription, required_role) VALUES
                ('Курсы', 'Доступные курсы и обучение', '📚', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop', 'courses', 1, true, false, 'user'),
                ('Подкасты', 'Аудио подкасты и лекции', '🎧', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=200&fit=crop', 'podcasts', 2, true, false, 'user'),
                ('Эфиры', 'Прямые эфиры и разборы', '📹', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=200&fit=crop', 'streams', 3, true, true, 'user'),
                ('Видео', 'Короткие обучающие видео', '🎯', 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=200&fit=crop', 'videos', 4, true, false, 'user'),
                ('Материалы', 'Чек-листы и протоколы', '📋', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=200&fit=crop', 'materials', 5, true, true, 'user'),
                ('Мероприятия', 'Онлайн и офлайн события', '🗺️', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop', 'events', 6, true, false, 'user'),
                ('Сообщество', 'Правила и ценности', '👥', 'https://images.unsplash.com/photo-1551836026-d5c55ac5d4c5?w=400&h=200&fit=crop', 'community', 7, true, false, 'user'),
                ('Избранное', 'Сохраненные материалы', '❤️', 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400&h=200&fit=crop', 'favorites', 8, true, false, 'user'),
                ('Админ-панель', 'Управление контентом', '🔧', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop', 'admin', 9, true, false, 'admin')
            `);
        }

        // Привязка преподавателей к курсам
        const { rows: existingLinks } = await pool.query('SELECT COUNT(*) FROM content_instructors');
        if (parseInt(existingLinks[0].count) === 0) {
            console.log('🔗 Привязываем преподавателей к курсам...');
            
            // Получаем ID преподавателей и курсов
            const { rows: instructors } = await pool.query('SELECT id, name FROM instructors ORDER BY id');
            const { rows: courses } = await pool.query('SELECT id, title FROM courses ORDER BY id');
            
            await pool.query(`
                INSERT INTO content_instructors (content_id, content_type, instructor_id, role, is_primary) VALUES
                ($1, 'courses', $2, 'автор и ведущий', true),
                ($1, 'courses', $3, 'соавтор', false),
                ($4, 'courses', $5, 'ведущий', true),
                ($6, 'courses', $2, 'ведущий', true),
                ($7, 'courses', $8, 'автор', true),
                ($9, 'courses', $8, 'ведущий', true)
            `, [
                courses[0].id, instructors[0].id, instructors[1].id, // Курс 1
                courses[1].id, instructors[2].id,                    // Курс 2  
                courses[2].id, instructors[0].id,                    // Курс 3
                courses[3].id, instructors[3].id,                    // Курс 4
                courses[4].id, instructors[4].id                     // Курс 5
            ]);
        }

        // Демо-достижения
        const { rows: achievementCount } = await pool.query('SELECT COUNT(*) FROM achievements');
        if (parseInt(achievementCount[0].count) === 0) {
            console.log('🏆 Добавляем демо-достижения...');
            await pool.query(`
                INSERT INTO achievements (name, description, icon, type, condition_type, condition_value, points_reward, is_active) VALUES
                ('Первый шаг', 'Завершите первый курс', '🎯', 'learning', 'courses_completed', 1, 100, true),
                ('Усердный студент', 'Завершите 5 курсов', '📚', 'learning', 'courses_completed', 5, 500, true),
                ('Эксперт', 'Завершите 10 курсов', '🏆', 'learning', 'courses_completed', 10, 1000, true),
                ('Мастер обучения', 'Потратьте 100 часов на обучение', '⏰', 'time', 'study_hours', 100, 800, true),
                ('Социальная активность', 'Оставьте 10 комментариев', '💬', 'social', 'comments_count', 10, 300, true),
                ('Помощник', 'Помогите 5 раз другим студентам', '🤝', 'social', 'helpful_answers', 5, 400, true)
            `);
        }

    } catch (error) {
        console.error('❌ Ошибка добавления демо-данных:', error);
    }
}

// ==================== TELEGRAM BOT ====================

function setupBot() {
    if (!bot) {
        console.log('🤖 Бот не настроен');
        return;
    }

    const stopBot = () => {
        console.log('🛑 Остановка бота...');
        if (bot) {
            bot.stop();
        }
    };

    process.once('SIGINT', stopBot);
    process.once('SIGTERM', stopBot);

    bot.use(session());

    // Команда /start
    bot.start(async (ctx) => {
        const userId = ctx.from.id;
        const userName = ctx.from.first_name;
        
        try {
            const { rows: existingUser } = await pool.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [userId]
            );
            
            if (existingUser.length === 0) {
                await pool.query(
                    `INSERT INTO users (telegram_id, first_name, username, is_admin, is_super_admin) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [userId, userName, ctx.from.username, 
                     userId == process.env.SUPER_ADMIN_ID, 
                     userId == process.env.SUPER_ADMIN_ID]
                );
                console.log(`✅ Создан новый пользователь: ${userName}`);
            } else {
                await pool.query(
                    `UPDATE users SET first_name = $1, username = $2 WHERE telegram_id = $3`,
                    [userName, ctx.from.username, userId]
                );
                console.log(`✅ Обновлен пользователь: ${userName}`);
            }

            const welcomeText = `👋 Добро пожаловать в Академию АНБ, ${userName}!

🎓 Академия АНБ - это платформа для непрерывного медицинского образования, где вы найдете:

📚 Курсы от ведущих специалистов
🎧 Подкасты и лекции
📹 Прямые эфиры и разборы случаев
📋 Практические материалы
🗺️ Мероприятия и конференции

Используйте кнопки ниже для навигации:`;

            await ctx.reply(welcomeText, {
                reply_markup: {
                    keyboard: [
                        ['📱 Открыть Академию', '📚 Все курсы'],
                        ['🎧 АНБ FM', '📹 Эфиры и разборы'],
                        ['👤 Мой профиль', '🆘 Поддержка'],
                        ['🔧 Админ-панель']
                    ],
                    resize_keyboard: true
                }
            });

        } catch (error) {
            console.error('Ошибка при старте бота:', error);
            await ctx.reply(`👋 Привет, ${userName}! Добро пожаловать в Академию АНБ! 🎓`);
        }
    });

    // Обработка текстовых сообщений
    bot.on('text', async (ctx) => {
        const text = ctx.message.text;
        const userId = ctx.from.id;
        
        try {
            const { rows: users } = await pool.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [userId]
            );
            const user = users[0];
            
            switch(text) {
                case '📱 Открыть Академию':
                    await ctx.reply('Открываю Академию АНБ...', {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '🚀 Открыть Академию',
                                web_app: { url: process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/` }
                            }]]
                        }
                    });
                    break;
                    
                case '📚 Все курсы':
                    const { rows: courses } = await pool.query(
                        'SELECT title, description, price FROM courses WHERE is_published = true ORDER BY created_at DESC LIMIT 3'
                    );
                    
                    let coursesText = '📚 *Последние курсы:*\n\n';
                    courses.forEach((course, index) => {
                        coursesText += `${index + 1}. *${course.title}*\n`;
                        coursesText += `💵 ${course.price} руб.\n`;
                        coursesText += `📖 ${course.description}\n\n`;
                    });
                    
                    coursesText += '[Посмотреть все курсы](' + (process.env.WEBAPP_URL || `http://localhost:${PORT}`) + '/webapp/#courses)';
                    
                    await ctx.reply(coursesText, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '📚 Все курсы',
                                web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/webapp/#courses` }
                            }]]
                        }
                    });
                    break;
                    
                case '🎧 АНБ FM':
                    await ctx.reply('🎧 *АНБ FM - подкасты для врачей*\n\nСлушайте последние выпуски нашего подкаста с ведущими специалистами в области неврологии и мануальной терапии.', {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '🎧 Слушать подкасты',
                                web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/webapp/#podcasts` }
                            }]]
                        }
                    });
                    break;
                    
                case '👤 Мой профиль':
                    const { rows: progress } = await pool.query(
                        'SELECT * FROM user_progress WHERE user_id = $1',
                        [user.id]
                    );
                    
                    let profileText = `👤 *Ваш профиль*\n\n`;
                    profileText += `📛 Имя: ${user.first_name}\n`;
                    if (user.username) profileText += `🔗 @${user.username}\n`;
                    if (progress.length > 0) {
                        profileText += `🎯 Уровень: ${progress[0].level}\n`;
                        profileText += `⭐ Опыт: ${progress[0].experience}\n`;
                        profileText += `📚 Завершено курсов: ${progress[0].courses_completed}\n`;
                    }
                    
                    await ctx.reply(profileText, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '👤 Открыть профиль',
                                web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/webapp/#profile` }
                            }]]
                        }
                    });
                    break;
                    
                case '🔧 Админ-панель':
                    if (user && (user.is_admin || user.is_super_admin)) {
                        await ctx.reply('🔧 *Админ-панель*\n\nУправление контентом, пользователями и настройками платформы.', {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[{
                                    text: '🔧 Открыть админ-панель',
                                    web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/admin/` }
                                }]]
                            }
                        });
                    } else {
                        await ctx.reply('❌ У вас нет доступа к админ-панели');
                    }
                    break;
                    
                case '🆘 Поддержка':
                    await ctx.reply(`🆘 *Поддержка Академии АНБ*\n\nЕсли у вас возникли вопросы или проблемы:\n\n💬 Чат поддержки: @anb_support\n📧 Email: support@anb.ru\n🌐 Сайт: academy-anb.ru\n\nМы ответим в течение 24 часов.`, {
                        parse_mode: 'Markdown'
                    });
                    break;
                    
                default:
                    await ctx.reply('Используйте кнопки меню для навигации по Академии 🎓\n\nИли напишите /menu для открытия меню.');
            }
        } catch (error) {
            console.error('Ошибка обработки сообщения:', error);
            await ctx.reply('Произошла ошибка. Попробуйте еще раз.');
        }
    });

    // Команда /menu
    bot.command('menu', (ctx) => {
        ctx.reply('🎛️ *Главное меню Академии АНБ:*', {
            parse_mode: 'Markdown',
            reply_markup: {
                keyboard: [
                    ['📱 Открыть Академию', '📚 Все курсы'],
                    ['🎧 АНБ FM', '📹 Эфиры и разборы'],
                    ['👤 Мой профиль', '🆘 Поддержка'],
                    ['🔧 Админ-панель']
                ],
                resize_keyboard: true
            }
        });
    });

    // Команда /courses
    bot.command('courses', async (ctx) => {
        try {
            const { rows: courses } = await pool.query(
                'SELECT title, price, students_count, rating FROM courses WHERE is_published = true ORDER BY rating DESC LIMIT 5'
            );
            
            let coursesText = '🏆 *Топ-5 курсов по рейтингу:*\n\n';
            courses.forEach((course, index) => {
                coursesText += `${index + 1}. *${course.title}*\n`;
                coursesText += `⭐ Рейтинг: ${course.rating}/5\n`;
                coursesText += `👥 Студентов: ${course.students_count}\n`;
                coursesText += `💵 ${course.price} руб.\n\n`;
            });
            
            await ctx.reply(coursesText, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{
                        text: '📚 Смотреть все курсы',
                        web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/webapp/#courses` }
                    }]]
                }
            });
        } catch (error) {
            console.error('Ошибка получения курсов:', error);
            await ctx.reply('❌ Ошибка загрузки курсов');
        }
    });

    // Команда /admin
    bot.command('admin', async (ctx) => {
        const userId = ctx.from.id;
        
        try {
            const { rows: users } = await pool.query(
                'SELECT * FROM users WHERE telegram_id = $1',
                [userId]
            );
            const user = users[0];
            
            if (user && (user.is_admin || user.is_super_admin)) {
                const { rows: stats } = await pool.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM users) as total_users,
                        (SELECT COUNT(*) FROM courses) as total_courses,
                        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions
                `);
                
                const statsText = `📊 *Статистика платформы:*\n\n`;
                statsText += `👥 Пользователей: ${stats[0].total_users}\n`;
                statsText += `📚 Курсов: ${stats[0].total_courses}\n`;
                statsText += `💳 Активных подписок: ${stats[0].active_subscriptions}\n`;
                
                await ctx.reply(statsText, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '🔧 Открыть админ-панель',
                            web_app: { url: `${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/admin/` }
                        }]]
                    }
                });
            } else {
                await ctx.reply('❌ У вас нет доступа к админ-панели');
            }
        } catch (error) {
            console.error('Ошибка проверки прав админа:', error);
            await ctx.reply('❌ Ошибка проверки доступа');
        }
    });

    // Обработка callback-запросов
    bot.on('callback_query', async (ctx) => {
        await ctx.answerCbQuery();
        const data = ctx.callbackQuery.data;
        
        switch(data) {
            case 'open_webapp':
                await ctx.reply('Открываю Академию...', {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '🚀 Открыть Академию',
                            web_app: { url: process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/` }
                        }]]
                    }
                });
                break;
        }
    });

    // Запуск бота
    bot.launch().then(() => {
        console.log('✅ Telegram Bot запущен');
    }).catch(error => {
        console.error('❌ Ошибка запуска бота:', error.message);
        
        if (error.message.includes('409') || error.message.includes('Conflict')) {
            console.log('🔄 Перезапуск бота через 10 секунд...');
            setTimeout(() => {
                setupBot();
            }, 10000);
        }
    });
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'ANB Academy API',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Database health check
app.get('/api/db-health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time');
        res.json({ 
            success: true, 
            database: 'connected',
            time: result.rows[0].time 
        });
    } catch (error) {
        res.status(503).json({ 
            success: false, 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// ==================== АУТЕНТИФИКАЦИЯ И ПОЛЬЗОВАТЕЛИ ====================

// Регистрация пользователя
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, specialization } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email и пароль обязательны' });
        }

        // Проверяем, существует ли пользователь
        const { rows: existingUsers } = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, error: 'Пользователь с таким email уже существует' });
        }

        // Хешируем пароль
        const passwordHash = await bcrypt.hash(password, 12);
        const emailVerificationToken = uuidv4();

        // Создаем пользователя
        const { rows: newUser } = await pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone, specialization, email_verification_token) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, email, first_name, last_name, is_admin, is_super_admin, is_verified`,
            [email, passwordHash, firstName, lastName, phone, specialization, emailVerificationToken]
        );

        // Создаем прогресс пользователя
        await pool.query(
            `INSERT INTO user_progress (user_id) VALUES ($1)`,
            [newUser[0].id]
        );

        // Генерируем JWT токен
        const token = jwt.sign(
            { 
                userId: newUser[0].id,
                email: newUser[0].email,
                isAdmin: newUser[0].is_admin,
                isSuperAdmin: newUser[0].is_super_admin
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // TODO: Отправить email для верификации

        res.status(201).json({
            success: true,
            message: 'Пользователь успешно зарегистрирован',
            user: newUser[0],
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Ошибка регистрации' });
    }
});

// Вход пользователя
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email и пароль обязательны' });
        }

        // Ищем пользователя
        const { rows: users } = await pool.query(
            `SELECT id, email, password_hash, first_name, last_name, is_admin, is_super_admin, is_verified, is_active 
             FROM users WHERE email = $1`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, error: 'Неверный email или пароль' });
        }

        const user = users[0];

        // Проверяем активность аккаунта
        if (!user.is_active) {
            return res.status(403).json({ success: false, error: 'Аккаунт деактивирован' });
        }

        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, error: 'Неверный email или пароль' });
        }

        // Обновляем информацию о входе
        await pool.query(
            'UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = $1',
            [user.id]
        );

        // Генерируем JWT токен
        const token = jwt.sign(
            { 
                userId: user.id,
                email: user.email,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                isVerified: user.is_verified
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Ошибка входа' });
    }
});

// Получение профиля пользователя
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { rows: users } = await pool.query(`
            SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.specialization, 
                   u.city, u.country, u.bio, u.avatar_url, u.is_admin, u.is_super_admin,
                   u.is_verified, u.subscription_end, u.created_at,
                   up.level, up.experience, up.points, up.courses_completed, up.modules_completed,
                   up.materials_watched, up.events_attended, up.total_study_time, up.streak_days
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE u.id = $1
        `, [req.user.userId]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }

        const user = users[0];

        // Получаем активную подписку
        const { rows: subscriptions } = await pool.query(`
            SELECT s.*, sp.name as plan_name 
            FROM subscriptions s
            LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
            WHERE s.user_id = $1 AND s.status = 'active' AND s.ends_at > NOW()
            ORDER BY s.created_at DESC
            LIMIT 1
        `, [req.user.userId]);

        // Получаем достижения
        const { rows: achievements } = await pool.query(`
            SELECT a.*, ua.unlocked_at
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1
            ORDER BY ua.unlocked_at DESC
        `, [req.user.userId]);

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                specialization: user.specialization,
                city: user.city,
                country: user.country,
                bio: user.bio,
                avatarUrl: user.avatar_url,
                isAdmin: user.is_admin,
                isSuperAdmin: user.is_super_admin,
                isVerified: user.is_verified,
                subscriptionEnd: user.subscription_end,
                createdAt: user.created_at,
                progress: {
                    level: user.level,
                    experience: user.experience,
                    points: user.points,
                    coursesCompleted: user.courses_completed,
                    modulesCompleted: user.modules_completed,
                    materialsWatched: user.materials_watched,
                    eventsAttended: user.events_attended,
                    totalStudyTime: user.total_study_time,
                    streakDays: user.streak_days
                },
                subscription: subscriptions.length > 0 ? subscriptions[0] : null,
                achievements: achievements
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки профиля' });
    }
});

// Обновление профиля пользователя
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, phone, specialization, city, country, bio } = req.body;
        
        const { rows: updatedUser } = await pool.query(`
            UPDATE users 
            SET first_name = $1, last_name = $2, phone = $3, specialization = $4, 
                city = $5, country = $6, bio = $7, updated_at = NOW()
            WHERE id = $8
            RETURNING id, first_name, last_name, phone, specialization, city, country, bio, avatar_url
        `, [firstName, lastName, phone, specialization, city, country, bio, req.user.userId]);

        res.json({
            success: true,
            message: 'Профиль успешно обновлен',
            user: updatedUser[0]
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления профиля' });
    }
});

// ==================== API ДЛЯ КОНТЕНТА ====================

// Получение всего контента с пагинацией
app.get('/api/content/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { page = 1, limit = 12, category, level, sort = 'newest' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const validTypes = ['courses', 'podcasts', 'videos', 'materials', 'streams', 'events', 'news'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, error: 'Неверный тип контента' });
        }

        let query = `SELECT * FROM ${type} WHERE is_published = true`;
        let countQuery = `SELECT COUNT(*) FROM ${type} WHERE is_published = true`;
        const queryParams = [];
        let paramCount = 0;

        // Фильтрация по категории
        if (category && category !== 'all') {
            paramCount++;
            query += ` AND category_id = $${paramCount}`;
            countQuery += ` AND category_id = $${paramCount}`;
            queryParams.push(parseInt(category));
        }

        // Фильтрация по уровню (для курсов)
        if (level && level !== 'all' && type === 'courses') {
            paramCount++;
            query += ` AND level = $${paramCount}`;
            countQuery += ` AND level = $${paramCount}`;
            queryParams.push(level);
        }

        // Сортировка
        switch(sort) {
            case 'price_asc':
                if (type === 'courses') query += ' ORDER BY price ASC';
                break;
            case 'price_desc':
                if (type === 'courses') query += ' ORDER BY price DESC';
                break;
            case 'popular':
                if (type === 'courses') query += ' ORDER BY students_count DESC';
                else if (type === 'podcasts') query += ' ORDER BY listens DESC';
                else if (type === 'videos') query += ' ORDER BY views DESC';
                else if (type === 'materials') query += ' ORDER BY downloads DESC';
                else query += ' ORDER BY created_at DESC';
                break;
            case 'rating':
                if (type === 'courses') query += ' ORDER BY rating DESC';
                else query += ' ORDER BY created_at DESC';
                break;
            case 'newest':
            default:
                query += ' ORDER BY created_at DESC';
                break;
        }

        // Пагинация
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(parseInt(limit), offset);

        const [contentResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        // Получаем категории для каждого элемента
        const contentWithCategories = await Promise.all(
            contentResult.rows.map(async (item) => {
                if (item.category_id) {
                    const { rows: category } = await pool.query(
                        'SELECT name, icon, color FROM categories WHERE id = $1',
                        [item.category_id]
                    );
                    return {
                        ...item,
                        category: category[0] || null
                    };
                }
                return item;
            })
        );

        res.json({
            success: true,
            data: contentWithCategories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error(`Content API error (${type}):`, error);
        res.status(500).json({ success: false, error: `Ошибка загрузки ${type}` });
    }
});

// Получение детальной информации о курсе
app.get('/api/courses/:id/detailed', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Получаем курс
        const { rows: courses } = await pool.query(`
            SELECT c.*, cat.name as category_name, cat.icon as category_icon, cat.color as category_color
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = $1 AND c.is_published = true
        `, [id]);

        if (courses.length === 0) {
            return res.status(404).json({ success: false, error: 'Курс не найден' });
        }

        const course = courses[0];

        // Получаем преподавателей
        const { rows: instructors } = await pool.query(`
            SELECT i.*, ci.role, ci.is_primary
            FROM instructors i
            JOIN content_instructors ci ON i.id = ci.instructor_id
            WHERE ci.content_id = $1 AND ci.content_type = 'courses'
            ORDER BY ci.is_primary DESC
        `, [id]);

        // Получаем модули
        const { rows: modules } = await pool.query(`
            SELECT cm.*,
                   (SELECT COUNT(*) FROM module_lessons WHERE module_id = cm.id AND is_active = true) as lessons_count
            FROM course_modules cm
            WHERE cm.course_id = $1 AND cm.is_active = true
            ORDER BY cm.order_index
        `, [id]);

        // Получаем отзывы
        const { rows: reviews } = await pool.query(`
            SELECT cr.*, u.first_name, u.last_name, u.avatar_url
            FROM course_reviews cr
            JOIN users u ON cr.user_id = u.id
            WHERE cr.course_id = $1 AND cr.is_approved = true
            ORDER BY cr.created_at DESC
            LIMIT 10
        `, [id]);

        // Статистика отзывов
        const { rows: reviewStats } = await pool.query(`
            SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
                COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
                COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
                COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
                COUNT(CASE WHEN rating = 1 THEN 1 END) as one_stars
            FROM course_reviews 
            WHERE course_id = $1 AND is_approved = true
        `, [id]);

        res.json({
            success: true,
            data: {
                ...course,
                instructors: instructors,
                modules: modules,
                reviews: reviews,
                reviewStats: reviewStats[0] || {
                    total_reviews: 0,
                    average_rating: 0,
                    five_stars: 0,
                    four_stars: 0,
                    three_stars: 0,
                    two_stars: 0,
                    one_stars: 0
                }
            }
        });
    } catch (error) {
        console.error('Course detail error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки курса' });
    }
});

// ==================== КАТЕГОРИИ API ====================

// Получение категорий по типу
app.get('/api/categories/:type', async (req, res) => {
    try {
        const { type } = req.params;
        
        const { rows: categories } = await pool.query(`
            SELECT * FROM categories 
            WHERE type = $1 AND is_active = true 
            ORDER BY sort_order, name
        `, [type]);
        
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Categories API error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки категорий' });
    }
});

// ==================== ИЗБРАННОЕ API ====================

// Добавление/удаление из избранного
app.post('/api/favorites/toggle', authenticateToken, async (req, res) => {
    try {
        const { contentId, contentType } = req.body;
        const userId = req.user.userId;

        const validTypes = ['courses', 'podcasts', 'videos', 'materials', 'streams', 'events', 'news'];
        if (!validTypes.includes(contentType)) {
            return res.status(400).json({ success: false, error: 'Неверный тип контента' });
        }

        // Проверяем существование контента
        const { rows: content } = await pool.query(
            `SELECT id FROM ${contentType} WHERE id = $1 AND is_published = true`,
            [contentId]
        );

        if (content.length === 0) {
            return res.status(404).json({ success: false, error: 'Контент не найден' });
        }

        // Проверяем, есть ли уже в избранном
        const { rows: existing } = await pool.query(
            'SELECT id FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
            [userId, contentId, contentType]
        );

        if (existing.length > 0) {
            // Удаляем из избранного
            await pool.query(
                'DELETE FROM favorites WHERE user_id = $1 AND content_id = $2 AND content_type = $3',
                [userId, contentId, contentType]
            );
            res.json({ success: true, action: 'removed', message: 'Удалено из избранного' });
        } else {
            // Добавляем в избранное
            await pool.query(
                'INSERT INTO favorites (user_id, content_id, content_type) VALUES ($1, $2, $3)',
                [userId, contentId, contentType]
            );
            res.json({ success: true, action: 'added', message: 'Добавлено в избранное' });
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ success: false, error: 'Ошибка обновления избранного' });
    }
});

// Получение избранного пользователя
app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const { rows: favorites } = await pool.query(`
            SELECT f.*, 
                   CASE 
                     WHEN f.content_type = 'courses' THEN c.title
                     WHEN f.content_type = 'podcasts' THEN p.title
                     WHEN f.content_type = 'videos' THEN v.title
                     WHEN f.content_type = 'materials' THEN m.title
                     WHEN f.content_type = 'streams' THEN s.title
                     WHEN f.content_type = 'events' THEN e.title
                     WHEN f.content_type = 'news' THEN n.title
                   END as content_title,
                   CASE 
                     WHEN f.content_type = 'courses' THEN c.image_url
                     WHEN f.content_type = 'podcasts' THEN p.image_url
                     WHEN f.content_type = 'videos' THEN v.thumbnail_url
                     WHEN f.content_type = 'materials' THEN m.image_url
                     WHEN f.content_type = 'streams' THEN s.thumbnail_url
                     WHEN f.content_type = 'events' THEN e.image_url
                     WHEN f.content_type = 'news' THEN n.image_url
                   END as content_image,
                   CASE 
                     WHEN f.content_type = 'courses' THEN c.description
                     WHEN f.content_type = 'podcasts' THEN p.description
                     WHEN f.content_type = 'videos' THEN v.description
                     WHEN f.content_type = 'materials' THEN m.description
                     WHEN f.content_type = 'streams' THEN s.description
                     WHEN f.content_type = 'events' THEN e.description
                     WHEN f.content_type = 'news' THEN n.description
                   END as content_description
            FROM favorites f
            LEFT JOIN courses c ON f.content_type = 'courses' AND f.content_id = c.id
            LEFT JOIN podcasts p ON f.content_type = 'podcasts' AND f.content_id = p.id
            LEFT JOIN videos v ON f.content_type = 'videos' AND f.content_id = v.id
            LEFT JOIN materials m ON f.content_type = 'materials' AND f.content_id = m.id
            LEFT JOIN streams s ON f.content_type = 'streams' AND f.content_id = s.id
            LEFT JOIN events e ON f.content_type = 'events' AND f.content_id = e.id
            LEFT JOIN news n ON f.content_type = 'news' AND f.content_id = n.id
            WHERE f.user_id = $1
            ORDER BY f.created_at DESC
        `, [userId]);

        // Группируем по типам
        const groupedFavorites = favorites.reduce((acc, favorite) => {
            if (!acc[favorite.content_type]) {
                acc[favorite.content_type] = [];
            }
            acc[favorite.content_type].push(favorite);
            return acc;
        }, {});

        res.json({ success: true, data: groupedFavorites });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки избранного' });
    }
});

// ==================== ПОДПИСКИ И ПЛАТЕЖИ ====================

// Получение планов подписок
app.get('/api/subscription/plans', async (req, res) => {
    try {
        const { rows: plans } = await pool.query(`
            SELECT * FROM subscription_plans 
            WHERE is_active = true 
            ORDER BY display_order, price_monthly
        `);
        
        res.json({ success: true, data: plans });
    } catch (error) {
        console.error('Subscription plans error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки планов подписки' });
    }
});

// Создание подписки (демо-режим)
app.post('/api/subscription/create', authenticateToken, async (req, res) => {
    try {
        const { planId, planType } = req.body;
        const userId = req.user.userId;

        // Получаем план
        const { rows: plans } = await pool.query(
            'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
            [planId]
        );

        if (plans.length === 0) {
            return res.status(404).json({ success: false, error: 'План подписки не найден' });
        }

        const plan = plans[0];
        const priceField = `price_${planType}`;
        const price = plan[priceField];

        if (!price) {
            return res.status(400).json({ success: false, error: 'Неверный тип подписки' });
        }

        // Рассчитываем даты
        const startsAt = new Date();
        const endsAt = new Date();
        
        switch (planType) {
            case 'monthly':
                endsAt.setMonth(endsAt.getMonth() + 1);
                break;
            case 'quarterly':
                endsAt.setMonth(endsAt.getMonth() + 3);
                break;
            case 'yearly':
                endsAt.setFullYear(endsAt.getFullYear() + 1);
                break;
            default:
                return res.status(400).json({ success: false, error: 'Неверный тип подписки' });
        }

        // Создаем подписку
        const { rows: subscription } = await pool.query(`
            INSERT INTO subscriptions (user_id, plan_id, plan_type, price, status, starts_at, ends_at, payment_data)
            VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
            RETURNING *
        `, [userId, planId, planType, price, startsAt, endsAt, { 
            demo: true, 
            method: 'demo_payment',
            gateway: 'demo'
        }]);

        // Создаем транзакцию
        await pool.query(`
            INSERT INTO payment_transactions (user_id, subscription_id, amount, status, payment_method, description)
            VALUES ($1, $2, $3, 'completed', 'demo', $4)
        `, [userId, subscription[0].id, price, `Демо-платеж за подписку ${plan.name}`]);

        // Обновляем пользователя
        await pool.query(
            'UPDATE users SET subscription_end = $1 WHERE id = $2',
            [endsAt, userId]
        );

        res.json({
            success: true,
            message: 'Подписка успешно активирована (демо-режим)',
            data: subscription[0]
        });

    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ success: false, error: 'Ошибка создания подписки' });
    }
});

// ==================== АДМИН API ====================

// Получение статистики для админ-панели
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [
            userCount,
            courseCount,
            podcastCount,
            videoCount,
            materialCount,
            eventCount,
            newsCount,
            activeSubscriptions,
            totalRevenue
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM users'),
            pool.query('SELECT COUNT(*) FROM courses'),
            pool.query('SELECT COUNT(*) FROM podcasts'),
            pool.query('SELECT COUNT(*) FROM videos'),
            pool.query('SELECT COUNT(*) FROM materials'),
            pool.query('SELECT COUNT(*) FROM events'),
            pool.query('SELECT COUNT(*) FROM news'),
            pool.query('SELECT COUNT(*) FROM subscriptions WHERE status = \"active\" AND ends_at > NOW()'),
            pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = \"completed\"')
        ]);

        const stats = {
            totalUsers: parseInt(userCount.rows[0].count),
            totalCourses: parseInt(courseCount.rows[0].count),
            totalPodcasts: parseInt(podcastCount.rows[0].count),
            totalVideos: parseInt(videoCount.rows[0].count),
            totalMaterials: parseInt(materialCount.rows[0].count),
            totalEvents: parseInt(eventCount.rows[0].count),
            totalNews: parseInt(newsCount.rows[0].count),
            activeSubscriptions: parseInt(activeSubscriptions.rows[0].count),
            totalRevenue: parseFloat(totalRevenue.rows[0].total)
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки статистики' });
    }
});

// Получение пользователей для админ-панели
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.username, u.telegram_id,
                   u.is_admin, u.is_super_admin, u.is_verified, u.subscription_end,
                   u.created_at, u.last_login,
                   up.level, up.experience, up.courses_completed
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) FROM users u WHERE 1=1';
        const queryParams = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (u.email ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`;
            countQuery += ` AND (u.email ILIKE $${paramCount} OR u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount})`;
            queryParams.push(`%${search}%`);
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        queryParams.push(parseInt(limit), offset);

        const [usersResult, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, queryParams.slice(0, -2))
        ]);

        res.json({
            success: true,
            data: usersResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки пользователей' });
    }
});

// ==================== ЗАГРУЗКА ФАЙЛОВ ====================

// Загрузка файлов
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Файл не загружен' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        
        const { rows } = await pool.query(
            'INSERT INTO media_files (filename, original_name, mime_type, size, url, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, fileUrl, req.user.userId]
        );

        res.json({ 
            success: true, 
            file: rows[0],
            url: fileUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки файла' });
    }
});

// ==================== НАВИГАЦИЯ API ====================

// Получение навигации
app.get('/api/navigation', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT * FROM navigation_items 
            WHERE is_active = true 
            ORDER BY position ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Navigation API error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки навигации' });
    }
});

// ==================== SPA FALLBACK ====================

// WebApp
app.get('/webapp', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.get('/webapp/*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Admin
app.get('/admin', (req, res) => {
    res.sendFile(join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
    res.sendFile(join(__dirname, 'admin', 'index.html'));
});

// Корневой маршрут
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Fallback для всех остальных маршрутов
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// ==================== ОБРАБОТКА ОШИБОК ====================

// Обработка ошибок Multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'Размер файла слишком большой. Максимальный размер: 100MB'
            });
        }
    }
    
    if (error.message.includes('Неподдерживаемый тип файла')) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    
    next(error);
});

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// ==================== ЗАПУСК СЕРВЕРА ====================

async function startServer() {
    try {
        console.log('🚀 Запуск Академии АНБ...');
        
        // Инициализация базы данных
        if (!initializeDatabase()) {
            console.error('❌ Не удалось инициализировать базу данных');
            process.exit(1);
        }
        
        // Ждем подключения к БД и инициализируем таблицы
        await initDatabase();
        
        // Инициализация бота
        if (initializeBot()) {
            setupBot();
        }
        
        // Запуск сервера
        app.listen(PORT, '0.0.0.0', () => {
            console.log('====================================');
            console.log('🚀 Сервер Академии АНБ запущен!');
            console.log('====================================');
            console.log(`📍 Порт: ${PORT}`);
            console.log(`🌐 Окружение: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📱 WebApp: ${process.env.WEBAPP_URL || `http://localhost:${PORT}/webapp/`}`);
            console.log(`🔧 Админ-панель: ${process.env.WEBAPP_URL || `http://localhost:${PORT}`}/admin/`);
            console.log(`🤖 Bot: ${bot ? 'активен' : 'не настроен'}`);
            console.log(`🗄️ База данных: подключена`);
            console.log(`📁 Загрузка файлов: доступна`);
            console.log(`🔐 Аутентификация: JWT`);
            console.log(`❤️ Health: http://localhost:${PORT}/api/health`);
            console.log('====================================');
        });
        
    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error);
        process.exit(1);
    }
}

// Обработка graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Получен SIGTERM, завершаем работу...');
    if (bot) {
        bot.stop();
    }
    if (pool) {
        await pool.end();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Получен SIGINT, завершаем работу...');
    if (bot) {
        bot.stop();
    }
    if (pool) {
        await pool.end();
    }
    process.exit(0);
});

startServer();
