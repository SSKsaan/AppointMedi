from rest_framework import generics, viewsets, status, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from decimal import Decimal
from .models import Review
from .serializers import UserSerializer, RegisterSerializer, ReviewSerializer
from .permissions import IsPatientUser, IsAdminUser

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_staff', 'is_active']
    search_fields = ['email', 'full_name', 'phone']
    ordering_fields = ['created_at', 'balance']

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        if self.action == 'create':
            return [IsPatientUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return Review.objects.filter(user=self.request.user)
        return Review.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = {
            'total_users': User.objects.count(),
            'requests_by_status': {
                'PENDING': 0,
                'PROCESSING': 0,
                'INCOMPLETE': 0,
                'RESPONDED': 0,
                'CONFIRMED': 0,
                'REJECTED': 0,
                'COMPLETED': 0,
                'CANCELLED': 0,
            },
            'recent_requests': [],
            'total_deposited': '0.00',
            'total_deducted': '0.00',
        }

        from apps.appointments.models import AppointmentRequest

        status_counts = AppointmentRequest.objects.values('status').annotate(
            count=Count('id')
        ).filter(count__gt=0)

        for item in status_counts:
            if item['status'] in stats['requests_by_status']:
                stats['requests_by_status'][item['status']] = item['count']

        recent_requests = AppointmentRequest.objects.select_related('patient').order_by('-created_at')[:10]
        stats['recent_requests'] = [
            {
                'id': r.id,
                'patient_email': r.patient.email,
                'patient_full_name': r.patient.full_name,
                'status': r.status,
                'created_at': r.created_at.isoformat()
            }
            for r in recent_requests
        ]

        from apps.payments.models import Transaction

        total_deposited = Transaction.objects.filter(
            type='DEPOSIT', status='SUCCESS'
        ).aggregate(total=Coalesce(Sum('amount'), Decimal('0')))['total']

        total_deducted = Transaction.objects.filter(
            type='DEDUCT', status='SUCCESS'
        ).aggregate(total=Coalesce(Sum('amount'), Decimal('0')))['total']

        stats['total_deposited'] = str(total_deposited)
        stats['total_deducted'] = str(total_deducted)

        return Response(stats)