#!/usr/bin/env python3
"""
Production test script for Centralized Delivery Platform
Tests all API endpoints and functionality before deployment
"""

import requests
import json
import time
import sys
from datetime import datetime

class ProductionTester:
    def __init__(self, base_url="http://127.0.0.1:8080"):
        self.base_url = base_url.rstrip('/')
        self.results = []
        
    def log(self, test_name, status, details=""):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {status}")
        if details:
            print(f"   {details}")
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                db_status = data.get('database', 'unknown')
                self.log("Health Check", "PASS", f"Status: {status}, DB: {db_status}")
                return True
            else:
                self.log("Health Check", "FAIL", f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log("Health Check", "FAIL", str(e))
            return False
    
    def test_api_endpoints(self):
        """Test all main API endpoints"""
        endpoints = [
            "/api/dashboard/stats",
            "/api/orders", 
            "/api/merchants",
            "/api/drivers",
            "/api/customers",
            "/api/analytics/orders",
            "/api/search?q=test"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    self.log(f"API {endpoint}", "PASS", f"Returned {len(str(data))} bytes")
                else:
                    self.log(f"API {endpoint}", "FAIL", f"HTTP {response.status_code}")
            except Exception as e:
                self.log(f"API {endpoint}", "FAIL", str(e))
    
    def test_static_files(self):
        """Test static file serving"""
        static_files = [
            "/index.html",
            "/dashboard.html", 
            "/orders.html",
            "/merchants.html",
            "/drivers.html",
            "/customers.html"
        ]
        
        for file_path in static_files:
            try:
                response = requests.get(f"{self.base_url}{file_path}", timeout=10)
                if response.status_code == 200:
                    self.log(f"Static {file_path}", "PASS", f"Size: {len(response.content)} bytes")
                else:
                    self.log(f"Static {file_path}", "FAIL", f"HTTP {response.status_code}")
            except Exception as e:
                self.log(f"Static {file_path}", "FAIL", str(e))
    
    def test_database_operations(self):
        """Test database read operations"""
        try:
            # Test dashboard stats (database dependent)
            response = requests.get(f"{self.base_url}/api/dashboard/stats", timeout=10)
            if response.status_code == 200:
                data = response.json()
                total_orders = data.get('total_orders', 0)
                self.log("Database Read", "PASS", f"Found {total_orders} orders")
            else:
                self.log("Database Read", "FAIL", f"HTTP {response.status_code}")
        except Exception as e:
            self.log("Database Read", "FAIL", str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Starting Production Tests")
        print("=" * 50)
        print(f"Target URL: {self.base_url}")
        print(f"Test Time: {datetime.now().isoformat()}")
        print("")
        
        # Test health first
        if not self.test_health_endpoint():
            print("❌ Health check failed - server may not be running")
            return False
        
        # Run all other tests
        self.test_api_endpoints()
        self.test_static_files() 
        self.test_database_operations()
        
        # Summary
        print("\n📊 Test Summary")
        print("=" * 30)
        
        passed = len([r for r in self.results if r['status'] == 'PASS'])
        failed = len([r for r in self.results if r['status'] == 'FAIL'])
        warnings = len([r for r in self.results if r['status'] == 'WARN'])
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("\n🎉 All tests passed! Ready for production deployment.")
            return True
        else:
            print(f"\n⚠️  {failed} test(s) failed. Please fix issues before deployment.")
            return False

def main():
    """Main test function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Centralized Delivery Platform')
    parser.add_argument('--url', default='http://127.0.0.1:8080', 
                       help='Base URL to test (default: http://127.0.0.1:8080)')
    
    args = parser.parse_args()
    
    tester = ProductionTester(args.url)
    success = tester.run_all_tests()
    
    # Save results
    with open('test_results.json', 'w') as f:
        json.dump(tester.results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: test_results.json")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
