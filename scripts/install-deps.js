// install-deps.js
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 Принудительная установка зависимостей для TimeWeb...');

try {
    // Проверяем наличие package.json
    if (!fs.existsSync('package.json')) {
        throw new Error('package.json не найден');
    }

    // Устанавливаем зависимости с флагами для обхода проблем
    console.log('📦 Устанавливаем зависимости...');
    execSync('npm install --production --no-optional --legacy-peer-deps --no-audit --no-fund', {
        stdio: 'inherit'
    });

    console.log('✅ Зависимости установлены успешно!');
    
    // Проверяем установку
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('📋 Установленные зависимости:', Object.keys(pkg.dependencies || {}));

} catch (error) {
    console.error('❌ Ошибка установки:', error.message);
    process.exit(1);
}
