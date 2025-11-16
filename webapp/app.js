// webapp/app.js - ПОЛНАЯ ВЕРСИЯ С ВСЕМИ МОДУЛЯМИ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
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
        
        await this.loadUserData();
        await this.loadContent();
        
        this.renderPage('home');
        this.setupNavigation();
        
        console.log('✅ Система готова к работе');
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
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: 898508164 })
            });

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

    createDemoUser() {
        this.currentUser = {
            id: 898508164,
            firstName: 'Администратор',
            specialization: 'Невролог',
            city: 'Москва',
            subscription: { status: 'active', type: 'premium' },
            progress: { 
                level: 'Эксперт', 
                steps: { materialsWatched: 45, eventsParticipated: 12, materialsSaved: 23, coursesBought: 8 }
            },
            isAdmin: true
        };
        this.isAdmin = true;
        document.getElementById('adminBadge').style.display = 'block';
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            const data = await response.json();
            
            if (data.success) {
                this.allContent = data.data;
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
        }
    }

    renderPage(page) {
        this.currentPage = page;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) return;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        switch(page) {
            case 'home':
                mainContent.innerHTML = this.createHomePage();
                break;
            case 'courses':
                mainContent.innerHTML = this.createCoursesPage();
                break;
            case 'materials':
                mainContent.innerHTML = this.createMaterialsPage();
                break;
            case 'teachers':
                mainContent.innerHTML = this.createTeachersPage();
                break;
            case 'chats':
                mainContent.innerHTML = this.createChatsPage();
                break;
            case 'events':
                mainContent.innerHTML = this.createEventsPage();
                break;
            case 'profile':
                mainContent.innerHTML = this.createProfilePage();
                break;
            case 'admin':
                if (this.isAdmin) {
                    mainContent.innerHTML = this.createAdminPage();
                    setTimeout(() => this.initAdminPage(), 100);
                } else {
                    mainContent.innerHTML = this.createAccessDeniedPage();
                }
                break;
            default:
                mainContent.innerHTML = this.createHomePage();
        }
    }

    createHomePage() {
        const courses = this.allContent.courses || [];
        const podcasts = this.allContent.podcasts || [];
        const streams = this.allContent.streams || [];
        
        return `
            <div class="page">
                <div class="hero-section">
                    <div class="hero-text">
                        <h2>Академия АНБ</h2>
                        <p>Современное образование для врачей</p>
                    </div>
                </div>

                <div class="quick-nav">
                    <h3>Быстрый старт</h3>
                    <div class="grid">
                        <div class="card" onclick="app.renderPage('courses')">
                            <div class="card-icon">📚</div>
                            <div class="card-title">Курсы</div>
                            <div class="card-desc">${courses.length} курсов доступно</div>
                        </div>
                        <div class="card" onclick="app.renderPage('materials')">
                            <div class="card-icon">📋</div>
                            <div class="card-title">Материалы</div>
                            <div class="card-desc">Практические руководства</div>
                        </div>
                        <div class="card" onclick="app.renderPage('teachers')">
                            <div class="card-icon">👨‍⚕️</div>
                            <div class="card-title">Преподаватели</div>
                            <div class="card-desc">Опытные специалисты</div>
                        </div>
                        <div class="card" onclick="app.renderPage('chats')">
                            <div class="card-icon">💬</div>
                            <div class="card-title">Чаты</div>
                            <div class="card-desc">Общение с коллегами</div>
                        </div>
                    </div>
                </div>

                <div class="content-section">
                    <h3>🎯 Активные курсы</h3>
                    <div class="content-grid">
                        ${courses.slice(0, 2).map(course => this.createCourseCard(course)).join('')}
                    </div>
                </div>

                <div class="content-section">
                    <h3>🎧 АНБ FM - Подкасты</h3>
                    <div class="content-grid">
                        ${podcasts.slice(0, 2).map(podcast => this.createPodcastCard(podcast)).join('')}
                    </div>
                </div>

                <div class="content-section">
                    <h3>📹 Ближайшие эфиры</h3>
                    <div class="content-grid">
                        ${streams.slice(0, 2).map(stream => this.createStreamCard(stream)).join('')}
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
                    <h2>📚 Все курсы</h2>
                    <div class="page-actions">
                        <button class="btn btn-outline" onclick="app.filterContent('all')">Все</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Неврология')">Неврология</button>
                        <button class="btn btn-outline" onclick="app.filterContent('Реабилитация')">Реабилитация</button>
                    </div>
                </div>
                <div class="content-grid">
                    ${courses.map(course => this.createCourseCard(course)).join('')}
                </div>
            </div>
        `;
    }

    createMaterialsPage() {
        const materials = this.allContent.materials || [];
        const videos = this.allContent.videos || [];
        
        return `
            <div class="page">
                <h2>📋 Материалы и шпаргалки</h2>
                
                <div class="content-section">
                    <h3>📋 Практические материалы</h3>
                    <div class="content-grid">
                        ${materials.map(material => this.createMaterialCard(material)).join('')}
                    </div>
                </div>

                <div class="content-section">
                    <h3>🎯 Видео-шпаргалки</h3>
                    <div class="content-grid">
                        ${videos.map(video => this.createVideoCard(video)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    createTeachersPage() {
        const teachers = this.allContent.teachers || [];
        
        return `
            <div class="page">
                <h2>👨‍⚕️ Наши преподаватели</h2>
                <div class="teachers-grid">
                    ${teachers.map(teacher => `
                        <div class="teacher-card">
                            <div class="teacher-avatar">${teacher.image}</div>
                            <div class="teacher-info">
                                <div class="teacher-name">${teacher.name}</div>
                                <div class="teacher-specialization">${teacher.specialization}</div>
                                <div class="teacher-experience">Опыт: ${teacher.experience}</div>
                                <div class="teacher-rating">⭐ ${teacher.rating} (${teacher.students} студентов)</div>
                                <div class="teacher-bio">${teacher.bio}</div>
                            </div>
                            <div class="teacher-actions">
                                <button class="btn btn-outline" onclick="app.sendMessageToTeacher(${teacher.id})">💬 Написать</button>
                                <button class="btn btn-primary" onclick="app.viewTeacherProfile(${teacher.id})">👁️ Профиль</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createChatsPage() {
        const chats = this.allContent.chats || [];
        
        return `
            <div class="page">
                <div class="page-header">
                    <h2>💬 Чаты и обсуждения</h2>
                    <button class="btn btn-primary" onclick="app.createNewChat()">➕ Новый чат</button>
                </div>
                
                <div class="chats-list">
                    ${chats.map(chat => `
                        <div class="chat-item" onclick="app.openChat(${chat.id})">
                            <div class="chat-avatar">${chat.type === 'group' ? '👥' : '👤'}</div>
                            <div class="chat-info">
                                <div class="chat-name">${chat.name}</div>
                                <div class="chat-last-message">${chat.lastMessage}</div>
                                <div class="chat-meta">
                                    <span>${chat.participants} участников</span>
                                    ${chat.unread > 0 ? `<span class="unread-badge">${chat.unread} новых</span>` : ''}
                                </div>
                            </div>
                            <div class="chat-actions">
                                <button class="btn btn-small" onclick="app.openChat(${chat.id})">💬</button>
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
                <h2>🗺️ Мероприятия и события</h2>
                <div class="events-grid">
                    ${events.map(event => `
                        <div class="event-card">
                            <div class="event-icon">${event.image}</div>
                            <div class="event-info">
                                <div class="event-title">${event.title}</div>
                                <div class="event-description">${event.description}</div>
                                <div class="event-details">
                                    <div class="event-date">📅 ${new Date(event.date).toLocaleDateString('ru-RU')}</div>
                                    <div class="event-location">📍 ${event.location}</div>
                                    <div class="event-type">${event.type === 'online' ? '🌐 Онлайн' : '🏢 Офлайн'}</div>
                                </div>
                                <div class="event-participants">👥 ${event.participants} участников</div>
                            </div>
                            <div class="event-actions">
                                <button class="btn btn-primary" onclick="app.registerForEvent(${event.id})">
                                    ${event.type === 'online' ? '🎫 Зарегистрироваться' : '📝 Записаться'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createProfilePage() {
        if (!this.currentUser) return '<div class="loading">Загрузка...</div>';
        
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar-large">👤</div>
                        <div class="profile-info">
                            <div class="profile-name">${this.currentUser.firstName}</div>
                            <div class="profile-status">${this.currentUser.specialization}</div>
                            <div class="profile-badge">${this.currentUser.isAdmin ? '👑 Администратор' : '💎 Премиум участник'}</div>
                        </div>
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Ваша активность</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.currentUser.progress.steps.coursesBought}</div>
                                <div class="stat-label">Курсов пройдено</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.currentUser.progress.steps.materialsWatched}</div>
                                <div class="stat-label">Материалов изучено</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.currentUser.progress.steps.eventsParticipated}</div>
                                <div class="stat-label">Мероприятий</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💾</div>
                            <div class="stat-info">
                                <div class="stat-value">${this.currentUser.progress.steps.materialsSaved}</div>
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
                    <button class="btn btn-outline" onclick="app.showSubscription()">💳 Управление подпиской</button>
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
                            <div class="stat-value">345 600 ₽</div>
                            <div class="stat-label">Общий доход</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👨‍⚕️</div>
                        <div class="stat-info">
                            <div class="stat-value">${this.allContent.teachers?.length || 0}</div>
                            <div class="stat-label">Преподавателей</div>
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
                </div>
            </div>
        `;
    }

    createAdminContent() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="admin-section">
                <h3>📚 Управление курсами</h3>
                <div class="content-list">
                    ${courses.map(course => `
                        <div class="admin-content-item">
                            <div class="content-info">
                                <div class="content-title">${course.title}</div>
                                <div class="content-meta">
                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                    <span>⏱️ ${course.duration}</span>
                                    <span>👥 ${course.studentsCount} студентов</span>
                                </div>
                            </div>
                            <div class="content-actions">
                                <button class="btn btn-small" onclick="app.editCourse(${course.id})">✏️</button>
                                <button class="btn btn-small btn-danger" onclick="app.deleteCourse(${course.id})">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Карточки контента
    createCourseCard(course) {
        return `
            <div class="content-card">
                <div class="content-card-header">
                    <div class="content-icon">${course.image}</div>
                    <button class="favorite-btn">☆</button>
                </div>
                <div class="content-card-body">
                    <div class="content-title">${course.title}</div>
                    <div class="content-description">${course.description}</div>
                    <div class="content-meta">
                        <span class="meta-item">⏱️ ${course.duration}</span>
                        <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                        <span class="meta-item">📚 ${course.modules} модулей</span>
                        <span class="meta-item">⭐ ${course.rating}</span>
                    </div>
                </div>
                <div class="content-card-actions">
                    <button class="btn btn-outline" onclick="app.addToFavorites(${course.id}, 'courses')">⭐</button>
                    <button class="btn btn-primary" onclick="app.startCourse(${course.id})">
                        ${course.price > 0 ? 'Купить курс' : 'Начать обучение'}
                    </button>
                </div>
            </div>
        `;
    }

    createPodcastCard(podcast) {
        return `
            <div class="content-card">
                <div class="content-icon">${podcast.image}</div>
                <div class="content-title">${podcast.title}</div>
                <div class="content-description">${podcast.description}</div>
                <div class="content-meta">
                    <span>⏱️ ${podcast.duration}</span>
                    <span>🎧 ${podcast.listens} прослушиваний</span>
                </div>
                <button class="btn btn-primary" onclick="app.playPodcast(${podcast.id})">🎵 Слушать</button>
            </div>
        `;
    }

    createStreamCard(stream) {
        return `
            <div class="content-card">
                <div class="content-icon">${stream.image}</div>
                <div class="content-title">${stream.title}</div>
                <div class="content-description">${stream.description}</div>
                <div class="content-meta">
                    <span>📅 ${new Date(stream.date).toLocaleDateString('ru-RU')}</span>
                    <span>👥 ${stream.participants} участников</span>
                    ${stream.isLive ? '<span class="live-badge">🔴 LIVE</span>' : ''}
                </div>
                <button class="btn btn-primary" onclick="app.joinStream(${stream.id})">
                    ${stream.isLive ? 'Присоединиться' : 'Смотреть запись'}
                </button>
            </div>
        `;
    }

    // Вспомогательные методы
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    showNotification(message, type = 'info') {
        alert(message);
    }

    // Методы для действий
    startCourse(courseId) {
        this.showNotification(`🎓 Начинаем курс #${courseId}`);
    }

    playPodcast(podcastId) {
        this.showNotification(`🎧 Запускаем подкаст #${podcastId}`);
    }

    joinStream(streamId) {
        this.showNotification(`📹 Присоединяемся к эфиру #${streamId}`);
    }

    sendMessageToTeacher(teacherId) {
        this.showNotification(`💬 Открываем чат с преподавателем #${teacherId}`);
    }

    openChat(chatId) {
        this.showNotification(`💬 Открываем чат #${chatId}`);
    }

    registerForEvent(eventId) {
        this.showNotification(`🎫 Регистрируемся на мероприятие #${eventId}`);
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

    // Заглушки для остальных админ страниц
    createAdminUsers() {
        return `<div class="admin-section"><h3>👥 Управление пользователями</h3><p>Функционал в разработке</p></div>`;
    }

    createAdminTeachers() {
        return `<div class="admin-section"><h3>👨‍⚕️ Управление преподавателями</h3><p>Функционал в разработке</p></div>`;
    }

    createAdminAnalytics() {
        return `<div class="admin-section"><h3>📈 Аналитика</h3><p>Функционал в разработке</p></div>`;
    }
}

// Глобальные функции
window.toggleSearch = function() {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) {
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
    }
};

// Инициализация приложения
const app = new AcademyApp();
