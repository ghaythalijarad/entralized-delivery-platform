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
                serverInfo: { ar: 'معلومات الخادم:', en: 'Server Information:' },
                username_label: { ar: 'اسم المستخدم', en: 'Username' },
                username_placeholder: { ar: 'أدخل اسم المستخدم', en: 'Enter your username' },
                password_label: { ar: 'كلمة المرور', en: 'Password' },
                password_placeholder: { ar: 'أدخل كلمة المرور', en: 'Enter your password' },
                forgot_password: { ar: 'نسيت كلمة المرور؟', en: 'Forgot your password?' },
                aws_native_optimized: { ar: 'محسن بـ AWS', en: 'AWS Native Optimized' }
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
                user_management_title: { ar: 'إدارة المستخدمين - مركز التحكم', en: 'User Management - Control Center' },
                user_management: { ar: 'إدارة المستخدمين والأدوار', en: 'User & Role Management' },
                user_management_desc: { ar: 'إدارة المستخدمين وتعيين الأدوار بصلاحيات محددة عبر منصة التوصيل', en: 'Manage users and assign roles with specific permissions across the delivery platform' },
                
                // Roles
                admin_role: { ar: 'مدير النظام', en: 'System Administrator' },
                manager_role: { ar: 'مدير العمليات', en: 'Operations Manager' },
                support_role: { ar: 'دعم العملاء', en: 'Customer Support' },
                analyst_role: { ar: 'محلل البيانات', en: 'Data Analyst' },
                
                // Role Descriptions
                admin_desc: { ar: 'صلاحية كاملة للنظام مع إمكانية إدارة المستخدمين', en: 'Full system access with user management capabilities' },
                manager_desc: { ar: 'صلاحية إدارة العمليات والتوصيل', en: 'Operations and delivery management access' },
                support_desc: { ar: 'خدمة العملاء وإدارة الطلبات الأساسية', en: 'Customer service and basic order management' },
                analyst_desc: { ar: 'صلاحية قراءة فقط للتحليلات والتقارير', en: 'Read-only access to analytics and reporting' },
                
                // Permissions
                admin_perm_1: { ar: 'إدارة جميع المستخدمين والأدوار', en: 'Manage all users and roles' },
                admin_perm_2: { ar: 'صلاحية إعدادات النظام', en: 'System configuration access' },
                admin_perm_3: { ar: 'جميع عمليات المنصة', en: 'All platform operations' },
                admin_perm_4: { ar: 'ضوابط الأمان والمراجعة', en: 'Security & audit controls' },
                
                manager_perm_1: { ar: 'إدارة السائقين والتوصيلات', en: 'Manage drivers and deliveries' },
                manager_perm_2: { ar: 'إشراف معالجة الطلبات', en: 'Order processing oversight' },
                manager_perm_3: { ar: 'تحليلات الأداء', en: 'Performance analytics' },
                manager_perm_4: { ar: 'حل مشاكل العملاء', en: 'Customer issue resolution' },
                
                support_perm_1: { ar: 'إدارة حسابات العملاء', en: 'Customer account management' },
                support_perm_2: { ar: 'تحديث حالة الطلبات', en: 'Order status updates' },
                support_perm_3: { ar: 'تتبع وحل المشاكل', en: 'Issue tracking & resolution' },
                support_perm_4: { ar: 'صلاحية التقارير الأساسية', en: 'Basic reporting access' },
                
                analyst_perm_1: { ar: 'صلاحية لوحة التحليلات', en: 'Analytics dashboard access' },
                analyst_perm_2: { ar: 'إنشاء التقارير', en: 'Generate reports' },
                analyst_perm_3: { ar: 'إمكانيات تصدير البيانات', en: 'Data export capabilities' },
                analyst_perm_4: { ar: 'عرض مقاييس الأداء', en: 'Performance metrics view' },
                
                // User Management Interface
                manage_users: { ar: 'إدارة المستخدمين', en: 'Manage Users' },
                add_new_user: { ar: '+ إضافة مستخدم جديد', en: '+ Add New User' },
                filter_by_role: { ar: 'تصفية حسب الدور', en: 'Filter by Role' },
                filter_by_status: { ar: 'تصفية حسب الحالة', en: 'Filter by Status' },
                search_users: { ar: 'البحث عن المستخدمين', en: 'Search Users' },
                search_placeholder: { ar: 'البحث بالاسم أو البريد الإلكتروني...', en: 'Search by name or email...' },
                
                all_roles: { ar: 'جميع الأدوار', en: 'All Roles' },
                all_statuses: { ar: 'جميع الحالات', en: 'All Statuses' },
                active: { ar: 'نشط', en: 'Active' },
                inactive: { ar: 'غير نشط', en: 'Inactive' },
                
                user: { ar: 'المستخدم', en: 'User' },
                role: { ar: 'الدور', en: 'Role' },
                status: { ar: 'الحالة', en: 'Status' },
                last_login: { ar: 'آخر تسجيل دخول', en: 'Last Login' },
                actions: { ar: 'الإجراءات', en: 'Actions' },
                
                // User Form
                username: { ar: 'اسم المستخدم', en: 'Username' },
                email: { ar: 'البريد الإلكتروني', en: 'Email' },
                first_name: { ar: 'الاسم الأول', en: 'First Name' },
                last_name: { ar: 'الاسم الأخير', en: 'Last Name' },
                select_role: { ar: 'اختر الدور', en: 'Select Role' },
                create_user: { ar: 'إنشاء مستخدم', en: 'Create User' },
                
                // Navigation
                system_admin: { ar: 'إدارة النظام', en: 'System Administration' },
                role_permissions: { ar: 'الأدوار والصلاحيات', en: 'Role & Permissions' },
                system_settings: { ar: 'إعدادات النظام', en: 'System Settings' },
                audit_logs: { ar: 'سجلات المراجعة', en: 'Audit Logs' },
                
                operations_mgmt: { ar: 'إدارة العمليات', en: 'Operations Management' },
                fleet_management: { ar: 'إدارة الأسطول', en: 'Fleet Management' },
                performance_analytics: { ar: 'تحليلات الأداء', en: 'Performance Analytics' },
                route_optimization: { ar: 'تحسين المسارات', en: 'Route Optimization' },
                
                customer_support: { ar: 'دعم العملاء', en: 'Customer Support' },
                support_tickets: { ar: 'تذاكر الدعم', en: 'Support Tickets' },
                customer_accounts: { ar: 'حسابات العملاء', en: 'Customer Accounts' },
                refund_management: { ar: 'إدارة المبالغ المستردة', en: 'Refund Management' },
                
                logout: { ar: 'تسجيل الخروج', en: 'Logout' }
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
            },
            
            // Merchant Management
            merchant_management: {
                merchant_management: { ar: 'إدارة التجار', en: 'Merchant Management' },
                merchant_management_title: { ar: 'إدارة التجار', en: 'Merchant Management' },
                merchant_management_subtitle: { ar: 'مراجعة الطلبات وإدارة التجار وإرسال الإشعارات', en: 'Review applications, manage merchants, and send notifications' },
                back_to_dashboard: { ar: 'العودة إلى لوحة التحكم', en: 'Back to Dashboard' },
                sign_out: { ar: 'تسجيل خروج', en: 'Sign Out' },
                
                // Stats
                pending_applications: { ar: 'الطلبات المعلقة', en: 'Pending Applications' },
                approved_merchants: { ar: 'التجار المعتمدين', en: 'Approved Merchants' },
                rejected_applications: { ar: 'الطلبات المرفوضة', en: 'Rejected Applications' },
                total_merchants: { ar: 'إجمالي التجار', en: 'Total Merchants' },
                
                // Tabs
                pending_tab: { ar: 'الطلبات المعلقة', en: 'Pending Applications' },
                approved_tab: { ar: 'التجار المعتمدين', en: 'Approved Merchants' },
                all_tab: { ar: 'جميع التجار', en: 'All Merchants' },
                
                // Review Modal
                review_application: { ar: 'مراجعة الطلب', en: 'Review Application' },
                decision: { ar: 'القرار', en: 'Decision' },
                select_decision: { ar: 'اختر القرار', en: 'Select Decision' },
                approve: { ar: 'اعتماد', en: 'Approve' },
                reject: { ar: 'رفض', en: 'Reject' },
                comments: { ar: 'التعليقات', en: 'Comments' },
                review_comments_placeholder: { ar: 'أضف أي تعليقات للتاجر...', en: 'Add any comments for the merchant...' },
                cancel: { ar: 'إلغاء', en: 'Cancel' },
                submit_review: { ar: 'إرسال المراجعة', en: 'Submit Review' },
                
                // General
                loading_merchants: { ar: 'جاري تحميل التجار...', en: 'Loading merchants...' },
                no_merchants: { ar: 'لا يوجد تجار', en: 'No merchants found' },
            },
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

// Compatibility function for legacy code
function initializeBilingual() {
    if (!window.bilingualManager) {
        window.bilingualManager = new BilingualManager();
    }
    return window.bilingualManager;
}

// Make initializeBilingual available globally
window.initializeBilingual = initializeBilingual;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BilingualManager;
}
