# Merchant Management System - Complete Implementation Guide

## 🏪 Overview

The Merchant Management System is a comprehensive solution for managing merchant applications, approvals, and notifications within the centralized delivery platform. This system provides administrators with the tools to review merchant applications, approve or reject them, and automatically notify merchants of their application status.

## 🎯 Key Features

### ✅ **Completed Features**

1. **Admin Dashboard Integration**
   - Merchant Management link in quick actions
   - Admin navigation sidebar integration
   - Role-based access control (Admin only)

2. **Merchant Management Interface**
   - Modern, responsive UI design
   - Tabbed interface (Pending, Approved, All)
   - Real-time statistics dashboard
   - Merchant application review modal

3. **Backend API Infrastructure**
   - AWS API Gateway with REST endpoints
   - Lambda functions for merchant operations
   - DynamoDB integration with optimized indexes
   - CORS support for cross-origin requests

4. **Authentication & Authorization**
   - AWS Cognito integration
   - Signed API requests using AWS SDK
   - Session validation and token management
   - Role-based access control

5. **Notification System**
   - AWS SNS for push notifications
   - AWS SES for email notifications
   - Automated notifications on approval/rejection
   - Customizable notification templates

6. **Data Management**
   - DynamoDB with optimized GSI indexes
   - Status-based filtering and querying
   - Audit trail for all review actions
   - Document tracking and management

## 🛠 Architecture

### Frontend Components

```
src/pages/
├── merchant-management.html     # Main merchant management interface
└── dashboard-aws-native.html    # Updated dashboard with navigation

src/utils/
├── merchant-api.js              # API client for merchant operations
├── aws-config.js               # AWS configuration
└── auth.js                     # Authentication utilities
```

### Backend Infrastructure

```
AWS Resources:
├── API Gateway (REST API)
│   ├── /merchants (GET) - List merchants
│   └── /merchants/{id}/review (POST) - Submit review
├── Lambda Functions
│   ├── GetMerchantsFunction - Retrieve merchants with filtering
│   └── ReviewMerchantFunction - Process merchant reviews
├── DynamoDB
│   ├── MerchantsTable - Main merchant data
│   ├── StatusIndex - Filter by status
│   └── ZoneCategoryIndex - Filter by zone/category
└── SNS/SES - Notification services
```

## 📊 Database Schema

### Merchants Table Structure

```javascript
{
  merchantId: "string",           // Primary Key
  businessName: "string",         
  ownerName: "string",
  email: "string",
  phone: "string",
  category: "string",
  zone: "string",                 // GSI: ZoneCategoryIndex
  location: "string",
  status: "string",               // GSI: StatusIndex (pending|approved|rejected)
  appliedAt: "string",            // ISO timestamp
  reviewedAt: "string",           // ISO timestamp (optional)
  approvedAt: "string",           // ISO timestamp (optional)
  rejectedAt: "string",           // ISO timestamp (optional)
  reviewerId: "string",           // User who reviewed (optional)
  reviewComments: "string",       // Review comments (optional)
  rejectionReason: "string",      // Rejection reason (optional)
  documents: ["string"],          // Array of document names
  description: "string",          // Business description
  address: "string",
  businessType: "string",
  estimatedDeliveryTime: "number",
  minOrderAmount: "number"
}
```

## 🔌 API Endpoints

### 1. Get Merchants
**GET** `/merchants`

Query Parameters:
- `status` (optional): Filter by status (pending, approved, rejected)

Response:
```json
{
  "merchants": [...],
  "count": 5
}
```

### 2. Submit Review
**POST** `/merchants/{merchantId}/review`

Request Body:
```json
{
  "decision": "approved|rejected",
  "comments": "Review comments",
  "reviewerId": "admin-user-id"
}
```

Response:
```json
{
  "message": "Merchant approved successfully",
  "merchantId": "merchant-id",
  "decision": "approved"
}
```

## 🚀 Deployment Guide

### Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js and npm** for frontend dependencies
3. **Python 3 and boto3** for data seeding (optional)

### Step 1: Deploy Infrastructure

```bash
# Navigate to project directory
cd "/Users/ghaythallaheebi/centralized platform"

# Make deployment script executable
chmod +x scripts/deploy-merchant-management.sh

# Deploy the complete system
./scripts/deploy-merchant-management.sh
```

### Step 2: Seed Sample Data (Optional)

```bash
# Install boto3 if not already installed
pip install boto3

# Run the seeding script
python3 scripts/seed-merchants.py
```

### Step 3: Update Configuration

The deployment script automatically updates the API URL in `merchant-api.js`. If manual update is needed:

```javascript
// In src/utils/merchant-api.js
this.baseURL = 'https://YOUR_API_GATEWAY_URL/dev';
```

## 📱 User Interface Guide

### Admin Dashboard

1. **Login**: Use `src/pages/login-aws-native.html`
2. **Navigate**: Click "Merchant Management" from dashboard quick actions
3. **Review**: Use the tabbed interface to view different merchant categories

### Merchant Management Interface

#### Statistics Dashboard
- **Pending Applications**: Number of merchants awaiting review
- **Approved Merchants**: Number of active merchants
- **Rejected Applications**: Number of rejected applications  
- **Total Merchants**: Overall count

#### Tabbed Navigation
- **Pending**: Applications requiring review
- **Approved**: Active merchant accounts
- **All**: Complete merchant list

#### Review Process
1. Click "Review" button on pending merchant
2. View merchant details and documentation
3. Select decision (Approve/Reject)
4. Add review comments
5. Submit review

## 🔔 Notification System

### Email Notifications (AWS SES)
- Sent automatically on approval/rejection
- Customizable templates
- Includes decision reason and next steps

### Push Notifications (AWS SNS)
- Mobile app integration ready
- JSON payload with merchant details
- Topic-based subscription model

### Notification Content
```javascript
// Approval notification
{
  merchantId: "merchant-id",
  decision: "approved",
  businessName: "Business Name",
  message: "Welcome to our platform! You can now start accepting orders."
}

// Rejection notification  
{
  merchantId: "merchant-id",
  decision: "rejected", 
  businessName: "Business Name",
  comments: "Please review requirements and reapply",
  message: "Please review the requirements and reapply if needed."
}
```

## 🧪 Testing Guide

### 1. Unit Testing
```bash
# Test API endpoints
curl -X GET "https://your-api-url/dev/merchants"
curl -X GET "https://your-api-url/dev/merchants?status=pending"
```

### 2. Integration Testing
1. Login to admin dashboard
2. Navigate to merchant management
3. Review a pending merchant application
4. Verify notification delivery
5. Check DynamoDB for updated status

### 3. Sample Test Data
The system includes 6 sample merchants with different statuses:
- 3 Pending applications
- 2 Approved merchants  
- 1 Rejected application

## 🔒 Security Features

### Authentication
- AWS Cognito integration
- Session-based authentication
- Token validation on all API calls
- Role-based access control

### API Security
- AWS IAM for Lambda execution
- Signed requests using AWS credentials
- CORS configuration for browser security
- Input validation and sanitization

### Data Protection
- Encrypted DynamoDB storage
- Secure document handling
- Audit trail for all actions
- No sensitive data in client-side code

## 🚨 Troubleshooting

### Common Issues

1. **API Gateway 403 Errors**
   - Check AWS credentials are properly configured
   - Verify Cognito user has proper permissions
   - Ensure API Gateway deployment is complete

2. **DynamoDB Access Denied**
   - Verify Lambda execution role has DynamoDB permissions
   - Check table name matches environment variable
   - Ensure GSI indexes are properly created

3. **Notification Failures**
   - Verify SES email address is verified
   - Check SNS topic permissions
   - Ensure Lambda has SNS/SES permissions

4. **Frontend Connection Issues**
   - Update API URL in `merchant-api.js`
   - Check CORS configuration
   - Verify AWS SDK initialization

### Debug Mode
Enable console logging in `merchant-api.js`:
```javascript
console.log('API Response:', response);
console.log('Error details:', error);
```

## 📈 Performance Optimization

### Database Optimization
- GSI indexes for efficient querying
- Optimized scan operations with filters
- Pagination support for large datasets

### Frontend Optimization
- Lazy loading of merchant data
- Caching of API responses
- Optimized re-rendering on state changes

### API Optimization
- Lambda cold start optimization
- Connection pooling for DynamoDB
- Efficient error handling and retries

## 🔄 Future Enhancements

### Phase 2 Features
- [ ] Bulk merchant operations
- [ ] Advanced filtering and search
- [ ] Merchant analytics dashboard
- [ ] Document verification system
- [ ] Automated compliance checking

### Phase 3 Features  
- [ ] Machine learning for approval recommendations
- [ ] Real-time merchant activity tracking
- [ ] Integration with payment systems
- [ ] Multi-language support
- [ ] Mobile admin app

## 📝 Change Log

### Version 1.0.0 (Current)
- ✅ Complete merchant management interface
- ✅ Backend API with Lambda functions
- ✅ DynamoDB integration with optimized indexes
- ✅ AWS SNS/SES notification system
- ✅ Authentication and authorization
- ✅ Admin dashboard integration
- ✅ Sample data seeding
- ✅ Comprehensive documentation

## 📞 Support

### Documentation
- API Documentation: Check Lambda function code
- User Guide: This document
- Architecture Guide: `docs/architecture/`

### Resources
- AWS CloudFormation Template: `config/aws/aws-native-infrastructure.yaml`
- Frontend Code: `src/pages/merchant-management.html`
- API Client: `src/utils/merchant-api.js`
- Deployment Scripts: `scripts/deploy-merchant-management.sh`

---

**🎉 Merchant Management System is now ready for production use!**

The system provides a complete solution for managing merchant applications with automated notifications, comprehensive review workflows, and enterprise-grade security. All components are deployed and configured for immediate use.
