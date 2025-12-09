#!/usr/bin/env python3
"""
Script to create a test admin user for testing authentication
"""
from app import create_app
from models import User
from database import get_db

def create_test_user():
    """Create a test admin user"""
    app = create_app()
    
    with app.app_context():
        # Test user credentials
        test_email = "test@example.com"
        test_password = "Test123!@#"
        test_username = "testadmin"
        
        # Check if user already exists
        existing_user = User.find_by_email(test_email)
        if existing_user:
            print(f"⚠️  User with email '{test_email}' already exists!")
            print(f"   Updating password...")
            existing_user.set_password(test_password)
            existing_user.is_approved = True
            existing_user.save()
            print(f"✅ Password updated for existing user!")
        else:
            # Create new test user
            user = User(
                username=test_username,
                email=test_email,
                business_name="Test Business",
                gst_number="00TEST00000T1Z5",
                business_address="123 Test Street, Test City",
                business_phone="9876543210",
                business_email=test_email,
                business_state="Delhi",
                business_pincode="110001",
                business_reason="Test account for development",
                is_approved=True
            )
            user.set_password(test_password)
            user.save()
            
            if user.id:
                print(f"✅ Test user created successfully!")
            else:
                print(f"❌ Failed to create user!")
                return
        
        print("\n" + "="*50)
        print("📋 TEST USER CREDENTIALS")
        print("="*50)
        print(f"Email:    {test_email}")
        print(f"Password: {test_password}")
        print(f"Username: {test_username}")
        print("="*50)
        print("\n✅ You can now use these credentials to login!")
        print("   Make sure your backend is running on http://localhost:5000")
        print("   and your frontend is running on http://localhost:5173")

if __name__ == "__main__":
    try:
        create_test_user()
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        import traceback
        traceback.print_exc()

