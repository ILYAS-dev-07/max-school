import { lessonService } from '../services/lessonService.js';
import { authService } from '../services/authService.js';
import { Header } from './Header.js';

export const LessonView = {
    lessonData: null,
    currentQuestionIndex: -1, // -1 означает экран введения/теории

    async init(containerId, lessonId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { data, error } = await lessonService.getLessonContent(lessonId);
        if (error || !data) {
            container.innerHTML = `<div class="container"><div class="card">${error || 'Ders yüklenemedi.'}</div></div>`;
            return;
        }

        this.lessonData = data;
        this.currentQuestionIndex = -1; // Сброс на начало теории
        this.renderStep(container);
    },

    renderStep(container) {
        const { lesson, questions } = this.lessonData;

        // ЭКРАН ТЕОРИИ И ВВЕДЕНИЯ
        if (this.currentQuestionIndex === -1) {
            container.innerHTML = `
                <div class="container" style="max-width: 600px; padding-top: var(--spacing-6);">
                    <div class="card">
                        <span style="font-size: 2rem;">📖</span>
                        <h2 style="margin: var(--spacing-2) 0;">${lesson.title}</h2>
                        <p style="color: var(--color-text-secondary); margin-bottom: var(--spacing-4);">${lesson.description}</p>
                        
                        <div style="background: var(--color-bg-main); padding: var(--spacing-4); border-radius: var(--radius-md); margin-bottom: var(--spacing-5);">
                            <h4>Konu Özeti / Teori:</h4>
                            <p style="margin-top: var(--spacing-2); font-size: 0.95rem; line-height: 1.6;">
                                Pozitif sayılar sıfırın sağında yer alır ve "+" işareti ile gösterilir. Negatif sayılar ise sıfırın solundadır, önlerinde "-" işareti bulunur. Sıfır (0) nötrdür, işareti yoktur.
                            </p>
                        </div>

                        <button id="btn-start-lesson" class="btn btn-primary" style="width:100%;">Öğrenmeye Başla</button>
                    </div>
                </div>
            `;
            document.getElementById('btn-start-lesson').addEventListener('click', () => {
                this.currentQuestionIndex = 0;
                this.renderStep(container);
            });
            return;
        }

        // ЭКРАН ЗАВЕРШЕНИЯ УРОКА
        if (this.currentQuestionIndex >= questions.length) {
            this.handleLessonComplete(container);
            return;
        }

        // ЭКРАН ВОПРОСА
        const currentQuestion = questions[this.currentQuestionIndex];
        
        let optionsHtml = '';
        if (currentQuestion.type === 'multiple_choice') {
            optionsHtml = `<div class="options-grid" style="display:grid; gap: var(--spacing-3); margin: var(--spacing-4) 0;">`;
            currentQuestion.options.forEach(opt => {
                optionsHtml += `
                    <button class="btn card btn-option" data-correct="${opt.is_correct}" style="text-align:left; justify-content:flex-start; font-weight:500;">
                        ${opt.option_text}
                    </button>
                `;
            });
            optionsHtml += `</div>`;
        } else if (currentQuestion.type === 'input') {
            optionsHtml = `
                <div style="margin: var(--spacing-4) 0;">
                    <input type="text" id="input-answer" class="card" style="width:100%; padding: var(--spacing-3); font-size: 1.1rem;" placeholder="Cevabınızı yazın...">
                    <button id="btn-submit-input" class="btn btn-primary" style="width:100%; margin-top: var(--spacing-3);">Cevabı Kontrol Et</button>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="container" style="max-width: 600px; padding-top: var(--spacing-6);">
                <div class="progress-indicator" style="margin-bottom: var(--spacing-3); color: var(--color-text-muted); font-weight:600;">
                    Soru ${this.currentQuestionIndex + 1} / ${questions.length}
                </div>
                <div class="card question-card">
                    <h3 style="line-height:1.4;">${currentQuestion.question_text}</h3>
                    
                    ${optionsHtml}

                    <div id="feedback-box" class="hidden" style="padding: var(--spacing-3); border-radius: var(--radius-md); margin-top: var(--spacing-3);">
                        <strong id="feedback-title"></strong>
                        <p id="feedback-text" style="margin-top: var(--spacing-1); font-size:0.9rem;"></p>
                        <button id="btn-next-question" class="btn btn-secondary" style="width:100%; margin-top: var(--spacing-3);">Devam Et</button>
                    </div>
                </div>
            </div>
        `;

        this.bindQuestionEvents(container, currentQuestion);
    },

    bindQuestionEvents(container, question) {
        const feedbackBox = document.getElementById('feedback-box');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackText = document.getElementById('feedback-text');
        const btnNext = document.getElementById('btn-next-question');

        const showFeedback = (isCorrect) => {
            feedbackBox.classList.remove('hidden');
            feedbackText.textContent = question.explanation; // Пояснение ошибки (Anti-Frustration)
            
            if (isCorrect) {
                feedbackBox.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                feedbackBox.style.color = 'var(--color-success)';
                feedbackTitle.textContent = "🎉 Harika! Doğru Cevap.";
            } else {
                feedbackBox.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                feedbackBox.style.color = 'var(--color-danger)';
                feedbackTitle.textContent = "💡 Yaklaştın! Doğru Cevap Değil.";
            }

            btnNext.addEventListener('click', () => {
                this.currentQuestionIndex++;
                this.renderStep(container);
            });
        };

        // Логика клика по вариантам (Multiple Choice)
        if (question.type === 'multiple_choice') {
            document.querySelectorAll('.btn-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    // Блокируем остальные кнопки после выбора
                    document.querySelectorAll('.btn-option').forEach(b => b.disabled = true);
                    const isCorrect = btn.getAttribute('data-correct') === 'true';
                    btn.style.borderColor = isCorrect ? 'var(--color-success)' : 'var(--color-danger)';
                    showFeedback(isCorrect);
                });
            });
        } 
        // Логика проверки ввода (Input)
        else if (question.type === 'input') {
            const submitBtn = document.getElementById('btn-submit-input');
            const inputField = document.getElementById('input-answer');

            submitBtn.addEventListener('click', () => {
                const userAnswer = inputField.value.trim();
                if (!userAnswer) return;

                inputField.disabled = true;
                submitBtn.disabled = true;

                const correctAnswerObj = question.options.find(o => o.is_correct);
                const isCorrect = userAnswer.toLowerCase() === correctAnswerObj?.option_text.toLowerCase();
                
                showFeedback(isCorrect);
            });
        }
    },

    async handleLessonComplete(container) {
        const { lesson } = this.lessonData;
        const { data: user } = await authService.getCurrentUser();

        container.innerHTML = `<div class="container" style="max-width:600px; padding-top:40px;"><div class="card" style="text-align:center;"><h3>Ders Tamamlanıyor...</h3></div></div>`;

        // Отправляем транзакцию завершения в сервис
        const { data: result } = await lessonService.completeLesson(user.id, lesson.id);

        // Перерисовываем шапку, чтобы обновить новые XP и монеты на клиенте
        await Header.render();

        container.innerHTML = `
            <div class="container" style="max-width: 600px; padding-top: var(--spacing-6);">
                <div class="card" style="text-align: center; border-color: var(--color-success);">
                    <span style="font-size: 3rem;">🎉</span>
                    <h2 style="color: var(--color-success); margin: var(--spacing-2) 0;">Tebrikler!</h2>
                    <p style="font-weight: 500;">"${lesson.title}" dersini başarıyla bitirdin.</p>
                    
                    <div style="display:flex; justify-content:center; gap: var(--spacing-4); margin: var(--spacing-5) 0;">
                        <div class="card" style="padding: var(--spacing-3) var(--spacing-5); background: rgba(16, 185, 129, 0.05);">
                            <span style="font-size:1.2rem; display:block;">💎 XP</span>
                            <strong style="font-size:1.5rem; color: var(--color-success);">+${result.xp_earned}</strong>
                        </div>
                        <div class="card" style="padding: var(--spacing-3) var(--spacing-5); background: rgba(245, 158, 11, 0.05);">
                            <span style="font-size:1.2rem; display:block;">🪙 Coin</span>
                            <strong style="font-size:1.5rem; color: var(--color-warning);">+${result.coins_earned}</strong>
                        </div>
                    </div>

                    ${result.leveled_up ? `
                        <div class="card" style="background: linear-gradient(to right, var(--color-primary), var(--color-secondary)); color:white; margin-bottom: var(--spacing-4); border:none; animation: pulse 1.5s infinite;">
                            🔥 TEBRİKLER! SEVİYE ATLADIN! 🔥
                        </div>
                    ` : ''}

                    <button id="btn-back-to-map" class="btn btn-primary" style="width:100%;">Haritaya Dön</button>
                </div>
            </div>
        `;

        document.getElementById('btn-back-to-map').addEventListener('click', () => {
            window.location.hash = '#map';
        });
    }
};