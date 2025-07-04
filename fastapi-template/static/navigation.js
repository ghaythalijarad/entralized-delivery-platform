/**
 * Centralized Navigation System
 * Handles sidebar navigation, mobile menu, active states, and routing
 */

class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.isMobile = window.innerWidth < 992;
        this.sidebarCollapsed = false;
        this.init();
    }

    init() {
        this.createNavigationHTML();
        this.setupEventListeners();
        this.setActiveNavItem();
        this.handleResponsive();
        console.log('✅ Navigation system initialized');
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '') || 'dashboard';
    }

    createNavigationHTML() {
        const navigationHTML = `
            <!-- Desktop Sidebar -->
            <nav class="sidebar d-none d-lg-block" id="sidebar">
                <div class="sidebar-header">
                    <div class="d-flex align-items-center">
                        <div class="sidebar-logo">
                            <span class="material-icons-outlined text-primary">local_shipping</span>
                        </div>
                        <div class="sidebar-title ms-2">
                            <h5 class="mb-0 text-primary fw-bold">نظام التوصيل</h5>
                            <small class="text-muted">لوحة التحكم</small>
                        </div>
                    </div>
                </div>
                
                <div class="sidebar-menu">
                    ${this.getNavigationItems().map(item => `
                        <a href="${item.href}" class="nav-item ${item.page === this.currentPage ? 'active' : ''}" data-page="${item.page}">
                            <span class="material-icons-outlined">${item.icon}</span>
                            <span class="nav-text">${item.title}</span>
                            ${item.badge ? `<span class="badge bg-primary ms-auto">${item.badge}</span>` : ''}
                        </a>
                    `).join('')}
                </div>
                
                <div class="sidebar-footer">
                    <div class="nav-item">
                        <span class="material-icons-outlined">account_circle</span>
                        <span class="nav-text">المسؤول</span>
                    </div>
                    <a href="#" class="nav-item logout-btn" style="color: #dc3545;">
                        <span class="material-icons-outlined">logout</span>
                        <span class="nav-text">تسجيل الخروج</span>
                    </a>
                </div>
            </nav>

            <!-- Mobile Navigation -->
            <nav class="mobile-nav d-lg-none" id="mobileNav">
                <div class="mobile-nav-header">
                    <div class="d-flex align-items-center">
                        <span class="material-icons-outlined text-primary me-2">local_shipping</span>
                        <span class="fw-bold text-primary">نظام التوصيل</span>
                    </div>
                    <button class="mobile-menu-toggle" id="mobileMenuToggle">
                        <span class="material-icons-outlined">menu</span>
                    </button>
                </div>
                
                <div class="mobile-menu" id="mobileMenu">
                    <div class="mobile-menu-items">
                        ${this.getNavigationItems().map(item => `
                            <a href="${item.href}" class="mobile-nav-item ${item.page === this.currentPage ? 'active' : ''}" data-page="${item.page}">
                                <span class="material-icons-outlined">${item.icon}</span>
                                <span>${item.title}</span>
                                ${item.badge ? `<span class="badge bg-primary">${item.badge}</span>` : ''}
                            </a>
                        `).join('')}
                    </div>
                </div>
            </nav>

            <!-- Mobile Overlay -->
            <div class="mobile-overlay" id="mobileOverlay"></div>
        `;

        // Insert navigation at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navigationHTML);
        
        // Add CSS styles
        this.addNavigationStyles();
    }

    getNavigationItems() {
        return [
            { page: 'dashboard', title: 'لوحة القيادة', icon: 'dashboard', href: '/dashboard.html' },
            { page: 'orders', title: 'الطلبات', icon: 'shopping_cart', href: '/orders.html', badge: '12' },
            { page: 'merchants', title: 'التجار', icon: 'store', href: '/merchants.html' },
            { page: 'customers', title: 'العملاء', icon: 'people', href: '/customers.html' },
            { page: 'drivers', title: 'السائقون', icon: 'local_shipping', href: '/drivers.html' },
            { page: 'rewards', title: 'نظام النقاط', icon: 'stars', href: '/rewards.html' },
            { page: 'settings', title: 'الإعدادات', icon: 'settings', href: '/settings.html' }
        ];
    }

    addNavigationStyles() {
        const styles = `
            <style>
                /* Desktop Sidebar Styles */
                .sidebar {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 280px;
                    height: 100vh;
                    background: #fff;
                    border-left: 1px solid #e5e7eb;
                    box-shadow: -2px 0 8px rgba(0,0,0,0.03);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                }

                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #f1f3f4;
                }

                .sidebar-logo {
                    font-size: 2rem;
                }

                .sidebar-menu {
                    flex: 1;
                    padding: 1rem 0;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    padding: 0.875rem 1.5rem;
                    color: #4b5563;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    border-radius: 0;
                    margin: 0 0.5rem;
                    gap: 0.75rem;
                }

                .nav-item:hover {
                    background: #f8fafc;
                    color: #1976d2;
                    text-decoration: none;
                }

                .nav-item.active {
                    background: #e3f2fd;
                    color: #1976d2;
                    font-weight: 600;
                    border-radius: 8px;
                }

                .nav-item .material-icons-outlined {
                    font-size: 1.25rem;
                    width: 24px;
                }

                .sidebar-footer {
                    padding: 1rem 0;
                    border-top: 1px solid #f1f3f4;
                }

                /* Mobile Navigation Styles */
                .mobile-nav {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #fff;
                    border-bottom: 1px solid #e5e7eb;
                    z-index: 1001;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .mobile-nav-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                }

                .mobile-menu-toggle {
                    background: none;
                    border: none;
                    color: #4b5563;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .mobile-menu-toggle:hover {
                    background: #f3f4f6;
                }

                .mobile-menu {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #fff;
                    border-bottom: 1px solid #e5e7eb;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transform: translateY(-100%);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    max-height: calc(100vh - 80px);
                    overflow-y: auto;
                }

                .mobile-menu.active {
                    transform: translateY(0);
                    opacity: 1;
                    visibility: visible;
                }

                .mobile-menu-items {
                    padding: 1rem 0;
                }

                .mobile-nav-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    color: #4b5563;
                    text-decoration: none;
                    transition: background 0.2s;
                    gap: 0.75rem;
                }

                .mobile-nav-item:hover {
                    background: #f8fafc;
                    color: #1976d2;
                    text-decoration: none;
                }

                .mobile-nav-item.active {
                    background: #e3f2fd;
                    color: #1976d2;
                    font-weight: 600;
                }

                .mobile-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 999;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }

                .mobile-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }

                /* Content adjustment for sidebar */
                .main-content {
                    margin-right: 280px;
                    min-height: 100vh;
                }

                @media (max-width: 991.98px) {
                    .main-content {
                        margin-right: 0;
                        margin-top: 70px;
                    }
                }

                /* Responsive adjustments */
                @media (max-width: 767.98px) {
                    .sidebar {
                        width: 260px;
                    }
                    
                    .mobile-nav-header {
                        padding: 0.75rem 1rem;
                    }
                    
                    .mobile-nav-item {
                        padding: 0.875rem 1rem;
                    }
                }

                /* RTL Support */
                [dir="rtl"] .sidebar {
                    right: auto;
                    left: 0;
                    border-left: none;
                    border-right: 1px solid #e5e7eb;
                    box-shadow: 2px 0 8px rgba(0,0,0,0.03);
                }

                [dir="rtl"] .main-content {
                    margin-right: 0;
                    margin-left: 280px;
                }

                @media (max-width: 991.98px) {
                    [dir="rtl"] .main-content {
                        margin-left: 0;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');

        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Close mobile menu when clicking nav items
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResponsive();
        });

        // Handle ESC key to close mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const isActive = mobileMenu.classList.contains('active');

        if (isActive) {
            this.closeMobileMenu();
        } else {
            mobileMenu.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');
        
        mobileMenu.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    setActiveNavItem() {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current page nav items
        document.querySelectorAll(`[data-page="${this.currentPage}"]`).forEach(item => {
            item.classList.add('active');
        });
    }

    handleResponsive() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 992;

        // Close mobile menu if switching to desktop
        if (wasMobile && !this.isMobile) {
            this.closeMobileMenu();
        }
    }

    // Public methods for external use
    navigateTo(page) {
        window.location.href = `/${page}.html`;
    }

    getCurrentPageInfo() {
        const navItems = this.getNavigationItems();
        return navItems.find(item => item.page === this.currentPage) || { title: 'صفحة غير معروفة' };
    }

    updateBadge(page, count) {
        const selector = `[data-page="${page}"] .badge`;
        document.querySelectorAll(selector).forEach(badge => {
            badge.textContent = count || '';
            badge.style.display = count ? 'inline-block' : 'none';
        });
    }
}

// Auto-initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}