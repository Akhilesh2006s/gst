from flask import Flask, send_from_directory, jsonify, request, send_file, make_response
from flask_cors import CORS
import os
from config import config
from database import init_app as init_db, get_db
from flask_login import LoginManager
from models import User
from io import BytesIO
from datetime import timedelta
import datetime

# Import routes
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


def create_app(config_name='development'):
    app = Flask(__name__, static_folder='frontend/dist', template_folder='frontend/dist')
    app.config.from_object(config[config_name])
    
    # -------------------------------------------------
    # SESSION COOKIE CONFIG (IMPORTANT)
    # -------------------------------------------------
    # Check if we're in production (Railway) or development
    # Railway sets FLASK_ENV=production or we can check for Railway-specific env vars
    is_development = (
        config_name == 'development' or 
        app.config.get('FLASK_ENV') == 'development' or
        os.environ.get('RAILWAY_ENVIRONMENT') is None  # Railway sets this
    )
    is_production = not is_development
    
    # Force production mode if running on Railway (HTTPS)
    if 'railway' in os.environ.get('RAILWAY_ENVIRONMENT', '').lower() or 'railway' in os.environ.get('HOSTNAME', '').lower():
        is_production = True
        is_development = False
        print("[CONFIG] Detected Railway environment - forcing production mode")

    app.config["SESSION_COOKIE_NAME"] = "session_id"
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_PERMANENT"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

    if is_production:
        # PRODUCTION (Railway → HTTPS)
        app.config["SESSION_COOKIE_SECURE"] = True
        app.config["SESSION_COOKIE_SAMESITE"] = "None"
    else:
        # LOCAL DEVELOPMENT (HTTP → cannot use SameSite=None)
        app.config["SESSION_COOKIE_SECURE"] = False
        app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    app.config["SESSION_COOKIE_DOMAIN"] = None
    app.config["SESSION_COOKIE_PATH"] = "/"

    print("\n--- SESSION CONFIG ---")
    print("Secure:", app.config["SESSION_COOKIE_SECURE"])
    print("SameSite:", app.config["SESSION_COOKIE_SAMESITE"])
    print("HttpOnly:", app.config["SESSION_COOKIE_HTTPONLY"])
    print("Development:", is_development)
    print("-----------------------\n")

    # -------------------------------------------------
    # CORS CONFIG - MANUAL HANDLING (Flask-CORS is unreliable)
    # -------------------------------------------------
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://gst-sable.vercel.app",
        "https://gst-frontend-bay.vercel.app",
    ]
    
    # Handle CORS preflight requests
    @app.before_request
    def handle_cors_preflight():
        if request.method == 'OPTIONS':
            origin = request.headers.get('Origin')
            if origin:
                response = make_response('', 200)
                response.headers['Access-Control-Allow-Origin'] = origin
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
                response.headers['Access-Control-Max-Age'] = '86400'
                print(f"[CORS] Preflight handled for origin: {origin}")
                return response
    
    # CRITICAL: Manual CORS header setting - ALWAYS runs for API routes
    # This replaces Flask-CORS completely to ensure headers are ALWAYS set
    @app.after_request
    def set_cors_headers(response):
        origin = request.headers.get('Origin')
        path = request.path
        
        # Only process API routes
        if not path.startswith('/api/'):
            return response
        
        print(f"[CORS] ========== SETTING CORS HEADERS ==========")
        print(f"[CORS] Path: {path}, Method: {request.method}")
        print(f"[CORS] Origin: {origin}")
        
        # ALWAYS set headers if origin exists
        if origin:
            # Check if origin is allowed (or allow all for debugging)
            is_allowed = origin in allowed_origins or origin.endswith('.vercel.app')
            
            # FORCE set headers - don't check if they exist, just set them
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
            response.headers['Access-Control-Expose-Headers'] = 'Set-Cookie'
            
            print(f"[CORS] ✅ SET headers - Origin: {origin}, Allowed: {is_allowed}")
        else:
            # No origin - still set credentials
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            print(f"[CORS] ⚠️ No origin, set credentials only")
        
        # Final verification - log what we actually set
        final_origin = response.headers.get('Access-Control-Allow-Origin')
        final_credentials = response.headers.get('Access-Control-Allow-Credentials')
        print(f"[CORS] Final headers - Origin: {final_origin}, Credentials: {final_credentials}")
        print(f"[CORS] =========================================")
        
        return response
    
    # -------------------------------------------------
    # DATABASE + MONGO SESSION STORAGE
    # -------------------------------------------------
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
        print("⚠ MongoDB session FAILED, using fallback cookies:", e)
        import traceback
        traceback.print_exc()
    
    # -------------------------------------------------
    # LOGIN MANAGER
    # -------------------------------------------------
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = None  # prevent redirect loops
    
    @login_manager.user_loader
    def load_user(user_id):
        from models import SuperAdmin, Customer
        return (
            SuperAdmin.find_by_id(user_id)
            or User.find_by_id(user_id)
            or Customer.find_by_id(user_id)
        )

    # -------------------------------------------------
    # REGISTER BLUEPRINTS
    # -------------------------------------------------
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

    # -------------------------------------------------
    # HEALTH CHECK
    # -------------------------------------------------
    @app.route("/health")
    def health():
        return jsonify({"status": "healthy"}), 200

    # -------------------------------------------------
    # FRONTEND SERVING (PRODUCTION)
    # -------------------------------------------------
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve(path):
        if path.startswith("api/"):
            return jsonify({"error": "Invalid API route"}), 404
        
        file_path = os.path.join(app.static_folder, path)
            
        if path != "" and os.path.exists(file_path):
            return send_from_directory(app.static_folder, path)

        # fallback → index.html
        return send_from_directory(app.static_folder, "index.html")
    
    return app


# -------------------------------------------------
# RUN APP (DEV MODE)
# -------------------------------------------------
if __name__ == "__main__":
    env = os.environ.get("FLASK_ENV", "development")
    app = create_app(env)
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=(env == "development"), host="0.0.0.0", port=port)
