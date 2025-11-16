/* webapp/style.css - ДОПОЛНЕНИЯ ДЛЯ НОВЫХ МОДУЛЕЙ */

/* Учителя */
.teachers-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.teacher-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
}

.teacher-avatar {
    font-size: 48px;
    width: 80px;
    height: 80px;
    background: var(--surface-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.teacher-info {
    flex: 1;
}

.teacher-name {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--text-primary);
}

.teacher-specialization {
    color: var(--text-secondary);
    margin-bottom: 8px;
    font-size: 14px;
}

.teacher-experience,
.teacher-rating {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 4px;
}

.teacher-bio {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 8px;
    line-height: 1.4;
}

.teacher-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
}

/* Чаты */
.chats-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.chat-item {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    display: flex;
    gap: 16px;
    align-items: center;
    cursor: pointer;
    transition: var(--transition);
}

.chat-item:hover {
    border-color: var(--primary);
    transform: translateY(-2px);
}

.chat-avatar {
    font-size: 24px;
    width: 50px;
    height: 50px;
    background: var(--surface-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.chat-info {
    flex: 1;
}

.chat-name {
    font-weight: 700;
    margin-bottom: 4px;
    color: var(--text-primary);
}

.chat-last-message {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 4px;
}

.chat-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--text-muted);
}

.unread-badge {
    background: var(--primary);
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
}

/* Мероприятия */
.events-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.event-card {
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
}

.event-icon {
    font-size: 32px;
    width: 60px;
    height: 60px;
    background: var(--surface-light);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.event-info {
    flex: 1;
}

.event-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text-primary);
}

.event-description {
    color: var(--text-secondary);
    margin-bottom: 12px;
    font-size: 14px;
    line-height: 1.4;
}

.event-details {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.event-details div {
    font-size: 13px;
    color: var(--text-muted);
}

.event-participants {
    font-size: 13px;
    color: var(--text-muted);
}

.event-actions {
    flex-shrink: 0;
}

/* Админка */
.admin-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    overflow-x: auto;
    padding-bottom: 8px;
}

.admin-tab-btn {
    background: var(--surface-light);
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
}

.admin-tab-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

.admin-tab-content {
    display: none;
}

.admin-tab-content.active {
    display: block;
}

.admin-section {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: var(--shadow);
}

.admin-content-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
    transition: var(--transition);
}

.admin-content-item:hover {
    border-color: var(--primary);
}

.content-section {
    margin-bottom: 32px;
}

.content-section h3 {
    margin-bottom: 16px;
    color: var(--text-primary);
}

.live-badge {
    background: var(--error);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
}

.page-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

/* Адаптивность */
@media (max-width: 768px) {
    .teacher-card,
    .event-card {
        flex-direction: column;
        text-align: center;
    }
    
    .teacher-actions,
    .event-actions {
        align-self: stretch;
    }
    
    .page-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .admin-tabs {
        flex-direction: column;
    }
}
