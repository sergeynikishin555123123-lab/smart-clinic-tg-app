// ==================== КОНФИГУРАЦИЯ СТРАНИЦ ====================
const pages = {
    home: {
        title: 'Академия АНБ',
        content: `
            <div class="hero-section">
                <div class="hero-text">
                    <h2>Профессиональное развитие в неврологии и реабилитации</h2>
                    <p>Сообщество специалистов, объединенных целью совершенствования практики</p>
                </div>
            </div>

            <div class="quick-nav">
                <h3>📱 Быстрая навигация</h3>
                <div class="grid">
                    <div class="card" onclick="openSection('courses')">
                        <div class="card-icon">📚</div>
                        <div class="card-title">Курсы</div>
                        <div class="card-desc">Системное обучение с сертификатами</div>
                    </div>
                    <div class="card" onclick="openSection('fm')">
                        <div class="card-icon">🎧</div>
                        <div class="card-title">АНБ FM</div>
                        <div class="card-desc">Аудио-подкасты и интервью</div>
                    </div>
                    <div class="card" onclick="openSection('streams')">
                        <div class="card-icon">📹</div>
                        <div class="card-title">Эфиры|Разборы</div>
                        <div class="card-desc">Прямые эфиры и разборы кейсов</div>
                    </div>
                    <div class="card" onclick="openSection('cheats')">
                        <div class="card-icon">🎯</div>
                        <div class="card-title">Видео-шпаргалки</div>
                        <div class="card-desc">Короткие видео с техниками</div>
                    </div>
                    <div class="card" onclick="openSection('practice')">
                        <div class="card-icon">📋</div>
                        <div class="card-title">Практические материалы</div>
                        <div class="card-desc">МРТ, кейсы, чек-листы</div>
                    </div>
                    <div class="card" onclick="openSection('events')">
                        <div class="card-icon">🗺️</div>
                        <div class="card-title">Карта мероприятий</div>
                        <div class="card-desc">Онлайн и офлайн события</div>
                    </div>
                    <div class="card" onclick="openSection('offers')">
                        <div class="card-icon">🔥</div>
                        <div class="card-title">Ограниченное предложение</div>
                        <div class="card-desc">Специальные условия</div>
                    </div>
                    <div class="card" onclick="openSection('support')">
                        <div class="card-icon">💬</div>
                        <div class="card-title">Поддержка</div>
                        <div class="card-desc">Помощь и консультации</div>
                    </div>
                </div>
            </div>

            <div class="news-section">
                <div class="section-header">
                    <h3>📰 Лента новостей</h3>
                    <div class="filters">
                        <button class="filter-btn active" data-filter="all">Все</button>
                        <button class="filter-btn" data-filter="articles">Статьи</button>
                        <button class="filter-btn" data-filter="development">Профессиональное развитие</button>
                        <button class="filter-btn" data-filter="skills">Практические навыки</button>
                        <button class="filter-btn" data-filter="physio">Физиотерапия</button>
                        <button class="filter-btn" data-filter="rehab">Реабилитация</button>
                    </div>
                </div>
                <div class="news-list" id="newsList">
                    <div class="loading">Загрузка новостей...</div>
                </div>
            </div>
        `
    },

    catalog: {
        title: 'Каталог контента',
        content: `
            <div class="catalog-header">
                <div class="catalog-filters">
                    <input type="text" placeholder="Поиск курсов и материалов..." class="search-input" id="catalogSearch">
                    <select class="filter-select" id="contentTypeFilter">
                        <option value="all">Все типы</option>
                        <option value="courses">Курсы</option>
                        <option value="podcasts">АНБ FM</option>
                        <option value="streams">Эфиры</option>
                        <option value="videos">Шпаргалки</option>
                        <option value="materials">Материалы</option>
                    </select>
                </div>
            </div>

            <div class="catalog-content">
                <div class="content-tabs">
                    <button class="content-tab active" data-tab="all">Все</button>
                    <button class="content-tab" data-tab="popular">Популярные</button>
                    <button class="content-tab" data-tab="new">Новинки</button>
                    <button class="content-tab" data-tab="free">Бесплатные</button>
                </div>

                <div class="content-grid" id="contentGrid">
                    <div class="loading">Загрузка контента...</div>
                </div>
            </div>
        `
    },

    community: {
        title: 'Сообщество',
        content: `
            <div class="community-header">
                <h2>👥 Сообщество Академии АНБ</h2>
                <p>Присоединяйтесь к профессиональному сообществу специалистов</p>
            </div>

            <div class="community-grid">
                <div class="community-card" onclick="openChat('general')">
                    <div class="community-icon">💬</div>
                    <div class="community-title">Флудилка</div>
                    <div class="community-desc">Неформальное общение и знакомство</div>
                    <div class="community-meta">1.2K участников</div>
                </div>
                <div class="community-card" onclick="openChat('specialists')">
                    <div class="community-icon">👥</div>
                    <div class="community-title">Чат специалистов</div>
                    <div class="community-desc">Профессиональные обсуждения</div>
                    <div class="community-meta">856 участников</div>
                </div>
                <div class="community-card" onclick="openSection('rules')">
                    <div class="community-icon">📜</div>
                    <div class="community-title">Правила сообщества</div>
                    <div class="community-desc">Основные принципы взаимодействия</div>
                </div>
                <div class="community-card" onclick="openSection('faq')">
                    <div class="community-icon">❓</div>
                    <div class="community-title">F.A.Q.</div>
                    <div class="community-desc">Ответы на частые вопросы</div>
                </div>
            </div>

            <div class="faq-section">
                <h3>❓ Частые вопросы</h3>
                <div class="faq-list" id="faqList">
                    <div class="loading">Загрузка FAQ...</div>
                </div>
            </div>
        `
    },

    favorites: {
        title: 'Мои материалы',
        content: `
            <div class="materials-tabs">
                <button class="material-tab active" data-tab="watch-later">📥 Посмотреть позже</button>
                <button class="material-tab" data-tab="favorites">⭐ Избранное</button>
                <button class="material-tab" data-tab="practice">📋 Практические материалы</button>
            </div>

            <div class="materials-content">
                <div class="material-section active" id="watch-later">
                    <h3>Материалы для просмотра</h3>
                    <div class="materials-list" id="watchLaterList">
                        <div class="loading">Загрузка отложенных материалов...</div>
                    </div>
                </div>

                <div class="material-section" id="favorites">
                    <h3>Избранные материалы</h3>
                    <div class="materials-list" id="favoritesList">
                        <div class="loading">Загрузка избранного...</div>
                    </div>
                </div>

                <div class="material-section" id="practice">
                    <h3>Практические материалы</h3>
                    <div class="practice-grid">
                        <div class="practice-card" onclick="openMaterials('mri')">
                            <div class="practice-icon">🩻</div>
                            <div class="practice-title">МРТ разборы</div>
                            <div class="practice-count" id="mriCount">0 материалов</div>
                        </div>
                        <div class="practice-card" onclick="openMaterials('cases')">
                            <div class="practice-icon">📋</div>
                            <div class="practice-title">Клинические случаи</div>
                            <div class="practice-count" id="casesCount">0 кейсов</div>
                        </div>
                        <div class="practice-card" onclick="openMaterials('checklists')">
                            <div class="practice-icon">✅</div>
                            <div class="practice-title">Чек-листы</div>
                            <div class="practice-count" id="checklistsCount">0 чек-листов</div>
                        </div>
                    </div>
                    <div class="materials-list" id="practiceMaterialsList">
                        <div class="loading">Загрузка практических материалов...</div>
                    </div>
                </div>
            </div>
        `
    },

    profile: {
        title: 'Личный кабинет',
        content: `
            <div class="profile-header">
                <div class="avatar-section">
                    <div class="avatar-large">👤</div>
                    <div class="profile-info">
                        <div class="profile-name" id="userName">Пользователь</div>
                        <div class="profile-status">Член Академии АНБ с <span id="joinDate">${new Date().toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}</span></div>
                        <div class="profile-badge" id="profileBadge">Активный участник эфиров и разборов</div>
                    </div>
                </div>
                
                <div class="subscription-info">
                    <div class="subscription-status" id="subscriptionStatus">
                        <div class="status-icon">❌</div>
                        <div class="status-text">Подписка: не активна</div>
                    </div>
                    <button class="btn btn-primary" onclick="changeSubscription()">Изменить подписку</button>
                </div>
            </div>

            <div class="journey-section">
                <h3>🎯 Мой путь развития</h3>
                <div class="journey-progress" id="journeyProgress">
                    <div class="loading">Загрузка прогресса...</div>
                </div>
            </div>

            <div class="profile-stats">
                <h3>📊 Моя активность</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-info">
                            <div class="stat-value" id="coursesCompleted">0</div>
                            <div class="stat-label">Пройдено курсов</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-info">
                            <div class="stat-value" id="materialsWatched">0</div>
                            <div class="stat-label">Просмотрено материалов</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-info">
                            <div class="stat-value" id="eventsAttended">0</div>
                            <div class="stat-label">Мероприятий посещено</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">💾</div>
                        <div class="stat-info">
                            <div class="stat-value" id="materialsSaved">0</div>
                            <div class="stat-label">Материалов сохранено</div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
};

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentPage = 'home';
let currentUser = null;
let allContent = {};
let userFavorites = {
    courses: [],
    podcasts: [],
    streams: [],
    videos: [],
    materials: [],
    watchLater: []
};

// ==================== ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ ====================
function renderPage(page) {
    currentPage = page;
    const pageData = pages[page];
    
    document.getElementById('mainContent').innerHTML = `
        <div class="page">
            <h2>${pageData.title}</h2>
            ${pageData.content}
        </div>
    `;

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
    });

    // Инициализация специфичных для страницы функций
    initializePage(page);

    console.log('✅ Страница:', page);
}

function initializePage(page) {
    switch (page) {
        case 'home':
            loadNews();
            initHomePage();
            break;
        case 'catalog':
            loadCatalogContent();
            break;
        case 'community':
            loadFAQ();
            initCommunityPage();
            break;
        case 'favorites':
            loadFavorites();
            initFavoritesPage();
            break;
        case 'profile':
            updateProfileStats();
            loadJourneyProgress();
            break;
    }
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadNews() {
    try {
        // Имитация загрузки новостей
        setTimeout(() => {
            const newsList = document.getElementById('newsList');
            newsList.innerHTML = `
                <div class="news-item">
                    <div class="news-category">Профессиональное развитие</div>
                    <div class="news-title">Новый курс: "Мануальные техники в практике"</div>
                    <div class="news-date">15 декабря 2024 • 6 модулей</div>
                    <div class="news-excerpt">Комплексный курс по современным мануальным методикам в неврологической практике. Изучите техники работы с пациентами с болевыми синдромами.</div>
                </div>
                <div class="news-item">
                    <div class="news-category">Вебинар</div>
                    <div class="news-title">Современные методы реабилитации пациентов с болевыми синдромами</div>
                    <div class="news-date">28 ноября 2024 • 19:00</div>
                    <div class="news-excerpt">Прямой эфир с Ильей Чистяковым - разбор клинических случаев и ответы на вопросы. Обсудим современные подходы к реабилитации.</div>
                </div>
                <div class="news-item">
                    <div class="news-category">Обновление</div>
                    <div class="news-title">Добавлены новые МРТ-разборы и клинические случаи</div>
                    <div class="news-date">20 ноября 2024</div>
                    <div class="news-excerpt">В разделе практических материалов появились новые кейсы по диагностике и лечению пациентов с неврологическими нарушениями.</div>
                </div>
            `;
        }, 1000);
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
    }
}

async function loadCatalogContent() {
    try {
        const response = await fetch('/api/content');
        const data = await response.json();
        
        if (data.success) {
            allContent = data.data;
            renderCatalogContent();
            initCatalogFilters();
        } else {
            throw new Error('Failed to load content');
        }
    } catch (error) {
        console.error('Ошибка загрузки контента:', error);
        document.getElementById('contentGrid').innerHTML = `
            <div class="error">
                <div class="error-icon">⚠️</div>
                <div class="error-text">Не удалось загрузить контент. Пожалуйста, попробуйте позже.</div>
                <button class="btn btn-primary" onclick="loadCatalogContent()">Повторить попытку</button>
            </div>
        `;
    }
}

async function loadFAQ() {
    try {
        // Имитация загрузки FAQ
        setTimeout(() => {
            const faqList = document.getElementById('faqList');
            faqList.innerHTML = `
                <div class="faq-item">
                    <div class="faq-question">Как оформить, продлить или отменить подписку?</div>
                    <div class="faq-answer">Подписку можно оформить или продлить в разделе «Личный кабинет». Там же доступна отмена — через кнопку «Изменить подписку».</div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">Что входит в подписку Академии?</div>
                    <div class="faq-answer">Доступ к эфирам, разборам (в том числе в записи), практическим материалам, видео-шпаргалкам на разные темы, а также к чату специалистов и интерактивной карте офлайн-мероприятий с предзаписью и голосованиями за новые темы.</div>
                </div>
                <div class="faq-item">
                    <div class="faq-question">Можно ли смотреть материалы без подписки?</div>
                    <div class="faq-answer">Да, часть контента доступна в пробном периоде для ознакомления. Полный доступ и участие в развитии открываются при активной подписке.</div>
                </div>
            `;
        }, 1000);
    } catch (error) {
        console.error('Ошибка загрузки FAQ:', error);
    }
}

async function loadFavorites() {
    try {
        // Загрузка избранного
        const watchLaterList = document.getElementById('watchLaterList');
        const favoritesList = document.getElementById('favoritesList');
        
        if (userFavorites.watchLater.length === 0) {
            watchLaterList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📥</div>
                    <div class="empty-text">Здесь будут материалы, которые вы отложили на потом</div>
                    <div class="empty-hint">Нажимайте "Посмотреть позже" на карточках контента</div>
                </div>
            `;
        } else {
            watchLaterList.innerHTML = userFavorites.watchLater.map(item => `
                <div class="material-item">
                    <div class="material-icon">${getContentIcon(item.type)}</div>
                    <div class="material-info">
                        <div class="material-title">${item.title}</div>
                        <div class="material-description">${item.description}</div>
                        <div class="material-date">Добавлено ${formatDate(item.addedAt)}</div>
                    </div>
                    <button class="btn btn-small" onclick="openContent('${item.type}', ${item.id})">Открыть</button>
                </div>
            `).join('');
        }

        if (userFavorites.courses.length === 0 && userFavorites.podcasts.length === 0 && 
            userFavorites.streams.length === 0 && userFavorites.videos.length === 0 && 
            userFavorites.materials.length === 0) {
            favoritesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⭐</div>
                    <div class="empty-text">Добавляйте материалы в избранное, нажимая на звездочку</div>
                    <div class="empty-hint">Ваши избранные материалы появятся здесь</div>
                </div>
            `;
        }

        // Загрузка практических материалов
        await loadPracticeMaterials();

    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
    }
}

async function loadPracticeMaterials() {
    try {
        const response = await fetch('/api/content/materials');
        const data = await response.json();
        
        if (data.success) {
            const materials = data.data;
            
            // Обновляем счетчики
            document.getElementById('mriCount').textContent = `${materials.filter(m => m.type === 'mri').length} материалов`;
            document.getElementById('casesCount').textContent = `${materials.filter(m => m.type === 'case').length} кейсов`;
            document.getElementById('checklistsCount').textContent = `${materials.filter(m => m.type === 'checklist').length} чек-листов`;
            
            // Показываем материалы
            const practiceList = document.getElementById('practiceMaterialsList');
            practiceList.innerHTML = materials.map(material => `
                <div class="material-item">
                    <div class="material-icon">${getContentIcon('materials')}</div>
                    <div class="material-info">
                        <div class="material-title">${material.title}</div>
                        <div class="material-description">${material.description}</div>
                        <div class="material-type">${getMaterialType(material.type)} • ${material.duration || ''}</div>
                    </div>
                    <div class="material-actions">
                        <button class="icon-btn" onclick="toggleFavorite('materials', ${material.id})">⭐</button>
                        <button class="btn btn-small" onclick="openContent('materials', ${material.id})">Открыть</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки практических материалов:', error);
    }
}

async function loadJourneyProgress() {
    try {
        if (!currentUser) return;
        
        const journeyProgress = document.getElementById('journeyProgress');
        const levels = [
            {
                level: 'Понимаю',
                title: 'Понимаю',
                description: 'Начинаю замечать закономерности и связи. Не просто слышу жалобы — вижу структуру боли.',
                progress: 100,
                total: 9,
                current: 9,
                hint: 'Чтобы перейти к следующему этапу — продолжайте участвовать в эфирах и сохраняйте всё, что откликается, в «Мои материалы».',
                active: true
            },
            {
                level: 'Связываю', 
                title: 'Связываю',
                description: 'Закономерности и связи складываются в единую картину. Боль приобретает смысл.',
                progress: 60,
                total: 25,
                current: 15,
                hint: 'Чтобы перейти к следующему этапу — участвуйте в разборах и ищите взаимосвязи между изученными материалами.',
                active: false
            },
            {
                level: 'Применяю',
                title: 'Применяю',
                description: 'При взгляде на единую картину - боль воспринимается как следствие. Работа направлена на устранение причины.',
                progress: 20,
                total: 23,
                current: 5,
                hint: 'Чтобы перейти к следующему этапу — выберите тему, в которой хотите углубиться, и пройдите обучение в Академии.',
                active: false
            }
        ];

        journeyProgress.innerHTML = levels.map(level => `
            <div class="journey-step ${level.active ? 'active' : ''}">
                <div class="step-marker">${levels.indexOf(level) + 1}</div>
                <div class="step-content">
                    <div class="step-title">${level.title}</div>
                    <div class="step-description">${level.description}</div>
                    <div class="step-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${level.progress}%"></div>
                        </div>
                        <div class="progress-text">${level.current} из ${level.total}</div>
                    </div>
                    ${level.hint ? `<div class="step-hint">${level.hint}</div>` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Ошибка загрузки прогресса:', error);
    }
}

// ==================== РЕНДЕРИНГ КОНТЕНТА ====================
function renderCatalogContent() {
    const contentGrid = document.getElementById('contentGrid');
    
    if (!allContent || Object.keys(allContent).length === 0) {
        contentGrid.innerHTML = '<div class="empty-state">Контент пока не добавлен</div>';
        return;
    }

    let allItems = [];
    Object.keys(allContent).forEach(type => {
        if (allContent[type] && Array.isArray(allContent[type])) {
            allContent[type].forEach(item => {
                item.contentType = type;
                allItems.push(item);
            });
        }
    });

    if (allItems.length === 0) {
        contentGrid.innerHTML = '<div class="empty-state">Контент пока не добавлен</div>';
        return;
    }

    contentGrid.innerHTML = allItems.map(item => `
        <div class="content-card" data-type="${item.contentType}">
            <div class="content-card-header">
                <div class="content-icon">${getContentIcon(item.contentType)}</div>
                <button class="favorite-btn ${isFavorite(item.contentType, item.id) ? 'active' : ''}" 
                        onclick="toggleFavorite('${item.contentType}', ${item.id})">
                    ${isFavorite(item.contentType, item.id) ? '★' : '☆'}
                </button>
            </div>
            <div class="content-card-body">
                <div class="content-title">${item.title}</div>
                <div class="content-description">${item.description || 'Описание отсутствует'}</div>
                <div class="content-meta">
                    ${item.duration ? `<span class="meta-item">⏱️ ${item.duration}</span>` : ''}
                    ${item.price ? `<span class="meta-item">💰 ${item.price} руб.</span>` : ''}
                    ${!item.price ? `<span class="meta-item free">🆓 Бесплатно</span>` : ''}
                    ${item.views ? `<span class="meta-item">👁️ ${item.views}</span>` : ''}
                </div>
            </div>
            <div class="content-card-actions">
                <button class="btn btn-outline" onclick="addToWatchLater('${item.contentType}', ${item.id})">📥 Позже</button>
                <button class="btn btn-small" onclick="openContent('${item.contentType}', ${item.id})">
                    ${getActionButtonText(item.contentType)}
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getContentIcon(contentType) {
    const icons = {
        'courses': '📚',
        'podcasts': '🎧',
        'streams': '📹',
        'videos': '🎯',
        'materials': '📋',
        'events': '🗺️'
    };
    return icons[contentType] || '📄';
}

function getActionButtonText(contentType) {
    const actions = {
        'courses': 'Записаться',
        'podcasts': 'Слушать',
        'streams': 'Смотреть',
        'videos': 'Смотреть',
        'materials': 'Открыть',
        'events': 'Участвовать'
    };
    return actions[contentType] || 'Открыть';
}

function getMaterialType(type) {
    const types = {
        'mri': 'МРТ разбор',
        'case': 'Клинический случай',
        'checklist': 'Чек-лист'
    };
    return types[type] || 'Материал';
}

function isFavorite(contentType, contentId) {
    return userFavorites[contentType]?.includes(contentId) || false;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU');
}

// ==================== ФУНКЦИОНАЛ ИЗБРАННОГО ====================
function toggleFavorite(contentType, contentId) {
    if (!currentUser) {
        showNotification('⚠️ Необходимо войти в систему');
        return;
    }

    if (!userFavorites[contentType]) {
        userFavorites[contentType] = [];
    }

    const index = userFavorites[contentType].indexOf(contentId);
    if (index > -1) {
        userFavorites[contentType].splice(index, 1);
        showNotification('❌ Удалено из избранного');
    } else {
        userFavorites[contentType].push(contentId);
        showNotification('⭐ Добавлено в избранное');
    }

    // Обновляем отображение если мы на странице каталога
    if (currentPage === 'catalog') {
        renderCatalogContent();
    }
}

function addToWatchLater(contentType, contentId) {
    if (!currentUser) {
        showNotification('⚠️ Необходимо войти в систему');
        return;
    }

    const content = allContent[contentType]?.find(item => item.id === contentId);
    if (content) {
        userFavorites.watchLater.push({
            ...content,
            type: contentType,
            addedAt: new Date()
        });
        showNotification('📥 Добавлено в "Посмотреть позже"');
    }
}

// ==================== ФУНКЦИИ ИНТЕРФЕЙСА ====================
function showNotification(message) {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #58b8e7;
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

function openContent(contentType, contentId) {
    if (!currentUser) {
        showNotification('⚠️ Необходимо войти в систему');
        return;
    }

    const content = allContent[contentType]?.find(item => item.id === contentId);
    if (!content) {
        showNotification('❌ Контент не найден');
        return;
    }

    // Показываем модальное окно с контентом
    const modalHTML = `
        <div class="modal" id="contentModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${content.title}</h3>
                    <button class="close-btn" onclick="closeModal('contentModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="content-preview">
                        <div class="preview-header">
                            <div class="content-icon-large">${getContentIcon(contentType)}</div>
                            <div class="preview-info">
                                <div class="preview-title">${content.title}</div>
                                <div class="preview-description">${content.description || ''}</div>
                                <div class="preview-meta">
                                    ${content.duration ? `<span>⏱️ ${content.duration}</span>` : ''}
                                    ${content.price ? `<span>💰 ${content.price} руб.</span>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="content-actions-full">
                            <button class="btn btn-primary" onclick="startContent('${contentType}', ${contentId})">
                                ${getActionButtonText(contentType)}
                            </button>
                            <button class="btn btn-outline" onclick="toggleFavorite('${contentType}', ${contentId})">
                                ${isFavorite(contentType, contentId) ? '★ В избранном' : '☆ В избранное'}
                            </button>
                        </div>
                        
                        ${content.fullDescription ? `
                            <div class="content-full-description">
                                <h4>Описание</h4>
                                <p>${content.fullDescription}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function startContent(contentType, contentId) {
    const actions = {
        'courses': '🎓 Начинаем курс...',
        'podcasts': '🎧 Запускаем подкаст...',
        'streams': '📹 Начинаем трансляцию...',
        'videos': '🎯 Воспроизводим видео...',
        'materials': '📄 Открываем материал...',
        'events': '🗺️ Переходим к мероприятию...'
    };
    
    showNotification(actions[contentType] || '🎯 Открываем контент...');
    closeModal('contentModal');
    
    // Обновляем прогресс пользователя
    if (currentUser) {
        currentUser.progress.steps.materialsWatched++;
        updateProfileStats();
    }
}

function changeSubscription() {
    if (!currentUser) return;
    
    const modalHTML = `
        <div class="modal" id="subscriptionModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💳 Управление подпиской</h3>
                    <button class="close-btn" onclick="closeModal('subscriptionModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="current-subscription">
                        <h4>Текущий статус</h4>
                        <div class="subscription-status-large ${currentUser.subscription.status}">
                            <div class="status-icon">${currentUser.subscription.status === 'active' ? '✅' : currentUser.subscription.status === 'trial' ? '🆓' : '❌'}</div>
                            <div class="status-info">
                                <div class="status-title">${getSubscriptionStatusText(currentUser.subscription.status)}</div>
                                ${currentUser.subscription.endDate ? `
                                    <div class="status-date">до ${new Date(currentUser.subscription.endDate).toLocaleDateString('ru-RU')}</div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="subscription-plans">
                        <h4>Доступные тарифы</h4>
                        <div class="plan-card">
                            <div class="plan-header">
                                <div class="plan-name">1 месяц</div>
                                <div class="plan-price">2 900 ₽</div>
                            </div>
                            <ul class="plan-features">
                                <li>✅ Полный доступ к курсам</li>
                                <li>✅ Участие в эфирах</li>
                                <li>✅ Практические материалы</li>
                                <li>✅ Чат специалистов</li>
                            </ul>
                            <button class="btn btn-primary" onclick="selectPlan(1)">Выбрать</button>
                        </div>
                        
                        <div class="plan-card popular">
                            <div class="plan-badge">Выгодно</div>
                            <div class="plan-header">
                                <div class="plan-name">3 месяца</div>
                                <div class="plan-price">7 500 ₽</div>
                                <div class="plan-save">Экономия 600 ₽</div>
                            </div>
                            <ul class="plan-features">
                                <li>✅ Полный доступ к курсам</li>
                                <li>✅ Участие в эфирах</li>
                                <li>✅ Практические материалы</li>
                                <li>✅ Чат специалистов</li>
                                <li>✅ Персональный сертификат</li>
                            </ul>
                            <button class="btn btn-primary" onclick="selectPlan(3)">Выбрать</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function getSubscriptionStatusText(status) {
    const statuses = {
        'active': 'Подписка активна',
        'trial': 'Пробный период',
        'inactive': 'Подписка не активна'
    };
    return statuses[status] || status;
}

function selectPlan(months) {
    showNotification(`🎉 Выбран тариф на ${months} месяца`);
    closeModal('subscriptionModal');
    
    // Обновляем статус подписки
    if (currentUser) {
        currentUser.subscription = {
            status: 'active',
            type: `plan_${months}_months`,
            endDate: new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
        };
        updateUIWithUserData();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            renderPage(this.dataset.page);
        });
    });

    // Загрузка пользователя
    loadUserData();

    // Интеграция с Telegram
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.ready();
        
        // Настройка интерфейса Telegram
        Telegram.WebApp.setHeaderColor('#58b8e7');
        Telegram.WebApp.setBackgroundColor('#ffffff');
    }

    renderPage('home');
    console.log('✅ WebApp загружен!');
});

// Остальные функции остаются без изменений...
// [Функции loadUserData, updateUIWithUserData, updateProfileStats и другие вспомогательные функции]

// ==================== ФУНКЦИИ ПОЛЬЗОВАТЕЛЯ ====================
async function loadUserData() {
    try {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser && tgUser.id) {
                const response = await fetch(`/api/user/${tgUser.id}`);
                const data = await response.json();
                
                if (data.success) {
                    currentUser = data.user;
                    updateUIWithUserData();
                    
                    // Показываем админ-панель если пользователь админ
                    if (currentUser.isAdmin) {
                        document.getElementById('adminBadge').style.display = 'block';
                    }
                }
            }
        }
    } catch (error) {
        console.log('ℹ️ Используем данные Telegram');
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser) {
                currentUser = {
                    firstName: tgUser.first_name || 'Пользователь',
                    subscription: { status: 'inactive' },
                    progress: { steps: {} },
                    isAdmin: tgUser.id === 898508164
                };
                updateUIWithUserData();
                
                if (currentUser.isAdmin) {
                    document.getElementById('adminBadge').style.display = 'block';
                }
            }
        }
    }
}

function updateUIWithUserData() {
    if (!currentUser) return;
    
    const userNameElement = document.getElementById('userName');
    const subscriptionStatusElement = document.getElementById('subscriptionStatus');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.firstName;
    }
    
    if (subscriptionStatusElement) {
        let statusHTML = '';
        
        if (currentUser.subscription.status === 'trial') {
            const endDate = currentUser.subscription.endDate ? 
                new Date(currentUser.subscription.endDate).toLocaleDateString('ru-RU') : 'неизвестно';
            statusHTML = `
                <div class="status-icon">🆓</div>
                <div class="status-text">
                    <div>Подписка: пробный период</div>
                    <div class="status-date">до ${endDate}</div>
                </div>
            `;
            subscriptionStatusElement.className = 'subscription-status trial';
        } else if (currentUser.subscription.status === 'active') {
            statusHTML = `
                <div class="status-icon">✅</div>
                <div class="status-text">Подписка: активна</div>
            `;
            subscriptionStatusElement.className = 'subscription-status active';
        } else {
            statusHTML = `
                <div class="status-icon">❌</div>
                <div class="status-text">Подписка: не активна</div>
            `;
            subscriptionStatusElement.className = 'subscription-status inactive';
        }
        
        subscriptionStatusElement.innerHTML = statusHTML;
    }
}

function updateProfileStats() {
    if (!currentUser) return;
    
    document.getElementById('coursesCompleted').textContent = currentUser.progress.steps.coursesBought || 0;
    document.getElementById('materialsWatched').textContent = currentUser.progress.steps.materialsWatched || 0;
    document.getElementById('eventsAttended').textContent = currentUser.progress.steps.eventsParticipated || 0;
    document.getElementById('materialsSaved').textContent = currentUser.progress.steps.materialsSaved || 0;
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function openSection(section) {
    const sections = {
        'courses': { title: '📚 Курсы', handler: openCourses },
        'fm': { title: '🎧 АНБ FM', handler: openPodcasts },
        'streams': { title: '📹 Эфиры и Разборы', handler: openStreams },
        'cheats': { title: '🎯 Видео-шпаргалки', handler: openVideos },
        'practice': { title: '📋 Практические материалы', handler: openPractice },
        'events': { title: '🗺️ Карта мероприятий', handler: openEvents },
        'offers': { title: '🔥 Ограниченное предложение', handler: openOffers },
        'support': { title: '💬 Поддержка', handler: openSupport }
    };
    
    const sectionData = sections[section];
    if (sectionData) {
        sectionData.handler();
    } else {
        alert(`🎯 Открываем раздел: ${section}`);
    }
}

function openCourses() {
    renderPage('catalog');
    // Можно добавить фильтрацию только курсов
}

function openPodcasts() {
    alert('🎧 Раздел АНБ FM - аудио подкасты и интервью');
}

function openStreams() {
    alert('📹 Раздел Эфиры и Разборы - прямые трансляции и разборы кейсов');
}

function openVideos() {
    alert('🎯 Раздел Видео-шпаргалки - короткие обучающие видео');
}

function openPractice() {
    alert('📋 Раздел Практические материалы - МРТ, кейсы, чек-листы');
}

function openEvents() {
    alert('🗺️ Карта мероприятий - онлайн и офлайн события');
}

function openOffers() {
    alert('🔥 Ограниченные предложения - специальные условия и акции');
}

function openSupport() {
    alert('💬 Поддержка - связь с координатором Академии');
}

function openChat(chatType) {
    if (!currentUser || currentUser.subscription.status === 'inactive') {
        alert('💬 Для доступа к чатам необходима активная подписка');
        return;
    }
    
    const chatNames = {
        'general': 'Флудилка',
        'specialists': 'Чат специалистов'
    };
    
    alert(`💬 Открываем чат: ${chatNames[chatType]}\n\nЧат будет доступен в ближайшем обновлении`);
}

function openMaterials(materialType) {
    const types = {
        'mri': 'МРТ разборы',
        'cases': 'Клинические случаи',
        'checklists': 'Чек-листы'
    };
    
    alert(`📋 Открываем: ${types[materialType]}\n\nРаздел в разработке`);
}

function openContent(contentType, contentId) {
    alert(`🎯 Открываем контент: ${contentType} ID: ${contentId}\n\nФункция будет реализована в следующем обновлении`);
}

function toggleFavorite(contentType, contentId) {
    if (!currentUser) {
        alert('⚠️ Необходимо войти в систему');
        return;
    }
    
    alert(`⭐ Добавлено в избранное: ${contentType} ID: ${contentId}`);
}

function changeSubscription() {
    if (!currentUser) return;
    
    const modalHTML = `
        <div class="modal" id="subscriptionModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💳 Управление подпиской</h3>
                    <button class="close-btn" onclick="closeModal('subscriptionModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="subscription-plans">
                        <div class="plan-card">
                            <div class="plan-header">
                                <div class="plan-name">1 месяц</div>
                                <div class="plan-price">2 900 ₽</div>
                            </div>
                            <ul class="plan-features">
                                <li>✅ Полный доступ к курсам</li>
                                <li>✅ Участие в эфирах</li>
                                <li>✅ Практические материалы</li>
                                <li>✅ Чат специалистов</li>
                            </ul>
                            <button class="btn btn-primary" onclick="selectPlan(1)">Выбрать</button>
                        </div>
                        
                        <div class="plan-card popular">
                            <div class="plan-badge">Выгодно</div>
                            <div class="plan-header">
                                <div class="plan-name">3 месяца</div>
                                <div class="plan-price">7 500 ₽</div>
                                <div class="plan-save">Экономия 600 ₽</div>
                            </div>
                            <ul class="plan-features">
                                <li>✅ Полный доступ к курсам</li>
                                <li>✅ Участие в эфирах</li>
                                <li>✅ Практические материалы</li>
                                <li>✅ Чат специалистов</li>
                                <li>✅ Персональный сертификат</li>
                            </ul>
                            <button class="btn btn-primary" onclick="selectPlan(3)">Выбрать</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('subscriptionModal').style.display = 'block';
}

function selectPlan(months) {
    alert(`🎉 Выбран тариф на ${months} месяца\n\nИнтеграция с платежной системой будет реализована в следующем обновлении`);
    closeModal('subscriptionModal');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

function toggleSearch() {
    const searchContainer = document.getElementById('searchContainer');
    searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
    
    if (searchContainer.style.display === 'block') {
        document.getElementById('searchInput').focus();
    }
}

function goToAdminPanel() {
    window.location.href = '/admin';
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            renderPage(this.dataset.page);
        });
    });

    // Инициализация поиска
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
    }

    // Загрузка пользователя
    loadUserData();

    // Интеграция с Telegram
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.ready();
        
        // Настройка интерфейса Telegram
        Telegram.WebApp.setHeaderColor('#58b8e7');
        Telegram.WebApp.setBackgroundColor('#ffffff');
    }

    renderPage('home');
    console.log('✅ WebApp загружен!');
});

function performSearch(query) {
    if (query.trim()) {
        alert(`🔍 Поиск: "${query}"\n\nРезультаты поиска будут отображены в каталоге`);
        renderPage('catalog');
        
        // Устанавливаем значение поиска в каталоге
        setTimeout(() => {
            const catalogSearch = document.getElementById('catalogSearch');
            if (catalogSearch) {
                catalogSearch.value = query;
                filterCatalogContent();
            }
        }, 100);
    }
}
