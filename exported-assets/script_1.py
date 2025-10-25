
# Create requirements.txt
requirements_content = """Django==4.2.6
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
psycopg2-binary==2.9.7
python-dotenv==1.0.0
django-cors-headers==4.3.1
scikit-learn==1.3.2
pandas==2.1.1
joblib==1.3.2
"""

with open(f"{base_dir}/requirements.txt", "w") as f:
    f.write(requirements_content)

print("requirements.txt created")
