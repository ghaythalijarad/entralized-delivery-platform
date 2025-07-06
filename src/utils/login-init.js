// This script initializes the login page functionality.
// It should be the last script loaded on the page.

// Add a global error handler to catch and display all script errors
window.onerror = function(message, source, lineno, colno, error) {
    try {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = `An unexpected error occurred: ${message}`;
            errorMessage.style.display = 'block';
        }
        // Also log to console for good measure
        console.error("Caught by global handler:", message, source, lineno, colno, error);
    } catch (e) {
        console.error("Error in global error handler:", e);
    }
    return true; // Prevents the default browser error handling
};

// Global variables
let performanceStart = Date.now();

// Initialize bilingual support and login form
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("DOM content loaded. Initializing scripts...");
        
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
                    throw new Error("MFA script failed to load.");
                }
            });
            console.log("MFA form event listener attached.");
        } else {
            console.error("MFA form not found!");
        }
    } catch (e) {
        // Display error using our handler
        window.onerror(e.message, e.source, e.lineno, e.colno, e);
    }
});

// Password toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggle = document.querySelector('.password-toggle');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggle.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggle.textContent = '👁️';
    }
}

// Placeholder for forgot password functionality
function forgotPassword() {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = 'Forgot password feature is not implemented in this demo.';
    errorMessage.style.display = 'block';
}

// Performance measurement
function measurePerformance() {
    const loadTime = Date.now() - performanceStart;
    console.log(`Page loaded in ${loadTime}ms`);
    const badge = document.querySelector('.performance-badge');
    if (badge) {
        badge.textContent += ` (${loadTime}ms)`;
    }
}
