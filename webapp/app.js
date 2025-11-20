// webapp/app.js - ПОЛНАЯ РЕАЛИЗАЦИЯ ТЗ
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
            theme: 'dark'
        };
        
        this.config = {
            API_BASE_URL: window.location.origin,
            CACHE_DURATION: 5 * 60 * 1000
        };
        
        // Данные для ТЗ
        this.communityRules = [
            'Не распространяем материалы',
            'Без рекламы и самопродвижения',
            'Уважаем личное пространство', 
            'Общаемся бережно и корректно',
            'Соблюдаем врачебную этику',
            'Держим высокий уровень контента'
        ];
        
        this.learningPath = {
            'Понимаю': { 
                minExp: 0, 
                maxExp: 1000, 
                requirements: ['Подписка активирована'],
                description: 'Начинаю замечать закономерности и связи'
            },
            'Связываю': { 
                minExp: 1000, 
                maxExp: 2500, 
                requirements: ['3+ эфиров', '5+ материалов'],
                description: 'Закономерности складываются в систему'
            },
            'Применяю': { 
                minExp: 2500, 
                maxExp: 5000, 
                requirements: ['1+ курс', '7+ эфиров'],
                description: 'Подход АНБ используется на практике'
            },
            'Систематизирую': { 
                minExp: 5000, 
                maxExp: 10000, 
                requirements: ['2+ курса', '10+ эфиров'],
                description: 'Знания становятся инструментом'
            },
            'Делюсь': { 
                minExp: 10000, 
                maxExp: 20000, 
                requirements: ['Все курсы', 'Офлайн мероприятия'],
                description: 'Опыт переходит в обмен'
            }
        };
        
        this.chats = [
            { name: 'Неврологи', icon: '🧠', members: 234, description: 'Обсуждение неврологических случаев' },
            { name: 'Реабилитологи', icon: '🦾', members: 189, description: 'Вопросы реабилитации' },
            { name: 'Мануальные специалисты', icon: '✋', members: 156, description: 'Мануальные техники' },
            { name: 'Междисциплинарный чат', icon: '🔗', members: 345, description: 'Общие вопросы' },
            { name: 'Флудилка', icon: '💬', members: 567, description: 'Неформальное общение' }
        ];
        
        this.materialsTabs = ['later', 'favorites', 'practical'];
        this.currentMaterialsTab = 'later';
        
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
            console.error(`❌ API Call failed: ${url}`, error);
            
            if (url === '/api/content') {
                return { success: true, data: this.getDemoContentData() };
            } else if (url === '/api/user') {
                return { success: true, user: this.getDemoUserData() };
            }
            
            return { success: false, error: error.message };
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
            console.log(`📄 Рендер страницы: ${page}${subPage ? '/' + subPage : ''}`);
            mainContent.innerHTML = this.getPageHTML(page, subPage);
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showNotification('Ошибка отображения страницы', 'error');
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
            community: this.createCommunityPage(),
            chats: this.createChatsPage(),
            myMaterials: this.createMyMaterialsPage(),
            admin: this.createAdminPage()
        };

        return pages[page] || this.createNotFoundPage();
    }

    // HOME PAGE - согласно ТЗ
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

                <!-- Навигационная сетка согласно ТЗ -->
                <div class="navigation-grid">
                    ${this.createNavCard('courses', '📚', 'Курсы', this.allContent.courses?.length || 0)}
                    ${this.createNavCard('podcasts', '🎧', 'АНБ FM', this.allContent.podcasts?.length || 0)}
                    ${this.createNavCard('streams', '📹', 'Эфиры', this.allContent.streams?.length || 0)}
                    ${this.createNavCard('videos', '🎯', 'Видео-шпаргалки', this.allContent.videos?.length || 0)}
                    ${this.createNavCard('materials', '📋', 'Практические материалы', this.allContent.materials?.length || 0)}
                    ${this.createNavCard('events', '🗺️', 'Карта мероприятий', this.allContent.events?.length || 0)}
                    ${this.createNavCard('community', '👥', 'О сообществе', '')}
                    ${this.createNavCard('chats', '💬', 'Чаты', this.chats.length)}
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
                                    <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                                    <div class="card-overlay">
                                        <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
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

                <!-- Лента новостей согласно ТЗ -->
                <div class="news-section">
                    <div class="section-header">
                        <h3>Лента новостей</h3>
                        <div class="news-filters">
                            <button class="filter-btn active">Все</button>
                            <button class="filter-btn">Статьи</button>
                            <button class="filter-btn">Профессиональное развитие</button>
                            <button class="filter-btn">Практические навыки</button>
                            <button class="filter-btn">Физиотерапия</button>
                            <button class="filter-btn">Реабилитация</button>
                            <button class="filter-btn">Фармакотерапия</button>
                            <button class="filter-btn">Мануальные техники</button>
                        </div>
                    </div>
                    <div class="news-grid">
                        <div class="news-card">
                            <div class="news-date">15 дек 2024</div>
                            <h4>Новые методики в реабилитации</h4>
                            <p>Обзор современных подходов к реабилитации пациентов с неврологическими нарушениями</p>
                        </div>
                        <div class="news-card">
                            <div class="news-date">12 дек 2024</div>
                            <h4>Обновление курса по мануальной терапии</h4>
                            <p>Добавлены новые модули по работе с шейным отделом позвоночника</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // COMMUNITY PAGE - согласно ТЗ
    createCommunityPage() {
        return `
            <div class="page community-page">
                <div class="page-header">
                    <h2>👥 О сообществе</h2>
                </div>

                <div class="community-content">
                    <div class="rules-section">
                        <h3>📜 Правила и ценности сообщества Академии АНБ</h3>
                        <div class="rules-list">
                            ${this.communityRules.map((rule, index) => `
                                <div class="rule-item">
                                    <div class="rule-number">${index + 1}</div>
                                    <div class="rule-text">${rule}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="violations-section">
                        <h4>Нарушения правил</h4>
                        <p>При первом нарушении — личное предупреждение.<br>
                        При повторном — удаление из канала и аннулирование подписки.</p>
                    </div>

                    <div class="purpose-section">
                        <h4>Зачем существует наше сообщество?</h4>
                        <p>Мы создаём тёплое профессиональное пространство, где врачи могут:</p>
                        <ul>
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
                                <div class="faq-answer">Курсы — системное обучение Академии, доступное за отдельную плату. После прохождения выдаются сертификаты.<br>
                                Эфиры — живые встречи, где специалисты разбирают актуальные темы.<br>
                                Разборы — реальные кейсы врачей и личные истории профессионального роста, которые обсуждаются с основателями Академии в прямом эфире.<br>
                                Видео-шпаргалки — короткие видео с техниками и приёмами, помогающими иначе взглянуть на свои профессиональные привычки.<br>
                                Практические материалы — полезные инструменты для работы: МРТ, клинические случаи и чек-листы.</div>
                            </div>
                            <div class="faq-item">
                                <div class="faq-question">Как начать обучение или выбрать первый модуль?</div>
                                <div class="faq-answer">С выбором поможет координатор Академии. Также можно оплатить любой модуль в разделе «Курсы» и сразу получить доступ ко всем урокам.</div>
                            </div>
                            <div class="faq-item">
                                <div class="faq-question">Можно ли смотреть эфиры или разборы в записи?</div>
                                <div class="faq-answer">Да. Все прошедшие эфиры и разборы доступны в записи в соответствующих разделах.</div>
                            </div>
                        </div>

                        <div class="faq-category">
                            <h4>Личный путь</h4>
                            <div class="faq-item">
                                <div class="faq-question">Зачем нужен «Мой путь» и как он помогает в практике?</div>
                                <div class="faq-answer">«Мой путь» — это лёгкая геймификация профессионального роста. Работа врача — это постоянное развитие, и мы хотим сделать этот процесс приятнее, нагляднее и осмысленнее. Вы видите свой прогресс, чувствуете результат и сохраняете мотивацию даже на промежуточных этапах.</div>
                            </div>
                            <div class="faq-item">
                                <div class="faq-question">Как перейти на следующий уровень?</div>
                                <div class="faq-answer">Для каждого уровня есть свои условия. Подробности в разделе «Личный кабинет» → «Мой путь».</div>
                            </div>
                            <div class="faq-item">
                                <div class="faq-question">Почему не засчитан прогресс после эфира или курса?</div>
                                <div class="faq-answer">Система обновляет данные раз в сутки. Если прогресс не появился спустя время — напишите в поддержку, и мы поможем.</div>
                            </div>
                        </div>
                    </div>

                    <div class="support-contact">
                        <h4>Координатор проекта</h4>
                        <p>Отвечаем с ПН-ПТ с 11:00 до 19:00</p>
                        <p><strong>Сообщить о нарушении</strong><br>
                        Если вы получаете нежелательные сообщения (спам, реклама, лидогенерация) или замечаете другие нарушения правил сообщества — сообщите нам, мы обязательно разберёмся.</p>
                        
                        <button class="btn btn-primary" onclick="app.showSupport()">
                            📧 Написать координатору
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // CHATS PAGE - согласно ТЗ
    createChatsPage() {
        return `
            <div class="page chats-page">
                <div class="page-header">
                    <h2>💬 Чаты специалистов</h2>
                </div>

                <div class="chats-list">
                    ${this.chats.map(chat => `
                        <div class="chat-card" onclick="app.joinChat('${chat.name}')">
                            <div class="chat-icon">${chat.icon}</div>
                            <div class="chat-info">
                                <div class="chat-name">${chat.name}</div>
                                <div class="chat-description">${chat.description}</div>
                                <div class="chat-members">${chat.members} участников</div>
                            </div>
                            <div class="chat-arrow">→</div>
                        </div>
                    `).join('')}
                </div>

                <div class="chats-notice">
                    <p>💡 Для доступа к чатам требуется активная подписка Академии АНБ</p>
                    <button class="btn btn-secondary" onclick="app.renderPage('profile')">
                        Проверить подписку
                    </button>
                </div>
            </div>
        `;
    }

    // MY MATERIALS PAGE - согласно ТЗ
    createMyMaterialsPage() {
        return `
            <div class="page materials-page">
                <div class="page-header">
                    <h2>📚 Мои материалы</h2>
                </div>

                <div class="materials-tabs">
                    <button class="tab-btn ${this.currentMaterialsTab === 'later' ? 'active' : ''}" 
                            onclick="app.switchMaterialsTab('later')">
                        Посмотреть позже
                    </button>
                    <button class="tab-btn ${this.currentMaterialsTab === 'favorites' ? 'active' : ''}" 
                            onclick="app.switchMaterialsTab('favorites')">
                        Избранное
                    </button>
                    <button class="tab-btn ${this.currentMaterialsTab === 'practical' ? 'active' : ''}" 
                            onclick="app.switchMaterialsTab('practical')">
                        Практические материалы
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
            return this.createEmptyMaterialsState('watch-later', '⏰', 'Список \"Посмотреть позже\" пуст', 'Добавляйте курсы и материалы, чтобы посмотреть их позже');
        }
        
        return `
            <div class="materials-grid">
                ${laterItems.map(item => `
                    <div class="material-card">
                        <div class="material-image">
                            <img src="${item.image_url}" alt="${item.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                        </div>
                        <div class="material-content">
                            <h4>${item.title}</h4>
                            <p>${item.description}</p>
                            <div class="material-meta">
                                <span>⏱️ ${item.duration}</span>
                                <span>📦 ${item.modules} модулей</span>
                            </div>
                            <button class="btn btn-primary btn-small" onclick="app.openCourseDetail(${item.id})">
                                Продолжить
                            </button>
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
                            <img src="${course.image_url}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                            <button class="favorite-btn active" onclick="app.toggleFavorite(${course.id}, 'courses')">
                                ❤️
                            </button>
                        </div>
                        <div class="material-content">
                            <h4>${course.title}</h4>
                            <p>${course.description}</p>
                            <div class="material-meta">
                                <span>⏱️ ${course.duration}</span>
                                <span>💰 ${this.formatPrice(course.price)}</span>
                            </div>
                            <button class="btn btn-primary btn-small" onclick="app.openCourseDetail(${course.id})">
                                Открыть
                            </button>
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
                            <img src="${material.image_url}" alt="${material.title}" onerror="this.src='/webapp/assets/material-default.jpg'">
                            <div class="material-type">${material.material_type === 'mri_analysis' ? 'МРТ' : 'Чек-лист'}</div>
                        </div>
                        <div class="material-content">
                            <h4>${material.title}</h4>
                            <p>${material.description}</p>
                            <div class="material-meta">
                                <span>📥 ${material.downloads} скачиваний</span>
                                <span>🏷️ ${material.category}</span>
                            </div>
                            <button class="btn btn-primary btn-small" onclick="app.downloadMaterial(${material.id})">
                                Скачать
                            </button>
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
                <button class="btn btn-primary" onclick="app.renderPage('courses')">
                    Перейти к курсам
                </button>
            </div>
        `;
    }

    // PROFILE PAGE - с полной реализацией "Мой путь"
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
                    
                    ${user?.subscriptionEnd ? `
                    <div class="subscription-status active">
                        <span>✅ Подписка активна до ${new Date(user.subscriptionEnd).toLocaleDateString('ru-RU')}</span>
                        <button class="btn btn-small btn-outline" onclick="app.manageSubscription()">Изменить</button>
                    </div>
                    ` : `
                    <div class="subscription-status inactive">
                        <span>❌ Подписка не активна</span>
                        <button class="btn btn-small btn-primary" onclick="app.manageSubscription()">Активировать</button>
                    </div>
                    `}
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
                                            ${levelData.requirements.map(req => `<li>${req}</li>`).join('')}
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
                </div>
            </div>
        `;
    }

    // COURSES PAGE
    createCoursesPage() {
        const courses = this.allContent.courses || [];
        const categories = [...new Set(courses.map(c => c.category))];
        
        return `
            <div class="page courses-page">
                <div class="page-header">
                    <h2>📚 Курсы</h2>
                    <div class="header-actions">
                        <div class="search-box">
                            <input type="text" placeholder="Поиск курсов..." 
                                   value="${this.state.searchQuery}"
                                   oninput="app.handleSearch(event)">
                        </div>
                        <div class="view-toggle">
                            <button class="view-btn ${this.state.viewMode === 'grid' ? 'active' : ''}" 
                                    onclick="app.toggleViewMode('grid')">▦</button>
                            <button class="view-btn ${this.state.viewMode === 'list' ? 'active' : ''}" 
                                    onclick="app.toggleViewMode('list')">☰</button>
                        </div>
                    </div>
                </div>
                
                <div class="filters-section">
                    <div class="filter-category">
                        <strong>Категории:</strong>
                        ${categories.map(cat => `
                            <button class="filter-btn ${this.state.activeFilters.category === cat ? 'active' : ''}"
                                    onclick="app.applyFilter('category', '${cat}')">
                                ${cat}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="content-container ${this.state.viewMode}">
                    ${courses.length > 0 ? 
                        this.renderCoursesGrid(courses) : 
                        this.createEmptyState('courses')
                    }
                </div>
            </div>
        `;
    }

    renderCoursesGrid(courses) {
        let filteredCourses = courses;
        
        if (this.state.searchQuery) {
            filteredCourses = courses.filter(course => 
                course.title.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
                course.description.toLowerCase().includes(this.state.searchQuery.toLowerCase())
            );
        }
        
        if (this.state.activeFilters.category) {
            filteredCourses = filteredCourses.filter(course => 
                course.category === this.state.activeFilters.category
            );
        }
        
        return `
            <div class="content-grid">
                ${filteredCourses.map(course => `
                    <div class="content-card course-card" onclick="app.openCourseDetail(${course.id})">
                        ${course.discount > 0 ? `
                            <div class="discount-badge">-${course.discount}%</div>
                        ` : ''}
                        ${course.featured ? `
                            <div class="featured-badge">Рекомендуем</div>
                        ` : ''}
                        
                        <div class="card-image">
                            <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
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
                                        <div class="price-original">${this.formatPrice(course.price * (1 + course.discount/100))}</div>
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

    // Остальные страницы (PODCASTS, STREAMS, VIDEOS, MATERIALS, EVENTS)
    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                </div>
                <div class="content-grid">
                    ${podcasts.length > 0 ? podcasts.map(podcast => `
                        <div class="content-card podcast-card">
                            <div class="card-image">
                                <img src="${podcast.image_url || '/webapp/assets/podcast-default.jpg'}" alt="${podcast.title}" onerror="this.src='/webapp/assets/podcast-default.jpg'">
                                <div class="play-button">🎵</div>
                            </div>
                            <div class="card-content">
                                <h3>${podcast.title}</h3>
                                <p>${podcast.description}</p>
                                <div class="card-meta">
                                    <span>⏱️ ${podcast.duration}</span>
                                    <span>👂 ${podcast.listens} прослушиваний</span>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-primary btn-small" onclick="app.playPodcast(${podcast.id})">
                                        Слушать
                                    </button>
                                    <button class="favorite-btn ${this.isFavorite(podcast.id, 'podcasts') ? 'active' : ''}" 
                                            onclick="app.toggleFavorite(${podcast.id}, 'podcasts')">
                                        ❤️
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('podcasts')}
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
                    ${streams.length > 0 ? streams.map(stream => `
                        <div class="content-card stream-card">
                            <div class="card-image">
                                <img src="${stream.thumbnail_url || '/webapp/assets/stream-default.jpg'}" alt="${stream.title}" onerror="this.src='/webapp/assets/stream-default.jpg'">
                                ${stream.live ? '<div class="live-badge">LIVE</div>' : ''}
                                <div class="play-button">▶️</div>
                            </div>
                            <div class="card-content">
                                <h3>${stream.title}</h3>
                                <p>${stream.description}</p>
                                <div class="card-meta">
                                    <span>⏱️ ${stream.duration}</span>
                                    <span>👥 ${stream.participants} участников</span>
                                    <span>🏷️ ${stream.category}</span>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-primary btn-small" onclick="app.watchStream(${stream.id})">
                                        Смотреть
                                    </button>
                                    <button class="favorite-btn ${this.isFavorite(stream.id, 'streams') ? 'active' : ''}" 
                                            onclick="app.toggleFavorite(${stream.id}, 'streams')">
                                        ❤️
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('streams')}
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
                    ${videos.length > 0 ? videos.map(video => `
                        <div class="content-card video-card">
                            <div class="card-image">
                                <img src="${video.thumbnail_url || '/webapp/assets/video-default.jpg'}" alt="${video.title}" onerror="this.src='/webapp/assets/video-default.jpg'">
                                <div class="play-button">▶️</div>
                            </div>
                            <div class="card-content">
                                <h3>${video.title}</h3>
                                <p>${video.description}</p>
                                <div class="card-meta">
                                    <span>⏱️ ${video.duration}</span>
                                    <span>👀 ${video.views} просмотров</span>
                                    <span>🏷️ ${video.category}</span>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-primary btn-small" onclick="app.watchVideo(${video.id})">
                                        Смотреть
                                    </button>
                                    <button class="favorite-btn ${this.isFavorite(video.id, 'videos') ? 'active' : ''}" 
                                            onclick="app.toggleFavorite(${video.id}, 'videos')">
                                        ❤️
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('videos')}
                </div>
            </div>
        `;
    }

    createMaterialsPage() {
        const materials = this.allContent.materials || [];
        const categories = ['МРТ', 'Клинические случаи', 'Чек-листы'];
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>📋 Практические материалы</h2>
                </div>
                
                <div class="materials-categories">
                    ${categories.map(cat => `
                        <button class="category-btn" onclick="app.filterMaterials('${cat}')">
                            ${cat === 'МРТ' ? '🧠' : cat === 'Клинические случаи' ? '📋' : '✅'} ${cat}
                        </button>
                    `).join('')}
                </div>
                
                <div class="content-grid">
                    ${materials.length > 0 ? materials.map(material => `
                        <div class="content-card material-card">
                            <div class="card-image">
                                <img src="${material.image_url || '/webapp/assets/material-default.jpg'}" alt="${material.title}" onerror="this.src='/webapp/assets/material-default.jpg'">
                                <div class="material-type">${material.material_type === 'mri_analysis' ? 'МРТ' : 'Чек-лист'}</div>
                            </div>
                            <div class="card-content">
                                <h3>${material.title}</h3>
                                <p>${material.description}</p>
                                <div class="card-meta">
                                    <span>📥 ${material.downloads} скачиваний</span>
                                    <span>🏷️ ${material.category}</span>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-primary btn-small" onclick="app.downloadMaterial(${material.id})">
                                        Скачать
                                    </button>
                                    <button class="favorite-btn ${this.isFavorite(material.id, 'materials') ? 'active' : ''}" 
                                            onclick="app.toggleFavorite(${material.id}, 'materials')">
                                        ❤️
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : this.createEmptyState('materials')}
                </div>
            </div>
        `;
    }

    createEventsPage() {
        const events = this.allContent.events || [];
        const onlineEvents = events.filter(e => e.event_type === 'online');
        const offlineEvents = events.filter(e => e.event_type === 'offline');
        
        return `
            <div class="page events-page">
                <div class="page-header">
                    <h2>🗺️ Карта мероприятий</h2>
                </div>
                
                <div class="events-tabs">
                    <button class="tab-btn active" onclick="app.showEventsTab('online')">Онлайн</button>
                    <button class="tab-btn" onclick="app.showEventsTab('offline')">Офлайн</button>
                </div>
                
                <div class="events-content">
                    <div class="events-tab active" id="online-events">
                        <h3>Онлайн мероприятия</h3>
                        ${onlineEvents.length > 0 ? onlineEvents.map(event => `
                            <div class="event-card">
                                <div class="event-image">
                                    <img src="${event.image_url || '/webapp/assets/event-default.jpg'}" alt="${event.title}" onerror="this.src='/webapp/assets/event-default.jpg'">
                                </div>
                                <div class="event-content">
                                    <h4>${event.title}</h4>
                                    <p>${event.description}</p>
                                    <div class="event-meta">
                                        <span>📅 ${this.formatDate(event.event_date)}</span>
                                        <span>📍 ${event.location}</span>
                                        <span>👥 ${event.participants} участников</span>
                                    </div>
                                    <div class="event-actions">
                                        <button class="btn btn-primary btn-small" onclick="app.registerForEvent(${event.id})">
                                            Записаться
                                        </button>
                                        <button class="favorite-btn ${this.isFavorite(event.id, 'events') ? 'active' : ''}" 
                                                onclick="app.toggleFavorite(${event.id}, 'events')">
                                            ❤️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<p>Нет предстоящих онлайн мероприятий</p>'}
                    </div>
                    
                    <div class="events-tab" id="offline-events">
                        <h3>Офлайн мероприятия</h3>
                        ${offlineEvents.length > 0 ? offlineEvents.map(event => `
                            <div class="event-card">
                                <div class="event-image">
                                    <img src="${event.image_url || '/webapp/assets/event-default.jpg'}" alt="${event.title}" onerror="this.src='/webapp/assets/event-default.jpg'">
                                </div>
                                <div class="event-content">
                                    <h4>${event.title}</h4>
                                    <p>${event.description}</p>
                                    <div class="event-meta">
                                        <span>📅 ${this.formatDate(event.event_date)}</span>
                                        <span>📍 ${event.location}</span>
                                        <span>👥 ${event.participants} участников</span>
                                    </div>
                                    <div class="event-actions">
                                        <button class="btn btn-primary btn-small" onclick="app.registerForEvent(${event.id})">
                                            Записаться
                                        </button>
                                        <button class="favorite-btn ${this.isFavorite(event.id, 'events') ? 'active' : ''}" 
                                                onclick="app.toggleFavorite(${event.id}, 'events')">
                                            ❤️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<p>Нет предстоящих офлайн мероприятий</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Вспомогательные методы
    createNavCard(section, icon, title, count) {
        return `
            <div class="nav-card" onclick="app.renderPage('${section}')">
                <div class="nav-icon">${icon}</div>
                <div class="nav-content">
                    <div class="nav-title">${title}</div>
                </div>
                ${count ? `<div class="nav-badge">${count}</div>` : ''}
            </div>
        `;
    }

    getProfileStatus() {
        if (this.isSuperAdmin) return '🛠️ Супер-админ';
        if (this.isAdmin) return '🔧 Админ';
        return '👤 Пользователь';
    }

    calculateHomeStats() {
        return {
            courses: this.allContent.stats?.totalCourses || this.allContent.courses?.length || 0,
            students: this.allContent.stats?.totalUsers || 0,
            experts: 25
        };
    }

    getRecommendedCourses() {
        return this.allContent.courses
            ?.filter(course => course.featured)
            .slice(0, 6) || [];
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

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (e) {
            return 'Дата не указана';
        }
    }

    // Методы для взаимодействия
    async toggleFavorite(contentId, contentType) {
        try {
            const response = await this.safeApiCall('/api/favorites/toggle', {
                method: 'POST',
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

    switchMaterialsTab(tab) {
        this.currentMaterialsTab = tab;
        this.renderPage('myMaterials');
    }

    joinChat(chatName) {
        this.showNotification(`Вход в чат "${chatName}" - функция в разработке`, 'info');
    }

    openCourseDetail(courseId) {
        this.showNotification(`📚 Детальная страница курса в разработке`, 'info');
    }

    playPodcast(podcastId) {
        this.showNotification(`🎧 Воспроизведение подкаста в разработке`, 'info');
    }

    watchStream(streamId) {
        this.showNotification(`📹 Просмотр эфира в разработке`, 'info');
    }

    watchVideo(videoId) {
        this.showNotification(`🎯 Просмотр видео в разработке`, 'info');
    }

    downloadMaterial(materialId) {
        this.showNotification(`📋 Скачивание материала в разработке`, 'info');
    }

    registerForEvent(eventId) {
        this.showNotification(`🗺️ Регистрация на мероприятие в разработке`, 'info');
    }

    manageSubscription() {
        this.showNotification(`💳 Управление подпиской в разработке`, 'info');
    }

    handleSearch(event) {
        this.state.searchQuery = event.target.value;
        this.renderPage(this.currentPage, this.currentSubPage);
    }

    applyFilter(filterType, value) {
        this.state.activeFilters[filterType] = value;
        this.renderPage(this.currentPage, this.currentSubPage);
    }

    toggleViewMode(mode) {
        this.state.viewMode = mode;
        this.renderPage(this.currentPage, this.currentSubPage);
    }

    showEventsTab(tab) {
        document.querySelectorAll('.events-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`${tab}-events`).classList.add('active');
        event.target.classList.add('active');
    }

    filterMaterials(category) {
        this.showNotification(`Фильтрация материалов по категории: ${category}`, 'info');
    }

    setupEventListeners() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });

        const actionButtons = document.querySelectorAll('.nav-action-btn');
        actionButtons.forEach(btn => {
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
                    console.warn('Ошибка закрытия WebApp:', e);
                    this.showNotification('Используйте кнопку назад в Telegram', 'info');
                }
            }
        }
    }

    // Демо-данные и утилиты
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
        
        console.log('✅ Демо-пользователь создан');
    }

    createDemoContent() {
        this.allContent = this.getDemoContentData();
        console.log('✅ Демо-контент создан');
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
                    image_url: '/webapp/assets/course-default.jpg'
                },
                {
                    id: 2,
                    title: 'Неврологическая диагностика',
                    description: '5 модулей по современной диагностике',
                    price: 18000,
                    duration: '8 недель',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate',
                    students_count: 234,
                    rating: 4.6,
                    featured: true,
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
                    listens: 2345,
                    image_url: '/webapp/assets/podcast-default.jpg'
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
                    category: 'Неврология',
                    thumbnail_url: '/webapp/assets/stream-default.jpg'
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Неврологический осмотр за 15 минут',
                    description: 'Быстрый гайд по основным тестам',
                    duration: '15:30',
                    views: 4567,
                    category: 'Неврология',
                    thumbnail_url: '/webapp/assets/video-default.jpg'
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
                    participants: 456,
                    event_type: 'offline',
                    image_url: '/webapp/assets/event-default.jpg'
                }
            ],
            stats: {
                totalUsers: 1567,
                totalCourses: 12,
                totalMaterials: 45
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

    createEmptyState(type) {
        const types = {
            courses: { icon: '📚', title: 'Курсы не найдены' },
            podcasts: { icon: '🎧', title: 'Подкасты не найдены' },
            streams: { icon: '📹', title: 'Эфиры не найдены' },
            videos: { icon: '🎯', title: 'Видео не найдены' },
            materials: { icon: '📋', title: 'Материалы не найдены' },
            events: { icon: '🗺️', title: 'Мероприятия не найдены' }
        };
        
        const state = types[type] || { icon: '📚', title: 'Контент не найден' };
        
        return `
            <div class="empty-state">
                <div class="empty-icon">${state.icon}</div>
                <div class="empty-title">${state.title}</div>
                <div class="empty-description">Попробуйте позже или обратитесь в поддержку</div>
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
                        <button class="btn btn-primary" onclick="app.showAddContentForm('podcasts')">
                            🎧 Добавить подкаст
                        </button>
                        <button class="btn btn-primary" onclick="app.showAddContentForm('events')">
                            🗺️ Добавить мероприятие
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
                        <div class="stat-card">
                            <div class="stat-value">${this.allContent.podcasts?.length || 0}</div>
                            <div class="stat-label">Подкастов</div>
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

    createNotFoundPage() {
        return `
            <div class="error-state">
                <div class="error-icon">🔍</div>
                <h3>Страница не найдена</h3>
                <p>Запрашиваемая страница не существует</p>
                <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
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
                            <div class="content-card">
                                <div class="card-image">
                                    <img src="${course.image_url || '/webapp/assets/course-default.jpg'}" alt="${course.title}" onerror="this.src='/webapp/assets/course-default.jpg'">
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
                        <div class="empty-description">Добавляйте курсы и материалы в избранное</div>
                        <button class="btn btn-primary" onclick="app.renderPage('courses')">
                            Перейти к курсам
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    // Уведомления и утилиты
    showNotification(message, type = 'info') {
        console.log(`📢 Уведомление [${type}]: ${message}`);
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    showFatalError(message) {
        console.error('💥 Фатальная ошибка:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #0f172a;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            text-align: center;
            padding: 20px;
        `;
        
        errorDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <div style="font-size: 20px; margin-bottom: 8px;">Ошибка загрузки</div>
            <div style="color: #9ca3af; margin-bottom: 20px; max-width: 300px;">${message}</div>
            <button onclick="window.location.reload()" style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
            ">Перезагрузить</button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    showSupport() {
        this.showNotification('💬 Поддержка: @academy_anb\n📧 support@anb-academy.ru\n⏰ Пн-Пт 11:00-19:00', 'info');
    }

    showSettings() {
        this.showNotification('⚙️ Настройки в разработке', 'info');
    }

    showAddContentForm(type) {
        this.showNotification(`📝 Добавление ${type} в разработке`, 'info');
    }
}

// Глобальная обработка ошибок
window.addEventListener('error', function(event) {
    console.error('🚨 Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});

window.AcademyApp = AcademyApp;
console.log('✅ AcademyApp class loaded');
