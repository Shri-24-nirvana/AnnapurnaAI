
# Create train_model.py
train_model_content = """import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
import joblib
import datetime
import os


def train_and_save_model():
    print("Starting model training process...")
    
    # Generate synthetic training data
    num_records = 730
    start_date = datetime.date(2023, 1, 1)
    dates = [start_date + datetime.timedelta(days=i) for i in range(num_records)]
    meal_types = ['Breakfast', 'Lunch', 'Dinner']
    total_students = 2000
    data = []
    
    for date in dates:
        for meal in meal_types:
            day_of_week = date.weekday()
            # Weekend meals have lower attendance
            if day_of_week >= 5:
                base_attendance = total_students * np.random.uniform(0.6, 0.8)
            else:
                base_attendance = total_students * np.random.uniform(0.85, 0.98)
            
            actual_attendance = int(base_attendance + np.random.normal(0, 20))
            data.append({
                'date': date,
                'meal_type': meal,
                'day_of_week': day_of_week,
                'total_students': total_students,
                'actual_attendance': actual_attendance
            })
    
    df = pd.DataFrame(data)
    print(f"Generated {len(df)} records of synthetic data.")
    
    # Prepare features and target
    features = ['meal_type', 'day_of_week', 'total_students']
    target = 'actual_attendance'
    X = df[features]
    y = df[target]
    
    # Create preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['meal_type'])
        ],
        remainder='passthrough'
    )
    
    # Create model pipeline
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    print("Training the Random Forest model...")
    model.fit(X, y)
    
    # Save the model
    model_dir = os.path.dirname(__file__)
    model_filename = os.path.join(model_dir, 'annapurna_model.joblib')
    joblib.dump(model, model_filename)
    print(f"Model saved successfully as '{model_filename}'")


if __name__ == '__main__':
    train_and_save_model()
"""

with open(f"{base_dir}/ml_model/train_model.py", "w") as f:
    f.write(train_model_content)

print("train_model.py created")
