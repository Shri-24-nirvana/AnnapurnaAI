from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import User, Menu, Attendance, Feedback, MenuItem
from .serializers import UserSerializer
from .permissions import IsManager
from django.shortcuts import get_object_or_404
import datetime
from ml_model.prediction import get_ai_prediction


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class SkipMealView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        student = request.user
        meal_date_str = request.data.get('meal_date')
        meal_type = request.data.get('meal_type')

        if not meal_date_str or not meal_type:
            return Response({"error": "meal_date and meal_type are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            meal_date = datetime.datetime.strptime(meal_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        menu = get_object_or_404(Menu, meal_date=meal_date, meal_type=meal_type)
        attendance, created = Attendance.objects.get_or_create(
            student=student, menu=menu, defaults={'status': 'Skipped'}
        )

        if not created:
            return Response({"message": "You have already marked this meal as skipped."}, status=status.HTTP_200_OK)

        return Response({"message": f"Meal {meal_type} on {meal_date_str} marked as skipped."}, status=status.HTTP_201_CREATED)


class SubmitFeedbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        student = request.user
        item_id = request.data.get('item_id')
        rating = request.data.get('rating')
        comments = request.data.get('comments', '')

        menu_item = get_object_or_404(MenuItem, pk=item_id)
        Feedback.objects.create(student=student, menu_item=menu_item, rating=rating, comments=comments)

        return Response({"message": "Feedback submitted successfully."}, status=status.HTTP_201_CREATED)


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request, *args, **kwargs):
        today = datetime.date.today()
        next_meal_type = 'Lunch'

        menu = Menu.objects.filter(meal_date=today, meal_type=next_meal_type).first()
        if not menu:
            return Response({"error": "No upcoming meal found for today."}, status=status.HTTP_404_NOT_FOUND)

        total_students = User.objects.filter(role='student').count()
        skipped_students = Attendance.objects.filter(menu=menu).count()
        live_headcount = total_students - skipped_students

        ai_forecast = get_ai_prediction(
            meal_date=today,
            meal_type=next_meal_type,
            total_students=total_students,
            live_skips=skipped_students
        )

        cost_per_meal = 50
        projected_savings = (total_students - ai_forecast['predicted_headcount']) * cost_per_meal

        summary = {
            "meal_details": {
                "date": today.strftime('%Y-%m-%d'),
                "type": next_meal_type
            },
            "live_data": {
                "total_students": total_students,
                "skipped_students": skipped_students,
                "live_headcount": live_headcount
            },
            "ai_predictions": ai_forecast,
            "financials": {
                "projected_daily_savings": projected_savings,
                "currency": "INR"
            }
        }

        return Response(summary, status=status.HTTP_200_OK)
