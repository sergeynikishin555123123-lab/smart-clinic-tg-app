// server.js - МИНИМАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ ДЛЯ ДЕПЛОЯ
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'webapp')));

// Ensure directories
function ensureDirectories() {
    const dirs = ['uploads', 'logs', 'temp'];
    dirs.forEach(dir => {
        const path = join(__dirname, dir);
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Академия АНБ работает',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Demo user endpoint
app.post('/api/user', (req, res) => {
    const user = {
        id: req.body.id || 898508164,
        firstName: req.body.firstName || 'Демо Пользователь',
        specialization: 'Невролог',
        city: 'Москва',
        subscription: { status: 'active' },
        isAdmin: true,
        isSuperAdmin: true
    };
    res.json({ success: true, user });
});

// Demo content endpoint
app.get('/api/content', (req, res) => {
    const content = {
        courses: [
            {
                id: 1,
                title: 'Мануальные техники в практике',
                description: '6 модулей по современным методикам',
                price: 15000,
                duration: '12 часов'
            }
        ],
        podcasts: [
            {
                id: 1,
                title: 'АНБ FM: Современная неврология',
                description: 'Обсуждение новых тенденций',
                duration: '45:20'
            }
        ]
    };
    res.json({ success: true, data: content });
});

// Serve webapp
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Startup
ensureDirectories();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Академия АНБ запущена на порту ${PORT}`);
    console.log(`🌐 WebApp: http://localhost:${PORT}`);
    console.log(`🔧 Режим: Продакшен`);
    console.log(`✅ Готов к работе!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Остановка сервера...');
    process.exit(0);
});
