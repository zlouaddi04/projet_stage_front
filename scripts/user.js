// Data management class
class UserDataManager {
    static getItems() {
        return JSON.parse(localStorage.getItem(this.ITEMS_KEY) || '[]');
    }
    static getSearchHistory() {
        return JSON.parse(localStorage.getItem(this.SEARCH_HISTORY_KEY) || '[]');
    }
    static saveSearchHistory(history) {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(history));
    }
    static addSearchHistory(userId, userEmail, searchTerm, searchType, resultsCount) {
        const history = this.getSearchHistory();
        const newEntry = {
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
UserDataManager.ITEMS_KEY = 'lafarge_items';
UserDataManager.SEARCH_HISTORY_KEY = 'lafarge_search_history';
// User panel class
class UserPanel {
    constructor() {
        this.currentSection = 'search';
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser || this.currentUser.role !== 'user') {
            this.redirectToLogin();
            return;
        }
        this.initializeEventListeners();
        this.updateUserDisplay();
        this.loadSearch();
    }
    getCurrentUser() {
        const sessionData = localStorage.getItem('lafarge_session');
        return sessionData ? JSON.parse(sessionData) : null;
    }
    redirectToLogin() {
        window.location.href = 'index.html';
    }
    initializeEventListeners() {
        // Sidebar navigation
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn === null || logoutBtn === void 0 ? void 0 : logoutBtn.addEventListener('click', this.logout.bind(this));
        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        searchBtn === null || searchBtn === void 0 ? void 0 : searchBtn.addEventListener('click', this.handleSearch.bind(this));
        clearSearchBtn === null || clearSearchBtn === void 0 ? void 0 : clearSearchBtn.addEventListener('click', this.clearSearch.bind(this));
        // History filter
        const filterHistoryBtn = document.getElementById('filterHistoryBtn');
        filterHistoryBtn === null || filterHistoryBtn === void 0 ? void 0 : filterHistoryBtn.addEventListener('click', this.filterHistory.bind(this));
        // Password reset
        const requestPasswordResetBtn = document.getElementById('requestPasswordResetBtn');
        requestPasswordResetBtn === null || requestPasswordResetBtn === void 0 ? void 0 : requestPasswordResetBtn.addEventListener('click', this.requestPasswordReset.bind(this));
        // Mobile menu toggle
        this.addMobileMenuToggle();
    }
    addMobileMenuToggle() {
        // Create mobile menu toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        document.body.appendChild(toggleBtn);
    }
    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        sidebar === null || sidebar === void 0 ? void 0 : sidebar.classList.toggle('active');
    }
    updateUserDisplay() {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = `Welcome, ${this.currentUser.name}`;
        }
        // Update profile form
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');
        if (profileName)
            profileName.value = this.currentUser.name;
        if (profileEmail)
            profileEmail.value = this.currentUser.email;
        if (profileRole)
            profileRole.value = this.currentUser.role;
    }
    switchSection(section) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(s => s.classList.remove('active'));
        // Show selected section
        const targetSection = document.getElementById(section);
        targetSection === null || targetSection === void 0 ? void 0 : targetSection.classList.add('active');
        // Update menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`[data-section="${section}"]`);
        activeItem === null || activeItem === void 0 ? void 0 : activeItem.classList.add('active');
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
        sidebar === null || sidebar === void 0 ? void 0 : sidebar.classList.remove('active');
    }
    loadSearch() {
        // Populate item families dropdown
        const items = UserDataManager.getItems();
        const families = [...new Set(items.map(item => item.family))];
        const familySelect = document.getElementById('searchByFamily');
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
    handleSearch() {
        const searchByName = document.getElementById('searchByName').value.trim();
        const searchByCode = document.getElementById('searchByCode').value.trim();
        const searchByFamily = document.getElementById('searchByFamily').value;
        // Validate that at least one search criteria is provided
        if (!searchByName && !searchByCode && !searchByFamily) {
            alert('Please provide at least one search criteria.');
            return;
        }
        const items = UserDataManager.getItems();
        let filteredItems = items;
        if (searchByName) {
            filteredItems = filteredItems.filter(item => item.name.toLowerCase().includes(searchByName.toLowerCase()));
        }
        if (searchByCode) {
            filteredItems = filteredItems.filter(item => item.code.toLowerCase().includes(searchByCode.toLowerCase()));
        }
        if (searchByFamily) {
            filteredItems = filteredItems.filter(item => item.family === searchByFamily);
        }
        this.displaySearchResults(filteredItems);
        // Record search history
        const searchTerm = searchByName || searchByCode || searchByFamily;
        const searchType = searchByName ? 'name' : searchByCode ? 'code' : 'family';
        UserDataManager.addSearchHistory(this.currentUser.userId, this.currentUser.email, searchTerm, searchType, filteredItems.length);
    }
    displaySearchResults(items) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults)
            return;
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
    clearSearch() {
        document.getElementById('searchByName').value = '';
        document.getElementById('searchByCode').value = '';
        document.getElementById('searchByFamily').value = '';
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
    loadHistory() {
        const history = UserDataManager.getSearchHistory();
        const userHistory = history.filter(h => h.userId === this.currentUser.userId);
        this.displayHistory(userHistory);
    }
    displayHistory(history) {
        const tableBody = document.getElementById('historyTableBody');
        if (!tableBody)
            return;
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
    filterHistory() {
        const dateFrom = document.getElementById('historyDateFrom').value;
        const dateTo = document.getElementById('historyDateTo').value;
        let history = UserDataManager.getSearchHistory();
        const userHistory = history.filter(h => h.userId === this.currentUser.userId);
        let filteredHistory = userHistory;
        if (dateFrom) {
            filteredHistory = filteredHistory.filter(h => h.timestamp >= dateFrom + 'T00:00:00');
        }
        if (dateTo) {
            filteredHistory = filteredHistory.filter(h => h.timestamp <= dateTo + 'T23:59:59');
        }
        this.displayHistory(filteredHistory);
    }
    loadProfile() {
        // Profile is already loaded in updateUserDisplay
        // This method can be used for any additional profile-specific logic
    }
    requestPasswordReset() {
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
    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('lafarge_session');
            window.location.href = 'index.html';
        }
    }
}
// Initialize user panel when DOM is loaded
let userPanel;
document.addEventListener('DOMContentLoaded', () => {
    userPanel = new UserPanel();
});
// Handle window resize for mobile responsiveness
window.addEventListener('resize', () => {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 1024) {
        sidebar === null || sidebar === void 0 ? void 0 : sidebar.classList.remove('active');
    }
});
