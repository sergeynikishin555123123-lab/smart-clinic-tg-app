// setup.js - МИНИМАЛЬНАЯ ВЕРСИЯ
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setup() {
    console.log('🚀 Настройка Академии АНБ...');
    
    // Создаем директории
    const dirs = ['uploads', 'logs', 'webapp'];
    for (const dir of dirs) {
        await fs.mkdir(join(__dirname, dir), { recursive: true });
    }
    
    // Создаем базовый index.html
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>Академия АНБ</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial; margin: 0; padding: 20px; background: #0f172a; color: white; }
        .loading { text-align: center; margin-top: 100px; }
        .spinner { border: 4px solid #334155; border-top: 4px solid #3b82f6; border-radius: 50%; 
                  width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
    </style>
</head>
<body>
    <div class="loading">
        <div class="spinner"></div>
        <h2>Академия АНБ</h2>
        <p>Загрузка приложения...</p>
    </div>
    <script>
        // Минимальный JavaScript для работы
        async function init() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.querySelector('p').textContent = 'Система загружена ✅';
            } catch (error) {
                document.querySelector('p').textContent = 'Ошибка загрузки ❌';
            }
        }
        init();
    </script>
</body>
</html>`;
    
    await fs.writeFile(join(__dirname, 'webapp', 'index.html'), html);
    console.log('✅ Настройка завершена');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    setup().catch(console.error);
}
