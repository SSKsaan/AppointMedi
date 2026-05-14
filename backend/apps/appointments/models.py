from django.db import models
from django.conf import settings
from .constants import APPOINTMENT_STATUS_CHOICES

class AppointmentRequest(models.Model):
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointment_requests',
        limit_choices_to={'is_staff': False}
    )
    parent_request = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='follow_up'
    )
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=APPOINTMENT_STATUS_CHOICES,
        default='PENDING'
    )
    claimed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='claimed_requests',
        limit_choices_to={'is_staff': True}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
        ]

    def __str__(self):
        return f"Request {self.id} by {self.patient.email} ({self.status})"

    @property
    def can_patient_edit(self):
        return self.status in ['PENDING', 'INCOMPLETE']

    @property
    def can_admin_respond(self):
        return self.status == 'PROCESSING'


class AppointmentResponse(models.Model):
    request = models.OneToOneField(
        AppointmentRequest,
        on_delete=models.CASCADE,
        related_name='response'
    )
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='appointment_responses',
        limit_choices_to={'is_staff': True}
    )
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Response for Request {self.request.id}"
