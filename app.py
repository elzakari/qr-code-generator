"""
app.py — Flask entrypoint for the QR Generator app (Python 3.11)
"""

from __future__ import annotations

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, render_template
from flask_login import LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect

# Ensure project root is importable (so local 'qrapp' can be found)
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Import db from models
from qrapp.models import db

# Initialize other extensions
login_manager = LoginManager()
migrate = Migrate()
cors = CORS()

from qrapp.limiter import limiter
from qrapp.csrf import csrf


def create_app() -> Flask:
    """Application factory: builds and configures the Flask app instance."""
    load_dotenv()

    app = Flask(__name__, instance_relative_config=True)

    # Core config with safe defaults
    max_upload_mb = int(os.getenv("MAX_UPLOAD_MB", "5"))
    cleanup_hours = int(os.getenv("CLEANUP_MAX_AGE_HOURS", "2"))
    database_url = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(app.instance_path, 'app.db')}")

    app.config.from_mapping(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-insecure"),
        MAX_CONTENT_LENGTH=max_upload_mb * 1024 * 1024,  # bytes
        UPLOAD_FOLDER=os.path.join(app.instance_path, "uploads"),
        GENERATED_FOLDER=os.path.join(app.instance_path, "generated"),
        LOG_FOLDER=os.path.join(app.instance_path, "logs"),
        CLEANUP_MAX_AGE_HOURS=cleanup_hours,
        ALLOWED_EXTENSIONS={"png", "jpg", "jpeg", "webp"},
        PREFERRED_URL_SCHEME="http",
        TEMPLATES_AUTO_RELOAD=True,
        SQLALCHEMY_DATABASE_URI=database_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        WTF_CSRF_ENABLED=True,
    )

    # Ensure instance/ subdirs exist
    for key in ("UPLOAD_FOLDER", "GENERATED_FOLDER", "LOG_FOLDER"):
        os.makedirs(app.config[key], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    limiter.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    
    # Configure CORS with proper settings for credentials
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
    cors.init_app(app, 
                  origins=cors_origins,
                  supports_credentials=True,
                  allow_headers=['Content-Type', 'Authorization', 'X-CSRFToken'],
                  methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

    # Import models after db init
    from qrapp.models import User, QRCode

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))  # Updated syntax

    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'

    # Rotating file logging under instance/logs/app.log
    log_path = os.path.join(app.config["LOG_FOLDER"], "app.log")
    file_handler = RotatingFileHandler(log_path, maxBytes=1_000_000, backupCount=3)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(
        logging.Formatter("%(asctime)s [%(levelname)s] %(name)s - %(message)s")
    )
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)

    # Expose config in templates
    app.jinja_env.globals.update(config=app.config)

    # Make current_user available in templates
    @app.context_processor
    def inject_user():
        from flask_login import current_user
        from flask_wtf.csrf import generate_csrf
        return dict(current_user=current_user, csrf_token=generate_csrf)

    # ---- Register blueprint (must exist in qrapp/__init__.py as bp) ----
    try:
        from qrapp import bp as qr_bp  # local package only; avoids 3rd-party 'qr' collisions
    except ModuleNotFoundError as e:
        raise RuntimeError(
            "Could not import local package 'qrapp'. Ensure a folder named 'qrapp' "
            "exists next to app.py and contains __init__.py with "
            "  bp = Blueprint('qr', __name__)\n"
            "and your routes in qrapp/routes.py."
        ) from e

    app.register_blueprint(qr_bp)
    from qrapp.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    # ---- Setup monitoring and health checks ----
    from qrapp.monitoring import setup_health_check, monitor_requests
    setup_health_check(app)
    monitor_requests(app)

    # ---- Error handlers ----
    @app.errorhandler(400)
    def bad_request(e):
        return render_template("400.html", error=str(e)), 400

    @app.errorhandler(404)
    def not_found(e):
        return render_template("404.html", error=str(e)), 404

    @app.errorhandler(413)
    def too_large(e):
        return render_template("400.html", error="Uploaded file is too large."), 413

    @app.errorhandler(500)
    def server_error(e):
        app.logger.exception("Unhandled server error: %s", e)
        return render_template("500.html", error="Internal server error"), 500

    # ---- Root route (renders the form) ----
    @app.route("/")
    def home():
        return render_template("index.html")

    @app.cli.command("init-db")
    def init_db():
        """Initialize the database."""
        db.create_all()
        print("Database initialized.")

    @app.cli.command("create-admin")
    def create_admin():
        """Create an admin user."""
        username = input("Username: ")
        password = input("Password: ")
        user = User(username=username, is_admin=True)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f"Admin user {username} created.")

    return app


if __name__ == "__main__":
    app = create_app()
    # Respect FLASK_ENV=development for debug mode
    debug = os.getenv("FLASK_ENV", "").lower() == "development"
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_RUN_PORT", "5000"))
    app.run(host=host, port=port, debug=debug)
