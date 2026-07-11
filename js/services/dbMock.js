/**
 * Max School - Database Mock (Supabase Schema Layout)
 * Настоящая реляционная структура, имитирующая таблицы PostgreSQL в Supabase.
 * Использует snake_case для полей таблиц согласно DATABASE.md.
 */

// 1. Таблица предметов (Таблица: subjects)
export const subjects = [
    {
        id: "subj_math_1",
        title: "Matematik",
        description: "Temel matematik prensipleri ve mantık.",
        slug: "matematik",
        created_at: "2026-01-01T00:00:00Z"
    },
    {
        id: "subj_turkish_1",
        title: "Türkçe",
        description: "Dil bilgisi, okuma ve anlamlandırma.",
        slug: "turkce",
        created_at: "2026-01-01T00:00:00Z"
    }
];

// 2. Таблица тем (Таблица: topics)
export const topics = [
    {
        id: "topic_math_numbers",
        subject_id: "subj_math_1", // Foreign Key
        title: "Tam Sayılar ve İşlemler",
        description: "Pozitif ve negatif sayılarla dört işlem.",
        order_index: 1
    }
];

// 3. Таблица уроков (Таблица: lessons)
export const lessons = [
    {
        id: "lesson_math_1",
        topic_id: "topic_math_numbers", // Foreign Key
        title: "Giriş: Pozitif ve Negatif Sayılar",
        description: "Sayı doğrusunu ve yönlü sayıları öğreniyoruz.",
        xp_reward: 20,
        coin_reward: 5,
        is_boss: false,
        order_index: 1
    },
    {
        id: "lesson_math_2",
        topic_id: "topic_math_numbers", // Foreign Key
        title: "Tam Sayılarda Toplama İşlemi",
        description: "Aynı ve farklı işaretli sayıları toplama.",
        xp_reward: 25,
        coin_reward: 5,
        is_boss: false,
        order_index: 2
    },
    {
        id: "lesson_math_boss",
        topic_id: "topic_math_numbers", // Foreign Key
        title: "Sayılar İmparatorluğu: Büyük Sınav",
        description: "Konunun tüm kurallarını test eden Boss Karşılaşması!",
        xp_reward: 100, // Повышенная награда согласно GAME_MECHANICS.md
        coin_reward: 25,
        is_boss: true,   // Уникальный внешний вид карты
        order_index: 3
    }
];

// 4. Таблица вопросов (Таблица: questions)
export const questions = [
    {
        id: "quest_m1_1",
        lesson_id: "lesson_math_1", // Foreign Key
        type: "multiple_choice", // Тип вопроса согласно гайдам
        question_text: "Sayı doğrusunda sıfırın (0) solundaki sayılara ne ad verilir?",
        explanation: "Sıfırın solundaki sayılar sıfırdan küçüktür ve 'Negatif Sayılar' olarak adlandırılır.", // Anti-Frustration Design
    },
    {
        id: "quest_m1_2",
        lesson_id: "lesson_math_1",
        type: "input", // Текстовый ввод
        question_text: "-5 sayısının mutlak değeri kaçtır?",
        explanation: "Mutlak değer bir sayının sıfıra olan uzaklığıdır ve her zaman pozitiftir: |-5| = 5.",
    }
];

// 5. Таблица вариантов ответов (Таблица: question_options)
export const question_options = [
    { id: "opt_m1_1_a", question_id: "quest_m1_1", option_text: "Pozitif Sayılar", is_correct: false },
    { id: "opt_m1_1_b", question_id: "quest_m1_1", option_text: "Negatif Sayılar", is_correct: true },
    { id: "opt_m1_1_c", question_id: "quest_m1_1", option_text: "Doğal Sayılar", is_correct: false },
    
    // Для типа 'input' правильный ответ проверяется по тексту, варианты не требуются (или хранят один пустой шаблон)
    { id: "opt_m1_2_ans", question_id: "quest_m1_2", option_text: "5", is_correct: true }
];

// 6. Таблица достижений (Таблица: achievements)
export const achievements = [
    { id: "ach_first_lesson", title: "İlk Adım", description: "İlk dersini başarıyla tamamla!", xp_reward: 50, coin_reward: 10, icon: "🎯" },
    { id: "ach_perfect_score", title: "Kusursuz", description: "Bir dersi hiç hata yapmadan bitir!", xp_reward: 100, coin_reward: 20, icon: "👑" },
    { id: "ach_streak_3", title: "İstikrarlı Öğrenci", description: "3 günlük seri (streak) yap!", xp_reward: 150, coin_reward: 30, icon: "🔥" }
];

// 7. Пользовательские динамические таблицы (Имитация таблиц Supabase в рантайме)
// В реальном приложении эти данные приходят после auth.user() и RLS-запросов.
export const dbDynamicState = {
    profiles: [],          // Информация о юзерах (id, username, avatar_url, level)
    user_progress: [],     // Связка user_id <-> lesson_id (completed, completed_at)
    streaks: [],           // Серии заходов (user_id, current_streak, best_streak, last_login)
    user_achievements: [], // Открытые ачивки (user_id, achievement_id, earned_at)
    xp_transactions: [],   // Лог получения опыта (id, user_id, amount, reason)
    coin_transactions: []  // Лог получения монет (id, user_id, amount, reason)
};