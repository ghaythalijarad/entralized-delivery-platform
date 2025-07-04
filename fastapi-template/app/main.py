from fastapi import FastAPI, HTTPException, Depends, status, Response, Request
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
import random
import os
import traceback

# Import configuration
from app.config import config

# Import database components
from app.database import get_db
from app.models import (
    Merchant as MerchantModel, Driver as DriverModel, Customer as CustomerModel, 
    Order as OrderModel, OrderItem, DailyStats, MerchantStatus, DriverStatus, 
    OrderStatus, VehicleType, User
)
from app.schemas import Merchant, Driver, Customer, Order, DashboardStats, ActivityItem

# Import authentication
from app.auth import (
    create_access_token, authenticate_user, get_current_active_user, 
    require_admin, require_admin_or_manager, require_any_role,
    create_default_admin_user, get_password_hash, create_user,
    get_user_by_username, ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user_cognito, require_cognito_admin, CognitoUser
)
from app.auth_schemas import (
    UserLogin, UserCreate, UserResponse, UserListResponse, CreateUserResponse, UserUpdate, PasswordChange
)
from app.auth_schemas import CognitoLoginResponse, CognitoToken, CognitoUserResponse

# Import Cognito functions
from app.cognito import (
    initiate_auth,
    get_user_groups,
    list_users,
    admin_add_user_to_group,
    admin_remove_user_from_group,
    refresh_token as cognito_refresh,
    global_sign_out,
    admin_create_user,
    admin_delete_user,
    create_group,
    list_groups,
    admin_enable_user,
    admin_disable_user,
    admin_reset_user_password,
    get_user_details
)

# Import fallback mock database for development
from app.db import db as mock_db
from mangum import Mangum

app = FastAPI(
    title=config.PROJECT_NAME, 
    version=config.VERSION,
    debug=config.DEBUG,
    root_path=os.environ.get("ROOT_PATH")
)

# Static file serving for local development
if config.DEBUG:
    from fastapi.staticfiles import StaticFiles
    import os
    
    # Serve static files from the parent directory
    static_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", ".")
    if os.path.exists(static_path):
        app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

# Removed startup event to reduce Lambda cold start time
# Database connections are now initialized lazily when needed

# Health check endpoint
@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "environment": config.ENVIRONMENT}


# ==========================================
# LOCAL DEVELOPMENT AUTHENTICATION
# ==========================================

@app.post("/auth/login")
async def login(user_credentials: UserLogin, response: Response):
    """Authentication endpoint - uses local auth in development, Cognito in production"""
    # Check if we're in local development mode
    if config.ENVIRONMENT == "development" or os.getenv("USE_COGNITO", "true").lower() == "false":
        # Local development authentication
        if user_credentials.username == "admin" and user_credentials.password == "admin123":
            return {
                "success": True,
                "message": "Local login successful",
                "token": {
                    "access_token": "local-demo-token",
                    "id_token": "local-demo-id-token",
                    "expires_in": 3600,
                    "token_type": "Bearer",
                    "user": {
                        "username": "admin",
                        "groups": ["admin"]
                    }
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid credentials (use admin/admin123 for local dev)"
            )
    
    # Production Cognito authentication
    try:
        auth_result = initiate_auth(user_credentials.username, user_credentials.password)
        
        # Extract tokens
        id_token = auth_result["IdToken"]
        access_token = auth_result["AccessToken"]
        refresh_token = auth_result.get("RefreshToken")
        expires_in = auth_result["ExpiresIn"]
        token_type = auth_result["TokenType"]
        
        # Get user groups
        groups = get_user_groups(user_credentials.username)
        user = CognitoUserResponse(username=user_credentials.username, groups=groups)
        
        # Create token response model (excluding refresh token)
        token = CognitoToken(
            access_token=access_token,
            id_token=id_token,
            refresh_token=None,  # Refresh token is now in a cookie
            expires_in=expires_in,
            token_type=token_type,
            user=user
        )
        
        # Set refresh token in a secure HttpOnly cookie
        if refresh_token:
            response.set_cookie(
                key="refreshToken",
                value=refresh_token,
                httponly=True,
                secure=not config.DEBUG,  # Use secure cookies in production
                samesite="strict",
                max_age=2592000  # 30 days
            )
        
        return CognitoLoginResponse(success=True, message="Login successful", token=token)
        
    except Exception as e:
        if "cognito_client" in str(e) or "NotAuthorizedException" in str(e):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/auth/refresh")
async def refresh(request: Request):
    """Refresh the access token using the refresh token from the cookie"""
    refresh_token = request.cookies.get("refreshToken")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found")

    try:
        new_tokens = cognito_refresh(refresh_token)
        return {
            "success": True,
            "access_token": new_tokens["AccessToken"],
            "id_token": new_tokens["IdToken"],
            "token_type": new_tokens["TokenType"],
            "expires_in": new_tokens["ExpiresIn"]
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid refresh token: {e}")

@app.post("/auth/logout")
async def logout(response: Response, request: Request):
    """Logout by invalidating tokens and clearing the refresh token cookie"""
    try:
        # Extract access token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        access_token = auth_header.split(" ")[1]
        
        # Invalidate all tokens for the user in Cognito
        global_sign_out(access_token)
        
    except Exception as e:
        # Even if sign-out fails, clear the cookie to log the user out on the client
        print(f"Error during Cognito global sign-out: {e}")
    
    # Clear the refresh token cookie
    response.delete_cookie("refreshToken")
    return {"success": True, "message": "Logout successful"}

@app.get("/auth/me", response_model=CognitoUserResponse)
async def get_current_user_info(current_user: CognitoUserResponse = Depends(get_current_user_cognito)):
    """Get current Cognito user info"""
    return current_user

@app.post("/auth/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    from app.auth import verify_password
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


# ==========================================
# USER MANAGEMENT ENDPOINTS (Admin only)
# ==========================================

@app.get("/users", response_model=UserListResponse)
async def list_users(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """List all users (Admin/Manager only)"""
    offset = (page - 1) * per_page
    users = db.query(User).offset(offset).limit(per_page).all()
    total = db.query(User).count()
    
    return UserListResponse(
        users=[UserResponse.from_orm(user) for user in users],
        total=total,
        page=page,
        per_page=per_page
    )

@app.post("/users", response_model=CreateUserResponse)
async def create_new_user(
    user_data: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new user (Admin only)"""
    try:
        # Create user with created_by tracking
        new_user = create_user(db, user_data)
        new_user.created_by_id = current_user.id
        db.commit()
        db.refresh(new_user)
        
        return CreateUserResponse(
            success=True,
            message=f"User '{user_data.username}' created successfully",
            user=UserResponse.from_orm(new_user)
        )
        
    except HTTPException as e:
        return CreateUserResponse(
            success=False,
            message=e.detail
        )
    except Exception as e:
        print(f"User creation error: {e}")
        return CreateUserResponse(
            success=False,
            message="Failed to create user"
        )

@app.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(user, field, value)
    
    db.commit()
    return {"message": f"User '{user.username}' updated successfully"}

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete user (Admin only)"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": f"User '{user.username}' deleted successfully"}

def to_dict(doc):
    data = doc.to_dict()
    data["id"] = doc.id
    return data

# -- Mock Database CRUD Operations --
@app.post("/merchants", response_model=Merchant)
async def create_merchant(m: Merchant):
    ref = mock_db.collection("merchants").add(m.dict(exclude={"id"}))
    m.id = ref[1].id
    return m

@app.get("/merchants/{mid}", response_model=Merchant)
async def get_merchant(mid: str):
    doc = mock_db.collection("merchants").document(mid).get()
    if not doc.exists:
        raise HTTPException(404, "Merchant not found")
    return to_dict(doc)

@app.put("/merchants/{mid}", response_model=Merchant)
async def update_merchant(mid: str, m: Merchant):
    mock_db.collection("merchants").document(mid).set(m.dict(exclude={"id"}), merge=True)
    m.id = mid
    return m

@app.delete("/merchants/{mid}")
async def delete_merchant(mid: str):
    mock_db.collection("merchants").document(mid).delete()
    return {"deleted": True}

# -- Dashboard Statistics Endpoints --
@app.get("/dashboard/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    """Get real-time dashboard statistics for all cards"""
    try:
        # Use real database when available, fallback to mock data
        if check_database_connection():
            # Query real database
            total_orders = db.query(OrderModel).count()
            today_orders = db.query(OrderModel).filter(
                OrderModel.created_at >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            ).count()
            active_merchants = db.query(MerchantModel).filter(MerchantModel.status == MerchantStatus.ONLINE).count()
            active_drivers = db.query(DriverModel).filter(DriverModel.status == DriverStatus.ACTIVE).count()
            total_customers = db.query(CustomerModel).count()
            pending_orders = db.query(OrderModel).filter(OrderModel.status == OrderStatus.PENDING).count()
            
            return DashboardStats(
                total_orders=total_orders,
                today_orders=today_orders,
                active_merchants=active_merchants,
                active_drivers=active_drivers,
                total_customers=total_customers,
                pending_orders=pending_orders,
                revenue_today=random.uniform(15000, 45000),  # Mock revenue for now
                revenue_trend=random.uniform(-10, 25)
            )
        else:
            # Fallback to mock data when database is not available
            # Get today's date for filtering orders
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Count total orders today using mock database
            orders_today = len(list(mock_db.collection("orders").where(
                "created_at", ">=", today
            ).stream()))
            
            # Count connected merchants (assuming status field exists)
            merchants_docs = list(mock_db.collection("merchants").stream())
            total_merchants = len(merchants_docs)
            connected_merchants = len([m for m in merchants_docs 
                                     if to_dict(m).get("status") == "online"])
            
            # Count active drivers (assuming status field exists)  
            drivers_docs = list(mock_db.collection("drivers").stream())
            active_drivers = len([d for d in drivers_docs 
                                if to_dict(d).get("status") == "active"])
        
        # Count total customers
        total_customers = len(list(mock_db.collection("customers").stream()))
        
        return {
            "orders_today": orders_today,
            "connected_merchants": connected_merchants, 
            "total_merchants": total_merchants,
            "active_drivers": active_drivers,
            "total_customers": total_customers,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(500, f"Error fetching dashboard stats: {str(e)}")

@app.get("/dashboard/orders-today")
async def get_orders_today(current_user: User = Depends(require_any_role)):
    """Get today's orders count"""
    try:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        orders = list(mock_db.collection("orders").where("created_at", ">=", today).stream())
        return {"count": len(orders), "orders": [to_dict(order) for order in orders]}
    except Exception as e:
        raise HTTPException(500, f"Error fetching today's orders: {str(e)}")

@app.get("/dashboard/merchants-status")
async def get_merchants_status(current_user: User = Depends(require_any_role)):
    """Get merchants connection status"""
    try:
        merchants = list(mock_db.collection("merchants").stream())
        merchants_data = [to_dict(m) for m in merchants]
        
        connected = len([m for m in merchants_data if m.get("status") == "online"])
        total = len(merchants_data)
        offline = total - connected
        
        return {
            "total": total,
            "connected": connected,
            "offline": offline,
            "merchants": merchants_data
        }
    except Exception as e:
        raise HTTPException(500, f"Error fetching merchants status: {str(e)}")

@app.get("/dashboard/drivers-status") 
async def get_drivers_status(current_user: User = Depends(require_any_role)):
    """Get drivers activity status"""
    try:
        drivers = list(mock_db.collection("drivers").stream())
        drivers_data = [to_dict(d) for d in drivers]
        
        active = len([d for d in drivers_data if d.get("status") == "active"])
        total = len(drivers_data)
        inactive = total - active
        
        return {
            "total": total,
            "active": active,
            "inactive": inactive,
            "drivers": drivers_data
        }
    except Exception as e:
        raise HTTPException(500, f"Error fetching drivers status: {str(e)}")

@app.get("/dashboard/customers-count")
async def get_customers_count(current_user: User = Depends(require_any_role)):
    """Get total customers count"""
    try:
        customers = list(mock_db.collection("customers").stream())
        return {
            "total": len(customers),
            "customers": [to_dict(customer) for customer in customers]
        }
    except Exception as e:
        raise HTTPException(500, f"Error fetching customers count: {str(e)}")

@app.get("/dashboard/recent-activity")
async def get_recent_activity(current_user: User = Depends(require_any_role)):
    """Get recent system activity for dashboard"""
    try:
        # Get recent orders
        recent_orders = list(mock_db.collection("orders").stream())[-5:]  # Last 5 orders
        
        activities = []
        for order in recent_orders:
            order_data = to_dict(order)
            activities.append({
                "type": "order",
                "message": f"طلب جديد #{order.id[:8]} - {order_data.get('status', 'pending')}",
                "time": "منذ دقائق",
                "status": "success" if order_data.get('status') == 'confirmed' else "info",
                "timestamp": order_data.get('created_at', datetime.now()).isoformat() if hasattr(order_data.get('created_at'), 'isoformat') else datetime.now().isoformat()
            })
        
        # Sort by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return {
            "activities": activities[:10],  # Return last 10 activities
            "count": len(activities)
        }
    except Exception as e:
        raise HTTPException(500, f"Error fetching recent activity: {str(e)}")

# -- Sample Data Generation (for testing) --
@app.post("/seed-data")
async def seed_sample_data():
    """Generate sample data for testing the dashboard"""
    try:
        from datetime import datetime, timedelta
        import random
        
        # Sample merchants
        sample_merchants = [
            {"name": "مطعم الذواقة الشرقي", "owner": "أحمد محمد العلي", "phone": "0501234567", "category": "restaurant", "status": "online", "created_at": datetime.now() - timedelta(days=10)},
            {"name": "متجر الوفرة للمواد الغذائية", "owner": "سارة أحمد المطيري", "phone": "0509876543", "category": "store", "status": "online", "created_at": datetime.now() - timedelta(days=15)},
            {"name": "صيدلية النور الطبية", "owner": "د. محمد سالم الحربي", "phone": "0555123456", "category": "pharmacy", "status": "offline", "created_at": datetime.now() - timedelta(days=5)},
            {"name": "محل الهدايا الذهبي", "owner": "فاطمة خالد السديري", "phone": "0557891234", "category": "giftshop", "status": "online", "created_at": datetime.now() - timedelta(days=8)},
        ]
        
        # Sample drivers
        sample_drivers = [
            {"name": "محمد أحمد السالم", "nationalId": "1234567890", "phone": "0551234567", "vehicleType": "motorcycle", "status": "active", "created_at": datetime.now() - timedelta(days=20)},
            {"name": "علي حسن المطيري", "nationalId": "0987654321", "phone": "0559876543", "vehicleType": "car", "status": "active", "created_at": datetime.now() - timedelta(days=18)},
            {"name": "خالد سعد الحربي", "nationalId": "1122334455", "phone": "0555555555", "vehicleType": "motorcycle", "status": "inactive", "created_at": datetime.now() - timedelta(days=12)},
        ]
        
        # Sample customers
        sample_customers = [
            {"name": "نورا عبدالله", "phone": "0502223333", "email": "nora@example.com", "created_at": datetime.now() - timedelta(days=30)},
            {"name": "أحمد يوسف", "phone": "0503334444", "email": "ahmed@example.com", "created_at": datetime.now() - timedelta(days=25)},
            {"name": "فاطمة علي", "phone": "0504445555", "email": "fatima@example.com", "created_at": datetime.now() - timedelta(days=20)},
            {"name": "عبدالرحمن محمد", "phone": "0505556666", "email": "abdurahman@example.com", "created_at": datetime.now() - timedelta(days=15)},
        ]
        
        # Clear existing data first
        # Add merchants
        merchants_added = 0
        for merchant in sample_merchants:
            mock_db.collection("merchants").add(merchant)
            merchants_added += 1
        
        # Add drivers
        drivers_added = 0
        for driver in sample_drivers:
            mock_db.collection("drivers").add(driver)
            drivers_added += 1
        
        # Add customers
        customers_added = 0
        for customer in sample_customers:
            mock_db.collection("customers").add(customer)
            customers_added += 1
        
        # Add sample orders for today
        orders_added = 0
        merchant_refs = list(mock_db.collection("merchants").stream())
        customer_refs = list(mock_db.collection("customers").stream())
        
        if merchant_refs and customer_refs:
            today = datetime.now()
            for i in range(random.randint(5, 15)):  # Random number of orders today
                order_time = today - timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59))
                order = {
                    "customerId": random.choice(customer_refs).id,
                    "merchantId": random.choice(merchant_refs).id,
                    "items": [{"name": f"منتج {i+1}", "price": random.randint(20, 100), "quantity": random.randint(1, 3)}],
                    "total": random.randint(50, 300),
                    "status": random.choice(["pending", "confirmed", "delivered"]),
                    "created_at": order_time
                }
                mock_db.collection("orders").add(order)
                orders_added += 1
        
        return {
            "success": True,
            "message": "Sample data generated successfully",
            "data": {
                "merchants_added": merchants_added,
                "drivers_added": drivers_added,
                "customers_added": customers_added,
                "orders_added": orders_added
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Error generating sample data: {str(e)}")

# -- Database Seeding Endpoint --
@app.post("/seed-database")
async def seed_database(db: Session = Depends(get_db)):
    """Seed the database with sample data for development and testing"""
    try:
        if check_database_connection():
            # Seed real database with SQLAlchemy models
            print("🌱 Seeding real database...")
            
            # Clear existing data (be careful in production!)
            db.query(OrderItem).delete()
            db.query(OrderModel).delete()
            db.query(DriverModel).delete()
            db.query(MerchantModel).delete()
            db.query(CustomerModel).delete()
            db.commit()
            
            # Add sample merchants
            sample_merchants = [
                MerchantModel(name="مطعم الأصالة", owner="محمد أحمد", phone="0501234567", 
                        email="asala@example.com", category="مطاعم", status=MerchantStatus.ONLINE,
                        address="الرياض - حي النخيل", latitude=24.7136, longitude=46.6753),
                MerchantModel(name="كافيه المدينة", owner="سارة علي", phone="0509876543",
                        email="madina@example.com", category="مقاهي", status=MerchantStatus.ONLINE,
                        address="جدة - حي الزهراء", latitude=21.3891, longitude=39.8579),
                MerchantModel(name="سوبر ماركت الخير", owner="عبدالله محمد", phone="0505551234",
                        email="kheir@example.com", category="سوبر ماركت", status=MerchantStatus.OFFLINE,
                        address="الدمام - حي الشاطئ", latitude=26.4207, longitude=50.0888),
            ]
            
            for merchant in sample_merchants:
                db.add(merchant)
            db.commit()
            
            # Add sample drivers
            sample_drivers = [
                DriverModel(name="أحمد محمد", phone="0501111111", vehicle_type=VehicleType.MOTORCYCLE,
                      national_id="123456789", status=DriverStatus.ACTIVE),
                DriverModel(name="فهد العتيبي", phone="0502222222", vehicle_type=VehicleType.CAR,
                      national_id="987654321", status=DriverStatus.ACTIVE),
                DriverModel(name="سعد الأحمد", phone="0503333333", vehicle_type=VehicleType.MOTORCYCLE,
                      national_id="456789123", status=DriverStatus.INACTIVE),
            ]
            
            for driver in sample_drivers:
                db.add(driver)
            db.commit()
            
            # Add sample customers
            sample_customers = [
                CustomerModel(name="نورا عبدالله", phone="0502223333", email="nora@example.com"),
                CustomerModel(name="أحمد يوسف", phone="0503334444", email="ahmed@example.com"),
                CustomerModel(name="فاطمة علي", phone="0504445555", email="fatima@example.com"),
            ]
            
            for customer in sample_customers:
                db.add(customer)
            db.commit()
            
            # Add sample orders
            merchants = db.query(MerchantModel).all()
            customers = db.query(CustomerModel).all()
            drivers = db.query(DriverModel).filter(DriverModel.status == DriverStatus.ACTIVE).all()
            
            if merchants and customers:
                sample_orders = [
                    OrderModel(customer_id=customers[0].id, merchant_id=merchants[0].id,
                         driver_id=drivers[0].id if drivers else None,
                         order_number=f"ORD{random.randint(1000, 9999)}",
                         status=OrderStatus.DELIVERED, total_amount=85.50, final_amount=85.50,
                         delivery_address="الرياض - حي النخيل"),
                    OrderModel(customer_id=customers[1].id, merchant_id=merchants[1].id,
                         order_number=f"ORD{random.randint(1000, 9999)}",
                         status=OrderStatus.PENDING, total_amount=42.75, final_amount=42.75,
                         delivery_address="جدة - حي الزهراء"),
                ]
                
                for order in sample_orders:
                    db.add(order)
                db.commit()
            
            return {
                "status": "success",
                "message": "Real database seeded successfully",
                "merchants": len(sample_merchants),
                "drivers": len(sample_drivers),
                "customers": len(sample_customers),
                "database_type": "SQLAlchemy/PostgreSQL"
            }
        
        else:
            # Fallback to mock database seeding
            return await seed_sample_data()  # Use existing mock function
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database seeding failed: {str(e)}")

# -- Orders Management Endpoints --
@app.get("/orders")
async def get_orders(
    status: Optional[str] = None,
    merchant_id: Optional[str] = None,
    driver_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_any_role),
    db: Session = Depends(get_db)
):
    """Get orders with optional filtering and pagination"""
    try:
        if check_database_connection():
            # Use real database
            query = db.query(OrderModel)
            
            if status:
                from app.models import OrderStatus
                status_enum = getattr(OrderStatus, status.upper(), None)
                if status_enum:
                    query = query.filter(OrderModel.status == status_enum)
            
            if merchant_id:
                query = query.filter(OrderModel.merchant_id == merchant_id)
            
            if driver_id:
                query = query.filter(OrderModel.driver_id == driver_id)
            
            orders = query.offset(offset).limit(limit).all()
            total = query.count()
            
            return {
                "orders": [
                    {
                        "id": order.id,
                        "order_number": order.order_number,
                        "customer_id": order.customer_id,
                        "merchant_id": order.merchant_id,
                        "driver_id": order.driver_id,
                        "status": order.status.value,
                        "total_amount": order.total_amount,
                        "final_amount": order.final_amount,
                        "delivery_address": order.delivery_address,
                        "created_at": order.created_at.isoformat(),
                        "updated_at": order.updated_at.isoformat() if order.updated_at else None
                    } for order in orders
                ],
                "total": total,
                "limit": limit,
                "offset": offset
            }
        else:
            # Use mock database
            orders_docs = list(mock_db.collection("orders").stream())
            orders = [to_dict(order) for order in orders_docs]
            
            # Apply filters
            if status:
                orders = [o for o in orders if o.get("status") == status]
            if merchant_id:
                orders = [o for o in orders if o.get("merchantId") == merchant_id]
            if driver_id:
                orders = [o for o in orders if o.get("driverId") == driver_id]
            
            # Apply pagination
            total = len(orders)
            orders = orders[offset:offset + limit]
            
            return {
                "orders": orders,
                "total": total,
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        raise HTTPException(500, f"Error fetching orders: {str(e)}")

@app.get("/orders/{order_id}")
async def get_order(
    order_id: str, 
    current_user: User = Depends(require_any_role),
    db: Session = Depends(get_db)
):
    """Get a specific order by ID"""
    try:
        if check_database_connection():
            order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
            if not order:
                raise HTTPException(404, "Order not found")
            
            return {
                "id": order.id,
                "order_number": order.order_number,
                "customer_id": order.customer_id,
                "merchant_id": order.merchant_id,
                "driver_id": order.driver_id,
                "status": order.status.value,
                "total_amount": order.total_amount,
                "final_amount": order.final_amount,
                "delivery_address": order.delivery_address,
                "created_at": order.created_at.isoformat(),
                "updated_at": order.updated_at.isoformat() if order.updated_at else None
            }
        else:
            doc = mock_db.collection("orders").document(order_id).get()
            if not doc.exists:
                raise HTTPException(404, "Order not found")
            return to_dict(doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error fetching order: {str(e)}")

@app.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    status: str, 
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Update order status"""
    try:
        if check_database_connection():
            order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
            if not order:
                raise HTTPException(404, "Order not found")
            
            from app.models import OrderStatus
            status_enum = getattr(OrderStatus, status.upper(), None)
            if not status_enum:
                raise HTTPException(400, f"Invalid status: {status}")
            
            order.status = status_enum
            order.updated_at = datetime.now()
            db.commit()
            
            return {"message": "Order status updated successfully", "status": status}
        else:
            doc_ref = mock_db.collection("orders").document(order_id)
            if not doc_ref.get().exists:
                raise HTTPException(404, "Order not found")
            
            doc_ref.update({"status": status, "updated_at": datetime.now()})
            return {"message": "Order status updated successfully", "status": status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating order status: {str(e)}")

# -- Merchants Management Endpoints --
@app.get("/merchants")
async def get_merchants(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_any_role),
    db: Session = Depends(get_db)
):
    """Get merchants with optional filtering and pagination"""
    try:
        if check_database_connection():
            query = db.query(MerchantModel)
            
            if status:
                from app.models import MerchantStatus
                status_enum = getattr(MerchantStatus, status.upper(), None)
                if status_enum:
                    query = query.filter(MerchantModel.status == status_enum)
            
            if category:
                query = query.filter(MerchantModel.category == category)
            
            merchants = query.offset(offset).limit(limit).all()
            total = query.count()
            
            return {
                "merchants": [
                    {
                        "id": merchant.id,
                        "name": merchant.name,
                        "owner": merchant.owner,
                        "phone": merchant.phone,
                        "email": merchant.email,
                        "category": merchant.category,
                        "status": merchant.status.value,
                        "address": merchant.address,
                        "latitude": merchant.latitude,
                        "longitude": merchant.longitude,
                        "created_at": merchant.created_at.isoformat(),
                        "updated_at": merchant.updated_at.isoformat() if merchant.updated_at else None
                    } for merchant in merchants
                ],
                "total": total,
                "limit": limit,
                "offset": offset
            }
        else:
            merchants_docs = list(mock_db.collection("merchants").stream())
            merchants = [to_dict(merchant) for merchant in merchants_docs]
            
            # Apply filters
            if status:
                merchants = [m for m in merchants if m.get("status") == status]
            if category:
                merchants = [m for m in merchants if m.get("category") == category]
            
            # Apply pagination
            total = len(merchants)
            merchants = merchants[offset:offset + limit]
            
            return {
                "merchants": merchants,
                "total": total,
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        raise HTTPException(500, f"Error fetching merchants: {str(e)}")

@app.post("/merchants")
async def create_merchant(merchant: Merchant, db: Session = Depends(get_db)):
    """Create a new merchant"""
    try:
        if check_database_connection():
            from app.models import MerchantStatus
            db_merchant = MerchantModel(
                name=merchant.name,
                owner=merchant.owner,
                phone=merchant.phone,
                email=merchant.email,
                category=merchant.category,
                status=MerchantStatus.OFFLINE
            )
            db.add(db_merchant)
            db.commit()
            db.refresh(db_merchant)
            
            return {
                "id": db_merchant.id,
                "name": db_merchant.name,
                "owner": db_merchant.owner,
                "phone": db_merchant.phone,
                "email": db_merchant.email,
                "category": db_merchant.category,
                "status": db_merchant.status.value,
                "created_at": db_merchant.created_at.isoformat()
            }
        else:
            merchant_data = merchant.dict(exclude={"id"})
            merchant_data["created_at"] = datetime.now()
            ref = mock_db.collection("merchants").add(merchant_data)
            merchant_data["id"] = ref[1].id
            return merchant_data
    except Exception as e:
        raise HTTPException(500, f"Error creating merchant: {str(e)}")

# -- Drivers Management Endpoints --
@app.get("/drivers")
async def get_drivers(
    status: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_any_role),
    db: Session = Depends(get_db)
):
    """Get drivers with optional filtering and pagination"""
    try:
        if check_database_connection():
            query = db.query(DriverModel)
            
            if status:
                from app.models import DriverStatus
                status_enum = getattr(DriverStatus, status.upper(), None)
                if status_enum:
                    query = query.filter(DriverModel.status == status_enum)
            
            if vehicle_type:
                from app.models import VehicleType
                vehicle_enum = getattr(VehicleType, vehicle_type.upper(), None)
                if vehicle_enum:
                    query = query.filter(DriverModel.vehicle_type == vehicle_enum)
            
            drivers = query.offset(offset).limit(limit).all()
            total = query.count()
            
            return {
                "drivers": [
                    {
                        "id": driver.id,
                        "name": driver.name,
                        "phone": driver.phone,
                        "national_id": driver.national_id,
                        "vehicle_type": driver.vehicle_type.value,
                        "status": driver.status.value,
                        "created_at": driver.created_at.isoformat(),
                        "updated_at": driver.updated_at.isoformat() if driver.updated_at else None
                    } for driver in drivers
                ],
                "total": total,
                "limit": limit,
                "offset": offset
            }
        else:
            drivers_docs = list(mock_db.collection("drivers").stream())
            drivers = [to_dict(driver) for driver in drivers_docs]
            
            # Apply filters
            if status:
                drivers = [d for d in drivers if d.get("status") == status]
            if vehicle_type:
                drivers = [d for d in drivers if d.get("vehicleType") == vehicle_type]
            
            return {
                "drivers": drivers,
                "total": len(drivers),
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        raise HTTPException(500, f"Error creating driver: {str(e)}")

# -- Customers Management Endpoints --
@app.get("/customers")
async def get_customers(
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    current_user: User = Depends(require_any_role),
    db: Session = Depends(get_db)
):
    """Get customers with optional search and pagination"""
    try:
        if check_database_connection():
            query = db.query(CustomerModel)
            
            if search:
                query = query.filter(
                    CustomerModel.name.contains(search) | 
                    CustomerModel.phone.contains(search) |
                    CustomerModel.email.contains(search)
                )
            
            customers = query.offset(offset).limit(limit).all()
            total = query.count()
            
            return {
                "customers": [
                    {
                        "id": customer.id,
                        "name": customer.name,
                        "phone": customer.phone,
                        "email": customer.email,
                        "created_at": customer.created_at.isoformat(),
                        "updated_at": customer.updated_at.isoformat() if customer.updated_at else None
                    } for customer in customers
                ],
                "total": total,
                "limit": limit,
                "offset": offset
            }
        else:
            customers_docs = list(mock_db.collection("customers").stream())
            customers = [to_dict(customer) for customer in customers_docs]
            
            # Apply search filter
            if search:
                search_lower = search.lower()
                customers = [
                    c for c in customers 
                    if search_lower in c.get("name", "").lower() or 
                       search_lower in c.get("phone", "").lower() or 
                       search_lower in c.get("email", "").lower()
                ]
            
            # Apply pagination
            total = len(customers)
            customers = customers[offset:offset + limit]
            
            return {
                "customers": customers,
                "total": total,
                "limit": limit,
                "offset": offset
            }
    except Exception as e:
        raise HTTPException(500, f"Error fetching customers: {str(e)}")

@app.post("/customers")
async def create_customer(customer: Customer, db: Session = Depends(get_db)):
    """Create a new customer"""
    try:
        if check_database_connection():
            db_customer = CustomerModel(
                name=customer.name,
                phone=customer.phone,
                email=customer.email
            )
            db.add(db_customer)
            db.commit()
            db.refresh(db_customer)
            
            return {
                "id": db_customer.id,
                "name": db_customer.name,
                "phone": db_customer.phone,
                "email": db_customer.email,
                "created_at": db_customer.created_at.isoformat()
            }
        else:
            customer_data = customer.dict(exclude={"id"})
            customer_data["created_at"] = datetime.now()
            ref = mock_db.collection("customers").add(customer_data)
            customer_data["id"] = ref[1].id
            return customer_data
    except Exception as e:
        raise HTTPException(500, f"Error creating customer: {str(e)}")

# -- Analytics and Reporting Endpoints --
@app.get("/analytics/orders")
async def get_order_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(require_any_role),
    db: Session = Depends(get_db)
):
    """Get order analytics and statistics"""
    try:
        if check_database_connection():
            query = db.query(OrderModel)
            
            if start_date:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(OrderModel.created_at >= start_dt)
            
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(OrderModel.created_at <= end_dt)
            
            orders = query.all()
            
            # Calculate analytics
            total_orders = len(orders)
            total_revenue = sum(order.final_amount for order in orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            # Order status breakdown
            status_counts = {}
            for order in orders:
                status = order.status.value
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return {
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "average_order_value": avg_order_value,
                "status_breakdown": status_counts,
                "period": {
                    "start_date": start_date,
                    "end_date": end_date
                }
            }
        else:
            # Mock analytics using mock data
            orders_docs = list(mock_db.collection("orders").stream())
            orders = [to_dict(order) for order in orders_docs]
            
            total_orders = len(orders)
            total_revenue = sum(order.get("total", 0) for order in orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            status_counts = {}
            for order in orders:
                status = order.get("status", "pending")
                status_counts[status] = status_counts.get(status, 0) + 1
            
            return {
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "average_order_value": avg_order_value,
                "status_breakdown": status_counts,
                "period": {
                    "start_date": start_date,
                    "end_date": end_date
                }
            }
    except Exception as e:
        raise HTTPException(500, f"Error fetching order analytics: {str(e)}")

@app.get("/analytics/performance")
async def get_performance_metrics(
    current_user: User = Depends(require_any_role),
    db: Session = Depends(get_db)
):
    """Get performance metrics for dashboard"""
    try:
        if check_database_connection():
            # Calculate delivery performance metrics
            completed_orders = db.query(OrderModel).filter(
                OrderModel.status == OrderStatus.DELIVERED
            ).count()
            
            total_orders = db.query(OrderModel).count()
            completion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
            
            # Calculate active driver utilization
            active_drivers = db.query(DriverModel).filter(
                DriverModel.status == DriverStatus.ACTIVE
            ).count()
            
            busy_drivers = db.query(DriverModel).filter(
                DriverModel.status == DriverStatus.BUSY
            ).count()
            
            driver_utilization = (busy_drivers / active_drivers * 100) if active_drivers > 0 else 0
            
            return {
                "completion_rate": completion_rate,
                "driver_utilization": driver_utilization,
                "active_drivers": active_drivers,
                "total_orders": total_orders,
                "completed_orders": completed_orders,
                "timestamp": datetime.now().isoformat()
            }
        else:
            # Mock performance metrics
            return {
                "completion_rate": random.uniform(75, 95),
                "driver_utilization": random.uniform(60, 85),
                "active_drivers": random.randint(8, 15),
                "total_orders": random.randint(50, 150),
                "completed_orders": random.randint(35, 120),
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        raise HTTPException(500, f"Error fetching performance metrics: {str(e)}")

# -- Real-time Status Updates --
@app.put("/drivers/{driver_id}/status")
async def update_driver_status(
    driver_id: str, 
    status: str, 
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Update driver status (active, inactive, busy)"""
    try:
        if check_database_connection():
            driver = db.query(DriverModel).filter(DriverModel.id == driver_id).first()
            if not driver:
                raise HTTPException(404, "Driver not found")
            
            from app.models import DriverStatus
            status_enum = getattr(DriverStatus, status.upper(), None)
            if not status_enum:
                raise HTTPException(400, f"Invalid status: {status}")
            
            driver.status = status_enum
            driver.updated_at = datetime.now()
            db.commit()
            
            return {"message": "Driver status updated successfully", "status": status}
        else:
            doc_ref = mock_db.collection("drivers").document(driver_id)
            if not doc_ref.get().exists:
                raise HTTPException(404, "Driver not found")
            
            doc_ref.update({"status": status, "updated_at": datetime.now()})
            return {"message": "Driver status updated successfully", "status": status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating driver status: {str(e)}")

@app.put("/merchants/{merchant_id}/status")
async def update_merchant_status(
    merchant_id: str, 
    status: str, 
    current_user: User = Depends(require_admin_or_manager),
    db: Session = Depends(get_db)
):
    """Update merchant status (online, offline)"""
    try:
        if check_database_connection():
            merchant = db.query(MerchantModel).filter(MerchantModel.id == merchant_id).first()
            if not merchant:
                raise HTTPException(404, "Merchant not found")
            
            from app.models import MerchantStatus
            status_enum = getattr(MerchantStatus, status.upper(), None)
            if not status_enum:
                raise HTTPException(400, f"Invalid status: {status}")
            
            merchant.status = status_enum
            merchant.updated_at = datetime.now()
            db.commit()
            
            return {"message": "Merchant status updated successfully", "status": status}
        else:
            doc_ref = mock_db.collection("merchants").document(merchant_id)
            if not doc_ref.get().exists:
                raise HTTPException(404, "Merchant not found")
            
            doc_ref.update({"status": status, "updated_at": datetime.now()})
            return {"message": "Merchant status updated successfully", "status": status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error updating merchant status: {str(e)}")

# ==========================================
# COGNITO USER/ROLE MANAGEMENT
# ==========================================

@app.get("/admin/cognito/users")
async def list_cognito_users(
    current_user = Depends(require_cognito_admin)
):
    """List all Cognito users with their groups (Admins only)"""
    raw_users = list_users()
    users = []
    for u in raw_users:
        username = u.get('Username')
        groups = get_user_groups(username)
        
        # Extract user attributes
        user_attrs = {}
        for attr in u.get('UserAttributes', []):
            user_attrs[attr['Name']] = attr['Value']
        
        users.append({
            'username': username,
            'groups': groups,
            'email': user_attrs.get('email', ''),
            'name': user_attrs.get('name', ''),
            'enabled': u.get('Enabled', True),
            'user_status': u.get('UserStatus', ''),
            'created_date': u.get('UserCreateDate'),
            'modified_date': u.get('UserLastModifiedDate')
        })
    return {"users": users}

@app.post("/admin/cognito/users/{username}/groups/{group_name}")
async def add_user_group(
    username: str,
    group_name: str,
    current_user = Depends(require_cognito_admin)
):
    """Grant a Cognito group to a user (Admins only)"""
    admin_add_user_to_group(username, group_name)
    return {"message": f"Added {username} to {group_name}"}

@app.delete("/admin/cognito/users/{username}/groups/{group_name}")
async def remove_user_group(
    username: str,
    group_name: str,
    current_user = Depends(require_cognito_admin)
):
    """Revoke a Cognito group from a user (Admins only)"""
    admin_remove_user_from_group(username, group_name)
    return {"message": f"Removed {username} from {group_name}"}

@app.post("/admin/cognito/users")
async def create_cognito_user(
    user_data: dict,
    current_user = Depends(require_cognito_admin)
):
    """Create a new Cognito user (Admins only)"""
    try:
        from app.cognito import get_db_client
        import boto3
        
        client = get_db_client()
        
        username = user_data.get('username')
        email = user_data.get('email')
        password = user_data.get('password')
        full_name = user_data.get('full_name', '')
        
        if not username or not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username, email, and password are required"
            )
        
        # Create user in Cognito
        response = client.admin_create_user(
            UserPoolId=config.COGNITO_USER_POOL_ID,
            Username=username,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'email_verified', 'Value': 'true'},
                {'Name': 'name', 'Value': full_name}
            ],
            TemporaryPassword=password,
            MessageAction='SUPPRESS'  # Don't send welcome email
        )
        
        # Set permanent password
        client.admin_set_user_password(
            UserPoolId=config.COGNITO_USER_POOL_ID,
            Username=username,
            Password=password,
            Permanent=True
        )
        
        return {
            "success": True,
            "message": f"User '{username}' created successfully",
            "user": {
                "username": username,
                "email": email,
                "full_name": full_name
            }
        }
        
    except client.exceptions.UsernameExistsException:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    except Exception as e:
        print(f"Error creating Cognito user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@app.delete("/admin/cognito/users/{username}")
async def delete_cognito_user(
    username: str,
    current_user = Depends(require_cognito_admin)
):
    """Delete a Cognito user (Admins only)"""
    try:
        from app.cognito import get_db_client
        
        client = get_db_client()
        
        # Delete user from Cognito
        client.admin_delete_user(
            UserPoolId=config.COGNITO_USER_POOL_ID,
            Username=username
        )
        
        return {"message": f"User '{username}' deleted successfully"}
        
    except client.exceptions.UserNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        print(f"Error deleting Cognito user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

@app.post("/admin/cognito/groups")
async def create_cognito_group(
    group_data: dict,
    current_user = Depends(require_cognito_admin)
):
    """Create a new Cognito group (Admins only)"""
    try:
        from app.cognito import get_db_client
        
        client = get_db_client()
        group_name = group_data.get('group_name')
        description = group_data.get('description', '')
        
        if not group_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group name is required"
            )
        
        client.create_group(
            GroupName=group_name,
            UserPoolId=config.COGNITO_USER_POOL_ID,
            Description=description
        )
        
        return {"message": f"Group '{group_name}' created successfully"}
        
    except client.exceptions.GroupExistsException:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group already exists"
        )
    except Exception as e:
        print(f"Error creating Cognito group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create group: {str(e)}"
        )

# -- Search and Filter Endpoints --
@app.get("/search")
async def global_search(
    q: str,  # Changed from 'query' to 'q' to match test
    type: Optional[str] = None,  # orders, merchants, drivers, customers
    limit: int = 20,
    current_user: User = Depends(require_any_role),
    db: Session = Depends(get_db)
):
    """Global search across all entities"""
    try:
        results = {"orders": [], "merchants": [], "drivers": [], "customers": []}
        
        if check_database_connection():
            # Search in real database
            if not type or type == "orders":
                orders = db.query(OrderModel).filter(
                    OrderModel.id.contains(q)
                ).limit(limit).all()
                results["orders"] = [order.id for order in orders]
            
            if not type or type == "merchants":
                merchants = db.query(MerchantModel).filter(
                    MerchantModel.name.contains(q)
                ).limit(limit).all()
                results["merchants"] = [merchant.name for merchant in merchants]
                
            if not type or type == "drivers":
                drivers = db.query(DriverModel).filter(
                    DriverModel.name.contains(q)
                ).limit(limit).all()
                results["drivers"] = [driver.name for driver in drivers]
                
            if not type or type == "customers":
                customers = db.query(CustomerModel).filter(
                    CustomerModel.name.contains(q)
                ).limit(limit).all()
                results["customers"] = [customer.name for customer in customers]
        else:
            # Search in mock database
            mock_results = {
                "orders": [f"Order-{q}-001", f"Order-{q}-002"],
                "merchants": [f"Merchant matching '{q}'"],
                "drivers": [f"Driver matching '{q}'"],
                "customers": [f"Customer matching '{q}'"]
            }
            
            if type:
                results[type] = mock_results.get(type, [])
            else:
                results = mock_results
        
        return results
    except Exception as e:
        raise HTTPException(500, f"Error performing search: {str(e)}")

# Mount static files directory
# Try multiple potential paths for static files (local dev vs Lambda)
static_paths = [
    os.path.join(os.path.dirname(__file__), "..", "static"),  # Local development
    os.path.join("/var/task", "static"),  # Lambda environment
    os.path.join(os.getcwd(), "static"),  # Current working directory
]

static_dir = None
for path in static_paths:
    if os.path.exists(path):
        static_dir = path
        break

if static_dir:
    print(f"📁 Static files directory found: {static_dir}")
    
    # Custom static file handler with proper UTF-8 encoding for HTML files
    @app.get("/static/{file_path:path}")
    async def serve_static_with_utf8(file_path: str):
        """Serve static files with proper UTF-8 encoding for HTML files"""
        from fastapi.responses import FileResponse
        import mimetypes
        
        file_full_path = os.path.join(static_dir, file_path)
        
        if not os.path.exists(file_full_path):
            raise HTTPException(404, "File not found")
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_full_path)
        
        # For HTML files, ensure UTF-8 encoding is specified
        if file_path.endswith('.html') or content_type == 'text/html':
            return FileResponse(
                file_full_path,
                media_type="text/html; charset=utf-8",
                headers={"Content-Type": "text/html; charset=utf-8"}
            )
        else:
            return FileResponse(file_full_path, media_type=content_type)
else:
    print("⚠️  Static files directory not found")

# Root route - serve login page and let frontend handle routing
@app.get("/")
async def root():
    """Serve the login page (frontend will handle authentication routing)"""
    from fastapi.responses import FileResponse
    
    # Try multiple potential paths for static files
    static_paths = [
        os.path.join(os.path.dirname(__file__), "..", "static"),  # Local development
        os.path.join("/var/task", "static"),  # Lambda environment
        os.path.join(os.getcwd(), "static"),  # Current working directory
    ]
    
    for static_dir in static_paths:
        login_file = os.path.join(static_dir, "login.html")
        if os.path.exists(login_file):
            return FileResponse(
                login_file, 
                media_type="text/html; charset=utf-8",
                headers={"Content-Type": "text/html; charset=utf-8"}
            )
    
    return {"message": "Welcome to Centralized Delivery Platform API", "note": "Login page not found in static directory"}

# Dashboard route
@app.get("/dashboard")
async def dashboard():
    """Serve the dashboard page"""
    from fastapi.responses import FileResponse
    
    static_paths = [
        os.path.join(os.path.dirname(__file__), "..", "static"),  # Local development
        os.path.join("/var/task", "static"),  # Lambda environment
        os.path.join(os.getcwd(), "static"),  # Current working directory
    ]
    
    for static_dir in static_paths:
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(
                index_file, 
                media_type="text/html; charset=utf-8",
                headers={"Content-Type": "text/html; charset=utf-8"}
            )
    
    raise HTTPException(404, "Dashboard not found")

# Serve login page directly
@app.get("/login")
async def login_page():
    """Serve the login page"""
    from fastapi.responses import FileResponse
    
    # Try multiple potential paths for static files
    static_paths = [
        os.path.join(os.path.dirname(__file__), "..", "static"),  # Local development
        os.path.join("/var/task", "static"),  # Lambda environment
        os.path.join(os.getcwd(), "static"),  # Current working directory
    ]
    
    for static_dir in static_paths:
        login_file = os.path.join(static_dir, "login.html")
        if os.path.exists(login_file):
            return FileResponse(
                login_file, 
                media_type="text/html; charset=utf-8",
                headers={"Content-Type": "text/html; charset=utf-8"}
            )
    
    raise HTTPException(404, "Login page not found")

# Mangum handler removed - now handled in lambda_handler.py
