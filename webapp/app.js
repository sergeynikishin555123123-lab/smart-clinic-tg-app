// webapp/app.js - Упрощенная рабочая версия
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.isAdmin = false;
        this.isSuperAdmin = false;
        
        this.state = {
            favorites: {
                courses: [],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: [],
                articles: [],
                doctors: [],
                playlists: []
            },
            searchQuery: '',
            theme: 'dark'
        };
        
        this.config = {
            API_BASE_URL: window.location.origin
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация Академии АНБ...');
        
        try {
            await this.loadUserData();
            await this.loadContent();
            this.renderPage('home');
            this.setupEventListeners();
            
            console.log('✅ Приложение готово');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.createDemoUser();
            this.createDemoContent();
            this.renderPage('home');
        }
    }

    async loadUserData() {
        try {
            const userId = this.getUserId();
            
            const response = await this.apiCall('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: userId,
                    firstName: 'Пользователь',
                    username: 'user'
                })
            });

            if (response.success && response.user) {
                this.currentUser = response.user;
                this.isAdmin = this.currentUser.isAdmin || false;
                this.isSuperAdmin = this.currentUser.isSuperAdmin || false;
                this.state.favorites = this.currentUser.favorites || this.state.favorites;
                
                console.log('✅ Пользователь загружен:', this.currentUser.firstName);
            } else {
                throw new Error('Invalid user data');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            throw error;
        }
    }

    async loadContent() {
        try {
            const response = await this.apiCall('/api/content');
            
            if (response.success) {
                this.allContent = response.data;
                console.log('✅ Контент загружен');
            } else {
                throw new Error('Failed to load content');
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
            throw error;
        }
    }

    async apiCall(url, options = {}) {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}${url}`, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Call failed: ${url}`, error);
            throw error;
        }
    }

    getUserId() {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe?.user;
            return tgUser?.id || 898508164;
        }
        return 898508164;
    }

    createDemoUser() {
        this.currentUser = {
            id: 898508164,
            firstName: 'Демо Пользователь',
            specialization: 'Невролог',
            city: 'Москва',
            email: 'demo@anb-academy.ru',
            subscription: { 
                status: 'active', 
                type: 'premium'
            },
            progress: {
                level: 'Понимаю',
                experience: 1250,
                steps: {
                    coursesBought: 3,
                    modulesCompleted: 12
                }
            },
            favorites: this.state.favorites,
            isAdmin: true,
            isSuperAdmin: true,
            joinedAt: new Date('2024-01-01').toISOString(),
            surveyCompleted: true
        };
        
        this.isAdmin = true;
        this.isSuperAdmin = true;
    }

    createDemoContent() {
        this.allContent = {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике невролога',
                    description: '6 модулей по современным мануальным методикам',
                    price: 25000,
                    duration: '12 недель',
                    modules: 6,
                    category: 'Мануальные техники',
                    level: 'advanced',
                    image_url: '/webapp/assets/course-manual.svg',
                    students_count: 156,
                    rating: 4.8,
                    featured: true
                },
                {
                    id: 2,
                    title: 'Неврологическая диагностика: от основ к практике',
                    description: '5 модулей по современной неврологической диагностике',
                    price: 18000,
                    duration: '8 недель',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate',
                    image_url: '/webapp/assets/course-diagnosis.svg',
                    students_count: 234,
                    rating: 4.6,
                    featured: true
                }
            ],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: [],
            promotions: [],
            chats: []
        };
    }

    renderPage(page) {
        this.currentPage = page;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) return;

        // Обновляем активные кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        try {
            mainContent.innerHTML = this.getPageHTML(page);
            this.initializePage(page);
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            mainContent.innerHTML = '<div class="error">Ошибка загрузки страницы</div>';
        }
    }

    getPageHTML(page) {
        const pages = {
            home: this.createHomePage(),
            courses: this.createCoursesPage(),
            profile: this.createProfilePage(),
            admin: this.createAdminPage()
        };

        return pages[page] || '<div class="error">Страница не найдена</div>';
    }

    createHomePage() {
        const stats = this.calculateHomeStats();
        
        return `
            <div class="page home-page">
                <div class="hero-section">
                    <div class="hero-content">
                        <h2>Академия АНБ</h2>
                        <p>Современное образование для врачей</p>
                        <div class="hero-stats">
                            <div class="hero-stat">
                                <div class="stat-value">${stats.courses}+</div>
                                <div class="stat-label">Курсов</div>
                            </div>
                            <div class="hero-stat">
                                <div class="stat-value">${stats.students}+</div>
                                <div class="stat-label">Студентов</div>
                            </div>
                            <div class="hero-stat">
                                <div class="stat-value">${stats.experts}</div>
                                <div class="stat-label">Экспертов</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.currentUser?.progress ? `
                <div class="progress-section">
                    <h3>Ваш прогресс</h3>
                    <div class="progress-cards">
                        <div class="progress-card">
                            <div class="progress-icon">📚</div>
                            <div class="progress-info">
                                <div class="progress-value">${this.currentUser.progress.steps.coursesBought}</div>
                                <div class="progress-label">Курсов</div>
                            </div>
                        </div>
                        <div class="progress-card">
                            <div class="progress-icon">🎯</div>
                            <div class="progress-info">
                                <div class="progress-value">${this.currentUser.progress.steps.modulesCompleted}</div>
                                <div class="progress-label">Модулей</div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="navigation-grid">
                    <div class="nav-card" onclick="app.renderPage('courses')">
                        <div class="nav-icon">📚</div>
                        <div class="nav-content">
                            <div class="nav-title">Курсы</div>
                            <div class="nav-description">Доступные обучающие программы</div>
                        </div>
                        <div class="nav-badge">${this.allContent.courses?.length || 0}</div>
                    </div>
                    <div class="nav-card">
                        <div class="nav-icon">🎧</div>
                        <div class="nav-content">
                            <div class="nav-title">АНБ FM</div>
                            <div class="nav-description">Аудио подкасты и интервью</div>
                        </div>
                        <div class="nav-badge">${this.allContent.podcasts?.length || 0}</div>
                    </div>
                    <div class="nav-card">
                        <div class="nav-icon">📹</div>
                        <div class="nav-content">
                            <div class="nav-title">Эфиры</div>
                            <div class="nav-description">Прямые трансляции и разборы</div>
                        </div>
                        <div class="nav-badge">${this.allContent.streams?.length || 0}</div>
                    </div>
                    <div class="nav-card" onclick="app.renderPage('profile')">
                        <div class="nav-icon">👤</div>
                        <div class="nav-content">
                            <div class="nav-title">Профиль</div>
                            <div class="nav-description">Личный кабинет</div>
                        </div>
                    </div>
                </div>

                ${this.allContent.courses?.length > 0 ? `
                <div class="recommended-section">
                    <div class="section-header">
                        <h3>Рекомендуемые курсы</h3>
                        <a href="javascript:void(0)" onclick="app.renderPage('courses')" class="see-all">Все курсы →</a>
                    </div>
                    <div class="recommended-grid">
                        ${this.allContent.courses.slice(0, 2).map(course => `
                            <div class="course-card" onclick="app.openCourseDetail(${course.id})">
                                <div class="card-image">
                                    <img src="${course.image_url}" alt="${course.title}" 
                                         onerror="this.src='/webapp/assets/course-default.jpg'">
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${course.title}</h3>
                                    <p class="card-description">${course.description}</p>
                                    <div class="card-meta">
                                        <span class="meta-item">⏱️ ${course.duration}</span>
                                        <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                    </div>
                                    <div class="card-actions">
                                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.purchaseCourse(${course.id})">
                                            Подробнее
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="quick-actions">
                    <h3>Быстрые действия</h3>
                    <div class="actions-grid">
                        <button class="action-btn" onclick="app.renderPage('profile')">
                            <div class="action-icon">👤</div>
                            <div class="action-text">Профиль</div>
                        </button>
                        <button class="action-btn" onclick="app.showSupport()">
                            <div class="action-icon">🆘</div>
                            <div class="action-text">Поддержка</div>
                        </button>
                        ${this.isAdmin ? `
                        <button class="action-btn" onclick="app.renderPage('admin')">
                            <div class="action-icon">🔧</div>
                            <div class="action-text">Админ</div>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    createCoursesPage() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="page courses-page">
                <div class="page-header">
                    <h2>📚 Курсы</h2>
                </div>
                
                <div class="content-grid">
                    ${courses.length > 0 ? 
                        courses.map(course => `
                            <div class="course-card" onclick="app.openCourseDetail(${course.id})">
                                <div class="card-image">
                                    <img src="${course.image_url}" alt="${course.title}" 
                                         onerror="this.src='/webapp/assets/course-default.jpg'">
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${course.title}</h3>
                                    <p class="card-description">${course.description}</p>
                                    <div class="card-meta">
                                        <span class="meta-item">⏱️ ${course.duration}</span>
                                        <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                        <span class="meta-item">⭐ ${course.rating}</span>
                                    </div>
                                    <div class="card-actions">
                                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.purchaseCourse(${course.id})">
                                            Подробнее
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : 
                        '<div class="empty-state">Курсы не найдены</div>'
                    }
                </div>
            </div>
        `;
    }

    createProfilePage() {
        if (!this.currentUser) return '<div class="loading">Загрузка...</div>';

        const progress = this.currentUser.progress || {};
        const subscription = this.currentUser.subscription || {};
        
        return `
            <div class="page profile-page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">👤</div>
                        <div class="profile-info">
                            <h2>${this.currentUser.firstName}</h2>
                            <p>${this.currentUser.specialization || 'Специализация не указана'}</p>
                            <p>📍 ${this.currentUser.city || 'Город не указан'}</p>
                            <p>📧 ${this.currentUser.email || 'Email не указан'}</p>
                        </div>
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Статистика обучения</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.coursesBought || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.modulesCompleted || 0}</div>
                            <div class="stat-label">Модулей</div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.editProfile()">
                        ✏️ Редактировать профиль
                    </button>
                    ${this.isAdmin ? `
                    <button class="btn btn-secondary" onclick="app.renderPage('admin')">
                        🔧 Админ-панель
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createAdminPage() {
        if (!this.isAdmin && !this.isSuperAdmin) {
            return `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Доступ запрещен</h3>
                    <p>У вас нет прав для просмотра этой страницы</p>
                </div>
            `;
        }

        return `
            <div class="page admin-page">
                <div class="admin-header">
                    <h2>${this.isSuperAdmin ? '🛠️ Супер-админ' : '🔧 Админ'}</h2>
                </div>

                <div class="admin-actions">
                    <button class="btn btn-primary" onclick="app.showAddCourseForm()">
                        ➕ Добавить курс
                    </button>
                    <button class="btn btn-outline" onclick="app.viewStatistics()">
                        📊 Статистика
                    </button>
                </div>

                <div class="admin-content">
                    <h3>Управление контентом</h3>
                    <div class="content-list">
                        ${this.allContent.courses?.map(course => `
                            <div class="admin-content-item">
                                <img src="${course.image_url}" alt="${course.title}">
                                <div class="content-info">
                                    <h4>${course.title}</h4>
                                    <p>${course.description}</p>
                                </div>
                                <div class="content-actions">
                                    <button class="btn btn-small" onclick="app.editCourse(${course.id})">
                                        ✏️ Редактировать
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<div class="empty-state">Нет контента</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    calculateHomeStats() {
        return {
            courses: this.allContent.courses?.length || 0,
            students: this.allContent.courses?.reduce((sum, course) => sum + (course.students_count || 0), 0) || 0,
            experts: 25
        };
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    setupEventListeners() {
        // Навигация
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });
    }

    initializePage(page) {
        // Инициализация специфичная для страницы
        if (page === 'home') {
            this.setupHomeInteractions();
        }
    }

    setupHomeInteractions() {
        // Дополнительные взаимодействия на домашней странице
        const navCards = document.querySelectorAll('.nav-card');
        navCards.forEach(card => {
            card.addEventListener('click', () => {
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                }, 150);
            });
        });
    }

    // Методы взаимодействия
    openCourseDetail(courseId) {
        this.showNotification(`Открытие курса ${courseId}`, 'info');
    }

    purchaseCourse(courseId) {
        this.showNotification(`Покупка курса ${courseId}`, 'info');
    }

    editProfile() {
        this.showNotification('Редактирование профиля', 'info');
    }

    showSupport() {
        this.showNotification('Поддержка: support@anb-academy.ru', 'info');
    }

    showAddCourseForm() {
        this.showNotification('Добавление курса', 'info');
    }

    viewStatistics() {
        this.showNotification('Просмотр статистики', 'info');
    }

    editCourse(courseId) {
        this.showNotification(`Редактирование курса ${courseId}`, 'info');
    }

    showNotification(message, type = 'info') {
        // Простая реализация уведомлений
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AcademyApp();
});
