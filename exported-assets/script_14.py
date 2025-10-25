
# Create the zip file
import zipfile
import os

def zipdir(path, ziph):
    """Recursively zip a directory"""
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, os.path.dirname(path))
            ziph.write(file_path, arcname)

# Create the zip file
zip_filename = "annapurna_ai_backend.zip"
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipdir(base_dir, zipf)

print(f"✅ Successfully created {zip_filename}")
print(f"\nPackage contents:")

# List all files in the zip
with zipfile.ZipFile(zip_filename, 'r') as zipf:
    file_list = zipf.namelist()
    print(f"Total files: {len(file_list)}")
    for file in sorted(file_list):
        print(f"  - {file}")

# Get file size
file_size = os.path.getsize(zip_filename)
print(f"\nZip file size: {file_size:,} bytes ({file_size/1024:.2f} KB)")
