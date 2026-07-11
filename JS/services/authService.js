import { supabase } from './supabaseClient.js';

export const authService = {
    /**
     * Регистрация нового студента через Supabase Auth
     */
    async register(email, password, username) {
        try {
            if (!email || !password || !username) {
                return { data: null, error: "Lütfen tüm alanları doldurun." };
            }

            // 1. Регистрируем пользователя в системе Supabase Auth
            // Передаем username в metadata, чтобы триггер в БД мог подхватить его для профиля
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username.toLowerCase().replace(/\s+/g, ''),
                        display_name: username
                    }
                }
            });

            if (error) return { data: null, error: error.message };

            // 2. Инициализируем стрейк для нового пользователя
            if (data?.user) {
                await supabase.from('streaks').insert({
                    user_id: data.user.id,
                    current_streak: 1,
                    best_streak: 1,
                    last_login: new Date().toISOString().split('T')[0]
                });
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: "Kayıt sırasında bir hata oluştu." };
        }
    },

    /**
     * Авторизация пользователя через Supabase Auth
     */
    async login(email, password) {
        try {
            if (!email || !password) {
                return { data: null, error: "E-posta ve şifre gereklidir." };
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) return { data: null, error: error.message };

            // Обновляем серию заходов (стрик) при успешном входе
            if (data?.user) {
                await this._updateStreakOnLogin(data.user.id);
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: "Giriş yapılırken bir hata oluştu." };
        }
    },

    /**
     * Выход из системы
     */
    async logout() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    /**
     * Получение текущего авторизованного пользователя и его профиля
     */
    async getCurrentUser() {
        // Получаем системного юзера из сессии
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null };

        // Тянем его игровой профиль из public.profiles
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        return { data: profile };
    },

    /**
     * Логика обновления стрейков в базе данных
     * @private
     */
    async _updateStreakOnLogin(userId) {
        const { data: streakRow } = await supabase.from('streaks').select('*').eq('user_id', userId).single();
        if (!streakRow) return;

        const todayStr = new Date().toISOString().split('T')[0];
        const lastLoginStr = streakRow.last_login;

        if (todayStr === lastLoginStr) return;

        const today = new Date(todayStr);
        const lastLogin = new Date(lastLoginStr);
        const diffDays = Math.ceil(Math.abs(today - lastLogin) / (1000 * 60 * 60 * 24));

        let updatedStreak = streakRow.current_streak;
        let updatedBest = streakRow.best_streak;

        if (diffDays === 1) {
            updatedStreak += 1;
            if (updatedStreak > updatedBest) updatedBest = updatedStreak;
        } else if (diffDays > 1) {
            updatedStreak = 1;
        }

        await supabase.from('streaks').update({
            current_streak: updatedStreak,
            best_streak: updatedBest,
            last_login: todayStr
        }).eq('user_id', userId);
    }
};