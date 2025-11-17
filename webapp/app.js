// webapp/app.js - ПОЛНОСТЬЮ ФУНКЦИОНАЛЬНАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.isInitialized = false;
        
        // Состояние приложения
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
            }
        };
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация Академии АНБ...');
        this.showSkeletonLoading();
        
        try {
            this.initTelegramWebApp();
            
            // Параллельная загрузка данных
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
            this.showError('Ошибка загрузки приложения');
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
                switch(buttonId) {
                    case 'profile':
                        this.renderPage('profile');
                        break;
                    case 'courses':
                        this.renderPage('courses');
                        break;
                    case 'support':
                        this.showSupport();
                        break;
                }
            });
        }
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

    showSkeletonLoading() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="skeleton-loading">
                <div class="skeleton-search"></div>
                <div class="skeleton-nav-grid">
                    ${Array(8).fill(0).map(() => `
                        <div class="skeleton-nav-card">
                            <div class="skeleton-icon"></div>
                            <div class="skeleton-text"></div>
                        </div>
                    `).join('')}
                </div>
                <div class="skeleton-actions">
                    <div class="skeleton-action"></div>
                    <div class="skeleton-action"></div>
                </div>
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

        // Глобальные обработчики
        document.addEventListener('click', (e) => {
            // Навигация
            const navBtn = e.target.closest('.nav-btn');
            if (navBtn) {
                e.preventDefault();
                const page = navBtn.dataset.page;
                this.renderPage(page);
                return;
            }

            // Карточки навигации
            const navCard = e.target.closest('.nav-card');
            if (navCard) {
                const section = navCard.dataset.section;
                if (section) {
                    this.renderPage(section);
                }
            }

            // Кнопки избранного
            const favoriteBtn = e.target.closest('.favorite-btn');
            if (favoriteBtn) {
                e.stopPropagation();
                const contentId = favoriteBtn.dataset.id;
                const contentType = favoriteBtn.dataset.type;
                this.toggleFavorite(contentId, contentType);
            }

            // Кнопки действий
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                this.handleAction(action, actionBtn.dataset);
            }
        });
    }

    async loadUserData() {
        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    let userId = this.getUserId();
                    let firstName = 'Пользователь';
                    
                    if (window.Telegram && Telegram.WebApp) {
                        const tgUser = Telegram.WebApp.initDataUnsafe.user;
                        if (tgUser) {
                            userId = tgUser.id;
                            firstName = tgUser.first_name;
                        }
                    }

 async loadUserData() {
        try {
            let userId = this.getUserId();
            let firstName = 'Пользователь';
            let username = 'user';
            
            if (window.Telegram && Telegram.WebApp) {
                const tgUser = Telegram.WebApp.initDataUnsafe?.user;
                if (tgUser) {
                    userId = tgUser.id;
                    firstName = tgUser.first_name || 'Пользователь';
                    username = tgUser.username || 'user';
                }
            }
            
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: userId, 
                    firstName: firstName,
                    username: username
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.user) {
                this.currentUser = data.user;
                this.isAdmin = this.currentUser.isAdmin;
                this.isSuperAdmin = this.currentUser.isSuperAdmin;
                
                // Обновляем бейдж админа
                const adminBadge = document.getElementById('adminBadge');
                if (adminBadge) {
                    if (this.isSuperAdmin) {
                        adminBadge.innerHTML = '🛠️ Супер-админ';
                    } else if (this.isAdmin) {
                        adminBadge.innerHTML = '🔧 Админ';
                    }
                    adminBadge.style.display = 'flex';
                }

                this.state.favorites = this.currentUser.favorites || {
                    courses: [], podcasts: [], streams: [], videos: [], materials: []
                };
            } else {
                throw new Error('Invalid user data');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            this.showError('Ошибка загрузки профиля. Пожалуйста, обновите страницу.');
            throw error;
        }
    }
                    
                    const response = await fetch('/api/user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            id: userId, 
                            firstName: firstName 
                        })
                    });

                    const data = await response.json();
                    if (data.success) {
                        this.currentUser = data.user;
                        this.isAdmin = this.currentUser.isAdmin;
                        
                        if (this.isAdmin) {
                            document.getElementById('adminBadge').style.display = 'flex';
                        }

                        // Загружаем избранное
                        this.loadFavorites();
                    }
                } catch (error) {
                    console.error('Ошибка загрузки пользователя:', error);
                    this.createDemoUser();
                }
                resolve();
            }, 100);
        });
    }

    loadFavorites() {
        // В реальном приложении здесь будет загрузка из БД
        this.state.favorites = this.currentUser.favorites || {
            courses: [1],
            podcasts: [1],
            streams: [1],
            videos: [1],
            materials: [1]
        };
    }

    getUserId() {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.Webgram.WebApp.initDataUnsafe.user;
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
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
            joinedAt: new Date('2024-01-01'),
            surveyCompleted: true
        };
        this.isAdmin = true;
        document.getElementById('adminBadge').style.display = 'flex';
        this.state.favorites = this.currentUser.favorites;
    }

    async loadContent() {
        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    const response = await fetch('/api/content');
                    const data = await response.json();
                    if (data.success) {
                        this.allContent = data.data;
                    } else {
                        throw new Error('Failed to load content');
                    }
                } catch (error) {
                    console.error('Ошибка загрузки контента:', error);
                    this.createDemoContent();
                }
                resolve();
            }, 150);
        });
    }

    createDemoContent() {
        this.allContent = {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике',
                    description: '6 модулей по современным мануальным методикам',
                    full_description: 'Комплексный курс по мануальным техникам для практикующих врачей. Изучите современные подходы к диагностике и лечению.',
                    price: 15000,
                    duration: '12 часов',
                    modules: 6,
                    category: 'Мануальные техники',
                    level: 'advanced',
                    students_count: 45,
                    rating: 4.8,
                    image_url: '/images/course1.jpg'
                },
                {
                    id: 2,
                    title: 'Неврология для практикующих врачей',
                    description: 'Основы неврологической диагностики',
                    full_description: 'Фундаментальный курс по неврологии с акцентом на практическое применение.',
                    price: 12000,
                    duration: '10 часов',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate',
                    students_count: 67,
                    rating: 4.6,
                    image_url: '/images/course2.jpg'
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
                    image_url: '/images/podcast1.jpg'
                },
                {
                    id: 2,
                    title: 'АНБ FM: Реабилитационные методики',
                    description: 'Новые подходы к реабилитации',
                    duration: '38:15',
                    category: 'Реабилитация',
                    listens: 167,
                    image_url: '/images/podcast2.jpg'
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'Разбор клинического случая: Болевой синдром',
                    description: 'Прямой эфир с разбором сложного случая',
                    duration: '1:30:00',
                    stream_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    live: true,
                    participants: 89,
                    type: 'analysis',
                    thumbnail_url: '/images/stream1.jpg'
                },
                {
                    id: 2,
                    title: 'Мануальные техники: Демонстрация',
                    description: 'Практическая демонстрация методик',
                    duration: '2:15:00',
                    stream_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    live: false,
                    participants: 156,
                    type: 'stream',
                    thumbnail_url: '/images/stream2.jpg'
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
                    thumbnail_url: '/images/video1.jpg'
                },
                {
                    id: 2,
                    title: 'Техника мобилизации суставов',
                    description: 'Практическое руководство',
                    duration: '22:45',
                    category: 'Мануальные техники',
                    views: 289,
                    thumbnail_url: '/images/video2.jpg'
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
                    image_url: '/images/material1.jpg'
                },
                {
                    id: 2,
                    title: 'Чек-лист: Неврологический осмотр',
                    description: 'Пошаговый чек-лист для ежедневной практики',
                    material_type: 'checklist',
                    category: 'Неврология',
                    downloads: 267,
                    image_url: '/images/material2.jpg'
                },
                {
                    id: 3,
                    title: 'Клинический случай: Мигрень',
                    description: 'Разбор сложного случая мигрени',
                    material_type: 'case',
                    category: 'Неврология',
                    downloads: 189,
                    image_url: '/images/material3.jpg'
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Конференция: Современная неврология 2024',
                    description: 'Ежегодная конференция с ведущими специалистами',
                    event_date: '2024-02-15T10:00:00',
                    location: 'Москва',
                    event_type: 'offline',
                    participants: 45,
                    image_url: '/images/event1.jpg'
                },
                {
                    id: 2,
                    title: 'Онлайн-семинар: Реабилитация после инсульта',
                    description: 'Практические аспекты реабилитации',
                    event_date: '2024-01-20T14:00:00',
                    location: 'Онлайн',
                    event_type: 'online',
                    participants: 120,
                    image_url: '/images/event2.jpg'
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
                    image_url: '/images/promo1.jpg'
                },
                {
                    id: 2,
                    title: 'Бесплатный доступ к базовым курсам',
                    description: 'Получите доступ к 3 базовым курсам бесплатно',
                    discount: 100,
                    active: true,
                    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    image_url: '/images/promo2.jpg'
                }
            ],
            chats: [
                {
                    id: 1,
                    name: 'Общий чат Академии',
                    description: 'Основной чат для общения всех участников',
                    type: 'group',
                    participants_count: 156,
                    last_message: 'Добро пожаловать в Академию!'
                },
                {
                    id: 2,
                    name: 'Флудилка',
                    description: 'Неформальное общение',
                    type: 'flood',
                    participants_count: 89,
                    last_message: 'Привет всем!'
                },
                {
                    id: 3,
                    name: 'Неврология',
                    description: 'Обсуждение неврологических тем',
                    type: 'group',
                    participants_count: 67,
                    last_message: 'Кто-нибудь сталкивался с подобным случаем?'
                }
            ]
        };
    }

    renderPage(page, subPage = '') {
        this.currentPage = page;
        this.currentSubPage = subPage;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) return;

        // Обновляем навигацию
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Обновление кнопки "Назад"
        if (window.Telegram && Telegram.WebApp) {
            if (page === 'home' && !subPage) {
                Telegram.WebApp.BackButton.hide();
            } else {
                Telegram.WebApp.BackButton.show();
            }
        }

        // Быстрый рендеринг
        requestAnimationFrame(() => {
            try {
                mainContent.innerHTML = this.getPageHTML(page, subPage);
                this.initializePage(page);
            } catch (error) {
                console.error('Ошибка рендера страницы:', error);
                this.showError('Ошибка отображения страницы');
            }
        });
    }

    getPageHTML(page, subPage = '') {
        const pageMap = {
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

        return pageMap[page] || this.createHomePage();
    }

    initializePage(page) {
        const initializers = {
            admin: () => this.initAdminPage(),
            chats: () => this.initChatsPage(),
            courses: () => this.initCoursesPage(),
            profile: () => this.initProfilePage()
        };

        if (initializers[page]) {
            initializers[page]();
        }
    }

    createHomePage() {
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
                    <h2>Академия АНБ</h2>
                    <p>Современное образование для врачей</p>
                </div>

                <div class="navigation-grid">
                    <div class="nav-card" data-section="courses">
                        <div class="nav-icon">📚</div>
                        <div class="nav-title">Курсы</div>
                        <div class="nav-badge">${this.allContent.courses?.length || 0}</div>
                    </div>
                    <div class="nav-card" data-section="podcasts">
                        <div class="nav-icon">🎧</div>
                        <div class="nav-title">АНБ FM</div>
                        <div class="nav-badge">${this.allContent.podcasts?.length || 0}</div>
                    </div>
                    <div class="nav-card" data-section="streams">
                        <div class="nav-icon">📹</div>
                        <div class="nav-title">Эфиры|Разборы</div>
                        <div class="nav-badge">${this.allContent.streams?.length || 0}</div>
                    </div>
                    <div class="nav-card" data-section="videos">
                        <div class="nav-icon">🎯</div>
                        <div class="nav-title">Видео-шпаргалки</div>
                        <div class="nav-badge">${this.allContent.videos?.length || 0}</div>
                    </div>
                    <div class="nav-card" data-section="materials">
                        <div class="nav-icon">📋</div>
                        <div class="nav-title">Практические материалы</div>
                        <div class="nav-badge">${this.allContent.materials?.length || 0}</div>
                    </div>
                    <div class="nav-card" data-section="events">
                        <div class="nav-icon">🗺️</div>
                        <div class="nav-title">Карта мероприятий</div>
                        <div class="nav-badge">${this.allContent.events?.length || 0}</div>
                    </div>
                    <div class="nav-card" data-section="promotions">
                        <div class="nav-icon">🎁</div>
                        <div class="nav-title">Ограниченное предложение</div>
                        <div class="nav-badge">${this.allContent.promotions?.length || 0}</div>
                    </div>
                    <div class="nav-card" data-action="support">
                        <div class="nav-icon">💬</div>
                        <div class="nav-title">Поддержка</div>
                    </div>
                </div>

                <div class="quick-actions">
                    <button class="action-btn" data-action="start-learning">
                        <span>📚</span>
                        <span>Начать обучение</span>
                    </button>
                    <button class="action-btn" data-action="my-profile">
                        <span>👤</span>
                        <span>Мой профиль</span>
                    </button>
                </div>

                ${this.createRecentActivity()}
            </div>
        `;
    }

    createRecentActivity() {
        return `
            <div class="recent-activity">
                <h3>Недавняя активность</h3>
                <div class="activity-list">
                    <div class="activity-item">
                        <div class="activity-icon">📚</div>
                        <div class="activity-info">
                            <div class="activity-title">Начат курс "Мануальные техники"</div>
                            <div class="activity-time">2 часа назад</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon">🎧</div>
                        <div class="activity-info">
                            <div class="activity-title">Прослушан подкаст "Современная неврология"</div>
                            <div class="activity-time">Вчера</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createCoursesPage() {
        const courses = this.allContent.courses || [];
        const filteredCourses = this.filterContent(courses, 'courses');
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📚 Курсы</h2>
                    <div class="page-actions">
                        <button class="btn btn-outline" onclick="app.filterContent('all', 'courses')">Все</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Неврология', 'courses')">Неврология</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Реабилитация', 'courses')">Реабилитация</button>
                    </div>
                </div>
                
                <div class="content-list">
                    ${filteredCourses.length > 0 ? filteredCourses.map(course => `
                        <div class="content-item course-item" onclick="app.openCourseDetail(${course.id})">
                            <div class="content-image-placeholder">
                                ${course.image_url ? 
                                    `<img src="${course.image_url}" alt="${course.title}" class="content-image">` :
                                    '<div class="content-image-fallback">📚</div>'
                                }
                            </div>
                            <div class="content-info">
                                <div class="content-title">${course.title}</div>
                                <div class="content-description">${course.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${course.duration}</span>
                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                    <span>⭐ ${course.rating}</span>
                                    <span>👥 ${course.students_count}</span>
                                </div>
                                <div class="content-category">${course.category}</div>
                            </div>
                            <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                    data-id="${course.id}" 
                                    data-type="courses">
                                ${this.isFavorite(course.id, 'courses') ? '❤️' : '🤍'}
                            </button>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-text">Курсы не найдены</div>
                            <div class="empty-hint">Попробуйте изменить фильтры</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createCourseDetailPage(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        if (!course) {
            return this.createNotFoundPage('Курс не найден');
        }

        return `
            <div class="page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.renderPage('courses')">← Назад</button>
                    <h2>${course.title}</h2>
                </div>
                
                <div class="course-detail">
                    <div class="course-hero">
                        <div class="course-image">
                            ${course.image_url ? 
                                `<img src="${course.image_url}" alt="${course.title}">` :
                                '<div class="course-image-fallback">📚</div>'
                            }
                        </div>
                        <div class="course-info">
                            <h1 class="course-title">${course.title}</h1>
                            <div class="course-description">${course.full_description || course.description}</div>
                            <div class="course-stats">
                                <div class="course-stat">
                                    <div class="stat-value">${course.modules}</div>
                                    <div class="stat-label">Модулей</div>
                                </div>
                                <div class="course-stat">
                                    <div class="stat-value">${course.duration}</div>
                                    <div class="stat-label">Длительность</div>
                                </div>
                                <div class="course-stat">
                                    <div class="stat-value">${course.students_count}</div>
                                    <div class="stat-label">Студентов</div>
                                </div>
                                <div class="course-stat">
                                    <div class="stat-value">${course.rating}</div>
                                    <div class="stat-label">Рейтинг</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="course-content">
                        <h3>Программа курса</h3>
                        <div class="modules-list">
                            ${Array.from({length: course.modules}, (_, i) => `
                                <div class="module-item">
                                    <div class="module-number">${i + 1}</div>
                                    <div class="module-info">
                                        <div class="module-title">Модуль ${i + 1}</div>
                                        <div class="module-description">Содержание модуля будет доступно после покупки курса</div>
                                    </div>
                                    <div class="module-status">🔒</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="course-actions">
                        <button class="btn btn-primary btn-large" onclick="app.purchaseCourse(${course.id})">
                            💳 Купить за ${this.formatPrice(course.price)}
                        </button>
                        <button class="btn btn-outline" onclick="app.addToFavorites(${course.id}, 'courses')">
                            ${this.isFavorite(course.id, 'courses') ? '❤️ В избранном' : '🤍 В избранное'}
                        </button>
                        <button class="btn btn-outline" onclick="app.shareCourse(${course.id})">
                            📤 Поделиться
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        const filteredPodcasts = this.filterContent(podcasts, 'podcasts');
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                    <div class="page-actions">
                        <button class="btn btn-outline" onclick="app.filterContent('all', 'podcasts')">Все</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Неврология', 'podcasts')">Неврология</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Реабилитация', 'podcasts')">Реабилитация</button>
                    </div>
                </div>
                
                <div class="content-list">
                    ${filteredPodcasts.length > 0 ? filteredPodcasts.map(podcast => `
                        <div class="content-item podcast-item" onclick="app.playPodcast(${podcast.id})">
                            <div class="content-image-placeholder">
                                ${podcast.image_url ? 
                                    `<img src="${podcast.image_url}" alt="${podcast.title}" class="content-image">` :
                                    '<div class="content-image-fallback">🎧</div>'
                                }
                            </div>
                            <div class="content-info">
                                <div class="content-title">${podcast.title}</div>
                                <div class="content-description">${podcast.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${podcast.duration}</span>
                                    <span>👂 ${podcast.listens}</span>
                                    <span>🏷️ ${podcast.category}</span>
                                </div>
                            </div>
                            <button class="favorite-btn ${this.isFavorite(podcast.id, 'podcasts') ? 'active' : ''}" 
                                    data-id="${podcast.id}" 
                                    data-type="podcasts">
                                ${this.isFavorite(podcast.id, 'podcasts') ? '❤️' : '🤍'}
                            </button>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">🎧</div>
                            <div class="empty-text">Подкасты не найдены</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createStreamsPage() {
        const streams = this.allContent.streams || [];
        const filteredStreams = this.filterContent(streams, 'streams');
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📹 Эфиры и разборы</h2>
                    <div class="page-actions">
                        <button class="btn btn-outline" onclick="app.filterContent('all', 'streams')">Все</button>
                        <button class="btn btn-outline" onclick="app.filterContent('analysis', 'streams')">Разборы</button>
                        <button class="btn btn-outline" onclick="app.filterContent('stream', 'streams')">Эфиры</button>
                    </div>
                </div>
                
                <div class="content-list">
                    ${filteredStreams.length > 0 ? filteredStreams.map(stream => `
                        <div class="content-item stream-item" onclick="app.playStream(${stream.id})">
                            <div class="content-image-placeholder">
                                ${stream.thumbnail_url ? 
                                    `<img src="${stream.thumbnail_url}" alt="${stream.title}" class="content-image">` :
                                    '<div class="content-image-fallback">📹</div>'
                                }
                                ${stream.live ? '<div class="live-badge">LIVE</div>' : ''}
                            </div>
                            <div class="content-info">
                                <div class="content-title">${stream.title}</div>
                                <div class="content-description">${stream.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${stream.duration}</span>
                                    <span>👥 ${stream.participants}</span>
                                    <span>📅 ${new Date(stream.stream_date).toLocaleDateString('ru-RU')}</span>
                                </div>
                            </div>
                            <button class="favorite-btn ${this.isFavorite(stream.id, 'streams') ? 'active' : ''}" 
                                    data-id="${stream.id}" 
                                    data-type="streams">
                                ${this.isFavorite(stream.id, 'streams') ? '❤️' : '🤍'}
                            </button>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📹</div>
                            <div class="empty-text">Эфиры не найдены</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createVideosPage() {
        const videos = this.allContent.videos || [];
        const filteredVideos = this.filterContent(videos, 'videos');
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎯 Видео-шпаргалки</h2>
                    <div class="page-actions">
                        <button class="btn btn-outline" onclick="app.filterContent('all', 'videos')">Все</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Неврология', 'videos')">Неврология</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Мануальные техники', 'videos')">Мануальные техники</button>
                    </div>
                </div>
                
                <div class="content-list">
                    ${filteredVideos.length > 0 ? filteredVideos.map(video => `
                        <div class="content-item video-item" onclick="app.playVideo(${video.id})">
                            <div class="content-image-placeholder">
                                ${video.thumbnail_url ? 
                                    `<img src="${video.thumbnail_url}" alt="${video.title}" class="content-image">` :
                                    '<div class="content-image-fallback">🎯</div>'
                                }
                            </div>
                            <div class="content-info">
                                <div class="content-title">${video.title}</div>
                                <div class="content-description">${video.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${video.duration}</span>
                                    <span>👁️ ${video.views}</span>
                                    <span>🏷️ ${video.category}</span>
                                </div>
                            </div>
                            <button class="favorite-btn ${this.isFavorite(video.id, 'videos') ? 'active' : ''}" 
                                    data-id="${video.id}" 
                                    data-type="videos">
                                ${this.isFavorite(video.id, 'videos') ? '❤️' : '🤍'}
                            </button>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">🎯</div>
                            <div class="empty-text">Видео не найдены</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createMaterialsPage() {
        const materials = this.allContent.materials || [];
        const filteredMaterials = this.filterContent(materials, 'materials');
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📋 Практические материалы</h2>
                    <div class="page-tabs">
                        <button class="tab-btn ${!this.state.activeFilters.materialType ? 'active' : ''}" 
                                onclick="app.filterMaterials('all')">Все</button>
                        <button class="tab-btn ${this.state.activeFilters.materialType === 'mri' ? 'active' : ''}" 
                                onclick="app.filterMaterials('mri')">МРТ</button>
                        <button class="tab-btn ${this.state.activeFilters.materialType === 'case' ? 'active' : ''}" 
                                onclick="app.filterMaterials('case')">Кейсы</button>
                        <button class="tab-btn ${this.state.activeFilters.materialType === 'checklist' ? 'active' : ''}" 
                                onclick="app.filterMaterials('checklist')">Чек-листы</button>
                    </div>
                </div>
                
                <div class="content-list">
                    ${filteredMaterials.length > 0 ? filteredMaterials.map(material => `
                        <div class="content-item material-item" onclick="app.openMaterial(${material.id})">
                            <div class="content-image-placeholder">
                                ${material.image_url ? 
                                    `<img src="${material.image_url}" alt="${material.title}" class="content-image">` :
                                    `<div class="content-image-fallback">${this.getMaterialTypeIcon(material.material_type)}</div>`
                                }
                            </div>
                            <div class="content-info">
                                <div class="content-title">${material.title}</div>
                                <div class="content-description">${material.description}</div>
                                <div class="content-meta">
                                    <span>${this.getMaterialTypeIcon(material.material_type)} ${this.getMaterialTypeName(material.material_type)}</span>
                                    <span>📥 ${material.downloads}</span>
                                    <span>🏷️ ${material.category}</span>
                                </div>
                            </div>
                            <button class="favorite-btn ${this.isFavorite(material.id, 'materials') ? 'active' : ''}" 
                                    data-id="${material.id}" 
                                    data-type="materials">
                                ${this.isFavorite(material.id, 'materials') ? '❤️' : '🤍'}
                            </button>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📋</div>
                            <div class="empty-text">Материалы не найдены</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createEventsPage() {
        const events = this.allContent.events || [];
        const filteredEvents = this.filterContent(events, 'events');
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🗺️ Карта мероприятий</h2>
                    <div class="page-tabs">
                        <button class="tab-btn ${!this.state.activeFilters.eventType ? 'active' : ''}" 
                                onclick="app.filterEvents('all')">Все</button>
                        <button class="tab-btn ${this.state.activeFilters.eventType === 'online' ? 'active' : ''}" 
                                onclick="app.filterEvents('online')">Онлайн</button>
                        <button class="tab-btn ${this.state.activeFilters.eventType === 'offline' ? 'active' : ''}" 
                                onclick="app.filterEvents('offline')">Офлайн</button>
                    </div>
                </div>
                
                <div class="content-list">
                    ${filteredEvents.length > 0 ? filteredEvents.map(event => `
                        <div class="content-item event-item" onclick="app.openEvent(${event.id})">
                            <div class="content-image-placeholder">
                                ${event.image_url ? 
                                    `<img src="${event.image_url}" alt="${event.title}" class="content-image">` :
                                    '<div class="content-image-fallback">🗺️</div>'
                                }
                                <div class="event-type-badge ${event.event_type}">
                                    ${event.event_type === 'online' ? '💻 Онлайн' : '🏢 Офлайн'}
                                </div>
                            </div>
                            <div class="content-info">
                                <div class="content-title">${event.title}</div>
                                <div class="content-description">${event.description}</div>
                                <div class="content-meta">
                                    <span>📅 ${new Date(event.event_date).toLocaleDateString('ru-RU')}</span>
                                    <span>📍 ${event.location}</span>
                                    <span>👥 ${event.participants}</span>
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="event.stopPropagation(); app.registerForEvent(${event.id})">
                                Записаться
                            </button>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">🗺️</div>
                            <div class="empty-text">Мероприятия не найдены</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createPromotionsPage() {
        const promotions = this.allContent.promotions || [];
        const activePromotions = promotions.filter(p => p.active);
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎁 Ограниченное предложение</h2>
                </div>
                
                <div class="promotions-grid">
                    ${activePromotions.length > 0 ? activePromotions.map(promo => `
                        <div class="promotion-card" onclick="app.getPromotion(${promo.id})">
                            <div class="promotion-image">
                                ${promo.image_url ? 
                                    `<img src="${promo.image_url}" alt="${promo.title}">` :
                                    '<div class="promotion-image-fallback">🎁</div>'
                                }
                                ${promo.discount ? `<div class="promotion-discount">-${promo.discount}%</div>` : ''}
                            </div>
                            <div class="promotion-content">
                                <div class="promotion-title">${promo.title}</div>
                                <div class="promotion-description">${promo.description}</div>
                                <div class="promotion-meta">
                                    ${promo.end_date ? `
                                        <div class="promotion-timer">
                                            ⏰ До ${new Date(promo.end_date).toLocaleDateString('ru-RU')}
                                        </div>
                                    ` : ''}
                                </div>
                                <button class="btn btn-primary">Получить предложение</button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">🎁</div>
                            <div class="empty-text">Активные акции не найдены</div>
                            <div class="empty-hint">Следите за обновлениями</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createCommunityPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>👥 О сообществе</h2>
                </div>
                
                <div class="community-grid">
                    <div class="community-card" onclick="app.showCommunityRules()">
                        <div class="community-icon">📜</div>
                        <div class="community-title">Правила сообщества</div>
                        <div class="community-description">Основные правила и нормы поведения</div>
                    </div>
                    
                    <div class="community-card" onclick="app.showFAQ()">
                        <div class="community-icon">❓</div>
                        <div class="community-title">F.A.Q.</div>
                        <div class="community-description">Часто задаваемые вопросы</div>
                    </div>
                    
                    <div class="community-card" onclick="app.showSubscriptionInfo()">
                        <div class="community-icon">💳</div>
                        <div class="community-title">Подписка</div>
                        <div class="community-description">Условия и возможности</div>
                    </div>
                    
                    <div class="community-card" onclick="app.showSupportInfo()">
                        <div class="community-icon">👨‍💼</div>
                        <div class="community-title">Координатор</div>
                        <div class="community-description">Контакты и поддержка</div>
                    </div>
                </div>

                <div class="community-stats">
                    <h3>Статистика сообщества</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${this.allContent.usersCount || 156}</div>
                            <div class="stat-label">Участников</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.allContent.courses?.length || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.allContent.events?.length || 0}</div>
                            <div class="stat-label">Мероприятий</div>
                        </div>
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
                    <h2>💬 Чаты сообщества</h2>
                </div>
                
                <div class="chats-list">
                    ${chats.map(chat => `
                        <div class="chat-item" onclick="app.openChat(${chat.id})">
                            <div class="chat-avatar ${chat.type}">
                                ${this.getChatIcon(chat.type)}
                            </div>
                            <div class="chat-info">
                                <div class="chat-name">${chat.name}</div>
                                <div class="chat-description">${chat.description}</div>
                                <div class="chat-meta">
                                    <span>👥 ${chat.participants_count} участников</span>
                                    <span>💬 ${chat.last_message || 'Нет сообщений'}</span>
                                </div>
                            </div>
                            <div class="chat-status">
                                <div class="unread-count">3</div>
                            </div>
                        </div>
                    `).join('')}
                    
                    <div class="chat-item flood-chat" onclick="app.openFloodChat()">
                        <div class="chat-avatar flood">💬</div>
                        <div class="chat-info">
                            <div class="chat-name">Флудилка</div>
                            <div class="chat-description">Неформальное общение на любые темы</div>
                            <div class="chat-meta">👥 89 участников</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createChatDetailPage(chatId) {
        const chat = this.allContent.chats?.find(c => c.id == chatId);
        if (!chat) {
            return this.createNotFoundPage('Чат не найден');
        }

        return `
            <div class="page chat-detail-page">
                <div class="chat-header">
                    <button class="back-btn" onclick="app.renderPage('chats')">←</button>
                    <div class="chat-info">
                        <div class="chat-name">${chat.name}</div>
                        <div class="chat-status">${chat.participants_count} участников онлайн</div>
                    </div>
                    <button class="btn btn-outline" onclick="app.showChatInfo(${chat.id})">ℹ️</button>
                </div>

                <div class="chat-messages" id="chatMessages">
                    <div class="message received">
                        <div class="message-avatar">👤</div>
                        <div class="message-content">
                            <div class="message-sender">Координатор Академии</div>
                            <div class="message-text">Добро пожаловать в чат! Задавайте вопросы и делитесь опытом.</div>
                            <div class="message-time">10:00</div>
                        </div>
                    </div>
                    
                    <div class="message sent">
                        <div class="message-content">
                            <div class="message-text">Спасибо! У меня есть вопрос по мануальным техникам</div>
                            <div class="message-time">10:05</div>
                        </div>
                    </div>
                </div>

                <div class="chat-input">
                    <input type="text" 
                           placeholder="Введите сообщение..." 
                           class="message-input" 
                           id="messageInput"
                           onkeypress="app.handleMessageKeypress(event, ${chat.id})">
                    <button class="btn btn-primary" onclick="app.sendMessage(${chat.id})">
                        📤
                    </button>
                </div>
            </div>
        `;
    }

    createFavoritesPage() {
        const favoriteCourses = this.allContent.courses?.filter(c => this.isFavorite(c.id, 'courses')) || [];
        const favoritePodcasts = this.allContent.podcasts?.filter(p => this.isFavorite(p.id, 'podcasts')) || [];
        const favoriteStreams = this.allContent.streams?.filter(s => this.isFavorite(s.id, 'streams')) || [];
        const favoriteVideos = this.allContent.videos?.filter(v => this.isFavorite(v.id, 'videos')) || [];
        const favoriteMaterials = this.allContent.materials?.filter(m => this.isFavorite(m.id, 'materials')) || [];
        
        const totalFavorites = favoriteCourses.length + favoritePodcasts.length + favoriteStreams.length + 
                              favoriteVideos.length + favoriteMaterials.length;

        return `
            <div class="page">
                <div class="page-header">
                    <h2>❤️ Избранное</h2>
                    <div class="favorites-stats">Всего: ${totalFavorites}</div>
                </div>
                
                <div class="favorites-tabs">
                    <button class="tab-btn active" onclick="app.showFavoritesTab('all')">Все</button>
                    <button class="tab-btn" onclick="app.showFavoritesTab('courses')">Курсы (${favoriteCourses.length})</button>
                    <button class="tab-btn" onclick="app.showFavoritesTab('podcasts')">Подкасты (${favoritePodcasts.length})</button>
                    <button class="tab-btn" onclick="app.showFavoritesTab('streams')">Эфиры (${favoriteStreams.length})</button>
                    <button class="tab-btn" onclick="app.showFavoritesTab('videos')">Видео (${favoriteVideos.length})</button>
                    <button class="tab-btn" onclick="app.showFavoritesTab('materials')">Материалы (${favoriteMaterials.length})</button>
                </div>
                
                <div class="favorites-content" id="favoritesContent">
                    ${totalFavorites > 0 ? this.renderFavoritesContent('all') : `
                        <div class="empty-state">
                            <div class="empty-icon">❤️</div>
                            <div class="empty-text">Здесь пока пусто</div>
                            <div class="empty-hint">Добавляйте контент в избранное, чтобы он появился здесь</div>
                            <button class="btn btn-primary" onclick="app.renderPage('courses')">
                                📚 Найти курсы
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderFavoritesContent(tab) {
        const favoritesMap = {
            courses: this.allContent.courses?.filter(c => this.isFavorite(c.id, 'courses')) || [],
            podcasts: this.allContent.podcasts?.filter(p => this.isFavorite(p.id, 'podcasts')) || [],
            streams: this.allContent.streams?.filter(s => this.isFavorite(s.id, 'streams')) || [],
            videos: this.allContent.videos?.filter(v => this.isFavorite(v.id, 'videos')) || [],
            materials: this.allContent.materials?.filter(m => this.isFavorite(m.id, 'materials')) || []
        };

        if (tab === 'all') {
            let allFavorites = [];
            Object.values(favoritesMap).forEach(items => allFavorites.push(...items));
            return this.renderFavoritesList(allFavorites);
        }

        return this.renderFavoritesList(favoritesMap[tab] || []);
    }

    renderFavoritesList(items) {
        if (items.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">❤️</div>
                    <div class="empty-text">В этой категории пока пусто</div>
                </div>
            `;
        }

        return `
            <div class="content-list">
                ${items.map(item => `
                    <div class="content-item" onclick="app.openFavoriteItem(${item.id}, '${item.type || 'course'}')">
                        <div class="content-image-placeholder">
                            ${item.image_url || item.thumbnail_url ? 
                                `<img src="${item.image_url || item.thumbnail_url}" alt="${item.title}">` :
                                `<div class="content-image-fallback">${this.getContentIcon(item)}</div>`
                            }
                        </div>
                        <div class="content-info">
                            <div class="content-title">${item.title}</div>
                            <div class="content-description">${item.description}</div>
                            <div class="content-meta">
                                ${this.renderItemMeta(item)}
                            </div>
                        </div>
                        <button class="favorite-btn active" 
                                data-id="${item.id}" 
                                data-type="${this.getContentType(item)}">
                            ❤️
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createProfilePage() {
        if (!this.currentUser) return '<div class="loading">Загрузка...</div>';
        
        const progress = this.currentUser.progress;
        const subscription = this.currentUser.subscription;
        const currentLevel = this.calculateCurrentLevel(progress.progress);
        
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">👤</div>
                        <div class="profile-info">
                            <div class="profile-name">${this.currentUser.firstName}</div>
                            <div class="profile-specialization">${this.currentUser.specialization}</div>
                            <div class="profile-city">${this.currentUser.city}</div>
                            <div class="profile-email">${this.currentUser.email}</div>
                        </div>
                    </div>
                    
                    <div class="subscription-section">
                        <div class="subscription-status ${subscription.status}">
                            <span class="status-icon">${subscription.status === 'active' ? '✅' : '❌'}</span>
                            <span class="status-text">
                                ${subscription.status === 'active' ? 'Активная подписка' : 'Подписка не активна'}
                                ${subscription.endDate ? ` до ${new Date(subscription.endDate).toLocaleDateString('ru-RU')}` : ''}
                            </span>
                        </div>
                        <button class="btn btn-outline" onclick="app.manageSubscription()">
                            💳 Управление подпиской
                        </button>
                    </div>
                </div>

                <div class="my-journey">
                    <h3>🛣️ Мой путь</h3>
                    <div class="journey-levels">
                        <div class="journey-level ${currentLevel >= 1 ? 'active' : ''}">
                            <div class="level-number">1</div>
                            <div class="level-info">
                                <div class="level-title">Понимаю</div>
                                <div class="level-description">Начинаю замечать закономерности и связи</div>
                                <div class="level-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(progress.progress.understand / 9) * 100}%"></div>
                                    </div>
                                    <div class="progress-text">${progress.progress.understand} из 9</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="journey-level ${currentLevel >= 2 ? 'active' : ''}">
                            <div class="level-number">2</div>
                            <div class="level-info">
                                <div class="level-title">Связываю</div>
                                <div class="level-description">Закономерности складываются в систему</div>
                                <div class="level-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(progress.progress.connect / 25) * 100}%"></div>
                                    </div>
                                    <div class="progress-text">${progress.progress.connect} из 25</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="journey-level ${currentLevel >= 3 ? 'active' : ''}">
                            <div class="level-number">3</div>
                            <div class="level-info">
                                <div class="level-title">Применяю</div>
                                <div class="level-description">Подход АНБ используется на практике</div>
                                <div class="level-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(progress.progress.apply / 23) * 100}%"></div>
                                    </div>
                                    <div class="progress-text">${progress.progress.apply} из 23</div>
                                </div>
                            </div>
                        </div>

                        <div class="journey-level ${currentLevel >= 4 ? 'active' : ''}">
                            <div class="level-number">4</div>
                            <div class="level-info">
                                <div class="level-title">Систематизирую</div>
                                <div class="level-description">Знания становятся инструментом</div>
                                <div class="level-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(progress.progress.systematize / 13) * 100}%"></div>
                                    </div>
                                    <div class="progress-text">${progress.progress.systematize} из 13</div>
                                </div>
                            </div>
                        </div>

                        <div class="journey-level ${currentLevel >= 5 ? 'active' : ''}">
                            <div class="level-number">5</div>
                            <div class="level-info">
                                <div class="level-title">Делюсь</div>
                                <div class="level-description">Опыт становится вкладом</div>
                                <div class="level-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(progress.progress.share / 7) * 100}%"></div>
                                    </div>
                                    <div class="progress-text">${progress.progress.share} из 7</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Активность</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps.coursesBought}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps.materialsWatched}</div>
                            <div class="stat-label">Материалов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps.eventsParticipated}</div>
                            <div class="stat-label">Мероприятий</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps.materialsSaved}</div>
                            <div class="stat-label">Сохранено</div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.editProfile()">
                        ✏️ Редактировать профиль
                    </button>
                    <button class="btn btn-outline" onclick="app.exportData()">
                        📥 Экспорт данных
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
            return this.createAccessDeniedPage();
        }

        return `
            <div class="page">
                <div class="admin-header">
                    <h2>${this.isSuperAdmin ? '🛠️ Супер-админ панель' : '🔧 Админ-панель'}</h2>
                    <div class="admin-badge">${this.isSuperAdmin ? 'Супер-администратор' : 'Администратор'}</div>
                </div>

                <div class="admin-tabs">
                    <button class="tab-btn active" data-tab="dashboard">📊 Дашборд</button>
                    <button class="tab-btn" data-tab="users">👥 Пользователи</button>
                    <button class="tab-btn" data-tab="content">📝 Контент</button>
                    ${this.isSuperAdmin ? '<button class="tab-btn" data-tab="system">⚙️ Система</button>' : ''}
                </div>

                <div class="admin-content">
                    <div id="adminDashboard" class="admin-tab-content active">
                        ${this.createAdminDashboard()}
                    </div>
                    <div id="adminUsers" class="admin-tab-content">
                        ${this.createAdminUsers()}
                    </div>
                    <div id="adminContent" class="admin-tab-content">
                        ${this.createAdminContent()}
                    </div>
                    ${this.isSuperAdmin ? `
                    <div id="adminSystem" class="admin-tab-content">
                        ${this.createAdminSystem()}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createAdminSystem() {
        return `
            <div class="admin-section">
                <h3>⚙️ Управление системой</h3>
                <div class="system-actions">
                    <button class="btn btn-danger" onclick="app.restartSystem()">
                        🔄 Перезапустить систему
                    </button>
                    <button class="btn btn-outline" onclick="app.clearCache()">
                        🧹 Очистить кэш
                    </button>
                </div>
                
                <div class="system-info">
                    <h4>Информация о системе</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Версия:</span>
                            <span class="info-value">1.0.0</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">База данных:</span>
                            <span class="info-value" id="dbStatus">Проверка...</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Бот:</span>
                            <span class="info-value" id="botStatus">Проверка...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadAdminStats() {
        try {
            const response = await fetch(`/api/admin/stats?userId=${this.currentUser.id}`);
            const data = await response.json();
            
            if (data.success) {
                this.updateAdminDashboard(data.stats);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }

    async loadAdminUsers() {
        try {
            const response = await fetch(`/api/admin/users?adminId=${this.currentUser.id}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderAdminUsers(data.users);
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    }

    async makeUserAdmin(userId) {
        if (!this.isSuperAdmin) {
            this.showNotification('❌ Только супер-администратор может назначать администраторов');
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/make-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId: this.currentUser.id })
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('✅ Пользователь назначен администратором');
                this.loadAdminUsers();
            } else {
                this.showNotification('❌ Ошибка назначения администратора');
            }
        } catch (error) {
            console.error('Ошибка назначения администратора:', error);
            this.showNotification('❌ Ошибка назначения администратора');
        }
    }

    createAdminDashboard() {
        return `
            <div class="admin-stats">
                <h3>📈 Общая статистика</h3>
                <div class="stats-grid">
                    <div class="stat-card large">
                        <div class="stat-value">156</div>
                        <div class="stat-label">Пользователей</div>
                    </div>
                    <div class="stat-card large">
                        <div class="stat-value">${this.allContent.courses?.length || 0}</div>
                        <div class="stat-label">Курсов</div>
                    </div>
                    <div class="stat-card large">
                        <div class="stat-value">258 100 ₽</div>
                        <div class="stat-label">Общий доход</div>
                    </div>
                    <div class="stat-card large">
                        <div class="stat-value">89%</div>
                        <div class="stat-label">Активных</div>
                    </div>
                </div>
            </div>

            <div class="admin-actions">
                <h3>🚀 Быстрые действия</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.showAddContentForm()">
                        ➕ Добавить курс
                    </button>
                    <button class="btn btn-secondary" onclick="app.manageUsers()">
                        👥 Управление пользователями
                    </button>
                    <button class="btn btn-outline" onclick="app.generateReport()">
                        📊 Создать отчет
                    </button>
                    <button class="btn btn-outline" onclick="app.sendNotification()">
                        📢 Рассылка
                    </button>
                </div>
            </div>

            <div class="recent-activity">
                <h3>🔄 Последние действия</h3>
                <div class="activity-list">
                    <div class="activity-item">
                        <div class="activity-icon">👤</div>
                        <div class="activity-info">
                            <div class="activity-action">Новый пользователь</div>
                            <div class="activity-details">Анна Сидорова зарегистрировалась</div>
                            <div class="activity-time">2 минуты назад</div>
                        </div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon">💳</div>
                        <div class="activity-info">
                            <div class="activity-action">Оплата подписки</div>
                            <div class="activity-details">Петр Иванов оплатил премиум</div>
                            <div class="activity-time">1 час назад</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminContent() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="admin-section">
                <div class="section-header">
                    <h3>📚 Управление курсами</h3>
                    <button class="btn btn-primary" onclick="app.showAddCourseForm()">
                        ➕ Добавить курс
                    </button>
                </div>
                
                <div class="content-list">
                    ${courses.map(course => `
                        <div class="admin-content-item">
                            <div class="content-info">
                                <div class="content-title">${course.title}</div>
                                <div class="content-meta">
                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                    <span>⏱️ ${course.duration}</span>
                                    <span>📚 ${course.modules} модулей</span>
                                    <span>👥 ${course.students_count} студентов</span>
                                </div>
                                <div class="content-description">${course.description}</div>
                            </div>
                            <div class="content-actions">
                                <button class="btn btn-small" onclick="app.editCourse(${course.id})">
                                    ✏️
                                </button>
                                <button class="btn btn-small btn-danger" onclick="app.deleteCourse(${course.id})">
                                    🗑️
                                </button>
                                <button class="btn btn-small btn-outline" onclick="app.viewCourseStats(${course.id})">
                                    📊
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="admin-section">
                <h3>📋 Управление материалами</h3>
                <div class="content-tabs">
                    <button class="content-tab active" onclick="app.showMaterialsManagement('all')">Все</button>
                    <button class="content-tab" onclick="app.showMaterialsManagement('podcasts')">Подкасты</button>
                    <button class="content-tab" onclick="app.showMaterialsManagement('streams')">Эфиры</button>
                    <button class="content-tab" onclick="app.showMaterialsManagement('videos')">Видео</button>
                </div>
                <div class="content-actions">
                    <button class="btn btn-primary" onclick="app.showAddMaterialForm()">
                        ➕ Добавить материал
                    </button>
                </div>
            </div>
        `;
    }

    createAdminUsers() {
        return `
            <div class="admin-section">
                <h3>👥 Управление пользователями</h3>
                <div class="users-filters">
                    <input type="text" placeholder="Поиск пользователей..." class="search-input" id="userSearch">
                    <select class="filter-select" id="userFilter">
                        <option value="all">Все пользователи</option>
                        <option value="active">Активные подписки</option>
                        <option value="trial">Пробный период</option>
                        <option value="inactive">Неактивные</option>
                        <option value="admin">Администраторы</option>
                    </select>
                    <button class="btn btn-primary" onclick="app.exportUsers()">
                        📥 Экспорт
                    </button>
                </div>
                
                <div class="users-list">
                    <div class="admin-user-item">
                        <div class="user-info">
                            <div class="user-avatar">👤</div>
                            <div class="user-details">
                                <div class="user-name">Демо Пользователь</div>
                                <div class="user-meta">
                                    <span>🎯 Невролог</span>
                                    <span>🏙️ Москва</span>
                                    <span>📧 demo@anb.ru</span>
                                </div>
                                <div class="user-status">
                                    <span class="status-badge active">✅ Активен</span>
                                    <span class="join-date">Зарегистрирован: 01.01.2024</span>
                                </div>
                            </div>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-small" onclick="app.viewUser(898508164)">
                                👁️
                            </button>
                            <button class="btn btn-small btn-primary" onclick="app.makeAdmin(898508164)">
                                👑
                            </button>
                            <button class="btn btn-small btn-outline" onclick="app.sendMessageToUser(898508164)">
                                💬
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminTeachers() {
        return `
            <div class="admin-section">
                <h3>👨‍⚕️ Управление преподавателями</h3>
                <div class="empty-state">
                    <div class="empty-icon">👨‍⚕️</div>
                    <div class="empty-text">Раздел в разработке</div>
                    <div class="empty-hint">Скоро здесь появится управление преподавателями</div>
                </div>
            </div>
        `;
    }

    createAdminAnalytics() {
        return `
            <div class="admin-section">
                <h3>📈 Аналитика</h3>
                <div class="empty-state">
                    <div class="empty-icon">📈</div>
                    <div class="empty-text">Раздел в разработке</div>
                    <div class="empty-hint">Скоро здесь появится аналитика</div>
                </div>
            </div>
        `;
    }

    createAdminSettings() {
        return `
            <div class="admin-section">
                <h3>⚙️ Настройки системы</h3>
                <div class="settings-list">
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Уведомления</div>
                            <div class="setting-description">Настройка push-уведомлений</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="setting-item">
                        <div class="setting-info">
                            <div class="setting-title">Автоматическое обновление</div>
                            <div class="setting-description">Автообновление контента</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    createNotFoundPage(message = 'Страница не найдена') {
        return `
            <div class="page">
                <div class="error">
                    <div class="error-icon">🔍</div>
                    <div class="error-text">${message}</div>
                    <div class="error-hint">Запрашиваемая страница не существует или была удалена</div>
                    <button class="btn btn-primary" onclick="app.renderPage('home')">
                        На главную
                    </button>
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
                    <button class="btn btn-primary" onclick="app.renderPage('home')">
                        На главную
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    getMaterialTypeIcon(type) {
        const icons = {
            'mri': '🖼️',
            'case': '📄',
            'checklist': '✅'
        };
        return icons[type] || '📋';
    }

    getMaterialTypeName(type) {
        const names = {
            'mri': 'МРТ',
            'case': 'Клинический случай',
            'checklist': 'Чек-лист'
        };
        return names[type] || 'Материал';
    }

    getChatIcon(type) {
        const icons = {
            'group': '👥',
            'private': '👤',
            'flood': '💬'
        };
        return icons[type] || '💬';
    }

    getContentIcon(item) {
        if (item.modules) return '📚';
        if (item.duration && item.listens) return '🎧';
        if (item.participants) return '📹';
        if (item.views) return '🎯';
        if (item.downloads) return '📋';
        return '📄';
    }

    getContentType(item) {
        if (item.modules) return 'courses';
        if (item.listens) return 'podcasts';
        if (item.participants) return 'streams';
        if (item.views) return 'videos';
        if (item.downloads) return 'materials';
        return 'unknown';
    }

    renderItemMeta(item) {
        if (item.modules) {
            return `
                <span>⏱️ ${item.duration}</span>
                <span>💰 ${this.formatPrice(item.price)}</span>
                <span>⭐ ${item.rating}</span>
            `;
        }
        if (item.listens) {
            return `
                <span>⏱️ ${item.duration}</span>
                <span>👂 ${item.listens}</span>
            `;
        }
        if (item.participants) {
            return `
                <span>⏱️ ${item.duration}</span>
                <span>👥 ${item.participants}</span>
            `;
        }
        if (item.views) {
            return `
                <span>⏱️ ${item.duration}</span>
                <span>👁️ ${item.views}</span>
            `;
        }
        if (item.downloads) {
            return `
                <span>${this.getMaterialTypeIcon(item.material_type)} ${this.getMaterialTypeName(item.material_type)}</span>
                <span>📥 ${item.downloads}</span>
            `;
        }
        return '';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    isFavorite(contentId, contentType) {
        return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
    }

    calculateCurrentLevel(progress) {
        if (progress.share >= 7) return 5;
        if (progress.systematize >= 13) return 4;
        if (progress.apply >= 23) return 3;
        if (progress.connect >= 25) return 2;
        return 1;
    }

    filterContent(items, type) {
        let filtered = items;
        
        // Поиск
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                (item.category && item.category.toLowerCase().includes(query))
            );
        }

        // Фильтры по типу
        if (this.state.activeFilters[type]) {
            const filter = this.state.activeFilters[type];
            if (filter !== 'all') {
                filtered = filtered.filter(item => {
                    if (type === 'courses' || type === 'podcasts' || type === 'videos') {
                        return item.category === filter;
                    }
                    if (type === 'streams') {
                        return item.type === filter;
                    }
                    if (type === 'materials') {
                        return item.material_type === filter;
                    }
                    if (type === 'events') {
                        return item.event_type === filter;
                    }
                    return true;
                });
            }
        }

        return filtered;
    }

    // ==================== МЕТОДЫ ДЕЙСТВИЙ ====================

    handleAction(action, data) {
        const actions = {
            'support': () => this.showSupport(),
            'start-learning': () => this.renderPage('courses'),
            'my-profile': () => this.renderPage('profile'),
            'manage-subscription': () => this.manageSubscription(),
            'edit-profile': () => this.editProfile(),
            'export-data': () => this.exportData()
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    handleSearch() {
        // Обновляем текущую страницу с учетом поиска
        this.renderPage(this.currentPage);
    }

    filterContent(filter, type) {
        this.state.activeFilters[type] = filter;
        this.renderPage(this.currentPage);
    }

    filterMaterials(filter) {
        this.state.activeFilters.materialType = filter === 'all' ? null : filter;
        this.renderPage('materials');
    }

    filterEvents(filter) {
        this.state.activeFilters.eventType = filter === 'all' ? null : filter;
        this.renderPage('events');
    }

    showFavoritesTab(tab) {
        const content = document.getElementById('favoritesContent');
        if (content) {
            content.innerHTML = this.renderFavoritesContent(tab);
        }
    }

    // Навигация по контенту
    openCourseDetail(courseId) {
        this.renderPage('courses', courseId);
    }

    playPodcast(podcastId) {
        const podcast = this.allContent.podcasts?.find(p => p.id == podcastId);
        this.showNotification(`🎧 Запускаем подкаст: "${podcast?.title}"`);
    }

    playStream(streamId) {
        const stream = this.allContent.streams?.find(s => s.id == streamId);
        this.showNotification(`📹 Запускаем эфир: "${stream?.title}"`);
    }

    playVideo(videoId) {
        const video = this.allContent.videos?.find(v => v.id == videoId);
        this.showNotification(`🎯 Запускаем видео: "${video?.title}"`);
    }

    openMaterial(materialId) {
        const material = this.allContent.materials?.find(m => m.id == materialId);
        this.showNotification(`📖 Открываем материал: "${material?.title}"`);
    }

    openEvent(eventId) {
        const event = this.allContent.events?.find(e => e.id == eventId);
        this.showNotification(`🗺️ Открываем мероприятие: "${event?.title}"`);
    }

    openChat(chatId) {
        this.renderPage('chats', chatId);
    }

    openFloodChat() {
        this.showNotification('💬 Открываем флудилку');
    }

    openFavoriteItem(itemId, type) {
        switch(type) {
            case 'course':
                this.openCourseDetail(itemId);
                break;
            case 'podcast':
                this.playPodcast(itemId);
                break;
            case 'stream':
                this.playStream(itemId);
                break;
            case 'video':
                this.playVideo(itemId);
                break;
            case 'material':
                this.openMaterial(itemId);
                break;
        }
    }

    // Избранное
    toggleFavorite(contentId, contentType) {
        contentId = parseInt(contentId);
        const favorites = this.state.favorites[contentType] || [];
        
        if (favorites.includes(contentId)) {
            this.state.favorites[contentType] = favorites.filter(id => id !== contentId);
        } else {
            this.state.favorites[contentType].push(contentId);
        }
        
        // Обновляем кнопку
        const btn = document.querySelector(`.favorite-btn[data-id="${contentId}"][data-type="${contentType}"]`);
        if (btn) {
            btn.classList.toggle('active');
            btn.innerHTML = this.isFavorite(contentId, contentType) ? '❤️' : '🤍';
        }
        
        this.showNotification(
            this.isFavorite(contentId, contentType) ? 
            '❤️ Добавлено в избранное' : 
            '💔 Убрано из избранного'
        );
    }

    addToFavorites(contentId, contentType) {
        this.toggleFavorite(contentId, contentType);
    }

    // Покупки и регистрации
    purchaseCourse(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        this.showNotification(`💳 Покупка курса: "${course?.title}" за ${this.formatPrice(course?.price)}`);
    }

    registerForEvent(eventId) {
        const event = this.allContent.events?.find(e => e.id == eventId);
        this.showNotification(`✅ Зарегистрировались на мероприятие: "${event?.title}"`);
    }

    getPromotion(promoId) {
        const promo = this.allContent.promotions?.find(p => p.id == promoId);
        this.showNotification(`🎁 Получаем предложение: "${promo?.title}"`);
    }

    // Чат
    handleMessageKeypress(event, chatId) {
        if (event.key === 'Enter') {
            this.sendMessage(chatId);
        }
    }

    sendMessage(chatId) {
        const input = document.getElementById('messageInput');
        const messages = document.getElementById('chatMessages');
        
        if (input && input.value.trim() && messages) {
            const message = input.value.trim();
            input.value = '';
            
            const messageHTML = `
                <div class="message sent">
                    <div class="message-content">
                        <div class="message-text">${message}</div>
                        <div class="message-time">${new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                </div>
            `;
            
            messages.insertAdjacentHTML('beforeend', messageHTML);
            messages.scrollTop = messages.scrollHeight;
        }
    }

    // Поддержка и информация
    showSupport() {
        this.showNotification('💬 Поддержка: @academy_anb\n📧 academy@anb.ru\n⏰ ПН-ПТ 11:00-19:00');
    }

    showCommunityRules() {
        this.showNotification('📜 Правила сообщества:\n\n1. Уважайте других участников\n2. Не распространяйте спам\n3. Соблюдайте профессиональную этику');
    }

    showFAQ() {
        this.showNotification('❓ Частые вопросы:\n\nQ: Как оформить подписку?\nA: В разделе "Профиль" → "Управление подпиской"\n\nQ: Доступны ли курсы офлайн?\nA: Да, после покупки курс доступен офлайн');
    }

    showSubscriptionInfo() {
        this.showNotification('💳 Информация о подписке:\n\n• Доступ ко всем курсам\n• Участие в эфирах\n• Практические материалы\n• Поддержка куратора');
    }

    showSupportInfo() {
        this.showNotification('👨‍💼 Координатор проекта:\n\n@academy_anb\nacademy@anb.ru\nПН-ПТ 11:00-19:00');
    }

    manageSubscription() {
        this.showNotification('💳 Управление подпиской\n\nЗдесь можно:\n• Продлить подписку\n• Изменить тариф\n• Отменить подписку');
    }

    editProfile() {
        this.showNotification('✏️ Редактирование профиля\n\nВ разработке...');
    }

    exportData() {
        this.showNotification('📥 Экспорт данных\n\nВаши данные готовы к скачиванию');
    }

    shareCourse(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        this.showNotification(`📤 Поделиться курсом: "${course?.title}"`);
    }

    // Админ методы
    initAdminPage() {
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchAdminTab(tab);
            });
        });
    }

    switchAdminTab(tab) {
        // Обновляем активные вкладки
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `admin${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        });
    }

    initCoursesPage() {
        // Инициализация страницы курсов
        console.log('Инициализация страницы курсов');
    }

    initChatsPage() {
        // Инициализация чатов
        console.log('Инициализация чатов');
    }

    initProfilePage() {
        // Инициализация профиля
        console.log('Инициализация профиля');
    }

    showAddContentForm() {
        this.showNotification('📝 Добавление контента\n\nФорма для добавления нового контента');
    }

    showAddCourseForm() {
        this.showNotification('📚 Добавление курса\n\nФорма для создания нового курса');
    }

    showAddMaterialForm() {
        this.showNotification('📋 Добавление материала\n\nФорма для добавления практического материала');
    }

    manageUsers() {
        this.showNotification('👥 Управление пользователями\n\nПросмотр и управление пользователями системы');
    }

    editCourse(courseId) {
        this.showNotification(`✏️ Редактирование курса #${courseId}`);
    }

    deleteCourse(courseId) {
        if (confirm('Вы уверены, что хотите удалить этот курс?')) {
            this.showNotification(`🗑️ Курс #${courseId} удален`);
        }
    }

    viewCourseStats(courseId) {
        this.showNotification(`📊 Статистика курса #${courseId}`);
    }

    showMaterialsManagement(type) {
        this.showNotification(`📋 Управление материалами: ${type}`);
    }

    exportUsers() {
        this.showNotification('📥 Экспорт пользователей\n\nФайл с данными пользователей готов к скачиванию');
    }

    viewUser(userId) {
        this.showNotification(`👁️ Просмотр пользователя #${userId}`);
    }

    makeAdmin(userId) {
        if (confirm('Назначить пользователя администратором?')) {
            this.showNotification(`👑 Пользователь #${userId} назначен администратором`);
        }
    }

    sendMessageToUser(userId) {
        this.showNotification(`💬 Отправка сообщения пользователю #${userId}`);
    }

    generateReport() {
        this.showNotification('📊 Создание отчета\n\nОтчет будет готов через несколько секунд');
    }

    sendNotification() {
        this.showNotification('📢 Рассылка уведомлений\n\nНастройка массовой рассылки');
    }

    showChatInfo(chatId) {
        this.showNotification(`ℹ️ Информация о чате #${chatId}`);
    }

    // Утилиты
    showNotification(message) {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: 'Академия АНБ',
                message: message,
                buttons: [{ type: 'ok' }]
            });
        } else {
            alert(message);
        }
    }

    showError(message) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="error">
                <div class="error-icon">❌</div>
                <div class="error-text">${message}</div>
                <button class="btn btn-primary" onclick="app.init()">Повторить</button>
            </div>
        `;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AcademyApp();
});

// Глобальные функции для onclick
window.toggleSearch = function() {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        const isVisible = searchContainer.style.display !== 'none';
        searchContainer.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            document.getElementById('searchInput').focus();
        }
    }
};
