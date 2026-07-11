import { authService } from '../services/authService.js';
import { profileService } from '../services/profileService.js';
import { progressService } from '../services/progressService.js';
import { dbDynamicState } from '../services/dbMock.js';

export const ProfileView = {
    /**
     * Инициализация страницы профиля в DOM
     */
    async init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { data: user } = await authService.getCurrentUser();
        if (!user) return;

        // Важный триггер: проверяем, не заслужил ли юзер новые ачивки перед показом страницы
        await progressService.checkAndUnlockAchievements(user.id);

        // Тянем свежие данные профиля, стрейка и ачивок
        const { data: profile } = await profileService.getProfile(user.id);
        const { data: streak } = await profileService.getUserStreak(user.id);
        const { data: achievementsList } = await progressService.getAchievementsListForUser(user.id);

        // Считаем агрегированную статистику из реляционных таблиц (DATABASE.md)
        const totalLessonsCompleted = dbDynamicState.user_progress.filter(p => p.user_id === user.id).length;

        let achievementsHtml = '';
        achievementsList.forEach(ach => {
            achievementsHtml += `
                <div class="achievement-card ${ach.is_unlocked ? 'unlocked' : 'locked'}">
                    <div class="ach-icon">${ach.icon}</div>
                    <div class="ach-details">
                        <span class="ach-title">${ach.title}</span>
                        <p class="ach-desc">${ach.description}</p>
                        <span class="ach-reward">🎁 +${ach.xp_reward} XP | +${ach.coin_reward} С</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="container" style="padding-top: var(--spacing-6); max-width: 800px;">
                <div class="card profile-hero" style="display:flex; align-items:center; gap: var(--spacing-5); margin-bottom: var(--spacing-5); background: linear-gradient(135deg, var(--color-bg-surface) 0%, rgba(109, 40, 217, 0.03) 100%);">
                    <div class="profile-avatar-container">
                        <span style="font-size: 3.5rem;">🎓</span>
                    </div>
                    <div class="profile-meta">
                        <h2>${profile.display_name}</h2>
                        <p style="color: var(--color-text-muted); font-size: 0.9rem;">@${profile.username} • Üye Tarihi: ${new Date(profile.created_at).toLocaleDateString('tr-TR')}</p>
                        <div style="margin-top: var(--spacing-2);">
                            <span class="level-badge" style="font-size: 1rem; padding: var(--spacing-1) var(--spacing-4);">Seviye ${profile.level}</span>
                        </div>
                    </div>
                </div>

                <h3 style="margin-bottom: var(--spacing-3);">📊 Öğrenim İstatistikleri</h3>
                <div class="stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1max)); gap: var(--spacing-4); margin-bottom: var(--spacing-6);">
                    <div class="card stat-box">
                        <span class="stat-box-icon">✅</span>
                        <strong class="stat-box-val">${totalLessonsCompleted}</strong>
                        <span class="stat-box-lbl">Tamamlanan Ders</span>
                    </div>
                    <div class="card stat-box">
                        <span class="stat-box-icon">🔥</span>
                        <strong class="stat-box-val">${streak.current_streak} Gün</strong>
                        <span class="stat-box-lbl">Mevcut Seri</span>
                    </div>
                    <div class="card stat-box">
                        <span class="stat-box-icon">🏆</span>
                        <strong class="stat-box-val">${streak.best_streak} Gün</strong>
                        <span class="stat-box-lbl">En İyi Seri</span>
                    </div>
                </div>

                <h3 style="margin-bottom: var(--spacing-3);">🎯 Başarımlar (${achievementsList.filter(a => a.is_unlocked).length} / ${achievementsList.length})</h3>
                <div class="achievements-grid">
                    ${achievementsHtml}
                </div>
                
                <button id="btn-profile-back" class="btn btn-secondary" style="width:100%; margin-top: var(--spacing-6); margin-bottom: var(--spacing-8);">Öğrenme Haritasına Dön</button>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('btn-profile-back')?.addEventListener('click', () => {
            window.location.hash = '#map';
        });
    }
};