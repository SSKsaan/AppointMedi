from decimal import Decimal
MEDIATION_FEE = Decimal('100.00')
MAX_REQUEST_UPDATES = 3
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
