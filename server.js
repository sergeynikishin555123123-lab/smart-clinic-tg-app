// server.js - МИНИМАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Минимальные настройки CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Убираем все security headers которые могут блокировать
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.removeHeader('X-Content-Type-Options');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('X-XSS-Protection');
    res.removeHeader('Strict-Transport-Security');
    res.removeHeader('Content-Security-Policy');
    next();
});

// Статические файлы
app.use(express.static(join(__dirname, 'webapp')));
app.use(express.json());

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// API маршруты
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/user', (req, res) => {
    const user = {
        id: req.body.id || 898508164,
        firstName: 'Демо Пользователь',
        lastName: '',
        specialization: 'Невролог',
        city: 'Москва',
        email: 'demo@anb.ru',
        subscription: { 
            status: 'active', 
            type: 'admin'
        },
        progress: { 
            level: 'Понимаю', 
            steps: {
                materialsWatched: 12,
                eventsParticipated: 5,
                materialsSaved: 8,
                coursesBought: 3
            }
        },
        isAdmin: true,
        joinedAt: new Date('2024-01-01')
    };

    res.json({ success: true, user });
});

app.get('/api/content', (req, res) => {
    const content = {
        courses: [
            {
                id: 1,
                title: 'Мануальные техники в практике',
                description: '6 модулей по современным мануальным методикам',
                price: 15000,
                duration: '12 часов',
                modules: 6,
                category: 'Неврология'
            },
            {
                id: 2,
                title: 'Неврология для практикующих врачей',
                description: 'Основы неврологической диагностики',
                price: 12000,
                duration: '10 часов',
                modules: 5,
                category: 'Неврология'
            }
        ]
    };

    res.json({ success: true, data: content });
});

app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            totalUsers: 150,
            totalCourses: 3,
            activeUsers: 45,
            totalRevenue: 130500
        }
    });
});

app.get('/api/users', (req, res) => {
    const users = [
        {
            id: 898508164,
            firstName: 'Администратор',
            subscription: { status: 'active' },
            isAdmin: true
        }
    ];
    res.json({ success: true, users });
});

// Все остальные маршруты
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
});
