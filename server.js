// server.js - Упрощенная версия для быстрого запуска
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname)));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/content', (req, res) => {
    const content = {
        courses: [
            {
                id: 1,
                title: 'Мануальные техники в практике невролога',
                description: '6 модулей по современным мануальным методикам',
                price: 25000,
                discount: 16,
                duration: '12 недель',
                modules: 6,
                category: 'Мануальные техники',
                level: 'advanced',
                students_count: 156,
                rating: 4.8,
                featured: true,
                image_url: '/webapp/assets/course-default.jpg'
            },
            {
                id: 2,
                title: 'Неврологическая диагностика',
                description: '5 модулей по современной диагностике',
                price: 18000,
                duration: '8 недель',
                modules: 5,
                category: 'Неврология',
                level: 'intermediate',
                students_count: 234,
                rating: 4.6,
                featured: true,
                image_url: '/webapp/assets/course-default.jpg'
            }
        ],
        stats: {
            totalUsers: 1567,
            totalCourses: 12,
            totalMaterials: 45
        }
    };
    res.json({ success: true, data: content });
});

app.post('/api/user', (req, res) => {
    const user = {
        id: 898508164,
        firstName: 'Демо Пользователь',
        isAdmin: true,
        isSuperAdmin: true,
        favorites: {
            courses: [1],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: []
        },
        progress: {
            level: 'Понимаю',
            experience: 1250,
            steps: {
                coursesBought: 3,
                modulesCompleted: 2,
                materialsWatched: 12
            }
        }
    };
    res.json({ success: true, user });
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 WebApp: http://localhost:${PORT}/webapp/`);
});
