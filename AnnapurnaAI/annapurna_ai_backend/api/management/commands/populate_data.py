from django.core.management.base import BaseCommand
from api.models import User, MenuItem, Menu, Attendance
import datetime
import random


class Command(BaseCommand):
    help = 'Populate database with 1000 users and attendance data'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting data population...'))
        
        # Create menu items
        self.stdout.write('Creating menu items...')
        
        items_data = [
            ("Poha with Tea", "Breakfast"),
            ("Idli Sambar", "Breakfast"),
            ("Aloo Paratha", "Breakfast"),
            ("Paneer Butter Masala", "Main"),
            ("Dal Tadka", "Main"),
            ("Rajma Chawal", "Main"),
            ("Chole Bhature", "Main"),
            ("Basmati Rice", "Main"),
            ("Roti", "Main"),
            ("Dal Makhani", "Main"),
            ("Mixed Veg Curry", "Main"),
            ("Garden Salad", "Side"),
            ("Raita", "Side"),
            ("Pickle", "Side"),
        ]
        
        menu_items = []
        for name, category in items_data:
            item, created = MenuItem.objects.get_or_create(
                name=name,
                defaults={'category': category}
            )
            menu_items.append(item)
            if created:
                self.stdout.write(f'  Created: {name}')
        
        # Create today's menus
        self.stdout.write('\nCreating today menus...')
        today = datetime.date.today()
        
        breakfast_menu, _ = Menu.objects.get_or_create(
            meal_date=today,
            meal_type='Breakfast'
        )
        breakfast_menu.items.set([menu_items[0], menu_items[1]])
        
        lunch_menu, _ = Menu.objects.get_or_create(
            meal_date=today,
            meal_type='Lunch'
        )
        lunch_menu.items.set([menu_items[3], menu_items[7], menu_items[11]])
        
        dinner_menu, _ = Menu.objects.get_or_create(
            meal_date=today,
            meal_type='Dinner'
        )
        dinner_menu.items.set([menu_items[9], menu_items[7], menu_items[12]])
        
        self.stdout.write(self.style.SUCCESS('  Menus created'))
        
        # Create 1000 students
        self.stdout.write('\nCreating 1000 student users...')
        students_created = 0
        
        for i in range(1, 1001):
            username = f'student{i:04d}'
            email = f'student{i:04d}@university.edu'
            
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(
                    username=username,
                    email=email,
                    password='password123',
                    role='student'
                )
                students_created += 1
                
                if i % 100 == 0:
                    self.stdout.write(f'  Created {i} users...')
        
        self.stdout.write(self.style.SUCCESS(f'  Total: {students_created} new students'))
        
        # Create attendance records
        all_students = list(User.objects.filter(role='student'))
        self.stdout.write(f'\nTotal students in database: {len(all_students)}')
        
        self.stdout.write('\nCreating attendance records...')
        meals = [
            ('Breakfast', breakfast_menu),
            ('Lunch', lunch_menu),
            ('Dinner', dinner_menu)
        ]
        
        total_skips = 0
        for meal_name, menu in meals:
            num_to_skip = min(200, len(all_students))
            skipping_students = random.sample(all_students, num_to_skip)
            
            for student in skipping_students:
                Attendance.objects.get_or_create(
                    student=student,
                    menu=menu,
                    defaults={'status': 'Skipped'}
                )
                total_skips += 1
            
            attending = len(all_students) - num_to_skip
            self.stdout.write(f'  {meal_name}: {num_to_skip} skipped, {attending} attending')
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('DATA POPULATION COMPLETE'))
        self.stdout.write(self.style.SUCCESS('='*60))
        self.stdout.write(f'Total students: {len(all_students)}')
        self.stdout.write(f'Total skip records: {total_skips}')
        self.stdout.write('\nLogin credentials:')
        self.stdout.write('  Email: student0001@university.edu to student1000@university.edu')
        self.stdout.write('  Password: password123')
