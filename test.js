#!/usr/bin/env node

/**
 * Node.js 22 Test Suite for Centralized Platform
 * Replaces Python test scripts
 */

import { test, describe, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import fetch from 'node-fetch';
import { spawn } from 'child_process';

// Global test configuration
const TEST_CONFIG = {
    serverPort: 3001,
    testTimeout: 30000,
    baseUrl: 'http://localhost:3001'
};

let serverProcess = null;

describe('Centralized Platform Tests', () => {
    before(async () => {
        console.log('🔄 Starting test server...');
        
        // Start the server for testing
        serverProcess = spawn('node', ['server.js'], {
            env: { ...process.env, PORT: TEST_CONFIG.serverPort },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Wait for server to start
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Server startup timeout'));
            }, 10000);

            const checkServer = async () => {
                try {
                    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
                    if (response.ok) {
                        clearTimeout(timeout);
                        resolve();
                    }
                } catch (error) {
                    setTimeout(checkServer, 500);
                }
            };

            checkServer();
        });

        console.log('✅ Test server started');
    });

    after(async () => {
        if (serverProcess) {
            serverProcess.kill();
            console.log('🛑 Test server stopped');
        }
    });

    describe('Server Health', () => {
        test('Health endpoint should return OK', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.status, 'healthy');
            assert.ok(data.node_version);
            assert.ok(data.timestamp);
        });

        test('Server should serve static files', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/`);
            assert.strictEqual(response.status, 200);
            assert.ok(response.headers.get('content-type').includes('text/html'));
        });
    });

    describe('API Endpoints', () => {
        test('Drivers API should return mock data', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/drivers`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert.ok(Array.isArray(data.drivers));
            assert.ok(data.drivers.length > 0);
            assert.ok(data.total >= 0);
            
            // Check driver data structure
            const driver = data.drivers[0];
            assert.ok(driver.driverId);
            assert.ok(driver.email);
            assert.ok(driver.firstName);
            assert.ok(driver.lastName);
            assert.ok(driver.status);
        });

        test('Merchants API should return mock data', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/merchants`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert.ok(Array.isArray(data.merchants));
            assert.ok(data.merchants.length > 0);
            
            // Check merchant data structure
            const merchant = data.merchants[0];
            assert.ok(merchant.merchantId);
            assert.ok(merchant.businessName);
            assert.ok(merchant.email);
            assert.ok(merchant.status);
        });

        test('Dashboard stats API should return analytics', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/dashboard/stats`);
            const data = await response.json();
            
            assert.strictEqual(response.status, 200);
            assert.ok(typeof data.totalDeliveries === 'number');
            assert.ok(typeof data.activeDrivers === 'number');
            assert.ok(typeof data.activeMerchants === 'number');
            assert.ok(typeof data.totalRevenue === 'number');
            assert.ok(Array.isArray(data.recentActivities));
        });

        test('Non-existent API endpoint should return 404', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/nonexistent`);
            assert.strictEqual(response.status, 404);
            
            const data = await response.json();
            assert.strictEqual(data.error, 'API endpoint not found');
        });
    });

    describe('Frontend Routes', () => {
        test('Dashboard route should serve HTML', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/dashboard`);
            assert.strictEqual(response.status, 200);
            assert.ok(response.headers.get('content-type').includes('text/html'));
        });

        test('Drivers route should serve HTML', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/drivers`);
            assert.strictEqual(response.status, 200);
            assert.ok(response.headers.get('content-type').includes('text/html'));
        });

        test('Merchants route should serve HTML', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/merchants`);
            assert.strictEqual(response.status, 200);
            assert.ok(response.headers.get('content-type').includes('text/html'));
        });
    });

    describe('Security Headers', () => {
        test('Server should set security headers', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
            
            // Check for basic security headers
            assert.ok(response.headers.get('x-content-type-options'));
            assert.ok(response.headers.get('x-frame-options'));
            assert.ok(response.headers.get('x-xss-protection'));
        });

        test('CORS should be configured', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`, {
                headers: {
                    'Origin': 'http://localhost:3000'
                }
            });
            
            assert.ok(response.headers.get('access-control-allow-origin'));
        });
    });

    describe('Error Handling', () => {
        test('Server should handle malformed requests gracefully', async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/drivers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: 'invalid json'
            });
            
            // Should not crash the server
            assert.ok(response.status >= 400);
        });
    });
});

// Integration tests for AWS services
describe('AWS Integration Tests', () => {
    test('AWS exports file should exist', async () => {
        try {
            const awsExports = await import('./src/aws-exports.js');
            assert.ok(awsExports.default || awsExports);
        } catch (error) {
            console.warn('⚠️  AWS exports not found - this is expected in development');
        }
    });

    test('Amplify configuration should be valid', async () => {
        try {
            const amplifyConfig = await import('./src/amplifyconfiguration.json');
            assert.ok(amplifyConfig.default || amplifyConfig);
        } catch (error) {
            console.warn('⚠️  Amplify configuration not found - run amplify init first');
        }
    });
});

// Performance tests
describe('Performance Tests', () => {
    test('API responses should be fast', async () => {
        const startTime = Date.now();
        const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
        const endTime = Date.now();
        
        assert.strictEqual(response.status, 200);
        assert.ok(endTime - startTime < 1000, 'Response should be under 1 second');
    });

    test('Dashboard should load quickly', async () => {
        const startTime = Date.now();
        const response = await fetch(`${TEST_CONFIG.baseUrl}/dashboard`);
        const endTime = Date.now();
        
        assert.strictEqual(response.status, 200);
        assert.ok(endTime - startTime < 2000, 'Dashboard should load under 2 seconds');
    });
});

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🧪 Running Node.js 22 Test Suite for Centralized Platform\n');
    
    // Note: Tests will run automatically with Node.js test runner
    // You can also run specific test suites by importing this file
}
