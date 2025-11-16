// webapp/app.js - ПОЛНАЯ ВЕРСИЯ С АДМИНКОЙ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.isAdmin = false;
        this.admin = {
            currentTab: 'dashboard',
            stats: {},
            users: [],
            newContent: {
                type: 'courses',
                title: '',
                description: '',
                fullDescription: '',
                price: 0,
                duration: '',
                modules: 1,
                category: '',
                level: 'beginner'
            }
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация приложения Академии АНБ...');
        
        await this.loadUserData();
        await this.loadContent();
        
        this.renderPage('home');
        
        console.log('✅ Приложение готово к работе');
    }

    async loadUserData() {
        try {
            let userId = this.getUserId();
            
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userId,
                    firstName: 'Пользователь',
                    lastName: '',
                    username: 'user'
                })
            });

            const userResponse = await response.json();
            if (userResponse.success) {
                this.currentUser = userResponse.user;
                this.isAdmin = this.currentUser.isAdmin;
                
                if (this.isAdmin) {
                    document.getElementById('adminBadge').style.display = 'block';
                    await this.loadAdminStats();
                }
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователя:', error);
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
            lastName: '',
            specialization: 'Невролог',
            city: 'Москва',
            email: 'demo@anb.ru',
            subscription: { 
                status: 'active', 
                type: 'admin',
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
            },
            progress: { 
                level: 'Понимаю', 
                steps: {
                    materialsWatched: 12,
                    eventsParticipated: 5,
                    materialsSaved: 8,
                    coursesBought: 3
                }
            },
            favorites: { 
                courses: [1], 
                podcasts: [], 
                streams: [], 
                videos: [], 
                materials: [], 
                watchLater: [] 
            },
            isAdmin: true,
            joinedAt: new Date('2024-01-01'),
            surveyCompleted: true,
            profileImage: null
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
            console.error('❌ Ошибка загрузки контента:', error);
        }
    }

    async loadAdminStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            if (data.success) {
                this.admin.stats = data.stats;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
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
            case 'profile':
                mainContent.innerHTML = this.createProfilePage();
                break;
            case 'admin':
                mainContent.innerHTML = this.createAdminPage();
                this.initAdminPage();
                break;
            default:
                mainContent.innerHTML = this.createHomePage();
        }
    }

    createHomePage() {
        const courses = this.allContent.courses || [];
        
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
                            <div class="card-desc">Профессиональное обучение</div>
                        </div>
                        <div class="card" onclick="app.showNotification('Сообщество в разработке 🚧')">
                            <div class="card-icon">👥</div>
                            <div class="card-title">Сообщество</div>
                            <div class="card-desc">Общение с коллегами</div>
                        </div>
                        <div class="card" onclick="app.renderPage('profile')">
                            <div class="card-icon">👤</div>
                            <div class="card-title">Профиль</div>
                            <div class="card-desc">Ваш прогресс</div>
                        </div>
                        ${this.isAdmin ? `
                        <div class="card" onclick="app.renderPage('admin')">
                            <div class="card-icon">🔧</div>
                            <div class="card-title">Админка</div>
                            <div class="card-desc">Управление системой</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="section-header">
                    <h3>Популярные курсы</h3>
                </div>
                <div class="content-grid">
                    ${courses.length > 0 ? courses.slice(0, 3).map(course => this.createCourseCard(course)).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-text">Курсы загружаются</div>
                            <div class="empty-hint">Скоро здесь появятся учебные материалы</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createCoursesPage() {
        const courses = this.allContent.courses || [];
        
        return `
            <div class="page">
                <h2>📚 Все курсы</h2>
                <div class="content-grid">
                    ${courses.length > 0 ? courses.map(course => this.createCourseCard(course)).join('') : `
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <div class="empty-text">Курсы загружаются</div>
                            <div class="empty-hint">Попробуйте обновить страницу</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    createCourseCard(course) {
        return `
            <div class="content-card">
                <div class="content-card-header">
                    <div class="content-icon">📚</div>
                    <button class="favorite-btn">☆</button>
                </div>
                <div class="content-card-body">
                    <div class="content-title">${course.title}</div>
                    <div class="content-description">${course.description}</div>
                    <div class="content-meta">
                        <span class="meta-item">⏱️ ${course.duration}</span>
                        <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                        <span class="meta-item">📚 ${course.modules} модулей</span>
                        ${course.category ? `<span class="meta-item">🏷️ ${course.category}</span>` : ''}
                    </div>
                </div>
                <div class="content-card-actions">
                    <button class="btn btn-outline" onclick="app.addToWatchLater(${course.id})">📥 Позже</button>
                    <button class="btn btn-primary" onclick="app.startCourse(${course.id})">
                        Начать обучение
                    </button>
                </div>
            </div>
        `;
    }

    createProfilePage() {
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar-large">👤</div>
                        <div class="profile-info">
                            <div class="profile-name">${this.currentUser.firstName}</div>
                            <div class="profile-status">Участник Академии АНБ</div>
                            <div class="profile-badge">${this.currentUser.isAdmin ? '👑 Администратор' : '💎 Активный участник'}</div>
                        </div>
                    </div>
                    
                    <div class="subscription-info">
                        <div class="subscription-status active">
                            <div class="status-icon">✅</div>
                            <div class="status-text">
                                <div>Подписка: активна</div>
                                <div class="status-date">Бессрочный доступ</div>
                            </div>
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
                                <div class="stat-label">Курсов начато</div>
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
                    <button class="btn btn-outline" onclick="app.showNotification('Настройки в разработке 🚧')">⚙️ Настройки</button>
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
                    <button class="admin-tab-btn" data-tab="add-content">➕ Добавить</button>
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
                    <div id="adminAddContent" class="admin-tab-content">
                        ${this.createAdminAddContent()}
                    </div>
                </div>
            </div>
        `;
    }

    createAdminDashboard() {
        const stats = this.admin.stats;
        
        return `
            <div class="admin-stats">
                <h3>📈 Общая статистика</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.totalUsers || 0}</div>
                            <div class="stat-label">Всего пользователей</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.totalCourses || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <div class="stat-value">${this.formatPrice(stats.totalRevenue || 0)}</div>
                            <div class="stat-label">Общий доход</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-info">
                            <div class="stat-value">${stats.activeUsers || 0}</div>
                            <div class="stat-label">Активных подписок</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="admin-actions">
                <h3>🚀 Быстрые действия</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.switchAdminTab('add-content')">
                        ➕ Добавить курс
                    </button>
                    <button class="btn btn-secondary" onclick="app.loadUsers()">
                        👥 Обновить пользователей
                    </button>
                    <button class="btn btn-outline" onclick="app.exportStats()">
                        📊 Экспорт статистики
                    </button>
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
                    ${courses.length > 0 ? courses.map(course => `
                        <div class="admin-content-item">
                            <div class="content-info">
                                <div class="content-title">${course.title}</div>
                                <div class="content-meta">
                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                    <span>⏱️ ${course.duration}</span>
                                    <span>📚 ${course.modules} модулей</span>
                                    <span>👥 ${course.students_count || 0} студентов</span>
                                </div>
                            </div>
                            <div class="content-actions">
                                <button class="btn btn-small" onclick="app.editCourse(${course.id})">✏️</button>
                                <button class="btn btn-small btn-danger" onclick="app.deleteCourse(${course.id})">🗑️</button>
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

    createAdminUsers() {
        return `
            <div class="admin-section">
                <h3>👥 Управление пользователями</h3>
                <div class="users-list" id="usersList">
                    <div class="loading">Загрузка пользователей...</div>
                </div>
                <div class="admin-actions">
                    <button class="btn btn-primary" onclick="app.loadUsers()">
                        🔄 Обновить список
                    </button>
                </div>
            </div>
        `;
    }

    createAdminAddContent() {
        return `
            <div class="admin-section">
                <h3>➕ Добавить новый курс</h3>
                <form id="addCourseForm" class="admin-form">
                    <div class="form-group">
                        <label>Название курса *</label>
                        <input type="text" id="courseTitle" required 
                               value="${this.admin.newContent.title}"
                               oninput="app.admin.newContent.title = this.value">
                    </div>
                    
                    <div class="form-group">
                        <label>Описание *</label>
                        <textarea id="courseDescription" required rows="3"
                                  oninput="app.admin.newContent.description = this.value">${this.admin.newContent.description}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Полное описание</label>
                        <textarea id="courseFullDescription" rows="5"
                                  oninput="app.admin.newContent.fullDescription = this.value">${this.admin.newContent.fullDescription}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Цена (руб.)</label>
                            <input type="number" id="coursePrice" 
                                   value="${this.admin.newContent.price}"
                                   oninput="app.admin.newContent.price = parseInt(this.value)">
                        </div>
                        <div class="form-group">
                            <label>Длительность</label>
                            <input type="text" id="courseDuration" placeholder="12 часов"
                                   value="${this.admin.newContent.duration}"
                                   oninput="app.admin.newContent.duration = this.value">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Количество модулей</label>
                            <input type="number" id="courseModules" value="${this.admin.newContent.modules}"
                                   oninput="app.admin.newContent.modules = parseInt(this.value)">
                        </div>
                        <div class="form-group">
                            <label>Уровень сложности</label>
                            <select id="courseLevel" onchange="app.admin.newContent.level = this.value">
                                <option value="beginner">Начальный</option>
                                <option value="intermediate">Средний</option>
                                <option value="advanced">Продвинутый</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Категория</label>
                        <input type="text" id="courseCategory" placeholder="Неврология"
                               value="${this.admin.newContent.category}"
                               oninput="app.admin.newContent.category = this.value">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="app.resetCourseForm()">
                            🔄 Сбросить
                        </button>
                        <button type="submit" class="btn btn-primary">
                            ✅ Создать курс
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    initAdminPage() {
        // Инициализация табов
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchAdminTab(tab);
            });
        });

        // Форма добавления курса
        const form = document.getElementById('addCourseForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewCourse();
            });
        }

        // Загрузка пользователей
        this.loadUsers();
    }

    switchAdminTab(tab) {
        this.admin.currentTab = tab;
        
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `admin${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
        });
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            const data = await response.json();
            
            if (data.success) {
                this.admin.users = data.users;
                this.renderUsersList();
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователей:', error);
        }
    }

    renderUsersList() {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        const users = this.admin.users.slice(0, 10); // Показываем первые 10
        
        usersList.innerHTML = users.length > 0 ? users.map(user => `
            <div class="admin-user-item">
                <div class="user-info">
                    <div class="user-avatar">${user.isAdmin ? '👑' : '👤'}</div>
                    <div class="user-details">
                        <div class="user-name">${user.firstName} ${user.lastName || ''}</div>
                        <div class="user-meta">
                            <span>📧 ${user.email || 'Не указан'}</span>
                            <span>🎯 ${user.specialization || 'Не указана'}</span>
                            <span>🏙️ ${user.city || 'Не указан'}</span>
                        </div>
                        <div class="user-status">
                            <span class="status-badge ${user.subscription.status}">
                                ${user.subscription.status === 'active' ? '✅ Активен' : 
                                  user.subscription.status === 'trial' ? '🆓 Пробный' : '❌ Неактивен'}
                            </span>
                            <span class="join-date">Зарегистрирован: ${new Date(user.joinedAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('') : `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-text">Пользователи не найдены</div>
            </div>
        `;
    }

    async addNewCourse() {
        try {
            const courseData = this.admin.newContent;
            
            if (!courseData.title || !courseData.description) {
                this.showNotification('❌ Заполните обязательные поля', 'error');
                return;
            }

            const response = await fetch('/api/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...courseData,
                    contentType: 'courses'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('✅ Курс успешно создан!', 'success');
                this.resetCourseForm();
                await this.loadContent();
                this.switchAdminTab('content');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ Ошибка создания курса:', error);
            this.showNotification('❌ Ошибка при создании курса', 'error');
        }
    }

    resetCourseForm() {
        this.admin.newContent = {
            type: 'courses',
            title: '',
            description: '',
            fullDescription: '',
            price: 0,
            duration: '',
            modules: 1,
            category: '',
            level: 'beginner'
        };
        
        // Обновляем форму если она открыта
        if (this.admin.currentTab === 'add-content') {
            document.getElementById('courseTitle').value = '';
            document.getElementById('courseDescription').value = '';
            document.getElementById('courseFullDescription').value = '';
            document.getElementById('coursePrice').value = '0';
            document.getElementById('courseDuration').value = '';
            document.getElementById('courseModules').value = '1';
            document.getElementById('courseCategory').value = '';
            document.getElementById('courseLevel').value = 'beginner';
        }
    }

    editCourse(courseId) {
        this.showNotification(`✏️ Редактирование курса #${courseId}`, 'info');
    }

    deleteCourse(courseId) {
        if (confirm('🗑️ Вы уверены, что хотите удалить этот курс?')) {
            this.showNotification(`Курс #${courseId} удален`, 'success');
        }
    }

    exportStats() {
        this.showNotification('📊 Статистика экспортирована', 'success');
    }

    addToWatchLater(courseId) {
        this.showNotification('📥 Курс добавлен в "Посмотреть позже"');
    }

    startCourse(courseId) {
        this.showNotification('🎓 Начинаем курс...');
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
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
