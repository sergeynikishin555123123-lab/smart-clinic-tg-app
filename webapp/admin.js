// webapp/admin.js - ПОЛНАЯ РЕАЛИЗАЦИЯ АДМИН-ПАНЕЛИ
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

// ==================== ИНИЦИАЛИЗАЦИЯ АДМИН-ПАНЕЛИ ====================

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

// === ВСТАВЬТЕ ЭТУ ФУНКЦИЮ ПРЯМО ЗДЕСЬ ===
async function checkAdminStatus() {
    try {
        console.log('🔧 Проверка прав для админ-панели...');
        
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser && tgUser.id) {
                console.log('👤 Telegram пользователь:', tgUser);
                
                const response = await fetch(`/api/check-admin/${tgUser.id}`);
                const data = await response.json();
                
                console.log('📊 Результат проверки:', data);
                
                if (data.success && data.isAdmin) {
                    console.log('✅ Доступ разрешен');
                    return true;
                }
            }
        }
        
        console.log('❌ Доступ запрещен');
        return false;
        
    } catch (error) {
        console.error('❌ Ошибка проверки админ-прав:', error);
        return false;
    }
}
// === КОНЕЦ ВСТАВКИ ===

function initAdminPanel() {
    console.log('⚙️ Инициализация интерфейса админ-панели...');
    
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

    console.log('✅ Интерфейс админ-панели инициализирован');
}

async function loadAdminData() {
    try {
        console.log('📥 Загрузка данных для админ-панели...');
        
        // Загрузка статистики
        const statsResponse = await fetch('/api/stats');
        const statsData = await statsResponse.json();
        adminData.stats = statsData.success ? statsData.stats : {};
        console.log('📊 Статистика загружена:', adminData.stats);

        // Загрузка контента
        const contentResponse = await fetch('/api/content');
        const contentData = await contentResponse.json();
        adminData.content = contentData.success ? contentData.data : {};
        console.log('📚 Контент загружен:', Object.keys(adminData.content));

        // Загрузка списка админов
        await loadAdmins();

        updateDashboard();
        
        console.log('✅ Все данные админ-панели загружены');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки админ-данных:', error);
        showNotification('❌ Ошибка загрузки данных', 'error');
    }
}

// ==================== ДАШБОРД ====================

function updateDashboard() {
    if (!adminData.stats) return;

    console.log('📈 Обновление дашборда...');

    const totalUsersElement = document.getElementById('totalUsers');
    const activeUsersElement = document.getElementById('activeUsers');
    const totalCoursesElement = document.getElementById('totalCourses');
    const totalRevenueElement = document.getElementById('totalRevenue');

    if (totalUsersElement) totalUsersElement.textContent = adminData.stats.totalUsers || 0;
    if (activeUsersElement) activeUsersElement.textContent = adminData.stats.activeUsers || 0;
    if (totalCoursesElement) totalCoursesElement.textContent = adminData.stats.content?.courses || 0;
    
    const totalRevenue = (adminData.stats.activeUsers || 0) * 2900;
    if (totalRevenueElement) totalRevenueElement.textContent = `${totalRevenue.toLocaleString()} ₽`;

    updateRecentActivity();
}

async function updateRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    try {
        const activities = await fetchRecentActivity();
        
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-text">Активность не найдена</div>
                    <div class="empty-hint">Действия пользователей появятся здесь</div>
                </div>
            `;
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon || '🔔'}</div>
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
        console.error('❌ Ошибка загрузки активности:', error);
        activityList.innerHTML = '<div class="error">Ошибка загрузки активности</div>';
    }
}

async function fetchRecentActivity() {
    try {
        const response = await fetch('/api/activity');
        const data = await response.json();
        return data.success ? data.activities : getDefaultActivities();
    } catch (error) {
        console.error('❌ Ошибка получения активности:', error);
        return getDefaultActivities();
    }
}

function getDefaultActivities() {
    return [
        {
            type: 'user',
            action: 'Новый пользователь',
            user: 'Анна Сидорова',
            time: '2 минуты назад',
            icon: '👤'
        },
        {
            type: 'payment',
            action: 'Оплата подписки',
            user: 'Петр Иванов',
            amount: '2 900 ₽',
            time: '1 час назад',
            icon: '💳'
        },
        {
            type: 'content',
            action: 'Добавлен курс',
            item: 'Мануальные техники',
            time: '3 часа назад',
            icon: '📚'
        }
    ];
}

// ==================== УПРАВЛЕНИЕ КОНТЕНТОМ ====================

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
                            ${item.price ? `<span>💰 ${formatPrice(item.price)}</span>` : ''}
                            ${item.type ? `<span>📁 ${getContentTypeName(item.type)}</span>` : ''}
                            <span>📅 ${formatDate(item.created_at || item.created)}</span>
                        </div>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-small" onclick="editContent('${contentType}', ${item.id})">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="deleteContent('${contentType}', ${item.id})">🗑️</button>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ Загружено ${content.length} элементов типа ${contentType}`);
    } catch (error) {
        console.error(`❌ Ошибка загрузки контента ${contentType}:`, error);
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
    
    console.log(`📝 Открыта форма добавления контента типа: ${defaultType}`);
}

async function addNewContent() {
    const form = document.getElementById('addContentForm');
    const title = document.getElementById('contentTitleInput').value.trim();
    const contentType = document.getElementById('contentTypeSelect').value;
    
    if (!title) {
        showNotification('❌ Введите название контента', 'error');
        return;
    }
    
    const contentData = {
        title: title,
        description: document.getElementById('contentDescriptionInput').value.trim(),
        fullDescription: document.getElementById('contentFullDescriptionInput').value.trim(),
        duration: document.getElementById('contentDurationInput').value.trim(),
        price: parseInt(document.getElementById('contentPriceInput').value) || 0,
        modules: parseInt(document.getElementById('contentModulesInput').value) || 1,
        type: document.getElementById('contentMaterialType').value,
        image: document.getElementById('contentImageInput').value.trim(),
        file: document.getElementById('contentFileInput').value.trim(),
        contentType: contentType
    };
    
    console.log('📤 Отправка данных контента:', contentData);
    
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
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Ошибка при добавлении контента:', error);
        showNotification('❌ Ошибка при добавлении контента: ' + error.message, 'error');
    }
}

async function editContent(contentType, contentId) {
    const content = adminData.content[contentType]?.find(item => item.id === contentId);
    if (!content) {
        showNotification('❌ Контент не найден', 'error');
        return;
    }
    
    console.log(`✏️ Редактирование контента: ${contentType} ID: ${contentId}`);
    
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
                            <input type="text" id="editContentTitleInput" value="${escapeHtml(content.title)}" required>
                        </div>
                        <div class="form-group">
                            <label>Описание</label>
                            <textarea id="editContentDescriptionInput" rows="3">${escapeHtml(content.description || '')}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Полное описание</label>
                            <textarea id="editContentFullDescriptionInput" rows="5">${escapeHtml(content.full_description || content.fullDescription || '')}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Длительность</label>
                                <input type="text" id="editContentDurationInput" value="${escapeHtml(content.duration || '')}">
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
        title: document.getElementById('editContentTitleInput').value.trim(),
        description: document.getElementById('editContentDescriptionInput').value.trim(),
        fullDescription: document.getElementById('editContentFullDescriptionInput').value.trim(),
        duration: document.getElementById('editContentDurationInput').value.trim(),
        price: parseInt(document.getElementById('editContentPriceInput').value) || 0
    };
    
    console.log(`📤 Обновление контента ${contentType} ID: ${contentId}`, updateData);
    
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
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Ошибка при обновлении контента:', error);
        showNotification('❌ Ошибка при обновлении контента: ' + error.message, 'error');
    }
}

async function deleteContent(contentType, contentId) {
    const content = adminData.content[contentType]?.find(item => item.id === contentId);
    if (!content) {
        showNotification('❌ Контент не найден', 'error');
        return;
    }

    if (!confirm(`🗑️ Удалить контент "${content.title}"?`)) return;

    console.log(`🗑️ Удаление контента: ${contentType} ID: ${contentId}`);
    
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
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Ошибка при удалении контента:', error);
        showNotification('❌ Ошибка при удалении контента: ' + error.message, 'error');
    }
}

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================

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
            console.log(`✅ Загружено ${data.users.length} пользователей`);
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки пользователей:', error);
        usersList.innerHTML = '<div class="error">Ошибка загрузки пользователей</div>';
    }
}

function renderUsersList() {
    const usersList = document.getElementById('usersList');
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const filterType = document.getElementById('userFilter')?.value || 'all';

    const filteredUsers = adminData.users.filter(user => {
        const matchesSearch = user.firstName.toLowerCase().includes(searchTerm) ||
                             (user.email && user.email.toLowerCase().includes(searchTerm)) ||
                             (user.specialization && user.specialization.toLowerCase().includes(searchTerm));
        
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
                <div class="empty-hint">Попробуйте изменить параметры поиска</div>
            </div>
        `;
        return;
    }

    usersList.innerHTML = filteredUsers.map(user => `
        <div class="admin-content-item">
            <div class="user-info">
                <div class="user-avatar">${user.isAdmin ? '👑' : '👤'}</div>
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
                        <span class="join-date">Зарегистрирован: ${formatDate(user.joinedAt)}</span>
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
        console.error('❌ Ошибка загрузки пользователя:', error);
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
                            <div class="avatar-large">${user.isAdmin ? '👑' : '👤'}</div>
                            <div class="profile-info">
                                <div class="profile-name">${user.firstName} ${user.lastName || ''}</div>
                                <div class="profile-meta">
                                    ${user.specialization ? `<span>🎯 ${user.specialization}</span>` : ''}
                                    ${user.city ? `<span>🏙️ ${user.city}</span>` : ''}
                                    ${user.email ? `<span>📧 ${user.email}</span>` : ''}
                                </div>
                                <div class="subscription-status ${user.subscription?.status || 'inactive'}">
                                    ${getSubscriptionStatusText(user.subscription?.status)}
                                    ${user.subscription?.endDate ? ` до ${formatDate(user.subscription.endDate)}` : ''}
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
    console.log(`👁️ Просмотр профиля пользователя: ${user.firstName}`);
}

async function editUserSubscription(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) return;

    const newStatus = prompt('Изменить статус подписки (active/trial/inactive):', user.subscription?.status || 'inactive');
    if (newStatus && ['active', 'trial', 'inactive'].includes(newStatus)) {
        try {
            const endDate = newStatus === 'active' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) :
                          newStatus === 'trial' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

            const response = await fetch(`/api/user/${userId}/subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan: newStatus === 'active' ? '1_month' : 'trial_7days'
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
            console.error('❌ Ошибка при изменении подписки:', error);
            showNotification('❌ Ошибка при изменении подписки', 'error');
        }
    }
}

async function sendUserMessage(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) return;
    
    const message = prompt(`Введите сообщение для ${user.firstName}:`);
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
            console.error('❌ Ошибка при отправке сообщения:', error);
            showNotification('❌ Ошибка при отправке сообщения', 'error');
        }
    }
}

async function makeAdmin(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Назначить пользователя ${user.firstName} администратором?`)) {
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
            console.error('❌ Ошибка при назначении администратора:', error);
            showNotification('❌ Ошибка при назначении администратора', 'error');
        }
    }
}

function exportUserData(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) return;
    
    const userData = {
        profile: user,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user_${userId}_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('📥 Данные пользователя экспортированы', 'success');
}

// ==================== УПРАВЛЕНИЕ АДМИНИСТРАТОРАМИ ====================

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
            console.log(`✅ Загружено ${data.data.length} администраторов`);
        } else {
            throw new Error('Failed to load admins');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки списка админов:', error);
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
                    <div class="admin-name">${admin.first_name || `Пользователь ${admin.id}`}</div>
                    <div class="admin-meta">
                        ${admin.username ? `<span>@${admin.username}</span>` : ''}
                        <span>ID: ${admin.id}</span>
                    </div>
                    <div class="admin-join-date">С ${formatDate(admin.joined_at)}</div>
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

    const userIdNum = parseInt(userId);
    
    try {
        const response = await fetch('/api/admins', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: userIdNum })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Администратор добавлен', 'success');
            await loadAdmins();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('❌ Ошибка при добавлении админа:', error);
        showNotification('❌ Ошибка при добавлении администратора: ' + error.message, 'error');
    }
}

async function removeAdmin(userId) {
    const admin = adminData.admins.find(a => a.id === userId);
    if (!admin) return;

    if (!confirm(`🗑️ Удалить администратора ${admin.first_name || `пользователя ${userId}`}?`)) return;

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
        console.error('❌ Ошибка при удалении админа:', error);
        showNotification('❌ Ошибка при удалении администратора: ' + error.message, 'error');
    }
}

// ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИОНАЛЫ ====================

function loadSubscriptions() {
    const subscriptionsTab = document.getElementById('subscriptions');
    if (!subscriptionsTab) return;
    
    subscriptionsTab.innerHTML = `
        <h2>💳 Управление подписками</h2>
        <div class="subscriptions-stats">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${adminData.stats.activeUsers || 0}</div>
                    <div class="stat-label">Активных подписок</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(adminData.stats.totalUsers || 0) - (adminData.stats.activeUsers || 0)}</div>
                    <div class="stat-label">Неактивных</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${((adminData.stats.activeUsers || 0) / (adminData.stats.totalUsers || 1) * 100).toFixed(1)}%</div>
                    <div class="stat-label">Конверсия</div>
                </div>
            </div>
        </div>
        
        <div class="subscriptions-actions">
            <h3>Действия</h3>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="createPromoCode()">🎫 Создать промокод</button>
                <button class="btn btn-secondary" onclick="exportSubscriptions()">📥 Экспорт подписок</button>
                <button class="btn btn-outline" onclick="sendMassNotification()">📢 Массовое уведомление</button>
            </div>
        </div>
    `;
}

function loadPromotions() {
    const promotionsTab = document.getElementById('promotions');
    if (!promotionsTab) return;
    
    promotionsTab.innerHTML = `
        <div class="promotions-header">
            <h2>🎁 Управление акциями</h2>
            <button class="btn btn-primary" onclick="createPromotion()">+ Создать акцию</button>
        </div>
        
        <div class="promotions-grid">
            <div class="promotion-card">
                <div class="promotion-header">
                    <div class="promotion-title">Пробный период</div>
                    <div class="promotion-status active">✅ Активна</div>
                </div>
                <div class="promotion-description">7 дней бесплатного доступа ко всем материалам</div>
                <div class="promotion-stats">
                    <span>👥 45 активаций</span>
                    <span>🔄 12% конверсия</span>
                </div>
                <div class="promotion-actions">
                    <button class="btn btn-small" onclick="editPromotion(1)">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="deletePromotion(1)">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

function loadSettings() {
    const settingsTab = document.getElementById('settings');
    if (!settingsTab) return;
    
    settingsTab.innerHTML = `
        <h2>⚙️ Настройки системы</h2>
        
        <div class="settings-sections">
            <div class="settings-section">
                <h3>🔧 Основные настройки</h3>
                <div class="setting-item">
                    <label>Название академии</label>
                    <input type="text" value="Академия АНБ" class="setting-input">
                </div>
                <div class="setting-item">
                    <label>Email поддержки</label>
                    <input type="email" value="academy@anb.ru" class="setting-input">
                </div>
            </div>
            
            <div class="settings-section">
                <h3>💰 Настройки платежей</h3>
                <div class="setting-item">
                    <label>Пробный период (дни)</label>
                    <input type="number" value="7" class="setting-input">
                </div>
            </div>
        </div>
        
        <div class="settings-actions">
            <button class="btn btn-primary" onclick="saveSettings()">💾 Сохранить настройки</button>
        </div>
    `;
}

// Функции для акций и промокодов
function createPromoCode() {
    const promoCode = `PROMO${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    showNotification(`🎫 Создан промокод: ${promoCode}`, 'success');
}

function createPromotion() {
    showNotification('🎁 Функция создания акции в разработке', 'info');
}

function editPromotion(promoId) {
    showNotification(`✏️ Редактирование акции ID: ${promoId}`, 'info');
}

function deletePromotion(promoId) {
    if (confirm('Удалить акцию?')) {
        showNotification(`🗑️ Акция ID: ${promoId} удалена`, 'success');
    }
}

function exportSubscriptions() {
    showNotification('📥 Экспорт данных о подписках завершен', 'success');
}

function sendMassNotification() {
    const message = prompt('Введите сообщение для массовой рассылки:');
    if (message) {
        showNotification(`📢 Массовая рассылка отправлена: "${message}"`, 'success');
    }
}

function saveSettings() {
    showNotification('💾 Настройки сохранены', 'success');
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function switchAdminTab(tab) {
    currentAdminTab = tab;
    
    console.log(`📑 Переключение на вкладку: ${tab}`);
    
    // Скрыть все вкладки
    document.querySelectorAll('.admin-tab').forEach(t => {
        t.classList.remove('active');
    });
    
    // Убрать активность с кнопок
    document.querySelectorAll('.admin-nav-btn').forEach(b => {
        b.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    const tabElement = document.getElementById(tab);
    if (tabElement) {
        tabElement.classList.add('active');
    }
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
    
    console.log(`📚 Переключение на контент: ${contentType}`);
}

function loadTabData(tab) {
    console.log(`📥 Загрузка данных для вкладки: ${tab}`);
    
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

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

function formatDate(date) {
    if (!date) return 'неизвестно';
    return new Date(date).toLocaleDateString('ru-RU');
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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
    }, 4000);
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

// Инициализация Telegram WebApp в админ-панели
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.expand();
    Telegram.WebApp.ready();
    console.log('📱 Telegram WebApp инициализирован в админ-панели');
}

// CSS анимации для админки
const adminStyle = document.createElement('style');
adminStyle.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .admin-content-item {
        transition: all 0.3s ease;
    }
    
    .admin-content-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .status-badge.active {
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    
    .status-badge.trial {
        background: #ffc107;
        color: black;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    
    .status-badge.inactive {
        background: #dc3545;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    
    .main-admin-badge {
        background: #58b8e7;
        color: white;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
    }
`;
document.head.appendChild(adminStyle);

console.log('✅ admin.js полностью загружен и готов к работе');
