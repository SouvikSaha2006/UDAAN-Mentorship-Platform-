from rest_framework import status, exceptions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Q
from academics.models import Department, Course
from academics.serializers import (
    DepartmentSerializer,
    DepartmentCreateSerializer,
    CourseSerializer,
    CourseCreateSerializer,
    is_valid_uuid,
)
from accounts.permissions import IsAdminRole


class DepartmentListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [AllowAny()]

    def get(self, request):
        queryset = Department.objects.all().prefetch_related('courses', 'student_profiles')
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            active_bool = is_active.lower() in ['true', '1']
            queryset = queryset.filter(is_active=active_bool)

        serializer = DepartmentSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = DepartmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dept = serializer.save()
        return Response(DepartmentSerializer(dept).data, status=status.HTTP_201_CREATED)


class DepartmentDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [AllowAny()]

    def get(self, request, department_id):
        q = Q(id=department_id) if is_valid_uuid(department_id) else Q(code=str(department_id).upper())
        dept = Department.objects.filter(q).first()
        if not dept:
            raise exceptions.NotFound(f"Department '{department_id}' not found.")
        return Response(DepartmentSerializer(dept).data, status=status.HTTP_200_OK)

    def patch(self, request, department_id):
        q = Q(id=department_id) if is_valid_uuid(department_id) else Q(code=str(department_id).upper())
        dept = Department.objects.filter(q).first()
        if not dept:
            raise exceptions.NotFound(f"Department '{department_id}' not found.")

        data = request.data
        if 'name' in data:
            dept.name = data['name']
        if 'hod' in data:
            dept.hod = data['hod']
        if 'description' in data:
            dept.description = data['description']
        if 'accessibility_compliance' in data:
            dept.accessibility_compliance = int(data['accessibility_compliance'])
        if 'is_active' in data:
            dept.is_active = bool(data['is_active'])
        dept.save()
        return Response(DepartmentSerializer(dept).data, status=status.HTTP_200_OK)

    def put(self, request, department_id):
        return self.patch(request, department_id)


class DepartmentCoursesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, department_id):
        q = Q(id=department_id) if is_valid_uuid(department_id) else Q(code=str(department_id).upper())
        dept = Department.objects.filter(q).first()
        if not dept:
            raise exceptions.NotFound(f"Department '{department_id}' not found.")

        queryset = dept.courses.all()
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            active_bool = is_active.lower() in ['true', '1']
            queryset = queryset.filter(is_active=active_bool)

        serializer = CourseSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseListView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [AllowAny()]

    def get(self, request):
        queryset = Course.objects.all().select_related('department')
        department_id = request.query_params.get('department_id')
        if department_id:
            q = Q(department__id=department_id) if is_valid_uuid(department_id) else Q(department__code=str(department_id).upper())
            queryset = queryset.filter(q)

        is_active = request.query_params.get('is_active')
        if is_active is not None:
            active_bool = is_active.lower() in ['true', '1']
            queryset = queryset.filter(is_active=active_bool)

        serializer = CourseSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CourseCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class CourseDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [AllowAny()]

    def get(self, request, course_id):
        q = Q(id=course_id) if is_valid_uuid(course_id) else Q(code=str(course_id).upper())
        course = Course.objects.filter(q).select_related('department').first()
        if not course:
            raise exceptions.NotFound(f"Course '{course_id}' not found.")
        return Response(CourseSerializer(course).data, status=status.HTTP_200_OK)

    def patch(self, request, course_id):
        q = Q(id=course_id) if is_valid_uuid(course_id) else Q(code=str(course_id).upper())
        course = Course.objects.filter(q).select_related('department').first()
        if not course:
            raise exceptions.NotFound(f"Course '{course_id}' not found.")

        data = request.data
        if 'name' in data:
            course.name = data['name']
        if 'total_semesters' in data:
            course.total_semesters = int(data['total_semesters'])
        if 'is_active' in data:
            course.is_active = bool(data['is_active'])
        course.save()
        return Response(CourseSerializer(course).data, status=status.HTTP_200_OK)

    def put(self, request, course_id):
        return self.patch(request, course_id)
