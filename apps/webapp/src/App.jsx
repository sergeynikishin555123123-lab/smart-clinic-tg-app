import React, { useState, useEffect } from 'react';
import './App.css';

// Основные компоненты
const HomePage = () => {
  const categories = [
    { id: 1, name: '📚 Курсы', icon: '📚' },
    { id: 2, name: '🎧 АНБ FM', icon: '🎧' },
    { id: 3, name: '📹 Эфиры|Разборы', icon: '📹' },
    { id: 4, name: '🎯 Видео-шпаргалки', icon: '🎯' },
    { id: 5, name: '📋 Практические материалы', icon: '📋' },
    { id: 6, name: '🗺️ Карта мероприятий', icon: '🗺️' },
    { id: 7, name: '🔥 Ограниченное предложение', icon: '🔥' },
    { id: 8, name: '💬 Поддержка', icon: '💬' }
  ];

  const newsFilters = [
    'Все', 'Статьи', 'Профессиональное развитие', 'Практические навыки',
    'Физиотерапия', 'Реабилитация', 'Фармакотерапия', 'Мануальные техники'
  ];

  return (
    <div className="page">
      <div className="search-bar">
        <input type="text" placeholder="Поиск..." className="search-input" />
      </div>
      
      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-icon">{category.icon}</div>
            <div className="category-name">{category.name}</div>
          </div>
        ))}
      </div>

      <div className="news-section">
        <div className="section-title">Лента новостей</div>
        <div className="news-filters">
          {newsFilters.map((filter, index) => (
            <button key={index} className="filter-btn">{filter}</button>
          ))}
        </div>
        <div className="news-list">
          <div className="news-item">Новость 1</div>
          <div className="news-item">Новость 2</div>
          <div className="news-item">Новость 3</div>
        </div>
      </div>
    </div>
  );
};

const CommunityPage = () => {
  const communitySections = [
    { id: 1, name: '📜 Правила сообщества', icon: '📜' },
    { id: 2, name: '❓ F.A.Q.', icon: '❓' },
    { id: 3, name: '💳 Подписка', icon: '💳' },
    { id: 4, name: '🔄 Как оформить подписку', icon: '🔄' }
  ];

  return (
    <div className="page">
      <div className="section-title">О сообществе</div>
      <div className="community-grid">
        {communitySections.map(section => (
          <div key={section.id} className="community-card">
            <div className="community-icon">{section.icon}</div>
            <div className="community-name">{section.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChatsPage = () => {
  return (
    <div className="page">
      <div className="section-title">Чаты</div>
      <div className="chats-list">
        <div className="chat-item">💬 Флудилка</div>
        <div className="chat-item">👥 Чат специалистов 1</div>
        <div className="chat-item">👥 Чат специалистов 2</div>
        <div className="chat-note">Ожидаем согласования названий чатов от руководителя</div>
      </div>
    </div>
  );
};

const MaterialsPage = () => {
  const materialTabs = ['Посмотреть позже', 'Избранное', 'Практические материалы'];
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="page">
      <div className="section-title">Мои материалы</div>
      <div className="tabs">
        {materialTabs.map((tab, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab === 0 && <div>Список материалов "Посмотреть позже"</div>}
        {activeTab === 1 && <div>Список избранных материалов</div>}
        {activeTab === 2 && <div>Практические материалы</div>}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  return (
    <div className="page">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <div className="profile-info">
          <div className="profile-name">Имя пользователя</div>
          <div className="profile-status">Член Академии АНБ с апреля 2025</div>
          <div className="subscription-status">Подписка: активна</div>
          <button className="change-subscription-btn">Изменить подписку</button>
        </div>
      </div>

      <div className="my-journey">
        <div className="section-title">Мой путь</div>
        <div className="journey-steps">
          {['Понимаю', 'Связываю', 'Применяю', 'Систематизирую', 'Делюсь'].map((step, index) => (
            <div key={index} className="journey-step">
              <div className="step-number">{index + 1}️⃣</div>
              <div className="step-info">
                <div className="step-title">{step}</div>
                <div className="step-progress">Прогресс: {index * 25}%</div>
                <div className="step-hint">Подсказка по достижению этапа...</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Главный компонент приложения
function App() {
  const [activePage, setActivePage] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);

  const navigation = [
    { id: 'home', name: 'Домой', icon: '🏠' },
    { id: 'community', name: 'Сообществе', icon: '👥' },
    { id: 'chats', name: 'Чаты', icon: '💬' },
    { id: 'materials', name: 'Избранное', icon: '⭐' },
    { id: 'profile', name: 'Профиль', icon: '👤' }
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage />;
      case 'community': return <CommunityPage />;
      case 'chats': return <ChatsPage />;
      case 'materials': return <MaterialsPage />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Академия АНБ</h1>
        {isAdmin && (
          <button className="admin-btn" onClick={() => setIsAdmin(false)}>
            🔧 Админ
          </button>
        )}
      </header>

      <main className="app-main">
        {renderPage()}
      </main>

      <nav className="bottom-nav">
        {navigation.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
