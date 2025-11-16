// webapp/app.js - УПРОЩЕННАЯ РАБОЧАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация приложения Академии АНБ...');
        
        // Загрузка пользователя
        await this.loadUserData();
        
        // Загрузка контента
        await this.loadContent();
        
        // Показываем главную страницу
        this.renderPage('home');
        
        console.log('✅ Приложение готово к работе');
    }

    async loadUserData() {
        try {
            // Получаем ID пользователя из Telegram или используем демо
            let userId = this.getUserId();
            
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    firstName: 'Пользователь',
                    lastName: '',
                    username: 'user'
                })
            });

            const userResponse = await response.json();
            if (userResponse.success) {
                this.currentUser = userResponse.user;
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
                lastName: '',
                specialization: 'Невролог',
                city: 'Москва',
                email: 'demo@anb.ru',
                subscription: { 
                    status: 'active', 
                    type: 'admin',
                    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
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
                favorites: { 
                    courses: [1], 
                    podcasts: [], 
                    streams: [], 
                    videos: [], 
                    materials: [], 
                    watchLater: [] 
                },
                isAdmin: true,
                joinedAt: new Date('2024-01-01'),
                surveyCompleted: true,
                profileImage: null
            };
        }
    }

    getUserId() {
        // Пробуем получить ID из Telegram WebApp
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser?.id) {
                return tgUser.id;
            }
        }
        // Или используем ID администратора для тестирования
        return 898508164;
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            const data = await response.json();
            
            if (data.success) {
                this.allContent = data.data;
                console.log('✅ Контент загружен');
            } else {
                throw new Error('Failed to load content');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки контента:', error);
        }
    }

    renderPage(page) {
        this.currentPage = page;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) return;

        // Обновляем навигацию
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Рендерим страницу
        switch(page) {
            case 'home':
                mainContent.innerHTML = this.createHomePage();
                break;
            case 'courses':
                mainContent.innerHTML = this.createCoursesPage();
                break;
            case 'profile':
                mainContent.innerHTML = this.createProfilePage();
                break;
            default:
                mainContent.innerHTML = this.createHomePage();
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
                            <div class="card-desc">Профессиональное обучение</div>
                        </div>
                        <div class="card" onclick="app.showNotification('Сообщество в разработке 🚧')">
                            <div class="card-icon">👥</div>
                            <div class="card-title">Сообщество</div>
                            <div class="card-desc">Общение с коллегами</div>
                        </div>
                        <div class="card" onclick="app.renderPage('profile')">
                            <div class="card-icon">👤</div>
                            <div class="card-title">Профиль</div>
                            <div class="card-desc">Ваш прогресс</div>
                        </div>
                        ${this.currentUser?.isAdmin ? `
                        <div class="card" onclick="app.goToAdminPanel()">
                            <div class="card-icon">🔧</div>
                            <div class="card-title">Админ-панель</div>
                            <div class="card-desc">Управление системой</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="section-header">
                    <h3>Популярные курсы</h3>
                </div>
                <div class="content-grid">
                    ${courses.length > 0 ? courses.slice(0, 3).map(course => `
                        <div class="content-card">
                            <div class="content-card-header">
                                <div class="content-icon">📚</div>
                                <button class="favorite-btn">☆</button>
                            </div>
                            <div class="content-card-body">
                                <div class="content-title">${course.title}</div>
                                <div class="content-description">${course.description}</div>
                                <div class="content-meta">
                                    <span class="meta-item">⏱️ ${course.duration}</span>
                                    <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                    <span class="meta-item">📚 ${course.modules} модулей</span>
                                </div>
                            </div>
                            <div class="content-card-actions">
                                <button class="btn btn-primary" onclick="app.showNotification('Курс \"${course.title}\" начат 🎓')">
                                    Начать курс
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-text">Курсы загружаются</div>
                            <div class="empty-hint">Скоро здесь появятся учебные материалы</div>
                        </div>
                    `}
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
                    ${courses.length > 0 ? courses.map(course => `
                        <div class="content-card">
                            <div class="content-card-header">
                                <div class="content-icon">📚</div>
                                <button class="favorite-btn">☆</button>
                            </div>
                            <div class="content-card-body">
                                <div class="content-title">${course.title}</div>
                                <div class="content-description">${course.description}</div>
                                <div class="content-meta">
                                    <span class="meta-item">⏱️ ${course.duration}</span>
                                    <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                    <span class="meta-item">📚 ${course.modules} модулей</span>
                                    ${course.category ? `<span class="meta-item">🏷️ ${course.category}</span>` : ''}
                                </div>
                            </div>
                            <div class="content-card-actions">
                                <button class="btn btn-outline">📥 Позже</button>
                                <button class="btn btn-primary" onclick="app.showNotification('Курс \"${course.title}\" начат 🎓')">
                                    Начать обучение
                                </button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-text">Курсы загружаются</div>
                            <div class="empty-hint">Попробуйте обновить страницу</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createProfilePage() {
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar-large">👤</div>
                        <div class="profile-info">
                            <div class="profile-name">${this.currentUser.firstName}</div>
                            <div class="profile-status">Участник Академии АНБ</div>
                            <div class="profile-badge">${this.currentUser.isAdmin ? '👑 Администратор' : '💎 Активный участник'}</div>
                        </div>
                    </div>
                    
                    <div class="subscription-info">
                        <div class="subscription-status active">
                            <div class="status-icon">✅</div>
                            <div class="status-text">
                                <div>Подписка: активна</div>
                                <div class="status-date">Бессрочный доступ</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Ваша активность</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.currentUser.progress.steps.coursesBought}</div>
                                <div class="stat-label">Курсов начато</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.currentUser.progress.steps.materialsWatched}</div>
                                <div class="stat-label">Материалов изучено</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.currentUser.progress.steps.eventsParticipated}</div>
                                <div class="stat-label">Мероприятий</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💾</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.currentUser.progress.steps.materialsSaved}</div>
                                <div class="stat-label">Сохранено</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    ${this.currentUser.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.goToAdminPanel()">🔧 Админ-панель</button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="app.showNotification('Настройки в разработке 🚧')">⚙️ Настройки</button>
                </div>
            </div>
        `;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    goToAdminPanel() {
        window.location.href = '/admin.html';
    }
}

// Глобальные функции
window.toggleSearch = function() {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
    }
};

// Инициализация приложения
const app = new AcademyApp();
