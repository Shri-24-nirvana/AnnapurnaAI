
# Create .env file
env_content = """SECRET_KEY='your-strong-django-secret-key-here'
DEBUG=True
DB_NAME='annapurnadb'
DB_USER='your_postgres_user'
DB_PASSWORD='your_postgres_password'
DB_HOST='localhost'
DB_PORT='5432'
"""

with open(f"{base_dir}/.env", "w") as f:
    f.write(env_content)

print(".env file created")
