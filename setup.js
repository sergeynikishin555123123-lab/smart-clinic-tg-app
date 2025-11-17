// setup.js - создаем placeholder изображения
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

        // Создаем placeholder изображения
        const images = [
            'course-manual.jpg',
            'course-diagnosis.jpg', 
            'podcast-neurology.jpg',
            'stream-pain-syndrome.jpg',
            'video-neurological-exam.jpg',
            'material-ms-mri.jpg',
            'event-neurology-conf.jpg',
            'promo-welcome.jpg',
            'chat-main.jpg',
            'course-default.jpg'
        ];

        // Создаем простые SVG placeholder
        for (const image of images) {
            const svgContent = createPlaceholderSVG(image);
            const filePath = join(__dirname, 'webapp/assets', image.replace('.jpg', '.svg'));
            await fs.writeFile(filePath, svgContent);
            console.log(`✓ Создан: ${image.replace('.jpg', '.svg')}`);
        }

        console.log('✅ Настройка завершена!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

function createPlaceholderSVG(filename) {
    const name = filename.replace('.jpg', '').replace(/-/g, ' ');
    return `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#3b82f6" />
            <stop offset="100%" stop-color="#1e40af" />
        </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="18" fill="white" font-weight="bold">
        ${name}
    </text>
    <text x="50%" y="65%" text-anchor="middle" font-family="Arial" font-size="14" fill="rgba(255,255,255,0.8)">
        Академия АНБ
    </text>
</svg>`;
}

// Автозапуск
const args = process.argv.slice(2);
if (args.includes('--non-interactive')) {
    await setup();
}
