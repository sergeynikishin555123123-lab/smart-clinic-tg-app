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
            theme: 'dark',
            playingContent: null
        };
        
                // Конфигурация
        this.config = {
            API_BASE_URL: window.location.origin,
            CACHE_DURATION: 5 * 60 * 1000
        };

        // ==================== НОВЫЕ СВОЙСТВА ДЛЯ ПОДПИСОК И ПРЕПОДАВАТЕЛЕЙ ====================
        this.subscriptionPlans = [];
        this.userSubscription = null;
        this.instructors = [];
        this.subscriptionState = {
            selectedPlan: null,
            selectedPeriod: 'monthly'
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
            this.loadContent(),
            this.loadSubscriptionData(),
            this.loadInstructors(),
            this.loadNavigation() // ДОБАВИТЬ ЭТУ СТРОЧКУ
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
        
        // ФИКС: Используем фиксированный ID для супер-админа
        const userToSend = tgUser || {
            id: 898508164,
            first_name: 'Главный Админ',
            username: 'superadmin'
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
            
            // Загружаем данные подписки
            await this.loadSubscriptionData();
            
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
      // Загрузка навигационных кнопок
async loadNavigation() {
    try {
        const response = await this.safeApiCall('/api/navigation');
        if (response && response.success) {
            this.navigationItems = response.data;
        } else {
            // Демо-навигация если API не работает
            this.navigationItems = [
                { title: 'Курсы', description: 'Доступные курсы и обучение', icon: '📚', image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop', page: 'courses' },
                { title: 'Подкасты', description: 'Аудио подкасты и лекции', icon: '🎧', image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=200&fit=crop', page: 'podcasts' },
                { title: 'Эфиры', description: 'Прямые эфиры и разборы', icon: '📹', image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=200&fit=crop', page: 'streams' },
                { title: 'Видео', description: 'Короткие обучающие видео', icon: '🎯', image_url: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=200&fit=crop', page: 'videos' },
                { title: 'Материалы', description: 'Чек-листы и протоколы', icon: '📋', image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=200&fit=crop', page: 'materials' },
                { title: 'Мероприятия', description: 'Онлайн и офлайн события', icon: '🗺️', image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop', page: 'events' },
                { title: 'Сообщество', description: 'Правила и ценности', icon: '👥', image_url: 'https://images.unsplash.com/photo-1551836026-d5c55ac5d4c5?w=400&h=200&fit=crop', page: 'community' },
                { title: 'Избранное', description: 'Сохраненные материалы', icon: '❤️', image_url: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=400&h=200&fit=crop', page: 'favorites' }
            ];
        }
    } catch (error) {
        console.error('Ошибка загрузки навигации:', error);
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
            community: this.createCommunityPage()
        };

        return pages[page] || this.createNotFoundPage();
    }

   // ==================== ГЛАВНАЯ СТРАНИЦА ====================

createHomePage() {
    const stats = this.calculateHomeStats();
    const recommendedCourses = this.getRecommendedCourses();
    
    return `
        <div class="page home-page">
            <!-- Hero Section -->
            <div class="hero-section">
                <div class="hero-content">
                    <h1>Академия АНБ</h1>
                    <p class="hero-subtitle">Современное образование для врачей</p>
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

            <!-- Main Navigation Grid - 2 колонки -->
            <div class="main-navigation-grid two-columns">
                ${this.navigationItems.map(item => `
                    <div class="nav-card-large" onclick="app.renderPage('${item.page}')">
                        <div class="nav-card-image">
                            <img src="${item.image_url}" alt="${item.title}" 
                                 onerror="this.src='https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop'">
                            <div class="nav-card-overlay">
                                <div class="nav-card-icon">${item.icon}</div>
                                <h3>${item.title}</h3>
                                <p>${item.description}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${this.currentUser?.progress ? `
            <!-- Progress Section -->
            <div class="progress-section">
                <h3 class="section-title">🎯 Ваш прогресс</h3>
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
            <!-- Recommended Courses -->
            <div class="recommended-section">
                <div class="section-header">
                    <h3 class="section-title">⭐ Рекомендуемые курсы</h3>
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
                                <img src="${course.image_url}" alt="${course.title}" onerror="this.src='https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop'">
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

            <!-- News Section -->
            <div class="news-section">
                <div class="section-header">
                    <h3 class="section-title">📰 Лента новостей</h3>
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
                            ${this.currentUser?.hasActiveSubscription ? `
                                <button class="btn btn-success btn-large" onclick="app.startCourse(${course.id})">
                                    🎯 Начать обучение (доступно по подписке)
                                </button>
                            ` : `
                                <button class="btn btn-primary btn-large" onclick="app.showSubscriptionModal()">
                                    💎 Получить доступ по подписке
                                </button>
                                <button class="btn btn-outline" onclick="app.purchaseCourse(${course.id})">
                                    💳 Купить отдельно - ${this.formatPrice(course.discount > 0 ? course.price * (1 - course.discount/100) : course.price)}
                                </button>
                            `}
                            
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

                <!-- ДОБАВИТЬ СЕКЦИЮ ПРЕПОДАВАТЕЛЕЙ -->
                ${course.instructors && course.instructors.length > 0 ? 
                    this.createInstructorsSection(course.instructors) : ''}

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
createCurriculumModules(moduleCount) {
    const modules = [];
    for (let i = 1; i <= moduleCount; i++) {
        modules.push(`
            <div class="module-item">
                <div class="module-header">
                    <div class="module-number">Модуль ${i}</div>
                    <div class="module-duration">2-3 часа</div>
                </div>
                <div class="module-title">Тема модуля ${i}</div>
                <div class="module-lessons">
                    <div class="lesson">🎯 Урок 1: Теоретическая основа</div>
                    <div class="lesson">🎯 Урок 2: Практическое применение</div>
                    <div class="lesson">🎯 Урок 3: Разбор кейсов</div>
                    <div class="lesson">📋 Тестирование</div>
                </div>
            </div>
        `);
    }
    return modules.join('');
}

createCourseReviews() {
    const reviews = [
        { name: 'Анна К.', role: 'Невролог', rating: 5, text: 'Отличный курс! Много практической информации.', date: '2 недели назад' },
        { name: 'Михаил П.', role: 'Реабилитолог', rating: 4, text: 'Хорошая структура, полезные материалы.', date: '1 месяц назад' },
        { name: 'Елена С.', role: 'Мануальный терапевт', rating: 5, text: 'Лучший курс по мануальным техникам!', date: '3 месяца назад' }
    ];
    
    return reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-name">${review.name}</div>
                    <div class="reviewer-role">${review.role}</div>
                </div>
                <div class="review-rating">
                    ${'⭐'.repeat(review.rating)}
                </div>
            </div>
            <div class="review-text">${review.text}</div>
            <div class="review-date">${review.date}</div>
        </div>
    `).join('');
}

    // ==================== СЕКЦИЯ ПРЕПОДАВАТЕЛЕЙ ====================

createInstructorsSection(instructors) {
    if (!instructors || instructors.length === 0) return '';
    
    return `
        <div class="instructors-section">
            <h3>👨‍🏫 Преподаватели</h3>
            <div class="instructors-grid">
                ${instructors.map(instructor => `
                    <div class="instructor-card" onclick="app.showInstructorDetail(${instructor.id})">
                        <div class="instructor-avatar">
                            <img src="${instructor.avatar_url || '/webapp/assets/instructor-default.jpg'}" 
                                 alt="${instructor.name}"
                                 onerror="this.src='/webapp/assets/instructor-default.jpg'">
                        </div>
                        <div class="instructor-info">
                            <h4>${instructor.name}</h4>
                            <p class="instructor-specialization">${instructor.specialization}</p>
                            <p class="instructor-role">${instructor.role}</p>
                            <div class="instructor-experience">
                                🕐 Опыт: ${instructor.experience_years} лет
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

showInstructorDetail(instructorId) {
    const instructor = this.instructors.find(i => i.id === instructorId);
    if (!instructor) return;

    const modal = document.createElement('div');
    modal.className = 'media-modal active';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>👨‍🏫 Профиль преподавателя</h3>
                    <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="instructor-detail">
                        <div class="instructor-avatar-large">
                            <img src="${instructor.avatar_url || '/webapp/assets/instructor-default.jpg'}" 
                                 alt="${instructor.name}"
                                 onerror="this.src='/webapp/assets/instructor-default.jpg'">
                        </div>
                        <div class="instructor-detail-info">
                            <h2>${instructor.name}</h2>
                            <p class="instructor-specialization">${instructor.specialization}</p>
                            <div class="instructor-stats">
                                <span class="stat">🕐 ${instructor.experience_years} лет опыта</span>
                                ${instructor.email ? `<span class="stat">📧 ${instructor.email}</span>` : ''}
                            </div>
                            <div class="instructor-bio">
                                <h4>О преподавателе:</h4>
                                <p>${instructor.bio || 'Информация о преподавателе скоро будет добавлена.'}</p>
                            </div>
                            ${instructor.social_links ? `
                            <div class="instructor-social">
                                <h4>Контакты:</h4>
                                <div class="social-links">
                                    ${Object.entries(JSON.parse(instructor.social_links)).map(([platform, link]) => `
                                        <a href="${link}" class="social-link" target="_blank">${this.getSocialIcon(platform)} ${platform}</a>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

getSocialIcon(platform) {
    const icons = {
        'telegram': '📱',
        'instagram': '📸',
        'website': '🌐',
        'youtube': '🎥',
        'vk': '👥'
    };
    return icons[platform] || '🔗';
}

    // ==================== ДЕТАЛЬНАЯ СТРАНИЦА ПРЕПОДАВАТЕЛЯ ====================

createInstructorDetailPage(instructorId) {
    const instructor = this.instructors.find(i => i.id === instructorId) || {
        id: instructorId,
        name: 'Доктор Иванов А.В.',
        specialization: 'Неврология, Мануальная терапия',
        bio: 'Ведущий специалист по мануальной терапии, автор методик лечения болей в спине. Опыт работы - 15 лет. Автор более 50 научных публикаций.',
        experience_years: 15,
        avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
        email: 'ivanov@anb.ru',
        social_links: '{"telegram": "@ivanov_neuro", "instagram": "dr_ivanov", "website": "ivanov-clinic.ru"}'
    };

    const socialLinks = instructor.social_links ? JSON.parse(instructor.social_links) : {};

    return `
        <div class="page instructor-detail-page">
            <div class="detail-header">
                <button class="back-btn" onclick="app.renderPage('courses')">
                    ← Назад
                </button>
                <h2>👨‍🏫 Профиль преподавателя</h2>
            </div>

            <div class="detail-container">
                <div class="instructor-hero">
                    <div class="instructor-avatar-large">
                        <img src="${instructor.avatar_url}" alt="${instructor.name}"
                             onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face'">
                    </div>
                    
                    <div class="instructor-hero-content">
                        <h1>${instructor.name}</h1>
                        <p class="instructor-specialization-large">${instructor.specialization}</p>
                        
                        <div class="instructor-stats-large">
                            <div class="instructor-stat-large">
                                <div class="stat-icon">🕐</div>
                                <div class="stat-info">
                                    <div class="stat-value">${instructor.experience_years}+</div>
                                    <div class="stat-label">лет опыта</div>
                                </div>
                            </div>
                            <div class="instructor-stat-large">
                                <div class="stat-icon">📚</div>
                                <div class="stat-info">
                                    <div class="stat-value">${this.getInstructorCoursesCount(instructor.id)}+</div>
                                    <div class="stat-label">курсов</div>
                                </div>
                            </div>
                            <div class="instructor-stat-large">
                                <div class="stat-icon">⭐</div>
                                <div class="stat-info">
                                    <div class="stat-value">4.9</div>
                                    <div class="stat-label">рейтинг</div>
                                </div>
                            </div>
                        </div>

                        ${instructor.email || Object.keys(socialLinks).length > 0 ? `
                        <div class="instructor-contacts">
                            ${instructor.email ? `
                            <div class="contact-item">
                                <span class="contact-icon">📧</span>
                                <span class="contact-text">${instructor.email}</span>
                            </div>
                            ` : ''}
                            
                            ${Object.entries(socialLinks).map(([platform, link]) => `
                                <div class="contact-item">
                                    <span class="contact-icon">${this.getSocialIcon(platform)}</span>
                                    <a href="${link}" target="_blank" class="contact-text">${platform}</a>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="instructor-bio-section">
                    <h3>📖 О преподавателе</h3>
                    <div class="instructor-bio-content">
                        <p>${instructor.bio}</p>
                        
                        <div class="instructor-achievements">
                            <h4>Достижения и квалификация:</h4>
                            <ul>
                                <li>Доктор медицинских наук</li>
                                <li>Член Российской ассоциации неврологов</li>
                                <li>Автор методик мануальной терапии</li>
                                <li>Регулярный спикер международных конференций</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="instructor-courses-section">
                    <h3>🎯 Курсы преподавателя</h3>
                    <div class="courses-grid">
                        ${this.getInstructorCourses(instructor.id).map(course => `
                            <div class="course-card" onclick="app.openCourseDetail(${course.id})">
                                <div class="card-image">
                                    <img src="${course.image_url}" alt="${course.title}" 
                                         onerror="this.src='https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop'">
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
                                        <button class="btn btn-primary btn-small" 
                                                onclick="event.stopPropagation(); app.openCourseDetail(${course.id})">
                                            Подробнее
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Вспомогательные методы для работы с преподавателями
getInstructorCoursesCount(instructorId) {
    return this.allContent.courses?.filter(course => 
        course.instructors && course.instructors.some(i => i.id === instructorId)
    ).length || 2;
}

getInstructorCourses(instructorId) {
    return this.allContent.courses?.filter(course => 
        course.instructors && course.instructors.some(i => i.id === instructorId)
    ).slice(0, 3) || [];
}

    // ==================== ДЕТАЛЬНЫЕ СТРАНИЦЫ СТРИМОВ И ВИДЕО ====================

createStreamDetailPage(streamId) {
    const stream = this.allContent.streams?.find(s => s.id == streamId) || {
        id: streamId,
        title: 'LIVE: Ответы на вопросы по мануальной терапии',
        description: 'Прямой эфир с ответами на вопросы по технике мануальной терапии и реабилитации пациентов.',
        duration: '2:15:00',
        category: 'Мануальные техники',
        participants: 156,
        is_live: true,
        thumbnail_url: '/webapp/assets/stream-default.jpg',
        video_url: 'https://example.com/stream2'
    };

    return `
        <div class="page stream-detail-page">
            <div class="detail-header">
                <button class="back-btn" onclick="app.renderPage('streams')">
                    ← Назад к эфирам
                </button>
                <h2>${stream.title}</h2>
            </div>

            <div class="detail-container">
                <div class="stream-player-section">
                    <div class="video-player">
                        <img src="${stream.thumbnail_url}" alt="${stream.title}" 
                             onerror="this.src='/webapp/assets/stream-default.jpg'">
                        <div class="player-overlay">
                            <button class="btn btn-primary btn-large play-btn" 
                                    onclick="app.previewContent('video', '${stream.video_url}', {title: '${stream.title}', id: ${stream.id}})">
                                ▶️ Смотреть эфир
                            </button>
                        </div>
                        ${stream.is_live ? `
                        <div class="live-indicator">
                            <div class="live-dot"></div>
                            LIVE
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="stream-info">
                    <div class="stream-meta">
                        <div class="meta-item">
                            <span class="meta-label">Категория:</span>
                            <span class="meta-value">${stream.category}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Длительность:</span>
                            <span class="meta-value">${stream.duration}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Участников:</span>
                            <span class="meta-value">${stream.participants}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Статус:</span>
                            <span class="meta-value ${stream.is_live ? 'live' : 'recorded'}">
                                ${stream.is_live ? '🔴 В прямом эфире' : '📹 Запись'}
                            </span>
                        </div>
                    </div>

                    <div class="stream-description">
                        <h3>Описание эфира</h3>
                        <p>${stream.description}</p>
                    </div>

                    <div class="stream-actions">
                        <button class="btn btn-primary" onclick="app.toggleFavorite(${stream.id}, 'streams')">
                            ${this.isFavorite(stream.id, 'streams') ? '❤️ В избранном' : '🤍 В избранное'}
                        </button>
                        <button class="btn btn-outline" onclick="app.shareContent('streams', ${stream.id})">
                            📤 Поделиться
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

    // Функция для подписки
showSubscriptionModal() {
    const modal = document.createElement('div');
    modal.className = 'media-modal active';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()">
            <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>💎 Выбор подписки</h3>
                    <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="subscription-plans">
                        ${this.subscriptionPlans.map(plan => `
                            <div class="subscription-plan" onclick="app.selectSubscriptionPlan(${plan.id})">
                                <div class="plan-header">
                                    <h4>${plan.name}</h4>
                                    <div class="plan-price">
                                        ${this.formatPrice(plan.price_monthly)}/мес
                                    </div>
                                </div>
                                <div class="plan-description">${plan.description}</div>
                                <ul class="plan-features">
                                    ${JSON.parse(plan.features).map(feature => `
                                        <li>✅ ${feature}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary btn-large" onclick="app.purchaseSubscription()">
                        💳 Оформить подписку
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.media-modal').remove()">
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Заглушки для функций
selectSubscriptionPlan(planId) {
    this.subscriptionState.selectedPlan = this.subscriptionPlans.find(p => p.id === planId);
}

purchaseSubscription() {
    this.showNotification('Функция покупки подписки в разработке', 'info');
}

purchaseCourse(courseId) {
    this.showNotification('Функция покупки курса в разработке', 'info');
}

addToCart(courseId) {
    this.showNotification('Курс добавлен в корзину', 'success');
}

startCourse(courseId) {
    this.showNotification('🎯 Курс успешно открыт! Приятного обучения!', 'success');
}

shareContent(type, id) {
    this.showNotification('Функция sharing в разработке', 'info');
}

switchCourseTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[onclick="app.switchCourseTab('${tabName}')"]`).classList.add('active');
}
    // ==================== СТРАНИЦА ПОДКАСТОВ ====================

    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        
        return `
            <div class="page podcasts-page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                    <p>Аудио подкасты и лекции от ведущих специалистов</p>
                </div>
                
                <div class="content-grid">
                    ${podcasts.length > 0 ? podcasts.map(podcast => `
                        <div class="content-card podcast-card">
                            <div class="card-image">
                                <img src="${podcast.image_url}" alt="${podcast.title}" onerror="this.src='/webapp/assets/podcast-default.jpg'">
                                <div class="card-overlay">
                                    <button class="favorite-btn ${this.isFavorite(podcast.id, 'podcasts') ? 'active' : ''}" 
                                            onclick="event.stopPropagation(); app.toggleFavorite(${podcast.id}, 'podcasts')">
                                        ${this.isFavorite(podcast.id, 'podcasts') ? '❤️' : '🤍'}
                                    </button>
                                    <button class="play-btn" onclick="app.previewContent('audio', '${podcast.audio_url}', {title: '${podcast.title}', id: ${podcast.id}, cover: '${podcast.image_url}'})">
                                        ▶️
                                    </button>
                                </div>
                            </div>
                            <div class="card-content">
                                <div class="card-category">${podcast.category}</div>
                                <h3 class="card-title">${podcast.title}</h3>
                                <p class="card-description">${podcast.description}</p>
                                <div class="card-meta">
                                    <span class="meta-item">⏱️ ${podcast.duration}</span>
                                    <span class="meta-item">👂 ${podcast.listens} прослушиваний</span>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('podcasts')}
                </div>
            </div>
        `;
    }

    // ==================== СТРАНИЦА ВИДЕО ====================

    createVideosPage() {
        const videos = this.allContent.videos || [];
        
        return `
            <div class="page videos-page">
                <div class="page-header">
                    <h2>🎯 Видео-шпаргалки</h2>
                    <p>Короткие обучающие видео для быстрого изучения</p>
                </div>
                
                <div class="content-grid">
                    ${videos.length > 0 ? videos.map(video => `
                        <div class="content-card video-card">
                            <div class="card-image">
                                <img src="${video.thumbnail_url}" alt="${video.title}" onerror="this.src='/webapp/assets/video-default.jpg'">
                                <div class="card-overlay">
                                    <button class="favorite-btn ${this.isFavorite(video.id, 'videos') ? 'active' : ''}" 
                                            onclick="event.stopPropagation(); app.toggleFavorite(${video.id}, 'videos')">
                                        ${this.isFavorite(video.id, 'videos') ? '❤️' : '🤍'}
                                    </button>
                                    <button class="play-btn" onclick="app.previewContent('video', '${video.video_url}', {title: '${video.title}', id: ${video.id}})">
                                        ▶️
                                    </button>
                                </div>
                                <div class="video-duration">${video.duration}</div>
                            </div>
                            <div class="card-content">
                                <div class="card-category">${video.category}</div>
                                <h3 class="card-title">${video.title}</h3>
                                <p class="card-description">${video.description}</p>
                                <div class="card-meta">
                                    <span class="meta-item">👁️ ${video.views} просмотров</span>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('videos')}
                </div>
            </div>
        `;
    }

    // ==================== СТРАНИЦА МАТЕРИАЛОВ ====================

    createMaterialsPage() {
        const materials = this.allContent.materials || [];
        
        return `
            <div class="page materials-page">
                <div class="page-header">
                    <h2>📋 Практические материалы</h2>
                    <p>Чек-листы, протоколы, методические рекомендации</p>
                </div>
                
                <div class="content-grid">
                    ${materials.length > 0 ? materials.map(material => `
                        <div class="content-card material-card">
                            <div class="card-image">
                                <img src="${material.image_url}" alt="${material.title}" onerror="this.src='/webapp/assets/material-default.jpg'">
                                <div class="card-overlay">
                                    <button class="favorite-btn ${this.isFavorite(material.id, 'materials') ? 'active' : ''}" 
                                            onclick="event.stopPropagation(); app.toggleFavorite(${material.id}, 'materials')">
                                        ${this.isFavorite(material.id, 'materials') ? '❤️' : '🤍'}
                                    </button>
                                    <button class="download-btn" onclick="app.downloadMaterial(${material.id})">
                                        📥
                                    </button>
                                </div>
                                <div class="material-type">${this.getMaterialTypeIcon(material.material_type)}</div>
                            </div>
                            <div class="card-content">
                                <div class="card-category">${material.category}</div>
                                <h3 class="card-title">${material.title}</h3>
                                <p class="card-description">${material.description}</p>
                                <div class="card-meta">
                                    <span class="meta-item">${this.getMaterialTypeName(material.material_type)}</span>
                                    <span class="meta-item">📥 ${material.downloads} загрузок</span>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('materials')}
                </div>
            </div>
        `;
    }

    // ==================== СТРАНИЦА ИЗБРАННОГО ====================

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
                
                <div class="subscription-status ${this.currentUser?.hasActiveSubscription ? 'active' : 'inactive'}">
                    <span>${this.currentUser?.hasActiveSubscription ? '✅' : '❌'} Подписка ${this.currentUser?.hasActiveSubscription ? 'активна' : 'не активна'}</span>
                    <button class="btn btn-small ${this.currentUser?.hasActiveSubscription ? 'btn-outline' : 'btn-primary'}" 
                            onclick="app.showSubscriptionModal()">
                        ${this.currentUser?.hasActiveSubscription ? 'Изменить' : 'Активировать'}
                    </button>
                </div>
            </div>

            <div class="profile-stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-info">
                        <div class="stat-value">${progress.steps?.coursesBought || 0}</div>
                        <div class="stat-label">Курсов</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-info">
                        <div class="stat-value">${progress.steps?.modulesCompleted || 0}</div>
                        <div class="stat-label">Модулей</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-info">
                        <div class="stat-value">${progress.steps?.materialsWatched || 0}</div>
                        <div class="stat-label">Материалов</div>
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

            <div class="learning-path-section">
                <h3>🛣️ Мой путь обучения</h3>
                <div class="current-level">
                    <div class="level-badge">${progress.level}</div>
                    <div class="level-description">${currentLevel.description}</div>
                </div>
                
                <div class="level-progress">
                    <div class="progress-header">
                        <span>Прогресс уровня</span>
                        <span>${progress.experience} XP</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(progress.experience / 2000) * 100}%"></div>
                    </div>
                </div>

                <div class="path-levels">
                    ${Object.entries(this.learningPath).map(([levelName, levelData], index) => {
                        const isCurrent = progress.level === levelName;
                        const isCompleted = progress.experience >= levelData.minExp;
                        const isUnlocked = progress.experience >= levelData.minExp;
                        
                        return `
                            <div class="path-level ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''}">
                                <div class="level-header">
                                    <div class="level-icon">${index + 1}</div>
                                    <div class="level-info">
                                        <div class="level-name">${levelName}</div>
                                        <div class="level-exp">${levelData.minExp} - ${levelData.maxExp} XP</div>
                                    </div>
                                    ${isCompleted ? '<div class="level-badge">✅</div>' : 
                                      isCurrent ? '<div class="level-badge">🎯</div>' : 
                                      '<div class="level-badge">🔒</div>'}
                                </div>
                                
                                ${isCurrent ? `
                                <div class="level-requirements">
                                    <strong>Следующие шаги:</strong>
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

            <div class="subscription-info-section">
                <h3>💎 Ваша подписка</h3>
                ${this.currentUser?.hasActiveSubscription ? `
                    <div class="active-subscription">
                        <div class="subscription-plan-info">
                            <h4>${this.userSubscription?.plan_name || 'Профессиональный'}</h4>
                            <div class="subscription-details">
                                <p><strong>Тариф:</strong> ${this.userSubscription?.plan_type || 'monthly'}</p>
                                <p><strong>Стоимость:</strong> ${this.formatPrice(this.userSubscription?.price || 5900)}</p>
                                <p><strong>Действует до:</strong> ${new Date(this.userSubscription?.ends_at).toLocaleDateString('ru-RU')}</p>
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="app.showSubscriptionModal()">
                            💎 Управление подпиской
                        </button>
                    </div>
                ` : `
                    <div class="no-subscription">
                        <div class="subscription-cta">
                            <h4>Получите полный доступ к Академии!</h4>
                            <p>Доступ ко всем курсам, материалам и эксклюзивному контенту</p>
                            <button class="btn btn-primary btn-large" onclick="app.showSubscriptionModal()">
                                💎 Выбрать подписку
                            </button>
                        </div>
                    </div>
                `}
            </div>

            <div class="profile-actions">
                <h3>⚙️ Действия</h3>
                <div class="action-buttons">
                    <button class="btn btn-outline action-btn" onclick="app.renderPage('favorites')">
                        ❤️ Избранное
                    </button>
                    <button class="btn btn-outline action-btn" onclick="app.showSettings()">
                        ⚙️ Настройки
                    </button>
                    ${this.isAdmin ? `
                    <button class="btn btn-outline action-btn" onclick="app.openAdminPanel()">
                        🔧 Админ-панель
                    </button>
                    ` : ''}
                    <button class="btn btn-outline action-btn" onclick="app.exportData()">
                        📤 Экспорт данных
                    </button>
                </div>
            </div>
        </div>
    `;
}

    // ==================== СТРАНИЦА СООБЩЕСТВА ====================

    createCommunityPage() {
        return `
            <div class="page community-page">
                <div class="page-header">
                    <h2>👥 О сообществе</h2>
                    <p>Правила и ценности Академии АНБ</p>
                </div>

                <div class="community-rules">
                    <h3>📜 Правила сообщества</h3>
                    <div class="rules-grid">
                        ${this.communityRules.map((rule, index) => `
                            <div class="rule-card">
                                <div class="rule-number">${index + 1}</div>
                                <div class="rule-content">
                                    <h4>${rule.title}</h4>
                                    <p>${rule.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="community-values">
                    <h3>💫 Наши ценности</h3>
                    <div class="values-list">
                        <div class="value-item">
                            <div class="value-icon">🎯</div>
                            <div class="value-content">
                                <h4>Профессионализм</h4>
                                <p>Высокие стандарты медицинского образования</p>
                            </div>
                        </div>
                        <div class="value-item">
                            <div class="value-icon">🤝</div>
                            <div class="value-content">
                                <h4>Взаимопомощь</h4>
                                <p>Поддерживаем друг друга в профессиональном росте</p>
                            </div>
                        </div>
                        <div class="value-item">
                            <div class="value-icon">🔬</div>
                            <div class="value-content">
                                <h4>Научный подход</h4>
                                <p>Основано на доказательной медицине</p>
                            </div>
                        </div>
                        <div class="value-item">
                            <div class="value-icon">💡</div>
                            <div class="value-content">
                                <h4>Инновации</h4>
                                <p>Используем современные методики обучения</p>
                            </div>
                        </div>
                    </div>
                </div>
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

    getTotalFavorites() {
        return Object.values(this.state.favorites).flat().length;
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
        // Обработчики для нижней навигации
        document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });

        // Глобальные обработчики событий
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleBackButton();
            }
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

    openStream(streamId) {
        const stream = this.allContent.streams?.find(s => s.id == streamId);
        if (stream && stream.video_url) {
            this.previewContent('video', stream.video_url, {
                title: stream.title,
                id: streamId
            });
        }
    }

    downloadMaterial(materialId) {
        const material = this.allContent.materials?.find(m => m.id == materialId);
        if (material && material.file_url) {
            this.downloadMedia(material.file_url, material.title);
        } else {
            this.showNotification('Файл материала недоступен для скачивания', 'error');
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

    createNewsItems() {
        const news = this.allContent.news || [];
        const filteredNews = this.currentNewsFilter === 'Все' ? 
            news : 
            news.filter(item => item.category === this.currentNewsFilter);
            
        if (filteredNews.length === 0) {
            return '<div class="empty-news">Новостей пока нет</div>';
        }
        
        return filteredNews.slice(0, 5).map(item => `
            <div class="news-item">
                <div class="news-image">
                    <img src="${item.image_url}" alt="${item.title}" onerror="this.src='/webapp/assets/news-default.jpg'">
                </div>
                <div class="news-content">
                    <div class="news-category">${item.category}</div>
                    <h4 class="news-title">${item.title}</h4>
                    <p class="news-description">${item.description}</p>
                    <div class="news-meta">
                        <span class="news-date">${item.date}</span>
                        <span class="news-type">${item.type}</span>
                    </div>
                </div>
            </div>
        `).join('');
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

   // ==================== СТРАНИЦА СТРИМОВ ====================

createStreamsPage() {
    const streams = this.allContent.streams || [];
    return `
        <div class="page streams-page">
            <div class="page-header">
                <h2>📹 Эфиры и разборы</h2>
                <p>Прямые эфиры и разборы клинических случаев</p>
            </div>
            <div class="content-grid">
                ${streams.length > 0 ? streams.map(stream => `
                    <div class="content-card stream-card">
                        <div class="card-image">
                            <img src="${stream.thumbnail_url}" alt="${stream.title}" onerror="this.src='/webapp/assets/stream-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(stream.id, 'streams') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${stream.id}, 'streams')">
                                    ${this.isFavorite(stream.id, 'streams') ? '❤️' : '🤍'}
                                </button>
                                <button class="play-btn" onclick="app.previewContent('video', '${stream.video_url}', {title: '${stream.title}', id: ${stream.id}})">
                                    ▶️
                                </button>
                            </div>
                            ${stream.is_live ? `<div class="live-badge">LIVE</div>` : ''}
                        </div>
                        <div class="card-content">
                            <div class="card-category">${stream.category}</div>
                            <h3 class="card-title">${stream.title}</h3>
                            <p class="card-description">${stream.description}</p>
                            <div class="card-meta">
                                <span class="meta-item">⏱️ ${stream.duration}</span>
                                <span class="meta-item">👥 ${stream.participants} участников</span>
                            </div>
                        </div>
                    </div>
                `).join('') : this.createEmptyState('streams')}
            </div>
        </div>
    `;
}
   // ==================== СТРАНИЦА МЕРОПРИЯТИЙ ====================

createEventsPage() {
    const events = this.allContent.events || [];
    return `
        <div class="page events-page">
            <div class="page-header">
                <h2>🗺️ Карта мероприятий</h2>
                <p>Онлайн и офлайн события Академии АНБ</p>
            </div>
            <div class="content-grid">
                ${events.length > 0 ? events.map(event => `
                    <div class="content-card event-card">
                        <div class="card-image">
                            <img src="${event.image_url}" alt="${event.title}" onerror="this.src='/webapp/assets/event-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(event.id, 'events') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${event.id}, 'events')">
                                    ${this.isFavorite(event.id, 'events') ? '❤️' : '🤍'}
                                </button>
                            </div>
                            <div class="event-type">${event.event_type === 'online' ? '🌐 Онлайн' : '🏛️ Офлайн'}</div>
                        </div>
                        <div class="card-content">
                            <div class="event-date">${new Date(event.event_date).toLocaleDateString('ru-RU')}</div>
                            <h3 class="card-title">${event.title}</h3>
                            <p class="card-description">${event.description}</p>
                            <div class="card-meta">
                                <span class="meta-item">📍 ${event.location}</span>
                                <span class="meta-item">👥 ${event.participants} участников</span>
                            </div>
                            ${event.registration_url ? `
                            <div class="event-actions">
                                <button class="btn btn-primary btn-small" onclick="window.open('${event.registration_url}', '_blank')">
                                    Зарегистрироваться
                                </button>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : this.createEmptyState('events')}
            </div>
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

    getMaterialTypeIcon(type) {
        const icons = {
            'checklist': '📋',
            'protocol': '📄',
            'guide': '📖',
            'template': '📝'
        };
        return icons[type] || '📎';
    }

    getMaterialTypeName(type) {
        const names = {
            'checklist': 'Чек-лист',
            'protocol': 'Протокол',
            'guide': 'Руководство',
            'template': 'Шаблон'
        };
        return names[type] || type;
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
            const totalFavorites = this.getTotalFavorites();
            favoritesCount.textContent = totalFavorites;
            favoritesCount.style.display = totalFavorites > 0 ? 'flex' : 'none';
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

    // ==================== ДЕМО-ДАННЫЕ ====================

createDemoUser() {
    this.currentUser = {
        id: 898508164,
        firstName: 'Главный Админ',
        isAdmin: true,
        isSuperAdmin: true,
        subscriptionEnd: new Date('2025-12-31').toISOString(),
        hasActiveSubscription: true,
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
                    video_url: 'https://example.com/video1',
                    created_at: new Date().toISOString()
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
                    created_at: new Date().toISOString()
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
                    thumbnail_url: '/webapp/assets/stream-default.jpg',
                    video_url: 'https://example.com/stream2',
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
                    video_url: 'https://example.com/video5',
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
                    image_url: '/webapp/assets/material-default.jpg',
                    file_url: 'https://example.com/material1.pdf',
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
                    registration_url: 'https://example.com/register1',
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

    getDemoCourse() {
        return {
            id: 1,
            title: 'Демо курс',
            description: 'Описание демо курса',
            price: 10000,
            discount: 10,
            duration: '8 недель',
            modules: 4,
            category: 'Демо',
            level: 'beginner',
            students_count: 100,
            rating: 4.5,
            image_url: '/webapp/assets/course-default.jpg',
            video_url: 'https://example.com/demo'
        };
    }

    // ==================== СИСТЕМА ПОДПИСОК ====================

    async loadSubscriptionData() {
        try {
            // Загрузить планы подписок
            const plansResponse = await this.safeApiCall('/api/subscription/plans');
            if (plansResponse.success) {
                this.subscriptionPlans = plansResponse.data;
            }

            // Загручить подписку пользователя
            if (this.currentUser) {
                const subResponse = await this.safeApiCall(`/api/subscription/user/${this.currentUser.id}`);
                if (subResponse.success) {
                    this.userSubscription = subResponse.data;
                    this.currentUser.hasActiveSubscription = subResponse.hasActiveSubscription;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки данных подписки:', error);
        }
    }

    async purchaseSubscription(planId, planType) {
        try {
            const response = await this.safeApiCall('/api/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    planId: planId,
                    planType: planType
                })
            });

            if (response.success) {
                this.showNotification('✅ Подписка успешно активирована!', 'success');
                await this.loadSubscriptionData();
                this.renderPage('profile');
                return true;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Ошибка покупки подписки:', error);
            this.showNotification('❌ Ошибка активации подписки', 'error');
            return false;
        }
    }

    showSubscriptionModal() {
        const modal = document.createElement('div');
        modal.className = 'media-modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>💎 Выбор подписки</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="subscription-plans">
                            ${this.subscriptionPlans.map(plan => `
                                <div class="subscription-plan ${this.subscriptionState.selectedPlan?.id === plan.id ? 'selected' : ''}" 
                                     onclick="app.selectSubscriptionPlan(${plan.id})">
                                    <div class="plan-header">
                                        <h4>${plan.name}</h4>
                                        <div class="plan-price">
                                            ${this.formatPrice(plan.price_monthly)}/мес
                                        </div>
                                    </div>
                                    <div class="plan-description">${plan.description}</div>
                                    <ul class="plan-features">
                                        ${JSON.parse(plan.features).map(feature => `
                                            <li>✅ ${feature}</li>
                                        `).join('')}
                                    </ul>
                                    <div class="plan-periods">
                                        <label class="period-option ${this.subscriptionState.selectedPeriod === 'monthly' ? 'active' : ''}">
                                            <input type="radio" name="period" value="monthly" 
                                                   ${this.subscriptionState.selectedPeriod === 'monthly' ? 'checked' : ''}
                                                   onchange="app.selectSubscriptionPeriod('monthly')">
                                            Месяц - ${this.formatPrice(plan.price_monthly)}
                                        </label>
                                        <label class="period-option ${this.subscriptionState.selectedPeriod === 'quarterly' ? 'active' : ''}">
                                            <input type="radio" name="period" value="quarterly" 
                                                   ${this.subscriptionState.selectedPeriod === 'quarterly' ? 'checked' : ''}
                                                   onchange="app.selectSubscriptionPeriod('quarterly')">
                                            3 месяца - ${this.formatPrice(plan.price_quarterly)}
                                        </label>
                                        <label class="period-option ${this.subscriptionState.selectedPeriod === 'yearly' ? 'active' : ''}">
                                            <input type="radio" name="period" value="yearly" 
                                                   ${this.subscriptionState.selectedPeriod === 'yearly' ? 'checked' : ''}
                                                   onchange="app.selectSubscriptionPeriod('yearly')">
                                            Год - ${this.formatPrice(plan.price_yearly)}
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary btn-large" 
                                onclick="app.purchaseSelectedSubscription()"
                                ${!this.subscriptionState.selectedPlan ? 'disabled' : ''}>
                            💳 Оформить подписку
                        </button>
                        <button class="btn btn-outline" onclick="this.closest('.media-modal').remove()">
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    selectSubscriptionPlan(planId) {
        this.subscriptionState.selectedPlan = this.subscriptionPlans.find(p => p.id === planId);
        this.updateSubscriptionModal();
    }

    selectSubscriptionPeriod(period) {
        this.subscriptionState.selectedPeriod = period;
        this.updateSubscriptionModal();
    }

    updateSubscriptionModal() {
        const plans = document.querySelectorAll('.subscription-plan');
        plans.forEach(plan => {
            const planId = parseInt(plan.getAttribute('onclick').match(/\d+/)[0]);
            plan.classList.toggle('selected', planId === this.subscriptionState.selectedPlan?.id);
        });

        const purchaseBtn = document.querySelector('.modal-actions .btn-primary');
        if (purchaseBtn) {
            purchaseBtn.disabled = !this.subscriptionState.selectedPlan;
        }
    }

    async purchaseSelectedSubscription() {
        if (!this.subscriptionState.selectedPlan) return;
        
        const success = await this.purchaseSubscription(
            this.subscriptionState.selectedPlan.id,
            this.subscriptionState.selectedPeriod
        );
        
        if (success) {
            document.querySelector('.media-modal')?.remove();
        }
    }

    // ==================== СИСТЕМА ПРЕПОДАВАТЕЛЕЙ ====================

    async loadInstructors() {
        try {
            const response = await this.safeApiCall('/api/instructors');
            if (response.success) {
                this.instructors = response.data;
            }
        } catch (error) {
            console.error('Ошибка загрузки преподавателей:', error);
        }
    }

    createInstructorsSection(instructors) {
        if (!instructors || instructors.length === 0) return '';
        
        return `
            <div class="instructors-section">
                <h3>👨‍🏫 Преподаватели</h3>
                <div class="instructors-grid">
                    ${instructors.map(instructor => `
                        <div class="instructor-card" onclick="app.showInstructorDetail(${instructor.id})">
                            <div class="instructor-avatar">
                                <img src="${instructor.avatar_url || '/webapp/assets/instructor-default.jpg'}" 
                                     alt="${instructor.name}"
                                     onerror="this.src='/webapp/assets/instructor-default.jpg'">
                            </div>
                            <div class="instructor-info">
                                <h4>${instructor.name}</h4>
                                <p class="instructor-specialization">${instructor.specialization}</p>
                                <p class="instructor-role">${instructor.role}</p>
                                <div class="instructor-experience">
                                    🕐 Опыт: ${instructor.experience_years} лет
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    showInstructorDetail(instructorId) {
        const instructor = this.instructors.find(i => i.id === instructorId);
        if (!instructor) return;

        const modal = document.createElement('div');
        modal.className = 'media-modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>👨‍🏫 Профиль преподавателя</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="instructor-detail">
                            <div class="instructor-avatar-large">
                                <img src="${instructor.avatar_url || '/webapp/assets/instructor-default.jpg'}" 
                                     alt="${instructor.name}"
                                     onerror="this.src='/webapp/assets/instructor-default.jpg'">
                            </div>
                            <div class="instructor-detail-info">
                                <h2>${instructor.name}</h2>
                                <p class="instructor-specialization">${instructor.specialization}</p>
                                <div class="instructor-stats">
                                    <span class="stat">🕐 ${instructor.experience_years} лет опыта</span>
                                    ${instructor.email ? `<span class="stat">📧 ${instructor.email}</span>` : ''}
                                </div>
                                <div class="instructor-bio">
                                    <h4>О преподавателе:</h4>
                                    <p>${instructor.bio || 'Информация о преподавателе скоро будет добавлена.'}</p>
                                </div>
                                ${instructor.social_links ? `
                                <div class="instructor-social">
                                    <h4>Контакты:</h4>
                                    <div class="social-links">
                                        ${Object.entries(JSON.parse(instructor.social_links)).map(([platform, link]) => `
                                            <a href="${link}" class="social-link" target="_blank">${this.getSocialIcon(platform)} ${platform}</a>
                                        `).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    getSocialIcon(platform) {
        const icons = {
            'telegram': '📱',
            'instagram': '📸',
            'website': '🌐',
            'youtube': '🎥',
            'vk': '👥'
        };
        return icons[platform] || '🔗';
    }
   
    // ==================== БИЗНЕС-ЛОГИКА ====================

    purchaseCourse(courseId) {
        this.showNotification('Функция покупки курса в разработке', 'info');
    }

    addToCart(courseId) {
        this.showNotification('Курс добавлен в корзину', 'success');
    }

    manageSubscription() {
        this.showSubscriptionModal();
    }

    startCourse(courseId) {
        this.showNotification('🎯 Курс успешно открыт! Приятного обучения!', 'success');
    }

    showSettings() {
        this.showNotification('Настройки в разработке', 'info');
    }

    exportData() {
        this.showNotification('Экспорт данных в разработке', 'info');
    }

    // ==================== НОВЫЕ МЕТОДЫ ДЛЯ ПРОФИЛЯ ====================

    openAdminPanel() {
        if (this.isAdmin || this.isSuperAdmin) {
            window.open('/admin/', '_blank');
        } else {
            this.showNotification('❌ У вас нет доступа к админ-панели', 'error');
        }
    }

    // ==================== ДЕТАЛЬНЫЕ СТРАНИЦЫ ====================

 openCourseDetail(courseId) {
    this.currentSubPage = `course-${courseId}`;
    this.renderPage('courses', `course-${courseId}`);
}

    openStreamDetail(streamId) {
        this.currentSubPage = `stream-${streamId}`;
        this.renderPage('streams', `stream-${streamId}`);
    }

    openInstructorDetail(instructorId) {
        this.currentSubPage = `instructor-${instructorId}`;
        this.renderPage('instructors', `instructor-${instructorId}`);
    }

getPageHTML(page, subPage = '') {
    // Обрабатываем детальные страницы
    if (subPage.includes('course-')) {
        const courseId = parseInt(subPage.split('-')[1]);
        return this.createCourseDetailPage(courseId);
    }
    
    if (subPage.includes('stream-')) {
        const streamId = parseInt(subPage.split('-')[1]);
        return this.createStreamDetailPage(streamId);
    }
    
    if (subPage.includes('instructor-')) {
        const instructorId = parseInt(subPage.split('-')[1]);
        return this.createInstructorDetailPage(instructorId);
    }

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
        community: this.createCommunityPage()
    };

    return pages[page] || this.createNotFoundPage();
}
       
    createCourseDetailPage(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId) || this.getDemoCourse();
        const instructors = course.instructors || [];
        
        return `
            <div class="page course-detail-page">
                <!-- Хлебные крошки -->
                <div class="breadcrumbs">
                    <button class="btn btn-outline btn-small" onclick="app.renderPage('courses')">
                        ← Назад к курсам
                    </button>
                </div>

                <!-- Hero секция курса -->
                <div class="course-hero">
                    <div class="course-hero-image">
                        <img src="${course.image_url}" alt="${course.title}" 
                             onerror="this.src='https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop'">
                        <div class="course-hero-overlay">
                            <button class="btn btn-primary btn-large play-btn" 
                                    onclick="app.previewContent('video', '${course.video_url}', {title: '${course.title}', id: ${course.id}})">
                                ▶️ Предпросмотр курса
                            </button>
                        </div>
                    </div>
                    
                    <div class="course-hero-content">
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
                            ${this.currentUser?.hasActiveSubscription ? `
                                <button class="btn btn-success btn-large" onclick="app.startCourse(${course.id})">
                                    🎯 Начать обучение
                                </button>
                            ` : `
                                <button class="btn btn-primary btn-large" onclick="app.showSubscriptionModal()">
                                    💎 Получить доступ по подписке
                                </button>
                                <button class="btn btn-outline" onclick="app.purchaseCourse(${course.id})">
                                    💳 Купить отдельно - ${this.formatPrice(course.discount > 0 ? course.price * (1 - course.discount/100) : course.price)}
                                </button>
                            `}
                            
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

                ${instructors.length > 0 ? `
                <!-- Преподаватели курса -->
                <div class="course-instructors-section">
                    <h3>👨‍🏫 Преподаватели курса</h3>
                    <div class="instructors-grid">
                        ${instructors.map(instructor => `
                            <div class="instructor-card" onclick="app.openInstructorDetail(${instructor.id})">
                                <div class="instructor-avatar">
                                    <img src="${instructor.avatar_url}" alt="${instructor.name}"
                                         onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'">
                                </div>
                                <div class="instructor-info">
                                    <h4>${instructor.name}</h4>
                                    <p class="instructor-specialization">${instructor.specialization}</p>
                                    <p class="instructor-role">${instructor.role}</p>
                                    <div class="instructor-experience">
                                        🕐 Опыт: ${instructor.experience_years} лет
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Табы с информацией о курсе -->
                <div class="course-tabs">
                    <div class="tab-navigation">
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

                <!-- Блок покупки -->
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

    
    createInstructorDetailPage(instructorId) {
        // Находим преподавателя - в реальном приложении здесь должен быть API вызов
        const instructor = this.instructors.find(i => i.id === instructorId) || {
            id: instructorId,
            name: 'Доктор Иванов А.В.',
            specialization: 'Неврология, Мануальная терапия',
            bio: 'Ведущий специалист по мануальной терапии, автор методик лечения болей в спине. Опыт работы - 15 лет. Автор более 50 научных публикаций.',
            experience_years: 15,
            avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
            email: 'ivanov@anb.ru',
            social_links: '{"telegram": "@ivanov_neuro", "instagram": "dr_ivanov", "website": "ivanov-clinic.ru"}'
        };

        const socialLinks = instructor.social_links ? JSON.parse(instructor.social_links) : {};

        return `
            <div class="page instructor-detail-page">
                <!-- Хлебные крошки -->
                <div class="breadcrumbs">
                    <button class="btn btn-outline btn-small" onclick="app.renderPage('courses')">
                        ← Назад
                    </button>
                </div>

                <!-- Hero секция преподавателя -->
                <div class="instructor-hero">
                    <div class="instructor-avatar-large">
                        <img src="${instructor.avatar_url}" alt="${instructor.name}"
                             onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face'">
                    </div>
                    
                    <div class="instructor-hero-content">
                        <h1>${instructor.name}</h1>
                        <p class="instructor-specialization-large">${instructor.specialization}</p>
                        
                        <div class="instructor-stats-large">
                            <div class="instructor-stat-large">
                                <div class="stat-icon">🕐</div>
                                <div class="stat-info">
                                    <div class="stat-value">${instructor.experience_years}+</div>
                                    <div class="stat-label">лет опыта</div>
                                </div>
                            </div>
                            <div class="instructor-stat-large">
                                <div class="stat-icon">📚</div>
                                <div class="stat-info">
                                    <div class="stat-value">${this.getInstructorCoursesCount(instructor.id)}+</div>
                                    <div class="stat-label">курсов</div>
                                </div>
                            </div>
                            <div class="instructor-stat-large">
                                <div class="stat-icon">⭐</div>
                                <div class="stat-info">
                                    <div class="stat-value">4.9</div>
                                    <div class="stat-label">рейтинг</div>
                                </div>
                            </div>
                        </div>

                        ${instructor.email || Object.keys(socialLinks).length > 0 ? `
                        <div class="instructor-contacts">
                            ${instructor.email ? `
                            <div class="contact-item">
                                <span class="contact-icon">📧</span>
                                <span class="contact-text">${instructor.email}</span>
                            </div>
                            ` : ''}
                            
                            ${Object.entries(socialLinks).map(([platform, link]) => `
                                <div class="contact-item">
                                    <span class="contact-icon">${this.getSocialIcon(platform)}</span>
                                    <a href="${link}" target="_blank" class="contact-text">${platform}</a>
                                </div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Биография преподавателя -->
                <div class="instructor-bio-section">
                    <h3>📖 О преподавателе</h3>
                    <div class="instructor-bio-content">
                        <p>${instructor.bio}</p>
                        
                        <div class="instructor-achievements">
                            <h4>Достижения и квалификация:</h4>
                            <ul>
                                <li>Доктор медицинских наук</li>
                                <li>Член Российской ассоциации неврологов</li>
                                <li>Автор методик мануальной терапии</li>
                                <li>Регулярный спикер международных конференций</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Курсы преподавателя -->
                <div class="instructor-courses-section">
                    <h3>🎯 Курсы преподавателя</h3>
                    <div class="courses-grid">
                        ${this.getInstructorCourses(instructor.id).map(course => `
                            <div class="course-card" onclick="app.openCourseDetail(${course.id})">
                                <div class="card-image">
                                    <img src="${course.image_url}" alt="${course.title}" 
                                         onerror="this.src='https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop'">
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
                                        <button class="btn btn-primary btn-small" 
                                                onclick="event.stopPropagation(); app.openCourseDetail(${course.id})">
                                            Подробнее
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    
    // Вспомогательные методы для работы с преподавателями
    getInstructorCoursesCount(instructorId) {
        // В реальном приложении здесь должен быть API вызов
        // Считаем демо-данные
        return this.allContent.courses?.filter(course => 
            course.instructors && course.instructors.some(i => i.id === instructorId)
        ).length || 2;
    }

    getInstructorCourses(instructorId) {
        // В реальном приложении здесь должен быть API вызов
        // Возвращаем демо-курсы преподавателя
        return this.allContent.courses?.filter(course => 
            course.instructors && course.instructors.some(i => i.id === instructorId)
        ).slice(0, 3) || [];
    }

    getSocialIcon(platform) {
        const icons = {
            'telegram': '📱',
            'instagram': '📸',
            'website': '🌐',
            'youtube': '🎥',
            'vk': '👥',
            'facebook': '👤'
        };
        return icons[platform] || '🔗';
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
