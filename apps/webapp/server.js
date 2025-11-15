import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static(path.join(__dirname, 'dist')));

// API эндпоинты (заглушки)
app.get('/api/content', (req, res) => {
  res.json({
    courses: [],
    podcasts: [],
    videos: [],
    materials: []
  });
});

app.get('/api/user/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Пользователь',
    subscription: 'active'
  });
});

// Все остальные запросы на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 WebApp server running on port ${PORT}`);
});
