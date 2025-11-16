// webapp/app.js - РАБОЧАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.isAdmin = false;
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация приложения Академии АНБ...');
        
        await this.loadUserData();
        await this.loadContent();
        
        this.renderPage('home');
        this.setupNavigation();
        
        console.log('✅ Приложение готово к работе');
    }

    async loadUserData() {
        try {
            const userId = this.getUserId();
            
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
                    const adminBadge = document.getElementById('adminBadge');
                    if (adminBadge) adminBadge.style.display = 'block';
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
            surveyCompleted: true
        };
        this.isAdmin = true;
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) adminBadge.style.display = 'block';
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            const data = await response.json();
            
            if (data.success) {
                this.allContent = data.data;
            } else {
                // Демо-контент если API не работает
                this.allContent = {
                    courses: [
                        {
                            id: 1,
                            title: 'Мануальные техники в практике',
                            description: '6 модулей по современным мануальным методикам',
                            price: 15000,
                            duration: '12 часов',
                            modules: 6,
                            category: 'Неврология'
                        },
                        {
                            id: 2,
                            title: 'Неврология для практикующих врачей',
                            description: 'Основы неврологической диагностики и лечения',
                            price: 12000,
                            duration: '10 часов',
                            modules: 5,
                            category: 'Неврология'
                        }
                    ],
                    podcasts: [],
                    streams: [],
                    videos: [],
                    materials: [],
                    events: []
                };
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки контента:', error);
        }
    }

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.renderPage(page);
            });
        });
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
            case 'catalog':
                mainContent.innerHTML = this.createCatalogPage();
                break;
            case 'profile':
                mainContent.innerHTML = this.createProfilePage();
                break;
            case 'admin':
                if (this.isAdmin) {
                    window.location.href = '/admin.html';
                } else {
                    this.showNotification('❌ Доступ запрещен', 'error');
                    this.renderPage('home');
                }
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
                        <div class="card" onclick="app.renderPage('catalog')">
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

    createCatalogPage() {
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
        const isFavorite = this.currentUser?.favorites?.courses?.includes(course.id);
        
        return `
            <div class="content-card">
                <div class="content-card-header">
                    <div class="content-icon">📚</div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="app.toggleFavorite(${course.id}, 'courses')">
                        ${isFavorite ? '★' : '☆'}
                    </button>
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
                        ${course.price > 0 ? 'Купить курс' : 'Начать обучение'}
                    </button>
                </div>
            </div>
        `;
    }

    createProfilePage() {
        const user = this.currentUser;
        
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar-large">👤</div>
                        <div class="profile-info">
                            <div class="profile-name">${user.firstName}</div>
                            <div class="profile-status">Участник Академии АНБ</div>
                            <div class="profile-badge">${user.isAdmin ? '👑 Администратор' : '💎 Активный участник'}</div>
                        </div>
                    </div>
                    
                    <div class="subscription-info">
                        <div class="subscription-status ${user.subscription.status}">
                            <div class="status-icon">${user.subscription.status === 'active' ? '✅' : '🆓'}</div>
                            <div class="status-text">
                                <div>Подписка: ${this.getSubscriptionText(user.subscription)}</div>
                                <div class="status-date">${this.getSubscriptionDate(user.subscription)}</div>
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
                                <div class="stat-value">${user.progress.steps.coursesBought}</div>
                                <div class="stat-label">Курсов начато</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <div class="stat-value">${user.progress.steps.materialsWatched}</div>
                                <div class="stat-label">Материалов изучено</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-info">
                                <div class="stat-value">${user.progress.steps.eventsParticipated}</div>
                                <div class="stat-label">Мероприятий</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💾</div>
                            <div class="stat-info">
                                <div class="stat-value">${user.progress.steps.materialsSaved}</div>
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
                    <button class="btn btn-secondary" onclick="app.showSubscriptionPlans()">🔄 Продлить подписку</button>
                </div>
            </div>
        `;
    }

    getSubscriptionText(subscription) {
        switch(subscription.status) {
            case 'active': return 'активна';
            case 'trial': return 'пробный период';
            case 'inactive': return 'неактивна';
            default: return 'неизвестно';
        }
    }

    getSubscriptionDate(subscription) {
        if (subscription.endDate) {
            return `до ${new Date(subscription.endDate).toLocaleDateString('ru-RU')}`;
        }
        return subscription.status === 'active' ? 'бессрочный доступ' : 'требуется активация';
    }

    toggleFavorite(contentId, contentType) {
        this.showNotification('⭐ Добавлено в избранное');
    }

    addToWatchLater(contentId) {
        this.showNotification('📥 Добавлено в "Посмотреть позже"');
    }

    startCourse(courseId) {
        const course = this.allContent.courses.find(c => c.id === courseId);
        if (course && course.price > 0) {
            this.showNotification('💳 Переход к оплате курса...');
        } else {
            this.showNotification('🎓 Начинаем обучение...');
        }
    }

    showSubscriptionPlans() {
        this.showNotification('💳 Открытие страницы с тарифами...');
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    showNotification(message, type = 'info') {
        // Создаем уведомление
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
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
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
