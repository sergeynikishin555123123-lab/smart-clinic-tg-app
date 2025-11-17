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
   
