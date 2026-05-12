import uuid
from django.db import models
from django.conf import settings
from .constants import TRANSACTION_TYPE_CHOICES, TRANSACTION_STATUS_CHOICES

class Transaction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPE_CHOICES
    )
    transaction_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False
    )
    gateway_ref = models.CharField(
        max_length=100,
        blank=True,
        help_text="Gateway-provided transaction reference (e.g., SSLCommerz val_id)"
    )
    status = models.CharField(
        max_length=10,
        choices=TRANSACTION_STATUS_CHOICES,
        default='PENDING'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"{self.type} - {self.amount} ({self.status})"
