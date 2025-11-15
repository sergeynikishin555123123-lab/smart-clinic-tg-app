// ==================== АДМИН-ПАНЕЛЬ ====================
let adminData = {
    stats: {},
    users: [],
    content: {},
    settings: {}
};

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
    // Проверка прав администратора
    if (window.Telegram && Telegram.WebApp) {
        const tgUser = Telegram.WebApp.initDataUnsafe.user;
        return tgUser && tgUser.id === 898508164;
    }
    return false;
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
}

function switchAdminTab(tab) {
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

    } catch (error) {
        console.error('Ошибка загрузки админ-данных:', error);
    }
}

function updateDashboard() {
    document.getElementById('totalUsers').textContent = adminData.stats.totalUsers || 0;
    document.getElementById('activeUsers').textContent = adminData.stats.activeUsers || 0;
    document.getElementById('totalCourses').textContent = adminData.content.courses ? adminData.content.courses.length : 0;
    document.getElementById('totalRevenue').textContent = '0 ₽'; // Заглушка
}

async function loadContentList(contentType) {
    const contentList = document.getElementById('contentList');
    contentList.innerHTML = '<div class="loading">Загрузка...</div>';

    try {
        const response = await fetch(`/api/content/${contentType}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            if (data.data.length === 0) {
                contentList.innerHTML = '<div class="empty-state">Контент не найден</div>';
                return;
            }

            contentList.innerHTML = data.data.map(item => `
                <div class="admin-content-item">
                    <div class="content-info">
                        <div class="content-title">${item.title}</div>
                        <div class="content-description">${item.description || 'Нет описания'}</div>
                        <div class="content-meta">
                            ${item.duration ? `<span>⏱️ ${item.duration}</span>` : ''}
                            ${item.price ? `<span>💰 ${item.price} руб.</span>` : ''}
                            <span>ID: ${item.id}</span>
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
    document.getElementById('contentTypeSelect').value = defaultType;
    document.getElementById('addContentModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function addNewContent() {
    const form = document.getElementById('addContentForm');
    const formData = new FormData(form);
    
    const contentData = {
        title: document.getElementById('contentTitleInput').value,
        description: document.getElementById('contentDescriptionInput').value,
        type: document.getElementById('contentTypeSelect').value
    };

    try {
        // Здесь будет API для добавления контента
        alert(`✅ Контент "${contentData.title}" добавлен!\n\nТип: ${getContentTypeName(contentData.type)}`);
        closeModal('addContentModal');
        form.reset();
        
        // Обновляем список контента
        loadContentList(contentData.type);
    } catch (error) {
        alert('❌ Ошибка при добавлении контента');
    }
}

function editContent(contentType, contentId) {
    alert(`✏️ Редактирование: ${contentType} ID: ${contentId}\n\nФункция в разработке`);
}

function deleteContent(contentType, contentId) {
    if (confirm(`🗑️ Удалить этот контент?`)) {
        alert(`✅ Контент ${contentType} ID: ${contentId} удален`);
        // Здесь будет API удаления
        loadContentList(contentType);
    }
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
                <div class="content-info">
                    <div class="content-title">Иван Петров</div>
                    <div class="content-description">Невролог, Москва • ivan@example.com</div>
                    <div class="content-meta">
                        <span>🆓 Пробный период</span>
                        <span>📅 Зарегистрирован: 15.11.2024</span>
                    </div>
                </div>
                <div class="content-actions">
                    <button class="btn btn-small">👁️</button>
                    <button class="btn btn-small">✉️</button>
                </div>
            </div>
        `;
    }, 1000);
}

function refreshAdminData() {
    loadAdminData();
    alert('🔄 Данные обновлены');
}

function goToMainApp() {
    window.location.href = '/';
}

// Инициализация Telegram WebApp в админ-панели
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.expand();
    Telegram.WebApp.ready();
}
