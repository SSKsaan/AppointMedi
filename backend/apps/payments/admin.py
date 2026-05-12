from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'user', 'amount', 'type', 'status', 'created_at')
    list_filter = ('type', 'status', 'created_at')
    search_fields = ('user__email', 'transaction_id', 'gateway_ref')
    readonly_fields = ('transaction_id', 'user', 'amount', 'type', 'gateway_ref', 'status', 'created_at')

    def has_add_permission(self, request):
        # Transactions are created by system events (Payments/Mediation), not manually.
        return False

    def has_change_permission(self, request, obj=None):
        # Transactions are immutable audit records.
        return False

    def has_delete_permission(self, request, obj=None):
        # Financial records must never be deleted.
        return False
