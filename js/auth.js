// Xuper TV Web - Authentication Module

const Auth = {
    // Storage keys
    STORAGE_KEY: {
        USER: 'xuper_tv_user',
        TOKEN: 'xuper_tv_token',
        SESSION: 'xuper_tv_session'
    },

    // Test users (for demo purposes)
    testUsers: {
        demo: { password: 'demo', name: 'Demo User' },
        user1: { password: 'password', name: 'Regular User' },
        admin: { password: 'admin123', name: 'Administrator' }
    },

    // Initialize authentication
    init() {
        // Check if user is already logged in
        const user = this.getUser();
        if (user) {
            this.showApp();
            App.updateUserInfo(user);
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
    },

    // Handle login
    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
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
                this.loginSuccess(username, user.name);
            } else {
                // Failed login
                this.showError('Usuario o contraseña incorrectos');
                this.hideLoading();
            }
        }, 1000);
    },

    // Login success
    loginSuccess(username, displayName) {
        // Create session
        const session = {
            username: username,
            displayName: displayName,
            timestamp: Date.now(),
            token: this.generateToken(username)
        };

        // Save session
        this.saveSession(session);

        // Hide login, show app
        this.showApp();
        
        // Update user info
        App.updateUserInfo(session);
        
        // Initialize app content
        App.initContent();
        
        // Hide loading
        this.hideLoading();

        // Show success message
        this.showToast(`¡Bienvenido, ${displayName}!`);
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

    // Generate a simple token
    generateToken(username) {
        // In a real implementation, this would be a JWT or server-generated token
        // For demo purposes, we use a simple hash
        const timestamp = Date.now().toString();
        const data = `${username}:${timestamp}`;
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        return `xuper_token_${hash.toString(16)}_${username}`;
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
