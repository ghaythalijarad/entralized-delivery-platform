/**
 * Authentication utility for frontend
 * Handles JWT tokens, user sessions, and API authentication
 */

class AuthManager {
    constructor() {
        // Determine API base URL from meta tag or default to origin
        const meta = document.querySelector('meta[name="api-base"]');
        this.API_BASE = (meta && meta.content) ? meta.content : window.location.origin;
        this.TOKEN_KEY = 'accessToken';
        this.USER_KEY = 'userInfo';
        this.isRefreshing = false; // Flag to prevent multiple refresh attempts
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
                // Don't logout immediately, try to refresh first
                return false;
            }
            return true;
        } catch (e) {
            this.clearAuth();
            return false;
        }
    }

    // Store authentication data
    setAuth(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    // Logout: invalidate session on server and clear local data
    async logout() {
        try {
            await this.apiRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            this.clearAuth();
            // Clear session storage as well
            sessionStorage.clear();
            // Clear localStorage completely
            localStorage.clear();
            // Use a slight delay to ensure storage is cleared
            setTimeout(() => {
                window.location.replace('/');
            }, 100);
        }
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

    // Attempt to refresh the access token
    async refreshToken() {
        if (this.isRefreshing) {
            return false; // Prevent concurrent refresh attempts
        }
        this.isRefreshing = true;

        try {
            const response = await fetch(`${this.API_BASE}/auth/refresh`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Credentials must be included to send cookies
                credentials: 'include' 
            });

            if (response.ok) {
                const data = await response.json();
                this.setAuth(data.access_token, this.getUser()); // Update token
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        } finally {
            this.isRefreshing = false;
        }
    }

    // Make authenticated API request with auto-refresh
    async apiRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE}${endpoint}`;
        
        let config = {
            headers: this.getAuthHeaders(),
            ...options,
            credentials: 'include' // Send cookies with all requests
        };

        try {
            let response = await fetch(url, config);
            
            // If token expired, try to refresh and retry the request
            if (response.status === 401 && endpoint !== '/auth/refresh') {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry the original request with the new token
                    config.headers = this.getAuthHeaders();
                    response = await fetch(url, config);
                } else {
                    // If refresh fails, log out
                    this.logout();
                    return null;
                }
            }

            // Final check for auth failure
            if (response.status === 401) {
                this.logout();
                return null;
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Get user role and permissions
    getUserGroups() {
        const user = this.getUser();
        return user ? user.groups : [];
    }

    // Check if user has specific role
    hasRole(role) {
        const groups = this.getUserGroups();
        return groups.includes(role);
    }

    // Check if user can perform action
    canPerform(action) {
        const groups = this.getUserGroups();
        if (!groups) return false;

        // Define permissions per Cognito group
        const permissionsMap = {
            Admins: [
                'users:create','users:read','users:update','users:delete',
                'orders:read','orders:update',
                'merchants:read','merchants:update',
                'drivers:read','drivers:update',
                'customers:read','analytics:read',
                'settings:read','settings:update'
            ],
            Managers: [
                'users:read','orders:read','orders:update',
                'merchants:read','merchants:update',
                'drivers:read','drivers:update',
                'customers:read','analytics:read'
            ],
            Viewers: [
                'orders:read','merchants:read',
                'drivers:read','customers:read','analytics:read'
            ]
        };
        // Check across groups
        return groups.some(g => permissionsMap[g]?.includes(action));
    }

    // Initialize authentication check for protected pages
    initAuthCheck() {
        if (!this.isAuthenticated()) {
            // Try a silent refresh on page load if token is missing or seems expired
            this.refreshToken().then(refreshed => {
                if (!refreshed) {
                    window.location.href = '/static/login.html';
                }
            });
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

        userNameElements.forEach(el => el.textContent = user.username);
        userRoleElements.forEach(el => el.textContent = (user.groups || []).join(', '));

        // Show/hide elements based on role
        this.updateUIBasedOnRole();
    }

    // Update UI elements based on user role
    updateUIBasedOnRole() {
        // Hide admin-only elements for non-admins
        document.querySelectorAll('[data-role="Admins"]').forEach(el => {
            el.style.display = this.hasRole('Admins') ? '' : 'none';
        });

        // Hide manager+ elements for viewers
        document.querySelectorAll('[data-role="Managers"]').forEach(el => {
            el.style.display = (this.hasRole('Admins') || this.hasRole('Managers')) ? '' : 'none';
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
