# train_model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib
import datetime

print("Starting model training process...")

# --- 1. Generate Synthetic Historical Data ---
# In a real project, you would load this from your institution's records.
num_records = 365 * 2 # Two years of data
start_date = datetime.date(2023, 1, 1)
dates = [start_date + datetime.timedelta(days=i) for i in range(num_records)]
meal_types = ['breakfast', 'lunch', 'dinner']
total_students = 2000

data = []
for date in dates:
    for meal in meal_types:
        day_of_week = date.weekday() # Monday=0, Sunday=6
        # Simulate patterns: fewer students on weekends, especially for dinner
        if day_of_week >= 5: # Weekend
            base_attendance = total_students * np.random.uniform(0.6, 0.8)
        else: # Weekday
            base_attendance = total_students * np.random.uniform(0.85, 0.98)
        
        # Add some noise
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

# --- 2. Feature Engineering & Preprocessing ---
# The AI will predict attendance based on the meal type and day of the week.
features = ['meal_type', 'day_of_week', 'total_students']
target = 'actual_attendance'

X = df[features]
y = df[target]

# Create a preprocessing pipeline to handle categorical features
categorical_features = ['meal_type']
numeric_features = ['day_of_week', 'total_students']

preprocessor = ColumnTransformer(
    transformers=[
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ],
    remainder='passthrough' # Keep numeric features as they are
)

# --- 3. Define and Train the Model ---
# We use a RandomForestRegressor, a powerful and versatile model.
model = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
])

# Split data for training and testing
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training the Random Forest model...")
model.fit(X_train, y_train)

# --- 4. Evaluate and Save the Model ---
score = model.score(X_test, y_test)
print(f"Model training complete. R^2 Score: {score:.4f}")

# Save the trained model pipeline to a file
model_filename = 'annapurna_model.joblib'
joblib.dump(model, model_filename)
print(f"Model saved successfully as '{model_filename}'")