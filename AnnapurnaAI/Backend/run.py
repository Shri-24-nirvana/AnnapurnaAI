# run.py
from app import create_app

app = create_app()

if __name__ == '__main__':
    # In a production environment, you would use a proper WSGI server like Gunicorn
    app.run(debug=True)