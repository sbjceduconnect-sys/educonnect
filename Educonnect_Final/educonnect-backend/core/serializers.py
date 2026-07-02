from rest_framework import serializers
from core.case import convert_dict_keys, snake_to_camel, camel_to_snake

class CamelCaseSerializerMixin:
    """Mixin to automatically translate serialization inputs and outputs between camelCase and snake_case."""
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        return convert_dict_keys(data, snake_to_camel)

    def to_internal_value(self, data):
        # Convert incoming keys from camelCase to snake_case
        converted_data = convert_dict_keys(data, camel_to_snake)
        
        # Normalize empty strings to None for non-string fields or allow_null/optional fields
        for field_name, field in self.fields.items():
            if field_name in converted_data:
                val = converted_data[field_name]
                if val in ('', 'null', 'undefined'):
                    if getattr(field, 'allow_null', False) or not getattr(field, 'required', True) or not isinstance(field, serializers.CharField):
                        converted_data[field_name] = None
                    
        return super().to_internal_value(converted_data)

class CamelCaseSerializer(CamelCaseSerializerMixin, serializers.ModelSerializer):
    """Base ModelSerializer that handles case conversion automatically."""
    pass

class CamelCaseBaseSerializer(CamelCaseSerializerMixin, serializers.Serializer):
    """Base Serializer that handles case conversion automatically."""
    pass
