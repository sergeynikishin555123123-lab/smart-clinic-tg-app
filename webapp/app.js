// В начало класса AcademyApp добавить:
class AcademyApp {
    constructor() {
        // ... существующий код ...
        
        // Новые свойства для ТЗ
        this.communityRules = [
            'Не распространяем материалы',
            'Без рекламы и самопродвижения', 
            'Уважаем личное пространство',
            'Общаемся бережно и корректно',
            'Соблюдаем врачебную этику',
            'Держим высокий уровень контента'
        ];

        this.learningPath = {
            'Понимаю': { minExp: 0, maxExp: 1000, requirements: ['Подписка активирована'] },
            'Связываю': { minExp: 1000, maxExp: 2500, requirements: ['3+ эфиров', '5+ материалов'] },
            'Применяю': { minExp: 2500, maxExp: 5000, requirements: ['1+ курс', '7+ эфиров'] },
            'Систематизирую': { minExp: 5000, maxExp: 10000, requirements: ['2+ курса', '10+ эфиров'] },
            'Делюсь': { minExp: 10000, maxExp: 20000, requirements: ['Все курсы', 'Офлайн мероприятия'] }
        };

        this.chats = [
            { name: 'Неврологи', icon: '🧠', members: 234 },
            { name: 'Реабилитологи', icon: '🦾', members: 189 },
            { name: 'Мануальные специалисты', icon: '✋', members: 156 },
            { name: 'Междисциплинарный чат', icon: '🔗', members: 345 },
            { name: 'Флудилка', icon: '💬', members: 567 }
        ];
    }

    // Добавить новые методы для ТЗ
    createCommunityPage() {
        return `
            <div class="page community-page">
                <div class="page-header">
                    <h2>👥 О сообществе</h2>
                </div>

                <div class="rules-section">
                    <h3>📜 Правила и ценности сообщества</h3>
                    <div class="rules-list">
                        ${this.communityRules.map((rule, index) => `
                            <div class="rule-item">
                                <div class="rule-number">${index + 1}</div>
                                <div class="rule-text">${rule}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="faq-section">
                    <h3>❓ Частые вопросы</h3>
                    <div class="faq-list">
                        <div class="faq-item">
                            <div class="faq-question">Как оформить подписку?</div>
                            <div class="faq-answer">Подписку можно оформить в разделе «Личный кабинет»</div>
                        </div>
                        <div class="faq-item">
                            <div class="faq-question">Что входит в подписку?</div>
                            <div class="faq-answer">Доступ к эфирам, разборам, материалам и чатам</div>
                        </div>
                        <div class="faq-item">
                            <div class="faq-question">Чем отличаются курсы от эфиров?</div>
                            <div class="faq-answer">Курсы - системное обучение, эфиры - живые встречи</div>
                        </div>
                    </div>
                </div>

                <div class="support-section">
                    <h3>🆘 Поддержка</h3>
                    <div class="support-info">
                        <p><strong>Координатор проекта:</strong> @academy_anb</p>
                        <p><strong>Время работы:</strong> Пн-Пт с 11:00 до 19:00</p>
                        <button class="btn btn-primary" onclick="app.showSupport()">
                            Написать в поддержку
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createChatsPage() {
        return `
            <div class="page chats-page">
                <div class="page-header">
                    <h2>💬 Чаты специалистов</h2>
                </div>

                <div class="chats-list">
                    ${this.chats.map(chat => `
                        <div class="chat-card" onclick="app.joinChat('${chat.name}')">
                            <div class="chat-icon">${chat.icon}</div>
                            <div class="chat-info">
                                <div class="chat-name">${chat.name}</div>
                                <div class="chat-members">${chat.members} участников</div>
                            </div>
                            <div class="chat-arrow">→</div>
                        </div>
                    `).join('')}
                </div>

                <div class="chats-notice">
                    <p>💡 Для доступа к чатам требуется активная подписка</p>
                </div>
            </div>
        `;
    }

    createMyMaterialsPage() {
        const favorites = this.state.favorites;
        
        return `
            <div class="page materials-page">
                <div class="page-header">
                    <h2>📚 Мои материалы</h2>
                </div>

                <div class="materials-tabs">
                    <button class="tab-btn active" data-tab="later">Посмотреть позже</button>
                    <button class="tab-btn" data-tab="favorites">Избранное</button>
                    <button class="tab-btn" data-tab="practical">Практические материалы</button>
                </div>

                <div class="materials-content">
                    <div class="tab-content active" id="later-tab">
                        ${this.createMaterialsList('later')}
                    </div>
                    <div class="tab-content" id="favorites-tab">
                        ${this.createMaterialsList('favorites')}
                    </div>
                    <div class="tab-content" id="practical-tab">
                        ${this.createMaterialsList('practical')}
                    </div>
                </div>
            </div>
        `;
    }

    createMaterialsList(type) {
        // Заглушка - в реальности будет брать данные из состояния
        return `
            <div class="empty-materials">
                <div class="empty-icon">📚</div>
                <div class="empty-title">Здесь пока пусто</div>
                <div class="empty-description">Добавляйте материалы в избранное, чтобы они появились здесь</div>
                <button class="btn btn-primary" onclick="app.renderPage('courses')">
                    Перейти к курсам
                </button>
            </div>
        `;
    }

    joinChat(chatName) {
        this.showNotification(`Вход в чат "${chatName}" - функция в разработке`, 'info');
    }

    // Обновить метод getPageHTML для новых страниц
    getPageHTML(page, subPage = '') {
        const pages = {
            // ... существующие страницы ...
            community: this.createCommunityPage(),
            chats: this.createChatsPage(),
            myMaterials: this.createMyMaterialsPage(),
            // ... остальные страницы ...
        };

        return pages[page] || this.createNotFoundPage();
    }
}

// Добавить в setupEventListeners обработчики для новых кнопок
