// webapp/app.js - ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ ВЕРСИЯ С ВСЕМИ ФУНКЦИЯМИ
class AcademyApp {
    constructor() {
        this.currentUser = null;
        this.allContent = {};
        this.currentPage = 'home';
        this.currentSubPage = '';
        this.isAdmin = false;
        this.isSuperAdmin = false;
        this.isInitialized = false;
        this.isLoading = false;
        this.socket = null;
        this.uploadQueue = [];
        this.uploadProgress = new Map();
        
        this.state = {
            currentCourse: null,
            currentStream: null,
            currentMaterial: null,
            searchQuery: '',
            activeFilters: {},
            sortBy: 'newest',
            viewMode: 'grid',
            favorites: {
                courses: [],
                podcasts: [],
                streams: [],
                videos: [],
                materials: [],
                events: [],
                articles: [],
                doctors: [],
                playlists: []
            },
            cart: [],
            watchHistory: [],
            readingProgress: {},
            theme: 'dark',
            language: 'ru',
            notifications: [],
            unreadNotifications: 0,
            uploadProgress: 0,
            activeUploads: 0,
            completedUploads: 0,
            failedUploads: 0,
            onlineUsers: 0,
            systemStatus: 'loading',
            lastUpdate: null,
            cacheSize: 0,
            memoryUsage: 0,
            performanceMetrics: {
                pageLoadTime: 0,
                apiResponseTime: 0,
                renderTime: 0,
                animationFrameRate: 0
            }
        };
        
        this.config = {
            API_BASE_URL: window.location.origin,
            SOCKET_URL: window.location.origin,
            UPLOAD_CHUNK_SIZE: 1024 * 1024, // 1MB
            MAX_UPLOAD_SIZE: 50 * 1024 * 1024, // 50MB
            CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
            RETRY_ATTEMPTS: 3,
            RETRY_DELAY: 1000,
            DEBOUNCE_DELAY: 300,
            OFFLINE_RETRY_INTERVAL: 5000,
            PERFORMANCE_MONITORING: true,
            ERROR_REPORTING: true,
            ANALYTICS_TRACKING: true
        };
        
        this.cache = new Map();
        this.retryCounts = new Map();
        this.analyticsEvents = [];
        this.errorReports = [];
        this.performanceEntries = [];
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация Академии АНБ версии 2.0...');
        this.showSkeletonLoading();
        
        try {
            this.startPerformanceMonitoring();
            this.setupErrorHandling();
            this.setupAnalytics();
            this.setupServiceWorker();
            this.setupOfflineDetection();
            
            await this.loadDependencies();
            await this.initializeTelegramWebApp();
            await this.loadUserData();
            await this.loadContent();
            await this.initializeSocket();
            await this.loadAppSettings();
            
            this.renderPage('home');
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.setupResizeObserver();
            this.setupVisibilityChangeHandler();
            
            this.isInitialized = true;
            this.state.systemStatus = 'ready';
            
            this.trackEvent('app_initialized', {
                loadTime: performance.now(),
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            });
            
            console.log('✅ Приложение полностью готово');
            this.showNotification('✅ Приложение готово к работе', 'success');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.trackError('app_initialization_failed', error);
            this.showError('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
        } finally {
            this.hideSkeletonLoading();
        }
    }

    startPerformanceMonitoring() {
        if (!this.config.PERFORMANCE_MONITORING) return;

        // Мониторинг времени загрузки
        const loadTime = performance.now();
        this.state.performanceMetrics.pageLoadTime = loadTime;

        // Мониторинг FPS
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                this.state.performanceMetrics.animationFrameRate = frameCount;
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();

        // Мониторинг памяти
        if (performance.memory) {
            setInterval(() => {
                this.state.memoryUsage = performance.memory.usedJSHeapSize;
            }, 10000);
        }

        // Сбор метрик производительности
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                this.performanceEntries.push(entry);
                
                if (entry.entryType === 'navigation') {
                    this.state.performanceMetrics.pageLoadTime = entry.loadEventEnd - entry.navigationStart;
                } else if (entry.entryType === 'resource') {
                    if (entry.name.includes('/api/')) {
                        this.state.performanceMetrics.apiResponseTime = entry.duration;
                    }
                }
            });
        });

        observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'largest-contentful-paint'] });
    }

    setupErrorHandling() {
        if (!this.config.ERROR_REPORTING) return;

        // Обработчик ошибок JavaScript
        window.addEventListener('error', (event) => {
            this.trackError('window_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });

        // Обработчик промисов без catch
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('unhandled_promise_rejection', {
                reason: event.reason?.message || event.reason
            });
        });

        // Обработчик ошибок загрузки ресурсов
        window.addEventListener('error', (event) => {
            const target = event.target;
            if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
                this.trackError('resource_load_error', {
                    tagName: target.tagName,
                    src: target.src || target.href,
                    error: event.error
                });
            }
        }, true);
    }

    setupAnalytics() {
        if (!this.config.ANALYTICS_TRACKING) return;

        // Отслеживание событий
        this.trackEvent('page_view', {
            url: window.location.href,
            referrer: document.referrer
        });

        // Отслеживание кликов
        document.addEventListener('click', (event) => {
            const target = event.target;
            const button = target.closest('button, .btn, [role="button"]');
            
            if (button) {
                this.trackEvent('button_click', {
                    text: button.textContent?.trim(),
                    id: button.id,
                    className: button.className
                });
            }
        });

        // Отслеживание навигации
        const originalPushState = history.pushState;
        history.pushState = function(...args) {
            originalPushState.apply(this, args);
            window.dispatchEvent(new Event('locationchange'));
        };

        window.addEventListener('locationchange', () => {
            this.trackEvent('navigation', {
                from: document.referrer,
                to: window.location.href
            });
        });

        // Периодическая отправка аналитики
        setInterval(() => {
            this.flushAnalytics();
        }, 30000);
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/webapp/sw.js');
                console.log('✅ ServiceWorker зарегистрирован:', registration);
                
                // Обработчик обновлений
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showNotification('Доступно обновление приложения', 'info', {
                                action: 'Обновить',
                                onAction: () => window.location.reload()
                            });
                        }
                    });
                });
                
            } catch (error) {
                console.error('❌ Ошибка регистрации ServiceWorker:', error);
            }
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.state.systemStatus = 'online';
            this.showNotification('✅ Соединение восстановлено', 'success');
            this.retryFailedRequests();
        });

        window.addEventListener('offline', () => {
            this.state.systemStatus = 'offline';
            this.showNotification('⚠️ Отсутствует интернет-соединение', 'warning');
        });
    }

    async loadDependencies() {
        const dependencies = [
            this.loadFonts(),
            this.loadIcons(),
            this.loadExternalScripts()
        ];

        await Promise.allSettled(dependencies);
    }

    async loadFonts() {
        // Предзагрузка шрифтов
        const font = new FontFace('Inter', 'url(https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5n-wU.woff2)');
        
        try {
            await font.load();
            document.fonts.add(font);
            document.documentElement.style.setProperty('--font-family', 'Inter, system-ui, sans-serif');
        } catch (error) {
            console.warn('Не удалось загрузить шрифт Inter:', error);
        }
    }

    async loadIcons() {
        // Создаем спрайт иконок
        const iconSprite = `
            <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
                <symbol id="icon-search" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </symbol>
                <symbol id="icon-user" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </symbol>
                <symbol id="icon-heart" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </symbol>
                <symbol id="icon-settings" viewBox="0 0 24 24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </symbol>
            </svg>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', iconSprite);
    }

    async loadExternalScripts() {
        // Загрузка внешних скриптов если нужно
        return Promise.resolve();
    }

    initializeTelegramWebApp() {
        return new Promise((resolve) => {
            if (window.Telegram && Telegram.WebApp) {
                try {
                    Telegram.WebApp.ready();
                    Telegram.WebApp.expand();
                    
                    // Настройка кнопок Telegram
                    Telegram.WebApp.BackButton.onClick(() => this.handleBackButton());
                    Telegram.WebApp.MainButton.setText('Меню');
                    Telegram.WebApp.MainButton.show();
                    Telegram.WebApp.MainButton.onClick(() => this.showTelegramMenu());
                    
                    // Настройка темы
                    this.applyTelegramTheme(Telegram.WebApp.themeParams);
                    
                    // Обработчик изменений темы
                    Telegram.WebApp.onEvent('themeChanged', (themeParams) => {
                        this.applyTelegramTheme(themeParams);
                    });
                    
                    console.log('✅ Telegram WebApp инициализирован');
                    resolve();
                } catch (error) {
                    console.warn('⚠️ Ошибка инициализации Telegram WebApp:', error);
                    resolve();
                }
            } else {
                console.log('ℹ️ Telegram WebApp не обнаружен, работаем в браузерном режиме');
                resolve();
            }
        });
    }

    applyTelegramTheme(themeParams) {
        if (themeParams.bg_color) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
        }
        if (themeParams.text_color) {
            document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color);
        }
        if (themeParams.hint_color) {
            document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
        }
        if (themeParams.link_color) {
            document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color);
        }
        if (themeParams.button_color) {
            document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color);
        }
        if (themeParams.button_text_color) {
            document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
        }
    }

    async loadUserData() {
        this.showLoading('Загрузка профиля...');
        
        try {
            let userId = this.getUserId();
            
            const response = await this.apiCall('/api/user', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    id: userId,
                    firstName: 'Пользователь',
                    username: 'user'
                })
            });

            if (response.success && response.user) {
                this.currentUser = response.user;
                this.isAdmin = this.currentUser.isAdmin || false;
                this.isSuperAdmin = this.currentUser.isSuperAdmin || false;
                
                this.updateAdminBadge();
                this.state.favorites = this.currentUser.favorites || this.state.favorites;
                
                this.trackEvent('user_loaded', {
                    userId: this.currentUser.id,
                    isAdmin: this.isAdmin,
                    isSuperAdmin: this.isSuperAdmin
                });
                
                console.log('✅ Данные пользователя загружены:', this.currentUser.firstName);
            } else {
                throw new Error('Invalid user data response');
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
            this.trackError('user_load_failed', error);
            this.createDemoUser();
        } finally {
            this.hideLoading();
        }
    }

    async loadContent() {
        this.showLoading('Загрузка контента...');
        
        try {
            const response = await this.apiCall('/api/content');
            
            if (response.success) {
                this.allContent = response.data;
                this.preloadImages();
                this.updateContentStats();
                
                this.trackEvent('content_loaded', {
                    courses: this.allContent.courses?.length || 0,
                    podcasts: this.allContent.podcasts?.length || 0,
                    streams: this.allContent.streams?.length || 0
                });
                
                console.log('✅ Контент загружен');
            } else {
                throw new Error('Failed to load content');
            }
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
            this.trackError('content_load_failed', error);
            this.createDemoContent();
        } finally {
            this.hideLoading();
        }
    }

    async initializeSocket() {
        if (!this.config.SOCKET_URL) return;

        try {
            this.socket = io(this.config.SOCKET_URL, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('🔌 WebSocket подключен');
                this.state.systemStatus = 'online';
                
                // Аутентификация
                if (this.currentUser) {
                    this.socket.emit('authenticate', {
                        token: this.generateTempToken()
                    });
                }
            });

            this.socket.on('disconnect', (reason) => {
                console.log('🔌 WebSocket отключен:', reason);
                this.state.systemStatus = 'offline';
            });

            this.socket.on('user_online', (data) => {
                this.state.onlineUsers = data.count;
            });

            this.socket.on('new_notification', (notification) => {
                this.handleNewNotification(notification);
            });

            this.socket.on('content_updated', (data) => {
                this.handleContentUpdate(data);
            });

            this.socket.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.trackError('websocket_error', error);
            });

        } catch (error) {
            console.error('Ошибка инициализации WebSocket:', error);
            this.trackError('websocket_initialization_failed', error);
        }
    }

    async loadAppSettings() {
        try {
            // Загрузка настроек из localStorage
            const savedSettings = localStorage.getItem('anb_academy_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.state.theme = settings.theme || 'dark';
                this.state.language = settings.language || 'ru';
                this.state.viewMode = settings.viewMode || 'grid';
            }

            // Применение темы
            this.applyTheme(this.state.theme);

            // Загрузка кэша
            this.loadCacheFromStorage();

        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
    }

    applyTheme(theme) {
        this.state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Сохранение в localStorage
        this.saveSettings();
    }

    saveSettings() {
        const settings = {
            theme: this.state.theme,
            language: this.state.language,
            viewMode: this.state.viewMode,
            favorites: this.state.favorites
        };
        
        localStorage.setItem('anb_academy_settings', JSON.stringify(settings));
    }

    loadCacheFromStorage() {
        try {
            const cached = localStorage.getItem('anb_academy_cache');
            if (cached) {
                const cacheData = JSON.parse(cached);
                const now = Date.now();
                
                for (const [key, value] of Object.entries(cacheData)) {
                    if (value.expiry > now) {
                        this.cache.set(key, value);
                    }
                }
                
                this.state.cacheSize = this.cache.size;
                console.log(`✅ Загружено ${this.cache.size} записей из кэша`);
            }
        } catch (error) {
            console.error('Ошибка загрузки кэша:', error);
        }
    }

    saveCacheToStorage() {
        try {
            const cacheObj = Object.fromEntries(this.cache);
            localStorage.setItem('anb_academy_cache', JSON.stringify(cacheObj));
        } catch (error) {
            console.error('Ошибка сохранения кэша:', error);
        }
    }

    // API методы
    async apiCall(url, options = {}) {
        const cacheKey = `api_${url}_${JSON.stringify(options.body || {})}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() < cached.expiry) {
            return cached.data;
        }

        const startTime = performance.now();
        
        try {
            const response = await fetch(`${this.config.API_BASE_URL}${url}`, {
                ...options,
                signal: AbortSignal.timeout(30000)
            });

            const responseTime = performance.now() - startTime;
            this.state.performanceMetrics.apiResponseTime = responseTime;

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Кэшируем успешные ответы
            if (data.success && options.method?.toUpperCase() === 'GET') {
                this.cache.set(cacheKey, {
                    data: data,
                    expiry: Date.now() + this.config.CACHE_DURATION
                });
                this.state.cacheSize = this.cache.size;
                this.saveCacheToStorage();
            }

            return data;

        } catch (error) {
            console.error(`API Call failed: ${url}`, error);
            
            // Повторная попытка для GET запросов
            if (options.method?.toUpperCase() === 'GET') {
                return this.retryApiCall(url, options, error);
            }
            
            throw error;
        }
    }

    async retryApiCall(url, options, error) {
        const retryKey = `retry_${url}`;
        const retryCount = this.retryCounts.get(retryKey) || 0;
        
        if (retryCount < this.config.RETRY_ATTEMPTS) {
            this.retryCounts.set(retryKey, retryCount + 1);
            
            await new Promise(resolve => 
                setTimeout(resolve, this.config.RETRY_DELAY * Math.pow(2, retryCount))
            );
            
            return this.apiCall(url, options);
        } else {
            this.retryCounts.delete(retryKey);
            throw error;
        }
    }

    async retryFailedRequests() {
        // Повторная отправка неудачных запросов при восстановлении соединения
        const failedRequests = JSON.parse(localStorage.getItem('failed_requests') || '[]');
        
        for (const request of failedRequests) {
            try {
                await this.apiCall(request.url, request.options);
                console.log(`✅ Повторно отправлен запрос: ${request.url}`);
            } catch (error) {
                console.error(`❌ Не удалось повторно отправить: ${request.url}`, error);
            }
        }
        
        localStorage.removeItem('failed_requests');
    }

    // Вспомогательные методы
    getUserId() {
        if (window.Telegram && Telegram.WebApp) {
            const tgUser = Telegram.WebApp.initDataUnsafe?.user;
            return tgUser?.id || 898508164;
        }
        
        // Для демо-режима
        return 898508164;
    }

    generateTempToken() {
        // Генерация временного токена для WebSocket
        return btoa(JSON.stringify({
            userId: this.currentUser?.id,
            timestamp: Date.now(),
            random: Math.random().toString(36).substr(2, 9)
        }));
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

    preloadImages() {
        // Предзагрузка изображений для улучшения производительности
        const images = [];
        
        ['courses', 'podcasts', 'streams', 'videos', 'materials', 'events'].forEach(type => {
            this.allContent[type]?.forEach(item => {
                if (item.image_url || item.thumbnail_url) {
                    const img = new Image();
                    img.src = item.image_url || item.thumbnail_url;
                    images.push(img);
                }
            });
        });
        
        console.log(`✅ Предзагружено ${images.length} изображений`);
    }

    updateContentStats() {
        // Обновление статистики контента
        const stats = {
            totalCourses: this.allContent.courses?.length || 0,
            totalPodcasts: this.allContent.podcasts?.length || 0,
            totalStreams: this.allContent.streams?.length || 0,
            totalMaterials: this.allContent.materials?.length || 0
        };
        
        this.state.contentStats = stats;
    }

    // Демо-данные
    createDemoUser() {
        this.currentUser = {
            id: 898508164,
            firstName: 'Демо Пользователь',
            specialization: 'Невролог',
            city: 'Москва',
            email: 'demo@anb-academy.ru',
            subscription: { 
                status: 'active', 
                type: 'premium',
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                features: {
                    courses_access: true,
                    premium_content: true,
                    personal_consultation: true,
                    certificates: true,
                    offline_events: true,
                    community_access: true
                }
            },
            progress: {
                level: 'Понимаю',
                experience: 1250,
                level_threshold: 1000,
                rank: 'Продвинутый',
                badges: ['first_course', 'quick_learner', 'community_contributor'],
                steps: {
                    materialsWatched: 12,
                    eventsParticipated: 5,
                    materialsSaved: 8,
                    coursesBought: 3,
                    modulesCompleted: 2,
                    offlineEvents: 1,
                    publications: 0,
                    commentsWritten: 15,
                    likesGiven: 23,
                    sharesMade: 7
                },
                progress: {
                    understand: 9,
                    connect: 15,
                    apply: 8,
                    systematize: 3,
                    share: 0
                },
                statistics: {
                    total_time_spent: 15600,
                    average_session_duration: 45,
                    completion_rate: 67,
                    engagement_score: 85,
                    last_active: new Date().toISOString(),
                    streak_days: 7,
                    longest_streak: 14
                }
            },
            favorites: {
                courses: [1, 2],
                podcasts: [1],
                streams: [1],
                videos: [1],
                materials: [1],
                events: [1],
                articles: [],
                doctors: [],
                playlists: []
            },
            isAdmin: true,
            isSuperAdmin: true,
            joinedAt: new Date('2024-01-01').toISOString(),
            surveyCompleted: true
        };
        
        this.isAdmin = true;
        this.isSuperAdmin = true;
        this.updateAdminBadge();
        this.state.favorites = this.currentUser.favorites;
    }

    createDemoContent() {
        this.allContent = {
            courses: [
                {
                    id: 1,
                    title: 'Мануальные техники в практике невролога',
                    subtitle: 'Современные подходы к диагностике и лечению',
                    description: '6 модулей по современным мануальным методикам',
                    full_description: 'Комплексный курс по мануальным техникам для практикующих врачей-неврологов. Изучите современные подходы к диагностике и лечению заболеваний опорно-двигательного аппарата. Курс включает теоретические основы, практические занятия и разбор клинических случаев.',
                    learning_outcomes: [
                        'Освоите основные мануальные техники диагностики',
                        'Научитесь проводить дифференциальную диагностику болевых синдромов',
                        'Сможете разрабатывать индивидуальные планы лечения пациентов',
                        'Освоите методы профилактики осложнений при мануальной терапии',
                        'Получите практические навыки работы с пациентами'
                    ],
                    requirements: [
                        'Высшее медицинское образование',
                        'Опыт работы не менее 1 года',
                        'Базовые знания анатомии и физиологии',
                        'Наличие медицинской страховки'
                    ],
                    target_audience: ['Неврологи', 'Реабилитологи', 'Мануальные терапевты', 'Ортопеды'],
                    price: 25000,
                    original_price: 30000,
                    discount: 16.67,
                    discount_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    duration: '12 недель',
                    total_duration_minutes: 7200,
                    modules: 6,
                    lessons: 24,
                    exercises: 12,
                    quizzes: 6,
                    projects: 2,
                    category: 'Мануальные техники',
                    subcategory: 'Неврология',
                    tags: ['мануальная терапия', 'неврология', 'реабилитация', 'диагностика', 'лечение'],
                    level: 'advanced',
                    difficulty: 'medium',
                    language: 'ru',
                    subtitles: ['ru', 'en'],
                    image_url: '/webapp/assets/course-manual.jpg',
                    video_url: '/webapp/assets/course-preview.mp4',
                    preview_video_url: '/webapp/assets/course-teaser.mp4',
                    certificate_template: 'professional',
                    active: true,
                    featured: true,
                    popular: true,
                    new: true,
                    students_count: 156,
                    max_students: 200,
                    rating: 4.8,
                    reviews_count: 89,
                    enrollment_count: 234,
                    completion_count: 156,
                    average_completion_time: 45,
                    success_rate: 92.5,
                    created_by: 898508164,
                    instructor_id: 898508164,
                    curriculum: [
                        {
                            module: 1,
                            title: 'Основы мануальной диагностики',
                            duration: '2 недели',
                            lessons: [
                                {
                                    id: 1,
                                    title: 'Анатомия позвоночника и биомеханика',
                                    duration: 45,
                                    type: 'video',
                                    resources: 3,
                                    completed: true
                                },
                                {
                                    id: 2,
                                    title: 'Пальпаторная диагностика и мануальное тестирование',
                                    duration: 60,
                                    type: 'video',
                                    resources: 2,
                                    completed: true
                                }
                            ]
                        },
                        {
                            module: 2,
                            title: 'Техники мобилизации и манипуляции',
                            duration: '3 недели',
                            lessons: [
                                {
                                    id: 3,
                                    title: 'Мягкотканные техники и миофасциальный релиз',
                                    duration: 75,
                                    type: 'video',
                                    resources: 4,
                                    completed: false
                                }
                            ]
                        }
                    ],
                    reviews: [
                        {
                            id: 1,
                            user_name: 'Анна Иванова',
                            rating: 5,
                            comment: 'Отличный курс! Практические навыки сразу применил в работе.',
                            date: '2024-01-15',
                            verified: true
                        },
                        {
                            id: 2,
                            user_name: 'Петр Сидоров',
                            rating: 4,
                            comment: 'Хорошая структура курса, но хотелось бы больше практических примеров.',
                            date: '2024-01-10',
                            verified: true
                        }
                    ],
                    statistics: {
                        views: 1567,
                        clicks: 892,
                        shares: 234,
                        wishlist_adds: 567,
                        conversion_rate: 15.2,
                        revenue: 3900000,
                        refunds: 2,
                        completion_rate: 66.7,
                        satisfaction_score: 4.8
                    }
                },
                {
                    id: 2,
                    title: 'Неврологическая диагностика: от основ к практике',
                    subtitle: 'Полный курс диагностических методик',
                    description: '5 модулей по современной неврологической диагностике',
                    full_description: 'Фундаментальный курс по неврологической диагностике с акцентом на практическое применение. Изучите современные методы обследования пациентов, интерпретацию результатов и постановку диагноза.',
                    price: 18000,
                    duration: '8 недель',
                    modules: 5,
                    category: 'Неврология',
                    subcategory: 'Диагностика',
                    level: 'intermediate',
                    students_count: 234,
                    rating: 4.6,
                    created_by: 898508164,
                    instructor_id: 898508164,
                    active: true,
                    featured: true,
                    image_url: '/webapp/assets/course-diagnosis.jpg'
                },
                {
                    id: 3,
                    title: 'Реабилитация после инсульта: современные протоколы',
                    subtitle: 'Эффективные методики восстановления',
                    description: '4 модуля по реабилитации неврологических пациентов',
                    price: 22000,
                    duration: '10 недель',
                    modules: 4,
                    category: 'Реабилитация',
                    subcategory: 'Неврология',
                    level: 'advanced',
                    students_count: 178,
                    rating: 4.7,
                    created_by: 898508164,
                    active: true,
                    image_url: '/webapp/assets/course-rehabilitation.jpg'
                }
            ],
            podcasts: [
                {
                    id: 1,
                    title: 'АНБ FM: Современная неврология и вызовы времени',
                    description: 'Обсуждение новых тенденций и вызовов в современной неврологии с ведущими специалистами',
                    duration: '45:20',
                    category: 'Неврология',
                    listens: 2345,
                    created_by: 898508164,
                    image_url: '/webapp/assets/podcast-neurology.jpg',
                    audio_url: '/webapp/assets/podcasts/neuro-1.mp3',
                    published_at: new Date('2024-01-10').toISOString(),
                    tags: ['неврология', 'инновации', 'диагностика'],
                    host: 'Доктор Иванов',
                    guests: ['Профессор Петров', 'Доктор Сидорова']
                },
                {
                    id: 2,
                    title: 'Мануальная терапия: мифы и реальность',
                    description: 'Разбираем распространенные заблуждения о мануальной терапии',
                    duration: '38:15',
                    category: 'Мануальные техники',
                    listens: 1876,
                    created_by: 898508164,
                    image_url: '/webapp/assets/podcast-manual.jpg',
                    audio_url: '/webapp/assets/podcasts/manual-1.mp3'
                }
            ],
            streams: [
                {
                    id: 1,
                    title: 'Разбор клинического случая: Болевой синдром в практике',
                    description: 'Прямой эфир с разбором сложного клинического случая болевого синдрома. Обсуждение дифференциальной диагностики и тактики лечения.',
                    duration: '1:30:00',
                    stream_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    live: true,
                    participants: 89,
                    type: 'clinical_analysis',
                    created_by: 898508164,
                    thumbnail_url: '/webapp/assets/stream-pain-syndrome.jpg',
                    video_url: '/webapp/assets/streams/live-1.mp4',
                    speaker: 'Профессор А.И. Сидоров',
                    topics: ['болевой синдром', 'дифференциальная диагностика', 'лечение'],
                    recording_available: true
                },
                {
                    id: 2,
                    title: 'Новые guidelines по лечению мигрени',
                    description: 'Обсуждение новых клинических рекомендаций по лечению мигрени',
                    duration: '1:15:00',
                    stream_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    live: false,
                    participants: 156,
                    type: 'guidelines_review',
                    created_by: 898508164,
                    thumbnail_url: '/webapp/assets/stream-migraine.jpg'
                }
            ],
            videos: [
                {
                    id: 1,
                    title: 'Шпаргалка невролога: Неврологический осмотр за 15 минут',
                    description: 'Быстрый гайд по основным тестам и методикам неврологического осмотра. Практические демонстрации и ключевые моменты.',
                    duration: '15:30',
                    category: 'Неврология',
                    views: 4567,
                    created_by: 898508164,
                    thumbnail_url: '/webapp/assets/video-neurological-exam.jpg',
                    video_url: '/webapp/assets/videos/neuro-exam.mp4',
                    difficulty: 'beginner',
                    tags: ['осмотр', 'диагностика', 'практика'],
                    likes: 234,
                    comments: 45
                },
                {
                    id: 2,
                    title: 'Техника проведения паравертебральной блокады',
                    description: 'Подробный разбор техники выполнения паравертебральной блокады под УЗИ-контролем',
                    duration: '22:45',
                    category: 'Процедуры',
                    views: 2890,
                    created_by: 898508164,
                    thumbnail_url: '/webapp/assets/video-blockade.jpg'
                }
            ],
            materials: [
                {
                    id: 1,
                    title: 'МРТ разбор: Рассеянный склероз и дифференциальная диагностика',
                    description: 'Детальный разбор МРТ с клиническими случаями и дифференциальной диагностикой. Практические рекомендации по интерпретации снимков.',
                    material_type: 'mri_analysis',
                    category: 'Неврология',
                    downloads: 1234,
                    created_by: 898508164,
                    image_url: '/webapp/assets/material-ms-mri.jpg',
                    file_url: '/webapp/assets/materials/ms-mri.pdf',
                    file_size: 2540000,
                    pages: 24,
                    language: 'ru',
                    version: '1.0',
                    last_updated: new Date('2024-01-05').toISOString()
                },
                {
                    id: 2,
                    title: 'Протокол ведения пациентов с болезнью Паркинсона',
                    description: 'Современный протокол диагностики и лечения болезни Паркинсона',
                    material_type: 'protocol',
                    category: 'Неврология',
                    downloads: 876,
                    created_by: 898508164,
                    image_url: '/webapp/assets/material-parkinson.jpg'
                }
            ],
            events: [
                {
                    id: 1,
                    title: 'Конференция: Современная неврология 2024 - Инновации и практика',
                    description: 'Ежегодная конференция с ведущими специалистами в области неврологии. Новейшие исследования, клинические случаи, мастер-классы.',
                    event_date: new Date('2024-02-15T10:00:00').toISOString(),
                    location: 'Москва, ЦВК Экспоцентр',
                    event_type: 'offline_conference',
                    participants: 456,
                    created_by: 898508164,
                    image_url: '/webapp/assets/event-neurology-conf.jpg',
                    registration_url: 'https://forms.example.com/neuro2024',
                    price: 5000,
                    available_seats: 44,
                    speakers: [
                        'Проф. А.В. Иванов',
                        'Д.м.н. М.П. Петрова',
                        'Проф. С.И. Сидоров'
                    ],
                    topics: [
                        'Нейродегенеративные заболевания',
                        'Цереброваскулярная патология',
                        'Нейрореабилитация'
                    ]
                },
                {
                    id: 2,
                    title: 'Воркшоп: Ультразвуковая диагностика в неврологии',
                    description: 'Практический воркшоп по УЗИ-диагностике нервной системы',
                    event_date: new Date('2024-01-25T14:00:00').toISOString(),
                    location: 'Онлайн',
                    event_type: 'online_workshop',
                    participants: 89,
                    created_by: 898508164,
                    image_url: '/webapp/assets/event-ultrasound.jpg'
                }
            ],
            promotions: [
                {
                    id: 1,
                    title: 'Скидка 25% на первую подписку Premium',
                    description: 'Специальное предложение для новых пользователей - получите доступ ко всем курсам со скидкой. Доступ к эксклюзивному контенту и персональным консультациям.',
                    discount: 25,
                    active: true,
                    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 898508164,
                    image_url: '/webapp/assets/promo-welcome.jpg',
                    conditions: 'Действует для новых пользователей при первой покупке подписки Premium',
                    code: 'WELCOME25',
                    usage_count: 156,
                    max_usage: 1000
                },
                {
                    id: 2,
                    title: 'Приведи друга - получи скидку 15%',
                    description: 'Пригласите коллегу и получите скидку на любой курс',
                    discount: 15,
                    active: true,
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    created_by: 898508164,
                    image_url: '/webapp/assets/promo-friend.jpg'
                }
            ],
            chats: [
                {
                    id: 1,
                    name: 'Общий чат Академии АНБ',
                    description: 'Основной чат для общения всех участников академии. Обсуждение курсов, обмен опытом, вопросы и ответы.',
                    type: 'group',
                    participants_count: 1567,
                    last_message: 'Добро пожаловать в Академию АНБ! Задавайте вопросы, делитесь опытом!',
                    image_url: '/webapp/assets/chat-main.jpg',
                    created_at: new Date('2024-01-01').toISOString(),
                    rules: [
                        'Уважайте мнение других участников',
                        'Запрещена реклама и спам',
                        'Обсуждайте только медицинские темы'
                    ],
                    moderators: [898508164],
                    is_public: true
                },
                {
                    id: 2,
                    name: 'Неврология: вопросы и ответы',
                    description: 'Чат для обсуждения вопросов по неврологии',
                    type: 'group',
                    participants_count: 456,
                    last_message: 'Кто-нибудь сталкивался с подобным случаем?',
                    image_url: '/webapp/assets/chat-neurology.jpg'
                }
            ]
        };
    }

    // Основные методы рендеринга
    renderPage(page, subPage = '') {
        if (this.isLoading) return;
        
        this.currentPage = page;
        this.currentSubPage = subPage;
        const mainContent = document.getElementById('mainContent');
        
        if (!mainContent) {
            console.error('❌ mainContent не найден');
            return;
        }

        // Обновляем активные кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Управление кнопкой "Назад" в Telegram
        if (window.Telegram && Telegram.WebApp) {
            if (page === 'home' && !subPage) {
                Telegram.WebApp.BackButton.hide();
            } else {
                Telegram.WebApp.BackButton.show();
            }
        }

        // Обновление title страницы
        this.updatePageTitle(page, subPage);

        // Отслеживание просмотра страницы
        this.trackEvent('page_view', {
            page: page,
            subPage: subPage,
            previousPage: this.previousPage
        });

        this.previousPage = page;

        try {
            const startTime = performance.now();
            
            mainContent.innerHTML = this.getPageHTML(page, subPage);
            this.initializePage(page);
            
            const renderTime = performance.now() - startTime;
            this.state.performanceMetrics.renderTime = renderTime;
            
            // Ленивая загрузка изображений
            this.lazyLoadImages();
            
        } catch (error) {
            console.error('Ошибка рендера страницы:', error);
            this.trackError('page_render_failed', error);
            this.showError('Ошибка отображения страницы');
        }
    }

    updatePageTitle(page, subPage = '') {
        const titles = {
            home: 'Академия АНБ - Главная',
            courses: 'Курсы - Академия АНБ',
            podcasts: 'Подкасты - Академия АНБ',
            streams: 'Эфиры - Академия АНБ',
            videos: 'Видео-шпаргалки - Академия АНБ',
            materials: 'Материалы - Академия АНБ',
            events: 'Мероприятия - Академия АНБ',
            promotions: 'Акции - Академия АНБ',
            community: 'Сообщество - Академия АНБ',
            chats: 'Чаты - Академия АНБ',
            favorites: 'Избранное - Академия АНБ',
            profile: 'Профиль - Академия АНБ',
            admin: 'Админ-панель - Академия АНБ'
        };

        let title = titles[page] || 'Академия АНБ';
        
        if (subPage) {
            title = `${subPage} - ${title}`;
        }

        document.title = title;
    }

    getPageHTML(page, subPage = '') {
        const pages = {
            home: this.createHomePage(),
            courses: subPage ? this.createCourseDetailPage(subPage) : this.createCoursesPage(),
            podcasts: this.createPodcastsPage(),
            streams: this.createStreamsPage(),
            videos: this.createVideosPage(),
            materials: this.createMaterialsPage(),
            events: this.createEventsPage(),
            promotions: this.createPromotionsPage(),
            community: this.createCommunityPage(),
            chats: subPage ? this.createChatDetailPage(subPage) : this.createChatsPage(),
            favorites: this.createFavoritesPage(),
            profile: this.createProfilePage(),
            admin: this.createAdminPage()
        };

        return pages[page] || this.createNotFoundPage();
    }

    initializePage(page) {
        const initializers = {
            admin: () => this.initAdminPage(),
            courses: () => this.initCoursesPage(),
            profile: () => this.initProfilePage(),
            chats: () => this.initChatsPage(),
            home: () => this.initHomePage()
        };

        if (initializers[page]) {
            initializers[page]();
        }

        // Инициализация общих компонентов
        this.initializeCommonComponents();
    }

    initializeCommonComponents() {
        // Инициализация tooltips
        this.initializeTooltips();
        
        // Инициализация модальных окон
        this.initializeModals();
        
        // Инициализация форм
        this.initializeForms();
        
        // Инициализация сортировки и фильтрации
        this.initializeSorting();
    }

    initializeTooltips() {
        // Инициализация всплывающих подсказок
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip.bind(this));
            element.addEventListener('mouseleave', this.hideTooltip.bind(this));
        });
    }

    initializeModals() {
        // Инициализация модальных окон
        const modalTriggers = document.querySelectorAll('[data-modal]');
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.dataset.modal;
                this.showModal(modalId);
            });
        });

        // Закрытие модальных окон
        const modalCloses = document.querySelectorAll('.modal-close, .modal-overlay');
        modalCloses.forEach(close => {
            close.addEventListener('click', (e) => {
                if (e.target === close) {
                    this.hideModal();
                }
            });
        });
    }

    initializeForms() {
        // Инициализация форм с валидацией
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
            
            // Валидация в реальном времени
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('blur', this.validateField.bind(this));
                input.addEventListener('input', this.clearFieldError.bind(this));
            });
        });
    }

    initializeSorting() {
        // Инициализация сортировки и фильтрации
        const sortSelects = document.querySelectorAll('select[data-sort]');
        sortSelects.forEach(select => {
            select.addEventListener('change', this.handleSortChange.bind(this));
        });

        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(button => {
            button.addEventListener('click', this.handleFilterClick.bind(this));
        });
    }

    // HOME PAGE
    createHomePage() {
        const stats = this.calculateHomeStats();
        const recentActivity = this.getRecentActivity();
        const recommendedCourses = this.getRecommendedCourses();
        
        return `
            <div class="page home-page">
                <div class="search-container">
                    <div class="search-wrapper">
                        <input type="text" 
                               placeholder="Поиск по курсам, материалам, эфирам..." 
                               class="search-input" 
                               id="searchInput"
                               value="${this.state.searchQuery}">
                        <button class="search-btn" onclick="app.handleSearch()">
                            <svg class="search-icon"><use xlink:href="#icon-search"></use></svg>
                        </button>
                    </div>
                </div>

                <div class="hero-section">
                    <div class="hero-background"></div>
                    <div class="hero-content">
                        <h2>Академия АНБ</h2>
                        <p>Современное образование для врачей</p>
                        <div class="hero-stats">
                            <div class="hero-stat">
                                <div class="stat-value">${stats.courses}+</div>
                                <div class="stat-label">Курсов</div>
                            </div>
                            <div class="hero-stat">
                                <div class="stat-value">${stats.students}+</div>
                                <div class="stat-label">Студентов</div>
                            </div>
                            <div class="hero-stat">
                                <div class="stat-value">${stats.experts}</div>
                                <div class="stat-label">Экспертов</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.currentUser?.progress ? `
                <div class="progress-section">
                    <h3>Ваш прогресс</h3>
                    <div class="progress-cards">
                        <div class="progress-card">
                            <div class="progress-icon">📚</div>
                            <div class="progress-info">
                                <div class="progress-value">${this.currentUser.progress.steps.coursesBought}</div>
                                <div class="progress-label">Курсов</div>
                            </div>
                        </div>
                        <div class="progress-card">
                            <div class="progress-icon">🎯</div>
                            <div class="progress-info">
                                <div class="progress-value">${this.currentUser.progress.steps.modulesCompleted}</div>
                                <div class="progress-label">Модулей</div>
                            </div>
                        </div>
                        <div class="progress-card">
                            <div class="progress-icon">⏱️</div>
                            <div class="progress-info">
                                <div class="progress-value">${Math.round(this.currentUser.progress.statistics.total_time_spent / 3600)}</div>
                                <div class="progress-label">Часов</div>
                            </div>
                        </div>
                    </div>
                    <div class="level-progress">
                        <div class="level-info">
                            <span class="level-name">${this.currentUser.progress.level}</span>
                            <span class="level-exp">${this.currentUser.progress.experience}/${this.currentUser.progress.level_threshold} XP</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentUser.progress.experience / this.currentUser.progress.level_threshold) * 100}%"></div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="navigation-grid">
                    ${this.createNavCard('courses', '📚', 'Курсы', this.allContent.courses?.length || 0, 'Доступные обучающие программы')}
                    ${this.createNavCard('podcasts', '🎧', 'АНБ FM', this.allContent.podcasts?.length || 0, 'Аудио подкасты и интервью')}
                    ${this.createNavCard('streams', '📹', 'Эфиры', this.allContent.streams?.length || 0, 'Прямые трансляции и разборы')}
                    ${this.createNavCard('videos', '🎯', 'Видео-шпаргалки', this.allContent.videos?.length || 0, 'Короткие обучающие видео')}
                    ${this.createNavCard('materials', '📋', 'Материалы', this.allContent.materials?.length || 0, 'Практические руководства и схемы')}
                    ${this.createNavCard('events', '🗺️', 'Мероприятия', this.allContent.events?.length || 0, 'Конференции и воркшопы')}
                    ${this.createNavCard('promotions', '🎁', 'Акции', this.allContent.promotions?.length || 0, 'Специальные предложения')}
                    ${this.createNavCard('community', '👥', 'Сообщество', '', 'Общение с коллегами')}
                </div>

                ${recommendedCourses.length > 0 ? `
                <div class="recommended-section">
                    <div class="section-header">
                        <h3>Рекомендуемые курсы</h3>
                        <a href="javascript:void(0)" onclick="app.renderPage('courses')" class="see-all">Все курсы →</a>
                    </div>
                    <div class="recommended-grid">
                        ${recommendedCourses.slice(0, 3).map(course => `
                            <div class="course-card featured" onclick="app.openCourseDetail(${course.id})">
                                <div class="card-badge">Рекомендуем</div>
                                <div class="card-image">
                                    <img src="${course.image_url}" alt="${course.title}" 
                                         onerror="this.src='/webapp/assets/course-default.jpg'">
                                    <div class="card-overlay">
                                        <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                                data-id="${course.id}" 
                                                data-type="courses"
                                                onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                            <svg class="heart-icon"><use xlink:href="#icon-heart"></use></svg>
                                        </button>
                                    </div>
                                </div>
                                <div class="card-content">
                                    <h3 class="card-title">${course.title}</h3>
                                    <p class="card-description">${course.description}</p>
                                    <div class="card-meta">
                                        <span class="meta-item">⏱️ ${course.duration}</span>
                                        <span class="meta-item">💰 ${this.formatPrice(course.price)}</span>
                                        <span class="meta-item">⭐ ${course.rating}</span>
                                    </div>
                                    <div class="card-actions">
                                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.purchaseCourse(${course.id})">
                                            Подробнее
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${recentActivity.length > 0 ? this.createRecentActivity(recentActivity) : ''}

                <div class="quick-actions">
                    <h3>Быстрые действия</h3>
                    <div class="actions-grid">
                        <button class="action-btn" onclick="app.renderPage('favorites')">
                            <div class="action-icon">❤️</div>
                            <div class="action-text">Избранное</div>
                        </button>
                        <button class="action-btn" onclick="app.renderPage('profile')">
                            <div class="action-icon">👤</div>
                            <div class="action-text">Профиль</div>
                        </button>
                        <button class="action-btn" onclick="app.showSupport()">
                            <div class="action-icon">🆘</div>
                            <div class="action-text">Поддержка</div>
                        </button>
                        ${this.isAdmin ? `
                        <button class="action-btn" onclick="app.renderPage('admin')">
                            <div class="action-icon">🔧</div>
                            <div class="action-text">Админ</div>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    createNavCard(section, icon, title, count, description = '') {
        return `
            <div class="nav-card" data-section="${section}" data-tooltip="${description}">
                <div class="nav-icon">${icon}</div>
                <div class="nav-content">
                    <div class="nav-title">${title}</div>
                    ${description ? `<div class="nav-description">${description}</div>` : ''}
                </div>
                ${count ? `<div class="nav-badge">${count}</div>` : ''}
            </div>
        `;
    }

    calculateHomeStats() {
        return {
            courses: this.allContent.courses?.length || 0,
            students: this.allContent.courses?.reduce((sum, course) => sum + (course.students_count || 0), 0) || 0,
            materials: this.allContent.materials?.length || 0,
            experts: 25
        };
    }

    getRecentActivity() {
        // В реальном приложении здесь будут данные из API
        return [
            {
                type: 'course_start',
                title: 'Начат курс "Мануальные техники"',
                time: '2 часа назад',
                icon: '📚'
            },
            {
                type: 'podcast_listen',
                title: 'Прослушан подкаст "Современная неврология"',
                time: 'Вчера',
                icon: '🎧'
            },
            {
                type: 'material_download',
                title: 'Скачан материал "МРТ разбор"',
                time: '2 дня назад',
                icon: '📋'
            }
        ];
    }

    getRecommendedCourses() {
        return this.allContent.courses
            ?.filter(course => course.featured || course.popular)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 6) || [];
    }

    createRecentActivity(activities) {
        return `
            <div class="recent-activity">
                <h3>Последняя активность</h3>
                <div class="activity-list">
                    ${activities.map(activity => `
                        <div class="activity-item">
                            <div class="activity-icon">${activity.icon}</div>
                            <div class="activity-info">
                                <div class="activity-title">${activity.title}</div>
                                <div class="activity-time">${activity.time}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    initHomePage() {
        // Инициализация домашней страницы
        this.setupSearchHandler();
        this.setupNavigationHandlers();
    }

    setupSearchHandler() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let timeoutId;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    this.state.searchQuery = e.target.value;
                    this.handleSearch();
                }, this.config.DEBOUNCE_DELAY);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
    }

    setupNavigationHandlers() {
        const navCards = document.querySelectorAll('.nav-card');
        navCards.forEach(card => {
            card.addEventListener('click', () => {
                const section = card.dataset.section;
                this.trackEvent('nav_card_click', { section });
                this.renderPage(section);
            });
        });
    }

    // COURSES PAGE
    createCoursesPage() {
        const courses = this.allContent.courses || [];
        const filteredCourses = this.filterContent(courses, 'courses');
        const categories = this.getUniqueCategories(courses);
        
        return `
            <div class="page courses-page">
                <div class="page-header">
                    <h2>📚 Курсы</h2>
                    <div class="header-actions">
                        <div class="view-toggle">
                            <button class="view-btn ${this.state.viewMode === 'grid' ? 'active' : ''}" 
                                    onclick="app.toggleViewMode('grid')" data-tooltip="Сетка">
                                ▦
                            </button>
                            <button class="view-btn ${this.state.viewMode === 'list' ? 'active' : ''}" 
                                    onclick="app.toggleViewMode('list')" data-tooltip="Список">
                                ☰
                            </button>
                        </div>
                        ${this.isAdmin ? `
                        <button class="btn btn-primary" onclick="app.showAddContentForm('courses')">
                            ➕ Добавить курс
                        </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="page-controls">
                    <div class="filter-section">
                        <div class="filter-group">
                            <label>Категория:</label>
                            <select class="filter-select" onchange="app.filterContent(this.value, 'courses')">
                                <option value="all">Все категории</option>
                                ${categories.map(cat => `
                                    <option value="${cat}" ${this.state.activeFilters.courses === cat ? 'selected' : ''}>
                                        ${cat}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label>Уровень:</label>
                            <select class="filter-select" onchange="app.filterByLevel(this.value, 'courses')">
                                <option value="all">Все уровни</option>
                                <option value="beginner">Начинающий</option>
                                <option value="intermediate">Средний</option>
                                <option value="advanced">Продвинутый</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label>Сортировка:</label>
                            <select class="filter-select" onchange="app.sortContent(this.value, 'courses')">
                                <option value="newest">Сначала новые</option>
                                <option value="popular">По популярности</option>
                                <option value="rating">По рейтингу</option>
                                <option value="price_low">Сначала дешевые</option>
                                <option value="price_high">Сначала дорогие</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="results-info">
                        <span class="results-count">Найдено: ${filteredCourses.length} курсов</span>
                        ${this.state.searchQuery ? `
                            <span class="search-query">По запросу: "${this.state.searchQuery}"</span>
                            <button class="btn btn-outline btn-small" onclick="app.clearSearch()">Очистить</button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="content-container ${this.state.viewMode}">
                    ${filteredCourses.length > 0 ? 
                        this.renderCoursesGrid(filteredCourses) : 
                        this.createEmptyState('courses')
                    }
                </div>
                
                ${filteredCourses.length > 12 ? `
                <div class="pagination">
                    <button class="pagination-btn" disabled>← Назад</button>
                    <span class="pagination-info">Страница 1 из 2</span>
                    <button class="pagination-btn">Вперед →</button>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderCoursesGrid(courses) {
        if (this.state.viewMode === 'list') {
            return this.renderCoursesList(courses);
        }

        return `
            <div class="content-grid">
                ${courses.map(course => `
                    <div class="content-card course-card" onclick="app.openCourseDetail(${course.id})">
                        ${course.discount > 0 ? `
                            <div class="discount-badge">-${course.discount}%</div>
                        ` : ''}
                        ${course.featured ? `
                            <div class="featured-badge">Рекомендуем</div>
                        ` : ''}
                        ${course.new ? `
                            <div class="new-badge">Новый</div>
                        ` : ''}
                        
                        <div class="card-image">
                            <img src="${course.image_url}" alt="${course.title}" 
                                 onerror="this.src='/webapp/assets/course-default.jpg'">
                            <div class="card-overlay">
                                <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                        data-id="${course.id}" 
                                        data-type="courses"
                                        onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                    <svg class="heart-icon"><use xlink:href="#icon-heart"></use></svg>
                                </button>
                                <button class="preview-btn" onclick="event.stopPropagation(); app.previewCourse(${course.id})">
                                    👁️
                                </button>
                            </div>
                        </div>
                        <div class="card-content">
                            <div class="card-category">${course.category}</div>
                            <h3 class="card-title">${course.title}</h3>
                            <p class="card-description">${course.description}</p>
                            
                            <div class="card-meta">
                                <span class="meta-item" data-tooltip="Длительность курса">
                                    ⏱️ ${course.duration}
                                </span>
                                <span class="meta-item" data-tooltip="Количество модулей">
                                    📦 ${course.modules} модулей
                                </span>
                                <span class="meta-item" data-tooltip="Рейтинг курса">
                                    ⭐ ${course.rating}
                                </span>
                                <span class="meta-item" data-tooltip="Количество студентов">
                                    👥 ${course.students_count}
                                </span>
                            </div>
                            
                            <div class="card-level">
                                <span class="level-badge level-${course.level}">${this.getLevelName(course.level)}</span>
                            </div>
                            
                            <div class="card-footer">
                                <div class="price-section">
                                    ${course.discount > 0 ? `
                                        <div class="price-original">${this.formatPrice(course.original_price)}</div>
                                    ` : ''}
                                    <div class="price-current">${this.formatPrice(course.price)}</div>
                                </div>
                                <div class="card-actions">
                                    <button class="btn btn-primary btn-small" 
                                            onclick="event.stopPropagation(); app.purchaseCourse(${course.id})">
                                        Подробнее
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderCoursesList(courses) {
        return `
            <div class="content-list">
                ${courses.map(course => `
                    <div class="list-item course-item" onclick="app.openCourseDetail(${course.id})">
                        <div class="item-image">
                            <img src="${course.image_url}" alt="${course.title}"
                                 onerror="this.src='/webapp/assets/course-default.jpg'">
                            ${course.discount > 0 ? `
                                <div class="discount-badge">-${course.discount}%</div>
                            ` : ''}
                        </div>
                        <div class="item-content">
                            <div class="item-header">
                                <div class="item-category">${course.category}</div>
                                <button class="favorite-btn ${this.isFavorite(course.id, 'courses') ? 'active' : ''}" 
                                        onclick="event.stopPropagation(); app.toggleFavorite(${course.id}, 'courses')">
                                    <svg class="heart-icon"><use xlink:href="#icon-heart"></use></svg>
                                </button>
                            </div>
                            <h3 class="item-title">${course.title}</h3>
                            <p class="item-description">${course.description}</p>
                            
                            <div class="item-meta">
                                <span class="meta-item">⏱️ ${course.duration}</span>
                                <span class="meta-item">📦 ${course.modules} модулей</span>
                                <span class="meta-item">⭐ ${course.rating}</span>
                                <span class="meta-item">👥 ${course.students_count}</span>
                                <span class="meta-item level-${course.level}">${this.getLevelName(course.level)}</span>
                            </div>
                        </div>
                        <div class="item-actions">
                            <div class="price-section">
                                ${course.discount > 0 ? `
                                    <div class="price-original">${this.formatPrice(course.original_price)}</div>
                                ` : ''}
                                <div class="price-current">${this.formatPrice(course.price)}</div>
                            </div>
                            <button class="btn btn-primary" 
                                    onclick="event.stopPropagation(); app.purchaseCourse(${course.id})">
                                Подробнее
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // COURSE DETAIL PAGE
    createCourseDetailPage(courseId) {
        const course = this.allContent.courses?.find(c => c.id == courseId);
        if (!course) return this.createNotFoundPage('Курс не найден');

        const isEnrolled = this.isCourseEnrolled(courseId);
        const progress = this.getCourseProgress(courseId);
        const reviews = course.reviews || [];
        const curriculum = course.curriculum || [];

        return `
            <div class="page course-detail-page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.renderPage('courses')">
                        ← Назад к курсам
                    </button>
                    <div class="header-actions">
                        <button class="btn btn-outline" onclick="app.toggleFavorite(${course.id}, 'courses')">
                            ${this.isFavorite(course.id, 'courses') ? '❤️ В избранном' : '🤍 В избранное'}
                        </button>
                        <button class="btn btn-outline" onclick="app.shareContent('course', ${course.id})">
                            📤 Поделиться
                        </button>
                    </div>
                </div>
                
                <div class="detail-container">
                    <div class="detail-hero">
                        <div class="hero-image">
                            <img src="${course.image_url}" alt="${course.title}" 
                                 onerror="this.src='/webapp/assets/course-default.jpg'">
                            ${course.discount > 0 ? `
                                <div class="discount-badge large">-${course.discount}%</div>
                            ` : ''}
                            ${course.featured ? `
                                <div class="featured-badge large">Рекомендуем</div>
                            ` : ''}
                        </div>
                        
                        <div class="hero-content">
                            <div class="course-category">${course.category}</div>
                            <h1>${course.title}</h1>
                            <p class="course-subtitle">${course.subtitle || ''}</p>
                            <p class="course-description">${course.full_description || course.description}</p>
                            
                            <div class="course-meta-grid">
                                <div class="meta-item">
                                    <div class="meta-icon">⏱️</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.duration}</div>
                                        <div class="meta-label">Длительность</div>
                                    </div>
                                </div>
                                <div class="meta-item">
                                    <div class="meta-icon">📦</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.modules}</div>
                                        <div class="meta-label">Модулей</div>
                                    </div>
                                </div>
                                <div class="meta-item">
                                    <div class="meta-icon">🎯</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.lessons}</div>
                                        <div class="meta-label">Уроков</div>
                                    </div>
                                </div>
                                <div class="meta-item">
                                    <div class="meta-icon">⭐</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.rating}</div>
                                        <div class="meta-label">Рейтинг</div>
                                    </div>
                                </div>
                                <div class="meta-item">
                                    <div class="meta-icon">👥</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.students_count}</div>
                                        <div class="meta-label">Студентов</div>
                                    </div>
                                </div>
                                <div class="meta-item">
                                    <div class="meta-icon">🎓</div>
                                    <div class="meta-content">
                                        <div class="meta-value">${course.success_rate}%</div>
                                        <div class="meta-label">Успеваемость</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="course-level">
                                <span class="level-badge level-${course.level}">${this.getLevelName(course.level)}</span>
                                <span class="difficulty">Сложность: ${this.getDifficultyName(course.difficulty)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-tabs">
                        <button class="tab-btn active" data-tab="curriculum">Программа</button>
                        <button class="tab-btn" data-tab="reviews">Отзывы (${reviews.length})</button>
                        <button class="tab-btn" data-tab="instructor">Преподаватель</button>
                        <button class="tab-btn" data-tab="faq">FAQ</button>
                    </div>

                    <div class="tab-content active" id="curriculumTab">
                        <h3>Программа курса</h3>
                        ${curriculum.length > 0 ? `
                            <div class="curriculum-list">
                                ${curriculum.map((module, index) => `
                                    <div class="module-item ${module.completed ? 'completed' : ''}">
                                        <div class="module-header">
                                            <div class="module-number">${index + 1}</div>
                                            <div class="module-info">
                                                <h4 class="module-title">${module.title}</h4>
                                                <div class="module-meta">
                                                    <span>${module.duration}</span>
                                                    <span>${module.lessons.length} уроков</span>
                                                    ${module.completed ? '<span class="completed-badge">✓ Завершено</span>' : ''}
                                                </div>
                                            </div>
                                            <div class="module-toggle">▶</div>
                                        </div>
                                        <div class="module-content">
                                            <div class="lessons-list">
                                                ${module.lessons.map(lesson => `
                                                    <div class="lesson-item ${lesson.completed ? 'completed' : ''}">
                                                        <div class="lesson-checkbox">
                                                            ${lesson.completed ? '✓' : '○'}
                                                        </div>
                                                        <div class="lesson-info">
                                                            <div class="lesson-title">${lesson.title}</div>
                                                            <div class="lesson-meta">
                                                                <span>${lesson.duration} мин</span>
                                                                <span class="lesson-type">${this.getLessonTypeName(lesson.type)}</span>
                                                                ${lesson.resources > 0 ? `<span>${lesson.resources} материалов</span>` : ''}
                                                            </div>
                                                        </div>
                                                        <div class="lesson-actions">
                                                            ${isEnrolled ? `
                                                                <button class="btn btn-outline btn-small" 
                                                                        onclick="app.startLesson(${lesson.id})">
                                                                    ${lesson.completed ? 'Повторить' : 'Начать'}
                                                                </button>
                                                            ` : `
                                                                <span class="locked-badge">🔒</span>
                                                            `}
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-icon">📚</div>
                                <div class="empty-text">Программа курса пока не добавлена</div>
                            </div>
                        `}
                    </div>

                    <div class="tab-content" id="reviewsTab">
                        <h3>Отзывы студентов</h3>
                        ${reviews.length > 0 ? `
                            <div class="reviews-list">
                                ${reviews.map(review => `
                                    <div class="review-item">
                                        <div class="review-header">
                                            <div class="reviewer-info">
                                                <div class="reviewer-avatar">${review.user_name.charAt(0)}</div>
                                                <div class="reviewer-details">
                                                    <div class="reviewer-name">${review.user_name}</div>
                                                    <div class="review-date">${this.formatDate(review.date)}</div>
                                                </div>
                                            </div>
                                            <div class="review-rating">
                                                ${'⭐'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                                            </div>
                                        </div>
                                        <div class="review-content">
                                            <p>${review.comment}</p>
                                        </div>
                                        ${review.verified ? `
                                            <div class="review-verified">✓ Проверенный отзыв</div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-icon">💬</div>
                                <div class="empty-text">Пока нет отзывов</div>
                                <button class="btn btn-primary" onclick="app.writeReview(${course.id})">
                                    Написать первый отзыв
                                </button>
                            </div>
                        `}
                    </div>

                    <div class="purchase-section">
                        <div class="pricing-card">
                            <div class="pricing-header">
                                <h3>${isEnrolled ? 'Доступ к курсу открыт' : 'Приобрести курс'}</h3>
                                ${!isEnrolled && course.discount > 0 ? `
                                    <div class="discount-timer">
                                        ⏰ Скидка действует до: ${this.formatDate(course.discount_end_date)}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="price-display">
                                ${course.discount > 0 ? `
                                    <div class="original-price">${this.formatPrice(course.original_price)}</div>
                                ` : ''}
                                <div class="current-price">${this.formatPrice(course.price)}</div>
                            </div>
                            
                            <div class="features-list">
                                <div class="feature-item">✓ Доступ ко всем материалам курса</div>
                                <div class="feature-item">✓ Сертификат о завершении</div>
                                <div class="feature-item">✓ Поддержка преподавателя</div>
                                <div class="feature-item">✓ Доступ в закрытый чат</div>
                                <div class="feature-item">✓ Пожизненный доступ</div>
                            </div>
                            
                            <div class="purchase-actions">
                                ${isEnrolled ? `
                                    <button class="btn btn-success btn-large" onclick="app.continueLearning(${course.id})">
                                        🎯 Продолжить обучение
                                    </button>
                                    <div class="progress-info">
                                        <div class="progress-text">Прогресс: ${progress}%</div>
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${progress}%"></div>
                                        </div>
                                    </div>
                                ` : `
                                    <button class="btn btn-primary btn-large" onclick="app.purchaseCourse(${course.id})">
                                        💳 Купить курс
                                    </button>
                                    <button class="btn btn-outline" onclick="app.addToCart(${course.id})">
                                        🛒 В корзину
                                    </button>
                                `}
                            </div>
                            
                            ${!isEnrolled ? `
                                <div class="guarantee-badge">
                                    ✅ 14-дневная гарантия возврата
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

       // Вспомогательные методы для работы с контентом
    filterContent(items, type) {
        let filtered = items;
        
        // Фильтрация по поисковому запросу
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query)
            );
        }

        // Фильтрация по категории
        if (this.state.activeFilters[type]) {
            const filter = this.state.activeFilters[type];
            if (filter !== 'all') {
                filtered = filtered.filter(item => item.category === filter);
            }
        }

        // Сортировка
        filtered = this.sortItems(filtered, this.state.sortBy);

        return filtered;
    }

    sortItems(items, sortBy) {
        const sorted = [...items];
        
        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'popular':
                return sorted.sort((a, b) => (b.students_count || 0) - (a.students_count || 0));
            case 'rating':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'price_low':
                return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
            case 'price_high':
                return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
            default:
                return sorted;
        }
    }

    getUniqueCategories(items) {
        const categories = new Set();
        items.forEach(item => {
            if (item.category) {
                categories.add(item.category);
            }
        });
        return Array.from(categories);
    }

    getLevelName(level) {
        const levels = {
            'beginner': 'Начинающий',
            'intermediate': 'Средний',
            'advanced': 'Продвинутый'
        };
        return levels[level] || level;
    }

    getDifficultyName(difficulty) {
        const difficulties = {
            'easy': 'Низкая',
            'medium': 'Средняя',
            'hard': 'Высокая'
        };
        return difficulties[difficulty] || difficulty;
    }

    getLessonTypeName(type) {
        const types = {
            'video': 'Видео',
            'audio': 'Аудио',
            'text': 'Текст',
            'quiz': 'Тест',
            'assignment': 'Задание'
        };
        return types[type] || type;
    }

    isCourseEnrolled(courseId) {
        // В реальном приложении здесь будет проверка через API
        return this.currentUser?.progress?.steps?.coursesBought?.includes(courseId) || false;
    }

    getCourseProgress(courseId) {
        // В реальном приложении здесь будет расчет прогресса
        return 35; // Пример: 35% завершено
    }

    // Методы для работы с избранным
    isFavorite(contentId, contentType) {
        return this.state.favorites[contentType]?.includes(parseInt(contentId)) || false;
    }

    async toggleFavorite(contentId, contentType) {
        try {
            const response = await this.apiCall('/api/favorites/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    contentId: contentId,
                    contentType: contentType
                })
            });

            if (response.success) {
                this.state.favorites = response.favorites;
                this.saveSettings();
                this.showNotification(
                    this.isFavorite(contentId, contentType) ? 'Добавлено в избранное' : 'Удалено из избранного',
                    'success'
                );
                this.renderPage(this.currentPage, this.currentSubPage);
                
                this.trackEvent('favorite_toggled', {
                    contentId,
                    contentType,
                    action: this.isFavorite(contentId, contentType) ? 'added' : 'removed'
                });
            }
        } catch (error) {
            console.error('Ошибка обновления избранного:', error);
            this.showNotification('Ошибка при обновлении избранного', 'error');
        }
    }

    // Методы навигации
    openCourseDetail(courseId) {
        this.trackEvent('course_opened', { courseId });
        this.renderPage('courses', courseId);
    }

    openChatDetail(chatId) {
        this.renderPage('chats', chatId);
    }

    // Методы для работы с UI
    toggleViewMode(mode) {
        this.state.viewMode = mode;
        this.saveSettings();
        this.renderPage(this.currentPage, this.currentSubPage);
    }

    handleSearch() {
        this.trackEvent('search_performed', { query: this.state.searchQuery });
        this.renderPage(this.currentPage);
    }

    clearSearch() {
        this.state.searchQuery = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        this.renderPage(this.currentPage);
    }

    filterContent(filter, type) {
        this.state.activeFilters[type] = filter === 'all' ? null : filter;
        this.renderPage(this.currentPage);
    }

    filterByLevel(level, type) {
        this.state.activeFilters[`${type}_level`] = level === 'all' ? null : level;
        this.renderPage(this.currentPage);
    }

    sortContent(sortBy, type) {
        this.state.sortBy = sortBy;
        this.renderPage(this.currentPage);
    }

    // Методы для работы с модальными окнами
    showModal(modalId, options = {}) {
        const modalHTML = this.getModalHTML(modalId, options);
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.id = 'modalOverlay';
        modalOverlay.innerHTML = modalHTML;
        
        document.body.appendChild(modalOverlay);
        
        // Анимация появления
        setTimeout(() => {
            modalOverlay.classList.add('visible');
        }, 10);

        // Закрытие по ESC
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        };
        document.addEventListener('keydown', closeHandler);
        
        this.currentModal = {
            id: modalId,
            closeHandler: closeHandler
        };
    }

    hideModal() {
        const modal = document.getElementById('modalOverlay');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
        
        if (this.currentModal?.closeHandler) {
            document.removeEventListener('keydown', this.currentModal.closeHandler);
        }
        
        this.currentModal = null;
    }

    getModalHTML(modalId, options) {
        const modals = {
            'add-course': this.getAddCourseModal(),
            'add-content': this.getAddContentModal(options.type),
            'purchase': this.getPurchaseModal(options.courseId),
            'profile-edit': this.getProfileEditModal(),
            'settings': this.getSettingsModal()
        };

        return modals[modalId] || '<div class="modal">Модальное окно не найдено</div>';
    }

    getAddCourseModal() {
        return `
            <div class="modal">
                <div class="modal-header">
                    <h3>📚 Добавить новый курс</h3>
                    <button class="modal-close" onclick="app.hideModal()">×</button>
                </div>
                <div class="modal-content">
                    <form id="addCourseForm" class="modal-form">
                        <div class="form-group">
                            <label for="courseTitle">Название курса *</label>
                            <input type="text" id="courseTitle" name="title" required>
                        </div>
                        <div class="form-group">
                            <label for="courseDescription">Описание *</label>
                            <textarea id="courseDescription" name="description" required></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="courseCategory">Категория *</label>
                                <select id="courseCategory" name="category" required>
                                    <option value="">Выберите категорию</option>
                                    <option value="Неврология">Неврология</option>
                                    <option value="Мануальные техники">Мануальные техники</option>
                                    <option value="Реабилитация">Реабилитация</option>
                                    <option value="Диагностика">Диагностика</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="courseLevel">Уровень *</label>
                                <select id="courseLevel" name="level" required>
                                    <option value="beginner">Начинающий</option>
                                    <option value="intermediate">Средний</option>
                                    <option value="advanced">Продвинутый</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="coursePrice">Цена (руб) *</label>
                                <input type="number" id="coursePrice" name="price" min="0" required>
                            </div>
                            <div class="form-group">
                                <label for="courseDuration">Длительность</label>
                                <input type="text" id="courseDuration" name="duration" placeholder="например, 8 недель">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="courseImage">Изображение курса</label>
                            <input type="file" id="courseImage" name="image" accept="image/*">
                            <div class="file-hint">Рекомендуемый размер: 800x450px</div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="app.hideModal()">Отмена</button>
                            <button type="submit" class="btn btn-primary">Добавить курс</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Методы для работы с уведомлениями
    showNotification(message, type = 'info', options = {}) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[type] || 'ℹ️';

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${message}</div>
                ${options.action ? `
                    <button class="notification-action" onclick="${options.onAction}">
                        ${options.action}
                    </button>
                ` : ''}
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Автоматическое скрытие
        if (!options.persistent) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }, options.duration || 5000);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showLoading(message = 'Загрузка...') {
        this.isLoading = true;
        
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.id = 'loadingOverlay';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        document.body.appendChild(loading);
    }

    hideLoading() {
        this.isLoading = false;
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.remove();
        }
    }

    showSkeletonLoading() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="skeleton-loading">
                <div class="skeleton-search"></div>
                <div class="skeleton-hero">
                    <div class="skeleton-hero-image"></div>
                    <div class="skeleton-hero-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                        <div class="skeleton-stats">
                            <div class="skeleton-stat"></div>
                            <div class="skeleton-stat"></div>
                            <div class="skeleton-stat"></div>
                        </div>
                    </div>
                </div>
                <div class="skeleton-nav-grid">
                    ${Array(8).fill(0).map(() => `
                        <div class="skeleton-nav-card">
                            <div class="skeleton-icon"></div>
                            <div class="skeleton-nav-content">
                                <div class="skeleton-nav-title"></div>
                                <div class="skeleton-nav-description"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    hideSkeletonLoading() {
        const skeleton = document.querySelector('.skeleton-loading');
        if (skeleton) {
            skeleton.style.opacity = '0';
            setTimeout(() => {
                if (skeleton.parentElement) {
                    skeleton.remove();
                }
            }, 300);
        }
    }

    // Методы для работы с Telegram
    handleBackButton() {
        if (this.currentSubPage) {
            this.currentSubPage = '';
            this.renderPage(this.currentPage);
        } else if (this.currentPage !== 'home') {
            this.renderPage('home');
        } else {
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.close();
            }
        }
    }

    showTelegramMenu() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: 'Быстрое меню',
                message: 'Выберите действие:',
                buttons: [
                    { id: 'profile', type: 'default', text: '👤 Профиль' },
                    { id: 'courses', type: 'default', text: '📚 Курсы' },
                    { id: 'favorites', type: 'default', text: '❤️ Избранное' },
                    { id: 'support', type: 'default', text: '💬 Поддержка' },
                    { type: 'cancel', text: 'Закрыть' }
                ]
            }, (buttonId) => {
                if (buttonId === 'profile') this.renderPage('profile');
                if (buttonId === 'courses') this.renderPage('courses');
                if (buttonId === 'favorites') this.renderPage('favorites');
                if (buttonId === 'support') this.showSupport();
            });
        } else {
            this.showNotification('Меню доступно в Telegram приложении', 'info');
        }
    }

    // Методы для аналитики и отслеживания
    trackEvent(eventName, properties = {}) {
        if (!this.config.ANALYTICS_TRACKING) return;

        const event = {
            event: eventName,
            properties: {
                timestamp: new Date().toISOString(),
                user_id: this.currentUser?.id,
                session_id: this.getSessionId(),
                ...properties
            }
        };

        this.analyticsEvents.push(event);
        
        // Локальное логирование для отладки
        if (this.config.NODE_ENV === 'development') {
            console.log(`📊 Analytics: ${eventName}`, properties);
        }
    }

    trackError(errorType, error, context = {}) {
        if (!this.config.ERROR_REPORTING) return;

        const errorReport = {
            type: errorType,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context: {
                timestamp: new Date().toISOString(),
                user_id: this.currentUser?.id,
                current_page: this.currentPage,
                user_agent: navigator.userAgent,
                ...context
            }
        };

        this.errorReports.push(errorReport);
        
        // В реальном приложении здесь будет отправка в сервис мониторинга ошибок
        console.error(`🚨 Error: ${errorType}`, errorReport);
    }

    flushAnalytics() {
        if (this.analyticsEvents.length === 0) return;

        // В реальном приложении здесь будет отправка аналитики на сервер
        if (this.config.NODE_ENV === 'development') {
            console.log(`📊 Flushing ${this.analyticsEvents.length} analytics events`);
        }

        this.analyticsEvents = [];
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('anb_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('anb_session_id', sessionId);
        }
        return sessionId;
    }

    // Вспомогательные методы форматирования
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formatDuration(minutes) {
        if (minutes < 60) {
            return `${minutes} мин`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
        }
    }

    // Методы для ленивой загрузки
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    this.intersectionObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });
    }

    lazyLoadImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.intersectionObserver.observe(img);
        });
    }

    setupResizeObserver() {
        if (!('ResizeObserver' in window)) return;

        this.resizeObserver = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                // Адаптация интерфейса к изменению размера окна
                this.handleResize(entry.contentRect);
            });
        });

        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            this.resizeObserver.observe(mainContent);
        }
    }

    handleResize(rect) {
        // Адаптация интерфейса при изменении размера
        const isMobile = rect.width < 768;
        
        if (isMobile !== this.state.isMobile) {
            this.state.isMobile = isMobile;
            // При необходимости можно перерисовать интерфейс
        }
    }

    setupVisibilityChangeHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('app_backgrounded');
            } else {
                this.trackEvent('app_foregrounded');
            }
        });
    }

    // Заглушки для будущей функциональности
    showAddContentForm(type) {
        this.showModal('add-content', { type });
    }

    purchaseCourse(courseId) {
        this.showNotification('💳 Функция покупки в разработке', 'info');
        this.trackEvent('purchase_attempted', { courseId });
    }

    previewCourse(courseId) {
        this.showNotification('👁️ Функция предпросмотра в разработке', 'info');
    }

    startLesson(lessonId) {
        this.showNotification('🎬 Запуск урока в разработке', 'info');
    }

    continueLearning(courseId) {
        this.showNotification('🎯 Продолжение обучения в разработке', 'info');
    }

    addToCart(courseId) {
        this.state.cart.push(courseId);
        this.showNotification('🛒 Курс добавлен в корзину', 'success');
        this.trackEvent('cart_updated', { courseId, action: 'added' });
    }

    writeReview(courseId) {
        this.showNotification('✍️ Функция написания отзывов в разработке', 'info');
    }

    shareContent(type, id) {
        if (navigator.share) {
            navigator.share({
                title: 'Академия АНБ',
                text: 'Посмотрите этот контент в Академии АНБ',
                url: `${window.location.origin}/${type}/${id}`
            }).then(() => {
                this.trackEvent('content_shared', { type, id });
            }).catch(() => {
                this.showNotification('Поделиться не удалось', 'error');
            });
        } else {
            this.showNotification('Функция "Поделиться" не поддерживается', 'info');
        }
    }

    showSupport() {
        this.showNotification('💬 Поддержка: @anb_academy_support\n📧 support@anb-academy.ru', 'info', { persistent: true });
    }

    // Инициализация конкретных страниц
    initAdminPage() {
        console.log('🔧 Инициализация админ-панели');
        this.setupAdminTabs();
    }

    initCoursesPage() {
        console.log('📚 Инициализация страницы курсов');
        this.setupCourseFilters();
    }

    initProfilePage() {
        console.log('👤 Инициализация профиля');
        this.setupProfileForms();
    }

    initChatsPage() {
        console.log('💬 Инициализация чатов');
        this.setupChatHandlers();
    }

    initHomePage() {
        console.log('🏠 Инициализация домашней страницы');
        this.setupHomeInteractions();
    }

    setupAdminTabs() {
        const tabButtons = document.querySelectorAll('.admin-tab');
        const tabContents = document.querySelectorAll('.admin-tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                // Обновляем активные кнопки
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Показываем соответствующий контент
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`) {
                        content.classList.add('active');
                    }
                });
                
                this.trackEvent('admin_tab_switched', { tab: tabName });
            });
        });
    }

    setupCourseFilters() {
        // Дополнительная инициализация фильтров курсов
    }

    setupProfileForms() {
        // Инициализация форм профиля
    }

    setupChatHandlers() {
        // Инициализация обработчиков чатов
    }

    setupHomeInteractions() {
        // Дополнительные взаимодействия на домашней странице
    }

    // Создание остальных страниц (кратко)
    createPodcastsPage() {
        const podcasts = this.allContent.podcasts || [];
        return `
            <div class="page">
                <div class="page-header">
                    <h2>🎧 АНБ FM</h2>
                    ${this.isAdmin ? `
                    <button class="btn btn-primary" onclick="app.showAddContentForm('podcasts')">
                        ➕ Добавить подкаст
                    </button>
                    ` : ''}
                </div>
                <div class="content-grid">
                    ${podcasts.map(podcast => this.createPodcastCard(podcast)).join('')}
                </div>
            </div>
        `;
    }

    createPodcastCard(podcast) {
        return `
            <div class="content-card podcast-card">
                <div class="card-image">
                    <img src="${podcast.image_url}" alt="${podcast.title}"
                         onerror="this.src='/webapp/assets/podcast-default.jpg'">
                    <div class="card-overlay">
                        <button class="play-btn" onclick="app.playPodcast(${podcast.id})">
                            ▶
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${podcast.title}</h3>
                    <p>${podcast.description}</p>
                    <div class="card-meta">
                        <span>⏱️ ${podcast.duration}</span>
                        <span>👂 ${podcast.listens}</span>
                    </div>
                </div>
            </div>
        `;
    }

    createStreamsPage() {
        const streams = this.allContent.streams || [];
        const liveStreams = streams.filter(s => s.live);
        const upcomingStreams = streams.filter(s => new Date(s.stream_date) > new Date() && !s.live);
        const pastStreams = streams.filter(s => new Date(s.stream_date) < new Date() && !s.live);
        
        return `
            <div class="page streams-page">
                <div class="page-header">
                    <h2>📹 Эфиры и разборы</h2>
                </div>
                
                ${liveStreams.length > 0 ? `
                <div class="streams-section">
                    <h3>🔴 Прямой эфир</h3>
                    <div class="streams-grid">
                        ${liveStreams.map(stream => this.createStreamCard(stream)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${upcomingStreams.length > 0 ? `
                <div class="streams-section">
                    <h3>📅 Предстоящие эфиры</h3>
                    <div class="streams-grid">
                        ${upcomingStreams.map(stream => this.createStreamCard(stream)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${pastStreams.length > 0 ? `
                <div class="streams-section">
                    <h3>📺 Записи эфиров</h3>
                    <div class="streams-grid">
                        ${pastStreams.map(stream => this.createStreamCard(stream)).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    createStreamCard(stream) {
        return `
            <div class="content-card stream-card ${stream.live ? 'live' : ''}">
                <div class="card-image">
                    <img src="${stream.thumbnail_url}" alt="${stream.title}"
                         onerror="this.src='/webapp/assets/stream-default.jpg'">
                    ${stream.live ? '<div class="live-badge">LIVE</div>' : ''}
                    <div class="card-overlay">
                        <button class="play-btn" onclick="app.watchStream(${stream.id})">
                            ${stream.live ? '▶ Смотреть' : '▶ Смотреть запись'}
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${stream.title}</h3>
                    <p>${stream.description}</p>
                    <div class="card-meta">
                        <span>⏱️ ${stream.duration}</span>
                        <span>👥 ${stream.participants}</span>
                        <span>📅 ${this.formatDate(stream.stream_date)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Остальные методы создания страниц аналогичны...

    createEmptyState(type) {
        const emptyStates = {
            courses: {
                icon: '📚',
                title: 'Курсы не найдены',
                description: 'Попробуйте изменить параметры поиска или фильтрации',
                action: 'Сбросить фильтры',
                onAction: 'app.clearSearch()'
            },
            podcasts: {
                icon: '🎧',
                title: 'Подкасты не найдены',
                description: 'Здесь появятся аудио подкасты и интервью',
                action: 'Обновить',
                onAction: 'app.loadContent()'
            }
        };

        const state = emptyStates[type] || emptyStates.courses;

        return `
            <div class="empty-state">
                <div class="empty-icon">${state.icon}</div>
                <div class="empty-title">${state.title}</div>
                <div class="empty-description">${state.description}</div>
                <button class="btn btn-primary" onclick="${state.onAction}">
                    ${state.action}
                </button>
            </div>
        `;
    }

    createNotFoundPage(message = 'Страница не найдена') {
        return `
            <div class="error-state">
                <div class="error-icon">🔍</div>
                <h3>${message}</h3>
                <p>Запрашиваемая страница не существует или была перемещена</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="app.renderPage('home')">
                        На главную
                    </button>
                    <button class="btn btn-outline" onclick="history.back()">
                        Назад
                    </button>
                </div>
            </div>
        `;
    }

    // PROFILE PAGE
    createProfilePage() {
        if (!this.currentUser) return '<div class="loading">Загрузка...</div>';

        const progress = this.currentUser.progress || {};
        const subscription = this.currentUser.subscription || {};
        
        return `
            <div class="page profile-page">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar">👤</div>
                        <div class="profile-info">
                            <h2>${this.currentUser.firstName}</h2>
                            <p>${this.currentUser.specialization || 'Специализация не указана'}</p>
                            <p>📍 ${this.currentUser.city || 'Город не указан'}</p>
                            <p>📧 ${this.currentUser.email || 'Email не указан'}</p>
                        </div>
                    </div>
                    
                    <div class="subscription-badge ${subscription.status}">
                        ${subscription.status === 'active' ? 
                            `✅ ${subscription.type === 'premium' ? 'Premium подписка' : 'Активная подписка'}` : 
                            '❌ Подписка не активна'
                        }
                    </div>
                </div>

                <div class="profile-stats">
                    <h3>📊 Статистика обучения</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.coursesBought || 0}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.materialsWatched || 0}</div>
                            <div class="stat-label">Материалов</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${progress.steps?.eventsParticipated || 0}</div>
                            <div class="stat-label">Мероприятий</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${Object.values(this.state.favorites).flat().length}</div>
                            <div class="stat-label">В избранном</div>
                        </div>
                    </div>
                </div>

                <div class="level-section">
                    <h3>🎯 Уровень прогресса</h3>
                    <div class="level-card">
                        <div class="level-info">
                            <div class="level-name">${progress.level}</div>
                            <div class="level-rank">${progress.rank}</div>
                        </div>
                        <div class="level-progress">
                            <div class="progress-text">
                                <span>${progress.experience} XP</span>
                                <span>${progress.level_threshold} XP до след. уровня</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" 
                                     style="width: ${(progress.experience / progress.level_threshold) * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                ${progress.badges && progress.badges.length > 0 ? `
                <div class="badges-section">
                    <h3>🏅 Значки и достижения</h3>
                    <div class="badges-grid">
                        ${progress.badges.map(badge => `
                            <div class="badge-item" data-tooltip="${this.getBadgeDescription(badge)}">
                                <div class="badge-icon">🎖️</div>
                                <div class="badge-name">${this.getBadgeName(badge)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="profile-actions">
                    <button class="btn btn-primary" onclick="app.editProfile()">
                        ✏️ Редактировать профиль
                    </button>
                    <button class="btn btn-outline" onclick="app.manageSubscription()">
                        💳 Управление подпиской
                    </button>
                    <button class="btn btn-outline" onclick="app.showSettings()">
                        ⚙️ Настройки
                    </button>
                    ${this.isAdmin ? `
                    <button class="btn btn-secondary" onclick="app.renderPage('admin')">
                        🔧 Админ-панель
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getBadgeName(badge) {
        const badges = {
            'first_course': 'Первый курс',
            'quick_learner': 'Быстрый ученик',
            'community_contributor': 'Активный участник'
        };
        return badges[badge] || badge;
    }

    getBadgeDescription(badge) {
        const descriptions = {
            'first_course': 'Завершен первый курс',
            'quick_learner': 'Быстрое прохождение курса',
            'community_contributor': 'Активное участие в сообществе'
        };
        return descriptions[badge] || 'Достижение';
    }

    // ADMIN PAGE
    createAdminPage() {
        if (!this.isAdmin && !this.isSuperAdmin) {
            return this.createAccessDeniedPage();
        }

        const stats = this.calculateAdminStats();
        
        return `
            <div class="page admin-page">
                <div class="admin-header">
                    <h2>${this.isSuperAdmin ? '🛠️ Супер-админ' : '🔧 Админ'}</h2>
                    <div class="admin-stats">
                        <div class="admin-stat">
                            <div class="stat-value">${stats.users.total}</div>
                            <div class="stat-label">Пользователей</div>
                        </div>
                        <div class="admin-stat">
                            <div class="stat-value">${stats.courses.total}</div>
                            <div class="stat-label">Курсов</div>
                        </div>
                        <div class="admin-stat">
                            <div class="stat-value">${stats.revenue.total}</div>
                            <div class="stat-label">Доход</div>
                        </div>
                        <div class="admin-stat">
                            <div class="stat-value">${stats.activity.today}</div>
                            <div class="stat-label">Активных сегодня</div>
                        </div>
                    </div>
                </div>

                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="content">📝 Контент</button>
                    <button class="admin-tab" data-tab="users">👥 Пользователи</button>
                    <button class="admin-tab" data-tab="analytics">📊 Аналитика</button>
                    <button class="admin-tab" data-tab="payments">💳 Платежи</button>
                    ${this.isSuperAdmin ? '<button class="admin-tab" data-tab="system">⚙️ Система</button>' : ''}
                </div>

                <div class="admin-content">
                    <div id="adminContentTab" class="admin-tab-content active">
                        ${this.createAdminContentTab()}
                    </div>
                    <div id="adminUsersTab" class="admin-tab-content">
                        ${this.createAdminUsersTab()}
                    </div>
                    <div id="adminAnalyticsTab" class="admin-tab-content">
                        ${this.createAdminAnalyticsTab()}
                    </div>
                    <div id="adminPaymentsTab" class="admin-tab-content">
                        ${this.createAdminPaymentsTab()}
                    </div>
                    ${this.isSuperAdmin ? `
                    <div id="adminSystemTab" class="admin-tab-content">
                        ${this.createAdminSystemTab()}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    calculateAdminStats() {
        return {
            users: {
                total: this.allContent.courses?.reduce((sum, course) => sum + (course.students_count || 0), 0) || 0
            },
            courses: {
                total: this.allContent.courses?.length || 0
            },
            revenue: {
                total: '390K'
            },
            activity: {
                today: '156'
            }
        };
    }

    createAdminContentTab() {
        return `
            <div class="admin-section">
                <h3>Управление контентом</h3>
                <div class="content-type-selector">
                    <button class="content-type-btn active" data-type="courses">📚 Курсы</button>
                    <button class="content-type-btn" data-type="podcasts">🎧 Подкасты</button>
                    <button class="content-type-btn" data-type="streams">📹 Эфиры</button>
                    <button class="content-type-btn" data-type="videos">🎯 Видео</button>
                    <button class="content-type-btn" data-type="materials">📋 Материалы</button>
                </div>

                <div class="content-list-admin">
                    ${this.allContent.courses?.map(course => `
                        <div class="admin-content-item">
                            <img src="${course.image_url}" alt="${course.title}" 
                                 onerror="this.src='/webapp/assets/course-default.jpg'">
                            <div class="content-info">
                                <h4>${course.title}</h4>
                                <p>${course.description}</p>
                                <div class="content-meta">
                                    <span>💰 ${this.formatPrice(course.price)}</span>
                                    <span>👥 ${course.students_count}</span>
                                    <span>⭐ ${course.rating}</span>
                                    <span>📊 ${course.completion_count} завершений</span>
                                </div>
                            </div>
                            <div class="content-actions">
                                <button class="btn btn-small" onclick="app.editContent('courses', ${course.id})">
                                    ✏️ Редактировать
                                </button>
                                <button class="btn btn-small btn-danger" onclick="app.deleteContent('courses', ${course.id})">
                                    🗑️ Удалить
                                </button>
                            </div>
                        </div>
                    `).join('') || '<div class="empty-state">Нет контента</div>'}
                </div>

                <div class="admin-actions">
                    <button class="btn btn-primary btn-large" onclick="app.showAddContentForm('courses')">
                        ➕ Добавить новый контент
                    </button>
                </div>
            </div>
        `;
    }

    createAccessDeniedPage() {
        return `
            <div class="error-state">
                <div class="error-icon">❌</div>
                <h3>Доступ запрещен</h3>
                <p>У вас нет прав для просмотра этой страницы</p>
                <button class="btn btn-primary" onclick="app.renderPage('home')">На главную</button>
            </div>
        `;
    }

    // Остальные методы админ-панели и других страниц...

    setupEventListeners() {
        // Глобальные обработчики событий
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // Обработчики навигации
        this.setupNavigationListeners();
        
        // Обработчики жестов (для мобильных устройств)
        this.setupGestureHandlers();
    }

    handleGlobalClick(e) {
        // Обработка глобальных кликов
        const target = e.target;
        
        // Закрытие выпадающих меню при клике вне их
        if (!target.closest('.dropdown') && !target.closest('.modal')) {
            this.closeAllDropdowns();
        }
    }

    handleOnline() {
        this.state.systemStatus = 'online';
        this.showNotification('✅ Соединение восстановлено', 'success');
        this.retryFailedRequests();
    }

    handleOffline() {
        this.state.systemStatus = 'offline';
        this.showNotification('⚠️ Отсутствует интернет-соединение', 'warning');
    }

    setupNavigationListeners() {
        // Обработчики навигационных кнопок
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.trackEvent('navigation', { from: this.currentPage, to: page });
                this.renderPage(page);
            });
        });
    }

    setupGestureHandlers() {
        // Обработчики жестов для мобильных устройств
        let startX = 0;
        let startY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;

            // Горизонтальный свайп для навигации
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Свайп влево - вперед
                    this.handleSwipe('left');
                } else {
                    // Свайп вправо - назад
                    this.handleSwipe('right');
                }
            }
        });
    }

    handleSwipe(direction) {
        if (direction === 'right' && this.currentPage !== 'home') {
            this.handleBackButton();
        }
    }

    closeAllDropdowns() {
        // Закрытие всех выпадающих меню
        const dropdowns = document.querySelectorAll('.dropdown.open');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    }

    // Заглушки для методов, которые будут реализованы позже
    editProfile() {
        this.showModal('profile-edit');
    }

    manageSubscription() {
        this.showNotification('💳 Управление подпиской в разработке', 'info');
    }

    showSettings() {
        this.showModal('settings');
    }

    editContent(type, id) {
        this.showNotification(`✏️ Редактирование ${type} ${id} в разработке`, 'info');
    }

    deleteContent(type, id) {
        if (confirm(`Вы уверены, что хотите удалить этот ${type}?`)) {
            this.showNotification(`🗑️ ${type} удален`, 'success');
            // Здесь будет вызов API для удаления
        }
    }

    playPodcast(podcastId) {
        this.showNotification('🎧 Воспроизведение подкаста в разработке', 'info');
    }

    watchStream(streamId) {
        this.showNotification('📹 Просмотр эфира в разработке', 'info');
    }

    // Методы для обработки новых уведомлений и обновлений контента
    handleNewNotification(notification) {
        this.state.notifications.push(notification);
        this.state.unreadNotifications++;
        
        this.showNotification(notification.message, notification.type, {
            action: notification.action_text,
            onAction: () => {
                if (notification.action_url) {
                    window.open(notification.action_url, '_blank');
                }
            }
        });
        
        this.updateNotificationBadge();
    }

    handleContentUpdate(data) {
        // Обновление контента при получении уведомления
        const { type, action, content } = data;
        
        switch (action) {
            case 'created':
                if (!this.allContent[type]) {
                    this.allContent[type] = [];
                }
                this.allContent[type].unshift(content);
                break;
            case 'updated':
                if (this.allContent[type]) {
                    const index = this.allContent[type].findIndex(item => item.id === content.id);
                    if (index !== -1) {
                        this.allContent[type][index] = content;
                    }
                }
                break;
            case 'deleted':
                if (this.allContent[type]) {
                    this.allContent[type] = this.allContent[type].filter(item => item.id !== content.id);
                }
                break;
        }
        
        // Перерисовка текущей страницы если нужно
        if (this.currentPage === type || this.currentPage === 'home') {
            this.renderPage(this.currentPage, this.currentSubPage);
        }
        
        this.showNotification(`Контент обновлен: ${action} ${type}`, 'info');
    }

    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.state.unreadNotifications;
            badge.style.display = this.state.unreadNotifications > 0 ? 'flex' : 'none';
        }
    }

    // Final initialization
    finalizeInitialization() {
        // Очистка кэша при запуске
        this.cleanupCache();
        
        // Проверка обновлений
        this.checkForUpdates();
        
        // Запуск фоновых задач
        this.startBackgroundTasks();
        
        console.log('🎉 Инициализация приложения завершена!');
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (value.expiry < now) {
                this.cache.delete(key);
            }
        }
        this.state.cacheSize = this.cache.size;
        this.saveCacheToStorage();
    }

    checkForUpdates() {
        // Проверка обновлений приложения
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CHECK_UPDATE'
            });
        }
    }

    startBackgroundTasks() {
        // Запуск фоновых задач
        setInterval(() => {
            this.cleanupCache();
        }, 5 * 60 * 1000); // Каждые 5 минут
        
        setInterval(() => {
            this.flushAnalytics();
        }, 30 * 1000); // Каждые 30 секунд
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Проверка поддержки необходимых функций
    if (!('Promise' in window)) {
        document.body.innerHTML = `
            <div class="browser-error">
                <h2>❌ Неподдерживаемый браузер</h2>
                <p>Для работы приложения необходим современный браузер с поддержкой JavaScript ES6+</p>
                <p>Пожалуйста, обновите браузер или используйте другой</p>
            </div>
        `;
        return;
    }

    // Инициализация приложения
    window.app = new AcademyApp();
});

// Глобальные вспомогательные функции
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

window.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Service Worker регистрация
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/webapp/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
