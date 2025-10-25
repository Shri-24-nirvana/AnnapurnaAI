import joblib
import pandas as pd
import os

# Load the trained model
model_dir = os.path.dirname(__file__)
model_path = os.path.join(model_dir, 'annapurna_model.joblib')

try:
    model = joblib.load(model_path)
    print("AI prediction model loaded successfully.")
except FileNotFoundError:
    print("Error: Model file 'annapurna_model.joblib' not found. Please run train_model.py first.")
    model = None


def get_ai_prediction(meal_date, meal_type, total_students, live_skips):
    """
    Generate AI-based prediction for meal attendance.

    Args:
        meal_date: Date object for the meal
        meal_type: Type of meal (Breakfast, Lunch, Dinner)
        total_students: Total number of registered students
        live_skips: Number of students who have opted out

    Returns:
        Dictionary containing prediction results
    """
    if not model:
        return {
            "predicted_headcount": total_students - live_skips - 50,
            "confidence_score": 0.50,
            "model_status": "Not Loaded"
        }

    # Prepare input data
    day_of_week = meal_date.weekday()
    input_data = pd.DataFrame({
        'meal_type': [meal_type],
        'day_of_week': [day_of_week],
        'total_students': [total_students]
    })

    # Make prediction
    predicted_attendance = model.predict(input_data)
    final_prediction = int(predicted_attendance[0])

    # Generate preparation sheet
    prep_sheet = {
        "Rice (kg)": round(final_prediction * 0.1, 1),
        "Dal (kg)": round(final_prediction * 0.06, 1),
    }

    return {
        "predicted_headcount": final_prediction,
        "confidence_score": 0.95,
        "prep_sheet": prep_sheet,
        "model_status": "Loaded and Operational"
    }
