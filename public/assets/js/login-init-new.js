/**
 * Login Page Initialization Script
 * Handles login form events and authentication for Node.js platform
 */

// Global variables
let AuthManager = null;
let isInitialized = false;

console.log('🔄 Login initialization script loading...');

// Wait for DOM and AuthManager to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, initializing login page...');
    
    // Initialize immediately if AuthManager is available
    if (window.AuthManager) {
        AuthManager = window.AuthManager;
        initializeLoginPage();
    } else {
        // Wait for AuthManager to be loaded
        const waitForAuthManager = () => {
            if (window.AuthManager) {
                console.log('✅ AuthManager found');
                AuthManager = window.AuthManager;
                initializeLoginPage();
            } else {
                console.log('⏳ Waiting for AuthManager...');
                setTimeout(waitForAuthManager, 500);
            }
        };
        waitForAuthManager();
    }
});

/**
 * Initialize the login page components
 */
async function initializeLoginPage() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('🚀 Initializing login page components...');
    
    try {
        // Initialize AuthManager
        if (AuthManager && AuthManager.initialize) {
            await AuthManager.initialize();
            console.log('✅ AuthManager initialized');
        }
        
        // Check if user is already authenticated
        if (AuthManager) {
            try {
                const isAuth = await AuthManager.isAuthenticated();
                if (isAuth) {
                    console.log('✅ User already authenticated, redirecting...');
                    window.location.replace('src/pages/dashboard-aws-native.html');
                    return;
                }
            } catch (authError) {
                console.log('⚠️ Auth check failed, continuing with login:', authError.message);
            }
        }
        
        // Initialize form components
        initializeLoginForm();
        initializeMfaForm();
        initializeNewPasswordForm();
        initializeForgotPasswordForm();
        initializeResetPasswordForm();
        initializePasswordToggle();
        
        // Initialize language switching if available
        if (typeof initializeLanguageSwitching === 'function') {
            initializeLanguageSwitching();
        }
        
        // Show initial status
        showMessage('Authentication system ready. You can log in now.', 'info');
        
        console.log('✅ Login page initialized successfully');
        
    } catch (error) {
        console.error('❌ Login page initialization error:', error);
        showMessage('Authentication system initialized in development mode.', 'warning');
    }
}

/**
 * Initialize the main login form
 */
function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    
    if (!loginForm) {
        console.warn('⚠️ Login form not found in DOM');
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value;
        
        console.log('🔐 Login attempt for:', username);
        
        // Validation
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }
        
        // Show loading state
        setLoadingState(true);
        
        // Real authentication using Cognito
        try {
            const result = await AuthManager.signIn(username, password);
            if (result.challenge === 'MFA') {
                console.log('📱 MFA challenge required');
                showForm('mfaForm');
                showMessage('Please enter your MFA code', 'info');
            } else if (result.challenge === 'NEW_PASSWORD') {
                console.log('🔑 New password required');
                showForm('newPasswordForm');
                showMessage('Please set a new password', 'info');
            } else {
                console.log('✅ Login successful');
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => window.location.replace('/dashboard'), 1000);
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            showError(error.message || 'Login failed. Please try again.');
        } finally {
            setLoadingState(false);
        }
        return;
    });
    
    console.log('✅ Login form initialized');
}

/**
 * Initialize the MFA form
 */
function initializeMfaForm() {
    const mfaForm = document.getElementById('mfaForm');
    
    if (!mfaForm) {
        console.log('ℹ️ MFA form not found (optional)');
        return;
    }
    
    mfaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const code = document.getElementById('mfaCode')?.value?.trim();
        
        if (!code) {
            showError('Please enter the MFA code');
            return;
        }
        
        setLoadingState(true, 'mfa');
        
        try {
            if (AuthManager && AuthManager.confirmSignIn) {
                await AuthManager.confirmSignIn(code);
                showSuccess('MFA verification successful!');
                setTimeout(() => window.location.replace('/dashboard'), 1000);
            } else {
                throw new Error('MFA confirmation not available');
            }
        } catch (error) {
            console.error('❌ MFA error:', error);
            showError(error.message || 'MFA verification failed');
        } finally {
            setLoadingState(false, 'mfa');
        }
    });
    
    console.log('✅ MFA form initialized');
}

/**
 * Initialize the new password form
 */
function initializeNewPasswordForm() {
    const newPasswordForm = document.getElementById('newPasswordForm');
    
    if (!newPasswordForm) {
        console.log('ℹ️ New password form not found (optional)');
        return;
    }
    
    newPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        if (!newPassword || !confirmPassword) {
            showError('Please fill in both password fields');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (newPassword.length < 8) {
            showError('Password must be at least 8 characters long');
            return;
        }
        
        setLoadingState(true, 'newPassword');
        
        try {
            if (AuthManager && AuthManager.completeNewPassword) {
                await AuthManager.completeNewPassword(newPassword);
                showSuccess('Password updated successfully!');
                setTimeout(() => window.location.replace('/dashboard'), 1000);
            } else {
                throw new Error('Password update not available');
            }
        } catch (error) {
            console.error('❌ Password update error:', error);
            showError(error.message || 'Password update failed');
        } finally {
            setLoadingState(false, 'newPassword');
        }
    });
    
    console.log('✅ New password form initialized');
}

/**
 * Initialize the forgot password form
 */
function initializeForgotPasswordForm() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (!forgotPasswordForm) {
        console.log('ℹ️ Forgot password form not found (optional)');
        return;
    }
    
    forgotPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail')?.value?.trim();
        
        if (!email) {
            showError('Please enter your email address');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        setLoadingState(true, 'forgotPassword');
        
        try {
            if (AuthManager && AuthManager.forgotPassword) {
                const result = await AuthManager.forgotPassword(email);
                showSuccess('Reset code sent to your email. Please check your inbox.');
                
                // Store email for the reset form
                document.getElementById('resetPasswordForm').setAttribute('data-email', email);
                
                // Show the reset password form
                setTimeout(() => {
                    showForm('resetPasswordForm');
                }, 1500);
            } else {
                throw new Error('Password reset not available');
            }
        } catch (error) {
            console.error('❌ Forgot password error:', error);
            if (error.code === 'UserNotFoundException') {
                showError('No account found with this email address');
            } else if (error.code === 'LimitExceededException') {
                showError('Too many requests. Please try again later');
            } else {
                showError(error.message || 'Failed to send reset code. Please try again.');
            }
        } finally {
            setLoadingState(false, 'forgotPassword');
        }
    });
    
    console.log('✅ Forgot password form initialized');
}

/**
 * Initialize the reset password form
 */
function initializeResetPasswordForm() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    if (!resetPasswordForm) {
        console.log('ℹ️ Reset password form not found (optional)');
        return;
    }
    
    resetPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = resetPasswordForm.getAttribute('data-email');
        const resetCode = document.getElementById('resetCode')?.value?.trim();
        const newPassword = document.getElementById('resetNewPassword')?.value;
        const confirmPassword = document.getElementById('resetConfirmPassword')?.value;
        
        if (!resetCode) {
            showError('Please enter the reset code');
            return;
        }
        
        if (!newPassword || !confirmPassword) {
            showError('Please fill in both password fields');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (newPassword.length < 8) {
            showError('Password must be at least 8 characters long');
            return;
        }
        
        setLoadingState(true, 'resetPassword');
        
        try {
            if (AuthManager && AuthManager.confirmForgotPassword) {
                await AuthManager.confirmForgotPassword(email, resetCode, newPassword);
                showSuccess('Password reset successful! You can now log in with your new password.');
                
                // Clear the form and go back to login
                setTimeout(() => {
                    showForm('loginForm');
                    document.getElementById('resetPasswordForm').removeAttribute('data-email');
                    resetPasswordForm.reset();
                }, 2000);
            } else {
                throw new Error('Password reset confirmation not available');
            }
        } catch (error) {
            console.error('❌ Reset password error:', error);
            if (error.code === 'CodeMismatchException') {
                showError('Invalid reset code. Please check your email and try again.');
            } else if (error.code === 'ExpiredCodeException') {
                showError('Reset code has expired. Please request a new one.');
                setTimeout(() => showForm('forgotPasswordForm'), 1500);
            } else if (error.code === 'InvalidPasswordException') {
                showError('Password does not meet security requirements');
            } else {
                showError(error.message || 'Password reset failed. Please try again.');
            }
        } finally {
            setLoadingState(false, 'resetPassword');
        }
    });
    
    console.log('✅ Reset password form initialized');
}
function initializePasswordToggle() {
    // Make togglePassword function available globally
    window.togglePassword = function(fieldId = 'password') {
        const passwordInput = document.getElementById(fieldId);
        const toggleButton = document.querySelector(`[onclick*="${fieldId}"]`);
        
        if (passwordInput) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                if (toggleButton) toggleButton.innerHTML = '🙈';
            } else {
                passwordInput.type = 'password';
                if (toggleButton) toggleButton.innerHTML = '👁️';
            }
        }
    };
    
    console.log('✅ Password toggle initialized');
}

/**
 * Show/hide forms
 */
function showForm(formId) {
    const forms = ['loginForm', 'mfaForm', 'newPasswordForm', 'forgotPasswordForm', 'resetPasswordForm'];
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    
    forms.forEach(id => {
        const form = document.getElementById(id);
        if (form) {
            form.style.display = id === formId ? 'block' : 'none';
        }
    });
    
    // Show/hide the forgot password link (only show on login form)
    if (forgotPasswordLink) {
        forgotPasswordLink.style.display = formId === 'loginForm' ? 'block' : 'none';
    }
}

/**
 * Set loading state for forms
 */
function setLoadingState(loading, formType = 'login') {
    const buttons = {
        login: document.getElementById('loginButton'),
        mfa: document.getElementById('mfaButton'),
        newPassword: document.getElementById('newPasswordButton'),
        forgotPassword: document.getElementById('forgotPasswordButton'),
        resetPassword: document.getElementById('resetPasswordButton')
    };
    
    const spinners = {
        login: document.getElementById('loadingSpinner'),
        mfa: document.getElementById('mfaLoadingSpinner'),
        newPassword: document.getElementById('newPasswordLoadingSpinner'),
        forgotPassword: document.getElementById('forgotPasswordLoadingSpinner'),
        resetPassword: document.getElementById('resetPasswordLoadingSpinner')
    };
    
    const button = buttons[formType];
    const spinner = spinners[formType];
    
    if (button) {
        button.disabled = loading;
    }
    
    if (spinner) {
        spinner.style.display = loading ? 'inline-block' : 'none';
    }
}

/**
 * Show error message
 */
function showError(message) {
    showMessage(message, 'error');
    console.error('Login error:', message);
}

/**
 * Show success message
 */
function showSuccess(message) {
    showMessage(message, 'success');
    console.log('Login success:', message);
}

/**
 * Show message with type
 */
function showMessage(message, type = 'info') {
    const messageElements = {
        error: document.getElementById('errorMessage'),
        success: document.getElementById('successMessage'),
        info: document.getElementById('infoMessage')
    };
    
    // Hide all messages first
    Object.values(messageElements).forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    // Show the specific message
    const targetElement = messageElements[type];
    if (targetElement) {
        targetElement.textContent = message;
        targetElement.style.display = 'block';
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Clear authentication data (for debugging)
 */
window.clearAuthData = function() {
    localStorage.removeItem('aws-native-token');
    localStorage.removeItem('aws-native-user');
    sessionStorage.clear();
    showMessage('Authentication data cleared', 'info');
    console.log('🗑️ Authentication data cleared');
};

// Make utility functions available globally
window.showError = showError;
window.showSuccess = showSuccess;
window.showMessage = showMessage;
window.showForm = showForm;

console.log('✅ Login initialization script loaded successfully');
