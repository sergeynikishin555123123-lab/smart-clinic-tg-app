    createVideoCard(video) {
        return `
            <div class="content-card video-card">
                <div class="card-image">
                    <img src="${video.thumbnail_url}" alt="${video.title}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                    <div class="card-overlay">
                        <button class="favorite-btn ${this.isFavorite(video.id, 'videos') ? 'active' : ''}" 
                                onclick="event.stopPropagation(); app.toggleFavorite(${video.id}, 'videos')">
                            ${this.isFavorite(video.id, 'videos') ? '❤️' : '🤍'}
                        </button>
                        <button class="play-btn" onclick="app.previewContent('video', '${video.video_url}', {title: '${video.title}', id: ${video.id}})">
                            ▶️
                        </button>
                    </div>
                    <div class="video-duration">${video.duration}</div>
                </div>
                <div class="card-content">
                    <div class="card-category">${video.category}</div>
                    <h3 class="card-title">${video.title}</h3>
                    <p class="card-description">${video.description}</p>
                    <div class="card-meta">
                        <span class="meta-item">👁️ ${video.views} просмотров</span>
                    </div>
                </div>
            </div>
        `;
    }

    createMaterialCard(material) {
        return `
            <div class="content-card material-card">
                <div class="card-image">
                    <img src="${material.image_url}" alt="${material.title}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                    <div class="card-overlay">
                        <button class="favorite-btn ${this.isFavorite(material.id, 'materials') ? 'active' : ''}" 
                                onclick="event.stopPropagation(); app.toggleFavorite(${material.id}, 'materials')">
                            ${this.isFavorite(material.id, 'materials') ? '❤️' : '🤍'}
                        </button>
                        <button class="download-btn" onclick="app.downloadMaterial(${material.id})">
                            📥
                        </button>
                    </div>
                    <div class="material-type">${this.getMaterialTypeIcon(material.material_type)}</div>
                </div>
                <div class="card-content">
                    <div class="card-category">${material.category}</div>
                    <h3 class="card-title">${material.title}</h3>
                    <p class="card-description">${material.description}</p>
                    <div class="card-meta">
                        <span class="meta-item">${this.getMaterialTypeName(material.material_type)}</span>
                        <span class="meta-item">📥 ${material.downloads} загрузок</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== СТРАНИЦЫ СТРИМОВ И МЕРОПРИЯТИЙ С ФИЛЬТРАМИ ====================

    createStreamsPage() {
        const currentFilters = this.filters.streams;
        const streams = this.getFilteredContent('streams');
        
        return `
            <div class="page streams-page">
                <div class="page-header">
                    <h2>📹 Эфиры и разборы</h2>
                    <p>Прямые эфиры и разборы клинических случаев</p>
                </div>
                
                <!-- Фильтры -->
                <div class="content-filters">
                    <div class="filter-group">
                        <label>Категория:</label>
                        <select class="filter-select" onchange="app.applyFilter('streams', 'category', this.value)">
                            <option value="all">Все категории</option>
                            ${this.getUniqueCategories('streams').map(cat => `
                                <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>${cat}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Статус:</label>
                        <select class="filter-select" onchange="app.applyStreamFilter('status', this.value)">
                            <option value="all">Все эфиры</option>
                            <option value="live">Только LIVE</option>
                            <option value="recorded">Только записи</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Сортировка:</label>
                        <select class="filter-select" onchange="app.applyFilter('streams', 'sort', this.value)">
                            <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Сначала новые</option>
                            <option value="popular" ${currentFilters.sort === 'popular' ? 'selected' : ''}>По популярности</option>
                            <option value="participants" ${currentFilters.sort === 'participants' ? 'selected' : ''}>По участникам</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-outline" onclick="app.resetFilters('streams')">
                        🗑️ Сбросить
                    </button>
                </div>
                
                <div class="content-grid">
                    ${streams.length > 0 ? streams.map(stream => this.createStreamCard(stream)).join('') : this.createEmptyState('streams')}
                </div>
            </div>
        `;
    }

    createStreamCard(stream) {
        return `
            <div class="content-card stream-card">
                <div class="card-image">
                    <img src="${stream.thumbnail_url}" alt="${stream.title}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                    <div class="card-overlay">
                        <button class="favorite-btn ${this.isFavorite(stream.id, 'streams') ? 'active' : ''}" 
                                onclick="event.stopPropagation(); app.toggleFavorite(${stream.id}, 'streams')">
                            ${this.isFavorite(stream.id, 'streams') ? '❤️' : '🤍'}
                        </button>
                        <button class="play-btn" onclick="app.previewContent('video', '${stream.video_url}', {title: '${stream.title}', id: ${stream.id}})">
                            ▶️
                        </button>
                    </div>
                    ${stream.is_live ? `<div class="live-badge">LIVE</div>` : ''}
                </div>
                <div class="card-content">
                    <div class="card-category">${stream.category}</div>
                    <h3 class="card-title">${stream.title}</h3>
                    <p class="card-description">${stream.description}</p>
                    <div class="card-meta">
                        <span class="meta-item">⏱️ ${stream.duration}</span>
                        <span class="meta-item">👥 ${stream.participants} участников</span>
                    </div>
                </div>
            </div>
        `;
    }

    createEventsPage() {
        const currentFilters = this.filters.events;
        const events = this.getFilteredContent('events');
        
        return `
            <div class="page events-page">
                <div class="page-header">
                    <h2>🗺️ Карта мероприятий</h2>
                    <p>Онлайн и офлайн события Академии АНБ</p>
                </div>
                
                <!-- Фильтры -->
                <div class="content-filters">
                    <div class="filter-group">
                        <label>Категория:</label>
                        <select class="filter-select" onchange="app.applyFilter('events', 'category', this.value)">
                            <option value="all">Все категории</option>
                            ${this.getUniqueCategories('events').map(cat => `
                                <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>${cat}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Тип:</label>
                        <select class="filter-select" onchange="app.applyEventFilter('type', this.value)">
                            <option value="all">Все мероприятия</option>
                            <option value="online">Онлайн</option>
                            <option value="offline">Офлайн</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Сортировка:</label>
                        <select class="filter-select" onchange="app.applyFilter('events', 'sort', this.value)">
                            <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>Сначала новые</option>
                            <option value="date" ${currentFilters.sort === 'date' ? 'selected' : ''}>По дате</option>
                            <option value="participants" ${currentFilters.sort === 'participants' ? 'selected' : ''}>По участникам</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-outline" onclick="app.resetFilters('events')">
                        🗑️ Сбросить
                    </button>
                </div>
                
                <div class="content-grid">
                    ${events.length > 0 ? events.map(event => this.createEventCard(event)).join('') : this.createEmptyState('events')}
                </div>
            </div>
        `;
    }

    createEventCard(event) {
        return `
            <div class="content-card event-card">
                <div class="card-image">
                    <img src="${event.image_url}" alt="${event.title}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                    <div class="card-overlay">
                        <button class="favorite-btn ${this.isFavorite(event.id, 'events') ? 'active' : ''}" 
                                onclick="event.stopPropagation(); app.toggleFavorite(${event.id}, 'events')">
                            ${this.isFavorite(event.id, 'events') ? '❤️' : '🤍'}
                        </button>
                    </div>
                    <div class="event-type">${event.event_type === 'online' ? '🌐 Онлайн' : '🏛️ Офлайн'}</div>
                </div>
                <div class="card-content">
                    <div class="event-date">${new Date(event.event_date).toLocaleDateString('ru-RU')}</div>
                    <h3 class="card-title">${event.title}</h3>
                    <p class="card-description">${event.description}</p>
                    <div class="card-meta">
                        <span class="meta-item">📍 ${event.location}</span>
                        <span class="meta-item">👥 ${event.participants} участников</span>
                    </div>
                    ${event.registration_url ? `
                    <div class="event-actions">
                        <button class="btn btn-primary btn-small" onclick="window.open('${event.registration_url}', '_blank')">
                            Зарегистрироваться
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ==================== ДОПОЛНИТЕЛЬНЫЕ ФИЛЬТРЫ ====================

    applyStreamFilter(filterType, value) {
        // Дополнительная фильтрация для стримов
        if (filterType === 'status') {
            const streams = this.allContent.streams || [];
            let filteredStreams = streams;
            
            if (value === 'live') {
                filteredStreams = streams.filter(stream => stream.is_live);
            } else if (value === 'recorded') {
                filteredStreams = streams.filter(stream => !stream.is_live);
            }
            
            this.renderFilteredContent('streams', filteredStreams);
        }
    }

    applyEventFilter(filterType, value) {
        // Дополнительная фильтрация для мероприятий
        if (filterType === 'type') {
            const events = this.allContent.events || [];
            let filteredEvents = events;
            
            if (value === 'online') {
                filteredEvents = events.filter(event => event.event_type === 'online');
            } else if (value === 'offline') {
                filteredEvents = events.filter(event => event.event_type === 'offline');
            }
            
            this.renderFilteredContent('events', filteredEvents);
        }
    }

    renderFilteredContent(contentType, items) {
        const gridElement = document.querySelector(`.${contentType}-page .content-grid`);
        if (gridElement) {
            if (items.length === 0) {
                gridElement.innerHTML = this.createEmptyState(contentType);
            } else {
                const contentTemplates = {
                    'streams': (item) => this.createStreamCard(item),
                    'events': (item) => this.createEventCard(item)
                };
                gridElement.innerHTML = items.map(item => contentTemplates[contentType](item)).join('');
            }
        }
    }

    // ==================== УЛУЧШЕННЫЙ МЕДИА-ПЛЕЕР ====================

    previewContent(type, url, metadata = {}) {
        const modal = document.createElement('div');
        modal.className = 'media-modal active';
        
        let mediaHTML = '';
        let actionsHTML = '';
        
        switch(type) {
            case 'video':
                mediaHTML = `
                    <div class="video-container">
                        <video controls autoplay playsinline style="width: 100%; max-height: 60vh;">
                            <source src="${url}" type="video/mp4">
                            Ваш браузер не поддерживает видео.
                        </video>
                    </div>
                `;
                break;
                
            case 'audio':
                mediaHTML = `
                    <div class="audio-player">
                        ${metadata.cover ? `
                        <div class="audio-cover">
                            <img src="${metadata.cover}" alt="${metadata.title || 'Аудио'}" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                        </div>
                        ` : ''}
                        <div class="audio-controls">
                            <audio controls autoplay style="width: 100%; margin: 20px 0;">
                                <source src="${url}" type="audio/mpeg">
                                Ваш браузер не поддерживает аудио.
                            </audio>
                        </div>
                    </div>
                `;
                break;
                
            case 'image':
                mediaHTML = `
                    <div class="image-viewer">
                        <img src="${url}" alt="${metadata.title || 'Изображение'}" 
                             style="max-width: 100%; max-height: 70vh; object-fit: contain;"
                             onclick="this.classList.toggle('zoomed')">
                    </div>
                `;
                break;
                
            case 'pdf':
                mediaHTML = `
                    <div class="pdf-viewer">
                        <iframe src="${url}" frameborder="0" style="width: 100%; height: 500px;"></iframe>
                    </div>
                `;
                break;
                
            default:
                mediaHTML = `
                    <div class="file-viewer">
                        <div class="file-icon">📄</div>
                        <div class="file-info">
                            <h4>${metadata.title || 'Файл'}</h4>
                            <p>Для просмотра скачайте файл</p>
                        </div>
                    </div>
                `;
        }
        
        if (metadata.id) {
            actionsHTML = `
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="app.downloadMedia('${url}', '${metadata.title || 'file'}')">
                        📥 Скачать
                    </button>
                    <button class="btn btn-outline" onclick="app.toggleFavorite(${metadata.id}, '${type}')">
                        ${this.isFavorite(metadata.id, type) ? '❤️' : '🤍'} В избранное
                    </button>
                    <button class="btn btn-outline" onclick="app.shareContent('${type}', ${metadata.id})">
                        📤 Поделиться
                    </button>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content media-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${metadata.title || 'Медиа'}</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        ${mediaHTML}
                        ${metadata.description ? `
                        <div class="media-description">
                            <h4>Описание</h4>
                            <p>${metadata.description}</p>
                        </div>
                        ` : ''}
                    </div>
                    ${actionsHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Автовоспроизведение для видео/аудио
        if (type === 'video' || type === 'audio') {
            const mediaElement = modal.querySelector(type);
            if (mediaElement) {
                mediaElement.play().catch(e => {
                    console.log('Автовоспроизведение заблокировано');
                });
            }
        }
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    getUniqueCategories(contentType) {
        const content = this.allContent[contentType] || [];
        const categories = [...new Set(content.map(item => item.category))];
        return categories.filter(cat => cat && cat.trim() !== '');
    }

    initializePageComponents() {
        // Инициализация видео плееров
        this.initializeVideoPlayers();
        
        // Инициализация аудио плееров
        this.initializeAudioPlayers();
        
        // Инициализация фильтров
        this.initializeFilters();
        
        // Инициализация табов
        this.initializeTabs();
    }

    initializeVideoPlayers() {
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('play', () => {
                this.mediaPlayers.video = video;
            });
        });
    }

    initializeAudioPlayers() {
        document.querySelectorAll('audio').forEach(audio => {
            audio.addEventListener('play', () => {
                if (this.mediaPlayers.audio && this.mediaPlayers.audio !== audio) {
                    this.mediaPlayers.audio.pause();
                }
                this.mediaPlayers.audio = audio;
            });
        });
    }

    initializeFilters() {
        // Инициализация фильтров поиска
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e);
            }, 300));
        });
    }

    initializeTabs() {
        // Инициализация системы табов
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    debounce(func, wait) {
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

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        const activeBtn = document.querySelector(`[onclick*="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    setupEventListeners() {
        // Обработчики для нижней навигации
        document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.renderPage(page);
            });
        });

        // Глобальные обработчики событий
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleBackButton();
            }
        });

        console.log('✅ Обработчики событий установлены');
    }

    handleBackButton() {
        if (this.currentSubPage) {
            this.currentSubPage = '';
            this.renderPage(this.currentPage);
        } else if (this.currentPage !== 'home') {
            this.renderPage('home');
        } else {
            if (window.Telegram && Telegram.WebApp) {
                try {
                    Telegram.WebApp.close();
                } catch (e) {
                    this.showNotification('Используйте кнопку назад в Telegram', 'info');
                }
            }
        }
    }

    // ==================== СИСТЕМА ЛАЙКОВ/ИЗБРАННОГО ====================

    async toggleFavorite(contentId, contentType, event = null) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }
        
        try {
            const button = event?.target?.closest('.favorite-btn');
            if (button) {
                button.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 150);
            }

            const wasFavorite = this.isFavorite(contentId, contentType);
            
            const response = await this.safeApiCall('/api/favorites/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    contentId: contentId,
                    contentType: contentType
                })
            });

            if (response.success) {
                if (response.action === 'added') {
                    if (!this.state.favorites[contentType].includes(contentId)) {
                        this.state.favorites[contentType].push(contentId);
                    }
                    this.showNotification('❤️ Добавлено в избранное', 'success');
                    this.animateFavoriteButton(button, true);
                } else {
                    this.state.favorites[contentType] = this.state.favorites[contentType].filter(id => id !== contentId);
                    this.showNotification('💔 Удалено из избранного', 'info');
                    this.animateFavoriteButton(button, false);
                }
                
                this.updateFavoritesCount();
                
                if (this.currentPage === 'favorites') {
                    this.renderPage('favorites');
                }
            }
        } catch (error) {
            console.error('Ошибка переключения избранного:', error);
            this.showNotification('❌ Ошибка обновления избранного', 'error');
        }
    }

    animateFavoriteButton(button, isFavorite) {
        if (!button) return;
        
        button.innerHTML = isFavorite ? '❤️' : '🤍';
        button.classList.toggle('active', isFavorite);
        
        button.style.animation = 'pulse 0.3s ease-in-out';
        setTimeout(() => {
            button.style.animation = '';
        }, 300);
    }

    isFavorite(contentId, contentType) {
        return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
    }

    getTotalFavorites() {
        return Object.values(this.state.favorites).flat().length;
    }

    // ==================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ====================

    calculateHomeStats() {
        return {
            courses: this.allContent.stats?.totalCourses || this.allContent.courses?.length || 0,
            students: this.allContent.stats?.totalUsers || 0,
            experts: 25
        };
    }

    getRecommendedCourses() {
        return this.allContent.courses?.filter(course => course.featured) || [];
    }

    getLiveStreams() {
        return this.allContent.streams?.filter(stream => stream.is_live) || [];
    }

    createNewsItems() {
        const news = this.allContent.news || [];
        const filteredNews = this.currentNewsFilter === 'Все' ? 
            news : 
            news.filter(item => item.category === this.currentNewsFilter);
            
        if (filteredNews.length === 0) {
            return '<div class="empty-news">Новостей пока нет</div>';
        }
        
        return filteredNews.slice(0, 5).map(item => `
            <div class="news-item">
                <div class="news-image">
                    <img src="${item.image_url}" alt="${item.title}" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                </div>
                <div class="news-content">
                    <div class="news-category">${item.category}</div>
                    <h4 class="news-title">${item.title}</h4>
                    <p class="news-description">${item.description}</p>
                    <div class="news-meta">
                        <span class="news-date">${item.date}</span>
                        <span class="news-type">${item.type}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    createEmptyState(type, message = 'Пока ничего нет') {
        const emptyStates = {
            courses: { icon: '📚', title: 'Курсы не найдены', description: message },
            podcasts: { icon: '🎧', title: 'Подкасты не найдены', description: message },
            streams: { icon: '📹', title: 'Эфиры не найдены', description: message },
            videos: { icon: '🎯', title: 'Видео не найдены', description: message },
            materials: { icon: '📋', title: 'Материалы не найдены', description: message },
            events: { icon: '🗺️', title: 'Мероприятия не найдены', description: message }
        };
        
        const state = emptyStates[type] || { icon: '🔍', title: 'Ничего не найдено', description: message };
        
        return `
            <div class="empty-state">
                <div class="empty-icon">${state.icon}</div>
                <div class="empty-title">${state.title}</div>
                <div class="empty-description">${state.description}</div>
            </div>
        `;
    }

    createNotFoundPage() {
        return `
            <div class="page not-found-page">
                <div class="not-found-content">
                    <div class="not-found-icon">🔍</div>
                    <h2>Страница не найдена</h2>
                    <p>Запрашиваемая страница не существует или была перемещена</p>
                    <button class="btn btn-primary" onclick="app.renderPage('home')">
                        Вернуться на главную
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== ДЕМО-ДАННЫЕ ====================

    createDemoUser() {
        this.currentUser = {
            id: 898508164,
            firstName: 'Главный Админ',
            isAdmin: true,
            isSuperAdmin: true,
            subscriptionEnd: new Date('2025-12-31').toISOString(),
            hasActiveSubscription: true,
            avatarUrl: null,
            favorites: {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: []
            },
            progress: {
                level: 'Понимаю',
                experience: 1250,
                steps: {
                    coursesBought: 3,
                    modulesCompleted: 2,
                    materialsWatched: 12,
                    eventsAttended: 1
                }
            }
        };
        
        this.isAdmin = true;
        this.isSuperAdmin = true;
        this.updateAdminBadge();
        this.state.favorites = this.currentUser.favorites;
        this.updateFavoritesCount();
    }

    createDemoContent() {
        this.allContent = this.getDemoContentData();
    }

    getDemoContentData() {
        return {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике невролога',
                    description: '6 модулей по современным мануальным методикам',
                    price: 25000,
                    discount: 16,
                    duration: '12 недель',
                    modules: 6,
                    category: 'Мануальные техники',
                    level: 'advanced',
                    students_count: 156,
                    rating: 4.8,
                    featured: true,
                    image_url: '/webapp/assets/course-default.jpg',
                    video_url: 'https://example.com/video1',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Неврологическая диагностика',
                    description: '5 модулей по современной диагностике',
                    price: 18000,
                    discount: 0,
                    duration: '8 недель',
                    modules: 5,
                    category: 'Неврология',
                    level: 'intermediate',
                    students_count: 234,
                    rating: 4.6,
                    featured: true,
                    image_url: '/webapp/assets/course-default.jpg',
                    video_url: 'https://example.com/video2',
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    title: 'Основы физиотерапии',
                    description: '4 модуля по основам физиотерапии',
                    price: 15000,
                    discount: 10,
                    duration: '6 недель',
                    modules: 4,
                    category: 'Физиотерапия',
                    level: 'beginner',
                    students_count: 189,
                    rating: 4.7,
                    featured: false,
                    image_url: '/webapp/assets/course-default.jpg',
                    video_url: 'https://example.com/video3',
                    created_at: new Date().toISOString()
                }
            ],
            podcasts: [
                {
                    id: 1,
                    title: 'АНБ FM: Современная неврология',
                    description: 'Обсуждение новых тенденций в неврологии',
                    duration: '45:20',
                    category: 'Неврология',
                    listens: 2345,
                    image_url: '/webapp/assets/podcast-default.jpg',
                    audio_url: 'https://example.com/audio1',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'АНБ FM: Реабилитация после инсульта',
                    description: 'Методики реабилитации пациентов',
                    duration: '38:15',
                    category: 'Реабилитация',
                    listens: 1876,
                    image_url: '/webapp/assets/podcast-default.jpg',
                    audio_url: 'https://example.com/audio2',
                    created_at: new Date().toISOString()
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'LIVE: Ответы на вопросы по мануальной терапии',
                    description: 'Прямой эфир с ответами на вопросы',
                    duration: '2:15:00',
                    category: 'Мануальные техники',
                    participants: 156,
                    is_live: true,
                    thumbnail_url: '/webapp/assets/stream-default.jpg',
                    video_url: 'https://example.com/stream1',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Разбор клинического случая: боль в спине',
                    description: 'Детальный разбор диагностики и лечения',
                    duration: '1:45:30',
                    category: 'Неврология',
                    participants: 89,
                    is_live: false,
                    thumbnail_url: '/webapp/assets/stream-default.jpg',
                    video_url: 'https://example.com/stream2',
                    created_at: new Date().toISOString()
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Техника мобилизации шейного отдела',
                    description: 'Практическая демонстрация техники',
                    duration: '8:30',
                    category: 'Мануальные техники',
                    views: 567,
                    thumbnail_url: '/webapp/assets/video-default.jpg',
                    video_url: 'https://example.com/video1',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Тест мышечной силы',
                    description: 'Методика оценки мышечной силы',
                    duration: '6:45',
                    category: 'Диагностика',
                    views: 432,
                    thumbnail_url: '/webapp/assets/video-default.jpg',
                    video_url: 'https://example.com/video2',
                    created_at: new Date().toISOString()
                }
            ],
            materials: [
                {
                    id: 1,
                    title: 'Чек-лист неврологического осмотра',
                    description: 'Полный чек-лист для стандартного осмотра',
                    category: 'Неврология',
                    material_type: 'checklist',
                    downloads: 234,
                    image_url: '/webapp/assets/material-default.jpg',
                    file_url: 'https://example.com/material1.pdf',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Протокол лечения мигрени',
                    description: 'Стандартный протокол лечения мигрени',
                    category: 'Неврология',
                    material_type: 'protocol',
                    downloads: 187,
                    image_url: '/webapp/assets/material-default.jpg',
                    file_url: 'https://example.com/material2.pdf',
                    created_at: new Date().toISOString()
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Конференция по современной неврологии',
                    description: 'Ежегодная конференция с ведущими специалистами',
                    event_type: 'offline',
                    event_date: '2024-12-15T10:00:00.000Z',
                    location: 'Москва, ул. Профессиональная, 15',
                    participants: 250,
                    image_url: '/webapp/assets/event-default.jpg',
                    registration_url: 'https://example.com/register1',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Онлайн-семинар по мануальной терапии',
                    description: 'Практический семинар с разбором техник',
                    event_type: 'online',
                    event_date: '2024-11-20T14:00:00.000Z',
                    location: 'Онлайн',
                    participants: 120,
                    image_url: '/webapp/assets/event-default.jpg',
                    registration_url: 'https://example.com/register2',
                    created_at: new Date().toISOString()
                }
            ],
            news: [
                {
                    id: 1,
                    title: 'Новые методики в реабилитации пациентов с инсультом',
                    description: 'Обзор современных подходов к реабилитации',
                    content: 'Полный текст статьи...',
                    date: '15 дек 2024',
                    category: 'Реабилитация',
                    type: 'Статья',
                    image_url: '/webapp/assets/news-default.jpg',
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'Инновации в диагностике заболеваний позвоночника',
                    description: 'Новые технологии в диагностике',
                    content: 'Полный текст статьи...',
                    date: '10 дек 2024',
                    category: 'Диагностика',
                    type: 'Исследование',
                    image_url: '/webapp/assets/news-default.jpg',
                    created_at: new Date().toISOString()
                }
            ],
            stats: {
                totalUsers: 1567,
                totalCourses: 4,
                totalMaterials: 3,
                totalEvents: 3
            }
        };
    }

    // ==================== API МЕТОДЫ ====================

    async safeApiCall(url, options = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`${this.config.API_BASE_URL}${url}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`API Call failed: ${url}`, error);
            
            if (url === '/api/content') {
                return { success: true, data: this.getDemoContentData() };
            } else if (url === '/api/user') {
                return { success: true, user: this.getDemoUserData() };
            } else if (url.includes('/api/navigation')) {
                return { success: true, data: this.navigationItems };
            }
            
            return { success: false, error: error.message };
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Уведомление [${type}]: ${message}`);
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getNotificationIcon(type)}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || '💡';
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(price)) + ' ₽';
    }

    getLevelName(level) {
        const levels = {
            'beginner': 'Начинающий',
            'intermediate': 'Средний',
            'advanced': 'Продвинутый'
        };
        return levels[level] || level;
    }

    getMaterialTypeIcon(type) {
        const icons = {
            'checklist': '📋',
            'protocol': '📄',
            'guide': '📖',
            'template': '📝'
        };
        return icons[type] || '📎';
    }

    getMaterialTypeName(type) {
        const names = {
            'checklist': 'Чек-лист',
            'protocol': 'Протокол',
            'guide': 'Руководство',
            'template': 'Шаблон'
        };
        return names[type] || type;
    }

    getProfileStatus() {
        if (this.isSuperAdmin) return '🛠️ Супер-админ';
        if (this.isAdmin) return '🔧 Админ';
        return '👤 Активный участник';
    }

    updateAdminBadge() {
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            if (this.isSuperAdmin) {
                adminBadge.innerHTML = '🛠️ Супер-админ';
                adminBadge.style.display = 'flex';
            } else if (this.isAdmin) {
                adminBadge.innerHTML = '🔧 Админ';
                adminBadge.style.display = 'flex';
            } else {
                adminBadge.style.display = 'none';
            }
        }
    }

    updateFavoritesCount() {
        const favoritesCount = document.getElementById('favoritesCount');
        if (favoritesCount) {
            const totalFavorites = this.getTotalFavorites();
            favoritesCount.textContent = totalFavorites;
            favoritesCount.style.display = totalFavorites > 0 ? 'flex' : 'none';
        }
    }

    downloadMedia(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showNotification('Файл скачивается', 'success');
    }

    shareContent(type, id) {
        this.showNotification('Функция sharing в разработке', 'info');
    }

    // ==================== СИСТЕМА ПОДПИСОК ====================

    async loadSubscriptionData() {
        try {
            // Демо-данные для подписок
            this.subscriptionPlans = [
                {
                    id: 1,
                    name: 'Базовый',
                    description: 'Доступ к основным курсам',
                    price_monthly: 2900,
                    price_quarterly: 7500,
                    price_yearly: 27000,
                    features: JSON.stringify(['Доступ к 3 курсам', 'Базовые материалы', 'Поддержка по email'])
                },
                {
                    id: 2,
                    name: 'Профессиональный',
                    description: 'Полный доступ ко всем материалам',
                    price_monthly: 5900,
                    price_quarterly: 15000,
                    price_yearly: 54000,
                    features: JSON.stringify(['Все курсы', 'Все материалы', 'Приоритетная поддержка', 'Закрытые эфиры'])
                },
                {
                    id: 3,
                    name: 'Премиум',
                    description: 'Эксклюзивный доступ с персональным куратором',
                    price_monthly: 9900,
                    price_quarterly: 27000,
                    price_yearly: 99000,
                    features: JSON.stringify(['Все курсы и материалы', 'Персональный куратор', 'Индивидуальные консультации', 'Ранний доступ к новинкам'])
                }
            ];

            this.userSubscription = {
                plan_id: 2,
                plan_name: 'Профессиональный',
                plan_type: 'monthly',
                price: 5900,
                starts_at: new Date().toISOString(),
                ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };

        } catch (error) {
            console.error('Ошибка загрузки данных подписки:', error);
        }
    }

    showSubscriptionModal() {
        const modal = document.createElement('div');
        modal.className = 'media-modal active';
        
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
                    <div class="modal-header">
                        <h3>💎 Выбор подписки</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="subscription-plans">
                            ${this.subscriptionPlans.map(plan => {
                                const features = JSON.parse(plan.features);
                                return `
                                    <div class="subscription-plan ${this.subscriptionState.selectedPlan?.id === plan.id ? 'selected' : ''}" 
                                         onclick="app.selectSubscriptionPlan(${plan.id})">
                                        <div class="plan-header">
                                            <h4>${plan.name}</h4>
                                            <div class="plan-price">
                                                ${this.formatPrice(plan.price_monthly)}/мес
                                            </div>
                                        </div>
                                        <div class="plan-description">${plan.description}</div>
                                        <ul class="plan-features">
                                            ${features.map(feature => `
                                                <li>✅ ${feature}</li>
                                            `).join('')}
                                        </ul>
                                        <div class="plan-periods">
                                            <label class="period-option ${this.subscriptionState.selectedPeriod === 'monthly' ? 'active' : ''}">
                                                <input type="radio" name="period" value="monthly" 
                                                       ${this.subscriptionState.selectedPeriod === 'monthly' ? 'checked' : ''}
                                                       onchange="app.selectSubscriptionPeriod('monthly')">
                                                Месяц - ${this.formatPrice(plan.price_monthly)}
                                            </label>
                                            <label class="period-option ${this.subscriptionState.selectedPeriod === 'quarterly' ? 'active' : ''}">
                                                <input type="radio" name="period" value="quarterly" 
                                                       ${this.subscriptionState.selectedPeriod === 'quarterly' ? 'checked' : ''}
                                                       onchange="app.selectSubscriptionPeriod('quarterly')">
                                                3 месяца - ${this.formatPrice(plan.price_quarterly)}
                                            </label>
                                            <label class="period-option ${this.subscriptionState.selectedPeriod === 'yearly' ? 'active' : ''}">
                                                <input type="radio" name="period" value="yearly" 
                                                       ${this.subscriptionState.selectedPeriod === 'yearly' ? 'checked' : ''}
                                                       onchange="app.selectSubscriptionPeriod('yearly')">
                                                Год - ${this.formatPrice(plan.price_yearly)}
                                            </label>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary btn-large" 
                                onclick="app.purchaseSelectedSubscription()"
                                ${!this.subscriptionState.selectedPlan ? 'disabled' : ''}>
                            💳 Оформить подписку
                        </button>
                        <button class="btn btn-outline" onclick="this.closest('.media-modal').remove()">
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    selectSubscriptionPlan(planId) {
        this.subscriptionState.selectedPlan = this.subscriptionPlans.find(p => p.id === planId);
        this.updateSubscriptionModal();
    }

    selectSubscriptionPeriod(period) {
        this.subscriptionState.selectedPeriod = period;
        this.updateSubscriptionModal();
    }

    updateSubscriptionModal() {
        const plans = document.querySelectorAll('.subscription-plan');
        plans.forEach(plan => {
            const planId = parseInt(plan.getAttribute('onclick').match(/\d+/)[0]);
            plan.classList.toggle('selected', planId === this.subscriptionState.selectedPlan?.id);
        });

        const purchaseBtn = document.querySelector('.modal-actions .btn-primary');
        if (purchaseBtn) {
            purchaseBtn.disabled = !this.subscriptionState.selectedPlan;
        }
    }

    async purchaseSelectedSubscription() {
        if (!this.subscriptionState.selectedPlan) return;
        
        this.showNotification('✅ Подписка успешно активирована!', 'success');
        this.currentUser.hasActiveSubscription = true;
        document.querySelector('.media-modal')?.remove();
        
        // Обновляем страницу профиля если она открыта
        if (this.currentPage === 'profile') {
            this.renderPage('profile');
        }
    }

    // ==================== СИСТЕМА ПРЕПОДАВАТЕЛЕЙ ====================

    async loadInstructors() {
        try {
            // Демо-данные преподавателей
            this.instructors = [
                {
                    id: 1,
                    name: 'Доктор Иванов А.В.',
                    specialization: 'Неврология, Мануальная терапия',
                    role: 'Ведущий специалист',
                    experience_years: 15,
                    bio: 'Ведущий специалист по мануальной терапии, автор методик лечения болей в спине. Опыт работы - 15 лет. Автор более 50 научных публикаций.',
                    avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
                    email: 'ivanov@anb.ru',
                    social_links: JSON.stringify({
                        'telegram': '@ivanov_neuro',
                        'instagram': 'dr_ivanov',
                        'website': 'ivanov-clinic.ru'
                    })
                },
                {
                    id: 2,
                    name: 'Профессор Петрова С.И.',
                    specialization: 'Реабилитология, Физиотерапия',
                    role: 'Главный реабилитолог',
                    experience_years: 20,
                    bio: 'Профессор, доктор медицинских наук. Специалист по реабилитации пациентов с неврологическими нарушениями. Автор инновационных методик восстановления.',
                    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
                    email: 'petrova@anb.ru',
                    social_links: JSON.stringify({
                        'telegram': '@petrova_rehab',
                        'website': 'rehab-clinic.ru'
                    })
                }
            ];
        } catch (error) {
            console.error('Ошибка загрузки преподавателей:', error);
        }
    }

    showInstructorDetail(instructorId) {
        const instructor = this.instructors.find(i => i.id === instructorId);
        if (!instructor) return;

        const socialLinks = instructor.social_links ? JSON.parse(instructor.social_links) : {};

        const modal = document.createElement('div');
        modal.className = 'media-modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>👨‍🏫 Профиль преподавателя</h3>
                        <button class="modal-close" onclick="this.closest('.media-modal').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="instructor-detail">
                            <div class="instructor-avatar-large">
                                <img src="${instructor.avatar_url}" alt="${instructor.name}"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                            </div>
                            <div class="instructor-detail-info">
                                <h2>${instructor.name}</h2>
                                <p class="instructor-specialization">${instructor.specialization}</p>
                                <div class="instructor-stats">
                                    <span class="stat">🕐 ${instructor.experience_years} лет опыта</span>
                                    ${instructor.email ? `<span class="stat">📧 ${instructor.email}</span>` : ''}
                                </div>
                                <div class="instructor-bio">
                                    <h4>О преподавателе:</h4>
                                    <p>${instructor.bio}</p>
                                </div>
                                ${Object.keys(socialLinks).length > 0 ? `
                                <div class="instructor-social">
                                    <h4>Контакты:</h4>
                                    <div class="social-links">
                                        ${Object.entries(socialLinks).map(([platform, link]) => `
                                            <a href="${link}" class="social-link" target="_blank">${this.getSocialIcon(platform)} ${platform}</a>
                                        `).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    getSocialIcon(platform) {
        const icons = {
            'telegram': '📱',
            'instagram': '📸',
            'website': '🌐',
            'youtube': '🎥',
            'vk': '👥',
            'facebook': '👤'
        };
        return icons[platform] || '🔗';
    }

    // ==================== ОСТАЛЬНЫЕ СТРАНИЦЫ ====================

    createFavoritesPage() {
        const favoriteCourses = this.allContent.courses?.filter(course => this.isFavorite(course.id, 'courses')) || [];
        const favoritePodcasts = this.allContent.podcasts?.filter(podcast => this.isFavorite(podcast.id, 'podcasts')) || [];
        const favoriteVideos = this.allContent.videos?.filter(video => this.isFavorite(video.id, 'videos')) || [];
        const favoriteMaterials = this.allContent.materials?.filter(material => this.isFavorite(material.id, 'materials')) || [];
        const favoriteStreams = this.allContent.streams?.filter(stream => this.isFavorite(stream.id, 'streams')) || [];
        const favoriteEvents = this.allContent.events?.filter(event => this.isFavorite(event.id, 'events')) || [];
        
        const totalFavorites = favoriteCourses.length + favoritePodcasts.length + favoriteVideos.length + 
                              favoriteMaterials.length + favoriteStreams.length + favoriteEvents.length;
        
        if (totalFavorites === 0) {
            return `
                <div class="page favorites-page">
                    <div class="page-header">
                        <h2>❤️ Избранное</h2>
                        <p>Здесь будут ваши сохраненные материалы</p>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">❤️</div>
                        <div class="empty-title">Пока ничего нет</div>
                        <div class="empty-description">Добавляйте курсы, подкасты и материалы в избранное, чтобы вернуться к ним позже</div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="page favorites-page">
                <div class="page-header">
                    <h2>❤️ Избранное</h2>
                    <p>Ваши сохраненные материалы (${totalFavorites})</p>
                </div>
                
                ${favoriteCourses.length > 0 ? `
                <div class="favorites-section">
                    <h3>📚 Курсы (${favoriteCourses.length})</h3>
                    <div class="content-grid">
                        ${favoriteCourses.map(course => this.createCourseCard(course)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${favoritePodcasts.length > 0 ? `
                <div class="favorites-section">
                    <h3>🎧 Подкасты (${favoritePodcasts.length})</h3>
                    <div class="content-grid">
                        ${favoritePodcasts.map(podcast => this.createPodcastCard(podcast)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${favoriteVideos.length > 0 ? `
                <div class="favorites-section">
                    <h3>🎯 Видео (${favoriteVideos.length})</h3>
                    <div class="content-grid">
                        ${favoriteVideos.map(video => this.createVideoCard(video)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${favoriteMaterials.length > 0 ? `
                <div class="favorites-section">
                    <h3>📋 Материалы (${favoriteMaterials.length})</h3>
                    <div class="content-grid">
                        ${favoriteMaterials.map(material => this.createMaterialCard(material)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${favoriteStreams.length > 0 ? `
                <div class="favorites-section">
                    <h3>📹 Эфиры (${favoriteStreams.length})</h3>
                    <div class="content-grid">
                        ${favoriteStreams.map(stream => this.createStreamCard(stream)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${favoriteEvents.length > 0 ? `
                <div class="favorites-section">
                    <h3>🗺️ Мероприятия (${favoriteEvents.length})</h3>
                    <div class="content-grid">
                        ${favoriteEvents.map(event => this.createEventCard(event)).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    createProfilePage() {
        const user = this.currentUser;
        const progress = user?.progress || {};
        const currentLevel = this.learningPath[progress.level] || this.learningPath['Понимаю'];
        
        return `
            <div class="page profile-page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">${user.avatarUrl ? `<img src="${user.avatarUrl}" alt="Аватар">` : '👤'}</div>
                        <div class="profile-info">
                            <h2>${user?.firstName || 'Пользователь'}</h2>
                            <p class="profile-status">${this.getProfileStatus()}</p>
                            <p class="member-since">Член Академии АНБ с ${new Date().toLocaleDateString('ru-RU', {month: 'long', year: 'numeric'})}</p>
                        </div>
                    </div>
                    
                    <div class="subscription-status ${this.currentUser?.hasActiveSubscription ? 'active' : 'inactive'}">
                        <span>${this.currentUser?.hasActiveSubscription ? '✅' : '❌'} Подписка ${this.currentUser?.hasActiveSubscription ? 'активна' : 'не активна'}</span>
                        <button class="btn btn-small ${this.currentUser?.hasActiveSubscription ? 'btn-outline' : 'btn-primary'}" 
                                onclick="app.showSubscriptionModal()">
                            ${this.currentUser?.hasActiveSubscription ? 'Изменить' : 'Активировать'}
                        </button>
                    </div>
                </div>

                <div class="profile-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-info">
                            <div class="stat-value">${progress.steps?.coursesBought || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-info">
                            <div class="stat-value">${progress.steps?.modulesCompleted || 0}</div>
                            <div class="stat-label">Модулей</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-info">
                            <div class="stat-value">${progress.steps?.materialsWatched || 0}</div>
                            <div class="stat-label">Материалов</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">❤️</div>
                        <div class="stat-info">
                            <div class="stat-value">${this.getTotalFavorites()}</div>
                            <div class="stat-label">В избранном</div>
                        </div>
                    </div>
                </div>

                <div class="learning-path-section">
                    <h3>🛣️ Мой путь обучения</h3>
                    <div class="current-level">
                        <div class="level-badge">${progress.level}</div>
                        <div class="level-description">${currentLevel.description}</div>
                    </div>
                    
                    <div class="level-progress">
                        <div class="progress-header">
                            <span>Прогресс уровня</span>
                            <span>${progress.experience} XP</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(progress.experience / 2000) * 100}%"></div>
                        </div>
                    </div>

                    <div class="path-levels">
                        ${Object.entries(this.learningPath).map(([levelName, levelData], index) => {
                            const isCurrent = progress.level === levelName;
                            const isCompleted = progress.experience >= levelData.minExp;
                            const isUnlocked = progress.experience >= levelData.minExp;
                            
                            return `
                                <div class="path-level ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''}">
                                    <div class="level-header">
                                        <div class="level-icon">${index + 1}</div>
                                        <div class="level-info">
                                            <div class="level-name">${levelName}</div>
                                            <div class="level-exp">${levelData.minExp} - ${levelData.maxExp} XP</div>
                                        </div>
                                        ${isCompleted ? '<div class="level-badge">✅</div>' : 
                                          isCurrent ? '<div class="level-badge">🎯</div>' : 
                                          '<div class="level-badge">🔒</div>'}
                                    </div>
                                    
                                    ${isCurrent ? `
                                    <div class="level-requirements">
                                        <strong>Следующие шаги:</strong>
                                        <ul>
                                            ${levelData.steps.map(step => `<li>${step}</li>`).join('')}
                                        </ul>
                                    </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="subscription-info-section">
                    <h3>💎 Ваша подписка</h3>
                    ${this.currentUser?.hasActiveSubscription ? `
                        <div class="active-subscription">
                            <div class="subscription-plan-info">
                                <h4>${this.userSubscription?.plan_name || 'Профессиональный'}</h4>
                                <div class="subscription-details">
                                    <p><strong>Тариф:</strong> ${this.userSubscription?.plan_type || 'monthly'}</p>
                                    <p><strong>Стоимость:</strong> ${this.formatPrice(this.userSubscription?.price || 5900)}</p>
                                    <p><strong>Действует до:</strong> ${new Date(this.userSubscription?.ends_at).toLocaleDateString('ru-RU')}</p>
                                </div>
                            </div>
                            <button class="btn btn-primary" onclick="app.showSubscriptionModal()">
                                💎 Управление подпиской
                            </button>
                        </div>
                    ` : `
                        <div class="no-subscription">
                            <div class="subscription-cta">
                                <h4>Получите полный доступ к Академии!</h4>
                                <p>Доступ ко всем курсам, материалам и эксклюзивному контенту</p>
                                <button class="btn btn-primary btn-large" onclick="app.showSubscriptionModal()">
                                    💎 Выбрать подписку
                                </button>
                            </div>
                        </div>
                    `}
                </div>

                <div class="profile-actions">
                    <h3>⚙️ Действия</h3>
                    <div class="action-buttons">
                        <button class="btn btn-outline action-btn" onclick="app.renderPage('favorites')">
                            ❤️ Избранное
                        </button>
                        <button class="btn btn-outline action-btn" onclick="app.showSettings()">
                            ⚙️ Настройки
                        </button>
                        ${this.isAdmin ? `
                        <button class="btn btn-outline action-btn" onclick="app.openAdminPanel()">
                            🔧 Админ-панель
                        </button>
                        ` : ''}
                        <button class="btn btn-outline action-btn" onclick="app.exportData()">
                            📤 Экспорт данных
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createCommunityPage() {
        return `
            <div class="page community-page">
                <div class="page-header">
                    <h2>👥 О сообществе</h2>
                    <p>Правила и ценности Академии АНБ</p>
                </div>

                <div class="community-rules">
                    <h3>📜 Правила сообщества</h3>
                    <div class="rules-grid">
                        ${this.communityRules.map((rule, index) => `
                            <div class="rule-card">
                                <div class="rule-number">${index + 1}</div>
                                <div class="rule-content">
                                    <h4>${rule.title}</h4>
                                    <p>${rule.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="community-values">
                    <h3>💫 Наши ценности</h3>
                    <div class="values-list">
                        <div class="value-item">
                            <div class="value-icon">🎯</div>
                            <div class="value-content">
                                <h4>Профессионализм</h4>
                                <p>Высокие стандарты медицинского образования</p>
                            </div>
                        </div>
                        <div class="value-item">
                            <div class="value-icon">🤝</div>
                            <div class="value-content">
                                <h4>Взаимопомощь</h4>
                                <p>Поддерживаем друг друга в профессиональном росте</p>
                            </div>
                        </div>
                        <div class="value-item">
                            <div class="value-icon">🔬</div>
                            <div class="value-content">
                                <h4>Научный подход</h4>
                                <p>Основано на доказательной медицине</p>
                            </div>
                        </div>
                        <div class="value-item">
                            <div class="value-icon">💡</div>
                            <div class="value-content">
                                <h4>Инновации</h4>
                                <p>Используем современные методики обучения</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== ДЕТАЛЬНЫЕ СТРАНИЦЫ ====================

    openCourseDetail(courseId) {
        this.currentSubPage = `course-${courseId}`;
        this.renderPage('courses', `course-${courseId}`);
    }

    openStreamDetail(streamId) {
        this.currentSubPage = `stream-${streamId}`;
        this.renderPage('streams', `stream-${streamId}`);
    }

    openInstructorDetail(instructorId) {
        this.currentSubPage = `instructor-${instructorId}`;
        this.renderPage('instructors', `instructor-${instructorId}`);
    }

    createCourseDetailPage(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId) || this.getDemoCourse();
        const instructors = course.instructors || [];
        
        return `
            <div class="page course-detail-page">
                <!-- Хлебные крошки -->
                <div class="breadcrumbs">
                    <button class="btn btn-outline btn-small" onclick="app.renderPage('courses')">
                        ← Назад к курсам
                    </button>
                </div>

                <!-- Hero секция курса -->
                <div class="course-hero">
                    <div class="course-hero-image">
                        <img src="${course.image_url}" alt="${course.title}" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                        <div class="course-hero-overlay">
                            ${course.video_url ? `
                            <button class="btn btn-primary btn-large play-btn" 
                                    onclick="app.previewContent('video', '${course.video_url}', {title: '${course.title}', id: ${course.id}})">
                                ▶️ Предпросмотр курса
                            </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="course-hero-content">
                        <div class="course-meta-large">
                            <span class="category-badge">${course.category}</span>
                            <span class="level-badge level-${course.level}">${this.getLevelName(course.level)}</span>
                            <span class="rating-badge">⭐ ${course.rating}</span>
                        </div>
                        
                        <h1>${course.title}</h1>
                        <p class="course-subtitle">${course.description}</p>
                        
                        <div class="course-stats">
                            <div class="stat">
                                <div class="stat-value">${course.modules}</div>
                                <div class="stat-label">Модулей</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${course.duration}</div>
                                <div class="stat-label">Длительность</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${course.students_count}</div>
                                <div class="stat-label">Студентов</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">${course.rating}/5</div>
                                <div class="stat-label">Рейтинг</div>
                            </div>
                        </div>
                        
                        <div class="action-buttons">
                            ${this.currentUser?.hasActiveSubscription ? `
                                <button class="btn btn-success btn-large" onclick="app.startCourse(${course.id})">
                                    🎯 Начать обучение
                                </button>
                            ` : `
                                <button class="btn btn-primary btn-large" onclick="app.showSubscriptionModal()">
                                    💎 Получить доступ по подписке
                                </button>
                                <button class="btn btn-outline" onclick="app.purchaseCourse(${course.id})">
                                    💳 Купить отдельно - ${this.formatPrice(course.discount > 0 ? course.price * (1 - course.discount/100) : course.price)}
                                </button>
                            `}
                            
                            <button class="btn btn-outline" onclick="app.toggleFavorite(${course.id}, 'courses')">
                                ${this.isFavorite(course.id, 'courses') ? '❤️ В избранном' : '🤍 В избранное'}
                            </button>
                        </div>
                        
                        ${course.discount > 0 ? `
                        <div class="discount-info">
                            <span class="original-price">${this.formatPrice(course.price)}</span>
                            <span class="discount-amount">Экономия ${course.discount}%</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${instructors.length > 0 ? `
                <!-- Преподаватели курса -->
                <div class="course-instructors-section">
                    <h3>👨‍🏫 Преподаватели курса</h3>
                    <div class="instructors-grid">
                        ${instructors.map(instructor => `
                            <div class="instructor-card" onclick="app.showInstructorDetail(${instructor.id})">
                                <div class="instructor-avatar">
                                    <img src="${instructor.avatar_url}" alt="${instructor.name}"
                                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                                </div>
                                <div class="instructor-info">
                                    <h4>${instructor.name}</h4>
                                    <p class="instructor-specialization">${instructor.specialization}</p>
                                    <p class="instructor-role">${instructor.role}</p>
                                    <div class="instructor-experience">
                                        🕐 Опыт: ${instructor.experience_years} лет
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Табы с информацией о курсе -->
                <div class="course-tabs">
                    <div class="tab-navigation">
                        <button class="tab-btn active" onclick="app.switchCourseTab('about')">
                            📋 О курсе
                        </button>
                        <button class="tab-btn" onclick="app.switchCourseTab('curriculum')">
                            🎯 Программа
                        </button>
                        <button class="tab-btn" onclick="app.switchCourseTab('reviews')">
                            💬 Отзывы
                        </button>
                    </div>

                    <div class="tab-content active" id="about-tab">
                        <div class="course-description-detailed">
                            <h3>Что вы узнаете</h3>
                            <ul class="learning-list">
                                <li>Современные методики диагностики и лечения</li>
                                <li>Практические навыки для ежедневной работы</li>
                                <li>Разбор реальных клинических случаев</li>
                                <li>Инструменты для профессионального роста</li>
                            </ul>
                            
                            <h3>Для кого этот курс</h3>
                            <ul class="audience-list">
                                <li>Неврологи и реабилитологи</li>
                                <li>Мануальные терапевты</li>
                                <li>Врачи, желающие повысить квалификацию</li>
                                <li>Студенты медицинских вузов</li>
                            </ul>
                        </div>
                    </div>

                    <div class="tab-content" id="curriculum-tab">
                        <div class="curriculum-list">
                            ${this.createCurriculumModules(course.modules)}
                        </div>
                    </div>

                    <div class="tab-content" id="reviews-tab">
                        <div class="reviews-list">
                            ${this.createCourseReviews()}
                        </div>
                    </div>
                </div>

                <!-- Блок покупки -->
                <div class="purchase-section">
                    <div class="pricing-card">
                        <div class="pricing-header">
                            <h3>Начните обучение сегодня</h3>
                            ${course.discount > 0 ? `
                            <div class="discount-timer">
                                ⏰ Скидка действует еще 2 дня
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="price-display">
                            ${course.discount > 0 ? `
                                <div class="original-price">${this.formatPrice(course.price)}</div>
                            ` : ''}
                            <div class="current-price">
                                ${this.formatPrice(course.discount > 0 ? course.price * (1 - course.discount/100) : course.price)}
                            </div>
                        </div>
                        
                        <div class="features-list">
                            <div class="feature-item">✅ Полный доступ к курсу</div>
                            <div class="feature-item">✅ Сертификат о прохождении</div>
                            <div class="feature-item">✅ Поддержка куратора</div>
                            <div class="feature-item">✅ Доступ в закрытый чат</div>
                            <div class="feature-item">✅ Обновления курса</div>
                        </div>
                        
                        <div class="purchase-actions">
                            <button class="btn btn-primary btn-large" onclick="app.purchaseCourse(${course.id})">
                                💳 Купить курс
                            </button>
                            <button class="btn btn-outline" onclick="app.addToCart(${course.id})">
                                🛒 В корзину
                            </button>
                        </div>
                        
                        <div class="guarantee-badge">
                            ✅ 30-дневная гарантия возврата
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createCurriculumModules(moduleCount) {
        const modules = [];
        for (let i = 1; i <= moduleCount; i++) {
            modules.push(`
                <div class="module-item">
                    <div class="module-header">
                        <div class="module-number">Модуль ${i}</div>
                        <div class="module-duration">2-3 часа</div>
                    </div>
                    <div class="module-title">Тема модуля ${i}</div>
                    <div class="module-lessons">
                        <div class="lesson">🎯 Урок 1: Теоретическая основа</div>
                        <div class="lesson">🎯 Урок 2: Практическое применение</div>
                        <div class="lesson">🎯 Урок 3: Разбор кейсов</div>
                        <div class="lesson">📋 Тестирование</div>
                    </div>
                </div>
            `);
        }
        return modules.join('');
    }

    createCourseReviews() {
        const reviews = [
            { name: 'Анна К.', role: 'Невролог', rating: 5, text: 'Отличный курс! Много практической информации.', date: '2 недели назад' },
            { name: 'Михаил П.', role: 'Реабилитолог', rating: 4, text: 'Хорошая структура, полезные материалы.', date: '1 месяц назад' },
            { name: 'Елена С.', role: 'Мануальный терапевт', rating: 5, text: 'Лучший курс по мануальным техникам!', date: '3 месяца назад' }
        ];
        
        return reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-name">${review.name}</div>
                        <div class="reviewer-role">${review.role}</div>
                    </div>
                    <div class="review-rating">
                        ${'⭐'.repeat(review.rating)}
                    </div>
                </div>
                <div class="review-text">${review.text}</div>
                <div class="review-date">${review.date}</div>
            </div>
        `).join('');
    }

    createStreamDetailPage(streamId) {
        const stream = this.allContent.streams?.find(s => s.id == streamId) || {
            id: streamId,
            title: 'LIVE: Ответы на вопросы по мануальной терапии',
            description: 'Прямой эфир с ответами на вопросы по технике мануальной терапии и реабилитации пациентов.',
            duration: '2:15:00',
            category: 'Мануальные техники',
            participants: 156,
            is_live: true,
            thumbnail_url: '/webapp/assets/stream-default.jpg',
            video_url: 'https://example.com/stream2'
        };

        return `
            <div class="page stream-detail-page">
                <div class="detail-header">
                    <button class="back-btn" onclick="app.renderPage('streams')">
                        ← Назад к эфирам
                    </button>
                    <h2>${stream.title}</h2>
                </div>

                <div class="detail-container">
                    <div class="stream-player-section">
                        <div class="video-player">
                            <img src="${stream.thumbnail_url}" alt="${stream.title}" 
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                            <div class="player-overlay">
                                <button class="btn btn-primary btn-large play-btn" 
                                        onclick="app.previewContent('video', '${stream.video_url}', {title: '${stream.title}', id: ${stream.id}})">
                                    ▶️ Смотреть эфир
                                </button>
                            </div>
                            ${stream.is_live ? `
                            <div class="live-indicator">
                                <div class="live-dot"></div>
                                LIVE
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="stream-info">
                        <div class="stream-meta">
                            <div class="meta-item">
                                <span class="meta-label">Категория:</span>
                                <span class="meta-value">${stream.category}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Длительность:</span>
                                <span class="meta-value">${stream.duration}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Участников:</span>
                                <span class="meta-value">${stream.participants}</span>
                            </div>
                            <div class="meta-item">
                                <span class="meta-label">Статус:</span>
                                <span class="meta-value ${stream.is_live ? 'live' : 'recorded'}">
                                    ${stream.is_live ? '🔴 В прямом эфире' : '📹 Запись'}
                                </span>
                            </div>
                        </div>

                        <div class="stream-description">
                            <h3>Описание эфира</h3>
                            <p>${stream.description}</p>
                        </div>

                        <div class="stream-actions">
                            <button class="btn btn-primary" onclick="app.toggleFavorite(${stream.id}, 'streams')">
                                ${this.isFavorite(stream.id, 'streams') ? '❤️ В избранном' : '🤍 В избранное'}
                            </button>
                            <button class="btn btn-outline" onclick="app.shareContent('streams', ${stream.id})">
                                📤 Поделиться
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createInstructorDetailPage(instructorId) {
        const instructor = this.instructors.find(i => i.id === instructorId) || {
            id: instructorId,
            name: 'Доктор Иванов А.В.',
            specialization: 'Неврология, Мануальная терапия',
            bio: 'Ведущий специалист по мануальной терапии, автор методик лечения болей в спине. Опыт работы - 15 лет. Автор более 50 научных публикаций.',
            experience_years: 15,
            avatar_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
            email: 'ivanov@anb.ru',
            social_links: '{"telegram": "@ivanov_neuro", "instagram": "dr_ivanov", "website": "ivanov-clinic.ru"}'
        };

        const socialLinks = instructor.social_links ? JSON.parse(instructor.social_links) : {};

        return `
            <div class="page instructor-detail-page">
                <div class="detail-header">
                    <button class="back-btn" onclick="app.renderPage('courses')">
                        ← Назад
                    </button>
                    <h2>👨‍🏫 Профиль преподавателя</h2>
                </div>

                <div class="detail-container">
                    <div class="instructor-hero">
                        <div class="instructor-avatar-large">
                            <img src="${instructor.avatar_url}" alt="${instructor.name}"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                        </div>
                        
                        <div class="instructor-hero-content">
                            <h1>${instructor.name}</h1>
                            <p class="instructor-specialization-large">${instructor.specialization}</p>
                            
                            <div class="instructor-stats-large">
                                <div class="instructor-stat-large">
                                    <div class="stat-icon">🕐</div>
                                    <div class="stat-info">
                                        <div class="stat-value">${instructor.experience_years}+</div>
                                        <div class="stat-label">лет опыта</div>
                                    </div>
                                </div>
                                <div class="instructor-stat-large">
                                    <div class="stat-icon">📚</div>
                                    <div class="stat-info">
                                        <div class="stat-value">${this.getInstructorCoursesCount(instructor.id)}+</div>
                                        <div class="stat-label">курсов</div>
                                    </div>
                                </div>
                                <div class="instructor-stat-large">
                                    <div class="stat-icon">⭐</div>
                                    <div class="stat-info">
                                        <div class="stat-value">4.9</div>
                                        <div class="stat-label">рейтинг</div>
                                    </div>
                                </div>
                            </div>

                            ${instructor.email || Object.keys(socialLinks).length > 0 ? `
                            <div class="instructor-contacts">
                                ${instructor.email ? `
                                <div class="contact-item">
                                    <span class="contact-icon">📧</span>
                                    <span class="contact-text">${instructor.email}</span>
                                </div>
                                ` : ''}
                                
                                ${Object.entries(socialLinks).map(([platform, link]) => `
                                    <div class="contact-item">
                                        <span class="contact-icon">${this.getSocialIcon(platform)}</span>
                                        <a href="${link}" target="_blank" class="contact-text">${platform}</a>
                                    </div>
                                `).join('')}
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="instructor-bio-section">
                        <h3>📖 О преподавателе</h3>
                        <div class="instructor-bio-content">
                            <p>${instructor.bio}</p>
                            
                            <div class="instructor-achievements">
                                <h4>Достижения и квалификация:</h4>
                                <ul>
                                    <li>Доктор медицинских наук</li>
                                    <li>Член Российской ассоциации неврологов</li>
                                    <li>Автор методик мануальной терапии</li>
                                    <li>Регулярный спикер международных конференций</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="instructor-courses-section">
                        <h3>🎯 Курсы преподавателя</h3>
                        <div class="courses-grid">
                            ${this.getInstructorCourses(instructor.id).map(course => `
                                <div class="course-card" onclick="app.openCourseDetail(${course.id})">
                                    <div class="card-image">
                                        <img src="${course.image_url}" alt="${course.title}" 
                                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjM0Y0QTU1Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2Ij7QpNCw0LrRgtC+0YA8L3RleHQ+Cjwvc3ZnPgo='">
                                        <div class="card-overlay">
                                            <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                                    onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                                ${this.isFavorite(course.id, 'courses') ? '❤️' : '🤍'}
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-content">
                                        <div class="card-category">${course.category}</div>
                                        <h3 class="card-title">${course.title}</h3>
                                        <p class="card-description">${course.description}</p>
                                        <div class="card-meta">
                                            <span class="meta-item">⏱️ ${course.duration}</span>
                                            <span class="meta-item">🎯 ${course.modules} модулей</span>
                                        </div>
                                        <div class="card-footer">
                                            <div class="price-section">
                                                ${course.discount > 0 ? `
                                                    <div class="price-original">${this.formatPrice(course.price)}</div>
                                                    <div class="price-current">${this.formatPrice(course.price * (1 - course.discount/100))}</div>
                                                ` : `
                                                    <div class="price-current">${this.formatPrice(course.price)}</div>
                                                `}
                                            </div>
                                            <button class="btn btn-primary btn-small" 
                                                    onclick="event.stopPropagation(); app.openCourseDetail(${course.id})">
                                                Подробнее
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Вспомогательные методы для работы с преподавателями
    getInstructorCoursesCount(instructorId) {
        return this.allContent.courses?.filter(course => 
            course.instructors && course.instructors.some(i => i.id === instructorId)
        ).length || 2;
    }

    getInstructorCourses(instructorId) {
        return this.allContent.courses?.filter(course => 
            course.instructors && course.instructors.some(i => i.id === instructorId)
        ).slice(0, 3) || [];
    }

    // ==================== БИЗНЕС-ЛОГИКА ====================

    purchaseCourse(courseId) {
        this.showNotification('Функция покупки курса в разработке', 'info');
    }

    addToCart(courseId) {
        this.showNotification('Курс добавлен в корзину', 'success');
    }

    startCourse(courseId) {
        this.showNotification('🎯 Курс успешно открыт! Приятного обучения!', 'success');
    }

    downloadMaterial(materialId) {
        const material = this.allContent.materials?.find(m => m.id == materialId);
        if (material && material.file_url) {
            this.downloadMedia(material.file_url, material.title);
        } else {
            this.showNotification('Файл материала недоступен для скачивания', 'error');
        }
    }

    showSettings() {
        this.showNotification('Настройки в разработке', 'info');
    }

    exportData() {
        this.showNotification('Экспорт данных в разработке', 'info');
    }

    openAdminPanel() {
        if (this.isAdmin || this.isSuperAdmin) {
            this.showNotification('🔧 Открывается админ-панель...', 'info');
            // window.open('/admin/', '_blank');
        } else {
            this.showNotification('❌ У вас нет доступа к админ-панели', 'error');
        }
    }

    switchCourseTab(tabName) {
        this.switchTab(tabName);
    }

    filterNews(category) {
        this.currentNewsFilter = category;
        this.renderPage('home');
    }

    getDemoCourse() {
        return {
            id: 1,
            title: 'Демо курс',
            description: 'Описание демо курса',
            price: 10000,
            discount: 10,
            duration: '8 недель',
            modules: 4,
            category: 'Демо',
            level: 'beginner',
            students_count: 100,
            rating: 4.5,
            image_url: '/webapp/assets/course-default.jpg',
            video_url: 'https://example.com/demo'
        };
    }

    getDemoUserData() {
        return {
            id: 898508164,
            firstName: 'Демо Пользователь',
            isAdmin: true,
            isSuperAdmin: true,
            subscriptionEnd: new Date('2024-12-31').toISOString(),
            avatarUrl: null,
            favorites: {
                courses: [1],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: []
            },
            progress: {
                level: 'Понимаю',
                experience: 1250,
                steps: {
                    coursesBought: 3,
                    modulesCompleted: 2,
                    materialsWatched: 12,
                    eventsAttended: 1
                }
            }
        };
    }

    showFatalError(message) {
        console.error('💥 Фатальная ошибка:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fatal-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h3>Ошибка загрузки</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    Перезагрузить
                </button>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorDiv);
    }
}

// Глобальная инициализация
window.AcademyApp = AcademyApp;
console.log('✅ AcademyApp class loaded');

// Глобальная обработка ошибок
window.addEventListener('error', function(event) {
    console.error('🚨 Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});
