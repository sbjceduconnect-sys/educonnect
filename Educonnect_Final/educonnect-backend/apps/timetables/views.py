from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from core.case import convert_dict_keys, camel_to_snake
from .models import Timetable
from .serializers import TimetableSerializer

class TimetableListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Timetable.objects.all()
        
        # Filters
        department_id = request.query_params.get('departmentId') or request.query_params.get('department_id')
        stream = request.query_params.get('stream')
        section = request.query_params.get('section')
        academic_year = request.query_params.get('academicYear') or request.query_params.get('academic_year')
        
        if department_id:
            qs = qs.filter(department_id=department_id)
        if stream:
            qs = qs.filter(stream=stream)
        if section:
            qs = qs.filter(section=section)
        if academic_year:
            qs = qs.filter(academic_year=academic_year)
            
        return api_success(data=TimetableSerializer(qs, many=True).data)

    def post(self, request):
        s = TimetableSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Timetable created.", status=201)
        return api_error("Validation failed.", errors=s.errors)


class TimetableDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Timetable.objects.get(pk=pk)
        except Timetable.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Timetable not found.", status=404)
        return api_success(data=TimetableSerializer(obj).data)

    def put(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Timetable not found.", status=404)
        s = TimetableSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Timetable updated.")
        return api_error("Validation failed.", errors=s.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Timetable not found.", status=404)
        obj.delete()
        return api_success(message="Timetable deleted.", status=200)


class TeacherScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, teacher_id):
        tts = Timetable.objects.all()
        teacher_tts = []
        for tt in tts:
            found = False
            for day_obj in tt.schedule:
                for slot in day_obj.get('slots', []):
                    # Check both snake_case and camelCase
                    other_teacher = slot.get('teacher_id') or slot.get('teacherId')
                    if other_teacher == teacher_id or str(other_teacher) == str(teacher_id):
                        found = True
                        break
                if found:
                    break
            if found:
                teacher_tts.append(tt)
        return api_success(data=TimetableSerializer(teacher_tts, many=True).data)


class TimetableValidateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = convert_dict_keys(request.data, camel_to_snake)
        schedule = data.get('schedule', [])
        department_id = data.get('department_id')
        
        conflicts = []
        has_conflicts = False
        
        all_tts = Timetable.objects.all()
        
        for day_obj in schedule:
            day = day_obj.get('day')
            slots = day_obj.get('slots', [])
            for slot in slots:
                teacher_id = slot.get('teacher_id')
                start = slot.get('start_time')
                end = slot.get('end_time')
                room = slot.get('room')
                
                if not teacher_id or not start or not end:
                    continue
                    
                # Check overlaps
                for other in all_tts:
                    for other_day in other.schedule:
                        if other_day.get('day') == day:
                            for other_slot in other_day.get('slots', []):
                                other_teacher = other_slot.get('teacher_id') or other_slot.get('teacherId')
                                other_start = other_slot.get('start_time') or other_slot.get('startTime')
                                other_end = other_slot.get('end_time') or other_slot.get('endTime')
                                other_room = other_slot.get('room')
                                
                                if not other_teacher or not other_start or not other_end:
                                    continue
                                    
                                overlap = (start < other_end) and (other_start < end)
                                if overlap:
                                    if str(other_teacher) == str(teacher_id):
                                        has_conflicts = True
                                        conflicts.append({
                                            "day": day,
                                            "time": f"{start} - {end}",
                                            "message": f"Teacher is already booked in {other.department.name if other.department else 'another'} class."
                                        })
                                    if room and other_room == room:
                                        has_conflicts = True
                                        conflicts.append({
                                            "day": day,
                                            "time": f"{start} - {end}",
                                            "message": f"Room {room} is already booked for another class."
                                        })
                                        
        return api_success(data={
            "hasConflicts": has_conflicts,
            "conflicts": conflicts
        })
