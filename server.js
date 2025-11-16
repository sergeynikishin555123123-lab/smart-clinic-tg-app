// server.js - ПОЛНАЯ ВЕРСИЯ С ВСЕМИ МОДУЛЯМИ
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'webapp')));

// Демо данные
const demoData = {
    users: [
        {
            id: 898508164,
            firstName: 'Администратор',
            lastName: '',
            email: 'admin@anb.ru',
            specialization: 'Невролог',
            city: 'Москва',
            subscription: { status: 'active', type: 'premium' },
            progress: { 
                level: 'Эксперт', 
                steps: { materialsWatched: 45, eventsParticipated: 12, materialsSaved: 23, coursesBought: 8 }
            },
            isAdmin: true,
            joinedAt: '2024-01-01'
        }
    ],
    
    courses: [
        {
            id: 1,
            title: 'Мануальные техники в практике',
            description: '6 модулей по современным мануальным методикам',
            fullDescription: 'Комплексный курс по мануальным техникам для практикующих врачей. Изучение современных подходов к диагностике и лечению.',
            price: 15000,
            duration: '12 часов',
            modules: 6,
            category: 'Неврология',
            level: 'advanced',
            studentsCount: 45,
            rating: 4.8,
            image: '📚',
            created_at: '2024-01-15'
        },
        {
            id: 2,
            title: 'Неврология для практикующих врачей',
            description: 'Основы неврологической диагностики',
            fullDescription: 'Фундаментальный курс по неврологии с углубленным изучением диагностических методик.',
            price: 12000,
            duration: '10 часов',
            modules: 5,
            category: 'Неврология',
            level: 'intermediate',
            studentsCount: 67,
            rating: 4.6,
            image: '🧠',
            created_at: '2024-01-10'
        },
        {
            id: 3,
            title: 'Основы реабилитации',
            description: 'Современные подходы к реабилитации',
            fullDescription: 'Курс по современным методикам реабилитации пациентов после неврологических заболеваний.',
            price: 8000,
            duration: '8 часов',
            modules: 4,
            category: 'Реабилитация',
            level: 'beginner',
            studentsCount: 89,
            rating: 4.7,
            image: '🔄',
            created_at: '2024-01-20'
        }
    ],

    podcasts: [
        {
            id: 1,
            title: 'АНБ FM: Современная неврология',
            description: 'Обсуждение новых тенденций в неврологии',
            duration: '45:20',
            category: 'Неврология',
            listens: 234,
            image: '🎧'
        },
        {
            id: 2,
            title: 'АНБ FM: Реабилитационные методики',
            description: 'Новые подходы к реабилитации',
            duration: '38:15',
            category: 'Реабилитация',
            listens: 167,
            image: '🎧'
        }
    ],

    streams: [
        {
            id: 1,
            title: 'Разбор клинического случая: Болевой синдром',
            description: 'Прямой эфир с разбором сложного случая',
            duration: '1:30:00',
            date: '2024-01-25T19:00:00',
            isLive: true,
            participants: 89,
            image: '📹'
        },
        {
            id: 2,
            title: 'Мануальные техники: Демонстрация',
            description: 'Практическая демонстрация методик',
            duration: '2:15:00',
            date: '2024-01-28T18:00:00',
            isLive: false,
            participants: 156,
            image: '📹'
        }
    ],

    videos: [
        {
            id: 1,
            title: 'Шпаргалка: Неврологический осмотр',
            description: 'Быстрый гайд по основным тестам',
            duration: '15:30',
            category: 'Неврология',
            views: 456,
            image: '🎯'
        },
        {
            id: 2,
            title: 'Шпаргалка: Реабилитационные упражнения',
            description: 'Комплекс базовых упражнений',
            duration: '12:45',
            category: 'Реабилитация',
            views: 289,
            image: '🎯'
        }
    ],

    materials: [
        {
            id: 1,
            title: 'МРТ разбор: Рассеянный склероз',
            description: 'Детальный разбор МРТ с клиническими случаями',
            type: 'mri',
            category: 'Неврология',
            downloads: 123,
            image: '📋'
        },
        {
            id: 2,
            title: 'Чек-лист: Неврологический осмотр',
            description: 'Пошаговый чек-лист для ежедневной практики',
            type: 'checklist',
            category: 'Неврология',
            downloads: 267,
            image: '📋'
        }
    ],

    events: [
        {
            id: 1,
            title: 'Конференция: Современная неврология 2024',
            description: 'Ежегодная конференция с ведущими специалистами',
            date: '2024-02-15T10:00:00',
            location: 'Москва, ул. Примерная, 1',
            type: 'offline',
            participants: 45,
            image: '🗺️'
        },
        {
            id: 2,
            title: 'Вебинар: Новые методы диагностики',
            description: 'Онлайн вебинар с практикующими врачами',
            date: '2024-02-10T19:00:00',
            location: 'Онлайн',
            type: 'online',
            participants: 89,
            image: '🗺️'
        }
    ],

    teachers: [
        {
            id: 1,
            name: 'Доктор Иванов А.В.',
            specialization: 'Невролог, мануальный терапевт',
            experience: '15 лет',
            rating: 4.9,
            students: 234,
            image: '👨‍⚕️',
            bio: 'Специалист по мануальной терапии и реабилитации'
        },
        {
            id: 2,
            name: 'Профессор Петрова С.И.',
            specialization: 'Невролог, PhD',
            experience: '20 лет',
            rating: 4.8,
            students: 189,
            image: '👩‍⚕️',
            bio: 'Эксперт в области диагностики неврологических заболеваний'
        }
    ],

    chats: [
        {
            id: 1,
            name: 'Общий чат Академии',
            participants: 156,
            lastMessage: 'Добро пожаловать в Академию!',
            unread: 0,
            type: 'group'
        },
        {
            id: 2,
            name: 'Чат с преподавателем',
            participants: 2,
            lastMessage: 'Здравствуйте! Как ваши успехи?',
            unread: 3,
            type: 'private'
        }
    ],

    promotions: [
        {
            id: 1,
            title: 'Скидка 20% на первый курс',
            description: 'Специальное предложение для новых пользователей',
            discount: 20,
            isActive: true,
            endDate: '2024-02-01'
        },
        {
            id: 2,
            title: 'Пробный период 7 дней',
            description: 'Бесплатный доступ ко всем материалам',
            discount: 100,
            isActive: true,
            endDate: '2024-03-01'
        }
    ]
};

// API Routes
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/user', (req, res) => {
    const user = demoData.users[0];
    res.json({ success: true, user });
});

app.get('/api/content', (req, res) => {
    res.json({ success: true, data: demoData });
});

app.get('/api/stats', (req, res) => {
    res.json({
        success: true,
        stats: {
            totalUsers: 156,
            totalCourses: demoData.courses.length,
            activeUsers: 89,
            totalRevenue: 345600,
            totalMaterials: demoData.materials.length,
            activeTeachers: demoData.teachers.length
        }
    });
});

app.get('/api/users', (req, res) => {
    res.json({ success: true, users: demoData.users });
});

app.get('/api/teachers', (req, res) => {
    res.json({ success: true, teachers: demoData.teachers });
});

app.get('/api/chats', (req, res) => {
    res.json({ success: true, chats: demoData.chats });
});

app.get('/api/promotions', (req, res) => {
    res.json({ success: true, promotions: demoData.promotions });
});

// Admin routes
app.post('/api/admin/content', (req, res) => {
    const newContent = { id: Date.now(), ...req.body, created_at: new Date().toISOString() };
    res.json({ success: true, content: newContent });
});

app.put('/api/admin/content/:id', (req, res) => {
    res.json({ success: true, message: 'Контент обновлен' });
});

app.delete('/api/admin/content/:id', (req, res) => {
    res.json({ success: true, message: 'Контент удален' });
});

app.post('/api/admin/users/:id/make-admin', (req, res) => {
    res.json({ success: true, message: 'Пользователь назначен администратором' });
});

// SPA support
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'webapp', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 WebApp: http://localhost:${PORT}`);
    console.log(`🔧 Админка доступна для пользователя ID: 898508164`);
});
