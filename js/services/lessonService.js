import { supabase } from './supabaseClient.js';
import { profileService } from './profileService.js';

export const lessonService = {
    async getLessonsByTopic(topicId) {
        return await supabase
            .from('lessons')
            .select('*')
            .eq('topic_id', topicId)
            .order('order_index', { ascending: true });
    },

    async getUserProgressMap(userId) {
        const { data, error } = await supabase.from('user_progress').select('lesson_id').eq('user_id', userId);
        return { data: data ? data.map(p => p.lesson_id) : [], error };
    },

    async getLessonContent(lessonId) {
        // Получаем сам урок
        const { data: lesson, error: lError } = await supabase.from('lessons').select('*').eq('id', lessonId).single();
        if (lError || !lesson) return { data: null, error: "Ders bulunamadı." };

        // Идем глубже: тянем вопросы, принадлежащие уроку, вместе с вложенными вариантами ответов (Join через Supabase)
        const { data: questions, error: qError } = await supabase
            .from('questions')
            .select(`
                id, lesson_id, type, question_text, explanation,
                options: question_options(*)
            `)
            .eq('lesson_id', lessonId);

        return { data: { lesson, questions }, error: qError };
    },

    async completeLesson(userId, lessonId) {
        // Проверяем, был ли пройден урок ранее
        const { data: exists } = await supabase.from('user_progress').select('id').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle();

        if (!exists) {
            // Фиксируем прохождение
            await supabase.from('user_progress').insert({ user_id: userId, lesson_id: lessonId });
        }

        // Получаем параметры урока для начисления наград
        const { data: lesson } = await supabase.from('lessons').select('xp_reward, coin_reward').eq('id', lessonId).single();

        // Начисляем награды
        const rewardResult = await profileService.addRewards(userId, lesson.xp_reward, lesson.coin_reward);

        return {
            data: {
                xp_earned: lesson.xp_reward,
                coins_earned: lesson.coin_reward,
                leveled_up: rewardResult.data?.leveledUp || false,
                new_profile: rewardResult.data?.profile
            },
            error: rewardResult.error
        };
    }
};