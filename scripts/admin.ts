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



// Data management class
class DataManager {
    private static readonly ITEMS_KEY = 'lafarge_items';
    private static readonly USERS_KEY = 'lafarge_users';
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

    static saveItems(items: Item[]): void {
        localStorage.setItem(this.ITEMS_KEY, JSON.stringify(items));
    }

    static saveUsers(users: AdminUser[]): void {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
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

    // Method to get API base URL
    static getApiBaseUrl(): string {
        return this.API_BASE_URL;
    }
}

// Admin panel controller class
class AdminPanel {
    private currentUser: UserSession | null;
    private currentSection: string = 'dashboard';

    constructor() {
        // Prevent back navigation to login after session is established
        this.preventBackNavigation();
        
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

    private preventBackNavigation(): void {
        // Add state to history to prevent back navigation
        window.history.pushState(null, '', window.location.href);
        
        // Listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', (event) => {
            // Check if user is still logged in
            const currentUser = this.getCurrentUser();
            if (!currentUser || !currentUser.isAdmin) {
                // User is not logged in, redirect to login
                window.location.replace('index.html');
                return;
            }
            
            // User is logged in, prevent going back
            window.history.pushState(null, '', window.location.href);
        });
        
        // Also prevent using browser refresh to bypass login
        window.addEventListener('beforeunload', () => {
            const currentUser = this.getCurrentUser();
            if (!currentUser || !currentUser.isAdmin) {
                localStorage.removeItem('lafarge_session');
            }
        });
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
        const refreshBtn = document.getElementById('refreshDataBtn');
        
        try {
            // Add loading state to refresh button
            if (refreshBtn) {
                refreshBtn.classList.add('loading');
                refreshBtn.textContent = 'Refreshing...';
            }
            
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
        } finally {
            // Remove loading state from refresh button
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
                refreshBtn.textContent = 'Refresh Data';
            }
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
        }
    }

    private loadDashboard(): void {
        const items = DataManager.getItems();
        const users = DataManager.getUsers();
        const zeroStockItems = items.filter(item => item.Stock === 0);

        // Update stats
        const totalItemsEl = document.getElementById('totalItems');
        const totalUsersEl = document.getElementById('totalUsers');
        const zeroStockItemsEl = document.getElementById('zeroStockItems');

        if (totalItemsEl) totalItemsEl.textContent = items.length.toString();
        if (totalUsersEl) totalUsersEl.textContent = users.filter(u => u.status === 'active').length.toString();
        if (zeroStockItemsEl) zeroStockItemsEl.textContent = zeroStockItems.length.toString();

        // Initialize zero stock card click handler
        this.initializeDashboardCards();
    }

    private initializeDashboardCards(): void {
        // Initialize all clickable dashboard cards
        const totalItemsCard = document.getElementById('totalItemsCard');
        const totalUsersCard = document.getElementById('totalUsersCard');
        const zeroStockCard = document.getElementById('zeroStockCard');

        // Total Items Card - redirect to items section
        if (totalItemsCard) {
            const newItemsCard = totalItemsCard.cloneNode(true) as HTMLElement;
            totalItemsCard.parentNode?.replaceChild(newItemsCard, totalItemsCard);
            
            newItemsCard.addEventListener('click', () => {
                this.switchSection('items');
            });
            
            newItemsCard.style.cursor = 'pointer';
        }

        // Total Users Card - redirect to users section
        if (totalUsersCard) {
            const newUsersCard = totalUsersCard.cloneNode(true) as HTMLElement;
            totalUsersCard.parentNode?.replaceChild(newUsersCard, totalUsersCard);
            
            newUsersCard.addEventListener('click', () => {
                this.switchSection('users');
            });
            
            newUsersCard.style.cursor = 'pointer';
        }

        // Zero Stock Card - show zero stock items
        if (zeroStockCard) {
            const newZeroStockCard = zeroStockCard.cloneNode(true) as HTMLElement;
            zeroStockCard.parentNode?.replaceChild(newZeroStockCard, zeroStockCard);
            
            newZeroStockCard.addEventListener('click', () => {
                this.displayZeroStockItems();
            });
            
            newZeroStockCard.style.cursor = 'pointer';
        }
    }

    private displayZeroStockItems(): void {
        const items = DataManager.getItems();
        const zeroStockItems = items.filter(item => item.Stock === 0);
        const resultsContainer = document.getElementById('zeroStockResults');
        
        if (!resultsContainer) return;

        if (zeroStockItems.length === 0) {
            resultsContainer.innerHTML = `
                <div class="zero-stock-header">
                    <h2>Items Out of Stock</h2>
                </div>
                <div class="no-results">No items are currently out of stock.</div>
            `;
            resultsContainer.style.display = 'block';
            return;
        }

        let resultsHTML = `
            <div class="zero-stock-header">
                <h2>Items Out of Stock (${zeroStockItems.length} items)</h2>
                <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
        `;
        
        zeroStockItems.forEach(item => {
            resultsHTML += `
                <div class="search-result-item zero-stock-item">
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
                            <span class="detail-value stock-empty">0</span>
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

        resultsContainer.innerHTML = resultsHTML;
        resultsContainer.style.display = 'block';
        
        // Scroll to the results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    }

    private displaySearchResults(items: Item[]): void {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (items.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No items found matching your search criteria.</div>';
            return;
        }

        let resultsHTML = `<h2>Search Results (${items.length} items found)</h2>`;
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
                    <td>${item.Description}</td>
                    <td>${item.Emplacement}</td>
                    <td>${item.Stock}</td>
                    <td>
                        <button class="edit-btn" data-action="edit-item" data-id="${item.id}">Edit</button>
                        <button class="delete-btn" data-action="delete-item" data-id="${item.id}">Delete</button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;

        // Add event listeners for the new buttons
        this.addItemButtonListeners();
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
                        <button class="edit-btn" data-action="edit-user" data-id="${user.id}">Edit</button>
                        <button class="delete-btn" data-action="delete-user" data-id="${user.id}">Delete</button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = tableHTML;

        // Add event listeners for the new buttons
        this.addUserButtonListeners();
    }

    private addItemButtonListeners(): void {
        const tableBody = document.getElementById('itemsTableBody');
        if (!tableBody) return;

        const buttons = tableBody.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            const action = button.getAttribute('data-action');
            const id = parseInt(button.getAttribute('data-id') || '0');
            
            button.addEventListener('click', () => {
                if (action === 'edit-item') {
                    this.editItem(id);
                } else if (action === 'delete-item') {
                    this.deleteItem(id);
                }
            });
        });
    }

    private addUserButtonListeners(): void {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        const buttons = tableBody.querySelectorAll('button[data-action]');
        buttons.forEach(button => {
            const action = button.getAttribute('data-action');
            const id = parseInt(button.getAttribute('data-id') || '0');
            
            button.addEventListener('click', () => {
                if (action === 'edit-user') {
                    this.editUser(id);
                } else if (action === 'delete-user') {
                    this.deleteUser(id);
                }
            });
        });
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

    private async handleItemSubmit(e: Event): Promise<void> {
        e.preventDefault();
        
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        
        // Map form fields to match backend @JsonProperty annotations
        const itemData = {
            reference: formData.get('itemArticle') as string,
            Usine: formData.get('itemUsine') as string || 'M107',
            Magasin: formData.get('itemMagasin') as string || 'G200',
            emplacement: formData.get('itemEmplacement') as string,
            stock: parseInt(formData.get('itemStock') as string),
            desc: formData.get('itemDescription') as string,
            unite: formData.get('itemUniteMesure') as string
        };

        // Basic validation
        if (!itemData.reference || !itemData.emplacement || !itemData.desc || !itemData.unite) {
            alert('Please fill in all required fields');
            return;
        }

        if (itemData.stock < 0) {
            alert('Stock quantity cannot be negative');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/Pieces/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(itemData)
            });

            const result = await response.json();
            
            // Check the API response structure
            if (response.ok && (result.statusCode === 200 || result.success !== false)) {
                alert('Item added successfully!');
                this.hideItemModal();
                form.reset();
                
                // Refresh data to show the new item
                await DataManager.loadItemsFromAPI();
                this.loadItems();
                
                // If we're on dashboard, refresh dashboard stats too
                if (this.currentSection === 'dashboard') {
                    this.loadDashboard();
                }
            } else {
                // Handle API error response
                const errorMessage = result.message || result.error || 'Failed to add item';
                alert(`Error: ${errorMessage}`);
            }
            
        } catch (error) {
            console.error('Error adding item:', error);
            if (error instanceof Error) {
                alert(`Error adding item: ${error.message}`);
            } else {
                alert('Error adding item: An unknown error occurred.');
            }
        }
    }

    private showUserModal(user?: AdminUser): void {
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('userModalTitle');
        const form = document.getElementById('userForm') as HTMLFormElement;
        
        if (user) {
            modalTitle!.textContent = 'Edit User';
            // Populate form with user data
            (document.getElementById('userName') as HTMLInputElement).value = user.name;
            (document.getElementById('userEmail') as HTMLInputElement).value = user.email;
            (document.getElementById('userRole') as HTMLSelectElement).value = user.role;
            (document.getElementById('userPassword') as HTMLInputElement).value = ''; // Don't show password
        } else {
            modalTitle!.textContent = 'Add User';
            form.reset();
        }

        modal!.style.display = 'flex';
    }

    private hideUserModal(): void {
        const modal = document.getElementById('userModal');
        modal!.style.display = 'none';
    }

    private async handleUserSubmit(e: Event): Promise<void> {
        e.preventDefault();
        
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        
        // Get form values
        const name = (document.getElementById('userName') as HTMLInputElement).value.trim();
        const email = (document.getElementById('userEmail') as HTMLInputElement).value.trim();
        const role = (document.getElementById('userRole') as HTMLSelectElement).value;
        const password = (document.getElementById('userPassword') as HTMLInputElement).value.trim();
        
        // Validate required fields
        if (!name || !email || !password) {
            this.showErrorMessage('Please fill in all required fields.');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showErrorMessage('Please enter a valid email address.');
            return;
        }
        
        // Validate password length
        if (password.length < 4) {
            this.showErrorMessage('Password must be at least 4 characters long.');
            return;
        }
        
        // Prepare user data for API
        const userData = {
            name: name,
            email: email,
            password: password,
            isadmin: role === 'admin'
        };
        
        try {
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Adding User...';
            submitBtn.disabled = true;
            
            // Call API to add user
            const response = await fetch(`${DataManager.getApiBaseUrl()}/users/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Check if the API response indicates success
            if (result.data) {
                this.showSuccessMessage('User added successfully!');
                this.hideUserModal();
                
                // Refresh the users list
                await DataManager.loadUsersFromAPI();
                this.loadUsers();
            } else {
                throw new Error(result.message || 'Failed to add user');
            }
            
        } catch (error) {
            console.error('Error adding user:', error);
            
            // Handle specific error cases
            if (error instanceof Error) {
                if (error.message.includes('username already taken') || error.message.includes('CONFLICT')) {
                    this.showErrorMessage('A user with this name already exists. Please use a different name.');
                } else if (error.message.includes('Fill all fields')) {
                    this.showErrorMessage('Please fill in all required fields.');
                } else {
                    this.showErrorMessage(`Failed to add user: ${error.message}`);
                }
            } else {
                this.showErrorMessage('Failed to add user. Please check your connection and try again.');
            }
        } finally {
            // Restore button state
            const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            submitBtn.textContent = 'Save User';
            submitBtn.disabled = false;
        }
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

    public async deleteUser(id: number): Promise<void> {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            // Find the user to get their name (which corresponds to username in backend)
            const users = DataManager.getUsers();
            const user = users.find(u => u.id === id);
            
            if (!user) {
                this.showErrorMessage('User not found.');
                return;
            }

            // Show loading state
            this.showLoading();

            // Call API to delete user using the name field (which maps to username in backend)
            const response = await fetch(`${DataManager.getApiBaseUrl()}/users/delete/${encodeURIComponent(user.name)}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Check if the API response indicates success
            if (result.data || result.success !== false) {
                this.showSuccessMessage('User deleted successfully!');
                
                // Refresh the users list
                await DataManager.loadUsersFromAPI();
                this.loadUsers();
            } else {
                throw new Error(result.message || 'Failed to delete user');
            }

        } catch (error) {
            console.error('Error deleting user:', error);
            
            if (error instanceof Error) {
                if (error.message.includes('User Not Found') || error.message.includes('NOT_FOUND')) {
                    this.showErrorMessage('User not found. They may have been already deleted.');
                } else {
                    this.showErrorMessage(`Failed to delete user: ${error.message}`);
                }
            } else {
                this.showErrorMessage('Failed to delete user. Please check your connection and try again.');
            }
        } finally {
            this.hideLoading();
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
        this.showLogoutConfirmation();
    }

    private showLogoutConfirmation(): void {
        // Create logout confirmation modal
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
                    Are you sure you want to log out? You will need to log in again to access the admin panel.
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

        // Add hover effects
        const cancelBtn = modal.querySelector('#cancelLogout') as HTMLButtonElement;
        const confirmBtn = modal.querySelector('#confirmLogout') as HTMLButtonElement;

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

        // Handle button clicks
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            this.performLogout();
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

    private performLogout(): void {
        // Clear session data
        localStorage.removeItem('lafarge_session');
        
        // Clear any other cached data to ensure fresh login
        localStorage.removeItem('lafarge_items');
        localStorage.removeItem('lafarge_users');
        
        // Replace current page in history to prevent back navigation
        window.location.replace('index.html');
    }
}

// Initialize admin panel when DOM is loaded
let adminPanel: AdminPanel;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
