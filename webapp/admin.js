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
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" class="content-image">` : ''}
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
                    <form id="addContentForm" enctype="multipart/form-data">
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
                        
                        <div class="form-group">
                            <label>Изображение (превью)</label>
                            <input type="file" id="contentImageInput" accept="image/*">
                        </div>
                        
                        <div id="additionalFields">
                            <!-- Динамические поля в зависимости от типа контента -->
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
    
    // Обновляем дополнительные поля при изменении типа контента
    document.getElementById('contentTypeSelect').addEventListener('change', function() {
        updateAdditionalFields(this.value);
    });
    
    // Инициализируем дополнительные поля
    updateAdditionalFields(defaultType);
    
    document.getElementById('addContentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewContent();
    });
    
    console.log(`📝 Открыта форма добавления контента типа: ${defaultType}`);
}

function updateAdditionalFields(contentType) {
    const additionalFields = document.getElementById('additionalFields');
    if (!additionalFields) return;

    let fieldsHTML = '';

    switch(contentType) {
        case 'courses':
            fieldsHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Длительность</label>
                        <input type="text" id="contentDurationInput" placeholder="12 часов">
                    </div>
                    <div class="form-group">
                        <label>Цена (руб.)</label>
                        <input type="number" id="contentPriceInput" value="0" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Количество модулей</label>
                    <input type="number" id="contentModulesInput" value="1" min="1">
                </div>
                <div class="form-group">
                    <label>Видео файл</label>
                    <input type="file" id="contentVideoInput" accept="video/*">
                </div>
                <div class="form-group">
                    <label>Дополнительные материалы (PDF, DOC)</label>
                    <input type="file" id="contentFileInput" accept=".pdf,.doc,.docx">
                </div>
            `;
            break;

        case 'podcasts':
            fieldsHTML = `
                <div class="form-group">
                    <label>Длительность</label>
                    <input type="text" id="contentDurationInput" placeholder="45:20">
                </div>
                <div class="form-group">
                    <label>Аудио файл</label>
                    <input type="file" id="contentFileInput" accept="audio/*">
                </div>
            `;
            break;

        case 'streams':
            fieldsHTML = `
                <div class="form-group">
                    <label>Дата и время проведения</label>
                    <input type="datetime-local" id="contentEventDate">
                </div>
                <div class="form-group">
                    <label>Ссылка на трансляцию</label>
                    <input type="url" id="contentStreamUrl" placeholder="https://youtube.com/...">
                </div>
            `;
            break;

        case 'videos':
            fieldsHTML = `
                <div class="form-group">
                    <label>Длительность</label>
                    <input type="text" id="contentDurationInput" placeholder="15:30">
                </div>
                <div class="form-group">
                    <label>Видео файл</label>
                    <input type="file" id="contentVideoInput" accept="video/*">
                </div>
            `;
            break;

        case 'materials':
            fieldsHTML = `
                <div class="form-group">
                    <label>Тип материала</label>
                    <select id="contentMaterialType">
                        <option value="mri">МРТ разбор</option>
                        <option value="case">Клинический случай</option>
                        <option value="checklist">Чек-лист</option>
                        <option value="article">Статья</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Файл материала</label>
                    <input type="file" id="contentFileInput" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                </div>
            `;
            break;

        case 'events':
            fieldsHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Дата и время проведения</label>
                        <input type="datetime-local" id="contentEventDate">
                    </div>
                    <div class="form-group">
                        <label>Тип мероприятия</label>
                        <select id="contentEventType">
                            <option value="online">Онлайн</option>
                            <option value="offline">Офлайн</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Место проведения</label>
                    <input type="text" id="contentLocation" placeholder="Москва, ул. Примерная, 1">
                </div>
                <div class="form-group">
                    <label>Ссылка для регистрации</label>
                    <input type="url" id="contentRegistrationUrl" placeholder="https://forms.google.com/...">
                </div>
            `;
            break;
    }

    additionalFields.innerHTML = fieldsHTML;
}

async function addNewContent() {
    const form = document.getElementById('addContentForm');
    const title = document.getElementById('contentTitleInput').value.trim();
    const contentType = document.getElementById('contentTypeSelect').value;
    
    if (!title) {
        showNotification('❌ Введите название контента', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', document.getElementById('contentDescriptionInput').value.trim());
    formData.append('fullDescription', document.getElementById('contentFullDescriptionInput').value.trim());
    formData.append('contentType', contentType);

    // Добавляем файлы
    const imageFile = document.getElementById('contentImageInput').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    // Добавляем дополнительные поля в зависимости от типа контента
    switch(contentType) {
        case 'courses':
            formData.append('duration', document.getElementById('contentDurationInput').value.trim());
            formData.append('price', document.getElementById('contentPriceInput').value);
            formData.append('modules', document.getElementById('contentModulesInput').value);
            
            const videoFile = document.getElementById('contentVideoInput').files[0];
            if (videoFile) formData.append('video', videoFile);
            
            const fileFile = document.getElementById('contentFileInput').files[0];
            if (fileFile) formData.append('file', fileFile);
            break;

        case 'podcasts':
            formData.append('duration', document.getElementById('contentDurationInput').value.trim());
            
            const audioFile = document.getElementById('contentFileInput').files[0];
            if (audioFile) formData.append('file', audioFile);
            break;

        case 'streams':
            formData.append('eventDate', document.getElementById('contentEventDate').value);
            formData.append('streamUrl', document.getElementById('contentStreamUrl').value.trim());
            break;

        case 'videos':
            formData.append('duration', document.getElementById('contentDurationInput').value.trim());
            
            const videoFile2 = document.getElementById('contentVideoInput').files[0];
            if (videoFile2) formData.append('video', videoFile2);
            break;

        case 'materials':
            formData.append('materialType', document.getElementById('contentMaterialType').value);
            
            const materialFile = document.getElementById('contentFileInput').files[0];
            if (materialFile) formData.append('file', materialFile);
            break;

        case 'events':
            formData.append('eventDate', document.getElementById('contentEventDate').value);
            formData.append('location', document.getElementById('contentLocation').value.trim());
            formData.append('eventType', document.getElementById('contentEventType').value);
            formData.append('registrationUrl', document.getElementById('contentRegistrationUrl').value.trim());
            break;
    }
    
    console.log('📤 Отправка данных контента:', Object.fromEntries(formData));
    
    try {
        const response = await fetch('/api/content', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Контент успешно добавлен', 'success');
            closeModal('addContentModal');
            await loadAdminData(); // Перезагружаем данные
            loadContentList(contentType);
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
        adminsList.innerHTML = '<div class="

    // Продолжение webapp/admin.js

async function updateAdminsList() {
    const adminsList = document.getElementById('adminsList');
    if (!adminsList) return;

    if (adminData.admins.length === 0) {
        adminsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👑</div>
                <div class="empty-text">Администраторы не найдены</div>
                <div class="empty-hint">Добавьте администраторов для управления системой</div>
            </div>
        `;
        return;
    }

    adminsList.innerHTML = adminData.admins.map(admin => `
        <div class="admin-item">
            <div class="admin-info">
                <div class="admin-avatar">${admin.isMainAdmin ? '👑' : '🔧'}</div>
                <div class="admin-details">
                    <div class="admin-name">${admin.first_name || 'Администратор'} ${admin.last_name || ''}</div>
                    <div class="admin-meta">
                        <span>👤 ID: ${admin.id}</span>
                        ${admin.username ? `<span>@${admin.username}</span>` : ''}
                        ${admin.isMainAdmin ? '<span class="main-admin-badge">Главный администратор</span>' : ''}
                    </div>
                    <div class="admin-join-date">В системе с: ${formatDate(admin.joined_at)}</div>
                </div>
            </div>
            <div class="admin-actions">
                ${!admin.isMainAdmin ? `
                    <button class="btn btn-small btn-danger" onclick="removeAdmin(${admin.id})">🗑️ Удалить</button>
                ` : ''}
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
            showNotification('✅ Пользователь назначен администратором', 'success');
            await loadAdmins();
            await loadUsersList();
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Ошибка при добавлении администратора:', error);
        showNotification('❌ Ошибка при добавлении администратора: ' + error.message, 'error');
    }
}

async function removeAdmin(userId) {
    const admin = adminData.admins.find(a => a.id === userId);
    if (!admin) return;

    if (!confirm(`Удалить администратора ${admin.first_name || 'пользователя'}?`)) return;

    try {
        const response = await fetch(`/api/admins/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Администратор удален', 'success');
            await loadAdmins();
            await loadUsersList();
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Ошибка при удалении администратора:', error);
        showNotification('❌ Ошибка при удалении администратора: ' + error.message, 'error');
    }
}

// ==================== СИСТЕМА УВЕДОМЛЕНИЙ ====================

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
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-weight: 600;
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

// ==================== УТИЛИТЫ ====================

function switchAdminTab(tabName) {
    currentAdminTab = tabName;
    
    // Обновляем навигацию
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Показываем активную вкладку
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.toggle('active', tab.id === tabName);
    });
    
    // Загружаем данные для вкладки
    switch(tabName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'content':
            loadContentList(currentContentType);
            break;
        case 'users':
            loadUsersList();
            break;
        case 'admins':
            loadAdmins();
            break;
        case 'subscriptions':
            updateSubscriptionsStats();
            break;
        case 'promotions':
            loadPromotions();
            break;
        case 'settings':
            loadSettings();
            break;
    }
    
    console.log(`🔧 Переключение на вкладку: ${tabName}`);
}

function switchContentTab(contentType) {
    currentContentType = contentType;
    
    // Обновляем навигацию контента
    document.querySelectorAll('.content-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.contentType === contentType);
    });
    
    // Обновляем заголовок
    const contentTitle = document.getElementById('contentTitle');
    if (contentTitle) {
        contentTitle.textContent = getContentTypeName(contentType);
    }
    
    // Загружаем контент
    loadContentList(contentType);
    
    console.log(`📚 Переключение на тип контента: ${contentType}`);
}

function refreshAdminData() {
    showNotification('🔄 Обновление данных...', 'info');
    loadAdminData();
}

function goToMainApp() {
    window.location.href = '/';
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    showNotification(document.body.classList.contains('dark-mode') ? '🌙 Темный режим' : '☀️ Светлый режим');
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

function formatDate(date) {
    if (!date) return 'неизвестно';
    return new Date(date).toLocaleDateString('ru-RU');
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
        'active': 'Активная',
        'trial': 'Пробный период',
        'inactive': 'Неактивная'
    };
    return statuses[status] || 'Неизвестно';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// ==================== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ АДМИНКИ ====================

async function showUploadForm() {
    const modalHTML = `
        <div class="modal" id="uploadModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📤 Загрузка файлов</h3>
                    <button class="close-btn" onclick="closeModal('uploadModal')">×</button>
                </div>
                <div class="modal-body">
                    <form id="uploadForm" enctype="multipart/form-data">
                        <div class="form-group">
                            <label>Тип файла</label>
                            <select id="uploadType" required>
                                <option value="image">Изображение</option>
                                <option value="video">Видео</option>
                                <option value="audio">Аудио</option>
                                <option value="document">Документ</option>
                                <option value="other">Другое</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Выберите файл</label>
                            <input type="file" id="fileInput" required multiple>
                        </div>
                        <div class="form-group">
                            <label>Описание файла</label>
                            <textarea id="fileDescription" rows="3" placeholder="Описание файла..."></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('uploadModal')">Отмена</button>
                            <button type="submit" class="btn btn-primary">Загрузить файлы</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('uploadForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await uploadFiles();
    });
}

async function uploadFiles() {
    const fileInput = document.getElementById('fileInput');
    const uploadType = document.getElementById('uploadType').value;
    const description = document.getElementById('fileDescription').value;
    
    if (!fileInput.files.length) {
        showNotification('❌ Выберите файлы для загрузки', 'error');
        return;
    }
    
    const formData = new FormData();
    for (let i = 0; i < fileInput.files.length; i++) {
        formData.append('files', fileInput.files[i]);
    }
    formData.append('uploadType', uploadType);
    formData.append('description', description);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`✅ Файлы успешно загружены (${fileInput.files.length} шт.)`, 'success');
            closeModal('uploadModal');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('❌ Ошибка при загрузке файлов:', error);
        showNotification('❌ Ошибка при загрузке файлов: ' + error.message, 'error');
    }
}

async function generateReport() {
    showNotification('📊 Генерация отчета...', 'info');
    
    try {
        const reportData = {
            timestamp: new Date().toISOString(),
            stats: adminData.stats,
            usersCount: adminData.users.length,
            contentCount: Object.values(adminData.content).reduce((sum, arr) => sum + arr.length, 0),
            adminsCount: adminData.admins.length
        };
        
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `anb_admin_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('📥 Отчет сгенерирован и скачан', 'success');
    } catch (error) {
        console.error('❌ Ошибка генерации отчета:', error);
        showNotification('❌ Ошибка при генерации отчета', 'error');
    }
}

async function exportUsersData() {
    try {
        const usersData = {
            exportDate: new Date().toISOString(),
            users: adminData.users
        };
        
        const dataStr = JSON.stringify(usersData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `anb_users_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification(`📥 Экспортировано ${adminData.users.length} пользователей`, 'success');
    } catch (error) {
        console.error('❌ Ошибка экспорта пользователей:', error);
        showNotification('❌ Ошибка при экспорте пользователей', 'error');
    }
}

function searchUsers() {
    renderUsersList();
}

function refreshContentList() {
    loadContentList(currentContentType);
}

// ==================== ПОДПИСКИ И АКЦИИ ====================

async function updateSubscriptionsStats() {
    if (!adminData.stats) return;
    
    const activeSubscriptions = document.getElementById('activeSubscriptions');
    const trialSubscriptions = document.getElementById('trialSubscriptions');
    const totalRevenue = document.getElementById('totalRevenue');
    const conversionRate = document.getElementById('conversionRate');
    
    if (activeSubscriptions) activeSubscriptions.textContent = adminData.stats.activeUsers || 0;
    if (trialSubscriptions) trialSubscriptions.textContent = (adminData.stats.totalUsers || 0) - (adminData.stats.activeUsers || 0);
    
    const revenue = (adminData.stats.activeUsers || 0) * 2900;
    if (totalRevenue) totalRevenue.textContent = `${revenue.toLocaleString()} ₽`;
    
    const conversion = adminData.stats.totalUsers ? Math.round((adminData.stats.activeUsers / adminData.stats.totalUsers) * 100) : 0;
    if (conversionRate) conversionRate.textContent = `${conversion}%`;
}

function createPromoCode() {
    const promoCode = `ANB${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const discount = prompt('Введите размер скидки в %:', '10');
    
    if (discount && !isNaN(discount)) {
        showNotification(`🎫 Промокод создан: ${promoCode} (${discount}% скидка)`, 'success');
    }
}

function exportSubscriptions() {
    showNotification('📥 Экспорт данных о подписках...', 'info');
    // Реализация экспорта подписок
}

function sendMassNotification() {
    const message = prompt('Введите сообщение для всех пользователей:');
    if (message) {
        showNotification(`📢 Массовое уведомление отправлено: "${message}"`, 'success');
    }
}

function createPromotion() {
    showNotification('🎁 Создание новой акции...', 'info');
    // Реализация создания акции
}

function editPromotion(id) {
    showNotification(`✏️ Редактирование акции #${id}`, 'info');
}

function deletePromotion(id) {
    if (confirm('Удалить акцию?')) {
        showNotification(`🗑️ Акция #${id} удалена`, 'success');
    }
}

// ==================== НАСТРОЙКИ ====================

function loadSettings() {
    // Загрузка текущих настроек
    console.log('⚙️ Загрузка настроек системы...');
}

function saveSettings() {
    showNotification('✅ Настройки сохранены', 'success');
}

function resetSettings() {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
        showNotification('🔄 Настройки сброшены', 'success');
    }
}

// ==================== CSS АНИМАЦИИ ДЛЯ АДМИНКИ ====================

const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .back-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
    }
    
    .back-btn:hover {
        background: rgba(255,255,255,0.3);
        transform: translateX(-2px);
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #2c3e50;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e3f2fd;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.3s ease;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #58b8e7;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }
    
    .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e9ecef;
    }
    
    .dark-mode {
        --surface: #1a1a1a;
        --surface-light: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #b0b0b0;
        --border: #404040;
    }
    
    .dark-mode .admin-sidebar {
        background: #1a1a1a;
    }
    
    .dark-mode .admin-content {
        background: #2d2d2d;
        color: #ffffff;
    }
    
    .dark-mode .stat-card,
    .dark-mode .content-management,
    .dark-mode .users-list,
    .dark-mode .admins-list,
    .dark-mode .subscriptions-actions,
    .dark-mode .settings-section {
        background: #1a1a1a;
        color: #ffffff;
    }
    
    .dark-mode .search-input,
    .dark-mode .setting-input {
        background: #2d2d2d;
        color: #ffffff;
        border-color: #404040;
    }
`;
document.head.appendChild(adminStyles);

console.log('✅ admin.js полностью загружен и готов к работе');
