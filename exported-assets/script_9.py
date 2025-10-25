
# Create api/urls.py
api_urls_content = """from django.urls import path
from .views import RegisterView, SkipMealView, SubmitFeedbackView, DashboardSummaryView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('skip-meal/', SkipMealView.as_view(), name='skip_meal'),
    path('feedback/', SubmitFeedbackView.as_view(), name='submit_feedback'),
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard_summary'),
]
"""

with open(f"{base_dir}/api/urls.py", "w") as f:
    f.write(api_urls_content)

print("api/urls.py created")
