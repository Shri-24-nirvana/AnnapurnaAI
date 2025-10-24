# api/serializers.py
from rest_framework import serializers
from .models import User, MenuItem, Menu, Attendance, Feedback
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        # Use our custom manager's create_user method
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'student')
        )
        return user

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'

class MenuSerializer(serializers.ModelSerializer):
    # Show item details, not just IDs
    items = MenuItemSerializer(many=True, read_only=True)
    item_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=MenuItem.objects.all(), source='items'
    )
    
    class Meta:
        model = Menu
        fields = ['id', 'meal_date', 'meal_type', 'items', 'item_ids']

class AttendanceSerializer(serializers.ModelSerializer):
    # Automatically set the user based on the request
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    class Meta:
        model = Attendance
        fields = ['id', 'user', 'menu', 'status', 'timestamp']
        read_only_fields = ['status', 'timestamp']

class FeedbackSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    
    class Meta:
        model = Feedback
        fields = ['id', 'user', 'item', 'rating', 'comments', 'timestamp']
        read_only_fields = ['timestamp']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token

def validate(self, attrs):
        data = super().validate(attrs)
        # Add role and email to the response data (login response)
        data['role'] = self.user.role
        data['email'] = self.user.email # <-- ADD THIS LINE
        # If you add a 'name' field to your User model later, add it here too
        # data['name'] = self.user.name
        return data