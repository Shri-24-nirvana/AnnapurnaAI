
import os
import zipfile
from pathlib import Path

# Create the main project directory structure
base_dir = "annapurna_ai_backend"
os.makedirs(base_dir, exist_ok=True)

# Create subdirectories
directories = [
    f"{base_dir}/annapurna_project",
    f"{base_dir}/api",
    f"{base_dir}/ml_model"
]

for directory in directories:
    os.makedirs(directory, exist_ok=True)
    # Create __init__.py files
    with open(f"{directory}/__init__.py", "w") as f:
        f.write("")

print("Directory structure created successfully")
print(f"Created directories: {directories}")
