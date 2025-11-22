// webapp/app.js - ПОЛНАЯ РЕАЛИЗАЦИЯ АКАДЕМИИ АНБ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isInitialized = false;
        
        // Медиа обработчики
        this.mediaPlayers = {
            video: null,
            audio: null
        };
        
        // Админ панель
        this.adminTabs = ['content', 'users', 'analytics', 'settings'];
        this.currentAdminTab = 'content';
        this.editingContent = null;
        
        // Состояние приложения
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
            theme: 'light',
            playingContent: null
        };
        
        // Конфигурация
        this.config = {
            API_BASE_URL: window.location.origin,
            CACHE_DURATION: 5 * 60 * 1000
        };
        
        // Данные для ТЗ
        this.communityRules = [
            {
                title: 'Не распространяем материалы',
                description: 'Эфиры, разборы и материалы АНБ не копируем и не выкладываем в открытый доступ.'
            },
            {
                title: 'Без рекламы и самопродвижения',
                description: 'Мы здесь чтобы учиться и общаться, а не продавать услуги или курсы.'
            },
            {
                title: 'Уважаем личное пространство',
                description: 'Не пишем участникам без их запроса и не создаём сторонние чаты.'
            },
            {
                title: 'Общаемся бережно и корректно',
                description: 'Без грубости, токсичности и обесценивания — мы поддерживаем друг друга.'
            },
            {
                title: 'Соблюдаем врачебную этику',
                description: 'Не публикуем данные пациентов, обсуждаем только корректно оформленные случаи.'
            },
            {
                title: 'Держим высокий уровень контента',
                description: 'Не распространяем фейки, псевдонауку и непроверенную информацию.'
            }
        ];
        
        this.learningPath = {
            'Понимаю': { 
                minExp: 0, 
                maxExp: 1000, 
                requirements: ['Подписка активирована'],
                description: 'Начинаю замечать закономерности и связи',
                progress: 100,
                steps: [
                    'Просмотр любого открытого контента',
                    'Участие в 3+ эфирах/разборах',
                    'Добавление 5+ материалов в избранное'
                ]
            },
            'Связываю': { 
                minExp: 1000, 
                maxExp: 2500, 
                requirements: ['3+ эфиров', '5+ материалов'],
                description: 'Закономерности складываются в систему',
                progress: 75,
                steps: [
                    'Просмотр 10+ материалов',
                    'Участие в 5+ эфирах/разборах',
                    'Добавление 10+ материалов в избранное'
                ]
            },
            'Применяю': { 
                minExp: 2500, 
                maxExp: 5000, 
                requirements: ['1+ курс', '7+ эфиров'],
                description: 'Подход АНБ используется на практике',
                progress: 50,
                steps: [
                    'Покупка 1+ курса',
                    'Просмотр 15+ материалов',
                    'Участие в 7+ эфирах/разборах'
                ]
            },
            'Систематизирую': { 
                minExp: 5000, 
                maxExp: 10000, 
                requirements: ['2+ курса', '10+ эфиров'],
                description: 'Знания становятся инструментом',
                progress: 25,
                steps: [
                    'Участие в разборе как гость',
                    'Участие в 10+ эфирах',
                    'Покупка 2+ курсов'
                ]
            },
            'Делюсь': { 
                minExp: 10000, 
                maxExp: 20000, 
                requirements: ['Все курсы', 'Офлайн мероприятия'],
                description: 'Опыт переходит в обмен',
                progress: 10,
                steps: [
                    'Покупка всех 6 курсов',
                    'Посещение офлайн мероприятий',
                    'Публикация кейсов в Академии'
                ]
            }
        };
        
        this.chats = [
            { 
                name: 'Неврологи', 
                icon: '🧠', 
                members: 234, 
                description: 'Обсуждение неврологических случаев',
                isActive: true
            },
            { 
                name: 'Реабилитологи', 
                icon: '🦾', 
                members: 189, 
                description: 'Вопросы реабилитации',
                isActive: true
            },
            { 
                name: 'Мануальные специалисты', 
                icon: '✋', 
                members: 156, 
                description: 'Мануальные техники',
                isActive: true
            },
            { 
                name: 'Междисциплинарный чат', 
                icon: '🔗', 
                members: 345, 
                description: 'Общие вопросы',
                isActive: true
            },
            { 
                name: 'Флудилка', 
                icon: '💬', 
                members: 567, 
                description: 'Неформальное общение',
                isActive: true
            }
        ];
        
        this.materialsTabs = ['later', 'favorites', 'practical'];
        this.currentMaterialsTab = 'later';
        
        this.newsFilters = ['Все', 'Статьи', 'Профессиональное развитие', 'Практические навыки', 'Физиотерапия', 'Реабилитация', 'Фармакотерапия', 'Мануальные техники'];
        this.currentNewsFilter = 'Все';
        
        console.log('🎓 Академия АНБ инициализируется...');
    }

    // ==================== ОСНОВНЫЕ МЕТОДЫ ====================

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация Академии АНБ...');
        
        try {
            await this.safeInitializeTelegramWebApp();
            await Promise.all([
                this.loadUserData(),
                this.loadContent()
            ]);
            
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
                    Telegram.WebApp.ready();
                    Telegram.WebApp.expand();
                    
                    Telegram.WebApp.BackButton.onClick(() => {
                        this.handleBackButton();
                    });
                    
                    if (Telegram.WebApp.themeParams) {
                        this.applyTheme(Telegram.WebApp.themeParams);
                    }
                }
                resolve();
            } catch (error) {
                console.warn('⚠️ Ошибка инициализации Telegram WebApp:', error);
                resolve();
            }
        });
    }

    applyTheme(themeParams) {
        if (themeParams.bg_color) {
            document.documentElement.style.setProperty('--bg-color', themeParams.bg_color);
        }
        if (themeParams.text_color) {
            document.documentElement.style.setProperty('--text-color', themeParams.text_color);
        }
    }

    async loadUserData() {
        console.log('👤 Загрузка данных пользователя...');
        
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

            const response = await this.safeApiCall('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: userToSend })
            });

            if (response && response.success && response.user) {
                this.currentUser = response.user;
                this.isAdmin = this.currentUser.isAdmin || false;
                this.isSuperAdmin = this.currentUser.isSuperAdmin || false;
                this.state.favorites = this.currentUser.favorites || this.state.favorites;
                
                this.updateAdminBadge();
                this.updateFavoritesCount();
            } else {
                throw new Error('Неверный ответ сервера');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            this.createDemoUser();
        }
    }

    async loadContent() {
        console.log('📚 Загрузка контента...');
        
        try {
            const response = await this.safeApiCall('/api/content');
            
            if (response && response.success) {
                this.allContent = response.data;
            } else {
                throw new Error('Не удалось загрузить контент');
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
            this.createDemoContent();
        }
    }

    // ==================== РЕНДЕРИНГ СТРАНИЦ ====================

    renderPage(page, subPage = '') {
        if (this.isLoading) return;
        
        this.currentPage = page;
        this.currentSubPage = subPage;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) return;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        if (window.Telegram && Telegram.WebApp) {
            try {
                if (page === 'home' && !subPage) {
                    Telegram.WebApp.BackButton.hide();
                } else {
                    Telegram.WebApp.BackButton.show();
                }
            } catch (e) {
                console.warn('Ошибка управления BackButton:', e);
            }
        }

        try {
            mainContent.innerHTML = this.getPageHTML(page, subPage);
            this.initializePageComponents();
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showNotification('Ошибка отображения страницы', 'error');
        }
    }

    getPageHTML(page, subPage = '') {
        const pages = {
            home: this.createHomePage(),
            courses: subPage.includes('course-') ? this.createCourseDetailPage(parseInt(subPage.split('-')[1])) : this.createCoursesPage(),
            podcasts: this.createPodcastsPage(),
            streams: this.createStreamsPage(),
            videos: this.createVideosPage(),
            materials: this.createMaterialsPage(),
            events: this.createEventsPage(),
            favorites: this.createFavoritesPage(),
            profile: this.createProfilePage(),
            community: this.createCommunityPage(),
            chats: this.createChatsPage(),
            myMaterials: this.createMyMaterialsPage(),
            admin: this.createAdminPage(),
            support: this.createSupportPage()
        };

        return pages[page] || this.createNotFoundPage();
    }

    // ==================== ГЛАВНАЯ СТРАНИЦА ====================

    createHomePage() {
        const stats = this.calculateHomeStats();
        const recommendedCourses = this.getRecommendedCourses();
        const liveStreams = this.getLiveStreams();
        
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
                    <h3>🎯 Ваш прогресс</h3>
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
                    ${this.createNavCard('courses', '📚', 'Курсы', this.allContent.courses?.length || 0, 'Доступные курсы и обучение')}
                    ${this.createNavCard('podcasts', '🎧', 'АНБ FM', this.allContent.podcasts?.length || 0, 'Аудио подкасты и лекции')}
                    ${this.createNavCard('streams', '📹', 'Эфиры', this.allContent.streams?.length || 0, 'Прямые эфиры и разборы')}
                    ${this.createNavCard('videos', '🎯', 'Видео-шпаргалки', this.allContent.videos?.length || 0, 'Короткие обучающие видео')}
                    ${this.createNavCard('materials', '📋', 'Практические материалы', this.allContent.materials?.length || 0, 'МРТ, кейсы, чек-листы')}
                    ${this.createNavCard('events', '🗺️', 'Карта мероприятий', this.allContent.events?.length || 0, 'Онлайн и офлайн события')}
                    ${this.createNavCard('community', '👥', 'О сообществе', '', 'Правила и ценности')}
                    ${this.createNavCard('chats', '💬', 'Чаты', this.chats.length, 'Сообщество специалистов')}
                </div>

                ${recommendedCourses.length > 0 ? `
                <div class="recommended-section">
                    <div class="section-header">
                        <h3>⭐ Рекомендуемые курсы</h3>
                        <button class="btn btn-outline see-all" onclick="app.renderPage('courses')">
                            Все курсы →
                        </button>
                    </div>
                    <div class="recommended-grid">
                        ${recommendedCourses.slice(0, 3).map(course => `
                            <div class="course-card featured" onclick="app.openCourseDetail(${course.id})">
                                <div class="card-badge">Рекомендуем</div>
                                ${course.discount > 0 ? `<div class="discount-badge">-${course.discount}%</div>` : ''}
                                <div class="card-image">
                                    <img src="${course.image_url}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                                    <div class="card-overlay">
                                        <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                                onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                            ${this.isFavorite(course.id, 'courses') ? '❤️' : '🤍'}
                                        </button>
                                    </div>
                                </div>
                                <div class="card-content">
                                    <div class="card-category">${course.category}</div>
                                    <h3 class="card-title">${course.title}</h3>
                                    <p class="card-description">${course.description}</p>
                                    <div class="card-meta">
                                        <span class="meta-item">⏱️ ${course.duration}</span>
                                        <span class="meta-item">🎯 ${course.modules} модулей</span>
                                        <span class="meta-item">⭐ ${course.rating}</span>
                                    </div>
                                    <div class="card-footer">
                                        <div class="price-section">
                                            ${course.discount > 0 ? `
                                                <div class="price-original">${this.formatPrice(course.price)}</div>
                                                <div class="price-current">${this.formatPrice(course.price * (1 - course.discount/100))}</div>
                                            ` : `
                                                <div class="price-current">${this.formatPrice(course.price)}</div>
                                            `}
                                        </div>
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

                <div class="news-section">
                    <div class="section-header">
                        <h3>📰 Лента новостей</h3>
                        <div class="news-filter">
                            <select class="filter-select" onchange="app.filterNews(this.value)">
                                ${this.newsFilters.map(filter => `
                                    <option value="${filter}" ${filter === this.currentNewsFilter ? 'selected' : ''}>${filter}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="news-feed">
                        ${this.createNewsItems()}
                    </div>
                </div>
            </div>
        `;
    }

    createNavCard(section, icon, title, count, description) {
        return `
            <div class="nav-card" onclick="app.renderPage('${section}')">
                <div class="nav-icon">${icon}</div>
                <div class="nav-content">
                    <div class="nav-title">${title}</div>
                    <div class="nav-description">${description}</div>
                </div>
                ${count ? `<div class="nav-badge">${count}</div>` : ''}
                <div class="nav-arrow">→</div>
            </div>
        `;
    }

    // ==================== СТРАНИЦА КУРСОВ ====================

    createCoursesPage() {
        const courses = this.allContent.courses || [];
        const categories = [...new Set(courses.map(c => c.category))];
        const levels = [...new Set(courses.map(c => c.level))];
        
        return `
            <div class="page courses-page">
                <div class="page-header">
                    <h2>📚 Курсы</h2>
                    <div class="header-actions">
                        <div class="search-box">
                            <input type="text" 
                                   class="search-input" 
                                   placeholder="Поиск курсов..." 
                                   value="${this.state.searchQuery}"
                                   oninput="app.handleSearch(event)"
                                   onkeypress="if(event.key==='Enter') app.searchCourses()">
                            <button class="search-btn" onclick="app.searchCourses()">
                                🔍
                            </button>
                        </div>
                        <div class="view-toggle">
                            <button class="view-btn ${this.state.viewMode === 'grid' ? 'active' : ''}" 
                                    onclick="app.toggleViewMode('grid')">
                                ▦ Сетка
                            </button>
                            <button class="view-btn ${this.state.viewMode === 'list' ? 'active' : ''}" 
                                    onclick="app.toggleViewMode('list')">
                                ☰ Список
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="filters-section">
                    <div class="filter-group">
                        <label>Категория:</label>
                        <select class="filter-select" onchange="app.applyFilter('category', this.value)">
                            <option value="">Все категории</option>
                            ${categories.map(cat => `
                                <option value="${cat}" ${this.state.activeFilters.category === cat ? 'selected' : ''}>
                                    ${cat}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Уровень:</label>
                        <select class="filter-select" onchange="app.applyFilter('level', this.value)">
                            <option value="">Все уровни</option>
                            ${levels.map(level => `
                                <option value="${level}" ${this.state.activeFilters.level === level ? 'selected' : ''}>
                                    ${this.getLevelName(level)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Сортировка:</label>
                        <select class="filter-select" onchange="app.applySorting(this.value)">
                            <option value="newest" ${this.state.sortBy === 'newest' ? 'selected' : ''}>Сначала новые</option>
                            <option value="popular" ${this.state.sortBy === 'popular' ? 'selected' : ''}>По популярности</option>
                            <option value="price_low" ${this.state.sortBy === 'price_low' ? 'selected' : ''}>Сначала дешевые</option>
                            <option value="price_high" ${this.state.sortBy === 'price_high' ? 'selected' : ''}>Сначала дорогие</option>
                            <option value="rating" ${this.state.sortBy === 'rating' ? 'selected' : ''}>По рейтингу</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-outline reset-filters" onclick="app.resetFilters()">
                        ❌ Сбросить
                    </button>
                </div>
                
                <div class="results-info">
                    <div class="results-count">
                        Найдено курсов: <strong>${this.getFilteredCourses().length}</strong>
                    </div>
                    ${this.state.searchQuery ? `
                        <div class="search-query">
                            По запросу: "${this.state.searchQuery}"
                        </div>
                    ` : ''}
                </div>
                
                <div class="content-container ${this.state.viewMode}">
                    ${courses.length > 0 ? 
                        this.state.viewMode === 'grid' ? 
                            this.renderCoursesGrid(this.getFilteredCourses()) : 
                            this.renderCoursesList(this.getFilteredCourses()) : 
                        this.createEmptyState('courses')
                    }
                </div>
            </div>
        `;
    }

    renderCoursesGrid(courses) {
        if (courses.length === 0) {
            return this.createEmptyState('courses', 'По вашему запросу ничего не найдено');
        }
        
        return `
            <div class="content-grid">
                ${courses.map(course => `
                    <div class="content-card course-card" onclick="app.openCourseDetail(${course.id})">
                        ${course.featured ? `<div class="featured-badge">⭐ Рекомендуем</div>` : ''}
                        ${course.discount > 0 ? `<div class="discount-badge">-${course.discount}%</div>` : ''}
                        
                        <div class="card-image">
                            <img src="${course.image_url}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                    ${this.isFavorite(course.id, 'courses') ? '❤️' : '🤍'}
                                </button>
                                <button class="preview-btn" onclick="event.stopPropagation(); app.previewCourse(${course.id})">
                                    👁️
                                </button>
                            </div>
                        </div>
                        
                        <div class="card-content">
                            <div class="card-category">${course.category}</div>
                            <h3 class="card-title">${course.title}</h3>
                            <p class="card-description">${course.description}</p>
                            
                            <div class="card-meta">
                                <span class="meta-item">⏱️ ${course.duration}</span>
                                <span class="meta-item">🎯 ${course.modules} модулей</span>
                                <span class="meta-item">⭐ ${course.rating}</span>
                                <span class="meta-item">👥 ${course.students_count}</span>
                            </div>
                            
                            <div class="card-level">
                                <span class="level-badge level-${course.level}">
                                    ${this.getLevelName(course.level)}
                                </span>
                            </div>
                            
                            <div class="card-footer">
                                <div class="price-section">
                                    ${course.discount > 0 ? `
                                        <div class="price-original">${this.formatPrice(course.price)}</div>
                                        <div class="price-current">${this.formatPrice(course.price * (1 - course.discount/100))}</div>
                                    ` : `
                                        <div class="price-current">${this.formatPrice(course.price)}</div>
                                    `}
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

    // ==================== ДЕТАЛЬНАЯ СТРАНИЦА КУРСА ====================

    createCourseDetailPage(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId) || this.getDemoCourse();
        
        return `
            <div class="page course-detail-page">
                <div class="detail-header">
                    <button class="back-btn" onclick="app.renderPage('courses')">
                        ← Назад к курсам
                    </button>
                    <h2>${course.title}</h2>
                </div>

                <div class="detail-container">
                    <div class="detail-hero">
                        <div class="hero-image">
                            <img src="${course.image_url}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                            <div class="image-overlay">
                                <button class="btn btn-primary btn-large play-btn" onclick="app.previewCourse(${course.id})">
                                    ▶️ Предпросмотр
                                </button>
                            </div>
                        </div>
                        
                        <div class="hero-content">
                            <div class="course-meta-large">
                                <span class="category-badge">${course.category}</span>
                                <span class="level-badge level-${course.level}">${this.getLevelName(course.level)}</span>
                                <span class="rating-badge">⭐ ${course.rating}</span>
                            </div>
                            
                            <h1>${course.title}</h1>
                            <p class="course-subtitle">${course.description}</p>
                            
                            <div class="course-stats">
                                <div class="stat">
                                    <div class="stat-value">${course.modules}</div>
                                    <div class="stat-label">Модулей</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-value">${course.duration}</div>
                                    <div class="stat-label">Длительность</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-value">${course.students_count}</div>
                                    <div class="stat-label">Студентов</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-value">${course.rating}/5</div>
                                    <div class="stat-label">Рейтинг</div>
                                </div>
                            </div>
                            
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-large" onclick="app.purchaseCourse(${course.id})">
                                    💳 Купить курс - ${this.formatPrice(course.discount > 0 ? course.price * (1 - course.discount/100) : course.price)}
                                </button>
                                <button class="btn btn-outline" onclick="app.toggleFavorite(${course.id}, 'courses')">
                                    ${this.isFavorite(course.id, 'courses') ? '❤️ В избранном' : '🤍 В избранное'}
                                </button>
                            </div>
                            
                            ${course.discount > 0 ? `
                            <div class="discount-info">
                                <span class="original-price">${this.formatPrice(course.price)}</span>
                                <span class="discount-amount">Экономия ${course.discount}%</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="detail-tabs">
                        <button class="tab-btn active" onclick="app.switchCourseTab('about')">
                            📋 О курсе
                        </button>
                        <button class="tab-btn" onclick="app.switchCourseTab('curriculum')">
                            🎯 Программа
                        </button>
                        <button class="tab-btn" onclick="app.switchCourseTab('reviews')">
                            💬 Отзывы
                        </button>
                    </div>

                    <div class="tab-content active" id="about-tab">
                        <div class="course-description-detailed">
                            <h3>Что вы узнаете</h3>
                            <ul class="learning-list">
                                <li>Современные методики диагностики и лечения</li>
                                <li>Практические навыки для ежедневной работы</li>
                                <li>Разбор реальных клинических случаев</li>
                                <li>Инструменты для профессионального роста</li>
                            </ul>
                            
                            <h3>Для кого этот курс</h3>
                            <ul class="audience-list">
                                <li>Неврологи и реабилитологи</li>
                                <li>Мануальные терапевты</li>
                                <li>Врачи, желающие повысить квалификацию</li>
                                <li>Студенты медицинских вузов</li>
                            </ul>
                        </div>
                    </div>

                    <div class="tab-content" id="curriculum-tab">
                        <div class="curriculum-list">
                            ${this.createCurriculumModules()}
                        </div>
                    </div>

                    <div class="tab-content" id="reviews-tab">
                        <div class="reviews-list">
                            ${this.createCourseReviews()}
                        </div>
                    </div>
                </div>

                <div class="purchase-section">
                    <div class="pricing-card">
                        <div class="pricing-header">
                            <h3>Начните обучение сегодня</h3>
                            <div class="discount-timer">
                                ⏰ Скидка действует еще 2 дня
                            </div>
                        </div>
                        
                        <div class="price-display">
                            ${course.discount > 0 ? `
                                <div class="original-price">${this.formatPrice(course.price)}</div>
                            ` : ''}
                            <div class="current-price">
                                ${this.formatPrice(course.discount > 0 ? course.price * (1 - course.discount/100) : course.price)}
                            </div>
                        </div>
                        
                        <div class="features-list">
                            <div class="feature-item">✅ Полный доступ к курсу</div>
                            <div class="feature-item">✅ Сертификат о прохождении</div>
                            <div class="feature-item">✅ Поддержка куратора</div>
                            <div class="feature-item">✅ Доступ в закрытый чат</div>
                            <div class="feature-item">✅ Обновления курса</div>
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
                            ✅ 30-дневная гарантия возврата
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ====================

    createProfilePage() {
        const user = this.currentUser;
        const progress = user?.progress || {};
        const currentLevel = this.learningPath[progress.level] || this.learningPath['Понимаю'];
        
        return `
            <div class="page profile-page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">${user.avatarUrl ? `<img src="${user.avatarUrl}" alt="Аватар">` : '👤'}</div>
                        <div class="profile-info">
                            <h2>${user?.firstName || 'Пользователь'}</h2>
                            <p class="profile-status">${this.getProfileStatus()}</p>
                            <p class="member-since">Член Академии АНБ с ${new Date().toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}</p>
                        </div>
                    </div>
                    
                    <div class="subscription-status ${user?.subscriptionEnd ? 'active' : 'inactive'}">
                        <span>${user?.subscriptionEnd ? '✅' : '❌'} Подписка ${user?.subscriptionEnd ? 'активна до ' + new Date(user.subscriptionEnd).toLocaleDateString('ru-RU') : 'не активна'}</span>
                        <button class="btn btn-small ${user?.subscriptionEnd ? 'btn-outline' : 'btn-primary'}" 
                                onclick="app.manageSubscription()">
                            ${user?.subscriptionEnd ? 'Изменить' : 'Активировать'}
                        </button>
                    </div>
                </div>

                <div class="learning-path-section">
                    <h3>🛣️ Мой путь</h3>
                    <div class="path-description">
                        ${currentLevel.description}
                    </div>
                    
                    <div class="path-levels">
                        ${Object.entries(this.learningPath).map(([levelName, levelData], index) => {
                            const isCurrent = progress.level === levelName;
                            const isCompleted = progress.experience >= levelData.minExp;
                            const progressPercent = Math.min(100, ((progress.experience - levelData.minExp) / (levelData.maxExp - levelData.minExp)) * 100);
                            
                            return `
                                <div class="path-level ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}">
                                    <div class="level-header">
                                        <div class="level-icon">${index + 1}️⃣</div>
                                        <div class="level-info">
                                            <div class="level-name">${levelName}</div>
                                            <div class="level-exp">${levelData.minExp} - ${levelData.maxExp} XP</div>
                                        </div>
                                        ${isCompleted ? '<div class="level-badge">✅</div>' : ''}
                                    </div>
                                    
                                    ${isCurrent ? `
                                    <div class="level-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                                        </div>
                                        <div class="progress-text">${progress.experience} / ${levelData.maxExp} XP</div>
                                    </div>
                                    
                                    <div class="level-requirements">
                                        <strong>Требования для перехода:</strong>
                                        <ul>
                                            ${levelData.steps.map(step => `<li>${step}</li>`).join('')}
                                        </ul>
                                    </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
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
                            <div class="stat-value">${progress.steps?.coursesBought || 0}</div>
                            <div class="stat-label">Приобретенных курсов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.modulesCompleted || 0}</div>
                            <div class="stat-label">Завершенных модулей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.materialsWatched || 0}</div>
                            <div class="stat-label">Просмотренных материалов</div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.showSettings()">
                        ⚙️ Настройки
                    </button>
                    <button class="btn btn-secondary" onclick="app.renderPage('myMaterials')">
                        📚 Мои материалы
                    </button>
                    ${this.isAdmin ? `
                    <button class="btn btn-secondary" onclick="app.renderPage('admin')">
                        🔧 Админ-панель
                    </button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="app.exportData()">
                        📤 Экспорт данных
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== АДМИН-ПАНЕЛЬ ====================

    createAdminPage() {
        if (!this.isAdmin) {
            return this.createAccessDeniedPage();
        }

        return `
            <div class="page admin-page">
                <div class="admin-header">
                    <h2>${this.isSuperAdmin ? '🛠️ Супер-админ' : '🔧 Админ'}</h2>
                    <p class="admin-subtitle">Панель управления Академией</p>
                </div>

                <div class="admin-stats">
                    <div class="admin-stat-card">
                        <div class="stat-value">${this.allContent.stats?.totalUsers || 1567}</div>
                        <div class="stat-label">Пользователей</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="stat-value">${this.allContent.courses?.length || 0}</div>
                        <div class="stat-label">Курсов</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="stat-value">${this.allContent.materials?.length || 0}</div>
                        <div class="stat-label">Материалов</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="stat-value">${this.allContent.events?.length || 0}</div>
                        <div class="stat-label">Мероприятий</div>
                    </div>
                </div>

                <div class="admin-tabs">
                    ${this.adminTabs.map(tab => `
                        <button class="admin-tab ${this.currentAdminTab === tab ? 'active' : ''}" 
                                onclick="app.switchAdminTab('${tab}')">
                            ${this.getAdminTabIcon(tab)} ${this.getAdminTabName(tab)}
                        </button>
                    `).join('')}
                </div>

                <div class="admin-content">
                    ${this.createAdminTabContent()}
                </div>
            </div>
        `;
    }

    createAdminTabContent() {
        switch(this.currentAdminTab) {
            case 'content':
                return this.createAdminContentTab();
            case 'users':
                return this.createAdminUsersTab();
            case 'analytics':
                return this.createAdminAnalyticsTab();
            case 'settings':
                return this.createAdminSettingsTab();
            default:
                return this.createAdminContentTab();
        }
    }

    createAdminContentTab() {
        return `
            <div class="admin-tab-content active">
                <div class="admin-section">
                    <h3>📚 Управление контентом</h3>
                    <div class="admin-actions-grid">
                        <div class="admin-action-card" onclick="app.showAddContentModal('courses')">
                            <div class="action-icon">📚</div>
                            <div class="action-title">Добавить курс</div>
                            <div class="action-description">Создание нового обучающего курса</div>
                        </div>
                        <div class="admin-action-card" onclick="app.showAddContentModal('podcasts')">
                            <div class="action-icon">🎧</div>
                            <div class="action-title">Добавить подкаст</div>
                            <div class="action-description">Загрузка аудио материалов</div>
                        </div>
                        <div class="admin-action-card" onclick="app.showAddContentModal('streams')">
                            <div class="action-icon">📹</div>
                            <div class="action-title">Добавить эфир</div>
                            <div class="action-description">Планирование прямых эфиров</div>
                        </div>
                        <div class="admin-action-card" onclick="app.showAddContentModal('videos')">
                            <div class="action-icon">🎯</div>
                            <div class="action-title">Добавить видео</div>
                            <div class="action-description">Видео-шпаргалки и уроки</div>
                        </div>
                        <div class="admin-action-card" onclick="app.showAddContentModal('materials')">
                            <div class="action-icon">📋</div>
                            <div class="action-title">Добавить материал</div>
                            <div class="action-description">Практические материалы</div>
                        </div>
                        <div class="admin-action-card" onclick="app.showAddContentModal('events')">
                            <div class="action-icon">🗺️</div>
                            <div class="action-title">Добавить мероприятие</div>
                            <div class="action-description">Онлайн и офлайн события</div>
                        </div>
                    </div>
                </div>

                <div class="admin-section">
                    <h3>📊 Последний добавленный контент</h3>
                    <div class="content-list-admin">
                        ${this.allContent.courses?.slice(0, 5).map(course => `
                            <div class="admin-content-item">
                                <div class="content-image">
                                    <img src="${course.image_url}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                                </div>
                                <div class="content-details">
                                    <h4>${course.title}</h4>
                                    <p>${course.description}</p>
                                    <div class="content-meta">
                                        <span>💰 ${this.formatPrice(course.price)}</span>
                                        <span>⭐ ${course.rating}</span>
                                        <span>👥 ${course.students_count}</span>
                                        <span>🏷️ ${course.category}</span>
                                    </div>
                                </div>
                                <div class="content-actions">
                                    <button class="btn btn-small btn-outline" onclick="app.editContent(${course.id}, 'courses')">
                                        ✏️ Редактировать
                                    </button>
                                    <button class="btn btn-small btn-error" onclick="app.deleteContent(${course.id}, 'courses')">
                                        🗑️ Удалить
                                    </button>
                                    <button class="btn btn-small" onclick="app.toggleContentVisibility(${course.id}, 'courses')">
                                        👁️ Скрыть
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== МЕТОДЫ АДМИН-ПАНЕЛИ ====================

    createAdminUsersTab() {
        return `
            <div class="admin-tab-content">
                <div class="admin-section">
                    <h3>👥 Управление пользователями</h3>
                    <div class="users-stats">
                        <div class="stat-card">
                            <div class="stat-value">${this.allContent.stats?.totalUsers || 1567}</div>
                            <div class="stat-label">Всего пользователей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${Math.floor((this.allContent.stats?.totalUsers || 1567) * 0.7)}</div>
                            <div class="stat-label">Активных подписок</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${Math.floor((this.allContent.stats?.totalUsers || 1567) * 0.3)}</div>
                            <div class="stat-label">Новых за месяц</div>
                        </div>
                    </div>
                    
                    <div class="users-search">
                        <input type="text" class="search-input" placeholder="Поиск пользователей..." id="userSearch">
                        <button class="btn btn-primary" onclick="app.searchUsers()">🔍 Найти</button>
                    </div>
                    
                    <div class="users-list">
                        <div class="user-item">
                            <div class="user-avatar">👤</div>
                            <div class="user-info">
                                <div class="user-name">Иван Петров</div>
                                <div class="user-details">
                                    <span>@ivanpetrov</span>
                                    <span>Подписка до: 15.01.2025</span>
                                </div>
                            </div>
                            <div class="user-actions">
                                <button class="btn btn-small btn-outline">✉️ Написать</button>
                                <button class="btn btn-small">👑 Админ</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminAnalyticsTab() {
        return `
            <div class="admin-tab-content">
                <div class="admin-section">
                    <h3>📊 Аналитика и метрики</h3>
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <div class="analytics-title">DAU/WAU</div>
                            <div class="analytics-value">64%</div>
                            <div class="analytics-chart">📈</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-title">Конверсия</div>
                            <div class="analytics-value">23%</div>
                            <div class="analytics-chart">📊</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-title">Удержание</div>
                            <div class="analytics-value">78%</div>
                            <div class="analytics-chart">📅</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-title">LTV</div>
                            <div class="analytics-value">₽12,450</div>
                            <div class="analytics-chart">💰</div>
                        </div>
                    </div>
                    
                    <div class="analytics-section">
                        <h4>📈 Популярный контент</h4>
                        <div class="popular-content">
                            ${this.allContent.courses?.slice(0, 3).map(course => `
                                <div class="popular-item">
                                    <span class="popular-title">${course.title}</span>
                                    <span class="popular-stats">${course.students_count} студентов</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminSettingsTab() {
        if (!this.isSuperAdmin) {
            return '<div class="admin-message">🚫 Требуются права супер-администратора</div>';
        }

        return `
            <div class="admin-tab-content">
                <div class="admin-section">
                    <h3>⚙️ Настройки системы</h3>
                    
                    <div class="settings-group">
                        <h4>🔔 Уведомления</h4>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" checked> Email уведомления
                            </label>
                        </div>
                        <div class="setting-item">
                            <label class="setting-label">
                                <input type="checkbox" checked> Telegram уведомления
                            </label>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <h4>🔄 Автоматизация</h4>
                        <div class="setting-item">
                            <label class="setting-label">Резервное копирование</label>
                            <select class="setting-select">
                                <option>Ежедневно</option>
                                <option>Еженедельно</option>
                                <option>Ежемесячно</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <h4>🎨 Внешний вид</h4>
                        <div class="setting-item">
                            <label class="setting-label">Тема оформления</label>
                            <select class="setting-select" onchange="app.changeTheme(this.value)">
                                <option value="light">Светлая</option>
                                <option value="dark">Темная</option>
                                <option value="auto">Авто</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button class="btn btn-primary" onclick="app.saveSettings()">💾 Сохранить настройки</button>
                        <button class="btn btn-error" onclick="app.resetSettings()">🔄 Сбросить</button>
                    </div>
                </div>
            </div>
        `;
    }

    switchAdminTab(tab) {
        this.currentAdminTab = tab;
        this.renderPage('admin');
    }

    getAdminTabIcon(tab) {
        const icons = {
            'content': '📚',
            'users': '👥',
            'analytics': '📊',
            'settings': '⚙️'
        };
        return icons[tab] || '📁';
    }

    getAdminTabName(tab) {
        const names = {
            'content': 'Контент',
            'users': 'Пользователи',
            'analytics': 'Аналитика',
            'settings': 'Настройки'
        };
        return names[tab] || tab;
    }

    showAddContentModal(contentType) {
        const modal = document.createElement('div');
        modal.className = 'media-modal admin-modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content admin-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>➕ Добавить ${this.getContentTypeName(contentType)}</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="addContentForm" onsubmit="app.submitContentForm(event, '${contentType}')">
                            <div class="form-group">
                                <label>Название</label>
                                <input type="text" class="form-input" name="title" required>
                            </div>
                            <div class="form-group">
                                <label>Описание</label>
                                <textarea class="form-textarea" name="description" rows="3" required></textarea>
                            </div>
                            ${this.getContentTypeFields(contentType)}
                            <div class="form-group">
                                <label>Загрузить файл</label>
                                <input type="file" class="form-file" name="file" 
                                       accept="${this.getFileAcceptType(contentType)}">
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">💾 Сохранить</button>
                                <button type="button" class="btn btn-outline" onclick="this.closest('.media-modal').remove()">❌ Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    getContentTypeFields(contentType) {
        const fields = {
            'courses': `
                <div class="form-group">
                    <label>Цена (₽)</label>
                    <input type="number" class="form-input" name="price" required>
                </div>
                <div class="form-group">
                    <label>Скидка (%)</label>
                    <input type="number" class="form-input" name="discount" min="0" max="100">
                </div>
                <div class="form-group">
                    <label>Длительность</label>
                    <input type="text" class="form-input" name="duration" placeholder="12 недель" required>
                </div>
                <div class="form-group">
                    <label>Количество модулей</label>
                    <input type="number" class="form-input" name="modules" required>
                </div>
            `,
            'podcasts': `
                <div class="form-group">
                    <label>Длительность</label>
                    <input type="text" class="form-input" name="duration" placeholder="45:20" required>
                </div>
                <div class="form-group">
                    <label>Категория</label>
                    <input type="text" class="form-input" name="category" required>
                </div>
            `,
            'videos': `
                <div class="form-group">
                    <label>Длительность</label>
                    <input type="text" class="form-input" name="duration" placeholder="8:30" required>
                </div>
                <div class="form-group">
                    <label>Категория</label>
                    <input type="text" class="form-input" name="category" required>
                </div>
            `
        };
        return fields[contentType] || '';
    }

    getFileAcceptType(contentType) {
        const types = {
            'podcasts': 'audio/*',
            'videos': 'video/*',
            'materials': '.pdf,.doc,.docx,.jpg,.jpeg,.png',
            'courses': 'image/*,video/*'
        };
        return types[contentType] || '*/*';
    }

    async submitContentForm(event, contentType) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await this.safeApiCall('/api/admin/content', {
                method: 'POST',
                body: formData
            });

            if (response.success) {
                this.showNotification(`${this.getContentTypeName(contentType)} успешно создан`, 'success');
                document.querySelector('.media-modal')?.remove();
                this.loadContent(); // Перезагружаем контент
            }
        } catch (error) {
            console.error('Error creating content:', error);
            this.showNotification('Ошибка создания контента', 'error');
        }
    }

    editContent(contentId, contentType) {
        this.showNotification(`Редактирование ${this.getContentTypeName(contentType)} #${contentId}`, 'info');
        // Здесь можно открыть модальное окно редактирования
    }

    deleteContent(contentId, contentType) {
        if (confirm(`Вы уверены, что хотите удалить этот ${this.getContentTypeName(contentType)}?`)) {
            this.showNotification(`${this.getContentTypeName(contentType)} удален`, 'success');
            // Здесь будет вызов API для удаления
        }
    }

    toggleContentVisibility(contentId, contentType) {
        this.showNotification(`Видимость контента изменена`, 'info');
        // Здесь будет вызов API для изменения видимости
    }

    getContentTypeName(type) {
        const names = {
            'courses': 'курс',
            'podcasts': 'подкаст',
            'streams': 'эфир',
            'videos': 'видео',
            'materials': 'материал',
            'events': 'мероприятие'
        };
        return names[type] || 'контент';
    }
    
    // ==================== МЕДИА ОБРАБОТЧИКИ ====================

    createMediaHandler(type, url, options = {}) {
        switch(type) {
            case 'image':
                return this.handleImage(url, options);
            case 'video':
                return this.handleVideo(url, options);
            case 'audio':
                return this.handleAudio(url, options);
            case 'html':
                return this.handleHTML(url, options);
            default:
                return this.handleDefault(url, options);
        }
    }

    handleImage(url, options) {
        this.openImageViewer(url, options);
    }

    handleVideo(url, options) {
        this.openVideoPlayer(url, options);
    }

    handleAudio(url, options) {
        this.openAudioPlayer(url, options);
    }

    handleHTML(url, options) {
        window.open(url, '_blank');
    }

    openImageViewer(imageUrl, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'media-modal image-viewer active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${options.title || 'Изображение'}</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <img src="${imageUrl}" alt="${options.alt || ''}" 
                             style="max-width: 100%; max-height: 70vh; object-fit: contain;">
                        ${options.caption ? `<div class="image-caption">${options.caption}</div>` : ''}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="app.downloadMedia('${imageUrl}', '${options.title || 'image'}')">
                            📥 Скачать
                        </button>
                        <button class="btn btn-outline" onclick="app.shareMedia('${imageUrl}', '${options.title || ''}')">
                            📤 Поделиться
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    openVideoPlayer(videoUrl, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'media-modal video-player active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content video-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${options.title || 'Видео'}</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <video controls autoplay style="width: 100%; max-height: 60vh;">
                            <source src="${videoUrl}" type="video/mp4">
                            Ваш браузер не поддерживает видео.
                        </video>
                        ${options.description ? `<div class="video-description">${options.description}</div>` : ''}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="app.toggleFavorite(${options.id}, 'videos')">
                            ${this.isFavorite(options.id, 'videos') ? '❤️' : '🤍'} В избранное
                        </button>
                        <button class="btn btn-outline" onclick="app.downloadMedia('${videoUrl}', '${options.title || 'video'}')">
                            📥 Скачать
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const video = modal.querySelector('video');
        video.play().catch(e => {
            console.log('Автовоспроизведение заблокировано');
        });
    }

    // ==================== МЕДИА ОБРАБОТЧИКИ ====================

    createMediaHandler(type, url, options = {}) {
        switch(type) {
            case 'image':
                return this.handleImage(url, options);
            case 'video':
                return this.handleVideo(url, options);
            case 'audio':
                return this.handleAudio(url, options);
            case 'html':
                return this.handleHTML(url, options);
            default:
                return this.handleDefault(url, options);
        }
    }

    handleImage(url, options) {
        this.openImageViewer(url, options);
    }

    handleVideo(url, options) {
        this.openVideoPlayer(url, options);
    }

    handleAudio(url, options) {
        this.openAudioPlayer(url, options);
    }

    handleHTML(url, options) {
        window.open(url, '_blank');
    }

    handleDefault(url, options) {
        window.open(url, '_blank');
    }

    openImageViewer(imageUrl, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'media-modal image-viewer active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${options.title || 'Изображение'}</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <img src="${imageUrl}" alt="${options.alt || ''}" 
                             style="max-width: 100%; max-height: 70vh; object-fit: contain;">
                        ${options.caption ? `<div class="image-caption">${options.caption}</div>` : ''}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="app.downloadMedia('${imageUrl}', '${options.title || 'image'}')">
                            📥 Скачать
                        </button>
                        <button class="btn btn-outline" onclick="app.shareMedia('${imageUrl}', '${options.title || ''}')">
                            📤 Поделиться
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    openVideoPlayer(videoUrl, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'media-modal video-player active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content video-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${options.title || 'Видео'}</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <video controls autoplay style="width: 100%; max-height: 60vh;">
                            <source src="${videoUrl}" type="video/mp4">
                            Ваш браузер не поддерживает видео.
                        </video>
                        ${options.description ? `<div class="video-description">${options.description}</div>` : ''}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="app.toggleFavorite(${options.id}, 'videos')">
                            ${this.isFavorite(options.id, 'videos') ? '❤️' : '🤍'} В избранное
                        </button>
                        <button class="btn btn-outline" onclick="app.downloadMedia('${videoUrl}', '${options.title || 'video'}')">
                            📥 Скачать
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const video = modal.querySelector('video');
        video.play().catch(e => {
            console.log('Автовоспроизведение заблокировано');
        });
    }

    openAudioPlayer(audioUrl, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'media-modal audio-player active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content audio-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>🎧 ${options.title || 'Аудио'}</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="audio-info">
                            ${options.cover ? `<img src="${options.cover}" class="audio-cover">` : ''}
                            <div class="audio-details">
                                <div class="audio-title">${options.title}</div>
                                ${options.artist ? `<div class="audio-artist">${options.artist}</div>` : ''}
                            </div>
                        </div>
                        <audio controls autoplay style="width: 100%; margin: 20px 0;">
                            <source src="${audioUrl}" type="audio/mpeg">
                            Ваш браузер не поддерживает аудио.
                        </audio>
                        ${options.description ? `<div class="audio-description">${options.description}</div>` : ''}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="app.toggleFavorite(${options.id}, 'podcasts')">
                            ${this.isFavorite(options.id, 'podcasts') ? '❤️' : '🤍'} В избранное
                        </button>
                        <button class="btn btn-outline" onclick="app.downloadMedia('${audioUrl}', '${options.title || 'audio'}')">
                            📥 Скачать
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const audio = modal.querySelector('audio');
        audio.play().catch(e => {
            console.log('Автовоспроизведение заблокировано');
        });
    }

    downloadMedia(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showNotification('Файл скачивается', 'success');
    }

    shareMedia(url, title = '') {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url
            }).catch(error => {
                console.log('Ошибка sharing:', error);
                this.copyToClipboard(url);
            });
        } else {
            this.copyToClipboard(url);
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Ссылка скопирована в буфер', 'success');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            this.showNotification('Ошибка копирования', 'error');
        });
    }
    
    // ==================== СИСТЕМА ЛАЙКОВ/ИЗБРАННОГО ====================

    async toggleFavorite(contentId, contentType, event = null) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        try {
            const button = event?.target?.closest('.favorite-btn');
            if (button) {
                button.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 150);
            }

        const wasFavorite = this.isFavorite(contentId, contentType);
        
        const response = await this.safeApiCall('/api/favorites/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: this.currentUser.id,
                contentId: contentId,
                contentType: contentType
            })
        });

        if (response.success) {
            if (response.action === 'added') {
                if (!this.state.favorites[contentType].includes(contentId)) {
                    this.state.favorites[contentType].push(contentId);
                }
                this.showNotification('❤️ Добавлено в избранное', 'success');
                this.animateFavoriteButton(button, true);
            } else {
                this.state.favorites[contentType] = this.state.favorites[contentType].filter(id => id !== contentId);
                this.showNotification('💔 Удалено из избранного', 'info');
                this.animateFavoriteButton(button, false);
            }
            
            this.updateFavoritesCount();
            
            if (this.currentPage === 'favorites') {
                this.renderPage('favorites');
            }
        }
    } catch (error) {
        console.error('Ошибка переключения избранного:', error);
        this.showNotification('❌ Ошибка обновления избранного', 'error');
    }
}

    animateFavoriteButton(button, isFavorite) {
        if (!button) return;
        
        button.innerHTML = isFavorite ? '❤️' : '🤍';
        button.classList.toggle('active', isFavorite);
        
        button.style.animation = 'pulse 0.3s ease-in-out';
        setTimeout(() => {
            button.style.animation = '';
        }, 300);
    }

    isFavorite(contentId, contentType) {
        return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    initializePageComponents() {
        // Инициализация видео плееров
        this.initializeVideoPlayers();
        
        // Инициализация аудио плееров
        this.initializeAudioPlayers();
        
        // Инициализация фильтров
        this.initializeFilters();
        
        // Инициализация табов
        this.initializeTabs();
    }

    initializeVideoPlayers() {
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('play', () => {
                this.mediaPlayers.video = video;
            });
        });
    }

    initializeAudioPlayers() {
        document.querySelectorAll('audio').forEach(audio => {
            audio.addEventListener('play', () => {
                if (this.mediaPlayers.audio && this.mediaPlayers.audio !== audio) {
                    this.mediaPlayers.audio.pause();
                }
                this.mediaPlayers.audio = audio;
            });
        });
    }

    initializeFilters() {
        // Инициализация фильтров поиска
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e);
            }, 300));
        });
    }

    initializeTabs() {
        // Инициализация системы табов
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        const activeBtn = document.querySelector(`[onclick*="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    switchCourseTab(tabName) {
        this.switchTab(tabName);
    }

    setupEventListeners() {
        // Глобальные обработчики событий
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleBackButton();
            }
        });

        // Обработчики навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });

        // Обработчики действий
        document.querySelectorAll('.nav-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (page) {
                    this.renderPage(page);
                }
            });
        });

        console.log('✅ Обработчики событий установлены');
    }

    handleBackButton() {
        if (this.currentSubPage) {
            this.currentSubPage = '';
            this.renderPage(this.currentPage);
        } else if (this.currentPage !== 'home') {
            this.renderPage('home');
        } else {
            if (window.Telegram && Telegram.WebApp) {
                try {
                    Telegram.WebApp.close();
                } catch (e) {
                    this.showNotification('Используйте кнопку назад в Telegram', 'info');
                }
            }
        }
    }

    getFilteredCourses() {
        let courses = this.allContent.courses || [];
        
        // Фильтрация по поиску
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            courses = courses.filter(course => 
                course.title.toLowerCase().includes(query) ||
                course.description.toLowerCase().includes(query) ||
                course.category.toLowerCase().includes(query)
            );
        }
        
        // Фильтрация по категории
        if (this.state.activeFilters.category) {
            courses = courses.filter(course => course.category === this.state.activeFilters.category);
        }
        
        // Фильтрация по уровню
        if (this.state.activeFilters.level) {
            courses = courses.filter(course => course.level === this.state.activeFilters.level);
        }
        
        // Сортировка
        switch (this.state.sortBy) {
            case 'popular':
                courses.sort((a, b) => b.students_count - a.students_count);
                break;
            case 'price_low':
                courses.sort((a, b) => a.price - b.price);
                break;
            case 'price_high':
                courses.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                courses.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
            default:
                courses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }
        
        return courses;
    }

    handleSearch(event) {
        this.state.searchQuery = event.target.value;
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.renderPage(this.currentPage);
        }, 300);
    }

    searchCourses() {
        this.renderPage('courses');
    }

    toggleViewMode(mode) {
        this.state.viewMode = mode;
        this.renderPage(this.currentPage);
    }

    applyFilter(filterType, value) {
        if (value === '') {
            delete this.state.activeFilters[filterType];
        } else {
            this.state.activeFilters[filterType] = value;
        }
        this.renderPage(this.currentPage);
    }

    applySorting(sortBy) {
        this.state.sortBy = sortBy;
        this.renderPage(this.currentPage);
    }

    resetFilters() {
        this.state.activeFilters = {};
        this.state.searchQuery = '';
        this.state.sortBy = 'newest';
        this.renderPage(this.currentPage);
    }

    filterNews(category) {
        this.currentNewsFilter = category;
        this.renderPage('home');
    }

    openCourseDetail(courseId) {
        this.state.currentCourse = courseId;
        this.currentSubPage = `course-${courseId}`;
        this.renderPage('courses', `course-${courseId}`);
    }

    previewCourse(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        if (course && course.video_url) {
            this.handleVideo(course.video_url, {
                title: `Предпросмотр: ${course.title}`,
                id: courseId
            });
        } else {
            this.showNotification('Предпросмотр для этого курса пока недоступен', 'info');
        }
    }

    calculateHomeStats() {
        return {
            courses: this.allContent.stats?.totalCourses || this.allContent.courses?.length || 0,
            students: this.allContent.stats?.totalUsers || 0,
            experts: 25
        };
    }

    getRecommendedCourses() {
        return this.allContent.courses?.filter(course => course.featured) || [];
    }

    getLiveStreams() {
        return this.allContent.streams?.filter(stream => stream.is_live) || [];
    }

    createEmptyState(type, message = 'Пока ничего нет') {
        const emptyStates = {
            courses: { icon: '📚', title: 'Курсы не найдены', description: message },
            podcasts: { icon: '🎧', title: 'Подкасты не найдены', description: message },
            streams: { icon: '📹', title: 'Эфиры не найдены', description: message },
            videos: { icon: '🎯', title: 'Видео не найдены', description: message },
            materials: { icon: '📋', title: 'Материалы не найдены', description: message }
        };
        
        const state = emptyStates[type] || { icon: '🔍', title: 'Ничего не найдено', description: message };
        
        return `
            <div class="empty-state">
                <div class="empty-icon">${state.icon}</div>
                <div class="empty-title">${state.title}</div>
                <div class="empty-description">${state.description}</div>
            </div>
        `;
    }

    showFatalError(message) {
        console.error('💥 Фатальная ошибка:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fatal-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    Перезагрузить
                </button>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorDiv);
    }
    
    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    async safeApiCall(url, options = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`${this.config.API_BASE_URL}${url}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`API Call failed: ${url}`, error);
            
            if (url === '/api/content') {
                return { success: true, data: this.getDemoContentData() };
            } else if (url === '/api/user') {
                return { success: true, user: this.getDemoUserData() };
            }
            
            return { success: false, error: error.message };
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Уведомление [${type}]: ${message}`);
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getNotificationIcon(type)}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || '💡';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' ₽';
    }

    getLevelName(level) {
        const levels = {
            'beginner': 'Начинающий',
            'intermediate': 'Средний',
            'advanced': 'Продвинутый'
        };
        return levels[level] || level;
    }

    getProfileStatus() {
        if (this.isSuperAdmin) return '🛠️ Супер-админ';
        if (this.isAdmin) return '🔧 Админ';
        return '👤 Активный участник';
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

    updateFavoritesCount() {
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
            const totalFavorites = Object.values(this.state.favorites).flat().length;
            favoritesCount.textContent = totalFavorites;
            favoritesCount.style.display = totalFavorites > 0 ? 'flex' : 'none';
        }
    }

    // ==================== ДЕМО-ДАННЫЕ ====================

    createDemoUser() {
        this.currentUser = {
            id: 898508164,
            firstName: 'Демо Пользователь',
            isAdmin: true,
            isSuperAdmin: true,
            subscriptionEnd: new Date('2024-12-31').toISOString(),
            avatarUrl: null,
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
                    materialsWatched: 12,
                    eventsAttended: 1
                }
            }
        };
        
        this.isAdmin = true;
        this.isSuperAdmin = true;
        this.updateAdminBadge();
        this.state.favorites = this.currentUser.favorites;
        this.updateFavoritesCount();
    }

    createDemoContent() {
        this.allContent = this.getDemoContentData();
    }

    getDemoContentData() {
        return {
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
                    image_url: '/webapp/assets/course-default.jpg',
                    video_url: 'https://example.com/video1'
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
                    image_url: '/webapp/assets/podcast-default.jpg',
                    audio_url: 'https://example.com/audio1'
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'LIVE: Ответы на вопросы по мануальной терапии',
                    description: 'Прямой эфир с ответами на вопросы',
                    duration: '2:15:00',
                    category: 'Мануальные техники',
                    participants: 156,
                    is_live: true,
                    thumbnail_url: '/webapp/assets/stream-default.jpg',
                    video_url: 'https://example.com/stream2'
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Техника мобилизации шейного отдела',
                    description: 'Практическая демонстрация техники',
                    duration: '8:30',
                    category: 'Мануальные техники',
                    views: 567,
                    thumbnail_url: '/webapp/assets/video-default.jpg',
                    video_url: 'https://example.com/video5'
                }
            ],
            materials: [
                {
                    id: 1,
                    title: 'Чек-лист неврологического осмотра',
                    description: 'Полный чек-лист для стандартного осмотра',
                    category: 'Неврология',
                    material_type: 'checklist',
                    downloads: 234,
                    image_url: '/webapp/assets/material-default.jpg',
                    file_url: 'https://example.com/material1.pdf'
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Конференция по современной неврологии',
                    description: 'Ежегодная конференция с ведущими специалистами',
                    event_type: 'offline',
                    event_date: '2024-12-15T10:00:00.000Z',
                    location: 'Москва, ул. Профессиональная, 15',
                    participants: 250,
                    image_url: '/webapp/assets/event-default.jpg',
                    registration_url: 'https://example.com/register1'
                }
            ],
            stats: {
                totalUsers: 1567,
                totalCourses: 4,
                totalMaterials: 3,
                totalEvents: 3
            }
        };
    }

    getDemoUserData() {
        return {
            id: 898508164,
            firstName: 'Демо Пользователь',
            isAdmin: true,
            isSuperAdmin: true,
            subscriptionEnd: new Date('2024-12-31').toISOString(),
            avatarUrl: null,
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
                    materialsWatched: 12,
                    eventsAttended: 1
                }
            }
        };
    }

    // ... остальные методы для других страниц и функциональности
}

// Глобальная инициализация
window.AcademyApp = AcademyApp;
console.log('✅ AcademyApp class loaded');

// Глобальная обработка ошибок
window.addEventListener('error', function(event) {
    console.error('🚨 Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});
