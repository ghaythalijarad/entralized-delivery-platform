/**
 * Bilingual Support Utilities for Centralized Delivery Platform
 * Provides Arabic and English language support for all pages
 */

class BilingualManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('preferredLanguage') || 'ar';
        this.translations = {
            // Common elements
            common: {
                loading: { ar: 'جاري التحميل...', en: 'Loading...' },
                error: { ar: 'خطأ', en: 'Error' },
                success: { ar: 'نجح', en: 'Success' },
                save: { ar: 'حفظ', en: 'Save' },
                cancel: { ar: 'إلغاء', en: 'Cancel' },
                delete: { ar: 'حذف', en: 'Delete' },
                edit: { ar: 'تعديل', en: 'Edit' },
                add: { ar: 'إضافة', en: 'Add' },
                search: { ar: 'بحث', en: 'Search' },
                close: { ar: 'إغلاق', en: 'Close' },
                confirm: { ar: 'تأكيد', en: 'Confirm' },
                yes: { ar: 'نعم', en: 'Yes' },
                no: { ar: 'لا', en: 'No' }
            },
            
            // Login page
            login: {
                app_title: { ar: 'مركز التحكم الإداري', en: 'Admin Control Center' },
                login_subtitle: { ar: 'مركز الإدارة المركزي لنظام التوصيل', en: 'Centralized Management Hub for Delivery Ecosystem' },
                title: { ar: 'مركز التحكم الإداري', en: 'Admin Control Center' },
                subtitle: { ar: 'مركز الإدارة المركزي لنظام التوصيل', en: 'Centralized Management Hub for Delivery Ecosystem' },
                admin_access: { ar: 'صلاحية المدير', en: 'Administrator Access' },
                system_management: { ar: 'بوابة إدارة النظام', en: 'System Management Portal' },
                manage_all_users: { ar: 'إدارة جميع المستخدمين', en: 'Manage All Users' },
                control_deliveries: { ar: 'التحكم في التوصيلات', en: 'Control Deliveries' },
                monitor_analytics: { ar: 'مراقبة التحليلات', en: 'Monitor Analytics' },
                username: { ar: 'اسم المستخدم', en: 'Username' },
                password: { ar: 'كلمة المرور', en: 'Password' },
                loginButton: { ar: 'تسجيل دخول المدير', en: 'Admin Sign In' },
                admin_only: { ar: 'للمديرين فقط', en: 'Administrator Access Only' },
                admin_access_description: { ar: 'هذه البوابة مخصصة للمديرين المعتمدين فقط.', en: 'This portal is restricted to authorized administrators only.' },
                centralized_control: { ar: 'التحكم المركزي', en: 'Centralized Control' },
                real_time_monitoring: { ar: 'المراقبة في الوقت الفعلي', en: 'Real-time Monitoring' },
                secure_management: { ar: 'الإدارة الآمنة', en: 'Secure Management' },
                demoButton: { ar: 'تعبئة بيانات تجريبية', en: 'Fill Demo Data' },
                systemInfo: { ar: 'معلومات النظام:', en: 'System Information:' },
                environment: { ar: 'البيئة:', en: 'Environment:' },
                server: { ar: 'الخادم:', en: 'Server:' },
                checking: { ar: 'جاري التحقق...', en: 'Checking...' },
                connected: { ar: '✅ متصل', en: '✅ Connected' },
                disconnected: { ar: '❌ غير متصل', en: '❌ Disconnected' },
                loginSuccess: { ar: 'تم تسجيل الدخول بنجاح!', en: 'Login successful!' },
                loginFailed: { ar: 'فشل في تسجيل الدخول', en: 'Login failed' },
                connectionError: { ar: 'خطأ في الاتصال بالخادم', en: 'Server connection error' },
                loggingIn: { ar: 'جاري تسجيل الدخول...', en: 'Logging in...' },
                serverInfo: { ar: 'معلومات الخادم:', en: 'Server Information:' }
            },
            
            // Dashboard
            dashboard: {
                title: { ar: 'لوحة التحكم - مركز التحكم الإداري', en: 'Dashboard - Admin Control Center' },
                dashboard_title: { ar: 'مركز التحكم الإداري', en: 'Admin Control Center' },
                logoText: { ar: 'مركز التحكم الإداري', en: 'Admin Control Center' },
                welcome: { ar: 'مرحباً، ', en: 'Welcome, ' },
                admin: { ar: 'المدير', en: 'Admin' },
                logout: { ar: 'تسجيل الخروج', en: 'Logout' },
                welcomeTitle: { ar: 'مرحباً بك في لوحة التحكم', en: 'Welcome to Dashboard' },
                welcomeText: { ar: 'إدارة شاملة لمنصة التوصيل المركزية', en: 'Comprehensive management for centralized delivery platform' },
                totalOrders: { ar: 'إجمالي الطلبات', en: 'Total Orders' },
                activeDrivers: { ar: 'السائقون النشطون', en: 'Active Drivers' },
                totalMerchants: { ar: 'إجمالي التجار', en: 'Total Merchants' },
                totalCustomers: { ar: 'إجمالي العملاء', en: 'Total Customers' },
                loadingData: { ar: 'جاري تحميل البيانات...', en: 'Loading data...' }
            },
            
            // User Management
            userManagement: {
                title: { ar: 'إدارة المستخدمين - منصة التوصيل المركزية', en: 'User Management - Centralized Delivery Platform' },
                pageTitle: { ar: 'إدارة المستخدمين', en: 'User Management' },
                totalUsers: { ar: 'إجمالي المستخدمين', en: 'Total Users' },
                activeUsers: { ar: 'المستخدمون النشطون', en: 'Active Users' },
                adminUsers: { ar: 'المستخدمون الإداريون', en: 'Admin Users' },
                newUsers: { ar: 'مستخدمون جدد', en: 'New Users' },
                searchPlaceholder: { ar: 'البحث بالاسم أو البريد الإلكتروني...', en: 'Search by name or email...' },
                filterByGroup: { ar: 'تصفية حسب المجموعة', en: 'Filter by Group' },
                allGroups: { ar: 'جميع المجموعات', en: 'All Groups' },
                addUser: { ar: 'إضافة مستخدم جديد', en: 'Add New User' },
                username: { ar: 'اسم المستخدم', en: 'Username' },
                email: { ar: 'البريد الإلكتروني', en: 'Email' },
                fullName: { ar: 'الاسم الكامل', en: 'Full Name' },
                groups: { ar: 'المجموعات', en: 'Groups' },
                status: { ar: 'الحالة', en: 'Status' },
                actions: { ar: 'الإجراءات', en: 'Actions' },
                enabled: { ar: 'مفعل', en: 'Enabled' },
                disabled: { ar: 'معطل', en: 'Disabled' },
                createUser: { ar: 'إنشاء مستخدم', en: 'Create User' },
                editUser: { ar: 'تعديل مستخدم', en: 'Edit User' },
                deleteUser: { ar: 'حذف مستخدم', en: 'Delete User' },
                confirmDelete: { ar: 'هل أنت متأكد من حذف هذا المستخدم؟', en: 'Are you sure you want to delete this user?' }
            },
            
            // Settings
            settings: {
                title: { ar: 'الإعدادات - منصة التوصيل المركزية', en: 'Settings - Centralized Delivery Platform' },
                pageTitle: { ar: 'إعدادات النظام', en: 'System Settings' },
                awsSettings: { ar: 'إعدادات AWS', en: 'AWS Settings' },
                databaseSettings: { ar: 'إعدادات قاعدة البيانات', en: 'Database Settings' },
                securitySettings: { ar: 'إعدادات الأمان', en: 'Security Settings' },
                notificationSettings: { ar: 'إعدادات الإشعارات', en: 'Notification Settings' },
                saveSettings: { ar: 'حفظ الإعدادات', en: 'Save Settings' },
                resetSettings: { ar: 'إعادة تعيين', en: 'Reset Settings' }
            },
            
            // Navigation
            navigation: {
                dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
                orders: { ar: 'الطلبات', en: 'Orders' },
                drivers: { ar: 'السائقون', en: 'Drivers' },
                merchants: { ar: 'التجار', en: 'Merchants' },
                customers: { ar: 'العملاء', en: 'Customers' },
                users: { ar: 'المستخدمون', en: 'Users' },
                settings: { ar: 'الإعدادات', en: 'Settings' },
                reports: { ar: 'التقارير', en: 'Reports' },
                analytics: { ar: 'التحليلات', en: 'Analytics' }
            }
        };
        
        this.init();
    }
    
    init() {
        this.createLanguageSwitcher();
        this.switchLanguage(this.currentLanguage);
    }
    
    createLanguageSwitcher() {
        // Check if language switcher already exists
        if (document.querySelector('.language-switcher')) {
            return;
        }
        
        const switcher = document.createElement('div');
        switcher.className = 'language-switcher';
        switcher.innerHTML = `
            <button id="arabicBtn" class="${this.currentLanguage === 'ar' ? 'active' : ''}" onclick="window.bilingualManager.switchLanguage('ar')">عربي</button>
            <button id="englishBtn" class="${this.currentLanguage === 'en' ? 'active' : ''}" onclick="window.bilingualManager.switchLanguage('en')">English</button>
        `;
        
        document.body.appendChild(switcher);
        
        // Add CSS if not already present
        if (!document.querySelector('#bilingual-css')) {
            const style = document.createElement('style');
            style.id = 'bilingual-css';
            style.textContent = `
                .language-switcher {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.95);
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 12px;
                    z-index: 1000;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .language-switcher button {
                    background: none;
                    border: 1px solid #ddd;
                    padding: 5px 10px;
                    margin: 0 2px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .language-switcher button.active {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }
                
                .language-switcher button:hover {
                    background: #f8f9fa;
                }
                
                .language-switcher button.active:hover {
                    background: #5a6fd8;
                }
                
                [dir="rtl"] .language-switcher {
                    right: 20px;
                    left: auto;
                }
                
                [dir="ltr"] .language-switcher {
                    left: 20px;
                    right: auto;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    switchLanguage(lang) {
        this.currentLanguage = lang;
        const isArabic = (lang === 'ar');
        
        // Update direction and language
        document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
        
        // Update language switcher buttons
        const arabicBtn = document.getElementById('arabicBtn');
        const englishBtn = document.getElementById('englishBtn');
        
        if (arabicBtn && englishBtn) {
            arabicBtn.classList.toggle('active', isArabic);
            englishBtn.classList.toggle('active', !isArabic);
        }
        
        // Save language preference
        localStorage.setItem('preferredLanguage', lang);
        
        // Trigger page-specific updates
        this.updatePageTexts();
        
        // Dispatch custom event for pages to listen to
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang, isArabic } }));
    }
    
    getText(category, key) {
        if (this.translations[category] && this.translations[category][key]) {
            return this.translations[category][key][this.currentLanguage] || this.translations[category][key]['ar'];
        }
        return key; // Return the key itself if translation not found
    }
    
    updatePageTexts() {
        // Auto-update elements with data-translate attributes
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const [category, key] = element.getAttribute('data-translate').split('.');
            if (category && key) {
                const text = this.getText(category, key);
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = text;
                } else {
                    element.textContent = text;
                }
            }
        });
        
        // Update title if it has data-translate
        const titleElement = document.querySelector('title[data-translate]');
        if (titleElement) {
            const [category, key] = titleElement.getAttribute('data-translate').split('.');
            titleElement.textContent = this.getText(category, key);
        }
    }
    
    isArabic() {
        return this.currentLanguage === 'ar';
    }
    
    isEnglish() {
        return this.currentLanguage === 'en';
    }
}

// Initialize bilingual manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.bilingualManager = new BilingualManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BilingualManager;
}
