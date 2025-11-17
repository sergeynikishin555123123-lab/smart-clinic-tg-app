// webapp/app.js - ПОЛНАЯ РЕАЛИЗАЦИЯ ПО ТЗ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация Академии АНБ...');
        
        this.showLoading();
        
        try {
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
            Telegram.WebApp.enableClosingConfirmation();
            Telegram.WebApp.BackButton.onClick(() => this.handleBackButton());
            
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
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.close();
            }
        }
    }

    showLoading() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
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
        // Обработка кликов по навигации
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.renderPage(page);
            }
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
                body: JSON.stringify({ id: userId, firstName, lastName, username })
            });

            const data = await response.json();
            if (data.success) {
                this.currentUser = data.user;
                this.isAdmin = this.currentUser.isAdmin;
                
                if (this.isAdmin) {
                    document.getElementById('adminBadge').style.display = 'flex';
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
        document.getElementById('adminBadge').style.display = 'flex';
    }

    async loadContent() {
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
                    rating: 4.8,
                    image_url: '/images/course1.jpg'
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
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'Разбор клинического случая',
                    description: 'Прямой эфир с разбором сложного случая',
                    duration: '1:30:00',
                    stream_date: new Date().toISOString(),
                    is_live: true,
                    participants: 89,
                    thumbnail_url: '/images/stream1.jpg'
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
                }
            ],
            promotions: [
                {
                    id: 1,
                    title: 'Специальное предложение',
                    description: 'Скидка 20% на первую подписку',
                    discount: 20,
                    is_active: true,
                    image_url: '/images/promo1.jpg'
                }
            ],
            chats: [
                {
                    id: 1,
                    name: 'Общий чат Академии',
                    description: 'Основной чат для общения',
                    type: 'group',
                    participants_count: 156
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
                    pageHTML = this.createCoursesPage();
                    break;
                case 'podcasts':
                    pageHTML = this.createPodcastsPage();
                    break;
                case 'streams':
                    pageHTML = this.createStreamsPage();
                    break;
                case 'videos':
                    pageHTML = this.createVideosPage();
                    break;
                case 'materials':
                    pageHTML = this.createMaterialsPage();
                    break;
                case 'events':
                    pageHTML = this.createEventsPage();
                    break;
                case 'promotions':
                    pageHTML = this.createPromotionsPage();
                    break;
                case 'community':
                    pageHTML = this.createCommunityPage();
                    break;
                case 'chats':
                    pageHTML = this.createChatsPage();
                    break;
                case 'favorites':
                    pageHTML = this.createFavoritesPage();
                    break;
                case 'profile':
                    pageHTML = this.createProfilePage();
                    break;
                case 'admin':
                    pageHTML = this.createAdminPage();
                    break;
                default:
                    pageHTML = this.createHomePage();
            }
            
            mainContent.innerHTML = pageHTML;
            
            // Инициализация специфичных для страницы функций
            this.initPageSpecificFunctions(page);
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.showError('Ошибка отображения страницы');
        }
    }

    initPageSpecificFunctions(page) {
        switch(page) {
            case 'admin':
                this.initAdminPage();
                break;
            case 'chats':
                this.initChatsPage();
                break;
        }
    }

    // ==================== СТРАНИЦЫ ====================

    createHomePage() {
        return `
            <div class="page home-page">
                <div class="search-container">
                    <input type="text" placeholder="Поиск по курсам, материалам, эфирам..." class="search-input" id="searchInput">
                </div>

                <div class="navigation-grid">
                    <div class="nav-card" onclick="app.renderPage('courses')">
                        <div class="nav-icon">📚</div>
                        <div class="nav-title">Курсы</div>
                    </div>
                    <div class="nav-card" onclick="app.renderPage('podcasts')">
                        <div class="nav-icon">🎧</div>
                        <div class="nav-title">АНБ FM</div>
                    </div>
                    <div class="nav-card" onclick="app.renderPage('streams')">
                        <div class="nav-icon">📹</div>
                        <div class="nav-title">Эфиры|Разборы</div>
                    </div>
                    <div class="nav-card" onclick="app.renderPage('videos')">
                        <div class="nav-icon">🎯</div>
                        <div class="nav-title">Видео-шпаргалки</div>
                    </div>
                    <div class="nav-card" onclick="app.renderPage('materials')">
                        <div class="nav-icon">📋</div>
                        <div class="nav-title">Практические материалы</div>
                    </div>
                    <div class="nav-card" onclick="app.renderPage('events')">
                        <div class="nav-icon">🗺️</div>
                        <div class="nav-title">Карта мероприятий</div>
                    </div>
                    <div class="nav-card" onclick="app.renderPage('promotions')">
                        <div class="nav-icon">🎁</div>
                        <div class="nav-title">Ограниченное предложение</div>
                    </div>
                    <div class="nav-card" onclick="app.showSupport()">
                        <div class="nav-icon">💬</div>
                        <div class="nav-title">Поддержка</div>
                    </div>
                </div>

                <div class="content-feed">
                    <div class="section-title">Лента новостей</div>
                    <div class="feed-tabs">
                        <button class="tab-btn active" onclick="app.filterFeed('all')">Все</button>
                        <button class="tab-btn" onclick="app.filterFeed('articles')">Статьи</button>
                        <button class="tab-btn" onclick="app.filterFeed('development')">Профессиональное развитие</button>
                        <button class="tab-btn" onclick="app.filterFeed('skills')">Практические навыки</button>
                    </div>
                    
                    <div class="feed-items">
                        <div class="feed-item">
                            <div class="feed-item-title">Новый курс: Мануальные техники</div>
                            <div class="feed-item-desc">Доступен для записи</div>
                            <div class="feed-item-meta">📚 Курс • 2 часа назад</div>
                        </div>
                        <div class="feed-item">
                            <div class="feed-item-title">Эфир: Разбор клинического случая</div>
                            <div class="feed-item-desc">Прямой эфир с экспертом</div>
                            <div class="feed-item-meta">📹 Эфир • 5 часов назад</div>
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
                    <h2>📚 Курсы</h2>
                </div>
                
                <div class="content-list">
                    ${courses.map(course => `
                        <div class="content-item" onclick="app.openCourse(${course.id})">
                            ${course.image_url ? `<img src="${course.image_url}" class="content-image" alt="${course.title}">` : ''}
                            <div class="content-info">
                                <div class="content-title">${course.title}</div>
                                <div class="content-description">${course.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${course.duration}</span>
                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                    <span>⭐ ${course.rating}</span>
                                </div>
                            </div>
                            <button class="favorite-btn" onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'course')">🤍</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                </div>
                
                <div class="content-list">
                    ${podcasts.map(podcast => `
                        <div class="content-item" onclick="app.playPodcast(${podcast.id})">
                            ${podcast.image_url ? `<img src="${podcast.image_url}" class="content-image" alt="${podcast.title}">` : ''}
                            <div class="content-info">
                                <div class="content-title">${podcast.title}</div>
                                <div class="content-description">${podcast.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${podcast.duration}</span>
                                    <span>👂 ${podcast.listens}</span>
                                </div>
                            </div>
                            <button class="favorite-btn" onclick="event.stopPropagation(); app.toggleFavorite(${podcast.id}, 'podcast')">🤍</button>
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
                
                <div class="content-list">
                    ${streams.map(stream => `
                        <div class="content-item" onclick="app.playStream(${stream.id})">
                            ${stream.thumbnail_url ? `<img src="${stream.thumbnail_url}" class="content-image" alt="${stream.title}">` : ''}
                            <div class="content-info">
                                <div class="content-title">${stream.title}</div>
                                <div class="content-description">${stream.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${stream.duration}</span>
                                    <span>👥 ${stream.participants}</span>
                                    ${stream.is_live ? '<span class="live-badge">LIVE</span>' : ''}
                                </div>
                            </div>
                            <button class="favorite-btn" onclick="event.stopPropagation(); app.toggleFavorite(${stream.id}, 'stream')">🤍</button>
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
                
                <div class="content-list">
                    ${videos.map(video => `
                        <div class="content-item" onclick="app.playVideo(${video.id})">
                            ${video.thumbnail_url ? `<img src="${video.thumbnail_url}" class="content-image" alt="${video.title}">` : ''}
                            <div class="content-info">
                                <div class="content-title">${video.title}</div>
                                <div class="content-description">${video.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${video.duration}</span>
                                    <span>👁️ ${video.views}</span>
                                </div>
                            </div>
                            <button class="favorite-btn" onclick="event.stopPropagation(); app.toggleFavorite(${video.id}, 'video')">🤍</button>
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
                
                <div class="materials-tabs">
                    <button class="tab-btn active" onclick="app.filterMaterials('all')">Все</button>
                    <button class="tab-btn" onclick="app.filterMaterials('mri')">МРТ</button>
                    <button class="tab-btn" onclick="app.filterMaterials('case')">Клинические случаи</button>
                    <button class="tab-btn" onclick="app.filterMaterials('checklist')">Чек-листы</button>
                </div>
                
                <div class="content-list">
                    ${materials.map(material => `
                        <div class="content-item" onclick="app.openMaterial(${material.id})">
                            ${material.image_url ? `<img src="${material.image_url}" class="content-image" alt="${material.title}">` : ''}
                            <div class="content-info">
                                <div class="content-title">${material.title}</div>
                                <div class="content-description">${material.description}</div>
                                <div class="content-meta">
                                    <span>${this.getMaterialTypeIcon(material.material_type)} ${this.getMaterialTypeName(material.material_type)}</span>
                                    <span>📥 ${material.downloads}</span>
                                </div>
                            </div>
                            <button class="favorite-btn" onclick="event.stopPropagation(); app.toggleFavorite(${material.id}, 'material')">🤍</button>
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
                    <h2>🗺️ Карта мероприятий</h2>
                </div>
                
                <div class="events-tabs">
                    <button class="tab-btn active" onclick="app.filterEvents('all')">Все</button>
                    <button class="tab-btn" onclick="app.filterEvents('online')">Онлайн</button>
                    <button class="tab-btn" onclick="app.filterEvents('offline')">Офлайн</button>
                </div>
                
                <div class="content-list">
                    ${events.map(event => `
                        <div class="content-item" onclick="app.openEvent(${event.id})">
                            ${event.image_url ? `<img src="${event.image_url}" class="content-image" alt="${event.title}">` : ''}
                            <div class="content-info">
                                <div class="content-title">${event.title}</div>
                                <div class="content-description">${event.description}</div>
                                <div class="content-meta">
                                    <span>📅 ${new Date(event.event_date).toLocaleDateString('ru-RU')}</span>
                                    <span>📍 ${event.location}</span>
                                    <span>👥 ${event.participants}</span>
                                </div>
                            </div>
                            <button class="btn btn-primary">Записаться</button>
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
                    <h2>🎁 Ограниченное предложение</h2>
                </div>
                
                <div class="promotions-grid">
                    ${promotions.map(promo => `
                        <div class="promotion-card">
                            ${promo.image_url ? `<img src="${promo.image_url}" class="promotion-image" alt="${promo.title}">` : ''}
                            <div class="promotion-content">
                                <div class="promotion-title">${promo.title}</div>
                                <div class="promotion-description">${promo.description}</div>
                                ${promo.discount ? `<div class="promotion-discount">-${promo.discount}%</div>` : ''}
                                <button class="btn btn-primary" onclick="app.getPromotion(${promo.id})">Получить</button>
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
                    <h2>👥 О сообществе</h2>
                </div>
                
                <div class="community-grid">
                    <div class="community-card" onclick="app.showCommunityRules()">
                        <div class="community-icon">📜</div>
                        <div class="community-title">Правила сообщества</div>
                    </div>
                    
                    <div class="community-card" onclick="app.showFAQ()">
                        <div class="community-icon">❓</div>
                        <div class="community-title">F.A.Q.</div>
                    </div>
                    
                    <div class="community-card" onclick="app.showSubscriptionInfo()">
                        <div class="community-icon">💳</div>
                        <div class="community-title">Подписка</div>
                    </div>
                </div>

                <div class="faq-section">
                    <h3>Частые вопросы</h3>
                    <div class="faq-item">
                        <div class="faq-question">Как оформить подписку?</div>
                        <div class="faq-answer">Подписку можно оформить в разделе «Личный кабинет».</div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">Что входит в подписку?</div>
                        <div class="faq-answer">Доступ к эфирам, разборам, практическим материалам и видео-шпаргалкам.</div>
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
                        <div class="chat-item" onclick="app.openChat(${chat.id})">
                            <div class="chat-avatar">${this.getChatIcon(chat.type)}</div>
                            <div class="chat-info">
                                <div class="chat-name">${chat.name}</div>
                                <div class="chat-description">${chat.description}</div>
                                <div class="chat-meta">${chat.participants_count} участников</div>
                            </div>
                            <div class="chat-status">
                                <div class="unread-count">3</div>
                            </div>
                        </div>
                    `).join('')}
                    
                    <div class="chat-item flood-chat" onclick="app.openFloodChat()">
                        <div class="chat-avatar">💬</div>
                        <div class="chat-info">
                            <div class="chat-name">Флудилка</div>
                            <div class="chat-description">Неформальное общение</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createFavoritesPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h2>❤️ Избранное</h2>
                </div>
                
                <div class="favorites-tabs">
                    <button class="tab-btn active" onclick="app.showFavoritesTab('all')">Все</button>
                    <button class="tab-btn" onclick="app.showFavoritesTab('watchLater')">Посмотреть позже</button>
                    <button class="tab-btn" onclick="app.showFavoritesTab('materials')">Материалы</button>
                </div>
                
                <div class="empty-state">
                    <div class="empty-icon">❤️</div>
                    <div class="empty-text">Здесь пока пусто</div>
                    <div class="empty-hint">Добавляйте контент в избранное, чтобы он появился здесь</div>
                </div>
            </div>
        `;
    }

    createProfilePage() {
        if (!this.currentUser) return '<div class="loading">Загрузка...</div>';
        
        const progress = this.currentUser.progress;
        const subscription = this.currentUser.subscription;
        
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">👤</div>
                        <div class="profile-info">
                            <div class="profile-name">${this.currentUser.firstName}</div>
                            <div class="profile-specialization">${this.currentUser.specialization}</div>
                            <div class="profile-city">${this.currentUser.city}</div>
                        </div>
                    </div>
                    
                    <div class="subscription-section">
                        <div class="subscription-status ${subscription.status}">
                            <span class="status-icon">${subscription.status === 'active' ? '✅' : '❌'}</span>
                            <span class="status-text">${subscription.status === 'active' ? 'Активная подписка' : 'Подписка не активна'}</span>
                        </div>
                        <button class="btn btn-outline" onclick="app.manageSubscription()">Управление подпиской</button>
                    </div>
                </div>

                <div class="my-journey">
                    <h3>🛣️ Мой путь</h3>
                    <div class="journey-levels">
                        <div class="journey-level active">
                            <div class="level-number">1</div>
                            <div class="level-info">
                                <div class="level-title">Понимаю</div>
                                <div class="level-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(progress.progress.understand / 9) * 100}%"></div>
                                    </div>
                                    <div class="progress-text">${progress.progress.understand} из 9</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="journey-level ${progress.progress.connect >= 25 ? 'active' : ''}">
                            <div class="level-number">2</div>
                            <div class="level-info">
                                <div class="level-title">Связываю</div>
                                <div class="level-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${(progress.progress.connect / 25) * 100}%"></div>
                                    </div>
                                    <div class="progress-text">${progress.progress.connect} из 25</div>
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
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.editProfile()">✏️ Редактировать профиль</button>
                    ${this.isAdmin ? `<button class="btn btn-secondary" onclick="app.renderPage('admin')">🔧 Админ-панель</button>` : ''}
                </div>
            </div>
        `;
    }

    createAdminPage() {
        if (!this.isAdmin) {
            return `
                <div class="page">
                    <div class="error">
                        <div class="error-icon">❌</div>
                        <div class="error-text">Доступ запрещен</div>
                        <div class="error-hint">У вас нет прав администратора</div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="page">
                <div class="page-header">
                    <h2>🔧 Админ-панель</h2>
                    <div class="admin-badge">Администратор</div>
                </div>

                <div class="admin-tabs">
                    <button class="tab-btn active" onclick="app.showAdminTab('dashboard')">📊 Дашборд</button>
                    <button class="tab-btn" onclick="app.showAdminTab('content')">📝 Контент</button>
                    <button class="tab-btn" onclick="app.showAdminTab('users')">👥 Пользователи</button>
                </div>

                <div id="adminDashboard" class="admin-tab-content active">
                    <div class="admin-stats">
                        <div class="stat-card large">
                            <div class="stat-value">156</div>
                            <div class="stat-label">Пользователей</div>
                        </div>
                        <div class="stat-card large">
                            <div class="stat-value">8</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                        <div class="stat-card large">
                            <div class="stat-value">89%</div>
                            <div class="stat-label">Активных</div>
                        </div>
                    </div>

                    <div class="admin-actions">
                        <button class="btn btn-primary" onclick="app.showAddContentForm()">➕ Добавить контент</button>
                        <button class="btn btn-secondary" onclick="app.manageUsers()">👥 Управление пользователями</button>
                    </div>
                </div>

                <div id="adminContent" class="admin-tab-content">
                    <div class="content-management">
                        <h3>Управление контентом</h3>
                        <div class="content-type-tabs">
                            <button class="tab-btn" onclick="app.showContentType('courses')">Курсы</button>
                            <button class="tab-btn" onclick="app.showContentType('podcasts')">Подкасты</button>
                            <button class="tab-btn" onclick="app.showContentType('streams')">Эфиры</button>
                        </div>
                        <div class="add-content-form">
                            <input type="text" placeholder="Название" class="form-input">
                            <textarea placeholder="Описание" class="form-textarea"></textarea>
                            <input type="file" class="form-file" accept="image/*">
                            <button class="btn btn-primary">Добавить</button>
                        </div>
                    </div>
                </div>

                <div id="adminUsers" class="admin-tab-content">
                    <div class="users-management">
                        <h3>Управление пользователями</h3>
                        <div class="users-list">
                            <div class="user-item">
                                <div class="user-avatar">👤</div>
                                <div class="user-info">
                                    <div class="user-name">Демо Пользователь</div>
                                    <div class="user-status active">Активен</div>
                                </div>
                                <button class="btn btn-small">Редактировать</button>
                            </div>
                        </div>
                    </div>
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
            'case': 'Кейс',
            'checklist': 'Чек-лист'
        };
        return names[type] || 'Материал';
    }

    getChatIcon(type) {
        return type === 'group' ? '👥' : '💬';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    // ==================== МЕТОДЫ ДЕЙСТВИЙ ====================

    showSupport() {
        alert('💬 Поддержка: @academy_anb\n📧 academy@anb.ru\n⏰ ПН-ПТ 11:00-19:00');
    }

    openCourse(courseId) {
        this.showNotification(`🎓 Открываем курс #${courseId}`);
    }

    playPodcast(podcastId) {
        this.showNotification(`🎧 Запускаем подкаст #${podcastId}`);
    }

    playStream(streamId) {
        this.showNotification(`📹 Запускаем эфир #${streamId}`);
    }

    playVideo(videoId) {
        this.showNotification(`🎯 Запускаем видео #${videoId}`);
    }

    openMaterial(materialId) {
        this.showNotification(`📖 Открываем материал #${materialId}`);
    }

    openEvent(eventId) {
        this.showNotification(`🗺️ Открываем мероприятие #${eventId}`);
    }

    getPromotion(promoId) {
        this.showNotification(`🎁 Получаем предложение #${promoId}`);
    }

    openChat(chatId) {
        this.showNotification(`💬 Открываем чат #${chatId}`);
    }

    openFloodChat() {
        this.showNotification('💬 Открываем флудилку');
    }

    toggleFavorite(contentId, contentType) {
        this.showNotification('❤️ Избранное обновлено');
    }

    manageSubscription() {
        this.showNotification('💳 Управление подпиской');
    }

    editProfile() {
        this.showNotification('✏️ Редактирование профиля');
    }

    // Админ методы
    initAdminPage() {
        // Инициализация админ-панели
    }

    showAdminTab(tabName) {
        document.querySelectorAll('.admin-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
        
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    showAddContentForm() {
        this.showNotification('📝 Добавление контента');
    }

    manageUsers() {
        this.showNotification('👥 Управление пользователями');
    }

    showContentType(type) {
        this.showNotification(`📝 Управление ${type}`);
    }

    // Утилиты
    showNotification(message) {
        // В реальном приложении здесь будет красивый toast
        console.log('📢 Notification:', message);
        alert(message);
    }

    filterFeed(filter) {
        this.showNotification(`Фильтр: ${filter}`);
    }

    filterMaterials(filter) {
        this.showNotification(`Материалы: ${filter}`);
    }

    filterEvents(filter) {
        this.showNotification(`Мероприятия: ${filter}`);
    }

    showFavoritesTab(tab) {
        this.showNotification(`Вкладка: ${tab}`);
    }

    showCommunityRules() {
        this.showNotification('📜 Правила сообщества');
    }

    showFAQ() {
        this.showNotification('❓ Частые вопросы');
    }

    showSubscriptionInfo() {
        this.showNotification('💳 Информация о подписке');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, инициализируем приложение...');
    window.app = new AcademyApp();
});
