// install-deps.js - установка зависимостей без package-lock.json
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function installDependencies() {
    console.log('📦 Installing dependencies without package-lock.json...');
    
    try {
        // Установка с флагом --no-package-lock
        const { stdout, stderr } = await execAsync('npm install --no-package-lock --legacy-peer-deps --no-audit --no-fund', {
            timeout: 300000
        });
        
        if (stderr) {
            console.warn('⚠️ Installation warnings:', stderr);
        }
        
        console.log('✅ Dependencies installed successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Installation failed:', error.message);
        
        // Попробуем установить только критические зависимости
        console.log('🔄 Trying to install critical dependencies only...');
        
        try {
            const criticalDeps = [
                'express@4.18.2', 'telegraf@4.16.3', 'pg@8.11.3', 
                'bcryptjs@2.4.3', 'jsonwebtoken@9.0.2', 'cors@2.8.5',
                'dotenv@16.3.1', 'uuid@9.0.1', 'axios@1.6.2'
            ];
            
            for (const dep of criticalDeps) {
                await execAsync(`npm install ${dep} --no-package-lock --no-save`, {
                    timeout: 60000
                });
                console.log(`✓ Installed: ${dep}`);
            }
            
            console.log('✅ Critical dependencies installed');
            return true;
            
        } catch (secondError) {
            console.error('❌ Critical dependencies installation failed:', secondError.message);
            return false;
        }
    }
}

// Запуск установки
installDependencies().then(success => {
    if (success) {
        console.log('🎉 Dependency installation completed');
        process.exit(0);
    } else {
        console.log('💥 Dependency installation failed');
        process.exit(1);
    }
});
