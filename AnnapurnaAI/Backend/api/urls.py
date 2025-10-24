# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'menu-items', views.MenuItemViewSet, basename='menuitem')
router.register(r'menus', views.MenuViewSet, basename='menu')
router.register(r'attendance', views.AttendanceViewSet, basename='attendance')
router.register(r'feedback', views.FeedbackViewSet, basename='feedback')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', views.RegisterView.as_view(), name='auth_register'),

    # --- CHANGE THIS LINE ---
    # Use your custom view for login
    path('auth/login/', views.MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # --- END OF CHANGE ---

    path('auth/login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('dashboard/summary/', views.dashboard_summary, name='dashboard_summary'),
]