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

    static async requestPasswordReset(email: string): Promise<PasswordResetResult> {
        try {
            // First, check if user exists by getting all users
            const usersResponse = await fetch('http://localhost:8080/users/getall');
            if (!usersResponse.ok) {
                throw new Error('Failed to connect to server');
            }
            
            const users: User[] = await usersResponse.json();
            const user = users.find(u => u.email === email);
            
            if (!user) {
                return { success: false, message: 'Email address not found in our system.' };
            }
            
            // Send email with password
            const emailData = {
                toEmail: email,
                subject: 'LaFarge Holcim - Password Recovery',
                Body: `Hello ${user.name},\n\nYour password is: ${user.password}\n\nFor security reasons, please consider changing your password after logging in.\n\nBest regards,\nLaFarge Holcim Team`
            };
            
            const emailResponse = await fetch('http://localhost:8080/Email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });
            
            if (!emailResponse.ok) {
                throw new Error('Failed to send email. Please try again later.');
            }
            
            return { success: true, message: 'Your password has been sent to your email address.' };
            
        } catch (error) {
            console.error('Password reset error:', error);
            if (error instanceof Error) {
                return { success: false, message: error.message };
            }
            return { success: false, message: 'An unexpected error occurred. Please try again later.' };
        }
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
            this.showErrorModal(result.message || 'Login failed');
        }
    }

    private validateLoginInput(email: string, password: string): boolean {
        if (!email || !password) {
            this.showErrorModal('Please fill in all fields');
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showErrorModal('Please enter a valid email address');
            return false;
        }

        return true;
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private async handleForgotPassword(e: Event): Promise<void> {
        e.preventDefault();
        
        const email = this.resetEmailInput.value.trim();
        
        if (!email) {
            this.showErrorModal('Please enter your email address');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showErrorModal('Please enter a valid email address');
            return;
        }
        
        // Show loading state
        const submitBtn = this.forgotPasswordForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            const result = await AuthManager.requestPasswordReset(email);
            
            if (result.success) {
                this.showSuccessModal(result.message);
                this.resetEmailInput.value = '';
                this.hideForgotPasswordModal();
            } else {
                this.showErrorModal(result.message);
            }
        } catch (error) {
            this.showErrorModal('An unexpected error occurred. Please try again later.');
        } finally {
            // Restore button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    private redirectToPanel(isAdmin: boolean): void {
        // Use replace to prevent back navigation to login page
        if (isAdmin) {
            window.location.replace('admin.html');
        } else {
            window.location.replace('user.html');
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

    private showSuccessModal(message: string): void {
        // Create success modal
        const modal = document.createElement('div');
        modal.id = 'authSuccessModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                text-align: center;
                max-width: 400px;
                width: 90%;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #51cf66, #40c057);
                    border-radius: 50%;
                    margin: 0 auto 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                ">✓</div>
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">Success!</h3>
                <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.4;">
                    ${message}
                </p>
                <button id="closeAuthSuccessModal" style="
                    padding: 10px 20px;
                    border: none;
                    background: linear-gradient(135deg, #51cf66, #40c057);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                ">Close</button>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(modal);

        // Close button functionality
        const closeBtn = modal.querySelector('#closeAuthSuccessModal');
        closeBtn?.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Close on Escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    private showErrorModal(message: string): void {
        // Create error modal
        const modal = document.createElement('div');
        modal.id = 'authErrorModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                text-align: center;
                max-width: 400px;
                width: 90%;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                    border-radius: 50%;
                    margin: 0 auto 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                ">⚠</div>
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">Error</h3>
                <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.4;">
                    ${message}
                </p>
                <button id="closeAuthErrorModal" style="
                    padding: 10px 20px;
                    border: none;
                    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s;
                ">Close</button>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(modal);

        // Close button functionality
        const closeBtn = modal.querySelector('#closeAuthErrorModal');
        closeBtn?.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Close on Escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
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
