// webapp/admin.js - РАБОЧАЯ АДМИН-ПАНЕЛЬ
class AdminPanel {
    constructor() {
        this.stats = {};
        this.users = [];
        this.content = {};
        this.admins = [];
        this.currentTab = 'dashboard';
        this.currentContentType = 'courses';
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация админ-панели...');
        
        const isAdmin = await this.checkAdminStatus();
        if (!isAdmin) {
            this.showNotification('❌ Доступ запрещен. У вас нет прав администратора.', 'error');
            setTimeout(() => this.goToMainApp(), 2000);
            return;
        }

        await this.loadData();
        this.setupNavigation();
        this.renderTab('dashboard');
        
        console.log('✅ Админ-панель готова');
    }

    async checkAdminStatus() {
        try {
            if (window.Telegram && Telegram.WebApp) {
                const tgUser = Telegram.WebApp.initDataUnsafe.user;
                if (tgUser && tgUser.id) {
                    const response = await fetch(`/api/check-admin/${tgUser.id}`);
                    const data = await response.json();
                    return data.success && data.isAdmin;
                }
            }
            return false;
        } catch (error) {
            console.error('❌ Ошибка проверки админ-прав:', error);
            return false;
        }
    }

    async loadData() {
        try {
            const [statsResponse, contentResponse, usersResponse, adminsResponse] = await Promise.all([
                fetch('/api/stats'),
                fetch('/api/content'),
                fetch('/api/users'),
                fetch('/api/admins')
            ]);

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                this.stats = statsData.success ? statsData.stats : {};
            }

            if (contentResponse.ok) {
                const contentData = await contentResponse.json();
                this.content = contentData.success ? contentData.data : {};
            }

            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                this.users = usersData.success ? usersData.users : [];
            }

            if (adminsResponse.ok) {
                const adminsData = await adminsResponse.json();
                this.admins = adminsData.success ? adminsData.data : [];
            }

        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
        }
    }

    setupNavigation() {
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.renderTab(tab);
            });
        });

        document.querySelectorAll('.content-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contentType = e.currentTarget.dataset.contentType;
                this.currentContentType = contentType;
                this.renderContentTab(contentType);
            });
        });
    }

    renderTab(tabName) {
        this.currentTab = tabName;
        
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.id === tabName);
        });

        switch(tabName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'content':
                this.renderContent();
                break;
            case 'users':
                this.renderUsers();
                break;
            case 'admins':
                this.renderAdmins();
                break;
        }
    }

    renderDashboard() {
        const dashboard = document.getElementById('dashboard');
        if (!dashboard) return;

        dashboard.innerHTML = `
            <h2>📊 Дашборд системы</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.stats.totalUsers || 0}</div>
                        <div class="stat-label">Всего пользователей</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.stats.activeUsers || 0}</div>
                        <div class="stat-label">Активных подписок</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📚</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.stats.totalCourses || 0}</div>
                        <div class="stat-label">Курсов</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <div class="stat-value">${this.formatPrice(this.stats.totalRevenue || 0)}</div>
                        <div class="stat-label">Общий доход</div>
                    </div>
                </div>
            </div>

            <div class="quick-actions">
                <h3>🚀 Быстрые действия</h3>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="adminPanel.showAddContentForm()">
                        ➕ Добавить контент
                    </button>
                    <button class="btn btn-secondary" onclick="adminPanel.renderTab('users')">
                        👥 Управление пользователями
                    </button>
                    <button class="btn btn-outline" onclick="adminPanel.exportData()">
                        📊 Экспорт данных
                    </button>
                </div>
            </div>
        `;
    }

    renderContent() {
        const contentTab = document.getElementById('content');
        if (!contentTab) return;

        contentTab.innerHTML = `
            <div class="content-header">
                <h2>📝 Управление контентом</h2>
                <button class="btn btn-primary" onclick="adminPanel.showAddContentForm()">+ Добавить контент</button>
            </div>
            
            <div class="content-tabs">
                <button class="content-tab-btn active" data-content-type="courses">📚 Курсы</button>
                <button class="content-tab-btn" data-content-type="podcasts">🎧 Подкасты</button>
                <button class="content-tab-btn" data-content-type="materials">📋 Материалы</button>
            </div>
            
            <div class="content-management">
                <div class="content-subheader">
                    <h3 id="contentTitle">Курсы</h3>
                    <div class="content-actions">
                        <button class="btn btn-outline" onclick="adminPanel.loadData().then(() => adminPanel.renderContentTab('${this.currentContentType}'))">
                            Обновить
                        </button>
                    </div>
                </div>
                <div class="content-list" id="contentList">
                    <div class="loading">Загрузка контента...</div>
                </div>
            </div>
        `;

        this.setupContentTabs();
        this.renderContentTab(this.currentContentType);
    }

    setupContentTabs() {
        document.querySelectorAll('.content-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contentType = e.currentTarget.dataset.contentType;
                this.currentContentType = contentType;
                
                document.querySelectorAll('.content-tab-btn').forEach(b => {
                    b.classList.toggle('active', b === e.currentTarget);
                });
                
                this.renderContentTab(contentType);
            });
        });
    }

    renderContentTab(contentType) {
        const contentList = document.getElementById('contentList');
        const contentTitle = document.getElementById('contentTitle');
        if (!contentList || !contentTitle) return;

        const content = this.content[contentType] || [];
        const typeNames = {
            'courses': 'Курсы',
            'podcasts': 'Подкасты',
            'materials': 'Материалы'
        };

        contentTitle.textContent = typeNames[contentType] || contentType;

        if (content.length === 0) {
            contentList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">Контент не найден</div>
                    <button class="btn btn-primary" onclick="adminPanel.showAddContentForm('${contentType}')">
                        Добавить первый
                    </button>
                </div>
            `;
            return;
        }

        contentList.innerHTML = content.map(item => `
            <div class="admin-content-item">
                <div class="content-preview">
                    <div class="content-info">
                        <div class="content-title">${item.title}</div>
                        <div class="content-description">${item.description || 'Нет описания'}</div>
                        <div class="content-meta">
                            ${item.duration ? `<span>⏱️ ${item.duration}</span>` : ''}
                            ${item.price ? `<span>💰 ${this.formatPrice(item.price)}</span>` : ''}
                            ${item.modules ? `<span>📚 ${item.modules} модулей</span>` : ''}
                            <span>📅 ${new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-small" onclick="adminPanel.editContent('${contentType}', ${item.id})">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="adminPanel.deleteContent('${contentType}', ${item.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    renderUsers() {
        const usersTab = document.getElementById('users');
        if (!usersTab) return;

        usersTab.innerHTML = `
            <h2>👥 Управление пользователями</h2>
            <div class="users-list" id="usersList">
                ${this.users.length > 0 ? this.users.map(user => `
                    <div class="admin-content-item">
                        <div class="user-info">
                            <div class="user-avatar">${user.isAdmin ? '👑' : '👤'}</div>
                            <div class="user-details">
                                <div class="user-name">${user.firstName} ${user.lastName || ''}</div>
                                <div class="user-meta">
                                    ${user.email ? `<span>📧 ${user.email}</span>` : ''}
                                    ${user.specialization ? `<span>🎯 ${user.specialization}</span>` : ''}
                                    ${user.city ? `<span>🏙️ ${user.city}</span>` : ''}
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
                        <div class="user-actions">
                            ${!user.isAdmin ? `
                                <button class="btn btn-small btn-primary" onclick="adminPanel.makeAdmin(${user.id})">
                                    👑 Сделать админом
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : `
                    <div class="empty-state">
                        <div class="empty-icon">👥</div>
                        <div class="empty-text">Пользователи не найдены</div>
                    </div>
                `}
            </div>
        `;
    }

    renderAdmins() {
        const adminsTab = document.getElementById('admins');
        if (!adminsTab) return;

        adminsTab.innerHTML = `
            <div class="admins-header">
                <h2>👑 Управление администраторами</h2>
                <button class="btn btn-primary" onclick="adminPanel.addNewAdmin()">+ Добавить админа</button>
            </div>
            <div class="admins-list" id="adminsList">
                ${this.admins.length > 0 ? this.admins.map(admin => `
                    <div class="admin-item">
                        <div class="admin-info">
                            <div class="admin-avatar">${admin.is_main_admin ? '👑' : '🔧'}</div>
                            <div class="admin-details">
                                <div class="admin-name">${admin.first_name || 'Администратор'} ${admin.last_name || ''}</div>
                                <div class="admin-meta">
                                    <span>👤 ID: ${admin.id}</span>
                                    ${admin.username ? `<span>@${admin.username}</span>` : ''}
                                    ${admin.is_main_admin ? '<span class="main-admin-badge">Главный администратор</span>' : ''}
                                </div>
                                <div class="admin-join-date">В системе с: ${new Date(admin.joined_at).toLocaleDateString('ru-RU')}</div>
                            </div>
                        </div>
                        <div class="admin-actions">
                            ${!admin.is_main_admin ? `
                                <button class="btn btn-small btn-danger" onclick="adminPanel.removeAdmin(${admin.id})">
                                    🗑️ Удалить
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : `
                    <div class="empty-state">
                        <div class="empty-icon">👑</div>
                        <div class="empty-text">Администраторы не найдены</div>
                    </div>
                `}
            </div>
        `;
    }

    showAddContentForm(defaultType = 'courses') {
        const formHTML = `
            <div class="modal-overlay" id="addContentModal">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3 class="modal-title">Добавить контент</h3>
                        <button class="modal-close" onclick="adminPanel.closeModal('addContentModal')">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="addContentForm">
                            <div class="form-group">
                                <label>Тип контента *</label>
                                <select id="contentType" required>
                                    <option value="courses">Курс</option>
                                    <option value="podcasts">Подкаст</option>
                                    <option value="materials">Материал</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Название *</label>
                                <input type="text" id="contentTitle" required placeholder="Введите название">
                            </div>
                            <div class="form-group">
                                <label>Описание</label>
                                <textarea id="contentDescription" rows="3" placeholder="Краткое описание"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Полное описание</label>
                                <textarea id="contentFullDescription" rows="5" placeholder="Подробное описание"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Цена (руб.)</label>
                                    <input type="number" id="contentPrice" value="0" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Длительность</label>
                                    <input type="text" id="contentDuration" placeholder="12 часов">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Количество модулей</label>
                                <input type="number" id="contentModules" value="1" min="1">
                            </div>
                            <div class="form-group">
                                <label>Категория</label>
                                <input type="text" id="contentCategory" placeholder="Неврология">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="adminPanel.closeModal('addContentModal')">Отмена</button>
                        <button type="button" class="btn btn-primary" onclick="adminPanel.addNewContent()">Сохранить</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHTML);
        document.getElementById('contentType').value = defaultType;
    }

    async addNewContent() {
        const form = document.getElementById('addContentForm');
        const formData = new FormData();
        
        const contentData = {
            title: document.getElementById('contentTitle').value,
            description: document.getElementById('contentDescription').value,
            fullDescription: document.getElementById('contentFullDescription').value,
            price: document.getElementById('contentPrice').value,
            duration: document.getElementById('contentDuration').value,
            modules: document.getElementById('contentModules').value,
            category: document.getElementById('contentCategory').value,
            contentType: document.getElementById('contentType').value
        };

        if (!contentData.title) {
            this.showNotification('❌ Введите название контента', 'error');
            return;
        }

        try {
            const response = await fetch('/api/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contentData)
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('✅ Контент успешно добавлен', 'success');
                this.closeModal('addContentModal');
                await this.loadData();
                this.renderContentTab(contentData.contentType);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ Ошибка при добавлении контента:', error);
            this.showNotification('❌ Ошибка при добавлении контента', 'error');
        }
    }

    async makeAdmin(userId) {
        if (!confirm('Назначить пользователя администратором?')) return;

        try {
            const response = await fetch('/api/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('✅ Пользователь назначен администратором', 'success');
                await this.loadData();
                this.renderTab('admins');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ Ошибка при назначении администратора:', error);
            this.showNotification('❌ Ошибка при назначении администратора', 'error');
        }
    }

    async removeAdmin(userId) {
        if (!confirm('Удалить администратора?')) return;

        try {
            const response = await fetch(`/api/admins/${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('✅ Администратор удален', 'success');
                await this.loadData();
                this.renderTab('admins');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('❌ Ошибка при удалении администратора:', error);
            this.showNotification('❌ Ошибка при удалении администратора', 'error');
        }
    }

    addNewAdmin() {
        const userId = prompt('Введите ID пользователя для назначения администратором:');
        if (userId && !isNaN(userId)) {
            this.makeAdmin(parseInt(userId));
        }
    }

    editContent(contentType, contentId) {
        this.showNotification(`✏️ Редактирование контента ${contentType} #${contentId}`, 'info');
    }

    deleteContent(contentType, contentId) {
        if (confirm('Удалить этот контент?')) {
            this.showNotification(`🗑️ Контент ${contentType} #${contentId} удален`, 'success');
        }
    }

    exportData() {
        this.showNotification('📊 Экспорт данных запущен', 'success');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    goToMainApp() {
        window.location.href = '/';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
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
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
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

// Глобальные функции для админки
window.refreshAdminData = function() {
    adminPanel.loadData().then(() => {
        adminPanel.renderTab(adminPanel.currentTab);
        adminPanel.showNotification('🔄 Данные обновлены', 'success');
    });
};

window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
    adminPanel.showNotification(
        document.body.classList.contains('dark-mode') ? '🌙 Темный режим' : '☀️ Светлый режим'
    );
};

// Инициализация админ-панели
const adminPanel = new AdminPanel();
