// AWS Configuration for Amplify Deployment
// This file will be automatically updated by the deployment script

export const AWS_CONFIG = {
    region: 'us-east-1',
    environment: 'production',
    merchantAPI: {
        endpoint: 'https://YOUR_API_GATEWAY_URL/dev',
        tableName: 'production-merchants'
    },
    amplify: {
        deployed: true,
        deploymentDate: new Date().toISOString(),
        version: '2.0.0'
    }
};

// API endpoints - will be updated after backend deployment
export const API_ENDPOINTS = {
    merchants: 'https://YOUR_API_GATEWAY_URL/dev/merchants',
    createMerchant: 'https://YOUR_API_GATEWAY_URL/dev/merchants',
    updateMerchant: (merchantId) => `https://YOUR_API_GATEWAY_URL/dev/merchants/${merchantId}`,
    getMerchants: 'https://YOUR_API_GATEWAY_URL/dev/merchants'
};

// Merchant type configurations for Amplify deployment
export const MERCHANT_TYPES = {
    restaurant: {
        displayName: { ar: 'مطعم', en: 'Restaurant' },
        icon: '🍽️',
        description: 'Traditional restaurants and dining establishments'
    },
    store: {
        displayName: { ar: 'متجر', en: 'Store' },
        icon: '🏪',
        description: 'Retail stores and shops'
    },
    pharmacy: {
        displayName: { ar: 'صيدلية', en: 'Pharmacy' },
        icon: '💊',
        description: 'Pharmacies and medical suppliers'
    },
    cloud_kitchen: {
        displayName: { ar: 'مطبخ سحابي', en: 'Cloud Kitchen' },
        icon: '🍳',
        description: 'Delivery-only kitchens'
    }
};

// Deployment information
export const DEPLOYMENT_INFO = {
    platform: 'AWS Amplify',
    features: [
        'Four merchant types support',
        'Enhanced data structure',
        'Real-time status management',
        'Admin dashboard',
        'Mobile responsive design'
    ],
    lastUpdated: new Date().toISOString()
};

console.log('AWS Configuration loaded for Amplify deployment:', AWS_CONFIG);
