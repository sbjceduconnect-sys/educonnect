from rest_framework.response import Response


def api_success(data=None, message="Operation successful", status=200, **kwargs):
    return Response({
        "success": True,
        "message": message,
        "data": data,
    }, status=status, **kwargs)


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


def api_error(message="Something went wrong", errors=None, status=400, **kwargs):
    if message == "Validation failed." and errors:
        message = _extract_message(errors)
        
    payload = {
        "success": False,
        "message": message,
    }
    if errors:
        payload["errors"] = errors
    return Response(payload, status=status, **kwargs)
