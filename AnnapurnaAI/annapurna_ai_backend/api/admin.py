from django.contrib import admin
from .models import User, Menu, MenuItem, Attendance, Feedback

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'email', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email']
    ordering = ['-date_joined']

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category']
    list_filter = ['category']
    search_fields = ['name']

@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ['id', 'meal_date', 'meal_type']
    list_filter = ['meal_type', 'meal_date']
    filter_horizontal = ['items']
    ordering = ['-meal_date']

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'menu', 'status', 'timestamp']
    list_filter = ['status', 'timestamp']
    search_fields = ['student__email', 'student__username']
    ordering = ['-timestamp']

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'menu_item', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['student__email', 'comments']
    ordering = ['created_at']
