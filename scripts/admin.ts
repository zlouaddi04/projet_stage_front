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

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
    lastLogin?: string;
}

interface UserSession {
    userId: number;
    email: string;
    role: string;
    name: string;
    loginTime: string;
}

interface SearchHistory {
    id: number;
    userId: number;
    userEmail: string;
    searchTerm: string;
    searchType: 'name' | 'code' | 'family';
    resultsCount: number;
    timestamp: string;
}

interface Movement {
    id: number;
    itemCode: string;
    itemName: string;
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
    { id: 1, code: 'LH001', name: 'Portland Cement Type I', family: 'Cement', location: 'Warehouse A-1', price: 125.50, stock: 500, description: 'High quality Portland cement for general construction', lastUpdated: '2024-01-15' },
    { id: 2, code: 'LH002', name: 'Concrete Mixer 350L', family: 'Equipment', location: 'Equipment Yard B', price: 2500.00, stock: 15, description: 'Electric concrete mixer 350L capacity', lastUpdated: '2024-01-14' },
    { id: 3, code: 'LH003', name: 'Steel Rebar 12mm', family: 'Steel', location: 'Steel Storage C-2', price: 45.75, stock: 1200, description: 'High strength steel reinforcement bars', lastUpdated: '2024-01-16' },
    { id: 4, code: 'LH004', name: 'Limestone Aggregate', family: 'Aggregates', location: 'Outdoor Yard D', price: 25.00, stock: 5000, description: 'Crushed limestone for concrete production', lastUpdated: '2024-01-13' },
    { id: 5, code: 'LH005', name: 'Ready Mix Concrete', family: 'Concrete', location: 'Plant E-1', price: 95.00, stock: 0, description: 'Pre-mixed concrete for immediate use', lastUpdated: '2024-01-17' }
];

const mockAdminUsers: AdminUser[] = [
    { id: 1, name: 'Admin User', email: 'admin@lafargeholcim.com', role: 'admin', status: 'active', lastLogin: '2024-01-17T10:30:00' },
    { id: 2, name: 'John Doe', email: 'john.doe@lafargeholcim.com', role: 'user', status: 'active', lastLogin: '2024-01-16T14:20:00' },
    { id: 3, name: 'Jane Smith', email: 'jane.smith@lafargeholcim.com', role: 'user', status: 'active', lastLogin: '2024-01-15T09:15:00' },
    { id: 4, name: 'Mike Johnson', email: 'mike.johnson@lafargeholcim.com', role: 'user', status: 'inactive' }
];

const mockSearchHistory: SearchHistory[] = [
    { id: 1, userId: 2, userEmail: 'john.doe@lafargeholcim.com', searchTerm: 'cement', searchType: 'name', resultsCount: 1, timestamp: '2024-01-17T09:30:00' },
    { id: 2, userId: 3, userEmail: 'jane.smith@lafargeholcim.com', searchTerm: 'LH003', searchType: 'code', resultsCount: 1, timestamp: '2024-01-16T15:45:00' },
    { id: 3, userId: 2, userEmail: 'john.doe@lafargeholcim.com', searchTerm: 'Steel', searchType: 'family', resultsCount: 1, timestamp: '2024-01-16T11:20:00' }
];

const mockMovements: Movement[] = [
    { id: 1, itemCode: 'LH001', itemName: 'Portland Cement Type I', movementType: 'IN', quantity: 100, fromLocation: 'Supplier', toLocation: 'Warehouse A-1', userId: 1, userEmail: 'admin@lafargeholcim.com', timestamp: '2024-01-15T08:00:00', notes: 'New stock delivery' },
    { id: 2, itemCode: 'LH003', itemName: 'Steel Rebar 12mm', movementType: 'OUT', quantity: 50, fromLocation: 'Steel Storage C-2', toLocation: 'Project Site 1', userId: 2, userEmail: 'john.doe@lafargeholcim.com', timestamp: '2024-01-16T10:30:00', notes: 'Site delivery for Foundation work' }
];

// Data management class
class DataManager {
    private static readonly ITEMS_KEY = 'lafarge_items';
    private static readonly USERS_KEY = 'lafarge_users';
    private static readonly SEARCH_HISTORY_KEY = 'lafarge_search_history';
    private static readonly MOVEMENTS_KEY = 'lafarge_movements';

    static initializeData(): void {
        if (!localStorage.getItem(this.ITEMS_KEY)) {
            localStorage.setItem(this.ITEMS_KEY, JSON.stringify(mockItems));
        }
        if (!localStorage.getItem(this.USERS_KEY)) {
            localStorage.setItem(this.USERS_KEY, JSON.stringify(mockAdminUsers));
        }
        if (!localStorage.getItem(this.SEARCH_HISTORY_KEY)) {
            localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(mockSearchHistory));
        }
        if (!localStorage.getItem(this.MOVEMENTS_KEY)) {
            localStorage.setItem(this.MOVEMENTS_KEY, JSON.stringify(mockMovements));
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

    static addSearchHistory(userId: number, userEmail: string, searchTerm: string, searchType: 'name' | 'code' | 'family', resultsCount: number): void {
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
}

// Admin panel controller class
class AdminPanel {
    private currentUser: UserSession | null;
    private currentSection: string = 'dashboard';

    constructor() {
        this.currentUser = this.getCurrentUser();
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            this.redirectToLogin();
            return;
        }
        
        DataManager.initializeData();
        this.initializeEventListeners();
        this.updateUserDisplay();
        this.loadDashboard();
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

        // Modal handlers
        this.initializeModals();
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
            adminUserName.textContent = `Welcome, ${this.currentUser.name}`;
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
                    <p><strong>Movement:</strong> ${m.userEmail} recorded ${m.movementType} for ${m.itemCode}</p>
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
        // Populate item families dropdown
        const items = DataManager.getItems();
        const families = [...new Set(items.map(item => item.family))];
        
        const familySelect = document.getElementById('searchByFamily') as HTMLSelectElement;
        if (familySelect) {
            familySelect.innerHTML = '<option value="">All Families</option>';
            families.forEach(family => {
                familySelect.innerHTML += `<option value="${family}">${family}</option>`;
            });
        }
    }

    private handleSearch(): void {
        const searchByName = (document.getElementById('searchByName') as HTMLInputElement).value.trim();
        const searchByCode = (document.getElementById('searchByCode') as HTMLInputElement).value.trim();
        const searchByFamily = (document.getElementById('searchByFamily') as HTMLSelectElement).value;

        const items = DataManager.getItems();
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
                    <h3>${item.name} (${item.code})</h3>
                    <div class="search-result-details">
                        <div class="detail-item">
                            <span class="detail-label">Code</span>
                            <span class="detail-value">${item.code}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Family</span>
                            <span class="detail-value">${item.family}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Location</span>
                            <span class="detail-value">${item.location}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Price</span>
                            <span class="detail-value">$${item.price.toFixed(2)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Stock</span>
                            <span class="detail-value">${item.stock}</span>
                        </div>
                        <div class="detail-item">
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

    private loadItems(): void {
        const items = DataManager.getItems();
        const tableBody = document.getElementById('itemsTableBody');
        if (!tableBody) return;

        let tableHTML = '';
        items.forEach(item => {
            tableHTML += `
                <tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${item.family}</td>
                    <td>${item.location}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>${item.stock}</td>
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
                    <td>${m.itemCode}</td>
                    <td>${m.itemName}</td>
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
            (document.getElementById('itemCode') as HTMLInputElement).value = item.code;
            (document.getElementById('itemName') as HTMLInputElement).value = item.name;
            (document.getElementById('itemLocation') as HTMLInputElement).value = item.location;
            (document.getElementById('itemPrice') as HTMLInputElement).value = item.price.toString();
            (document.getElementById('itemStock') as HTMLInputElement).value = item.stock.toString();
            (document.getElementById('itemDescription') as HTMLTextAreaElement).value = item.description;
        } else {
            modalTitle!.textContent = 'Add Item';
            form.reset();
        }

        // Populate family dropdown
        const items = DataManager.getItems();
        const families = [...new Set(items.map(i => i.family))];
        const familySelect = document.getElementById('itemFamily') as HTMLSelectElement;
        familySelect.innerHTML = '';
        families.forEach(family => {
            familySelect.innerHTML += `<option value="${family}">${family}</option>`;
        });
        familySelect.innerHTML += '<option value="new">Add New Family...</option>';

        if (item) {
            familySelect.value = item.family;
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
