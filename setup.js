// setup.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setup() {
    console.log('🚀 Создание необходимых файлов...');
    
    try {
        // Создаем директории
        await fs.mkdir(join(__dirname, 'webapp/assets'), { recursive: true });
        
        // Создаем простые SVG изображения
        const images = [
            'course-manual.svg',
            'course-diagnosis.svg'
        ];

        for (const image of images) {
            const name = image.replace('.svg', '').replace(/-/g, ' ');
            const svgContent = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#3b82f6"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="white">
        ${name}
    </text>
</svg>`;
            await fs.writeFile(join(__dirname, 'webapp/assets', image), svgContent);
            console.log(`✓ Создан: ${image}`);
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
