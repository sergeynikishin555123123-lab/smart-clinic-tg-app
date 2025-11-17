// setup.js - УПРОЩЕННАЯ ВЕРСИЯ ДЛЯ TIMEWEB
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SetupSystem {
    constructor() {
        this.setupSteps = [
            'create_directories',
            'create_config',
            'setup_webapp'
        ];
    }

    async runSetup() {
        console.log('🚀 Запуск установки Академии АНБ...\n');
        
        try {
            for (const step of this.setupSteps) {
                await this.executeStep(step);
            }
            
            console.log('\n✅ Установка успешно завершена!');
            
        } catch (error) {
            console.error('\n❌ Ошибка установки:', error.message);
            process.exit(1);
        }
    }

    async executeStep(stepName) {
        console.log(`📋 Шаг: ${this.getStepDescription(stepName)}`);
        
        try {
            switch (stepName) {
                case 'create_directories':
                    await this.createDirectories();
                    break;
                case 'create_config':
                    await this.createConfig();
                    break;
                case 'setup_webapp':
                    await this.setupWebApp();
                    break;
            }
            
            console.log(`   ✅ ${this.getStepDescription(stepName)}`);
            
        } catch (error) {
            throw error;
        }
    }

    getStepDescription(stepName) {
        const descriptions = {
            'create_directories': 'Создание директорий',
            'create_config': 'Создание конфигурации',
            'setup_webapp': 'Настройка веб-приложения'
        };
        return descriptions[stepName] || stepName;
    }

    async createDirectories() {
        const directories = [
            'uploads',
            'logs',
            'backups',
            'webapp/assets'
        ];

        for (const dir of directories) {
            const fullPath = join(__dirname, dir);
            try {
                await fs.mkdir(fullPath, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw new Error(`Не удалось создать директорию ${dir}: ${error.message}`);
                }
            }
        }
    }

    async createConfig() {
        // Проверяем, существует ли .env
        try {
            await fs.access(join(__dirname, '.env'));
            console.log('   ℹ️ Файл .env уже существует');
        } catch (error) {
            // Создаем .env если его нет
            const envContent = `# Конфигурация Академии АНБ
BOT_TOKEN=8413397142:AAEKoz_BdUvDI8apfpRDivWoNgu6JOHh8Y4
DATABASE_URL=postgresql://gen_user:5-R;mKGYJ<88?1@def46fb02c0eac8fefd6f734.twc1.net:5432/default_db
WEBAPP_URL=https://anb-academy.timeweb.ru
PORT=3000
NODE_ENV=production
ADMIN_IDS=898508164
JWT_SECRET=anb-academy-super-secret-jwt-key-2024
`;
            await fs.writeFile(join(__dirname, '.env'), envContent);
            console.log('   ✅ Файл .env создан');
        }
    }

    async setupWebApp() {
        // Создаем базовый index.html
        const indexHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Академия АНБ</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #0f172a; 
            color: white;
        }
        .loading { 
            text-align: center; 
            margin-top: 50px; 
        }
        .spinner { 
            border: 4px solid #334155; 
            border-top: 4px solid #3b82f6; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 20px; 
        }
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
    <script src="/webapp/app.js"></script>
</body>
</html>`;

        await fs.writeFile(join(__dirname, 'webapp', 'index.html'), indexHTML);
        console.log('   ✅ Веб-приложение настроено');
    }
}

// Запуск установки если скрипт вызван напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
    const setupSystem = new SetupSystem();
    setupSystem.runSetup().catch(console.error);
}

export default SetupSystem;
