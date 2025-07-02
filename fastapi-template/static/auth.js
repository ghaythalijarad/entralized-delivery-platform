/**
 * Authentication utility for frontend
 * Handles JWT tokens, user sessions, and API authentication
 */

class AuthManager {
    constructor() {
        // Determine API base URL from meta tag or default to origin
        const meta = document.querySelector('meta[name="api-base"]');
        this.API_BASE = (meta && meta.content) ? meta.content : window.location.origin;
        this.TOKEN_KEY = 'authToken';
        this.USER_KEY = 'userInfo';
    }

    // Get stored auth token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Get stored user info
    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired (basic check)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp * 1000 < Date.now();
            if (isExpired) {
                this.logout();
                return false;
            }
            return true;
        } catch (e) {
            this.logout();
            return false;
        }
    }

    // Store authentication data
    setAuth(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    // Clear authentication data
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    // Get authorization headers for API calls
    getAuthHeaders() {
        const token = this.getToken();
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }

    // Make authenticated API request
    async apiRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE}${endpoint}`;
        
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle authentication errors
            if (response.status === 401) {
                this.logout();
                window.location.href = '/static/login.html';
                return null;
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Get user role and permissions
    getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }

    // Check if user has specific role
    hasRole(role) {
        const userRole = this.getUserRole();
        if (!userRole) return false;
        
        const roleHierarchy = {
            'admin': ['admin', 'manager', 'viewer'],
            'manager': ['manager', 'viewer'],
            'viewer': ['viewer']
        };

        return roleHierarchy[userRole]?.includes(role) || false;
    }

    // Check if user can perform action
    canPerform(action) {
        const role = this.getUserRole();
        if (!role) return false;

        const permissions = {
            'admin': [
                'users:create', 'users:read', 'users:update', 'users:delete',
                'orders:read', 'orders:update',
                'merchants:read', 'merchants:update',
                'drivers:read', 'drivers:update',
                'customers:read', 'analytics:read',
                'settings:read', 'settings:update'
            ],
            'manager': [
                'users:read', 'orders:read', 'orders:update',
                'merchants:read', 'merchants:update',
                'drivers:read', 'drivers:update',
                'customers:read', 'analytics:read'
            ],
            'viewer': [
                'orders:read', 'merchants:read',
                'drivers:read', 'customers:read', 'analytics:read'
            ]
        };

        return permissions[role]?.includes(action) || false;
    }

    // Initialize authentication check for protected pages
    initAuthCheck() {
        if (!this.isAuthenticated()) {
            window.location.href = '/static/login.html';
            return false;
        }
        return true;
    }

    // Display user info in UI
    displayUserInfo() {
        const user = this.getUser();
        if (!user) return;

        // Update user display elements
        const userNameElements = document.querySelectorAll('.user-name');
        const userRoleElements = document.querySelectorAll('.user-role');
        const userEmailElements = document.querySelectorAll('.user-email');

        userNameElements.forEach(el => el.textContent = user.full_name || user.username);
        userRoleElements.forEach(el => el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1));
        userEmailElements.forEach(el => el.textContent = user.email);

        // Show/hide elements based on role
        this.updateUIBasedOnRole();
    }

    // Update UI elements based on user role
    updateUIBasedOnRole() {
        const role = this.getUserRole();
        
        // Hide admin-only elements for non-admins
        document.querySelectorAll('[data-role="admin"]').forEach(el => {
            el.style.display = this.hasRole('admin') ? '' : 'none';
        });

        // Hide manager+ elements for viewers
        document.querySelectorAll('[data-role="manager"]').forEach(el => {
            el.style.display = this.hasRole('manager') ? '' : 'none';
        });

        // Update action buttons based on permissions
        document.querySelectorAll('[data-action]').forEach(el => {
            const action = el.getAttribute('data-action');
            if (!this.canPerform(action)) {
                el.style.display = 'none';
            }
        });
    }

    // Setup logout functionality
    setupLogout() {
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
                window.location.href = '/static/login.html';
            });
        });
    }
}

// Global authentication manager instance
window.authManager = new AuthManager();

// Auto-redirect to login if not authenticated (for protected pages)
document.addEventListener('DOMContentLoaded', () => {
    // Skip auth check for login page
    if (window.location.pathname.includes('login.html')) {
        return;
    }

    // Initialize auth check for all other pages
    if (window.authManager.initAuthCheck()) {
        window.authManager.displayUserInfo();
        window.authManager.setupLogout();
    }
});

// Utility functions for making authenticated API calls
window.apiGet = async (endpoint) => {
    const response = await window.authManager.apiRequest(endpoint);
    return response ? await response.json() : null;
};

window.apiPost = async (endpoint, data) => {
    const response = await window.authManager.apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    return response ? await response.json() : null;
};

window.apiPut = async (endpoint, data) => {
    const response = await window.authManager.apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response ? await response.json() : null;
};

window.apiDelete = async (endpoint) => {
    const response = await window.authManager.apiRequest(endpoint, {
        method: 'DELETE'
    });
    return response ? await response.json() : null;
};
