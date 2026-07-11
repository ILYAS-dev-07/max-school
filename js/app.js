import { authService } from './services/authService.js';
import { Header } from './components/Header.js';

/**
 * Игровое SPA-приложение Max School
 */
const App = {
    // Карта статических или динамических роутов приложения
    routes: {
        '#login': async () => {
            const { LoginView } = await import('./components/LoginView.js');
            LoginView.render('main-content');
        },
        '#map': async () => {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div id="map-view-container"></div>`;
            const { MapView } = await import('./components/MapView.js');
            await MapView.init('map-view-container');
        },
        '#lesson': async () => {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div id="lesson-view-container"></div>`;
            const { LessonView } = await import('./components/LessonView.js');
            await LessonView.init('lesson-view-container');
        },
        '#profile': async () => {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div id="profile-view-container"></div>`;
            const { ProfileView } = await import('./components/ProfileView.js');
            await ProfileView.init('profile-view-container');
        }
    },

    /**
     * Инициализация приложения при старте страницы
     */
    async init() {
        // Слушаем изменение хэша в адресной строке для роутинга
        window.addEventListener('hashchange', () => this.handleRouting());
        
        // Запускаем первичный роутинг при загрузке
        await this.handleRouting();
    },

    /**
     * Основной движок маршрутизации с проверкой сессии (Route Guard)
     */
    async handleRouting() {
        const hash = window.location.hash || '#map';
        
        // 1. Проверяем, авторизован ли пользователь в Supabase
        const { data: profile } = await authService.getCurrentUser();
        const isAuthenticated = !!profile;

        // 2. Защита роутов (Анти-чит/Безопасность согласно PRD)
        if (!isAuthenticated && hash !== '#login') {
            // Если не авторизован и ломится не на логин — принудительно шлем на логин
            window.location.hash = '#login';
            return;
        }

        if (isAuthenticated && hash === '#login') {
            // Если уже залогинен и пытается открыть страницу входа — перекидываем на карту
            window.location.hash = '#map';
            return;
        }

        // 3. Обновляем глобальную шапку (Header динамически перерендерит XP/Монеты)
        await Header.render();

        // 4. Очищаем прошлый контент и рендерим новый компонент по хэшу
        const routeAction = this.routes[hash];
        if (routeAction) {
            try {
                await routeAction();
            } catch (error) {
                console.error(`Компонент для роута ${hash} не смог загрузиться:`, error);
                document.getElementById('main-content').innerHTML = `
                    <div class="card text-center" style="margin: var(--spacing-6) auto; max-width: 500px;">
                        <p style="color: var(--color-error); font-weight: 600;">Упс! Произошла ошибка загрузки страницы.</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">Обновить страницу</button>
                    </div>
                `;
            }
        } else {
            // Если роут неизвестен — отправляем на карту
            window.location.hash = '#map';
        }
    }
};

// Запуск приложения сразу после полной загрузки DOM дерева
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});