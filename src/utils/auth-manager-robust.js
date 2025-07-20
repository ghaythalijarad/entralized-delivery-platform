// Authentication Manager - Centralized authentication handling
// Robust version with dynamic SDK loading and comprehensive error handling

class RobustAuthManager {
    constructor() {
        this.tokenKey = 'aws-native-token';
        this.userKey = 'aws-native-user';
        this.isInitialized = false;
        this.currentUser = null;
        this._authCheckInProgress = false;
        this.Auth = null;
        this.Amplify = null;
        this.mockMode = false;
        this.config = null;
        
        // Initialize on construction
        this.initialize();
    }

    // Dynamic SDK loading
    async loadAmplifySDK() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (this.Auth && this.Amplify) {
                resolve();
                return;
            }

            // Try to find existing Amplify
            if (window.aws_amplify) {
                this.Amplify = window.aws_amplify;
                this.Auth = window.aws_amplify.Auth;
                console.log('✅ Found existing Amplify (aws_amplify)');
                resolve();
                return;
            } else if (window.AWS && window.AWS.Amplify) {
                this.Amplify = window.AWS.Amplify;
                this.Auth = window.AWS.Amplify.Auth;
                console.log('✅ Found existing Amplify (AWS.Amplify)');
                resolve();
                return;
            } else if (window.Amplify) {
                this.Amplify = window.Amplify;
                this.Auth = window.Amplify.Auth;
                console.log('✅ Found existing Amplify (Amplify)');
                resolve();
                return;
            }

            // Load SDK dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/aws-amplify@5.3.11/dist/aws-amplify.min.js';
            
            script.onload = () => {
                setTimeout(() => {
                    if (window.aws_amplify) {
                        this.Amplify = window.aws_amplify;
                        this.Auth = window.aws_amplify.Auth;
                        console.log('✅ Amplify SDK loaded (aws_amplify)');
                        resolve();
                    } else if (window.AWS && window.AWS.Amplify) {
                        this.Amplify = window.AWS.Amplify;
                        this.Auth = window.AWS.Amplify.Auth;
                        console.log('✅ Amplify SDK loaded (AWS.Amplify)');
                        resolve();
                    } else if (window.Amplify) {
                        this.Amplify = window.Amplify;
                        this.Auth = window.Amplify.Auth;
                        console.log('✅ Amplify SDK loaded (Amplify)');
                        resolve();
                    } else {
                        console.error('❌ Amplify SDK loaded but not accessible');
                        reject(new Error('Amplify SDK loaded but not accessible'));
                    }
                }, 200);
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Amplify SDK');
                reject(new Error('Failed to load Amplify SDK'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Load AWS configuration
    async loadAWSConfig() {
        return new Promise((resolve, reject) => {
            // Check if config already exists
            if (window.awsExports) {
                this.config = window.awsExports;
                resolve(this.config);
                return;
            }

            // Load config dynamically
            const script = document.createElement('script');
            script.src = 'src/aws-exports.js';
            
            script.onload = () => {
                setTimeout(() => {
                    if (window.awsExports) {
                        this.config = window.awsExports;
                        console.log('✅ AWS config loaded');
                        resolve(this.config);
                    } else {
                        console.error('❌ AWS config not found');
                        reject(new Error('AWS config not found'));
                    }
                }, 100);
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load AWS config');
                reject(new Error('Failed to load AWS config'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Initialize the AuthManager
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        
        try {
            console.log('🔧 Initializing RobustAuthManager...');
            
            // Load configuration and SDK
            await this.loadAWSConfig();
            await this.loadAmplifySDK();
            
            // Configure Amplify
            if (this.Amplify && this.config) {
                this.Amplify.configure(this.config);
                console.log('✅ Amplify configured successfully');
                
                // Validate configuration
                if (!this.config.aws_cognito_region || this.config.aws_user_pools_id === "eu-north-1_PLACEHOLDER") {
                    console.warn('⚠️  Amplify configuration appears incomplete');
                    this.mockMode = true;
                } else {
                    console.log('✅ Valid Amplify configuration detected');
                }
            } else {
                throw new Error('Failed to load Amplify SDK or configuration');
            }
            
            // Try to load existing user session
            await this.loadExistingSession();
            
            this.isInitialized = true;
            console.log('✅ RobustAuthManager initialized successfully');
            
        } catch (error) {
            console.error('❌ RobustAuthManager initialization failed:', error);
            this.mockMode = true;
            this.isInitialized = true; // Mark as initialized to prevent loops
            throw error;
        }
    }

    async loadExistingSession() {
        const existingUser = localStorage.getItem(this.userKey);
        const existingToken = localStorage.getItem(this.tokenKey);
        
        if (existingUser && existingToken && this.Auth) {
            try {
                this.currentUser = JSON.parse(existingUser);
                // Validate the session is still valid
                const session = await this.Auth.currentSession();
                if (!session || !session.isValid()) {
                    throw new Error('Session expired');
                }
                console.log('✅ Existing session loaded and validated');
            } catch (error) {
                console.log('⚠️  Existing session invalid, clearing data');
                this.clearAuthData();
            }
        }
    }

    // Sign in user
    async signIn(email, password) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.mockMode || !this.Auth) {
            console.log('🎭 Using mock sign in');
            // Mock successful login for development
            const mockUser = {
                username: email,
                attributes: {
                    email: email,
                    email_verified: true
                }
            };
            
            this.currentUser = mockUser;
            localStorage.setItem(this.userKey, JSON.stringify(mockUser));
            localStorage.setItem(this.tokenKey, 'mock-token-' + Date.now());
            
            return mockUser;
        }
        
        try {
            const user = await this.Auth.signIn(email, password);
            
            // Store user data
            this.currentUser = user;
            localStorage.setItem(this.userKey, JSON.stringify(user));
            
            // Get and store token
            const session = await this.Auth.currentSession();
            const token = session.getAccessToken().getJwtToken();
            localStorage.setItem(this.tokenKey, token);
            
            console.log('✅ Sign in successful');
            return user;
            
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            throw this.normalizeError(error);
        }
    }

    // Sign out user
    async signOut() {
        try {
            if (this.Auth && !this.mockMode) {
                await this.Auth.signOut();
            }
            
            this.clearAuthData();
            console.log('✅ Sign out successful');
            
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            // Clear local data anyway
            this.clearAuthData();
            throw this.normalizeError(error);
        }
    }

    // Forgot password
    async forgotPassword(email) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.mockMode || !this.Auth) {
            console.log('🎭 Using mock forgot password');
            // Mock successful reset request
            return { CodeDeliveryDetails: { Destination: 'mock@example.com' } };
        }
        
        try {
            const result = await this.Auth.forgotPassword(email);
            console.log('✅ Forgot password request successful');
            return result;
            
        } catch (error) {
            console.error('❌ Forgot password failed:', error);
            throw this.normalizeError(error);
        }
    }

    // Confirm password reset
    async confirmResetPassword(email, code, newPassword) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.mockMode || !this.Auth) {
            console.log('🎭 Using mock password reset confirmation');
            return { success: true };
        }
        
        try {
            const result = await this.Auth.forgotPasswordSubmit(email, code, newPassword);
            console.log('✅ Password reset confirmation successful');
            return result;
            
        } catch (error) {
            console.error('❌ Password reset confirmation failed:', error);
            throw this.normalizeError(error);
        }
    }

    // Get current user
    async getCurrentUser() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        if (this.currentUser) {
            return this.currentUser;
        }
        
        if (this.mockMode || !this.Auth) {
            const storedUser = localStorage.getItem(this.userKey);
            return storedUser ? JSON.parse(storedUser) : null;
        }
        
        try {
            const user = await this.Auth.currentAuthenticatedUser();
            this.currentUser = user;
            return user;
            
        } catch (error) {
            console.log('No authenticated user found');
            return null;
        }
    }

    // Check if user is authenticated
    async isAuthenticated() {
        try {
            const user = await this.getCurrentUser();
            const token = localStorage.getItem(this.tokenKey);
            return !!(user && token);
            
        } catch (error) {
            return false;
        }
    }

    // Get authentication token
    async getToken() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const storedToken = localStorage.getItem(this.tokenKey);
        
        if (this.mockMode || !this.Auth) {
            return storedToken;
        }
        
        try {
            const session = await this.Auth.currentSession();
            if (session && session.isValid()) {
                const token = session.getAccessToken().getJwtToken();
                localStorage.setItem(this.tokenKey, token);
                return token;
            } else {
                this.clearAuthData();
                return null;
            }
            
        } catch (error) {
            console.error('Failed to get token:', error);
            return storedToken; // Return stored token as fallback
        }
    }

    // Clear authentication data
    clearAuthData() {
        this.currentUser = null;
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    // Normalize error messages
    normalizeError(error) {
        const errorMap = {
            'NotAuthorizedException': 'Invalid email or password',
            'UserNotConfirmedException': 'Please verify your email first',
            'PasswordResetRequiredException': 'Password reset required',
            'UserNotFoundException': 'User not found',
            'CodeMismatchException': 'Invalid confirmation code',
            'ExpiredCodeException': 'Confirmation code expired',
            'LimitExceededException': 'Too many attempts. Please try again later.',
            'TooManyRequestsException': 'Too many requests. Please try again later.'
        };
        
        if (error.code && errorMap[error.code]) {
            return new Error(errorMap[error.code]);
        }
        
        return error;
    }

    // Get authentication status for debugging
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            mockMode: this.mockMode,
            hasAuth: !!this.Auth,
            hasAmplify: !!this.Amplify,
            hasConfig: !!this.config,
            hasCurrentUser: !!this.currentUser,
            hasToken: !!localStorage.getItem(this.tokenKey)
        };
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.RobustAuthManager = RobustAuthManager;
    
    // Create global instance
    window.authManager = new RobustAuthManager();
}
