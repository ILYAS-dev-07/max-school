import { authService } from '../services/authService.js';
import { profileService } from '../services/profileService.js';

export const Header = {
    /**
     * Рендеринг шапки в DOM контейнер
     */
    async render() {
        const headerEl = document.getElementById('global-header');
        const { data: user } = await authService.getCurrentUser();

        if (!user) {
            headerEl.classList.add('hidden');
            return;
        }

        // Запрашиваем актуальный стрейк из базы данных
        const { data: streakData } = await profileService.getUserStreak(user.id);
        const xpNeeded = user.level * 100;
        const progressPercentage = Math.min((user.xp / xpNeeded) * 100, 100);

        headerEl.classList.remove('hidden');
        headerEl.innerHTML = `
            <div class="header-container">
                <div class="brand" id="header-logo">
                    <span class="logo-icon">🚀</span>
                    <span class="logo-text">Max School</span>
                </div>
                
                <div class="stats-container">
                    <div class="stat-item xp-stat" title="Seviye ve Tecrübe Puanı">
                        <span class="level-badge">Lvl ${user.level}</span>
                        <div class="xp-bar-container">
                            <div class="xp-bar-fill" style="width: ${progressPercentage}%"></div>
                            <span class="xp-text">${user.xp} / ${xpNeeded} XP</span>
                        </div>
                    </div>

                    <div class="stat-item coin-stat" title="Max Coins">
                        <span class="stat-icon">🪙</span>
                        <span class="stat-value">${user.coins}</span>
                    </div>

                    <div class="stat-item streak-stat" title="Günlük Seri">
                        <span class="stat-icon">🔥</span>
                        <span class="stat-value">${streakData.current_streak} Gün</span>
                    </div>
                </div>

                <div class="user-menu">
                    <span class="username" id="nav-to-profile">${user.display_name}</span>
                    <button id="btn-logout" class="btn-logout-icon" title="Çıkış Yap">🚪</button>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    /**
     * Навешивание обработчиков событий шапки
     */
    bindEvents() {
        // Кнопка выхода
        document.getElementById('btn-logout')?.addEventListener('click', async () => {
            await authService.logout();
            window.location.hash = '#login'; // Редирект на логин через роутер
        });

        // Клик по логотипу ведет на главную (карту)
        document.getElementById('header-logo')?.addEventListener('click', () => {
            window.location.hash = '#map';
        });

        // Клик по имени ведет в профиль
        document.getElementById('nav-to-profile')?.addEventListener('click', () => {
            window.location.hash = '#profile';
        });
    }
};