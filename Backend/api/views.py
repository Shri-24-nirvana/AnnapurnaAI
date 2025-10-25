# api/views.py
from rest_framework import viewsets, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import User, MenuItem, Menu, Attendance, Feedback
from .serializers import UserSerializer, MenuItemSerializer, MenuSerializer, AttendanceSerializer, FeedbackSerializer
from .permissions import IsManagerUser
from .services.prediction_service import get_ai_prediction # Mock AI
import datetime
from rest_framework_simplejwt.views import TokenObtainPairView # Import this
from .serializers import ( # Import your new serializer
    UserSerializer, MenuItemSerializer, MenuSerializer,
    AttendanceSerializer, FeedbackSerializer, MyTokenObtainPairSerializer
)

# 1. User Registration View
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

# 2. ViewSets for our models
class MenuItemViewSet(viewsets.ModelViewSet):
    """API endpoint for Menu Items. Only managers can edit."""
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    
    def get_permissions(self):
        """Students can view, managers can edit."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsManagerUser]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

class MenuViewSet(viewsets.ModelViewSet):
    """API endpoint for Menus. Only managers can edit."""
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsManagerUser]
        else:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

class AttendanceViewSet(viewsets.ModelViewSet):
    """API endpoint for skipping meals. Students can only create (skip) and view their own."""
    serializer_class = AttendanceSerializer
    
    def get_queryset(self):
        """Students only see their own skips. Managers see all."""
        user = self.request.user
        if user.role == 'manager':
            return Attendance.objects.all()
        return Attendance.objects.filter(user=user)

class FeedbackViewSet(viewsets.ModelViewSet):
    """API endpoint for feedback. Students can create and view their own."""
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return Feedback.objects.all()
        return Feedback.objects.filter(user=user)
    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

# 3. The Manager Dashboard View
@api_view(['GET'])
@permission_classes([IsManagerUser]) # Protected by our custom permission
def dashboard_summary(request):
    """
    The main dashboard endpoint for managers.
    """
    # --- 1. Live Headcount Calculation ---
    today = datetime.date.today()
    next_meal_type = 'Lunch' # Example, this could be dynamic
    
    try:
        menu = Menu.objects.get(meal_date=today, meal_type=next_meal_type)
    except Menu.DoesNotExist:
        return Response({"msg": f"No {next_meal_type} menu found for today."}, status=404)

    total_students = User.objects.filter(role='student').count()
    skipped_students = Attendance.objects.filter(menu=menu).count()
    live_headcount = total_students - skipped_students

    # --- 2. AI Prediction ---
    ai_forecast = get_ai_prediction(
        menu_id=menu.id,
        live_skips=skipped_students,
        total_students=total_students
    )

    # --- 3. Savings Calculation (Example) ---
    old_prep_count = int(total_students * 0.95) # Old guess
    meals_saved = old_prep_count - ai_forecast['predicted_headcount']
    projected_savings = meals_saved * 50 # Assuming ₹50 cost per meal
    
    summary = {
        "meal_details": {"date": today.strftime('%Y-%m-%d'), "type": next_meal_type},
        "live_data": {
            "total_students": total_students,
            "skipped_students": skipped_students,
            "live_headcount": live_headcount
        },
        "ai_predictions": ai_forecast,
        "financials": {"projected_savings_today": projected_savings, "currency": "INR"}
    }
    return Response(summary)