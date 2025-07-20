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

// Mock authentication endpoint for login testing
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
