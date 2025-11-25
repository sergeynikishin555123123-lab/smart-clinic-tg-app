<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Академия АНБ</title>
    <style>
        :root {
            --primary-color: #2563eb;
            --secondary-color: #64748b;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --error-color: #ef4444;
            --bg-color: #ffffff;
            --text-color: #1f2937;
            --border-color: #e5e7eb;
            --card-bg: #ffffff;
            --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        [data-theme="dark"] {
            --bg-color: #111827;
            --text-color: #f9fafb;
            --border-color: #374151;
            --card-bg: #1f2937;
            --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .app-container {
            max-width: 100%;
            min-height: 100vh;
            padding-bottom: 80px;
        }

        /* Навигация */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--card-bg);
            border-top: 1px solid var(--border-color);
            display: flex;
            padding: 8px;
            z-index: 1000;
        }

        .nav-btn {
            flex: 1;
            padding: 12px 8px;
            border: none;
            background: none;
            color: var(--text-color);
            font-size: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .nav-btn.active {
            background: var(--primary-color);
            color: white;
        }

        .nav-badge {
            position: absolute;
            top: 4px;
            right: 8px;
            background: var(--error-color);
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* Страницы */
        .page {
            padding: 16px;
            animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
            margin-bottom: 24px;
        }

        .page-header h2 {
            font-size: 24px;
            margin-bottom: 8px;
        }

        /* Карточки */
        .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .content-card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 16px;
            box-shadow: var(--shadow);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
        }

        .content-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .card-image {
            position: relative;
            width: 100%;
            height: 160px;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 12px;
        }

        .card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .card-overlay {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 4px;
        }

        .favorite-btn, .play-btn {
            background: rgba(0, 0, 0, 0.7);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
        }

        .favorite-btn.active {
            background: var(--error-color);
        }

        /* Кнопки */
        .btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
        }

        .btn-primary {
            background: var(--primary-color);
            color: white;
        }

        .btn-primary:hover {
            opacity: 0.9;
        }

        .btn-outline {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-color);
        }

        .btn-success {
            background: var(--success-color);
            color: white;
        }

        .btn-small {
            padding: 8px 16px;
            font-size: 12px;
        }

        /* Поиск и фильтры */
        .search-box {
            position: relative;
            margin-bottom: 16px;
        }

        .search-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--card-bg);
            color: var(--text-color);
            font-size: 14px;
        }

        .search-icon {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
        }

        .filters-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .filter-select {
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--card-bg);
            color: var(--text-color);
            font-size: 14px;
        }

        /* Уведомления */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            border-radius: 8px;
            box-shadow: var(--shadow);
            z-index: 1001;
            max-width: 400px;
        }

        .notification-content {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: var(--text-color);
        }

        /* Адаптивность */
        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: 1fr;
            }
            
            .filters-row {
                flex-direction: column;
            }
            
            .page {
                padding: 12px;
            }
        }

        /* Hero секция */
        .hero-section {
            background: linear-gradient(135deg, var(--primary-color), #1e40af);
            color: white;
            padding: 40px 20px;
            border-radius: 16px;
            margin-bottom: 32px;
            text-align: center;
        }

        .hero-section h1 {
            font-size: 32px;
            margin-bottom: 12px;
        }

        .hero-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 24px;
        }

        .hero-search {
            display: flex;
            gap: 12px;
            max-width: 500px;
            margin: 0 auto 24px;
        }

        .hero-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            max-width: 400px;
            margin: 0 auto;
        }

        .stat {
            text-align: center;
        }

        .stat-number {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 12px;
            opacity: 0.8;
        }

        /* Быстрая навигация */
        .quick-nav-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 32px;
        }

        .nav-card {
            background: var(--card-bg);
            padding: 20px 12px;
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .nav-card:hover {
            transform: translateY(-2px);
        }

        .nav-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }

        .nav-title {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .nav-count {
            font-size: 12px;
            opacity: 0.7;
        }

        /* Секции */
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .section-header h2 {
            font-size: 20px;
        }

        /* Прогресс бар */
        .progress-bar {
            width: 100%;
            height: 6px;
            background: var(--border-color);
            border-radius: 3px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: var(--success-color);
            transition: width 0.3s ease;
        }

        /* Статистические карточки */
        .stats-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .stat-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .stat-card.large {
            grid-column: span 2;
        }

        .stat-icon {
            font-size: 32px;
        }

        .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .stat-label {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 4px;
        }

        .stat-trend {
            font-size: 12px;
            color: var(--success-color);
        }

        /* Табы */
        .tab-navigation {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 8px;
        }

        .tab-btn {
            padding: 12px 20px;
            border: none;
            background: none;
            color: var(--text-color);
            cursor: pointer;
            border-radius: 8px;
            font-size: 14px;
        }

        .tab-btn.active {
            background: var(--primary-color);
            color: white;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        /* Состояние пусто */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
        }

        .empty-icon {
            font-size: 64px;
            margin-bottom: 20px;
            opacity: 0.5;
        }

        .empty-title {
            font-size: 20px;
            margin-bottom: 12px;
            font-weight: 500;
        }

        .empty-description {
            opacity: 0.7;
            margin-bottom: 24px;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
        }

        .empty-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div id="app">
            <!-- Приложение будет рендериться здесь -->
        </div>
        
        <!-- Нижняя навигация -->
        <div class="bottom-nav">
            <button class="nav-btn active" data-page="home">
                🏠
                <span>Главная</span>
            </button>
            <button class="nav-btn" data-page="courses">
                📚
                <span>Курсы</span>
            </button>
            <button class="nav-btn" data-page="search">
                🔍
                <span>Поиск</span>
            </button>
            <button class="nav-btn" data-page="favorites">
                ❤️
                <span>Избранное</span>
                <div class="nav-badge" id="favoritesCount" style="display: none;">0</div>
            </button>
            <button class="nav-btn" data-page="profile">
                👤
                <span>Профиль</span>
            </button>
        </div>
    </div>

    <script>
        class AcademyApp {
            constructor() {
                console.log('🎓 Создание экземпляра AcademyApp...');
                
                // Инициализация состояния
                this.currentPage = 'home';
                this.currentSubPage = '';
                this.isAdmin = false;
                this.isSuperAdmin = false;
                this.allContent = {};
                this.state = {
                    favorites: {
                        courses: [],
                        podcasts: [],
                        streams: [],
                        videos: [],
                        materials: [],
                        events: []
                    },
                    cart: [],
                    progress: {},
                    settings: {
                        notifications: true,
                        autoPlay: false,
                        theme: 'light',
                        language: 'ru'
                    }
                };
                this.filters = {
                    courses: { category: 'all', level: 'all', sort: 'newest', search: '' },
                    podcasts: { category: 'all', sort: 'newest', search: '' },
                    streams: { category: 'all', sort: 'newest', search: '' },
                    videos: { category: 'all', sort: 'newest', search: '' },
                    materials: { category: 'all', material_type: 'all', sort: 'newest', search: '' },
                    events: { category: 'all', sort: 'newest', search: '' }
                };
                this.subscriptionState = {
                    selectedPlan: null,
                    selectedPeriod: 'monthly'
                };
                this.mediaPlayers = {
                    video: null,
                    audio: null
                };
                this.currentNewsFilter = 'Все';
                this.navigationItems = [];
                this.subscriptionPlans = [];
                this.userSubscription = null;
                this.instructors = [];
                this.currentUser = null;
                this.searchTerm = '';
                this.notifications = [];
                
                // Путь обучения
                this.learningPath = {
                    'Новичок': { minExp: 0, maxExp: 500, description: 'Начало пути в Академии', steps: ['Пройдите 1 курс', 'Посмотрите 5 материалов'] },
                    'Понимаю': { minExp: 500, maxExp: 1500, description: 'Освоение базовых навыков', steps: ['Пройдите 3 курса', 'Завершите 2 модуля'] },
                    'Практик': { minExp: 1500, maxExp: 3000, description: 'Применение знаний на практике', steps: ['Пройдите 5 курсов', 'Участвуйте в эфирах'] },
                    'Эксперт': { minExp: 3000, maxExp: 5000, description: 'Глубокое понимание предмета', steps: ['Станьте ментором', 'Создайте свой курс'] }
                };
                
                // Правила сообщества
                this.communityRules = [
                    { title: 'Уважение', description: 'Уважайте мнение других участников' },
                    { title: 'Конфиденциальность', description: 'Не распространяйте личную информацию' },
                    { title: 'Профессионализм', description: 'Соблюдайте медицинскую этику' },
                    { title: 'Взаимопомощь', description: 'Помогайте другим участникам' }
                ];
                
                // Конфигурация
                this.config = {
                    API_BASE_URL: window.location.origin,
                    UPLOAD_LIMIT: 50 * 1024 * 1024 // 50MB
                };

                // Инициализация данных
                this.initializeData();
            }

            // ==================== ИНИЦИАЛИЗАЦИЯ ДАННЫХ ====================

            initializeData() {
                // Инициализация демо-данных
                this.createDemoUser();
                this.createDemoContent();
                this.loadSubscriptionData();
                this.loadInstructors();
                this.loadNavigation();
                this.loadUserProgress();
            }

            // ==================== ОСНОВНЫЕ МЕТОДЫ ====================

            async init() {
                console.log('🚀 Инициализация Академии АНБ...');
                
                try {
                    // Инициализация Telegram WebApp
                    if (window.Telegram && Telegram.WebApp) {
                        Telegram.WebApp.ready();
                        Telegram.WebApp.expand();
                        Telegram.WebApp.enableClosingConfirmation();
                        console.log('✅ Telegram WebApp инициализирован');
                    }
                    
                    // Загрузка реальных данных если доступно
                    await this.loadRealData();
                    
                    // Восстановление состояния
                    this.restoreState();
                    
                    // Инициализация интерфейса
                    this.setupEventListeners();
                    this.renderPage('home');
                    this.updateAllCounters();
                    
                    console.log('✅ Приложение инициализировано');
                    
                } catch (error) {
                    console.error('❌ Ошибка инициализации:', error);
                    this.showFatalError('Не удалось загрузить приложение. Пожалуйста, перезагрузите страницу.');
                }
            }

            async loadRealData() {
                try {
                    const promises = [
                        this.safeApiCall('/api/user').then(response => {
                            if (response.success) {
                                this.currentUser = response.user;
                                this.isAdmin = response.user.isAdmin;
                                this.isSuperAdmin = response.user.isSuperAdmin;
                                this.state.favorites = response.user.favorites || this.state.favorites;
                            }
                        }),
                        this.safeApiCall('/api/content').then(response => {
                            if (response.success) {
                                this.allContent = response.data;
                            }
                        }),
                        this.safeApiCall('/api/subscription/plans').then(response => {
                            if (response.success) {
                                this.subscriptionPlans = response.data;
                            }
                        }),
                        this.safeApiCall('/api/user/subscription').then(response => {
                            if (response.success) {
                                this.userSubscription = response.data;
                                this.currentUser.hasActiveSubscription = !!response.data;
                            }
                        })
                    ];

                    await Promise.allSettled(promises);
                } catch (error) {
                    console.log('🔄 Используем локальные данные');
                }
            }

            // ==================== СИСТЕМА СОХРАНЕНИЯ СОСТОЯНИЯ ====================

            saveState() {
                const state = {
                    favorites: this.state.favorites,
                    cart: this.state.cart,
                    progress: this.state.progress,
                    settings: this.state.settings,
                    filters: this.filters,
                    currentPage: this.currentPage
                };
                localStorage.setItem('academyAppState', JSON.stringify(state));
            }

            restoreState() {
                try {
                    const saved = localStorage.getItem('academyAppState');
                    if (saved) {
                        const state = JSON.parse(saved);
                        this.state.favorites = state.favorites || this.state.favorites;
                        this.state.cart = state.cart || this.state.cart;
                        this.state.progress = state.progress || this.state.progress;
                        this.state.settings = state.settings || this.state.settings;
                        this.filters = state.filters || this.filters;
                        this.currentPage = state.currentPage || 'home';
                        
                        // Применяем настройки
                        this.applySettings();
                    }
                } catch (error) {
                    console.error('Ошибка восстановления состояния:', error);
                }
            }

            applySettings() {
                // Применение темы
                document.documentElement.setAttribute('data-theme', this.state.settings.theme);
                
                // Применение языка
                document.documentElement.lang = this.state.settings.language;
            }

            // ==================== СИСТЕМА РЕНДЕРИНГА ====================

            renderPage(page, subPage = '') {
                console.log(`🔄 Рендеринг страницы: ${page}${subPage ? ` (${subPage})` : ''}`);
                
                this.currentPage = page;
                this.currentSubPage = subPage;
                
                const appElement = document.getElementById('app');
                if (!appElement) {
                    console.error('❌ Элемент #app не найден');
                    return;
                }

                try {
                    let pageContent = '';
                    
                    if (subPage) {
                        pageContent = this.renderSubPage(subPage);
                    } else {
                        const pageMethods = {
                            'home': () => this.createHomePage(),
                            'courses': () => this.createCoursesPage(),
                            'podcasts': () => this.createPodcastsPage(),
                            'videos': () => this.createVideosPage(),
                            'materials': () => this.createMaterialsPage(),
                            'streams': () => this.createStreamsPage(),
                            'events': () => this.createEventsPage(),
                            'favorites': () => this.createFavoritesPage(),
                            'profile': () => this.createProfilePage(),
                            'community': () => this.createCommunityPage(),
                            'cart': () => this.createCartPage(),
                            'search': () => this.createSearchPage(),
                            'settings': () => this.createSettingsPage(),
                            'admin': () => this.createAdminPage()
                        };

                        pageContent = pageMethods[page] ? pageMethods[page]() : this.createNotFoundPage();
                    }
                    
                    appElement.innerHTML = pageContent;
                    this.initializePageComponents();
                    this.updateActiveNav();
                    this.saveState();
                    
                } catch (error) {
                    console.error('❌ Ошибка рендеринга страницы:', error);
                    appElement.innerHTML = this.createErrorPage('Ошибка загрузки страницы');
                }
            }

            renderSubPage(subPage) {
                const subPageHandlers = {
                    'course': (id) => this.createCourseDetailPage(id),
                    'stream': (id) => this.createStreamDetailPage(id),
                    'instructor': (id) => this.createInstructorDetailPage(id),
                    'podcast': (id) => this.createPodcastDetailPage(id),
                    'video': (id) => this.createVideoDetailPage(id),
                    'material': (id) => this.createMaterialDetailPage(id),
                    'event': (id) => this.createEventDetailPage(id)
                };

                for (const [type, handler] of Object.entries(subPageHandlers)) {
                    if (subPage.startsWith(`${type}-`)) {
                        const id = parseInt(subPage.replace(`${type}-`, ''));
                        return handler(id);
                    }
                }

                return this.createNotFoundPage();
            }

            // ==================== ГЛАВНАЯ СТРАНИЦА ====================

            createHomePage() {
                const stats = this.calculateHomeStats();
                const recommendedCourses = this.getRecommendedCourses();
                const liveStreams = this.getLiveStreams();
                const upcomingEvents = this.getUpcomingEvents();
                const newsItems = this.createNewsItems();
                
                return `
                    <div class="page home-page">
                        <!-- Hero Section -->
                        <div class="hero-section">
                            <div class="hero-content">
                                <h1>Академия АНБ</h1>
                                <p class="hero-subtitle">Профессиональное сообщество неврологов и реабилитологов</p>
                                <div class="hero-search">
                                    <input type="text" 
                                           class="search-input" 
                                           placeholder="Поиск курсов, материалов, видео..."
                                           value="${this.searchTerm}"
                                           oninput="app.handleSearchInput(this.value)"
                                           onkeypress="app.handleSearchKeypress(event)">
                                    <button class="btn btn-primary" onclick="app.performSearch()">
                                        🔍 Поиск
                                    </button>
                                </div>
                                <div class="hero-stats">
                                    <div class="stat">
                                        <div class="stat-number">${stats.courses}</div>
                                        <div class="stat-label">Курсов</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-number">${stats.students}</div>
                                        <div class="stat-label">Студентов</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-number">${stats.experts}</div>
                                        <div class="stat-label">Экспертов</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-number">${stats.materials}</div>
                                        <div class="stat-label">Материалов</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Быстрая навигация -->
                        <div class="quick-nav-section">
                            <h2>📚 Быстрый доступ</h2>
                            <div class="quick-nav-grid">
                                ${this.navigationItems.map(item => `
                                    <div class="nav-card" onclick="app.renderPage('${item.page}')">
                                        <div class="nav-icon">${item.icon}</div>
                                        <div class="nav-title">${item.title}</div>
                                        <div class="nav-count">${this.getContentCount(item.page)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Рекомендуемые курсы -->
                        ${recommendedCourses.length > 0 ? `
                        <div class="featured-section">
                            <div class="section-header">
                                <h2>⭐ Рекомендуемые курсы</h2>
                                <button class="btn btn-outline" onclick="app.renderPage('courses')">
                                    Все курсы →
                                </button>
                            </div>
                            <div class="content-grid">
                                ${recommendedCourses.slice(0, 4).map(course => this.createCourseCard(course)).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- LIVE эфиры -->
                        ${liveStreams.length > 0 ? `
                        <div class="live-section">
                            <div class="section-header">
                                <h2>🔴 Прямые эфиры</h2>
                                <div class="live-indicator">
                                    <div class="live-pulse"></div>
                                    ONLINE
                                </div>
                            </div>
                            <div class="content-grid">
                                ${liveStreams.slice(0, 2).map(stream => this.createStreamCard(stream)).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Предстоящие мероприятия -->
                        ${upcomingEvents.length > 0 ? `
                        <div class="events-section">
                            <div class="section-header">
                                <h2>🗓️ Ближайшие мероприятия</h2>
                                <button class="btn btn-outline" onclick="app.renderPage('events')">
                                    Все мероприятия →
                                </button>
                            </div>
                            <div class="events-list">
                                ${upcomingEvents.slice(0, 3).map(event => this.createEventCard(event)).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Новости -->
                        <div class="news-section">
                            <div class="section-header">
                                <h2>📰 Новости Академии</h2>
                                <div class="news-filters">
                                    <button class="filter-btn ${this.currentNewsFilter === 'Все' ? 'active' : ''}" 
                                            onclick="app.filterNews('Все')">Все</button>
                                    <button class="filter-btn ${this.currentNewsFilter === 'Неврология' ? 'active' : ''}" 
                                            onclick="app.filterNews('Неврология')">Неврология</button>
                                    <button class="filter-btn ${this.currentNewsFilter === 'Реабилитация' ? 'active' : ''}" 
                                            onclick="app.filterNews('Реабилитация')">Реабилитация</button>
                                    <button class="filter-btn ${this.currentNewsFilter === 'Обновления' ? 'active' : ''}" 
                                            onclick="app.filterNews('Обновления')">Обновления</button>
                                </div>
                            </div>
                            <div class="news-grid">
                                ${newsItems}
                            </div>
                        </div>

                        <!-- Статистика обучения -->
                        <div class="learning-stats-section">
                            <h2>📊 Ваш прогресс</h2>
                            <div class="stats-cards">
                                <div class="stat-card large">
                                    <div class="stat-icon">🎯</div>
                                    <div class="stat-content">
                                        <div class="stat-value">${this.state.progress.completedCourses || 0}</div>
                                        <div class="stat-label">Завершено курсов</div>
                                        <div class="stat-progress">
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${((this.state.progress.completedCourses || 0) / Math.max(this.allContent.courses?.length || 1, 1)) * 100}%"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="stat-card large">
                                    <div class="stat-icon">⏱️</div>
                                    <div class="stat-content">
                                        <div class="stat-value">${this.state.progress.studyHours || 0}</div>
                                        <div class="stat-label">Часов обучения</div>
                                        <div class="stat-trend">+5ч на этой неделе</div>
                                    </div>
                                </div>
                                <div class="stat-card large">
                                    <div class="stat-icon">📈</div>
                                    <div class="stat-content">
                                        <div class="stat-value">${this.state.progress.level || 'Новичок'}</div>
                                        <div class="stat-label">Текущий уровень</div>
                                        <div class="stat-progress">
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: ${((this.state.progress.experience || 0) / 500) * 100}%"></div>
                                            </div>
                                            <span class="progress-text">${this.state.progress.experience || 0}/500 XP</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // ==================== СТРАНИЦЫ КОНТЕНТА ====================

            createCoursesPage() {
                const currentFilters = this.filters.courses;
                const courses = this.getFilteredContent('courses');
                
                return `
                    <div class="page courses-page">
                        <div class="page-header">
                            <h2>📚 Курсы</h2>
                            <p>Профессиональные курсы по неврологии и реабилитации</p>
                        </div>
                        
                        <!-- Фильтры и поиск -->
                        <div class="content-controls">
                            <div class="search-box">
                                <input type="text" 
                                       class="search-input" 
                                       placeholder="Поиск курсов..."
                                       value="${currentFilters.search}"
                                       oninput="app.applySearchFilter('courses', this.value)">
                                <div class="search-icon">🔍</div>
                            </div>
                            
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label>Категория:</label>
                                    <select class="filter-select" onchange="app.applyFilter('courses', 'category', this.value)">
                                        <option value="all">Все категории</option>
                                        ${this.getUniqueCategories('courses').map(cat => `
                                            <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>${cat}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Уровень:</label>
                                    <select class="filter-select" onchange="app.applyFilter('courses', 'level', this.value)">
                                        <option value="all">Все уровни</option>
                                        <option value="beginner" ${currentFilters.level === 'beginner' ? 'selected' : ''}>Начинающий</option>
                                        <option value="intermediate" ${currentFilters.level === 'intermediate' ? 'selected' : ''}>Средний</option>
                                        <option value="advanced" ${currentFilters.level === 'advanced' ? 'selected' : ''}>Продвинутый</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Сортировка:</label>
                                    <select class="filter-select" onchange="app.applyFilter('courses', 'sort', this.value)">
                                        <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Сначала новые</option>
                                        <option value="popular" ${currentFilters.sort === 'popular' ? 'selected' : ''}>По популярности</option>
                                        <option value="rating" ${currentFilters.sort === 'rating' ? 'selected' : ''}>По рейтингу</option>
                                        <option value="price_low" ${currentFilters.sort === 'price_low' ? 'selected' : ''}>По цене (сначала дешевые)</option>
                                        <option value="price_high" ${currentFilters.sort === 'price_high' ? 'selected' : ''}>По цене (сначала дорогие)</option>
                                    </select>
                                </div>
                                
                                <button class="btn btn-outline" onclick="app.resetFilters('courses')">
                                    🗑️ Сбросить
                                </button>
                            </div>
                        </div>

                        <!-- Результаты -->
                        <div class="content-results">
                            <div class="results-header">
                                <div class="results-count">
                                    Найдено курсов: <strong>${courses.length}</strong>
                                </div>
                            </div>
                            
                            <div class="content-grid" id="courses-grid">
                                ${courses.length > 0 ? courses.map(course => this.createCourseCard(course)).join('') : this.createEmptyState('courses')}
                            </div>
                        </div>
                    </div>
                `;
            }

            createPodcastsPage() {
                const currentFilters = this.filters.podcasts;
                const podcasts = this.getFilteredContent('podcasts');
                
                return `
                    <div class="page podcasts-page">
                        <div class="page-header">
                            <h2>🎧 Подкасты</h2>
                            <p>Аудио материалы для профессионального развития</p>
                        </div>
                        
                        <div class="content-controls">
                            <div class="search-box">
                                <input type="text" 
                                       class="search-input" 
                                       placeholder="Поиск подкастов..."
                                       value="${currentFilters.search}"
                                       oninput="app.applySearchFilter('podcasts', this.value)">
                                <div class="search-icon">🔍</div>
                            </div>
                            
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label>Категория:</label>
                                    <select class="filter-select" onchange="app.applyFilter('podcasts', 'category', this.value)">
                                        <option value="all">Все категории</option>
                                        ${this.getUniqueCategories('podcasts').map(cat => `
                                            <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>${cat}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Сортировка:</label>
                                    <select class="filter-select" onchange="app.applyFilter('podcasts', 'sort', this.value)">
                                        <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Сначала новые</option>
                                        <option value="popular" ${currentFilters.sort === 'popular' ? 'selected' : ''}>По популярности</option>
                                        <option value="duration" ${currentFilters.sort === 'duration' ? 'selected' : ''}>По длительности</option>
                                        <option value="listens" ${currentFilters.sort === 'listens' ? 'selected' : ''}>По прослушиваниям</option>
                                    </select>
                                </div>
                                
                                <button class="btn btn-outline" onclick="app.resetFilters('podcasts')">
                                    🗑️ Сбросить
                                </button>
                            </div>
                        </div>
                        
                        <div class="content-grid">
                            ${podcasts.length > 0 ? podcasts.map(podcast => this.createPodcastCard(podcast)).join('') : this.createEmptyState('podcasts')}
                        </div>
                    </div>
                `;
            }

            createVideosPage() {
                const currentFilters = this.filters.videos;
                const videos = this.getFilteredContent('videos');
                
                return `
                    <div class="page videos-page">
                        <div class="page-header">
                            <h2>🎯 Видео</h2>
                            <p>Обучающие видео и практические демонстрации</p>
                        </div>
                        
                        <div class="content-controls">
                            <div class="search-box">
                                <input type="text" 
                                       class="search-input" 
                                       placeholder="Поиск видео..."
                                       value="${currentFilters.search}"
                                       oninput="app.applySearchFilter('videos', this.value)">
                                <div class="search-icon">🔍</div>
                            </div>
                            
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label>Категория:</label>
                                    <select class="filter-select" onchange="app.applyFilter('videos', 'category', this.value)">
                                        <option value="all">Все категории</option>
                                        ${this.getUniqueCategories('videos').map(cat => `
                                            <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>${cat}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Сортировка:</label>
                                    <select class="filter-select" onchange="app.applyFilter('videos', 'sort', this.value)">
                                        <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Сначала новые</option>
                                        <option value="popular" ${currentFilters.sort === 'popular' ? 'selected' : ''}>По популярности</option>
                                        <option value="duration" ${currentFilters.sort === 'duration' ? 'selected' : ''}>По длительности</option>
                                        <option value="views" ${currentFilters.sort === 'views' ? 'selected' : ''}>По просмотрам</option>
                                    </select>
                                </div>
                                
                                <button class="btn btn-outline" onclick="app.resetFilters('videos')">
                                    🗑️ Сбросить
                                </button>
                            </div>
                        </div>
                        
                        <div class="content-grid">
                            ${videos.length > 0 ? videos.map(video => this.createVideoCard(video)).join('') : this.createEmptyState('videos')}
                        </div>
                    </div>
                `;
            }

            createMaterialsPage() {
                const currentFilters = this.filters.materials;
                const materials = this.getFilteredContent('materials');
                
                return `
                    <div class="page materials-page">
                        <div class="page-header">
                            <h2>📋 Материалы</h2>
                            <p>Полезные материалы для ежедневной работы</p>
                        </div>
                        
                        <div class="content-controls">
                            <div class="search-box">
                                <input type="text" 
                                       class="search-input" 
                                       placeholder="Поиск материалов..."
                                       value="${currentFilters.search}"
                                       oninput="app.applySearchFilter('materials', this.value)">
                                <div class="search-icon">🔍</div>
                            </div>
                            
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label>Категория:</label>
                                    <select class="filter-select" onchange="app.applyFilter('materials', 'category', this.value)">
                                        <option value="all">Все категории</option>
                                        ${this.getUniqueCategories('materials').map(cat => `
                                            <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>${cat}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Тип материала:</label>
                                    <select class="filter-select" onchange="app.applyFilter('materials', 'material_type', this.value)">
                                        <option value="all">Все типы</option>
                                        <option value="checklist" ${currentFilters.material_type === 'checklist' ? 'selected' : ''}>Чек-листы</option>
                                        <option value="protocol" ${currentFilters.material_type === 'protocol' ? 'selected' : ''}>Протоколы</option>
                                        <option value="guide" ${currentFilters.material_type === 'guide' ? 'selected' : ''}>Руководства</option>
                                        <option value="template" ${currentFilters.material_type === 'template' ? 'selected' : ''}>Шаблоны</option>
                                        <option value="presentation" ${currentFilters.material_type === 'presentation' ? 'selected' : ''}>Презентации</option>
                                        <option value="research" ${currentFilters.material_type === 'research' ? 'selected' : ''}>Исследования</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Сортировка:</label>
                                    <select class="filter-select" onchange="app.applyFilter('materials', 'sort', this.value)">
                                        <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Сначала новые</option>
                                        <option value="popular" ${currentFilters.sort === 'popular' ? 'selected' : ''}>По популярности</option>
                                        <option value="downloads" ${currentFilters.sort === 'downloads' ? 'selected' : ''}>По загрузкам</option>
                                    </select>
                                </div>
                                
                                <button class="btn btn-outline" onclick="app.resetFilters('materials')">
                                    🗑️ Сбросить
                                </button>
                            </div>
                        </div>
                        
                        <div class="content-grid">
                            ${materials.length > 0 ? materials.map(material => this.createMaterialCard(material)).join('') : this.createEmptyState('materials')}
                        </div>
                    </div>
                `;
            }

            createStreamsPage() {
                const currentFilters = this.filters.streams;
                const streams = this.getFilteredContent('streams');
                const liveStreams = streams.filter(s => s.is_live);
                const recordedStreams = streams.filter(s => !s.is_live);
                
                return `
                    <div class="page streams-page">
                        <div class="page-header">
                            <h2>📹 Эфиры и разборы</h2>
                            <p>Прямые эфиры и разборы клинических случаев</p>
                        </div>
                        
                        <div class="content-controls">
                            <div class="search-box">
                                <input type="text" 
                                       class="search-input" 
                                       placeholder="Поиск эфиров..."
                                       value="${currentFilters.search}"
                                       oninput="app.applySearchFilter('streams', this.value)">
                                <div class="search-icon">🔍</div>
                            </div>
                            
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label>Категория:</label>
                                    <select class="filter-select" onchange="app.applyFilter('streams', 'category', this.value)">
                                        <option value="all">Все категории</option>
                                        ${this.getUniqueCategories('streams').map(cat => `
                                            <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>${cat}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Статус:</label>
                                    <select class="filter-select" onchange="app.applyStreamFilter('status', this.value)">
                                        <option value="all">Все эфиры</option>
                                        <option value="live">Только LIVE</option>
                                        <option value="recorded">Только записи</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Сортировка:</label>
                                    <select class="filter-select" onchange="app.applyFilter('streams', 'sort', this.value)">
                                        <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Сначала новые</option>
                                        <option value="popular" ${currentFilters.sort === 'popular' ? 'selected' : ''}>По популярности</option>
                                        <option value="participants" ${currentFilters.sort === 'participants' ? 'selected' : ''}>По участникам</option>
                                        <option value="duration" ${currentFilters.sort === 'duration' ? 'selected' : ''}>По длительности</option>
                                    </select>
                                </div>
                                
                                <button class="btn btn-outline" onclick="app.resetFilters('streams')">
                                    🗑️ Сбросить
                                </button>
                            </div>
                        </div>

                        ${liveStreams.length > 0 ? `
                        <div class="live-streams-section">
                            <h3>🔴 Прямой эфир</h3>
                            <div class="content-grid featured">
                                ${liveStreams.map(stream => this.createStreamCard(stream)).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="recorded-streams-section">
                            <h3>📹 Записи эфиров</h3>
                            <div class="content-grid">
                                ${recordedStreams.length > 0 ? recordedStreams.map(stream => this.createStreamCard(stream)).join('') : this.createEmptyState('streams', 'Записей эфиров пока нет')}
                            </div>
                        </div>
                    </div>
                `;
            }

            createEventsPage() {
                const currentFilters = this.filters.events;
                const events = this.getFilteredContent('events');
                const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date());
                const pastEvents = events.filter(e => new Date(e.event_date) <= new Date());
                
                return `
                    <div class="page events-page">
                        <div class="page-header">
                            <h2>🗺️ Карта мероприятий</h2>
                            <p>Онлайн и офлайн события Академии АНБ</p>
                        </div>
                        
                        <div class="content-controls">
                            <div class="search-box">
                                <input type="text" 
                                       class="search-input" 
                                       placeholder="Поиск мероприятий..."
                                       value="${currentFilters.search}"
                                       oninput="app.applySearchFilter('events', this.value)">
                                <div class="search-icon">🔍</div>
                            </div>
                            
                            <div class="filters-row">
                                <div class="filter-group">
                                    <label>Категория:</label>
                                    <select class="filter-select" onchange="app.applyFilter('events', 'category', this.value)">
                                        <option value="all">Все категории</option>
                                        ${this.getUniqueCategories('events').map(cat => `
                                            <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>${cat}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Тип:</label>
                                    <select class="filter-select" onchange="app.applyEventFilter('type', this.value)">
                                        <option value="all">Все мероприятия</option>
                                        <option value="online">Онлайн</option>
                                        <option value="offline">Офлайн</option>
                                        <option value="hybrid">Гибридные</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label>Сортировка:</label>
                                    <select class="filter-select" onchange="app.applyFilter('events', 'sort', this.value)">
                                        <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Сначала новые</option>
                                        <option value="date" ${currentFilters.sort === 'date' ? 'selected' : ''}>По дате</option>
                                        <option value="participants" ${currentFilters.sort === 'participants' ? 'selected' : ''}>По участникам</option>
                                    </select>
                                </div>
                                
                                <button class="btn btn-outline" onclick="app.resetFilters('events')">
                                    🗑️ Сбросить
                                </button>
                            </div>
                        </div>

                        ${upcomingEvents.length > 0 ? `
                        <div class="upcoming-events-section">
                            <h3>📅 Предстоящие мероприятия</h3>
                            <div class="events-timeline">
                                ${upcomingEvents.map(event => this.createEventTimelineCard(event)).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="past-events-section">
                            <h3>📚 Прошедшие мероприятия</h3>
                            <div class="content-grid">
                                ${pastEvents.length > 0 ? pastEvents.map(event => this.createEventCard(event)).join('') : this.createEmptyState('events', 'Прошедших мероприятий пока нет')}
                            </div>
                        </div>
                    </div>
                `;
            }

            // ==================== КАРТОЧКИ КОНТЕНТА ====================

            createCourseCard(course) {
                const imageUrl = course.image_url || '/webapp/assets/course-default.jpg';
                const progress = this.state.progress.courses?.[course.id] || 0;
                const isEnrolled = progress > 0;
                const isCompleted = progress === 100;
                
                return `
                    <div class="content-card course-card" onclick="app.openCourseDetail(${course.id})">
                        <div class="card-image">
                            <img src="${imageUrl}" alt="${course.title}" 
                                 onerror="this.src='/webapp/assets/course-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                    ${this.isFavorite(course.id, 'courses') ? '❤️' : '🤍'}
                                </button>
                            </div>
                            ${course.featured ? '<div class="featured-badge">Рекомендуем</div>' : ''}
                            ${course.discount > 0 ? `<div class="discount-badge">-${course.discount}%</div>` : ''}
                            ${isEnrolled ? `<div class="progress-badge">${isCompleted ? '✅ Завершен' : `🎯 ${progress}%`}</div>` : ''}
                        </div>
                        <div class="card-content">
                            <div class="card-category">${course.category || 'Общее'}</div>
                            <h3 class="card-title">${course.title}</h3>
                            <p class="card-description">${course.description || 'Описание курса'}</p>
                            <div class="card-meta">
                                <span class="meta-item">📊 ${this.getLevelName(course.level)}</span>
                                <span class="meta-item">⏱️ ${course.duration || 'Не указано'}</span>
                                <span class="meta-item">🎯 ${course.modules || 0} модулей</span>
                            </div>
                            
                            ${isEnrolled ? `
                            <div class="progress-section">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progress}%"></div>
                                </div>
                                <span class="progress-text">${progress}% завершено</span>
                            </div>
                            ` : ''}
                            
                            <div class="card-footer">
                                <div class="price-section">
                                    ${course.discount > 0 ? `
                                        <span class="price-original">${this.formatPrice(course.price)}</span>
                                    ` : ''}
                                    <span class="price-current">
                                        ${this.formatPrice(course.discount > 0 ? course.price * (1 - course.discount/100) : course.price)}
                                    </span>
                                </div>
                                <div class="action-buttons">
                                    ${isEnrolled ? `
                                        <button class="btn btn-success btn-small" onclick="event.stopPropagation(); app.continueCourse(${course.id})">
                                            ${isCompleted ? '👁️ Повторить' : '🎯 Продолжить'}
                                        </button>
                                    ` : this.currentUser?.hasActiveSubscription ? `
                                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.enrollCourse(${course.id})">
                                            Начать
                                        </button>
                                    ` : `
                                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.openCourseDetail(${course.id})">
                                            Подробнее
                                        </button>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            createPodcastCard(podcast) {
                const imageUrl = podcast.image_url || '/webapp/assets/podcast-default.jpg';
                const isListened = this.state.progress.podcasts?.[podcast.id];
                
                return `
                    <div class="content-card podcast-card" onclick="app.openPodcastDetail(${podcast.id})">
                        <div class="card-image">
                            <img src="${imageUrl}" alt="${podcast.title}" 
                                 onerror="this.src='/webapp/assets/podcast-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(podcast.id, 'podcasts') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${podcast.id}, 'podcasts')">
                                    ${this.isFavorite(podcast.id, 'podcasts') ? '❤️' : '🤍'}
                                </button>
                                <button class="play-btn" onclick="event.stopPropagation(); app.playPodcast(${podcast.id})">
                                    ▶️
                                </button>
                            </div>
                            ${isListened ? '<div class="played-badge">🎧</div>' : ''}
                        </div>
                        <div class="card-content">
                            <div class="card-category">${podcast.category || 'Общее'}</div>
                            <h3 class="card-title">${podcast.title}</h3>
                            <p class="card-description">${podcast.description || 'Описание подкаста'}</p>
                            <div class="card-meta">
                                <span class="meta-item">⏱️ ${podcast.duration || '00:00'}</span>
                                <span class="meta-item">🎧 ${podcast.listens || 0} прослушиваний</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            createVideoCard(video) {
                const thumbnailUrl = video.thumbnail_url || '/webapp/assets/video-default.jpg';
                const isWatched = this.state.progress.videos?.[video.id];
                
                return `
                    <div class="content-card video-card" onclick="app.openVideoDetail(${video.id})">
                        <div class="card-image">
                            <img src="${thumbnailUrl}" alt="${video.title}" 
                                 onerror="this.src='/webapp/assets/video-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(video.id, 'videos') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${video.id}, 'videos')">
                                    ${this.isFavorite(video.id, 'videos') ? '❤️' : '🤍'}
                                </button>
                                <button class="play-btn" onclick="event.stopPropagation(); app.playVideo(${video.id})">
                                    ▶️
                                </button>
                            </div>
                            <div class="video-duration">${video.duration || '00:00'}</div>
                            ${isWatched ? '<div class="watched-badge">👁️</div>' : ''}
                        </div>
                        <div class="card-content">
                            <div class="card-category">${video.category || 'Общее'}</div>
                            <h3 class="card-title">${video.title}</h3>
                            <p class="card-description">${video.description || 'Описание видео'}</p>
                            <div class="card-meta">
                                <span class="meta-item">👁️ ${video.views || 0} просмотров</span>
                                <span class="meta-item">📅 ${new Date(video.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            createMaterialCard(material) {
                const imageUrl = material.image_url || '/webapp/assets/material-default.jpg';
                const isDownloaded = this.state.progress.materials?.[material.id];
                const fileSize = material.file_size ? this.formatFileSize(material.file_size) : '';
                
                return `
                    <div class="content-card material-card" onclick="app.openMaterialDetail(${material.id})">
                        <div class="card-image">
                            <img src="${imageUrl}" alt="${material.title}" 
                                 onerror="this.src='/webapp/assets/material-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(material.id, 'materials') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${material.id}, 'materials')">
                                    ${this.isFavorite(material.id, 'materials') ? '❤️' : '🤍'}
                                </button>
                                <button class="download-btn" onclick="event.stopPropagation(); app.downloadMaterial(${material.id})">
                                    📥
                                </button>
                            </div>
                            <div class="material-type">${this.getMaterialTypeIcon(material.material_type)}</div>
                            ${isDownloaded ? '<div class="downloaded-badge">📥</div>' : ''}
                        </div>
                        <div class="card-content">
                            <div class="card-category">${material.category || 'Общее'}</div>
                            <h3 class="card-title">${material.title}</h3>
                            <p class="card-description">${material.description || 'Описание материала'}</p>
                            <div class="card-meta">
                                <span class="meta-item">${this.getMaterialTypeName(material.material_type)}</span>
                                <span class="meta-item">📥 ${material.downloads || 0} загрузок</span>
                                ${fileSize ? `<span class="meta-item">💾 ${fileSize}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }

            createStreamCard(stream) {
                const thumbnailUrl = stream.thumbnail_url || '/webapp/assets/stream-default.jpg';
                const isWatched = this.state.progress.streams?.[stream.id];
                
                return `
                    <div class="content-card stream-card" onclick="app.openStreamDetail(${stream.id})">
                        <div class="card-image">
                            <img src="${thumbnailUrl}" alt="${stream.title}" 
                                 onerror="this.src='/webapp/assets/stream-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(stream.id, 'streams') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${stream.id}, 'streams')">
                                    ${this.isFavorite(stream.id, 'streams') ? '❤️' : '🤍'}
                                </button>
                                <button class="play-btn" onclick="event.stopPropagation(); app.playStream(${stream.id})">
                                    ▶️
                                </button>
                            </div>
                            ${stream.is_live ? `
                            <div class="live-badge">
                                <div class="live-pulse"></div>
                                LIVE
                            </div>
                            ` : ''}
                            ${isWatched ? '<div class="watched-badge">👁️</div>' : ''}
                        </div>
                        <div class="card-content">
                            <div class="card-category">${stream.category || 'Общее'}</div>
                            <h3 class="card-title">${stream.title}</h3>
                            <p class="card-description">${stream.description || 'Описание эфира'}</p>
                            <div class="card-meta">
                                <span class="meta-item">⏱️ ${stream.duration || '00:00'}</span>
                                <span class="meta-item">👥 ${stream.participants || 0} участников</span>
                                ${stream.scheduled_start ? `
                                <span class="meta-item">📅 ${new Date(stream.scheduled_start).toLocaleDateString('ru-RU')}</span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }

            createEventCard(event) {
                const imageUrl = event.image_url || '/webapp/assets/event-default.jpg';
                const isRegistered = this.state.progress.events?.[event.id]?.registered;
                const eventDate = new Date(event.event_date);
                const isUpcoming = eventDate > new Date();
                
                return `
                    <div class="content-card event-card">
                        <div class="card-image">
                            <img src="${imageUrl}" alt="${event.title}" 
                                 onerror="this.src='/webapp/assets/event-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(event.id, 'events') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${event.id}, 'events')">
                                    ${this.isFavorite(event.id, 'events') ? '❤️' : '🤍'}
                                </button>
                            </div>
                            <div class="event-type">${event.event_type === 'online' ? '🌐 Онлайн' : event.event_type === 'offline' ? '🏛️ Офлайн' : '🔀 Гибрид'}</div>
                            ${isRegistered ? '<div class="registered-badge">✅ Зарегистрирован</div>' : ''}
                        </div>
                        <div class="card-content">
                            <div class="event-date">
                                <div class="date-day">${eventDate.getDate()}</div>
                                <div class="date-month">${eventDate.toLocaleDateString('ru-RU', { month: 'short' })}</div>
                                <div class="date-year">${eventDate.getFullYear()}</div>
                            </div>
                            <h3 class="card-title">${event.title}</h3>
                            <p class="card-description">${event.description}</p>
                            <div class="card-meta">
                                <span class="meta-item">📍 ${event.location}</span>
                                <span class="meta-item">👥 ${event.participants || 0} участников</span>
                                <span class="meta-item">⏰ ${eventDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div class="event-actions">
                                ${isUpcoming ? `
                                    ${!isRegistered ? `
                                    <button class="btn btn-primary btn-small" onclick="app.registerForEvent(${event.id})">
                                        Зарегистрироваться
                                    </button>
                                    ` : `
                                    <button class="btn btn-outline btn-small" onclick="app.cancelEventRegistration(${event.id})">
                                        Отменить регистрацию
                                    </button>
                                    `}
                                    <button class="btn btn-outline btn-small" onclick="app.addToCalendar(${event.id})">
                                        📅 В календарь
                                    </button>
                                ` : `
                                    <button class="btn btn-outline btn-small" onclick="app.openEventDetail(${event.id})">
                                        Смотреть запись
                                    </button>
                                `}
                            </div>
                        </div>
                    </div>
                `;
            }

            createEventTimelineCard(event) {
                const eventDate = new Date(event.event_date);
                const now = new Date();
                const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
                const isRegistered = this.state.progress.events?.[event.id]?.registered;
                
                return `
                    <div class="timeline-event">
                        <div class="timeline-date">
                            <div class="date-number">${eventDate.getDate()}</div>
                            <div class="date-month">${eventDate.toLocaleDateString('ru-RU', { month: 'short' })}</div>
                        </div>
                        <div class="timeline-content">
                            <div class="event-header">
                                <h4>${event.title}</h4>
                                <span class="event-badge ${event.event_type}">${event.event_type === 'online' ? '🌐 Онлайн' : '🏛️ Офлайн'}</span>
                            </div>
                            <p class="event-description">${event.description}</p>
                            <div class="event-meta">
                                <span>⏰ ${eventDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>📍 ${event.location}</span>
                                <span>📅 Через ${daysUntil} дней</span>
                            </div>
                            <div class="event-actions">
                                ${!isRegistered ? `
                                <button class="btn btn-primary btn-small" onclick="app.registerForEvent(${event.id})">
                                    Зарегистрироваться
                                </button>
                                ` : `
                                <button class="btn btn-success btn-small" onclick="app.openEventDetail(${event.id})">
                                    ✅ Зарегистрирован
                                </button>
                                `}
                                <button class="btn btn-outline btn-small" onclick="app.addToCalendar(${event.id})">
                                    📅 В календарь
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            // ==================== СИСТЕМА ИЗБРАННОГО ====================

            createFavoritesPage() {
                const favoriteCourses = this.allContent.courses?.filter(course => this.isFavorite(course.id, 'courses')) || [];
                const favoritePodcasts = this.allContent.podcasts?.filter(podcast => this.isFavorite(podcast.id, 'podcasts')) || [];
                const favoriteVideos = this.allContent.videos?.filter(video => this.isFavorite(video.id, 'videos')) || [];
                const favoriteMaterials = this.allContent.materials?.filter(material => this.isFavorite(material.id, 'materials')) || [];
                const favoriteStreams = this.allContent.streams?.filter(stream => this.isFavorite(stream.id, 'streams')) || [];
                const favoriteEvents = this.allContent.events?.filter(event => this.isFavorite(event.id, 'events')) || [];
                
                const totalFavorites = this.getTotalFavorites();
                
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
                                <div class="empty-actions">
                                    <button class="btn btn-primary" onclick="app.renderPage('courses')">
                                        📚 Найти курсы
                                    </button>
                                    <button class="btn btn-outline" onclick="app.renderPage('materials')">
                                        📋 Посмотреть материалы
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                return `
                    <div class="page favorites-page">
                        <div class="page-header">
                            <h2>❤️ Избранное</h2>
                            <p>Ваши сохраненные материалы (${totalFavorites})</p>
                            <div class="header-actions">
                                <button class="btn btn-outline" onclick="app.clearAllFavorites()">
                                    🗑️ Очистить все
                                </button>
                            </div>
                        </div>

                        <div class="favorites-tabs">
                            <div class="tab-navigation">
                                <button class="tab-btn active" onclick="app.switchFavoritesTab('all')">
                                    Все (${totalFavorites})
                                </button>
                                <button class="tab-btn" onclick="app.switchFavoritesTab('courses')">
                                    Курсы (${favoriteCourses.length})
                                </button>
                                <button class="tab-btn" onclick="app.switchFavoritesTab('podcasts')">
                                    Подкасты (${favoritePodcasts.length})
                                </button>
                                <button class="tab-btn" onclick="app.switchFavoritesTab('videos')">
                                    Видео (${favoriteVideos.length})
                                </button>
                                <button class="tab-btn" onclick="app.switchFavoritesTab('materials')">
                                    Материалы (${favoriteMaterials.length})
                                </button>
                                <button class="tab-btn" onclick="app.switchFavoritesTab('streams')">
                                    Эфиры (${favoriteStreams.length})
                                </button>
                                <button class="tab-btn" onclick="app.switchFavoritesTab('events')">
                                    Мероприятия (${favoriteEvents.length})
                                </button>
                            </div>

                            <div class="tab-content active" id="all-tab">
                                ${this.renderFavoritesByType('all', {
                                    courses: favoriteCourses,
                                    podcasts: favoritePodcasts,
                                    videos: favoriteVideos,
                                    materials: favoriteMaterials,
                                    streams: favoriteStreams,
                                    events: favoriteEvents
                                })}
                            </div>

                            ${Object.entries({
                                courses: favoriteCourses,
                                podcasts: favoritePodcasts,
                                videos: favoriteVideos,
                                materials: favoriteMaterials,
                                streams: favoriteStreams,
                                events: favoriteEvents
                            }).map(([type, items]) => `
                                <div class="tab-content" id="${type}-tab">
                                    ${this.renderFavoritesByType(type, items)}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            renderFavoritesByType(type, items) {
                if (type === 'all') {
                    const allItems = Object.values(items).flat();
                    if (allItems.length === 0) return this.createEmptyState('favorites');
                    
                    return `
                        <div class="favorites-grid">
                            ${allItems.map(item => this.createFavoriteItem(item)).join('')}
                        </div>
                    `;
                }

                if (items.length === 0) {
                    return this.createEmptyState(type);
                }

                const contentTemplates = {
                    courses: (item) => this.createCourseCard(item),
                    podcasts: (item) => this.createPodcastCard(item),
                    videos: (item) => this.createVideoCard(item),
                    materials: (item) => this.createMaterialCard(item),
                    streams: (item) => this.createStreamCard(item),
                    events: (item) => this.createEventCard(item)
                };

                return `
                    <div class="content-grid">
                        ${items.map(item => contentTemplates[type](item)).join('')}
                    </div>
                `;
            }

            createFavoriteItem(item) {
                const type = this.getContentType(item);
                const typeIcons = {
                    courses: '📚',
                    podcasts: '🎧',
                    videos: '🎯',
                    materials: '📋',
                    streams: '📹',
                    events: '🗺️'
                };

                return `
                    <div class="favorite-item" onclick="app.open${type.charAt(0).toUpperCase() + type.slice(1)}Detail(${item.id})">
                        <div class="favorite-icon">${typeIcons[type]}</div>
                        <div class="favorite-content">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                            <div class="favorite-meta">
                                <span class="favorite-type">${this.getContentTypeName(type)}</span>
                                <span class="favorite-date">Добавлено ${new Date().toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                        <button class="favorite-remove" onclick="event.stopPropagation(); app.toggleFavorite(${item.id}, '${type}')">
                            ❌
                        </button>
                    </div>
                `;
            }

            // ==================== СИСТЕМА КОРЗИНЫ ====================

            createCartPage() {
                const cartItems = this.state.cart;
                const total = this.calculateCartTotal();
                
                if (cartItems.length === 0) {
                    return `
                        <div class="page cart-page">
                            <div class="page-header">
                                <h2>🛒 Корзина</h2>
                                <p>Товары, которые вы планируете приобрести</p>
                            </div>
                            <div class="empty-state">
                                <div class="empty-icon">🛒</div>
                                <div class="empty-title">Корзина пуста</div>
                                <div class="empty-description">Добавьте курсы или материалы в корзину, чтобы приобрести их</div>
                                <div class="empty-actions">
                                    <button class="btn btn-primary" onclick="app.renderPage('courses')">
                                        📚 Посмотреть курсы
                                    </button>
                                    <button class="btn btn-outline" onclick="app.renderPage('materials')">
                                        📋 Посмотреть материалы
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="page cart-page">
                        <div class="page-header">
                            <h2>🛒 Корзина</h2>
                            <p>Товары, которые вы планируете приобрести</p>
                        </div>

                        <div class="cart-container">
                            <div class="cart-items">
                                <div class="cart-header">
                                    <h3>Товары в корзине (${cartItems.length})</h3>
                                    <button class="btn btn-outline btn-small" onclick="app.clearCart()">
                                        🗑️ Очистить корзину
                                    </button>
                                </div>
                                
                                ${cartItems.map(item => this.createCartItem(item)).join('')}
                            </div>

                            <div class="cart-summary">
                                <div class="summary-card">
                                    <h4>Итого</h4>
                                    <div class="summary-line">
                                        <span>Товары (${cartItems.length}):</span>
                                        <span>${this.formatPrice(total.original)}</span>
                                    </div>
                                    ${total.discount > 0 ? `
                                    <div class="summary-line discount">
                                        <span>Скидка:</span>
                                        <span>-${this.formatPrice(total.discount)}</span>
                                    </div>
                                    ` : ''}
                                    <div class="summary-line total">
                                        <span>К оплате:</span>
                                        <span>${this.formatPrice(total.final)}</span>
                                    </div>
                                    
                                    <button class="btn btn-primary btn-large" onclick="app.checkout()">
                                        💳 Перейти к оплате
                                    </button>
                                    
                                    <div class="security-badges">
                                        <div class="security-badge">🔒 Безопасная оплата</div>
                                        <div class="security-badge">✅ 30-дневная гарантия</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            createCartItem(item) {
                const price = item.discount > 0 ? item.price * (1 - item.discount/100) : item.price;
                
                return `
                    <div class="cart-item">
                        <div class="item-image">
                            <img src="${item.image_url}" alt="${item.title}" 
                                 onerror="this.src='/webapp/assets/course-default.jpg'">
                        </div>
                        <div class="item-info">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                            <div class="item-meta">
                                <span class="item-type">${this.getContentTypeName(item.type)}</span>
                                <span class="item-duration">${item.duration || 'Не указано'}</span>
                            </div>
                        </div>
                        <div class="item-price">
                            ${item.discount > 0 ? `
                            <div class="price-original">${this.formatPrice(item.price)}</div>
                            ` : ''}
                            <div class="price-current">${this.formatPrice(price)}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn btn-outline btn-small" onclick="app.removeFromCart(${item.id})">
                                🗑️ Удалить
                            </button>
                            <button class="btn btn-outline btn-small" onclick="app.toggleFavorite(${item.id}, '${item.type}')">
                                ${this.isFavorite(item.id, item.type) ? '❤️' : '🤍'}
                            </button>
                        </div>
                    </div>
                `;
            }

            // ==================== СИСТЕМА ПОИСКА ====================

            createSearchPage() {
                const results = this.performGlobalSearch(this.searchTerm);
                
                return `
                    <div class="page search-page">
                        <div class="page-header">
                            <h2>🔍 Поиск</h2>
                            <p>Результаты поиска по запросу: "${this.searchTerm}"</p>
                        </div>

                        <div class="search-container">
                            <div class="search-box large">
                                <input type="text" 
                                       class="search-input" 
                                       placeholder="Поиск курсов, материалов, видео..."
                                       value="${this.searchTerm}"
                                       oninput="app.handleSearchInput(this.value)"
                                       onkeypress="app.handleSearchKeypress(event)">
                                <button class="btn btn-primary" onclick="app.performSearch()">
                                    🔍 Поиск
                                </button>
                            </div>

                            ${results.total > 0 ? `
                            <div class="search-results">
                                <div class="results-summary">
                                    <div class="results-count">
                                        Найдено результатов: <strong>${results.total}</strong>
                                    </div>
                                </div>

                                <div class="search-categories">
                                    ${Object.entries(results.categories).map(([type, category]) => `
                                        <div class="search-category">
                                            <h3>${category.icon} ${category.name} (${category.items.length})</h3>
                                            <div class="category-results">
                                                ${category.items.map(item => this.createSearchResultItem(item)).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : `
                            <div class="no-results">
                                <div class="no-results-icon">🔍</div>
                                <h3>Ничего не найдено</h3>
                                <p>Попробуйте изменить поисковый запрос или проверьте орфографию</p>
                            </div>
                            `}
                        </div>
                    </div>
                `;
            }

            createSearchResultItem(item) {
                const typeIcons = {
                    courses: '📚',
                    podcasts: '🎧',
                    videos: '🎯',
                    materials: '📋',
                    streams: '📹',
                    events: '🗺️'
                };

                return `
                    <div class="search-result-item" onclick="app.open${item.type.charAt(0).toUpperCase() + item.type.slice(1)}Detail(${item.id})">
                        <div class="result-icon">${typeIcons[item.type]}</div>
                        <div class="result-content">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                            <div class="result-meta">
                                <span class="result-type">${this.getContentTypeName(item.type)}</span>
                                <span class="result-category">${item.category}</span>
                                <span class="result-date">${new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                        <div class="result-actions">
                            <button class="btn btn-outline btn-small" onclick="event.stopPropagation(); app.toggleFavorite(${item.id}, '${item.type}')">
                                ${this.isFavorite(item.id, item.type) ? '❤️' : '🤍'}
                            </button>
                        </div>
                    </div>
                `;
            }

            // ==================== ПРОФИЛЬ И НАСТРОЙКИ ====================

            createProfilePage() {
                const user = this.currentUser;
                const progress = user?.progress || this.state.progress;
                const currentLevel = this.learningPath[progress.level] || this.learningPath['Понимаю'];
                const achievements = this.getUserAchievements();
                const learningStats = this.calculateLearningStats();
                
                return `
                    <div class="page profile-page">
                        <div class="profile-header">
                            <div class="avatar-section">
                                <div class="avatar-large">
                                    ${user.avatarUrl ? 
                                        `<img src="${user.avatarUrl}" alt="Аватар">` : 
                                        '<div class="avatar-placeholder">👤</div>'
                                    }
                                </div>
                                <div class="profile-info">
                                    <h2>${user?.firstName || 'Пользователь'} ${user?.lastName || ''}</h2>
                                    <p class="profile-status">${this.getProfileStatus()}</p>
                                    <p class="member-since">Член Академии АНБ с ${new Date(user?.joinDate || Date.now()).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}</p>
                                    <div class="profile-badges">
                                        ${user?.isVerified ? '<span class="badge verified">✅ Проверен</span>' : ''}
                                        ${user?.isPremium ? '<span class="badge premium">💎 Премиум</span>' : ''}
                                        <span class="badge level">${progress.level}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="subscription-status ${this.currentUser?.hasActiveSubscription ? 'active' : 'inactive'}">
                                <div class="status-content">
                                    <span>${this.currentUser?.hasActiveSubscription ? '✅' : '❌'} Подписка ${this.currentUser?.hasActiveSubscription ? 'активна' : 'не активна'}</span>
                                    ${this.userSubscription ? `
                                    <div class="subscription-details">
                                        <span>Тариф: ${this.userSubscription.plan_name}</span>
                                        <span>Действует до: ${new Date(this.userSubscription.ends_at).toLocaleDateString('ru-RU')}</span>
                                    </div>
                                    ` : ''}
                                </div>
                                <button class="btn btn-small ${this.currentUser?.hasActiveSubscription ? 'btn-outline' : 'btn-primary'}" 
                                        onclick="app.showSubscriptionModal()">
                                    ${this.currentUser?.hasActiveSubscription ? 'Изменить' : 'Активировать'}
                                </button>
                            </div>
                        </div>

                        <!-- Статистика профиля -->
                        <div class="profile-stats-grid">
                            <div class="stat-card">
                                <div class="stat-icon">📚</div>
                                <div class="stat-info">
                                    <div class="stat-value">${progress.completedCourses || 0}</div>
                                    <div class="stat-label">Завершено курсов</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">🎯</div>
                                <div class="stat-info">
                                    <div class="stat-value">${progress.completedModules || 0}</div>
                                    <div class="stat-label">Завершено модулей</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">⏱️</div>
                                <div class="stat-info">
                                    <div class="stat-value">${learningStats.studyHours}</div>
                                    <div class="stat-label">Часов обучения</div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-icon">❤️</div>
                                <div class="stat-info">
                                    <div class="stat-value">${this.getTotalFavorites()}</div>
                                    <div class="stat-label">В избранном</div>
                                </div>
                            </div>
                        </div>

                        <!-- Путь обучения -->
                        <div class="learning-path-section">
                            <h3>🛣️ Мой путь обучения</h3>
                            <div class="current-level">
                                <div class="level-badge">${progress.level}</div>
                                <div class="level-description">${currentLevel.description}</div>
                            </div>
                            
                            <div class="level-progress">
                                <div class="progress-header">
                                    <span>Прогресс уровня</span>
                                    <span>${progress.experience} / ${currentLevel.maxExp} XP</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${(progress.experience / currentLevel.maxExp) * 100}%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Достижения -->
                        ${achievements.length > 0 ? `
                        <div class="achievements-section">
                            <h3>🏆 Мои достижения</h3>
                            <div class="achievements-grid">
                                ${achievements.map(achievement => `
                                    <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
                                        <div class="achievement-icon">${achievement.icon}</div>
                                        <div class="achievement-content">
                                            <h4>${achievement.title}</h4>
                                            <p>${achievement.description}</p>
                                        </div>
                                        <div class="achievement-status">
                                            ${achievement.unlocked ? '✅' : '🔒'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Действия профиля -->
                        <div class="profile-actions">
                            <h3>⚙️ Действия</h3>
                            <div class="action-buttons">
                                <button class="btn btn-outline action-btn" onclick="app.renderPage('favorites')">
                                    ❤️ Избранное
                                </button>
                                <button class="btn btn-outline action-btn" onclick="app.renderPage('settings')">
                                    ⚙️ Настройки
                                </button>
                                ${this.isAdmin ? `
                                <button class="btn btn-outline action-btn" onclick="app.renderPage('admin')">
                                    🔧 Админ-панель
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }

            createSettingsPage() {
                return `
                    <div class="page settings-page">
                        <div class="page-header">
                            <h2>⚙️ Настройки</h2>
                            <p>Управление настройками приложения и учетной записи</p>
                        </div>

                        <div class="settings-container">
                            <div class="settings-section">
                                <h3>🌐 Основные настройки</h3>
                                
                                <div class="setting-group">
                                    <label class="setting-label">Язык интерфейса</label>
                                    <select class="setting-select" onchange="app.changeLanguage(this.value)">
                                        <option value="ru" ${this.state.settings.language === 'ru' ? 'selected' : ''}>Русский</option>
                                        <option value="en" ${this.state.settings.language === 'en' ? 'selected' : ''}>English</option>
                                    </select>
                                </div>

                                <div class="setting-group">
                                    <label class="setting-label">Тема оформления</label>
                                    <div class="theme-options">
                                        <label class="theme-option">
                                            <input type="radio" name="theme" value="light" 
                                                   ${this.state.settings.theme === 'light' ? 'checked' : ''}
                                                   onchange="app.changeTheme('light')">
                                            <span class="theme-preview light">🌞 Светлая</span>
                                        </label>
                                        <label class="theme-option">
                                            <input type="radio" name="theme" value="dark" 
                                                   ${this.state.settings.theme === 'dark' ? 'checked' : ''}
                                                   onchange="app.changeTheme('dark')">
                                            <span class="theme-preview dark">🌙 Тёмная</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="setting-group">
                                    <label class="setting-label">
                                        <input type="checkbox" 
                                               ${this.state.settings.autoPlay ? 'checked' : ''}
                                               onchange="app.toggleSetting('autoPlay', this.checked)">
                                        Автовоспроизведение видео
                                    </label>
                                </div>

                                <div class="setting-group">
                                    <label class="setting-label">
                                        <input type="checkbox" 
                                               ${this.state.settings.notifications ? 'checked' : ''}
                                               onchange="app.toggleSetting('notifications', this.checked)">
                                        Уведомления
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            // ==================== АДМИН-ПАНЕЛЬ ====================

            createAdminPage() {
                if (!this.isAdmin && !this.isSuperAdmin) {
                    return this.createAccessDeniedPage();
                }

                const stats = this.calculateAdminStats();
                
                return `
                    <div class="page admin-page">
                        <div class="page-header">
                            <h2>🔧 Панель администратора</h2>
                            <p>Управление контентом и пользователями Академии</p>
                        </div>

                        <div class="admin-stats">
                            <div class="stat-card admin">
                                <div class="stat-icon">👥</div>
                                <div class="stat-info">
                                    <div class="stat-value">${stats.totalUsers}</div>
                                    <div class="stat-label">Пользователей</div>
                                </div>
                            </div>
                            <div class="stat-card admin">
                                <div class="stat-icon">📚</div>
                                <div class="stat-info">
                                    <div class="stat-value">${stats.totalCourses}</div>
                                    <div class="stat-label">Курсов</div>
                                </div>
                            </div>
                            <div class="stat-card admin">
                                <div class="stat-icon">💎</div>
                                <div class="stat-info">
                                    <div class="stat-value">${stats.premiumUsers}</div>
                                    <div class="stat-label">Премиум</div>
                                </div>
                            </div>
                            <div class="stat-card admin">
                                <div class="stat-icon">💰</div>
                                <div class="stat-info">
                                    <div class="stat-value">${this.formatPrice(stats.revenue)}</div>
                                    <div class="stat-label">Выручка</div>
                                </div>
                            </div>
                        </div>

                        <div class="admin-actions">
                            <h3>🚀 Быстрые действия</h3>
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="app.showCreateCourseModal()">
                                    ➕ Создать курс
                                </button>
                                <button class="btn btn-outline" onclick="app.showUserManagement()">
                                    👥 Управление пользователями
                                </button>
                                <button class="btn btn-outline" onclick="app.showAnalytics()">
                                    📈 Аналитика
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

            setupEventListeners() {
                // Глобальные обработчики
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.handleBackButton();
                    }
                    if (e.ctrlKey && e.key === 'k') {
                        e.preventDefault();
                        this.focusSearch();
                    }
                });

                // Обработчики навигации
                document.addEventListener('click', (e) => {
                    if (e.target.matches('.nav-btn')) {
                        const page = e.target.dataset.page;
                        this.renderPage(page);
                    }
                });

                console.log('✅ Все обработчики событий установлены');
            }

            initializePageComponents() {
                // Инициализация компонентов страницы
                this.updateActiveNav();
            }

            // ==================== API И ДАННЫЕ ====================

            async safeApiCall(url, options = {}) {
                try {
                    const response = await fetch(`${this.config.API_BASE_URL}${url}`, {
                        ...options,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.currentUser?.token}`,
                            ...options.headers
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return await response.json();

                } catch (error) {
                    console.error(`API Call failed: ${url}`, error);
                    return this.getDemoApiResponse(url, options);
                }
            }

            getDemoApiResponse(url, options) {
                // Заглушки для API endpoints
                const demoResponses = {
                    '/api/user': { success: true, user: this.currentUser },
                    '/api/content': { success: true, data: this.allContent },
                    '/api/favorites': { success: true, favorites: this.state.favorites },
                    '/api/subscription/plans': { success: true, data: this.subscriptionPlans },
                    '/api/user/subscription': { success: true, data: this.userSubscription }
                };

                return demoResponses[url] || { success: false, error: 'API недоступно' };
            }

            // ==================== ДЕМО-ДАННЫЕ ====================

            createDemoUser() {
                this.currentUser = {
                    id: 898508164,
                    firstName: 'Александр',
                    lastName: 'Петров',
                    email: 'alexander@example.com',
                    phone: '+7 (999) 123-45-67',
                    isAdmin: true,
                    isSuperAdmin: true,
                    isVerified: true,
                    isPremium: true,
                    subscriptionEnd: new Date('2025-12-31').toISOString(),
                    hasActiveSubscription: true,
                    avatarUrl: null,
                    joinDate: new Date('2024-01-15').toISOString(),
                    token: 'demo-token-12345',
                    favorites: {
                        courses: [1, 3],
                        podcasts: [1],
                        streams: [1],
                        videos: [1, 2],
                        materials: [1],
                        events: [1]
                    }
                };
                
                this.isAdmin = true;
                this.isSuperAdmin = true;
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
                            video_url: '',
                            created_at: new Date().toISOString(),
                            instructors: [1, 2]
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
                            video_url: '',
                            created_at: new Date().toISOString(),
                            instructors: [1]
                        },
                        {
                            id: 3,
                            title: 'Основы физиотерапии',
                            description: '4 модуля по основам физиотерапии',
                            price: 15000,
                            discount: 10,
                            duration: '6 недель',
                            modules: 4,
                            category: 'Физиотерапия',
                            level: 'beginner',
                            students_count: 189,
                            rating: 4.7,
                            featured: false,
                            image_url: '/webapp/assets/course-default.jpg',
                            video_url: '',
                            created_at: new Date().toISOString(),
                            instructors: [2]
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
                            audio_url: '',
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 2,
                            title: 'АНБ FM: Реабилитация после инсульта',
                            description: 'Методики реабилитации пациентов',
                            duration: '38:15',
                            category: 'Реабилитация',
                            listens: 1876,
                            image_url: '/webapp/assets/podcast-default.jpg',
                            audio_url: '',
                            created_at: new Date().toISOString()
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
                            viewers: 89,
                            likes: 23,
                            thumbnail_url: '/webapp/assets/stream-default.jpg',
                            video_url: '',
                            scheduled_start: new Date(Date.now() + 3600000).toISOString(),
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 2,
                            title: 'Разбор клинического случая: боль в спине',
                            description: 'Детальный разбор диагностики и лечения',
                            duration: '1:45:30',
                            category: 'Неврология',
                            participants: 89,
                            is_live: false,
                            thumbnail_url: '/webapp/assets/stream-default.jpg',
                            video_url: '',
                            created_at: new Date().toISOString()
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
                            video_url: '',
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 2,
                            title: 'Тест мышечной силы',
                            description: 'Методика оценки мышечной силы',
                            duration: '6:45',
                            category: 'Диагностика',
                            views: 432,
                            thumbnail_url: '/webapp/assets/video-default.jpg',
                            video_url: '',
                            created_at: new Date().toISOString()
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
                            file_size: 1024 * 1024 * 2, // 2MB
                            image_url: '/webapp/assets/material-default.jpg',
                            file_url: '',
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 2,
                            title: 'Протокол лечения мигрени',
                            description: 'Стандартный протокол лечения мигрени',
                            category: 'Неврология',
                            material_type: 'protocol',
                            downloads: 187,
                            file_size: 1024 * 1024 * 1.5,
                            image_url: '/webapp/assets/material-default.jpg',
                            file_url: '',
                            created_at: new Date().toISOString()
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
                            registration_url: '',
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 2,
                            title: 'Онлайн-семинар по мануальной терапии',
                            description: 'Практический семинар с разбором техник',
                            event_type: 'online',
                            event_date: '2024-11-20T14:00:00.000Z',
                            location: 'Онлайн',
                            participants: 120,
                            image_url: '/webapp/assets/event-default.jpg',
                            registration_url: '',
                            created_at: new Date().toISOString()
                        }
                    ],
                    news: [
                        {
                            id: 1,
                            title: 'Новые методики в реабилитации пациентов с инсультом',
                            description: 'Обзор современных подходов к реабилитации',
                            content: 'Полный текст статьи...',
                            date: '15 дек 2024',
                            category: 'Реабилитация',
                            type: 'Статья',
                            image_url: '/webapp/assets/news-default.jpg',
                            created_at: new Date().toISOString()
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

            // ==================== УТИЛИТЫ ====================

            escapeHtml(text) {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            formatPrice(price) {
                return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' ₽';
            }

            formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            getLevelName(level) {
                const levels = {
                    'beginner': 'Начинающий',
                    'intermediate': 'Средний',
                    'advanced': 'Продвинутый'
                };
                return levels[level] || level;
            }

            getMaterialTypeIcon(type) {
                const icons = {
                    'checklist': '📋',
                    'protocol': '📄',
                    'guide': '📖',
                    'template': '📝',
                    'presentation': '📊',
                    'research': '🔬'
                };
                return icons[type] || '📎';
            }

            getMaterialTypeName(type) {
                const names = {
                    'checklist': 'Чек-лист',
                    'protocol': 'Протокол',
                    'guide': 'Руководство',
                    'template': 'Шаблон',
                    'presentation': 'Презентация',
                    'research': 'Исследование'
                };
                return names[type] || type;
            }

            getContentType(item) {
                if (item.modules !== undefined) return 'courses';
                if (item.duration && item.audio_url) return 'podcasts';
                if (item.video_url && !item.is_live) return 'videos';
                if (item.is_live !== undefined) return 'streams';
                if (item.material_type) return 'materials';
                if (item.event_type) return 'events';
                return 'unknown';
            }

            getContentTypeName(type) {
                const names = {
                    'courses': 'Курс',
                    'podcasts': 'Подкаст',
                    'videos': 'Видео',
                    'streams': 'Эфир',
                    'materials': 'Материал',
                    'events': 'Мероприятие'
                };
                return names[type] || type;
            }

            showNotification(message, type = 'info') {
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
                
                // Автоудаление через 5 секунд
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

            // ==================== БИЗНЕС-ЛОГИКА ====================

            async toggleFavorite(contentId, contentType, event = null) {
                if (event) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                
                try {
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
                        } else {
                            this.state.favorites[contentType] = this.state.favorites[contentType].filter(id => id !== contentId);
                            this.showNotification('💔 Удалено из избранного', 'info');
                        }
                        
                        this.updateFavoritesCount();
                        this.saveState();
                        
                        if (this.currentPage === 'favorites') {
                            this.renderPage('favorites');
                        }
                    }
                } catch (error) {
                    console.error('Ошибка переключения избранного:', error);
                    this.showNotification('❌ Ошибка обновления избранного', 'error');
                }
            }

            isFavorite(contentId, contentType) {
                return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
            }

            getTotalFavorites() {
                return Object.values(this.state.favorites).flat().length;
            }

            // ==================== НАВИГАЦИЯ И ФИЛЬТРАЦИЯ ====================

            updateActiveNav() {
                document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.page === this.currentPage) {
                        btn.classList.add('active');
                    }
                });
            }

            applyFilter(contentType, filterType, value) {
                this.filters[contentType][filterType] = value;
                this.renderPage(contentType);
            }

            applySearchFilter(contentType, value) {
                this.filters[contentType].search = value;
                this.renderPage(contentType);
            }

            getFilteredContent(contentType) {
                let content = this.allContent[contentType] || [];
                const filters = this.filters[contentType];

                // Поиск
                if (filters.search) {
                    const searchTerm = filters.search.toLowerCase();
                    content = content.filter(item => 
                        item.title.toLowerCase().includes(searchTerm) ||
                        item.description.toLowerCase().includes(searchTerm) ||
                        item.category.toLowerCase().includes(searchTerm)
                    );
                }

                // Фильтрация по категории
                if (filters.category !== 'all') {
                    content = content.filter(item => item.category === filters.category);
                }

                // Дополнительные фильтры для разных типов контента
                if (contentType === 'courses' && filters.level !== 'all') {
                    content = content.filter(item => item.level === filters.level);
                }

                if (contentType === 'materials' && filters.material_type !== 'all') {
                    content = content.filter(item => item.material_type === filters.material_type);
                }

                // Сортировка
                switch (filters.sort) {
                    case 'popular':
                        content.sort((a, b) => (b.views || b.students_count || b.downloads || 0) - (a.views || a.students_count || a.downloads || 0));
                        break;
                    case 'rating':
                        content.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                        break;
                    case 'price_low':
                        content.sort((a, b) => (a.price || 0) - (b.price || 0));
                        break;
                    case 'price_high':
                        content.sort((a, b) => (b.price || 0) - (a.price || 0));
                        break;
                    default: // newest
                        content.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                }

                return content;
            }

            // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

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

            handleSearchInput(value) {
                this.searchTerm = value;
            }

            handleSearchKeypress(event) {
                if (event.key === 'Enter') {
                    this.performSearch();
                }
            }

            performSearch() {
                if (this.searchTerm.trim()) {
                    this.renderPage('search');
                }
            }

            // ==================== ЗАГРУЗКА ДАННЫХ ====================

            loadNavigation() {
                this.navigationItems = [
                    { id: 1, title: 'Курсы', page: 'courses', icon: '📚' },
                    { id: 2, title: 'Подкасты', page: 'podcasts', icon: '🎧' },
                    { id: 3, title: 'Видео', page: 'videos', icon: '🎯' },
                    { id: 4, title: 'Материалы', page: 'materials', icon: '📋' },
                    { id: 5, title: 'Эфиры', page: 'streams', icon: '📹' },
                    { id: 6, title: 'Мероприятия', page: 'events', icon: '🗺️' }
                ];
            }

            loadSubscriptionData() {
                this.subscriptionPlans = [
                    {
                        id: 1,
                        name: 'Базовый',
                        description: 'Доступ к основным курсам',
                        price_monthly: 2900,
                        price_quarterly: 7500,
                        price_yearly: 27000,
                        features: JSON.stringify(['Доступ к 3 курсам', 'Базовые материалы', 'Поддержка по email'])
                    },
                    {
                        id: 2,
                        name: 'Профессиональный',
                        description: 'Полный доступ ко всем материалам',
                        price_monthly: 5900,
                        price_quarterly: 15000,
                        price_yearly: 54000,
                        features: JSON.stringify(['Все курсы', 'Все материалы', 'Приоритетная поддержка', 'Закрытые эфиры'])
                    },
                    {
                        id: 3,
                        name: 'Премиум',
                        description: 'Эксклюзивный доступ с персональным куратором',
                        price_monthly: 9900,
                        price_quarterly: 27000,
                        price_yearly: 99000,
                        features: JSON.stringify(['Все курсы и материалы', 'Персональный куратор', 'Индивидуальные консультации', 'Ранний доступ к новинкам'])
                    }
                ];

                this.userSubscription = {
                    plan_id: 2,
                    plan_name: 'Профессиональный',
                    plan_type: 'monthly',
                    price: 5900,
                    starts_at: new Date().toISOString(),
                    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };
            }

            loadInstructors() {
                this.instructors = [
                    {
                        id: 1,
                        name: 'Доктор Иванов А.В.',
                        specialization: 'Неврология, Мануальная терапия',
                        role: 'Ведущий специалист',
                        experience_years: 15,
                        bio: 'Ведущий специалист по мануальной терапии, автор методик лечения болей в спине. Опыт работы - 15 лет. Автор более 50 научных публикаций.',
                        avatar_url: '/webapp/assets/instructor1.jpg',
                        email: 'ivanov@anb.ru'
                    },
                    {
                        id: 2,
                        name: 'Профессор Петрова С.И.',
                        specialization: 'Реабилитология, Физиотерапия',
                        role: 'Главный реабилитолог',
                        experience_years: 20,
                        bio: 'Профессор, доктор медицинских наук. Специалист по реабилитации пациентов с неврологическими нарушениями. Автор инновационных методик восстановления.',
                        avatar_url: '/webapp/assets/instructor2.jpg',
                        email: 'petrova@anb.ru'
                    }
                ];
            }

            loadUserProgress() {
                this.state.progress = {
                    level: 'Понимаю',
                    experience: 1250,
                    completedCourses: 2,
                    completedModules: 8,
                    studyHours: 45,
                    weeklyHours: 5,
                    courses: {
                        1: 75,
                        2: 100
                    },
                    podcasts: {
                        1: true
                    },
                    videos: {
                        1: true,
                        2: true
                    },
                    streams: {
                        1: false
                    },
                    materials: {
                        1: true
                    },
                    events: {
                        1: { registered: true, attended: false }
                    }
                };
            }

            // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ ДАННЫХ ====================

            calculateHomeStats() {
                return {
                    courses: this.allContent.stats?.totalCourses || this.allContent.courses?.length || 0,
                    students: this.allContent.stats?.totalUsers || 1567,
                    experts: 25,
                    materials: this.allContent.materials?.length || 0
                };
            }

            getRecommendedCourses() {
                return this.allContent.courses?.filter(course => course.featured) || [];
            }

            getLiveStreams() {
                return this.allContent.streams?.filter(stream => stream.is_live) || [];
            }

            getUpcomingEvents() {
                return this.allContent.events?.filter(event => new Date(event.event_date) > new Date()) || [];
            }

            getContentCount(page) {
                const counts = {
                    'courses': this.allContent.courses?.length || 0,
                    'podcasts': this.allContent.podcasts?.length || 0,
                    'videos': this.allContent.videos?.length || 0,
                    'materials': this.allContent.materials?.length || 0,
                    'streams': this.allContent.streams?.length || 0,
                    'events': this.allContent.events?.length || 0
                };
                return counts[page] || 0;
            }

            updateAllCounters() {
                this.updateFavoritesCount();
                this.updateCartCount();
            }

            updateFavoritesCount() {
                const favoritesCount = document.getElementById('favoritesCount');
                if (favoritesCount) {
                    const totalFavorites = this.getTotalFavorites();
                    favoritesCount.textContent = totalFavorites;
                    favoritesCount.style.display = totalFavorites > 0 ? 'flex' : 'none';
                }
            }

            updateCartCount() {
                const cartCount = document.getElementById('cartCount');
                if (cartCount) {
                    const totalCart = this.state.cart.length;
                    cartCount.textContent = totalCart;
                    cartCount.style.display = totalCart > 0 ? 'flex' : 'none';
                }
            }

            // ==================== МЕТОДЫ ДЛЯ ОТКРЫТИЯ ДЕТАЛЕЙ ====================

            openCourseDetail(courseId) {
                this.currentSubPage = `course-${courseId}`;
                this.renderPage('courses', `course-${courseId}`);
            }

            openPodcastDetail(podcastId) {
                this.currentSubPage = `podcast-${podcastId}`;
                this.renderPage('podcasts', `podcast-${podcastId}`);
            }

            openVideoDetail(videoId) {
                this.currentSubPage = `video-${videoId}`;
                this.renderPage('videos', `video-${videoId}`);
            }

            openMaterialDetail(materialId) {
                this.currentSubPage = `material-${materialId}`;
                this.renderPage('materials', `material-${materialId}`);
            }

            openStreamDetail(streamId) {
                this.currentSubPage = `stream-${streamId}`;
                this.renderPage('streams', `stream-${streamId}`);
            }

            openEventDetail(eventId) {
                this.currentSubPage = `event-${eventId}`;
                this.renderPage('events', `event-${eventId}`);
            }

            // ==================== АКТИВИРОВАННЫЕ ФУНКЦИИ ====================

            // Система избранного
            clearAllFavorites() {
                if (confirm('Вы уверены, что хотите очистить все избранное?')) {
                    this.state.favorites = {
                        courses: [],
                        podcasts: [],
                        streams: [],
                        videos: [],
                        materials: [],
                        events: []
                    };
                    this.saveState();
                    this.updateFavoritesCount();
                    this.renderPage('favorites');
                    this.showNotification('Все избранное очищено', 'success');
                }
            }

            // Система корзины
            addToCart(itemId) {
                const item = this.allContent.courses?.find(c => c.id === itemId);
                if (item && !this.state.cart.find(i => i.id === itemId)) {
                    this.state.cart.push({...item, type: 'courses'});
                    this.saveState();
                    this.updateCartCount();
                    this.showNotification('Товар добавлен в корзину', 'success');
                }
            }

            removeFromCart(itemId) {
                this.state.cart = this.state.cart.filter(item => item.id !== itemId);
                this.saveState();
                this.updateCartCount();
                this.renderPage('cart');
                this.showNotification('Товар удален из корзины', 'info');
            }

            clearCart() {
                if (confirm('Очистить корзину?')) {
                    this.state.cart = [];
                    this.saveState();
                    this.updateCartCount();
                    this.renderPage('cart');
                    this.showNotification('Корзина очищена', 'success');
                }
            }

            calculateCartTotal() {
                let original = 0;
                let discount = 0;
                
                this.state.cart.forEach(item => {
                    original += item.price;
                    if (item.discount > 0) {
                        discount += item.price * (item.discount / 100);
                    }
                });
                
                return {
                    original,
                    discount,
                    final: original - discount
                };
            }

            checkout() {
                if (this.state.cart.length === 0) {
                    this.showNotification('Корзина пуста', 'warning');
                    return;
                }

                // Здесь должна быть интеграция с платежной системой
                this.showNotification('Переход к оплате...', 'info');
                // В реальном приложении здесь будет редирект на платежный шлюз
            }

            // Система поиска
            performGlobalSearch(term) {
                if (!term.trim()) {
                    return { total: 0, categories: {} };
                }

                const results = {
                    total: 0,
                    categories: {}
                };

                const searchTypes = ['courses', 'podcasts', 'videos', 'materials', 'streams', 'events'];
                const typeIcons = {
                    courses: '📚',
                    podcasts: '🎧',
                    videos: '🎯',
                    materials: '📋',
                    streams: '📹',
                    events: '🗺️'
                };

                searchTypes.forEach(type => {
                    const items = this.getFilteredContent(type).filter(item =>
                        item.title.toLowerCase().includes(term.toLowerCase()) ||
                        item.description.toLowerCase().includes(term.toLowerCase()) ||
                        item.category.toLowerCase().includes(term.toLowerCase())
                    );

                    if (items.length > 0) {
                        results.categories[type] = {
                            name: this.getContentTypeName(type),
                            icon: typeIcons[type],
                            items: items.slice(0, 5) // Ограничиваем количество результатов
                        };
                        results.total += items.length;
                    }
                });

                return results;
            }

            // Система профиля
            getProfileStatus() {
                const progress = this.state.progress;
                if (progress.experience >= 3000) return 'Эксперт Академии';
                if (progress.experience >= 1500) return 'Опытный практик';
                if (progress.experience >= 500) return 'Активный студент';
                return 'Новый участник';
            }

            calculateLearningStats() {
                return {
                    studyHours: this.state.progress.studyHours || 0,
                    weeklyHours: this.state.progress.weeklyHours || 0
                };
            }

            getUserAchievements() {
                const progress = this.state.progress;
                return [
                    {
                        title: 'Первый курс',
                        description: 'Завершите ваш первый курс',
                        icon: '🎯',
                        unlocked: progress.completedCourses > 0,
                        progress: progress.completedCourses > 0 ? 100 : 0
                    },
                    {
                        title: 'Усердный ученик',
                        description: 'Потратьте 10 часов на обучение',
                        icon: '⏱️',
                        unlocked: (progress.studyHours || 0) >= 10,
                        progress: Math.min(((progress.studyHours || 0) / 10) * 100, 100)
                    },
                    {
                        title: 'Коллекционер',
                        description: 'Добавьте 5 материалов в избранное',
                        icon: '❤️',
                        unlocked: this.getTotalFavorites() >= 5,
                        progress: Math.min((this.getTotalFavorites() / 5) * 100, 100)
                    }
                ];
            }

            // Система настроек
            changeLanguage(lang) {
                this.state.settings.language = lang;
                this.saveState();
                this.applySettings();
                this.showNotification(`Язык изменен на ${lang === 'ru' ? 'русский' : 'английский'}`, 'success');
            }

            changeTheme(theme) {
                this.state.settings.theme = theme;
                this.saveState();
                this.applySettings();
                this.showNotification(`Тема изменена`, 'success');
            }

            toggleSetting(setting, value) {
                this.state.settings[setting] = value;
                this.saveState();
                this.showNotification(`Настройка обновлена`, 'success');
            }

            // Админ-панель
            calculateAdminStats() {
                return {
                    totalUsers: this.allContent.stats?.totalUsers || 1567,
                    totalCourses: this.allContent.courses?.length || 0,
                    premiumUsers: 234,
                    revenue: 1250000
                };
            }

            // Воспроизведение медиа
            playPodcast(podcastId) {
                const podcast = this.allContent.podcasts?.find(p => p.id === podcastId);
                if (podcast) {
                    this.showNotification(`Воспроизведение: ${podcast.title}`, 'info');
                    // В реальном приложении здесь будет запуск аудиоплеера
                }
            }

            playVideo(videoId) {
                const video = this.allContent.videos?.find(v => v.id === videoId);
                if (video) {
                    this.showNotification(`Воспроизведение: ${video.title}`, 'info');
                    // В реальном приложении здесь будет запуск видеоплеера
                }
            }

            playStream(streamId) {
                const stream = this.allContent.streams?.find(s => s.id === streamId);
                if (stream) {
                    if (stream.is_live) {
                        this.showNotification(`Присоединение к LIVE: ${stream.title}`, 'info');
                    } else {
                        this.showNotification(`Воспроизведение: ${stream.title}`, 'info');
                    }
                    // В реальном приложении здесь будет запуск видеоплеера
                }
            }

            downloadMaterial(materialId) {
                const material = this.allContent.materials?.find(m => m.id === materialId);
                if (material) {
                    this.showNotification(`Скачивание: ${material.title}`, 'info');
                    // В реальном приложении здесь будет скачивание файла
                }
            }

            // Регистрация на события
            registerForEvent(eventId) {
                const event = this.allContent.events?.find(e => e.id === eventId);
                if (event) {
                    if (!this.state.progress.events) {
                        this.state.progress.events = {};
                    }
                    this.state.progress.events[eventId] = { registered: true, attended: false };
                    this.saveState();
                    this.showNotification(`Вы зарегистрированы на: ${event.title}`, 'success');
                    this.renderPage('events');
                }
            }

            cancelEventRegistration(eventId) {
                const event = this.allContent.events?.find(e => e.id === eventId);
                if (event && this.state.progress.events?.[eventId]?.registered) {
                    this.state.progress.events[eventId].registered = false;
                    this.saveState();
                    this.showNotification(`Регистрация отменена: ${event.title}`, 'info');
                    this.renderPage('events');
                }
            }

            addToCalendar(eventId) {
                const event = this.allContent.events?.find(e => e.id === eventId);
                if (event) {
                    this.showNotification(`Добавлено в календарь: ${event.title}`, 'success');
                    // В реальном приложении здесь будет интеграция с календарем
                }
            }

            // Обучение на курсах
            enrollCourse(courseId) {
                const course = this.allContent.courses?.find(c => c.id === courseId);
                if (course) {
                    if (!this.state.progress.courses) {
                        this.state.progress.courses = {};
                    }
                    this.state.progress.courses[courseId] = 0;
                    this.saveState();
                    this.showNotification(`Вы записаны на курс: ${course.title}`, 'success');
                    this.renderPage('courses', `course-${courseId}`);
                }
            }

            continueCourse(courseId) {
                this.showNotification(`Продолжение курса`, 'info');
                this.renderPage('courses', `course-${courseId}`);
            }

            // Вспомогательные методы для интерфейса
            createEmptyState(type, customMessage = '') {
                const messages = {
                    courses: 'Курсы не найдены',
                    podcasts: 'Подкасты не найдены',
                    videos: 'Видео не найдены',
                    materials: 'Материалы не найдены',
                    streams: 'Эфиры не найдены',
                    events: 'Мероприятия не найдены',
                    favorites: 'В избранном пока ничего нет'
                };

                const message = customMessage || messages[type] || 'Данные не найдены';

                return `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <div class="empty-title">${message}</div>
                        <div class="empty-description">Попробуйте изменить параметры поиска или фильтры</div>
                    </div>
                `;
            }

            createErrorPage(message) {
                return `
                    <div class="page error-page">
                        <div class="error-content">
                            <div class="error-icon">⚠️</div>
                            <h2>Ошибка</h2>
                            <p>${message}</p>
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                Перезагрузить
                            </button>
                        </div>
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

            createAccessDeniedPage() {
                return `
                    <div class="page access-denied-page">
                        <div class="access-denied-content">
                            <div class="access-denied-icon">🚫</div>
                            <h2>Доступ запрещен</h2>
                            <p>У вас недостаточно прав для просмотра этой страницы</p>
                            <button class="btn btn-primary" onclick="app.renderPage('home')">
                                Вернуться на главную
                            </button>
                        </div>
                    </div>
                `;
            }

            showFatalError(message) {
                const appElement = document.getElementById('app');
                if (appElement) {
                    appElement.innerHTML = this.createErrorPage(message);
                }
            }

            // Новости
            createNewsItems() {
                const news = this.allContent.news || [];
                return news.map(item => `
                    <div class="news-item">
                        <div class="news-image">
                            <img src="${item.image_url}" alt="${item.title}">
                        </div>
                        <div class="news-content">
                            <div class="news-category">${item.category}</div>
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                            <div class="news-meta">
                                <span>${item.date}</span>
                                <span>${item.type}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            filterNews(category) {
                this.currentNewsFilter = category;
                this.renderPage('home');
            }

            getUniqueCategories(contentType) {
                const content = this.allContent[contentType] || [];
                const categories = [...new Set(content.map(item => item.category))];
                return categories.filter(cat => cat);
            }

            resetFilters(contentType) {
                this.filters[contentType] = {
                    category: 'all',
                    level: 'all',
                    material_type: 'all',
                    sort: 'newest',
                    search: ''
                };
                this.renderPage(contentType);
            }

            applyStreamFilter(filterType, value) {
                // Фильтрация для стримов
                this.renderPage('streams');
            }

            applyEventFilter(filterType, value) {
                // Фильтрация для мероприятий
                this.renderPage('events');
            }

            switchFavoritesTab(tab) {
                // Переключение табов в избранном
                document.querySelectorAll('.favorites-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.favorites-tabs .tab-content').forEach(content => content.classList.remove('active'));
                
                event.target.classList.add('active');
                document.getElementById(`${tab}-tab`).classList.add('active');
            }

            switchSettingsTab(tab) {
                // Переключение табов в настройках
                document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.settings-tabs .tab-content').forEach(content => content.classList.remove('active'));
                
                event.target.classList.add('active');
                document.getElementById(`${tab}-tab`).classList.add('active');
            }

            switchAdminTab(tab) {
                // Переключение табов в админке
                document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.admin-tabs .tab-content').forEach(content => content.classList.remove('active'));
                
                event.target.classList.add('active');
                document.getElementById(`${tab}-tab`).classList.add('active');
            }

            focusSearch() {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            showSubscriptionModal() {
                this.showNotification('Открытие модального окна подписки', 'info');
                // В реальном приложении здесь будет модальное окно
            }
        }

        // Глобальная инициализация
        window.AcademyApp = AcademyApp;

        // Автоматическая инициализация при загрузке
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📱 DOM загружен, запуск приложения...');
            
            if (!window.app) {
                window.app = new AcademyApp();
                window.app.init().catch(error => {
                    console.error('❌ Ошибка инициализации приложения:', error);
                });
            }
        });

        // Глобальная обработка ошибок
        window.addEventListener('error', function(event) {
            console.error('🚨 Global error caught:', event.error);
        });

        window.addEventListener('unhandledrejection', function(event) {
            console.error('🚨 Unhandled promise rejection:', event.reason);
        });
    </script>
</body>
</html>
