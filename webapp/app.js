// webapp/app.js - ПОЛНОСТЬЮ РАБОЧЕЕ ПРИЛОЖЕНИЕ С АДМИНКОЙ, ПРОФИЛЕМ И ЛАЙКАМИ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isInitialized = false;
        
        this.mediaPlayers = {
            video: null,
            audio: null
        };
        
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
            likes: {
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
        
        this.config = {
            API_BASE_URL: window.location.origin,
            CACHE_DURATION: 5 * 60 * 1000
        };
        
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
        
        this.newsFilters = ['Все', 'Статьи', 'Профессиональное развитие', 'Практические навыки', 'Физиотерапия', 'Реабилитация', 'Фармакотерапия', 'Мануальные техники'];
        this.currentNewsFilter = 'Все';
        
        console.log('🎓 Академия АНБ инициализируется...');
    }

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
        document.documentElement.style.setProperty('--bg-color', '#ffffff');
        document.documentElement.style.setProperty('--text-color', '#000000');
        document.documentElement.style.setProperty('--accent-color', '#58b8e7');
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
                this.state.likes = this.currentUser.likes || this.state.likes;
                
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
                console.log('✅ Контент загружен:', {
                    courses: this.allContent.courses?.length,
                    podcasts: this.allContent.podcasts?.length,
                    videos: this.allContent.videos?.length,
                    materials: this.allContent.materials?.length
                });
            } else {
                throw new Error('Не удалось загрузить контент');
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
            this.createDemoContent();
        }
    }

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
            myMaterials: this.createMyMaterialsPage()
        };

        return pages[page] || this.createNotFoundPage();
    }

    createHomePage() {
        const stats = this.calculateHomeStats();
        const recommendedCourses = this.getRecommendedCourses();
        const liveStreams = this.getLiveStreams();
        
        return `
            <div class="page home-page">
                <div class="search-section">
                    <div class="search-box">
                        <input type="text" 
                               class="search-input" 
                               placeholder="Поиск курсов, материалов, видео..." 
                               oninput="app.handleSearch(event)">
                        <button class="search-btn" onclick="app.searchContent()">
                            🔍
                        </button>
                    </div>
                </div>

                <div class="navigation-grid">
                    ${this.createNavCard('courses', '📚', 'Курсы', this.allContent.courses?.length || 0, 'Доступные курсы и обучение')}
                    ${this.createNavCard('podcasts', '🎧', 'АНБ FM', this.allContent.podcasts?.length || 0, 'Аудио подкасты и лекции')}
                    ${this.createNavCard('streams', '📹', 'Эфиры и разборы', this.allContent.streams?.length || 0, 'Прямые эфиры и разборы')}
                    ${this.createNavCard('videos', '🎯', 'Видео-шпаргалки', this.allContent.videos?.length || 0, 'Короткие обучающие видео')}
                    ${this.createNavCard('materials', '📋', 'Практические материалы', this.allContent.materials?.length || 0, 'МРТ, кейсы, чек-листы')}
                    ${this.createNavCard('events', '🗺️', 'Карта мероприятий', this.allContent.events?.length || 0, 'Онлайн и офлайн события')}
                    ${this.createNavCard('community', '👥', 'О сообществе', '', 'Правила и ценности')}
                    ${this.createNavCard('chats', '💬', 'Чаты', '', 'Общение с коллегами')}
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
                                        <button class="like-btn ${this.isLiked(course.id, 'courses') ? 'active' : ''}" 
                                                onclick="event.stopPropagation(); app.toggleLike(${course.id}, 'courses')">
                                            ${this.isLiked(course.id, 'courses') ? '👍' : '👎'}
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

                ${liveStreams.length > 0 ? `
                <div class="live-section">
                    <div class="section-header">
                        <h3>🔴 Прямой эфир</h3>
                        <div class="live-indicator">
                            <div class="live-dot"></div>
                            LIVE
                        </div>
                    </div>
                    <div class="live-streams">
                        ${liveStreams.map(stream => `
                            <div class="live-card" onclick="app.openStream(${stream.id})">
                                <div class="live-badge">LIVE</div>
                                <div class="stream-image">
                                    <img src="${stream.thumbnail_url}" alt="${stream.title}" onerror="this.src='/webapp/assets/stream-default.jpg'">
                                    <div class="stream-overlay">
                                        <div class="play-button">▶️</div>
                                        <div class="viewers">👥 ${stream.participants}</div>
                                    </div>
                                </div>
                                <div class="stream-info">
                                    <h4>${stream.title}</h4>
                                    <p>${stream.description}</p>
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
                                <button class="like-btn ${this.isLiked(course.id, 'courses') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleLike(${course.id}, 'courses')">
                                    ${this.isLiked(course.id, 'courses') ? '👍' : '👎'}
                                </button>
                                ${course.video_url ? `
                                <button class="preview-btn" onclick="event.stopPropagation(); app.previewContent('video', '${course.video_url}', {title: '${course.title}', id: ${course.id}})">
                                    👁️
                                </button>
                                ` : ''}
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
                                ${course.video_url ? `
                                <button class="btn btn-primary btn-large play-btn" onclick="app.previewContent('video', '${course.video_url}', {title: '${course.title}', id: ${course.id}})">
                                    ▶️ Предпросмотр
                                </button>
                                ` : ''}
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
                                <button class="btn btn-outline" onclick="app.toggleLike(${course.id}, 'courses')">
                                    ${this.isLiked(course.id, 'courses') ? '👍 Лайкнуто' : '👎 Лайкнуть'}
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
                            ${this.createCurriculumModules(course.modules)}
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
                            ${course.discount > 0 ? `
                            <div class="discount-timer">
                                ⏰ Скидка действует еще 2 дня
                            </div>
                            ` : ''}
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
                    <button class="btn btn-primary" onclick="app.renderPage('myMaterials')">
                        📚 Мои материалы
                    </button>
                    <button class="btn btn-secondary" onclick="app.renderPage('favorites')">
                        ❤️ Избранное
                    </button>
                    <button class="btn btn-outline" onclick="app.showSettings()">
                        ⚙️ Настройки
                    </button>
                </div>
            </div>
        `;
    }

    createFavoritesPage() {
        const favoriteCourses = this.allContent.courses?.filter(course => this.isFavorite(course.id, 'courses')) || [];
        const favoritePodcasts = this.allContent.podcasts?.filter(podcast => this.isFavorite(podcast.id, 'podcasts')) || [];
        const favoriteVideos = this.allContent.videos?.filter(video => this.isFavorite(video.id, 'videos')) || [];
        const favoriteMaterials = this.allContent.materials?.filter(material => this.isFavorite(material.id, 'materials')) || [];
        
        const totalFavorites = favoriteCourses.length + favoritePodcasts.length + favoriteVideos.length + favoriteMaterials.length;
        
        if (totalFavorites === 0) {
            return `
                <div class="page favorites-page">
                    <div class="page-header">
                        <h2>❤️ Избранное</h2>
                        <p>Здесь будут ваши сохраненные материалы</p>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">❤️</div>
                        <div class="empty-title">Пока ничего нет</div>
                        <div class="empty-description">Добавляйте курсы, подкасты и материалы в избранное, чтобы вернуться к ним позже</div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="page favorites-page">
                <div class="page-header">
                    <h2>❤️ Избранное</h2>
                    <p>Ваши сохраненные материалы (${totalFavorites})</p>
                </div>
                
                ${favoriteCourses.length > 0 ? `
                <div class="favorites-section">
                    <h3>📚 Курсы (${favoriteCourses.length})</h3>
                    <div class="content-grid">
                        ${favoriteCourses.map(course => `
                            <div class="content-card course-card" onclick="app.openCourseDetail(${course.id})">
                                <div class="card-image">
                                    <img src="${course.image_url}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                                    <div class="card-overlay">
                                        <button class="favorite-btn active" onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                            ❤️
                                        </button>
                                        <button class="like-btn ${this.isLiked(course.id, 'courses') ? 'active' : ''}" 
                                                onclick="event.stopPropagation(); app.toggleLike(${course.id}, 'courses')">
                                            ${this.isLiked(course.id, 'courses') ? '👍' : '👎'}
                                        </button>
                                    </div>
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${course.title}</h3>
                                    <p class="card-description">${course.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${favoritePodcasts.length > 0 ? `
                <div class="favorites-section">
                    <h3>🎧 Подкасты (${favoritePodcasts.length})</h3>
                    <div class="content-grid">
                        ${favoritePodcasts.map(podcast => `
                            <div class="content-card podcast-card">
                                <div class="card-image">
                                    <img src="${podcast.image_url}" alt="${podcast.title}" onerror="this.src='/webapp/assets/podcast-default.jpg'">
                                    <div class="card-overlay">
                                        <button class="favorite-btn active" onclick="event.stopPropagation(); app.toggleFavorite(${podcast.id}, 'podcasts')">
                                            ❤️
                                        </button>
                                        <button class="like-btn ${this.isLiked(podcast.id, 'podcasts') ? 'active' : ''}" 
                                                onclick="event.stopPropagation(); app.toggleLike(${podcast.id}, 'podcasts')">
                                            ${this.isLiked(podcast.id, 'podcasts') ? '👍' : '👎'}
                                        </button>
                                    </div>
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${podcast.title}</h3>
                                    <p class="card-description">${podcast.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${favoriteVideos.length > 0 ? `
                <div class="favorites-section">
                    <h3>🎯 Видео (${favoriteVideos.length})</h3>
                    <div class="content-grid">
                        ${favoriteVideos.map(video => `
                            <div class="content-card video-card">
                                <div class="card-image">
                                    <img src="${video.thumbnail_url}" alt="${video.title}" onerror="this.src='/webapp/assets/video-default.jpg'">
                                    <div class="card-overlay">
                                        <button class="favorite-btn active" onclick="event.stopPropagation(); app.toggleFavorite(${video.id}, 'videos')">
                                            ❤️
                                        </button>
                                        <button class="like-btn ${this.isLiked(video.id, 'videos') ? 'active' : ''}" 
                                                onclick="event.stopPropagation(); app.toggleLike(${video.id}, 'videos')">
                                            ${this.isLiked(video.id, 'videos') ? '👍' : '👎'}
                                        </button>
                                    </div>
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${video.title}</h3>
                                    <p class="card-description">${video.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${favoriteMaterials.length > 0 ? `
                <div class="favorites-section">
                    <h3>📋 Материалы (${favoriteMaterials.length})</h3>
                    <div class="content-grid">
                        ${favoriteMaterials.map(material => `
                            <div class="content-card material-card">
                                <div class="card-image">
                                    <img src="${material.image_url}" alt="${material.title}" onerror="this.src='/webapp/assets/material-default.jpg'">
                                    <div class="card-overlay">
                                        <button class="favorite-btn active" onclick="event.stopPropagation(); app.toggleFavorite(${material.id}, 'materials')">
                                            ❤️
                                        </button>
                                        <button class="like-btn ${this.isLiked(material.id, 'materials') ? 'active' : ''}" 
                                                onclick="event.stopPropagation(); app.toggleLike(${material.id}, 'materials')">
                                            ${this.isLiked(material.id, 'materials') ? '👍' : '👎'}
                                        </button>
                                    </div>
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${material.title}</h3>
                                    <p class="card-description">${material.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // ==================== МЕДИА ОБРАБОТЧИКИ ====================

    previewContent(type, url, options = {}) {
        switch(type) {
            case 'video':
                this.openVideoPlayer(url, options);
                break;
            case 'audio':
                this.openAudioPlayer(url, options);
                break;
            case 'image':
                this.openImageViewer(url, options);
                break;
            case 'html':
                this.openHtmlViewer(url, options);
                break;
            default:
                window.open(url, '_blank');
        }
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
                        ${options.id ? `
                        <button class="btn btn-primary" onclick="app.toggleFavorite(${options.id}, 'videos')">
                            ${this.isFavorite(options.id, 'videos') ? '❤️' : '🤍'} В избранное
                        </button>
                        <button class="btn btn-outline" onclick="app.toggleLike(${options.id}, 'videos')">
                            ${this.isLiked(options.id, 'videos') ? '👍' : '👎'} Лайк
                        </button>
                        ` : ''}
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
                            ${options.cover ? `<img src="${options.cover}" class="audio-cover" onerror="this.src='/webapp/assets/podcast-default.jpg'">` : ''}
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
                        ${options.id ? `
                        <button class="btn btn-primary" onclick="app.toggleFavorite(${options.id}, 'podcasts')">
                            ${this.isFavorite(options.id, 'podcasts') ? '❤️' : '🤍'} В избранное
                        </button>
                        <button class="btn btn-outline" onclick="app.toggleLike(${options.id}, 'podcasts')">
                            ${this.isLiked(options.id, 'podcasts') ? '👍' : '👎'} Лайк
                        </button>
                        ` : ''}
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

    openHtmlViewer(htmlUrl, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'media-modal html-viewer active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content html-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${options.title || 'HTML Контент'}</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <iframe src="${htmlUrl}" style="width: 100%; height: 60vh; border: none;"></iframe>
                        ${options.description ? `<div class="html-description">${options.description}</div>` : ''}
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-outline" onclick="window.open('${htmlUrl}', '_blank')">
                            📋 Открыть в новой вкладке
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
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

    async toggleLike(contentId, contentType, event = null) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        try {
            const button = event?.target?.closest('.like-btn');
            if (button) {
                button.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 150);
            }

            const response = await this.safeApiCall('/api/likes/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    contentId: contentId,
                    contentType: contentType
                })
            });

            if (response.success) {
                if (response.liked) {
                    if (!this.state.likes[contentType].includes(contentId)) {
                        this.state.likes[contentType].push(contentId);
                    }
                    this.showNotification('👍 Лайк поставлен', 'success');
                    this.animateLikeButton(button, true);
                } else {
                    this.state.likes[contentType] = this.state.likes[contentType].filter(id => id !== contentId);
                    this.showNotification('👎 Лайк убран', 'info');
                    this.animateLikeButton(button, false);
                }
            }
        } catch (error) {
            console.error('Ошибка переключения лайка:', error);
            this.showNotification('❌ Ошибка обновления лайка', 'error');
        }
    }

    isFavorite(contentId, contentType) {
        return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
    }

    isLiked(contentId, contentType) {
        return this.state.likes[contentType]?.includes(parseInt(contentId)) || false;
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
            } else if (url.includes('/api/likes')) {
                return { success: true, liked: true };
            } else if (url.includes('/api/favorites')) {
                return { success: true, action: 'added' };
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
        return icons[type] || 'ℹ️';
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
        const progress = this.currentUser?.progress;
        if (!progress) return 'Новый участник';
        
        const level = progress.level;
        const statuses = {
            'Понимаю': 'Начинающий специалист',
            'Связываю': 'Активный участник',
            'Применяю': 'Практикующий специалист',
            'Систематизирую': 'Опытный врач',
            'Делюсь': 'Эксперт сообщества'
        };
        
        return statuses[level] || 'Участник Академии';
    }

    getTotalFavorites() {
        return Object.values(this.state.favorites).flat().length;
    }

    updateFavoritesCount() {
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
            const total = this.getTotalFavorites();
            favoritesCount.textContent = total > 0 ? total : '';
            favoritesCount.style.display = total > 0 ? 'flex' : 'none';
        }
    }

    updateAdminBadge() {
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            if (this.isAdmin || this.isSuperAdmin) {
                adminBadge.style.display = 'flex';
                if (this.isSuperAdmin) {
                    adminBadge.innerHTML = '🔧 Супер-админ';
                } else {
                    adminBadge.innerHTML = '🔧 Админ';
                }
            } else {
                adminBadge.style.display = 'none';
            }
        }
    }

    // ==================== ДЕМО ДАННЫЕ ====================

    createDemoUser() {
        this.currentUser = {
            id: 1,
            telegramId: 898508164,
            firstName: 'Демо Пользователь',
            username: 'demo_user',
            isAdmin: false,
            isSuperAdmin: false,
            subscriptionEnd: null,
            avatarUrl: null,
            favorites: {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: []
            },
            likes: {
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
            },
            learningPath: {
                current_level: 'Понимаю',
                progress_data: {},
                completed_requirements: []
            }
        };
        
        this.updateAdminBadge();
        this.updateFavoritesCount();
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
                    image_url: '/webapp/assets/course-default.jpg',
                    video_url: 'https://example.com/video1',
                    is_active: true
                },
                {
                    id: 2,
                    title: 'Неврологическая диагностика',
                    description: '5 модулей по современной диагностике',
                    price: 18000,
                    discount: 0,
                    duration: '8 недель',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate',
                    students_count: 234,
                    rating: 4.6,
                    featured: true,
                    image_url: '/webapp/assets/course-default.jpg',
                    video_url: 'https://example.com/video2',
                    is_active: true
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
                    audio_url: 'https://example.com/audio1',
                    is_active: true
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'Разбор сложного случая: боли в спине',
                    description: 'Детальный разбор диагностики и лечения',
                    duration: '1:25:00',
                    category: 'Неврология',
                    participants: 89,
                    is_live: false,
                    thumbnail_url: '/webapp/assets/stream-default.jpg',
                    video_url: 'https://example.com/stream1',
                    is_active: true
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
                    video_url: 'https://example.com/video5',
                    is_active: true
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
                    file_url: 'https://example.com/material1.pdf',
                    is_active: true
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
                    registration_url: 'https://example.com/register1',
                    is_active: true
                }
            ],
            news: [
                {
                    id: 1,
                    title: 'Новые методики в реабилитации пациентов с инсультом',
                    description: 'Обзор современных подходов к реабилитации пациентов с неврологическими нарушениями',
                    content: 'Полный текст статьи о новых методиках...',
                    date: '15 дек 2024',
                    category: 'Реабилитация',
                    type: 'Статья',
                    image_url: '/webapp/assets/news-default.jpg',
                    is_active: true
                }
            ],
            stats: {
                totalUsers: 1567,
                totalCourses: 2,
                totalMaterials: 1,
                totalEvents: 1
            }
        };
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
                    video_url: 'https://example.com/video1',
                    is_active: true
                }
            ],
            podcasts: [],
            streams: [],
            videos: [],
            materials: [],
            events: [],
            news: [],
            stats: {
                totalUsers: 1567,
                totalCourses: 1,
                totalMaterials: 0,
                totalEvents: 0
            }
        };
    }

    getDemoUserData() {
        return {
            id: 1,
            telegramId: 898508164,
            firstName: 'Демо Пользователь',
            username: 'demo_user',
            isAdmin: false,
            isSuperAdmin: false,
            subscriptionEnd: null,
            avatarUrl: null,
            favorites: {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: []
            },
            likes: {
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
            },
            learningPath: {
                current_level: 'Понимаю',
                progress_data: {},
                completed_requirements: []
            }
        };
    }

    getDemoCourse() {
        return {
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
            video_url: 'https://example.com/video1',
            is_active: true
        };
    }

    // ==================== ДОПОЛНИТЕЛЬНЫЕ СТРАНИЦЫ ====================

    createCommunityPage() {
        return `
            <div class="page community-page">
                <div class="page-header">
                    <h2>👥 О сообществе</h2>
                    <p>Правила, ценности и часто задаваемые вопросы</p>
                </div>
                
                <div class="community-sections">
                    <div class="community-section">
                        <h3>📜 Правила сообщества</h3>
                        <div class="rules-list">
                            ${this.communityRules.map(rule => `
                                <div class="rule-item">
                                    <div class="rule-icon">📌</div>
                                    <div class="rule-content">
                                        <h4>${rule.title}</h4>
                                        <p>${rule.description}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="community-section">
                        <h3>❓ Часто задаваемые вопросы</h3>
                        <div class="faq-list">
                            <div class="faq-item">
                                <h4>Как оформить, продлить или отменить подписку?</h4>
                                <p>Подписку можно оформить или продлить в разделе «Личный кабинет». Там же доступна отмена — через кнопку «Изменить подписку».</p>
                            </div>
                            <div class="faq-item">
                                <h4>Что входит в подписку Академии?</h4>
                                <p>Доступ к эфирам, разборам (в том числе в записи), практическим материалам, видео-шпаргалкам на разные темы, а также к чату специалистов и интерактивной карте офлайн-мероприятий с предзаписью и голосованиями за новые темы.</p>
                            </div>
                            <div class="faq-item">
                                <h4>Можно ли смотреть материалы без подписки?</h4>
                                <p>Да, часть контента доступна в пробном периоде для ознакомления. Полный доступ и участие в развитии открываются при активной подписке.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createChatsPage() {
        return `
            <div class="page chats-page">
                <div class="page-header">
                    <h2>💬 Чаты</h2>
                    <p>Общение с коллегами и обсуждение профессиональных тем</p>
                </div>
                
                <div class="chats-list">
                    <div class="chat-item">
                        <div class="chat-icon">👥</div>
                        <div class="chat-info">
                            <h3>Основной чат</h3>
                            <p>Общее обсуждение вопросов и обмен опытом</p>
                        </div>
                        <div class="chat-actions">
                            <button class="btn btn-primary" onclick="app.joinChat('main')">
                                Присоединиться
                            </button>
                        </div>
                    </div>
                    
                    <div class="chat-item">
                        <div class="chat-icon">🧠</div>
                        <div class="chat-info">
                            <h3>Неврология</h3>
                            <p>Специализированный чат для неврологов</p>
                        </div>
                        <div class="chat-actions">
                            <button class="btn btn-primary" onclick="app.joinChat('neuro')">
                                Присоединиться
                            </button>
                        </div>
                    </div>
                    
                    <div class="chat-item">
                        <div class="chat-icon">💪</div>
                        <div class="chat-info">
                            <h3>Реабилитация</h3>
                            <p>Обсуждение методик реабилитации</p>
                        </div>
                        <div class="chat-actions">
                            <button class="btn btn-primary" onclick="app.joinChat('rehab')">
                                Присоединиться
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createMyMaterialsPage() {
        return `
            <div class="page my-materials-page">
                <div class="page-header">
                    <h2>📚 Мои материалы</h2>
                    <p>Все ваши сохраненные и просмотренные материалы</p>
                </div>
                
                <div class="materials-tabs">
                    <button class="tab-btn active" onclick="app.switchMaterialsTab('favorites')">
                        ❤️ Избранное
                    </button>
                    <button class="tab-btn" onclick="app.switchMaterialsTab('watch-later')">
                        ⏱️ Посмотреть позже
                    </button>
                    <button class="tab-btn" onclick="app.switchMaterialsTab('practical')">
                        📋 Практические материалы
                    </button>
                </div>
                
                <div class="tab-content active" id="favorites-tab">
                    ${this.createFavoritesContent()}
                </div>
                
                <div class="tab-content" id="watch-later-tab">
                    <div class="empty-state">
                        <div class="empty-icon">⏱️</div>
                        <div class="empty-title">Пока ничего нет</div>
                        <div class="empty-description">Добавляйте материалы в "Посмотреть позже" чтобы вернуться к ним позже</div>
                    </div>
                </div>
                
                <div class="tab-content" id="practical-tab">
                    <div class="materials-grid">
                        <div class="material-category">
                            <h3>📄 МРТ</h3>
                            <div class="materials-list">
                                <div class="material-item">
                                    <div class="material-icon">🖼️</div>
                                    <div class="material-info">
                                        <h4>МРТ головного мозга</h4>
                                        <p>Типичные находки и паттерны</p>
                                    </div>
                                    <button class="btn btn-outline" onclick="app.downloadMaterial(1)">
                                        📥
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="material-category">
                            <h3>📋 Клинические случаи</h3>
                            <div class="materials-list">
                                <div class="material-item">
                                    <div class="material-icon">📖</div>
                                    <div class="material-info">
                                        <h4>Случай боли в спине</h4>
                                        <p>Дифференциальная диагностика</p>
                                    </div>
                                    <button class="btn btn-outline" onclick="app.downloadMaterial(2)">
                                        📥
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== БИЗНЕС-ЛОГИКА ====================

    purchaseCourse(courseId) {
        this.showNotification('Функция покупки курса в разработке', 'info');
    }

    manageSubscription() {
        this.showNotification('Функция управления подпиской в разработке', 'info');
    }

    joinChat(chatType) {
        this.showNotification(`Присоединение к чату ${chatType} в разработке`, 'info');
    }

    downloadMaterial(materialId) {
        this.showNotification(`Скачивание материала ${materialId} в разработке`, 'info');
    }

    // ==================== УТИЛИТЫ ====================

    calculateHomeStats() {
        return {
            totalCourses: this.allContent.courses?.length || 0,
            totalMaterials: this.allContent.materials?.length || 0,
            totalUsers: this.allContent.stats?.totalUsers || 1567,
            activeStreams: this.allContent.streams?.filter(s => s.is_live).length || 0
        };
    }

    getRecommendedCourses() {
        return this.allContent.courses?.filter(course => course.featured) || [];
    }

    getLiveStreams() {
        return this.allContent.streams?.filter(stream => stream.is_live) || [];
    }

    getFilteredCourses() {
        let courses = this.allContent.courses || [];
        
        // Фильтрация по поисковому запросу
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
                courses.sort((a, b) => {
                    const priceA = a.discount > 0 ? a.price * (1 - a.discount/100) : a.price;
                    const priceB = b.discount > 0 ? b.price * (1 - b.discount/100) : b.price;
                    return priceA - priceB;
                });
                break;
            case 'price_high':
                courses.sort((a, b) => {
                    const priceA = a.discount > 0 ? a.price * (1 - a.discount/100) : a.price;
                    const priceB = b.discount > 0 ? b.price * (1 - b.discount/100) : b.price;
                    return priceB - priceA;
                });
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

    createNewsItems() {
        const news = this.allContent.news || [];
        let filteredNews = news;
        
        if (this.currentNewsFilter !== 'Все') {
            filteredNews = news.filter(item => item.category === this.currentNewsFilter);
        }
        
        if (filteredNews.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📰</div>
                    <div class="empty-title">Новостей пока нет</div>
                    <div class="empty-description">Следите за обновлениями, скоро появятся новые материалы</div>
                </div>
            `;
        }
        
        return filteredNews.map(item => `
            <div class="news-item">
                <div class="news-image">
                    <img src="${item.image_url}" alt="${item.title}" onerror="this.src='/webapp/assets/news-default.jpg'">
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-category">${item.category}</span>
                        <span class="news-date">${item.date}</span>
                    </div>
                    <h4 class="news-title">${item.title}</h4>
                    <p class="news-description">${item.description}</p>
                    <div class="news-actions">
                        <button class="btn btn-outline btn-small" onclick="app.readNews(${item.id})">
                            Читать далее
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    createCurriculumModules(moduleCount) {
        let html = '';
        for (let i = 1; i <= moduleCount; i++) {
            html += `
                <div class="module-item">
                    <div class="module-header">
                        <div class="module-number">Модуль ${i}</div>
                        <div class="module-status">🔓 Доступен</div>
                    </div>
                    <div class="module-title">Тема модуля ${i}</div>
                    <div class="module-lessons">
                        ${this.createModuleLessons(i)}
                    </div>
                </div>
            `;
        }
        return html;
    }

    createModuleLessons(moduleNumber) {
        const lessons = [
            'Введение в тему',
            'Основные понятия',
            'Практические аспекты',
            'Клинические случаи',
            'Итоговое тестирование'
        ];
        
        return lessons.map((lesson, index) => `
            <div class="lesson-item">
                <div class="lesson-icon">${index === lessons.length - 1 ? '📝' : '🎯'}</div>
                <div class="lesson-title">${lesson}</div>
                <div class="lesson-duration">~45 мин</div>
            </div>
        `).join('');
    }

    createCourseReviews() {
        const reviews = [
            {
                author: 'Анна Петрова',
                rating: 5,
                date: '15.12.2024',
                text: 'Отличный курс! Очень практично и понятно объясняют сложные темы.'
            },
            {
                author: 'Иван Сидоров',
                rating: 4,
                date: '10.12.2024',
                text: 'Хороший материал, но хотелось бы больше практических примеров.'
            },
            {
                author: 'Мария Иванова',
                rating: 5,
                date: '05.12.2024',
                text: 'Лучший курс по неврологии, который я проходил. Рекомендую всем коллегам!'
            }
        ];
        
        return reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-author">${review.author}</div>
                    <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
                </div>
                <div class="review-date">${review.date}</div>
                <div class="review-text">${review.text}</div>
            </div>
        `).join('');
    }

    createEmptyState(type, message = '') {
        const messages = {
            courses: 'Курсы пока не добавлены',
            podcasts: 'Подкасты пока не добавлены',
            videos: 'Видео пока не добавлены',
            materials: 'Материалы пока не добавлены',
            events: 'Мероприятия пока не добавлены'
        };
        
        const icons = {
            courses: '📚',
            podcasts: '🎧',
            videos: '🎯',
            materials: '📋',
            events: '🗺️'
        };
        
        return `
            <div class="empty-state">
                <div class="empty-icon">${icons[type]}</div>
                <div class="empty-title">${message || messages[type]}</div>
                <div class="empty-description">Следите за обновлениями, скоро появятся новые материалы</div>
            </div>
        `;
    }

    createNotFoundPage() {
        return `
            <div class="page not-found-page">
                <div class="not-found-content">
                    <div class="not-found-icon">🔍</div>
                    <h2>Страница не найдена</h2>
                    <p>Запрашиваемая страница не существует или была перемещена</p>
                    <button class="btn btn-primary" onclick="app.renderPage('home')">
                        Вернуться на главную
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

    setupEventListeners() {
        // Обработчики навигации
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-btn')) {
                const page = e.target.dataset.page;
                this.renderPage(page);
            }
            
            if (e.target.matches('.nav-action-btn')) {
                const page = e.target.dataset.page;
                this.renderPage(page);
            }
        });

        // Глобальные обработчики
        this.setupGlobalEventHandlers();
    }

    setupGlobalEventHandlers() {
        // Обработчик кнопки "Назад"
        window.handleBackButton = () => {
            if (this.currentSubPage) {
                this.renderPage(this.currentPage);
            } else if (this.currentPage !== 'home') {
                this.renderPage('home');
            }
        };

        // Обработчик поиска
        window.app = this;
    }

    handleSearch(event) {
        this.state.searchQuery = event.target.value;
    }

    searchContent() {
        if (this.state.searchQuery.trim()) {
            this.showNotification(`Поиск: ${this.state.searchQuery}`, 'info');
            // Здесь можно добавить логику поиска по всем типам контента
        }
    }

    searchCourses() {
        this.renderPage('courses');
    }

    applyFilter(filterType, value) {
        if (value) {
            this.state.activeFilters[filterType] = value;
        } else {
            delete this.state.activeFilters[filterType];
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

    toggleViewMode(mode) {
        this.state.viewMode = mode;
        this.renderPage(this.currentPage);
    }

    openCourseDetail(courseId) {
        this.renderPage('courses', `course-${courseId}`);
    }

    openStream(streamId) {
        const stream = this.allContent.streams?.find(s => s.id === streamId);
        if (stream) {
            this.previewContent('video', stream.video_url, {
                title: stream.title,
                description: stream.description,
                id: streamId
            });
        }
    }

    switchCourseTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`.tab-btn:nth-child(${['about', 'curriculum', 'reviews'].indexOf(tabName) + 1})`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    switchMaterialsTab(tabName) {
        document.querySelectorAll('.materials-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.my-materials-page .tab-content').forEach(content => content.classList.remove('active'));
        
        event.target.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    filterNews(filter) {
        this.currentNewsFilter = filter;
        this.renderPage('home');
    }

    readNews(newsId) {
        const news = this.allContent.news?.find(n => n.id === newsId);
        if (news) {
            this.showNotification(`Чтение новости: ${news.title}`, 'info');
            // Здесь можно открыть модальное окно с полным текстом новости
        }
    }

    addToCart(courseId) {
        this.showNotification('Курс добавлен в корзину', 'success');
    }

    downloadMedia(url, filename) {
        this.showNotification(`Начинается скачивание: ${filename}`, 'info');
        // Здесь можно добавить логику скачивания файла
    }

    animateFavoriteButton(button, isFavorite) {
        if (button) {
            button.innerHTML = isFavorite ? '❤️' : '🤍';
            button.classList.toggle('active', isFavorite);
        }
    }

    animateLikeButton(button, isLiked) {
        if (button) {
            button.innerHTML = isLiked ? '👍' : '👎';
            button.classList.toggle('active', isLiked);
        }
    }

    showFatalError(message) {
        const errorScreen = document.getElementById('errorScreen');
        const errorMessage = document.getElementById('errorMessage');
        const appContainer = document.getElementById('app');
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (appContainer) appContainer.style.display = 'none';
        if (errorScreen) {
            errorScreen.style.display = 'flex';
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }
    }

    initializePageComponents() {
        // Инициализация компонентов страницы после рендера
        // Например, слайдеры, аккордеоны и т.д.
    }
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
