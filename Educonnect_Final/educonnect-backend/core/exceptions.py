from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        return Response(
            {
                "success": False,
                "message": _extract_message(response.data),
                "errors": response.data,
            },
            status=response.status_code,
        )

    return Response(
        {
            "success": False,
            "message": "An unexpected server error occurred.",
            "errors": str(exc),
        },
        status=500,
    )


def _extract_message(data):
    if isinstance(data, list):
        return str(data[0]) if data else "Error"
    if isinstance(data, dict):
        for key in ('detail', 'non_field_errors'):
            if key in data:
                v = data[key]
                return str(v[0]) if isinstance(v, list) else str(v)
        first_val = next(iter(data.values()), None)
        if isinstance(first_val, list):
            return str(first_val[0])
        return str(first_val) if first_val else "Validation error"
    return str(data)
