from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Transaction

User = get_user_model()

class TransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = Transaction
        fields = (
            'id', 'user', 'user_email', 'user_full_name', 'amount', 'type', 
            'transaction_id', 'gateway_ref', 'status', 'created_at'
        )
        read_only_fields = ('id', 'user', 'transaction_id', 'created_at')