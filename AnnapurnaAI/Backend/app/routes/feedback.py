# app/routes/feedback.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Feedback, MenuItem

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/submit', methods=)
@jwt_required()
def submit_feedback():
    current_user_identity = get_jwt_identity()
    user = User.query.filter_by(email=current_user_identity['email']).first()

    data = request.get_json()
    item_id = data['item_id']
    rating = data['rating']
    comments = data.get('comments', '')

    if not MenuItem.query.get(item_id):
        return jsonify({"msg": "Menu item not found"}), 404

    new_feedback = Feedback(
        user_id=user.id,
        item_id=item_id,
        rating=rating,
        comments=comments
    )
    db.session.add(new_feedback)
    db.session.commit()

    return jsonify({"msg": "Feedback submitted successfully"}), 201