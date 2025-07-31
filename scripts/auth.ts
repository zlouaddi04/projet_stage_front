// Type definitions
interface User {
    id: number;
    name: string;
    email?: string;
    password: string;
    isadmin: boolean;
}

interface UserSession {
    userId: number;
    email: string;
    isAdmin: boolean;
    username: string;
    loginTime: string;
}

interface AuthResult {
    success: boolean;
    user?: User;
    message?: string;
}

interface PasswordResetResult {
    success: boolean;
    message: string;
}

// Mock users database
 async function fetchUsers(url: string): Promise<User[]> {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch user");
        return response.json() as Promise<User[]>; // Type assertion
}

let globalUserList: User[] = [];
let isUsersLoaded = false;

async function initializeUserList(): Promise<void> {
  try {
    globalUserList = await fetchUsers("http://localhost:8080/users/getall");
    isUsersLoaded = true;
    console.log("Users loaded:", globalUserList);
  } catch (error) {
    console.error("Error fetching users:", error);
    // Fallback to mock data if API fails
    globalUserList = [
      { id: 1, name: "Admin User", email: "admin@lafarge.com", password: "admin123", isadmin: true },
      { id: 2, name: "Regular User", email: "user@lafarge.com", password: "user123", isadmin: false }
    ];
    isUsersLoaded = true;
    console.log("Using fallback mock data");
  }
}

// Function to get the global user list
function getUserList(): User[] {
  return globalUserList;
}

// Function to check if users are loaded
function areUsersLoaded(): boolean {
  return isUsersLoaded;
}

// Initialize the user list
initializeUserList();
                                

// Authentication manager class
class AuthManager {
    private static readonly SESSION_KEY = 'lafarge_session';
    private static readonly RESET_REQUESTS_KEY = 'lafarge_reset_requests';

    static login(email: string, password: string): AuthResult {
        // Check if users are loaded
        if (!areUsersLoaded()) {
            return { success: false, message: 'System is still loading. Please try again in a moment.' };
        }

        const user = getUserList().find(u => 
            u.email === email && 
            u.password === password
        );
        
        if (user) {
            const session: UserSession = {
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

    static logout(): void {
        localStorage.removeItem(this.SESSION_KEY);
    }

    static getCurrentUser(): UserSession | null {
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        return sessionData ? JSON.parse(sessionData) : null;
    }

    static isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    }

    static requestPasswordReset(email: string): PasswordResetResult {
        // Check if users are loaded
        if (!areUsersLoaded()) {
            return { success: false, message: 'System is still loading. Please try again in a moment.' };
        }

        const user = getUserList().find(u => u.email === email);
        
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

    private static generateResetToken(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }


}

// Authentication form handler
class AuthFormHandler {
    private loginForm!: HTMLFormElement;
    private emailInput!: HTMLInputElement;
    private passwordInput!: HTMLInputElement;
    private errorMessage!: HTMLDivElement;
    private forgotPasswordLink!: HTMLAnchorElement;
    private forgotPasswordModal!: HTMLDivElement;
    private forgotPasswordForm!: HTMLFormElement;
    private resetEmailInput!: HTMLInputElement;
    private successMessage!: HTMLDivElement;
    private closeModal!: HTMLSpanElement;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    private initializeElements(): void {
        this.loginForm = document.getElementById('loginForm') as HTMLFormElement;
        this.emailInput = document.getElementById('email') as HTMLInputElement;
        this.passwordInput = document.getElementById('password') as HTMLInputElement;
        this.errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
        this.forgotPasswordLink = document.getElementById('forgotPasswordLink') as HTMLAnchorElement;
        this.forgotPasswordModal = document.getElementById('forgotPasswordModal') as HTMLDivElement;
        this.forgotPasswordForm = document.getElementById('forgotPasswordForm') as HTMLFormElement;
        this.resetEmailInput = document.getElementById('resetEmail') as HTMLInputElement;
        this.successMessage = document.getElementById('successMessage') as HTMLDivElement;
        this.closeModal = document.getElementById('closeModal') as HTMLSpanElement;
    }

    private setupEventListeners(): void {
        this.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        this.forgotPasswordLink.addEventListener('click', this.showForgotPasswordModal.bind(this));
        this.forgotPasswordForm.addEventListener('submit', this.handleForgotPassword.bind(this));
        this.closeModal.addEventListener('click', this.hideForgotPasswordModal.bind(this));
        
        // Close modal when clicking outside
        this.forgotPasswordModal.addEventListener('click', (e) => {
            if (e.target === this.forgotPasswordModal) {
                this.hideForgotPasswordModal();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.forgotPasswordModal.style.display === 'flex') {
                this.hideForgotPasswordModal();
            }
        });
    }

    private checkExistingAuth(): void {
        if (AuthManager.isAuthenticated()) {
            const currentUser = AuthManager.getCurrentUser();
            if (currentUser) {
                this.redirectToPanel(currentUser.isAdmin);
            }
        }
    }

    private handleLogin(e: Event): void {
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
        } else {
            this.showError(result.message || 'Login failed');
        }
    }

    private validateLoginInput(email: string, password: string): boolean {
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

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private handleForgotPassword(e: Event): void {
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
        } else {
            this.showError(result.message);
        }
    }

    private redirectToPanel(isAdmin: boolean): void {
        if (isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'user.html';
        }
    }

    private showError(message: string): void {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.setAttribute('aria-live', 'polite');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    private hideError(): void {
        this.errorMessage.style.display = 'none';
    }

    private showSuccess(message: string): void {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.successMessage.setAttribute('aria-live', 'polite');
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            this.successMessage.style.display = 'none';
        }, 8000);
    }

    private showForgotPasswordModal(e: Event): void {
        e.preventDefault();
        this.forgotPasswordModal.style.display = 'flex';
        this.resetEmailInput.focus();
    }

    private hideForgotPasswordModal(): void {
        this.forgotPasswordModal.style.display = 'none';
        this.resetEmailInput.value = '';
        this.successMessage.style.display = 'none';
        this.hideError();
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AuthFormHandler();
});
