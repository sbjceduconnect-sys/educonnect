import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'educonnect.settings'
django.setup()

from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer

u = User.objects.filter(role='student').first()
if not u:
    u = User.objects.first()

print(f"User ID: {u.id}, Email: {u.email}")

# Test serializer update with sample payload from ProfilePage
data = {
    'firstName': u.first_name or 'Test',
    'lastName': u.last_name or 'Student',
    'profile': {
        'phone': '9876543210',
        'dateOfBirth': '2005-05-15',
        'stream': 'SCIENCE',
        'section': 'A',
        'enrollmentNo': 'ENR12345',
        'departmentId': None,
        'guardianName': 'Guardian Name',
        'guardianPhone': '9876543211',
    }
}

ser = UserSerializer(u, data=data, partial=True)
print("Is valid?", ser.is_valid())
if not ser.is_valid():
    print("Errors:", ser.errors)
else:
    print("Validated data:", ser.validated_data)
    try:
        updated = ser.save()
        print("Save successful! Updated profile phone:", updated.profile.phone)
    except Exception as e:
        print("Save exception:", type(e), e)
