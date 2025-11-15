import React, { useState } from 'react';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('home');

  const pages = {
    home: <HomePage />,
    community: <CommunityPage />,
    chats: <ChatsPage />,
    materials: <MaterialsPage />,
    profile: <ProfilePage />
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Академия АНБ</h1>
      </header>

      <main className="main">
        {pages[activePage]}
      </main>

      <nav className="nav">
        <button className={`nav-btn ${activePage === 'home' ? 'active' : ''}`} onClick={() => setActivePage('home')}>
          🏠 Домой
        </button>
        <button className={`nav-btn ${activePage === 'community' ? 'active' : ''}`} onClick={() => setActivePage('community')}>
          👥 Сообщество
        </button>
        <button className={`nav-btn ${activePage === 'chats' ? 'active' : ''}`} onClick={() => setActivePage('chats')}>
          💬 Чаты
        </button>
        <button className={`nav-btn ${activePage === 'materials' ? 'active' : ''}`} onClick={() => setActivePage('materials')}>
          📚 Материалы
        </button>
        <button className={`nav-btn ${activePage === 'profile' ? 'active' : ''}`} onClick={() => setActivePage('profile')}>
          👤 Профиль
        </button>
      </nav>
    </div>
  );
}

function HomePage() {
  const categories = [
    '📚 Курсы', '🎧 АНБ FM', '📹 Эфиры|Разборы', '🎯 Видео-шпаргалки',
    '📋 Практические материалы', '🗺️ Карта мероприятий', 
    '🔥 Ограниченное предложение', '💬 Поддержка'
  ];

  return (
    <div className="page">
      <div className="search">
        <input type="text" placeholder="Поиск..." className="search-input" />
      </div>
      
      <div className="grid">
        {categories.map((category, index) => (
          <div key={index} className="card">
            {category}
          </div>
        ))}
      </div>

      <div className="news">
        <h3>Лента новостей</h3>
        <div className="filters">
          {['Все', 'Статьи', 'Профессиональное развитие', 'Практические навыки'].map(filter => (
            <button key={filter} className="filter">{filter}</button>
          ))}
        </div>
        <div className="news-list">
          <div className="news-item">Новость 1</div>
          <div className="news-item">Новость 2</div>
        </div>
      </div>
    </div>
  );
}

function CommunityPage() {
  return (
    <div className="page">
      <h2>О сообществе</h2>
      <div className="grid">
        <div className="card">📜 Правила сообщества</div>
        <div className="card">❓ F.A.Q.</div>
        <div className="card">💳 Подписка</div>
        <div className="card">🔄 Как оформить подписку</div>
      </div>
    </div>
  );
}

function ChatsPage() {
  return (
    <div className="page">
      <h2>Чаты</h2>
      <div className="list">
        <div className="list-item">💬 Флудилка</div>
        <div className="list-item">👥 Чат специалистов</div>
      </div>
    </div>
  );
}

function MaterialsPage() {
  return (
    <div className="page">
      <h2>Мои материалы</h2>
      <div className="tabs">
        <button className="tab active">Посмотреть позже</button>
        <button className="tab">Избранное</button>
        <button className="tab">Практические материалы</button>
      </div>
      <div className="tab-content">
        Список материалов...
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="page">
      <div className="profile">
        <div className="avatar">👤</div>
        <div className="profile-info">
          <div className="name">Имя пользователя</div>
          <div className="status">Член Академии АНБ</div>
          <div className="subscription">Подписка: активна</div>
          <button className="btn">Изменить подписку</button>
        </div>
      </div>

      <div className="journey">
        <h3>Мой путь</h3>
        <div className="journey-steps">
          {['Понимаю', 'Связываю', 'Применяю', 'Систематизирую', 'Делюсь'].map((step, i) => (
            <div key={i} className="step">
              <span className="step-number">{i + 1}️⃣</span>
              <div className="step-info">
                <div className="step-title">{step}</div>
                <div className="step-progress">Прогресс: {i * 25}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
