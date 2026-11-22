from django.urls import path
from academics.views import (
    DepartmentListView,
    DepartmentDetailView,
    DepartmentCoursesView,
    CourseListView,
    CourseDetailView,
)

urlpatterns = [
    path('departments', DepartmentListView.as_view(), name='department-list'),
    path('departments/<str:department_id>', DepartmentDetailView.as_view(), name='department-detail'),
    path('departments/<str:department_id>/courses', DepartmentCoursesView.as_view(), name='department-courses'),
    path('courses', CourseListView.as_view(), name='course-list'),
    path('courses/<str:course_id>', CourseDetailView.as_view(), name='course-detail'),
]
