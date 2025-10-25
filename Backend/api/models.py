# api/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

# --- 1. Custom User Manager ---
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'manager') # Superuser is a manager
        
        return self.create_user(email, password, **extra_fields)

# --- 2. Custom User Model ---
class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        STUDENT = 'student', 'Student'
        MANAGER = 'manager', 'Manager'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

# --- 3. Other Canteen Models ---
class MenuItem(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name

class Menu(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = 'Breakfast', 'Breakfast'
        LUNCH = 'Lunch', 'Lunch'
        DINNER = 'Dinner', 'Dinner'

    meal_date = models.DateField()
    meal_type = models.CharField(max_length=10, choices=MealType.choices)
    items = models.ManyToManyField(MenuItem, related_name='menus')

    class Meta:
        unique_together = ('meal_date', 'meal_type') # Ensure one menu per meal per day

    def __str__(self):
        return f"{self.get_meal_type_display()} on {self.meal_date}"

class Attendance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances')
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='attendances')
    status = models.CharField(max_length=20, default='Skipped')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'menu') # Student can only skip a meal once

    def __str__(self):
        return f"{self.user.email} skipped {self.menu}"

class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='feedbacks')
    rating = models.IntegerField() # e.g., 1-5
    comments = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.item.name} by {self.user.email}"