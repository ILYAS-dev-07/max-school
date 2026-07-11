import { authService } from './services/authService.js';
import { Header } from './components/Header.js';

// Глобальный объект роутера приложения
const router = {
    // Карта маршрутов: хэш -> функция рендеринга страницы
    routes: {
        '#login': async () => {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="container" style="max-width: 400px; padding-top: var(--spacing-8);">
                    <div class="card">
                        <h2 style="margin-bottom: var(--spacing-4); text-align: center;">Max School'a Hoş Geldiniz</h2>
                        <div id="auth-error" class="hidden" style="color: var(--color-danger); margin-bottom: var(--spacing-3); font-size: 0.9rem;"></div>
                        <form id="form-auth">
                            <div style="margin-bottom: var(--spacing-3);">
                                <label style="display:block; margin-bottom: var(--spacing-1);">Kullanıcı Adı (Kayıt için)</label>
                                <input type="text" id="auth-username" class="card" style="width:100%; padding: var(--spacing-2);" placeholder="Örn: max_student">
                            </div>
                            <div style="margin-bottom: var(--spacing-3);">
                                <label style="display:block; margin-bottom: var(--spacing-1);">E-posta</label>
                                <input type="email" id="auth-email" class="card" style="width:100%; padding: var(--spacing-2);" required placeholder="ogrenci@maxschool.com">
                            </div>
                            <div style="margin-bottom: var(--spacing-4);">
                                <label style="display:block; margin-bottom: var(--spacing-1);">Şifre</label>
                                <input type="password" id="auth-password" class="card" style="width:100%; padding: var(--spacing-2);" required placeholder="******">
                            </div>
                            <div style="display:flex; gap: var(--spacing-2);">
                                <button type="submit" id="btn-login" class="btn btn-primary" style="flex:1;">Giriş Yap</button>
                                <button type="button" id="btn-register" class="btn btn-secondary" style="flex:1;">Kayıt Ol</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            // Обработчики формы авторизации
            const form = document.getElementById('form-auth');
            const errorEl = document.getElementById('auth-error');
            
            const handleAuth = async (action) => {
                const email = document.getElementById('auth-email').value;
                const password = document.getElementById('auth-password').value;
                const username = document.getElementById('auth-username').value;
                
                errorEl.classList.add('hidden');
                let result;
                
                if (action === 'register') {
                    result = await authService.register(email, password, username);
                } else {
                    result = await authService.login(email, password);
                }
                
                if (result.error) {
                    errorEl.textContent = result.error;
                    errorEl.classList.remove('hidden');
                } else {
                    window.location.hash = '#map'; // Успешно вошли — редирект на карту
                }
            };

            document.getElementById('btn-login').addEventListener('click', (e) => { e.preventDefault(); handleAuth('login'); });
            document.getElementById('btn-register').addEventListener('click', () => handleAuth('register'));
        },

        '#map': async () => {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="container" style="padding-top: var(--spacing-6);">
                    <h1>Öğrenme Haritası</h1>
                    <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-6);">Derslerini tamamla, ödülleri topla ve seviye atla!</p>
                    <div id="map-view-container"></div>
                </div>
            `;
            // В следующем шаге мы инициализируем здесь компонент MapView
            const { MapView } = await import('./components/MapView.js');
            MapView.init('map-view-container');
        },

        '#profile': async () => {
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div id="profile-view-container"></div>`;
            
            // Ленивая динамическая загрузка страницы профиля
            const { ProfileView } = await import('./components/ProfileView.js');
            await ProfileView.init('profile-view-container');
        }
    },

    /**
     * Главный диспетчер роутера, проверяющий состояние сессии (Guards)
     */
    async handleRouting() {
        let hash = window.location.hash || '#map';
        const { data: user } = await authService.getCurrentUser();

        // Проверяем авторизацию
        if (!user && hash !== '#login') {
            hash = '#login';
            window.location.hash = '#login';
        } else if (user && hash === '#login') {
            hash = '#map';
            window.location.hash = '#map';
        }

        await Header.render();

        // ЛОГИКА ДИНАМИЧЕСКОГО РОУТИНГА ДЛЯ УРОКОВ (Например, #lesson/lesson_math_1)
        if (hash.startsWith('#lesson/')) {
            const lessonId = hash.split('/')[1];
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `<div id="lesson-view-container"></div>`;
            
            const { LessonView } = await import('./components/LessonView.js');
            await LessonView.init('lesson-view-container', lessonId);
            return;
        }

        // Стандартные статичные маршруты
        if (this.routes[hash]) {
            await this.routes[hash]();
        } else {
            window.location.hash = '#map';
        }
    },

    init() {
        // Следим за изменением хэша в URL
        window.addEventListener('hashchange', () => this.handleRouting());
        // Проверяем роут при первой загрузке приложения
        window.addEventListener('DOMContentLoaded', () => this.handleRouting());
    }
};

// Запуск приложения
router.init();