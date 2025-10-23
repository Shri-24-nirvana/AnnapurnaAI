# app/routes/auth.py
from flask import Blueprint, request, jsonify
from app.models import User, db
from flask_jwt_extended import create_access_token

auth_bp = Blueprint('auth', __name__)

# -----------------------
# REGISTER ROUTE
# -----------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Email and password are required"}), 400

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "User already exists"}), 409

    # Create new user
    new_user = User(email=data['email'], role=data.get('role', 'student'))
    new_user.set_password(data['password'])  # assumes you have a set_password() function in model
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User created successfully"}), 201


# -----------------------
# LOGIN ROUTE
# -----------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Email and password are required"}), 400

    user = User.query.filter_by(email=data['email']).first()

    # Verify password
    if user and user.check_password(data['password']):  # assumes you have a check_password() in model
        access_token = create_access_token(identity={'email': user.email, 'role': user.role})
        return jsonify(access_token=access_token), 200

    return jsonify({"msg": "Invalid email or password"}), 401
