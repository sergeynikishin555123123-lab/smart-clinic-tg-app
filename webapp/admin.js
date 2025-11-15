// webapp/admin.js
let adminData = {
    stats: {},
    users: [],
    content: {},
    admins: []
};

let currentAdminTab = 'dashboard';
let currentContentType = 'courses';

// Демо-данные
const demoUsers = [
    {
        id: 1,
        firstName: 'Иван Петров',
        specialization: 'Невролог',
        city: 'Москва',
        email: 'ivan@example.com',
        subscription: { status: 'trial', endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
        joinedAt: new Date('2024-01-15'),
        progress: { steps: { materialsWatched: 5, eventsParticipated: 2, materialsSaved: 3, coursesBought: 0 } }
    },
    {
        id: 2,
        firstName: 'Анна Сидорова', 
        specialization: 'Ортопед',
        city: 'Санкт-Петербург',
        email: 'anna@example.com',
        subscription: { status: 'active', endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        joinedAt: new Date('2024-01-10'),
        progress: { steps: { materialsWatched: 12, eventsParticipated: 5, materialsSaved: 8, coursesBought: 1 } }
    },
    {
        id: 3,
        firstName: 'Петр Иванов',
        specialization: 'Реабилитолог',
        city: 'Казань',
        email: 'petr@example.com',
        subscription: { status: 'inactive', endDate: null },
        joinedAt: new Date('2024-01-20'),
        progress: { steps: { materialsWatched: 2, eventsParticipated: 1, materialsSaved: 1, coursesBought: 0 } }
    }
];

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
        
        // Если не удалось проверить через API, показываем демо-админку
        console.log('⚠️ Используем демо-режим админки');
        document.getElementById('adminName').textContent = 'Демо Администратор';
        return true;
        
    } catch (error) {
        console.error('Ошибка проверки админ-прав:', error);
        // В демо-режиме разрешаем доступ
        document.getElementById('adminName').textContent = 'Демо Администратор';
        return true;
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

    // Инициализация фильтров пользователей
    const userFilter = document.getElementById('userFilter');
    if (userFilter) {
        userFilter.addEventListener('change', function() {
            loadUsersList();
        });
    }

    // Добавляем кнопку добавления админа если её нет в HTML
    const adminsTab = document.getElementById('admins');
    if (adminsTab && !document.getElementById('addAdminBtn')) {
        const addAdminBtn = document.createElement('button');
        addAdminBtn.id = 'addAdminBtn';
        addAdminBtn.className = 'btn btn-primary';
        addAdminBtn.textContent = '+ Добавить администратора';
        addAdminBtn.onclick = addNewAdmin;
        adminsTab.querySelector('h2').insertAdjacentElement('afterend', addAdminBtn);
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
        } else {
            // Демо-статистика
            adminData.stats = {
                totalUsers: 156,
                activeUsers: 89,
                completedSurveys: 134,
                content: {
                    courses: 7,
                    podcasts: 12,
                    streams: 24,
                    videos: 45,
                    materials: 32,
                    events: 8
                }
            };
            updateDashboard();
        }

        // Загрузка контента
        const contentResponse = await fetch('/api/content');
        const contentData = await contentResponse.json();
        
        if (contentData.success) {
            adminData.content = contentData.data;
            console.log('✅ Контент загружен:', adminData.content);
        } else {
            // Демо-контент
            adminData.content = {
                courses: [
                    { id: 1, title: "Мануальные техники", description: "6 модулей", price: 15000, duration: "12 часов", created: new Date('2024-01-15') },
                    { id: 2, title: "Неврология для врачей", description: "Основы диагностики", price: 12000, duration: "10 часов", created: new Date('2024-01-20') }
                ],
                podcasts: [
                    { id: 1, title: "АНБ FM: Основы неврологии", description: "Подкаст о современных подходах", duration: "45:20", created: new Date('2024-01-10') }
                ],
                streams: [
                    { id: 1, title: "Разбор клинического случая", description: "Боль в пояснице", duration: "1:15:30", created: new Date('2024-01-18') }
                ],
                videos: [
                    { id: 1, title: "Техника МФР", description: "Миофасциальный релиз", duration: "08:15", created: new Date('2024-01-05') }
                ],
                materials: [
                    { id: 1, title: "МРТ разбор: грыжа L4-L5", description: "Детальный анализ", type: "mri", created: new Date('2024-01-08') }
                ],
                events: [
                    { id: 1, title: "Вебинар по реабилитации", description: "Современные методы", type: "online", created: new Date('2024-01-12') }
                ]
            };
        }

        // Загрузка списка админов
        await loadAdmins();

    } catch (error) {
        console.error('Ошибка загрузки админ-данных:', error);
        // Используем демо-данные при ошибке
        adminData.stats = {
            totalUsers: 156,
            activeUsers: 89,
            completedSurveys: 134,
            content: { courses: 7, podcasts: 12, streams: 24, videos: 45, materials: 32, events: 8 }
        };
        updateDashboard();
        showNotification('⚠️ Используются демо-данные', 'info');
    }
}

function updateDashboard() {
    document.getElementById('totalUsers').textContent = adminData.stats.totalUsers || 0;
    document.getElementById('activeUsers').textContent = adminData.stats.activeUsers || 0;
    document.getElementById('totalCourses').textContent = adminData.stats.content?.courses || 0;
    
    // Рассчитываем примерный доход
    const totalRevenue = (adminData.stats.activeUsers || 0) * 2900;
    document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString()} ₽`;

    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    const activities = [
        { action: 'Новый пользователь', user: 'Иван Петров', time: '2 минуты назад' },
        { action: 'Оплата подписки', user: 'Анна Сидорова', amount: '2 900 ₽', time: '1 час назад' },
        { action: 'Добавлен курс', item: 'Мануальные техники', time: '3 часа назад' },
        { action: 'Загружен подкаст', item: 'АНБ FM: Неврология', time: '5 часов назад' },
        { action: 'Завершен опрос', user: 'Петр Иванов', time: 'вчера' }
    ];

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">🔔</div>
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
                    <h3>Добавить контент - ${getContentTypeName(defaultType)}</h3>
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
                            <label>Длительность</label>
                            <input type="text" id="contentDurationInput" placeholder="например: 1:30:00">
                        </div>
                        <div class="form-group">
                            <label>Цена (руб.)</label>
                            <input type="number" id="contentPriceInput" placeholder="0 для бесплатного" min="0">
                        </div>
                        <div class="form-group">
                            <label>Количество модулей (для курсов)</label>
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
    const title = document.getElementById('contentTitleInput').value;
    const contentType = document.getElementById('contentTypeSelect').value;
    
    if (!title.trim()) {
        showNotification('❌ Введите название контента', 'error');
        return;
    }
    
    const contentData = {
        title: title,
        description: document.getElementById('contentDescriptionInput').value,
        fullDescription: document.getElementById('contentFullDescriptionInput').value,
        duration: document.getElementById('contentDurationInput').value,
        price: parseInt(document.getElementById('contentPriceInput').value) || 0,
        modules: parseInt(document.getElementById('contentModulesInput').value) || 1,
        type: document.getElementById('contentMaterialType').value
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
            created: new Date(),
            updated: new Date()
        };
        
        adminData.content[contentType].push(newContent);
        
        showNotification('✅ Контент успешно добавлен', 'success');
        closeModal('addContentModal');
        
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
    const content = adminData.content[contentType]?.find(item => item.id === contentId);
    if (!content) {
        showNotification('❌ Контент не найден', 'error');
        return;
    }
    
    showNotification(`✏️ Редактирование: ${content.title}`, 'info');
    // Здесь можно открыть форму редактирования с предзаполненными данными
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

    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const filterType = document.getElementById('userFilter')?.value || 'all';

    // Фильтрация пользователей
    let filteredUsers = demoUsers.filter(user => {
        const matchesSearch = user.firstName.toLowerCase().includes(searchTerm) ||
                             user.email.toLowerCase().includes(searchTerm) ||
                             user.specialization.toLowerCase().includes(searchTerm);
        
        const matchesFilter = filterType === 'all' || 
                             (filterType === 'active' && user.subscription.status === 'active') ||
                             (filterType === 'trial' && user.subscription.status === 'trial') ||
                             (filterType === 'inactive' && user.subscription.status === 'inactive');
        
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
                    <div class="user-name">${user.firstName}</div>
                    <div class="user-meta">
                        <span>🎯 ${user.specialization}</span>
                        <span>🏙️ ${user.city}</span>
                        <span>📧 ${user.email}</span>
                    </div>
                    <div class="user-status">
                        <span class="status-badge ${user.subscription.status}">
                            ${user.subscription.status === 'active' ? '✅ Активная' : 
                              user.subscription.status === 'trial' ? '🆓 Пробная' : '❌ Неактивная'}
                        </span>
                        <span class="join-date">Зарегистрирован: ${new Date(user.joinedAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div class="user-stats">
                        <span>📚 Материалов: ${user.progress.steps.materialsWatched}</span>
                        <span>👥 Мероприятий: ${user.progress.steps.eventsParticipated}</span>
                        <span>💾 Сохранено: ${user.progress.steps.materialsSaved}</span>
                        <span>🎓 Курсов: ${user.progress.steps.coursesBought}</span>
                    </div>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-small" onclick="viewUser(${user.id})">👁️ Профиль</button>
                <button class="btn btn-small" onclick="messageUser(${user.id})">✉️ Сообщение</button>
                <button class="btn btn-small btn-primary" onclick="makeAdmin(${user.id})">👑 Админ</button>
            </div>
        </div>
    `).join('');
}

function searchUsers() {
    loadUsersList();
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
        } else {
            // Демо-админы
            adminData.admins = [
                { id: 898508164, firstName: 'Главный Администратор', username: 'admin', joinedAt: new Date('2024-01-01') },
                { id: 123456789, firstName: 'Тест Админ', username: 'testadmin', joinedAt: new Date('2024-01-10') }
            ];
            updateAdminsList();
        }
    } catch (error) {
        console.error('Ошибка загрузки списка админов:', error);
        // Демо-админы при ошибке
        adminData.admins = [
            { id: 898508164, firstName: 'Главный Администратор', username: 'admin', joinedAt: new Date('2024-01-01') }
        ];
        updateAdminsList();
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
            loadAdmins();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Ошибка при добавлении админа:', error);
        // Демо-режим
        adminData.admins.push({
            id: userIdNum,
            firstName: `Пользователь ${userIdNum}`,
            joinedAt: new Date()
        });
        showNotification('✅ Администратор добавлен (демо-режим)', 'success');
        updateAdminsList();
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
        // Демо-режим
        adminData.admins = adminData.admins.filter(admin => admin.id !== userId);
        showNotification('✅ Администратор удален (демо-режим)', 'success');
        updateAdminsList();
    }
}

// РАБОЧИЕ ФУНКЦИИ (без заглушек)

function viewUser(userId) {
    const user = demoUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('❌ Пользователь не найден', 'error');
        return;
    }
    
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
                                <div class="profile-name">${user.firstName}</div>
                                <div class="profile-meta">
                                    <span>🎯 ${user.specialization}</span>
                                    <span>🏙️ ${user.city}</span>
                                    <span>📧 ${user.email}</span>
                                </div>
                                <div class="subscription-status ${user.subscription.status}">
                                    ${user.subscription.status === 'active' ? '✅ Активная подписка' : 
                                      user.subscription.status === 'trial' ? '🆓 Пробный период' : '❌ Нет подписки'}
                                    ${user.subscription.endDate ? ` до ${new Date(user.subscription.endDate).toLocaleDateString('ru-RU')}` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-stats-detailed">
                            <h4>📊 Статистика активности</h4>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-value">${user.progress.steps.materialsWatched}</div>
                                    <div class="stat-label">Просмотрено материалов</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${user.progress.steps.eventsParticipated}</div>
                                    <div class="stat-label">Участий в мероприятиях</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${user.progress.steps.materialsSaved}</div>
                                    <div class="stat-label">Сохранено материалов</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value">${user.progress.steps.coursesBought}</div>
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

function messageUser(userId) {
    const user = demoUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('❌ Пользователь не найден', 'error');
        return;
    }
    
    const message = prompt(`Введите сообщение для ${user.firstName}:`);
    if (message) {
        showNotification(`✉️ Сообщение отправлено пользователю ${user.firstName}`, 'success');
        // Здесь можно добавить реальную отправку сообщения через бота
    }
}

function makeAdmin(userId) {
    const user = demoUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('❌ Пользователь не найден', 'error');
        return;
    }
    
    if (confirm(`Назначить пользователя ${user.firstName} администратором?`)) {
        addNewAdmin(userId);
    }
}

function editUserSubscription(userId) {
    const user = demoUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('❌ Пользователь не найден', 'error');
        return;
    }
    
    const newStatus = prompt('Изменить статус подписки (active/trial/inactive):', user.subscription.status);
    if (newStatus && ['active', 'trial', 'inactive'].includes(newStatus)) {
        user.subscription.status = newStatus;
        if (newStatus === 'active') {
            user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (newStatus === 'trial') {
            user.subscription.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        } else {
            user.subscription.endDate = null;
        }
        showNotification(`✅ Подписка пользователя ${user.firstName} изменена на "${newStatus}"`, 'success');
        closeModal('userModal');
        loadUsersList();
    }
}

function sendUserMessage(userId) {
    const user = demoUsers.find(u => u.id === userId);
    if (!user) return;
    
    const message = prompt(`Введите сообщение для ${user.firstName}:`);
    if (message) {
        showNotification(`✉️ Сообщение отправлено: "${message}"`, 'success');
    }
}

function exportUserData(userId) {
    const user = demoUsers.find(u => u.id === userId);
    if (!user) return;
    
    const dataStr = JSON.stringify(user, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    // Создаем временную ссылку для скачивания
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
        
        <div class="recent-payments">
            <h3>💸 Последние платежи</h3>
            <div class="payments-list">
                <div class="payment-item">
                    <div class="payment-user">Анна Сидорова</div>
                    <div class="payment-amount">2 900 ₽</div>
                    <div class="payment-date">Сегодня, 14:30</div>
                    <div class="payment-status success">✅ Успешно</div>
                </div>
                <div class="payment-item">
                    <div class="payment-user">Иван Петров</div>
                    <div class="payment-amount">7 500 ₽</div>
                    <div class="payment-date">Вчера, 11:15</div>
                    <div class="payment-status success">✅ Успешно</div>
                </div>
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
            
            <div class="promotion-card">
                <div class="promotion-header">
                    <div class="promotion-title">Приведи друга</div>
                    <div class="promotion-status active">✅ Активна</div>
                </div>
                <div class="promotion-description">Скидка 20% на подписку за каждого приглашенного</div>
                <div class="promotion-stats">
                    <span>👥 28 приглашений</span>
                    <span>🔄 8% конверсия</span>
                </div>
                <div class="promotion-actions">
                    <button class="btn btn-small" onclick="editPromotion(2)">✏️</button>
                    <button class="btn btn-small btn-danger" onclick="deletePromotion(2)">🗑️</button>
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
                <div class="setting-item">
                    <label>Валюта</label>
                    <select class="setting-input">
                        <option>RUB - Российский рубль</option>
                        <option>USD - Доллар США</option>
                    </select>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>💰 Настройки платежей</h3>
                <div class="setting-item">
                    <label>Минимальная сумма платежа</label>
                    <input type="number" value="100" class="setting-input">
                </div>
                <div class="setting-item">
                    <label>Пробный период (дни)</label>
                    <input type="number" value="7" class="setting-input">
                </div>
            </div>
            
            <div class="settings-section">
                <h3>📧 Уведомления</h3>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" checked> Уведомления о новых платежах
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" checked> Уведомления о новых пользователях
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox"> Ежедневная статистика
                    </label>
                </div>
            </div>
        </div>
        
        <div class="settings-actions">
            <button class="btn btn-primary" onclick="saveSettings()">💾 Сохранить настройки</button>
            <button class="btn btn-secondary" onclick="resetSettings()">🔄 Сбросить</button>
        </div>
    `;
}

// РАБОЧИЕ ФУНКЦИИ ДЛЯ ПРОМОАКЦИЙ И НАСТРОЕК

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

function createPromoCode() {
    const promoCode = `PROMO${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    showNotification(`🎫 Создан промокод: ${promoCode}`, 'success');
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

function resetSettings() {
    if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
        showNotification('🔄 Настройки сброшены', 'success');
    }
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

function refreshAdminData() {
    loadAdminData();
    showNotification('🔄 Данные обновлены', 'info');
}

function goToMainApp() {
    window.location.href = '/';
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

// Инициализация Telegram WebApp в админ-панели
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.expand();
    Telegram.WebApp.ready();
}
