import { lessonService } from '../services/lessonService.js';
import { authService } from '../services/authService.js';

export const MapView = {
    /**
     * Инициализация карты в переданном контейнере DOM
     */
    async init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { data: user } = await authService.getCurrentUser();
        if (!user) return;

        // Загружаем уроки для первой темы (для MVP берем 'topic_math_numbers')
        const { data: lessonsList } = await lessonService.getLessonsByTopic('topic_math_numbers');
        const { data: completedLessons } = await lessonService.getUserProgressMap(user.id);

        let html = `<div class="learning-map">`;
        
        // Флаг, определяющий доступность следующего по порядку урока
        let isNextLessonUnlocked = true;

        lessonsList.forEach((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isCurrent = isNextLessonUnlocked && !isCompleted;
            const isLocked = !isCompleted && !isCurrent;

            // Если текущий урок найден, то все последующие закрыты, пока он не выполнится
            if (isCurrent) {
                isNextLessonUnlocked = false; 
            }

            // Классы стилей для ноды
            let nodeClass = "map-node";
            if (lesson.is_boss) nodeClass += " boss-node";
            if (isCompleted) nodeClass += " completed";
            if (isCurrent) nodeClass += " current";
            if (isLocked) nodeClass += " locked";

            html += `
                <div class="${nodeClass}" data-id="${lesson.id}" title="${lesson.title}">
                    <div class="node-icon">
                        ${lesson.is_boss ? '👑' : (isCompleted ? '✅' : (isLocked ? '🔒' : '📝'))}
                    </div>
                    <div class="node-info">
                        <span class="node-title">${lesson.title}</span>
                        <span class="node-rewards">💎 ${lesson.xp_reward} XP | 🪙 ${lesson.coin_reward}</span>
                    </div>
                </div>
                ${index < lessonsList.length - 1 ? '<div class="map-connector"></div>' : ''}
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        this.bindEvents(completedLessons);
    },

    bindEvents(completedLessons) {
        // Вешаем клики только на открытые или пройденные уроки
        document.querySelectorAll('.map-node').forEach(node => {
            node.addEventListener('click', () => {
                if (node.classList.contains('locked')) {
                    alert("Bu ders henüz kilitli! Lütfen önceki dersleri tamamlayın.");
                    return;
                }
                const lessonId = node.getAttribute('data-id');
                // Меняем хэш роутера для перехода на экран урока
                window.location.hash = `#lesson/${lessonId}`;
            });
        });
    }
};