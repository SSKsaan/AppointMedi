MAX_DEPOSIT_AMOUNT = 100000.00

TRANSACTION_TYPE_CHOICES = (
    ('DEPOSIT', 'Deposit'),
    ('DEDUCT', 'Deduct'),
)

TRANSACTION_STATUS_CHOICES = (
    ('PENDING', 'Pending'),
    ('SUCCESS', 'Success'),
    ('FAILED', 'Failed'),
)
