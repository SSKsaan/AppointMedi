from decimal import Decimal
MEDIATION_FEE = Decimal('100.00')
APPOINTMENT_STATUS_CHOICES = (
    ('PENDING', 'Pending'),
    ('PROCESSING', 'Processing'),
    ('INCOMPLETE', 'Incomplete'),
    ('RESPONDED', 'Responded'),
    ('CONFIRMED', 'Confirmed'),
    ('REJECTED', 'Rejected'),
    ('COMPLETED', 'Completed'),
    ('CANCELLED', 'Cancelled'),
)
