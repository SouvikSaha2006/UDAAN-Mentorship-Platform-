from django.urls import path
from accounts.views import (
    RegisterView,
    LoginView,
    TokenRefreshView,
    LogoutView,
    SessionHydrationView,
    ForgotPasswordView,
    VerifyResetTokenView,
    ResetPasswordView,
)

urlpatterns = [
    path('register', RegisterView.as_view(), name='auth-register'),
    path('login', LoginView.as_view(), name='auth-login'),
    path('refresh', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout', LogoutView.as_view(), name='auth-logout'),
    path('me', SessionHydrationView.as_view(), name='auth-me'),
    path('forgot-password', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('verify-reset-token', VerifyResetTokenView.as_view(), name='auth-verify-reset-token'),
    path('reset-password', ResetPasswordView.as_view(), name='auth-reset-password'),
]
