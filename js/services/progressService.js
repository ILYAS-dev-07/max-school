import { dbDynamicState, achievements } from './dbMock.js';
import { profileService } from './profileService.js';

export const progressService = {
    /**
     * Проверить и автоматически открыть ачивки, условия которых выполнены.
     * Имитирует автоматический триггер на уровне базы данных Supabase (PostgreSQL).
     * @param {string} userId 
     * @returns {Promise<{data: Array, error: string|null}>} Список только что открытых ачивок
     */
    async checkAndUnlockAchievements(userId) {
        const newlyUnlocked = [];
        
        // Получаем уже открытые пользователем ачивки, чтобы не открывать их повторно
        const userAchIds = dbDynamicState.user_achievements
            .filter(ua => ua.user_id === userId)
            .map(ua => ua.achievement_id);

        // 1. Проверка ачивки "İlk Adım" (id: ach_first_lesson) - Пройти 1 любой урок
        if (!userAchIds.includes('ach_first_lesson')) {
            const completedCount = dbDynamicState.user_progress.filter(p => p.user_id === userId).length;
            if (completedCount >= 1) {
                newlyUnlocked.push('ach_first_lesson');
            }
        }

        // 2. Проверка ачивки "Kusursuz" (id: ach_perfect_score) - Накопить больше 30 монет
        // (Для MVP упростим условие до финансового прогресса игрока)
        if (!userAchIds.includes('ach_perfect_score')) {
            const profile = dbDynamicState.profiles.find(p => p.id === userId);
            if (profile && profile.coins >= 30) {
                newlyUnlocked.push('ach_perfect_score');
            }
        }

        // Записываем новые ачивки в таблицу и начисляем за них призовые XP / Coins
        for (const achId of newlyUnlocked) {
            dbDynamicState.user_achievements.push({
                user_id: userId,
                achievement_id: achId,
                earned_at: new Date().toISOString()
            });

            const achConfig = achievements.find(a => a.id === achId);
            if (achConfig) {
                // Начисляем системную награду за ачивку
                await profileService.addRewards(userId, achConfig.xp_reward, achConfig.coin_reward);
            }
        }

        return { data: newlyUnlocked, error: null };
    },

    /**
     * Получить полный список достижений с флагом "unlocked" конкретно для юзера
     */
    async getAchievementsListForUser(userId) {
        const userAchIds = dbDynamicState.user_achievements
            .filter(ua => ua.user_id === userId)
            .map(ua => ua.achievement_id);

        const structuredAchievements = achievements.map(ach => ({
            ...ach,
            is_unlocked: userAchIds.includes(ach.id)
        }));

        return { data: structuredAchievements, error: null };
    }
};