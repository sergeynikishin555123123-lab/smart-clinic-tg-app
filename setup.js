// setup.js - оптимизирован для Timeweb без package-lock.json
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TimewebSetup {
    constructor() {
        this.baseDir = __dirname;
    }

    async init() {
        console.log('🚀 Starting Timeweb deployment setup...');
        
        try {
            await this.installDependencies();
            await this.createDirectories();
            await this.createConfigFiles();
            await this.verifyEnvironment();
            
            console.log('✅ Timeweb setup completed successfully!');
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            // Не выходим с ошибкой, продолжаем работу
        }
    }

    async installDependencies() {
        console.log('📦 Installing dependencies...');
        
        try {
            // Пробуем установить без package-lock.json
            await execAsync('npm install --no-package-lock --legacy-peer-deps --no-audit', {
                cwd: this.baseDir,
                timeout: 300000
            });
            console.log('✅ Dependencies installed');
        } catch (error) {
            console.warn('⚠️ Could not install all dependencies:', error.message);
            console.log('🔄 Continuing with available dependencies...');
        }
    }

    async createDirectories() {
        console.log('📁 Creating directories...');
        
        const dirs = [
            'uploads', 'uploads/courses', 'uploads/podcasts', 'uploads/streams',
            'uploads/videos', 'uploads/materials', 'uploads/avatars', 'uploads/documents',
            'logs', 'backups', 'temp', 'webapp/assets'
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(join(this.baseDir, dir), { recursive: true });
                console.log(`✓ Created: ${dir}`);
            } catch (error) {
                // Игнорируем ошибки существующих директорий
            }
        }
    }

    async createConfigFiles() {
        console.log('📄 Creating configuration files...');
        
        const configs = {
            '.env': this.getEnvConfig(),
            'webapp/.htaccess': this.getHtaccess(),
            'webapp/robots.txt': 'User-agent: *\nAllow: /'
        };
        
        for (const [file, content] of Object.entries(configs)) {
            try {
                await fs.writeFile(join(this.baseDir, file), content, 'utf8');
                console.log(`✓ Created: ${file}`);
            } catch (error) {
                console.warn(`⚠ Could not create ${file}:`, error.message);
            }
        }
    }

    getEnvConfig() {
        return `BOT_TOKEN=${process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4'}
DATABASE_URL=${process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@45.89.190.49:5432/default_db?sslmode=require'}
WEBAPP_URL=${process.env.WEBAPP_URL || 'https://anb-academy.timeweb.ru'}
PORT=3000
NODE_ENV=production
ADMIN_IDS=898508164
JWT_SECRET=anb-academy-super-secret-jwt-key-2024
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800`;
    }

    getHtaccess() {
        return `RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]`;
    }

    async verifyEnvironment() {
        console.log('🔍 Verifying environment...');
        
        const nodeVersion = process.version;
        console.log(`✓ Node.js version: ${nodeVersion}`);
        
        // Проверяем только критические модули
        const criticalModules = ['express', 'telegraf', 'pg', 'bcryptjs'];
        for (const module of criticalModules) {
            try {
                await import(module);
                console.log(`✓ Module available: ${module}`);
            } catch (error) {
                console.warn(`⚠ Module missing: ${module}`);
            }
        }
    }
}

// Автозапуск
const setup = new TimewebSetup();
await setup.init();
