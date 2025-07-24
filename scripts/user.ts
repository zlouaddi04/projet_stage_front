// Type definitions
interface Item {
    id: number;
    code: string;
    name: string;
    family: string;
    location: string;
    price: number;
    stock: number;
    description: string;
    lastUpdated: string;
}

interface UserSession {
    userId: number;
    email: string;
    role: string;
    name: string;
    loginTime: string;
}

interface UserSearchHistory {
    id: number;
    userId: number;
    userEmail: string;
    searchTerm: string;
    searchType: 'name' | 'code' | 'family';
    resultsCount: number;
    timestamp: string;
}

// Data management class
class UserDataManager {
    private static readonly ITEMS_KEY = 'lafarge_items';
    private static readonly SEARCH_HISTORY_KEY = 'lafarge_search_history';

    static getItems(): Item[] {
        return JSON.parse(localStorage.getItem(this.ITEMS_KEY) || '[]');
    }

    static getSearchHistory(): UserSearchHistory[] {
        return JSON.parse(localStorage.getItem(this.SEARCH_HISTORY_KEY) || '[]');
    }

    static saveSearchHistory(history: UserSearchHistory[]): void {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(history));
    }

    static addSearchHistory(userId: number, userEmail: string, searchTerm: string, searchType: 'name' | 'code' | 'family', resultsCount: number): void {
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
        if (!this.currentUser || this.currentUser.role !== 'user') {
            this.redirectToLogin();
            return;
        }
        
        this.initializeEventListeners();
        this.updateUserDisplay();
        this.loadSearch();
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
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = (item as HTMLElement).getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
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
            userName.textContent = `Welcome, ${this.currentUser.name}`;
        }

        // Update profile form
        const profileName = document.getElementById('profileName') as HTMLInputElement;
        const profileEmail = document.getElementById('profileEmail') as HTMLInputElement;
        const profileRole = document.getElementById('profileRole') as HTMLInputElement;

        if (this.currentUser) {
            if (profileName) profileName.value = this.currentUser.name;
            if (profileEmail) profileEmail.value = this.currentUser.email;
            if (profileRole) profileRole.value = this.currentUser.role;
        }
    }

    private switchSection(section: string): void {
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
                this.loadSearch();
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

    private loadSearch(): void {
        // Populate item families dropdown
        const items = UserDataManager.getItems();
        const families = [...new Set(items.map(item => item.family))];
        
        const familySelect = document.getElementById('searchByFamily') as HTMLSelectElement;
        if (familySelect) {
            familySelect.innerHTML = '<option value="">All Families</option>';
            families.forEach(family => {
                familySelect.innerHTML += `<option value="${family}">${family}</option>`;
            });
        }

        // Clear any previous search results
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    private handleSearch(): void {
        const searchByName = (document.getElementById('searchByName') as HTMLInputElement).value.trim();
        const searchByCode = (document.getElementById('searchByCode') as HTMLInputElement).value.trim();
        const searchByFamily = (document.getElementById('searchByFamily') as HTMLSelectElement).value;

        // Validate that at least one search criteria is provided
        if (!searchByName && !searchByCode && !searchByFamily) {
            alert('Please provide at least one search criteria.');
            return;
        }

        const items = UserDataManager.getItems();
        let filteredItems = items;

        if (searchByName) {
            filteredItems = filteredItems.filter(item => 
                item.name.toLowerCase().includes(searchByName.toLowerCase())
            );
        }

        if (searchByCode) {
            filteredItems = filteredItems.filter(item => 
                item.code.toLowerCase().includes(searchByCode.toLowerCase())
            );
        }

        if (searchByFamily) {
            filteredItems = filteredItems.filter(item => item.family === searchByFamily);
        }

        this.displaySearchResults(filteredItems);

        // Record search history
        const searchTerm = searchByName || searchByCode || searchByFamily;
        const searchType = searchByName ? 'name' : searchByCode ? 'code' : 'family';
        
        if (this.currentUser) {
            UserDataManager.addSearchHistory(
                this.currentUser.userId,
                this.currentUser.email,
                searchTerm,
                searchType,
                filteredItems.length
            );
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
            const stockStatus = item.stock > 0 ? 'In Stock' : 'Out of Stock';
            const stockClass = item.stock > 0 ? 'in-stock' : 'out-of-stock';
            
            resultsHTML += `
                <div class="search-result-item">
                    <h3>${item.name} <span class="item-code">(${item.code})</span></h3>
                    <div class="search-result-details">
                        <div class="detail-item">
                            <span class="detail-label">Item Code</span>
                            <span class="detail-value">${item.code}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Family</span>
                            <span class="detail-value">${item.family}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Location</span>
                            <span class="detail-value location-highlight">${item.location}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Price</span>
                            <span class="detail-value price-value">$${item.price.toFixed(2)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Stock Status</span>
                            <span class="detail-value ${stockClass}">${stockStatus} (${item.stock})</span>
                        </div>
                        <div class="detail-item description-item">
                            <span class="detail-label">Description</span>
                            <span class="detail-value">${item.description}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        searchResults.innerHTML = resultsHTML;
    }

    private clearSearch(): void {
        (document.getElementById('searchByName') as HTMLInputElement).value = '';
        (document.getElementById('searchByCode') as HTMLInputElement).value = '';
        (document.getElementById('searchByFamily') as HTMLSelectElement).value = '';
        
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
