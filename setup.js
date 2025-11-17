// setup.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setup() {
    console.log('🚀 Настройка Академии АНБ...');
    
    try {
        // Создаем директории
        const dirs = ['uploads', 'logs', 'webapp/assets'];
        
        for (const dir of dirs) {
            await fs.mkdir(join(__dirname, dir), { recursive: true });
            console.log(`✓ Создана: ${dir}`);
        }
        
        console.log('✅ Настройка завершена!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

// Автозапуск
const args = process.argv.slice(2);
if (args.includes('--non-interactive')) {
    await setup();
}
