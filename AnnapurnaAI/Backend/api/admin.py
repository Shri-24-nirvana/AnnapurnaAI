# api/admin.py
from django.contrib import admin
from .models import User, MenuItem, Menu, Attendance, Feedback

# We can customize how these are shown in the admin
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email',)

class MenuAdmin(admin.ModelAdmin):
    list_display = ('meal_date', 'meal_type')
    list_filter = ('meal_type', 'meal_date')
    filter_horizontal = ('items',) # A nicer way to edit many-to-many fields

class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('user', 'menu', 'status', 'timestamp')
    list_filter = ('status', 'menu__meal_type', 'menu__meal_date')
    search_fields = ('user__email',)

class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'rating', 'timestamp')
    list_filter = ('rating', 'item')
    search_fields = ('user__email', 'item__name')

# Register your models with the admin site
admin.site.register(User, UserAdmin)
admin.site.register(MenuItem)
admin.site.register(Menu, MenuAdmin)
admin.site.register(Attendance, AttendanceAdmin)
admin.site.register(Feedback, FeedbackAdmin)