import React, { useState } from 'react';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState('home');

  const HomePage = () => (
    <div className="page">
      <h2>🏠 Добро пожаловать в Академию АНБ!</h2>
      <div className="categories">
        <div className="category">📚 Курсы</div>
        <div className="category">🎧 АНБ FM</div>
        <div className="category">📹 Эфиры|Разборы</div>
        <div className="category">🎯 Видео-шпаргалки</div>
        <div className="category">📋 Практические материалы</div>
        <div className="category">🗺️ Карта мероприятий</div>
        <div className="category">🔥 Ограниченное предложение</div>
        <div className="category">💬 Поддержка</div>
      </div>
    </div>
  );

  const CommunityPage = () => (
    <div className="page">
      <h2>👥 О сообществе</h2>
      <p>Информация о сообществе Академии АНБ</p>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage />;
      case 'community': return <CommunityPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Академия АНБ</h1>
      </header>
      
      <main className="main">
        {renderPage()}
      </main>

      <nav className="navigation">
        <button 
          className={`nav-btn ${activePage === 'home' ? 'active' : ''}`}
          onClick={() => setActivePage('home')}
        >
          🏠 Домой
        </button>
        <button 
          className={`nav-btn ${activePage === 'community' ? 'active' : ''}`}
          onClick={() => setActivePage('community')}
        >
          👥 Сообщество
        </button>
      </nav>
    </div>
  );
}

export default App;
