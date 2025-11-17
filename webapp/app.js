// webapp/app.js - ПОЛНАЯ ВЕРСИЯ ПО ТЗ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.admin = {
            currentTab: 'dashboard',
            stats: {},
            newContent: { type: 'courses' }
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация Академии АНБ...');
        
        this.showLoading();
        
        try {
            // Инициализация Telegram WebApp
            this.initTelegramWebApp();
            
            await this.loadUserData();
            await this.loadContent();
            
            this.renderPage('home');
            this.setupNavigation();
            
            console.log('✅ Приложение готово');
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения');
        }
    }

    initTelegramWebApp() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.expand();
            Telegram.WebApp.BackButton.show();
            Telegram.WebApp.BackButton.onClick(() => {
                this.handleBackButton();
            });
            
            Telegram.WebApp.MainButton.setText('Открыть меню');
            Telegram.WebApp.MainButton.show();
            Telegram.WebApp.MainButton.onClick(() => {
                this.showMainMenu();
            });
            
            console.log('✅ Telegram WebApp инициализирован');
        }
    }

    handleBackButton() {
        if (this.currentSubPage) {
            this.currentSubPage = '';
            this.renderPage(this.currentPage);
        } else if (this.currentPage !== 'home') {
            this.renderPage('home');
        } else {
            Telegram.WebApp.close();
        }
    }

    showMainMenu() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: 'Меню Академии',
                message: 'Выберите раздел:',
                buttons: [
                    { id: 'courses', type: 'default', text: '📚 Курсы' },
                    { id: 'materials', type: 'default', text: '📋 Материалы' },
                    { id: 'profile', type: 'default', text: '👤 Профиль' },
                    { type: 'cancel', text: 'Закрыть' }
                ]
            }, (buttonId) => {
                if (buttonId === 'courses') this.renderPage('courses');
                else if (buttonId === 'materials') this.renderPage('materials');
                else if (buttonId === 'profile') this.renderPage('profile');
            });
        }
    }

    showLoading() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner">⏳</div>
                    <div>Загрузка Академии АНБ...</div>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading скроется при рендере
    }

    showError(message) {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error">
                    <div class="error-icon">❌</div>
                    <div class="error-text">${message}</div>
                    <button class="btn btn-primary" onclick="app.init()">Повторить</button>
                </div>
            `;
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });
    }

    async loadUserData() {
        try {
            let userId = this.getUserId();
            let firstName = 'Пользователь';
            let lastName = '';
            let username = 'user';

            if (window.Telegram && Telegram.WebApp) {
                const tgUser = Telegram.WebApp.initDataUnsafe.user;
                if (tgUser) {
                    userId = tgUser.id;
                    firstName = tgUser.first_name;
                    lastName = tgUser.last_name || '';
                    username = tgUser.username || 'user';
                }
            }
            
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    firstName: firstName,
                    lastName: lastName,
                    username: username
                })
            });

            if (!response.ok) throw new Error('Network error');
            
            const data = await response.json();
            if (data.success) {
                this.currentUser = data.user;
                this.isAdmin = this.currentUser.isAdmin;
                
                if (this.isAdmin) {
                    document.getElementById('adminBadge').style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            this.createDemoUser();
        }
    }

    getUserId() {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser?.id) return tgUser.id;
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
                watchLater: [1, 2],
                favorites: [1],
                materials: [1, 2]
            },
            isAdmin: true,
            joinedAt: new Date('2024-01-01'),
            surveyCompleted: true
        };
        this.isAdmin = true;
        document.getElementById('adminBadge').style.display = 'block';
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            if (!response.ok) throw new Error('Network error');
            
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
    }

    createDemoContent() {
        this.allContent = {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике',
                    description: '6 модулей по современным мануальным методикам',
                    price: 15000,
                    duration: '12 часов',
                    modules: 6,
                    category: 'Мануальные техники',
                    students_count: 45,
                    rating: 4.8
                },
                {
                    id: 2,
                    title: 'Неврология для практикующих врачей',
                    description: 'Основы неврологической диагностики',
                    price: 12000,
                    duration: '10 часов',
                    modules: 5,
                    category: 'Неврология',
                    students_count: 67,
                    rating: 4.6
                }
            ],
            podcasts: [
                {
                    id: 1,
                    title: 'АНБ FM: Современная неврология',
                    description: 'Обсуждение новых тенденций в неврологии',
                    duration: '45:20',
                    category: 'Неврология',
                    listens: 234
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'Разбор клинического случая: Болевой синдром',
                    description: 'Прямой эфир с разбором сложного случая',
                    duration: '1:30:00',
                    stream_date: new Date().toISOString(),
                    is_live: true,
                    participants: 89,
                    type: 'analysis'
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Шпаргалка: Неврологический осмотр',
                    description: 'Быстрый гайд по основным тестам',
                    duration: '15:30',
                    category: 'Неврология',
                    views: 456
                }
            ],
            materials: [
                {
                    id: 1,
                    title: 'МРТ разбор: Рассеянный склероз',
                    description: 'Детальный разбор МРТ с клиническими случаями',
                    material_type: 'mri',
                    category: 'Неврология',
                    downloads: 123
                },
                {
                    id: 2,
                    title: 'Чек-лист: Неврологический осмотр',
                    description: 'Пошаговый чек-лист для ежедневной практики',
                    material_type: 'checklist',
                    category: 'Неврология',
                    downloads: 267
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Конференция: Современная неврология 2024',
                    description: 'Ежегодная конференция с ведущими специалистами',
                    date: '2024-02-15T10:00:00',
                    location: 'Москва',
                    event_type: 'offline',
                    participants: 45
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

        // Обновляем кнопку "Назад" в Telegram
        if (window.Telegram && Telegram.WebApp) {
            if (page === 'home' && !subPage) {
                Telegram.WebApp.BackButton.hide();
            } else {
                Telegram.WebApp.BackButton.show();
            }
        }

        let pageHTML = '';
        
        try {
            switch(page) {
                case 'home':
                    pageHTML = this.createHomePage();
                    break;
                case 'courses':
                    pageHTML = subPage ? this.createCourseDetailPage(subPage) : this.createCoursesPage();
                    break;
                case 'materials':
                    pageHTML = this.createMaterialsPage();
                    break;
                case 'community':
                    pageHTML = this.createCommunityPage();
                    break;
                case 'chats':
                    pageHTML = subPage ? this.createChatDetailPage(subPage) : this.createChatsPage();
                    break;
                case 'profile':
                    pageHTML = this.createProfilePage();
                    break;
                case 'admin':
                    if (this.isAdmin) {
                        pageHTML = this.createAdminPage();
                        setTimeout(() => this.initAdminPage(), 100);
                    } else {
                        pageHTML = this.createAccessDeniedPage();
                    }
                    break;
                default:
                    pageHTML = this.createHomePage();
            }
            
            mainContent.innerHTML = pageHTML;
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showError('Ошибка отображения страницы');
        }
    }

    // ==================== СТРАНИЦЫ ПО ТЗ ====================

    createHomePage() {
        return `
            <div class="page">
                <div class="search-container">
                    <input type="text" placeholder="Поиск по курсам, материалам, эфирам..." class="search-input" id="searchInput">
                </div>

                <div class="hero-section">
                    <div class="hero-text">
                        <h2>Академия АНБ</h2>
                        <p>Современное образование для врачей</p>
                    </div>
                </div>

                <div class="quick-nav">
                    <h3>Навигация</h3>
                    <div class="grid">
                        <div class="card" onclick="app.renderPage('courses')">
                            <div class="card-icon">📚</div>
                            <div class="card-title">Курсы</div>
                            <div class="card-desc">Системное обучение</div>
                        </div>
                        <div class="card" onclick="app.showSection('podcasts')">
                            <div class="card-icon">🎧</div>
                            <div class="card-title">АНБ FM</div>
                            <div class="card-desc">Аудио подкасты</div>
                        </div>
                        <div class="card" onclick="app.showSection('streams')">
                            <div class="card-icon">📹</div>
                            <div class="card-title">Эфиры|Разборы</div>
                            <div class="card-desc">Прямые эфиры и кейсы</div>
                        </div>
                        <div class="card" onclick="app.showSection('videos')">
                            <div class="card-icon">🎯</div>
                            <div class="card-title">Видео-шпаргалки</div>
                            <div class="card-desc">Короткие видео-гиды</div>
                        </div>
                        <div class="card" onclick="app.renderPage('materials')">
                            <div class="card-icon">📋</div>
                            <div class="card-title">Практические материалы</div>
                            <div class="card-desc">МРТ, кейсы, чек-листы</div>
                        </div>
                        <div class="card" onclick="app.showSection('events')">
                            <div class="card-icon">🗺️</div>
                            <div class="card-title">Карта мероприятий</div>
                            <div class="card-desc">Онлайн и офлайн события</div>
                        </div>
                        <div class="card" onclick="app.showSection('promotions')">
                            <div class="card-icon">🎁</div>
                            <div class="card-title">Ограниченное предложение</div>
                            <div class="card-desc">Специальные акции</div>
                        </div>
                        <div class="card" onclick="app.showSupport()">
                            <div class="card-icon">💬</div>
                            <div class="card-title">Поддержка</div>
                            <div class="card-desc">Помощь и консультации</div>
                        </div>
                    </div>
                </div>

                <div class="content-feed">
                    <div class="feed-tabs">
                        <button class="feed-tab active" onclick="app.filterFeed('all')">Все</button>
                        <button class="feed-tab" onclick="app.filterFeed('articles')">Статьи</button>
                        <button class="feed-tab" onclick="app.filterFeed('development')">Профессиональное развитие</button>
                        <button class="feed-tab" onclick="app.filterFeed('skills')">Практические навыки</button>
                        <button class="feed-tab" onclick="app.filterFeed('physiotherapy')">Физиотерапия</button>
                        <button class="feed-tab" onclick="app.filterFeed('rehabilitation')">Реабилитация</button>
                        <button class="feed-tab" onclick="app.filterFeed('pharmacotherapy')">Фармакотерапия</button>
                        <button class="feed-tab" onclick="app.filterFeed('manual')">Мануальные техники</button>
                    </div>

                    <div class="feed-content">
                        <div class="feed-item">
                            <div class="feed-title">Новый курс: Мануальные техники</div>
                            <div class="feed-description">Доступен для записи</div>
                            <div class="feed-meta">📚 Курс • 2 часа назад</div>
                        </div>
                        <div class="feed-item">
                            <div class="feed-title">Эфир: Разбор клинического случая</div>
                            <div class="feed-description">Прямой эфир с экспертом</div>
                            <div class="feed-meta">📹 Эфир • 5 часов назад</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createCoursesPage() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📚 Курсы Академии</h2>
                    <div class="page-actions">
                        <button class="btn btn-outline" onclick="app.filterContent('all')">Все</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Неврология')">Неврология</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Реабилитация')">Реабилитация</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Мануальные техники')">Мануальные техники</button>
                    </div>
                </div>

                <div class="content-grid">
                    ${courses.map(course => `
                        <div class="content-card course-card" onclick="app.renderPage('courses', ${course.id})">
                            <div class="content-card-header">
                                <div class="content-icon">📚</div>
                                <div class="content-badge">${course.modules} модулей</div>
                            </div>
                            <div class="content-card-body">
                                <div class="content-title">${course.title}</div>
                                <div class="content-description">${course.description}</div>
                                <div class="content-meta">
                                    <span class="meta-item">⏱️ ${course.duration}</span>
                                    <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                    <span class="meta-item">⭐ ${course.rating}</span>
                                    <span class="meta-item">👥 ${course.students_count}</span>
                                </div>
                            </div>
                            <div class="content-card-actions">
                                <button class="btn btn-outline" onclick="event.stopPropagation(); app.addToFavorites(${course.id}, 'courses')">
                                    ❤️ В избранное
                                </button>
                                <button class="btn btn-primary" onclick="event.stopPropagation(); app.startCourse(${course.id})">
                                    ${course.price > 0 ? '💳 Купить курс' : '🎓 Начать обучение'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createCourseDetailPage(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        if (!course) return this.createNotFoundPage();

        return `
            <div class="page">
                <div class="page-header">
                    <h2>${course.title}</h2>
                    <button class="btn btn-outline" onclick="app.renderPage('courses')">← Назад</button>
                </div>

                <div class="course-detail">
                    <div class="course-hero">
                        <div class="course-icon">📚</div>
                        <div class="course-info">
                            <div class="course-title">${course.title}</div>
                            <div class="course-description">${course.full_description || course.description}</div>
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
                                    <div class="stat-value">${course.rating}</div>
                                    <div class="stat-label">Рейтинг</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="course-content">
                        <h3>🛣️ Программа курса</h3>
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

                    <div class="course-actions">
                        <button class="btn btn-primary btn-large" onclick="app.startCourse(${course.id})">
                            💳 Купить за ${this.formatPrice(course.price)}
                        </button>
                        <button class="btn btn-outline" onclick="app.addToWatchLater(${course.id})">
                            ⏰ Посмотреть позже
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createMaterialsPage() {
        const materials = this.allContent.materials || [];
        const videos = this.allContent.videos || [];
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📋 Мои материалы</h2>
                    <div class="page-tabs">
                        <button class="page-tab active" onclick="app.showMaterialsTab('all')">Все материалы</button>
                        <button class="page-tab" onclick="app.showMaterialsTab('watchLater')">⏰ Посмотреть позже</button>
                        <button class="page-tab" onclick="app.showMaterialsTab('favorites')">❤️ Избранное</button>
                        <button class="page-tab" onclick="app.showMaterialsTab('practice')">📋 Практические материалы</button>
                    </div>
                </div>

                <div class="materials-grid">
                    <div class="materials-section">
                        <h3>📋 Практические материалы</h3>
                        <div class="materials-tabs">
                            <button class="materials-tab active" onclick="app.filterMaterials('all')">Все</button>
                            <button class="materials-tab" onclick="app.filterMaterials('mri')">МРТ</button>
                            <button class="materials-tab" onclick="app.filterMaterials('case')">Клинические случаи</button>
                            <button class="materials-tab" onclick="app.filterMaterials('checklist')">Чек-листы</button>
                        </div>
                        <div class="content-grid">
                            ${materials.map(material => `
                                <div class="content-card material-card">
                                    <div class="content-card-header">
                                        <div class="content-icon">${this.getMaterialIcon(material.material_type)}</div>
                                        <button class="favorite-btn ${this.isFavorite(material.id, 'materials') ? 'active' : ''}" 
                                                onclick="app.toggleFavorite(${material.id}, 'materials')">
                                            ${this.isFavorite(material.id, 'materials') ? '❤️' : '🤍'}
                                        </button>
                                    </div>
                                    <div class="content-card-body">
                                        <div class="content-title">${material.title}</div>
                                        <div class="content-description">${material.description}</div>
                                        <div class="content-meta">
                                            <span class="meta-item">${this.getMaterialTypeName(material.material_type)}</span>
                                            <span class="meta-item">📥 ${material.downloads}</span>
                                        </div>
                                    </div>
                                    <div class="content-card-actions">
                                        <button class="btn btn-outline" onclick="app.addToWatchLater(${material.id})">⏰</button>
                                        <button class="btn btn-primary" onclick="app.openMaterial(${material.id})">📖 Открыть</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="materials-section">
                        <h3>🎯 Видео-шпаргалки</h3>
                        <div class="content-grid">
                            ${videos.map(video => `
                                <div class="content-card video-card">
                                    <div class="content-icon">🎯</div>
                                    <div class="content-title">${video.title}</div>
                                    <div class="content-description">${video.description}</div>
                                    <div class="content-meta">
                                        <span class="meta-item">⏱️ ${video.duration}</span>
                                        <span class="meta-item">👁️ ${video.views}</span>
                                    </div>
                                    <button class="btn btn-primary" onclick="app.playVideo(${video.id})">▶️ Смотреть</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createCommunityPage() {
        return `
            <div class="page">
                <h2>👥 О сообществе</h2>
                
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
                        <div class="community-title">Координатор проекта</div>
                        <div class="community-description">Контакты и поддержка</div>
                    </div>
                </div>

                <div class="community-content">
                    <h3>🤔 Частые вопросы</h3>
                    
                    <div class="faq-item">
                        <div class="faq-question" onclick="app.toggleFAQ(this)">
                            Как оформить, продлить или отменить подписку?
                        </div>
                        <div class="faq-answer">
                            Подписку можно оформить или продлить в разделе «Личный кабинет». Там же доступна отмена — через кнопку «Изменить подписку».
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question" onclick="app.toggleFAQ(this)">
                            Что входит в подписку Академии?
                        </div>
                        <div class="faq-answer">
                            Доступ к эфирам, разборам (в том числе в записи), практическим материалам, видео-шпаргалкам на разные темы, а также к чату специалистов и интерактивной карте офлайн-мероприятий.
                        </div>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question" onclick="app.toggleFAQ(this)">
                            Можно ли смотреть материалы без подписки?
                        </div>
                        <div class="faq-answer">
                            Да, часть контента доступна в пробном периоде для ознакомления. Полный доступ открывается при активной подписке.
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
                    <button class="btn btn-primary" onclick="app.createNewChat()">➕ Новый чат</button>
                </div>

                <div class="chats-list">
                    ${chats.map(chat => `
                        <div class="chat-item" onclick="app.renderPage('chats', ${chat.id})">
                            <div class="chat-avatar">${this.getChatIcon(chat.type)}</div>
                            <div class="chat-info">
                                <div class="chat-name">${chat.name}</div>
                                <div class="chat-description">${chat.description}</div>
                                <div class="chat-meta">
                                    <span class="meta-item">👥 ${chat.participants_count} участников</span>
                                    <span class="meta-item">💬 ${chat.last_message || 'Нет сообщений'}</span>
                                </div>
                            </div>
                            <div class="chat-status">
                                <div class="unread-badge">3</div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="chats-info">
                    <h3>💬 Флудилка</h3>
                    <p>Неформальное общение и обсуждение любых тем</p>
                    <button class="btn btn-outline" onclick="app.openFloodChat()">💬 Открыть флудилку</button>
                </div>
            </div>
        `;
    }

    createChatDetailPage(chatId) {
        const chat = this.allContent.chats?.find(c => c.id == chatId);
        if (!chat) return this.createNotFoundPage();

        return `
            <div class="page">
                <div class="chat-header">
                    <button class="back-btn" onclick="app.renderPage('chats')">←</button>
                    <div class="chat-info">
                        <div class="chat-name">${chat.name}</div>
                        <div class="chat-status">${chat.participants_count} участников</div>
                    </div>
                    <button class="btn btn-outline" onclick="app.showChatInfo(${chat.id})">ℹ️</button>
                </div>

                <div class="chat-messages">
                    <div class="message received">
                        <div class="message-avatar">👤</div>
                        <div class="message-content">
                            <div class="message-sender">Координатор</div>
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
                    <input type="text" placeholder="Введите сообщение..." class="message-input" id="messageInput">
                    <button class="btn btn-primary" onclick="app.sendMessage(${chat.id})">📤</button>
                </div>
            </div>
        `;
    }

    createProfilePage() {
        if (!this.currentUser) return '<div class="loading">Загрузка...</div>';
        
        const progress = this.currentUser.progress;
        const currentLevel = this.calculateCurrentLevel(progress.progress);
        
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar-large">👤</div>
                        <div class="profile-info">
                            <div class="profile-name">${this.currentUser.firstName}</div>
                            <div class="profile-status">${this.currentUser.specialization} • ${this.currentUser.city}</div>
                            <div class="profile-badge">${this.currentUser.isAdmin ? '👑 Администратор' : '💎 Активный участник'}</div>
                        </div>
                    </div>
                    
                    <div class="subscription-info">
                        <div class="subscription-status ${this.currentUser.subscription.status}">
                            <div class="status-icon">${this.getSubscriptionIcon(this.currentUser.subscription.status)}</div>
                            <div class="status-text">
                                <div>${this.getSubscriptionText(this.currentUser.subscription.status)}</div>
                                ${this.currentUser.subscription.endDate ? 
                                    `<div class="status-date">до ${new Date(this.currentUser.subscription.endDate).toLocaleDateString('ru-RU')}</div>` : ''}
                            </div>
                        </div>
                        <button class="btn btn-outline" onclick="app.manageSubscription()">💳 Управление подпиской</button>
                    </div>
                </div>

                <div class="my-journey">
                    <h3>🛣️ Мой путь</h3>
                    <div class="journey-progress">
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
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Активность</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <div class="stat-value">${progress.steps.coursesBought}</div>
                                <div class="stat-label">Курсов начато</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <div class="stat-value">${progress.steps.materialsWatched}</div>
                                <div class="stat-label">Материалов изучено</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-value">${progress.steps.eventsParticipated}</div>
                                <div class="stat-label">Мероприятий</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💾</div>
                            <div class="stat-info">
                                <div class="stat-value">${progress.steps.materialsSaved}</div>
                                <div class="stat-label">Сохранено</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    ${this.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.renderPage('admin')">🔧 Админ-панель</button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="app.editProfile()">✏️ Редактировать профиль</button>
                    <button class="btn btn-outline" onclick="app.exportData()">📥 Экспорт данных</button>
                </div>
            </div>
        `;
    }

    createAdminPage() {
        return `
            <div class="page">
                <div class="admin-header">
                    <h2>🔧 Панель управления</h2>
                    <div class="admin-badge">Администратор</div>
                </div>

                <div class="admin-tabs">
                    <button class="admin-tab-btn active" data-tab="dashboard">📊 Дашборд</button>
                    <button class="admin-tab-btn" data-tab="content">📝 Контент</button>
                    <button class="admin-tab-btn" data-tab="users">👥 Пользователи</button>
                    <button class="admin-tab-btn" data-tab="teachers">👨‍⚕️ Преподаватели</button>
                    <button class="admin-tab-btn" data-tab="analytics">📈 Аналитика</button>
                    <button class="admin-tab-btn" data-tab="settings">⚙️ Настройки</button>
                </div>

                <div class="admin-content">
                    <div id="adminDashboard" class="admin-tab-content active">
                        ${this.createAdminDashboard()}
                    </div>
                    <div id="adminContent" class="admin-tab-content">
                        ${this.createAdminContent()}
                    </div>
                    <div id="adminUsers" class="admin-tab-content">
                        ${this.createAdminUsers()}
                    </div>
                    <div id="adminTeachers" class="admin-tab-content">
                        ${this.createAdminTeachers()}
                    </div>
                    <div id="adminAnalytics" class="admin-tab-content">
                        ${this.createAdminAnalytics()}
                    </div>
                    <div id="adminSettings" class="admin-tab-content">
                        ${this.createAdminSettings()}
                    </div>
                </div>
            </div>
        `;
    }

    createAdminDashboard() {
        return `
            <div class="admin-stats">
                <h3>📈 Общая статистика</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-info">
                            <div class="stat-value">156</div>
                            <div class="stat-label">Пользователей</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-info">
                            <div class="stat-value">${this.allContent.courses?.length || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-value">258 100 ₽</div>
                            <div class="stat-label">Общий доход</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <div class="stat-value">89%</div>
                            <div class="stat-label">Активных</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="admin-actions">
                <h3>🚀 Быстрые действия</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.showAddContentForm()">➕ Добавить курс</button>
                    <button class="btn btn-secondary" onclick="app.manageUsers()">👥 Управление пользователями</button>
                    <button class="btn btn-outline" onclick="app.generateReport()">📊 Создать отчет</button>
                    <button class="btn btn-outline" onclick="app.sendNotification()">📢 Рассылка</button>
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
                    <button class="btn btn-primary" onclick="app.showAddCourseForm()">➕ Добавить курс</button>
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
                                <button class="btn btn-small" onclick="app.editCourse(${course.id})">✏️</button>
                                <button class="btn btn-small btn-danger" onclick="app.deleteCourse(${course.id})">🗑️</button>
                                <button class="btn btn-small btn-outline" onclick="app.viewCourseStats(${course.id})">📊</button>
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
                    <button class="btn btn-primary" onclick="app.showAddMaterialForm()">➕ Добавить материал</button>
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
                    <button class="btn btn-primary" onclick="app.exportUsers()">📥 Экспорт</button>
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
                            <button class="btn btn-small" onclick="app.viewUser(898508164)">👁️</button>
                            <button class="btn btn-small btn-primary" onclick="app.makeAdmin(898508164)">👑</button>
                            <button class="btn btn-small btn-outline" onclick="app.sendMessageToUser(898508164)">💬</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Вспомогательные методы
    calculateCurrentLevel(progress) {
        if (progress.share >= 7) return 5;
        if (progress.systematize >= 13) return 4;
        if (progress.apply >= 23) return 3;
        if (progress.connect >= 25) return 2;
        return 1;
    }

    getMaterialIcon(type) {
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

    getSubscriptionIcon(status) {
        const icons = {
            'active': '✅',
            'trial': '🆓',
            'inactive': '❌'
        };
        return icons[status] || '❓';
    }

    getSubscriptionText(status) {
        const texts = {
            'active': 'Активная подписка',
            'trial': 'Пробный период',
            'inactive': 'Неактивна'
        };
        return texts[status] || 'Неизвестно';
    }

    isFavorite(contentId, contentType) {
        return this.currentUser?.favorites?.[contentType]?.includes(contentId) || false;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    // Методы действий
    showSection(section) {
        this.showNotification(`Раздел "${section}" в разработке 🚧`);
    }

    showSupport() {
        this.showNotification('💬 Поддержка: @academy_anb\n📧 academy@anb.ru\n⏰ ПН-ПТ 11:00-19:00');
    }

    startCourse(courseId) {
        this.showNotification(`🎓 Начинаем курс #${courseId}`);
    }

    addToFavorites(contentId, contentType) {
        this.showNotification('❤️ Добавлено в избранное');
    }

    toggleFavorite(contentId, contentType) {
        this.showNotification('❤️ Избранное обновлено');
    }

    addToWatchLater(contentId) {
        this.showNotification('⏰ Добавлено в "Посмотреть позже"');
    }

    openMaterial(materialId) {
        this.showNotification(`📖 Открываем материал #${materialId}`);
    }

    playVideo(videoId) {
        this.showNotification(`🎬 Запускаем видео #${videoId}`);
    }

    sendMessage(chatId) {
        const input = document.getElementById('messageInput');
        if (input && input.value.trim()) {
            this.showNotification(`💬 Сообщение отправлено в чат #${chatId}`);
            input.value = '';
        }
    }

    // Админ методы
    initAdminPage() {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchAdminTab(tab);
            });
        });
    }

    switchAdminTab(tab) {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `admin${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        });
    }

    showAddContentForm() {
        this.showNotification('📝 Форма добавления контента');
    }

    editCourse(courseId) {
        this.showNotification(`✏️ Редактирование курса #${courseId}`);
    }

    deleteCourse(courseId) {
        if (confirm('Удалить курс?')) {
            this.showNotification(`🗑️ Курс #${courseId} удален`);
        }
    }

    makeAdmin(userId) {
        if (confirm('Назначить пользователя администратором?')) {
            this.showNotification(`👑 Пользователь #${userId} назначен администратором`);
        }
    }

    showNotification(message) {
        // Простое уведомление
        alert(message);
    }

    // Заглушки для остальных методов
    createAdminTeachers() {
        return `<div class="admin-section"><h3>👨‍⚕️ Управление преподавателями</h3><p>Функционал в разработке</p></div>`;
    }

    createAdminAnalytics() {
        return `<div class="admin-section"><h3>📈 Аналитика</h3><p>Функционал в разработке</p></div>`;
    }

    createAdminSettings() {
        return `<div class="admin-section"><h3>⚙️ Настройки системы</h3><p>Функционал в разработке</p></div>`;
    }

    createNotFoundPage() {
        return `
            <div class="page">
                <div class="error">
                    <div class="error-icon">🔍</div>
                    <div class="error-text">Страница не найдена</div>
                    <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
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
                    <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
                </div>
            </div>
        `;
    }
}

// Глобальные функции
window.toggleSearch = function() {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        const isVisible = searchContainer.style.display !== 'none';
        searchContainer.style.display = isVisible ? 'none' : 'block';
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, инициализируем приложение...');
    window.app = new AcademyApp();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new AcademyApp();
    });
} else {
    window.app = new AcademyApp();
}
