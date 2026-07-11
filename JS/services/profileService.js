import { supabase } from './supabaseClient.js';

export const profileService = {
    async getProfile(userId) {
        return await supabase.from('profiles').select('*').eq('id', userId).single();
    },

    async getUserStreak(userId) {
        const { data, error } = await supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle();
        return { data: data || { current_streak: 0, best_streak: 0 }, error };
    },

    async addRewards(userId, xpAmount, coinAmount) {
        // 1. Берем текущие показатели профиля
        const { data: profile } = await this.getProfile(userId);
        if (!profile) return { error: "Profil bulunamadı." };

        let newXp = profile.xp + xpAmount;
        let newCoins = profile.coins + coinAmount;
        let newLevel = profile.level;
        let leveledUp = false;

        // Расчет Level Up (Формула: Level * 100 XP)
        let xpNeeded = newLevel * 100;
        while (newXp >= xpNeeded) {
            newXp -= xpNeeded;
            newLevel += 1;
            leveledUp = true;
            xpNeeded = newLevel * 100;
        }

        // 2. Апдейтим профиль в Supabase
        const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({ xp: newXp, coins: newCoins, level: newLevel })
            .eq('id', userId)
            .select()
            .single();

        // 3. Логируем транзакции в таблицы истории (для аналитики согласно DATABASE.md)
        await supabase.from('xp_transactions').insert({ user_id: userId, amount: xpAmount });
        await supabase.from('coin_transactions').insert({ user_id: userId, amount: coinAmount });

        return { data: { profile: updatedProfile, leveledUp }, error };
    }
};