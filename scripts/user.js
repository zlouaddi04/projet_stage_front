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
                Unite_Mesure: backendItem.unite,
                famille: backendItem.famille,
                service: backendItem.service
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
    renderCartWindow() {
        const cartContainer = document.querySelector('#cart .cart-container');
        if (!cartContainer)
            return;
        let html = '';
        if (this.cart.length === 0) {
            html += `<div class="no-results">
                <i class="no-results-icon">🛒</i>
                <h3>Your cart is empty</h3>
                <p>Search for items and add them to your cart to place an order.</p>
            </div>`;
        }
        else {
            html += `<div class="cart-items">
                <table class="cart-table">
                    <thead>
                        <tr>
                            <th>Article</th>
                            <th>Description</th>
                            <th>Stock Available</th>
                            <th>Quantity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>`;
            this.cart.forEach((ci, idx) => {
                html += `<tr>
                    <td><strong>${ci.item.article}</strong></td>
                    <td>${ci.item.Description}</td>
                    <td>${ci.item.Stock}</td>
                    <td>${ci.quantity}</td>
                    <td><button class="remove-cart-btn" data-idx="${idx}">Remove</button></td>
                </tr>`;
            });
            html += `</tbody></table>
            </div>
            <div class="cart-actions">
                <button class="confirm-cart-btn" id="confirmCartBtn">Confirm Transaction</button>
                <button class="clear-cart-btn" id="clearCartBtn">Clear Cart</button>
            </div>`;
        }
        if (this.lastSuccessfulTransaction.length > 0) {
            html += `
            <div class="successful-transaction-section">
                <h3>Last Successful Transaction</h3>
                <div class="transaction-summary">
                    <p>Transaction completed successfully! You can generate a bill for the following items:</p>
                    <ul>`;
            this.lastSuccessfulTransaction.forEach(item => {
                html += `<li>${item.item.article} - Quantity: ${item.quantity}</li>`;
            });
            html += `</ul>
                    <div class="transaction-actions">
                        <button class="generate-bill-btn" id="generateBillBtn">Generate Bill</button>
                        <button class="dismiss-transaction-btn" id="dismissTransactionBtn">Dismiss</button>
                    </div>
                </div>
            </div>`;
        }
        cartContainer.innerHTML = html;
        const removeBtns = cartContainer.querySelectorAll('.remove-cart-btn');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-idx') || '0');
                this.cart.splice(idx, 1);
                this.renderCartWindow();
                this.renderCartCount();
            });
        });
        const confirmBtn = cartContainer.querySelector('#confirmCartBtn');
        confirmBtn?.addEventListener('click', this.confirmCartTransaction.bind(this));
        const generateBillBtn = cartContainer.querySelector('#generateBillBtn');
        generateBillBtn?.addEventListener('click', () => {
            if (this.lastSuccessfulTransaction.length > 0) {
                this.generatePDFBill(this.lastSuccessfulTransaction);
            }
            else {
                this.showErrorMessage('No recent successful transactions to generate bill for.');
            }
        });
        const dismissTransactionBtn = cartContainer.querySelector('#dismissTransactionBtn');
        dismissTransactionBtn?.addEventListener('click', () => {
            this.lastSuccessfulTransaction = [];
            this.renderCartWindow();
        });
        const clearBtn = cartContainer.querySelector('#clearCartBtn');
        clearBtn?.addEventListener('click', () => {
            this.cart = [];
            this.renderCartWindow();
            this.renderCartCount();
        });
    }
    async confirmCartTransaction() {
        if (!this.currentUser)
            return;
        if (this.cart.length === 0) {
            this.showErrorMessage('Cart is empty.');
            return;
        }
        this.showLoading();
        let successCount = 0;
        let errorCount = 0;
        const successfulItems = [];
        const failedItems = [];
        for (const ci of this.cart) {
            try {
                const body = {
                    user: this.currentUser.username,
                    reference: ci.item.article,
                    quantity: ci.quantity
                };
                const response = await fetch('http://localhost:8080/Transaction/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const result = await response.json();
                if (response.ok && (result.statusCode === 200 || result.success !== false)) {
                    successCount++;
                    successfulItems.push(`${ci.item.article} (Qty: ${ci.quantity})`);
                }
                else {
                    errorCount++;
                    failedItems.push(`${ci.item.article} (Qty: ${ci.quantity})`);
                }
            }
            catch (error) {
                errorCount++;
                failedItems.push(`${ci.item.article} (Qty: ${ci.quantity})`);
            }
        }
        this.hideLoading();
        if (successCount > 0) {
            this.lastSuccessfulTransaction = this.cart.filter(ci => successfulItems.some(item => item.includes(ci.item.article)));
            if (this.lastSuccessfulTransaction.length > 0) {
                this.generatePDFBill(this.lastSuccessfulTransaction);
            }
            this.showSuccessMessage(`${successCount} transaction${successCount > 1 ? 's' : ''} confirmed successfully!`);
            this.cart = [];
            this.renderCartWindow();
            this.renderCartCount();
        }
        if (errorCount > 0) {
            this.showErrorMessage(`${errorCount} transaction${errorCount > 1 ? 's' : ''} failed. Please check stock availability and try again.`);
        }
    }
    async generatePDFBill(cartItems) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const logoDataUrl = this.createLogoDataUrl();
            if (logoDataUrl) {
                doc.addImage(logoDataUrl, 'PNG', 20, 20, 50, 25);
            }
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('LaFarge Holcim', 80, 30);
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('Inventory Management System', 80, 37);
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('TRANSACTION RECEIPT', 20, 60);
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            const currentDate = new Date().toLocaleDateString();
            const currentTime = new Date().toLocaleTimeString();
            doc.text(`Date: ${currentDate}`, 20, 75);
            doc.text(`Time: ${currentTime}`, 20, 82);
            doc.text(`User: ${this.currentUser?.username || 'N/A'}`, 20, 89);
            doc.text(`Transaction ID: TXN-${Date.now()}`, 20, 96);
            const startY = 110;
            doc.setFont(undefined, 'bold');
            doc.text('Item Reference', 20, startY);
            doc.text('Description', 70, startY);
            doc.text('Qty', 140, startY);
            doc.text('Unit', 160, startY);
            doc.line(20, startY + 2, 190, startY + 2);
            doc.setFont(undefined, 'normal');
            let currentY = startY + 10;
            let totalItems = 0;
            cartItems.forEach((cartItem, index) => {
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 30;
                }
                const item = cartItem.item;
                const qty = cartItem.quantity;
                totalItems += qty;
                const description = item.Description.length > 25
                    ? item.Description.substring(0, 25) + '...'
                    : item.Description;
                doc.text(item.article, 20, currentY);
                doc.text(description, 70, currentY);
                doc.text(qty.toString(), 140, currentY);
                doc.text(item.Unite_Mesure || 'PCS', 160, currentY);
                currentY += 7;
            });
            doc.line(20, currentY + 2, 190, currentY + 2);
            currentY += 15;
            doc.setFont(undefined, 'bold');
            doc.text(`Total Items: ${cartItems.length}`, 20, currentY);
            doc.text(`Total Quantity: ${totalItems}`, 20, currentY + 7);
            currentY += 25;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `LaFarge_Transaction_${timestamp}.pdf`;
            doc.save(filename);
        }
        catch (error) {
            console.error('Error generating PDF:', error);
            this.showErrorMessage('Failed to generate PDF bill. Please try again.');
        }
    }
    createLogoDataUrl() {
        const canvas = document.createElement('canvas');
        canvas.width = 250;
        canvas.height = 125;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const gradient = ctx.createLinearGradient(0, 0, 250, 125);
            gradient.addColorStop(0, '#34495e');
            gradient.addColorStop(1, '#2c3e50');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 250, 125);
            ctx.strokeStyle = '#16a085';
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, 250, 125);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LaFarge', 125, 40);
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#16a085';
            ctx.fillText('Holcim', 125, 60);
            ctx.font = '12px Arial';
            ctx.fillStyle = '#ecf0f1';
            ctx.fillText('Building Progress', 125, 80);
            ctx.fillStyle = '#16a085';
            ctx.beginPath();
            ctx.arc(30, 30, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(220, 95, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#16a085';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(50, 95);
            ctx.lineTo(90, 95);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(160, 95);
            ctx.lineTo(200, 95);
            ctx.stroke();
        }
        return canvas.toDataURL('image/png');
    }
    renderCartCount() {
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) {
            cartCountEl.textContent = this.cart.length > 0 ? `(${this.cart.length})` : '';
        }
    }
    constructor() {
        this.currentSection = 'search';
        this.cart = [];
        this.lastSuccessfulTransaction = [];
        this.preventBackNavigation();
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser || this.currentUser.isAdmin) {
            this.redirectToLogin();
            return;
        }
        this.initializeEventListeners();
        this.updateUserDisplay();
        this.loadSearch();
        this.renderCartCount();
    }
    getCurrentUser() {
        const sessionData = localStorage.getItem('lafarge_session');
        return sessionData ? JSON.parse(sessionData) : null;
    }
    preventBackNavigation() {
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', (event) => {
            const currentUser = this.getCurrentUser();
            if (!currentUser || currentUser.isAdmin) {
                window.location.replace('index.html');
                return;
            }
            window.history.pushState(null, '', window.location.href);
        });
        window.addEventListener('beforeunload', () => {
            const currentUser = this.getCurrentUser();
            if (!currentUser || currentUser.isAdmin) {
                localStorage.removeItem('lafarge_session');
            }
            this.cart = [];
        });
    }
    redirectToLogin() {
        window.location.href = 'index.html';
    }
    initializeEventListeners() {
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
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', this.logout.bind(this));
        const searchBtn = document.getElementById('searchBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        searchBtn?.addEventListener('click', this.handleSearch.bind(this));
        clearSearchBtn?.addEventListener('click', this.clearSearch.bind(this));
        const searchInputs = [
            'searchByArticle',
            'searchByEmplacement',
            'searchByDescription'
        ];
        searchInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleSearch();
                }
            });
        });
        const filterHistoryBtn = document.getElementById('filterHistoryBtn');
        filterHistoryBtn?.addEventListener('click', this.filterHistory.bind(this));
        const refreshSearchBtn = document.getElementById('refreshSearchBtn');
        const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
        refreshSearchBtn?.addEventListener('click', this.refreshData.bind(this));
        refreshHistoryBtn?.addEventListener('click', this.refreshData.bind(this));
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
    async refreshData() {
        try {
            this.showLoading();
            await UserDataManager.loadItemsFromAPI();
            switch (this.currentSection) {
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
            this.hideLoading();
            this.showSuccessMessage('Data refreshed successfully!');
        }
        catch (error) {
            this.hideLoading();
            this.showErrorMessage('Failed to refresh data from server.');
            console.error('Refresh failed:', error);
        }
    }
    showLoading() {
        let loadingEl = document.getElementById('userLoadingIndicator');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'userLoadingIndicator';
            loadingEl.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="margin-bottom: 10px;">Loading...</div>
                        <div style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    </div>
                </div>
                <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                </style>
            `;
            document.body.appendChild(loadingEl);
        }
        loadingEl.style.display = 'block';
    }
    hideLoading() {
        const loadingEl = document.getElementById('userLoadingIndicator');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
    showSuccessMessage(message) {
        const successEl = document.createElement('div');
        successEl.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #27ae60; 
            color: white; 
            padding: 15px 20px; 
            border-radius: 5px; 
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        successEl.textContent = message;
        document.body.appendChild(successEl);
        setTimeout(() => {
            if (successEl.parentNode) {
                successEl.parentNode.removeChild(successEl);
            }
        }, 3000);
    }
    showErrorMessage(message) {
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #e74c3c; 
            color: white; 
            padding: 15px 20px; 
            border-radius: 5px; 
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.parentNode.removeChild(errorEl);
            }
        }, 5000);
    }
    switchSection(section) {
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
                this.loadSearch();
                break;
            case 'cart':
                this.renderCartWindow();
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
    loadSearch() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
    async handleSearch() {
        const searchByArticle = document.getElementById('searchByArticle').value.trim();
        const searchByEmplacement = document.getElementById('searchByEmplacement').value.trim();
        const searchByDescription = document.getElementById('searchByDescription').value.trim();
        const searchByFamille = document.getElementById('searchByFamille').value;
        const searchByService = document.getElementById('searchByService').value;
        if (!searchByArticle && !searchByEmplacement && !searchByDescription && !searchByFamille && !searchByService) {
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
                const searchTerms = searchByDescription.split('*').map(term => term.trim()).filter(term => term.length > 0);
                filteredItems = filteredItems.filter(item => {
                    const itemDescription = item.Description.toLowerCase();
                    return searchTerms.every(term => itemDescription.includes(term.toLowerCase()));
                });
            }
            if (searchByFamille) {
                filteredItems = filteredItems.filter(item => item.famille === searchByFamille);
            }
            if (searchByService) {
                filteredItems = filteredItems.filter(item => item.service === searchByService);
            }
            this.displaySearchResults(filteredItems);
            let searchTerm = '';
            let searchType = 'article';
            if (searchByArticle) {
                searchTerm = searchByArticle;
                searchType = 'article';
            }
            else if (searchByEmplacement) {
                searchTerm = searchByEmplacement;
                searchType = 'Emplacement';
            }
            else if (searchByDescription) {
                searchTerm = searchByDescription;
                searchType = 'Description';
            }
            else if (searchByFamille) {
                searchTerm = searchByFamille;
                searchType = 'famille';
            }
            else if (searchByService) {
                searchTerm = searchByService;
                searchType = 'service';
            }
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
            const isInCart = this.cart.some(ci => ci.item.id === item.id);
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
                        <div class="detail-item">
                            <span class="detail-label">Famille</span>
                            <span class="detail-value">${item.famille || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Service</span>
                            <span class="detail-value">${item.service || 'N/A'}</span>
                        </div>
                        <div class="detail-item description-item">
                            <span class="detail-label">Description</span>
                            <span class="detail-value">${item.Description}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="add-to-cart-btn" data-id="${item.id}" ${isInCart || item.Stock <= 0 ? 'disabled' : ''}>
                            ${item.Stock <= 0 ? 'Out of Stock' : (isInCart ? 'Added to Cart' : 'Add to Cart')}
                        </button>
                    </div>
                </div>
            `;
        });
        searchResults.innerHTML = resultsHTML;
        const addCartBtns = searchResults.querySelectorAll('.add-to-cart-btn');
        addCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.getAttribute('data-id') || '0');
                const item = items.find(i => i.id === id);
                if (item && item.Stock > 0 && !this.cart.some(ci => ci.item.id === item.id)) {
                    this.addToCart(item);
                    btn.disabled = true;
                    btn.textContent = 'Added to Cart';
                }
            });
        });
        this.renderCartCount();
    }
    addToCart(item) {
        if (item.Stock <= 0) {
            this.showOutOfStockModal(item);
            return;
        }
        if (item.Stock > 1) {
            this.showQuantityModal(item);
        }
        else {
            this.cart.push({ item, quantity: 1 });
            this.renderCartCount();
        }
    }
    showQuantityModal(item) {
        const modal = document.createElement('div');
        modal.id = 'quantityModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease;
        `;
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                text-align: center;
            ">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 22px;">Add to Cart</h3>
                <p style="margin: 0 0 20px 0; color: #7f8c8d; line-height: 1.5;">
                    <strong style="color: #2c3e50;">${item.article}</strong><br>
                    Available stock: <span style="color: #27ae60; font-weight: 600;">${item.Stock}</span>
                </p>
                <div style="margin: 20px 0;">
                    <label style="display: block; margin-bottom: 10px; color: #2c3e50; font-weight: 500;">Select Quantity:</label>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                        <button id="decreaseQty" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            font-size: 18px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">-</button>
                        <input type="number" id="quantityInput" value="1" min="1" max="${item.Stock}" style="
                            width: 80px;
                            padding: 12px;
                            border: 2px solid #ecf0f1;
                            border-radius: 8px;
                            font-size: 16px;
                            text-align: center;
                            font-weight: 600;
                            color: #2c3e50;
                        ">
                        <button id="increaseQty" style="
                            background: #3498db;
                            color: white;
                            border: none;
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            font-size: 18px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">+</button>
                    </div>
                </div>
                <div style="display: flex; gap: 15px; margin-top: 30px;">
                    <button id="cancelQuantity" style="
                        flex: 1;
                        padding: 12px 20px;
                        background: #95a5a6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Cancel</button>
                    <button id="confirmQuantity" style="
                        flex: 1;
                        padding: 12px 20px;
                        background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
                    ">Add to Cart</button>
                </div>
            </div>
        `;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            #decreaseQty:hover, #increaseQty:hover {
                background: #2980b9 !important;
                transform: scale(1.1);
            }
            #cancelQuantity:hover {
                background: #7f8c8d !important;
                transform: translateY(-2px);
            }
            #confirmQuantity:hover {
                background: linear-gradient(135deg, #229954 0%, #27ae60 100%) !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4) !important;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
        const quantityInput = modal.querySelector('#quantityInput');
        const decreaseBtn = modal.querySelector('#decreaseQty');
        const increaseBtn = modal.querySelector('#increaseQty');
        const cancelBtn = modal.querySelector('#cancelQuantity');
        const confirmBtn = modal.querySelector('#confirmQuantity');
        decreaseBtn.addEventListener('click', () => {
            const current = parseInt(quantityInput.value);
            if (current > 1) {
                quantityInput.value = (current - 1).toString();
            }
        });
        increaseBtn.addEventListener('click', () => {
            const current = parseInt(quantityInput.value);
            if (current < item.Stock) {
                quantityInput.value = (current + 1).toString();
            }
        });
        quantityInput.addEventListener('input', () => {
            const value = parseInt(quantityInput.value);
            if (isNaN(value) || value < 1) {
                quantityInput.value = '1';
            }
            else if (value > item.Stock) {
                quantityInput.value = item.Stock.toString();
            }
        });
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
        const closeModal = () => {
            document.removeEventListener('keydown', handleEscape);
            modal.removeEventListener('click', handleOutsideClick);
            modal.remove();
            style.remove();
        };
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            if (quantity > 0 && quantity <= item.Stock) {
                this.cart.push({ item, quantity });
                this.renderCartCount();
                closeModal();
            }
        });
        modal.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        quantityInput.focus();
        quantityInput.select();
    }
    showOutOfStockModal(item) {
        const modal = document.createElement('div');
        modal.id = 'outOfStockModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: fadeIn 0.3s ease;
        `;
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                text-align: center;
                border-left: 5px solid #e74c3c;
            ">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #e74c3c;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px auto;
                    color: white;
                    font-size: 30px;
                ">⚠️</div>
                <h3 style="margin: 0 0 15px 0; color: #e74c3c; font-size: 22px;">Item Not Available</h3>
                <p style="margin: 0 0 10px 0; color: #2c3e50; line-height: 1.5; font-weight: 600;">
                    ${item.article}
                </p>
                <p style="margin: 0 0 20px 0; color: #7f8c8d; line-height: 1.5;">
                    This item is currently out of stock and cannot be added to your cart.
                </p>
                <div style="
                    background: #ffeaea;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border: 1px solid #e74c3c;
                ">
                    <strong style="color: #e74c3c;">Stock Available: 0</strong>
                </div>
                <button id="closeOutOfStock" style="
                    width: 100%;
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
                ">OK, I Understand</button>
            </div>
        `;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            #closeOutOfStock:hover {
                background: linear-gradient(135deg, #2980b9 0%, #1f5f99 100%) !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4) !important;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
        const closeBtn = modal.querySelector('#closeOutOfStock');
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
        const closeModal = () => {
            document.removeEventListener('keydown', handleEscape);
            modal.removeEventListener('click', handleOutsideClick);
            modal.remove();
            style.remove();
        };
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        closeBtn.focus();
    }
    clearSearch() {
        document.getElementById('searchByArticle').value = '';
        document.getElementById('searchByEmplacement').value = '';
        document.getElementById('searchByDescription').value = '';
        document.getElementById('searchByFamille').value = '';
        document.getElementById('searchByService').value = '';
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
        this.showLogoutConfirmation();
    }
    showLogoutConfirmation() {
        const modal = document.createElement('div');
        modal.id = 'logoutModal';
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
            ">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #ff6b6b;
                    border-radius: 50%;
                    margin: 0 auto 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                ">⚠</div>
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 22px;">Confirm Logout</h3>
                <p style="margin: 0 0 25px 0; color: #666; font-size: 16px; line-height: 1.4;">
                    Are you sure you want to log out? You will need to log in again to access the user panel.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="cancelLogout" style="
                        padding: 12px 24px;
                        border: 2px solid #ddd;
                        background: white;
                        color: #666;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                    ">Cancel</button>
                    <button id="confirmLogout" style="
                        padding: 12px 24px;
                        border: none;
                        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                    ">Logout</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const cancelBtn = modal.querySelector('#cancelLogout');
        const confirmBtn = modal.querySelector('#confirmLogout');
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.borderColor = '#999';
            cancelBtn.style.color = '#333';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.borderColor = '#ddd';
            cancelBtn.style.color = '#666';
        });
        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.transform = 'translateY(-1px)';
            confirmBtn.style.boxShadow = '0 4px 12px rgba(238, 90, 36, 0.3)';
        });
        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.transform = 'translateY(0)';
            confirmBtn.style.boxShadow = 'none';
        });
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            this.performLogout();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    performLogout() {
        this.cart = [];
        localStorage.removeItem('lafarge_session');
        localStorage.removeItem('lafarge_items');
        localStorage.removeItem('lafarge_search_history');
        window.location.replace('index.html');
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
