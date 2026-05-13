from rest_framework import serializers
from django.conf import settings
from .models import AppointmentRequest, AppointmentResponse

User = settings.AUTH_USER_MODEL

class AppointmentRequestSerializer(serializers.ModelSerializer):
    patient_email = serializers.EmailField(source='patient.email', read_only=True)
    patient_full_name = serializers.CharField(source='patient.full_name', read_only=True)
    response = serializers.SerializerMethodField()
    
    class Meta:
        model = AppointmentRequest
        fields = ('id', 'patient', 'patient_email', 'patient_full_name', 'description', 
                 'status', 'update_count', 'parent_request', 'response', 
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'patient', 'status', 'update_count', 'created_at', 'updated_at')
    
    def get_response(self, obj):
        if hasattr(obj, 'response') and obj.response:
            return {
                'id': obj.response.id,
                'admin_email': obj.response.admin.email if obj.response.admin else None,
                'admin_full_name': obj.response.admin.full_name if obj.response.admin else None,
                'description': obj.response.description,
                'created_at': obj.response.created_at,
                'updated_at': obj.response.updated_at
            }
        return None

class AppointmentResponseSerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(source='admin.email', read_only=True)
    admin_full_name = serializers.CharField(source='admin.full_name', read_only=True)
    
    class Meta:
        model = AppointmentResponse
        fields = ('id', 'request', 'admin', 'admin_email', 'admin_full_name', 
                 'description', 'created_at', 'updated_at')
        read_only_fields = ('id', 'request', 'admin', 'created_at', 'updated_at')

class AppointmentRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentRequest
        fields = ('description', 'parent_request')
    
    def validate_parent_request(self, value):
        if value and value.status != 'COMPLETED':
            raise serializers.ValidationError("Parent request must be COMPLETED for follow-ups")
        return value

class AppointmentRequestUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentRequest
        fields = ('description',)