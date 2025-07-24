// Mock users database
const mockUsers = [
    { id: 1, name: 'Admin User', email: 'admin@lafargeholcim.com', password: 'admin123', role: 'admin', status: 'active' },
    { id: 2, name: 'John Doe', email: 'john.doe@lafargeholcim.com', password: 'user123', role: 'user', status: 'active' },
    { id: 3, name: 'Jane Smith', email: 'jane.smith@lafargeholcim.com', password: 'user456', role: 'user', status: 'active' }
];
// Authentication class
class AuthManager {
    static login(email, password) {
        const user = mockUsers.find(u => u.email === email && u.password === password && u.status === 'active');
        if (user) {
            const session = {
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
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
        const user = mockUsers.find(u => u.email === email);
        if (user) {
            // In a real application, this would send an email
            const resetRequest = {
                email,
                token: this.generateResetToken(),
                timestamp: new Date().toISOString()
            };
            // Store reset request (in real app, this would be server-side)
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
// DOM elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const resetEmailInput = document.getElementById('resetEmail');
const successMessage = document.getElementById('successMessage');
const closeModal = document.getElementById('closeModal');
// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (AuthManager.isAuthenticated()) {
        const currentUser = AuthManager.getCurrentUser();
        redirectToPanel(currentUser.role);
    }
    // Login form submission
    loginForm.addEventListener('submit', handleLogin);
    // Forgot password link
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordModal();
    });
    // Forgot password form submission
    forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    // Close modal
    closeModal.addEventListener('click', hideForgotPasswordModal);
    // Close modal when clicking outside
    forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
            hideForgotPasswordModal();
        }
    });
});
function handleLogin(e) {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    const result = AuthManager.login(email, password);
    if (result.success && result.user) {
        hideError();
        redirectToPanel(result.user.role);
    }
    else {
        showError(result.message || 'Login failed');
    }
}
function handleForgotPassword(e) {
    e.preventDefault();
    const email = resetEmailInput.value.trim();
    if (!email) {
        return;
    }
    const result = AuthManager.requestPasswordReset(email);
    if (result.success) {
        showSuccess(result.message);
        resetEmailInput.value = '';
    }
    else {
        showError(result.message);
    }
}
function redirectToPanel(role) {
    if (role === 'admin') {
        window.location.href = 'admin.html';
    }
    else {
        window.location.href = 'user.html';
    }
}
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        hideError();
    }, 5000);
}
function hideError() {
    errorMessage.style.display = 'none';
}
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
}
function showForgotPasswordModal() {
    forgotPasswordModal.style.display = 'flex';
}
function hideForgotPasswordModal() {
    forgotPasswordModal.style.display = 'none';
    resetEmailInput.value = '';
    successMessage.style.display = 'none';
}
