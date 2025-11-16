// webapp/admin.js - ПОЛНАЯ ВЕРСИЯ БЕЗ ЗАГЛУШЕК
let adminData = {
    stats: {},
    users: [],
    content: {},
    admins: [],
    messages: {},
    settings: {}
};

let currentAdminTab = 'dashboard';
let currentContentType = 'courses';

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Инициализация админ-панели...');
    
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
        showNotification('❌ Доступ запрещен. У вас нет прав администратора.', 'error');
        setTimeout(() => goToMainApp(), 2000);
        return;
    }

    initAdminPanel();
    await loadAdminData();
});

async function checkAdminStatus() {
    try {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser && tgUser.id) {
                const response = await fetch(`/api/check-admin/${tgUser.id}`);
                const data = await response.json();
                
                if (data.success && data.isAdmin) {
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
    // Навигация
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchAdminTab(this.dataset.tab);
        });
    });

    // Вкладки контента
    document.querySelectorAll('.content-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchContentTab(this.dataset.contentType);
        });
    });

    // Поиск пользователей
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(searchUsers, 300));
    }

    // Фильтры пользователей
    const userFilter = document.getElementById('userFilter');
    if (userFilter) {
        userFilter.addEventListener('change', loadUsersList);
    }
}

async function loadAdminData() {
    try {
        // Загрузка статистики
        const statsResponse = await fetch('/api/stats');
        const statsData = await statsResponse.json();
        adminData.stats = statsData.success ? statsData.stats : {};

        // Загрузка контента
        const contentResponse = await fetch('/api/content');
        const contentData = await contentResponse.json();
        adminData.content = contentData.success ? contentData.data : {};

        // Загрузка сообщений бота
        const messagesResponse = await fetch('/api/bot/messages');
        const messagesData = await messagesResponse.json();
        adminData.messages = messagesData.success ? messagesData.messages : {};

        // Загрузка списка админов
        await loadAdmins();

        updateDashboard();
        
    } catch (error) {
        console.error('Ошибка загрузки админ-данных:', error);
        showNotification('❌ Ошибка загрузки данных', 'error');
    }
}

function updateDashboard() {
    if (!adminData.stats) return;

    document.getElementById('totalUsers').textContent = adminData.stats.totalUsers || 0;
    document.getElementById('activeUsers').textContent = adminData.stats.activeUsers || 0;
    document.getElementById('totalCourses').textContent = adminData.stats.content?.courses || 0;
    
    const totalRevenue = (adminData.stats.activeUsers || 0) * 2900;
    document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString()} ₽`;

    updateRecentActivity();
}

async function updateRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    try {
        // Реальные данные активности из API
        const activities = await fetchRecentActivity();
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                <div class="activity-info">
                    <div class="activity-action">${activity.action}</div>
                    <div class="activity-details">
                        ${activity.user ? `<span class="user">${activity.user}</span>` : ''}
                        ${activity.item ? `<span class="item">${activity.item}</span>` : ''}
                        ${activity.amount ? `<span class="amount">${activity.amount}</span>` : ''}
                    </div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        activityList.innerHTML = '<div class="error">Ошибка загрузки активности</div>';
    }
}

async function fetchRecentActivity() {
    // Реальная реализация получения активности
    try {
        const response = await fetch('/api/activity');
        const data = await response.json();
        return data.success ? data.activities : [];
    } catch (error) {
        return [];
    }
}

// ПОЛНЫЙ ФУНКЦИОНАЛ УПРАВЛЕНИЯ КОНТЕНТОМ
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
            <div class="admin-content-item" data-content-id="${item.id}" data-content-type="${contentType}">
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

async function showAddContentForm(defaultType = 'courses') {
    currentContentType = defaultType;
    
    const modalHTML = `
        <div class="modal" id="addContentModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Добавить контент - ${getContentTypeName(defaultType)}</h3>
                    <button class="close-btn" onclick="closeModal('addContentModal')">×</button>
                </div>
                <div class="modal-body">
                    <form id="addContentForm">
                        <div class="form-group">
                            <label>Тип контента *</label>
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
                            <label>Название *</label>
                            <input type="text" id="contentTitleInput" required placeholder="Введите название">
                        </div>
                        <div class="form-group">
                            <label>Описание</label>
                            <textarea id="contentDescriptionInput" rows="3" placeholder="Краткое описание"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Полное описание</label>
                            <textarea id="contentFullDescriptionInput" rows="5" placeholder="Подробное описание контента"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Длительность</label>
                                <input type="text" id="contentDurationInput" placeholder="1:30:00">
                            </div>
                            <div class="form-group">
                                <label>Цена (руб.)</label>
                                <input type="number" id="contentPriceInput" value="0" min="0">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Количество модулей</label>
                                <input type="number" id="contentModulesInput" value="1" min="1">
                            </div>
                            <div class="form-group">
                                <label>Тип материала</label>
                                <select id="contentMaterialType">
                                    <option value="mri">МРТ разбор</option>
                                    <option value="case">Клинический случай</option>
                                    <option value="checklist">Чек-лист</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>URL изображения</label>
                            <input type="url" id="contentImageInput" placeholder="https://example.com/image.jpg">
                        </div>
                        <div class="form-group">
                            <label>URL контента (видео/аудио/файл)</label>
                            <input type="url" id="contentFileInput" placeholder="https://example.com/content.mp4">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('addContentModal')">Отмена</button>
                            <button type="submit" class="btn btn-primary">Сохранить контент</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('contentTypeSelect').value = defaultType;
    
    document.getElementById('addContentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewContent();
    });
}

async function addNewContent() {
    const form = document.getElementById('addContentForm');
    const formData = new FormData(form);
    
    const contentData = {
        title: document.getElementById('contentTitleInput').value,
        description: document.getElementById('contentDescriptionInput').value,
        fullDescription: document.getElementById('contentFullDescriptionInput').value,
        duration: document.getElementById('contentDurationInput').value,
        price: parseInt(document.getElementById('contentPriceInput').value) || 0,
        modules: parseInt(document.getElementById('contentModulesInput').value) || 1,
        type: document.getElementById('contentMaterialType').value,
        image: document.getElementById('contentImageInput').value,
        file: document.getElementById('contentFileInput').value,
        contentType: document.getElementById('contentTypeSelect').value
    };
    
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
            showNotification('✅ Контент успешно добавлен', 'success');
            closeModal('addContentModal');
            await loadAdminData(); // Перезагружаем данные
            loadContentList(contentData.contentType);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Ошибка при добавлении контента:', error);
        showNotification('❌ Ошибка при добавлении контента', 'error');
    }
}

async function editContent(contentType, contentId) {
    const content = adminData.content[contentType]?.find(item => item.id === contentId);
    if (!content) {
        showNotification('❌ Контент не найден', 'error');
        return;
    }
    
    const modalHTML = `
        <div class="modal" id="editContentModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>Редактировать контент</h3>
                    <button class="close-btn" onclick="closeModal('editContentModal')">×</button>
                </div>
                <div class="modal-body">
                    <form id="editContentForm">
                        <div class="form-group">
                            <label>Название *</label>
                            <input type="text" id="editContentTitleInput" value="${content.title}" required>
                        </div>
                        <div class="form-group">
                            <label>Описание</label>
                            <textarea id="editContentDescriptionInput" rows="3">${content.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Полное описание</label>
                            <textarea id="editContentFullDescriptionInput" rows="5">${content.fullDescription || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Длительность</label>
                                <input type="text" id="editContentDurationInput" value="${content.duration || ''}">
                            </div>
                            <div class="form-group">
                                <label>Цена (руб.)</label>
                                <input type="number" id="editContentPriceInput" value="${content.price || 0}" min="0">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('editContentModal')">Отмена</button>
                            <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('editContentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateContent(contentType, contentId);
    });
}

async function updateContent(contentType, contentId) {
    const updateData = {
        title: document.getElementById('editContentTitleInput').value,
        description: document.getElementById('editContentDescriptionInput').value,
        fullDescription: document.getElementById('editContentFullDescriptionInput').value,
        duration: document.getElementById('editContentDurationInput').value,
        price: parseInt(document.getElementById('editContentPriceInput').value) || 0
    };
    
    try {
        const response = await fetch(`/api/content/${contentType}/${contentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Контент успешно обновлен', 'success');
            closeModal('editContentModal');
            await loadAdminData();
            loadContentList(contentType);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Ошибка при обновлении контента:', error);
        showNotification('❌ Ошибка при обновлении контента', 'error');
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
            await loadAdminData();
            loadContentList(contentType);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Ошибка при удалении контента:', error);
        showNotification('❌ Ошибка при удалении контента', 'error');
    }
}

// ПОЛНЫЙ ФУНКЦИОНАЛ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ
async function loadUsersList() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = '<div class="loading">Загрузка пользователей...</div>';

    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (data.success) {
            adminData.users = data.users;
            renderUsersList();
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        usersList.innerHTML = '<div class="error">Ошибка загрузки пользователей</div>';
    }
}

function renderUsersList() {
    const usersList = document.getElementById('usersList');
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const filterType = document.getElementById('userFilter')?.value || 'all';

    const filteredUsers = adminData.users.filter(user => {
        const matchesSearch = user.firstName.toLowerCase().includes(searchTerm) ||
                             user.email?.toLowerCase().includes(searchTerm) ||
                             user.specialization?.toLowerCase().includes(searchTerm);
        
        const matchesFilter = filterType === 'all' || 
                             (filterType === 'active' && user.subscription?.status === 'active') ||
                             (filterType === 'trial' && user.subscription?.status === 'trial') ||
                             (filterType === 'inactive' && (!user.subscription || user.subscription.status === 'inactive'));
        
        return matchesSearch && matchesFilter;
    });

    if (filteredUsers.length === 0) {
        usersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-text">Пользователи не найдены</div>
            </div>
        `;
        return;
    }

    usersList.innerHTML = filteredUsers.map(user => `
        <div class="admin-content-item">
            <div class="user-info">
                <div class="user-avatar">👤</div>
                <div class="user-details">
                    <div class="user-name">${user.firstName} ${user.lastName || ''}</div>
                    <div class="user-meta">
                        ${user.specialization ? `<span>🎯 ${user.specialization}</span>` : ''}
                        ${user.city ? `<span>🏙️ ${user.city}</span>` : ''}
                        ${user.email ? `<span>📧 ${user.email}</span>` : ''}
                    </div>
                    <div class="user-status">
                        <span class="status-badge ${user.subscription?.status || 'inactive'}">
                            ${getSubscriptionStatusText(user.subscription?.status)}
                        </span>
                        <span class="join-date">Зарегистрирован: ${new Date(user.joinedAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div class="user-stats">
                        <span>📚 Материалов: ${user.progress?.steps?.materialsWatched || 0}</span>
                        <span>👥 Мероприятий: ${user.progress?.steps?.eventsParticipated || 0}</span>
                        <span>💾 Сохранено: ${user.progress?.steps?.materialsSaved || 0}</span>
                        <span>🎓 Курсов: ${user.progress?.steps?.coursesBought || 0}</span>
                    </div>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-small" onclick="viewUser(${user.id})">👁️ Профиль</button>
                <button class="btn btn-small" onclick="messageUser(${user.id})">✉️ Сообщение</button>
                ${!user.isAdmin ? `<button class="btn btn-small btn-primary" onclick="makeAdmin(${user.id})">👑 Админ</button>` : ''}
            </div>
        </div>
    `).join('');
}

async function viewUser(userId) {
    try {
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        
        if (data.success) {
            showUserModal(data.user);
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        showNotification('❌ Пользователь не найден', 'error');
    }
}

function showUserModal(user) {
    const modalHTML = `
        <div class="modal" id="userModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>👤 Профиль пользователя</h3>
                    <button class="close-btn" onclick="closeModal('userModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="user-profile">
                        <div class="profile-header">
                            <div class="avatar-large">👤</div>
                            <div class="profile-info">
                                <div class="profile-name">${user.firstName} ${user.lastName || ''}</div>
                                <div class="profile-meta">
                                    ${user.specialization ? `<span>🎯 ${user.specialization}</span>` : ''}
                                    ${user.city ? `<span>🏙️ ${user.city}</span>` : ''}
                                    ${user.email ? `<span>📧 ${user.email}</span>` : ''}
                                </div>
                                <div class="subscription-status ${user.subscription?.status || 'inactive'}">
                                    ${getSubscriptionStatusText(user.subscription?.status)}
                                    ${user.subscription?.endDate ? ` до ${new Date(user.subscription.endDate).toLocaleDateString('ru-RU')}` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-stats-detailed">
                            <h4>📊 Статистика активности</h4>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-value">${user.progress?.steps?.materialsWatched || 0}</div>
                                    <div class="stat-label">Просмотрено материалов</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${user.progress?.steps?.eventsParticipated || 0}</div>
                                    <div class="stat-label">Участий в мероприятиях</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${user.progress?.steps?.materialsSaved || 0}</div>
                                    <div class="stat-label">Сохранено материалов</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${user.progress?.steps?.coursesBought || 0}</div>
                                    <div class="stat-label">Приобретено курсов</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-actions-full">
                            <button class="btn btn-primary" onclick="editUserSubscription(${user.id})">✏️ Изменить подписку</button>
                            <button class="btn btn-secondary" onclick="sendUserMessage(${user.id})">✉️ Отправить сообщение</button>
                            <button class="btn btn-outline" onclick="exportUserData(${user.id})">📥 Экспорт данных</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function editUserSubscription(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = prompt('Изменить статус подписки (active/trial/inactive):', user.subscription?.status || 'inactive');
    if (newStatus && ['active', 'trial', 'inactive'].includes(newStatus)) {
        try {
            const response = await fetch(`/api/user/${userId}/subscription`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: newStatus,
                    endDate: newStatus === 'active' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : 
                            newStatus === 'trial' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification(`✅ Подписка пользователя изменена на "${newStatus}"`, 'success');
                closeModal('userModal');
                await loadUsersList();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            showNotification('❌ Ошибка при изменении подписки', 'error');
        }
    }
}

async function sendUserMessage(userId) {
    const message = prompt('Введите сообщение для пользователя:');
    if (message) {
        try {
            const response = await fetch(`/api/user/${userId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('✉️ Сообщение отправлено', 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            showNotification('❌ Ошибка при отправке сообщения', 'error');
        }
    }
}

async function makeAdmin(userId) {
    if (confirm('Назначить пользователя администратором?')) {
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
                showNotification('✅ Пользователь назначен администратором', 'success');
                await loadAdmins();
                await loadUsersList();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            showNotification('❌ Ошибка при назначении администратора', 'error');
        }
    }
}

// УПРАВЛЕНИЕ АДМИНИСТРАТОРАМИ
async function loadAdmins() {
    const adminsList = document.getElementById('adminsList');
    if (!adminsList) return;

    try {
        const response = await fetch('/api/admins');
        const data = await response.json();
        
        if (data.success) {
            adminData.admins = data.data;
            updateAdminsList();
        } else {
            throw new Error('Failed to load admins');
        }
    } catch (error) {
        adminsList.innerHTML = '<div class="error">Ошибка загрузки администраторов</div>';
    }
}

function updateAdminsList() {
    const adminsList = document.getElementById('adminsList');
    if (!adminsList) return;

    if (adminData.admins.length === 0) {
        adminsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👑</div>
                <div class="empty-text">Нет администраторов</div>
                <button class="btn btn-primary" onclick="addNewAdmin()">Добавить первого</button>
            </div>
        `;
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
                ` : '<div class="main-admin-badge">👑 Главный администратор</div>'}
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
            await loadAdmins();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('❌ Ошибка при добавлении администратора', 'error');
    }
}

async function removeAdmin(userId) {
    if (!confirm('🗑️ Удалить администратора?')) return;

    try {
        const response = await fetch(`/api/admins/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Администратор удален', 'success');
            await loadAdmins();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('❌ Ошибка при удалении администратора', 'error');
    }
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function switchAdminTab(tab) {
    currentAdminTab = tab;
    
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    
    const tabElement = document.getElementById(tab);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

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

function loadTabData(tab) {
    switch (tab) {
        case 'users':
            loadUsersList();
            break;
        case 'admins':
            loadAdmins();
            break;
        case 'content':
            loadContentList(currentContentType);
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

function searchUsers() {
    renderUsersList();
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

function getSubscriptionStatusText(status) {
    const statuses = {
        'active': '✅ Активная подписка',
        'trial': '🆓 Пробный период', 
        'inactive': '❌ Нет подписки'
    };
    return statuses[status] || '❌ Нет подписки';
}

function getActivityIcon(type) {
    const icons = {
        'user': '👤',
        'payment': '💰',
        'content': '📝',
        'subscription': '💳',
        'default': '🔔'
    };
    return icons[type] || icons.default;
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

function refreshAdminData() {
    loadAdminData();
    showNotification('🔄 Данные обновлены', 'info');
}

function goToMainApp() {
    window.location.href = '/';
}

// Инициализация Telegram WebApp
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.expand();
    Telegram.WebApp.ready();
}
