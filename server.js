// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Базовые middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/webapp', express.static(path.join(__dirname, 'webapp')));
app.use('/assets', express.static(path.join(__dirname, 'webapp/assets')));

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
        isAdmin: true
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
                image_url: '/assets/course-manual.svg'
            }
        ]
    };
    res.json({ success: true, data: content });
});

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'webapp', 'index.html'));
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
