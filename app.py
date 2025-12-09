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

    # CORS CONFIG
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://gst-sable.vercel.app",
        "https://gst-frontend-bay.vercel.app",
    ]

    CORS(
        app,
        supports_credentials=True,
        resources={r"/api/*": {"origins": allowed_origins}},
    )

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

    # ⭐ PARTITIONED COOKIE FIX (CHIPS)
    @app.after_request
    def add_partitioned_cookie(response):
        cookies = response.headers.getlist("Set-Cookie")
        new_cookies = []

        for cookie in cookies:
            if "session_id=" in cookie:
                if "Partitioned" not in cookie:
                    cookie += "; Partitioned"
            new_cookies.append(cookie)

        if new_cookies:
            response.headers.set("Set-Cookie", ", ".join(new_cookies))

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
