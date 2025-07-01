from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
from app.db import db
from app.schemas import Merchant, Driver, Customer, Order

app = FastAPI()

def to_dict(doc):
    data = doc.to_dict()
    data["id"] = doc.id
    return data

# -- Merchants CRUD --
@app.post("/merchants", response_model=Merchant)
async def create_merchant(m: Merchant):
    ref = db.collection("merchants").add(m.dict(exclude={"id"}))
    m.id = ref[1].id
    return m

@app.get("/merchants/{mid}", response_model=Merchant)
async def get_merchant(mid: str):
    doc = db.collection("merchants").document(mid).get()
    if not doc.exists:
        raise HTTPException(404, "Merchant not found")
    return to_dict(doc)

@app.put("/merchants/{mid}", response_model=Merchant)
async def update_merchant(mid: str, m: Merchant):
    db.collection("merchants").document(mid).set(m.dict(exclude={"id"}), merge=True)
    m.id = mid
    return m

@app.delete("/merchants/{mid}")
async def delete_merchant(mid: str):
    db.collection("merchants").document(mid).delete()
    return {"deleted": True}

# -- Dashboard Statistics Endpoints --
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get real-time dashboard statistics for all cards"""
    try:
        # Get today's date for filtering orders
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Count total orders today
        orders_today = len(list(db.collection("orders").where(
            "created_at", ">=", today
        ).stream()))
        
        # Count connected merchants (assuming status field exists)
        merchants_docs = list(db.collection("merchants").stream())
        total_merchants = len(merchants_docs)
        connected_merchants = len([m for m in merchants_docs 
                                 if to_dict(m).get("status") == "online"])
        
        # Count active drivers (assuming status field exists)
        drivers_docs = list(db.collection("drivers").stream())
        active_drivers = len([d for d in drivers_docs 
                            if to_dict(d).get("status") == "active"])
        
        # Count total customers
        total_customers = len(list(db.collection("customers").stream()))
        
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

@app.get("/api/dashboard/orders-today")
async def get_orders_today():
    """Get today's orders count"""
    try:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        orders = list(db.collection("orders").where("created_at", ">=", today).stream())
        return {"count": len(orders), "orders": [to_dict(order) for order in orders]}
    except Exception as e:
        raise HTTPException(500, f"Error fetching today's orders: {str(e)}")

@app.get("/api/dashboard/merchants-status")
async def get_merchants_status():
    """Get merchants connection status"""
    try:
        merchants = list(db.collection("merchants").stream())
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

@app.get("/api/dashboard/drivers-status") 
async def get_drivers_status():
    """Get drivers activity status"""
    try:
        drivers = list(db.collection("drivers").stream())
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

@app.get("/api/dashboard/customers-count")
async def get_customers_count():
    """Get total customers count"""
    try:
        customers = list(db.collection("customers").stream())
        return {
            "total": len(customers),
            "customers": [to_dict(customer) for customer in customers]
        }
    except Exception as e:
        raise HTTPException(500, f"Error fetching customers count: {str(e)}")

@app.get("/api/dashboard/recent-activity")
async def get_recent_activity():
    """Get recent system activity for dashboard"""
    try:
        # Get recent orders
        recent_orders = list(db.collection("orders").stream())[-5:]  # Last 5 orders
        
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
@app.post("/api/seed-data")
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
            db.collection("merchants").add(merchant)
            merchants_added += 1
        
        # Add drivers
        drivers_added = 0
        for driver in sample_drivers:
            db.collection("drivers").add(driver)
            drivers_added += 1
        
        # Add customers
        customers_added = 0
        for customer in sample_customers:
            db.collection("customers").add(customer)
            customers_added += 1
        
        # Add sample orders for today
        orders_added = 0
        merchant_refs = list(db.collection("merchants").stream())
        customer_refs = list(db.collection("customers").stream())
        
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
                db.collection("orders").add(order)
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

# Mount static files after all API routes to avoid conflicts
app.mount(
    "/", 
    StaticFiles(directory="static", html=True),
    name="static"
)
