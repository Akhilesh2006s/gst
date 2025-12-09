#!/usr/bin/env python3
"""
Script to create a test admin user for testing authentication
"""
from app import create_app
from models import User
from database import get_db
import random
import string

def generate_unique_gst():
    """Generate a unique GST number"""
    db = get_db()
    if db is None:
        return None
    
    max_attempts = 100
    for _ in range(max_attempts):
        # Generate a random GST number
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
        gst_number = f"00TEST{random_part}"
        
        # Check if it exists
        existing = User.find_by_gst_number(gst_number)
        if not existing:
            return gst_number
    
    return None

def create_test_user():
    """Create a test admin user"""
    app = create_app()
    
    with app.app_context():
        # Test user credentials
        test_email = "amenityforgetest@gmail.com"
        test_password = "12345678"
        test_username = "amenityforgetest"
        
        # Check if user already exists
        existing_user = User.find_by_email(test_email)
        if existing_user:
            print(f"[INFO] User with email '{test_email}' already exists!")
            print(f"       Updating password...")
            existing_user.set_password(test_password)
            existing_user.is_approved = True
            existing_user.is_active = True
            existing_user.save()
            print(f"[SUCCESS] Password updated for existing user!")
        else:
            # Generate unique GST number
            gst_number = generate_unique_gst()
            if not gst_number:
                print("[ERROR] Failed to generate unique GST number!")
                return
            
            # Create new test user
            user = User(
                username=test_username,
                email=test_email,
                business_name="Test Business",
                gst_number=gst_number,
                business_address="123 Test Street, Test City",
                business_phone="9876543210",
                business_email=test_email,
                business_state="Delhi",
                business_pincode="110001",
                business_reason="Test account for development",
                is_approved=True,
                is_active=True
            )
            user.set_password(test_password)
            user.save()
            
            if user.id:
                print(f"[SUCCESS] Test user created successfully!")
            else:
                print(f"[ERROR] Failed to create user!")
                return
        
        print("\n" + "="*50)
        print("TEST USER CREDENTIALS")
        print("="*50)
        print(f"Email:    {test_email}")
        print(f"Password: {test_password}")
        print(f"Username: {test_username}")
        print("="*50)
        print("\n[SUCCESS] You can now use these credentials to login!")
        print("         Make sure your backend is running on http://localhost:5000")
        print("         and your frontend is running on http://localhost:5173")

if __name__ == "__main__":
    try:
        create_test_user()
    except Exception as e:
        print(f"[ERROR] Error creating test user: {e}")
        import traceback
        traceback.print_exc()

