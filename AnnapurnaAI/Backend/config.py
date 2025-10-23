# config.py
import os
try:
    from dotenv import load_dotenv
except Exception:
    # If python-dotenv isn't available in this environment, provide a no-op fallback
    def load_dotenv():
        return False

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a-very-secret-key'
    # Connect to your PostgreSQL database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://user:password@localhost/annapurnadb'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Setup JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'another-super-secret-key'