# app/routes/dashboard.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models import db, User, Menu, Attendance
from app.services.prediction_service import get_ai_prediction
from app.utils.decorators import role_required
import datetime

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=)
@jwt_required()
@role_required('manager')
def get_dashboard_summary():
    # --- Live Headcount Calculation ---
    today = datetime.date.today()
    # For demonstration, we'll check for the next meal (e.g., Lunch)
    next_meal_type = 'Lunch' 
    
    menu = Menu.query.filter_by(meal_date=today, meal_type=next_meal_type).first()
    if not menu:
        return jsonify({"msg": "No upcoming meal found for today"}), 404

    total_students = User.query.filter_by(role='student').count()
    skipped_students = Attendance.query.filter_by(menu_id=menu.id).count()
    live_headcount = total_students - skipped_students

    # --- AI Prediction ---
    # Pass the required context to the updated AI service
    ai_forecast = get_ai_prediction(
        meal_date=today,
        meal_type=next_meal_type,
        total_students=total_students,
        live_skips=skipped_students
    )

    # --- Savings Calculation (Example) ---
    # This would be a more complex module based on historical waste data
    # We use the AI's prediction to estimate savings against the total possible attendance
    projected_savings = (total_students - ai_forecast['predicted_headcount']) * 50 # Assuming ₹50 cost per meal
    
    summary = {
        "meal_details": {
            "date": today.strftime('%Y-%m-%d'),
            "type": next_meal_type
        },
        "live_data": {
            "total_students": total_students,
            "skipped_students": skipped_students,
            "live_headcount": live_headcount
        },
        "ai_predictions": ai_forecast,
        "financials": {
            "projected_monthly_savings": projected_savings * 30, # A very rough estimate
            "currency": "INR"
        }
    }

    return jsonify(summary), 200