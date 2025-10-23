# app/routes/attendance.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Menu, Attendance
import datetime

attendance_bp = Blueprint('attendance', __name__)

@attendance_bp.route('/skip', methods=)
@jwt_required()
def skip_meal():
    current_user_identity = get_jwt_identity()
    user = User.query.filter_by(email=current_user_identity['email']).first()
    
    data = request.get_json()
    meal_date_str = data['meal_date'] # Expected format: 'YYYY-MM-DD'
    meal_type = data['meal_type']

    meal_date = datetime.datetime.strptime(meal_date_str, '%Y-%m-%d').date()
    
    menu = Menu.query.filter_by(meal_date=meal_date, meal_type=meal_type).first()
    if not menu:
        return jsonify({"msg": "Menu for this date and time not found"}), 404

    # Check if attendance record already exists
    existing_attendance = Attendance.query.filter_by(user_id=user.id, menu_id=menu.id).first()
    if existing_attendance:
        return jsonify({"msg": "Attendance already marked"}), 409

    new_attendance = Attendance(user_id=user.id, menu_id=menu.id, status='Skipped')
    db.session.add(new_attendance)
    db.session.commit()

    return jsonify({"msg": f"Meal {meal_type} on {meal_date_str} marked as skipped"}), 201