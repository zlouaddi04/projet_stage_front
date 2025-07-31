// Type definitions
interface Item {
    id: number;
    Usine: string;
    Magasin: string;
    article: string;
    Emplacement: string;
    Stock: number;
    Description: string;
    Unite_Mesure?: string;
}

interface UserSession {
    userId: number;
    email: string;
    isAdmin: boolean;
    username: string;
    loginTime: string;
}

interface UserSearchHistory {
    id: number;
    userId: number;
    userEmail: string;
    searchTerm: string;
    searchType: 'article' | 'Emplacement' | 'Usine';
    resultsCount: number;
    timestamp: string;
}

// Data management class
class UserDataManager {
    private static readonly ITEMS_KEY = 'lafarge_items';
    private static readonly SEARCH_HISTORY_KEY = 'lafarge_search_history';
    private static readonly API_BASE_URL = 'http://localhost:8080';

    static async getItems(): Promise<Item[]> {
        try {
            // Try to get fresh data from API
            await this.loadItemsFromAPI();
        } catch (error) {
            console.warn('Failed to load items from API, using cached data:', error);
        }
        return JSON.parse(localStorage.getItem(this.ITEMS_KEY) || '[]');
    }

    static async loadItemsFromAPI(): Promise<void> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/Pieces/getall`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const items: Item[] = await response.json();
            localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Failed to load items from API:', error);
            throw error;
        }
    }

    static getItemsSync(): Item[] {
        return JSON.parse(localStorage.getItem(this.ITEMS_KEY) || '[]');
    }

    static getSearchHistory(): UserSearchHistory[] {
        return JSON.parse(localStorage.getItem(this.SEARCH_HISTORY_KEY) || '[]');
    }

    static saveSearchHistory(history: UserSearchHistory[]): void {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(history));
    }

    static addSearchHistory(userId: number, userEmail: string, searchTerm: string, searchType: 'article' | 'Emplacement' | 'Usine', resultsCount: number): void {
        const history = this.getSearchHistory();
        const newEntry: UserSearchHistory = {
            id: history.length + 1,
            userId,
            userEmail,
            searchTerm,
            searchType,
            resultsCount,
            timestamp: new Date().toISOString()
        };
        history.push(newEntry);
        this.saveSearchHistory(history);
    }
}

// User panel controller class
class UserPanel {
    private currentUser: UserSession | null;
    private currentSection: string = 'search';

    constructor() {
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser || this.currentUser.isAdmin) {
            this.redirectToLogin();
            return;
        }
        
        this.initializeEventListeners();
        this.updateUserDisplay();
        this.loadSearch(); // This will be async now
    }

    private getCurrentUser(): UserSession | null {
        const sessionData = localStorage.getItem('lafarge_session');
        return sessionData ? JSON.parse(sessionData) : null;
    }

    private redirectToLogin(): void {
        window.location.href = 'index.html';
    }

    private initializeEventListeners(): void {
        // Sidebar navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = (item as HTMLElement).getAttribute('data-section');
                if (section) {
                    await this.switchSection(section);
                }
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', this.logout.bind(this));

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        searchBtn?.addEventListener('click', this.handleSearch.bind(this));
        clearSearchBtn?.addEventListener('click', this.clearSearch.bind(this));

        // History filter
        const filterHistoryBtn = document.getElementById('filterHistoryBtn');
        filterHistoryBtn?.addEventListener('click', this.filterHistory.bind(this));

        // Password reset
        const requestPasswordResetBtn = document.getElementById('requestPasswordResetBtn');
        requestPasswordResetBtn?.addEventListener('click', this.requestPasswordReset.bind(this));

        // Mobile menu toggle
        this.addMobileMenuToggle();
    }

    private addMobileMenuToggle(): void {
        // Create mobile menu toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        document.body.appendChild(toggleBtn);
    }

    private toggleMobileMenu(): void {
        const sidebar = document.querySelector('.sidebar');
        sidebar?.classList.toggle('active');
    }

    private updateUserDisplay(): void {
        const userName = document.getElementById('userName');
        if (userName && this.currentUser) {
            userName.textContent = `Welcome, ${this.currentUser.username}`;
        }

        // Update profile form
        const profileName = document.getElementById('profileName') as HTMLInputElement;
        const profileEmail = document.getElementById('profileEmail') as HTMLInputElement;
        const profileRole = document.getElementById('profileRole') as HTMLInputElement;

        if (this.currentUser) {
            if (profileName) profileName.value = this.currentUser.username;
            if (profileEmail) profileEmail.value = this.currentUser.email;
            if (profileRole) profileRole.value = this.currentUser.isAdmin ? 'admin' : 'user';
        }
    }

    private async switchSection(section: string): Promise<void> {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(s => s.classList.remove('active'));

        // Show selected section
        const targetSection = document.getElementById(section);
        targetSection?.classList.add('active');

        // Update menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`[data-section="${section}"]`);
        activeItem?.classList.add('active');

        this.currentSection = section;

        // Load section content
        switch (section) {
            case 'search':
                await this.loadSearch();
                break;
            case 'history':
                this.loadHistory();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }

        // Close mobile menu after selection
        const sidebar = document.querySelector('.sidebar');
        sidebar?.classList.remove('active');
    }

    private async loadSearch(): Promise<void> {
        try {
            // Populate item usines dropdown
            const items = await UserDataManager.getItems();
            const usines = [...new Set(items.map(item => item.Usine))];
            
            const usineSelect = document.getElementById('searchByUsine') as HTMLSelectElement;
            if (usineSelect) {
                usineSelect.innerHTML = '<option value="">All Usines</option>';
                usines.forEach(usine => {
                    usineSelect.innerHTML += `<option value="${usine}">${usine}</option>`;
                });
            }
        } catch (error) {
            console.error('Failed to load search data:', error);
            // Fallback to sync method
            const items = UserDataManager.getItemsSync();
            const usines = [...new Set(items.map(item => item.Usine))];
            
            const usineSelect = document.getElementById('searchByUsine') as HTMLSelectElement;
            if (usineSelect) {
                usineSelect.innerHTML = '<option value="">All Usines</option>';
                usines.forEach(usine => {
                    usineSelect.innerHTML += `<option value="${usine}">${usine}</option>`;
                });
            }
        }

        // Clear any previous search results
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    private async handleSearch(): Promise<void> {
        const searchByArticle = (document.getElementById('searchByArticle') as HTMLInputElement).value.trim();
        const searchByEmplacement = (document.getElementById('searchByEmplacement') as HTMLInputElement).value.trim();
        const searchByUsine = (document.getElementById('searchByUsine') as HTMLSelectElement).value;

        // Validate that at least one search criteria is provided
        if (!searchByArticle && !searchByEmplacement && !searchByUsine) {
            alert('Please provide at least one search criteria.');
            return;
        }

        try {
            const items = await UserDataManager.getItems();
            let filteredItems = items;

            if (searchByArticle) {
                filteredItems = filteredItems.filter(item => 
                    item.article.toLowerCase().includes(searchByArticle.toLowerCase())
                );
            }

            if (searchByEmplacement) {
                filteredItems = filteredItems.filter(item => 
                    item.Emplacement.toLowerCase().includes(searchByEmplacement.toLowerCase())
                );
            }

            if (searchByUsine) {
                filteredItems = filteredItems.filter(item => item.Usine === searchByUsine);
            }

            this.displaySearchResults(filteredItems);

            // Record search history
            const searchTerm = searchByArticle || searchByEmplacement || searchByUsine;
            const searchType = searchByArticle ? 'article' : searchByEmplacement ? 'Emplacement' : 'Usine';
            
            if (this.currentUser) {
                UserDataManager.addSearchHistory(
                    this.currentUser.userId,
                    this.currentUser.email,
                    searchTerm,
                    searchType,
                    filteredItems.length
                );
            }
        } catch (error) {
            console.error('Search failed:', error);
            alert('Search failed. Please try again.');
        }
    }

    private displaySearchResults(items: Item[]): void {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (items.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i>📦</i>
                    <p>No items found matching your search criteria.</p>
                    <p>Please try different search terms or check the spelling.</p>
                </div>
            `;
            return;
        }

        let resultsHTML = `<h2>Search Results (${items.length} item${items.length > 1 ? 's' : ''} found)</h2>`;
        items.forEach(item => {
            const stockStatus = item.Stock > 0 ? 'In Stock' : 'Out of Stock';
            const stockClass = item.Stock > 0 ? 'in-stock' : 'out-of-stock';
            
            resultsHTML += `
                <div class="search-result-item">
                    <h3>${item.article}</h3>
                    <div class="search-result-details">
                        <div class="detail-item">
                            <span class="detail-label">Article</span>
                            <span class="detail-value">${item.article}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Usine</span>
                            <span class="detail-value">${item.Usine}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Magasin</span>
                            <span class="detail-value">${item.Magasin}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Emplacement</span>
                            <span class="detail-value location-highlight">${item.Emplacement}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Stock Status</span>
                            <span class="detail-value ${stockClass}">${stockStatus} (${item.Stock})</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Unité de Mesure</span>
                            <span class="detail-value">${item.Unite_Mesure || 'N/A'}</span>
                        </div>
                        <div class="detail-item description-item">
                            <span class="detail-label">Description</span>
                            <span class="detail-value">${item.Description}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        searchResults.innerHTML = resultsHTML;
    }

    private clearSearch(): void {
        (document.getElementById('searchByArticle') as HTMLInputElement).value = '';
        (document.getElementById('searchByEmplacement') as HTMLInputElement).value = '';
        (document.getElementById('searchByUsine') as HTMLSelectElement).value = '';
        
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    private loadHistory(): void {
        if (!this.currentUser) return;
        
        const history = UserDataManager.getSearchHistory();
        const userHistory = history.filter(h => h.userId === this.currentUser!.userId);
        this.displayHistory(userHistory);
    }

    private displayHistory(history: UserSearchHistory[]): void {
        const tableBody = document.getElementById('historyTableBody');
        if (!tableBody) return;

        if (history.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="no-history">
                        <p>No search history found.</p>
                        <p>Start searching for items to see your search history here.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let tableHTML = '';
        // Sort by timestamp descending (most recent first)
        const sortedHistory = history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        sortedHistory.forEach(h => {
            const searchTypeDisplay = h.searchType.charAt(0).toUpperCase() + h.searchType.slice(1);
            const resultsText = h.resultsCount === 1 ? '1 item' : `${h.resultsCount} items`;
            
            tableHTML += `
                <tr>
                    <td>${this.formatDateTime(h.timestamp)}</td>
                    <td><strong>${h.searchTerm}</strong></td>
                    <td><span class="search-type-badge">${searchTypeDisplay}</span></td>
                    <td><span class="results-count">${resultsText}</span></td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;
    }

    private filterHistory(): void {
        if (!this.currentUser) return;
        
        const dateFrom = (document.getElementById('historyDateFrom') as HTMLInputElement).value;
        const dateTo = (document.getElementById('historyDateTo') as HTMLInputElement).value;

        let history = UserDataManager.getSearchHistory();
        const userHistory = history.filter(h => h.userId === this.currentUser!.userId);

        let filteredHistory = userHistory;

        if (dateFrom) {
            filteredHistory = filteredHistory.filter(h => h.timestamp >= dateFrom + 'T00:00:00');
        }

        if (dateTo) {
            filteredHistory = filteredHistory.filter(h => h.timestamp <= dateTo + 'T23:59:59');
        }

        this.displayHistory(filteredHistory);
    }

    private loadProfile(): void {
        // Profile is already loaded in updateUserDisplay
        // This method can be used for any additional profile-specific logic
    }

    private requestPasswordReset(): void {
        const resetSuccessMessage = document.getElementById('resetSuccessMessage');
        
        // Simulate password reset request
        if (resetSuccessMessage) {
            resetSuccessMessage.textContent = 'Password reset request has been sent to your email address. Please check your inbox for further instructions.';
            resetSuccessMessage.style.display = 'block';
            
            // Hide message after 10 seconds
            setTimeout(() => {
                resetSuccessMessage.style.display = 'none';
            }, 10000);
        }
    }

    private formatDateTime(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private logout(): void {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('lafarge_session');
            window.location.href = 'index.html';
        }
    }
}

// Initialize user panel when DOM is loaded
let userPanel: UserPanel;
document.addEventListener('DOMContentLoaded', () => {
    userPanel = new UserPanel();
});

// Handle window resize for mobile responsiveness
window.addEventListener('resize', () => {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 1024) {
        sidebar?.classList.remove('active');
    }
});
