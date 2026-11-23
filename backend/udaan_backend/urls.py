from django.contrib import admin
from django.urls import path, re_path, include
from students.views import AccessibilitySettingsView, StudentListView
from students.events import RealtimeStreamView

urlpatterns = [
    path('admin/', admin.site.urls),
    re_path(r'^api/v1/realtime/stream/?$', RealtimeStreamView.as_view(), name='realtime-stream'),
    re_path(r'^api/v1/auth/', include('accounts.urls')),
    re_path(r'^api/v1/academics/', include('academics.urls')),
    # Handle /api/v1/students with and without trailing slash
    re_path(r'^api/v1/students$', StudentListView.as_view(), name='student-list-noslash'),
    re_path(r'^api/v1/students/', include('students.urls')),
    re_path(r'^api/v1/accessibility/?$', AccessibilitySettingsView.as_view(), name='accessibility-root'),
]
