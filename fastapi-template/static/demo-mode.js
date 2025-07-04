/**
 * Demo Mode Configuration for AWS Amplify Deployment
 * This enables the frontend to work without a backend for demonstration
 */

class DemoMode {
    constructor() {
        this.isDemoMode = true;
        this.demoUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                full_name: 'مدير النظام',
                email: 'admin@delivery-platform.com'
            }
        ];
        this.demoStats = {
            total_orders: 156,
            today_orders: 23,
            active_merchants: 12,
            active_drivers: 8,
            total_customers: 89,
            pending_orders: 7,
            revenue_today: 2340.50,
            revenue_trend: 15.2
        };
    }

    // Mock login function
    async mockLogin(username, password) {
        await this.delay(800); // Simulate API delay
        
        const user = this.demoUsers.find(u => 
            u.username === username && u.password === password
        );
        
        if (user) {
            const token = this.generateMockToken(user);
            return {
                success: true,
                message: 'تم تسجيل الدخول بنجاح',
                token: {
                    access_token: token,
                    token_type: 'bearer',
                    expires_in: 3600,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        full_name: user.full_name,
                        is_active: true,
                        created_at: '2025-07-02T10:00:00',
                        last_login: new Date().toISOString()
                    }
                }
            };
        } else {
            return {
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
                token: null
            };
        }
    }

    // Mock dashboard stats
    async mockDashboardStats() {
        await this.delay(300);
        return this.demoStats;
    }

    // Mock health check
    async mockHealthCheck() {
        await this.delay(200);
        return {
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        };
    }

    // Generate mock JWT token
    generateMockToken(user) {
        const header = btoa(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
        const payload = btoa(JSON.stringify({
            sub: user.username,
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000)
        }));
        const signature = 'mock_signature_for_demo';
        return `${header}.${payload}.${signature}`;
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Check if we're in demo mode
    static isEnabled() {
        // Enable demo mode if no API base is configured or if explicitly enabled
        const apiBase = document.querySelector('meta[name="api-base"]')?.content;
        return !apiBase || apiBase === '' || window.location.hostname.includes('amplifyapp.com');
    }
}

// Initialize demo mode if enabled
if (DemoMode.isEnabled()) {
    window.demoMode = new DemoMode();
    console.log('🎭 Demo mode enabled - Using mock data for demonstration');
}
