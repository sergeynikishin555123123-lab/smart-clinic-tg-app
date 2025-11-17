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
            const envContent = `BOT_TOKEN=8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4
DATABASE_URL=postgresql://gen_user:5-R;mKGYJ<88?1@45.89.190.49:5432/default_db?sslmode=require
WEBAPP_URL=https://sergeynikishin555123123-lab-smart-clinic-tg-app-f84f.twc1.net
PORT=3000
NODE_ENV=production
ADMIN_IDS=898508164
JWT_SECRET=anb-academy-super-secret-jwt-key-2024
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800`;
            
            await fs.writeFile(envPath, envContent);
            console.log('✓ Created: .env');
        }
        
        console.log('✅ Build completed successfully!');
        
    } catch (error) {
        console.error('❌ Build error:', error.message);
    }
}

// Автозапуск при вызове скрипта
const args = process.argv.slice(2);
if (args.includes('--non-interactive')) {
    await setup();
}
