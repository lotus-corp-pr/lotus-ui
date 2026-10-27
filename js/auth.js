// Lotus IPTV - Authentication Module

const Auth = {
    // Storage keys
    STORAGE_KEY: {
        USER: 'lotus_iptv_user',
        TOKEN: 'lotus_iptv_token',
        SESSION: 'lotus_iptv_session'
    },

    // Test users (for demo purposes)
    testUsers: {
        demo: { password: 'demo', name: 'Demo User' },
        iptv: { password: 'iptv123', name: 'IPTV User' },
        admin: { password: 'admin123', name: 'Administrator' }
    },

    // Initialize authentication
    init() {
        // Check if user is already logged in
        const user = this.getUser();
        if (user) {
            this.showApp();
            if (typeof App !== 'undefined') {
                App.updateUserInfo(user);
            }
            if (typeof IPTVPlayer !== 'undefined') {
                IPTVPlayer.loadChannels();
            }
        } else {
            this.showLogin();
        }

        // Setup login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Setup logout button
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Setup M3U load button
        const loadM3UBtn = document.getElementById('btn-load-m3u');
        if (loadM3UBtn) {
            loadM3UBtn.addEventListener('click', () => this.handleLoadM3U());
        }

        // Setup default list button
        const loadDefaultBtn = document.getElementById('btn-load-default');
        if (loadDefaultBtn) {
            loadDefaultBtn.addEventListener('click', () => this.handleLoadDefault());
        }

        // Setup settings checkboxes
        const autoplayCheckbox = document.getElementById('autoplay-next');
        if (autoplayCheckbox) {
            autoplayCheckbox.addEventListener('change', () => {
                if (typeof IPTVPlayer !== 'undefined') {
                    IPTVPlayer.autoplayNext = autoplayCheckbox.checked;
                    IPTVPlayer.saveSettings();
                }
            });
        }

        const epgCheckbox = document.getElementById('show-epg');
        if (epgCheckbox) {
            epgCheckbox.addEventListener('change', () => {
                if (typeof IPTVPlayer !== 'undefined') {
                    IPTVPlayer.showEPG = epgCheckbox.checked;
                    IPTVPlayer.saveSettings();
                }
            });
        }
    },

    // Handle login
    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const m3uUrl = document.getElementById('m3u-url').value.trim();
        const errorElement = document.getElementById('login-error');

        // Clear error
        if (errorElement) {
            errorElement.textContent = '';
        }

        // Validate
        if (!username || !password) {
            this.showError('Por favor ingrese usuario y contraseña');
            return;
        }

        // Show loading
        this.showLoading();

        // Simulate API call delay
        setTimeout(() => {
            // Check test users
            const user = this.testUsers[username];
            
            if (user && user.password === password) {
                // Successful login
                this.loginSuccess(username, user.name, m3uUrl);
            } else {
                // Failed login
                this.showError('Usuario o contraseña incorrectos');
                this.hideLoading();
            }
        }, 1000);
    },

    // Login success
    loginSuccess(username, displayName, m3uUrl) {
        // Create session
        const session = {
            username: username,
            displayName: displayName,
            timestamp: Date.now(),
            token: this.generateToken(username),
            m3uUrl: m3uUrl
        };

        // Save session
        this.saveSession(session);

        // Save M3U URL if provided
        if (m3uUrl) {
            localStorage.setItem('iptv_m3u_url', m3uUrl);
        }

        // Hide login, show app
        this.showApp();
        
        // Update user info
        if (typeof App !== 'undefined') {
            App.updateUserInfo(session);
        }
        
        // Initialize IPTV player with M3U if provided
        if (typeof IPTVPlayer !== 'undefined') {
            if (m3uUrl) {
                // Load M3U from URL
                IPTVPlayer.loadM3UFromURL(m3uUrl).then(success => {
                    if (success) {
                        this.hideLoading();
                        if (typeof App !== 'undefined') {
                            App.initContent();
                        }
                        this.showToast(`¡Bienvenido, ${displayName}! Lista M3U cargada.`);
                    } else {
                        this.hideLoading();
                        this.showToast(`¡Bienvenido, ${displayName}! Usando lista por defecto.`);
                        if (typeof App !== 'undefined') {
                            App.initContent();
                        }
                    }
                });
            } else {
                // Use default channels
                this.hideLoading();
                if (typeof App !== 'undefined') {
                    App.initContent();
                }
                this.showToast(`¡Bienvenido, ${displayName}!`);
            }
        }
    },

    // Handle logout
    handleLogout() {
        // Clear session
        this.clearSession();
        
        // Show login screen
        this.showLogin();
        
        // Show message
        this.showToast('Sesión cerrada');
    },

    // Handle load M3U
    handleLoadM3U() {
        const urlInput = document.getElementById('new-m3u-url');
        if (urlInput) {
            const url = urlInput.value.trim();
            if (url) {
                this.showLoading();
                
                if (typeof IPTVPlayer !== 'undefined') {
                    IPTVPlayer.loadM3UFromURL(url).then(success => {
                        this.hideLoading();
                        if (success) {
                            this.showToast('Lista M3U cargada correctamente');
                            urlInput.value = '';
                            if (typeof App !== 'undefined') {
                                App.initContent();
                            }
                        } else {
                            this.showError('Error al cargar la lista M3U');
                        }
                    });
                }
            } else {
                this.showError('Por favor ingrese una URL válida');
            }
        }
    },

    // Handle load default
    handleLoadDefault() {
        if (typeof IPTVPlayer !== 'undefined') {
            IPTVPlayer.loadDefaultChannels();
            this.showToast('Lista por defecto cargada');
            if (typeof App !== 'undefined') {
                App.initContent();
            }
        }
    },

    // Generate a simple token
    generateToken(username) {
        const timestamp = Date.now().toString();
        const data = `${username}:${timestamp}`;
        
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return `lotus_token_${hash.toString(16)}_${username}`;
    },

    // Save session
    saveSession(session) {
        localStorage.setItem(this.STORAGE_KEY.USER, JSON.stringify(session));
        localStorage.setItem(this.STORAGE_KEY.TOKEN, session.token);
        localStorage.setItem(this.STORAGE_KEY.SESSION, JSON.stringify(session));
    },

    // Get current user
    getUser() {
        const userData = localStorage.getItem(this.STORAGE_KEY.USER);
        return userData ? JSON.parse(userData) : null;
    },

    // Get token
    getToken() {
        return localStorage.getItem(this.STORAGE_KEY.TOKEN);
    },

    // Clear session
    clearSession() {
        localStorage.removeItem(this.STORAGE_KEY.USER);
        localStorage.removeItem(this.STORAGE_KEY.TOKEN);
        localStorage.removeItem(this.STORAGE_KEY.SESSION);
    },

    // Show login screen
    showLogin() {
        const loginScreen = document.getElementById('login-screen');
        const app = document.getElementById('app');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (app) app.classList.add('hidden');
        
        // Clear form
        const form = document.getElementById('login-form');
        if (form) form.reset();
    },

    // Show app
    showApp() {
        const loginScreen = document.getElementById('login-screen');
        const app = document.getElementById('app');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (app) app.classList.remove('hidden');
    },

    // Show error message
    showError(message) {
        const errorElement = document.getElementById('login-error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    },

    // Show loading
    showLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.remove('hidden');
        }
    },

    // Hide loading
    hideLoading() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
    },

    // Show toast notification
    showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('hidden');
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }
    }
};

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
