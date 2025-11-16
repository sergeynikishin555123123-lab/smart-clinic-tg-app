// webapp/app.js - ВЕРСИЯ ДЛЯ TELEGRAM WEBAPP
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.isAdmin = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация приложения Академии АНБ...');
        
        // Инициализация Telegram WebApp
        this.initTelegramWebApp();
        
        await this.loadUserData();
        await this.loadContent();
        
        this.renderPage('home');
        this.setupNavigation();
        
        console.log('✅ Приложение готово к работе');
    }

    initTelegramWebApp() {
        if (window.Telegram && Telegram.WebApp) {
            // Расширяем на весь экран
            Telegram.WebApp.expand();
            
            // Включаем кнопку "Назад"
            Telegram.WebApp.BackButton.show();
            Telegram.WebApp.BackButton.onClick(() => {
                this.handleBackButton();
            });
            
            // Настраиваем основную кнопку
            Telegram.WebApp.MainButton.setText('Открыть меню');
            Telegram.WebApp.MainButton.show();
            Telegram.WebApp.MainButton.onClick(() => {
                this.showMainMenu();
            });
            
            console.log('✅ Telegram WebApp инициализирован');
        } else {
            console.log('ℹ️ Запуск вне Telegram');
        }
    }

    handleBackButton() {
        if (this.currentPage !== 'home') {
            this.renderPage('home');
        } else {
            Telegram.WebApp.close();
        }
    }

    showMainMenu() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: 'Меню',
                message: 'Выберите действие:',
                buttons: [
                    { id: 'courses', type: 'default', text: '📚 Курсы' },
                    { id: 'profile', type: 'default', text: '👤 Профиль' },
                    { type: 'cancel', text: 'Закрыть' }
                ]
            }, (buttonId) => {
                if (buttonId === 'courses') {
                    this.renderPage('courses');
                } else if (buttonId === 'profile') {
                    this.renderPage('profile');
                }
            });
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
            let userId = this.getUserId();
            let firstName = 'Пользователь';
            let lastName = '';
            let username = 'user';

            // Получаем данные из Telegram WebApp
            if (window.Telegram && Telegram.WebApp) {
                const tgUser = Telegram.WebApp.initDataUnsafe.user;
                if (tgUser) {
                    userId = tgUser.id;
                    firstName = tgUser.first_name;
                    lastName = tgUser.last_name || '';
                    username = tgUser.username || 'user';
                }
            }
            
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    firstName: firstName,
                    lastName: lastName,
                    username: username
                })
            });

            const userResponse = await response.json();
            if (userResponse.success) {
                this.currentUser = userResponse.user;
                this.isAdmin = this.currentUser.isAdmin;
                
                if (this.isAdmin) {
                    const adminBadge = document.getElementById('adminBadge');
                    if (adminBadge) adminBadge.style.display = 'block';
                }
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
            this.createDemoUser();
        }
    }

    getUserId() {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser?.id) return tgUser.id;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('userId') || 898508164;
    }

    createDemoUser() {
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
            surveyCompleted: true
        };
        this.isAdmin = true;
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) adminBadge.style.display = 'block';
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            const data = await response.json();
            
            if (data.success) {
                this.allContent = data.data;
                console.log('📚 Контент загружен:', this.allContent);
            } else {
                throw new Error('Failed to load content');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки контента:', error);
            this.createDemoContent();
        }
    }

    createDemoContent() {
        this.allContent = {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике',
                    description: '6 модулей по современным мануальным методикам',
                    price: 15000,
                    duration: '12 часов',
                    modules: 6,
                    category: 'Неврология',
                    level: 'advanced'
                },
                {
                    id: 2,
                    title: 'Неврология для практикующих врачей',
                    description: 'Основы неврологической диагностики',
                    price: 12000,
                    duration: '10 часов',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate'
                }
            ],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: []
        };
    }

    renderPage(page) {
        this.currentPage = page;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) return;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Обновляем кнопку "Назад" в Telegram WebApp
        if (window.Telegram && Telegram.WebApp) {
            if (page === 'home') {
                Telegram.WebApp.BackButton.hide();
            } else {
                Telegram.WebApp.BackButton.show();
            }
        }

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
            case 'admin':
                if (this.isAdmin) {
                    mainContent.innerHTML = this.createAdminPage();
                } else {
                    mainContent.innerHTML = this.createAccessDeniedPage();
                }
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
                        ${this.isAdmin ? `
                        <div class="card" onclick="app.renderPage('admin')">
                            <div class="card-icon">🔧</div>
                            <div class="card-title">Админка</div>
                            <div class="card-desc">Управление системой</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="section-header">
                    <h3>Популярные курсы</h3>
                </div>
                <div class="content-grid">
                    ${courses.length > 0 ? courses.slice(0, 3).map(course => this.createCourseCard(course)).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-text">Курсы загружаются</div>
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
                    ${courses.length > 0 ? courses.map(course => this.createCourseCard(course)).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-text">Курсы не найдены</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createCourseCard(course) {
        return `
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
                    <button class="btn btn-primary" onclick="app.startCourse(${course.id})">
                        ${course.price > 0 ? 'Купить курс' : 'Начать обучение'}
                    </button>
                </div>
            </div>
        `;
    }

    createProfilePage() {
        if (!this.currentUser) return '<div class="loading">Загрузка профиля...</div>';
        
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
                    </div>
                </div>

                <div class="profile-actions">
                    ${this.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.renderPage('admin')">🔧 Админ-панель</button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="app.showNotification('Настройки в разработке 🚧')">⚙️ Настройки</button>
                </div>
            </div>
        `;
    }

    createAdminPage() {
        return `
            <div class="page">
                <div class="admin-header">
                    <h2>🔧 Панель управления</h2>
                    <div class="admin-badge">Администратор</div>
                </div>

                <div class="admin-stats">
                    <h3>📈 Статистика системы</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-value">150</div>
                                <div class="stat-label">Пользователей</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <div class="stat-value">3</div>
                                <div class="stat-label">Курсов</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-info">
                                <div class="stat-value">130 500 ₽</div>
                                <div class="stat-label">Доход</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="admin-actions">
                    <h3>🚀 Быстрые действия</h3>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="app.showNotification('Добавление курса в разработке 🚧')">
                            ➕ Добавить курс
                        </button>
                        <button class="btn btn-secondary" onclick="app.showNotification('Управление пользователями в разработке 🚧')">
                            👥 Управление пользователями
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createAccessDeniedPage() {
        return `
            <div class="page">
                <div class="error">
                    <div class="error-icon">❌</div>
                    <div class="error-text">Доступ запрещен</div>
                    <div class="error-hint">У вас нет прав администратора</div>
                    <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
                </div>
            </div>
        `;
    }

    startCourse(courseId) {
        this.showNotification('🎓 Начинаем обучение...');
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    showNotification(message, type = 'info') {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: type === 'error' ? 'Ошибка' : 'Уведомление',
                message: message
            });
        } else {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
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
