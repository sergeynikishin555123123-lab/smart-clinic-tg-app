// diagnostic.js
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

console.log('🩺 Диагностика среды для TimeWeb...');

// Проверяем систему
console.log('📊 Информация о системе:');
console.log('- Платформа:', os.platform());
console.log('- Архитектура:', os.arch());
console.log('- Node.js:', process.version);
console.log('- NPM:', execSync('npm --version').toString().trim());

// Проверяем файлы
const files = ['package.json', 'server.js', 'setup.js'];
files.forEach(file => {
    console.log(`- ${file}:`, fs.existsSync(file) ? '✅' : '❌');
});

// Проверяем зависимости
try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('📦 Зависимости:', Object.keys(pkg.dependencies || {}));
} catch (error) {
    console.error('❌ Ошибка чтения package.json:', error.message);
}

console.log('🔍 Проверка завершена');
