from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from apps.audit_logs.models import AuditLog

class AuditLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # We only log authenticated write/delete actions (POST, PUT, PATCH, DELETE)
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Avoid infinite loops / logging login endpoints
            if '/audit-logs' not in request.path and '/auth/login' not in request.path:
                user = request.user
                # If JWT authentication hasn't resolved user yet, authenticate manually via header
                if not user or not user.is_authenticated:
                    try:
                        auth_res = JWTAuthentication().authenticate(request)
                        if auth_res:
                            user = auth_res[0]
                    except Exception:
                        pass
                
                if user and user.is_authenticated:
                    action = f"{request.method} {request.path}"
                    target = f"Status: {response.status_code}"
                    
                    AuditLog.log(
                        user=user,
                        action=action,
                        target=target,
                        request=request
                    )
                    
        return response
