#!/usr/bin/env python3
"""
Enhanced Merchant Data Seeder
Seeds the DynamoDB table with sample merchant data supporting 4 merchant types
"""

import boto3
import json
import uuid
from datetime import datetime, timedelta
import random
import argparse
import sys

# Sample merchant data with new schema
SAMPLE_MERCHANTS = [
    {
        "businessName": "Al-Nakheel Restaurant",
        "ownerFirstName": "Ahmed",
        "ownerLastName": "Al-Rashid",
        "email": "ahmed.rashid@alnakheel.com",
        "phoneNumber": "+966501234567",
        "merchantType": "restaurant",
        "address": {
            "street": "King Fahd Road, Al-Olaya District",
            "city": "Riyadh",
            "district": "Al-Olaya",
            "postalCode": "12214"
        },
        "description": "Traditional Arabic cuisine with modern presentation",
        "status": "approved"
    },
    {
        "businessName": "Fresh Valley Supermarket",
        "ownerFirstName": "Fatima",
        "ownerLastName": "Al-Zahra",
        "email": "fatima.zahra@freshvalley.com",
        "phoneNumber": "+966507654321",
        "merchantType": "store",
        "address": {
            "street": "Al-Tahlia Street, Al-Sahafa District",
            "city": "Riyadh",
            "district": "Al-Sahafa",
            "postalCode": "13315"
        },
        "description": "Fresh groceries and household items",
        "status": "approved"
    },
    {
        "businessName": "Seha Pharmacy",
        "ownerFirstName": "Dr. Mohammed",
        "ownerLastName": "Al-Harbi",
        "email": "mohammed.harbi@sehapharm.com",
        "phoneNumber": "+966501111222",
        "merchantType": "pharmacy",
        "address": {
            "street": "Al-Madinah Road, Al-Naseem District",
            "city": "Riyadh",
            "district": "Al-Naseem",
            "postalCode": "14323"
        },
        "description": "Full-service pharmacy with medical consultations",
        "licenseNumber": "PH-2024-001",
        "status": "approved"
    },
    {
        "businessName": "Mama's Kitchen",
        "ownerFirstName": "Sara",
        "ownerLastName": "Al-Mansouri",
        "email": "sara.mansouri@mamaskitchen.com",
        "phoneNumber": "+966509876543",
        "merchantType": "cloud_kitchen",
        "address": {
            "street": "Industrial Area, Al-Washm District",
            "city": "Riyadh",
            "district": "Al-Washm",
            "postalCode": "15432"
        },
        "description": "Home-style cooking delivered to your door",
        "status": "approved"
    },
    {
        "businessName": "Spice Route Restaurant",
        "ownerFirstName": "Omar",
        "ownerLastName": "Al-Kindi",
        "email": "omar.kindi@spiceroute.com",
        "phoneNumber": "+966503456789",
        "merchantType": "restaurant",
        "address": {
            "street": "Olaya Street, Al-Malaz District",
            "city": "Riyadh",
            "district": "Al-Malaz",
            "postalCode": "11461"
        },
        "description": "International cuisine with local flavors",
        "status": "pending"
    },
    {
        "businessName": "Digital Electronics",
        "ownerFirstName": "Khalid",
        "ownerLastName": "Al-Otaibi",
        "email": "khalid.otaibi@digitalelec.com",
        "phoneNumber": "+966502345678",
        "merchantType": "store",
        "address": {
            "street": "Computer Street, Al-Malaz District",
            "city": "Riyadh",
            "district": "Al-Malaz",
            "postalCode": "11432"
        },
        "description": "Latest electronics and gadgets",
        "status": "pending"
    },
    {
        "businessName": "Green Pharmacy",
        "ownerFirstName": "Dr. Layla",
        "ownerLastName": "Al-Sudairi",
        "email": "layla.sudairi@greenpharm.com",
        "phoneNumber": "+966508765432",
        "merchantType": "pharmacy",
        "address": {
            "street": "Al-Andalus Street, Al-Andalus District",
            "city": "Riyadh",
            "district": "Al-Andalus",
            "postalCode": "13241"
        },
        "description": "Eco-friendly pharmacy with natural remedies",
        "licenseNumber": "PH-2024-002",
        "status": "rejected"
    },
    {
        "businessName": "Quick Bites Kitchen",
        "ownerFirstName": "Amina",
        "ownerLastName": "Al-Dosari",
        "email": "amina.dosari@quickbites.com",
        "phoneNumber": "+966504567890",
        "merchantType": "cloud_kitchen",
        "address": {
            "street": "Al-Kharj Road, Al-Faisaliyah District",
            "city": "Riyadh",
            "district": "Al-Faisaliyah",
            "postalCode": "16432"
        },
        "description": "Fast food and snacks for busy people",
        "status": "suspended"
    }
]

def generate_merchant_data(base_data, created_days_ago=0):
    """Generate a merchant record with proper schema"""
    merchant_id = str(uuid.uuid4())
    created_at = (datetime.now() - timedelta(days=created_days_ago)).isoformat()
    
    merchant = {
        "merchantId": merchant_id,
        "businessName": base_data["businessName"],
        "ownerFirstName": base_data["ownerFirstName"],
        "ownerLastName": base_data["ownerLastName"],
        "email": base_data["email"],
        "phoneNumber": base_data["phoneNumber"],
        "merchantType": base_data["merchantType"],
        "address": base_data["address"],
        "district": base_data["address"]["district"],  # For GSI
        "status": base_data["status"],
        "createdAt": created_at,
        "updatedAt": created_at,
        "description": base_data.get("description", "")
    }
    
    # Add type-specific fields
    if base_data["merchantType"] == "pharmacy" and "licenseNumber" in base_data:
        merchant["licenseNumber"] = base_data["licenseNumber"]
    
    # Add review information for non-pending merchants
    if base_data["status"] != "pending":
        merchant["reviewedBy"] = "admin@delivery.com"
        merchant["reviewNotes"] = get_review_notes(base_data["status"])
        merchant["reviewedAt"] = (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
    
    return merchant

def get_review_notes(status):
    """Generate appropriate review notes based on status"""
    notes = {
        "approved": [
            "All documents verified and approved",
            "Business license valid and current",
            "Meets all platform requirements",
            "Welcome to our platform!"
        ],
        "rejected": [
            "Missing required documentation",
            "Business license expired",
            "Does not meet platform standards",
            "Please resubmit with correct documents"
        ],
        "suspended": [
            "Account temporarily suspended due to policy violation",
            "Multiple customer complaints received",
            "Under review for compliance issues"
        ]
    }
    return random.choice(notes.get(status, ["Status updated"]))

def seed_merchants(table_name, region):
    """Seed the DynamoDB table with sample merchant data"""
    try:
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)
        
        print(f"🌱 Seeding merchants to table: {table_name}")
        print(f"📍 Region: {region}")
        
        # Check if table exists
        try:
            table.load()
        except Exception as e:
            print(f"❌ Error: Table {table_name} not found or not accessible")
            print(f"   {str(e)}")
            return False
        
        # Seed each merchant
        seeded_count = 0
        for i, merchant_data in enumerate(SAMPLE_MERCHANTS):
            try:
                merchant = generate_merchant_data(merchant_data, created_days_ago=random.randint(1, 60))
                
                # Put item in table
                table.put_item(Item=merchant)
                
                print(f"✅ Seeded: {merchant['businessName']} ({merchant['merchantType']}) - {merchant['status']}")
                seeded_count += 1
                
            except Exception as e:
                print(f"❌ Error seeding {merchant_data['businessName']}: {str(e)}")
        
        print(f"\n🎉 Successfully seeded {seeded_count} merchants!")
        
        # Print summary
        print("\n📊 Merchant Summary:")
        merchant_types = {}
        statuses = {}
        
        for merchant in SAMPLE_MERCHANTS:
            merchant_types[merchant['merchantType']] = merchant_types.get(merchant['merchantType'], 0) + 1
            statuses[merchant['status']] = statuses.get(merchant['status'], 0) + 1
        
        print("   By Type:")
        for merchant_type, count in merchant_types.items():
            print(f"   - {merchant_type}: {count}")
        
        print("   By Status:")
        for status, count in statuses.items():
            print(f"   - {status}: {count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during seeding: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Seed DynamoDB table with sample merchant data')
    parser.add_argument('--table-name', required=True, help='DynamoDB table name')
    parser.add_argument('--region', default='us-east-1', help='AWS region')
    parser.add_argument('--profile', help='AWS profile to use')
    
    args = parser.parse_args()
    
    # Set up AWS session
    if args.profile:
        session = boto3.Session(profile_name=args.profile)
        boto3.setup_default_session(profile_name=args.profile)
    
    # Seed the table
    success = seed_merchants(args.table_name, args.region)
    
    if success:
        print("\n🚀 Merchant seeding completed successfully!")
        print("   You can now test the merchant management interface.")
        sys.exit(0)
    else:
        print("\n💥 Merchant seeding failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()