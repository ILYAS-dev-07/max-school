import { supabase } from './supabaseClient.js';

export const authService = {
    /**
     * Регистрация нового студента через Supabase Auth
     */
    async register(email, password, displayName) {
        try {
            if (!email || !password || !displayName) {
                return { data: null, error: "Lütfen tüm alanları doldurun." };
            }

            // Создаем системный username (без пробелов и в нижнем регистре)
            const systemUsername = displayName.toLowerCase().trim().replace(/\s+/g, '');

            // Регистрируем пользователя в системе Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: systemUsername,
                        display_name: displayName.trim()
                    }
                }
            });

            if (error) return { data: null, error: error.message };

            // Инициализируем серию заходов (стрик) через upsert, чтобы избежать ошибки 409 Conflict
            if (data?.user) {
                await supabase.from('streaks').upsert({
                    user_id: data.user.id,
                    current_streak: 1,
                    best_streak: 1,
                    last_login: new Date().toISOString().split('T')[0]
                }, { onConflict: 'user_id' });
            }

            return { data, error: null };
        } catch (err) {
            console.error("Kaydetme hatası:", err);
            return { data: null, error: "Kayıt sırasında bir hata oluştu." };
        }
    },

    /**
     * Прямой и надёжный вход пользователя в систему по EMAIL и паролю
     */
    async login(email, password) {
        try {
            if (!email || !password) {
                return { data: null, error: "E-posta ve şifre gereklidir." };
            }

            const cleanEmail = email.toLowerCase().trim();

            // Авторизуем напрямую через Supabase Auth по почте
            const { data, error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password
            });

            if (error) return { data: null, error: error.message };

            // Обновляем серию заходов (стрик) при успешном входе
            if (data?.user) {
                await this._updateStreakOnLogin(data.user.id);
            }

            return { data, error: null };
        } catch (err) {
            console.error("Giriş hatası:", err);
            return { data: null, error: "Giriş yapılırken bir hata oluştu." };
        }
    },

    /**
     * Выход пользователя из системы
     */
    async logout() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    /**
     * Получение текущего авторизованного пользователя и его игрового профиля
     */
    async getCurrentUser() {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) return { data: null };

            const { data: profile, error: dbError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (dbError) return { data: null };
            return { data: profile };
        } catch (err) {
            console.error("getCurrentUser'da hata:", err);
            return { data: null };
        }
    },

    /**
     * Логика обновления ежедневных серий заходов (стриков) в базе данных
     * @private
     */
    async _updateStreakOnLogin(userId) {
        try {
            const { data: streakRow } = await supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle();
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
        } catch (err) {
            console.error("Seri güncelleme hatası:", err);
        }
    }
};