// webapp/app.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isInitialized = false;
        this.isLoading = false;
        
        this.state = {
            currentCourse: null,
            searchQuery: '',
            activeFilters: {},
            sortBy: 'newest',
            viewMode: 'grid',
            favorites: {
                courses: [],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: []
            },
            theme: 'dark'
        };
        
        this.config = {
            API_BASE_URL: window.location.origin,
            CACHE_DURATION: 5 * 60 * 1000
        };
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация Академии АНБ...');
        this.showSkeletonLoading();
        
        try {
            await this.initializeTelegramWebApp();
            await this.loadUserData();
            await this.loadContent();
            
            this.renderPage('home');
            this.setupEventListeners();
            
            this.isInitialized = true;
            
            console.log('✅ Приложение готово');
            this.showNotification('✅ Приложение готово к работе', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения');
        } finally {
            this.hideSkeletonLoading();
        }
    }

    initializeTelegramWebApp() {
        return new Promise((resolve) => {
            if (window.Telegram && Telegram.WebApp) {
                try {
                    Telegram.WebApp.ready();
                    Telegram.WebApp.expand();
                    
                    Telegram.WebApp.BackButton.onClick(() => this.handleBackButton());
                    
                    console.log('✅ Telegram WebApp инициализирован');
                    resolve();
                } catch (error) {
                    console.warn('⚠️ Ошибка инициализации Telegram WebApp:', error);
                    resolve();
                }
            } else {
                console.log('ℹ️ Работаем в браузерном режиме');
                resolve();
            }
        });
    }

    async loadUserData() {
        this.showLoading('Загрузка профиля...');
        
        try {
            let tgUser = null;
            
            if (window.Telegram && Telegram.WebApp) {
                tgUser = Telegram.WebApp.initDataUnsafe?.user;
            }
            
            const userToSend = tgUser || {
                id: 898508164,
                first_name: 'Демо Пользователь',
                username: 'demo_user'
            };

            const response = await this.apiCall('/api/user', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    user: userToSend
                })
            });

            if (response.success && response.user) {
                this.currentUser = response.user;
                this.isAdmin = this.currentUser.isAdmin || false;
                this.isSuperAdmin = this.currentUser.isSuperAdmin || false;
                this.state.favorites = this.currentUser.favorites || this.state.favorites;
                
                this.updateAdminBadge();
                
                console.log('✅ Данные пользователя загружены');
            } else {
                throw new Error('Invalid user data');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            this.createDemoUser();
        } finally {
            this.hideLoading();
        }
    }

    async loadContent() {
        this.showLoading('Загрузка контента...');
        
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
            this.createDemoContent();
        } finally {
            this.hideLoading();
        }
    }

    async apiCall(url, options = {}) {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}${url}`, {
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
            console.error(`API Call failed: ${url}`, error);
            throw error;
        }
    }

    // Основные методы рендеринга
    renderPage(page, subPage = '') {
        if (this.isLoading) return;
        
        this.currentPage = page;
        this.currentSubPage = subPage;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) {
            console.error('❌ mainContent не найден');
            return;
        }

        // Обновляем активные кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Управление кнопкой "Назад" в Telegram
        if (window.Telegram && Telegram.WebApp) {
            if (page === 'home' && !subPage) {
                Telegram.WebApp.BackButton.hide();
            } else {
                Telegram.WebApp.BackButton.show();
            }
        }

        try {
            mainContent.innerHTML = this.getPageHTML(page, subPage);
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showError('Ошибка отображения страницы');
        }
    }

    getPageHTML(page, subPage = '') {
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
                    <div class="hero-background"></div>
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
                    <div class="level-progress">
                        <div class="level-info">
                            <span class="level-name">${this.currentUser.progress.level}</span>
                            <span class="level-exp">${this.currentUser.progress.experience} XP</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentUser.progress.experience / 2000) * 100}%"></div>
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
                                    <div class="card-overlay">
                                        <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                                onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                            ❤️
                                        </button>
                                    </div>
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
            .slice(0, 6) || [];
    }

    // COURSES PAGE
    createCoursesPage() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="page courses-page">
                <div class="page-header">
                    <h2>📚 Курсы</h2>
                    <div class="header-actions">
                        <div class="view-toggle">
                            <button class="view-btn ${this.state.viewMode === 'grid' ? 'active' : ''}" 
                                    onclick="app.toggleViewMode('grid')">
                                ▦
                            </button>
                            <button class="view-btn ${this.state.viewMode === 'list' ? 'active' : ''}" 
                                    onclick="app.toggleViewMode('list')">
                                ☰
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="content-container ${this.state.viewMode}">
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
                        ${course.featured ? `
                            <div class="featured-badge">Рекомендуем</div>
                        ` : ''}
                        
                        <div class="card-image">
                            <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                    ❤️
                                </button>
                            </div>
                        </div>
                        <div class="card-content">
                            <div class="card-category">${course.category}</div>
                            <h3 class="card-title">${course.title}</h3>
                            <p class="card-description">${course.description}</p>
                            
                            <div class="card-meta">
                                <span class="meta-item">⏱️ ${course.duration}</span>
                                <span class="meta-item">📦 ${course.modules} модулей</span>
                                <span class="meta-item">⭐ ${course.rating}</span>
                            </div>
                            
                            <div class="card-level">
                                <span class="level-badge level-${course.level}">${this.getLevelName(course.level)}</span>
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

    // Другие страницы (упрощенные)
    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                </div>
                <div class="content-grid">
                    ${podcasts.map(podcast => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${podcast.image_url || '/webapp/assets/podcast-default.jpg'}" alt="${podcast.title}" onerror="this.src='/webapp/assets/podcast-default.jpg'">
                            </div>
                            <div class="card-content">
                                <h3>${podcast.title}</h3>
                                <p>${podcast.description}</p>
                                <div class="card-meta">
                                    <span>⏱️ ${podcast.duration}</span>
                                    <span>👂 ${podcast.listens}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createStreamsPage() {
        const streams = this.allContent.streams || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📹 Эфиры</h2>
                </div>
                <div class="content-grid">
                    ${streams.map(stream => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${stream.thumbnail_url || '/webapp/assets/stream-default.jpg'}" alt="${stream.title}" onerror="this.src='/webapp/assets/stream-default.jpg'">
                                ${stream.live ? '<div class="live-badge">LIVE</div>' : ''}
                            </div>
                            <div class="card-content">
                                <h3>${stream.title}</h3>
                                <p>${stream.description}</p>
                                <div class="card-meta">
                                    <span>⏱️ ${stream.duration}</span>
                                    <span>👥 ${stream.participants}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createVideosPage() {
        const videos = this.allContent.videos || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎯 Видео</h2>
                </div>
                <div class="content-grid">
                    ${videos.map(video => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${video.thumbnail_url || '/webapp/assets/video-default.jpg'}" alt="${video.title}" onerror="this.src='/webapp/assets/video-default.jpg'">
                            </div>
                            <div class="card-content">
                                <h3>${video.title}</h3>
                                <p>${video.description}</p>
                                <div class="card-meta">
                                    <span>⏱️ ${video.duration}</span>
                                    <span>👀 ${video.views}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createMaterialsPage() {
        const materials = this.allContent.materials || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📋 Материалы</h2>
                </div>
                <div class="content-grid">
                    ${materials.map(material => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${material.image_url || '/webapp/assets/material-default.jpg'}" alt="${material.title}" onerror="this.src='/webapp/assets/material-default.jpg'">
                            </div>
                            <div class="card-content">
                                <h3>${material.title}</h3>
                                <p>${material.description}</p>
                                <div class="card-meta">
                                    <span>📥 ${material.downloads}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createEventsPage() {
        const events = this.allContent.events || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🗺️ Мероприятия</h2>
                </div>
                <div class="content-grid">
                    ${events.map(event => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${event.image_url || '/webapp/assets/event-default.jpg'}" alt="${event.title}" onerror="this.src='/webapp/assets/event-default.jpg'">
                            </div>
                            <div class="card-content">
                                <h3>${event.title}</h3>
                                <p>${event.description}</p>
                                <div class="card-meta">
                                    <span>📅 ${this.formatDate(event.event_date)}</span>
                                    <span>📍 ${event.location}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createFavoritesPage() {
        const favoriteCourses = this.allContent.courses?.filter(c => this.isFavorite(c.id, 'courses')) || [];
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>❤️ Избранное</h2>
                </div>
                
                ${favoriteCourses.length > 0 ? `
                    <div class="content-grid">
                        ${favoriteCourses.map(course => `
                            <div class="content-card">
                                <div class="card-image">
                                    <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                                </div>
                                <div class="card-content">
                                    <h3>${course.title}</h3>
                                    <p>${course.description}</p>
                                    <div class="card-meta">
                                        <span>⏱️ ${course.duration}</span>
                                        <span>💰 ${this.formatPrice(course.price)}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <div class="empty-icon">❤️</div>
                        <div class="empty-title">В избранном пока пусто</div>
                        <button class="btn btn-primary" onclick="app.renderPage('courses')">
                            Перейти к курсам
                        </button>
                    </div>
                `}
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

                <div class="profile-stats">
                    <h3>📊 Статистика</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${this.state.favorites.courses.length}</div>
                            <div class="stat-label">Курсов в избранном</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.currentUser?.progress?.steps?.coursesBought || 0}</div>
                            <div class="stat-label">Приобретенных курсов</div>
                        </div>
                    </div>
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

                <div class="admin-section">
                    <h3>Статистика</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${this.allContent.stats?.totalUsers || 0}</div>
                            <div class="stat-label">Пользователей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.allContent.courses?.length || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
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
        return `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <div class="empty-title">${type === 'courses' ? 'Курсы не найдены' : 'Контент не найден'}</div>
            </div>
        `;
    }

    createNotFoundPage() {
        return `
            <div class="error-state">
                <div class="error-icon">🔍</div>
                <h3>Страница не найдена</h3>
                <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
            </div>
        `;
    }

    // Вспомогательные методы
    getLevelName(level) {
        const levels = {
            'beginner': 'Начинающий',
            'intermediate': 'Средний',
            'advanced': 'Продвинутый'
        };
        return levels[level] || level;
    }

    isFavorite(contentId, contentType) {
        return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
    }

    async toggleFavorite(contentId, contentType) {
        try {
            const response = await this.apiCall('/api/favorites/toggle', {
                method: 'POST',
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    contentId: contentId,
                    contentType: contentType
                })
            });

            if (response.success) {
                this.state.favorites = response.favorites;
                this.showNotification(
                    this.isFavorite(contentId, contentType) ? 'Добавлено в избранное' : 'Удалено из избранного',
                    'success'
                );
                this.renderPage(this.currentPage, this.currentSubPage);
            }
        } catch (error) {
            console.error('Ошибка обновления избранного:', error);
            this.showNotification('Ошибка при обновлении избранного', 'error');
        }
    }

    // Методы навигации
    openCourseDetail(courseId) {
        this.showNotification('📚 Детальная страница курса в разработке', 'info');
    }

    // Методы для работы с UI
    toggleViewMode(mode) {
        this.state.viewMode = mode;
        this.renderPage(this.currentPage, this.currentSubPage);
    }

    setupEventListeners() {
        // Обработчики навигационных кнопок
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });
    }

    handleBackButton() {
        if (this.currentSubPage) {
            this.currentSubPage = '';
            this.renderPage(this.currentPage);
        } else if (this.currentPage !== 'home') {
            this.renderPage('home');
        } else {
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.close();
            }
        }
    }

    // Демо-данные
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
            podcasts: [
                {
                    id: 1,
                    title: 'АНБ FM: Современная неврология',
                    description: 'Обсуждение новых тенденций в неврологии',
                    duration: '45:20',
                    category: 'Неврология',
                    listens: 2345,
                    image_url: '/webapp/assets/podcast-default.jpg'
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'Разбор клинического случая',
                    description: 'Прямой эфир с разбором сложного случая',
                    duration: '1:30:00',
                    live: true,
                    participants: 89,
                    thumbnail_url: '/webapp/assets/stream-default.jpg'
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Неврологический осмотр за 15 минут',
                    description: 'Быстрый гайд по основным тестам',
                    duration: '15:30',
                    views: 4567,
                    thumbnail_url: '/webapp/assets/video-default.jpg'
                }
            ],
            materials: [
                {
                    id: 1,
                    title: 'МРТ разбор: Рассеянный склероз',
                    description: 'Детальный разбор МРТ с клиническими случаями',
                    material_type: 'mri_analysis',
                    category: 'Неврология',
                    downloads: 1234,
                    image_url: '/webapp/assets/material-default.jpg'
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Конференция: Современная неврология 2024',
                    description: 'Ежегодная конференция с ведущими специалистами',
                    event_date: new Date('2024-02-15T10:00:00').toISOString(),
                    location: 'Москва',
                    participants: 456,
                    image_url: '/webapp/assets/event-default.jpg'
                }
            ],
            stats: {
                totalUsers: 1567,
                totalCourses: 12,
                totalMaterials: 45
            }
        };
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    // Методы для работы с уведомлениями
    showNotification(message, type = 'info') {
        console.log(`Notification [${type}]: ${message}`);
        // Простая реализация уведомлений
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        console.log(`Loading: ${message}`);
    }

    hideLoading() {
        this.isLoading = false;
    }

    showSkeletonLoading() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div style="padding: 20px;">
                <div style="background: #374151; height: 200px; border-radius: 12px; margin-bottom: 20px;"></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    ${Array(8).fill(0).map(() => `
                        <div style="background: #374151; height: 100px; border-radius: 8px;"></div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    hideSkeletonLoading() {
        // Автоматически скрывается при рендере контента
    }

    // Заглушки для функциональности
    showAddContentForm(type) {
        this.showNotification(`📝 Добавление ${type} в разработке`, 'info');
    }

    showSupport() {
        this.showNotification('💬 Поддержка: @anb_academy_support', 'info');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AcademyApp();
});
