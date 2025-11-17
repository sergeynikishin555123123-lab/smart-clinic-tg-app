// setup.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setup() {
    console.log('🚀 ANB Academy - Build Process Starting...');
    
    try {
        // Создаем директории
        const dirs = [
            'uploads/courses', 'uploads/podcasts', 'uploads/streams',
            'uploads/videos', 'uploads/materials', 'uploads/avatars', 
            'uploads/documents', 'logs', 'backups', 'temp', 'webapp/assets'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(join(__dirname, dir), { recursive: true });
            console.log(`✓ Created: ${dir}`);
        }
        
        // Создаем .env если не существует
        const envPath = join(__dirname, '.env');
        if (!existsSync(envPath)) {
            const envContent = `BOT_TOKEN=${process.env.BOT_TOKEN || '8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4'}
DATABASE_URL=${process.env.DATABASE_URL || 'postgresql://gen_user:5-R;mKGYJ<88?1@45.89.190.49:5432/default_db?sslmode=require'}
WEBAPP_URL=${process.env.WEBAPP_URL || 'https://anb-academy.timeweb.ru'}
PORT=3000
NODE_ENV=production
ADMIN_IDS=898508164
JWT_SECRET=anb-academy-super-secret-jwt-key-2024
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800`;
            
            await fs.writeFile(envPath, envContent);
            console.log('✓ Created: .env');
        }
        
        // Создаем базовые файлы для webapp
        const webappFiles = {
            'webapp/.htaccess': `RewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule . /index.html [L]`,
            'webapp/robots.txt': 'User-agent: *\nAllow: /'
        };
        
        for (const [file, content] of Object.entries(webappFiles)) {
            const filePath = join(__dirname, file);
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`✓ Created: ${file}`);
        }
        
        console.log('✅ Build completed successfully!');
        
    } catch (error) {
        console.error('❌ Build error:', error.message);
        // Не выходим с ошибкой, чтобы сборка продолжалась
    }
}

// Автозапуск при вызове скрипта
const args = process.argv.slice(2);
if (args.includes('--non-interactive')) {
    await setup();
}
