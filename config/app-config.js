/**
 * Main Application Configuration
 * Centralized config for all environments
 */

// Environment detection
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isDevelopment = !isProduction;

// Base configuration
const APP_CONFIG = {
    environment: isProduction ? 'production' : 'development',
    debug: isDevelopment,
    
    // Application metadata
    app: {
        name: 'Centralized Delivery Management Platform',
        version: '1.0.0',
        description: 'Multi-merchant delivery platform with customer, merchant, and admin interfaces'
    },
    
    // API Configuration
    api: {
        baseURL: isProduction ? 'https://api.delivery-platform.com' : 'http://localhost:3000',
        timeout: 30000,
        retries: 3
    },
    
    // Merchant types supported
    merchantTypes: {
        restaurant: {
            name: 'Restaurant',
            icon: 'fas fa-utensils',
            color: '#e74c3c'
        },
        store: {
            name: 'Store', 
            icon: 'fas fa-store',
            color: '#3498db'
        },
        pharmacy: {
            name: 'Pharmacy',
            icon: 'fas fa-pills', 
            color: '#2ecc71'
        },
        cloud_kitchen: {
            name: 'Cloud Kitchen',
            icon: 'fas fa-cloud',
            color: '#f39c12'
        }
    },
    
    // Order statuses
    orderStatuses: {
        pending: { name: 'Pending', color: '#f39c12', icon: 'fas fa-clock' },
        confirmed: { name: 'Confirmed', color: '#3498db', icon: 'fas fa-check' },
        preparing: { name: 'Preparing', color: '#e67e22', icon: 'fas fa-fire' },
        ready: { name: 'Ready', color: '#27ae60', icon: 'fas fa-box' },
        picked_up: { name: 'Picked Up', color: '#8e44ad', icon: 'fas fa-truck' },
        delivered: { name: 'Delivered', color: '#2ecc71', icon: 'fas fa-check-circle' },
        cancelled: { name: 'Cancelled', color: '#e74c3c', icon: 'fas fa-times' }
    },
    
    // UI Configuration
    ui: {
        theme: 'light',
        language: 'en',
        supportedLanguages: ['en', 'ar'],
        animations: true,
        notifications: true
    },
    
    // Feature flags
    features: {
        realTimeTracking: true,
        pushNotifications: isProduction,
        advancedAnalytics: true,
        multiLanguage: true,
        darkMode: false
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
} else {
    window.APP_CONFIG = APP_CONFIG;
}
