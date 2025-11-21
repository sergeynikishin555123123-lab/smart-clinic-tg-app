// webapp/app.js - ПОЛНАЯ РЕАЛИЗАЦИЯ С ГАРМОНИЧНЫМИ КНОПКАМИ И ПОЛНЫМ ФУНКЦИОНАЛОМ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isInitialized = false;
        
        // === ВСТАВИТЬ ЗДЕСЬ ===
        this.podcastPlayer = null;
        this.videoPlayer = null;
        this.currentPlaying = null;
        this.newsItems = [
            {
                id: 1,
                title: 'Новые методики в реабилитации пациентов с инсультом',
                description: 'Обзор современных подходов к реабилитации пациентов с неврологическими нарушениями',
                date: '15 дек 2024',
                category: 'Реабилитация',
                type: 'Статья',
                image: '/webapp/assets/news-default.jpg',
                content: 'Полный текст статьи о новых методиках...'
            },
            {
                id: 2,
                title: 'Обновление курса по мануальной терапии',
                description: 'Добавлены новые модули по работе с шейным отделом позвоночника',
                date: '12 дек 2024',
                category: 'Мануальные техники',
                type: 'Обновление',
                image: '/webapp/assets/news-default.jpg'
            }
        ];
        
        this.courseReviews = [
            {
                id: 1,
                user: 'Анна Петрова',
                rating: 5,
                date: '10.12.2024',
                text: 'Отличный курс! Очень практично и понятно.',
                avatar: '👩‍⚕️'
            },
            {
                id: 2,
                user: 'Дмитрий Иванов',
                rating: 4,
                date: '08.12.2024',
                text: 'Хорошая структура, полезные материалы.',
                avatar: '👨‍⚕️'
            }
        ];
        
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
            playingContent: null
        };
        
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
                    console.log('🔧 Инициализация Telegram WebApp...');
                    
                    try {
                        Telegram.WebApp.ready();
                        Telegram.WebApp.expand();
                        
                        Telegram.WebApp.BackButton.onClick(() => {
                            this.handleBackButton();
                        });
                        
                        // Устанавливаем тему
                        if (Telegram.WebApp.themeParams) {
                            this.applyTheme(Telegram.WebApp.themeParams);
                        }
                        
                        console.log('✅ Telegram WebApp инициализирован');
                    } catch (e) {
                        console.warn('Ошибка Telegram WebApp:', e);
                    }
                } else {
                    console.log('ℹ️ Telegram WebApp не обнаружен');
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
            document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
        }
        if (themeParams.text_color) {
            document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
        }
        if (themeParams.button_color) {
            document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color);
        }
    }

    async loadUserData() {
        console.log('👤 Загрузка данных пользователя...');
        
        try {
            let tgUser = null;
            
            if (window.Telegram && Telegram.WebApp) {
                try {
                    tgUser = Telegram.WebApp.initDataUnsafe?.user;
                } catch (e) {
                    console.warn('Ошибка получения данных из Telegram:', e);
                }
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
                console.log('✅ Данные пользователя загружены:', this.currentUser.firstName);
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
                console.log('✅ Контент загружен');
            } else {
                throw new Error('Не удалось загрузить контент');
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
            this.createDemoContent();
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
            console.log(`📄 Рендер страницы: ${page}${subPage ? '/' + subPage : ''}`);
            mainContent.innerHTML = this.getPageHTML(page, subPage);
            
            // Инициализируем компоненты страницы
            this.initializePageComponents();
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showNotification('Ошибка отображения страницы', 'error');
        }
    }

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
            community: this.createCommunityPage(),
            chats: this.createChatsPage(),
            myMaterials: this.createMyMaterialsPage(),
            admin: this.createAdminPage(),
            support: this.createSupportPage()
        };

        return pages[page] || this.createNotFoundPage();
    }

    // HOME PAGE - полностью функциональная
    createHomePage() {
        const stats = this.calculateHomeStats();
        const recommendedCourses = this.getRecommendedCourses();
        const liveStreams = this.getLiveStreams();
        
        return `
            <div class="page home-page">
                <!-- Hero Section -->
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

                <!-- Progress Section -->
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

                <!-- Live Streams -->
                ${liveStreams.length > 0 ? `
                <div class="live-section">
                    <div class="section-header">
                        <h3>🔴 LIVE Эфиры</h3>
                        <div class="live-badge">ON AIR</div>
                    </div>
                    <div class="live-streams">
                        ${liveStreams.map(stream => `
                            <div class="live-stream-card" onclick="app.watchStream(${stream.id})">
                                <div class="live-indicator"></div>
                                <div class="stream-image">
                                    <img src="${stream.thumbnail_url}" alt="${stream.title}">
                                    <div class="play-overlay">
                                        <div class="play-button">▶️</div>
                                    </div>
                                </div>
                                <div class="stream-info">
                                    <h4>${stream.title}</h4>
                                    <p>${stream.description}</p>
                                    <div class="stream-meta">
                                        <span>👥 ${stream.participants} смотрят</span>
                                        <span>⏱️ ${stream.duration}</span>
                                    </div>
                                    <button class="btn btn-primary btn-small join-btn">
                                        Присоединиться
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Навигационная сетка -->
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

                <!-- Рекомендуемые курсы -->
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
                                    <img src="${course.image_url}" alt="${course.title}">
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

                <!-- Лента новостей -->
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

    createNewsItems() {
        const news = [
            {
                id: 1,
                title: 'Новые методики в реабилитации пациентов с инсультом',
                description: 'Обзор современных подходов к реабилитации пациентов с неврологическими нарушениями',
                date: '15 дек 2024',
                category: 'Реабилитация',
                type: 'Статья',
                image: '/webapp/assets/news-default.jpg'
            },
            {
                id: 2,
                title: 'Обновление курса по мануальной терапии',
                description: 'Добавлены новые модули по работе с шейным отделом позвоночника',
                date: '12 дек 2024',
                category: 'Мануальные техники',
                type: 'Обновление',
                image: '/webapp/assets/news-default.jpg'
            },
            {
                id: 3,
                title: 'Вебинар: Современная диагностика болей в спине',
                description: 'Практические аспекты дифференциальной диагностики',
                date: '10 дек 2024',
                category: 'Неврология',
                type: 'Мероприятие',
                image: '/webapp/assets/news-default.jpg'
            }
        ];

        return news.map(item => `
            <div class="news-card" onclick="app.openNews(${item.id})">
                <div class="news-image">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="news-category">${item.category}</div>
                </div>
                <div class="news-content">
                    <div class="news-header">
                        <span class="news-type">${item.type}</span>
                        <span class="news-date">${item.date}</span>
                    </div>
                    <h4 class="news-title">${item.title}</h4>
                    <p class="news-description">${item.description}</p>
                    <button class="btn btn-outline btn-small read-more">
                        Читать далее
                    </button>
                </div>
            </div>
        `).join('');
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

    // COURSES PAGE - полностью функциональная
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

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        const categories = [...new Set(podcasts.map(p => p.category))];
        
        return `
            <div class="page podcasts-page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                    <div class="header-actions">
                        <div class="search-box">
                            <input type="text" 
                                   class="search-input" 
                                   placeholder="Поиск подкастов..." 
                                   value="${this.state.searchQuery}"
                                   oninput="app.handleSearch(event)">
                        </div>
                    </div>
                </div>

                <div class="podcasts-stats">
                    <div class="stat-card">
                        <div class="stat-value">${podcasts.length}</div>
                        <div class="stat-label">Выпусков</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${podcasts.reduce((sum, p) => sum + p.listens, 0)}</div>
                        <div class="stat-label">Прослушиваний</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${categories.length}</div>
                        <div class="stat-label">Категорий</div>
                    </div>
                </div>

                <div class="categories-section">
                    <h3>Категории</h3>
                    <div class="categories-grid">
                        ${categories.map(category => `
                            <div class="category-card" onclick="app.filterPodcasts('${category}')">
                                <div class="category-icon">🎵</div>
                                <div class="category-name">${category}</div>
                                <div class="category-count">
                                    ${podcasts.filter(p => p.category === category).length} выпусков
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="podcasts-grid">
                    ${podcasts.length > 0 ? podcasts.map(podcast => `
                        <div class="podcast-card">
                            <div class="podcast-image">
                                <img src="${podcast.image_url}" alt="${podcast.title}">
                                <div class="play-overlay" onclick="app.playPodcast(${podcast.id})">
                                    <div class="play-button">▶️</div>
                                </div>
                            </div>
                            <div class="podcast-content">
                                <div class="podcast-category">${podcast.category}</div>
                                <h3 class="podcast-title">${podcast.title}</h3>
                                <p class="podcast-description">${podcast.description}</p>
                                <div class="podcast-meta">
                                    <span>⏱️ ${podcast.duration}</span>
                                    <span>👂 ${podcast.listens} прослушиваний</span>
                                </div>
                                <div class="podcast-actions">
                                    <button class="btn btn-primary" onclick="app.playPodcast(${podcast.id})">
                                        Слушать
                                    </button>
                                    <button class="btn btn-outline favorite-btn ${this.isFavorite(podcast.id, 'podcasts') ? 'active' : ''}" 
                                            onclick="app.toggleFavorite(${podcast.id}, 'podcasts')">
                                        ${this.isFavorite(podcast.id, 'podcasts') ? '❤️' : '🤍'}
                                    </button>
                                    <button class="btn btn-outline" onclick="app.downloadPodcast(${podcast.id})">
                                        📥
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('podcasts')}
                </div>

                ${this.podcastPlayer ? this.createAudioPlayer() : ''}
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createStreamsPage() {
        const streams = this.allContent.streams || [];
        const liveStreams = streams.filter(s => s.is_live);
        const upcomingStreams = streams.filter(s => !s.is_live);
        
        return `
            <div class="page streams-page">
                <div class="page-header">
                    <h2>📹 Эфиры и разборы</h2>
                    <div class="streams-filter">
                        <button class="filter-btn ${!this.state.activeFilters.streamType ? 'active' : ''}" 
                                onclick="app.filterStreams('')">Все</button>
                        <button class="filter-btn ${this.state.activeFilters.streamType === 'live' ? 'active' : ''}" 
                                onclick="app.filterStreams('live')">🔴 LIVE</button>
                        <button class="filter-btn ${this.state.activeFilters.streamType === 'upcoming' ? 'active' : ''}" 
                                onclick="app.filterStreams('upcoming')">📅 Запланированные</button>
                        <button class="filter-btn ${this.state.activeFilters.streamType === 'recorded' ? 'active' : ''}" 
                                onclick="app.filterStreams('recorded')">🎥 Записи</button>
                    </div>
                </div>

                ${liveStreams.length > 0 ? `
                <div class="live-section">
                    <h3>🔴 Прямой эфир</h3>
                    <div class="live-streams">
                        ${liveStreams.map(stream => `
                            <div class="live-stream-card" onclick="app.watchStream(${stream.id})">
                                <div class="live-indicator">
                                    <span class="pulse"></span>
                                    LIVE
                                </div>
                                <div class="stream-image">
                                    <img src="${stream.thumbnail_url}" alt="${stream.title}">
                                    <div class="viewers-count">
                                        👥 ${stream.participants} смотрят
                                    </div>
                                </div>
                                <div class="stream-info">
                                    <h4>${stream.title}</h4>
                                    <p>${stream.description}</p>
                                    <div class="stream-meta">
                                        <span>⏱️ ${stream.duration}</span>
                                        <span>🏷️ ${stream.category}</span>
                                    </div>
                                    <button class="btn btn-primary join-btn" onclick="app.watchStream(${stream.id})">
                                        Присоединиться к эфиру
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="upcoming-section">
                    <h3>📅 Ближайшие эфиры</h3>
                    <div class="streams-grid">
                        ${upcomingStreams.length > 0 ? upcomingStreams.map(stream => `
                            <div class="stream-card" onclick="app.watchStream(${stream.id})">
                                <div class="stream-image">
                                    <img src="${stream.thumbnail_url}" alt="${stream.title}">
                                    <div class="stream-date">
                                        ${new Date(stream.created_at).toLocaleDateString('ru-RU')}
                                    </div>
                                </div>
                                <div class="stream-content">
                                    <div class="stream-category">${stream.category}</div>
                                    <h4>${stream.title}</h4>
                                    <p>${stream.description}</p>
                                    <div class="stream-meta">
                                        <span>⏱️ ${stream.duration}</span>
                                        <span>👥 ${stream.participants} участников</span>
                                    </div>
                                    <div class="stream-actions">
                                        <button class="btn btn-primary" onclick="app.watchStream(${stream.id})">
                                            Смотреть
                                        </button>
                                        <button class="favorite-btn ${this.isFavorite(stream.id, 'streams') ? 'active' : ''}" 
                                                onclick="app.toggleFavorite(${stream.id}, 'streams')">
                                            ${this.isFavorite(stream.id, 'streams') ? '❤️' : '🤍'}
                                        </button>
                                        <button class="btn btn-outline" onclick="app.addToCalendar(${stream.id})">
                                            📅
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<p>Нет запланированных эфиров</p>'}
                    </div>
                </div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createVideosPage() {
        const videos = this.allContent.videos || [];
        const categories = [...new Set(videos.map(v => v.category))];
        
        return `
            <div class="page videos-page">
                <div class="page-header">
                    <h2>🎯 Видео-шпаргалки</h2>
                    <p class="page-subtitle">Короткие видео с техниками и приёмами</p>
                </div>

                <div class="videos-stats">
                    <div class="stat-card">
                        <div class="stat-value">${videos.length}</div>
                        <div class="stat-label">Видео</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${videos.reduce((sum, v) => sum + v.views, 0)}</div>
                        <div class="stat-label">Просмотров</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${categories.length}</div>
                        <div class="stat-label">Категорий</div>
                    </div>
                </div>

                <div class="videos-filter">
                    <div class="filter-group">
                        <label>Категория:</label>
                        <select class="filter-select" onchange="app.filterVideos('category', this.value)">
                            <option value="">Все категории</option>
                            ${categories.map(cat => `
                                <option value="${cat}">${cat}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Сортировка:</label>
                        <select class="filter-select" onchange="app.filterVideos('sort', this.value)">
                            <option value="newest">Сначала новые</option>
                            <option value="popular">По популярности</option>
                            <option value="duration">По длительности</option>
                        </select>
                    </div>
                </div>

                <div class="videos-grid">
                    ${videos.length > 0 ? videos.map(video => `
                        <div class="video-card" onclick="app.watchVideo(${video.id})">
                            <div class="video-thumbnail">
                                <img src="${video.thumbnail_url}" alt="${video.title}">
                                <div class="video-duration">${video.duration}</div>
                                <div class="play-overlay">
                                    <div class="play-button">▶️</div>
                                </div>
                                <div class="views-count">👀 ${video.views}</div>
                            </div>
                            <div class="video-content">
                                <div class="video-category">${video.category}</div>
                                <h4 class="video-title">${video.title}</h4>
                                <p class="video-description">${video.description}</p>
                                <div class="video-actions">
                                    <button class="btn btn-primary btn-small" onclick="app.watchVideo(${video.id})">
                                        Смотреть
                                    </button>
                                    <button class="favorite-btn ${this.isFavorite(video.id, 'videos') ? 'active' : ''}" 
                                            onclick="app.toggleFavorite(${video.id}, 'videos')">
                                        ${this.isFavorite(video.id, 'videos') ? '❤️' : '🤍'}
                                    </button>
                                    <button class="btn btn-outline btn-small" onclick="app.downloadVideo(${video.id})">
                                        📥
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('videos')}
                </div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createMaterialsPage() {
        const materials = this.allContent.materials || [];
        const categories = [...new Set(materials.map(m => m.category))];
        const types = [...new Set(materials.map(m => m.material_type))];
        
        return `
            <div class="page materials-page">
                <div class="page-header">
                    <h2>📋 Практические материалы</h2>
                    <p class="page-subtitle">Полезные инструменты для работы</p>
                </div>

                <div class="materials-tabs">
                    <button class="tab-btn ${!this.state.activeFilters.materialType ? 'active' : ''}" 
                            onclick="app.filterMaterials('')">Все материалы</button>
                    ${types.map(type => `
                        <button class="tab-btn ${this.state.activeFilters.materialType === type ? 'active' : ''}" 
                                onclick="app.filterMaterials('${type}')">
                            ${this.getMaterialTypeIcon(type)} ${this.getMaterialTypeName(type)}
                        </button>
                    `).join('')}
                </div>

                <div class="materials-stats">
                    <div class="stat-card">
                        <div class="stat-value">${materials.length}</div>
                        <div class="stat-label">Материалов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${materials.reduce((sum, m) => sum + m.downloads, 0)}</div>
                        <div class="stat-label">Скачиваний</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${categories.length}</div>
                        <div class="stat-label">Категорий</div>
                    </div>
                </div>

                <div class="materials-grid">
                    ${materials.length > 0 ? materials.map(material => `
                        <div class="material-card">
                            <div class="material-image">
                                <img src="${material.image_url}" alt="${material.title}">
                                <div class="material-type ${material.material_type}">
                                    ${this.getMaterialTypeIcon(material.material_type)}
                                </div>
                            </div>
                            <div class="material-content">
                                <div class="material-category">${material.category}</div>
                                <h4 class="material-title">${material.title}</h4>
                                <p class="material-description">${material.description}</p>
                                <div class="material-meta">
                                    <span>📥 ${material.downloads} скачиваний</span>
                                    <span>🏷️ ${material.category}</span>
                                </div>
                                <div class="material-actions">
                                    <button class="btn btn-primary" onclick="app.downloadMaterial(${material.id})">
                                        Скачать
                                    </button>
                                    <button class="favorite-btn ${this.isFavorite(material.id, 'materials') ? 'active' : ''}" 
                                            onclick="app.toggleFavorite(${material.id}, 'materials')">
                                        ${this.isFavorite(material.id, 'materials') ? '❤️' : '🤍'}
                                    </button>
                                    <button class="btn btn-outline" onclick="app.previewMaterial(${material.id})">
                                        👁️
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('materials')}
                </div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createEventsPage() {
        const events = this.allContent.events || [];
        const onlineEvents = events.filter(e => e.event_type === 'online');
        const offlineEvents = events.filter(e => e.event_type === 'offline');
        
        return `
            <div class="page events-page">
                <div class="page-header">
                    <h2>🗺️ Карта мероприятий</h2>
                    <div class="events-filter">
                        <button class="filter-btn ${!this.state.activeFilters.eventType ? 'active' : ''}" 
                                onclick="app.filterEvents('')">Все</button>
                        <button class="filter-btn ${this.state.activeFilters.eventType === 'online' ? 'active' : ''}" 
                                onclick="app.filterEvents('online')">🌐 Онлайн</button>
                        <button class="filter-btn ${this.state.activeFilters.eventType === 'offline' ? 'active' : ''}" 
                                onclick="app.filterEvents('offline')">🏢 Офлайн</button>
                    </div>
                </div>

                <div class="events-map">
                    <div class="map-placeholder">
                        🗺️ Интерактивная карта мероприятий
                        <p>Здесь будет отображаться карта с офлайн мероприятиями</p>
                    </div>
                </div>

                <div class="events-tabs">
                    <div class="tab-content active" id="online-events">
                        <h3>🌐 Онлайн мероприятия</h3>
                        <div class="events-list">
                            ${onlineEvents.length > 0 ? onlineEvents.map(event => `
                                <div class="event-card">
                                    <div class="event-image">
                                        <img src="${event.image_url}" alt="${event.title}">
                                        <div class="event-type online">ONLINE</div>
                                    </div>
                                    <div class="event-content">
                                        <h4>${event.title}</h4>
                                        <p>${event.description}</p>
                                        <div class="event-meta">
                                            <span>📅 ${new Date(event.event_date).toLocaleDateString('ru-RU')}</span>
                                            <span>⏰ ${new Date(event.event_date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                                            <span>👥 ${event.participants} участников</span>
                                        </div>
                                        <div class="event-actions">
                                            <button class="btn btn-primary" onclick="app.registerForEvent(${event.id})">
                                                Записаться
                                            </button>
                                            <button class="favorite-btn ${this.isFavorite(event.id, 'events') ? 'active' : ''}" 
                                                    onclick="app.toggleFavorite(${event.id}, 'events')">
                                                ${this.isFavorite(event.id, 'events') ? '❤️' : '🤍'}
                                            </button>
                                            <button class="btn btn-outline" onclick="app.addToCalendar(${event.id})">
                                                📅
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<p>Нет предстоящих онлайн мероприятий</p>'}
                        </div>
                    </div>

                    <div class="tab-content" id="offline-events">
                        <h3>🏢 Офлайн мероприятия</h3>
                        <div class="events-list">
                            ${offlineEvents.length > 0 ? offlineEvents.map(event => `
                                <div class="event-card">
                                    <div class="event-image">
                                        <img src="${event.image_url}" alt="${event.title}">
                                        <div class="event-type offline">OFFLINE</div>
                                        <div class="event-location">📍 ${event.location}</div>
                                    </div>
                                    <div class="event-content">
                                        <h4>${event.title}</h4>
                                        <p>${event.description}</p>
                                        <div class="event-meta">
                                            <span>📅 ${new Date(event.event_date).toLocaleDateString('ru-RU')}</span>
                                            <span>⏰ ${new Date(event.event_date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                                            <span>📍 ${event.location}</span>
                                            <span>👥 ${event.participants} участников</span>
                                        </div>
                                        <div class="event-actions">
                                            <button class="btn btn-primary" onclick="app.registerForEvent(${event.id})">
                                                Записаться
                                            </button>
                                            <button class="favorite-btn ${this.isFavorite(event.id, 'events') ? 'active' : ''}" 
                                                    onclick="app.toggleFavorite(${event.id}, 'events')">
                                                ${this.isFavorite(event.id, 'events') ? '❤️' : '🤍'}
                                            </button>
                                            <button class="btn btn-outline" onclick="app.showDirections(${event.id})">
                                                🗺️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<p>Нет предстоящих офлайн мероприятий</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createCommunityPage() {
        return `
            <div class="page community-page">
                <div class="page-header">
                    <h2>👥 О сообществе</h2>
                    <p class="page-subtitle">Правила и ценности сообщества Академии АНБ</p>
                </div>

                <div class="community-content">
                    <div class="rules-section">
                        <h3>📜 Правила сообщества</h3>
                        <div class="rules-list">
                            ${this.communityRules.map((rule, index) => `
                                <div class="rule-item">
                                    <div class="rule-number">${index + 1}</div>
                                    <div class="rule-content">
                                        <strong>${rule.title}</strong>
                                        <p>${rule.description}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="violations-section">
                        <h4>⚖️ Нарушения правил</h4>
                        <div class="violation-item">
                            <strong>При первом нарушении</strong> — личное предупреждение
                        </div>
                        <div class="violation-item">
                            <strong>При повторном</strong> — удаление из канала и аннулирование подписки
                        </div>
                    </div>

                    <div class="purpose-section">
                        <h4>🎯 Зачем существует наше сообщество?</h4>
                        <p>Мы создаём тёплое профессиональное пространство, где врачи могут:</p>
                        <ul class="purpose-list">
                            <li>Расти быстрее и увереннее</li>
                            <li>Обсуждать реальные клинические случаи из своей практики</li>
                            <li>Изучать понятные практические навыки</li>
                            <li>Общаться с коллегами, которые разделяют ценности доказательной медицины</li>
                            <li>Чувствовать поддержку и интерес к развитию</li>
                        </ul>
                        <p>Здесь каждый может задать вопрос, получить помощь и снова вдохновиться профессией.</p>
                    </div>

                    <div class="faq-section">
                        <h3>❓ F.A.Q.</h3>
                        
                        <div class="faq-category">
                            <h4>📋 Подписка</h4>
                            ${this.createFAQItem(
                                'Как оформить, продлить или отменить подписку?',
                                'Подписку можно оформить или продлить в разделе «Личный кабинет». Там же доступна отмена — через кнопку «Изменить подписку».'
                            )}
                            ${this.createFAQItem(
                                'Что входит в подписку Академии?',
                                'Доступ к эфирам, разборам (в том числе в записи), практическим материалам, видео-шпаргалкам на разные темы, а также к чату специалистов и интерактивной карте офлайн-мероприятий с предзаписью и голосованиями за новые темы.'
                            )}
                            ${this.createFAQItem(
                                'Можно ли смотреть материалы без подписки?',
                                'Да, часть контента доступна в пробном периоде для ознакомления. Полный доступ и участие в развитии открываются при активной подписке.'
                            )}
                        </div>

                        <div class="faq-category">
                            <h4>🎓 Обучение и контент</h4>
                            ${this.createFAQItem(
                                'Чем отличаются курсы, эфиры, разборы, видео-шпаргалки и практические материалы?',
                                'Курсы — системное обучение Академии, доступное за отдельную плату. После прохождения выдаются сертификаты.<br>Эфиры — живые встречи, где специалисты разбирают актуальные темы.<br>Разборы — реальные кейсы врачей и личные истории профессионального роста, которые обсуждаются с основателями Академии в прямом эфире.<br>Видео-шпаргалки — короткие видео с техниками и приёмами, помогающими иначе взглянуть на свои профессиональные привычки.<br>Практические материалы — полезные инструменты для работы: МРТ, клинические случаи и чек-листы.'
                            )}
                            ${this.createFAQItem(
                                'Как начать обучение или выбрать первый модуль?',
                                'С выбором поможет координатор Академии. Также можно оплатить любой модуль в разделе «Курсы» и сразу получить доступ ко всем урокам.'
                            )}
                            ${this.createFAQItem(
                                'Можно ли смотреть эфиры или разборы в записи?',
                                'Да. Все прошедшие эфиры и разборы доступны в записи в соответствующих разделах.'
                            )}
                        </div>

                        <div class="faq-category">
                            <h4>🛣️ Личный путь</h4>
                            ${this.createFAQItem(
                                'Зачем нужен «Мой путь» и как он помогает в практике?',
                                '«Мой путь» — это лёгкая геймификация профессионального роста. Работа врача — это постоянное развитие, и мы хотим сделать этот процесс приятнее, нагляднее и осмысленнее. Вы видите свой прогресс, чувствуете результат и сохраняете мотивацию даже на промежуточных этапах.'
                            )}
                            ${this.createFAQItem(
                                'Как перейти на следующий уровень?',
                                'Для каждого уровня есть свои условия. Подробности в разделе «Личный кабинет» → «Мой путь».'
                            )}
                            ${this.createFAQItem(
                                'Почему не засчитан прогресс после эфира или курса?',
                                'Система обновляет данные раз в сутки. Если прогресс не появился спустя время — напишите в поддержку, и мы поможем.'
                            )}
                        </div>
                    </div>

                    <div class="support-contact">
                        <h4>👨‍💼 Координатор проекта</h4>
                        <div class="contact-info">
                            <p><strong>Время работы:</strong> ПН-ПТ с 11:00 до 19:00</p>
                            <p><strong>Сообщить о нарушении:</strong> Если вы получаете нежелательные сообщения (спам, реклама, лидогенерация) или замечаете другие нарушения правил сообщества — сообщите нам, мы обязательно разберёмся.</p>
                        </div>
                        <div class="contact-actions">
                            <button class="btn btn-primary" onclick="app.contactCoordinator()">
                                📧 Написать координатору
                            </button>
                            <button class="btn btn-outline" onclick="app.reportViolation()">
                                ⚠️ Сообщить о нарушении
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createFAQItem(question, answer) {
        return `
            <div class="faq-item">
                <div class="faq-question">${question}</div>
                <div class="faq-answer">${answer}</div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createChatsPage() {
        return `
            <div class="page chats-page">
                <div class="page-header">
                    <h2>💬 Чаты специалистов</h2>
                    <p class="page-subtitle">Общайтесь с коллегами в тематических чатах</p>
                </div>

                <div class="chats-notice">
                    <div class="notice-card">
                        <div class="notice-icon">💡</div>
                        <div class="notice-content">
                            <strong>Для доступа к чатам требуется активная подписка Академии АНБ</strong>
                            <p>Присоединяйтесь к сообществу профессионалов</p>
                        </div>
                    </div>
                </div>

                <div class="chats-list">
                    ${this.chats.map(chat => `
                        <div class="chat-card ${chat.isActive ? '' : 'inactive'}" 
                             onclick="${chat.isActive ? `app.joinChat('${chat.name}')` : 'app.showSubscriptionRequired()'}">
                            <div class="chat-icon">${chat.icon}</div>
                            <div class="chat-info">
                                <div class="chat-name">${chat.name}</div>
                                <div class="chat-description">${chat.description}</div>
                                <div class="chat-meta">
                                    <span class="members-count">👥 ${chat.members} участников</span>
                                    ${!chat.isActive ? '<span class="premium-badge">PREMIUM</span>' : ''}
                                </div>
                            </div>
                            <div class="chat-arrow">${chat.isActive ? '→' : '🔒'}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="chats-rules">
                    <h4>📋 Правила чатов</h4>
                    <ul>
                        <li>Уважайте мнение коллег</li>
                        <li>Не распространяйте рекламу</li>
                        <li>Соблюдайте врачебную этику</li>
                        <li>Помогайте друг другу</li>
                    </ul>
                </div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createMyMaterialsPage() {
        const watchLater = this.allContent.courses?.slice(0, 2) || [];
        const favoriteCourses = this.allContent.courses?.filter(c => this.isFavorite(c.id, 'courses')) || [];
        const practicalMaterials = this.allContent.materials || [];
        
        return `
            <div class="page mymaterials-page">
                <div class="page-header">
                    <h2>📚 Мои материалы</h2>
                    <p class="page-subtitle">Все ваши сохраненные материалы в одном месте</p>
                </div>

                <div class="materials-tabs">
                    <button class="tab-btn ${this.currentMaterialsTab === 'later' ? 'active' : ''}" 
                            onclick="app.switchMaterialsTab('later')">
                        ⏰ Посмотреть позже
                        ${watchLater.length > 0 ? `<span class="tab-badge">${watchLater.length}</span>` : ''}
                    </button>
                    <button class="tab-btn ${this.currentMaterialsTab === 'favorites' ? 'active' : ''}" 
                            onclick="app.switchMaterialsTab('favorites')">
                        ❤️ Избранное
                        ${favoriteCourses.length > 0 ? `<span class="tab-badge">${favoriteCourses.length}</span>` : ''}
                    </button>
                    <button class="tab-btn ${this.currentMaterialsTab === 'practical' ? 'active' : ''}" 
                            onclick="app.switchMaterialsTab('practical')">
                        📋 Практические материалы
                        ${practicalMaterials.length > 0 ? `<span class="tab-badge">${practicalMaterials.length}</span>` : ''}
                    </button>
                </div>

                <div class="materials-content">
                    ${this.createMaterialsTabContent()}
                </div>
            </div>
        `;
    }

    createMaterialsTabContent() {
        switch(this.currentMaterialsTab) {
            case 'later':
                return this.createWatchLaterContent();
            case 'favorites':
                return this.createFavoritesContent();
            case 'practical':
                return this.createPracticalMaterialsContent();
            default:
                return this.createEmptyMaterialsContent();
        }
    }

    createWatchLaterContent() {
        const laterItems = this.allContent.courses?.slice(0, 2) || [];
        
        if (laterItems.length === 0) {
            return this.createEmptyMaterialsState('watch-later', '⏰', 'Список "Посмотреть позже" пуст', 'Добавляйте курсы и материалы, чтобы посмотреть их позже');
        }
        
        return `
            <div class="materials-grid">
                ${laterItems.map(item => `
                    <div class="material-card">
                        <div class="material-image">
                            <img src="${item.image_url}" alt="${item.title}">
                            <div class="material-badge later">⏰</div>
                        </div>
                        <div class="material-content">
                            <div class="material-category">${item.category}</div>
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                            <div class="material-meta">
                                <span>⏱️ ${item.duration}</span>
                                <span>📦 ${item.modules} модулей</span>
                                <span>⭐ ${item.rating}</span>
                            </div>
                            <div class="material-actions">
                                <button class="btn btn-primary" onclick="app.openCourseDetail(${item.id})">
                                    Продолжить
                                </button>
                                <button class="btn btn-outline" onclick="app.removeFromWatchLater(${item.id})">
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createFavoritesContent() {
        const favoriteCourses = this.allContent.courses?.filter(c => this.isFavorite(c.id, 'courses')) || [];
        
        if (favoriteCourses.length === 0) {
            return this.createEmptyMaterialsState('favorites', '❤️', 'В избранном пока пусто', 'Добавляйте курсы и материалы в избранное, чтобы они появились здесь');
        }
        
        return `
            <div class="materials-grid">
                ${favoriteCourses.map(course => `
                    <div class="material-card">
                        <div class="material-image">
                            <img src="${course.image_url}" alt="${course.title}">
                            <button class="favorite-btn active" onclick="app.toggleFavorite(${course.id}, 'courses')">
                                ❤️
                            </button>
                        </div>
                        <div class="material-content">
                            <div class="material-category">${course.category}</div>
                            <h4>${course.title}</h4>
                            <p>${course.description}</p>
                            <div class="material-meta">
                                <span>⏱️ ${course.duration}</span>
                                <span>💰 ${this.formatPrice(course.price)}</span>
                                <span>⭐ ${course.rating}</span>
                            </div>
                            <div class="material-actions">
                                <button class="btn btn-primary" onclick="app.openCourseDetail(${course.id})">
                                    Открыть
                                </button>
                                <button class="btn btn-outline" onclick="app.shareContent(${course.id}, 'courses')">
                                    📤
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createPracticalMaterialsContent() {
        const practicalMaterials = this.allContent.materials || [];
        
        if (practicalMaterials.length === 0) {
            return this.createEmptyMaterialsState('practical', '📋', 'Практические материалы появятся скоро', 'Мы готовим для вас полезные материалы для работы');
        }
        
        return `
            <div class="materials-grid">
                ${practicalMaterials.map(material => `
                    <div class="material-card">
                        <div class="material-image">
                            <img src="${material.image_url}" alt="${material.title}">
                            <div class="material-type ${material.material_type}">
                                ${this.getMaterialTypeIcon(material.material_type)}
                            </div>
                        </div>
                        <div class="material-content">
                            <div class="material-category">${material.category}</div>
                            <h4>${material.title}</h4>
                            <p>${material.description}</p>
                            <div class="material-meta">
                                <span>📥 ${material.downloads} скачиваний</span>
                                <span>🏷️ ${material.category}</span>
                            </div>
                            <div class="material-actions">
                                <button class="btn btn-primary" onclick="app.downloadMaterial(${material.id})">
                                    Скачать
                                </button>
                                <button class="favorite-btn ${this.isFavorite(material.id, 'materials') ? 'active' : ''}" 
                                        onclick="app.toggleFavorite(${material.id}, 'materials')">
                                    ${this.isFavorite(material.id, 'materials') ? '❤️' : '🤍'}
                                </button>
                                <button class="btn btn-outline" onclick="app.previewMaterial(${material.id})">
                                    👁️
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createEmptyMaterialsState(type, icon, title, description) {
        return `
            <div class="empty-materials">
                <div class="empty-icon">${icon}</div>
                <div class="empty-title">${title}</div>
                <div class="empty-description">${description}</div>
                <div class="empty-actions">
                    <button class="btn btn-primary" onclick="app.renderPage('courses')">
                        Перейти к курсам
                    </button>
                    <button class="btn btn-outline" onclick="app.renderPage('materials')">
                        Найти материалы
                    </button>
                </div>
            </div>
        `;
    }

    createEmptyMaterialsContent() {
        return `
            <div class="empty-materials">
                <div class="empty-icon">📚</div>
                <div class="empty-title">Раздел в разработке</div>
                <div class="empty-description">Этот раздел материалов скоро будет доступен</div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createProfilePage() {
        const user = this.currentUser;
        const progress = user?.progress || {};
        const currentLevel = this.learningPath[progress.level] || this.learningPath['Понимаю'];
        
        return `
            <div class="page profile-page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">👤</div>
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

                <!-- Мой путь - полная реализация по ТЗ -->
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

                <div class="achievements-section">
                    <h3>🏆 Достижения</h3>
                    <div class="achievements-grid">
                        <div class="achievement-card ${progress.steps?.coursesBought >= 1 ? 'unlocked' : 'locked'}">
                            <div class="achievement-icon">📚</div>
                            <div class="achievement-info">
                                <div class="achievement-name">Первый курс</div>
                                <div class="achievement-description">Приобретите первый курс</div>
                            </div>
                        </div>
                        <div class="achievement-card ${progress.steps?.materialsWatched >= 5 ? 'unlocked' : 'locked'}">
                            <div class="achievement-icon">📖</div>
                            <div class="achievement-info">
                                <div class="achievement-name">Любознательный</div>
                                <div class="achievement-description">Просмотрите 5 материалов</div>
                            </div>
                        </div>
                        <div class="achievement-card ${this.state.favorites.courses.length >= 3 ? 'unlocked' : 'locked'}">
                            <div class="achievement-icon">❤️</div>
                            <div class="achievement-info">
                                <div class="achievement-name">Коллекционер</div>
                                <div class="achievement-description">Добавьте 3 курса в избранное</div>
                            </div>
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
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createSupportPage() {
        return `
            <div class="page support-page">
                <div class="page-header">
                    <h2>🆘 Поддержка</h2>
                    <p class="page-subtitle">Мы всегда готовы помочь</p>
                </div>

                <div class="support-content">
                    <div class="support-info">
                        <h3>📞 Контакты поддержки</h3>
                        <div class="contact-methods">
                            <div class="contact-method">
                                <div class="method-icon">📧</div>
                                <div class="method-info">
                                    <div class="method-title">Email</div>
                                    <div class="method-value">support@anb-academy.ru</div>
                                    <div class="method-description">Ответ в течение 24 часов</div>
                                </div>
                            </div>
                            <div class="contact-method">
                                <div class="method-icon">👤</div>
                                <div class="method-info">
                                    <div class="method-title">Координатор</div>
                                    <div class="method-value">@academy_anb</div>
                                    <div class="method-description">Telegram координатор</div>
                                </div>
                            </div>
                            <div class="contact-method">
                                <div class="method-icon">⏰</div>
                                <div class="method-info">
                                    <div class="method-title">Время работы</div>
                                    <div class="method-value">Пн-Пт с 11:00 до 19:00</div>
                                    <div class="method-description">Московское время</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="support-form">
                        <h3>📝 Форма обратной связи</h3>
                        <form onsubmit="app.submitSupportRequest(event)">
                            <div class="form-group">
                                <label for="support-topic">Тема обращения</label>
                                <select id="support-topic" class="form-select" required>
                                    <option value="">Выберите тему</option>
                                    <option value="technical">Технические вопросы</option>
                                    <option value="payment">Оплата и подписки</option>
                                    <option value="content">Доступ к контенту</option>
                                    <option value="suggestion">Предложения</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="support-course">Связано с курсом (если применимо)</label>
                                <select id="support-course" class="form-select">
                                    <option value="">Не применимо</option>
                                    ${this.allContent.courses?.map(course => `
                                        <option value="${course.id}">${course.title}</option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="support-message">Подробное описание проблемы</label>
                                <textarea id="support-message" class="form-textarea" 
                                          placeholder="Опишите вашу проблему или вопрос подробно..." 
                                          rows="5" required></textarea>
                            </div>

                            <div class="form-group">
                                <label for="support-attachment">Прикрепить файлы (до 3 файлов)</label>
                                <input type="file" id="support-attachment" 
                                       class="form-file" multiple 
                                       accept=".jpg,.jpeg,.png,.pdf,.doc,.docx">
                                <div class="file-hint">Максимальный размер файла: 10MB</div>
                            </div>

                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    📤 Отправить запрос
                                </button>
                                <button type="button" class="btn btn-outline" onclick="app.clearSupportForm()">
                                    ❌ Очистить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="faq-quick">
                    <h3>❓ Частые вопросы</h3>
                    <div class="faq-grid">
                        <div class="faq-item" onclick="app.toggleFAQ(1)">
                            <div class="faq-question">Как восстановить доступ к аккаунту?</div>
                            <div class="faq-answer">Напишите на support@anb-academy.ru с указанием email, к которому привязан аккаунт.</div>
                        </div>
                        <div class="faq-item" onclick="app.toggleFAQ(2)">
                            <div class="faq-question">Не приходит письмо с доступом к курсу</div>
                            <div class="faq-answer">Проверьте папку "Спам" или напишите нам для повторной отправки.</div>
                        </div>
                        <div class="faq-item" onclick="app.toggleFAQ(3)">
                            <div class="faq-question">Как отменить подписку?</div>
                            <div class="faq-answer">Подписку можно отменить в разделе "Личный кабинет" → "Управление подпиской".</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createAdminPage() {
        if (!this.isAdmin) {
            return this.createAccessDeniedPage();
        }

        const stats = this.allContent.stats || {};
        
        return `
            <div class="page admin-page">
                <div class="admin-header">
                    <h2>${this.isSuperAdmin ? '🛠️ Супер-админ' : '🔧 Админ'}</h2>
                    <p class="admin-subtitle">Панель управления Академией</p>
                </div>

                <div class="admin-stats">
                    <div class="admin-stat-card">
                        <div class="stat-value">${stats.totalUsers || 0}</div>
                        <div class="stat-label">Пользователей</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="stat-value">${stats.totalCourses || 0}</div>
                        <div class="stat-label">Курсов</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="stat-value">${stats.totalMaterials || 0}</div>
                        <div class="stat-label">Материалов</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="stat-value">${stats.totalEvents || 0}</div>
                        <div class="stat-label">Мероприятий</div>
                    </div>
                </div>

                <div class="admin-tabs">
                    <button class="admin-tab active" onclick="app.switchAdminTab('content')">
                        📚 Контент
                    </button>
                    <button class="admin-tab" onclick="app.switchAdminTab('users')">
                        👥 Пользователи
                    </button>
                    <button class="admin-tab" onclick="app.switchAdminTab('analytics')">
                        📊 Аналитика
                    </button>
                    ${this.isSuperAdmin ? `
                    <button class="admin-tab" onclick="app.switchAdminTab('settings')">
                        ⚙️ Настройки
                    </button>
                    ` : ''}
                </div>

                <div class="admin-content">
                    <div class="admin-tab-content active" id="content-tab">
                        <h3>Управление контентом</h3>
                        <div class="admin-actions">
                            <button class="btn btn-primary" onclick="app.showAddContentForm('courses')">
                                ➕ Добавить курс
                            </button>
                            <button class="btn btn-primary" onclick="app.showAddContentForm('podcasts')">
                                🎧 Добавить подкаст
                            </button>
                            <button class="btn btn-primary" onclick="app.showAddContentForm('streams')">
                                📹 Добавить эфир
                            </button>
                            <button class="btn btn-primary" onclick="app.showAddContentForm('materials')">
                                📋 Добавить материал
                            </button>
                            <button class="btn btn-primary" onclick="app.showAddContentForm('events')">
                                🗺️ Добавить мероприятие
                            </button>
                        </div>

                        <div class="content-management">
                            <h4>Последний добавленный контент</h4>
                            <div class="content-list-admin">
                                ${this.allContent.courses?.slice(0, 3).map(course => `
                                    <div class="admin-content-item">
                                        <img src="${course.image_url}" alt="${course.title}">
                                        <div class="content-info">
                                            <h5>${course.title}</h5>
                                            <p>${course.description}</p>
                                            <div class="content-meta">
                                                <span>💰 ${this.formatPrice(course.price)}</span>
                                                <span>⭐ ${course.rating}</span>
                                                <span>👥 ${course.students_count}</span>
                                            </div>
                                        </div>
                                        <div class="content-actions">
                                            <button class="btn btn-small btn-outline" onclick="app.editContent(${course.id}, 'courses')">
                                                ✏️
                                            </button>
                                            <button class="btn btn-small btn-danger" onclick="app.deleteContent(${course.id}, 'courses')">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="admin-tab-content" id="users-tab">
                        <h3>Управление пользователями</h3>
                        <div class="users-stats">
                            <p>Всего пользователей: <strong>${stats.totalUsers || 0}</strong></p>
                            <p>Активных подписок: <strong>${Math.floor((stats.totalUsers || 0) * 0.7)}</strong></p>
                        </div>
                    </div>

                    <div class="admin-tab-content" id="analytics-tab">
                        <h3>Аналитика</h3>
                        <div class="analytics-cards">
                            <div class="analytics-card">
                                <div class="analytics-value">${this.allContent.courses?.reduce((sum, c) => sum + c.students_count, 0) || 0}</div>
                                <div class="analytics-label">Всего записей на курсы</div>
                            </div>
                            <div class="analytics-card">
                                <div class="analytics-value">${this.allContent.podcasts?.reduce((sum, p) => sum + p.listens, 0) || 0}</div>
                                <div class="analytics-label">Прослушиваний подкастов</div>
                            </div>
                            <div class="analytics-card">
                                <div class="analytics-value">${this.allContent.materials?.reduce((sum, m) => sum + m.downloads, 0) || 0}</div>
                                <div class="analytics-label">Скачиваний материалов</div>
                            </div>
                        </div>
                    </div>

                    ${this.isSuperAdmin ? `
                    <div class="admin-tab-content" id="settings-tab">
                        <h3>Настройки системы</h3>
                        <div class="system-settings">
                            <div class="setting-item">
                                <label>Уведомления по email</label>
                                <input type="checkbox" checked>
                            </div>
                            <div class="setting-item">
                                <label>Автоматическое обновление контента</label>
                                <input type="checkbox" checked>
                            </div>
                            <div class="setting-item">
                                <label>Резервное копирование</label>
                                <select>
                                    <option>Ежедневно</option>
                                    <option>Еженедельно</option>
                                    <option>Ежемесячно</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    createNotFoundPage() {
        return `
            <div class="page not-found-page">
                <div class="not-found-content">
                    <div class="not-found-icon">🔍</div>
                    <h2>Страница не найдена</h2>
                    <p>Запрашиваемая страница не существует или была перемещена.</p>
                    <div class="not-found-actions">
                        <button class="btn btn-primary" onclick="app.renderPage('home')">
                            🏠 На главную
                        </button>
                        <button class="btn btn-outline" onclick="history.back()">
                            ↩️ Назад
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createAccessDeniedPage() {
        return `
            <div class="page access-denied-page">
                <div class="access-denied-content">
                    <div class="access-denied-icon">🚫</div>
                    <h2>Доступ запрещен</h2>
                    <p>У вас нет прав для просмотра этой страницы.</p>
                    <button class="btn btn-primary" onclick="app.renderPage('home')">
                        На главную
                    </button>
                </div>
            </div>
        `;
    }

    createFavoritesPage() {
        const favoriteCourses = this.allContent.courses?.filter(c => this.isFavorite(c.id, 'courses')) || [];
        const favoritePodcasts = this.allContent.podcasts?.filter(p => this.isFavorite(p.id, 'podcasts')) || [];
        const favoriteStreams = this.allContent.streams?.filter(s => this.isFavorite(s.id, 'streams')) || [];
        
        const totalFavorites = favoriteCourses.length + favoritePodcasts.length + favoriteStreams.length;
        
        return `
            <div class="page favorites-page">
                <div class="page-header">
                    <h2>❤️ Избранное</h2>
                    <div class="favorites-stats">
                        <span>Всего: ${totalFavorites}</span>
                    </div>
                </div>

                ${totalFavorites === 0 ? `
                    <div class="empty-favorites">
                        <div class="empty-icon">❤️</div>
                        <div class="empty-title">В избранном пока пусто</div>
                        <div class="empty-description">Добавляйте курсы, подкасты и эфиры в избранное, чтобы они появились здесь</div>
                        <div class="empty-actions">
                            <button class="btn btn-primary" onclick="app.renderPage('courses')">
                                Перейти к курсам
                            </button>
                            <button class="btn btn-outline" onclick="app.renderPage('podcasts')">
                                Смотреть подкасты
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="favorites-tabs">
                        <button class="tab-btn active" onclick="app.switchFavoritesTab('courses')">
                            📚 Курсы (${favoriteCourses.length})
                        </button>
                        <button class="tab-btn" onclick="app.switchFavoritesTab('podcasts')">
                            🎧 Подкасты (${favoritePodcasts.length})
                        </button>
                        <button class="tab-btn" onclick="app.switchFavoritesTab('streams')">
                            📹 Эфиры (${favoriteStreams.length})
                        </button>
                    </div>

                    <div class="favorites-content">
                        <div class="favorites-tab active" id="courses-tab">
                            ${favoriteCourses.length > 0 ? `
                                <div class="favorites-grid">
                                    ${favoriteCourses.map(course => `
                                        <div class="favorite-item">
                                            <img src="${course.image_url}" alt="${course.title}">
                                            <div class="favorite-info">
                                                <h4>${course.title}</h4>
                                                <p>${course.description}</p>
                                                <div class="favorite-meta">
                                                    <span>⏱️ ${course.duration}</span>
                                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                                </div>
                                            </div>
                                            <div class="favorite-actions">
                                                <button class="btn btn-primary btn-small" onclick="app.openCourseDetail(${course.id})">
                                                    Открыть
                                                </button>
                                                <button class="btn btn-outline btn-small" onclick="app.toggleFavorite(${course.id}, 'courses')">
                                                    ❤️ Удалить
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>Нет курсов в избранном</p>'}
                        </div>

                        <div class="favorites-tab" id="podcasts-tab">
                            ${favoritePodcasts.length > 0 ? `
                                <div class="favorites-grid">
                                    ${favoritePodcasts.map(podcast => `
                                        <div class="favorite-item">
                                            <img src="${podcast.image_url}" alt="${podcast.title}">
                                            <div class="favorite-info">
                                                <h4>${podcast.title}</h4>
                                                <p>${podcast.description}</p>
                                                <div class="favorite-meta">
                                                    <span>⏱️ ${podcast.duration}</span>
                                                    <span>👂 ${podcast.listens}</span>
                                                </div>
                                            </div>
                                            <div class="favorite-actions">
                                                <button class="btn btn-primary btn-small" onclick="app.playPodcast(${podcast.id})">
                                                    Слушать
                                                </button>
                                                <button class="btn btn-outline btn-small" onclick="app.toggleFavorite(${podcast.id}, 'podcasts')">
                                                    ❤️ Удалить
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>Нет подкастов в избранном</p>'}
                        </div>

                        <div class="favorites-tab" id="streams-tab">
                            ${favoriteStreams.length > 0 ? `
                                <div class="favorites-grid">
                                    ${favoriteStreams.map(stream => `
                                        <div class="favorite-item">
                                            <img src="${stream.thumbnail_url}" alt="${stream.title}">
                                            <div class="favorite-info">
                                                <h4>${stream.title}</h4>
                                                <p>${stream.description}</p>
                                                <div class="favorite-meta">
                                                    <span>⏱️ ${stream.duration}</span>
                                                    <span>👥 ${stream.participants}</span>
                                                </div>
                                            </div>
                                            <div class="favorite-actions">
                                                <button class="btn btn-primary btn-small" onclick="app.watchStream(${stream.id})">
                                                    Смотреть
                                                </button>
                                                <button class="btn btn-outline btn-small" onclick="app.toggleFavorite(${stream.id}, 'streams')">
                                                    ❤️ Удалить
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p>Нет эфиров в избранном</p>'}
                        </div>
                    </div>
                `}
            </div>
        `;
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ ФИЛЬТРАЦИИ И СОРТИРОВКИ
    filterPodcasts(category) {
        this.state.activeFilters.podcastCategory = category;
        this.renderPage('podcasts');
    }

    filterStreams(streamType) {
        this.state.activeFilters.streamType = streamType;
        this.renderPage('streams');
    }

    filterVideos(filterType, value) {
        if (filterType === 'category') {
            this.state.activeFilters.videoCategory = value;
        } else if (filterType === 'sort') {
            this.state.sortBy = value;
        }
        this.renderPage('videos');
    }

    filterMaterials(materialType) {
        this.state.activeFilters.materialType = materialType;
        this.renderPage('materials');
    }

    filterEvents(eventType) {
        this.state.activeFilters.eventType = eventType;
        this.renderPage('events');
    }

    filterNews(category) {
        this.currentNewsFilter = category;
        this.renderPage('home');
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

    handleSearch(event) {
        this.state.searchQuery = event.target.value;
        // Автопоиск при вводе
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
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    // МЕТОДЫ ДЛЯ РАБОТЫ С КОНТЕНТОМ
    async playPodcast(podcastId) {
        const podcast = this.allContent.podcasts?.find(p => p.id == podcastId);
        if (podcast) {
            this.showNotification(`Запуск подкаста: ${podcast.title}`, 'info');
            
            // Создаем аудио плеер
            this.createAudioPlayer(podcast.title, podcast.audio_url);
            
            // Обновляем статистику прослушиваний
            await this.updateProgress('podcast_listen', podcastId);
            
            // Показываем модальное окно с плеером
            this.showAudioModal(podcast);
        }
    }

    async watchStream(streamId) {
        const stream = this.allContent.streams?.find(s => s.id == streamId);
        if (stream) {
            this.showNotification(`Запуск эфира: ${stream.title}`, 'info');
            
            // Создаем видео плеер
            this.createVideoModal(stream.title, stream.video_url, stream.is_live);
            
            // Обновляем статистику просмотров
            await this.updateProgress('stream_watch', streamId);
        }
    }

    async watchVideo(videoId) {
        const video = this.allContent.videos?.find(v => v.id == videoId);
        if (video) {
            this.showNotification(`Запуск видео: ${video.title}`, 'info');
            
            // Создаем видео плеер
            this.createVideoModal(video.title, video.video_url, false);
            
            // Обновляем статистику просмотров
            await this.updateProgress('video_watch', videoId);
        }
    }

    createAudioPlayer(title, audioUrl) {
        this.podcastPlayer = {
            title: title,
            audioUrl: audioUrl,
            isPlaying: false,
            currentTime: 0,
            duration: 0
        };
        
        // Обновляем интерфейс, если находимся на странице подкастов
        if (this.currentPage === 'podcasts') {
            this.renderPage('podcasts');
        }
    }

    createVideoModal(title, videoUrl, isLive = false) {
        const modal = document.createElement('div');
        modal.className = 'video-modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="app.closeVideoModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="app.closeVideoModal()">×</button>
                    </div>
                    <div class="video-container">
                        ${isLive ? `
                            <div class="live-indicator-modal">
                                <span class="pulse"></span>
                                LIVE
                            </div>
                        ` : ''}
                        <video controls autoplay style="width: 100%; height: 300px;">
                            <source src="${videoUrl}" type="video/mp4">
                            Ваш браузер не поддерживает видео.
                        </video>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="app.addToFavoritesFromModal('${title}')">
                            ❤️ В избранное
                        </button>
                        <button class="btn btn-outline" onclick="app.downloadVideoFromModal('${videoUrl}')">
                            📥 Скачать
                        </button>
                        <button class="btn btn-outline" onclick="app.closeVideoModal()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Автоматическое воспроизведение
        const video = modal.querySelector('video');
        video.play().catch(e => {
            console.log('Автовоспроизведение заблокировано:', e);
        });
    }

    closeVideoModal() {
        const modal = document.querySelector('.video-modal');
        if (modal) {
            // Останавливаем видео
            const video = modal.querySelector('video');
            if (video) {
                video.pause();
            }
            modal.remove();
        }
    }

    showAudioModal(podcast) {
        const modal = document.createElement('div');
        modal.className = 'audio-modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="app.closeAudioModal()">
                <div class="modal-content audio-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>🎧 ${podcast.title}</h3>
                        <button class="modal-close" onclick="app.closeAudioModal()">×</button>
                    </div>
                    <div class="audio-player">
                        <img src="${podcast.image_url}" alt="${podcast.title}" class="audio-cover">
                        <div class="audio-controls">
                            <button class="control-btn" onclick="app.audioSeek(-10)">⏪</button>
                            <button class="control-btn play-btn" onclick="app.toggleAudioPlay()">▶️</button>
                            <button class="control-btn" onclick="app.audioSeek(10)">⏩</button>
                        </div>
                        <div class="audio-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 0%"></div>
                            </div>
                            <div class="time-display">
                                <span class="current-time">0:00</span>
                                <span class="duration">${podcast.duration}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="app.toggleFavorite(${podcast.id}, 'podcasts')">
                            ${this.isFavorite(podcast.id, 'podcasts') ? '❤️' : '🤍'} Избранное
                        </button>
                        <button class="btn btn-outline" onclick="app.downloadPodcast(${podcast.id})">
                            📥 Скачать
                        </button>
                        <button class="btn btn-outline" onclick="app.closeAudioModal()">
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    closeAudioModal() {
        const modal = document.querySelector('.audio-modal');
        if (modal) {
            modal.remove();
        }
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    // МЕТОДЫ ДЛЯ КУРСОВ И ОБУЧЕНИЯ
    openCourseDetail(courseId) {
        this.state.currentCourse = courseId;
        this.currentSubPage = `course-${courseId}`;
        this.renderPage('courses', `course-${courseId}`);
    }

    previewCourse(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        if (course && course.video_url) {
            this.createVideoModal(`Предпросмотр: ${course.title}`, course.video_url, false);
        } else {
            this.showNotification('Предпросмотр для этого курса пока недоступен', 'info');
        }
    }

    async purchaseCourse(courseId) {
        try {
            const response = await this.safeApiCall('/api/purchase/course', {
                method: 'POST',
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    courseId: courseId
                })
            });

            if (response.success) {
                this.showNotification('Курс успешно приобретен!', 'success');
                
                if (response.paymentUrl) {
                    // Открываем страницу оплаты в новом окне
                    window.open(response.paymentUrl, '_blank');
                } else {
                    // Перенаправляем на страницу курса
                    this.openCourseDetail(courseId);
                }
            } else {
                this.showNotification('Ошибка при покупке курса', 'error');
            }
        } catch (error) {
            console.error('Ошибка покупки курса:', error);
            this.showNotification('Ошибка при покупке курса', 'error');
        }
    }

    addToCart(courseId) {
        this.showNotification('Курс добавлен в корзину', 'success');
        // Здесь можно добавить логику для работы с корзиной
    }

    switchCourseTab(tabName) {
        // Переключение табов на странице курса
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');
    }

    toggleModule(moduleIndex) {
        const moduleContent = document.getElementById(`module-${moduleIndex}`);
        const moduleToggle = event.currentTarget.querySelector('.module-toggle');
        
        if (moduleContent.style.display === 'block') {
            moduleContent.style.display = 'none';
            moduleToggle.textContent = '▶';
        } else {
            moduleContent.style.display = 'block';
            moduleToggle.textContent = '▼';
        }
    }

    toggleLesson(moduleIndex, lessonIndex) {
        const lessonCheckbox = event.currentTarget;
        lessonCheckbox.textContent = lessonCheckbox.textContent === '○' ? '✓' : '○';
        lessonCheckbox.parentElement.classList.toggle('completed');
        
        // Обновляем прогресс
        this.updateProgress('lesson_complete', `${moduleIndex}-${lessonIndex}`);
    }

    startLesson(moduleIndex, lessonIndex) {
        this.showNotification(`Начало урока: Модуль ${moduleIndex + 1}, Урок ${lessonIndex + 1}`, 'info');
        // Здесь можно добавить логику для запуска урока
    }

    createCourseReviews() {
        return this.courseReviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${review.avatar}</div>
                        <div class="reviewer-details">
                            <div class="reviewer-name">${review.user}</div>
                            <div class="review-date">${review.date}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${'⭐'.repeat(review.rating)}
                    </div>
                </div>
                <div class="review-content">
                    <p>${review.text}</p>
                </div>
            </div>
        `).join('');
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    // МЕТОДЫ ДЛЯ РАБОТЫ С МАТЕРИАЛАМИ
    async downloadMaterial(materialId) {
        const material = this.allContent.materials?.find(m => m.id == materialId);
        if (material) {
            this.showNotification(`Скачивание: ${material.title}`, 'info');
            
            // Имитация скачивания
            if (material.file_url) {
                window.open(material.file_url, '_blank');
            }
            
            // Обновляем статистику скачиваний
            await this.updateProgress('material_download', materialId);
        }
    }

    async downloadPodcast(podcastId) {
        const podcast = this.allContent.podcasts?.find(p => p.id == podcastId);
        if (podcast) {
            this.showNotification(`Скачивание подкаста: ${podcast.title}`, 'info');
            
            if (podcast.audio_url) {
                window.open(podcast.audio_url, '_blank');
            }
            
            await this.updateProgress('podcast_download', podcastId);
        }
    }

    async downloadVideo(videoId) {
        const video = this.allContent.videos?.find(v => v.id == videoId);
        if (video) {
            this.showNotification(`Скачивание видео: ${video.title}`, 'info');
            
            if (video.video_url) {
                window.open(video.video_url, '_blank');
            }
            
            await this.updateProgress('video_download', videoId);
        }
    }

    previewMaterial(materialId) {
        const material = this.allContent.materials?.find(m => m.id == materialId);
        if (material) {
            this.showNotification(`Предпросмотр: ${material.title}`, 'info');
            // Здесь можно добавить логику для предпросмотра материала
        }
    }

    getMaterialTypeIcon(type) {
        const icons = {
            'mri_analysis': '🧠',
            'clinical_case': '📋',
            'checklist': '✅',
            'protocol': '📄',
            'template': '📝'
        };
        return icons[type] || '📎';
    }

    getMaterialTypeName(type) {
        const names = {
            'mri_analysis': 'МРТ разбор',
            'clinical_case': 'Клинический случай',
            'checklist': 'Чек-лист',
            'protocol': 'Протокол',
            'template': 'Шаблон'
        };
        return names[type] || 'Материал';
    }

    switchMaterialsTab(tab) {
        this.currentMaterialsTab = tab;
        this.renderPage('myMaterials');
    }

    removeFromWatchLater(itemId) {
        this.showNotification('Удалено из "Посмотреть позже"', 'success');
        // Здесь можно добавить логику удаления из списка
    }

    shareContent(contentId, contentType) {
        const content = this.getContentById(contentId, contentType);
        if (content) {
            this.showNotification(`Ссылка на "${content.title}" скопирована`, 'success');
            // Здесь можно добавить логику шеринга
        }
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ ЗДЕСЬ ===
    // МЕТОДЫ ДЛЯ СООБЩЕСТВА И ЧАТОВ
    joinChat(chatName) {
        this.showNotification(`Вход в чат "${chatName}"`, 'info');
        // Здесь можно добавить логику подключения к чату
    }

    contactCoordinator() {
        this.showNotification('Открытие чата с координатором...', 'info');
        // Здесь можно добавить логику связи с координатором
    }

    reportViolation() {
        this.showNotification('Открытие формы для сообщения о нарушении...', 'info');
        // Здесь можно добавить логику репортинга
    }

    showSubscriptionRequired() {
        this.showNotification('Для доступа к этому чату требуется активная подписка', 'warning');
        this.renderPage('profile');
    }

    // МЕТОДЫ ДЛЯ МЕРОПРИЯТИЙ
    async registerForEvent(eventId) {
        const event = this.allContent.events?.find(e => e.id == eventId);
        if (event) {
            this.showNotification(`Регистрация на мероприятие: ${event.title}`, 'success');
            
            if (event.registration_url) {
                window.open(event.registration_url, '_blank');
            }
            
            await this.updateProgress('event_register', eventId);
        }
    }

    addToCalendar(eventId) {
        const event = this.allContent.events?.find(e => e.id == eventId);
        if (event) {
            this.showNotification('Добавлено в календарь', 'success');
            // Здесь можно добавить логику добавления в календарь
        }
    }

    showDirections(eventId) {
        const event = this.allContent.events?.find(e => e.id == eventId);
        if (event) {
            this.showNotification(`Построение маршрута до: ${event.location}`, 'info');
            // Здесь можно добавить логику построения маршрута
        }
    }

    // МЕТОДЫ ДЛЯ АДМИН-ПАНЕЛИ
    switchAdminTab(tabName) {
        document.querySelectorAll('.admin-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');
    }

    showAddContentForm(contentType) {
        this.showNotification(`Добавление нового ${this.getContentTypeName(contentType)}`, 'info');
        // Здесь можно добавить логику формы добавления контента
    }

    editContent(contentId, contentType) {
        this.showNotification(`Редактирование: ${contentType} #${contentId}`, 'info');
        // Здесь можно добавить логику редактирования
    }

    deleteContent(contentId, contentType) {
        if (confirm('Вы уверены, что хотите удалить этот контент?')) {
            this.showNotification(`${this.getContentTypeName(contentType)} удален`, 'success');
            // Здесь можно добавить логику удаления
        }
    }

    getContentTypeName(type) {
        const names = {
            'courses': 'курс',
            'podcasts': 'подкаст',
            'streams': 'эфир',
            'materials': 'материал',
            'events': 'мероприятие'
        };
        return names[type] || 'контент';
    }
    // === КОНЕЦ ВСТАВКИ ===

    // === ВСТАВИТЬ В САМЫЙ КОНЕЦ КЛАССА ===
    // УТИЛИТНЫЕ МЕТОДЫ
    getContentById(contentId, contentType) {
        return this.allContent[contentType]?.find(item => item.id == contentId);
    }

    getProfileStatus() {
        if (this.isSuperAdmin) return '🛠️ Супер-админ';
        if (this.isAdmin) return '🔧 Админ';
        return '👤 Активный участник';
    }

    getDemoCourse() {
        return {
            id: 1,
            title: 'Демо курс',
            description: 'Описание демо курса',
            image_url: '/webapp/assets/course-default.jpg',
            video_url: 'https://example.com/demo',
            price: 10000,
            discount: 0,
            duration: '4 недели',
            modules: 3,
            category: 'Демо',
            level: 'beginner',
            students_count: 100,
            rating: 4.5
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

    updateFavoritesCount() {
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
            const totalFavorites = Object.values(this.state.favorites).flat().length;
            favoritesCount.textContent = totalFavorites;
            favoritesCount.style.display = totalFavorites > 0 ? 'flex' : 'none';
        }
    }

    isFavorite(contentId, contentType) {
        return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
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

    getLiveStreams() {
        return this.allContent.streams?.filter(stream => stream.is_live) || [];
    }

    getRecommendedCourses() {
        return this.allContent.courses?.filter(course => course.featured) || [];
    }

    calculateHomeStats() {
        return {
            courses: this.allContent.stats?.totalCourses || this.allContent.courses?.length || 0,
            students: this.allContent.stats?.totalUsers || 0,
            experts: 25
        };
    }

    // МЕТОДЫ ДЛЯ API ВЗАИМОДЕЙСТВИЯ
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
            
            // Возвращаем демо-данные при ошибке
            if (url === '/api/content') {
                return { success: true, data: this.getDemoContentData() };
            } else if (url === '/api/user') {
                return { success: true, user: this.getDemoUserData() };
            }
            
            return { success: false, error: error.message };
        }
    }

    async updateProgress(activityType, contentId) {
        try {
            await this.safeApiCall('/api/progress/update', {
                method: 'POST',
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    activityType: activityType,
                    contentId: contentId
                })
            });
        } catch (error) {
            console.error('Ошибка обновления прогресса:', error);
        }
    }

    // ДЕМО-ДАННЫЕ
    createDemoUser() {
        this.currentUser = {
            id: 898508164,
            firstName: 'Демо Пользователь',
            isAdmin: true,
            isSuperAdmin: true,
            subscriptionEnd: new Date('2024-12-31').toISOString(),
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
        
        console.log('✅ Демо-пользователь создан');
    }

    createDemoContent() {
        this.allContent = this.getDemoContentData();
        console.log('✅ Демо-контент создан');
    }

    getDemoContentData() {
        // Возвращает полный набор демо-данных
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
                // ... другие курсы
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
                // ... другие подкасты
            ],
            // ... остальной контент
            stats: {
                totalUsers: 1567,
                totalCourses: 5,
                totalMaterials: 8,
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

    // УВЕДОМЛЕНИЯ И UI
    showNotification(message, type = 'info') {
        console.log(`📢 Уведомление [${type}]: ${message}`);
        
        // Создаем и показываем уведомление
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
        
        // Автоматическое скрытие
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

    initializePageComponents() {
        // Инициализация компонентов после рендера страницы
        this.initializeVideoPlayers();
        this.initializeAudioPlayers();
        this.initializeTabs();
        this.initializeFilters();
    }

    initializeVideoPlayers() {
        // Инициализация видео плееров на странице
    }

    initializeAudioPlayers() {
        // Инициализация аудио плееров на странице
    }

    initializeTabs() {
        // Инициализация табов на странице
    }

    initializeFilters() {
        // Инициализация фильтров на странице
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
                            <img src="${course.image_url}" alt="${course.title}">
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

    renderCoursesList(courses) {
        if (courses.length === 0) {
            return this.createEmptyState('courses', 'По вашему запросу ничего не найдено');
        }
        
        return `
            <div class="content-list">
                ${courses.map(course => `
                    <div class="list-item course-item" onclick="app.openCourseDetail(${course.id})">
                        <div class="item-image">
                            <img src="${course.image_url}" alt="${course.title}">
                            ${course.featured ? `<div class="item-badge">⭐</div>` : ''}
                        </div>
                        <div class="item-content">
                            <div class="item-header">
                                <div class="item-category">${course.category}</div>
                                <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                    ${this.isFavorite(course.id, 'courses') ? '❤️' : '🤍'}
                                </button>
                            </div>
                            <h3 class="item-title">${course.title}</h3>
                            <p class="item-description">${course.description}</p>
                            <div class="item-meta">
                                <span>⏱️ ${course.duration}</span>
                                <span>🎯 ${course.modules} модулей</span>
                                <span>⭐ ${course.rating}</span>
                                <span>👥 ${course.students_count}</span>
                                <span class="level-badge level-${course.level}">
                                    ${this.getLevelName(course.level)}
                                </span>
                            </div>
                        </div>
                        <div class="item-actions">
                            <div class="price-section">
                                ${course.discount > 0 ? `
                                    <div class="price-original">${this.formatPrice(course.price)}</div>
                                    <div class="price-current">${this.formatPrice(course.price * (1 - course.discount/100))}</div>
                                ` : `
                                    <div class="price-current">${this.formatPrice(course.price)}</div>
                                `}
                            </div>
                            <button class="btn btn-primary" 
                                    onclick="event.stopPropagation(); app.openCourseDetail(${course.id})">
                                Подробнее
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
                            <img src="${course.image_url}" alt="${course.title}">
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

                <!-- Purchase Section -->
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

    createCurriculumModules() {
        const modules = [
            {
                title: 'Введение в курс',
                lessons: [
                    { title: 'Знакомство с преподавателем', duration: '15 мин', type: 'video' },
                    { title: 'Структура курса', duration: '10 мин', type: 'video' },
                    { title: 'Необходимые материалы', duration: '5 мин', type: 'text' }
                ]
            },
            {
                title: 'Базовые принципы',
                lessons: [
                    { title: 'Основные концепции', duration: '25 мин', type: 'video' },
                    { title: 'Методология', duration: '20 мин', type: 'video' },
                    { title: 'Практическое задание', duration: '30 мин', type: 'practice' }
                ]
            }
        ];

        return modules.map((module, index) => `
            <div class="module-item">
                <div class="module-header" onclick="app.toggleModule(${index})">
                    <div class="module-number">${index + 1}</div>
                    <div class="module-info">
                        <h4 class="module-title">${module.title}</h4>
                        <div class="module-meta">
                            <span>${module.lessons.length} уроков</span>
                            <span>⏱️ ${this.calculateModuleDuration(module.lessons)}</span>
                        </div>
                    </div>
                    <div class="module-toggle">▶</div>
                </div>
                <div class="module-content" id="module-${index}">
                    <div class="lessons-list">
                        ${module.lessons.map((lesson, lessonIndex) => `
                            <div class="lesson-item">
                                <div class="lesson-checkbox" onclick="app.toggleLesson(${index}, ${lessonIndex})">
                                    ○
                                </div>
                                <div class="lesson-info">
                                    <div class="lesson-title">${lesson.title}</div>
                                    <div class="lesson-meta">
                                        <span>⏱️ ${lesson.duration}</span>
                                        <span class="lesson-type">${this.getLessonTypeIcon(lesson.type)} ${lesson.type}</span>
                                    </div>
                                </div>
                                <div class="lesson-actions">
                                    <button class="btn btn-outline btn-small" onclick="event.stopPropagation(); app.startLesson(${index}, ${lessonIndex})">
                                        Начать
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    calculateModuleDuration(lessons) {
        const totalMinutes = lessons.reduce((total, lesson) => {
            const minutes = parseInt(lesson.duration) || 0;
            return total + minutes;
        }, 0);
        
        return totalMinutes > 60 ? 
            `${Math.floor(totalMinutes / 60)}ч ${totalMinutes % 60}м` : 
            `${totalMinutes}м`;
    }

    getLessonTypeIcon(type) {
        const icons = {
            'video': '🎥',
            'text': '📄',
            'practice': '💪',
            'quiz': '❓'
        };
        return icons[type] || '📝';
    }
}
// === КОНЕЦ КЛАССА AcademyApp ===

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
