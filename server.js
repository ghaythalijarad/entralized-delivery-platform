#!/usr/bin/env node

/**
 * Node.js 22 Development Server for Centralized Platform
 * Replaces Python FastAPI backend with Node.js Express server
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression and logging
app.use(compression());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('.', {
    index: ['login-aws-native.html', 'index.html'],
    setHeaders: (res, path) => {
        // Set proper MIME types
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
        
        // Disable caching for development
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// API Routes for mock data during development
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        node_version: process.version
    });
});

// Mock driver data endpoint
app.get('/api/drivers', (req, res) => {
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
    
    res.json({ drivers: mockDrivers, total: mockDrivers.length });
});

// Mock merchant data endpoint
app.get('/api/merchants', (req, res) => {
    const mockMerchants = [
        {
            merchantId: 'merchant1',
            businessName: 'Pizza Palace',
            email: 'contact@pizzapalace.com',
            phoneNumber: '+966501234567',
            status: 'ACTIVE',
            address: {
                street: 'King Fahd Road',
                city: 'Riyadh',
                postalCode: '12345',
                coordinates: { latitude: 24.7136, longitude: 46.6753 }
            },
            rating: 4.5,
            totalOrders: 1250,
            createdAt: '2024-01-10T08:00:00Z',
            updatedAt: new Date().toISOString()
        }
    ];
    
    res.json({ merchants: mockMerchants, total: mockMerchants.length });
});

// Mock dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        totalDeliveries: 1425,
        activeDrivers: 23,
        activeMerchants: 45,
        totalRevenue: 125000.50,
        recentActivities: [
            { type: 'delivery', message: 'Order #1234 delivered successfully', timestamp: new Date().toISOString() },
            { type: 'driver', message: 'New driver Ahmed registered', timestamp: new Date().toISOString() },
            { type: 'merchant', message: 'Pizza Palace updated menu', timestamp: new Date().toISOString() }
        ]
    });
});

// Mock authentication endpoint for login testing (enabled only in development)
if (process.env.NODE_ENV === 'development') {
  app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    // Replace with your test credentials
    if (username === 'g87_a@yahoo.com' && password === 'Password123!') {
      const token = 'mock-access-token-' + Date.now();
      const user = { email: username, firstName: 'Test', lastName: 'User' };
      return res.json({ success: true, token: { access_token: token, user } });
    }
    res.status(401).json({ success: false, detail: 'Invalid credentials' });
  });
}

// Serve main application pages
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'login-aws-native.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(join(__dirname, 'src/pages/dashboard-aws-native.html'));
});

app.get('/drivers', (req, res) => {
    res.sendFile(join(__dirname, 'src/pages/drivers-management-dashboard-style.html'));
});

app.get('/merchants', (req, res) => {
    res.sendFile(join(__dirname, 'src/pages/merchant-management.html'));
});

// Mock order data endpoint
app.get('/api/orders', (req, res) => {
    const { status, merchantId, driverId } = req.query;
    
    let mockOrders = [
        {
            orderId: 'ORD001',
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
                street: '123 King Fahd Road',
                city: 'Riyadh',
                district: 'Al-Malaz',
                coordinates: { latitude: 24.7136, longitude: 46.6753 }
            },
            merchantLocation: { latitude: 24.7236, longitude: 46.6853 },
            status: 'on_way',
            paymentMethod: 'cash',
            priority: 'normal',
            createdAt: '2024-12-15T14:30:00Z',
            estimatedDeliveryTime: new Date(Date.now() + 15 * 60000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            orderId: 'ORD002',
            customerId: 'customer_124',
            merchantId: 'merchant_457',
            driverId: null,
            items: [
                { itemId: 'item3', name: 'Chicken Shawarma', price: 25, quantity: 2 },
                { itemId: 'item4', name: 'French Fries', price: 12, quantity: 1 }
            ],
            totalAmount: 62,
            deliveryFee: 8,
            deliveryAddress: {
                street: '456 Olaya Street',
                city: 'Riyadh',
                district: 'Olaya',
                coordinates: { latitude: 24.6936, longitude: 46.6853 }
            },
            merchantLocation: { latitude: 24.7036, longitude: 46.6753 },
            status: 'preparing',
            paymentMethod: 'card',
            priority: 'high',
            createdAt: '2024-12-15T15:45:00Z',
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            orderId: 'ORD003',
            customerId: 'customer_125',
            merchantId: 'merchant_458',
            driverId: 'driver_790',
            items: [
                { itemId: 'item5', name: 'Burger Combo', price: 35, quantity: 1 },
                { itemId: 'item6', name: 'Milkshake', price: 15, quantity: 1 }
            ],
            totalAmount: 50,
            deliveryFee: 12,
            deliveryAddress: {
                street: '789 Prince Mohammed Road',
                city: 'Riyadh',
                district: 'Al-Sulaimaniah',
                coordinates: { latitude: 24.7336, longitude: 46.6653 }
            },
            merchantLocation: { latitude: 24.7436, longitude: 46.6553 },
            status: 'delivered',
            paymentMethod: 'wallet',
            priority: 'normal',
            createdAt: '2024-12-15T13:20:00Z',
            estimatedDeliveryTime: '2024-12-15T14:05:00Z',
            actualDeliveryTime: '2024-12-15T14:03:00Z',
            updatedAt: '2024-12-15T14:03:00Z'
        },
        {
            orderId: 'ORD004',
            customerId: 'customer_126',
            merchantId: 'merchant_459',
            driverId: null,
            items: [
                { itemId: 'item7', name: 'Sushi Set', price: 85, quantity: 1 }
            ],
            totalAmount: 85,
            deliveryFee: 15,
            deliveryAddress: {
                street: '321 Abdullah Al-Suleman Road',
                city: 'Riyadh',
                district: 'Al-Malqa',
                coordinates: { latitude: 24.7636, longitude: 46.6253 }
            },
            merchantLocation: { latitude: 24.7536, longitude: 46.6353 },
            status: 'pending',
            paymentMethod: 'card',
            priority: 'urgent',
            createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 40 * 60000).toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    // Apply filters
    if (status) {
        mockOrders = mockOrders.filter(order => order.status === status);
    }
    if (merchantId) {
        mockOrders = mockOrders.filter(order => order.merchantId === merchantId);
    }
    if (driverId) {
        mockOrders = mockOrders.filter(order => order.driverId === driverId);
    }

    res.json({ 
        items: mockOrders, 
        total: mockOrders.length,
        nextToken: null 
    });
});

// Create new order endpoint
app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    const orderId = 'ORD' + Date.now();
    
    const newOrder = {
        orderId,
        customerId: orderData.customerId,
        merchantId: orderData.merchantId,
        items: orderData.items || [],
        totalAmount: orderData.totalAmount || 0,
        deliveryFee: orderData.deliveryFee || 10,
        deliveryAddress: orderData.deliveryAddress,
        merchantLocation: orderData.merchantLocation || { latitude: 24.7236, longitude: 46.6853 },
        status: 'pending',
        paymentMethod: orderData.paymentMethod || 'cash',
        priority: orderData.priority || 'normal',
        notes: orderData.notes || '',
        createdAt: new Date().toISOString(),
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString(),
        updatedAt: new Date().toISOString()
    };

    console.log('Created new order:', newOrder);
    
    // Simulate merchant notification
    setTimeout(() => {
        console.log(`Notified merchant ${orderData.merchantId} about order ${orderId}`);
    }, 1000);

    res.json({ 
        success: true, 
        order: newOrder,
        message: 'Order created successfully'
    });
});

// Update order status endpoint
app.put('/api/orders/:orderId/status', (req, res) => {
    const { orderId } = req.params;
    const { status, estimatedPrepTime, rejectionReason } = req.body;
    
    console.log(`Updating order ${orderId} status to ${status}`);
    
    // Simulate status update
    const updatedOrder = {
        orderId,
        status,
        estimatedPrepTime,
        rejectionReason,
        updatedAt: new Date().toISOString()
    };

    // Simulate driver dispatch for confirmed orders
    if (status === 'confirmed') {
        setTimeout(() => {
            console.log(`Initiating driver dispatch for order ${orderId}`);
            // This would trigger the dispatch algorithm
        }, 2000);
    }

    res.json({
        success: true,
        order: updatedOrder,
        message: `Order status updated to ${status}`
    });
});

// Assign driver to order endpoint
app.post('/api/orders/:orderId/assign-driver', (req, res) => {
    const { orderId } = req.params;
    const { driverId } = req.body;
    
    console.log(`Assigning driver ${driverId} to order ${orderId}`);
    
    const assignment = {
        orderId,
        driverId,
        assignedAt: new Date().toISOString(),
        estimatedPickupTime: new Date(Date.now() + 15 * 60000).toISOString(),
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString()
    };

    // Simulate notifications
    setTimeout(() => {
        console.log(`Notified driver ${driverId} about order assignment ${orderId}`);
        console.log(`Notified customer about driver assignment for order ${orderId}`);
    }, 500);

    res.json({
        success: true,
        assignment,
        message: 'Driver assigned successfully'
    });
});

// Get order by ID endpoint
app.get('/api/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    
    // Mock order details
    const orderDetail = {
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
            street: '123 King Fahd Road',
            city: 'Riyadh',
            district: 'Al-Malaz',
            coordinates: { latitude: 24.7136, longitude: 46.6753 }
        },
        merchantLocation: { latitude: 24.7236, longitude: 46.6853 },
        status: 'preparing',
        paymentMethod: 'cash',
        priority: 'normal',
        notes: 'Ring the bell twice',
        createdAt: new Date().toISOString(),
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
            { status: 'pending', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), completed: true },
            { status: 'confirmed', timestamp: new Date(Date.now() - 8 * 60000).toISOString(), completed: true },
            { status: 'preparing', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), completed: true, active: true },
            { status: 'ready', timestamp: null, completed: false },
            { status: 'assigned', timestamp: null, completed: false },
            { status: 'picked_up', timestamp: null, completed: false },
            { status: 'on_way', timestamp: null, completed: false },
            { status: 'delivered', timestamp: null, completed: false }
        ]
    };

    res.json(orderDetail);
});

// Order analytics endpoint
app.get('/api/orders/analytics/overview', (req, res) => {
    const analytics = {
        totalOrders: 1547,
        pendingOrders: 23,
        activeDeliveries: 45,
        completedToday: 287,
        averageDeliveryTime: 35,
        successRate: 98.5,
        topPerformingZones: [
            { zone: 'central', orders: 156, avgTime: 28 },
            { zone: 'north', orders: 98, avgTime: 32 },
            { zone: 'east', orders: 87, avgTime: 38 }
        ],
        hourlyStats: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            orders: Math.floor(Math.random() * 50) + 10,
            avgDeliveryTime: Math.floor(Math.random() * 20) + 25
        }))
    };

    res.json(analytics);
});

// Dispatch optimization endpoint
app.post('/api/dispatch/optimize', (req, res) => {
    const { orderId, algorithm } = req.body;
    
    console.log(`Running dispatch optimization for order ${orderId} using ${algorithm} algorithm`);
    
    // Mock optimization result
    const optimizationResult = {
        orderId,
        algorithm,
        recommendedDriver: {
            driverId: 'driver_' + Math.floor(Math.random() * 1000),
            score: Math.round((Math.random() * 3 + 7) * 100) / 100, // Score between 7-10
            distance: Math.floor(Math.random() * 5000) + 500, // 500m - 5.5km
            estimatedPickupTime: new Date(Date.now() + 10 * 60000).toISOString(),
            estimatedDeliveryTime: new Date(Date.now() + 35 * 60000).toISOString()
        },
        alternativeDrivers: [
            {
                driverId: 'driver_' + Math.floor(Math.random() * 1000),
                score: Math.round((Math.random() * 2 + 6) * 100) / 100,
                distance: Math.floor(Math.random() * 3000) + 1000
            },
            {
                driverId: 'driver_' + Math.floor(Math.random() * 1000),
                score: Math.round((Math.random() * 2 + 5) * 100) / 100,
                distance: Math.floor(Math.random() * 4000) + 1500
            }
        ],
        optimizationTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        timestamp: new Date().toISOString()
    };

    res.json({
        success: true,
        result: optimizationResult,
        message: 'Dispatch optimization completed'
    });
});

// Handle SPA routing - catch all other routes and serve index.html
app.get('*', (req, res) => {
    // Check if it's an API route that doesn't exist
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For other routes, try to serve the file or fallback to login
    const filePath = join(__dirname, req.path);
    fs.access(filePath)
        .then(() => res.sendFile(filePath))
        .catch(() => res.sendFile(join(__dirname, 'login-aws-native.html')));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Centralized Platform Server started`);
    console.log(`📍 URL: http://${HOST}:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Node.js version: ${process.version}`);
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  🏠 Main App: http://${HOST}:${PORT}/`);
    console.log(`  📊 Dashboard: http://${HOST}:${PORT}/dashboard`);
    console.log(`  🚗 Drivers: http://${HOST}:${PORT}/drivers`);
    console.log(`  🏪 Merchants: http://${HOST}:${PORT}/merchants`);
    console.log(`  ⚡ Health Check: http://${HOST}:${PORT}/api/health`);
});

export default app;
