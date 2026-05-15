from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Review

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'email', 'full_name', 'phone', 'bio',
            'photo', 'balance', 'is_staff', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'email', 'balance', 'is_staff', 'is_superuser', 'created_at', 'updated_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            if data.get('photo'):
                data['photo'] = instance.photo.url
        except Exception:
            pass
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'password')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'user_email', 'user_full_name', 'rating', 'comment', 'hidden', 'created_at', 'updated_at')
        read_only_fields = ('user', 'hidden', 'created_at', 'updated_at')

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
