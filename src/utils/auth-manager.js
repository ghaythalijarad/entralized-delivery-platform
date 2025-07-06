// Authentication Manager - Centralized authentication handling
// This module provides consistent authentication across all pages

class AuthManager {
    constructor() {
        this.tokenKey = 'aws-native-token';
        this.userKey = 'aws-native-user';
        this.sessionKey = 'aws-native-session';
        this.isInitialized = false;
        this.currentUser = null;
        this.userPool = null;
        this.cognitoUser = null;
    }

    // Initialize the authentication manager
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize Cognito User Pool
            if (typeof AmazonCognitoIdentity !== 'undefined' && typeof awsConfig !== 'undefined') {
                const poolData = {
                    UserPoolId: awsConfig.cognito.userPoolId,
                    ClientId: awsConfig.cognito.userPoolClientId
                };
                this.userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
                console.log('AuthManager: Cognito User Pool initialized');
            }
            
            // Load current user session
            await this.loadCurrentUser();
            this.isInitialized = true;
            console.log('AuthManager: Initialized successfully');
        } catch (error) {
            console.error('AuthManager: Initialization failed', error);
            this.isInitialized = false;
        }
    }

    // Load current user from storage or Cognito
    async loadCurrentUser() {
        try {
            // First check if we have a valid token
            const token = localStorage.getItem(this.tokenKey);
            if (!token) {
                console.log('AuthManager: No token found');
                return false;
            }

            // Try to get current user from Cognito
            if (this.userPool) {
                const cognitoUser = this.userPool.getCurrentUser();
                if (cognitoUser) {
                    return new Promise((resolve) => {
                        cognitoUser.getSession((err, session) => {
                            if (err || !session || !session.isValid()) {
                                console.log('AuthManager: Invalid session, clearing auth data');
                                this.clearAuthData();
                                resolve(false);
                            } else {
                                // Get user attributes
                                cognitoUser.getUserAttributes((err, attributes) => {
                                    if (err) {
                                        console.error('AuthManager: Error getting user attributes', err);
                                        resolve(false);
                                    } else {
                                        // Store user info
                                        const userInfo = this.parseUserAttributes(attributes);
                                        this.currentUser = userInfo;
                                        localStorage.setItem(this.userKey, JSON.stringify(userInfo));
                                        this.cognitoUser = cognitoUser;
                                        console.log('AuthManager: User loaded successfully', userInfo);
                                        resolve(true);
                                    }
                                });
                            }
                        });
                    });
                }
            }

            // Fallback: check if we have stored user info
            const storedUser = localStorage.getItem(this.userKey);
            if (storedUser) {
                try {
                    this.currentUser = JSON.parse(storedUser);
                    console.log('AuthManager: User loaded from storage', this.currentUser);
                    return true;
                } catch (e) {
                    console.error('AuthManager: Error parsing stored user', e);
                    this.clearAuthData();
                    return false;
                }
            }

            return false;
        } catch (error) {
            console.error('AuthManager: Error loading current user', error);
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
        if (!this.isInitialized) {
            await this.initialize();
        }

        const token = localStorage.getItem(this.tokenKey);
        if (!token) {
            return false;
        }

        // If we have a current user, check session validity
        if (this.currentUser) {
            return true;
        }

        // Try to load user
        return await this.loadCurrentUser();
    }

    // Require authentication (redirect to login if not authenticated)
    async requireAuth() {
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
            console.log('AuthManager: Authentication required, redirecting to login');
            window.location.href = 'login-aws-native.html';
            return false;
        }
        return true;
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
        localStorage.removeItem(this.sessionKey);
        sessionStorage.clear();
        this.currentUser = null;
        this.cognitoUser = null;
        console.log('AuthManager: Auth data cleared');
    }

    // Sign out user
    async signOut() {
        try {
            // Sign out from Cognito if available
            if (this.cognitoUser) {
                this.cognitoUser.signOut();
            } else if (this.userPool) {
                const cognitoUser = this.userPool.getCurrentUser();
                if (cognitoUser) {
                    cognitoUser.signOut();
                }
            }

            // Clear local data
            this.clearAuthData();
            
            console.log('AuthManager: User signed out successfully');
            
            // Redirect to login
            window.location.href = 'login-aws-native.html';
        } catch (error) {
            console.error('AuthManager: Error during sign out', error);
            // Clear data anyway
            this.clearAuthData();
            window.location.href = 'login-aws-native.html';
        }
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

    // Setup authentication event listeners
    setupAuthListeners() {
        // Sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.signOut();
            });
        }

        // Handle token expiration
        window.addEventListener('beforeunload', () => {
            // Check if session is still valid before page unload
            if (this.currentUser && this.cognitoUser) {
                this.cognitoUser.getSession((err, session) => {
                    if (err || !session || !session.isValid()) {
                        this.clearAuthData();
                    }
                });
            }
        });
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
}

// Create global instance
const authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

// Make available globally
window.AuthManager = authManager;
