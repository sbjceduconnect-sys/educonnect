from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class StudentSessionJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        
        # Check if the user is a student and session control is active
        if user and user.role == 'student':
            token_session_id = validated_token.get('current_session_id')
            if not token_session_id or token_session_id != user.current_session_id:
                raise AuthenticationFailed(
                    "Your session has expired or you have logged in from another device.",
                    code="session_expired"
                )
        return user
