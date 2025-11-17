// setup.js - упрощенная версия
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
            'uploads', 'logs', 'backups', 'temp', 'webapp/assets'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(join(__dirname, dir), { recursive: true });
            console.log(`✓ Created: ${dir}`);
        }
        
        // Создаем .env если не существует
        const envPath = join(__dirname, '.env');
        if (!existsSync(envPath)) {
            const envContent = `BOT_TOKEN=8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4
WEBAPP_URL=https://anb-academy.timeweb.ru
PORT=3000
NODE_ENV=production
ADMIN_IDS=898508164
JWT_SECRET=anb-academy-super-secret-jwt-key-2024`;
            
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
