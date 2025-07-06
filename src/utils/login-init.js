// Add Amplify import
import { Auth } from 'aws-amplify';
import authManager from './auth-manager.js';

/**
 * Login Page Initialization Script
 * 
 * This script handles the initialization of the login page including:
 * - Form event handlers
 * - Authentication state checking
 * - Language switching
 * - Password visibility toggle
 * - MFA and new password flows
 * 
 * Dependencies:
 * - auth.js (for authentication functions)
 * - bilingual.js (for language switching)
 * - AWS Cognito SDK
 */

// Check if user is already authenticated when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Login page loaded, checking authentication status...');
    try {
        const isAuth = await window.AuthManager.isAuthenticated();
        if (isAuth) {
            console.log('User is already authenticated, redirecting to dashboard...');
            window.location.replace('pages/dashboard-aws-native.html');
            return;
        }
    } catch (err) {
        console.error('Auth check failed', err);
    }
    initializeLoginPage();
});

/**
 * Initialize the login page components
 */
function initializeLoginPage() {
    // Initialize login form
    initializeLoginForm();
    
    // Initialize MFA form
    initializeMfaForm();
    
    // Initialize new password form
    initializeNewPasswordForm();
    
    // Initialize language switching if available
    if (typeof initializeLanguageSwitching === 'function') {
        initializeLanguageSwitching();
    }
    
    // Initialize password toggle functionality
    initializePasswordToggle();
    
    console.log('Login page initialization complete');
}

/**
 * Initialize the main login form
 */
function initializeLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorMessage = document.getElementById('errorMessage');
    
    if (!loginForm) {
        console.error('Login form not found');
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Validation
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }
        
        // Show loading state
        loginButton.disabled = true;
        loadingSpinner.style.display = 'inline-block';
        errorMessage.style.display = 'none';
        try {
            const { challenge } = await window.AuthManager.signIn(username, password);
            if (challenge === 'MFA') {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('mfaForm').style.display = 'block';
            } else if (challenge === 'NEW_PASSWORD') {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('newPasswordForm').style.display = 'block';
            } else {
                window.location.replace('pages/dashboard-aws-native.html');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            showError(error.message || 'An error occurred during sign in.');
        } finally {
            loginButton.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    });
    
    console.log('Login form initialized');
}

/**
 * Initialize the MFA form
 */
function initializeMfaForm() {
    const mfaForm = document.getElementById('mfaForm');
    const mfaButton = document.getElementById('mfaButton');
    const mfaLoadingSpinner = document.getElementById('mfaLoadingSpinner');
    
    if (!mfaForm) {
        console.error('MFA form not found');
        return;
    }
    
    mfaForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        mfaButton.disabled = true; mfaLoadingSpinner.style.display = 'inline-block';
        errorMessage.style.display = 'none';
        const code = document.getElementById('mfaCode').value.trim();
        try {
            await window.AuthManager.confirmSignIn(code);
            window.location.replace('pages/dashboard-aws-native.html');
        } catch (error) {
            console.error('MFA submission error:', error);
            showError(error.message || 'An error occurred during MFA verification.');
        } finally {
            mfaButton.disabled = false; mfaLoadingSpinner.style.display = 'none';
        }
    });
    
    console.log('MFA form initialized');
}

/**
 * Initialize the new password form
 */
function initializeNewPasswordForm() {
    const newPasswordForm = document.getElementById('newPasswordForm');
    const newPasswordButton = document.getElementById('newPasswordButton');
    const newPasswordLoadingSpinner = document.getElementById('newPasswordLoadingSpinner');
    
    if (!newPasswordForm) {
        console.error('New password form not found');
        return;
    }
    
    newPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        newPasswordButton.disabled = true; newPasswordLoadingSpinner.style.display = 'inline-block';
        errorMessage.style.display = 'none';
        const newPwd = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (newPwd !== confirm) {
            showError('Passwords do not match');
            resetNewPasswordButton();
            return;
        }
        try {
            await window.AuthManager.completeNewPassword(newPwd);
            window.location.replace('pages/dashboard-aws-native.html');
        } catch (error) {
            console.error('New password submission error:', error);
            showError(error.message || 'An error occurred while setting new password.');
        } finally {
            newPasswordButton.disabled = false; newPasswordLoadingSpinner.style.display = 'none';
        }
    });
    
    console.log('New password form initialized');
}

/**
 * Initialize password toggle functionality
 */
function initializePasswordToggle() {
    // Make togglePassword function available globally
    window.togglePassword = function() {
        const passwordInput = document.getElementById('password');
        const toggleButton = document.querySelector('.password-toggle');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleButton.innerHTML = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleButton.innerHTML = '👁️';
        }
    };
    
    console.log('Password toggle initialized');
}

/**
 * Show error message
 */
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide success message if visible
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.style.display = 'none';
        }
    }
    console.error('Login error:', message);
}

/**
 * Show success message
 */
function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        
        // Hide error message if visible
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
    console.log('Login success:', message);
}

/**
 * Reset login button state
 */
function resetLoginButton() {
    const loginButton = document.getElementById('loginButton');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (loginButton) {
        loginButton.disabled = false;
    }
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

/**
 * Reset MFA button state
 */
function resetMfaButton() {
    const mfaButton = document.getElementById('mfaButton');
    const mfaLoadingSpinner = document.getElementById('mfaLoadingSpinner');
    
    if (mfaButton) {
        mfaButton.disabled = false;
    }
    if (mfaLoadingSpinner) {
        mfaLoadingSpinner.style.display = 'none';
    }
}

/**
 * Reset new password button state
 */
function resetNewPasswordButton() {
    const newPasswordButton = document.getElementById('newPasswordButton');
    const newPasswordLoadingSpinner = document.getElementById('newPasswordLoadingSpinner');
    
    if (newPasswordButton) {
        newPasswordButton.disabled = false;
    }
    if (newPasswordLoadingSpinner) {
        newPasswordLoadingSpinner.style.display = 'none';
    }
}

/**
 * Forgot password functionality (placeholder)
 */
window.forgotPassword = function() {
    showError('Forgot password functionality is not yet implemented. Please contact your administrator.');
};

// Make utility functions available globally for debugging
window.showError = showError;
window.showSuccess = showSuccess;
window.clearAuthData = function() {
    localStorage.removeItem('aws-native-token');
    sessionStorage.clear();
    console.log("All authentication data cleared");
};

console.log('Login initialization script loaded');