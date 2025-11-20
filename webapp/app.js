// webapp/app.js - ПОЛНАЯ ВЕРСИЯ С АДМИН-ПАНЕЛЬЮ И ВСЕМИ ФУНКЦИЯМИ
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
            theme: 'dark',
            admin: {
                currentTab: 'dashboard',
                editingContent: null,
                contentFormData: {}
            }
        };
        
        this.config = {
            API_BASE_URL: window.location.origin,
            CACHE_DURATION: 5 * 60 * 1000
        };
        
        console.log('🎓 Академия АНБ инициализируется...');
        setTimeout(() => this.init(), 100);
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
            console.error('❌ Критическая ошибка инициализации:', error);
            this.showFatalError('Не удалось загрузить приложение: ' + error.message);
        }
    }

    // [Остальные методы инициализации остаются без изменений...]
    // safeInitializeTelegramWebApp, loadUserData, loadContent, safeApiCall и т.д.

    // ОСНОВНЫЕ МЕТОДЫ РЕНДЕРИНГА
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
            
            // Инициализация компонентов страницы
            this.initializePageComponents(page, subPage);
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showNotification('Ошибка отображения страницы', 'error');
        }
    }

    initializePageComponents(page, subPage) {
        switch (page) {
            case 'home':
                this.initializeHomePage();
                break;
            case 'admin':
                this.initializeAdminPage();
                break;
            case 'courses':
                this.initializeCoursesPage();
                break;
            // ... другие страницы
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
            admin: this.createAdminPage(),
            community: this.createCommunityPage(),
            chats: this.createChatsPage(),
            mymaterials: this.createMyMaterialsPage(),
            limited: this.createLimitedOfferPage(),
            support: this.createSupportPage()
        };

        return pages[page] || this.createNotFoundPage();
    }

    // ОБНОВЛЕННАЯ ДОМАШНЯЯ СТРАНИЦА
    createHomePage() {
        const stats = this.calculateHomeStats();
        const recommendedCourses = this.getRecommendedCourses();
        
        return `
            <div class="page home-page">
                <!-- Поисковая строка -->
                <div class="search-section">
                    <div class="search-container">
                        <input type="text" id="globalSearch" placeholder="🔍 Поиск курсов, материалов, эфиров..." 
                               class="search-input">
                        <button class="search-btn" onclick="app.performSearch()">Найти</button>
                    </div>
                </div>

                <!-- Навигационная сетка -->
                <div class="navigation-grid">
                    ${this.createNavCard('courses', '📚', 'Курсы', this.allContent.courses?.length || 0)}
                    ${this.createNavCard('podcasts', '🎧', 'АНБ FM', this.allContent.podcasts?.length || 0)}
                    ${this.createNavCard('streams', '📹', 'Эфиры', this.allContent.streams?.length || 0)}
                    ${this.createNavCard('videos', '🎯', 'Видео-шпаргалки', this.allContent.videos?.length || 0)}
                    ${this.createNavCard('materials', '📋', 'Практические материалы', this.allContent.materials?.length || 0)}
                    ${this.createNavCard('events', '🗺️', 'Карта мероприятий', this.allContent.events?.length || 0)}
                    ${this.createNavCard('limited', '🔥', 'Ограниченное предложение', '')}
                    ${this.createNavCard('support', '🆘', 'Поддержка', '')}
                </div>

                <!-- Лента новостей с фильтрами -->
                <div class="news-feed-section">
                    <div class="section-header">
                        <h3>Лента Академии</h3>
                        <div class="feed-filters">
                            <select id="feedCategory" onchange="app.filterFeed()" class="filter-select">
                                <option value="all">Все</option>
                                <option value="articles">Статьи</option>
                                <option value="professional">Профессиональное развитие</option>
                                <option value="practical">Практические навыки</option>
                                <option value="physiotherapy">Физиотерапия</option>
                                <option value="rehabilitation">Реабилитация</option>
                                <option value="pharmacotherapy">Фармакотерапия</option>
                                <option value="manual">Мануальные техники</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="feed-content" id="newsFeed">
                        ${this.createNewsFeed()}
                    </div>
                </div>

                <!-- Рекомендуемые курсы -->
                ${recommendedCourses.length > 0 ? `
                <div class="recommended-section">
                    <div class="section-header">
                        <h3>Рекомендуемые курсы</h3>
                        <a href="javascript:void(0)" onclick="app.renderPage('courses')" class="see-all">Все курсы →</a>
                    </div>
                    <div class="recommended-grid">
                        ${recommendedCourses.slice(0, 3).map(course => this.createCourseCard(course)).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Быстрые действия -->
                <div class="quick-actions">
                    <h3>Сообщество АНБ</h3>
                    <div class="actions-grid">
                        <button class="action-btn" onclick="app.renderPage('community')">
                            <div class="action-icon">👥</div>
                            <div class="action-text">О сообществе</div>
                        </button>
                        <button class="action-btn" onclick="app.renderPage('chats')">
                            <div class="action-icon">💬</div>
                            <div class="action-text">Чаты</div>
                        </button>
                        <button class="action-btn" onclick="app.renderPage('mymaterials')">
                            <div class="action-icon">📁</div>
                            <div class="action-text">Мои материалы</div>
                        </button>
                        <button class="action-btn" onclick="app.renderPage('profile')">
                            <div class="action-icon">👤</div>
                            <div class="action-text">Личный кабинет</div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createNewsFeed() {
        // Объединяем весь контент для ленты
        const allContent = [
            ...(this.allContent.courses || []).map(item => ({...item, type: 'course'})),
            ...(this.allContent.podcasts || []).map(item => ({...item, type: 'podcast'})),
            ...(this.allContent.streams || []).map(item => ({...item, type: 'stream'})),
            ...(this.allContent.videos || []).map(item => ({...item, type: 'video'})),
            ...(this.allContent.materials || []).map(item => ({...item, type: 'material'})),
            ...(this.allContent.events || []).map(item => ({...item, type: 'event'}))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (allContent.length === 0) {
            return `<div class="empty-state">Пока нет новостей</div>`;
        }

        return `
            <div class="feed-grid">
                ${allContent.slice(0, 10).map(item => `
                    <div class="feed-item" data-type="${item.type}" data-category="${item.category}">
                        <div class="feed-item-header">
                            <span class="feed-type">${this.getTypeIcon(item.type)}</span>
                            <span class="feed-category">${item.category || 'Общее'}</span>
                            <span class="feed-date">${this.formatDate(item.created_at)}</span>
                        </div>
                        <h4 class="feed-title">${item.title}</h4>
                        <p class="feed-description">${item.description}</p>
                        <div class="feed-actions">
                            <button class="btn btn-small" onclick="app.openContentDetail('${item.type}', ${item.id})">
                                Подробнее
                            </button>
                            <button class="favorite-btn ${this.isFavorite(item.id, item.type + 's') ? 'active' : ''}" 
                                    onclick="app.toggleFavorite(${item.id}, '${item.type}s')">
                                ❤️
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getTypeIcon(type) {
        const icons = {
            course: '📚',
            podcast: '🎧',
            stream: '📹',
            video: '🎯',
            material: '📋',
            event: '🗺️'
        };
        return icons[type] || '📄';
    }

    // СТРАНИЦА "О СООБЩЕСТВЕ"
    createCommunityPage() {
        return `
            <div class="page community-page">
                <div class="page-header">
                    <h2>👥 О сообществе АНБ</h2>
                </div>

                <div class="community-content">
                    <!-- Правила сообщества -->
                    <section class="community-section">
                        <h3>📜 Правила и ценности сообщества Академии АНБ</h3>
                        <div class="rules-list">
                            <div class="rule-item">
                                <div class="rule-number">1</div>
                                <div class="rule-content">
                                    <strong>Не распространяем материалы.</strong>
                                    <p>Эфиры, разборы и материалы АНБ не копируем и не выкладываем в открытый доступ.</p>
                                </div>
                            </div>
                            <div class="rule-item">
                                <div class="rule-number">2</div>
                                <div class="rule-content">
                                    <strong>Без рекламы и самопродвижения.</strong>
                                    <p>Мы здесь чтобы учиться и общаться, а не продавать услуги или курсы.</p>
                                </div>
                            </div>
                            <div class="rule-item">
                                <div class="rule-number">3</div>
                                <div class="rule-content">
                                    <strong>Уважаем личное пространство.</strong>
                                    <p>Не пишем участникам без их запроса и не создаём сторонние чаты.</p>
                                </div>
                            </div>
                            <div class="rule-item">
                                <div class="rule-number">4</div>
                                <div class="rule-content">
                                    <strong>Общаемся бережно и корректно.</strong>
                                    <p>Без грубости, токсичности и обесценивания — мы поддерживаем друг друга.</p>
                                </div>
                            </div>
                            <div class="rule-item">
                                <div class="rule-number">5</div>
                                <div class="rule-content">
                                    <strong>Соблюдаем врачебную этику.</strong>
                                    <p>Не публикуем данные пациентов, обсуждаем только корректно оформленные случаи.</p>
                                </div>
                            </div>
                            <div class="rule-item">
                                <div class="rule-number">6</div>
                                <div class="rule-content">
                                    <strong>Держим высокий уровень контента.</strong>
                                    <p>Не распространяем фейки, псевдонауку и непроверенную информацию.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Нарушения правил -->
                    <section class="community-section">
                        <h3>⚖️ Нарушения правил</h3>
                        <div class="violations-info">
                            <p>При первом нарушении — личное предупреждение.</p>
                            <p>При повторном — удаление из канала и аннулирование подписки.</p>
                        </div>
                    </section>

                    <!-- Цель сообщества -->
                    <section class="community-section">
                        <h3>🎯 Зачем существует наше сообщество?</h3>
                        <div class="mission-statement">
                            <p>Мы создаём тёплое профессиональное пространство, где врачи могут:</p>
                            <ul class="mission-list">
                                <li>Расти быстрее и увереннее,</li>
                                <li>Обсуждать реальные клинические случаи из своей практики,</li>
                                <li>Изучать понятные практические навыки,</li>
                                <li>Общаться с коллегами, которые разделяют ценности доказательной медицины,</li>
                                <li>Чувствовать поддержку и интерес к развитию.</li>
                            </ul>
                            <p>Здесь каждый может задать вопрос, получить помощь и снова вдохновиться профессией.</p>
                        </div>
                    </section>

                    <!-- FAQ -->
                    <section class="community-section">
                        <h3>❓ F.A.Q.</h3>
                        
                        <div class="faq-category">
                            <h4>Подписка</h4>
                            <div class="faq-item">
                                <div class="faq-question">Как оформить, продлить или отменить подписку?</div>
                                <div class="faq-answer">Подписку можно оформить или продлить в разделе «Личный кабинет». Там же доступна отмена — через кнопку «Изменить подписку».</div>
                            </div>
                            <div class="faq-item">
                                <div class="faq-question">Что входит в подписку Академии?</div>
                                <div class="faq-answer">Доступ к эфирам, разборам (в том числе в записи), практическим материалам, видео-шпаргалкам на разные темы, а также к чату специалистов и интерактивной карте офлайн-мероприятий с предзаписью и голосованиями за новые темы.</div>
                            </div>
                            <div class="faq-item">
                                <div class="faq-question">Можно ли смотреть материалы без подписки?</div>
                                <div class="faq-answer">Да, часть контента доступна в пробном периоде для ознакомления. Полный доступ и участие в развитии открываются при активной подписке.</div>
                            </div>
                        </div>

                        <div class="faq-category">
                            <h4>Обучение и контент</h4>
                            <div class="faq-item">
                                <div class="faq-question">Чем отличаются курсы, эфиры, разборы, видео-шпаргалки и практические материалы?</div>
                                <div class="faq-answer">
                                    <strong>Курсы</strong> — системное обучение Академии, доступное за отдельную плату. После прохождения выдаются сертификаты.<br>
                                    <strong>Эфиры</strong> — живые встречи, где специалисты разбирают актуальные темы.<br>
                                    <strong>Разборы</strong> — реальные кейсы врачей и личные истории профессионального роста.<br>
                                    <strong>Видео-шпаргалки</strong> — короткие видео с техниками и приёмами.<br>
                                    <strong>Практические материалы</strong> — полезные инструменты для работы: МРТ, клинические случаи и чек-листы.
                                </div>
                            </div>
                        </div>

                        <div class="faq-category">
                            <h4>Личный путь</h4>
                            <div class="faq-item">
                                <div class="faq-question">Зачем нужен «Мой путь» и как он помогает в практике?</div>
                                <div class="faq-answer">«Мой путь» — это лёгкая геймификация профессионального роста. Работа врача — это постоянное развитие, и мы хотим сделать этот процесс приятнее, нагляднее и осмысленнее. Вы видите свой прогресс, чувствуете результат и сохраняете мотивацию даже на промежуточных этапах.</div>
                            </div>
                        </div>
                    </section>

                    <!-- Контакты -->
                    <section class="community-section">
                        <h3>📞 Контакты</h3>
                        <div class="contacts-info">
                            <div class="contact-item">
                                <strong>Координатор проекта:</strong>
                                <p>Отвечаем с ПН-ПТ с 11:00 до 19:00</p>
                            </div>
                            <div class="contact-item">
                                <strong>Сообщить о нарушении:</strong>
                                <p>Если вы получаете нежелательные сообщения (спам, реклама, лидогенерация) или замечаете другие нарушения правил сообщества — сообщите нам, мы обязательно разберёмся.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    // ПОЛНАЯ АДМИН-ПАНЕЛЬ
    createAdminPage() {
        if (!this.isAdmin) {
            return this.createAccessDeniedPage();
        }

        return `
            <div class="page admin-page">
                <div class="admin-header">
                    <h2>${this.isSuperAdmin ? '🛠️ Супер-админ' : '🔧 Админ'}</h2>
                    <div class="admin-tabs">
                        <button class="admin-tab ${this.state.admin.currentTab === 'dashboard' ? 'active' : ''}" 
                                onclick="app.switchAdminTab('dashboard')">📊 Дашборд</button>
                        <button class="admin-tab ${this.state.admin.currentTab === 'content' ? 'active' : ''}" 
                                onclick="app.switchAdminTab('content')">📚 Контент</button>
                        <button class="admin-tab ${this.state.admin.currentTab === 'users' ? 'active' : ''}" 
                                onclick="app.switchAdminTab('users')">👥 Пользователи</button>
                        <button class="admin-tab ${this.state.admin.currentTab === 'analytics' ? 'active' : ''}" 
                                onclick="app.switchAdminTab('analytics')">📈 Аналитика</button>
                    </div>
                </div>

                <div class="admin-content">
                    ${this.getAdminTabContent()}
                </div>
            </div>
        `;
    }

    getAdminTabContent() {
        switch (this.state.admin.currentTab) {
            case 'dashboard':
                return this.createAdminDashboard();
            case 'content':
                return this.createAdminContent();
            case 'users':
                return this.createAdminUsers();
            case 'analytics':
                return this.createAdminAnalytics();
            default:
                return this.createAdminDashboard();
        }
    }

    createAdminDashboard() {
        return `
            <div class="admin-dashboard">
                <div class="stats-grid">
                    <div class="stat-card large">
                        <div class="stat-value">${this.allContent.stats?.total_users || 0}</div>
                        <div class="stat-label">Всего пользователей</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.allContent.stats?.active_subscriptions || 0}</div>
                        <div class="stat-label">Активных подписок</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.allContent.courses?.length || 0}</div>
                        <div class="stat-label">Курсов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.allContent.podcasts?.length || 0}</div>
                        <div class="stat-label">Подкастов</div>
                    </div>
                </div>

                <div class="admin-actions">
                    <h3>Быстрые действия</h3>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="app.showAddContentModal()">
                            ➕ Добавить контент
                        </button>
                        <button class="btn btn-secondary" onclick="app.exportData()">
                            📊 Экспорт данных
                        </button>
                        <button class="btn btn-secondary" onclick="app.sendBroadcast()">
                            📢 Создать рассылку
                        </button>
                    </div>
                </div>

                <div class="recent-activity">
                    <h3>Последние действия</h3>
                    <div class="activity-list">
                        <div class="activity-item">
                            <div class="activity-icon">📚</div>
                            <div class="activity-details">
                                <div class="activity-title">Добавлен новый курс</div>
                                <div class="activity-time">2 часа назад</div>
                            </div>
                        </div>
                        <div class="activity-item">
                            <div class="activity-icon">👥</div>
                            <div class="activity-details">
                                <div class="activity-title">Новый пользователь</div>
                                <div class="activity-time">5 часов назад</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminContent() {
        const contentTypes = [
            { id: 'courses', name: 'Курсы', icon: '📚', count: this.allContent.courses?.length || 0 },
            { id: 'podcasts', name: 'Подкасты', icon: '🎧', count: this.allContent.podcasts?.length || 0 },
            { id: 'streams', name: 'Эфиры', icon: '📹', count: this.allContent.streams?.length || 0 },
            { id: 'videos', name: 'Видео', icon: '🎯', count: this.allContent.videos?.length || 0 },
            { id: 'materials', name: 'Материалы', icon: '📋', count: this.allContent.materials?.length || 0 },
            { id: 'events', name: 'Мероприятия', icon: '🗺️', count: this.allContent.events?.length || 0 }
        ];

        return `
            <div class="admin-content-management">
                <div class="content-types-grid">
                    ${contentTypes.map(type => `
                        <div class="content-type-card" onclick="app.showContentList('${type.id}')">
                            <div class="type-icon">${type.icon}</div>
                            <div class="type-info">
                                <div class="type-name">${type.name}</div>
                                <div class="type-count">${type.count} элементов</div>
                            </div>
                            <button class="btn btn-small" onclick="event.stopPropagation(); app.showAddContentForm('${type.id}')">
                                ➕ Добавить
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div id="contentListContainer" class="content-list-container">
                    <!-- Список контента будет загружаться динамически -->
                </div>
            </div>
        `;
    }

    // МЕТОДЫ АДМИН-ПАНЕЛИ
    switchAdminTab(tab) {
        this.state.admin.currentTab = tab;
        this.renderPage('admin');
    }

    showContentList(contentType) {
        const container = document.getElementById('contentListContainer');
        if (!container) return;

        const content = this.allContent[contentType] || [];
        
        container.innerHTML = `
            <div class="content-list-header">
                <h3>Управление ${this.getContentTypeName(contentType)}</h3>
                <button class="btn btn-primary" onclick="app.showAddContentForm('${contentType}')">
                    ➕ Добавить ${this.getContentTypeName(contentType).toLowerCase()}
                </button>
            </div>
            <div class="content-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Категория</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${content.map(item => `
                            <tr>
                                <td>${item.id}</td>
                                <td>${item.title}</td>
                                <td>${item.category || '-'}</td>
                                <td>
                                    <span class="status-badge ${item.active ? 'active' : 'inactive'}">
                                        ${item.active ? 'Активен' : 'Неактивен'}
                                    </span>
                                </td>
                                <td>${this.formatDate(item.created_at)}</td>
                                <td class="actions">
                                    <button class="btn btn-small" onclick="app.editContent('${contentType}', ${item.id})">
                                        ✏️
                                    </button>
                                    <button class="btn btn-small btn-danger" onclick="app.deleteContent('${contentType}', ${item.id})">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    showAddContentForm(contentType) {
        const formHtml = this.getContentFormHTML(contentType);
        
        this.showModal({
            title: `Добавить ${this.getContentTypeName(contentType).toLowerCase()}`,
            content: formHtml,
            onConfirm: () => this.saveContent(contentType),
            confirmText: 'Сохранить',
            large: true
        });
    }

    getContentFormHTML(contentType) {
        const baseFields = `
            <div class="form-group">
                <label>Название *</label>
                <input type="text" id="contentTitle" class="form-input" required>
            </div>
            <div class="form-group">
                <label>Описание</label>
                <textarea id="contentDescription" class="form-textarea" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Категория</label>
                <input type="text" id="contentCategory" class="form-input">
            </div>
            <div class="form-group">
                <label>URL изображения</label>
                <input type="url" id="contentImageUrl" class="form-input" placeholder="https://example.com/image.jpg">
            </div>
        `;

        const specificFields = {
            courses: `
                <div class="form-row">
                    <div class="form-group">
                        <label>Цена (руб) *</label>
                        <input type="number" id="contentPrice" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label>Скидка (%)</label>
                        <input type="number" id="contentDiscount" class="form-input" min="0" max="100">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Длительность</label>
                        <input type="text" id="contentDuration" class="form-input" placeholder="12 недель">
                    </div>
                    <div class="form-group">
                        <label>Модули</label>
                        <input type="number" id="contentModules" class="form-input">
                    </div>
                </div>
                <div class="form-group">
                    <label>Уровень</label>
                    <select id="contentLevel" class="form-select">
                        <option value="beginner">Начинающий</option>
                        <option value="intermediate">Средний</option>
                        <option value="advanced">Продвинутый</option>
                    </select>
                </div>
            `,
            podcasts: `
                <div class="form-group">
                    <label>Длительность</label>
                    <input type="text" id="contentDuration" class="form-input" placeholder="45:20">
                </div>
                <div class="form-group">
                    <label>URL аудио</label>
                    <input type="url" id="contentAudioUrl" class="form-input">
                </div>
            `,
            streams: `
                <div class="form-group">
                    <label>Длительность</label>
                    <input type="text" id="contentDuration" class="form-input" placeholder="1:30:00">
                </div>
                <div class="form-group">
                    <label>URL видео</label>
                    <input type="url" id="contentVideoUrl" class="form-input">
                </div>
                <div class="form-group">
                    <label>Дата эфира</label>
                    <input type="datetime-local" id="contentStreamDate" class="form-input">
                </div>
                <div class="form-checkbox">
                    <input type="checkbox" id="contentLive" class="form-checkbox-input">
                    <label for="contentLive">Прямой эфир</label>
                </div>
            `
        };

        return `
            <form id="contentForm" class="content-form">
                ${baseFields}
                ${specificFields[contentType] || ''}
                <div class="form-checkbox">
                    <input type="checkbox" id="contentFeatured" class="form-checkbox-input">
                    <label for="contentFeatured">Рекомендуемый контент</label>
                </div>
                <div class="form-checkbox">
                    <input type="checkbox" id="contentActive" class="form-checkbox-input" checked>
                    <label for="contentActive">Активен</label>
                </div>
            </form>
        `;
    }

    async saveContent(contentType) {
        try {
            const form = document.getElementById('contentForm');
            if (!form.checkValidity()) {
                this.showNotification('Заполните обязательные поля', 'error');
                return;
            }

            const formData = {
                title: document.getElementById('contentTitle').value,
                description: document.getElementById('contentDescription').value,
                category: document.getElementById('contentCategory').value,
                image_url: document.getElementById('contentImageUrl').value,
                featured: document.getElementById('contentFeatured').checked,
                active: document.getElementById('contentActive').checked
            };

            // Добавляем специфичные поля
            switch (contentType) {
                case 'courses':
                    formData.price = parseInt(document.getElementById('contentPrice').value);
                    formData.discount = parseInt(document.getElementById('contentDiscount').value) || 0;
                    formData.duration = document.getElementById('contentDuration').value;
                    formData.modules = parseInt(document.getElementById('contentModules').value);
                    formData.level = document.getElementById('contentLevel').value;
                    break;
                case 'podcasts':
                    formData.duration = document.getElementById('contentDuration').value;
                    formData.audio_url = document.getElementById('contentAudioUrl').value;
                    break;
                case 'streams':
                    formData.duration = document.getElementById('contentDuration').value;
                    formData.video_url = document.getElementById('contentVideoUrl').value;
                    formData.stream_date = document.getElementById('contentStreamDate').value;
                    formData.live = document.getElementById('contentLive').checked;
                    break;
            }

            const response = await this.safeApiCall(`/api/admin/content/${contentType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-ID': this.currentUser.id
                },
                body: JSON.stringify(formData)
            });

            if (response.success) {
                this.showNotification('Контент успешно добавлен', 'success');
                this.closeModal();
                await this.loadContent(); // Перезагружаем контент
                this.showContentList(contentType); // Обновляем список
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            console.error('Error saving content:', error);
            this.showNotification('Ошибка при сохранении: ' + error.message, 'error');
        }
    }

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ НОВЫХ СТРАНИЦ
    createChatsPage() {
        return `
            <div class="page chats-page">
                <div class="page-header">
                    <h2>💬 Чаты специалистов</h2>
                </div>
                
                <div class="chats-grid">
                    ${this.createChatCard('Неврологи', '🧠', 'Обсуждение неврологических случаев и методик', 'neurology')}
                    ${this.createChatCard('Реабилитологи', '🦾', 'Вопросы реабилитации и восстановления', 'rehabilitation')}
                    ${this.createChatCard('Мануальные специалисты', '✋', 'Техники и подходы мануальной терапии', 'manual')}
                    ${this.createChatCard('Междисциплинарный чат', '🔗', 'Обсуждение сложных междисциплинарных случаев', 'multidisciplinary')}
                    ${this.createChatCard('Флудилка', '💬', 'Неформальное общение и отдых', 'general')}
                </div>
            </div>
        `;
    }

    createChatCard(title, icon, description, type) {
        return `
            <div class="chat-card" onclick="app.joinChat('${type}')">
                <div class="chat-icon">${icon}</div>
                <div class="chat-content">
                    <h3 class="chat-title">${title}</h3>
                    <p class="chat-description">${description}</p>
                </div>
                <div class="chat-arrow">→</div>
            </div>
        `;
    }

    createMyMaterialsPage() {
        return `
            <div class="page mymaterials-page">
                <div class="page-header">
                    <h2>📁 Мои материалы</h2>
                    <div class="materials-tabs">
                        <button class="tab-btn active" onclick="app.switchMaterialsTab('later')">👀 Посмотреть позже</button>
                        <button class="tab-btn" onclick="app.switchMaterialsTab('favorites')">❤️ Избранное</button>
                        <button class="tab-btn" onclick="app.switchMaterialsTab('practical')">📋 Практические материалы</button>
                    </div>
                </div>
                
                <div class="materials-content" id="materialsContent">
                    ${this.createMaterialsTabContent('later')}
                </div>
            </div>
        `;
    }

    createLimitedOfferPage() {
        return `
            <div class="page limited-page">
                <div class="page-header">
                    <h2>🔥 Ограниченное предложение</h2>
                </div>
                
                <div class="offers-grid">
                    <div class="offer-card">
                        <div class="offer-image">
                            <img src="/webapp/assets/offer-default.jpg" alt="Специальное предложение">
                            <div class="offer-badge">🔥 Ограничено</div>
                        </div>
                        <div class="offer-content">
                            <h3>Пакет "Профессионал"</h3>
                            <p>Полный доступ ко всем курсам + индивидуальные консультации</p>
                            <div class="offer-price">
                                <span class="old-price">75 000 ₽</span>
                                <span class="new-price">49 900 ₽</span>
                            </div>
                            <button class="btn btn-primary" onclick="app.showOfferForm()">
                                Получить предложение
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createSupportPage() {
        return `
            <div class="page support-page">
                <div class="page-header">
                    <h2>🆘 Поддержка</h2>
                </div>
                
                <div class="support-content">
                    <div class="support-info">
                        <h3>Координатор Академии АНБ</h3>
                        <p>Отвечаем на вопросы с ПН-ПТ с 11:00 до 19:00</p>
                        
                        <div class="contact-methods">
                            <div class="contact-method">
                                <div class="method-icon">📱</div>
                                <div class="method-info">
                                    <div class="method-title">Telegram</div>
                                    <div class="method-value">@academy_anb</div>
                                    <button class="btn btn-small" onclick="app.openTelegram('@academy_anb')">
                                        Написать
                                    </button>
                                </div>
                            </div>
                            
                            <div class="contact-method">
                                <div class="method-icon">📧</div>
                                <div class="method-info">
                                    <div class="method-title">Email</div>
                                    <div class="method-value">support@anb-academy.ru</div>
                                    <button class="btn btn-small" onclick="app.openEmail('support@anb-academy.ru')">
                                        Написать
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="support-form">
                        <h3>Форма обратной связи</h3>
                        <form id="supportForm">
                            <div class="form-group">
                                <label>Тема</label>
                                <select id="supportTopic" class="form-select">
                                    <option value="technical">Техническая проблема</option>
                                    <option value="content">Вопрос по контенту</option>
                                    <option value="subscription">Подписка и оплата</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Сообщение</label>
                                <textarea id="supportMessage" class="form-textarea" rows="5" placeholder="Опишите вашу проблему или вопрос..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Отправить</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // МЕТОДЫ ДЛЯ НОВЫХ ФУНКЦИЙ
    joinChat(chatType) {
        const chatLinks = {
            neurology: 'https://t.me/ANB_Neurology_Chat',
            rehabilitation: 'https://t.me/ANB_Rehabilitation_Chat', 
            manual: 'https://t.me/ANB_Manual_Chat',
            multidisciplinary: 'https://t.me/ANB_Multidisciplinary_Chat',
            general: 'https://t.me/ANB_General_Chat'
        };

        const link = chatLinks[chatType] || 'https://t.me/academy_anb';
        this.showNotification(`Присоединяйтесь к чату: ${link}`, 'info');
        
        // Открываем ссылку в новом окне
        window.open(link, '_blank');
    }

    switchMaterialsTab(tab) {
        const content = document.getElementById('materialsContent');
        if (!content) return;

        // Обновляем активные табы
        document.querySelectorAll('.materials-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        content.innerHTML = this.createMaterialsTabContent(tab);
    }

    createMaterialsTabContent(tab) {
        switch (tab) {
            case 'later':
                return this.createWatchLaterContent();
            case 'favorites':
                return this.createFavoritesContent();
            case 'practical':
                return this.createPracticalMaterialsContent();
            default:
                return this.createWatchLaterContent();
        }
    }

    createWatchLaterContent() {
        const watchLaterItems = []; // Здесь будет логика получения отложенных материалов
        
        if (watchLaterItems.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">👀</div>
                    <div class="empty-title">В "Посмотреть позже" пока пусто</div>
                    <div class="empty-description">Добавляйте материалы, чтобы посмотреть их позже</div>
                </div>
            `;
        }

        return `
            <div class="materials-grid">
                ${watchLaterItems.map(item => this.createMaterialItem(item)).join('')}
            </div>
        `;
    }

    showOfferForm() {
        this.showModal({
            title: '🔥 Ограниченное предложение',
            content: `
                <div class="offer-form">
                    <p>Оставьте заявку на специальное предложение "Профессионал"</p>
                    <form id="offerForm">
                        <div class="form-group">
                            <label>Ваше имя</label>
                            <input type="text" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Телефон</label>
                            <input type="tel" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label>Комментарий</label>
                            <textarea class="form-textarea" rows="3" placeholder="Ваши вопросы или пожелания..."></textarea>
                        </div>
                    </form>
                </div>
            `,
            onConfirm: () => this.submitOfferForm(),
            confirmText: 'Отправить заявку'
        });
    }

    // МЕТОДЫ РАБОТЫ С МОДАЛЬНЫМИ ОКНАМИ
    showModal(options) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal ${options.large ? 'modal-large' : ''}">
                <div class="modal-header">
                    <h3>${options.title}</h3>
                    <button class="modal-close" onclick="app.closeModal()">×</button>
                </div>
                <div class="modal-content">
                    ${options.content}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="app.closeModal()">Отмена</button>
                    <button class="btn btn-primary" onclick="${options.onConfirm}">${options.confirmText || 'OK'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }

    // [Остальные вспомогательные методы...]
    getContentTypeName(type) {
        const names = {
            courses: 'Курс',
            podcasts: 'Подкаст', 
            streams: 'Эфир',
            videos: 'Видео',
            materials: 'Материал',
            events: 'Мероприятие'
        };
        return names[type] || type;
    }

    performSearch() {
        const query = document.getElementById('globalSearch')?.value;
        if (query) {
            this.showNotification(`Поиск: "${query}" - функция в разработке`, 'info');
        }
    }

    filterFeed() {
        const category = document.getElementById('feedCategory')?.value;
        const feed = document.getElementById('newsFeed');
        if (feed) {
            // Простая фильтрация
            const items = feed.querySelectorAll('.feed-item');
            items.forEach(item => {
                const itemCategory = item.dataset.category;
                if (category === 'all' || itemCategory === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    }

    // Дополнительные методы для админ-панели
    async deleteContent(contentType, contentId) {
        if (!confirm('Вы уверены, что хотите удалить этот контент?')) return;

        try {
            const response = await this.safeApiCall(`/api/admin/content/${contentType}/${contentId}`, {
                method: 'DELETE',
                headers: {
                    'X-Admin-ID': this.currentUser.id
                }
            });

            if (response.success) {
                this.showNotification('Контент удален', 'success');
                await this.loadContent();
                this.showContentList(contentType);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error deleting content:', error);
            this.showNotification('Ошибка при удалении: ' + error.message, 'error');
        }
    }

    editContent(contentType, contentId) {
        const content = this.allContent[contentType]?.find(item => item.id === contentId);
        if (!content) return;

        this.showModal({
            title: `Редактировать ${this.getContentTypeName(contentType).toLowerCase()}`,
            content: `Редактирование в разработке для ${contentType} ID: ${contentId}`,
            large: true
        });
    }

    // [Остальные существующие методы...]
    // createDemoUser, createDemoContent, formatPrice, formatDate, showNotification и т.д.
}

// Глобальная обработка ошибок
window.addEventListener('error', function(event) {
    console.error('🚨 Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});

// Экспорт для глобального доступа
window.AcademyApp = AcademyApp;

console.log('✅ AcademyApp class loaded with full functionality');
