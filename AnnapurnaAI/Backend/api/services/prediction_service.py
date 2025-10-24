# api/services/prediction_service.py
import random

def get_ai_prediction(menu_id: int, live_skips: int, total_students: int):
    """
    This is a MOCK AI prediction service.
    """
    base_prediction = total_students - live_skips
    ai_adjustment_factor = 1.0 - random.uniform(0.05, 0.15)
    final_prediction = int(base_prediction * ai_adjustment_factor)
    
    prep_sheet = [
        {"item": "Rice", "quantity_kg": round(final_prediction * 0.1, 2)},
        {"item": "Dal", "quantity_kg": round(final_prediction * 0.08, 2)},
        {"item": "Paneer Curry", "quantity_kg": round(final_prediction * 0.12, 2)}
    ]
    
    return {
        "predicted_headcount": final_prediction,
        "confidence_score": round(random.uniform(0.85, 0.98), 2),
        "prep_sheet": prep_sheet
    }