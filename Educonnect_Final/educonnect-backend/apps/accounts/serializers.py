from rest_framework import serializers
from django.contrib.auth import get_user_model
from core.serializers import CamelCaseSerializer
from .models import UserProfile

User = get_user_model()


class UserProfileSerializer(CamelCaseSerializer):
    department_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = UserProfile
        exclude = ['user']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['department_id'] = instance.user.department_id
        return data


class UserSerializer(CamelCaseSerializer):
    full_name = serializers.ReadOnlyField()
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'is_approved', 'phone', 'avatar',
            'department', 'date_joined', 'created_at', 'profile',
        ]
        read_only_fields = ['id', 'date_joined', 'created_at']

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        if profile_data and 'department_id' in profile_data:
            dept_id = profile_data.pop('department_id')
            instance.department_id = dept_id

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update profile fields
        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance


class RegisterSerializer(CamelCaseSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    institutional_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'confirm_password', 'role', 'institutional_code',
            'profile',
        ]

    def to_internal_value(self, data):
        # Convert to a mutable dictionary copy
        try:
            data = data.copy()
        except AttributeError:
            data = dict(data)

        # Auto-fill confirm_password if not provided
        password = data.get('password')
        if password and not data.get('confirm_password'):
            data['confirm_password'] = password

        # Coerce institutionCode/institution_code to institutional_code
        inst_code = data.get('institutionCode') or data.get('institution_code') or data.get('institutional_code')
        if inst_code:
            data['institutional_code'] = inst_code

        return super().to_internal_value(data)

    def validate(self, data):
        from django.conf import settings
        if data['password'] != data.get('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})

        role = data.get('role', 'student')
        code = data.get('institutional_code', '')

        if role == 'admin' and code != settings.ADMIN_CODE:
            raise serializers.ValidationError({'institutional_code': 'Invalid admin institutional code.'})
        if role == 'teacher' and code != settings.TEACHER_CODE:
            raise serializers.ValidationError({'institutional_code': 'Invalid teacher institutional code.'})

        return data

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        validated_data.pop('confirm_password', None)
        validated_data.pop('institutional_code', None)
        password = validated_data.pop('password')
        role = validated_data.get('role', 'student')
        
        dept_id = None
        if profile_data and 'department_id' in profile_data:
            dept_id = profile_data.pop('department_id')

        # No users are auto-approved; all require admin approval
        is_approved = False
        user = User(**validated_data, is_approved=is_approved, department_id=dept_id)
        user.set_password(password)
        user.save()

        # Create or update profile
        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=user)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
