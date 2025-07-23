/**
 * Order Management API Utility
 * Handles order processing, merchant notifications, and driver dispatch
 * Core functionality for the centralized delivery management platform
 */

// Add Amplify imports & configuration
import Amplify, { Auth, API, graphqlOperation } from 'aws-amplify';
import awsExports from '../aws-exports';
Amplify.configure(awsExports);

class OrderAPI {
    constructor() {
        this.baseURL = 'https://YOUR_API_GATEWAY_URL/dev';
        this.mockMode = false;
        this.isInitialized = false;
        this.awsCredentials = null;
        
        // Order status configurations
        this.orderStatuses = {
            pending: { ar: 'في الانتظار', en: 'Pending', color: 'warning' },
            confirmed: { ar: 'مؤكد', en: 'Confirmed', color: 'info' },
            preparing: { ar: 'قيد التحضير', en: 'Preparing', color: 'primary' },
            ready: { ar: 'جاهز للاستلام', en: 'Ready for Pickup', color: 'success' },
            assigned: { ar: 'مخصص لسائق', en: 'Assigned to Driver', color: 'info' },
            picked_up: { ar: 'تم الاستلام', en: 'Picked Up', color: 'primary' },
            on_way: { ar: 'في الطريق', en: 'On the Way', color: 'primary' },
            delivered: { ar: 'تم التسليم', en: 'Delivered', color: 'success' },
            cancelled: { ar: 'ملغي', en: 'Cancelled', color: 'danger' },
            refunded: { ar: 'مسترد', en: 'Refunded', color: 'secondary' }
        };

        // Payment methods
        this.paymentMethods = {
            cash: { ar: 'نقداً', en: 'Cash on Delivery' },
            card: { ar: 'بطاقة ائتمانية', en: 'Credit Card' },
            wallet: { ar: 'محفظة رقمية', en: 'Digital Wallet' }
        };

        // Priority levels for dispatch algorithm
        this.priorityLevels = {
            urgent: { weight: 10, ar: 'عاجل', en: 'Urgent' },
            high: { weight: 8, ar: 'عالي', en: 'High' },
            normal: { weight: 5, ar: 'عادي', en: 'Normal' },
            low: { weight: 2, ar: 'منخفض', en: 'Low' }
        };
    }

    /**
     * Initialize the API with AWS configuration
     */
    async initialize() {
        try {
            await this.loadAWSConfig();
            
            try {
                this.awsCredentials = await this.getAWSCredentials();
                console.log('Order API initialized with authentication');
            } catch (authError) {
                console.log('Authentication not available, using API key mode');
                this.mockMode = false;
            }
            
            this.isInitialized = true;
            console.log('Order API initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Order API:', error);
            console.log('Falling back to mock mode');
            this.mockMode = true;
            this.isInitialized = true;
        }
    }

    /**
     * Load AWS configuration
     */
    async loadAWSConfig() {
        try {
            const { AWS_CONFIG, API_ENDPOINTS } = await import('../config/aws-config.js');
            
            if (API_ENDPOINTS && API_ENDPOINTS.orders) {
                this.baseURL = API_ENDPOINTS.orders.replace('/orders', '');
                console.log('AWS configuration loaded:', this.baseURL);
            }
        } catch (error) {
            console.warn('AWS config not found, using mock mode');
            this.mockMode = true;
        }
    }

    /**
     * Get AWS credentials via Amplify Auth
     */
    async getAWSCredentials() {
        const session = await Auth.currentSession();
        return Auth.essentialCredentials(await Auth.currentCredentials());
    }

    /**
     * Create new order from customer app
     */
    async createOrder(orderData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.mockCreateOrder(orderData);
        }

        try {
            const mutation = `
                mutation CreateOrder($input: CreateOrderInput!) {
                    createOrder(input: $input) {
                        orderId
                        customerId
                        merchantId
                        items {
                            itemId
                            name
                            price
                            quantity
                        }
                        totalAmount
                        deliveryAddress {
                            street
                            city
                            district
                            coordinates {
                                latitude
                                longitude
                            }
                        }
                        status
                        paymentMethod
                        createdAt
                        estimatedDeliveryTime
                    }
                }
            `;

            const input = {
                customerId: orderData.customerId,
                merchantId: orderData.merchantId,
                items: orderData.items,
                totalAmount: orderData.totalAmount,
                deliveryFee: orderData.deliveryFee || 0,
                deliveryAddress: orderData.deliveryAddress,
                paymentMethod: orderData.paymentMethod,
                notes: orderData.notes || '',
                priority: orderData.priority || 'normal'
            };

            const data = await this.executeGraphQL(mutation, { input });
            
            // Automatically notify merchant about new order
            await this.notifyMerchant(data.createOrder.orderId, data.createOrder.merchantId);
            
            return data.createOrder;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    /**
     * Notify merchant about new order
     */
    async notifyMerchant(orderId, merchantId) {
        try {
            const notification = {
                type: 'NEW_ORDER',
                orderId: orderId,
                merchantId: merchantId,
                message: 'New order received',
                timestamp: new Date().toISOString()
            };

            // Send real-time notification (WebSocket/SNS)
            await this.sendRealTimeNotification('merchant', merchantId, notification);
            
            // Also send push notification if configured
            await this.sendPushNotification(merchantId, 'merchant', {
                title: 'New Order Received',
                body: `Order #${orderId} is waiting for confirmation`,
                data: { orderId, type: 'new_order' }
            });

            console.log(`Merchant ${merchantId} notified about order ${orderId}`);
        } catch (error) {
            console.error('Error notifying merchant:', error);
        }
    }

    /**
     * Merchant confirms/rejects order
     */
    async updateOrderStatus(orderId, status, estimatedPrepTime = null, rejectionReason = null) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.mockUpdateOrderStatus(orderId, status, estimatedPrepTime);
        }

        try {
            const mutation = `
                mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!, $estimatedPrepTime: Int, $rejectionReason: String) {
                    updateOrderStatus(orderId: $orderId, status: $status, estimatedPrepTime: $estimatedPrepTime, rejectionReason: $rejectionReason) {
                        orderId
                        status
                        estimatedPrepTime
                        updatedAt
                    }
                }
            `;

            const data = await this.executeGraphQL(mutation, {
                orderId,
                status: status.toUpperCase(),
                estimatedPrepTime,
                rejectionReason
            });

            // If order is confirmed, start looking for drivers
            if (status === 'confirmed') {
                // Start driver dispatch process
                setTimeout(() => this.initiateDriverDispatch(orderId), 2000);
            }

            // Notify customer about status change
            await this.notifyCustomer(orderId, status);

            return data.updateOrderStatus;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    /**
     * Initiate driver dispatch using optimized algorithm
     */
    async initiateDriverDispatch(orderId) {
        try {
            const order = await this.getOrderById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            // Find optimal driver using dispatch algorithm
            const optimalDriver = await this.findOptimalDriver(order);
            
            if (optimalDriver) {
                await this.assignDriverToOrder(orderId, optimalDriver.driverId);
                console.log(`Order ${orderId} assigned to driver ${optimalDriver.driverId}`);
            } else {
                console.log(`No available drivers found for order ${orderId}`);
                // Add to dispatch queue for retry
                await this.addToDispatchQueue(orderId);
            }
        } catch (error) {
            console.error('Error in driver dispatch:', error);
        }
    }

    /**
     * Optimized driver dispatch algorithm
     * Considers: distance, driver rating, vehicle type, current load, priority
     */
    async findOptimalDriver(order) {
        try {
            // Import driver API for getting available drivers
            const { default: DriverAPI } = await import('./driver-api.js');
            const driverAPI = new DriverAPI();
            await driverAPI.initialize();

            // Get available drivers in the merchant's zone
            const availableDrivers = await driverAPI.getAvailableDrivers(order.merchantZone);
            
            if (availableDrivers.length === 0) {
                return null;
            }

            // Calculate score for each driver
            const driverScores = await Promise.all(
                availableDrivers.map(driver => this.calculateDriverScore(driver, order))
            );

            // Sort by score (highest first)
            const rankedDrivers = availableDrivers
                .map((driver, index) => ({
                    ...driver,
                    score: driverScores[index]
                }))
                .sort((a, b) => b.score - a.score);

            console.log('Driver ranking for order', order.orderId, rankedDrivers);

            return rankedDrivers[0];
        } catch (error) {
            console.error('Error finding optimal driver:', error);
            return null;
        }
    }

    /**
     * Calculate driver score based on multiple factors
     */
    async calculateDriverScore(driver, order) {
        let score = 0;

        // 1. Distance factor (40% weight) - closer is better
        const distance = this.calculateDistance(
            driver.currentLocation,
            order.merchantLocation
        );
        const distanceScore = Math.max(0, 10 - (distance / 1000)); // 10 points max, reduces by 1 per km
        score += distanceScore * 0.4;

        // 2. Driver rating factor (25% weight)
        const ratingScore = (driver.rating || 4.0) * 2; // Convert 5-star to 10-point scale
        score += ratingScore * 0.25;

        // 3. Vehicle type matching factor (15% weight)
        const vehicleScore = this.getVehicleMatchScore(driver.vehicle.type, order);
        score += vehicleScore * 0.15;

        // 4. Driver efficiency factor (10% weight) - based on total deliveries
        const efficiencyScore = Math.min(10, (driver.totalDeliveries || 0) / 50);
        score += efficiencyScore * 0.1;

        // 5. Order priority factor (10% weight)
        const priorityWeight = this.priorityLevels[order.priority || 'normal'].weight;
        const priorityScore = priorityWeight / 10 * 10; // Normalize to 10-point scale
        score += priorityScore * 0.1;

        return Math.round(score * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(coord1, coord2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = coord1.latitude * Math.PI / 180;
        const φ2 = coord2.latitude * Math.PI / 180;
        const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
        const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Get vehicle type matching score for order
     */
    getVehicleMatchScore(vehicleType, order) {
        const orderValue = order.totalAmount || 0;
        const itemCount = order.items ? order.items.length : 1;

        // Vehicle type scoring based on order characteristics
        const vehicleScores = {
            'MOTORCYCLE': {
                base: 8,
                maxValue: 200,
                maxItems: 3
            },
            'CAR': {
                base: 7,
                maxValue: 1000,
                maxItems: 10
            },
            'BICYCLE': {
                base: 6,
                maxValue: 100,
                maxItems: 2
            },
            'TRUCK': {
                base: 5,
                maxValue: 5000,
                maxItems: 50
            }
        };

        const config = vehicleScores[vehicleType] || { base: 5, maxValue: 500, maxItems: 5 };
        
        // Reduce score if order exceeds vehicle capacity
        let score = config.base;
        if (orderValue > config.maxValue) score -= 2;
        if (itemCount > config.maxItems) score -= 2;

        return Math.max(0, score);
    }

    /**
     * Assign driver to order
     */
    async assignDriverToOrder(orderId, driverId) {
        try {
            const mutation = `
                mutation AssignDriver($orderId: ID!, $driverId: ID!) {
                    assignDriverToOrder(orderId: $orderId, driverId: $driverId) {
                        orderId
                        driverId
                        assignedAt
                        estimatedPickupTime
                        estimatedDeliveryTime
                    }
                }
            `;

            const data = await this.executeGraphQL(mutation, { orderId, driverId });

            // Update order status to assigned
            await this.updateOrderStatus(orderId, 'assigned');

            // Notify driver about assignment
            await this.notifyDriver(driverId, orderId);

            // Notify customer about driver assignment
            await this.notifyCustomer(orderId, 'assigned', { driverId });

            return data.assignDriverToOrder;
        } catch (error) {
            console.error('Error assigning driver to order:', error);
            throw error;
        }
    }

    /**
     * Notify driver about order assignment
     */
    async notifyDriver(driverId, orderId) {
        try {
            const notification = {
                type: 'ORDER_ASSIGNED',
                orderId: orderId,
                driverId: driverId,
                message: 'New delivery assigned',
                timestamp: new Date().toISOString()
            };

            await this.sendRealTimeNotification('driver', driverId, notification);
            
            await this.sendPushNotification(driverId, 'driver', {
                title: 'New Delivery Assignment',
                body: `Order #${orderId} has been assigned to you`,
                data: { orderId, type: 'order_assigned' }
            });

            console.log(`Driver ${driverId} notified about order ${orderId}`);
        } catch (error) {
            console.error('Error notifying driver:', error);
        }
    }

    /**
     * Notify customer about order updates
     */
    async notifyCustomer(orderId, status, additionalData = {}) {
        try {
            const notification = {
                type: 'ORDER_UPDATE',
                orderId: orderId,
                status: status,
                message: this.getStatusMessage(status),
                timestamp: new Date().toISOString(),
                ...additionalData
            };

            // Get order to find customer ID
            const order = await this.getOrderById(orderId);
            if (order && order.customerId) {
                await this.sendRealTimeNotification('customer', order.customerId, notification);
                
                await this.sendPushNotification(order.customerId, 'customer', {
                    title: `Order #${orderId} Update`,
                    body: this.getStatusMessage(status),
                    data: { orderId, status, type: 'order_update' }
                });
            }

            console.log(`Customer notified about order ${orderId} status: ${status}`);
        } catch (error) {
            console.error('Error notifying customer:', error);
        }
    }

    /**
     * Get user-friendly status message
     */
    getStatusMessage(status) {
        const messages = {
            pending: 'Your order is being processed',
            confirmed: 'Your order has been confirmed by the merchant',
            preparing: 'Your order is being prepared',
            ready: 'Your order is ready for pickup',
            assigned: 'A driver has been assigned to your order',
            picked_up: 'Your order has been picked up',
            on_way: 'Your order is on the way',
            delivered: 'Your order has been delivered',
            cancelled: 'Your order has been cancelled'
        };
        return messages[status] || `Order status updated to ${status}`;
    }

    /**
     * Get order by ID
     */
    async getOrderById(orderId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.getMockOrderById(orderId);
        }

        try {
            const query = `
                query GetOrder($orderId: ID!) {
                    getOrder(orderId: $orderId) {
                        orderId
                        customerId
                        merchantId
                        driverId
                        items {
                            itemId
                            name
                            price
                            quantity
                        }
                        totalAmount
                        deliveryFee
                        deliveryAddress {
                            street
                            city
                            district
                            coordinates {
                                latitude
                                longitude
                            }
                        }
                        merchantLocation {
                            latitude
                            longitude
                        }
                        status
                        paymentMethod
                        priority
                        createdAt
                        estimatedDeliveryTime
                        actualDeliveryTime
                    }
                }
            `;

            const data = await this.executeGraphQL(query, { orderId });
            return data.getOrder;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    }

    /**
     * Get orders with filtering and pagination
     */
    async getOrders(filters = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.mockMode) {
            return this.getMockOrders(filters);
        }

        try {
            const query = `
                query GetOrders($status: OrderStatus, $merchantId: ID, $driverId: ID, $limit: Int, $nextToken: String) {
                    getOrders(status: $status, merchantId: $merchantId, driverId: $driverId, limit: $limit, nextToken: $nextToken) {
                        items {
                            orderId
                            customerId
                            merchantId
                            driverId
                            totalAmount
                            status
                            createdAt
                            estimatedDeliveryTime
                        }
                        nextToken
                    }
                }
            `;

            const data = await this.executeGraphQL(query, filters);
            return data.getOrders;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }

    /**
     * Add order to dispatch queue for retry
     */
    async addToDispatchQueue(orderId) {
        // Implementation for adding to retry queue
        console.log(`Adding order ${orderId} to dispatch queue for retry`);
        
        // Schedule retry after 5 minutes
        setTimeout(() => {
            this.initiateDriverDispatch(orderId);
        }, 5 * 60 * 1000);
    }

    /**
     * Send real-time notification via WebSocket/SNS
     */
    async sendRealTimeNotification(userType, userId, notification) {
        // Implementation for real-time notifications
        console.log(`Sending real-time notification to ${userType} ${userId}:`, notification);
        
        // This would typically use AWS SNS, WebSocket connections, or similar
        // For now, we'll simulate with local storage for demo
        const key = `notifications_${userType}_${userId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.unshift(notification);
        localStorage.setItem(key, JSON.stringify(existing.slice(0, 50))); // Keep last 50
    }

    /**
     * Send push notification
     */
    async sendPushNotification(userId, userType, payload) {
        // Implementation for push notifications
        console.log(`Sending push notification to ${userType} ${userId}:`, payload);
        
        // This would typically use AWS SNS, FCM, or similar service
        // For demo purposes, we'll use browser notifications if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(payload.title, {
                body: payload.body,
                icon: '/assets/icon-192x192.png',
                badge: '/assets/badge-72x72.png',
                data: payload.data
            });
        }
    }

    /**
     * Execute GraphQL query/mutation
     */
    async executeGraphQL(query, variables = {}) {
        try {
            const data = await API.graphql(graphqlOperation(query, variables));
            return data.data;
        } catch (error) {
            console.error('GraphQL error:', error);
            throw error;
        }
    }

    // Mock methods for development/testing
    mockCreateOrder(orderData) {
        const orderId = 'order_' + Date.now();
        const mockOrder = {
            orderId,
            customerId: orderData.customerId,
            merchantId: orderData.merchantId,
            items: orderData.items || [],
            totalAmount: orderData.totalAmount || 0,
            deliveryFee: orderData.deliveryFee || 10,
            deliveryAddress: orderData.deliveryAddress,
            status: 'pending',
            paymentMethod: orderData.paymentMethod || 'cash',
            priority: orderData.priority || 'normal',
            createdAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString() // 45 minutes
        };

        console.log('Mock: Created order', mockOrder);
        
        // Simulate merchant notification
        setTimeout(() => {
            console.log(`Mock: Notified merchant ${orderData.merchantId} about order ${orderId}`);
        }, 1000);

        return mockOrder;
    }

    mockUpdateOrderStatus(orderId, status, estimatedPrepTime) {
        console.log(`Mock: Updated order ${orderId} status to ${status}`);
        
        if (status === 'confirmed') {
            // Simulate driver dispatch
            setTimeout(() => {
                console.log(`Mock: Initiating driver dispatch for order ${orderId}`);
                this.mockAssignDriver(orderId);
            }, 3000);
        }

        return {
            orderId,
            status,
            estimatedPrepTime,
            updatedAt: new Date().toISOString()
        };
    }

    mockAssignDriver(orderId) {
        const driverId = 'driver_' + Math.floor(Math.random() * 100);
        console.log(`Mock: Assigned driver ${driverId} to order ${orderId}`);
        
        return {
            orderId,
            driverId,
            assignedAt: new Date().toISOString(),
            estimatedPickupTime: new Date(Date.now() + 15 * 60000).toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString()
        };
    }

    getMockOrderById(orderId) {
        return {
            orderId,
            customerId: 'customer_123',
            merchantId: 'merchant_456',
            driverId: 'driver_789',
            items: [
                { itemId: 'item1', name: 'Pizza Margherita', price: 45, quantity: 1 },
                { itemId: 'item2', name: 'Coca Cola', price: 8, quantity: 2 }
            ],
            totalAmount: 61,
            deliveryFee: 10,
            deliveryAddress: {
                street: '123 Main St',
                city: 'Riyadh',
                district: 'Al-Malaz',
                coordinates: { latitude: 24.7136, longitude: 46.6753 }
            },
            merchantLocation: { latitude: 24.7236, longitude: 46.6853 },
            status: 'preparing',
            paymentMethod: 'cash',
            priority: 'normal',
            createdAt: new Date().toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString()
        };
    }

    getMockOrders(filters = {}) {
        const mockOrders = [
            {
                orderId: 'order_001',
                customerId: 'customer_123',
                merchantId: 'merchant_456',
                driverId: 'driver_789',
                totalAmount: 75,
                status: 'on_way',
                createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
                estimatedDeliveryTime: new Date(Date.now() + 15 * 60000).toISOString()
            },
            {
                orderId: 'order_002',
                customerId: 'customer_124',
                merchantId: 'merchant_457',
                totalAmount: 45,
                status: 'preparing',
                createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
                estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString()
            }
        ];

        let filteredOrders = mockOrders;

        if (filters.status) {
            filteredOrders = filteredOrders.filter(o => o.status === filters.status);
        }

        if (filters.merchantId) {
            filteredOrders = filteredOrders.filter(o => o.merchantId === filters.merchantId);
        }

        if (filters.driverId) {
            filteredOrders = filteredOrders.filter(o => o.driverId === filters.driverId);
        }

        return {
            items: filteredOrders,
            nextToken: null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderAPI;
} else {
    window.OrderAPI = OrderAPI;
}
