/**
 * Driver Management API Utility
 * Handles all API calls for driver management operations using AWS Lambda and GraphQL
 * Supports driver registration, approval/rejection, status management, and real-time updates
 */

// Add Amplify imports
import Amplify, { Auth, API, graphqlOperation } from 'aws-amplify';
import awsExports from '../aws-exports';

Amplify.configure(awsExports);

class DriverAPI {
    constructor() {
        this.mockMode = false;
        this.isInitialized = false;
        this.awsCredentials = null;
        
        // Driver status configurations
        this.driverStatuses = {
            available: { ar: 'متاح', en: 'Available', color: 'success' },
            busy: { ar: 'مشغول', en: 'Busy', color: 'warning' },
            offline: { ar: 'غير متصل', en: 'Offline', color: 'secondary' },
            suspended: { ar: 'موقوف', en: 'Suspended', color: 'danger' },
            pending: { ar: 'في الانتظار', en: 'Pending', color: 'info' }
        };
        
        // Vehicle type configurations
        this.vehicleTypes = {
            motorcycle: { ar: 'دراجة نارية', en: 'Motorcycle', icon: '🏍️' },
            car: { ar: 'سيارة', en: 'Car', icon: '🚗' },
            bicycle: { ar: 'دراجة', en: 'Bicycle', icon: '🚴' },
            walking: { ar: 'مشي', en: 'Walking', icon: '🚶' }
        };
    }

    /**
     * Initialize the API with AWS configuration
     */
    async initialize() {
        try {
            // Amplify handles configuration automatically via aws-exports.js
            // Just check if we have authentication
            try {
                this.awsCredentials = await this.getAWSCredentials();
                console.log('Driver API initialized with authentication');
            } catch (authError) {
                console.log('Authentication not available, using public API mode');
                this.mockMode = false; // Still use real API, just without user auth
            }
            
            this.isInitialized = true;
            console.log('Driver API initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Driver API:', error);
            console.log('Falling back to mock mode');
            this.mockMode = true;
            this.isInitialized = true;
        }
    }

    /**
     * Get AWS credentials for API calls via Amplify Auth
     */
    async getAWSCredentials() {
        try {
            return await Auth.currentCredentials();
        } catch (error) {
            console.error('DriverAPI: getAWSCredentials failed', error);
            throw error;
        }
    }

    /**
     * Execute GraphQL query or mutation using Amplify API
     */
    async executeGraphQL(query, variables = {}) {
        try {
            const response = await API.graphql(graphqlOperation(query, variables));
            if (response.errors) {
                throw new Error(response.errors.map(e => e.message).join(', '));
            }
            return response.data;
        } catch (error) {
            console.error('DriverAPI: executeGraphQL error', error);
            throw error;
        }
    }

    /**
     * Get JWT token for authentication via Amplify
     */
    async getJWTToken() {
        try {
            const session = await Auth.currentSession();
            return session.getIdToken().getJwtToken();
        } catch (error) {
            console.error('DriverAPI: getJWTToken failed', error);
            throw error;
        }
    }

    /**
     * Get all drivers with optional filtering
     */
    async getDrivers(filters = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.getMockDrivers(filters);
        }

        try {
            const query = `
                query GetDrivers($limit: Int, $nextToken: String, $zone: String, $status: DriverStatus) {
                    getDriversByZone(zone: $zone, status: $status, limit: $limit, nextToken: $nextToken) {
                        items {
                            driverId
                            email
                            firstName
                            lastName
                            phoneNumber
                            status
                            currentLocation {
                                latitude
                                longitude
                                timestamp
                            }
                            vehicle {
                                type
                                licensePlate
                                model
                                color
                            }
                            zone
                            rating
                            totalDeliveries
                            isOnline
                            createdAt
                            updatedAt
                        }
                        nextToken
                    }
                }
            `;

            const variables = {
                limit: filters.limit || 50,
                nextToken: filters.nextToken || null,
                zone: filters.zone || null,
                status: filters.status || null
            };

            const data = await this.executeGraphQL(query, variables);
            return {
                drivers: data.getDriversByZone.items,
                nextToken: data.getDriversByZone.nextToken
            };
        } catch (error) {
            console.error('Error fetching drivers:', error);
            throw error;
        }
    }

    /**
     * Get available drivers for assignment
     */
    async getAvailableDrivers(zone = null) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.getMockDrivers({ status: 'available' });
        }

        try {
            const query = `
                query GetAvailableDrivers($zone: String) {
                    getAvailableDrivers(zone: $zone) {
                        driverId
                        firstName
                        lastName
                        phoneNumber
                        currentLocation {
                            latitude
                            longitude
                        }
                        vehicle {
                            type
                            licensePlate
                        }
                        zone
                        rating
                        totalDeliveries
                    }
                }
            `;

            const data = await this.executeGraphQL(query, { zone });
            return data.getAvailableDrivers;
        } catch (error) {
            console.error('Error fetching available drivers:', error);
            throw error;
        }
    }

    /**
     * Create a new driver (from mobile app registration)
     */
    async createDriver(driverData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.createMockDriver(driverData);
        }

        try {
            const mutation = `
                mutation RegisterDriver($input: RegisterDriverInput!) {
                    registerDriver(input: $input) {
                        success
                        message
                        user {
                            userId
                            email
                            firstName
                            lastName
                        }
                    }
                }
            `;

            const input = {
                email: driverData.email,
                password: driverData.password || 'TempPassword123!',
                firstName: driverData.firstName,
                lastName: driverData.lastName,
                phoneNumber: driverData.phoneNumber,
                vehicle: {
                    type: driverData.vehicleType.toUpperCase(),
                    licensePlate: driverData.licensePlate,
                    model: driverData.vehicleModel || 'Unknown',
                    color: driverData.vehicleColor || 'Unknown'
                },
                zone: driverData.zone || 'central'
            };

            const data = await this.executeGraphQL(mutation, { input });
            return data.registerDriver;
        } catch (error) {
            console.error('Error creating driver:', error);
            throw error;
        }
    }

    /**
     * Update driver status (approve, reject, suspend)
     */
    async updateDriverStatus(driverId, status, reason = '') {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.updateMockDriverStatus(driverId, status);
        }

        try {
            const mutation = `
                mutation UpdateDriverStatus($driverId: ID!, $status: DriverStatus!) {
                    updateDriverStatus(driverId: $driverId, status: $status) {
                        driverId
                        status
                        firstName
                        lastName
                        updatedAt
                    }
                }
            `;

            const statusMap = {
                'approved': 'AVAILABLE',
                'active': 'AVAILABLE',
                'rejected': 'OFFLINE',
                'inactive': 'OFFLINE',
                'suspended': 'OFFLINE'
            };

            const data = await this.executeGraphQL(mutation, {
                driverId,
                status: statusMap[status] || status.toUpperCase()
            });

            return data.updateDriverStatus;
        } catch (error) {
            console.error('Error updating driver status:', error);
            throw error;
        }
    }

    /**
     * Get driver by ID
     */
    async getDriverById(driverId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.getMockDriverById(driverId);
        }

        try {
            const query = `
                query GetDriver($driverId: ID!) {
                    getDriver(driverId: $driverId) {
                        driverId
                        email
                        firstName
                        lastName
                        phoneNumber
                        status
                        currentLocation {
                            latitude
                            longitude
                            timestamp
                        }
                        vehicle {
                            type
                            licensePlate
                            model
                            color
                        }
                        zone
                        rating
                        totalDeliveries
                        isOnline
                        createdAt
                        updatedAt
                    }
                }
            `;

            const data = await this.executeGraphQL(query, { driverId });
            return data.getDriver;
        } catch (error) {
            console.error('Error fetching driver:', error);
            throw error;
        }
    }

    /**
     * Get driver statistics
     */
    async getDriverStats(driverId, startDate, endDate) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const query = `
                query GetDriverStats($driverId: String, $startDate: AWSDateTime!, $endDate: AWSDateTime!) {
                    getDriverStats(driverId: $driverId, startDate: $startDate, endDate: $endDate) {
                        totalDeliveries
                        totalEarnings
                        averageRating
                        averageDeliveryTime
                        hoursWorked
                    }
                }
            `;

            const data = await this.executeGraphQL(query, {
                driverId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            return data.getDriverStats;
        } catch (error) {
            console.error('Error fetching driver stats:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time driver status changes
     */
    subscribeToDriverStatusChanges(zone, callback) {
        if (!this.isInitialized) {
            console.warn('Driver API not initialized');
            return null;
        }

        try {
            const subscription = `
                subscription OnDriverStatusChanged($zone: String) {
                    onDriverStatusChanged(zone: $zone) {
                        driverId
                        firstName
                        lastName
                        status
                        isOnline
                        zone
                        updatedAt
                    }
                }
            `;

            // This would typically use AWS AppSync client for real-time subscriptions
            // For now, we'll simulate with polling
            const intervalId = setInterval(async () => {
                try {
                    const drivers = await this.getDrivers({ zone });
                    callback(drivers);
                } catch (error) {
                    console.error('Error in driver subscription:', error);
                }
            }, 5000);

            return {
                unsubscribe: () => clearInterval(intervalId)
            };
        } catch (error) {
            console.error('Error setting up driver subscription:', error);
            return null;
        }
    }

    /**
     * Get driver status display name
     */
    getDriverStatusDisplayName(status, language = 'en') {
        const statusConfig = this.driverStatuses[status?.toLowerCase()] || this.driverStatuses.offline;
        return statusConfig[language] || statusConfig.en;
    }

    /**
     * Get driver status color
     */
    getDriverStatusColor(status) {
        const statusConfig = this.driverStatuses[status?.toLowerCase()] || this.driverStatuses.offline;
        return statusConfig.color;
    }

    /**
     * Get vehicle type display name
     */
    getVehicleTypeDisplayName(type, language = 'en') {
        const typeConfig = this.vehicleTypes[type?.toLowerCase()] || this.vehicleTypes.car;
        return typeConfig[language] || typeConfig.en;
    }

    /**
     * Get vehicle type icon
     */
    getVehicleTypeIcon(type) {
        const typeConfig = this.vehicleTypes[type?.toLowerCase()] || this.vehicleTypes.car;
        return typeConfig.icon;
    }

    // Mock methods for testing
    getMockDrivers(filters = {}) {
        const mockDrivers = [
            {
                driverId: 'driver1',
                email: 'ahmed.hassan@example.com',
                firstName: 'Ahmed',
                lastName: 'Hassan',
                phoneNumber: '+966501234567',
                status: 'AVAILABLE',
                currentLocation: { latitude: 24.7136, longitude: 46.6753, timestamp: new Date().toISOString() },
                vehicle: { type: 'MOTORCYCLE', licensePlate: 'ABC-123', model: 'Honda', color: 'Red' },
                zone: 'central',
                rating: 4.8,
                totalDeliveries: 245,
                isOnline: true,
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: new Date().toISOString()
            },
            {
                driverId: 'driver2',
                email: 'sara.mohammed@example.com',
                firstName: 'Sara',
                lastName: 'Mohammed',
                phoneNumber: '+966507654321',
                status: 'BUSY',
                currentLocation: { latitude: 24.7236, longitude: 46.6853, timestamp: new Date().toISOString() },
                vehicle: { type: 'CAR', licensePlate: 'XYZ-789', model: 'Toyota', color: 'Blue' },
                zone: 'north',
                rating: 4.9,
                totalDeliveries: 189,
                isOnline: true,
                createdAt: '2024-02-20T14:30:00Z',
                updatedAt: new Date().toISOString()
            }
        ];

        let filteredDrivers = mockDrivers;

        if (filters.status) {
            filteredDrivers = filteredDrivers.filter(d => d.status.toLowerCase() === filters.status.toLowerCase());
        }

        if (filters.zone) {
            filteredDrivers = filteredDrivers.filter(d => d.zone === filters.zone);
        }

        return { drivers: filteredDrivers, nextToken: null };
    }

    createMockDriver(driverData) {
        return {
            success: true,
            message: 'Driver created successfully',
            driver: {
                driverId: 'driver' + Date.now(),
                email: driverData.email,
                firstName: driverData.firstName,
                lastName: driverData.lastName,
                phoneNumber: driverData.phoneNumber,
                status: 'PENDING',
                vehicle: {
                    type: driverData.vehicleType.toUpperCase(),
                    licensePlate: driverData.licensePlate,
                    model: driverData.vehicleModel || 'Unknown',
                    color: driverData.vehicleColor || 'Unknown'
                },
                zone: driverData.zone || 'central',
                createdAt: new Date().toISOString()
            }
        };
    }

    updateMockDriverStatus(driverId, status) {
        return {
            driverId,
            status: status.toUpperCase(),
            firstName: 'Mock',
            lastName: 'Driver',
            updatedAt: new Date().toISOString()
        };
    }

    getMockDriverById(driverId) {
        return {
            driverId,
            email: 'mock.driver@example.com',
            firstName: 'Mock',
            lastName: 'Driver',
            phoneNumber: '+966501234567',
            status: 'AVAILABLE',
            currentLocation: { latitude: 24.7136, longitude: 46.6753, timestamp: new Date().toISOString() },
            vehicle: { type: 'MOTORCYCLE', licensePlate: 'ABC-123', model: 'Honda', color: 'Red' },
            zone: 'central',
            rating: 4.8,
            totalDeliveries: 245,
            isOnline: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: new Date().toISOString()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DriverAPI;
} else {
    window.DriverAPI = DriverAPI;
}
