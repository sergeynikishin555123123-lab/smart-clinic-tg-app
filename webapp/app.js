// webapp/app.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isInitialized = false;
        
        this.state = {
            viewMode: 'grid',
            favorites: {
                courses: [],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: []
            }
        };
        
        console.log('🎓 Академия АНБ инициализируется...');
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация Академии АНБ...');
        
        try {
            // Безопасная инициализация Telegram WebApp
            await this.safeInitializeTelegramWebApp();
            
            // Сразу показываем интерфейс
            this.showAppInterface();
            
            // Затем загружаем данные
            await Promise.all([
                this.loadUserData(),
                this.loadContent()
            ]);
            
            // Обновляем интерфейс с данными
            this.renderPage('home');
            this.setupEventListeners();
            
            this.isInitialized = true;
            
            console.log('✅ Приложение готово к работе');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showFatalError('Не удалось загрузить приложение: ' + error.message);
        }
    }

    async safeInitializeTelegramWebApp() {
        return new Promise((resolve) => {
            try {
                if (window.Telegram && Telegram.WebApp) {
                    console.log('🔧 Инициализация Telegram WebApp...');
                    
                    try {
                        Telegram.WebApp.ready();
                        Telegram.WebApp.expand();
                        console.log('✅ Telegram.WebApp инициализирован');
                    } catch (e) {
                        console.warn('Telegram.WebApp инициализация не удалась:', e);
                    }
                } else {
                    console.log('ℹ️ Telegram WebApp не обнаружен, работаем в браузерном режиме');
                }
                
                resolve();
            } catch (error) {
                console.warn('⚠️ Ошибка инициализации Telegram WebApp:', error);
                resolve();
            }
        });
    }

    showAppInterface() {
        const loadingScreen = document.getElementById('loadingScreen');
        const errorScreen = document.getElementById('errorScreen');
        const appContainer = document.getElementById('app');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (errorScreen) errorScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
        
        console.log('📱 Интерфейс приложения показан');
    }

    async loadUserData() {
        console.log('👤 Загрузка данных пользователя...');
        
        try {
            // Создаем демо-пользователя для немедленного отображения
            this.createDemoUser();
            
            // Пытаемся загрузить реальные данные
            const response = await this.safeApiCall('/api/user', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    user: {
                        id: 898508164,
                        first_name: 'Демо Пользователь',
                        username: 'demo_user'
                    }
                })
            });

            if (response && response.success && response.user) {
                this.currentUser = response.user;
                this.isAdmin = this.currentUser.isAdmin || false;
                this.isSuperAdmin = this.currentUser.isSuperAdmin || false;
                this.state.favorites = this.currentUser.favorites || this.state.favorites;
                
                this.updateAdminBadge();
                console.log('✅ Данные пользователя загружены');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            // Продолжаем работу с демо-пользователем
        }
    }

    async loadContent() {
        console.log('📚 Загрузка контента...');
        
        try {
            const response = await this.safeApiCall('/api/content');
            
            if (response && response.success) {
                this.allContent = response.data;
                console.log('✅ Контент загружен');
            } else {
                throw new Error('Не удалось загрузить контент');
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
            this.createDemoContent();
        }
    }

    async safeApiCall(url, options = {}) {
        try {
            console.log(`🌐 API Call: ${url}`);
            
            const response = await fetch(`${window.location.origin}${url}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`❌ API Call failed: ${url}`, error);
            return null;
        }
    }

    // Основные методы рендеринга
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

        try {
            console.log(`📄 Рендер страницы: ${page}`);
            mainContent.innerHTML = this.getPageHTML(page);
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showNotification('Ошибка отображения страницы', 'error');
        }
    }

    getPageHTML(page) {
        const pages = {
            home: this.createHomePage(),
            courses: this.createCoursesPage(),
            podcasts: this.createPodcastsPage(),
            streams: this.createStreamsPage(),
            videos: this.createVideosPage(),
            materials: this.createMaterialsPage(),
            events: this.createEventsPage(),
            favorites: this.createFavoritesPage(),
            profile: this.createProfilePage(),
            admin: this.createAdminPage()
        };

        return pages[page] || this.createNotFoundPage();
    }

    // HOME PAGE
    createHomePage() {
        const stats = this.calculateHomeStats();
        const recommendedCourses = this.getRecommendedCourses();
        
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
                        <div class="progress-card">
                            <div class="progress-icon">⏱️</div>
                            <div class="progress-info">
                                <div class="progress-value">${this.currentUser.progress.steps.materialsWatched}</div>
                                <div class="progress-label">Материалов</div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="navigation-grid">
                    ${this.createNavCard('courses', '📚', 'Курсы', this.allContent.courses?.length || 0)}
                    ${this.createNavCard('podcasts', '🎧', 'АНБ FM', this.allContent.podcasts?.length || 0)}
                    ${this.createNavCard('streams', '📹', 'Эфиры', this.allContent.streams?.length || 0)}
                    ${this.createNavCard('videos', '🎯', 'Видео', this.allContent.videos?.length || 0)}
                    ${this.createNavCard('materials', '📋', 'Материалы', this.allContent.materials?.length || 0)}
                    ${this.createNavCard('events', '🗺️', 'Мероприятия', this.allContent.events?.length || 0)}
                    ${this.createNavCard('favorites', '❤️', 'Избранное', Object.values(this.state.favorites).flat().length)}
                    ${this.createNavCard('profile', '👤', 'Профиль', '')}
                </div>

                ${recommendedCourses.length > 0 ? `
                <div class="recommended-section">
                    <div class="section-header">
                        <h3>Рекомендуемые курсы</h3>
                        <a href="javascript:void(0)" onclick="app.renderPage('courses')" class="see-all">Все курсы →</a>
                    </div>
                    <div class="recommended-grid">
                        ${recommendedCourses.slice(0, 3).map(course => `
                            <div class="course-card featured" onclick="app.openCourseDetail(${course.id})">
                                <div class="card-badge">Рекомендуем</div>
                                <div class="card-image">
                                    <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${course.title}</h3>
                                    <p class="card-description">${course.description}</p>
                                    <div class="card-meta">
                                        <span class="meta-item">⏱️ ${course.duration}</span>
                                        <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                    </div>
                                    <div class="card-actions">
                                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.openCourseDetail(${course.id})">
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
                        <button class="action-btn" onclick="app.renderPage('favorites')">
                            <div class="action-icon">❤️</div>
                            <div class="action-text">Избранное</div>
                        </button>
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

    createNavCard(section, icon, title, count) {
        return `
            <div class="nav-card" onclick="app.renderPage('${section}')">
                <div class="nav-icon">${icon}</div>
                <div class="nav-content">
                    <div class="nav-title">${title}</div>
                </div>
                ${count ? `<div class="nav-badge">${count}</div>` : ''}
            </div>
        `;
    }

    // Другие страницы (упрощенные версии)
    createCoursesPage() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="page courses-page">
                <div class="page-header">
                    <h2>📚 Курсы</h2>
                </div>
                
                <div class="content-container">
                    ${courses.length > 0 ? 
                        this.renderCoursesGrid(courses) : 
                        this.createEmptyState('courses')
                    }
                </div>
            </div>
        `;
    }

    renderCoursesGrid(courses) {
        return `
            <div class="content-grid">
                ${courses.map(course => `
                    <div class="content-card course-card" onclick="app.openCourseDetail(${course.id})">
                        ${course.discount > 0 ? `
                            <div class="discount-badge">-${course.discount}%</div>
                        ` : ''}
                        
                        <div class="card-image">
                            <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">${course.title}</h3>
                            <p class="card-description">${course.description}</p>
                            
                            <div class="card-meta">
                                <span class="meta-item">⏱️ ${course.duration}</span>
                                <span class="meta-item">📦 ${course.modules} модулей</span>
                            </div>
                            
                            <div class="card-footer">
                                <div class="price-section">
                                    ${course.discount > 0 ? `
                                        <div class="price-original">${this.formatPrice(course.original_price || course.price * 1.2)}</div>
                                    ` : ''}
                                    <div class="price-current">${this.formatPrice(course.price)}</div>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-primary btn-small" 
                                            onclick="event.stopPropagation(); app.openCourseDetail(${course.id})">
                                        Подробнее
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createPodcastsPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                </div>
                ${this.createEmptyState('podcasts')}
            </div>
        `;
    }

    createStreamsPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📹 Эфиры</h2>
                </div>
                ${this.createEmptyState('streams')}
            </div>
        `;
    }

    createVideosPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎯 Видео</h2>
                </div>
                ${this.createEmptyState('videos')}
            </div>
        `;
    }

    createMaterialsPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📋 Материалы</h2>
                </div>
                ${this.createEmptyState('materials')}
            </div>
        `;
    }

    createEventsPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🗺️ Мероприятия</h2>
                </div>
                ${this.createEmptyState('events')}
            </div>
        `;
    }

    createFavoritesPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>❤️ Избранное</h2>
                </div>
                ${this.createEmptyState('favorites')}
            </div>
        `;
    }

    createProfilePage() {
        return `
            <div class="page profile-page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">👤</div>
                        <div class="profile-info">
                            <h2>${this.currentUser?.firstName || 'Пользователь'}</h2>
                            <p>${this.currentUser?.isSuperAdmin ? '🛠️ Супер-админ' : this.currentUser?.isAdmin ? '🔧 Админ' : '👤 Пользователь'}</p>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.showSettings()">
                        ⚙️ Настройки
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
        if (!this.isAdmin) {
            return this.createAccessDeniedPage();
        }

        return `
            <div class="page admin-page">
                <div class="admin-header">
                    <h2>${this.isSuperAdmin ? '🛠️ Супер-админ' : '🔧 Админ'}</h2>
                </div>

                <div class="admin-section">
                    <h3>Управление контентом</h3>
                    <div class="admin-actions">
                        <button class="btn btn-primary" onclick="app.showAddContentForm('courses')">
                            ➕ Добавить курс
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createAccessDeniedPage() {
        return `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Доступ запрещен</h3>
                <p>У вас нет прав для просмотра этой страницы</p>
                <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
            </div>
        `;
    }

    createEmptyState(type) {
        const types = {
            courses: { icon: '📚', title: 'Курсы не найдены' },
            podcasts: { icon: '🎧', title: 'Подкасты не найдены' },
            streams: { icon: '📹', title: 'Эфиры не найдены' },
            videos: { icon: '🎯', title: 'Видео не найдены' },
            materials: { icon: '📋', title: 'Материалы не найдены' },
            events: { icon: '🗺️', title: 'Мероприятия не найдены' },
            favorites: { icon: '❤️', title: 'В избранном пока пусто', description: 'Добавляйте курсы и материалы в избранное' }
        };
        
        const state = types[type] || { icon: '📚', title: 'Контент не найден' };
        
        return `
            <div class="empty-state">
                <div class="empty-icon">${state.icon}</div>
                <div class="empty-title">${state.title}</div>
                ${state.description ? `<div class="empty-description">${state.description}</div>` : ''}
                ${type === 'favorites' ? `
                    <button class="btn btn-primary" onclick="app.renderPage('courses')">
                        Перейти к курсам
                    </button>
                ` : ''}
            </div>
        `;
    }

    createNotFoundPage() {
        return `
            <div class="error-state">
                <div class="error-icon">🔍</div>
                <h3>Страница не найдена</h3>
                <p>Запрашиваемая страница не существует</p>
                <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
            </div>
        `;
    }

    // Вспомогательные методы
    calculateHomeStats() {
        return {
            courses: this.allContent.stats?.totalCourses || this.allContent.courses?.length || 0,
            students: this.allContent.stats?.totalUsers || 0,
            experts: 25
        };
    }

    getRecommendedCourses() {
        return this.allContent.courses
            ?.filter(course => course.featured || course.popular)
            .slice(0, 3) || [];
    }

    createDemoUser() {
        this.currentUser = {
            id: 898508164,
            firstName: 'Демо Пользователь',
            isAdmin: true,
            isSuperAdmin: true,
            favorites: {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: []
            },
            progress: {
                level: 'Понимаю',
                experience: 1250,
                steps: {
                    coursesBought: 3,
                    modulesCompleted: 2,
                    materialsWatched: 12
                }
            }
        };
        
        this.isAdmin = true;
        this.isSuperAdmin = true;
        this.updateAdminBadge();
        this.state.favorites = this.currentUser.favorites;
        
        console.log('✅ Демо-пользователь создан');
    }

    createDemoContent() {
        this.allContent = {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике невролога',
                    description: '6 модулей по современным мануальным методикам',
                    price: 25000,
                    discount: 16,
                    duration: '12 недель',
                    modules: 6,
                    category: 'Мануальные техники',
                    level: 'advanced',
                    students_count: 156,
                    rating: 4.8,
                    featured: true,
                    image_url: '/webapp/assets/course-default.jpg'
                },
                {
                    id: 2,
                    title: 'Неврологическая диагностика',
                    description: '5 модулей по современной диагностике',
                    price: 18000,
                    duration: '8 недель',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate',
                    students_count: 234,
                    rating: 4.6,
                    featured: true,
                    image_url: '/webapp/assets/course-default.jpg'
                }
            ],
            stats: {
                totalUsers: 1567,
                totalCourses: 12,
                totalMaterials: 45
            }
        };
        
        console.log('✅ Демо-контент создан');
    }

    updateAdminBadge() {
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            if (this.isSuperAdmin) {
                adminBadge.innerHTML = '🛠️ Супер-админ';
                adminBadge.style.display = 'flex';
            } else if (this.isAdmin) {
                adminBadge.innerHTML = '🔧 Админ';
                adminBadge.style.display = 'flex';
            } else {
                adminBadge.style.display = 'none';
            }
        }
    }

    // Вспомогательные методы форматирования
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    // Методы для работы с UI
    setupEventListeners() {
        // Обработчики навигационных кнопок
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });

        console.log('✅ Обработчики событий установлены');
    }

    // Методы для работы с уведомлениями
    showNotification(message, type = 'info') {
        console.log(`📢 Уведомление [${type}]: ${message}`);
        
        // Простая реализация уведомлений
        alert(message); // Временное решение
    }

    showFatalError(message) {
        console.error('💥 Фатальная ошибка:', message);
        
        const errorScreen = document.getElementById('errorScreen');
        const errorMessage = document.getElementById('errorMessage');
        const loadingScreen = document.getElementById('loadingScreen');
        const appContainer = document.getElementById('app');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'none';
        if (errorScreen) {
            errorScreen.style.display = 'flex';
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }
    }

    // Заглушки для функциональности
    openCourseDetail(courseId) {
        this.showNotification('📚 Детальная страница курса в разработке', 'info');
    }

    showAddContentForm(type) {
        this.showNotification(`📝 Добавление ${type} в разработке`, 'info');
    }

    showSupport() {
        this.showNotification('💬 Поддержка: @anb_academy_support\n📧 support@anb-academy.ru', 'info');
    }

    showSettings() {
        this.showNotification('⚙️ Настройки в разработке', 'info');
    }
}

// Глобальная обработка ошибок
window.addEventListener('error', function(event) {
    console.error('🚨 Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});

// Экспорт для глобального доступа
window.AcademyApp = AcademyApp;

console.log('✅ AcademyApp class loaded');

// Упрощенная инициализация
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 DOM загружен, запуск приложения...');
    
    try {
        window.app = new AcademyApp();
        await window.app.init();
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
        
        const errorScreen = document.getElementById('errorScreen');
        const errorMessage = document.getElementById('errorMessage');
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (errorScreen) {
            errorScreen.style.display = 'flex';
            if (errorMessage) {
                errorMessage.textContent = error.message || 'Неизвестная ошибка';
            }
        }
    }
});
