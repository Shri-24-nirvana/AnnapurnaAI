from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Menu, MenuItem, Attendance, Feedback

# ✅ Custom JWT Serializer to include role
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['role'] = user.role
        token['email'] = user.email
        token['name'] = user.username
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra responses
        data['email'] = self.user.email
        data['role'] = self.user.role
        data['name'] = self.user.username
        
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'category']

class MenuSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Menu
        fields = ['id', 'meal_date', 'meal_type', 'items']

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'menu', 'status', 'timestamp']
        read_only_fields = ['student', 'timestamp']

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'student', 'menu_item', 'rating', 'comments', 'timestamp']
        read_only_fields = ['student', 'timestamp']
