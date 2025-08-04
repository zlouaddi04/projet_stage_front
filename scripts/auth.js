"use strict";
async function fetchUsers(url) {
    const response = await fetch(url);
    if (!response.ok)
        throw new Error("Failed to fetch user");
    return response.json();
}
let globalUserList = [];
let isUsersLoaded = false;
async function initializeUserList() {
    try {
        globalUserList = await fetchUsers("http://localhost:8080/users/getall");
        isUsersLoaded = true;
        console.log("Users loaded:", globalUserList);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        globalUserList = [
            { id: 1, name: "Admin User", email: "admin@lafarge.com", password: "admin123", isadmin: true },
            { id: 2, name: "Regular User", email: "user@lafarge.com", password: "user123", isadmin: false }
        ];
        isUsersLoaded = true;
        console.log("Using fallback mock data");
    }
}
function getUserList() {
    return globalUserList;
}
function areUsersLoaded() {
    return isUsersLoaded;
}
initializeUserList();
class AuthManager {
    static login(email, password) {
        if (!areUsersLoaded()) {
            return { success: false, message: 'System is still loading. Please try again in a moment.' };
        }
        const user = getUserList().find(u => u.email === email &&
            u.password === password);
        if (user) {
            const session = {
                userId: user.id,
                email: user.email || '',
                isAdmin: user.isadmin,
                username: user.name,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid email or password' };
    }
    static logout() {
        localStorage.removeItem(this.SESSION_KEY);
    }
    static getCurrentUser() {
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        return sessionData ? JSON.parse(sessionData) : null;
    }
    static isAuthenticated() {
        return this.getCurrentUser() !== null;
    }
    static requestPasswordReset(email) {
        if (!areUsersLoaded()) {
            return { success: false, message: 'System is still loading. Please try again in a moment.' };
        }
        const user = getUserList().find(u => u.email === email);
        if (user) {
            const resetRequest = {
                email,
                token: this.generateResetToken(),
                timestamp: new Date().toISOString()
            };
            const existingRequests = JSON.parse(localStorage.getItem(this.RESET_REQUESTS_KEY) || '[]');
            existingRequests.push(resetRequest);
            localStorage.setItem(this.RESET_REQUESTS_KEY, JSON.stringify(existingRequests));
            return { success: true, message: 'Password reset link has been sent to your email address.' };
        }
        return { success: false, message: 'Email address not found in our system.' };
    }
    static generateResetToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
AuthManager.SESSION_KEY = 'lafarge_session';
AuthManager.RESET_REQUESTS_KEY = 'lafarge_reset_requests';
class AuthFormHandler {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.checkExistingAuth();
    }
    initializeElements() {
        this.loginForm = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.errorMessage = document.getElementById('errorMessage');
        this.forgotPasswordLink = document.getElementById('forgotPasswordLink');
        this.forgotPasswordModal = document.getElementById('forgotPasswordModal');
        this.forgotPasswordForm = document.getElementById('forgotPasswordForm');
        this.resetEmailInput = document.getElementById('resetEmail');
        this.successMessage = document.getElementById('successMessage');
        this.closeModal = document.getElementById('closeModal');
    }
    setupEventListeners() {
        this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        this.forgotPasswordLink.addEventListener('click', this.showForgotPasswordModal.bind(this));
        this.forgotPasswordForm.addEventListener('submit', this.handleForgotPassword.bind(this));
        this.closeModal.addEventListener('click', this.hideForgotPasswordModal.bind(this));
        this.forgotPasswordModal.addEventListener('click', (e) => {
            if (e.target === this.forgotPasswordModal) {
                this.hideForgotPasswordModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.forgotPasswordModal.style.display === 'flex') {
                this.hideForgotPasswordModal();
            }
        });
    }
    checkExistingAuth() {
        if (AuthManager.isAuthenticated()) {
            const currentUser = AuthManager.getCurrentUser();
            if (currentUser) {
                this.redirectToPanel(currentUser.isAdmin);
            }
        }
    }
    handleLogin(e) {
        e.preventDefault();
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value.trim();
        if (!this.validateLoginInput(email, password)) {
            return;
        }
        const result = AuthManager.login(email, password);
        if (result.success && result.user) {
            this.hideError();
            this.redirectToPanel(result.user.isadmin);
        }
        else {
            this.showError(result.message || 'Login failed');
        }
    }
    validateLoginInput(email, password) {
        if (!email || !password) {
            this.showError('Please fill in all fields');
            return false;
        }
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }
        return true;
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    handleForgotPassword(e) {
        e.preventDefault();
        const email = this.resetEmailInput.value.trim();
        if (!email) {
            this.showError('Please enter your email address');
            return;
        }
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        const result = AuthManager.requestPasswordReset(email);
        if (result.success) {
            this.showSuccess(result.message);
            this.resetEmailInput.value = '';
        }
        else {
            this.showError(result.message);
        }
    }
    redirectToPanel(isAdmin) {
        if (isAdmin) {
            window.location.replace('admin.html');
        }
        else {
            window.location.replace('user.html');
        }
    }
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.setAttribute('aria-live', 'polite');
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    hideError() {
        this.errorMessage.style.display = 'none';
    }
    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.successMessage.setAttribute('aria-live', 'polite');
        setTimeout(() => {
            this.successMessage.style.display = 'none';
        }, 8000);
    }
    showForgotPasswordModal(e) {
        e.preventDefault();
        this.forgotPasswordModal.style.display = 'flex';
        this.resetEmailInput.focus();
    }
    hideForgotPasswordModal() {
        this.forgotPasswordModal.style.display = 'none';
        this.resetEmailInput.value = '';
        this.successMessage.style.display = 'none';
        this.hideError();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new AuthFormHandler();
});
