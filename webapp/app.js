// webapp/app.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        
        this.pages = {
            home: this.createHomePage(),
            courses: this.createContentPage('courses', '📚 Курсы'),
            podcasts: this.createContentPage('podcasts', '🎧 АНБ FM'),
            streams: this.createContentPage('streams', '📹 Эфиры'),
            videos: this.createContentPage('videos', '🎯 Видео-шпаргалки'),
            materials: this.createContentPage('materials', '📋 Материалы'),
            events: this.createContentPage('events', '🗺️ Мероприятия'),
            community: this.createCommunityPage(),
            profile: this.createProfilePage()
        };

        this.init();
    }

    async init() {
        console.log('🚀 Инициализация приложения Академии АНБ...');
        
        // Инициализация навигации
        this.initNavigation();
        
        // Загрузка пользователя и данных
        await this.loadUserData();
        await this.loadContent();
        
        // Показываем главную страницу
        this.renderPage('home');
        
        console.log('✅ Приложение готово к работе');
    }

    initNavigation() {
        // Обработчики навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });

        // Поиск
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchQuery = e.target.value;
                this.performSearch();
            }, 300));
        }

        // Инициализация Telegram WebApp
        if (window.Telegram && Telegram.WebApp) {
            this.initTelegramWebApp();
        }
    }

    initTelegramWebApp() {
        Telegram.WebApp.expand();
        Telegram.WebApp.ready();
        Telegram.WebApp.setHeaderColor('#58b8e7');
        Telegram.WebApp.setBackgroundColor('#ffffff');
        
        // Обработка кнопки "Назад"
        Telegram.WebApp.BackButton.onClick(() => {
            if (this.currentPage !== 'home') {
                this.renderPage('home');
            }
        });
    }

    async loadUserData() {
        try {
            let userId;
            let userData = null;
            
            if (window.Telegram && Telegram.WebApp) {
                const tgUser = Telegram.WebApp.initDataUnsafe.user;
                if (tgUser?.id) {
                    userId = tgUser.id;
                    userData = {
                        id: tgUser.id,
                        firstName: tgUser.first_name || 'User',
                        lastName: tgUser.last_name || '',
                        username: tgUser.username || ''
                    };
                }
            }

            if (userId) {
                const response = await fetch('/api/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                const userResponse = await response.json();
                if (userResponse.success) {
                    this.currentUser = userResponse.user;
                    console.log('✅ Пользователь загружен:', this.currentUser);
                } else {
                    throw new Error('Failed to load user');
                }
            } else {
                // Демо-режим
                this.currentUser = await this.loadDemoUser();
            }

            this.updateUIWithUserData();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
            this.currentUser = await this.loadDemoUser();
            this.updateUIWithUserData();
        }
    }

    async loadDemoUser() {
        try {
            const response = await fetch('/api/content');
            const contentData = await response.json();
            const content = contentData.success ? contentData.data : {};
            
            return {
                id: 1,
                firstName: 'Демо Пользователь',
                lastName: '',
                specialization: 'Невролог',
                city: 'Москва',
                email: 'demo@anb.ru',
                subscription: { 
                    status: 'trial', 
                    type: 'trial_7days',
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
                },
                progress: { 
                    level: 'Понимаю', 
                    steps: {
                        materialsWatched: 5,
                        eventsParticipated: 3,
                        materialsSaved: 7,
                        coursesBought: 1
                    }
                },
                favorites: { 
                    courses: content.courses ? [content.courses[0]?.id].filter(Boolean) : [], 
                    podcasts: content.podcasts ? [content.podcasts[0]?.id].filter(Boolean) : [], 
                    streams: content.streams ? [content.streams[0]?.id].filter(Boolean) : [], 
                    videos: content.videos ? [content.videos[0]?.id].filter(Boolean) : [], 
                    materials: content.materials ? [content.materials[0]?.id].filter(Boolean) : [], 
                    watchLater: content.streams ? [content.streams[0]?.id].filter(Boolean) : [] 
                },
                isAdmin: false,
                joinedAt: new Date('2024-01-01'),
                surveyCompleted: true,
                profileImage: null
            };
        } catch (error) {
            console.error('❌ Ошибка загрузки демо-данных:', error);
            return this.getFallbackUser();
        }
    }

    getFallbackUser() {
        return {
            id: 1,
            firstName: 'Демо Пользователь',
            lastName: '',
            specialization: 'Невролог',
            city: 'Москва',
            email: 'demo@anb.ru',
            subscription: { 
                status: 'trial', 
                type: 'trial_7days',
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            },
            progress: { 
                level: 'Понимаю', 
                steps: {
                    materialsWatched: 5,
                    eventsParticipated: 3,
                    materialsSaved: 7,
                    coursesBought: 1
                }
            },
            favorites: { 
                courses: [1], 
                podcasts: [1], 
                streams: [1], 
                videos: [1], 
                materials: [1], 
                watchLater: [1] 
            },
            isAdmin: false,
            joinedAt: new Date('2024-01-01'),
            surveyCompleted: true,
            profileImage: null
        };
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            const data = await response.json();
            
            if (data.success) {
                this.allContent = data.data;
                console.log('✅ Контент загружен:', this.allContent);
            } else {
                throw new Error('Failed to load content');
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки контента:', error);
            this.allContent = {};
            this.showNotification('⚠️ Не удалось загрузить контент', 'error');
        }
    }

    renderPage(page) {
        this.currentPage = page;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) return;

        // Обновляем навигацию
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Показываем/скрываем кнопку "Назад" в Telegram
        if (window.Telegram && Telegram.WebApp) {
            if (page !== 'home') {
                Telegram.WebApp.BackButton.show();
            } else {
                Telegram.WebApp.BackButton.hide();
            }
        }

        // Рендерим страницу
        mainContent.innerHTML = this.pages[page] || this.pages.home;

        // Инициализируем страницу
        this.initializePage(page);
    }

    createHomePage() {
        return `
            <div class="page">
                <div class="hero-section">
                    <div class="hero-text">
                        <h2>Академия АНБ</h2>
                        <p>Профессиональное развитие в неврологии и реабилитации</p>
                    </div>
                </div>

                <div class="quick-nav">
                    <h3>🚀 Быстрый старт</h3>
                    <div class="grid">
                        ${this.createNavigationCard('courses', '📚', 'Курсы', 'Системное обучение с сертификатами')}
                        ${this.createNavigationCard('podcasts', '🎧', 'АНБ FM', 'Аудио-подкасты и интервью')}
                        ${this.createNavigationCard('streams', '📹', 'Эфиры', 'Прямые эфиры и разборы кейсов')}
                        ${this.createNavigationCard('videos', '🎯', 'Шпаргалки', 'Короткие видео с техниками')}
                        ${this.createNavigationCard('materials', '📋', 'Материалы', 'Практические инструменты')}
                        ${this.createNavigationCard('events', '🗺️', 'Мероприятия', 'Онлайн и офлайн события')}
                    </div>
                </div>

                <div class="news-section">
                    <div class="section-header">
                        <h3>📰 Последние новости</h3>
                        <div class="filters" id="newsFilters">
                            <button class="filter-btn active" data-filter="all">Все</button>
                            <button class="filter-btn" data-filter="courses">Курсы</button>
                            <button class="filter-btn" data-filter="events">События</button>
                        </div>
                    </div>
                    <div class="news-list" id="newsList">
                        <div class="loading">Загрузка новостей...</div>
                    </div>
                </div>

                <div class="stats-section">
                    <div class="section-header">
                        <h3>📊 Ваша активность</h3>
                    </div>
                    <div class="stats-grid" id="homeStats">
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <div class="stat-value">0</div>
                                <div class="stat-label">Курсов пройдено</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <div class="stat-value">0</div>
                                <div class="stat-label">Материалов изучено</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createNavigationCard(page, icon, title, description) {
        const navItem = this.allContent.navigation?.find(item => item.target_page === page);
        const imageUrl = navItem?.image_url || `/uploads/nav-${page}.jpg`;
        
        return `
            <div class="card" onclick="academyApp.renderPage('${page}')">
                <div class="card-icon">${icon}</div>
                <div class="card-title">${title}</div>
                <div class="card-desc">${description}</div>
            </div>
        `;
    }

    createContentPage(type, title) {
        return `
            <div class="page">
                <h2>${title}</h2>
                
                <div class="content-filters">
                    <div class="search-container">
                        <input type="text" placeholder="Поиск..." class="search-input" id="${type}Search">
                    </div>
                    <div class="category-filters" id="${type}Categories">
                        <button class="filter-btn active" data-category="all">Все</button>
                    </div>
                </div>

                <div class="content-grid" id="${type}Grid">
                    <div class="loading">Загрузка ${title.toLowerCase()}...</div>
                </div>
            </div>
        `;
    }

    createCommunityPage() {
        return `
            <div class="page">
                <h2>👥 Сообщество</h2>
                
                <div class="community-stats">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value" id="communityMembers">1.2K</div>
                            <div class="stat-label">Участников</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" id="activeDiscussions">45</div>
                            <div class="stat-label">Обсуждений</div>
                        </div>
                    </div>
                </div>

                <div class="community-chats">
                    <h3>💬 Чаты сообщества</h3>
                    <div class="chats-list">
                        <div class="chat-item" onclick="academyApp.openChat('general')">
                            <div class="chat-icon">💬</div>
                            <div class="chat-info">
                                <div class="chat-name">Флудилка</div>
                                <div class="chat-desc">Неформальное общение</div>
                                <div class="chat-meta">1.2K участников</div>
                            </div>
                        </div>
                        <div class="chat-item" onclick="academyApp.openChat('specialists')">
                            <div class="chat-icon">👥</div>
                            <div class="chat-info">
                                <div class="chat-name">Чат специалистов</div>
                                <div class="chat-desc">Профессиональные обсуждения</div>
                                <div class="chat-meta">856 участников</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="faq-section">
                    <h3>❓ Частые вопросы</h3>
                    <div class="faq-list" id="faqList">
                        <div class="loading">Загрузка вопросов...</div>
                    </div>
                </div>
            </div>
        `;
    }

    createProfilePage() {
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar-large" id="profileAvatar">👤</div>
                        <div class="profile-info">
                            <div class="profile-name" id="userName">Пользователь</div>
                            <div class="profile-status">Член Академии АНБ с <span id="joinDate"></span></div>
                            <div class="profile-badge" id="userBadge">Активный участник</div>
                        </div>
                    </div>
                    
                    <div class="subscription-info">
                        <div class="subscription-status" id="subscriptionStatus">
                            <div class="status-icon">❌</div>
                            <div class="status-text">Подписка: не активна</div>
                        </div>
                        <button class="btn btn-primary" onclick="academyApp.changeSubscription()">Изменить подписку</button>
                    </div>
                </div>

                <div class="journey-section">
                    <h3>🎯 Мой путь развития</h3>
                    <div class="journey-progress" id="journeyProgress">
                        <div class="loading">Загрузка прогресса...</div>
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Моя активность</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <div class="stat-value" id="coursesCompleted">0</div>
                                <div class="stat-label">Пройдено курсов</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <div class="stat-value" id="materialsWatched">0</div>
                                <div class="stat-label">Просмотрено материалов</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-value" id="eventsAttended">0</div>
                                <div class="stat-label">Мероприятий посещено</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💾</div>
                            <div class="stat-info">
                                <div class="stat-value" id="materialsSaved">0</div>
                                <div class="stat-label">Материалов сохранено</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn btn-outline" onclick="academyApp.editProfile()">✏️ Редактировать профиль</button>
                    <button class="btn btn-outline" onclick="academyApp.showAchievements()">🏆 Мои достижения</button>
                    ${this.currentUser?.isAdmin ? `
                        <button class="btn btn-primary" onclick="academyApp.goToAdminPanel()">🔧 Админ-панель</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    initializePage(page) {
        switch (page) {
            case 'home':
                this.initHomePage();
                break;
            case 'courses':
            case 'podcasts':
            case 'streams':
            case 'videos':
            case 'materials':
            case 'events':
                this.initContentPage(page);
                break;
            case 'community':
                this.initCommunityPage();
                break;
            case 'profile':
                this.updateProfileData();
                break;
        }
    }

    async initHomePage() {
        await this.loadNews();
        this.initNewsFilters();
        this.updateHomeStats();
    }

    async loadNews() {
        const newsList = document.getElementById('newsList');
        if (!newsList) return;

        try {
            const response = await fetch('/api/news?limit=5');
            const data = await response.json();
            
            if (data.success && data.news.length > 0) {
                this.displayNews(data.news);
            } else {
                this.generateNewsFromContent();
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки новостей:', error);
            this.generateNewsFromContent();
        }
    }

    displayNews(news) {
        const newsList = document.getElementById('newsList');
        if (!newsList) return;

        if (news.length === 0) {
            newsList.innerHTML = this.createEmptyState('📰', 'Новости пока не добавлены', 'Следите за обновлениями');
            return;
        }

        newsList.innerHTML = news.map(item => `
            <div class="news-item" data-type="${item.category}">
                ${item.image_url ? `
                    <div class="news-image">
                        <img src="${item.image_url}" alt="${item.title}" onerror="this.style.display='none'">
                    </div>
                ` : ''}
                <div class="news-category">${item.category}</div>
                <div class="news-title">${item.title}</div>
                <div class="news-date">${new Date(item.created_at).toLocaleDateString('ru-RU')}</div>
                <div class="news-excerpt">${item.content}</div>
            </div>
        `).join('');
    }

    generateNewsFromContent() {
        const news = [];
        
        if (this.allContent.courses && this.allContent.courses.length > 0) {
            this.allContent.courses.slice(0, 2).forEach(course => {
                news.push({
                    category: 'Курсы',
                    title: `Новый курс: "${course.title}"`,
                    date: new Date(course.created_at).toLocaleDateString('ru-RU'),
                    content: course.description,
                    image_url: course.image_url
                });
            });
        }
        
        if (this.allContent.events && this.allContent.events.length > 0) {
            this.allContent.events.slice(0, 2).forEach(event => {
                news.push({
                    category: 'Мероприятия',
                    title: `Предстоящее мероприятие: "${event.title}"`,
                    date: new Date(event.created_at).toLocaleDateString('ru-RU'),
                    content: event.description,
                    image_url: event.image_url
                });
            });
        }
        
        if (news.length < 3) {
            news.push({
                category: 'Развитие',
                title: 'Запуск новой образовательной платформы',
                date: new Date().toLocaleDateString('ru-RU'),
                content: 'Академия АНБ представляет обновленную платформу для профессионального развития врачей',
                image_url: '/uploads/news-launch.jpg'
            });
        }
        
        this.displayNews(news.slice(0, 5));
    }

    initNewsFilters() {
        document.querySelectorAll('#newsFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#newsFilters .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterNews(btn.dataset.filter);
            });
        });
    }

    filterNews(filter) {
        const newsItems = document.querySelectorAll('.news-item');
        let visibleCount = 0;
        
        newsItems.forEach(item => {
            if (filter === 'all' || item.dataset.type === filter) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        if (visibleCount === 0) {
            document.getElementById('newsList').innerHTML = this.createEmptyState('🔍', 'Новости не найдены', 'Попробуйте другой фильтр');
        }
    }

    updateHomeStats() {
        if (!this.currentUser) return;

        const coursesCompleted = document.getElementById('coursesCompleted');
        const materialsWatched = document.getElementById('materialsWatched');

        if (coursesCompleted) coursesCompleted.textContent = this.currentUser.progress.steps.coursesBought || 0;
        if (materialsWatched) materialsWatched.textContent = this.currentUser.progress.steps.materialsWatched || 0;
    }

    async initContentPage(contentType) {
        await this.loadContentData(contentType);
        this.initContentFilters(contentType);
    }

    async loadContentData(contentType) {
        const contentGrid = document.getElementById(`${contentType}Grid`);
        if (!contentGrid) return;

        contentGrid.innerHTML = '<div class="loading">Загрузка...</div>';

        try {
            const content = this.allContent[contentType] || [];
            
            if (content.length === 0) {
                contentGrid.innerHTML = this.createEmptyState(
                    this.getContentIcon(contentType),
                    `${this.getContentTypeName(contentType)} не найдены`,
                    'Здесь скоро появятся новые материалы'
                );
                return;
            }

            contentGrid.innerHTML = content.map(item => this.createContentCard(contentType, item)).join('');

        } catch (error) {
            console.error(`❌ Ошибка загрузки ${contentType}:`, error);
            contentGrid.innerHTML = '<div class="error">Ошибка загрузки</div>';
        }
    }

    createContentCard(contentType, item) {
        const isFavorite = this.isFavorite(contentType, item.id);
        
        return `
            <div class="content-card">
                <div class="content-card-header">
                    <div class="content-icon">${this.getContentIcon(contentType)}</div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="academyApp.toggleFavorite('${contentType}', ${item.id})">
                        ${isFavorite ? '★' : '☆'}
                    </button>
                </div>
                ${item.image_url ? `
                    <div class="content-image">
                        <img src="${item.image_url}" alt="${item.title}" onerror="this.style.display='none'">
                    </div>
                ` : ''}
                <div class="content-card-body">
                    <div class="content-title">${item.title}</div>
                    <div class="content-description">${item.description || 'Описание отсутствует'}</div>
                    <div class="content-meta">
                        ${item.duration ? `<span class="meta-item">⏱️ ${item.duration}</span>` : ''}
                        ${item.price ? `<span class="meta-item">💰 ${this.formatPrice(item.price)}</span>` : ''}
                        ${!item.price && contentType !== 'courses' ? `<span class="meta-item free">🆓 Бесплатно</span>` : ''}
                        ${item.modules ? `<span class="meta-item">📚 ${item.modules} модулей</span>` : ''}
                        ${item.category ? `<span class="meta-item">🏷️ ${item.category}</span>` : ''}
                    </div>
                </div>
                <div class="content-card-actions">
                    <button class="btn btn-outline" onclick="academyApp.addToWatchLater('${contentType}', ${item.id})">📥 Позже</button>
                    <button class="btn btn-primary" onclick="academyApp.openContent('${contentType}', ${item.id})">
                        ${this.getActionButtonText(contentType)}
                    </button>
                </div>
            </div>
        `;
    }

    initContentFilters(contentType) {
        const searchInput = document.getElementById(`${contentType}Search`);
        const categoriesContainer = document.getElementById(`${contentType}Categories`);

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchQuery = e.target.value;
                this.filterContent(contentType);
            }, 300));
        }

        if (categoriesContainer) {
            this.initCategoryFilters(contentType, categoriesContainer);
        }
    }

    initCategoryFilters(contentType, container) {
        const categories = this.allContent.categories?.filter(cat => cat.type === contentType) || [];
        const uniqueCategories = [...new Set(categories.map(cat => cat.name))];
        
        if (uniqueCategories.length > 0) {
            container.innerHTML = `
                <button class="filter-btn active" data-category="all">Все</button>
                ${uniqueCategories.map(category => `
                    <button class="filter-btn" data-category="${category}">${category}</button>
                `).join('')}
            `;

            container.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.currentCategory = btn.dataset.category;
                    this.filterContent(contentType);
                });
            });
        }
    }

    filterContent(contentType) {
        const contentGrid = document.getElementById(`${contentType}Grid`);
        const cards = contentGrid?.querySelectorAll('.content-card');
        
        if (!cards) return;

        let visibleCount = 0;
        
        cards.forEach(card => {
            const title = card.querySelector('.content-title').textContent.toLowerCase();
            const description = card.querySelector('.content-description').textContent.toLowerCase();
            const category = card.querySelector('.meta-item:last-child')?.textContent || '';
            
            const matchesSearch = !this.searchQuery || 
                                title.includes(this.searchQuery.toLowerCase()) ||
                                description.includes(this.searchQuery.toLowerCase());
            
            const matchesCategory = this.currentCategory === 'all' || 
                                  category.includes(this.currentCategory);
            
            if (matchesSearch && matchesCategory) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        if (visibleCount === 0) {
            contentGrid.innerHTML = this.createEmptyState('🔍', 'Ничего не найдено', 'Попробуйте изменить параметры поиска');
        }
    }

    async initCommunityPage() {
        await this.loadFAQ();
        this.initFAQ();
    }

    async loadFAQ() {
        const faqList = document.getElementById('faqList');
        if (!faqList) return;

        try {
            const response = await fetch('/api/faq');
            const data = await response.json();
            
            if (data.success) {
                this.displayFAQ(data.faq);
            } else {
                this.displayDefaultFAQ();
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки FAQ:', error);
            this.displayDefaultFAQ();
        }
    }

    displayFAQ(faqItems) {
        const faqList = document.getElementById('faqList');
        if (!faqList) return;

        faqList.innerHTML = faqItems.map(item => `
            <div class="faq-item">
                <div class="faq-question" onclick="academyApp.toggleFAQ(this)">
                    ${item.question}
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">${item.answer}</div>
            </div>
        `).join('');
    }

    displayDefaultFAQ() {
        const defaultFAQ = [
            {
                question: "Как оформить подписку?",
                answer: "Подписку можно оформить в разделе «Профиль» через кнопку «Изменить подписку»."
            },
            {
                question: "Что входит в подписку?",
                answer: "Полный доступ ко всем курсам, материалам, эфирам и участие в сообществе."
            }
        ];
        
        this.displayFAQ(defaultFAQ);
    }

    initFAQ() {
        // Инициализация уже выполнена в displayFAQ
    }

    toggleFAQ(element) {
        const answer = element.nextElementSibling;
        const isVisible = answer.style.display === 'block';
        
        document.querySelectorAll('.faq-answer').forEach(ans => {
            ans.style.display = 'none';
        });
        
        document.querySelectorAll('.faq-toggle').forEach(toggle => {
            toggle.textContent = '+';
        });
        
        answer.style.display = isVisible ? 'none' : 'block';
        element.querySelector('.faq-toggle').textContent = isVisible ? '+' : '−';
    }

    updateUIWithUserData() {
        if (!this.currentUser) return;
        
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            adminBadge.style.display = this.currentUser.isAdmin ? 'block' : 'none';
        }
    }

    updateProfileData() {
        if (!this.currentUser) return;
        
        this.updateProfileUI();
        this.updateProfileStats();
        this.loadJourneyProgress();
    }

    updateProfileUI() {
        const userName = document.getElementById('userName');
        const profileAvatar = document.getElementById('profileAvatar');
        const joinDate = document.getElementById('joinDate');
        const userBadge = document.getElementById('userBadge');
        const subscriptionStatus = document.getElementById('subscriptionStatus');

        if (userName) userName.textContent = this.currentUser.firstName + (this.currentUser.lastName ? ' ' + this.currentUser.lastName : '');
        if (profileAvatar) profileAvatar.textContent = this.currentUser.profileImage ? '' : '👤';
        if (joinDate) joinDate.textContent = new Date(this.currentUser.joinedAt).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'});
        if (userBadge) userBadge.textContent = this.getUserBadge(this.currentUser.progress.level);

        if (subscriptionStatus) {
            let statusHTML = '';
            
            if (this.currentUser.subscription.status === 'trial') {
                const endDate = this.currentUser.subscription.endDate ? 
                    new Date(this.currentUser.subscription.endDate).toLocaleDateString('ru-RU') : 'неизвестно';
                statusHTML = `
                    <div class="status-icon">🆓</div>
                    <div class="status-text">
                        <div>Подписка: пробный период</div>
                        <div class="status-date">до ${endDate}</div>
                    </div>
                `;
                subscriptionStatus.className = 'subscription-status trial';
            } else if (this.currentUser.subscription.status === 'active') {
                const endDate = this.currentUser.subscription.endDate ? 
                    new Date(this.currentUser.subscription.endDate).toLocaleDateString('ru-RU') : 'неизвестно';
                statusHTML = `
                    <div class="status-icon">✅</div>
                    <div class="status-text">
                        <div>Подписка: активна</div>
                        <div class="status-date">до ${endDate}</div>
                    </div>
                `;
                subscriptionStatus.className = 'subscription-status active';
            } else {
                statusHTML = `
                    <div class="status-icon">❌</div>
                    <div class="status-text">Подписка: не активна</div>
                `;
                subscriptionStatus.className = 'subscription-status inactive';
            }
            
            subscriptionStatus.innerHTML = statusHTML;
        }
    }

    updateProfileStats() {
        if (!this.currentUser) return;
        
        const coursesCompleted = document.getElementById('coursesCompleted');
        const materialsWatched = document.getElementById('materialsWatched');
        const eventsAttended = document.getElementById('eventsAttended');
        const materialsSaved = document.getElementById('materialsSaved');

        if (coursesCompleted) coursesCompleted.textContent = this.currentUser.progress.steps.coursesBought || 0;
        if (materialsWatched) materialsWatched.textContent = this.currentUser.progress.steps.materialsWatched || 0;
        if (eventsAttended) eventsAttended.textContent = this.currentUser.progress.steps.eventsParticipated || 0;
        if (materialsSaved) materialsSaved.textContent = this.currentUser.progress.steps.materialsSaved || 0;
    }

    loadJourneyProgress() {
        const journeyProgress = document.getElementById('journeyProgress');
        if (!journeyProgress) return;

        const levels = [
            {
                level: 'Понимаю',
                title: 'Понимаю',
                description: 'Начинаю замечать закономерности и связи. Не просто слышу жалобы — вижу структуру боли.',
                progress: this.calculateLevelProgress('Понимаю'),
                total: 9,
                current: this.calculateCurrentProgress('Понимаю'),
                hint: 'Чтобы перейти к следующему этапу — продолжайте участвовать в эфирах и сохраняйте всё, что откликается, в «Мои материалы».',
                active: this.currentUser.progress.level === 'Понимаю'
            },
            {
                level: 'Связываю', 
                title: 'Связываю',
                description: 'Закономерности и связи складываются в единую картину. Боль приобретает смысл.',
                progress: this.calculateLevelProgress('Связываю'),
                total: 25,
                current: this.calculateCurrentProgress('Связываю'),
                hint: 'Чтобы перейти к следующему этапу — участвуйте в разборах и ищите взаимосвязи между изученными материалами.',
                active: this.currentUser.progress.level === 'Связываю'
            }
        ];

        journeyProgress.innerHTML = levels.map(level => `
            <div class="journey-step ${level.active ? 'active' : ''}">
                <div class="step-marker">${levels.indexOf(level) + 1}</div>
                <div class="step-content">
                    <div class="step-title">${level.title}</div>
                    <div class="step-description">${level.description}</div>
                    <div class="step-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${level.progress}%"></div>
                        </div>
                        <div class="progress-text">${level.current} из ${level.total}</div>
                    </div>
                    ${level.hint ? `<div class="step-hint">${level.hint}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    calculateLevelProgress(level) {
        // Упрощенная логика для демонстрации
        return this.currentUser.progress.level === level ? 65 : 
               this.currentUser.progress.level > level ? 100 : 0;
    }

    calculateCurrentProgress(level) {
        // Упрощенная логика для демонстрации
        return this.currentUser.progress.level === level ? 6 : 0;
    }

    // Вспомогательные методы
    getContentIcon(contentType) {
        const icons = {
            'courses': '📚',
            'podcasts': '🎧',
            'streams': '📹',
            'videos': '🎯',
            'materials': '📋',
            'events': '🗺️'
        };
        return icons[contentType] || '📄';
    }

    getContentTypeName(contentType) {
        const names = {
            'courses': 'Курсы',
            'podcasts': 'Подкасты',
            'streams': 'Эфиры',
            'videos': 'Видео',
            'materials': 'Материалы',
            'events': 'Мероприятия'
        };
        return names[contentType] || contentType;
    }

    getActionButtonText(contentType) {
        const actions = {
            'courses': 'Записаться',
            'podcasts': 'Слушать',
            'streams': 'Смотреть',
            'videos': 'Смотреть',
            'materials': 'Открыть',
            'events': 'Участвовать'
        };
        return actions[contentType] || 'Открыть';
    }

    getUserBadge(level) {
        const badges = {
            'Понимаю': 'Начинающий специалист',
            'Связываю': 'Активный участник',
            'Применяю': 'Практикующий специалист'
        };
        return badges[level] || 'Участник академии';
    }

    isFavorite(contentType, contentId) {
        return this.currentUser && this.currentUser.favorites && 
               this.currentUser.favorites[contentType]?.includes(contentId);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    createEmptyState(icon, text, hint) {
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <div class="empty-text">${text}</div>
                <div class="empty-hint">${hint}</div>
            </div>
        `;
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

    // Интерактивные методы
    async toggleFavorite(contentType, contentId) {
        if (!this.currentUser) {
            this.showNotification('⚠️ Необходимо войти в систему');
            return;
        }

        const isCurrentlyFavorite = this.isFavorite(contentType, contentId);
        
        try {
            const response = await fetch(`/api/user/${this.currentUser.id}/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType,
                    contentId,
                    action: isCurrentlyFavorite ? 'remove' : 'add'
                })
            });
            
            const data = await response.json();
            if (data.success) {
                this.currentUser.favorites = data.favorites;
                this.showNotification(isCurrentlyFavorite ? '❌ Удалено из избранного' : '⭐ Добавлено в избранное');
                
                // Обновляем UI если нужно
                if (this.currentPage === contentType) {
                    this.loadContentData(contentType);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка обновления избранного:', error);
            this.showNotification('❌ Ошибка при обновлении избранного', 'error');
        }
    }

    async addToWatchLater(contentType, contentId) {
        if (!this.currentUser) {
            this.showNotification('⚠️ Необходимо войти в систему');
            return;
        }

        try {
            const response = await fetch(`/api/user/${this.currentUser.id}/watch-later`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType,
                    contentId,
                    action: 'add'
                })
            });
            
            const data = await response.json();
            if (data.success) {
                this.currentUser.favorites.watchLater = data.watchLater;
                this.showNotification('📥 Добавлено в "Посмотреть позже"');
            }
        } catch (error) {
            console.error('❌ Ошибка добавления в список:', error);
            this.showNotification('❌ Ошибка при добавлении в список', 'error');
        }
    }

    openContent(contentType, contentId) {
        const content = this.allContent[contentType]?.find(item => item.id === contentId);
        if (!content) {
            this.showNotification('❌ Контент не найден');
            return;
        }

        // Проверяем доступ
        if (!this.hasAccessToContent(content)) {
            this.showNotification('🔒 Для доступа к этому контенту нужна активная подписка');
            this.changeSubscription();
            return;
        }

        this.showContentModal(contentType, content);
    }

    hasAccessToContent(content) {
        if (!this.currentUser) return false;
        
        // Бесплатный контент доступен всем
        if (!content.price || content.price === 0) return true;
        
        // Проверяем активную подписку
        return this.currentUser.subscription.status === 'active' || 
               this.currentUser.subscription.status === 'trial' ||
               this.currentUser.isAdmin;
    }

    showContentModal(contentType, content) {
        const modalHTML = `
            <div class="modal" id="contentModal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>${content.title}</h3>
                        <button class="close-btn" onclick="academyApp.closeModal('contentModal')">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="content-preview">
                            ${content.image_url ? `
                                <div class="preview-image">
                                    <img src="${content.image_url}" alt="${content.title}">
                                </div>
                            ` : ''}
                            <div class="preview-info">
                                <div class="preview-title">${content.title}</div>
                                <div class="preview-description">${content.description || ''}</div>
                                <div class="preview-meta">
                                    ${content.duration ? `<span>⏱️ ${content.duration}</span>` : ''}
                                    ${content.price ? `<span>💰 ${this.formatPrice(content.price)}</span>` : ''}
                                    ${content.category ? `<span>🏷️ ${content.category}</span>` : ''}
                                </div>
                            </div>
                            
                            <div class="content-actions-full">
                                <button class="btn btn-primary" onclick="academyApp.startContent('${contentType}', ${content.id})">
                                    ${this.getActionButtonText(contentType)}
                                </button>
                                <button class="btn btn-outline" onclick="academyApp.toggleFavorite('${contentType}', ${content.id})">
                                    ${this.isFavorite(contentType, content.id) ? '★ В избранном' : '☆ В избранное'}
                                </button>
                            </div>
                            
                            ${content.full_description ? `
                                <div class="content-full-description">
                                    <h4>Описание</h4>
                                    <p>${content.full_description}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    startContent(contentType, contentId) {
        this.showNotification(`🎬 Начинаем ${this.getContentTypeName(contentType).toLowerCase()}...`);
        this.closeModal('contentModal');
        this.updateUserProgress('materialsWatched');
    }

    changeSubscription() {
        this.showNotification('💳 Открываем выбор подписки...');
        // В реальном приложении здесь будет открытие модального окна с выбором тарифов
    }

    editProfile() {
        this.showNotification('✏️ Редактирование профиля в разработке');
    }

    showAchievements() {
        this.showNotification('🏆 Достижения в разработке');
    }

    goToAdminPanel() {
        window.location.href = '/admin.html';
    }

    openChat(chatType) {
        if (!this.currentUser || this.currentUser.subscription.status === 'inactive') {
            this.showNotification('💬 Для доступа к чатам необходима активная подписка');
            return;
        }
        
        this.showNotification(`💬 Открываем чат...`);
    }

    performSearch() {
        if (this.searchQuery.trim()) {
            this.showNotification(`🔍 Поиск: "${this.searchQuery}"`);
            // В реальном приложении здесь будет переход на страницу поиска
        }
    }

    async updateUserProgress(metric) {
        if (!this.currentUser) return;
        
        try {
            const response = await fetch(`/api/user/${this.currentUser.id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metric })
            });
            
            const data = await response.json();
            if (data.success) {
                this.currentUser.progress = data.progress;
                if (this.currentPage === 'profile') {
                    this.updateProfileStats();
                    this.loadJourneyProgress();
                }
            }
        } catch (error) {
            console.error('❌ Ошибка обновления прогресса:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#58b8e7'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }
}

// Инициализация приложения
const academyApp = new AcademyApp();

// Глобальные функции для onclick атрибутов
window.toggleSearch = function() {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
        if (searchContainer.style.display === 'block') {
            document.getElementById('searchInput')?.focus();
        }
    }
};
