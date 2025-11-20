// webapp/app.js - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ РАБОТЫ С СЕРВЕРОМ
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
        this.socket =
