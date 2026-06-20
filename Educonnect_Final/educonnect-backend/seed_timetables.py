import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'educonnect.settings')
django.setup()

from apps.departments.models import Department
from apps.courses.models import Course
from apps.subjects.models import Subject
from apps.accounts.models import User
from apps.timetables.models import Timetable

# 1. Look up teachers by email
teacher_math = User.objects.filter(email='math@sbjc.edu').first()
teacher_chem = User.objects.filter(email='chemistry@sbjc.edu').first()
teacher_arun = User.objects.filter(email='teacher@sbjc.edu').first()
fallback_teacher = User.objects.filter(role='teacher').first() or User.objects.first()

teacher_math_id = teacher_math.id if teacher_math else fallback_teacher.id
teacher_chem_id = teacher_chem.id if teacher_chem else fallback_teacher.id
teacher_arun_id = teacher_arun.id if teacher_arun else fallback_teacher.id

print(f"Resolved teachers: Math ({teacher_math_id}), Chem ({teacher_chem_id}), Arun ({teacher_arun_id})")

# 2. Ensure all 12th Science subjects have assigned teachers in DB
subject_teacher_mappings = {
    '12PHY': teacher_arun_id,
    '12CHEM': teacher_chem_id,
    '12MATHS': teacher_math_id,
    '12BIO': teacher_math_id,
    '12SCI-ENG': teacher_arun_id,
    '12SCI-GEO': teacher_chem_id,
    '12SCI-IT': teacher_arun_id,
    '12SCI-MAR': teacher_arun_id,
}

for code, teacher_id in subject_teacher_mappings.items():
    try:
        sub = Subject.objects.get(code=code)
        sub.teacher_id = teacher_id
        sub.save()
        print(f"Updated subject {sub.name} ({code}) with teacher ID {teacher_id}")
    except Subject.DoesNotExist:
        print(f"Subject code {code} not found.")

# 3. Create custom placeholder subjects if not present
bl_sub, _ = Subject.objects.get_or_create(code='12BL', defaults={
    'name': 'Biology Lab / Practical',
    'department_id': 7,
    'teacher_id': teacher_math_id,
    'type': 'practical'
})

pt_sub, _ = Subject.objects.get_or_create(code='12PT', defaults={
    'name': 'Physical Training',
    'department_id': 7,
    'teacher_id': teacher_arun_id,
    'type': 'practical'
})

test_sub, _ = Subject.objects.get_or_create(code='12TEST', defaults={
    'name': 'Weekly Assessment / Test',
    'department_id': 7,
    'teacher_id': teacher_arun_id,
    'type': 'theory'
})

print(f"Placeholder subjects resolved: BL ({bl_sub.id}), PT ({pt_sub.id}), TEST ({test_sub.id})")

# Helper function to get subject and teacher info for slot mapping
def make_slot(code, start_time, end_time, room='Room 301'):
    if code == '12BL':
        return {
            'subject_id': bl_sub.id,
            'teacher_id': bl_sub.teacher_id or teacher_math_id,
            'start_time': start_time,
            'end_time': end_time,
            'room': room
        }
    elif code == '12PT':
        return {
            'subject_id': pt_sub.id,
            'teacher_id': pt_sub.teacher_id or teacher_arun_id,
            'start_time': start_time,
            'end_time': end_time,
            'room': room
        }
    elif code == '12TEST':
        return {
            'subject_id': test_sub.id,
            'teacher_id': test_sub.teacher_id or teacher_arun_id,
            'start_time': start_time,
            'end_time': end_time,
            'room': room
        }
    else:
        try:
            sub = Subject.objects.get(code=code)
            return {
                'subject_id': sub.id,
                'teacher_id': sub.teacher_id or subject_teacher_mappings.get(code, teacher_arun_id),
                'start_time': start_time,
                'end_time': end_time,
                'room': room
            }
        except Subject.DoesNotExist:
            return {
                'subject_id': None,
                'teacher_id': subject_teacher_mappings.get(code, teacher_arun_id),
                'start_time': start_time,
                'end_time': end_time,
                'room': room
            }

# Time intervals
times = [
    ("08:15", "09:00"),
    ("09:00", "09:45"),
    ("09:45", "10:30"),
    ("11:00", "11:45"),
    ("11:45", "12:30"),
    ("12:30", "13:15"),
    ("13:15", "14:00")
]

# Timetable XIIth A Science
# Row structure: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
# Period 1
p1_a = ['12MATHS', '12CHEM', '12MATHS', '12PHY', '12SCI-ENG', '12PHY']
# Period 2
p2_a = ['12MATHS', '12PHY', '12MATHS', '12PHY', '12CHEM', '12CHEM']
# Period 3
p3_a = ['12SCI-IT', '12SCI-ENG', '12CHEM', '12MATHS', '12SCI-IT', '12CHEM']
# Period 4
p4_a = ['12CHEM', '12SCI-IT', '12PHY', '12CHEM', '12MATHS', '12SCI-GEO']
# Period 5
p5_a = ['12BL', '12PT', '12SCI-ENG', '12CHEM', '12SCI-GEO', '12TEST']
# Period 6
p6_a = ['12PHY', '12MATHS', '12SCI-GEO', '12SCI-ENG', '12BL', None]
# Period 7
p7_a = ['12PHY', '12MATHS', '12SCI-IT', '12SCI-GEO', '12PHY', None]

periods_a = [p1_a, p2_a, p3_a, p4_a, p5_a, p6_a, p7_a]

days_list = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
schedule_a = {day: [] for day in days_list}

for period_idx, period_slots in enumerate(periods_a):
    start, end = times[period_idx]
    for day_idx, code in enumerate(period_slots):
        if code is not None:
            day_name = days_list[day_idx]
            schedule_a[day_name].append(make_slot(code, start, end, room='Room 301'))

formatted_schedule_a = [{'day': day, 'slots': slots} for day, slots in schedule_a.items()]

# Delete existing timetables for 12th Science Sec A to avoid duplicates
Timetable.objects.filter(department_id=7, stream='12th Science', section='A').delete()

# Create for both academic years
for year in ['2025-2026', '2026-27']:
    Timetable.objects.create(
        department_id=7,
        stream='12th Science',
        section='A',
        academic_year=year,
        schedule=formatted_schedule_a
    )
    print(f"Created Timetable for XIIth A Science, Academic Year {year}")


# Timetable XIIth B Science
# Row structure: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
# Period 1
p1_b = ['12PHY', '12PHY', '12CHEM', '12MATHS', '12SCI-ENG', '12MATHS']
# Period 2
p2_b = ['12PHY', '12MATHS', '12PHY', '12BIO', '12BIO', '12PHY']
# Period 3
p3_b = ['12BIO', '12MATHS', '12SCI-IT', '12BIO', '12MATHS', '12TEST']
# Period 4
p4_b = ['12SCI-ENG', '12BIO', '12MATHS', '12SCI-GEO', '12CHEM', '12CHEM']
# Period 5
p5_b = ['12CHEM', '12SCI-IT', '12SCI-GEO', '12PHY', '12PHY', '12CHEM']
# Period 6
p6_b = ['12SCI-GEO', '12SCI-ENG', '12BIO', '12CHEM', '12SCI-GEO', None]
# Period 7
p7_b = ['12MATHS', '12CHEM', '12BIO', '12SCI-IT', '12BL', None]

periods_b = [p1_b, p2_b, p3_b, p4_b, p5_b, p6_b, p7_b]

schedule_b = {day: [] for day in days_list}

for period_idx, period_slots in enumerate(periods_b):
    start, end = times[period_idx]
    for day_idx, code in enumerate(period_slots):
        if code is not None:
            day_name = days_list[day_idx]
            schedule_b[day_name].append(make_slot(code, start, end, room='Room 302'))

formatted_schedule_b = [{'day': day, 'slots': slots} for day, slots in schedule_b.items()]

# Delete existing timetables for 12th Science Sec B to avoid duplicates
Timetable.objects.filter(department_id=7, stream='12th Science', section='B').delete()

# Create for both academic years
for year in ['2025-2026', '2026-27']:
    Timetable.objects.create(
        department_id=7,
        stream='12th Science',
        section='B',
        academic_year=year,
        schedule=formatted_schedule_b
    )
    print(f"Created Timetable for XIIth B Science, Academic Year {year}")
