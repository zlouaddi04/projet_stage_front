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

// Backend API response interface (matches @JsonProperty annotations)
interface BackendItem {
    id: number;
    usine: string;
    magasin: string;
    reference: string;  // maps to article
    emplacement: string; // maps to Emplacement
    stock: number;      // maps to Stock
    desc: string;       // maps to Description
    unite?: string;     // maps to Unite_Mesure
}

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
    lastLogin?: string;
}

interface BackendUser {
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

interface SearchHistory {
    id: number;
    userId: number;
    userEmail: string;
    searchTerm: string;
    searchType: 'article' | 'Emplacement' | 'Description';
    resultsCount: number;
    timestamp: string;
}

interface Movement {
    id: number;
    itemArticle: string;
    itemDescription: string;
    movementType: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
    quantity: number;
    fromLocation: string;
    toLocation: string;
    userId: number;
    userEmail: string;
    timestamp: string;
    notes: string;
}

// Mock data
const mockItems: Item[] = [
    { id: 1, Usine: 'M107', Magasin: 'G200', article: 'LH001', Emplacement: 'Warehouse A-1', Stock: 500, Description: 'High quality Portland cement for general construction', Unite_Mesure: 'KG' },
    { id: 2, Usine: 'M107', Magasin: 'G200', article: 'LH002', Emplacement: 'Equipment Yard B', Stock: 15, Description: 'Electric concrete mixer 350L capacity', Unite_Mesure: 'UNIT' },
    { id: 3, Usine: 'M107', Magasin: 'G200', article: 'LH003', Emplacement: 'Steel Storage C-2', Stock: 1200, Description: 'High strength steel reinforcement bars', Unite_Mesure: 'M' },
    { id: 4, Usine: 'M108', Magasin: 'G200', article: 'LH004', Emplacement: 'Outdoor Yard D', Stock: 5000, Description: 'Crushed limestone for concrete production', Unite_Mesure: 'TON' },
    { id: 5, Usine: 'M108', Magasin: 'G201', article: 'LH005', Emplacement: 'Plant E-1', Stock: 0, Description: 'Pre-mixed concrete for immediate use', Unite_Mesure: 'M3' }
];

const mockAdminUsers: AdminUser[] = [
    { id: 1, name: 'Admin User', email: 'admin@lafargeholcim.com', role: 'admin', status: 'active', lastLogin: '2024-01-17T10:30:00' },
    { id: 2, name: 'John Doe', email: 'john.doe@lafargeholcim.com', role: 'user', status: 'active', lastLogin: '2024-01-16T14:20:00' },
    { id: 3, name: 'Jane Smith', email: 'jane.smith@lafargeholcim.com', role: 'user', status: 'active', lastLogin: '2024-01-15T09:15:00' },
    { id: 4, name: 'Mike Johnson', email: 'mike.johnson@lafargeholcim.com', role: 'user', status: 'inactive' }
];

const mockSearchHistory: SearchHistory[] = [
    { id: 1, userId: 2, userEmail: 'john.doe@lafargeholcim.com', searchTerm: 'LH001', searchType: 'article', resultsCount: 1, timestamp: '2024-01-17T09:30:00' },
    { id: 2, userId: 3, userEmail: 'jane.smith@lafargeholcim.com', searchTerm: 'LH003', searchType: 'article', resultsCount: 1, timestamp: '2024-01-16T15:45:00' },
    { id: 3, userId: 2, userEmail: 'john.doe@lafargeholcim.com', searchTerm: 'Warehouse', searchType: 'Emplacement', resultsCount: 1, timestamp: '2024-01-16T11:20:00' }
];

const mockMovements: Movement[] = [
    { id: 1, itemArticle: 'LH001', itemDescription: 'High quality Portland cement', movementType: 'IN', quantity: 100, fromLocation: 'Supplier', toLocation: 'Warehouse A-1', userId: 1, userEmail: 'admin@lafargeholcim.com', timestamp: '2024-01-15T08:00:00', notes: 'New stock delivery' },
    { id: 2, itemArticle: 'LH003', itemDescription: 'High strength steel reinforcement bars', movementType: 'OUT', quantity: 50, fromLocation: 'Steel Storage C-2', toLocation: 'Project Site 1', userId: 2, userEmail: 'john.doe@lafargeholcim.com', timestamp: '2024-01-16T10:30:00', notes: 'Site delivery for Foundation work' }
];

// Data management class
class DataManager {
    private static readonly ITEMS_KEY = 'lafarge_items';
    private static readonly USERS_KEY = 'lafarge_users';
    private static readonly SEARCH_HISTORY_KEY = 'lafarge_search_history';
    private static readonly MOVEMENTS_KEY = 'lafarge_movements';
    private static readonly API_BASE_URL = 'http://localhost:8080';

    static async initializeData(): Promise<void> {
        // Load data from API and cache it
        try {
            await this.loadItemsFromAPI();
            await this.loadUsersFromAPI();
        } catch (error) {
            console.error('Failed to load data from API, using cached data:', error);
            // Fallback to existing cached data or mock data
            if (!localStorage.getItem(this.ITEMS_KEY)) {
                localStorage.setItem(this.ITEMS_KEY, JSON.stringify(mockItems));
            }
            if (!localStorage.getItem(this.USERS_KEY)) {
                localStorage.setItem(this.USERS_KEY, JSON.stringify(mockAdminUsers));
            }
        }
        
        // Initialize local data that doesn't come from API
        if (!localStorage.getItem(this.SEARCH_HISTORY_KEY)) {
            localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(mockSearchHistory));
        }
        if (!localStorage.getItem(this.MOVEMENTS_KEY)) {
            localStorage.setItem(this.MOVEMENTS_KEY, JSON.stringify(mockMovements));
        }
    }

    static async loadItemsFromAPI(): Promise<void> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/Pieces/getall`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const backendItems: BackendItem[] = await response.json();
            
            // Convert backend format to frontend format
            const convertedItems: Item[] = backendItems.map(backendItem => ({
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
            console.log('Items loaded from API:', convertedItems.length);
        } catch (error) {
            console.error('Failed to load items from API:', error);
            throw error;
        }
    }

    static async loadUsersFromAPI(): Promise<void> {
        try {
            const response = await fetch(`${this.API_BASE_URL}/users/getall`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const backendUsers: BackendUser[] = await response.json();
            // Convert the backend user format to frontend format
            const convertedUsers: AdminUser[] = backendUsers.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email || '',
                role: user.isadmin ? 'admin' : 'user',
                status: 'active' as const,
                lastLogin: undefined
            }));
            localStorage.setItem(this.USERS_KEY, JSON.stringify(convertedUsers));
            console.log('Users loaded from API:', convertedUsers.length);
        } catch (error) {
            console.error('Failed to load users from API:', error);
            throw error;
        }
    }

    static getItems(): Item[] {
        return JSON.parse(localStorage.getItem(this.ITEMS_KEY) || '[]');
    }

    static getUsers(): AdminUser[] {
        return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    }

    static getSearchHistory(): SearchHistory[] {
        return JSON.parse(localStorage.getItem(this.SEARCH_HISTORY_KEY) || '[]');
    }

    static getMovements(): Movement[] {
        return JSON.parse(localStorage.getItem(this.MOVEMENTS_KEY) || '[]');
    }

    static saveItems(items: Item[]): void {
        localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
    }

    static saveUsers(users: AdminUser[]): void {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    static saveSearchHistory(history: SearchHistory[]): void {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(history));
    }

    static saveMovements(movements: Movement[]): void {
        localStorage.setItem(this.MOVEMENTS_KEY, JSON.stringify(movements));
    }

    static addSearchHistory(userId: number, userEmail: string, searchTerm: string, searchType: 'article' | 'Emplacement' | 'Description', resultsCount: number): void {
        const history = this.getSearchHistory();
        const newEntry: SearchHistory = {
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

    // Method to refresh data from API
    static async refreshData(): Promise<void> {
        try {
            await this.loadItemsFromAPI();
            await this.loadUsersFromAPI();
            console.log('Data refreshed from API');
        } catch (error) {
            console.error('Failed to refresh data from API:', error);
            throw error;
        }
    }
}

// Admin panel controller class
class AdminPanel {
    private currentUser: UserSession | null;
    private currentSection: string = 'dashboard';

    constructor() {
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser || !this.currentUser.isAdmin) {
            this.redirectToLogin();
            return;
        }
        
        this.initializeApp();
    }

    private async initializeApp(): Promise<void> {
        try {
            // Show loading indicator
            this.showLoading();
            
            // Initialize data from API
            await DataManager.initializeData();
            
            // Initialize the app
            this.initializeEventListeners();
            this.updateUserDisplay();
            this.loadDashboard();
            
            // Hide loading indicator
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            // Still try to load with cached data
            this.initializeEventListeners();
            this.updateUserDisplay();
            this.loadDashboard();
            this.hideLoading();
            
            // Show error message to user
            this.showErrorMessage('Failed to load latest data from server. Using cached data.');
        }
    }

    private showLoading(): void {
        // Create or show loading indicator
        let loadingEl = document.getElementById('loadingIndicator');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'loadingIndicator';
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

    private hideLoading(): void {
        const loadingEl = document.getElementById('loadingIndicator');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    private showErrorMessage(message: string): void {
        // Create a temporary error message
        const errorEl = document.createElement('div');
        errorEl.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #ff6b6b; 
            color: white; 
            padding: 15px 20px; 
            border-radius: 5px; 
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.parentNode.removeChild(errorEl);
            }
        }, 5000);
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

        // Refresh data button
        const refreshBtn = document.getElementById('refreshDataBtn');
        refreshBtn?.addEventListener('click', this.refreshData.bind(this));

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        searchBtn?.addEventListener('click', this.handleSearch.bind(this));
        clearSearchBtn?.addEventListener('click', this.clearSearch.bind(this));

        // Modal handlers
        this.initializeModals();
    }

    private async refreshData(): Promise<void> {
        try {
            this.showLoading();
            await DataManager.refreshData();
            
            // Refresh current section
            switch (this.currentSection) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'items':
                    this.loadItems();
                    break;
                case 'users':
                    this.loadUsers();
                    break;
                case 'search':
                    this.loadSearch();
                    break;
                default:
                    break;
            }
            
            this.hideLoading();
            this.showSuccessMessage('Data refreshed successfully!');
        } catch (error) {
            this.hideLoading();
            this.showErrorMessage('Failed to refresh data from server.');
            console.error('Refresh failed:', error);
        }
    }

    private showSuccessMessage(message: string): void {
        const successEl = document.createElement('div');
        successEl.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #51cf66; 
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

    private initializeModals(): void {
        // Item modal
        const addItemBtn = document.getElementById('addItemBtn');
        const itemModal = document.getElementById('itemModal');
        const closeItemModal = document.getElementById('closeItemModal');
        const itemForm = document.getElementById('itemForm') as HTMLFormElement;

        addItemBtn?.addEventListener('click', () => this.showItemModal());
        closeItemModal?.addEventListener('click', () => this.hideItemModal());
        itemForm?.addEventListener('submit', this.handleItemSubmit.bind(this));

        // User modal
        const addUserBtn = document.getElementById('addUserBtn');
        const userModal = document.getElementById('userModal');
        const closeUserModal = document.getElementById('closeUserModal');
        const userForm = document.getElementById('userForm') as HTMLFormElement;

        addUserBtn?.addEventListener('click', () => this.showUserModal());
        closeUserModal?.addEventListener('click', () => this.hideUserModal());
        userForm?.addEventListener('submit', this.handleUserSubmit.bind(this));

        // Movement modal
        const addMovementBtn = document.getElementById('addMovementBtn');
        const movementModal = document.getElementById('movementModal');
        const closeMovementModal = document.getElementById('closeMovementModal');
        const movementForm = document.getElementById('movementForm') as HTMLFormElement;

        addMovementBtn?.addEventListener('click', () => this.showMovementModal());
        closeMovementModal?.addEventListener('click', () => this.hideMovementModal());
        movementForm?.addEventListener('submit', this.handleMovementSubmit.bind(this));

        // History filter
        const filterHistoryBtn = document.getElementById('filterHistoryBtn');
        filterHistoryBtn?.addEventListener('click', this.filterHistory.bind(this));
    }

    private updateUserDisplay(): void {
        const adminUserName = document.getElementById('adminUserName');
        if (adminUserName && this.currentUser) {
            adminUserName.textContent = `Welcome, ${this.currentUser.username}`;
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
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'search':
                this.loadSearch();
                break;
            case 'items':
                this.loadItems();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'history':
                this.loadHistory();
                break;
            case 'movements':
                this.loadMovements();
                break;
        }
    }

    private loadDashboard(): void {
        const items = DataManager.getItems();
        const users = DataManager.getUsers();
        const history = DataManager.getSearchHistory();
        const movements = DataManager.getMovements();

        // Update stats
        const totalItemsEl = document.getElementById('totalItems');
        const totalUsersEl = document.getElementById('totalUsers');
        const recentSearchesEl = document.getElementById('recentSearches');
        const recentMovementsEl = document.getElementById('recentMovements');

        if (totalItemsEl) totalItemsEl.textContent = items.length.toString();
        if (totalUsersEl) totalUsersEl.textContent = users.filter(u => u.status === 'active').length.toString();
        if (recentSearchesEl) recentSearchesEl.textContent = history.filter(h => this.isRecent(h.timestamp)).length.toString();
        if (recentMovementsEl) recentMovementsEl.textContent = movements.filter(m => this.isRecent(m.timestamp)).length.toString();

        // Load recent activity
        this.loadRecentActivity();
    }

    private loadRecentActivity(): void {
        const recentActivityList = document.getElementById('recentActivityList');
        if (!recentActivityList) return;

        const history = DataManager.getSearchHistory();
        const movements = DataManager.getMovements();

        const recentHistory = history.filter(h => this.isRecent(h.timestamp)).slice(-5);
        const recentMovements = movements.filter(m => this.isRecent(m.timestamp)).slice(-5);

        let activityHTML = '';

        recentHistory.forEach(h => {
            activityHTML += `
                <div class="activity-item">
                    <p><strong>Search:</strong> ${h.userEmail} searched for "${h.searchTerm}" by ${h.searchType}</p>
                    <span class="activity-time">${this.formatDateTime(h.timestamp)}</span>
                </div>
            `;
        });

        recentMovements.forEach(m => {
            activityHTML += `
                <div class="activity-item">
                    <p><strong>Movement:</strong> ${m.userEmail} recorded ${m.movementType} for ${m.itemArticle}</p>
                    <span class="activity-time">${this.formatDateTime(m.timestamp)}</span>
                </div>
            `;
        });

        if (activityHTML === '') {
            activityHTML = '<p class="no-activity">No recent activity</p>';
        }

        recentActivityList.innerHTML = activityHTML;
    }

    private loadSearch(): void {
        // Populate item usines dropdown
        const items = DataManager.getItems();
        const usines = [...new Set(items.map(item => item.Usine))];
        
        const usineSelect = document.getElementById('searchByUsine') as HTMLSelectElement;
        if (usineSelect) {
            usineSelect.innerHTML = '<option value="">All Usines</option>';
            usines.forEach(usine => {
                usineSelect.innerHTML += `<option value="${usine}">${usine}</option>`;
            });
        }
    }

    private handleSearch(): void {
        const searchByArticle = (document.getElementById('searchByArticle') as HTMLInputElement).value.trim();
        const searchByEmplacement = (document.getElementById('searchByEmplacement') as HTMLInputElement).value.trim();
        const searchByDesc = (document.getElementById('searchByDesc') as HTMLInputElement).value;

        const items = DataManager.getItems();
        let filteredItems = items;

        if (searchByArticle) {
            filteredItems = filteredItems.filter(item => 
                item.article.toLowerCase().startsWith(searchByArticle.toLowerCase())
            );
        }

        if (searchByEmplacement) {
            filteredItems = filteredItems.filter(item => 
                item.Emplacement.toLowerCase().startsWith(searchByEmplacement.toLowerCase())
            );
        }

        if (searchByDesc) {
            filteredItems = filteredItems.filter(item => item.Description.toLocaleLowerCase().startsWith(searchByDesc.toLocaleLowerCase()));
        }

        this.displaySearchResults(filteredItems);

        // Record search history
        const searchTerm = searchByArticle || searchByEmplacement || searchByDesc;
        const searchType = searchByArticle ? 'article' : searchByEmplacement ? 'Emplacement' : 'Description';
        
        if (searchTerm && this.currentUser) {
            DataManager.addSearchHistory(
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
            searchResults.innerHTML = '<div class="no-results">No items found matching your search criteria.</div>';
            return;
        }

        let resultsHTML = '<h2>Search Results</h2>';
        items.forEach(item => {
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
                            <span class="detail-value">${item.Emplacement}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Stock</span>
                            <span class="detail-value stock-${item.Stock > 0 ? 'available' : 'empty'}">${item.Stock}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Unité de Mesure</span>
                            <span class="detail-value">${item.Unite_Mesure || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
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

    private loadItems(): void {
        const items = DataManager.getItems();
        const tableBody = document.getElementById('itemsTableBody');
        if (!tableBody) return;

        let tableHTML = '';
        items.forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.article}</td>
                    <td>${item.Usine}</td>
                    <td>${item.Magasin}</td>
                    <td>${item.Emplacement}</td>
                    <td>${item.Stock}</td>
                    <td>${item.Unite_Mesure || 'N/A'}</td>
                    <td>
                        <button class="edit-btn" onclick="adminPanel.editItem(${item.id})">Edit</button>
                        <button class="delete-btn" onclick="adminPanel.deleteItem(${item.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;
    }

    private loadUsers(): void {
        const users = DataManager.getUsers();
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        let tableHTML = '';
        users.forEach(user => {
            const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
            tableHTML += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td><span class="${statusClass}">${user.status}</span></td>
                    <td>
                        <button class="edit-btn" onclick="adminPanel.editUser(${user.id})">Edit</button>
                        <button class="delete-btn" onclick="adminPanel.deleteUser(${user.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;
    }

    private loadHistory(): void {
        const history = DataManager.getSearchHistory();
        const users = DataManager.getUsers();
        
        // Populate user filter
        const historyUserSelect = document.getElementById('historyUser') as HTMLSelectElement;
        if (historyUserSelect) {
            historyUserSelect.innerHTML = '<option value="">All Users</option>';
            users.forEach(user => {
                historyUserSelect.innerHTML += `<option value="${user.email}">${user.name}</option>`;
            });
        }

        this.displayHistory(history);
    }

    private displayHistory(history: SearchHistory[]): void {
        const tableBody = document.getElementById('historyTableBody');
        if (!tableBody) return;

        let tableHTML = '';
        history.forEach(h => {
            tableHTML += `
                <tr>
                    <td>${this.formatDateTime(h.timestamp)}</td>
                    <td>${h.userEmail}</td>
                    <td>${h.searchTerm}</td>
                    <td>${h.searchType}</td>
                    <td>${h.resultsCount}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;
    }

    private filterHistory(): void {
        const dateFrom = (document.getElementById('historyDateFrom') as HTMLInputElement).value;
        const dateTo = (document.getElementById('historyDateTo') as HTMLInputElement).value;
        const userEmail = (document.getElementById('historyUser') as HTMLSelectElement).value;

        let history = DataManager.getSearchHistory();

        if (dateFrom) {
            history = history.filter(h => h.timestamp >= dateFrom + 'T00:00:00');
        }

        if (dateTo) {
            history = history.filter(h => h.timestamp <= dateTo + 'T23:59:59');
        }

        if (userEmail) {
            history = history.filter(h => h.userEmail === userEmail);
        }

        this.displayHistory(history);
    }

    private loadMovements(): void {
        const movements = DataManager.getMovements();
        const tableBody = document.getElementById('movementsTableBody');
        if (!tableBody) return;

        let tableHTML = '';
        movements.forEach(m => {
            tableHTML += `
                <tr>
                    <td>${this.formatDateTime(m.timestamp)}</td>
                    <td>${m.itemArticle}</td>
                    <td>${m.itemDescription}</td>
                    <td>${m.movementType}</td>
                    <td>${m.quantity}</td>
                    <td>${m.fromLocation}</td>
                    <td>${m.toLocation}</td>
                    <td>${m.userEmail}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;
    }

    private showItemModal(item?: Item): void {
        const modal = document.getElementById('itemModal');
        const modalTitle = document.getElementById('itemModalTitle');
        const form = document.getElementById('itemForm') as HTMLFormElement;
        
        if (item) {
            modalTitle!.textContent = 'Edit Item';
            // Populate form with item data
            (document.getElementById('itemArticle') as HTMLInputElement).value = item.article;
            (document.getElementById('itemUsine') as HTMLInputElement).value = item.Usine;
            (document.getElementById('itemMagasin') as HTMLInputElement).value = item.Magasin;
            (document.getElementById('itemEmplacement') as HTMLInputElement).value = item.Emplacement;
            (document.getElementById('itemStock') as HTMLInputElement).value = item.Stock.toString();
            (document.getElementById('itemDescription') as HTMLTextAreaElement).value = item.Description;
            (document.getElementById('itemUniteMesure') as HTMLInputElement).value = item.Unite_Mesure || '';
        } else {
            modalTitle!.textContent = 'Add Item';
            form.reset();
        }

        // Populate usine dropdown
        const items = DataManager.getItems();
        const usines = [...new Set(items.map(i => i.Usine))];
        const usineSelect = document.getElementById('itemUsineSelect') as HTMLSelectElement;
        if (usineSelect) {
            usineSelect.innerHTML = '';
            usines.forEach(usine => {
                usineSelect.innerHTML += `<option value="${usine}">${usine}</option>`;
            });
            usineSelect.innerHTML += '<option value="new">Add New Usine...</option>';

            if (item) {
                usineSelect.value = item.Usine;
            }
        }

        modal!.style.display = 'flex';
    }

    private hideItemModal(): void {
        const modal = document.getElementById('itemModal');
        modal!.style.display = 'none';
    }

    private handleItemSubmit(e: Event): void {
        e.preventDefault();
        // Implementation for saving item
        this.hideItemModal();
        this.loadItems();
    }

    private showUserModal(user?: AdminUser): void {
        const modal = document.getElementById('userModal');
        modal!.style.display = 'flex';
    }

    private hideUserModal(): void {
        const modal = document.getElementById('userModal');
        modal!.style.display = 'none';
    }

    private handleUserSubmit(e: Event): void {
        e.preventDefault();
        // Implementation for saving user
        this.hideUserModal();
        this.loadUsers();
    }

    private showMovementModal(): void {
        const modal = document.getElementById('movementModal');
        modal!.style.display = 'flex';
    }

    private hideMovementModal(): void {
        const modal = document.getElementById('movementModal');
        modal!.style.display = 'none';
    }

    private handleMovementSubmit(e: Event): void {
        e.preventDefault();
        // Implementation for saving movement
        this.hideMovementModal();
        this.loadMovements();
    }

    public editItem(id: number): void {
        const items = DataManager.getItems();
        const item = items.find(i => i.id === id);
        if (item) {
            this.showItemModal(item);
        }
    }

    public deleteItem(id: number): void {
        if (confirm('Are you sure you want to delete this item?')) {
            const items = DataManager.getItems();
            const updatedItems = items.filter(i => i.id !== id);
            DataManager.saveItems(updatedItems);
            this.loadItems();
        }
    }

    public editUser(id: number): void {
        const users = DataManager.getUsers();
        const user = users.find(u => u.id === id);
        if (user) {
            this.showUserModal(user);
        }
    }

    public deleteUser(id: number): void {
        if (confirm('Are you sure you want to delete this user?')) {
            const users = DataManager.getUsers();
            const updatedUsers = users.filter(u => u.id !== id);
            DataManager.saveUsers(updatedUsers);
            this.loadUsers();
        }
    }

    private isRecent(timestamp: string): boolean {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; // Consider last 7 days as recent
    }

    private formatDateTime(timestamp: string): string {
        return new Date(timestamp).toLocaleString();
    }

    private logout(): void {
        localStorage.removeItem('lafarge_session');
        window.location.href = 'index.html';
    }
}

// Initialize admin panel when DOM is loaded
let adminPanel: AdminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
