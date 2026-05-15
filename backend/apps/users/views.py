from rest_framework import generics, viewsets, status, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.core.mail import send_mail
from django.conf import settings
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
        if user.balance == 0:
            user.balance = Decimal('200.00')
            user.save(update_fields=['balance'])
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

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_staff', 'is_active']
    search_fields = ['email', 'full_name', 'phone']
    ordering_fields = ['created_at', 'balance']

    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        target_user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
        target_user.set_password(new_password)
        target_user.save()
        return Response({'detail': f'Password updated for {target_user.email}'})

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['rating', 'hidden']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action == 'list':
            return [permissions.AllowAny()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsPatientUser()]
        if self.action == 'hide':
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.action == 'list' and not (self.request.user.is_authenticated and self.request.user.is_staff):
            return Review.objects.filter(Q(hidden=False) | Q(user=self.request.user))
        if self.action in ['update', 'partial_update', 'destroy'] and not self.request.user.is_staff:
            return Review.objects.filter(user=self.request.user)
        return Review.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def hide(self, request, pk=None):
        review = self.get_object()
        review.hidden = not review.hidden
        review.save(update_fields=['hidden'])
        return Response({'hidden': review.hidden})

class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({'error': 'Both old and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated successfully'})

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        exists = User.objects.filter(email=email).exists()
        return Response({'exists': exists, 'detail': 'If this email is registered, you can reset your password.'})

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('new_password')

        if not email or not new_password:
            return Response({'error': 'Email and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password has been reset successfully.'})

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from apps.appointments.models import AppointmentRequest, AppointmentResponse

        stats = {
            'total_users': User.objects.count(),
            'requests_by_status': {
                'PENDING': 0, 'PROCESSING': 0, 'INCOMPLETE': 0,
                'RESPONDED': 0, 'CONFIRMED': 0, 'REJECTED': 0,
                'COMPLETED': 0, 'CANCELLED': 0,
            },
            'recent_requests': [],
            'my_responses_success': 0,
            'my_responses_failed': 0,
        }

        status_counts = AppointmentRequest.objects.values('status').annotate(
            count=Count('id')
        ).filter(count__gt=0)

        for item in status_counts:
            if item['status'] in stats['requests_by_status']:
                stats['requests_by_status'][item['status']] = item['count']

        my_responses = AppointmentResponse.objects.filter(admin=request.user)

        stats['my_responses_success'] = my_responses.filter(
            request__status__in=['CONFIRMED', 'COMPLETED']
        ).count()

        stats['my_responses_failed'] = my_responses.filter(
            request__status__in=['REJECTED', 'CANCELLED']
        ).count()

        recent_requests = AppointmentRequest.objects.select_related('patient', 'claimed_by').filter(
            status__in=['PENDING', 'PROCESSING', 'REJECTED']
        ).order_by('-created_at')[:10]
        stats['recent_requests'] = [
            {
                'id': r.id,
                'patient_email': r.patient.email,
                'patient_full_name': r.patient.full_name,
                'description': r.description,
                'status': r.status,
                'created_at': r.created_at.isoformat(),
                'claimed_by_email': r.claimed_by.email if r.claimed_by else None,
            }
            for r in recent_requests
        ]

        stats['total_deposited'] = '0.00'
        stats['total_deducted'] = '0.00'

        return Response(stats)