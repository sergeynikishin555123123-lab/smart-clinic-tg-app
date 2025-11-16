// webapp/app.js - УПРОЩЕННАЯ ВЕРСИЯ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация приложения...');
        
        await this.loadUserData();
        await this.loadContent();
        
        this.renderPage('home');
        this.setupNavigation();
        
        console.log('✅ Приложение готово');
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
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            this.createDemoUser();
        }
    }

    createDemoUser() {
        this.currentUser = {
            id: 898508164,
            firstName: 'Демо Пользователь',
            isAdmin: true
        };
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
            this.createDemoContent();
        }
    }

    createDemoContent() {
        this.allContent = {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники',
                    description: 'Современные методики',
                    price: 15000,
                    duration: '12 часов'
                },
                {
                    id: 2,
                    title: 'Неврология',
                    description: 'Основы диагностики',
                    price: 12000,
                    duration: '10 часов'
                }
            ]
        };
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
                        </div>
                        <div class="card" onclick="app.renderPage('profile')">
                            <div class="card-icon">👤</div>
                            <div class="card-title">Профиль</div>
                        </div>
                    </div>
                </div>

                <div class="content-grid">
                    ${courses.length > 0 ? courses.slice(0, 2).map(course => `
                        <div class="content-card">
                            <div class="content-title">${course.title}</div>
                            <div class="content-description">${course.description}</div>
                            <div class="content-meta">
                                <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                <span class="meta-item">⏱️ ${course.duration}</span>
                            </div>
                            <button class="btn btn-primary" onclick="app.startCourse(${course.id})">
                                Начать обучение
                            </button>
                        </div>
                    `).join('') : 'Курсы загружаются...'}
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
                    ${courses.map(course => `
                        <div class="content-card">
                            <div class="content-title">${course.title}</div>
                            <div class="content-description">${course.description}</div>
                            <div class="content-meta">
                                <span>💰 ${this.formatPrice(course.price)}</span>
                                <span>⏱️ ${course.duration}</span>
                            </div>
                            <button class="btn btn-primary" onclick="app.startCourse(${course.id})">
                                Начать обучение
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    createProfilePage() {
        if (!this.currentUser) return '<div>Загрузка...</div>';
        
        return `
            <div class="page">
                <div class="profile-header">
                    <div class="avatar-large">👤</div>
                    <div class="profile-name">${this.currentUser.firstName}</div>
                    <div class="profile-status">Участник Академии АНБ</div>
                </div>
                
                <div class="profile-stats">
                    <h3>📊 Активность</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">3</div>
                            <div class="stat-label">Курсов начато</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">12</div>
                            <div class="stat-label">Материалов изучено</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    startCourse(courseId) {
        alert(`🎓 Начинаем курс #${courseId}`);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }
}

// Инициализация приложения
const app = new AcademyApp();
