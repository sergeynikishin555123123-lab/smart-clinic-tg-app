// server.js - МАКСИМАЛЬНО УПРОЩЕННАЯ ВЕРСИЯ
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Минимальные middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы БЕЗ каких-либо ограничений
app.use('/webapp', express.static(join(__dirname, 'webapp')));
app.use('/assets', express.static(join(__dirname, 'webapp/assets')));

// Простые API endpoints
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Сервер работает',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/user', (req, res) => {
    const user = {
        id: 898508164,
        firstName: 'Демо Пользователь',
        username: 'demo_user',
        specialization: 'Невролог',
        city: 'Москва',
        subscription: { 
            status: 'active', 
            type: 'premium'
        },
        progress: {
            level: 'Понимаю',
            experience: 1250
        },
        isAdmin: true,
        joinedAt: new Date().toISOString()
    };
    res.json({ success: true, user });
});

app.get('/api/content', (req, res) => {
    const content = {
        courses: [
            {
                id: 1,
                title: 'Мануальные техники в практике невролога',
                description: '6 модулей по современным мануальным методикам',
                price: 25000,
                duration: '12 недель',
                image_url: '/assets/course-manual.svg',
                featured: true
            }
        ],
        podcasts: [],
        streams: [],
        videos: [],
        materials: []
    };
    res.json({ success: true, data: content });
});

app.get('/api/favorites', (req, res) => {
    res.json({ 
        success: true, 
        favorites: {
            courses: [1],
            podcasts: [],
            streams: [],
            videos: [],
            materials: []
        }
    });
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Доступен по адресу: https://sergeynikishin555123123-lab-smart-clinic-tg-app-f84f.twc1.net`);
});
