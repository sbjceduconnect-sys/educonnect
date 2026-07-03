import sys, os, django
sys.path.insert(0, os.path.abspath('educonnect-backend'))
os.environ['DJANGO_SETTINGS_MODULE'] = 'educonnect.settings'
django.setup()

from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer

u = User.objects.filter(role='student').first()
if not u:
    u = User.objects.first()

print(f"Testing user: {u.id} {u.email}")
data = {
    'firstName': 'Test',
    'lastName': 'User',
    'profile': {
        'phone': '9999999999',
        'dateOfBirth': '2005-01-01',
        'enrollmentNo': 'REG123',
        'departmentId': None,
        'stream': 'SCIENCE',
        'section': 'A',
        'guardianName': 'Parent',
        'guardianPhone': '8888888888',
        'address': 'Some Address'
    }
}

ser = UserSerializer(u, data=data, partial=True)
if ser.is_valid():
    print("VALID!")
    # don't save, just test
else:
    print("ERRORS:", ser.errors)
