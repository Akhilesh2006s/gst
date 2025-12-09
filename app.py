from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
from config import config
from database import init_app as init_db, get_db
from flask_login import LoginManager
from models import User
from datetime import timedelta

# Routes
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.customer_routes import customer_bp
from routes.product_routes import product_bp
from routes.invoice_routes import invoice_bp
from routes.gst_routes import gst_bp
from routes.report_routes import report_bp
from routes.customer_auth_routes import customer_auth_bp
from routes.super_admin_routes import super_admin_bp
from routes.admin_routes import admin_bp
from routes.import_export_routes import import_export_bp


def create_app(config_name="development"):
    app = Flask(__name__, static_folder="frontend/dist", template_folder="frontend/dist")
    app.config.from_object(config[config_name])
    
    # Environment detection
    is_development = (
        config_name == "development"
        or app.config.get("FLASK_ENV") == "development"
        or os.environ.get("RAILWAY_ENVIRONMENT") is None
    )
    is_production = not is_development

    if "railway" in os.environ.get("RAILWAY_ENVIRONMENT", "").lower():
        is_production = True
        is_development = False
        print("[CONFIG] Railway environment detected → Production mode enabled")

    # SESSION CONFIG (CHIPS ENABLED)
    app.config["SESSION_COOKIE_NAME"] = "session_id"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_PERMANENT"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)
    app.config["SESSION_COOKIE_DOMAIN"] = None
    app.config["SESSION_COOKIE_PATH"] = "/"

    if is_production:
        app.config["SESSION_COOKIE_SECURE"] = True
        app.config["SESSION_COOKIE_SAMESITE"] = "None"  # required for cross-site cookie
    else:
        app.config["SESSION_COOKIE_SECURE"] = False
        app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    print("\n--- SESSION CONFIG ---")
    print("Secure:", app.config["SESSION_COOKIE_SECURE"])
    print("SameSite:", app.config["SESSION_COOKIE_SAMESITE"])
    print("HttpOnly:", app.config["SESSION_COOKIE_HTTPONLY"])
    print("Production:", is_production)
    print("-----------------------\n")

    # CORS CONFIG - Allow all origins for testing (you can restrict this later)
    # For production, you should specify exact origins
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://gst-sable.vercel.app",
        "https://gst-frontend-bay.vercel.app",
        "https://web-production-f50e6.up.railway.app",  # Railway backend (for testing)
    ]
    
    # Allow all origins for testing - remove this in production
    allow_all_origins = os.environ.get("ALLOW_ALL_ORIGINS", "true").lower() == "true"

    # Initialize CORS - we'll override headers in after_request for dynamic origin support
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/api/*": {
                "origins": allowed_origins,  # Base list, will be overridden dynamically
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept"],
                "expose_headers": ["Set-Cookie"],
            }
        },
    )
    
    if allow_all_origins:
        print(f"[CORS] Allowing all origins for testing (will be set dynamically)")
    else:
        print(f"[CORS] Allowed origins: {allowed_origins}")

    # DATABASE + SESSION STORAGE
    try:
        db = init_db(app)
        print("MongoDB connected successfully")
        
        from mongodb_session import MongoDBSessionInterface
        app.session_interface = MongoDBSessionInterface(
            db=get_db(),
            collection="sessions",
            key_prefix="session:"
        )
        print("MongoDB session storage enabled")

    except Exception as e:
        print("⚠ MongoDB session error, using fallback cookies:", e)

    # LOGIN MANAGER
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = None
    
    @login_manager.user_loader
    def load_user(user_id):
        from models import SuperAdmin, Customer
        return (
            SuperAdmin.find_by_id(user_id)
            or User.find_by_id(user_id)
            or Customer.find_by_id(user_id)
        )

    # REGISTER BLUEPRINTS
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(customer_bp, url_prefix="/api/customers")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(invoice_bp, url_prefix="/api/invoices")
    app.register_blueprint(gst_bp, url_prefix="/api/gst")
    app.register_blueprint(report_bp, url_prefix="/api/reports")
    app.register_blueprint(customer_auth_bp, url_prefix="/api/customer-auth")
    app.register_blueprint(super_admin_bp, url_prefix="/api/super-admin")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(import_export_bp, url_prefix="/api")

    # ⭐ CORS AND COOKIE FIX - Must be after blueprints
    @app.after_request
    def add_cors_and_cookie_headers(response):
        """Add CORS headers and fix cookies for cross-origin requests"""
        # Get the origin from the request
        origin = request.headers.get('Origin')
        
        # Set CORS headers explicitly
        # NOTE: Cannot use wildcard (*) with credentials, must use specific origin
        if origin:
            # For testing, allow any origin that requests
            if allow_all_origins:
                # Allow any origin for testing
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
                response.headers['Access-Control-Expose-Headers'] = 'Set-Cookie'
            elif origin in allowed_origins:
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
                response.headers['Access-Control-Expose-Headers'] = 'Set-Cookie'
        
        # Fix cookies for cross-origin
        cookies = response.headers.getlist("Set-Cookie")
        
        if cookies:
            # Remove all existing Set-Cookie headers
            response.headers.pop("Set-Cookie", None)
            
            # Re-add each cookie with proper attributes
            for cookie in cookies:
                if "session_id=" in cookie:
                    # Ensure SameSite=None and Secure for cross-origin
                    if is_production and "SameSite=None" not in cookie:
                        cookie += "; SameSite=None"
                    if is_production and "Secure" not in cookie:
                        cookie += "; Secure"
                    # Add Partitioned for Chrome third-party cookie support
                    if "Partitioned" not in cookie:
                        cookie += "; Partitioned"
                    print(f"[COOKIE] Fixed session cookie: {cookie[:100]}...")
                response.headers.add("Set-Cookie", cookie)
        
        return response

    # HEALTH CHECK
    @app.route("/health")
    def health():
        return jsonify({"status": "healthy"}), 200

    # Serve frontend
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        file_path = os.path.join(app.static_folder, path)

        if path != "" and os.path.exists(file_path):
            return send_from_directory(app.static_folder, path)

        return send_from_directory(app.static_folder, "index.html")
    
    return app


if __name__ == "__main__":
    env = os.environ.get("FLASK_ENV", "development")
    app = create_app(env)
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=(env == "development"), host="0.0.0.0", port=port)
