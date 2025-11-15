// webapp/admin.js
let adminData = {
    stats: {},
    users: [],
    content: {},
    admins: []
};

let currentAdminTab = 'dashboard';
let currentContentType = 'courses';

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация админ-панели...');
    
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
        alert('❌ Доступ запрещен. У вас нет прав администратора.');
        goToMainApp();
        return;
    }

    initAdminPanel();
    loadAdminData();
});

async function checkAdminStatus() {
    try {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser && tgUser.id) {
                console.log(`🔍 Проверка прав для пользователя: ${tgUser.id}`);
                
                const response = await fetch(`/api/check-admin/${tgUser.id}`);
                const data = await response.json();
                
                console.log('✅ Результат проверки админа:', data);
                
                if (data.success && data.isAdmin) {
                    // Загружаем данные пользователя для отображения в админке
                    const userResponse = await fetch(`/api/user/${tgUser.id}`);
                    const userData = await userResponse.json();
                    
                    if (userData.success) {
                        document.getElementById('adminName').textContent = userData.user.firstName;
                    }
                    
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Ошибка проверки админ-прав:', error);
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

    // Инициализация поиска пользователей
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(searchUsers, 300));
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

async function loadAdminData() {
    try {
        console.log('📥 Загрузка данных админ-панели...');
        
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
            console.log('✅ Контент загружен:', adminData.content);
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
    document.getElementById('totalRevenue').textContent = '0 ₽';

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
    if (!contentList) return;
    
    contentList.innerHTML = '<div class="loading">Загрузка...</div>';

    try {
        const content = adminData.content[contentType] || [];
        
        if (content.length === 0) {
            contentList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <div class="empty-text">Контент не найден</div>
                    <button class="btn btn-primary" onclick="showAddContentForm('${contentType}')">Добавить первый</button>
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
    } catch (error) {
        contentList.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

function showAddContentForm(defaultType = 'courses') {
    currentContentType = defaultType;
    
    const modalHTML = `
        <div class="modal" id="addContentModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Добавить контент</h3>
                    <button class="close-btn" onclick="closeModal('addContentModal')">×</button>
                </div>
                <div class="modal-body">
                    <form id="addContentForm">
                        <div class="form-group">
                            <label>Тип контента</label>
                            <select id="contentTypeSelect" required>
                                <option value="courses">Курс</option>
                                <option value="podcasts">Подкаст</option>
                                <option value="streams">Эфир</option>
                                <option value="videos">Видео-шпаргалка</option>
                                <option value="materials">Материал</option>
                                <option value="events">Мероприятие</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Название</label>
                            <input type="text" id="contentTitleInput" required>
                        </div>
                        <div class="form-group">
                            <label>Описание</label>
                            <textarea id="contentDescriptionInput" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Полное описание</label>
                            <textarea id="contentFullDescriptionInput" rows="5"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Длительность</label>
                            <input type="text" id="contentDurationInput" placeholder="например: 1:30:00">
                        </div>
                        <div class="form-group">
                            <label>Цена (руб.)</label>
                            <input type="number" id="contentPriceInput" placeholder="0 для бесплатного">
                        </div>
                        <div class="form-group">
                            <label>Количество модулей</label>
                            <input type="number" id="contentModulesInput" value="1">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('addContentModal')">Отмена</button>
                            <button type="submit" class="btn btn-primary">Сохранить</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Устанавливаем выбранный тип контента
    document.getElementById('contentTypeSelect').value = defaultType;
    
    // Обработчик формы
    document.getElementById('addContentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewContent();
    });
}

async function addNewContent() {
    const form = document.getElementById('addContentForm');
    const formData = new FormData(form);
    
    const contentType = document.getElementById('contentTypeSelect').value;
    const contentData = {
        title: document.getElementById('contentTitleInput').value,
        description: document.getElementById('contentDescriptionInput').value,
        fullDescription: document.getElementById('contentFullDescriptionInput').value,
        duration: document.getElementById('contentDurationInput').value,
        price: parseInt(document.getElementById('contentPriceInput').value) || 0,
        modules: parseInt(document.getElementById('contentModulesInput').value) || 1
    };
    
    try {
        // В демо-режиме просто добавляем в локальную базу
        if (!adminData.content[contentType]) {
            adminData.content[contentType] = [];
        }
        
        const newContent = {
            id: Math.max(0, ...adminData.content[contentType].map(item => item.id)) + 1,
            ...contentData,
            contentType: contentType,
            created: new Date()
        };
        
        adminData.content[contentType].push(newContent);
        
        showNotification('✅ Контент успешно добавлен', 'success');
        closeModal('addContentModal');
        form.reset();
        
        // Обновляем список контента
        loadContentList(contentType);
        
    } catch (error) {
        console.error('Ошибка при добавлении контента:', error);
        showNotification('❌ Ошибка при добавлении контента', 'error');
    }
}

async function deleteContent(contentType, contentId) {
    if (!confirm(`🗑️ Удалить этот контент?`)) return;

    try {
        // В демо-режиме удаляем из локальной базы
        adminData.content[contentType] = adminData.content[contentType].filter(item => item.id !== contentId);
        
        showNotification('✅ Контент удален', 'success');
        loadContentList(contentType);
        
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
        case 'admins':
            loadAdmins();
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
    }
}

async function loadUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = '<div class="loading">Загрузка пользователей...</div>';

    // Демо-данные пользователей
    const demoUsers = [
        {
            id: 1,
            firstName: 'Иван Петров',
            specialization: 'Невролог',
            city: 'Москва',
            email: 'ivan@example.com',
            subscription: { status: 'trial', endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
            joinedAt: new Date('2024-01-15')
        },
        {
            id: 2,
            firstName: 'Анна Сидорова',
            specialization: 'Ортопед',
            city: 'Санкт-Петербург',
            email: 'anna@example.com',
            subscription: { status: 'active', endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
            joinedAt: new Date('2024-01-10')
        }
    ];

    usersList.innerHTML = demoUsers.map(user => `
        <div class="admin-content-item">
            <div class="user-info">
                <div class="user-avatar">👤</div>
                <div class="user-details">
                    <div class="user-name">${user.firstName}</div>
                    <div class="user-meta">
                        <span>🎯 ${user.specialization}</span>
                        <span>🏙️ ${user.city}</span>
                        <span>📧 ${user.email}</span>
                    </div>
                    <div class="user-status">
                        <span class="status-badge ${user.subscription.status}">
                            ${user.subscription.status === 'active' ? '✅ Активная' : user.subscription.status === 'trial' ? '🆓 Пробная' : '❌ Неактивная'}
                        </span>
                        <span class="join-date">Зарегистрирован: ${new Date(user.joinedAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-small" onclick="viewUser(${user.id})">👁️</button>
                <button class="btn btn-small" onclick="messageUser(${user.id})">✉️</button>
                <button class="btn btn-small btn-primary" onclick="makeAdmin(${user.id})">👑</button>
            </div>
        </div>
    `).join('');
}

async function loadAdmins() {
    const adminsList = document.getElementById('adminsList');
    if (!adminsList) return;

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
    const userId = prompt('Введите ID пользователя для назначения администратором:');
    
    if (!userId || isNaN(userId)) {
        showNotification('❌ Введите корректный ID пользователя', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: parseInt(userId) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Администратор добавлен', 'success');
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

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
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
