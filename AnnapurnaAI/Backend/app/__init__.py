# app/__init__.py
from flask import Flask
from config import Config
from.models import db
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    # Register Blueprints (API routes)
    from.routes.auth import auth_bp
    from.routes.attendance import attendance_bp
    from.routes.feedback import feedback_bp
    from.routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    return app