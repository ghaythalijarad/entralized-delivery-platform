/**
 * Update all HTML pages to include bilingual support
 * This script adds the necessary language switcher and bilingual utilities to all pages
 */

// Enhanced bilingual translations for all pages
const enhancedTranslations = {
    // Orders page
    orders: {
        title: { ar: 'إدارة الطلبات - النظام المركزي', en: 'Order Management - Central System' },
        pageTitle: { ar: 'إدارة الطلبات', en: 'Order Management' },
        newOrder: { ar: 'طلب جديد', en: 'New Order' },
        orderNumber: { ar: 'رقم الطلب', en: 'Order Number' },
        customer: { ar: 'العميل', en: 'Customer' },
        driver: { ar: 'السائق', en: 'Driver' },
        merchant: { ar: 'التاجر', en: 'Merchant' },
        status: { ar: 'الحالة', en: 'Status' },
        amount: { ar: 'المبلغ', en: 'Amount' },
        date: { ar: 'التاريخ', en: 'Date' },
        actions: { ar: 'الإجراءات', en: 'Actions' },
        pending: { ar: 'قيد الانتظار', en: 'Pending' },
        accepted: { ar: 'مقبول', en: 'Accepted' },
        inProgress: { ar: 'قيد التنفيذ', en: 'In Progress' },
        completed: { ar: 'مكتمل', en: 'Completed' },
        cancelled: { ar: 'ملغي', en: 'Cancelled' },
        viewDetails: { ar: 'عرض التفاصيل', en: 'View Details' },
        editOrder: { ar: 'تعديل الطلب', en: 'Edit Order' },
        cancelOrder: { ar: 'إلغاء الطلب', en: 'Cancel Order' }
    },
    
    // Drivers page
    drivers: {
        title: { ar: 'إدارة السائقين - النظام المركزي', en: 'Driver Management - Central System' },
        pageTitle: { ar: 'إدارة السائقين', en: 'Driver Management' },
        addDriver: { ar: 'إضافة سائق', en: 'Add Driver' },
        driverName: { ar: 'اسم السائق', en: 'Driver Name' },
        phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
        vehicleType: { ar: 'نوع المركبة', en: 'Vehicle Type' },
        licenseNumber: { ar: 'رقم الرخصة', en: 'License Number' },
        status: { ar: 'الحالة', en: 'Status' },
        location: { ar: 'الموقع', en: 'Location' },
        rating: { ar: 'التقييم', en: 'Rating' },
        totalDeliveries: { ar: 'إجمالي التوصيلات', en: 'Total Deliveries' },
        active: { ar: 'نشط', en: 'Active' },
        inactive: { ar: 'غير نشط', en: 'Inactive' },
        busy: { ar: 'مشغول', en: 'Busy' },
        offline: { ar: 'غير متصل', en: 'Offline' }
    },
    
    // Merchants page
    merchants: {
        title: { ar: 'إدارة التجار - النظام المركزي', en: 'Merchant Management - Central System' },
        pageTitle: { ar: 'إدارة التجار', en: 'Merchant Management' },
        addMerchant: { ar: 'إضافة تاجر', en: 'Add Merchant' },
        merchantName: { ar: 'اسم التاجر', en: 'Merchant Name' },
        businessType: { ar: 'نوع النشاط', en: 'Business Type' },
        address: { ar: 'العنوان', en: 'Address' },
        phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
        email: { ar: 'البريد الإلكتروني', en: 'Email' },
        status: { ar: 'الحالة', en: 'Status' },
        commission: { ar: 'العمولة', en: 'Commission' },
        totalOrders: { ar: 'إجمالي الطلبات', en: 'Total Orders' },
        revenue: { ar: 'الإيرادات', en: 'Revenue' },
        active: { ar: 'نشط', en: 'Active' },
        suspended: { ar: 'معلق', en: 'Suspended' },
        pending: { ar: 'قيد المراجعة', en: 'Pending Review' }
    },
    
    // Customers page
    customers: {
        title: { ar: 'إدارة العملاء - النظام المركزي', en: 'Customer Management - Central System' },
        pageTitle: { ar: 'إدارة العملاء', en: 'Customer Management' },
        customerName: { ar: 'اسم العميل', en: 'Customer Name' },
        phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
        email: { ar: 'البريد الإلكتروني', en: 'Email' },
        address: { ar: 'العنوان', en: 'Address' },
        totalOrders: { ar: 'إجمالي الطلبات', en: 'Total Orders' },
        totalSpent: { ar: 'إجمالي الإنفاق', en: 'Total Spent' },
        lastOrder: { ar: 'آخر طلب', en: 'Last Order' },
        customerSince: { ar: 'عميل منذ', en: 'Customer Since' },
        viewProfile: { ar: 'عرض الملف الشخصي', en: 'View Profile' },
        orderHistory: { ar: 'تاريخ الطلبات', en: 'Order History' }
    },
    
    // Settings page
    settings: {
        title: { ar: 'الإعدادات - النظام المركزي', en: 'Settings - Central System' },
        pageTitle: { ar: 'إعدادات النظام', en: 'System Settings' },
        generalSettings: { ar: 'الإعدادات العامة', en: 'General Settings' },
        notifications: { ar: 'الإشعارات', en: 'Notifications' },
        security: { ar: 'الأمان', en: 'Security' },
        integrations: { ar: 'التكاملات', en: 'Integrations' },
        backup: { ar: 'النسخ الاحتياطي', en: 'Backup' },
        systemInfo: { ar: 'معلومات النظام', en: 'System Information' },
        saveSettings: { ar: 'حفظ الإعدادات', en: 'Save Settings' },
        resetToDefault: { ar: 'إعادة تعيين للافتراضي', en: 'Reset to Default' }
    }
};

// Function to add bilingual support to any page
function addBilingualSupport(pageType) {
    // Add bilingual script if not already present
    if (!document.querySelector('script[src*="bilingual.js"]')) {
        const script = document.createElement('script');
        script.src = 'bilingual.js';
        document.head.appendChild(script);
    }
    
    // Add language switcher HTML attributes
    document.documentElement.setAttribute('id', 'htmlRoot');
    
    // Update page title to include both languages
    const currentTitle = document.title;
    if (enhancedTranslations[pageType] && enhancedTranslations[pageType].title) {
        const arTitle = enhancedTranslations[pageType].title.ar;
        const enTitle = enhancedTranslations[pageType].title.en;
        document.title = `${arTitle} | ${enTitle}`;
    }
}

// Auto-detect page type and apply bilingual support
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    let pageType = 'common';
    
    if (path.includes('orders')) pageType = 'orders';
    else if (path.includes('drivers')) pageType = 'drivers';
    else if (path.includes('merchants')) pageType = 'merchants';
    else if (path.includes('customers')) pageType = 'customers';
    else if (path.includes('settings')) pageType = 'settings';
    else if (path.includes('user-management')) pageType = 'userManagement';
    else if (path.includes('dashboard')) pageType = 'dashboard';
    else if (path.includes('login') || path.includes('index')) pageType = 'login';
    
    addBilingualSupport(pageType);
});

// Export enhanced translations for use in bilingual.js
if (typeof window !== 'undefined') {
    window.enhancedTranslations = enhancedTranslations;
}
