
# Create README.md
readme_content = """# Annapurna AI - Backend

This is the complete backend for the Annapurna AI project, built with Python and Django.

## Features

- **User Management**: JWT-based authentication for students and managers
- **Student Features**: 
  - Opt-out system for meal skipping
  - Feedback submission with ratings and comments
- **Manager Features**: 
  - Secure dashboard with live headcount
  - AI-predicted attendance
  - Financial savings projections
- **AI Integration**: Random Forest model for meal attendance prediction
- **Database**: PostgreSQL integration

## Setup Instructions

### Prerequisites

- Python 3.8+
- PostgreSQL
- pip and venv

### Installation Steps

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   
   Edit the `.env` file in the root directory with your database credentials:
   ```
   SECRET_KEY='your-strong-django-secret-key-here'
   DEBUG=True
   DB_NAME='annapurnadb'
   DB_USER='your_postgres_user'
   DB_PASSWORD='your_postgres_password'
   DB_HOST='localhost'
   DB_PORT='5432'
   ```

4. **Setup PostgreSQL Database**
   
   Create a PostgreSQL database and user:
   ```sql
   CREATE DATABASE annapurnadb;
   CREATE USER your_postgres_user WITH PASSWORD 'your_postgres_password';
   GRANT ALL PRIVILEGES ON DATABASE annapurnadb TO your_postgres_user;
   ```

5. **Train AI Model**
   
   Run the training script once to create the prediction model:
   ```bash
   python ml_model/train_model.py
   ```

6. **Run Database Migrations**
   ```bash
   python manage.py makemigrations api
   python manage.py migrate
   ```

7. **Create Superuser (Optional)**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run Development Server**
   ```bash
   python manage.py runserver
   ```

The API will be live at `http://127.0.0.1:8000/`

## API Endpoints

### Authentication
- `POST /api/register/` - Register a new user
- `POST /api/login/` - Login and obtain JWT tokens
- `POST /api/token/refresh/` - Refresh JWT access token

### Student Endpoints
- `POST /api/skip-meal/` - Mark a meal as skipped
- `POST /api/feedback/` - Submit feedback for a menu item

### Manager Endpoints
- `GET /api/dashboard/` - Get dashboard summary with predictions

## Project Structure

```
annapurna_ai_backend/
├── annapurna_project/       # Django project settings
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── api/                     # Main API application
│   ├── __init__.py
│   ├── models.py           # Database models
│   ├── serializers.py      # DRF serializers
│   ├── urls.py             # API routes
│   ├── views.py            # API views
│   └── permissions.py      # Custom permissions
├── ml_model/               # AI/ML components
│   ├── __init__.py
│   ├── prediction.py       # Prediction logic
│   └── train_model.py      # Model training script
├── manage.py               # Django management script
├── requirements.txt        # Python dependencies
├── .env                    # Environment variables
└── README.md              # This file
```

## Technology Stack

- **Framework**: Django 4.2.6, Django REST Framework 3.14.0
- **Authentication**: djangorestframework-simplejwt 5.3.0
- **Database**: PostgreSQL with psycopg2-binary 2.9.7
- **AI/ML**: scikit-learn 1.3.2, pandas 2.1.1, joblib 1.3.2
- **CORS**: django-cors-headers 4.3.1
- **Configuration**: python-dotenv 1.0.0

## Usage Examples

### Register a Student
```bash
curl -X POST http://127.0.0.1:8000/api/register/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "student1",
    "email": "student1@example.com",
    "password": "securepass123",
    "role": "student"
  }'
```

### Login
```bash
curl -X POST http://127.0.0.1:8000/api/login/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "student1@example.com",
    "password": "securepass123"
  }'
```

### Skip a Meal
```bash
curl -X POST http://127.0.0.1:8000/api/skip-meal/ \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -d '{
    "meal_date": "2025-10-26",
    "meal_type": "Lunch"
  }'
```

## Notes

- Make sure PostgreSQL is running before starting the Django server
- The AI model must be trained before using the dashboard endpoint
- Frontend CORS is configured for `http://localhost:3000`
- JWT tokens expire after 1 day (configurable in settings)

## Troubleshooting

- **Database Connection Error**: Verify PostgreSQL is running and credentials in `.env` are correct
- **Model Not Found Error**: Run `python ml_model/train_model.py` to create the model
- **Migration Issues**: Delete db.sqlite3 (if exists) and migrations folder, then re-run migrations

## License

This project is built for educational purposes.
"""

with open(f"{base_dir}/README.md", "w") as f:
    f.write(readme_content)

print("README.md created")
