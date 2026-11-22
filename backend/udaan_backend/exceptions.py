import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    APIException,
    ValidationError,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
)
from rest_framework import status

logger = logging.getLogger(__name__)


def format_drf_error_details(data):
    """
    Recursively extracts field errors and produces both a clean dictionary
    and a screen-reader friendly summary sentence.
    """
    fields_dict = {}
    messages = []

    def _recurse(d, prefix=""):
        if isinstance(d, dict):
            for k, v in d.items():
                p = f"{prefix}.{k}" if prefix else str(k)
                _recurse(v, p)
        elif isinstance(d, list):
            item_msgs = []
            for item in d:
                if isinstance(item, (dict, list)):
                    _recurse(item, prefix)
                else:
                    item_msgs.append(str(item))
            if item_msgs:
                clean_field = prefix.replace("_", " ") if prefix else "General"
                combined = " ".join(item_msgs)
                fields_dict[prefix or "general"] = combined
                messages.append(f"{clean_field}: {combined}")
        else:
            clean_field = prefix.replace("_", " ") if prefix else "General"
            msg = str(d)
            fields_dict[prefix or "general"] = msg
            messages.append(f"{clean_field}: {msg}")

    _recurse(data)
    combined_message = "; ".join(messages) if messages else "Invalid input."
    return combined_message, fields_dict


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler returning accessible, plain-language error payloads:
    {
        "success": false,
        "error": {
            "code": "...",
            "message": "...",
            "fields": {...}
        },
        "detail": "...",
        "message": "..."
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        code = "API_ERROR"
        if isinstance(exc, ValidationError):
            code = "VALIDATION_ERROR"
        elif isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
            code = "AUTHENTICATION_FAILED"
        elif isinstance(exc, PermissionDenied):
            code = "PERMISSION_DENIED"
        elif isinstance(exc, NotFound):
            code = "NOT_FOUND"
        elif isinstance(exc, MethodNotAllowed):
            code = "METHOD_NOT_ALLOWED"

        # Extract message and field-specific errors
        if isinstance(response.data, dict) and "detail" in response.data and len(response.data) == 1:
            detail_val = response.data["detail"]
            if isinstance(detail_val, str):
                message = detail_val
                fields = {}
            else:
                message, fields = format_drf_error_details(detail_val)
        elif isinstance(response.data, (dict, list)):
            message, fields = format_drf_error_details(response.data)
        else:
            message = str(response.data)
            fields = {}

        # Ensure fallback message if empty
        if not message:
            message = "An error occurred while processing your request."

        payload = {
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "fields": fields,
            },
            # Top-level detail and message for direct frontend compatibility
            "detail": message,
            "message": message,
        }

        response.data = payload
    else:
        # Unhandled 500 exceptions
        logger.exception("Unhandled server exception: %s", exc)
        from rest_framework.response import Response

        payload = {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please contact support.",
                "fields": {},
            },
            "detail": "An unexpected server error occurred. Please contact support.",
            "message": "An unexpected server error occurred. Please contact support.",
        }
        response = Response(payload, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
