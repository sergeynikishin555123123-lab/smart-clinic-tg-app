// webapp/app.js - ПОЛНАЯ ВЕРСИЯ БЕЗ ЗАГЛУШЕК
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
                    <div class="card" onclick="openSection('podcasts')">
                        <div class="card-icon">🎧</div>
                        <div class="card-title">АНБ FM</div>
                        <div class="card-desc">Аудио-подкасты и интервью</div>
                    </div>
                    <div class="card" onclick="openSection('streams')">
                        <div class="card-icon">📹</div>
                        <div class="card-title">Эфиры|Разборы</div>
                        <div class="card-desc">Прямые эфиры и разборы кейсов</div>
                    </div>
                    <div class="card" onclick="openSection('videos')">
                        <div class="card-icon">🎯</div>
                        <div class="card-title">Видео-шпаргалки</div>
                        <div class="card-desc">Короткие видео с техниками</div>
                    </div>
                    <div class="card" onclick="openSection('materials')">
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
                    <div class="card" onclick="openSupport()">
                        <div class="card-icon">💬</div>
                        <div class="card-title">Поддержка</div>
                        <div class="card-desc">Помощь и консультации</div>
                    </div>
                </div>
            </div>

            <div class="news-section">
                <div class="section-header">
                    <h3>📰 Лента новостей</h3>
                    <div class="filters" id="newsFilters">
                        <button class="filter-btn active" data-filter="all">Все</button>
                        <button class="filter-btn" data-filter="articles">Статьи</button>
                        <button class="filter-btn" data-filter="development">Профессиональное развитие</button>
                        <button class="filter-btn" data-filter="skills">Практические навыки</button>
                        <button class="filter-btn" data-filter="physiotherapy">Физиотерапия</button>
                        <button class="filter-btn" data-filter="rehabilitation">Реабилитация</button>
                        <button class="filter-btn" data-filter="pharmacotherapy">Фармакотерапия</button>
                        <button class="filter-btn" data-filter="manual">Мануальные техники</button>
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
                        <option value="events">Мероприятия</option>
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
                <div class="community-card" onclick="showCommunityRules()">
                    <div class="community-icon">📜</div>
                    <div class="community-title">Правила сообщества</div>
                    <div class="community-desc">Основные принципы взаимодействия</div>
                </div>
                <div class="community-card" onclick="showFAQ()">
                    <div class="community-icon">❓</div>
                    <div class="community-title">F.A.Q.</div>
                    <div class="community-desc">Ответы на частые вопросы</div>
                </div>
            </div>

            <div class="faq-section">
                <h3>❓ Частые вопросы</h3>
                <div class="faq-list" id="faqList">
                    <div class="loading">Загрузка вопросов...</div>
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
                        <div class="profile-badge" id="userBadge">Активный участник</div>
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

            <div class="profile-actions">
                <button class="btn btn-outline" onclick="editProfile()">✏️ Редактировать профиль</button>
                <button class="btn btn-outline" onclick="showAchievements()">🏆 Мои достижения</button>
                <button class="btn btn-outline" onclick="exportData()">📥 Экспорт данных</button>
            </div>
        `
    }
};

let currentUser = null;
let allContent = {};
let currentPage = 'home';

// ОСНОВНЫЕ ФУНКЦИИ
async function loadUserData() {
    try {
        let userId;
        
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe.user;
            if (tgUser && tgUser.id) {
                userId = tgUser.id;
            }
        }

        if (!userId) {
            // Если нет Telegram user, используем demo режим
            currentUser = await loadDemoUser();
            updateUIWithUserData();
            return;
        }

        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            updateUIWithUserData();
            
            if (currentUser.isAdmin) {
                document.getElementById('adminBadge').style.display = 'block';
            }
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.log('Используем демо-данные');
        currentUser = await loadDemoUser();
        updateUIWithUserData();
    }
}

async function loadDemoUser() {
    const response = await fetch('/api/content');
    const contentData = await response.json();
    const content = contentData.success ? contentData.data : {};
    
    return {
        id: 1,
        firstName: 'Демо Пользователь',
        specialization: 'Невролог',
        city: 'Москва',
        email: 'demo@anb.ru',
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
            courses: content.courses ? [content.courses[0]?.id].filter(Boolean) : [], 
            podcasts: content.podcasts ? [content.podcasts[0]?.id].filter(Boolean) : [], 
            streams: content.streams ? [content.streams[0]?.id].filter(Boolean) : [], 
            videos: content.videos ? [content.videos[0]?.id].filter(Boolean) : [], 
            materials: content.materials ? [content.materials[0]?.id].filter(Boolean) : [], 
            watchLater: content.streams ? [content.streams[0]?.id].filter(Boolean) : [] 
        },
        isAdmin: false,
        joinedAt: new Date('2024-01-01')
    };
}

async function loadContent() {
    try {
        const response = await fetch('/api/content');
        const data = await response.json();
        
        if (data.success) {
            allContent = data.data;
        } else {
            throw new Error('Failed to load content');
        }
    } catch (error) {
        console.error('Ошибка загрузки контента:', error);
        allContent = {};
    }
}

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
            updateProfileData();
            break;
    }
}

// ФУНКЦИОНАЛ ГЛАВНОЙ СТРАНИЦЫ
async function initHomePage() {
    await loadNews();
    initNewsFilters();
}

async function loadNews() {
    const newsList = document.getElementById('newsList');
    if (!newsList) return;

    try {
        // Загрузка реальных новостей из API
        const response = await fetch('/api/news');
        const data = await response.json();
        
        if (data.success && data.news.length > 0) {
            displayNews(data.news);
        } else {
            // Загрузка новостей из контента если нет отдельных новостей
            await loadContent();
            generateNewsFromContent();
        }
    } catch (error) {
        generateNewsFromContent();
    }
}

function generateNewsFromContent() {
    const news = [];
    
    if (allContent.courses) {
        allContent.courses.forEach(course => {
            news.push({
                category: 'Профессиональное развитие',
                title: `Новый курс: "${course.title}"`,
                date: new Date(course.created).toLocaleDateString('ru-RU'),
                excerpt: course.description,
                type: 'courses'
            });
        });
    }
    
    if (allContent.streams) {
        allContent.streams.forEach(stream => {
            news.push({
                category: 'Вебинар',
                title: `Предстоящий эфир: "${stream.title}"`,
                date: new Date(stream.created).toLocaleDateString('ru-RU'),
                excerpt: stream.description,
                type: 'streams'
            });
        });
    }
    
    displayNews(news.slice(0, 5)); // Показываем только 5 последних
}

function displayNews(news) {
    const newsList = document.getElementById('newsList');
    if (!newsList) return;

    if (news.length === 0) {
        newsList.innerHTML = '<div class="empty-state">Новости пока не добавлены</div>';
        return;
    }

    newsList.innerHTML = news.map(item => `
        <div class="news-item" data-type="${item.type || 'news'}">
            <div class="news-category">${item.category}</div>
            <div class="news-title">${item.title}</div>
            <div class="news-date">${item.date}</div>
            <div class="news-excerpt">${item.excerpt}</div>
        </div>
    `).join('');
}

function initNewsFilters() {
    document.querySelectorAll('#newsFilters .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#newsFilters .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterNews(this.dataset.filter);
        });
    });
}

function filterNews(filter) {
    const newsItems = document.querySelectorAll('.news-item');
    
    newsItems.forEach(item => {
        if (filter === 'all' || item.dataset.type === filter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// ФУНКЦИОНАЛ КАТАЛОГА
async function loadCatalogContent() {
    await loadContent();
    renderCatalogContent();
}

function renderCatalogContent() {
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) return;
    
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

    // Сортируем по дате создания (новые первыми)
    allItems.sort((a, b) => new Date(b.created) - new Date(a.created));

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
                    ${item.price ? `<span class="meta-item">💰 ${formatPrice(item.price)}</span>` : ''}
                    ${!item.price && item.contentType !== 'courses' ? `<span class="meta-item free">🆓 Бесплатно</span>` : ''}
                    ${item.modules ? `<span class="meta-item">📚 ${item.modules} модулей</span>` : ''}
                    ${item.type ? `<span class="meta-item">📁 ${getMaterialType(item.type)}</span>` : ''}
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

function initCatalogFilters() {
    const searchInput = document.getElementById('catalogSearch');
    const typeFilter = document.getElementById('contentTypeFilter');
    const contentTabs = document.querySelectorAll('.content-tab');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterCatalogContent, 300));
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterCatalogContent);
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
    let visibleCount = 0;
    
    cards.forEach(card => {
        const title = card.querySelector('.content-title').textContent.toLowerCase();
        const description = card.querySelector('.content-description').textContent.toLowerCase();
        const cardType = card.dataset.type;
        const isFree = card.querySelector('.meta-item.free');
        const isNew = true; // Можно добавить логику определения новизны
        
        const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);
        const matchesType = contentType === 'all' || cardType === contentType;
        const matchesTab = activeTab === 'all' || 
                          (activeTab === 'free' && isFree) ||
                          (activeTab === 'new' && isNew) ||
                          (activeTab === 'popular' && cardType === 'streams'); // Пример логики популярности
        
        if (matchesSearch && matchesType && matchesTab) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Показываем сообщение если ничего не найдено
    const contentGrid = document.getElementById('contentGrid');
    const noResults = contentGrid.querySelector('.no-results');
    
    if (visibleCount === 0) {
        if (!noResults) {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'empty-state no-results';
            noResultsMsg.innerHTML = `
                <div class="empty-icon">🔍</div>
                <div class="empty-text">Ничего не найдено</div>
                <div class="empty-hint">Попробуйте изменить параметры поиска</div>
            `;
            contentGrid.appendChild(noResultsMsg);
        }
    } else if (noResults) {
        noResults.remove();
    }
}

// ФУНКЦИОНАЛ ИЗБРАННОГО
async function loadFavorites() {
    if (!currentUser) return;
    
    await loadContent();
    await loadWatchLater();
    await loadFavoritesList();
    await loadPracticeMaterials();
    updatePracticeCounts();
}

async function loadWatchLater() {
    const watchLaterList = document.getElementById('watchLaterList');
    if (!watchLaterList) return;
    
    const watchLaterItems = currentUser.favorites.watchLater.map(id => {
        for (const type in allContent) {
            const item = allContent[type].find(item => item.id === id);
            if (item) return { ...item, contentType: type };
        }
        return null;
    }).filter(item => item);
    
    if (watchLaterItems.length === 0) {
        watchLaterList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📥</div>
                <div class="empty-text">Здесь будут материалы, которые вы отложили на потом</div>
                <div class="empty-hint">Нажимайте "Посмотреть позже" на карточках контента</div>
            </div>
        `;
    } else {
        watchLaterList.innerHTML = watchLaterItems.map(item => `
            <div class="material-item">
                <div class="material-icon">${getContentIcon(item.contentType)}</div>
                <div class="material-info">
                    <div class="material-title">${item.title}</div>
                    <div class="material-description">${item.description}</div>
                    <div class="material-meta">
                        <span class="material-type">${getContentTypeName(item.contentType)}</span>
                        <span class="material-date">Добавлено ${formatDate(item.created)}</span>
                    </div>
                </div>
                <div class="material-actions">
                    <button class="btn btn-small" onclick="openContent('${item.contentType}', ${item.id})">Открыть</button>
                    <button class="btn btn-small btn-outline" onclick="removeFromWatchLater(${item.id})">❌ Удалить</button>
                </div>
            </div>
        `).join('');
    }
}

async function loadFavoritesList() {
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) return;
    
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
                    <div class="material-meta">
                        <span class="material-type">${getContentTypeName(item.contentType)}</span>
                    </div>
                </div>
                <div class="material-actions">
                    <button class="btn btn-small btn-outline" onclick="toggleFavorite('${item.contentType}', ${item.id})">
                        ❌ Удалить
                    </button>
                    <button class="btn btn-small" onclick="openContent('${item.contentType}', ${item.id})">Открыть</button>
                </div>
            </div>
        `).join('');
    }
}

async function loadPracticeMaterials() {
    const practiceList = document.getElementById('practiceMaterialsList');
    if (!practiceList) return;
    
    const materials = allContent.materials || [];
    const practiceMaterials = materials.filter(m => m.type && ['mri', 'case', 'checklist'].includes(m.type));
    
    if (practiceMaterials.length === 0) {
        practiceList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-text">Практические материалы появятся здесь</div>
            </div>
        `;
        return;
    }
    
    practiceList.innerHTML = practiceMaterials.map(material => `
        <div class="material-item">
            <div class="material-icon">${getMaterialIcon(material.type)}</div>
            <div class="material-info">
                <div class="material-title">${material.title}</div>
                <div class="material-description">${material.description}</div>
                <div class="material-meta">
                    <span class="material-type">${getMaterialType(material.type)}</span>
                    ${material.duration ? `<span class="material-duration">⏱️ ${material.duration}</span>` : ''}
                </div>
            </div>
            <div class="material-actions">
                <button class="btn btn-small btn-outline ${isFavorite('materials', material.id) ? 'active' : ''}" 
                        onclick="toggleFavorite('materials', ${material.id})">
                    ${isFavorite('materials', material.id) ? '★' : '☆'}
                </button>
                <button class="btn btn-small" onclick="openContent('materials', ${material.id})">Открыть</button>
            </div>
        </div>
    `).join('');
}

function updatePracticeCounts() {
    const materials = allContent.materials || [];
    
    const mriCount = materials.filter(m => m.type === 'mri').length;
    const casesCount = materials.filter(m => m.type === 'case').length;
    const checklistsCount = materials.filter(m => m.type === 'checklist').length;
    
    document.getElementById('mriCount').textContent = `${mriCount} материалов`;
    document.getElementById('casesCount').textContent = `${casesCount} кейсов`;
    document.getElementById('checklistsCount').textContent = `${checklistsCount} чек-листов`;
}

function initFavoritesPage() {
    const materialTabs = document.querySelectorAll('.material-tab');
    
    materialTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            materialTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.material-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// ФУНКЦИОНАЛ ПРОФИЛЯ
function updateProfileData() {
    if (!currentUser) return;
    
    updateUIWithUserData();
    updateProfileStats();
    loadJourneyProgress();
}

function updateUIWithUserData() {
    if (!currentUser) return;
    
    const userNameElement = document.getElementById('userName');
    const subscriptionStatusElement = document.getElementById('subscriptionStatus');
    const joinDateElement = document.getElementById('joinDate');
    const userBadgeElement = document.getElementById('userBadge');
    
    if (userNameElement) {
        userNameElement.textContent = currentUser.firstName;
    }
    
    if (joinDateElement && currentUser.joinedAt) {
        joinDateElement.textContent = new Date(currentUser.joinedAt).toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'});
    }
    
    if (userBadgeElement) {
        userBadgeElement.textContent = getUserBadge(currentUser.progress.level);
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

function loadJourneyProgress() {
    const journeyProgress = document.getElementById('journeyProgress');
    if (!journeyProgress) return;

    const levels = [
        {
            level: 'Понимаю',
            title: 'Понимаю',
            description: 'Начинаю замечать закономерности и связи. Не просто слышу жалобы — вижу структуру боли.',
            progress: calculateLevelProgress('Понимаю'),
            total: 9,
            current: calculateCurrentProgress('Понимаю'),
            hint: 'Чтобы перейти к следующему этапу — продолжайте участвовать в эфирах и сохраняйте всё, что откликается, в «Мои материалы».',
            active: currentUser.progress.level === 'Понимаю'
        },
        {
            level: 'Связываю', 
            title: 'Связываю',
            description: 'Закономерности и связи складываются в единую картину. Боль приобретает смысл.',
            progress: calculateLevelProgress('Связываю'),
            total: 25,
            current: calculateCurrentProgress('Связываю'),
            hint: 'Чтобы перейти к следующему этапу — участвуйте в разборах и ищите взаимосвязи между изученными материалами.',
            active: currentUser.progress.level === 'Связываю'
        },
        {
            level: 'Применяю',
            title: 'Применяю',
            description: 'При взгляде на единую картину - боль воспринимается как следствие. Работа направлена на устранение причины.',
            progress: calculateLevelProgress('Применяю'),
            total: 23,
            current: calculateCurrentProgress('Применяю'),
            hint: 'Чтобы перейти к следующему этапу — выберите тему, в которой хотите углубиться, и пройдите обучение в Академии.',
            active: currentUser.progress.level === 'Применяю'
        },
        {
            level: 'Систематизирую',
            title: 'Систематизирую',
            description: 'Знания становятся инструментом, а не набором методик.',
            progress: calculateLevelProgress('Систематизирую'),
            total: 13,
            current: calculateCurrentProgress('Систематизируею'),
            hint: 'Продолжайте обучение и участвуйте в разборах как приглашенный гость.',
            active: currentUser.progress.level === 'Систематизирую'
        },
        {
            level: 'Делюсь',
            title: 'Делюсь',
            description: 'Опыт становится вкладом. Появляется желание обсуждать, помогать и развивать других.',
            progress: calculateLevelProgress('Делюсь'),
            total: 7,
            current: calculateCurrentProgress('Делюсь'),
            hint: 'Публикуйте собственные клинические кейсы и участвуйте в закрытых мероприятиях.',
            active: currentUser.progress.level === 'Делюсь'
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

function calculateLevelProgress(level) {
    const currentLevel = currentUser.progress.level;
    const levelIndex = ['Понимаю', 'Связываю', 'Применяю', 'Систематизирую', 'Делюсь'].indexOf(level);
    const currentIndex = ['Понимаю', 'Связываю', 'Применяю', 'Систематизирую', 'Делюсь'].indexOf(currentLevel);
    
    if (levelIndex < currentIndex) {
        return 100;
    } else if (levelIndex > currentIndex) {
        return 0;
    } else {
        // Рассчитываем прогресс для текущего уровня
        const progress = currentUser.progress.steps;
        let completed = 0;
        let total = 0;
        
        switch(level) {
            case 'Понимаю':
                completed = (progress.materialsWatched >= 1 ? 1 : 0) + 
                           (progress.eventsParticipated >= 3 ? 1 : 0) + 
                           (progress.materialsSaved >= 5 ? 1 : 0);
                total = 3;
                break;
            case 'Связываю':
                completed = (progress.materialsWatched >= 10 ? 1 : 0) + 
                           (progress.eventsParticipated >= 5 ? 1 : 0) + 
                           (progress.materialsSaved >= 10 ? 1 : 0);
                total = 3;
                break;
            // ... аналогично для других уровней
        }
        
        return Math.round((completed / total) * 100);
    }
}

function calculateCurrentProgress(level) {
    const progress = currentUser.progress.steps;
    
    switch(level) {
        case 'Понимаю':
            return Math.min(progress.materialsWatched, 1) + 
                   Math.min(progress.eventsParticipated, 3) + 
                   Math.min(progress.materialsSaved, 5);
        case 'Связываю':
            return Math.min(progress.materialsWatched, 10) + 
                   Math.min(progress.eventsParticipated, 5) + 
                   Math.min(progress.materialsSaved, 10);
        // ... аналогично для других уровней
        default:
            return 0;
    }
}

// ИНТЕРАКТИВНЫЕ ФУНКЦИИ
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
        showNotification('❌ Ошибка при обновлении избранного', 'error');
    }
}

async function addToWatchLater(contentType, contentId) {
    if (!currentUser) {
        showNotification('⚠️ Необходимо войти в систему');
        return;
    }

    try {
        const response = await fetch(`/api/user/${currentUser.id}/watch-later`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contentType,
                contentId,
                action: 'add'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser.favorites.watchLater = data.watchLater;
            showNotification('📥 Добавлено в "Посмотреть позже"');
            
            if (currentPage === 'favorites') {
                loadFavorites();
            }
        }
    } catch (error) {
        showNotification('❌ Ошибка при добавлении в список', 'error');
    }
}

async function removeFromWatchLater(contentId) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/watch-later`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contentId,
                action: 'remove'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser.favorites.watchLater = data.watchLater;
            showNotification('❌ Удалено из "Посмотреть позже"');
            loadFavorites();
        }
    } catch (error) {
        showNotification('❌ Ошибка при удалении из списка', 'error');
    }
}

async function openContent(contentType, contentId) {
    if (!currentUser) {
        showNotification('⚠️ Необходимо войти в систему');
        return;
    }

    const content = allContent[contentType]?.find(item => item.id === contentId);
    if (!content) {
        showNotification('❌ Контент не найден');
        return;
    }

    // Проверяем доступ к контенту
    if (!hasAccessToContent(content)) {
        showNotification('🔒 Для доступа к этому контенту нужна активная подписка');
        changeSubscription();
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
                                    ${content.price ? `<span>💰 ${formatPrice(content.price)}</span>` : ''}
                                    ${content.modules ? `<span>📚 ${content.modules} модулей</span>` : ''}
                                    ${content.type ? `<span>📁 ${getMaterialType(content.type)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="content-actions-full">
                            <button class="btn btn-primary" onclick="startContent('${contentType}', ${contentId})">
                                ${getActionButtonText(contentType)}
                            </button>
                            <button class="btn btn-outline ${isFavorite(contentType, contentId) ? 'active' : ''}" 
                                    onclick="toggleFavorite('${contentType}', ${contentId})">
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
                        
                        ${content.modules ? `
                            <div class="content-modules">
                                <h4>Модули курса</h4>
                                <div class="modules-list">
                                    ${Array.from({length: content.modules}, (_, i) => `
                                        <div class="module-item">
                                            <div class="module-number">${i + 1}</div>
                                            <div class="module-info">
                                                <div class="module-title">Модуль ${i + 1}</div>
                                                <div class="module-status ${i < 2 ? 'completed' : 'locked'}">
                                                    ${i < 2 ? '✅ Пройден' : '🔒 Заблокирован'}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function hasAccessToContent(content) {
    if (!currentUser) return false;
    
    // Бесплатный контент доступен всем
    if (!content.price || content.price === 0) return true;
    
    // Проверяем активную подписку
    return currentUser.subscription.status === 'active' || 
           currentUser.subscription.status === 'trial';
}

function startContent(contentType, contentId) {
    const content = allContent[contentType]?.find(item => item.id === contentId);
    if (!content) return;

    // Обновляем прогресс просмотра
    updateUserProgress('materialsWatched');

    const actions = {
        'courses': () => {
            showNotification('🎓 Начинаем курс...');
            openCoursePlayer(content);
        },
        'podcasts': () => {
            showNotification('🎧 Запускаем подкаст...');
            openAudioPlayer(content);
        },
        'streams': () => {
            showNotification('📹 Начинаем трансляцию...');
            openVideoPlayer(content);
        },
        'videos': () => {
            showNotification('🎯 Воспроизводим видео...');
            openVideoPlayer(content);
        },
        'materials': () => {
            showNotification('📄 Открываем материал...');
            openMaterialViewer(content);
        },
        'events': () => {
            showNotification('🗺️ Переходим к мероприятию...');
            openEventRegistration(content);
        }
    };
    
    if (actions[contentType]) {
        actions[contentType]();
    }
    
    closeModal('contentModal');
}

function openCoursePlayer(course) {
    const modalHTML = `
        <div class="modal" id="coursePlayerModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${course.title}</h3>
                    <button class="close-btn" onclick="closeModal('coursePlayerModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="video-player">
                        <div class="player-placeholder">
                            <div class="placeholder-icon">🎓</div>
                            <div class="placeholder-text">Видеоплеер курса</div>
                            <div class="placeholder-note">Здесь будет видео-контент курса</div>
                        </div>
                    </div>
                    <div class="player-controls">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 30%"></div>
                        </div>
                        <div class="control-buttons">
                            <button class="btn btn-outline" onclick="pauseContent()">⏸️ Пауза</button>
                            <button class="btn btn-outline" onclick="skipForward()">⏩ +15с</button>
                            <button class="btn btn-primary" onclick="completeModule()">✅ Завершить модуль</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openVideoPlayer(video) {
    const modalHTML = `
        <div class="modal" id="videoPlayerModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${video.title}</h3>
                    <button class="close-btn" onclick="closeModal('videoPlayerModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="video-player">
                        <div class="player-placeholder">
                            <div class="placeholder-icon">📹</div>
                            <div class="placeholder-text">Видеоплеер</div>
                            <div class="placeholder-note">Продолжительность: ${video.duration}</div>
                        </div>
                    </div>
                    <div class="player-controls">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="control-buttons">
                            <button class="btn btn-outline" onclick="pauseContent()">⏸️ Пауза</button>
                            <button class="btn btn-outline" onclick="skipForward()">⏩ +15с</button>
                            <button class="btn btn-primary" onclick="completeVideo()">✅ Завершить просмотр</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openAudioPlayer(podcast) {
    const modalHTML = `
        <div class="modal" id="audioPlayerModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${podcast.title}</h3>
                    <button class="close-btn" onclick="closeModal('audioPlayerModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="audio-player">
                        <div class="player-placeholder">
                            <div class="placeholder-icon">🎧</div>
                            <div class="placeholder-text">Аудиоплеер подкаста</div>
                            <div class="placeholder-note">Продолжительность: ${podcast.duration}</div>
                        </div>
                    </div>
                    <div class="player-controls">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="control-buttons">
                            <button class="btn btn-outline" onclick="pauseContent()">⏸️ Пауза</button>
                            <button class="btn btn-outline" onclick="skipForward()">⏩ +30с</button>
                            <button class="btn btn-primary" onclick="completeAudio()">✅ Завершить прослушивание</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openMaterialViewer(material) {
    const modalHTML = `
        <div class="modal" id="materialModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${material.title}</h3>
                    <button class="close-btn" onclick="closeModal('materialModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="material-viewer">
                        <div class="viewer-placeholder">
                            <div class="placeholder-icon">📄</div>
                            <div class="placeholder-text">Просмотр материала</div>
                            <div class="placeholder-note">Тип: ${getMaterialType(material.type)}</div>
                            ${material.duration ? `<div class="placeholder-note">Время изучения: ${material.duration}</div>` : ''}
                        </div>
                        <div class="material-content">
                            <h4>Содержание материала:</h4>
                            <p>${material.fullDescription || material.description || 'Подробное содержание материала будет отображено здесь.'}</p>
                            
                            ${material.type === 'mri' ? `
                                <div class="mri-images">
                                    <div class="image-placeholder">🩻 МРТ снимок 1</div>
                                    <div class="image-placeholder">🩻 МРТ снимок 2</div>
                                    <div class="image-description">
                                        <h5>Описание разбора:</h5>
                                        <p>Детальный анализ МРТ-снимков с пояснениями патологий и рекомендациями по диагностике.</p>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${material.type === 'case' ? `
                                <div class="case-study">
                                    <h5>Клинический случай:</h5>
                                    <div class="case-section">
                                        <strong>Жалобы:</strong>
                                        <p>Пациент жалуется на хронические боли в поясничном отделе.</p>
                                    </div>
                                    <div class="case-section">
                                        <strong>Диагностика:</strong>
                                        <p>Проведены МРТ-исследования, функциональные тесты.</p>
                                    </div>
                                    <div class="case-section">
                                        <strong>Лечение:</strong>
                                        <p>Применены мануальные техники и физиотерапия.</p>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${material.type === 'checklist' ? `
                                <div class="checklist">
                                    <h5>Чек-лист:</h5>
                                    <div class="checklist-item">
                                        <input type="checkbox" id="check1">
                                        <label for="check1">Провести первичный осмотр</label>
                                    </div>
                                    <div class="checklist-item">
                                        <input type="checkbox" id="check2">
                                        <label for="check2">Оценить неврологический статус</label>
                                    </div>
                                    <div class="checklist-item">
                                        <input type="checkbox" id="check3">
                                        <label for="check3">Назначить дополнительные исследования</label>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="material-actions">
                        <button class="btn btn-primary" onclick="completeMaterial()">✅ Изучил материал</button>
                        <button class="btn btn-outline" onclick="downloadMaterial()">📥 Скачать</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openEventRegistration(event) {
    const modalHTML = `
        <div class="modal" id="eventModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${event.title}</h3>
                    <button class="close-btn" onclick="closeModal('eventModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="event-details">
                        <div class="event-info">
                            <div class="info-item">
                                <span class="info-label">📅 Дата:</span>
                                <span class="info-value">${event.date || 'Скоро будет объявлено'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">⏰ Время:</span>
                                <span class="info-value">${event.time || 'Уточняется'}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">📍 Формат:</span>
                                <span class="info-value">${event.type === 'online' ? '🌐 Онлайн' : '🏢 Офлайн'}</span>
                            </div>
                            ${event.location ? `
                                <div class="info-item">
                                    <span class="info-label">🏢 Место:</span>
                                    <span class="info-value">${event.location}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="event-description">
                            <p>${event.fullDescription || event.description || 'Подробности мероприятия будут объявлены дополнительно.'}</p>
                        </div>
                        
                        <div class="event-registration">
                            <h4>Регистрация на мероприятие</h4>
                            <form id="eventRegistrationForm">
                                <div class="form-group">
                                    <label>Ваше имя *</label>
                                    <input type="text" value="${currentUser.firstName}" required>
                                </div>
                                <div class="form-group">
                                    <label>Email для связи *</label>
                                    <input type="email" value="${currentUser.email}" required>
                                </div>
                                ${event.type === 'online' ? `
                                    <div class="form-group">
                                        <label>
                                            <input type="checkbox" checked> 
                                            Получить ссылку на подключение
                                        </label>
                                    </div>
                                ` : ''}
                                <div class="form-group">
                                    <label>Комментарий (необязательно)</label>
                                    <textarea placeholder="Ваши вопросы или пожелания..."></textarea>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('eventRegistrationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        registerForEvent(event.id);
    });
}

// ФУНКЦИИ УПРАВЛЕНИЯ КОНТЕНТОМ
function pauseContent() {
    showNotification('⏸️ Воспроизведение приостановлено');
}

function skipForward() {
    showNotification('⏩ Перемотка вперед');
}

function completeModule() {
    updateUserProgress('coursesCompleted');
    showNotification('✅ Модуль завершен! Прогресс сохранен.');
    closeModal('coursePlayerModal');
}

function completeVideo() {
    updateUserProgress('materialsWatched');
    showNotification('✅ Видео завершено! Прогресс сохранен.');
    closeModal('videoPlayerModal');
}

function completeAudio() {
    updateUserProgress('materialsWatched');
    showNotification('✅ Аудио завершено! Прогресс сохранен.');
    closeModal('audioPlayerModal');
}

function completeMaterial() {
    updateUserProgress('materialsWatched');
    showNotification('✅ Материал изучен! Прогресс сохранен.');
    closeModal('materialModal');
}

function downloadMaterial() {
    showNotification('📥 Начато скачивание материала...');
}

async function registerForEvent(eventId) {
    try {
        const response = await fetch(`/api/user/${currentUser.id}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId, action: 'register' })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('✅ Вы успешно зарегистрированы на мероприятие!');
            updateUserProgress('eventsAttended');
            closeModal('eventModal');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('❌ Ошибка при регистрации на мероприятие', 'error');
    }
}

// ФУНКЦИИ ПОДПИСКИ
async function changeSubscription() {
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
            throw new Error(data.error);
        }
    } catch (error) {
        showNotification('❌ Ошибка при оформлении подписки', 'error');
    }
}

// ФУНКЦИИ СООБЩЕСТВА
function initCommunityPage() {
    loadFAQ();
    initFAQ();
}

async function loadFAQ() {
    const faqList = document.getElementById('faqList');
    if (!faqList) return;

    try {
        const response = await fetch('/api/faq');
        const data = await response.json();
        
        if (data.success) {
            displayFAQ(data.faq);
        } else {
            displayDefaultFAQ();
        }
    } catch (error) {
        displayDefaultFAQ();
    }
}

function displayFAQ(faqItems) {
    const faqList = document.getElementById('faqList');
    if (!faqList) return;

    faqList.innerHTML = faqItems.map(item => `
        <div class="faq-item">
            <div class="faq-question" onclick="toggleFAQ(this)">${item.question}</div>
            <div class="faq-answer">${item.answer}</div>
        </div>
    `).join('');
}

function displayDefaultFAQ() {
    const defaultFAQ = [
        {
            question: "Как оформить, продлить или отменить подписку?",
            answer: "Подписку можно оформить или продлить в разделе «Личный кабинет». Там же доступна отмена — через кнопку «Изменить подписку»."
        },
        {
            question: "Что входит в подписку Академии?",
            answer: "Доступ к эфирам, разборам (в том числе в записи), практическим материалам, видео-шпаргалкам на разные темы, а также к чату специалистов и интерактивной карте офлайн-мероприятий."
        },
        {
            question: "Можно ли смотреть материалы без подписки?",
            answer: "Да, часть контента доступна в пробном периоде для ознакомления. Полный доступ и участие в развитии открываются при активной подписке."
        },
        {
            question: "Чем отличаются курсы, эфиры, разборы, видео-шпаргалки и практические материалы?",
            answer: "Курсы — системное обучение с сертификатами. Эфиры — живые встречи. Разборы — реальные кейсы врачей. Видео-шпаргалки — короткие видео с техниками. Практические материалы — полезные инструменты для работы."
        }
    ];
    
    displayFAQ(defaultFAQ);
}

function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            toggleFAQ(this);
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

function showCommunityRules() {
    const modalHTML = `
        <div class="modal" id="rulesModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📜 Правила сообщества</h3>
                    <button class="close-btn" onclick="closeModal('rulesModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="rules-content">
                        <h4>Основные принципы взаимодействия</h4>
                        <ol>
                            <li><strong>Уважение к коллегам:</strong> Поддерживайте доброжелательную атмосферу</li>
                            <li><strong>Профессионализм:</strong> Делитесь только проверенной информацией</li>
                            <li><strong>Конфиденциальность:</strong> Не разглашайте данные пациентов</li>
                            <li><strong>Взаимопомощь:</strong> Помогайте коллегам в профессиональных вопросах</li>
                            <li><strong>Соблюдение этики:</strong> Придерживайтесь врачебной этики</li>
                        </ol>
                        
                        <h4>Что запрещено:</h4>
                        <ul>
                            <li>Реклама сторонних услуг</li>
                            <li>Некорректное поведение</li>
                            <li>Распространение недостоверной информации</li>
                            <li>Нарушение конфиденциальности</li>
                        </ul>
                        
                        <div class="rules-footer">
                            <p>Координатор проекта отвечает с ПН-ПТ с 11:00 до 19:00</p>
                            <p>Сообщить о нарушении: @academy_anb</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showFAQ() {
    renderPage('community');
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
    // Здесь будет интеграция с Telegram чатами
}

function openMaterials(materialType) {
    const types = {
        'mri': 'МРТ разборы',
        'cases': 'Клинические случаи',
        'checklists': 'Чек-листы'
    };
    
    showNotification(`📋 Открываем: ${types[materialType]}`);
    // Переключаем на вкладку практических материалов
    if (currentPage === 'favorites') {
        document.querySelector('[data-tab="practice"]').click();
    }
}

// ФУНКЦИИ ПРОФИЛЯ
function editProfile() {
    showNotification('✏️ Редактирование профиля в разработке');
}

function showAchievements() {
    const modalHTML = `
        <div class="modal" id="achievementsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🏆 Мои достижения</h3>
                    <button class="close-btn" onclick="closeModal('achievementsModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="achievements-list">
                        <div class="achievement-item completed">
                            <div class="achievement-icon">🎯</div>
                            <div class="achievement-info">
                                <div class="achievement-title">Первый шаг</div>
                                <div class="achievement-description">Завершил первый материал</div>
                            </div>
                        </div>
                        <div class="achievement-item completed">
                            <div class="achievement-icon">👥</div>
                            <div class="achievement-info">
                                <div class="achievement-title">Активный участник</div>
                                <div class="achievement-description">Участвовал в 3+ мероприятиях</div>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <div class="achievement-icon">📚</div>
                            <div class="achievement-info">
                                <div class="achievement-title">Знаток</div>
                                <div class="achievement-description">Изучил 10+ материалов</div>
                            </div>
                        </div>
                        <div class="achievement-item">
                            <div class="achievement-icon">💎</div>
                            <div class="achievement-info">
                                <div class="achievement-title">Эксперт</div>
                                <div class="achievement-description">Завершил полный курс</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function exportData() {
    if (!currentUser) return;
    
    const userData = {
        profile: currentUser,
        stats: {
            coursesCompleted: currentUser.progress.steps.coursesBought || 0,
            materialsWatched: currentUser.progress.steps.materialsWatched || 0,
            eventsAttended: currentUser.progress.steps.eventsParticipated || 0,
            materialsSaved: currentUser.progress.steps.materialsSaved || 0
        },
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anb_academy_data_${currentUser.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('📥 Данные экспортированы', 'success');
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function openSection(section) {
    const sections = {
        'courses': () => { 
            renderPage('catalog');
            setTimeout(() => {
                document.querySelector('[data-content-type="courses"]').click();
            }, 100);
        },
        'podcasts': () => { 
            renderPage('catalog');
            setTimeout(() => {
                document.querySelector('[data-content-type="podcasts"]').click();
            }, 100);
        },
        'streams': () => { 
            renderPage('catalog');
            setTimeout(() => {
                document.querySelector('[data-content-type="streams"]').click();
            }, 100);
        },
        'videos': () => { 
            renderPage('catalog');
            setTimeout(() => {
                document.querySelector('[data-content-type="videos"]').click();
            }, 100);
        },
        'materials': () => { 
            renderPage('catalog');
            setTimeout(() => {
                document.querySelector('[data-content-type="materials"]').click();
            }, 100);
        },
        'events': () => { 
            renderPage('catalog');
            setTimeout(() => {
                document.querySelector('[data-content-type="events"]').click();
            }, 100);
        },
        'offers': () => { 
            showNotification('🔥 Ограниченные предложения - специальные условия и акции');
        }
    };
    
    if (sections[section]) {
        sections[section]();
    }
}

function openSupport() {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink('https://t.me/academy_anb');
    } else {
        showNotification('💬 Поддержка: @academy_anb');
    }
}

function toggleSearch() {
    const searchContainer = document.getElementById('searchContainer');
    searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
    
    if (searchContainer.style.display === 'block') {
        document.getElementById('searchInput').focus();
    }
}

function performSearch(query) {
    if (query.trim()) {
        showNotification(`🔍 Поиск: "${query}"`);
        renderPage('catalog');
        
        setTimeout(() => {
            const catalogSearch = document.getElementById('catalogSearch');
            if (catalogSearch) {
                catalogSearch.value = query;
                filterCatalogContent();
            }
        }, 100);
    }
}

function goToAdminPanel() {
    window.location.href = '/admin.html';
}

// УТИЛИТЫ
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

function getMaterialIcon(materialType) {
    const icons = {
        'mri': '🩻',
        'case': '📋',
        'checklist': '✅'
    };
    return icons[materialType] || '📄';
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

function getSubscriptionStatusText(status) {
    const statuses = {
        'active': 'Активная подписка',
        'trial': 'Пробный период',
        'inactive': 'Подписка не активна'
    };
    return statuses[status] || 'Не активна';
}

function getUserBadge(level) {
    const badges = {
        'Понимаю': 'Начинающий специалист',
        'Связываю': 'Активный участник',
        'Применяю': 'Практикующий специалист',
        'Систематизирую': 'Опытный врач',
        'Делюсь': 'Эксперт сообщества'
    };
    return badges[level] || 'Участник академии';
}

function isFavorite(contentType, contentId) {
    return currentUser && currentUser.favorites && currentUser.favorites[contentType].includes(contentId);
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('ru-RU');
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

async function updateUserProgress(metric) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${currentUser.id}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metric })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser.progress = data.progress;
            updateProfileStats();
            if (currentPage === 'profile') {
                loadJourneyProgress();
            }
        }
    } catch (error) {
        console.error('Ошибка обновления прогресса:', error);
    }
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
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
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

    // Загрузка пользователя и контента
    Promise.all([loadUserData(), loadContent()]).then(() => {
        renderPage('home');
    });

    // Интеграция с Telegram
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.expand();
        Telegram.WebApp.ready();
        Telegram.WebApp.setHeaderColor('#58b8e7');
        Telegram.WebApp.setBackgroundColor('#ffffff');
        
        // Обработка нажатия кнопки "Назад" в Telegram
        Telegram.WebApp.BackButton.onClick(() => {
            if (currentPage !== 'home') {
                renderPage('home');
            }
        });
    }
});

// CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .module-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #e3f2fd;
        border-radius: 8px;
        margin-bottom: 8px;
    }
    
    .module-number {
        width: 30px;
        height: 30px;
        background: #58b8e7;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 12px;
    }
    
    .module-status.completed {
        color: #28a745;
    }
    
    .module-status.locked {
        color: #6c757d;
    }
    
    .player-placeholder {
        text-align: center;
        padding: 40px 20px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 16px;
    }
    
    .placeholder-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    .achievement-item {
        display: flex;
        align-items: center;
        padding: 16px;
        border: 2px solid #e3f2fd;
        border-radius: 8px;
        margin-bottom: 12px;
    }
    
    .achievement-item.completed {
        border-color: #28a745;
        background: #f0fff4;
    }
    
    .rules-content ol, .rules-content ul {
        margin-left: 20px;
        margin-bottom: 16px;
    }
    
    .rules-content li {
        margin-bottom: 8px;
    }
`;
document.head.appendChild(style);
