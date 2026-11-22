from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class SafeJWTAuthentication(JWTAuthentication):
    """
    Permissive JWT authenticator that catches expired or invalid tokens and
    returns None instead of raising an AuthenticationFailed / InvalidToken exception.

    This ensures that:
    1. Unauthenticated / public endpoints (e.g. GET /api/v1/academics/departments)
       do not crash with 401 when a client browser sends an expired or stale token from localStorage.
    2. Protected endpoints (IsAuthenticated / IsStudent / IsAdminRole) still correctly
       block unauthenticated requests with 401/403 because request.user remains AnonymousUser.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, AuthenticationFailed, Exception):
            # Treat invalid or expired token as unauthenticated (AnonymousUser)
            # so public endpoints remain accessible.
            return None
