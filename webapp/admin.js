// ==================== АДМИН-ПАНЕЛЬ ====================
let adminData = {
    stats: {},
    users: [],
    content: {},
    admins: [],
    settings: {}
};

let currentAdminTab = 'dashboard';
let currentContentType = 'courses';

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    if (!isAdminUser()) {
        alert('❌ Доступ запрещен');
        goToMainApp();
        return;
    }

    initAdminPanel();
    loadAdminData();
});

function isAdminUser() {
    // Проверка через API
    if (window.Telegram && Telegram.WebApp) {
        const tgUser = Telegram.WebApp.initDataUnsafe.user;
        if (tgUser && tgUser.id) {
            return checkAdminStatus(tgUser.id);
        }
    }
    return false;
}

async function checkAdminStatus(userId) {
    try {
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        return data.success && data.user.isAdmin;
    } catch (error) {
        return false;
    }
}

function initAdminPanel() {
    // Инициализация навигации
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            switchAdminTab(tab);
        });
    });

    // Инициализация вкладок контента
    document.querySelectorAll('.content-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const contentType = this.dataset.contentType;
            switchContentTab(contentType);
        });
    });

    // Инициализация форм
    document.getElementById('addContentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewContent();
    });

    // Инициализация поиска пользователей
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(searchUsers, 300));
    }

    // Инициализация формы добавления админа
    const addAdminForm = document.getElementById('addAdminForm');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addNewAdmin();
        });
    }
}

function switchAdminTab(tab) {
    currentAdminTab = tab;
    
    // Скрыть все вкладки
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // Убрать активность с кнопок
    document.querySelectorAll('.admin-nav-btn').forEach(b => {
        b.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    document.getElementById(tab).classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Загрузить данные для вкладки
    loadTabData(tab);
}

function switchContentTab(contentType) {
    currentContentType = contentType;
    
    document.querySelectorAll('.content-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-content-type="${contentType}"]`).classList.add('active');
    
    document.getElementById('contentTitle').textContent = getContentTypeName(contentType);
    loadContentList(contentType);
}

function getContentTypeName(type) {
    const names = {
        'courses': 'Курсы',
        'podcasts': 'АНБ FM',
        'streams': 'Эфиры',
        'videos': 'Видео-шпаргалки',
        'materials': 'Материалы',
        'events': 'Мероприятия'
    };
    return names[type] || type;
}

async function loadAdminData() {
    try {
        // Загрузка статистики
        const statsResponse = await fetch('/api/stats');
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            adminData.stats = statsData.stats;
            updateDashboard();
        }

        // Загрузка контента
        const contentResponse = await fetch('/api/content');
        const contentData = await contentResponse.json();
        
        if (contentData.success) {
            adminData.content = contentData.data;
        }

        // Загрузка списка админов
        const adminsResponse = await fetch('/api/admins');
        const adminsData = await adminsResponse.json();
        
        if (adminsData.success) {
            adminData.admins = adminsData.data;
            updateAdminsList();
        }

    } catch (error) {
        console.error('Ошибка загрузки админ-данных:', error);
        showNotification('❌ Ошибка загрузки данных', 'error');
    }
}

function updateDashboard() {
    document.getElementById('totalUsers').textContent = adminData.stats.totalUsers || 0;
    document.getElementById('activeUsers').textContent = adminData.stats.activeUsers || 0;
    document.getElementById('totalCourses').textContent = adminData.stats.content?.courses || 0;
    document.getElementById('totalRevenue').textContent = '0 ₽'; // Заглушка

    // Обновляем активность
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    const activities = [
        { action: 'Новый пользователь', user: 'Иван Петров', time: '2 минуты назад' },
        { action: 'Добавлен курс', item: 'Мануальные техники', time: '1 час назад' },
        { action: 'Оплата подписки', user: 'Анна Сидорова', time: '3 часа назад' },
        { action: 'Загружен подкаст', item: 'АНБ FM: Неврология', time: '5 часов назад' }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">🔔</div>
            <div class="activity-info">
                <div class="activity-action">${activity.action}</div>
                <div class="activity-details">
                    ${activity.user ? `<span class="user">${activity.user}</span>` : ''}
                    ${activity.item ? `<span class="item">${activity.item}</span>` : ''}
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

async function loadContentList(contentType) {
    const contentList = document.getElementById('contentList');
    contentList.innerHTML = '<div class="loading">Загрузка...</div>';

    try {
        const response = await fetch(`/api/content/${contentType}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            if (data.data.length === 0) {
                contentList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <div class="empty-text">Контент не найден</div>
                        <button class="btn btn-primary" onclick="showAddContentForm('${contentType}')">Добавить первый</button>
                    </div>
                `;
                return;
            }

            contentList.innerHTML = data.data.map(item => `
                <div class="admin-content-item">
                    <div class="content-preview">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="content-thumbnail">` : ''}
                        <div class="content-info">
                            <div class="content-title">${item.title}</div>
                            <div class="content-description">${item.description || 'Нет описания'}</div>
                            <div class="content-meta">
                                ${item.duration ? `<span>⏱️ ${item.duration}</span>` : ''}
                                ${item.price ? `<span>💰 ${item.price} руб.</span>` : ''}
                                ${item.type ? `<span>📁 ${getContentTypeName(item.type)}</span>` : ''}
                                <span>📅 ${new Date(item.created).toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                    </div>
                    <div class="content-actions">
                        <button class="btn btn-small" onclick="editContent('${contentType}', ${item.id})">✏️</button>
                        <button class="btn btn-small btn-danger" onclick="deleteContent('${contentType}', ${item.id})">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        contentList.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

function showAddContentForm(defaultType = 'courses') {
    currentContentType = defaultType;
    
    // Очищаем форму
    document.getElementById('addContentForm').reset();
    document.getElementById('contentTypeSelect').value = defaultType;
    
    // Показываем/скрываем поля в зависимости от типа контента
    updateContentFormFields(defaultType);
    
    document.getElementById('addContentModal').style.display = 'block';
}

function updateContentFormFields(contentType) {
    // Скрываем все дополнительные поля
    document.querySelectorAll('.form-field-extra').forEach(field => {
        field.style.display = 'none';
    });

    // Показываем нужные поля в зависимости от типа контента
    switch (contentType) {
        case 'courses':
            document.getElementById('priceField').style.display = 'block';
            document.getElementById('durationField').style.display = 'block';
            document.getElementById('modulesField').style.display = 'block';
            document.getElementById('imageField').style.display = 'block';
            break;
        case 'podcasts':
            document.getElementById('durationField').style.display = 'block';
            document.getElementById('audioField').style.display = 'block';
            document.getElementById('imageField').style.display = 'block';
            break;
        case 'streams':
            document.getElementById('durationField').style.display = 'block';
            document.getElementById('scheduledField').style.display = 'block';
            document.getElementById('videoField').style.display = 'block';
            document.getElementById('imageField').style.display = 'block';
            break;
        case 'videos':
            document.getElementById('durationField').style.display = 'block';
            document.getElementById('videoField').style.display = 'block';
            document.getElementById('imageField').style.display = 'block';
            break;
        case 'materials':
            document.getElementById('materialTypeField').style.display = 'block';
            document.getElementById('fileField').style.display = 'block';
            document.getElementById('imageField').style.display = 'block';
            break;
        case 'events':
            document.getElementById('eventTypeField').style.display = 'block';
            document.getElementById('locationField').style.display = 'block';
            document.getElementById('dateField').style.display = 'block';
            document.getElementById('imageField').style.display = 'block';
            break;
    }
}

// Обработчик изменения типа контента
document.getElementById('contentTypeSelect').addEventListener('change', function() {
    updateContentFormFields(this.value);
});

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function addNewContent() {
    const form = document.getElementById('addContentForm');
    const formData = new FormData(form);
    
    const contentType = formData.get('contentType');
    
    try {
        const response = await fetch(`/api/content/${contentType}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Контент успешно добавлен', 'success');
            closeModal('addContentModal');
            form.reset();
            
            // Обновляем список контента
            loadContentList(contentType);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Ошибка при добавлении контента:', error);
        showNotification('❌ Ошибка при добавлении контента', 'error');
    }
}

async function deleteContent(contentType, contentId) {
    if (!confirm(`🗑️ Удалить этот контент?`)) return;

    try {
        const response = await fetch(`/api/content/${contentType}/${contentId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Контент удален', 'success');
            loadContentList(contentType);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Ошибка при удалении контента:', error);
        showNotification('❌ Ошибка при удалении контента', 'error');
    }
}

function editContent(contentType, contentId) {
    showNotification('✏️ Редактирование в разработке', 'info');
}

function loadTabData(tab) {
    switch (tab) {
        case 'users':
            loadUsersList();
            break;
        case 'subscriptions':
            loadSubscriptions();
            break;
        case 'promotions':
            loadPromotions();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'admins':
            loadAdmins();
            break;
    }
}

async function loadUsersList() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<div class="loading">Загрузка пользователей...</div>';

    // Заглушка - в реальности будет API
    setTimeout(() => {
        usersList.innerHTML = `
            <div class="admin-content-item">
                <div class="user-info">
                    <div class="user-avatar">👤</div>
                    <div class="user-details">
                        <div class="user-name">Иван Петров</div>
                        <div class="user-meta">
                            <span>🎯 Невролог</span>
                            <span>🏙️ Москва</span>
                            <span>📧 ivan@example.com</span>
                        </div>
                        <div class="user-status">
                            <span class="status-badge trial">🆓 Пробный период</span>
                            <span class="join-date">Зарегистрирован: 15.11.2024</span>
                        </div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-small" onclick="viewUser(123)">👁️</button>
                    <button class="btn btn-small" onclick="messageUser(123)">✉️</button>
                    <button class="btn btn-small btn-primary" onclick="makeAdmin(123)">👑</button>
                </div>
            </div>
        `;
    }, 1000);
}

async function loadAdmins() {
    const adminsList = document.getElementById('adminsList');
    adminsList.innerHTML = '<div class="loading">Загрузка администраторов...</div>';

    try {
        const response = await fetch('/api/admins');
        const data = await response.json();
        
        if (data.success) {
            adminData.admins = data.data;
            updateAdminsList();
        }
    } catch (error) {
        console.error('Ошибка загрузки списка админов:', error);
        adminsList.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

function updateAdminsList() {
    const adminsList = document.getElementById('adminsList');
    if (!adminsList) return;

    if (adminData.admins.length === 0) {
        adminsList.innerHTML = '<div class="empty-state">Нет администраторов</div>';
        return;
    }

    adminsList.innerHTML = adminData.admins.map(admin => `
        <div class="admin-item">
            <div class="admin-info">
                <div class="admin-avatar">👑</div>
                <div class="admin-details">
                    <div class="admin-name">${admin.firstName || `Пользователь ${admin.id}`}</div>
                    <div class="admin-meta">
                        ${admin.username ? `<span>@${admin.username}</span>` : ''}
                        <span>ID: ${admin.id}</span>
                    </div>
                    <div class="admin-join-date">С ${new Date(admin.joinedAt).toLocaleDateString('ru-RU')}</div>
                </div>
            </div>
            <div class="admin-actions">
                ${admin.id !== 898508164 ? `
                    <button class="btn btn-small btn-danger" onclick="removeAdmin(${admin.id})">🗑️ Удалить</button>
                ` : '<div class="main-admin-badge">Главный администратор</div>'}
            </div>
        </div>
    `).join('');
}

async function addNewAdmin() {
    const form = document.getElementById('addAdminForm');
    const userId = parseInt(form.userId.value);

    if (!userId) {
        showNotification('❌ Введите ID пользователя', 'error');
        return;
    }

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
            showNotification('✅ Администратор добавлен', 'success');
            form.reset();
            loadAdmins();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Ошибка при добавлении админа:', error);
        showNotification('❌ Ошибка при добавлении админа', 'error');
    }
}

async function removeAdmin(userId) {
    if (!confirm(`🗑️ Удалить администратора?`)) return;

    try {
        const response = await fetch(`/api/admins/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Администратор удален', 'success');
            loadAdmins();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Ошибка при удалении админа:', error);
        showNotification('❌ Ошибка при удалении админа', 'error');
    }
}

function refreshAdminData() {
    loadAdminData();
    showNotification('🔄 Данные обновлены', 'info');
}

function goToMainApp() {
    window.location.href = '/';
}

// Вспомогательные функции
function debounce(func, wait) {
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

function showNotification(message, type = 'info') {
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
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Заглушки для функций
function searchUsers() {
    showNotification('🔍 Поиск пользователей в разработке', 'info');
}

function viewUser(userId) {
    showNotification(`👁️ Просмотр пользователя ID: ${userId}`, 'info');
}

function messageUser(userId) {
    showNotification(`✉️ Сообщение пользователю ID: ${userId}`, 'info');
}

function makeAdmin(userId) {
    showNotification(`👑 Назначение администратора ID: ${userId}`, 'info');
}

function loadSubscriptions() {
    showNotification('💳 Управление подписками в разработке', 'info');
}

function loadPromotions() {
    showNotification('🎁 Управление акциями в разработке', 'info');
}

function loadSettings() {
    showNotification('⚙️ Настройки в разработке', 'info');
}

// Инициализация Telegram WebApp в админ-панели
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.expand();
    Telegram.WebApp.ready();
}
