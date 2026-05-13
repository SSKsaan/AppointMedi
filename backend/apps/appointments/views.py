from django.core.mail import send_mail
from django.db import transaction
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.conf import settings
from apps.payments.models import Transaction
from .models import AppointmentRequest, AppointmentResponse
from .serializers import AppointmentRequestSerializer, AppointmentRequestCreateSerializer, AppointmentRequestUpdateSerializer, AppointmentResponseSerializer
from .constants import MEDIATION_FEE, MAX_REQUEST_UPDATES
from apps.users.permissions import IsAdminUser, IsPatientUser

class AppointmentRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['description', 'patient__email', 'patient__full_name']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return AppointmentRequest.objects.select_related('patient').prefetch_related('response')
        return AppointmentRequest.objects.filter(patient=user).select_related('patient').prefetch_related('response')

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentRequestUpdateSerializer
        return AppointmentRequestSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [IsPatientUser()]
        elif self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsPatientUser()]
        elif self.action in ['claim', 'respond', 'request_incomplete', 'complete']:
            return [IsAdminUser()]
        elif self.action in ['confirm', 'reject', 'cancel', 'follow_up']:
            return [IsPatientUser()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        mediation_fee = MEDIATION_FEE

        if user.balance < mediation_fee:
            raise serializers.ValidationError({
                'balance': f'Insufficient balance. Minimum required: {mediation_fee}'
            })

        with transaction.atomic():
            Transaction.objects.create(
                user=user,
                amount=mediation_fee,
                type='DEDUCT',
                status='SUCCESS'
            )

            user.balance -= mediation_fee
            user.save(update_fields=['balance'])

            serializer.save(patient=user)

    def perform_update(self, serializer):
        appointment_request = self.get_object()

        if appointment_request.update_count >= MAX_REQUEST_UPDATES:
            raise serializers.ValidationError({
                'detail': f'Editing limit reached. Maximum {MAX_REQUEST_UPDATES} updates allowed.'
            })

        fields_to_update = ['update_count']
        appointment_request.update_count += 1

        if appointment_request.status == 'INCOMPLETE':
            appointment_request.status = 'PENDING'
            fields_to_update.append('status')

        appointment_request.save(update_fields=fields_to_update)
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def claim(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'PENDING':
            return Response(
                {'error': 'Request must be PENDING to be claimed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment_request.status = 'PROCESSING'
        appointment_request.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def respond(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'PROCESSING':
            return Response(
                {'error': 'Request must be PROCESSING to respond'},
                status=status.HTTP_400_BAD_REQUEST
            )

        description = request.data.get('description')
        if not description:
            return Response(
                {'error': 'Description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            appointment_response, created = AppointmentResponse.objects.get_or_create(
                request=appointment_request,
                defaults={
                    'admin': request.user,
                    'description': description
                }
            )

            if not created:
                appointment_response.admin = request.user
                appointment_response.description = description
                appointment_response.save()

            appointment_request.status = 'RESPONDED'
            appointment_request.save(update_fields=['status', 'updated_at'])

            send_mail(
                'Appointment Response',
                f'Your appointment request has been responded to: {description}',
                settings.DEFAULT_FROM_EMAIL,
                [appointment_request.patient.email],
                fail_silently=False,
            )

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def request_incomplete(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'PROCESSING':
            return Response(
                {'error': 'Request must be PROCESSING to mark as incomplete'},
                status=status.HTTP_400_BAD_REQUEST
            )

        description = request.data.get('description')
        if not description:
            return Response(
                {'error': 'Description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            appointment_response, created = AppointmentResponse.objects.get_or_create(
                request=appointment_request,
                defaults={
                    'admin': request.user,
                    'description': description
                }
            )

            if not created:
                appointment_response.admin = request.user
                appointment_response.description = description
                appointment_response.save()

            appointment_request.status = 'INCOMPLETE'
            appointment_request.save(update_fields=['status', 'updated_at'])

            send_mail(
                'More Information Required',
                f'Your appointment request needs more information: {description}',
                settings.DEFAULT_FROM_EMAIL,
                [appointment_request.patient.email],
                fail_silently=False,
            )

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsPatientUser])
    def confirm(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.patient != request.user:
            return Response(
                {'error': 'You can only confirm your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        if appointment_request.status != 'RESPONDED':
            return Response(
                {'error': 'Request must be RESPONDED to be confirmed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment_request.status = 'CONFIRMED'
        appointment_request.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsPatientUser])
    def reject(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.patient != request.user:
            return Response(
                {'error': 'You can only reject your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        if appointment_request.status != 'RESPONDED':
            return Response(
                {'error': 'Request must be RESPONDED to be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment_request.status = 'REJECTED'
        appointment_request.save(update_fields=['status', 'updated_at'])

        response_obj = getattr(appointment_request, 'response', None)
        admin_email = (
            response_obj.admin.email
            if response_obj and response_obj.admin
            else None
        )
        if admin_email:
            send_mail(
                'Appointment Rejected',
                f'Your appointment response for request {appointment_request.id} has been rejected by the patient.',
                settings.DEFAULT_FROM_EMAIL,
                [admin_email],
                fail_silently=False,
            )

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsPatientUser])
    def cancel(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.patient != request.user:
            return Response(
                {'error': 'You can only cancel your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        if appointment_request.status not in ['PENDING', 'PROCESSING']:
            return Response(
                {'error': 'Request can only be cancelled when PENDING or PROCESSING'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            mediation_fee = MEDIATION_FEE

            Transaction.objects.create(
                user=request.user,
                amount=mediation_fee,
                type='DEPOSIT',
                status='SUCCESS'
            )

            request.user.balance += mediation_fee
            request.user.save(update_fields=['balance'])

            appointment_request.status = 'CANCELLED'
            appointment_request.save(update_fields=['status', 'updated_at'])

        send_mail(
            'Appointment Cancelled',
            f'Your appointment request {appointment_request.id} has been cancelled.',
            settings.DEFAULT_FROM_EMAIL,
            [appointment_request.patient.email],
            fail_silently=False,
        )

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def complete(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'CONFIRMED':
            return Response(
                {'error': 'Request must be CONFIRMED to be marked as completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment_request.status = 'COMPLETED'
        appointment_request.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsPatientUser])
    def follow_up(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.patient != request.user:
            return Response(
                {'error': 'You can only create follow-ups for your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )

        if appointment_request.status != 'COMPLETED':
            return Response(
                {'error': 'Can only create follow-up for COMPLETED requests'},
                status=status.HTTP_400_BAD_REQUEST
            )

        description = request.data.get('description')
        if not description:
            return Response(
                {'error': 'Description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        mediation_fee = MEDIATION_FEE

        if user.balance < mediation_fee:
            raise serializers.ValidationError({
                'balance': f'Insufficient balance. Minimum required: {mediation_fee}'
            })

        with transaction.atomic():
            Transaction.objects.create(
                user=user,
                amount=mediation_fee,
                type='DEDUCT',
                status='SUCCESS'
            )

            user.balance -= mediation_fee
            user.save(update_fields=['balance'])

            follow_up_request = AppointmentRequest.objects.create(
                patient=user,
                description=description,
                parent_request=appointment_request,
                status='PENDING'
            )

        serializer = self.get_serializer(follow_up_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)