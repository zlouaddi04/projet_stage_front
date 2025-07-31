"use strict";
class UserDataManager {
    static async getItems() {
        try {
            await this.loadItemsFromAPI();
        }
        catch (error) {
            console.warn('Failed to load items from API, using cached data:', error);
        }
        return JSON.parse(localStorage.getItem(this.ITEMS_KEY) || '[]');
    }
    static async loadItemsFromAPI() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/Pieces/getall`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const backendItems = await response.json();
            const convertedItems = backendItems.map(backendItem => ({
                id: backendItem.id,
                Usine: backendItem.usine,
                Magasin: backendItem.magasin,
                article: backendItem.reference,
                Emplacement: backendItem.emplacement,
                Stock: backendItem.stock,
                Description: backendItem.desc,
                Unite_Mesure: backendItem.unite
            }));
            localStorage.setItem(this.ITEMS_KEY, JSON.stringify(convertedItems));
        }
        catch (error) {
            console.error('Failed to load items from API:', error);
            throw error;
        }
    }
    static getItemsSync() {
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
UserDataManager.API_BASE_URL = 'http://localhost:8080';
class UserPanel {
    constructor() {
        this.currentSection = 'search';
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser || this.currentUser.isAdmin) {
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
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    await this.switchSection(section);
                }
            });
        });
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', this.logout.bind(this));
        const searchBtn = document.getElementById('searchBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        searchBtn?.addEventListener('click', this.handleSearch.bind(this));
        clearSearchBtn?.addEventListener('click', this.clearSearch.bind(this));
        const filterHistoryBtn = document.getElementById('filterHistoryBtn');
        filterHistoryBtn?.addEventListener('click', this.filterHistory.bind(this));
        const requestPasswordResetBtn = document.getElementById('requestPasswordResetBtn');
        requestPasswordResetBtn?.addEventListener('click', this.requestPasswordReset.bind(this));
        this.addMobileMenuToggle();
    }
    addMobileMenuToggle() {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.addEventListener('click', this.toggleMobileMenu.bind(this));
        document.body.appendChild(toggleBtn);
    }
    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        sidebar?.classList.toggle('active');
    }
    updateUserDisplay() {
        const userName = document.getElementById('userName');
        if (userName && this.currentUser) {
            userName.textContent = `Welcome, ${this.currentUser.username}`;
        }
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');
        if (this.currentUser) {
            if (profileName)
                profileName.value = this.currentUser.username;
            if (profileEmail)
                profileEmail.value = this.currentUser.email;
            if (profileRole)
                profileRole.value = this.currentUser.isAdmin ? 'admin' : 'user';
        }
    }
    async switchSection(section) {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(section);
        targetSection?.classList.add('active');
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => item.classList.remove('active'));
        const activeItem = document.querySelector(`[data-section="${section}"]`);
        activeItem?.classList.add('active');
        this.currentSection = section;
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
        const sidebar = document.querySelector('.sidebar');
        sidebar?.classList.remove('active');
    }
    async loadSearch() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
    async handleSearch() {
        const searchByArticle = document.getElementById('searchByArticle').value.trim();
        const searchByEmplacement = document.getElementById('searchByEmplacement').value.trim();
        const searchByDescription = document.getElementById('searchByDescription').value.trim();
        if (!searchByArticle && !searchByEmplacement && !searchByDescription) {
            alert('Please provide at least one search criteria.');
            return;
        }
        try {
            const items = await UserDataManager.getItems();
            let filteredItems = items;
            if (searchByArticle) {
                filteredItems = filteredItems.filter(item => item.article.toLowerCase().startsWith(searchByArticle.toLowerCase()));
            }
            if (searchByEmplacement) {
                filteredItems = filteredItems.filter(item => item.Emplacement.toLowerCase().startsWith(searchByEmplacement.toLowerCase()));
            }
            if (searchByDescription) {
                filteredItems = filteredItems.filter(item => item.Description.toLowerCase().startsWith(searchByDescription.toLowerCase()));
            }
            this.displaySearchResults(filteredItems);
            const searchTerm = searchByArticle || searchByEmplacement || searchByDescription;
            const searchType = searchByArticle ? 'article' : searchByEmplacement ? 'Emplacement' : 'Description';
            if (this.currentUser) {
                UserDataManager.addSearchHistory(this.currentUser.userId, this.currentUser.email, searchTerm, searchType, filteredItems.length);
            }
        }
        catch (error) {
            console.error('Search failed:', error);
            alert('Search failed. Please try again.');
        }
    }
    displaySearchResults(items) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults)
            return;
        if (items.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="no-results-icon">📦</i>
                    <h3>No items found</h3>
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
    clearSearch() {
        document.getElementById('searchByArticle').value = '';
        document.getElementById('searchByEmplacement').value = '';
        document.getElementById('searchByDescription').value = '';
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
    loadHistory() {
        if (!this.currentUser)
            return;
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
        if (!this.currentUser)
            return;
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
    }
    requestPasswordReset() {
        const resetSuccessMessage = document.getElementById('resetSuccessMessage');
        if (resetSuccessMessage) {
            resetSuccessMessage.textContent = 'Password reset request has been sent to your email address. Please check your inbox for further instructions.';
            resetSuccessMessage.style.display = 'block';
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
    viewItemDetails(id) {
        const items = UserDataManager.getItemsSync();
        const item = items.find(i => i.id === id);
        if (item) {
            const modal = document.createElement('div');
            modal.className = 'item-detail-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Item Details</h2>
                        <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Article:</strong> ${item.article}
                            </div>
                            <div class="detail-item">
                                <strong>Usine:</strong> ${item.Usine}
                            </div>
                            <div class="detail-item">
                                <strong>Magasin:</strong> ${item.Magasin}
                            </div>
                            <div class="detail-item">
                                <strong>Emplacement:</strong> ${item.Emplacement}
                            </div>
                            <div class="detail-item">
                                <strong>Stock:</strong> ${item.Stock} ${item.Unite_Mesure || 'units'}
                            </div>
                            <div class="detail-item full-width">
                                <strong>Description:</strong> ${item.Description}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
                align-items: center; z-index: 1000;
            `;
            document.body.appendChild(modal);
        }
    }
    showLocation(emplacement) {
        alert(`Item Location: ${emplacement}\n\nThis would typically show a map or detailed location information.`);
    }
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('lafarge_session');
            window.location.href = 'index.html';
        }
    }
}
let userPanel;
document.addEventListener('DOMContentLoaded', () => {
    userPanel = new UserPanel();
});
window.addEventListener('resize', () => {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 1024) {
        sidebar?.classList.remove('active');
    }
});
