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
                <div class="news-list">
                    <div class="news-item">
                        <div class="news-category">Профессиональное развитие</div>
                        <div class="news-title">Новый курс: "Мануальные техники в практике"</div>
                        <div class="news-date">15 декабря 2024 • 6 модулей</div>
                        <div class="news-excerpt">Комплексный курс по современным мануальным методикам в неврологической практике</div>
                    </div>
                    <div class="news-item">
                        <div class="news-category">Вебинар</div>
                        <div class="news-title">Современные методы реабилитации пациентов с болевыми синдромами</div>
                        <div class="news-date">28 ноября 2024 • 19:00</div>
                        <div class="news-excerpt">Прямой эфир с Ильей Чистяковым - разбор клинических случаев и ответы на вопросы</div>
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
                        <div class="faq-question">Как оформить, продлить или отменить подписку?</div>
                        <div class="faq-answer">Подписку можно оформить или продлить в разделе «Личный кабинет». Там же доступна отмена — через кнопку «Изменить подписку».</div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">Что входит в подписку Академии?</div>
                        <div class="faq-answer">Доступ к эфирам, разборам (в том числе в записи), практическим материалам, видео-шпаргалкам на разные темы, а также к чату специалистов и интерактивной карте офлайн-мероприятий с предзаписью и голосованиями за новые темы.</div>
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
                        <div class="empty-state">
                            <div class="empty-icon">📥</div>
                            <div class="empty-text">Здесь будут материалы, которые вы отложили на потом</div>
                        </div>
                    </div>
                </div>

                <div class="material-section" id="favorites">
                    <h3>Избранные материалы</h3>
                    <div class="materials-list" id="favoritesList">
                        <div class="empty-state">
                            <div class="empty-icon">⭐</div>
                            <div class="empty-text">Добавляйте материалы в избранное, нажимая на звездочку</div>
                        </div>
                    </div>
                </div>

                <div class="material-section" id="practice">
                    <h3>Практические материалы</h3>
                    <div class="practice-grid">
                        <div class="practice-card" onclick="openMaterials('mri')">
                            <div class="practice-icon">🩻</div>
                            <div class="practice-title">МРТ разборы</div>
                            <div class="practice-count">24 материала</div>
                        </div>
                        <div class="practice-card" onclick="openMaterials('cases')">
                            <div class="practice-icon">📋</div>
                            <div class="practice-title">Клинические случаи</div>
                            <div class="practice-count">18 кейсов</div>
                        </div>
                        <div class="practice-card" onclick="openMaterials('checklists')">
                            <div class="practice-icon">✅</div>
                            <div class="practice-title">Чек-листы</div>
                            <div class="practice-count">12 чек-листов</div>
                        </div>
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
                <div class="journey-progress">
                    <div class="journey-step active">
                        <div class="step-marker">1</div>
                        <div class="step-content">
                            <div class="step-title">Понимаю</div>
                            <div class="step-description">Начинаю замечать закономерности и связи. Не просто слышу жалобы — вижу структуру боли.</div>
                            <div class="step-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 100%"></div>
                                </div>
                                <div class="progress-text">9 из 9</div>
                            </div>
                            <div class="step-hint">Чтобы перейти к следующему этапу — продолжайте участвовать в эфирах и сохраняйте всё, что откликается, в «Мои материалы».</div>
                        </div>
                    </div>

                    <div class="journey-step">
                        <div class="step-marker">2</div>
                        <div class="step-content">
                            <div class="step-title">Связываю</div>
                            <div class="step-description">Закономерности и связи складываются в единую картину. Боль приобретает смысл.</div>
                            <div class="step-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 60%"></div>
                                </div>
                                <div class="progress-text">15 из 25</div>
                            </div>
                            <div class="step-hint">Чтобы перейти к следующему этапу — участвуйте в разборах и ищите взаимосвязи между изученными материалами.</div>
                        </div>
                    </div>

                    <div class="journey-step">
                        <div class="step-marker">3</div>
                        <div class="step-content">
                            <div class="step-title">Применяю</div>
                            <div class="step-description">При взгляде на единую картину - боль воспринимается как следствие. Работа направлена на устранение причины.</div>
                            <div class="step-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 20%"></div>
                                </div>
                                <div class="progress-text">5 из 23</div>
                            </div>
                        </div>
                    </div>
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

    // Инициализация специфичных для страницы функций
    initializePage(page);

    console.log('✅ Страница:', page);
}

function initializePage(page) {
    switch (page) {
        case 'home':
            initHomePage();
            break;
        case 'catalog':
            loadCatalogContent();
            break;
        case 'community':
            initCommunityPage();
            break;
        case 'favorites':
            initFavoritesPage();
            break;
        case 'profile':
            updateProfileStats();
            break;
    }
}

function initHomePage() {
    // Инициализация фильтров новостей
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterNews(this.dataset.filter);
        });
    });
}

function initCommunityPage() {
    // Инициализация FAQ
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
        });
    });
}

function initFavoritesPage() {
    // Инициализация вкладок материалов
    document.querySelectorAll('.material-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Обновляем активные вкладки
            document.querySelectorAll('.material-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем соответствующий контент
            document.querySelectorAll('.material-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
            
            // Загружаем данные для вкладки
            if (tabId === 'watch-later') loadWatchLater();
            if (tabId === 'favorites') loadFavorites();
        });
    });
}

// ==================== ФУНКЦИИ КОНТЕНТА ====================
async function loadCatalogContent() {
    try {
        const response = await fetch('/api/content');
        const data = await response.json();
        
        if (data.success) {
            allContent = data.data;
            renderCatalogContent();
            initCatalogFilters();
        }
    } catch (error) {
        console.error('Ошибка загрузки контента:', error);
        document.getElementById('contentGrid').innerHTML = '<div class="error">Ошибка загрузки контента</div>';
    }
}

function renderCatalogContent() {
    const contentGrid = document.getElementById('contentGrid');
    let allItems = [];

    // Собираем все элементы контента
    Object.keys(allContent).forEach(type => {
        allContent[type].forEach(item => {
            item.contentType = type;
            allItems.push(item);
        });
    });

    if (allItems.length === 0) {
        contentGrid.innerHTML = '<div class="empty-state">Контент пока не добавлен</div>';
        return;
    }

    contentGrid.innerHTML = allItems.map(item => `
        <div class="content-card" data-type="${item.contentType}">
            <div class="content-card-header">
                <div class="content-icon">${getContentIcon(item.contentType)}</div>
                <button class="favorite-btn" onclick="toggleFavorite('${item.contentType}', ${item.id})">☆</button>
            </div>
            <div class="content-card-body">
                <div class="content-title">${item.title}</div>
                <div class="content-description">${item.description || ''}</div>
                <div class="content-meta">
                    ${item.duration ? `<span class="meta-item">⏱️ ${item.duration}</span>` : ''}
                    ${item.price ? `<span class="meta-item">💰 ${item.price} руб.</span>` : ''}
                    ${!item.price ? `<span class="meta-item free">🆓 Бесплатно</span>` : ''}
                </div>
            </div>
            <div class="content-card-actions">
                <button class="btn btn-small" onclick="openContent('${item.contentType}', ${item.id})">
                    ${getActionButtonText(item.contentType)}
                </button>
            </div>
        </div>
    `).join('');
}

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

function initCatalogFilters() {
    const searchInput = document.getElementById('catalogSearch');
    const typeFilter = document.getElementById('contentTypeFilter');
    const contentTabs = document.querySelectorAll('.content-tab');

    // Поиск
    searchInput.addEventListener('input', function() {
        filterCatalogContent();
    });

    // Фильтр по типу
    typeFilter.addEventListener('change', function() {
        filterCatalogContent();
    });

    // Вкладки
    contentTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            contentTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterCatalogContent();
        });
    });
}

function filterCatalogContent() {
    const searchTerm = document.getElementById('catalogSearch').value.toLowerCase();
    const contentType = document.getElementById('contentTypeFilter').value;
    const activeTab = document.querySelector('.content-tab.active').dataset.tab;

    document.querySelectorAll('.content-card').forEach(card => {
        const title = card.querySelector('.content-title').textContent.toLowerCase();
        const description = card.querySelector('.content-description').textContent.toLowerCase();
        const cardType = card.dataset.type;

        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesType = contentType === 'all' || cardType === contentType;
        const matchesTab = filterByTab(card, activeTab);

        card.style.display = matchesSearch && matchesType && matchesTab ? 'block' : 'none';
    });
}

function filterByTab(card, tab) {
    // Здесь можно добавить логику фильтрации по вкладкам
    // Например, популярные, новинки, бесплатные
    return true; // Временная реализация
}

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
