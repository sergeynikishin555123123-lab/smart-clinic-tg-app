// webapp/app.js - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация приложения...');
        
        // Показываем loading
        this.showLoading();
        
        try {
            await this.loadUserData();
            await this.loadContent();
            
            this.renderPage('home');
            this.setupNavigation();
            
            console.log('✅ Приложение готово');
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения');
        }
    }

    showLoading() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner">⏳</div>
                    <div>Загрузка Академии АНБ...</div>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading скроется при рендере страницы
    }

    showError(message) {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error">
                    <div class="error-icon">❌</div>
                    <div class="error-text">${message}</div>
                    <button class="btn btn-primary" onclick="app.init()">Повторить</button>
                </div>
            `;
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ id: 898508164 })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.currentUser = data.user;
                console.log('✅ Пользователь загружен:', this.currentUser);
            } else {
                throw new Error('Failed to load user');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
            // Создаем демо-пользователя
            this.currentUser = {
                id: 898508164,
                firstName: 'Демо Пользователь',
                isAdmin: true
            };
        }
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                this.allContent = data.data;
                console.log('✅ Контент загружен:', this.allContent);
            } else {
                throw new Error('Failed to load content');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки контента:', error);
            // Создаем демо-контент
            this.allContent = {
                courses: [
                    {
                        id: 1,
                        title: 'Мануальные техники в практике',
                        description: '6 модулей по современным мануальным методикам',
                        price: 15000,
                        duration: '12 часов'
                    },
                    {
                        id: 2,
                        title: 'Неврология для практикующих врачей',
                        description: 'Основы неврологической диагностики',
                        price: 12000,
                        duration: '10 часов'
                    }
                ]
            };
        }
    }

    renderPage(page) {
        this.currentPage = page;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) {
            console.error('❌ mainContent не найден');
            return;
        }

        // Обновляем активные кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        let pageHTML = '';
        
        try {
            switch(page) {
                case 'home':
                    pageHTML = this.createHomePage();
                    break;
                case 'courses':
                    pageHTML = this.createCoursesPage();
                    break;
                case 'profile':
                    pageHTML = this.createProfilePage();
                    break;
                default:
                    pageHTML = this.createHomePage();
            }
            
            mainContent.innerHTML = pageHTML;
            console.log(`✅ Страница "${page}" отображена`);
            
        } catch (error) {
            console.error('❌ Ошибка рендера страницы:', error);
            this.showError('Ошибка отображения страницы');
        }
    }

    createHomePage() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="page">
                <div class="hero-section">
                    <div class="hero-text">
                        <h2>Академия АНБ</h2>
                        <p>Современное образование для врачей</p>
                    </div>
                </div>

                <div class="quick-nav">
                    <h3>Быстрый старт</h3>
                    <div class="grid">
                        <div class="card" onclick="app.renderPage('courses')">
                            <div class="card-icon">📚</div>
                            <div class="card-title">Курсы</div>
                            <div class="card-desc">${courses.length} курсов доступно</div>
                        </div>
                        <div class="card" onclick="app.showNotification('Материалы скоро будут доступны 🚀')">
                            <div class="card-icon">📋</div>
                            <div class="card-title">Материалы</div>
                            <div class="card-desc">Практические руководства</div>
                        </div>
                        <div class="card" onclick="app.renderPage('profile')">
                            <div class="card-icon">👤</div>
                            <div class="card-title">Профиль</div>
                            <div class="card-desc">Ваш прогресс</div>
                        </div>
                        <div class="card" onclick="app.showNotification('Чат с преподавателями скоро будет доступен 💬')">
                            <div class="card-icon">💬</div>
                            <div class="card-title">Чаты</div>
                            <div class="card-desc">Общение с коллегами</div>
                        </div>
                    </div>
                </div>

                <div class="content-section">
                    <h3>🎯 Популярные курсы</h3>
                    <div class="content-grid">
                        ${courses.map(course => `
                            <div class="content-card">
                                <div class="content-card-header">
                                    <div class="content-icon">📚</div>
                                </div>
                                <div class="content-card-body">
                                    <div class="content-title">${course.title}</div>
                                    <div class="content-description">${course.description}</div>
                                    <div class="content-meta">
                                        <span class="meta-item">⏱️ ${course.duration}</span>
                                        <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                    </div>
                                </div>
                                <div class="content-card-actions">
                                    <button class="btn btn-primary" onclick="app.startCourse(${course.id})">
                                        Начать обучение
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    createCoursesPage() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="page">
                <h2>📚 Все курсы</h2>
                <div class="content-grid">
                    ${courses.map(course => `
                        <div class="content-card">
                            <div class="content-title">${course.title}</div>
                            <div class="content-description">${course.description}</div>
                            <div class="content-meta">
                                <span>⏱️ ${course.duration}</span>
                                <span>💰 ${this.formatPrice(course.price)}</span>
                            </div>
                            <button class="btn btn-primary" onclick="app.startCourse(${course.id})">
                                Начать обучение
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createProfilePage() {
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-large">👤</div>
                    <div class="profile-name">${this.currentUser?.firstName || 'Пользователь'}</div>
                    <div class="profile-status">Участник Академии АНБ</div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Ваша активность</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <div class="stat-value">2</div>
                                <div class="stat-label">Курсов начато</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <div class="stat-value">12</div>
                                <div class="stat-label">Материалов изучено</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.showNotification('Редактирование профиля скоро будет доступно ✏️')">
                        ✏️ Редактировать профиль
                    </button>
                    <button class="btn btn-outline" onclick="app.showNotification('Настройки скоро будут доступны ⚙️')">
                        ⚙️ Настройки
                    </button>
                </div>
            </div>
        `;
    }

    startCourse(courseId) {
        this.showNotification(`🎓 Начинаем курс "${this.allContent.courses.find(c => c.id === courseId)?.title}"`);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    showNotification(message) {
        // Простое уведомление
        alert(message);
    }
}

// Глобальные функции
window.toggleSearch = function() {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        const isVisible = searchContainer.style.display !== 'none';
        searchContainer.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
    }
};

// Инициализация приложения когда DOM загружен
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, инициализируем приложение...');
    window.app = new AcademyApp();
});

// Также инициализируем если DOM уже загружен
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new AcademyApp();
    });
} else {
    window.app = new AcademyApp();
}
