export const LoginView = {
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="auth-wrapper" style="max-width: 400px; margin: var(--spacing-8) auto; padding: 0 var(--spacing-4);">
                <div class="card">
                    <div class="auth-tabs" style="display: flex; gap: var(--spacing-2); margin-bottom: var(--spacing-5);">
                        <button id="tab-login" class="btn btn-primary" style="flex: 1;">Giriş Yap</button>
                        <button id="tab-register" class="btn btn-secondary" style="flex: 1;">Kayıt Ol</button>
                    </div>

                    <form id="form-login" class="auth-form">
                        <h2 style="margin-bottom: var(--spacing-4);">Hoş Geldiniz!</h2>
                        <div class="form-group" style="margin-bottom: var(--spacing-3);">
                            <label>Kullanıcı Adı</label>
                            <input type="text" id="login-username" placeholder="kullanici_adi" required style="width: 100%; padding: var(--spacing-2); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                        </div>
                        <div class="form-group" style="margin-bottom: var(--spacing-4);">
                            <label>Şifre</label>
                            <input type="password" id="login-password" placeholder="••••••••" required style="width: 100%; padding: var(--spacing-2); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Giriş Yap</button>
                    </form>

                    <form id="form-register" class="auth-form" style="display: none;">
                        <h2 style="margin-bottom: var(--spacing-4);">Hesap Oluştur</h2>
                        <div class="form-group" style="margin-bottom: var(--spacing-3);">
                            <label>E-posta Adresi</label>
                            <input type="email" id="reg-email" placeholder="ornek@email.com" required style="width: 100%; padding: var(--spacing-2); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                        </div>
                        <div class="form-group" style="margin-bottom: var(--spacing-3);">
                            <label>Kullanıcı Adı</label>
                            <input type="text" id="reg-username" placeholder="En az 3 karakter" required style="width: 100%; padding: var(--spacing-2); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                        </div>
                        <div class="form-group" style="margin-bottom: var(--spacing-4);">
                            <label>Şifre</label>
                            <input type="password" id="reg-password" placeholder="En az 6 karakter" required style="width: 100%; padding: var(--spacing-2); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Kayıt Ol</button>
                    </form>

                    <div id="auth-error" style="color: var(--color-error); margin-top: var(--spacing-3); font-size: 0.9rem; text-align: center; min-height: 20px;"></div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');
        const errorDiv = document.getElementById('auth-error');

        // Переключение вкладок
        tabLogin.addEventListener('click', () => {
            tabLogin.className = 'btn btn-primary';
            tabRegister.className = 'btn btn-secondary';
            formLogin.style.display = 'block';
            formRegister.style.display = 'none';
            errorDiv.innerText = '';
        });

        tabRegister.addEventListener('click', () => {
            tabLogin.className = 'btn btn-secondary';
            tabRegister.className = 'btn btn-primary';
            formLogin.style.display = 'none';
            formRegister.style.display = 'block';
            errorDiv.innerText = '';
        });

        // Отправка формы входа
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.innerText = '';
            
            const username = document.getElementById('login-username').value;
            const pass = document.getElementById('login-password').value;

            // Вызываем наш обновленный метод сервиса
            const { error } = await authService.login(username, pass);
            if (error) {
                errorDiv.innerText = error;
            } else {
                window.location.hash = '#map';
            }
        });

        // Отправка формы регистрации
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.innerText = '';

            const email = document.getElementById('reg-email').value;
            const username = document.getElementById('reg-username').value;
            const pass = document.getElementById('reg-password').value;

            const { error } = await authService.register(email, pass, username);
            if (error) {
                errorDiv.innerText = error;
            } else {
                errorDiv.style.color = 'var(--color-success)';
                errorDiv.innerText = "Kayıt başarılı! Giriş yapabilirsiniz.";
                tabLogin.click(); // Автоматически переводим на вкладку входа
            }
        });
    }
};