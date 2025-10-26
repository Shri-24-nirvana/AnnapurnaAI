from django.urls import path
from .views import (
    RegisterView, 
    SkipMealView, 
    SubmitFeedbackView, 
    DashboardSummaryView,
    MenuListView,
    AttendanceListView,
    AttendanceDeleteView
)
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

# ✅ Custom Login View with role in token
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),  # ✅ Using custom view
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Student Features
    path('skip-meal/', SkipMealView.as_view(), name='skip-meal'),
    path('feedback/', SubmitFeedbackView.as_view(), name='feedback'),
    path('menus/', MenuListView.as_view(), name='menu-list'),
    path('attendance/', AttendanceListView.as_view(), name='attendance-list'),
    path('attendance/<int:pk>/', AttendanceDeleteView.as_view(), name='attendance-delete'),
    
    # Manager Features
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard'),
]
