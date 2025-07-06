/*
 * This script initializes the login page and sets up event listeners.
 * It must be loaded AFTER all other scripts (aws-config.js, auth.js, bilingual.js).
 */

// Global error handler to catch any JavaScript errors
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = 'A technical error occurred. Please refresh the page and try again.';
        errorMessage.style.display = 'block';
    }
});

// Function to measure page performance
function measurePerformance() {
    const navigationStart = performance.timing.navigationStart;
    const domContentLoaded = performance.timing.domContentLoadedEventEnd;
    const loadTime = domContentLoaded - navigationStart;
    console.log(`Page performance: ${loadTime}ms`);
}

// Main initialization function
function initializeLoginPage() {
    console.log("Initializing login page...");
    
    try {
        // Check if user is already authenticated (commented out for debugging)
        console.log("Authentication check temporarily disabled for debugging");
        /*
        if (typeof isUserAuthenticated === 'function') {
            isUserAuthenticated().then(function(isAuthenticated) {
                if (isAuthenticated) {
                    console.log("Valid session found, redirecting to dashboard...");
                    window.location.replace('dashboard-aws-native.html');
                }
            }).catch(function(error) {
                console.error("Authentication check failed:", error);
            });
        }
        */
        
        // 1. Initialize bilingual support
        if (typeof initializeBilingual === 'function') {
            initializeBilingual();
            console.log("Bilingual support initialized.");
        } else {
            console.error("initializeBilingual function not found!");
            throw new Error("Bilingual support script failed to load.");
        }

        // 2. Measure performance
        measurePerformance();

        // 3. Set up login form listener
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const email = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                const loginButton = document.getElementById('loginButton');
                const loadingSpinner = document.getElementById('loadingSpinner');
                
                loginButton.disabled = true;
                loadingSpinner.style.display = 'inline-block';

                // Call the signIn function from auth.js
                if (typeof signIn === 'function') {
                    signIn(email, password);
                } else {
                    console.error("signIn function not found!");
                    throw new Error("Authentication script failed to load.");
                }
            });
            console.log("Login form event listener attached.");
        } else {
            console.error("Login form not found!");
        }

        // 4. Set up MFA form listener
        const mfaForm = document.getElementById('mfaForm');
        if (mfaForm) {
            mfaForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const mfaCode = document.getElementById('mfaCode').value;

                const mfaButton = document.getElementById('mfaButton');
                const mfaLoadingSpinner = document.getElementById('mfaLoadingSpinner');

                mfaButton.disabled = true;
                mfaLoadingSpinner.style.display = 'inline-block';

                // Call the submitMfaCode function from auth.js
                if (typeof submitMfaCode === 'function') {
                    submitMfaCode(mfaCode);
                } else {
                    console.error("submitMfaCode function not found!");
                    throw new Error("MFA function failed to load.");
                }
            });
            console.log("MFA form event listener attached.");
        }

        // 5. Set up new password form listener
        const newPasswordForm = document.getElementById('newPasswordForm');
        if (newPasswordForm) {
            newPasswordForm.addEventListener('submit', function(event) {
                event.preventDefault();
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                // Check if passwords match
                if (newPassword !== confirmPassword) {
                    const errorMessage = document.getElementById('errorMessage');
                    errorMessage.textContent = 'Passwords do not match. Please try again.';
                    errorMessage.style.display = 'block';
                    return;
                }

                // Check password strength (minimum 8 characters)
                if (newPassword.length < 8) {
                    const errorMessage = document.getElementById('errorMessage');
                    errorMessage.textContent = 'Password must be at least 8 characters long.';
                    errorMessage.style.display = 'block';
                    return;
                }

                const newPasswordButton = document.getElementById('newPasswordButton');
                const newPasswordLoadingSpinner = document.getElementById('newPasswordLoadingSpinner');

                newPasswordButton.disabled = true;
                newPasswordLoadingSpinner.style.display = 'inline-block';

                // Call the submitNewPassword function from auth.js
                if (typeof submitNewPassword === 'function') {
                    submitNewPassword(newPassword);
                } else {
                    console.error("submitNewPassword function not found!");
                    throw new Error("New password function failed to load.");
                }
            });
            console.log("New password form event listener attached.");
        }

        console.log("Login page initialization complete.");

    } catch (error) {
        console.error("Login page initialization failed:", error);
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = 'Failed to initialize login page. Please refresh and try again.';
            errorMessage.style.display = 'block';
        }
    }
}

// Password toggle function (called by onclick in HTML)
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁️';
    }
}

// Forgot password function (placeholder)
function forgotPassword() {
    alert('Forgot password functionality will be implemented soon.');
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeLoginPage);

// Also initialize when the page loads (fallback)
window.addEventListener('load', function() {
    if (!document.getElementById('loginForm')) {
        setTimeout(initializeLoginPage, 100);
    }
});