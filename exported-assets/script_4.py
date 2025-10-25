
# Create urls.py for annapurna_project
urls_content = """from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
"""

with open(f"{base_dir}/annapurna_project/urls.py", "w") as f:
    f.write(urls_content)

# Create asgi.py
asgi_content = """import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'annapurna_project.settings')

application = get_asgi_application()
"""

with open(f"{base_dir}/annapurna_project/asgi.py", "w") as f:
    f.write(asgi_content)

# Create wsgi.py
wsgi_content = """import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'annapurna_project.settings')

application = get_wsgi_application()
"""

with open(f"{base_dir}/annapurna_project/wsgi.py", "w") as f:
    f.write(wsgi_content)

print("annapurna_project files created (urls.py, asgi.py, wsgi.py)")
