# annapurna_project/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Include all URLs from our 'api' app
    path('api/v1/', include('api.urls')),
]