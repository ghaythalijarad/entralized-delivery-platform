/**
 * Unified Navigation System
 * Handles navigation, user state, and page interactions across all pages
 */

class UnifiedNavigation {
    constructor() {
        this.currentPage = this.getCurrentPageName();
        this.userInfo = null;
        this.init();
    }

    init() {
        this.loadUserInfo();
        this.renderTopBar();
        this.renderNavigation();
        this.setupEventListeners();
        this.setActiveNavItem();
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        
        const pageMap = {
            'dashboard-aws-native': 'dashboard',
            'drivers-management': 'drivers',
            'merchant-management': 'merchants',
            'user-management': 'users',
            'order-management': 'orders',
            'login-aws-native': 'login'
        };
        
        return pageMap[filename] || 'dashboard';
    }

    loadUserInfo() {
        // Try to get user info from localStorage or session
        const token = localStorage.getItem('aws-native-token');
        if (token) {
            // In a real app, you'd decode the JWT token or make an API call
            this.userInfo = {
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'Administrator'
            };
        }
    }

    renderTopBar() {
        const topBar = document.getElementById('unified-topbar');
        if (!topBar) return;

        const pageTitle = this.getPageTitle();
        
        topBar.innerHTML = `
            <div class="topbar-content">
                <a href="dashboard-aws-native.html" class="topbar-brand">
                    <div class="topbar-logo">
                        <i class="fas fa-truck-fast"></i>
                    </div>
                    <div class="topbar-title">${pageTitle}</div>
                </a>
                
                <div class="topbar-controls">
                    <div class="language-switcher">
                        <button class="lang-btn active" data-lang="en">EN</button>
                        <button class="lang-btn" data-lang="ar">العربية</button>
                    </div>
                    
                    ${this.userInfo ? `
                        <div class="user-controls">
                            <div class="user-info">
                                <div class="user-name">${this.userInfo.name}</div>
                                <div class="user-role">${this.userInfo.role}</div>
                            </div>
                            <a href="#" class="btn-logout" onclick="unifiedNav.signOut()">
                                <i class="fas fa-sign-out-alt"></i>
                                Sign Out
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderNavigation() {
        const navbar = document.getElementById('unified-navbar');
        if (!navbar) return;

        const navigationItems = this.getNavigationItems();
        const breadcrumb = this.getBreadcrumb();

        navbar.innerHTML = `
            <div class="navbar-content">
                <nav class="navbar-nav">
                    ${navigationItems.map(item => `
                        <div class="nav-item">
                            <a href="${item.href}" class="nav-link ${item.active ? 'active' : ''}" data-page="${item.page}">
                                <i class="${item.icon}"></i>
                                <span>${item.label}</span>
                            </a>
                        </div>
                    `).join('')}
                </nav>
                
                <div class="breadcrumb-section">
                    ${breadcrumb.map((item, index) => `
                        <div class="breadcrumb-item">
                            ${index > 0 ? '<i class="fas fa-chevron-right breadcrumb-separator"></i>' : ''}
                            ${item.href ? `<a href="${item.href}" class="breadcrumb-link">${item.label}</a>` : `<span>${item.label}</span>`}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getPageTitle() {
        const titles = {
            'dashboard': 'Control Center',
            'drivers': 'Drivers Management',
            'merchants': 'Merchants Management',
            'orders': 'Order Management',
            'platform-demo': 'Platform Demo',
            'customer-app': 'Customer App',
            'merchant-app': 'Merchant App',
            'users': 'User Management',
            'login': 'Admin Login'
        };
        return titles[this.currentPage] || 'Delivery Platform';
    }

    getNavigationItems() {
        const items = [
            {
                page: 'dashboard',
                label: 'Dashboard',
                icon: 'fas fa-home',
                href: 'dashboard-aws-native.html'
            },
            {
                page: 'orders',
                label: 'Orders',
                icon: 'fas fa-shopping-cart',
                href: 'order-management.html'
            },
            {
                page: 'platform-demo',
                label: 'Live Demo',
                icon: 'fas fa-rocket',
                href: 'platform-demo.html'
            },
            {
                page: 'customer-app',
                label: 'Customer App',
                icon: 'fas fa-mobile-alt',
                href: 'customer-app.html'
            },
            {
                page: 'merchant-app',
                label: 'Merchant App',
                icon: 'fas fa-tablet-alt',
                href: 'merchant-app.html'
            },
            {
                page: 'drivers',
                label: 'Drivers',
                icon: 'fas fa-car',
                href: 'drivers-management.html'
            },
            {
                page: 'merchants',
                label: 'Merchants',
                icon: 'fas fa-store',
                href: 'merchant-management.html'
            },
            {
                page: 'users',
                label: 'Users',
                icon: 'fas fa-users',
                href: 'user-management.html'
            }
        ];

        return items.map(item => ({
            ...item,
            active: item.page === this.currentPage
        }));
    }

    getBreadcrumb() {
        const breadcrumbs = {
            'dashboard': [
                { label: 'Home', href: 'dashboard-aws-native.html' },
                { label: 'Dashboard' }
            ],
            'orders': [
                { label: 'Home', href: 'dashboard-aws-native.html' },
                { label: 'Management' },
                { label: 'Orders' }
            ],
            'drivers': [
                { label: 'Home', href: 'dashboard-aws-native.html' },
                { label: 'Management' },
                { label: 'Drivers' }
            ],
            'merchants': [
                { label: 'Home', href: 'dashboard-aws-native.html' },
                { label: 'Management' },
                { label: 'Merchants' }
            ],
            'users': [
                { label: 'Home', href: 'dashboard-aws-native.html' },
                { label: 'Management' },
                { label: 'Users' }
            ],
            'login': [
                { label: 'Authentication' },
                { label: 'Login' }
            ]
        };

        return breadcrumbs[this.currentPage] || [{ label: 'Dashboard' }];
    }

    setupEventListeners() {
        // Language switcher
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('lang-btn')) {
                this.switchLanguage(e.target.dataset.lang);
            }
        });

        // Navigation tracking
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                const page = e.target.closest('.nav-link').dataset.page;
                this.trackNavigation(page);
            }
        });
    }

    setActiveNavItem() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === this.currentPage) {
                link.classList.add('active');
            }
        });
    }

    switchLanguage(lang) {
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            }
        });

        // Update document attributes
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);

        // Update bilingual manager if available
        if (window.bilingualManager) {
            window.bilingualManager.switchLanguage(lang);
        }

        // Store language preference
        localStorage.setItem('preferred-language', lang);

        console.log(`Language switched to: ${lang}`);
    }

    trackNavigation(page) {
        console.log(`Navigating to: ${page}`);
        // Here you could send analytics data
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            // Clear auth data
            localStorage.removeItem('aws-native-token');
            localStorage.removeItem('user-info');
            
            // Redirect to login
            window.location.href = 'login-aws-native.html';
        }
    }

    // Utility method to show notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add notification styles if not already present
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 150px;
                    right: 20px;
                    z-index: 9999;
                    min-width: 300px;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    animation: slideIn 0.3s ease;
                }
                .notification-success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
                .notification-error { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
                .notification-warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
                .notification-info { background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }
                .notification-content { display: flex; align-items: center; gap: 10px; }
                .notification-close { background: none; border: none; cursor: pointer; margin-left: auto; }
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Method to check authentication
    checkAuthentication() {
        if (this.currentPage === 'login') return true;
        
        const token = localStorage.getItem('aws-native-token');
        if (!token) {
            window.location.href = 'login-aws-native.html';
            return false;
        }
        return true;
    }

    // Method to update page content dynamically
    updatePageTitle(title) {
        document.title = `${title} - Delivery Platform`;
        const topbarTitle = document.querySelector('.topbar-title');
        if (topbarTitle) {
            topbarTitle.textContent = title;
        }
    }

    // Method to show loading state
    showLoading(show = true) {
        let loader = document.getElementById('unified-loader');
        
        if (show && !loader) {
            loader = document.createElement('div');
            loader.id = 'unified-loader';
            loader.innerHTML = `
                <div class="loader-overlay">
                    <div class="loader-content">
                        <div class="loading-spinner"></div>
                        <div class="loader-text">Loading...</div>
                    </div>
                </div>
            `;
            
            // Add loader styles
            const styles = document.createElement('style');
            styles.textContent = `
                .loader-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 193, 232, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(5px);
                }
                .loader-content {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    text-align: center;
                }
                .loader-text {
                    margin-top: 15px;
                    color: var(--primary-color);
                    font-weight: 600;
                }
            `;
            loader.appendChild(styles);
            document.body.appendChild(loader);
        } else if (!show && loader) {
            loader.remove();
        }
    }
}

// Initialize unified navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create navigation instance
    window.unifiedNav = new UnifiedNavigation();
    
    // Check authentication for protected pages
    window.unifiedNav.checkAuthentication();
    
    // Load saved language preference
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang) {
        window.unifiedNav.switchLanguage(savedLang);
    }
});

// Global utility functions
window.showNotification = function(message, type) {
    if (window.unifiedNav) {
        window.unifiedNav.showNotification(message, type);
    }
};

window.showLoading = function(show) {
    if (window.unifiedNav) {
        window.unifiedNav.showLoading(show);
    }
};

window.signOut = function() {
    if (window.unifiedNav) {
        window.unifiedNav.signOut();
    }
};
