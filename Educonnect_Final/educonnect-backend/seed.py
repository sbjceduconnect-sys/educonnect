import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'educonnect.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()

# Create Admin
if not User.objects.filter(email='admin@sbjc.edu').exists():
    admin = User.objects.create_superuser(
        username='admin',
        email='admin@sbjc.edu',
        password='admin123',
        first_name='System',
        last_name='Admin',
        role='admin',
        is_approved=True
    )
    print("Created admin user: admin@sbjc.edu / admin123")

# Create Teacher
if not User.objects.filter(email='teacher@sbjc.edu').exists():
    teacher = User.objects.create_user(
        username='teacher',
        email='teacher@sbjc.edu',
        password='teacher123',
        first_name='Arun',
        last_name='Kumar',
        role='teacher',
        is_approved=True
    )
    print("Created teacher user: teacher@sbjc.edu / teacher123")

# Create Student
if not User.objects.filter(email='student@sbjc.edu').exists():
    student = User.objects.create_user(
        username='student',
        email='student@sbjc.edu',
        password='student123',
        first_name='Priya',
        last_name='Sharma',
        role='student',
        is_approved=True
    )
    print("Created student user: student@sbjc.edu / student123")
