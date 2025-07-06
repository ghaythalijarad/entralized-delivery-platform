/**
 * Merchant Management API Utility
 * Handles all API calls for merchant management operations with support for
 * 4 merchant types: restaurant, store, pharmacy, cloud_kitchen
 */

// Add Amplify imports & configuration
import Amplify, { Auth, API, graphqlOperation } from 'aws-amplify';
import awsExports from '../aws-exports';
Amplify.configure(awsExports);

class MerchantAPI {
    constructor() {
        // Default configuration - will be overridden by AWS config
        this.baseURL = 'https://YOUR_API_GATEWAY_URL/dev'; 
        this.mockMode = false;
        this.isInitialized = false;
        
        // Merchant type configurations
        this.merchantTypes = {
            restaurant: {
                displayName: { ar: 'مطعم', en: 'Restaurant' },
                requiredFields: ['businessName', 'ownerFirstName', 'ownerLastName', 'email', 'phoneNumber', 'address'],
                optionalFields: ['description', 'cuisine', 'operatingHours']
            },
            store: {
                displayName: { ar: 'متجر', en: 'Store' },
                requiredFields: ['businessName', 'ownerFirstName', 'ownerLastName', 'email', 'phoneNumber', 'address'],
                optionalFields: ['description', 'categories', 'businessRegistration']
            },
            pharmacy: {
                displayName: { ar: 'صيدلية', en: 'Pharmacy' },
                requiredFields: ['businessName', 'ownerFirstName', 'ownerLastName', 'email', 'phoneNumber', 'address', 'licenseNumber'],
                optionalFields: ['description', 'pharmacistLicense']
            },
            cloud_kitchen: {
                displayName: { ar: 'مطبخ سحابي', en: 'Cloud Kitchen' },
                requiredFields: ['businessName', 'ownerFirstName', 'ownerLastName', 'email', 'phoneNumber', 'address'],
                optionalFields: ['description', 'deliveryZones', 'kitchenCapacity']
            }
        };
    }

    /**
     * Initialize the API with AWS configuration
     */
    async initialize() {
        try {
            // Try to load AWS configuration
            await this.loadAWSConfig();
            
            // Try to get current user from Cognito (optional)
            try {
                this.awsCredentials = await this.getAWSCredentials();
                console.log('Merchant API initialized with authentication');
            } catch (authError) {
                console.log('Authentication not available, using API key mode');
                this.mockMode = false; // Still use real API, just without user auth
            }
            
            this.isInitialized = true;
            console.log('Merchant API initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Merchant API:', error);
            console.log('Falling back to mock mode');
            this.mockMode = true;
            this.isInitialized = true;
        }
    }

    /**
     * Load AWS configuration from config file
     */
    async loadAWSConfig() {
        try {
            // Try to load Amplify config first (for Amplify deployments)
            try {
                const { AWS_CONFIG, API_ENDPOINTS } = await import('../config/amplify-config.js');
                if (API_ENDPOINTS && API_ENDPOINTS.merchants) {
                    this.baseURL = API_ENDPOINTS.merchants.replace('/merchants', '');
                    console.log('Amplify configuration loaded:', this.baseURL);
                    return;
                }
            } catch (amplifyError) {
                console.log('Amplify config not found, trying standard AWS config...');
            }

            // Try to dynamically import standard AWS config
            const { AWS_CONFIG, API_ENDPOINTS } = await import('../config/aws-config.js');
            
            if (API_ENDPOINTS && API_ENDPOINTS.merchants) {
                this.baseURL = API_ENDPOINTS.merchants.replace('/merchants', '');
                console.log('AWS configuration loaded:', this.baseURL);
            } else {
                throw new Error('API endpoints not found in configuration');
            }
        } catch (error) {
            console.warn('Could not load AWS config, using default configuration');
            throw error;
        }
    }

    /**
     * Get AWS credentials via Amplify Auth
     */
    async getAWSCredentials() {
        return Auth.currentCredentials();
    }

    /**
     * Execute GraphQL query or mutation using Amplify API
     */
    async executeGraphQL(query, variables = {}) {
        const result = await API.graphql(graphqlOperation(query, variables));
        if (result.errors) {
            throw new Error(result.errors.map(e => e.message).join(', '));
        }
        return result.data;
    }

    /**
     * Get JWT token for authentication via Amplify
     */
    async getJWTToken() {
        const session = await Auth.currentSession();
        return session.getIdToken().getJwtToken();
    }

    /**
     * Get all merchants or filter by status
     */
    async getMerchants(status = null, merchantType = null) {
        try {
            if (this.mockMode) {
                return this.getMockMerchants(status, merchantType);
            }

            let endpoint = '/merchants';
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (merchantType) params.append('merchantType', merchantType);
            
            if (params.toString()) {
                endpoint += `?${params.toString()}`;
            }

            const response = await this.makeAPICall('GET', endpoint);
            return response.merchants || [];
        } catch (error) {
            console.error('Error fetching merchants:', error);
            // Fallback to mock data
            return this.getMockMerchants(status, merchantType);
        }
    }

    /**
     * Review merchant application (approve/reject/suspend)
     */
    async reviewMerchant(merchantId, decision, comments = '') {
        try {
            if (this.mockMode) {
                return this.mockReviewMerchant(merchantId, decision, comments);
            }

            const endpoint = `/merchants/${merchantId}/review`;
            const body = {
                decision: decision, // 'approved', 'rejected', 'suspended'
                comments: comments,
                reviewedAt: new Date().toISOString(),
                reviewerId: 'admin'
            };

            const response = await this.makeAPICall('POST', endpoint, body);
            return response;
        } catch (error) {
            console.error('Error reviewing merchant:', error);
            throw error;
        }
    }

    /**
     * Get merchant details by ID
     */
    async getMerchantById(merchantId) {
        try {
            if (this.mockMode) {
                const merchants = this.getMockMerchants();
                return merchants.find(m => m.id === merchantId);
            }

            const endpoint = `/merchants/${merchantId}`;
            const response = await this.makeAPICall('GET', endpoint);
            return response.merchant;
        } catch (error) {
            console.error('Error fetching merchant:', error);
            throw error;
        }
    }

    /**
     * Get merchant type display name
     */
    getMerchantTypeDisplayName(merchantType, language = 'en') {
        if (this.merchantTypes[merchantType]) {
            return this.merchantTypes[merchantType].displayName[language];
        }
        return merchantType;
    }

    /**
     * Validate merchant data based on type
     */
    validateMerchantData(merchantData) {
        const { merchantType } = merchantData;
        if (!this.merchantTypes[merchantType]) {
            return { valid: false, errors: ['Invalid merchant type'] };
        }

        const config = this.merchantTypes[merchantType];
        const errors = [];

        // Check required fields
        config.requiredFields.forEach(field => {
            if (field === 'address') {
                if (!merchantData.address || !merchantData.address.street || !merchantData.address.city) {
                    errors.push(`Address is required with street and city`);
                }
            } else if (!merchantData[field] || merchantData[field].trim() === '') {
                errors.push(`${field} is required`);
            }
        });

        // Validate email format
        if (merchantData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merchantData.email)) {
            errors.push('Invalid email format');
        }

        // Validate phone format
        if (merchantData.phone && !/^\+?[1-9]\d{1,14}$/.test(merchantData.phone.replace(/\s/g, ''))) {
            errors.push('Invalid phone number format');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Mock data for development/testing
     */
    getMockMerchants(status = null, merchantType = null) {
        const mockMerchants = [
            {
                id: 1,
                businessName: 'Fresh Food Restaurant',
                ownerFirstName: 'Ahmed',
                ownerLastName: 'Al-Rashid',
                email: 'ahmed@freshfood.com',
                phone: '+966501234567',
                merchantType: 'restaurant',
                address: {
                    street: '123 King Fahd Road',
                    city: 'Riyadh',
                    district: 'Al-Malaz',
                    postalCode: '11473'
                },
                status: 'pending',
                appliedAt: '2024-12-15',
                description: 'Traditional Arabic cuisine restaurant specializing in local dishes'
            },
            {
                id: 2,
                businessName: 'MediCare Pharmacy',
                ownerFirstName: 'Sarah',
                ownerLastName: 'Johnson',
                email: 'sarah@medicare.com',
                phone: '+966502345678',
                merchantType: 'pharmacy',
                address: {
                    street: '456 Prince Sultan Road',
                    city: 'Jeddah',
                    district: 'Al-Hamra',
                    postalCode: '21452'
                },
                status: 'approved',
                appliedAt: '2024-12-13',
                approvedAt: '2024-12-14',
                licenseNumber: 'PH-2024-001'
            },
            {
                id: 3,
                businessName: 'Fashion Paradise Store',
                ownerFirstName: 'Fatima',
                ownerLastName: 'Al-Zahra',
                email: 'fatima@fashionparadise.com',
                phone: '+966503456789',
                merchantType: 'store',
                address: {
                    street: '789 Corniche Road',
                    city: 'Dammam',
                    district: 'Al-Ferdous',
                    postalCode: '31411'
                },
                status: 'rejected',
                appliedAt: '2024-12-12',
                rejectedAt: '2024-12-14',
                rejectionReason: 'Incomplete business registration documents'
            },
            {
                id: 4,
                businessName: 'Quick Bites Cloud Kitchen',
                ownerFirstName: 'Omar',
                ownerLastName: 'Hassan',
                email: 'omar@quickbites.com',
                phone: '+966504567890',
                merchantType: 'cloud_kitchen',
                address: {
                    street: '321 Industrial Area',
                    city: 'Riyadh',
                    district: 'Al-Sulay',
                    postalCode: '11564'
                },
                status: 'suspended',
                appliedAt: '2024-12-10',
                approvedAt: '2024-12-11',
                suspendedAt: '2024-12-15',
                suspensionReason: 'Multiple customer complaints about food quality and delayed deliveries'
            },
            {
                id: 5,
                businessName: 'Spice Garden Restaurant',
                ownerFirstName: 'Khalid',
                ownerLastName: 'Al-Mansouri',
                email: 'khalid@spicegarden.com',
                phone: '+966505678901',
                merchantType: 'restaurant',
                address: {
                    street: '567 Olaya Street',
                    city: 'Riyadh',
                    district: 'Olaya',
                    postalCode: '11523'
                },
                status: 'approved',
                appliedAt: '2024-12-11',
                approvedAt: '2024-12-12'
            },
            {
                id: 6,
                businessName: 'HealthPlus Pharmacy',
                ownerFirstName: 'Nadia',
                ownerLastName: 'Al-Khatib',
                email: 'nadia@healthplus.com',
                phone: '+966506789012',
                merchantType: 'pharmacy',
                address: {
                    street: '890 Abdullah Al-Suleman Road',
                    city: 'Jeddah',
                    district: 'Al-Zahra',
                    postalCode: '21589'
                },
                status: 'pending',
                appliedAt: '2024-12-14',
                licenseNumber: 'PH-2024-002'
            }
        ];

        let filteredMerchants = mockMerchants;

        if (status) {
            filteredMerchants = filteredMerchants.filter(m => m.status === status);
        }

        if (merchantType) {
            filteredMerchants = filteredMerchants.filter(m => m.merchantType === merchantType);
        }

        return filteredMerchants;
    }

    /**
     * Mock review merchant for testing
     */
    mockReviewMerchant(merchantId, decision, comments) {
        console.log(`Mock: Reviewing merchant ${merchantId} with decision: ${decision}`);
        return {
            success: true,
            message: `Merchant ${decision} successfully`,
            merchantId,
            decision,
            comments,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Make authenticated API call
     */
    async makeAPICall(method, endpoint, body = null) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            };

            // Add authentication if available
            if (this.awsCredentials) {
                // Use AWS signature for authenticated requests
                const signedRequest = await this.signRequest(method, url, body);
                Object.assign(headers, signedRequest.headers);
            }

            const requestOptions = {
                method: method,
                headers: headers,
                mode: 'cors'
            };

            if (body) {
                requestOptions.body = JSON.stringify(body);
            }

            console.log(`Making API call: ${method} ${url}`);

            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API call failed: ${response.status} ${response.statusText}`, errorText);
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API response:', data);
            return data;
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

    /**
     * Sign AWS API requests (for authenticated calls)
     */
    async signRequest(method, url, body = null) {
        const awsRequest = {
            method: method,
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Host': new URL(url).host
            }
        };

        if (body) {
            awsRequest.body = JSON.stringify(body);
        }

        if (typeof AWS !== 'undefined' && this.awsCredentials) {
            try {
                const signer = new AWS.Signers.V4(awsRequest, 'execute-api');
                signer.addAuthorization(this.awsCredentials, new Date());
            } catch (error) {
                console.warn('Failed to sign request:', error);
            }
        }

        return awsRequest;
    }

    /**
     * Update merchant status
     */
    async updateMerchantStatus(merchantId, status, reviewNotes = '', reviewedBy = 'admin') {
        try {
            if (this.mockMode) {
                return this.mockUpdateMerchantStatus(merchantId, status, reviewNotes);
            }

            const endpoint = `/merchants/${merchantId}`;
            const body = {
                status: status,
                reviewNotes: reviewNotes,
                reviewedBy: reviewedBy,
                reviewedAt: new Date().toISOString()
            };

            const response = await this.makeAPICall('PUT', endpoint, body);
            return response;
        } catch (error) {
            console.error('Error updating merchant status:', error);
            throw error;
        }
    }

    /**
     * Create new merchant
     */
    async createMerchant(merchantData) {
        try {
            if (this.mockMode) {
                return this.mockCreateMerchant(merchantData);
            }

            const endpoint = '/merchants';
            const response = await this.makeAPICall('POST', endpoint, merchantData);
            return response;
        } catch (error) {
            console.error('Error creating merchant:', error);
            throw error;
        }
    }

    /**
     * Mock method for updating merchant status
     */
    mockUpdateMerchantStatus(merchantId, status, reviewNotes) {
        console.log(`Mock: Updating merchant ${merchantId} status to ${status}`);
        return {
            success: true,
            message: `Merchant status updated to ${status}`,
            merchantId: merchantId,
            status: status,
            reviewNotes: reviewNotes
        };
    }

    /**
     * Mock method for creating merchant
     */
    mockCreateMerchant(merchantData) {
        console.log('Mock: Creating merchant', merchantData);
        return {
            success: true,
            merchantId: 'mock-' + Date.now(),
            message: 'Merchant created successfully',
            ...merchantData
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MerchantAPI;
} else {
    window.MerchantAPI = MerchantAPI;
}