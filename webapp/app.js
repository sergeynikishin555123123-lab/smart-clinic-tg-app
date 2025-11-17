// webapp/app.js - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.isAdmin = false;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Быстрая инициализация Академии АНБ...');
        this.showSkeletonLoading();
        
        try {
            this.initTelegramWebApp();
            
            // Параллельная загрузка данных
            await Promise.all([
                this.loadUserData(),
                this.loadContent()
            ]);
            
            this.renderPage('home');
            this.setupNavigation();
            
            this.isInitialized = true;
            console.log('✅ Приложение готово (оптимизированная версия)');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка загрузки приложения');
        }
    }

    initTelegramWebApp() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.expand();
            Telegram.WebApp.BackButton.onClick(() => this.handleBackButton());
        }
    }

    handleBackButton() {
        if (this.currentPage !== 'home') {
            this.renderPage('home');
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
            </div>
        `;
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
                    }
                } catch (error) {
                    console.error('Ошибка загрузки пользователя:', error);
                    this.createDemoUser();
                }
                resolve();
            }, 100);
        });
    }

    getUserId() {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
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
            subscription: { status: 'active' },
            progress: {
                level: 'Понимаю',
                steps: { coursesBought: 3, materialsWatched: 12, eventsParticipated: 5 },
                progress: { understand: 9, connect: 15, apply: 8, systematize: 3, share: 0 }
            },
            isAdmin: true
        };
        this.isAdmin = true;
        document.getElementById('adminBadge').style.display = 'flex';
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
                    description: '6 модулей по современным методикам',
                    price: 15000,
                    duration: '12 часов',
                    modules: 6,
                    rating: 4.8
                }
            ],
            podcasts: [
                {
                    id: 1,
                    title: 'АНБ FM: Современная неврология',
                    description: 'Обсуждение новых тенденций',
                    duration: '45:20',
                    listens: 234
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'Разбор клинического случая',
                    description: 'Прямой эфир с экспертом',
                    duration: '1:30:00',
                    participants: 89
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Шпаргалка: Неврологический осмотр',
                    description: 'Быстрый гайд по тестам',
                    duration: '15:30',
                    views: 456
                }
            ],
            materials: [
                {
                    id: 1,
                    title: 'МРТ разбор: Рассеянный склероз',
                    description: 'Детальный разбор с кейсами',
                    material_type: 'mri',
                    downloads: 123
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Конференция: Современная неврология',
                    description: 'Ежегодная конференция',
                    location: 'Москва',
                    participants: 45
                }
            ],
            promotions: [
                {
                    id: 1,
                    title: 'Скидка 20% на подписку',
                    description: 'Специальное предложение',
                    discount: 20
                }
            ],
            chats: [
                {
                    id: 1,
                    name: 'Общий чат Академии',
                    description: 'Основной чат для общения',
                    participants_count: 156
                }
            ]
        };
    }

    setupNavigation() {
        document.addEventListener('click', (e) => {
            const navBtn = e.target.closest('.nav-btn');
            if (navBtn) {
                e.preventDefault();
                const page = navBtn.dataset.page;
                this.renderPage(page);
            }
        });
    }

    renderPage(page) {
        this.currentPage = page;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) return;

        // Быстрое обновление навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Обновление кнопки "Назад"
        if (window.Telegram && Telegram.WebApp) {
            if (page === 'home') {
                Telegram.WebApp.BackButton.hide();
            } else {
                Telegram.WebApp.BackButton.show();
            }
        }

        // Быстрый рендеринг
        requestAnimationFrame(() => {
            mainContent.innerHTML = this.getPageHTML(page);
            
            // Инициализация страницы
            if (page === 'admin' && this.isAdmin) {
                this.initAdminPage();
            }
        });
    }

    getPageHTML(page) {
        const pages = {
            home: this.createHomePage(),
            courses: this.createCoursesPage(),
            podcasts: this.createPodcastsPage(),
            streams: this.createStreamsPage(),
            videos: this.createVideosPage(),
            materials: this.createMaterialsPage(),
            events: this.createEventsPage(),
            promotions: this.createPromotionsPage(),
            community: this.createCommunityPage(),
            chats: this.createChatsPage(),
            favorites: this.createFavoritesPage(),
            profile: this.createProfilePage(),
            admin: this.createAdminPage()
        };

        return pages[page] || pages.home;
    }

    createHomePage() {
        return `
            <div class="page home-page">
                <div class="hero-section">
                    <h2>Академия АНБ</h2>
                    <p>Современное образование для врачей</p>
                </div>

                <div class="navigation-grid">
                    <div class="nav-card" onclick="app.showSection('courses')">
                        <div class="nav-icon">📚</div>
                        <div class="nav-title">Курсы</div>
                    </div>
                    <div class="nav-card" onclick="app.showSection('podcasts')">
                        <div class="nav-icon">🎧</div>
                        <div class="nav-title">АНБ FM</div>
                    </div>
                    <div class="nav-card" onclick="app.showSection('streams')">
                        <div class="nav-icon">📹</div>
                        <div class="nav-title">Эфиры|Разборы</div>
                    </div>
                    <div class="nav-card" onclick="app.showSection('videos')">
                        <div class="nav-icon">🎯</div>
                        <div class="nav-title">Видео-шпаргалки</div>
                    </div>
                    <div class="nav-card" onclick="app.showSection('materials')">
                        <div class="nav-icon">📋</div>
                        <div class="nav-title">Практические материалы</div>
                    </div>
                    <div class="nav-card" onclick="app.showSection('events')">
                        <div class="nav-icon">🗺️</div>
                        <div class="nav-title">Карта мероприятий</div>
                    </div>
                    <div class="nav-card" onclick="app.showSection('promotions')">
                        <div class="nav-icon">🎁</div>
                        <div class="nav-title">Ограниченное предложение</div>
                    </div>
                    <div class="nav-card" onclick="app.showSupport()">
                        <div class="nav-icon">💬</div>
                        <div class="nav-title">Поддержка</div>
                    </div>
                </div>

                <div class="quick-actions">
                    <button class="action-btn" onclick="app.renderPage('courses')">
                        <span>📚</span>
                        <span>Начать обучение</span>
                    </button>
                    <button class="action-btn" onclick="app.renderPage('profile')">
                        <span>👤</span>
                        <span>Мой профиль</span>
                    </button>
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
                            <div class="content-info">
                                <div class="content-title">${course.title}</div>
                                <div class="content-description">${course.description}</div>
                                <div class="content-meta">
                                    <span>⏱️ ${course.duration}</span>
                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                    <span>⭐ ${course.rating}</span>
                                </div>
                            </div>
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
                            <div class="content-info">
                                <div class="content-title">${podcast.title}</div>
                                <div class="content-description">${podcast.description}</div>
                                <div class="content-meta">
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
                <div class="content-list">
                    ${streams.map(stream => `
                        <div class="content-item" onclick="app.playStream(${stream.id})">
                            <div class="content-info">
                                <div class="content-title">${stream.title}</div>
                                <div class="content-description">${stream.description}</div>
                                <div class="content-meta">
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
                <div class="content-list">
                    ${videos.map(video => `
                        <div class="content-item" onclick="app.playVideo(${video.id})">
                            <div class="content-info">
                                <div class="content-title">${video.title}</div>
                                <div class="content-description">${video.description}</div>
                                <div class="content-meta">
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
                <div class="content-list">
                    ${materials.map(material => `
                        <div class="content-item" onclick="app.openMaterial(${material.id})">
                            <div class="content-info">
                                <div class="content-title">${material.title}</div>
                                <div class="content-description">${material.description}</div>
                                <div class="content-meta">
                                    <span>${this.getMaterialTypeIcon(material.material_type)} ${this.getMaterialTypeName(material.material_type)}</span>
                                    <span>📥 ${material.downloads}</span>
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
                    <h2>🗺️ Карта мероприятий</h2>
                </div>
                <div class="content-list">
                    ${events.map(event => `
                        <div class="content-item" onclick="app.openEvent(${event.id})">
                            <div class="content-info">
                                <div class="content-title">${event.title}</div>
                                <div class="content-description">${event.description}</div>
                                <div class="content-meta">
                                    <span>📍 ${event.location}</span>
                                    <span>👥 ${event.participants}</span>
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
                    <h2>🎁 Ограниченное предложение</h2>
                </div>
                <div class="content-list">
                    ${promotions.map(promo => `
                        <div class="content-item promotion-item" onclick="app.getPromotion(${promo.id})">
                            <div class="content-info">
                                <div class="content-title">${promo.title}</div>
                                <div class="content-description">${promo.description}</div>
                                ${promo.discount ? `<div class="promotion-badge">-${promo.discount}%</div>` : ''}
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
                <div class="community-content">
                    <p>Добро пожаловать в сообщество Академии АНБ!</p>
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
                <div class="content-list">
                    ${chats.map(chat => `
                        <div class="content-item" onclick="app.openChat(${chat.id})">
                            <div class="content-info">
                                <div class="content-title">${chat.name}</div>
                                <div class="content-description">${chat.description}</div>
                                <div class="content-meta">👥 ${chat.participants_count} участников</div>
                            </div>
                        </div>
                    `).join('')}
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
                <div class="empty-state">
                    <div class="empty-icon">❤️</div>
                    <div class="empty-text">Здесь пока пусто</div>
                </div>
            </div>
        `;
    }

    createProfilePage() {
        if (!this.currentUser) return '<div class="loading">Загрузка...</div>';
        
        const progress = this.currentUser.progress;
        
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar">👤</div>
                    <div class="profile-info">
                        <div class="profile-name">${this.currentUser.firstName}</div>
                        <div class="profile-specialization">${this.currentUser.specialization}</div>
                    </div>
                </div>

                <div class="profile-stats">
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

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.manageSubscription()">💳 Управление подпиской</button>
                    <button class="btn btn-outline" onclick="app.editProfile()">✏️ Редактировать профиль</button>
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
                    </div>
                </div>
            `;
        }

        return `
            <div class="page">
                <div class="page-header">
                    <h2>🔧 Админ-панель</h2>
                </div>
                <div class="admin-content">
                    <h3>Статистика системы</h3>
                    <div class="admin-stats">
                        <div class="stat-card">
                            <div class="stat-value">156</div>
                            <div class="stat-label">Пользователей</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">8</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                    </div>
                    <div class="admin-actions">
                        <button class="btn btn-primary" onclick="app.showAddContentForm()">➕ Добавить контент</button>
                        <button class="btn btn-secondary" onclick="app.manageUsers()">👥 Управление пользователями</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Вспомогательные методы
    getMaterialTypeIcon(type) {
        const icons = { 'mri': '🖼️', 'case': '📄', 'checklist': '✅' };
        return icons[type] || '📋';
    }

    getMaterialTypeName(type) {
        const names = { 'mri': 'МРТ', 'case': 'Кейс', 'checklist': 'Чек-лист' };
        return names[type] || 'Материал';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    // Методы действий
    showSection(section) {
        this.renderPage(section);
    }

    showSupport() {
        this.showNotification('💬 Поддержка: @academy_anb\n📧 academy@anb.ru');
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

    manageSubscription() {
        this.showNotification('💳 Управление подпиской');
    }

    editProfile() {
        this.showNotification('✏️ Редактирование профиля');
    }

    // Админ методы
    initAdminPage() {
        console.log('Админ-панель инициализирована');
    }

    showAddContentForm() {
        this.showNotification('📝 Добавление контента');
    }

    manageUsers() {
        this.showNotification('👥 Управление пользователями');
    }

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
