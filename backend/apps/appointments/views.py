from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Case, When, IntegerField, Value
from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.conf import settings
from apps.payments.models import Transaction
from .models import AppointmentRequest, AppointmentResponse
from .serializers import AppointmentRequestSerializer, AppointmentRequestCreateSerializer, AppointmentRequestUpdateSerializer, AppointmentResponseSerializer
from .constants import MEDIATION_FEE
from apps.users.permissions import IsAdminUser, IsPatientUser

class AppointmentRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['description', 'patient__email', 'patient__full_name']

    status_order = Case(
        When(status='RESPONDED', then=Value(0)),
        When(status='INCOMPLETE', then=Value(1)),
        When(status='PENDING', then=Value(2)),
        When(status='PROCESSING', then=Value(3)),
        When(status='REJECTED', then=Value(4)),
        When(status='CONFIRMED', then=Value(5)),
        When(status='COMPLETED', then=Value(6)),
        When(status='CANCELLED', then=Value(7)),
        default=Value(99),
        output_field=IntegerField(),
    )

    def get_queryset(self):
        user = self.request.user
        base_qs = AppointmentRequest.objects.select_related('patient', 'claimed_by').prefetch_related('response')
        if not self.request.query_params.get('ordering'):
            base_qs = base_qs.annotate(status_priority=self.status_order).order_by('status_priority', '-created_at')
        if user.is_staff:
            return base_qs
        return base_qs.filter(patient=user)

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
                amount=-mediation_fee,
                type='DEDUCT',
                status='SUCCESS'
            )

            user.balance -= mediation_fee
            user.save(update_fields=['balance'])

            serializer.save(patient=user)

    def perform_update(self, serializer):
        appointment_request = self.get_object()
        if appointment_request.status == 'INCOMPLETE':
            appointment_request.status = 'PENDING'
        serializer.save()
        if appointment_request.status == 'PENDING':
            appointment_request.save(update_fields=['status', 'updated_at'])

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def claim(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'PENDING':
            return Response(
                {'error': 'Request must be PENDING to be claimed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment_request.status = 'PROCESSING'
        appointment_request.claimed_by = request.user
        appointment_request.save(update_fields=['status', 'claimed_by', 'updated_at'])

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def respond(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status not in ['PROCESSING', 'REJECTED']:
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

        if appointment_request.status not in ['PROCESSING', 'INCOMPLETE']:
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

        response_obj = getattr(appointment_request, 'response', None)
        admin_email = (
            response_obj.admin.email
            if response_obj and response_obj.admin
            else None
        )
        if admin_email:
            send_mail(
                'Appointment Confirmed',
                f'Your appointment response for request {appointment_request.id} has been confirmed by the patient.',
                settings.DEFAULT_FROM_EMAIL,
                [admin_email],
                fail_silently=False,
            )

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

        if appointment_request.status not in ['PENDING', 'INCOMPLETE']:
            return Response(
                {'error': 'Request can only be cancelled when PENDING or INCOMPLETE'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            mediation_fee = MEDIATION_FEE
            if appointment_request.parent_request:
                mediation_fee = MEDIATION_FEE / 2

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

        if appointment_request.status not in ('COMPLETED', 'CONFIRMED'):
            return Response(
                {'error': 'Can only create follow-up for COMPLETED or CONFIRMED requests'},
                status=status.HTTP_400_BAD_REQUEST
            )

        description = request.data.get('description')
        if not description:
            return Response(
                {'error': 'Description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        follow_up_fee = MEDIATION_FEE / 2

        if user.balance < follow_up_fee:
            raise serializers.ValidationError({
                'balance': f'Insufficient balance. Minimum required: {follow_up_fee}'
            })

        with transaction.atomic():
            Transaction.objects.create(
                user=user,
                amount=-follow_up_fee,
                type='DEDUCT',
                status='SUCCESS'
            )

            user.balance -= follow_up_fee
            user.save(update_fields=['balance'])

            follow_up_request = AppointmentRequest.objects.create(
                patient=user,
                description=description,
                parent_request=appointment_request,
                status='PENDING'
            )

        serializer = self.get_serializer(follow_up_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)