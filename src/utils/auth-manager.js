// Authentication Manager - Centralized authentication handling
// This module provides consistent authentication across all pages

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only import and configure Amplify in browser environment
let Auth = null;
let Amplify = null;

if (isBrowser) {
    // Use dynamic import to avoid issues in non-browser environments
    try {
        // These will be loaded via script tags in the browser
        if (window.AWS && window.AWS.Amplify) {
            Amplify = window.AWS.Amplify;
            Auth = window.AWS.Amplify.Auth;
        }
    } catch (error) {
        console.warn('Amplify not available, using mock mode');
    }
}

class AuthManager {
    constructor() {
        this.tokenKey = 'aws-native-token';
        this.userKey = 'aws-native-user';
        this.isInitialized = false;
        this.currentUser = null;
        this._authCheckInProgress = false;
        this.mockMode = !Auth; // Enable mock mode if Auth is not available
        
        // Initialize Amplify if available
        if (Auth && typeof window !== 'undefined' && window.awsExports) {
            try {
                Amplify.configure(window.awsExports);
            } catch (error) {
                console.warn('Failed to configure Amplify, using mock mode');
                this.mockMode = true;
            }
        }
    }

    // Initialize the AuthManager
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        
        try {
            // Check if Amplify is properly configured
            const config = Amplify.configure();
            if (!config.aws_cognito_region || config.aws_user_pools_id === "eu-north-1_PLACEHOLDER") {
                console.warn('AuthManager: Amplify not properly configured, using mock mode');
                this.mockMode = true;
                this.isInitialized = true;
                return;
            }
            
            // Try to load existing user session
            const existingUser = localStorage.getItem(this.userKey);
            const existingToken = localStorage.getItem(this.tokenKey);
            
            if (existingUser && existingToken) {
                try {
                    this.currentUser = JSON.parse(existingUser);
                    // Validate the session is still valid
                    const session = await Auth.currentSession();
                    if (!session || !session.isValid()) {
                        throw new Error('Session expired');
                    }
                } catch (error) {
                    console.log('AuthManager: Existing session invalid, clearing data');
                    this.clearAuthData();
                }
            }
            
            this.isInitialized = true;
            console.log('AuthManager: Initialized successfully');
        } catch (error) {
            console.error('AuthManager: Initialization failed', error);
            this.clearAuthData();
            this.mockMode = true; // Enable mock mode on initialization failure
            this.isInitialized = true; // Still mark as initialized to prevent loops
        }
    }

    // Load current user session via Amplify Auth
    async loadCurrentUser() {
        try {
            const user = await Auth.currentAuthenticatedUser();
            const session = await Auth.currentSession();
            const token = session.getIdToken().getJwtToken();
            localStorage.setItem(this.tokenKey, token);
            const attributes = await Auth.userAttributes(user);
            const userInfo = this.parseUserAttributes(attributes);
            this.currentUser = userInfo;
            localStorage.setItem(this.userKey, JSON.stringify(userInfo));
            console.log('AuthManager: User loaded successfully', userInfo);
            return true;
        } catch (error) {
            console.error('AuthManager: loadCurrentUser failed', error);
            this.clearAuthData();
            return false;
        }
    }

    // Parse user attributes from Cognito
    parseUserAttributes(attributes) {
        const userInfo = {
            username: '',
            email: '',
            firstName: '',
            lastName: '',
            userType: 'admin',
            phone: '',
            verified: false
        };

        if (attributes && Array.isArray(attributes)) {
            attributes.forEach(attr => {
                switch (attr.Name) {
                    case 'sub':
                        userInfo.id = attr.Value;
                        break;
                    case 'email':
                        userInfo.email = attr.Value;
                        userInfo.username = attr.Value;
                        break;
                    case 'given_name':
                        userInfo.firstName = attr.Value;
                        break;
                    case 'family_name':
                        userInfo.lastName = attr.Value;
                        break;
                    case 'phone_number':
                        userInfo.phone = attr.Value;
                        break;
                    case 'email_verified':
                        userInfo.verified = attr.Value === 'true';
                        break;
                    case 'custom:user_type':
                        userInfo.userType = attr.Value;
                        break;
                }
            });
        }

        return userInfo;
    }

    // Check if user is authenticated
    async isAuthenticated() {
        try {
            // If in mock mode, check for mock user
            if (this.mockMode) {
                return this.getMockAuthStatus();
            }
            
            // First check if we have a current user and valid token
            if (this.currentUser && this.getToken()) {
                try {
                    // Verify session is still valid
                    const session = await Auth.currentSession();
                    if (session && session.isValid()) {
                        return true;
                    }
                } catch (sessionError) {
                    console.log('AuthManager: Session invalid, need to re-authenticate');
                }
            }
            
            // If no valid session, try to load current user
            return await this.loadCurrentUser();
        } catch (error) {
            console.error('AuthManager: isAuthenticated check failed', error);
            this.clearAuthData();
            return false;
        }
    }

    // Mock authentication status for development
    getMockAuthStatus() {
        const mockUser = localStorage.getItem(this.userKey);
        if (mockUser) {
            try {
                this.currentUser = JSON.parse(mockUser);
                return true;
            } catch (error) {
                console.error('AuthManager: Invalid mock user data');
                this.clearAuthData();
                return false;
            }
        }
        return false;
    }

    // Require authentication (redirect to login if not authenticated)
    async requireAuth() {
        // Prevent redirection loop on login page
        const currentPath = window.location.pathname;
        if (currentPath.includes('login-aws-native.html') || currentPath.endsWith('login-aws-native.html')) {
            console.log('AuthManager: Already on login page, skipping redirection');
            return false;
        }

        // Prevent multiple concurrent authentication checks
        if (this._authCheckInProgress) {
            console.log('AuthManager: Authentication check already in progress');
            return false;
        }

        this._authCheckInProgress = true;

        try {
            const isAuth = await this.isAuthenticated();
            if (!isAuth) {
                console.log('AuthManager: Authentication required, redirecting to login');
                // Use replace to prevent back button issues
                const loginPath = currentPath.includes('/pages/') ? '../login-aws-native.html' : 'login-aws-native.html';
                window.location.replace(loginPath);
                return false;
            }
            console.log('AuthManager: Authentication confirmed');
            return true;
        } catch (error) {
            console.error('AuthManager: Error in requireAuth', error);
            this.clearAuthData();
            const loginPath = currentPath.includes('/pages/') ? '../login-aws-native.html' : 'login-aws-native.html';
            window.location.replace(loginPath);
            return false;
        } finally {
            this._authCheckInProgress = false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get authentication token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Set authentication data (called after successful login)
    setAuthData(token, userInfo) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(userInfo));
        this.currentUser = userInfo;
        console.log('AuthManager: Auth data set successfully');
    }

    // Clear all authentication data
    clearAuthData() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.clear();
        this.currentUser = null;
        console.log('AuthManager: Auth data cleared');
    }

    // Sign out user via Amplify Auth
    async signOut() {
        try {
            if (!this.mockMode) {
                await Auth.signOut();
            }
        } catch (error) {
            console.error('AuthManager: Error during sign out', error);
        }
        this.clearAuthData();
        
        // Determine the correct path for login page
        const currentPath = window.location.pathname;
        const loginPath = currentPath.includes('/pages/') ? '../login-aws-native.html' : 'login-aws-native.html';
        window.location.href = loginPath;
    }

    // Update user profile in navigation
    updateUserProfile() {
        if (!this.currentUser) return;

        // Update avatar
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            const initials = (this.currentUser.firstName?.[0] || '') + (this.currentUser.lastName?.[0] || '');
            avatar.textContent = initials || this.currentUser.email[0].toUpperCase();
        }

        // Update user name display
        const userName = document.getElementById('userName');
        if (userName) {
            const displayName = this.currentUser.firstName && this.currentUser.lastName 
                ? `${this.currentUser.firstName} ${this.currentUser.lastName}`
                : this.currentUser.email;
            userName.textContent = displayName;
        }

        // Update user email
        const userEmail = document.getElementById('userEmail');
        if (userEmail) {
            userEmail.textContent = this.currentUser.email;
        }
    }

    // Get user role/permissions
    getUserRole() {
        return this.currentUser?.userType || 'admin';
    }

    // Check if user has specific permission
    hasPermission(permission) {
        const userRole = this.getUserRole();
        
        // Define role permissions
        const rolePermissions = {
            'super_admin': ['all'],
            'admin': ['dashboard', 'users', 'merchants', 'drivers', 'reports'],
            'manager': ['dashboard', 'merchants', 'drivers', 'reports'],
            'operator': ['dashboard', 'drivers'],
            'viewer': ['dashboard']
        };

        const permissions = rolePermissions[userRole] || [];
        return permissions.includes('all') || permissions.includes(permission);
    }

    /**
     * Sign in a user and handle challenges
     */
    async signIn(username, password) {
        try {
            // If in mock mode, use mock authentication
            if (this.mockMode) {
                return this.mockSignIn(username, password);
            }
            
            const user = await Auth.signIn(username, password);
            // Handle MFA or new password challenge
            if (user.challengeName === 'SMS_MFA' || user.challengeName === 'SOFTWARE_TOKEN_MFA') {
                // Store interim user for confirmation
                this.currentUser = user;
                return { challenge: 'MFA' };
            }
            if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
                this.currentUser = user;
                return { challenge: 'NEW_PASSWORD' };
            }
            // Successful sign in
            await this.loadCurrentUser();
            return { challenge: null };
        } catch (error) {
            console.error('AuthManager: signIn error', error);
            throw error;
        }
    }

    // Mock sign-in for development
    mockSignIn(username, password) {
        // Simple mock validation
        if (username && password) {
            const mockUser = {
                id: 'mock-user-id',
                username: username,
                email: username,
                firstName: 'Mock',
                lastName: 'User',
                userType: 'admin',
                verified: true
            };
            
            const mockToken = 'mock-jwt-token-' + Date.now();
            this.setAuthData(mockToken, mockUser);
            return { challenge: null };
        } else {
            throw new Error('Invalid credentials');
        }
    }

    /**
     * Confirm MFA code
     */
    async confirmSignIn(code) {
        try {
            const user = this.currentUser;
            const result = await Auth.confirmSignIn(user, code);
            await this.loadCurrentUser();
            return result;
        } catch (error) {
            console.error('AuthManager: confirmSignIn error', error);
            throw error;
        }
    }

    /**
     * Complete new password challenge
     */
    async completeNewPassword(newPassword) {
        try {
            const user = this.currentUser;
            const result = await Auth.completeNewPassword(user, newPassword);
            await this.loadCurrentUser();
            return result;
        } catch (error) {
            console.error('AuthManager: completeNewPassword error', error);
            throw error;
        }
    }
}

// Create a global instance
const authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authManager;
} else if (typeof window !== 'undefined') {
    window.AuthManager = authManager;
}

export default authManager;
