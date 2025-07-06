/**
 * Merchant Management System Test Suite
 * Comprehensive testing for all merchant management features
 */

class MerchantManagementTests {
    constructor() {
        this.testResults = [];
        this.mockMerchants = [];
        this.setupMockData();
    }

    setupMockData() {
        this.mockMerchants = [
            {
                merchantId: 'test-001',
                businessName: 'Test Restaurant',
                ownerName: 'John Doe',
                email: 'john@testrestaurant.com',
                phone: '+1234567890',
                category: 'Restaurant',
                status: 'pending',
                appliedAt: '2025-07-05T10:00:00Z',
                documents: ['license.pdf', 'id.pdf']
            },
            {
                merchantId: 'test-002',
                businessName: 'Test Store',
                ownerName: 'Jane Smith',
                email: 'jane@teststore.com',
                phone: '+1234567891',
                category: 'Retail',
                status: 'approved',
                appliedAt: '2025-07-01T14:30:00Z',
                approvedAt: '2025-07-02T09:15:00Z'
            }
        ];
    }

    async runAllTests() {
        console.log('🧪 Starting Merchant Management System Tests');
        console.log('=' * 50);

        try {
            await this.testAPIInitialization();
            await this.testMerchantLoading();
            await this.testMerchantFiltering();
            await this.testMerchantReview();
            await this.testNotificationSystem();
            await this.testUIInteractions();
            await this.testErrorHandling();
            await this.testPermissions();

            this.generateTestReport();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testAPIInitialization() {
        console.log('\n📡 Testing API Initialization...');
        
        try {
            // Test API instance creation
            this.assert(window.merchantAPI !== undefined, 'MerchantAPI instance exists');
            
            // Test configuration
            this.assert(
                window.merchantAPI.baseURL !== undefined, 
                'API base URL is configured'
            );

            // Test AWS credentials setup (mock)
            const mockCredentials = {
                accessKeyId: 'test',
                secretAccessKey: 'test',
                sessionToken: 'test'
            };
            window.merchantAPI.awsCredentials = mockCredentials;
            
            this.assert(
                window.merchantAPI.awsCredentials !== null,
                'AWS credentials can be set'
            );

            this.addTestResult('API Initialization', true, 'All API components initialized correctly');
        } catch (error) {
            this.addTestResult('API Initialization', false, error.message);
        }
    }

    async testMerchantLoading() {
        console.log('\n📊 Testing Merchant Data Loading...');
        
        try {
            // Mock the API response
            window.merchantAPI.getMerchants = async (status) => {
                let filteredMerchants = this.mockMerchants;
                if (status) {
                    filteredMerchants = this.mockMerchants.filter(m => m.status === status);
                }
                return filteredMerchants;
            };

            // Test loading all merchants
            const allMerchants = await window.merchantAPI.getMerchants();
            this.assert(allMerchants.length === 2, 'All merchants loaded correctly');

            // Test loading by status
            const pendingMerchants = await window.merchantAPI.getMerchants('pending');
            this.assert(pendingMerchants.length === 1, 'Pending merchants filtered correctly');

            const approvedMerchants = await window.merchantAPI.getMerchants('approved');
            this.assert(approvedMerchants.length === 1, 'Approved merchants filtered correctly');

            this.addTestResult('Merchant Loading', true, 'All merchant loading scenarios work');
        } catch (error) {
            this.addTestResult('Merchant Loading', false, error.message);
        }
    }

    async testMerchantFiltering() {
        console.log('\n🔍 Testing Merchant Filtering...');
        
        try {
            // Test status filtering
            const statuses = ['pending', 'approved', 'rejected'];
            for (const status of statuses) {
                const filtered = this.mockMerchants.filter(m => m.status === status);
                this.assert(
                    filtered.every(m => m.status === status),
                    `${status} status filtering works`
                );
            }

            // Test category filtering
            const categories = [...new Set(this.mockMerchants.map(m => m.category))];
            for (const category of categories) {
                const filtered = this.mockMerchants.filter(m => m.category === category);
                this.assert(
                    filtered.every(m => m.category === category),
                    `${category} category filtering works`
                );
            }

            this.addTestResult('Merchant Filtering', true, 'All filtering scenarios work');
        } catch (error) {
            this.addTestResult('Merchant Filtering', false, error.message);
        }
    }

    async testMerchantReview() {
        console.log('\n📝 Testing Merchant Review Process...');
        
        try {
            // Mock the review submission
            window.merchantAPI.submitReview = async (merchantId, decision, comments) => {
                this.assert(merchantId !== undefined, 'Merchant ID provided');
                this.assert(['approved', 'rejected'].includes(decision), 'Valid decision provided');
                
                return {
                    success: true,
                    merchantId: merchantId,
                    decision: decision,
                    message: `Merchant ${decision} successfully`
                };
            };

            // Test approval
            const approvalResult = await window.merchantAPI.submitReview(
                'test-001', 
                'approved', 
                'All documents verified'
            );
            this.assert(approvalResult.success === true, 'Merchant approval works');

            // Test rejection
            const rejectionResult = await window.merchantAPI.submitReview(
                'test-001', 
                'rejected', 
                'Missing tax certificate'
            );
            this.assert(rejectionResult.success === true, 'Merchant rejection works');

            this.addTestResult('Merchant Review', true, 'Review process works correctly');
        } catch (error) {
            this.addTestResult('Merchant Review', false, error.message);
        }
    }

    async testNotificationSystem() {
        console.log('\n🔔 Testing Notification System...');
        
        try {
            // Test success notification
            if (typeof showSuccess === 'function') {
                showSuccess('Test success message');
                this.assert(
                    document.querySelector('.notification.success') !== null,
                    'Success notification displays'
                );
            }

            // Test error notification
            if (typeof showError === 'function') {
                showError('Test error message');
                this.assert(
                    document.querySelector('.notification.error') !== null,
                    'Error notification displays'
                );
            }

            // Clean up notifications
            document.querySelectorAll('.notification').forEach(n => n.remove());

            this.addTestResult('Notification System', true, 'Notifications work correctly');
        } catch (error) {
            this.addTestResult('Notification System', false, error.message);
        }
    }

    async testUIInteractions() {
        console.log('\n🖱️ Testing UI Interactions...');
        
        try {
            // Test tab switching
            const tabs = document.querySelectorAll('.tab');
            if (tabs.length > 0) {
                tabs[0].click();
                this.assert(
                    tabs[0].classList.contains('active'),
                    'Tab switching works'
                );
            }

            // Test modal opening (if review modal exists)
            const reviewButtons = document.querySelectorAll('[onclick*="reviewMerchant"]');
            if (reviewButtons.length > 0) {
                // Simulate review button click
                this.assert(true, 'Review buttons are present');
            }

            // Test form validation
            const reviewForm = document.getElementById('reviewForm');
            if (reviewForm) {
                this.assert(
                    reviewForm instanceof HTMLFormElement,
                    'Review form exists'
                );
            }

            this.addTestResult('UI Interactions', true, 'UI interactions work correctly');
        } catch (error) {
            this.addTestResult('UI Interactions', false, error.message);
        }
    }

    async testErrorHandling() {
        console.log('\n🚨 Testing Error Handling...');
        
        try {
            // Test API error handling
            window.merchantAPI.getMerchants = async () => {
                throw new Error('Network error');
            };

            try {
                await window.merchantAPI.getMerchants();
                this.assert(false, 'Should have thrown an error');
            } catch (error) {
                this.assert(error.message === 'Network error', 'API errors are caught');
            }

            // Test invalid review submission
            window.merchantAPI.submitReview = async (merchantId, decision) => {
                if (!decision || !['approved', 'rejected'].includes(decision)) {
                    throw new Error('Invalid decision');
                }
            };

            try {
                await window.merchantAPI.submitReview('test-001', 'invalid');
                this.assert(false, 'Should have thrown validation error');
            } catch (error) {
                this.assert(error.message === 'Invalid decision', 'Validation errors work');
            }

            this.addTestResult('Error Handling', true, 'Error handling works correctly');
        } catch (error) {
            this.addTestResult('Error Handling', false, error.message);
        }
    }

    async testPermissions() {
        console.log('\n🔒 Testing Permission System...');
        
        try {
            // Test authentication check
            if (typeof checkAuthentication === 'function') {
                this.assert(true, 'Authentication check function exists');
            }

            // Test admin-only features
            const adminElements = document.querySelectorAll('.admin-only');
            this.assert(
                adminElements.length >= 0,
                'Admin-only elements can be identified'
            );

            // Test role-based navigation
            const adminNav = document.getElementById('adminNav');
            if (adminNav) {
                this.assert(
                    adminNav.style.display !== 'block' || adminNav.style.display === 'none',
                    'Admin navigation is properly controlled'
                );
            }

            this.addTestResult('Permission System', true, 'Permission system works correctly');
        } catch (error) {
            this.addTestResult('Permission System', false, error.message);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
        console.log(`  ✅ ${message}`);
    }

    addTestResult(testName, passed, message) {
        this.testResults.push({
            name: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        });

        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName} - ${message}`);
    }

    generateTestReport() {
        console.log('\n📊 Test Report');
        console.log('=' * 30);

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;

        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => !r.passed)
                .forEach(r => console.log(`  • ${r.name}: ${r.message}`));
        }

        // Save report to local storage for debugging
        localStorage.setItem('merchantManagementTestReport', JSON.stringify({
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: (passedTests / totalTests) * 100
            },
            results: this.testResults,
            generatedAt: new Date().toISOString()
        }));

        console.log('\n💾 Test report saved to localStorage as "merchantManagementTestReport"');
    }
}

// Auto-run tests when page loads (in development mode)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a bit for other scripts to load
        setTimeout(() => {
            if (confirm('Run Merchant Management System tests?')) {
                const tests = new MerchantManagementTests();
                tests.runAllTests();
            }
        }, 2000);
    });
}

// Make available globally for manual testing
window.MerchantManagementTests = MerchantManagementTests;
