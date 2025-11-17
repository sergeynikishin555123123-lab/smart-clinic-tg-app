// webapp/app.js - СОВРЕМЕННАЯ ВЕРСИЯ С РАБОЧИМИ ФУНКЦИЯМИ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isInitialized = false;
        
        this.state = {
            currentCourse: null,
            currentStream: null,
            currentMaterial: null,
            searchQuery: '',
            activeFilters: {},
            favorites: {
                courses: [],
                podcasts: [],
                streams: [],
                videos: [],
                materials: []
            },
            uploadProgress: 0
        };
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация Академии АНБ...');
        this.showSkeletonLoading();
        
        try {
            this.initTelegramWebApp();
            
            await Promise.all([
                this.loadUserData(),
                this.loadContent()
            ]);
            
            this.renderPage('home');
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Приложение полностью готово');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
        }
    }

    initTelegramWebApp() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.expand();
            Telegram.WebApp.BackButton.onClick(() => this.handleBackButton());
            Telegram.WebApp.MainButton.setText('Меню');
            Telegram.WebApp.MainButton.show();
            Telegram.WebApp.MainButton.onClick(() => this.showTelegramMenu());
        }
    }

    async loadUserData() {
        try {
            let userId = this.getUserId();
            
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    id: userId,
                    firstName: 'Пользователь',
                    username: 'user'
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            
            if (data.success && data.user) {
                this.currentUser = data.user;
                this.isAdmin = this.currentUser.isAdmin || false;
                this.isSuperAdmin = this.currentUser.isSuperAdmin || false;
                
                this.updateAdminBadge();
                this.state.favorites = this.currentUser.favorites || this.state.favorites;
                
                console.log('✅ Данные пользователя загружены:', this.currentUser.firstName);
            } else {
                throw new Error('Invalid user data response');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            this.createDemoUser();
        }
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
            email: 'demo@anb.ru',
            subscription: { 
                status: 'active', 
                type: 'premium',
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            },
            progress: {
                level: 'Понимаю',
                steps: {
                    materialsWatched: 12,
                    eventsParticipated: 5,
                    materialsSaved: 8,
                    coursesBought: 3,
                    modulesCompleted: 2,
                    offlineEvents: 1,
                    publications: 0
                },
                progress: {
                    understand: 9,
                    connect: 15,
                    apply: 8,
                    systematize: 3,
                    share: 0
                }
            },
            favorites: {
                courses: [1],
                podcasts: [1],
                streams: [1],
                videos: [1],
                materials: [1]
            },
            isAdmin: true,
            isSuperAdmin: true,
            joinedAt: new Date('2024-01-01').toISOString(),
            surveyCompleted: true
        };
        
        this.isAdmin = true;
        this.isSuperAdmin = true;
        this.updateAdminBadge();
        this.state.favorites = this.currentUser.favorites;
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.success) {
                this.allContent = data.data;
                console.log('✅ Контент загружен');
            } else {
                throw new Error('Failed to load content');
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
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
                    full_description: 'Комплексный курс по мануальным техникам для практикующих врачей.',
                    price: 15000,
                    duration: '12 часов',
                    modules: 6,
                    category: 'Мануальные техники',
                    level: 'advanced',
                    students_count: 45,
                    rating: 4.8,
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
                    listens: 234,
                    image_url: '/webapp/assets/podcast-default.jpg'
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'Разбор клинического случая',
                    description: 'Прямой эфир с разбором сложного случая',
                    duration: '1:30:00',
                    stream_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    live: true,
                    participants: 89,
                    type: 'analysis',
                    thumbnail_url: '/webapp/assets/stream-default.jpg'
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Шпаргалка: Неврологический осмотр',
                    description: 'Быстрый гайд по основным тестам',
                    duration: '15:30',
                    category: 'Неврология',
                    views: 456,
                    thumbnail_url: '/webapp/assets/video-default.jpg'
                }
            ],
            materials: [
                {
                    id: 1,
                    title: 'МРТ разбор: Рассеянный склероз',
                    description: 'Детальный разбор МРТ с клиническими случаями',
                    material_type: 'mri',
                    category: 'Неврология',
                    downloads: 123,
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
                    event_type: 'offline',
                    participants: 45,
                    image_url: '/webapp/assets/event-default.jpg'
                }
            ],
            promotions: [
                {
                    id: 1,
                    title: 'Скидка 20% на первую подписку',
                    description: 'Специальное предложение для новых пользователей',
                    discount: 20,
                    active: true,
                    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    image_url: '/webapp/assets/promo-default.jpg'
                }
            ],
            chats: [
                {
                    id: 1,
                    name: 'Общий чат Академии',
                    description: 'Основной чат для общения всех участников',
                    type: 'group',
                    participants_count: 156,
                    last_message: 'Добро пожаловать в Академию!',
                    image_url: '/webapp/assets/chat-default.jpg'
                }
            ]
        };
    }

    // Основные методы рендеринга
    renderPage(page, subPage = '') {
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
            promotions: this.createPromotionsPage(),
            community: this.createCommunityPage(),
            chats: subPage ? this.createChatDetailPage(subPage) : this.createChatsPage(),
            favorites: this.createFavoritesPage(),
            profile: this.createProfilePage(),
            admin: this.createAdminPage()
        };

        return pages[page] || this.createHomePage();
    }

    initializePage(page) {
        const initializers = {
            admin: () => this.initAdminPage(),
            courses: () => this.initCoursesPage(),
            profile: () => this.initProfilePage()
        };

        if (initializers[page]) {
            initializers[page]();
        }
    }

    // HOME PAGE
    createHomePage() {
        const stats = this.calculateHomeStats();
        
        return `
            <div class="page home-page">
                <div class="search-container">
                    <input type="text" 
                           placeholder="Поиск по курсам, материалам, эфирам..." 
                           class="search-input" 
                           id="searchInput"
                           value="${this.state.searchQuery}">
                </div>

                <div class="hero-section">
                    <div class="hero-background"></div>
                    <h2>Академия АНБ</h2>
                    <p>Современное образование для врачей</p>
                </div>

                <div class="quick-stats">
                    <div class="stat-item">
                        <div class="stat-value">${stats.courses}</div>
                        <div class="stat-label">Курсов</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.students}</div>
                        <div class="stat-label">Студентов</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.materials}</div>
                        <div class="stat-label">Материалов</div>
                    </div>
                </div>

                <div class="navigation-grid">
                    ${this.createNavCard('courses', '📚', 'Курсы', this.allContent.courses?.length || 0)}
                    ${this.createNavCard('podcasts', '🎧', 'АНБ FM', this.allContent.podcasts?.length || 0)}
                    ${this.createNavCard('streams', '📹', 'Эфиры', this.allContent.streams?.length || 0)}
                    ${this.createNavCard('videos', '🎯', 'Видео-шпаргалки', this.allContent.videos?.length || 0)}
                    ${this.createNavCard('materials', '📋', 'Материалы', this.allContent.materials?.length || 0)}
                    ${this.createNavCard('events', '🗺️', 'Мероприятия', this.allContent.events?.length || 0)}
                    ${this.createNavCard('promotions', '🎁', 'Акции', this.allContent.promotions?.length || 0)}
                    ${this.createNavCard('community', '👥', 'Сообщество', '')}
                </div>

                ${this.createRecentActivity()}
            </div>
        `;
    }

    createNavCard(section, icon, title, count) {
        return `
            <div class="nav-card" data-section="${section}">
                <div class="nav-icon">${icon}</div>
                <div class="nav-title">${title}</div>
                ${count ? `<div class="nav-badge">${count}</div>` : ''}
            </div>
        `;
    }

    calculateHomeStats() {
        return {
            courses: this.allContent.courses?.length || 0,
            students: this.allContent.courses?.reduce((sum, course) => sum + (course.students_count || 0), 0) || 0,
            materials: this.allContent.materials?.length || 0
        };
    }

    // COURSES PAGE
    createCoursesPage() {
        const courses = this.allContent.courses || [];
        const filteredCourses = this.filterContent(courses, 'courses');
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📚 Курсы</h2>
                    ${this.isAdmin ? `
                    <button class="btn btn-primary" onclick="app.showAddContentForm('courses')">
                        ➕ Добавить курс
                    </button>
                    ` : ''}
                </div>
                
                <div class="filter-tabs">
                    <button class="filter-btn ${!this.state.activeFilters.courses ? 'active' : ''}" 
                            onclick="app.filterContent('all', 'courses')">Все</button>
                    <button class="filter-btn ${this.state.activeFilters.courses === 'Неврология' ? 'active' : ''}" 
                            onclick="app.filterContent('Неврология', 'courses')">Неврология</button>
                    <button class="filter-btn ${this.state.activeFilters.courses === 'Мануальные техники' ? 'active' : ''}" 
                            onclick="app.filterContent('Мануальные техники', 'courses')">Мануальные техники</button>
                </div>
                
                <div class="content-grid">
                    ${filteredCourses.length > 0 ? filteredCourses.map(course => `
                        <div class="content-card" onclick="app.openCourseDetail(${course.id})">
                            <div class="card-image">
                                <img src="${course.image_url}" alt="${course.title}" 
                                     onerror="this.src='/webapp/assets/course-default.jpg'">
                                <div class="card-overlay">
                                    <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                            data-id="${course.id}" 
                                            data-type="courses"
                                            onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                        ${this.isFavorite(course.id, 'courses') ? '❤️' : '🤍'}
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
                                <div class="card-category">${course.category}</div>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-text">Курсы не найдены</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    // COURSE DETAIL PAGE
    createCourseDetailPage(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        if (!course) return this.createNotFoundPage('Курс не найден');

        return `
            <div class="page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.renderPage('courses')">← Назад</button>
                    <h2>${course.title}</h2>
                </div>
                
                <div class="detail-container">
                    <div class="detail-hero">
                        <img src="${course.image_url}" alt="${course.title}" 
                             onerror="this.src='/webapp/assets/course-default.jpg'">
                        <div class="detail-info">
                            <h1>${course.title}</h1>
                            <p class="detail-description">${course.full_description || course.description}</p>
                            
                            <div class="detail-stats">
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
                                    <div class="stat-value">${course.rating}</div>
                                    <div class="stat-label">Рейтинг</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="detail-content">
                        <h3>Программа курса</h3>
                        <div class="modules-list">
                            ${Array.from({length: course.modules}, (_, i) => `
                                <div class="module-item">
                                    <div class="module-number">${i + 1}</div>
                                    <div class="module-info">
                                        <div class="module-title">Модуль ${i + 1}</div>
                                        <div class="module-description">Содержание модуля будет доступно после покупки</div>
                                    </div>
                                    <div class="module-status">🔒</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="detail-actions">
                        <button class="btn btn-primary btn-large" onclick="app.purchaseCourse(${course.id})">
                            💳 Купить за ${this.formatPrice(course.price)}
                        </button>
                        <button class="btn btn-outline" onclick="app.toggleFavorite(${course.id}, 'courses')">
                            ${this.isFavorite(course.id, 'courses') ? '❤️ В избранном' : '🤍 В избранное'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // ADMIN PAGE
    createAdminPage() {
        if (!this.isAdmin && !this.isSuperAdmin) {
            return this.createAccessDeniedPage();
        }

        return `
            <div class="page admin-page">
                <div class="admin-header">
                    <h2>${this.isSuperAdmin ? '🛠️ Супер-админ' : '🔧 Админ'}</h2>
                    <div class="admin-stats">
                        <div class="admin-stat">
                            <div class="stat-value">${this.allContent.courses?.length || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                        <div class="admin-stat">
                            <div class="stat-value">${this.allContent.users || 156}</div>
                            <div class="stat-label">Пользователей</div>
                        </div>
                    </div>
                </div>

                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="content">📝 Контент</button>
                    <button class="admin-tab" data-tab="users">👥 Пользователи</button>
                    <button class="admin-tab" data-tab="analytics">📊 Аналитика</button>
                    ${this.isSuperAdmin ? '<button class="admin-tab" data-tab="system">⚙️ Система</button>' : ''}
                </div>

                <div class="admin-content">
                    <div id="adminContentTab" class="admin-tab-content active">
                        ${this.createAdminContentTab()}
                    </div>
                    <div id="adminUsersTab" class="admin-tab-content">
                        ${this.createAdminUsersTab()}
                    </div>
                    <div id="adminAnalyticsTab" class="admin-tab-content">
                        ${this.createAdminAnalyticsTab()}
                    </div>
                    ${this.isSuperAdmin ? `
                    <div id="adminSystemTab" class="admin-tab-content">
                        ${this.createAdminSystemTab()}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createAdminContentTab() {
        return `
            <div class="admin-section">
                <h3>Управление контентом</h3>
                <div class="content-type-selector">
                    <button class="content-type-btn active" data-type="courses">📚 Курсы</button>
                    <button class="content-type-btn" data-type="podcasts">🎧 Подкасты</button>
                    <button class="content-type-btn" data-type="streams">📹 Эфиры</button>
                    <button class="content-type-btn" data-type="videos">🎯 Видео</button>
                    <button class="content-type-btn" data-type="materials">📋 Материалы</button>
                </div>

                <div class="content-list-admin">
                    ${this.allContent.courses?.map(course => `
                        <div class="admin-content-item">
                            <img src="${course.image_url}" alt="${course.title}" 
                                 onerror="this.src='/webapp/assets/course-default.jpg'">
                            <div class="content-info">
                                <h4>${course.title}</h4>
                                <p>${course.description}</p>
                                <div class="content-meta">
                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                    <span>👥 ${course.students_count}</span>
                                    <span>⭐ ${course.rating}</span>
                                </div>
                            </div>
                            <div class="content-actions">
                                <button class="btn btn-small" onclick="app.editContent('courses', ${course.id})">✏️</button>
                                <button class="btn btn-small btn-danger" onclick="app.deleteContent('courses', ${course.id})">🗑️</button>
                            </div>
                        </div>
                    `).join('') || '<div class="empty-state">Нет контента</div>'}
                </div>

                <button class="btn btn-primary btn-large" onclick="app.showAddContentForm('courses')">
                    ➕ Добавить контент
                </button>
            </div>
        `;
    }

    // PROFILE PAGE
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
                        </div>
                    </div>
                    
                    <div class="subscription-badge ${subscription.status}">
                        ${subscription.status === 'active' ? '✅ Активная подписка' : '❌ Подписка не активна'}
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Статистика</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.coursesBought || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.materialsWatched || 0}</div>
                            <div class="stat-label">Материалов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.eventsParticipated || 0}</div>
                            <div class="stat-label">Мероприятий</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${Object.values(this.state.favorites).flat().length}</div>
                            <div class="stat-label">В избранном</div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.editProfile()">
                        ✏️ Редактировать профиль
                    </button>
                    <button class="btn btn-outline" onclick="app.manageSubscription()">
                        💳 Управление подпиской
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

    // Вспомогательные методы
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    isFavorite(contentId, contentType) {
        return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
    }

    async toggleFavorite(contentId, contentType) {
        try {
            const response = await fetch('/api/favorites/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    contentId: contentId,
                    contentType: contentType
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.state.favorites = data.favorites;
                this.showNotification('Избранное обновлено');
                this.renderPage(this.currentPage, this.currentSubPage);
            }
        } catch (error) {
            console.error('Ошибка обновления избранного:', error);
        }
    }

    filterContent(filter, type) {
        this.state.activeFilters[type] = filter === 'all' ? null : filter;
        this.renderPage(this.currentPage);
    }

    filterContent(items, type) {
        let filtered = items;
        
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            );
        }

        if (this.state.activeFilters[type]) {
            const filter = this.state.activeFilters[type];
            filtered = filtered.filter(item => item.category === filter);
        }

        return filtered;
    }

    // Навигация
    openCourseDetail(courseId) {
        this.renderPage('courses', courseId);
    }

    showAddContentForm(type) {
        this.showContentFormModal(type);
    }

    showContentFormModal(type) {
        const formHTML = this.getContentFormHTML(type);
        this.showModal(`Добавить ${this.getContentTypeName(type)}`, formHTML);
    }

    getContentFormHTML(type) {
        const fields = {
            courses: [
                { name: 'title', label: 'Название', type: 'text', required: true },
                { name: 'description', label: 'Описание', type: 'textarea', required: true },
                { name: 'price', label: 'Цена', type: 'number', required: true },
                { name: 'duration', label: 'Длительность', type: 'text', required: true },
                { name: 'modules', label: 'Количество модулей', type: 'number', required: true },
                { name: 'category', label: 'Категория', type: 'text', required: true }
            ],
            podcasts: [
                { name: 'title', label: 'Название', type: 'text', required: true },
                { name: 'description', label: 'Описание', type: 'textarea', required: true },
                { name: 'duration', label: 'Длительность', type: 'text', required: true },
                { name: 'category', label: 'Категория', type: 'text', required: true }
            ]
        };

        const typeFields = fields[type] || fields.courses;

        return `
            <form id="contentForm" enctype="multipart/form-data">
                <input type="hidden" name="userId" value="${this.currentUser.id}">
                <input type="hidden" name="type" value="${type}">
                
                ${typeFields.map(field => `
                    <div class="form-group">
                        <label>${field.label}</label>
                        ${field.type === 'textarea' ? 
                            `<textarea name="${field.name}" ${field.required ? 'required' : ''}></textarea>` :
                            `<input type="${field.type}" name="${field.name}" ${field.required ? 'required' : ''}>`
                        }
                    </div>
                `).join('')}
                
                <div class="form-group">
                    <label>Изображение</label>
                    <input type="file" name="image" accept="image/*">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="app.hideModal()">Отмена</button>
                    <button type="submit" class="btn btn-primary">Добавить</button>
                </div>
            </form>
        `;
    }

    getContentTypeName(type) {
        const names = {
            courses: 'курс',
            podcasts: 'подкаст',
            streams: 'эфир',
            videos: 'видео',
            materials: 'материал'
        };
        return names[type] || 'контент';
    }

    async submitContentForm(formData) {
        try {
            const response = await fetch('/api/admin/content/' + formData.get('type'), {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.showNotification('Контент успешно добавлен');
                this.hideModal();
                await this.loadContent();
                this.renderPage('admin');
            } else {
                throw new Error('Ошибка добавления контента');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showNotification('Ошибка при добавлении контента');
        }
    }

    // Модальные окна
    showModal(title, content) {
        const modalHTML = `
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="app.hideModal()">×</button>
                    </div>
                    <div class="modal-content">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Обработчик формы
        const form = document.getElementById('contentForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                this.submitContentForm(formData);
            };
        }
    }

    hideModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) modal.remove();
    }

    // Уведомления
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Ошибка</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="app.init()">Повторить</button>
                </div>
            `;
        }
    }

    showSkeletonLoading() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="skeleton-loading">
                <div class="skeleton-search"></div>
                <div class="skeleton-hero"></div>
                <div class="skeleton-nav-grid">
                    ${Array(8).fill(0).map(() => `<div class="skeleton-nav-card"></div>`).join('')}
                </div>
            </div>
        `;
    }

    createRecentActivity() {
        return `
            <div class="recent-activity">
                <h3>Последняя активность</h3>
                <div class="activity-list">
                    <div class="activity-item">
                        <div class="activity-icon">📚</div>
                        <div class="activity-info">
                            <div class="activity-title">Начат новый курс</div>
                            <div class="activity-time">2 часа назад</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon">🎧</div>
                        <div class="activity-info">
                            <div class="activity-title">Прослушан подкаст</div>
                            <div class="activity-time">Вчера</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createNotFoundPage(message) {
        return `
            <div class="error-state">
                <div class="error-icon">🔍</div>
                <h3>${message}</h3>
                <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
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

    setupEventListeners() {
        // Поиск
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.searchQuery = e.target.value;
                this.handleSearch();
            });
        }

        // Навигационные карточки
        document.addEventListener('click', (e) => {
            const navCard = e.target.closest('.nav-card');
            if (navCard) {
                const section = navCard.dataset.section;
                this.renderPage(section);
            }

            const navBtn = e.target.closest('.nav-btn');
            if (navBtn) {
                const page = navBtn.dataset.page;
                this.renderPage(page);
            }

            const adminTab = e.target.closest('.admin-tab');
            if (adminTab) {
                this.switchAdminTab(adminTab.dataset.tab);
            }
        });
    }

    handleSearch() {
        this.renderPage(this.currentPage);
    }

    switchAdminTab(tab) {
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `admin${tab.charAt(0).toUpperCase() + tab.slice(1)}Tab`);
        });
    }

    initAdminPage() {
        console.log('🔧 Инициализация админ-панели');
    }

    initCoursesPage() {
        console.log('📚 Инициализация страницы курсов');
    }

    initProfilePage() {
        console.log('👤 Инициализация профиля');
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

    showTelegramMenu() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: 'Быстрое меню',
                message: 'Выберите действие:',
                buttons: [
                    { id: 'profile', type: 'default', text: '👤 Профиль' },
                    { id: 'courses', type: 'default', text: '📚 Курсы' },
                    { id: 'support', type: 'default', text: '💬 Поддержка' },
                    { type: 'cancel', text: 'Закрыть' }
                ]
            }, (buttonId) => {
                if (buttonId === 'profile') this.renderPage('profile');
                if (buttonId === 'courses') this.renderPage('courses');
                if (buttonId === 'support') this.showSupport();
            });
        }
    }

    showSupport() {
        this.showNotification('💬 Поддержка: @academy_anb\n📧 academy@anb.ru');
    }

    purchaseCourse(courseId) {
        this.showNotification('💳 Функция покупки в разработке');
    }

    editProfile() {
        this.showNotification('✏️ Редактирование профиля в разработке');
    }

    manageSubscription() {
        this.showNotification('💳 Управление подпиской в разработке');
    }

    // Остальные методы для других страниц (podcasts, streams, etc.)
    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                    ${this.isAdmin ? `
                    <button class="btn btn-primary" onclick="app.showAddContentForm('podcasts')">
                        ➕ Добавить подкаст
                    </button>
                    ` : ''}
                </div>
                <div class="content-grid">
                    ${podcasts.map(podcast => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${podcast.image_url}" alt="${podcast.title}"
                                     onerror="this.src='/webapp/assets/podcast-default.jpg'">
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
                    <h2>📹 Эфиры и разборы</h2>
                </div>
                <div class="content-grid">
                    ${streams.map(stream => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${stream.thumbnail_url}" alt="${stream.title}"
                                     onerror="this.src='/webapp/assets/stream-default.jpg'">
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
                    <h2>🎯 Видео-шпаргалки</h2>
                </div>
                <div class="content-grid">
                    ${videos.map(video => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${video.thumbnail_url}" alt="${video.title}"
                                     onerror="this.src='/webapp/assets/video-default.jpg'">
                            </div>
                            <div class="card-content">
                                <h3>${video.title}</h3>
                                <p>${video.description}</p>
                                <div class="card-meta">
                                    <span>⏱️ ${video.duration}</span>
                                    <span>👁️ ${video.views}</span>
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
                    <h2>📋 Практические материалы</h2>
                </div>
                <div class="content-grid">
                    ${materials.map(material => `
                        <div class="content-card">
                            <div class="card-image">
                                <img src="${material.image_url}" alt="${material.title}"
                                     onerror="this.src='/webapp/assets/material-default.jpg'">
                            </div>
                            <div class="card-content">
                                <h3>${material.title}</h3>
                                <p>${material.description}</p>
                                <div class="card-meta">
                                    <span>📥 ${material.downloads}</span>
                                    <span>📄 ${material.material_type}</span>
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
                                <img src="${event.image_url}" alt="${event.title}"
                                     onerror="this.src='/webapp/assets/event-default.jpg'">
                            </div>
                            <div class="card-content">
                                <h3>${event.title}</h3>
                                <p>${event.description}</p>
                                <div class="card-meta">
                                    <span>📅 ${new Date(event.event_date).toLocaleDateString()}</span>
                                    <span>📍 ${event.location}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createPromotionsPage() {
        const promotions = this.allContent.promotions || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎁 Акции</h2>
                </div>
                <div class="content-grid">
                    ${promotions.map(promo => `
                        <div class="content-card promotion-card">
                            <div class="card-image">
                                <img src="${promo.image_url}" alt="${promo.title}"
                                     onerror="this.src='/webapp/assets/promo-default.jpg'">
                                <div class="discount-badge">-${promo.discount}%</div>
                            </div>
                            <div class="card-content">
                                <h3>${promo.title}</h3>
                                <p>${promo.description}</p>
                                <div class="card-meta">
                                    <span>⏰ До ${new Date(promo.end_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createCommunityPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>👥 Сообщество</h2>
                </div>
                <div class="community-grid">
                    <div class="community-card" onclick="app.renderPage('chats')">
                        <div class="community-icon">💬</div>
                        <div class="community-title">Чаты</div>
                        <div class="community-description">Общение с коллегами</div>
                    </div>
                    <div class="community-card" onclick="app.showSupport()">
                        <div class="community-icon">🆘</div>
                        <div class="community-title">Поддержка</div>
                        <div class="community-description">Помощь и консультации</div>
                    </div>
                </div>
            </div>
        `;
    }

    createChatsPage() {
        const chats = this.allContent.chats || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>💬 Чаты</h2>
                </div>
                <div class="chats-list">
                    ${chats.map(chat => `
                        <div class="chat-item">
                            <img src="${chat.image_url}" alt="${chat.name}"
                                 onerror="this.src='/webapp/assets/chat-default.jpg'">
                            <div class="chat-info">
                                <h4>${chat.name}</h4>
                                <p>${chat.description}</p>
                                <div class="chat-meta">
                                    <span>👥 ${chat.participants_count}</span>
                                    <span>💬 ${chat.last_message}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createChatDetailPage(chatId) {
        return `
            <div class="page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.renderPage('chats')">← Назад</button>
                    <h2>Чат</h2>
                </div>
                <div class="chat-detail">
                    <div class="chat-messages">
                        <div class="message received">
                            <div class="message-content">
                                <p>Добро пожаловать в чат!</p>
                                <span class="message-time">10:00</span>
                            </div>
                        </div>
                    </div>
                    <div class="chat-input">
                        <input type="text" placeholder="Введите сообщение...">
                        <button class="btn btn-primary">📤</button>
                    </div>
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
                <div class="content-grid">
                    ${favoriteCourses.map(course => `
                        <div class="content-card" onclick="app.openCourseDetail(${course.id})">
                            <div class="card-image">
                                <img src="${course.image_url}" alt="${course.title}">
                            </div>
                            <div class="card-content">
                                <h3>${course.title}</h3>
                                <p>${course.description}</p>
                            </div>
                        </div>
                    `).join('')}
                    ${favoriteCourses.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-icon">❤️</div>
                            <div class="empty-text">В избранном пока пусто</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createAdminUsersTab() {
        return `
            <div class="admin-section">
                <h3>👥 Пользователи</h3>
                <div class="users-list">
                    <div class="user-item">
                        <div class="user-avatar">👤</div>
                        <div class="user-info">
                            <h4>${this.currentUser.firstName}</h4>
                            <p>${this.currentUser.specialization || 'Невролог'}</p>
                            <div class="user-meta">
                                <span>📧 ${this.currentUser.email}</span>
                                <span>📍 ${this.currentUser.city}</span>
                            </div>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-small">👁️</button>
                            <button class="btn btn-small btn-primary">💬</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminAnalyticsTab() {
        return `
            <div class="admin-section">
                <h3>📊 Аналитика</h3>
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <div class="analytics-value">${this.allContent.courses?.length || 0}</div>
                        <div class="analytics-label">Всего курсов</div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-value">156</div>
                        <div class="analytics-label">Пользователей</div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-value">89%</div>
                        <div class="analytics-label">Активных</div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminSystemTab() {
        return `
            <div class="admin-section">
                <h3>⚙️ Система</h3>
                <div class="system-info">
                    <div class="info-item">
                        <span class="info-label">Версия:</span>
                        <span class="info-value">2.0.0</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Режим:</span>
                        <span class="info-value">Рабочий</span>
                    </div>
                </div>
                <div class="system-actions">
                    <button class="btn btn-danger" onclick="app.restartSystem()">🔄 Перезапуск</button>
                </div>
            </div>
        `;
    }

    restartSystem() {
        this.showNotification('🔄 Перезапуск системы...');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AcademyApp();
});

// Глобальные функции
window.toggleSearch = function() {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
    }
};
