// Authentication Manager - Centralized authentication handling
// This module provides consistent authentication across all pages

// Add AWS Amplify configuration and import Auth API
import Amplify, { Auth } from 'aws-amplify';
import awsExports from '../aws-exports';

Amplify.configure(awsExports);

class AuthManager {
    constructor() {
        this.tokenKey = 'aws-native-token';
        this.userKey = 'aws-native-user';
        this.isInitialized = false;
        this.currentUser = null;
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
            console.log('AuthManager: loadCurrentUser failed', error);
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
        return await this.loadCurrentUser();
    }

    // Require authentication (redirect to login if not authenticated)
    async requireAuth() {
        // Skip authentication requirement on login page to avoid loop
        if (window.location.pathname.endsWith('login-aws-native.html')) {
            return false;
        }
        try {
            const isAuth = await this.isAuthenticated();
            if (!isAuth) {
                console.log('AuthManager: Authentication required, redirecting to login');
                // Redirect immediately without repeated calls
                window.location.replace('login-aws-native.html');
                return false;
            }
            console.log('AuthManager: Authentication confirmed');
            return true;
        } catch (error) {
            console.error('AuthManager: Error in requireAuth', error);
            return false;
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
            await Auth.signOut();
        } catch (error) {
            console.error('AuthManager: Error during sign out', error);
        }
        this.clearAuthData();
        window.location.href = 'login-aws-native.html';
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

// Export for use in other modules
export default authManager;
