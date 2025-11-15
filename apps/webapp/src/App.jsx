import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Академия АНБ</h1>
        <p>Добро пожаловать в мини-приложение!</p>
        <div className="features">
          <div className="feature">📚 Курсы</div>
          <div className="feature">🎧 АНБ FM</div>
          <div className="feature">📹 Эфиры и разборы</div>
          <div className="feature">🎯 Видео-шпаргалки</div>
        </div>
        <div className="loading">
          Приложение загружается...
        </div>
      </header>
    </div>
  );
}

export default App;
