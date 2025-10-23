# app/services/prediction_service.py
import joblib
import pandas as pd
import os

# --- Load the trained model ---
# Get the absolute path to the model file
model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'annapurna_model.joblib')
try:
    model = joblib.load(model_path)
    print("AI prediction model loaded successfully.")
except FileNotFoundError:
    print("Error: Model file not found. Please run train_model.py first.")
    model = None

def get_ai_prediction(meal_date, meal_type, total_students, live_skips):
    """
    Uses the pre-trained machine learning model to predict headcount.
    """
    if not model:
        # Fallback to a simple heuristic if the model isn't loaded
        predicted = max(0, total_students - live_skips - 50)  # Simple guess, non-negative
        return {
            "predicted_headcount": predicted,
            "confidence_score": 0.50,
            "prep_sheet": [],
            "model_status": "Not Loaded"
        }

    # --- 1. Prepare input data for the model ---
    # The model expects a pandas DataFrame with the same features used in training.
    day_of_week = meal_date.weekday()
    
    input_data = pd.DataFrame({
        'meal_type': [meal_type],
        'day_of_week': [day_of_week],
        'total_students': [total_students]
    })

    # --- 2. Make a prediction ---
    predicted_attendance = model.predict(input_data)
    
    # Normalize prediction to integer (handle arrays or scalars)
    try:
        final_prediction = int(predicted_attendance[0])
    except Exception:
        final_prediction = int(predicted_attendance)

    # --- 3. Refine prediction with live data ---
    # The model predicts total attendance. We adjust it based on live skips.
    # A more advanced model could use live_skips as a feature.
    # For now, we assume the model's prediction is the best estimate of the final count.

    # A simple confidence score based on how far the prediction is from a simple heuristic
    if total_students:
        confidence = 1.0 - abs((total_students - live_skips) - final_prediction) / float(total_students)
        confidence = max(0.0, min(1.0, confidence))
    else:
        confidence = 0.0

    # --- 4. Generate Prep Sheet (Example Logic) ---
    # This logic can be expanded with a recipe database
    prep_sheet = {
        "items": [
            {"name": "Rice", "quantity": int(final_prediction * 0.2)},
            {"name": "Dal", "quantity": int(final_prediction * 0.1)}
        ],
        "notes": "Estimated quantities; verify with kitchen staff"
    }

    return {
        "predicted_headcount": final_prediction,
        "confidence_score": round(confidence, 2),
        "prep_sheet": prep_sheet,
        "model_status": "Loaded and Operational"
    }