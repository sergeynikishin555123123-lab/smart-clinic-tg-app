// webapp/app.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ РАБОТЫ С СЕРВЕРОМ
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
        this.socket = null;
        
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
            theme: 'dark',
            notifications: [],
            unreadNotifications: 0,
            systemStatus: 'loading'
        };
        
        this.config = {
            API_BASE_URL: window.location.origin,
            SOCKET_URL: window.location.origin,
            CACHE_DURATION: 5 * 60 * 1000,
            RETRY_ATTEMPTS: 3,
            RETRY_DELAY: 1000,
            DEBOUNCE_DELAY: 300
        };
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация Академии АНБ версии 2.0...');
        this.showSkeletonLoading();
        
        try {
            await this.initializeTelegramWebApp();
            await this.loadUserData();
            await this.loadContent();
            
            this.renderPage('home');
            this.setupEventListeners();
            
            this.isInitialized = true;
            this.state.systemStatus = 'ready';
            
            console.log('✅ Приложение полностью готово');
            this.showNotification('✅ Приложение готово к работе', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
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
                    
                    // Настройка кнопок Telegram
                    Telegram.WebApp.BackButton.onClick(() => this.handleBackButton());
                    
                    console.log('✅ Telegram WebApp инициализирован');
                    resolve();
                } catch (error) {
                    console.warn('⚠️ Ошибка инициализации Telegram WebApp:', error);
                    resolve();
                }
            } else {
                console.log('ℹ️ Telegram WebApp не обнаружен, работаем в браузерном режиме');
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
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
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
                
                console.log('✅ Данные пользователя загружены:', this.currentUser.firstName);
            } else {
                throw new Error('Invalid user data response');
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
        const startTime = performance.now();
        
        try {
            const response = await fetch(`${this.config.API_BASE_URL}${url}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

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
            this.initializePage(page);
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showError('Ошибка отображения страницы');
        }
    }

    getPageHTML(page, subPage = '') {
        const pages = {
            home: this.createHomePage(),
            courses: subPage ? this.createCourseDetailPage(subPage) : this.createCoursesPage(),
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

    initializePage(page) {
        const initializers = {
            admin: () => this.initAdminPage(),
            courses: () => this.initCoursesPage(),
            home: () => this.initHomePage()
        };

        if (initializers[page]) {
            initializers[page]();
        }
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
                    ${this.createNavCard('courses', '📚', 'Курсы', this.allContent.courses?.length || 0, 'Доступные обучающие программы')}
                    ${this.createNavCard('podcasts', '🎧', 'АНБ FM', this.allContent.podcasts?.length || 0, 'Аудио подкасты и интервью')}
                    ${this.createNavCard('streams', '📹', 'Эфиры', this.allContent.streams?.length || 0, 'Прямые трансляции и разборы')}
                    ${this.createNavCard('videos', '🎯', 'Видео-шпаргалки', this.allContent.videos?.length || 0, 'Короткие обучающие видео')}
                    ${this.createNavCard('materials', '📋', 'Материалы', this.allContent.materials?.length || 0, 'Практические руководства и схемы')}
                    ${this.createNavCard('events', '🗺️', 'Мероприятия', this.allContent.events?.length || 0, 'Конференции и воркшопы')}
                    ${this.createNavCard('favorites', '❤️', 'Избранное', Object.values(this.state.favorites).flat().length, 'Сохраненный контент')}
                    ${this.createNavCard('profile', '👤', 'Профиль', '', 'Личный кабинет')}
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
                                    <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}">
                                    <div class="card-overlay">
                                        <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                                data-id="${course.id}" 
                                                data-type="courses"
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

    createNavCard(section, icon, title, count, description = '') {
        return `
            <div class="nav-card" onclick="app.renderPage('${section}')">
                <div class="nav-icon">${icon}</div>
                <div class="nav-content">
                    <div class="nav-title">${title}</div>
                    ${description ? `<div class="nav-description">${description}</div>` : ''}
                </div>
                ${count ? `<div class="nav-badge">${count}</div>` : ''}
            </div>
        `;
    }

    calculateHomeStats() {
        return {
            courses: this.allContent.stats?.totalCourses || this.allContent.courses?.length || 0,
            students: this.allContent.stats?.totalUsers || 0,
            materials: this.allContent.stats?.totalMaterials || 0,
            experts: 25
        };
    }

    getRecommendedCourses() {
        return this.allContent.courses
            ?.filter(course => course.featured || course.popular)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 6) || [];
    }

    // COURSES PAGE
    createCoursesPage() {
        const courses = this.allContent.courses || [];
        const filteredCourses = this.filterContent(courses, 'courses');
        const categories = this.getUniqueCategories(courses);
        
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
                        ${this.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.showAddContentForm('courses')">
                            ➕ Добавить курс
                        </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="page-controls">
                    <div class="filter-section">
                        <div class="filter-group">
                            <label>Категория:</label>
                            <select class="filter-select" onchange="app.filterContent(this.value, 'courses')">
                                <option value="all">Все категории</option>
                                ${categories.map(cat => `
                                    <option value="${cat}">${cat}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label>Сортировка:</label>
                            <select class="filter-select" onchange="app.sortContent(this.value, 'courses')">
                                <option value="newest">Сначала новые</option>
                                <option value="popular">По популярности</option>
                                <option value="rating">По рейтингу</option>
                                <option value="price_low">Сначала дешевые</option>
                                <option value="price_high">Сначала дорогие</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="results-info">
                        <span class="results-count">Найдено: ${filteredCourses.length} курсов</span>
                    </div>
                </div>
                
                <div class="content-container ${this.state.viewMode}">
                    ${filteredCourses.length > 0 ? 
                        this.renderCoursesGrid(filteredCourses) : 
                        this.createEmptyState('courses')
                    }
                </div>
            </div>
        `;
    }

    renderCoursesGrid(courses) {
        if (this.state.viewMode === 'list') {
            return this.renderCoursesList(courses);
        }

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
                            <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                        data-id="${course.id}" 
                                        data-type="courses"
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

    // COURSE DETAIL PAGE
    createCourseDetailPage(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        if (!course) return this.createNotFoundPage('Курс не найден');

        return `
            <div class="page course-detail-page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.renderPage('courses')">
                        ← Назад к курсам
                    </button>
                    <div class="header-actions">
                        <button class="btn btn-outline" onclick="app.toggleFavorite(${course.id}, 'courses')">
                            ${this.isFavorite(course.id, 'courses') ? '❤️ В избранном' : '🤍 В избранное'}
                        </button>
                    </div>
                </div>
                
                <div class="detail-container">
                    <div class="detail-hero">
                        <div class="hero-image">
                            <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}">
                            ${course.discount > 0 ? `
                                <div class="discount-badge large">-${course.discount}%</div>
                            ` : ''}
                        </div>
                        
                        <div class="hero-content">
                            <div class="course-category">${course.category}</div>
                            <h1>${course.title}</h1>
                            <p class="course-description">${course.full_description || course.description}</p>
                            
                            <div class="course-meta-grid">
                                <div class="meta-item">
                                    <div class="meta-icon">⏱️</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.duration}</div>
                                        <div class="meta-label">Длительность</div>
                                    </div>
                                </div>
                                <div class="meta-item">
                                    <div class="meta-icon">📦</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.modules}</div>
                                        <div class="meta-label">Модулей</div>
                                    </div>
                                </div>
                                <div class="meta-item">
                                    <div class="meta-icon">⭐</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.rating}</div>
                                        <div class="meta-label">Рейтинг</div>
                                    </div>
                                </div>
                                <div class="meta-item">
                                    <div class="meta-icon">👥</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.students_count}</div>
                                        <div class="meta-label">Студентов</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="course-level">
                                <span class="level-badge level-${course.level}">${this.getLevelName(course.level)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="purchase-section">
                        <div class="pricing-card">
                            <div class="pricing-header">
                                <h3>Приобрести курс</h3>
                                ${course.discount > 0 ? `
                                    <div class="discount-timer">
                                        ⏰ Скидка действует ограниченное время
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="price-display">
                                ${course.discount > 0 ? `
                                    <div class="original-price">${this.formatPrice(course.original_price || course.price * 1.2)}</div>
                                ` : ''}
                                <div class="current-price">${this.formatPrice(course.price)}</div>
                            </div>
                            
                            <div class="features-list">
                                <div class="feature-item">✓ Доступ ко всем материалам курса</div>
                                <div class="feature-item">✓ Сертификат о завершении</div>
                                <div class="feature-item">✓ Поддержка преподавателя</div>
                                <div class="feature-item">✓ Пожизненный доступ</div>
                            </div>
                            
                            <div class="purchase-actions">
                                <button class="btn btn-primary btn-large" onclick="app.purchaseCourse(${course.id})">
                                    💳 Купить курс
                                </button>
                                <button class="btn btn-outline" onclick="app.addToCart(${course.id})">
                                    🛒 В корзину
                                </button>
                            </div>
                            
                            <div class="guarantee-badge">
                                ✅ 14-дневная гарантия возврата
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Другие страницы (кратко)
    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                </div>
                <div class="content-grid">
                    ${podcasts.map(podcast => `
                        <div class="content-card podcast-card">
                            <div class="card-image">
                                <img src="${podcast.image_url || '/webapp/assets/podcast-default.jpg'}" alt="${podcast.title}">
                                <div class="card-overlay">
                                    <button class="play-btn" onclick="app.playPodcast(${podcast.id})">
                                        ▶
                                    </button>
                                </div>
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
            <div class="page streams-page">
                <div class="page-header">
                    <h2>📹 Эфиры и разборы</h2>
                </div>
                <div class="content-grid">
                    ${streams.map(stream => `
                        <div class="content-card stream-card ${stream.live ? 'live' : ''}">
                            <div class="card-image">
                                <img src="${stream.thumbnail_url || '/webapp/assets/stream-default.jpg'}" alt="${stream.title}">
                                ${stream.live ? '<div class="live-badge">LIVE</div>' : ''}
                                <div class="card-overlay">
                                    <button class="play-btn" onclick="app.watchStream(${stream.id})">
                                        ${stream.live ? '▶ Смотреть' : '▶ Смотреть запись'}
                                    </button>
                                </div>
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
                    <h2>🎯 Видео-шпаргалки</h2>
                </div>
                <div class="content-grid">
                    ${videos.map(video => `
                        <div class="content-card video-card">
                            <div class="card-image">
                                <img src="${video.thumbnail_url || '/webapp/assets/video-default.jpg'}" alt="${video.title}">
                                <div class="card-overlay">
                                    <button class="play-btn" onclick="app.watchVideo(${video.id})">
                                        ▶
                                    </button>
                                </div>
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
                        <div class="content-card material-card">
                            <div class="card-image">
                                <img src="${material.image_url || '/webapp/assets/material-default.jpg'}" alt="${material.title}">
                            </div>
                            <div class="card-content">
                                <h3>${material.title}</h3>
                                <p>${material.description}</p>
                                <div class="card-meta">
                                    <span>📥 ${material.downloads}</span>
                                    <span>📄 ${material.material_type}</span>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-primary" onclick="app.downloadMaterial(${material.id})">
                                        Скачать
                                    </button>
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
                        <div class="content-card event-card">
                            <div class="card-image">
                                <img src="${event.image_url || '/webapp/assets/event-default.jpg'}" alt="${event.title}">
                            </div>
                            <div class="card-content">
                                <h3>${event.title}</h3>
                                <p>${event.description}</p>
                                <div class="card-meta">
                                    <span>📅 ${this.formatDate(event.event_date)}</span>
                                    <span>📍 ${event.location}</span>
                                    <span>👥 ${event.participants}</span>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-primary" onclick="app.registerForEvent(${event.id})">
                                        Зарегистрироваться
                                    </button>
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
                            <div class="content-card course-card">
                                <div class="card-image">
                                    <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}">
                                    <div class="card-overlay">
                                        <button class="favorite-btn active" 
                                                onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                            ❤️
                                        </button>
                                    </div>
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
                        <div class="empty-description">Добавляйте курсы, материалы и другие элементы в избранное</div>
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
                        <button class="btn btn-primary" onclick="app.showAddContentForm('materials')">
                            ➕ Добавить материал
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
                <div class="empty-description">Попробуйте изменить параметры поиска или фильтрации</div>
            </div>
        `;
    }

    createNotFoundPage(message = 'Страница не найдена') {
        return `
            <div class="error-state">
                <div class="error-icon">🔍</div>
                <h3>${message}</h3>
                <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
            </div>
        `;
    }

    // Вспомогательные методы
    filterContent(items, type) {
        let filtered = items;
        
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            );
        }

        filtered = this.sortItems(filtered, this.state.sortBy);
        return filtered;
    }

    sortItems(items, sortBy) {
        const sorted = [...items];
        
        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'popular':
                return sorted.sort((a, b) => (b.students_count || 0) - (a.students_count || 0));
            case 'rating':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'price_low':
                return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'price_high':
                return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            default:
                return sorted;
        }
    }

    getUniqueCategories(items) {
        const categories = new Set();
        items.forEach(item => {
            if (item.category) {
                categories.add(item.category);
            }
        });
        return Array.from(categories);
    }

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
                headers: { 'Content-Type': 'application/json' },
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
        this.renderPage('courses', courseId);
    }

    // Методы для работы с UI
    toggleViewMode(mode) {
        this.state.viewMode = mode;
        this.renderPage(this.currentPage, this.currentSubPage);
    }

    filterContent(filter, type) {
        this.state.activeFilters[type] = filter === 'all' ? null : filter;
        this.renderPage(this.currentPage);
    }

    sortContent(sortBy, type) {
        this.state.sortBy = sortBy;
        this.renderPage(this.currentPage);
    }

    // Инициализация конкретных страниц
    initAdminPage() {
        console.log('🔧 Инициализация админ-панели');
    }

    initCoursesPage() {
        console.log('📚 Инициализация страницы курсов');
    }

    initHomePage() {
        console.log('🏠 Инициализация домашней страницы');
        this.setupNavigationHandlers();
    }

    setupNavigationHandlers() {
        const navCards = document.querySelectorAll('.nav-card');
        navCards.forEach(card => {
            // Обработчики уже установлены через onclick
        });
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
                    full_description: 'Комплексный курс по мануальным техникам для практикующих врачей-неврологов.',
                    price: 25000,
                    discount: 16,
                    duration: '12 недель',
                    modules: 6,
                    category: 'Мануальные техники',
                    level: 'advanced',
                    students_count: 156,
                    rating: 4.8,
                    featured: true,
                    image_url: '/webapp/assets/course-manual.jpg'
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
                    image_url: '/webapp/assets/podcast-neurology.jpg'
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
                    thumbnail_url: '/webapp/assets/stream-pain-syndrome.jpg'
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Неврологический осмотр за 15 минут',
                    description: 'Быстрый гайд по основным тестам',
                    duration: '15:30',
                    views: 4567,
                    thumbnail_url: '/webapp/assets/video-neurological-exam.jpg'
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
                    image_url: '/webapp/assets/material-ms-mri.jpg'
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Конференция: Современная неврология 2024',
                    description: 'Ежегодная конференция с ведущими специалистами',
                    event_date: new Date('2024-02-15T10:00:00').toISOString(),
                    location: 'Москва',
                    event_type: 'offline_conference',
                    participants: 456,
                    image_url: '/webapp/assets/event-neurology-conf.jpg'
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
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // Методы для работы с уведомлениями
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[type] || 'ℹ️';

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.id = 'loadingOverlay';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        document.body.appendChild(loading);
    }

    hideLoading() {
        this.isLoading = false;
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.remove();
        }
    }

    showSkeletonLoading() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="skeleton-loading">
                <div class="skeleton-hero">
                    <div class="skeleton-hero-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-stats">
                            <div class="skeleton-stat"></div>
                            <div class="skeleton-stat"></div>
                            <div class="skeleton-stat"></div>
                        </div>
                    </div>
                </div>
                <div class="skeleton-nav-grid">
                    ${Array(8).fill(0).map(() => `
                        <div class="skeleton-nav-card">
                            <div class="skeleton-icon"></div>
                            <div class="skeleton-nav-content">
                                <div class="skeleton-nav-title"></div>
                                <div class="skeleton-nav-description"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    hideSkeletonLoading() {
        const skeleton = document.querySelector('.skeleton-loading');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => {
                if (skeleton.parentElement) {
                    skeleton.remove();
                }
            }, 300);
        }
    }

    // Заглушки для будущей функциональности
    showAddContentForm(type) {
        this.showNotification(`📝 Добавление ${type} в разработке`, 'info');
    }

    purchaseCourse(courseId) {
        this.showNotification('💳 Функция покупки в разработке', 'info');
    }

    addToCart(courseId) {
        this.showNotification('🛒 Курс добавлен в корзину', 'success');
    }

    playPodcast(podcastId) {
        this.showNotification('🎧 Воспроизведение подкаста в разработке', 'info');
    }

    watchStream(streamId) {
        this.showNotification('📹 Просмотр эфира в разработке', 'info');
    }

    watchVideo(videoId) {
        this.showNotification('🎬 Просмотр видео в разработке', 'info');
    }

    downloadMaterial(materialId) {
        this.showNotification('📥 Загрузка материала в разработке', 'info');
    }

    registerForEvent(eventId) {
        this.showNotification('🎫 Регистрация на мероприятие в разработке', 'info');
    }

    showSupport() {
        this.showNotification('💬 Поддержка: @anb_academy_support\n📧 support@anb-academy.ru', 'info');
    }

    showSettings() {
        this.showNotification('⚙️ Настройки в разработке', 'info');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AcademyApp();
});
