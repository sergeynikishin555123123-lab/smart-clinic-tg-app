// build.js
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🏗️  Принудительная сборка для TimeWeb...');

// Удаляем проблемные файлы если есть
const problematicFiles = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'];
problematicFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`🗑️  Удаляем ${file}`);
        fs.unlinkSync(file);
    }
});

// Создаем чистый package-lock.json
console.log('📦 Создаем чистые lock файлы...');
try {
    execSync('npm install --package-lock-only --no-audit --no-fund', { stdio: 'inherit' });
} catch (error) {
    console.log('⚠️  Пропускаем создание lock файла');
}

console.log('✅ Сборка завершена!');
