// webapp/app.js
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
                    </div>
                </div>
                <div class="news-list" id="newsList">
                    <div class="news-item">
                        <div class="news-category">Профессиональное развитие</div>
                        <div class="news-title">Новый курс: "Мануальные техники в практике"</div>
                        <div class="news-date">15 декабря 2024 • 6 модулей</div>
                        <div class="news-excerpt">Комплексный курс по современным мануальным методикам в неврологической практике.</div>
                    </div>
                    <div class="news-item">
                        <div class="news-category">Вебинар</div>
                        <div class="news-title">Современные методы реабилитации пациентов с болевыми синдромами</div>
                        <div class="news-date">28 ноября 2024 • 19:00</div>
                        <div class="news-excerpt">Прямой эфир с Ильей Чистяковым - разбор клинических случаев и ответы на вопросы.</div>
                    </div>
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
                <div class="faq-list">
                    <div class="faq-item">
                        <div class="faq-question" onclick="toggleFAQ(this)">Как оформить подписку?</div>
                        <div class="faq-answer">Подписку можно оформить в разделе «Личный кабинет» через кнопку «Изменить подписку».</div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question" onclick="toggleFAQ(this)">Что входит в подписку?</div>
                        <div class="faq-answer">Доступ к эфирам, разборам, практическим материалам, видео-шпаргалкам и чату специалистов.</div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question" onclick="toggleFAQ(this)">Можно ли смотреть материалы без подписки?</div>
                        <div class="faq-answer">Да, часть контента доступна в пробном периоде для ознакомления.</div>
                    </div>
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
                            <div class="practice-count">2 материалов</div>
                        </div>
                        <div class="practice-card" onclick="openMaterials('cases')">
                            <div class="practice-icon">📋</div>
                            <div class="practice-title">Клинические случаи</div>
                            <div class="practice-count">3 кейсов</div>
                        </div>
                        <div class="practice-card" onclick="openMaterials('checklists')">
                            <div class="practice-icon">✅</div>
                            <div class="practice-title">Чек-листы</div>
                            <div class="practice-count">5 чек-листов</div>
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
                        <div class="profile-badge">Активный участник эфиров и разборов</div>
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

    initializePage(page);
}

function initializePage(page) {
    switch (page) {
        case 'home':
            initHomePage();
            break;
        case 'catalog':
            loadCatalogContent();
            initCatalogFilters();
            break;
        case 'community':
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
                    
                    if (currentUser.isAdmin) {
                        document.getElementById('adminBadge').style.display = 'block';
                    }
                }
            }
        }
    } catch (error) {
        console.log('ℹ️ Используем демо-данные');
        currentUser = {
            id: 1,
            firstName: 'Демо Пользователь',
            specialization: 'Невролог',
            city: 'Москва',
            subscription: { 
                status: 'trial', 
                type: 'trial_7days',
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            },
            progress: { 
                level: 'Понимаю', 
                steps: {
                    materialsWatched: 5,
                    eventsParticipated: 3,
                    materialsSaved: 7,
                    coursesBought: 1
                }
            },
            favorites: { 
                courses: [1], 
                podcasts: [], 
                streams: [], 
                videos: [], 
                materials: [1], 
                watchLater: [2] 
            },
            isAdmin: false,
            joinedAt: new Date('2024-01-01')
        };
        updateUIWithUserData();
    }
}

async function loadCatalogContent() {
    try {
        const response = await fetch('/api/content');
        const data = await response.json();
        
        if (data.success) {
            allContent = data.data;
            renderCatalogContent();
        } else {
            throw new Error('Failed to load content');
        }
    } catch (error) {
        console.error('Ошибка загрузки контента:', error);
        // Демо-контент
        allContent = {
            courses: [
                { 
                    id: 1, 
                    title: "Мануальные техники в практике", 
                    description: "6 модулей по современным мануальным методикам", 
                    fullDescription: "Комплексный курс, охватывающий основные мануальные техники, применяемые в неврологической практике.",
                    price: 15000, 
                    duration: "12 часов", 
                    modules: 6,
                    contentType: "courses",
                    created: new Date('2024-01-15')
                },
                { 
                    id: 2, 
                    title: "Неврология для практикующих врачей", 
                    description: "Основы неврологической диагностики и лечения", 
                    price: 12000, 
                    duration: "10 часов", 
                    modules: 5,
                    contentType: "courses",
                    created: new Date('2024-01-20')
                }
            ],
            podcasts: [
                { 
                    id: 1, 
                    title: "АНБ FM: Основы неврологии", 
                    description: "Подкаст о современных подходах в неврологии", 
                    duration: "45:20", 
                    contentType: "podcasts",
                    created: new Date('2024-01-10')
                }
            ],
            streams: [
                { 
                    id: 1, 
                    title: "Разбор клинического случая: боль в пояснице", 
                    description: "Подробный разбор с Ильей Чистяковым", 
                    duration: "1:15:30", 
                    contentType: "streams",
                    created: new Date('2024-01-18')
                }
            ],
            videos: [
                { 
                    id: 1, 
                    title: "Техника миофасциального релиза", 
                    description: "Короткая видео-шпаргалка по технике МФР", 
                    duration: "08:15", 
                    contentType: "videos",
                    created: new Date('2024-01-05')
                }
            ],
            materials: [
                { 
                    id: 1, 
                    title: "МРТ разбор: грыжа позвоночника L4-L5", 
                    description: "Детальный анализ МРТ снимков пациента с грыжей", 
                    type: "mri", 
                    contentType: "materials",
                    created: new Date('2024-01-08')
                },
                { 
                    id: 2, 
                    title: "Клинический случай: мигрень", 
                    description: "Разбор диагностики и лечения пациента с мигренью", 
                    type: "case", 
                    contentType: "materials",
                    created: new Date('2024-01-12')
                }
            ],
            events: [
                { 
                    id: 1, 
                    title: "Онлайн-вебинар по современной реабилитации", 
                    description: "Современные методы восстановительного лечения", 
                    type: "online", 
                    contentType: "events",
                    created: new Date('2024-01-12')
                }
            ]
        };
        renderCatalogContent();
    }
}

async function loadFavorites() {
    if (!currentUser) return;
    
    const watchLaterList = document.getElementById('watchLaterList');
    const favoritesList = document.getElementById('favoritesList');
    
    // Загрузка "Посмотреть позже"
    if (currentUser.favorites.watchLater.length === 0) {
        watchLaterList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📥</div>
                <div class="empty-text">Здесь будут материалы, которые вы отложили на потом</div>
                <div class="empty-hint">Нажимайте "Посмотреть позже" на карточках контента</div>
            </div>
        `;
    } else {
        const watchLaterItems = currentUser.favorites.watchLater.map(id => {
            for (const type in allContent) {
                const item = allContent[type].find(item => item.id === id);
                if (item) return { ...item, contentType: type };
            }
            return null;
        }).filter(item => item);
        
        watchLaterList.innerHTML = watchLaterItems.map(item => `
            <div class="material-item">
                <div class="material-icon">${getContentIcon(item.contentType)}</div>
                <div class="material-info">
                    <div class="material-title">${item.title}</div>
                    <div class="material-description">${item.description}</div>
                    <div class="material-date">Добавлено ${formatDate(item.created)}</div>
                </div>
                <div class="material-actions">
                    <button class="btn btn-small" onclick="openContent('${item.contentType}', ${item.id})">Открыть</button>
                    <button class="icon-btn" onclick="removeFromWatchLater(${item.id})">❌</button>
                </div>
            </div>
        `).join('');
    }
    
    // Загрузка избранного
    const allFavorites = [];
    for (const type in currentUser.favorites) {
        if (type !== 'watchLater') {
            currentUser.favorites[type].forEach(id => {
                for (const contentType in allContent) {
                    const item = allContent[contentType].find(item => item.id === id);
                    if (item) {
                        allFavorites.push({ ...item, contentType });
                    }
                }
            });
        }
    }
    
    if (allFavorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⭐</div>
                <div class="empty-text">Добавляйте материалы в избранное, нажимая на звездочку</div>
                <div class="empty-hint">Ваши избранные материалы появятся здесь</div>
            </div>
        `;
    } else {
        favoritesList.innerHTML = allFavorites.map(item => `
            <div class="material-item">
                <div class="material-icon">${getContentIcon(item.contentType)}</div>
                <div class="material-info">
                    <div class="material-title">${item.title}</div>
                    <div class="material-description">${item.description}</div>
                    <div class="material-type">${getContentTypeName(item.contentType)}</div>
                </div>
                <div class="material-actions">
                    <button class="icon-btn active" onclick="toggleFavorite('${item.contentType}', ${item.id})">★</button>
                    <button class="btn btn-small" onclick="openContent('${item.contentType}', ${item.id})">Открыть</button>
                </div>
            </div>
        `).join('');
    }
    
    // Загрузка практических материалов
    await loadPracticeMaterials();
}

async function loadPracticeMaterials() {
    const practiceList = document.getElementById('practiceMaterialsList');
    const materials = allContent.materials || [];
    
    if (materials.length === 0) {
        practiceList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-text">Практические материалы появятся здесь</div>
            </div>
        `;
        return;
    }
    
    practiceList.innerHTML = materials.map(material => `
        <div class="material-item">
            <div class="material-icon">${getContentIcon('materials')}</div>
            <div class="material-info">
                <div class="material-title">${material.title}</div>
                <div class="material-description">${material.description}</div>
                <div class="material-type">${getMaterialType(material.type)} • ${material.duration || ''}</div>
            </div>
            <div class="material-actions">
                <button class="icon-btn ${isFavorite('materials', material.id) ? 'active' : ''}" 
                        onclick="toggleFavorite('materials', ${material.id})">
                    ${isFavorite('materials', material.id) ? '★' : '☆'}
                </button>
                <button class="btn btn-small" onclick="openContent('materials', ${material.id})">Открыть</button>
            </div>
        </div>
    `).join('');
}

function loadJourneyProgress() {
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
        },
        {
            level: 'Систематизирую',
            title: 'Систематизирую',
            description: 'Знания становятся инструментом, а не набором методик.',
            progress: 0,
            total: 13,
            current: 0,
            hint: 'Продолжайте обучение и участвуйте в разборах как приглашенный гость.',
            active: false
        },
        {
            level: 'Делюсь',
            title: 'Делюсь',
            description: 'Опыт становится вкладом. Появляется желание обсуждать, помогать и развивать других.',
            progress: 0,
            total: 7,
            current: 0,
            hint: 'Публикуйте собственные клинические кейсы и участвуйте в закрытых мероприятиях.',
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
                    ${!item.price && item.contentType !== 'courses' ? `<span class="meta-item free">🆓 Бесплатно</span>` : ''}
                    ${item.modules ? `<span class="meta-item">📚 ${item.modules} модулей</span>` : ''}
                </div>
            </div>
            <div class="content-card-actions">
                <button class="btn btn-outline" onclick="addToWatchLater('${item.contentType}', ${item.id})">📥 Позже</button>
                <button class="btn btn-primary" onclick="openContent('${item.contentType}', ${item.id})">
                    ${getActionButtonText(item.contentType)}
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== ФУНКЦИОНАЛ ИЗБРАННОГО ====================
async function toggleFavorite(contentType, contentId) {
    if (!currentUser) {
        showNotification('⚠️ Необходимо войти в систему');
        return;
    }

    const isCurrentlyFavorite = isFavorite(contentType, contentId);
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contentType,
                contentId,
                action: isCurrentlyFavorite ? 'remove' : 'add'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser.favorites = data.favorites;
            showNotification(isCurrentlyFavorite ? '❌ Удалено из избранного' : '⭐ Добавлено в избранное');
            
            // Обновляем отображение
            if (currentPage === 'catalog') {
                renderCatalogContent();
            } else if (currentPage === 'favorites') {
                loadFavorites();
            }
        }
    } catch (error) {
        // Локальное обновление при ошибке
        if (isCurrentlyFavorite) {
            currentUser.favorites[contentType] = currentUser.favorites[contentType].filter(id => id !== contentId);
            showNotification('❌ Удалено из избранного');
        } else {
            if (!currentUser.favorites[contentType].includes(contentId)) {
                currentUser.favorites[contentType].push(contentId);
            }
            showNotification('⭐ Добавлено в избранное');
        }
        
        if (currentPage === 'catalog') {
            renderCatalogContent();
        } else if (currentPage === 'favorites') {
            loadFavorites();
        }
    }
}

function addToWatchLater(contentType, contentId) {
    if (!currentUser) {
        showNotification('⚠️ Необходимо войти в систему');
        return;
    }

    const content = allContent[contentType]?.find(item => item.id === contentId);
    if (content && !currentUser.favorites.watchLater.includes(contentId)) {
        currentUser.favorites.watchLater.push(contentId);
        showNotification('📥 Добавлено в "Посмотреть позже"');
        
        if (currentPage === 'favorites') {
            loadFavorites();
        }
    } else {
        showNotification('✅ Уже в списке "Посмотреть позже"');
    }
}

function removeFromWatchLater(contentId) {
    if (!currentUser) return;
    
    currentUser.favorites.watchLater = currentUser.favorites.watchLater.filter(id => id !== contentId);
    showNotification('❌ Удалено из "Посмотреть позже"');
    loadFavorites();
}

// ==================== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ====================
function updateUIWithUserData() {
    if (!currentUser) return;
    
    const userNameElement = document.getElementById('userName');
    const subscriptionStatusElement = document.getElementById('subscriptionStatus');
    const joinDateElement = document.getElementById('joinDate');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.firstName;
    }
    
    if (joinDateElement && currentUser.joinedAt) {
        joinDateElement.textContent = new Date(currentUser.joinedAt).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'});
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
            const endDate = currentUser.subscription.endDate ? 
                new Date(currentUser.subscription.endDate).toLocaleDateString('ru-RU') : 'неизвестно';
            statusHTML = `
                <div class="status-icon">✅</div>
                <div class="status-text">
                    <div>Подписка: активна</div>
                    <div class="status-date">до ${endDate}</div>
                </div>
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

function getContentTypeName(type) {
    const names = {
        'courses': 'Курс',
        'podcasts': 'Подкаст',
        'streams': 'Эфир',
        'videos': 'Видео-шпаргалка',
        'materials': 'Материал',
        'events': 'Мероприятие'
    };
    return names[type] || type;
}

function isFavorite(contentType, contentId) {
    return currentUser && currentUser.favorites && currentUser.favorites[contentType].includes(contentId);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU');
}

function showNotification(message) {
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

// ==================== ФУНКЦИИ ИНТЕРФЕЙСА ====================
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
                                    ${content.modules ? `<span>📚 ${content.modules} модулей</span>` : ''}
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
                            <button class="btn btn-outline" onclick="addToWatchLater('${contentType}', ${contentId})">
                                📥 Посмотреть позже
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
                            <button class="btn btn-primary" onclick="selectPlan('1_month')">Выбрать</button>
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
                            <button class="btn btn-primary" onclick="selectPlan('3_months')">Выбрать</button>
                        </div>

                        <div class="plan-card">
                            <div class="plan-header">
                                <div class="plan-name">12 месяцев</div>
                                <div class="plan-price">24 000 ₽</div>
                                <div class="plan-save">Экономия 10 800 ₽</div>
                            </div>
                            <ul class="plan-features">
                                <li>✅ Полный доступ к курсам</li>
                                <li>✅ Участие в эфирах</li>
                                <li>✅ Практические материалы</li>
                                <li>✅ Чат специалистов</li>
                                <li>✅ Доступ к закрытым мероприятиям</li>
                                <li>✅ Индивидуальные консультации</li>
                            </ul>
                            <button class="btn btn-primary" onclick="selectPlan('12_months')">Выбрать</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function selectPlan(plan) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser.subscription = data.subscription;
            showNotification('🎉 Подписка успешно оформлена!');
            closeModal('subscriptionModal');
            updateUIWithUserData();
        } else {
            throw new Error('Ошибка оформления подписки');
        }
    } catch (error) {
        // Демо-режим
        const plans = {
            '1_month': { months: 1, price: 2900 },
            '3_months': { months: 3, price: 7500 },
            '12_months': { months: 12, price: 24000 }
        };
        
        const selectedPlan = plans[plan];
        if (selectedPlan) {
            currentUser.subscription = {
                status: 'active',
                type: plan,
                endDate: new Date(Date.now() + selectedPlan.months * 30 * 24 * 60 * 60 * 1000)
            };
            showNotification('🎉 Подписка успешно оформлена!');
            closeModal('subscriptionModal');
            updateUIWithUserData();
        }
    }
}

function getSubscriptionStatusText(status) {
    const statuses = {
        'active': 'Подписка активна',
        'trial': 'Пробный период',
        'inactive': 'Подписка не активна'
    };
    return statuses[status] || status;
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ СТРАНИЦ ====================
function initHomePage() {
    // Инициализация фильтров новостей
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Здесь можно добавить фильтрацию новостей
        });
    });
}

function initCatalogFilters() {
    const searchInput = document.getElementById('catalogSearch');
    const typeFilter = document.getElementById('contentTypeFilter');
    const contentTabs = document.querySelectorAll('.content-tab');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterCatalogContent();
        });
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            filterCatalogContent();
        });
    }
    
    contentTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            contentTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterCatalogContent();
        });
    });
}

function filterCatalogContent() {
    const searchTerm = document.getElementById('catalogSearch')?.value.toLowerCase() || '';
    const contentType = document.getElementById('contentTypeFilter')?.value || 'all';
    const activeTab = document.querySelector('.content-tab.active')?.dataset.tab || 'all';
    
    const cards = document.querySelectorAll('.content-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.content-title').textContent.toLowerCase();
        const description = card.querySelector('.content-description').textContent.toLowerCase();
        const cardType = card.dataset.type;
        
        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesType = contentType === 'all' || cardType === contentType;
        const matchesTab = activeTab === 'all' || 
                          (activeTab === 'free' && !card.querySelector('.meta-item:contains("руб.")')) ||
                          (activeTab === 'new' && cardType === 'courses') ||
                          (activeTab === 'popular' && cardType === 'streams');
        
        card.style.display = matchesSearch && matchesType && matchesTab ? 'block' : 'none';
    });
}

function initCommunityPage() {
    // Инициализация FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFAQ(this);
        });
    });
}

function initFavoritesPage() {
    const materialTabs = document.querySelectorAll('.material-tab');
    
    materialTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Обновляем активные табы
            materialTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем соответствующий раздел
            document.querySelectorAll('.material-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');
        });
    });
}

function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const isVisible = answer.style.display === 'block';
    
    // Скрываем все ответы
    document.querySelectorAll('.faq-answer').forEach(ans => {
        ans.style.display = 'none';
    });
    
    // Показываем/скрываем текущий ответ
    answer.style.display = isVisible ? 'none' : 'block';
}

// ==================== ФУНКЦИИ НАВИГАЦИИ ====================
function openSection(section) {
    const sections = {
        'courses': () => { renderPage('catalog'); },
        'fm': () => { showNotification('🎧 Раздел АНБ FM - аудио подкасты и интервью'); },
        'streams': () => { showNotification('📹 Раздел Эфиры и Разборы - прямые трансляции и разборы кейсов'); },
        'cheats': () => { showNotification('🎯 Раздел Видео-шпаргалки - короткие обучающие видео'); },
        'practice': () => { renderPage('favorites'); document.querySelector('[data-tab="practice"]').click(); },
        'events': () => { showNotification('🗺️ Карта мероприятий - онлайн и офлайн события'); },
        'offers': () => { showNotification('🔥 Ограниченные предложения - специальные условия и акции'); },
        'support': () => { showNotification('💬 Поддержка - связь с координатором Академии'); },
        'rules': () => { showNotification('📜 Правила сообщества - основные принципы взаимодействия'); },
        'faq': () => { showNotification('❓ F.A.Q. - ответы на частые вопросы'); }
    };
    
    if (sections[section]) {
        sections[section]();
    }
}

function openChat(chatType) {
    if (!currentUser || currentUser.subscription.status === 'inactive') {
        showNotification('💬 Для доступа к чатам необходима активная подписка');
        return;
    }
    
    const chatNames = {
        'general': 'Флудилка',
        'specialists': 'Чат специалистов'
    };
    
    showNotification(`💬 Открываем чат: ${chatNames[chatType]}`);
}

function openMaterials(materialType) {
    const types = {
        'mri': 'МРТ разборы',
        'cases': 'Клинические случаи',
        'checklists': 'Чек-листы'
    };
    
    showNotification(`📋 Открываем: ${types[materialType]}`);
    // Автоматически переключаем на вкладку практических материалов
    if (currentPage === 'favorites') {
        document.querySelector('[data-tab="practice"]').click();
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
    window.location.href = '/admin.html';
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ====================
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
        Telegram.WebApp.setHeaderColor('#58b8e7');
        Telegram.WebApp.setBackgroundColor('#ffffff');
    }

    renderPage('home');
});

function performSearch(query) {
    if (query.trim()) {
        showNotification(`🔍 Поиск: "${query}"`);
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
