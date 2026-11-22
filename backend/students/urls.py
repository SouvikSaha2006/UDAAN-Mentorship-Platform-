from django.urls import path
from students.views import (
    StudentMeView,
    StudentPersonalView,
    StudentAcademicsView,
    StudentAccessibilityView,
    StudentListView,
    StudentStatusView,
    StudentDetailView,
    StudentProfileLegacyView,
    AccessibilitySettingsView,
)

urlpatterns = [
    path('me', StudentMeView.as_view(), name='student-me'),
    path('me/personal', StudentPersonalView.as_view(), name='student-personal'),
    path('me/academics', StudentAcademicsView.as_view(), name='student-academics'),
    path('me/accessibility', StudentAccessibilityView.as_view(), name='student-accessibility'),
    path('profile', StudentProfileLegacyView.as_view(), name='student-profile-legacy'),
    path('', StudentListView.as_view(), name='student-list'),
    path('<str:student_id>/status', StudentStatusView.as_view(), name='student-status'),
    path('<str:student_id>', StudentDetailView.as_view(), name='student-detail'),
]
