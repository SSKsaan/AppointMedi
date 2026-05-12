from django.contrib import admin
from .models import AppointmentRequest, AppointmentResponse

class AppointmentResponseInline(admin.StackedInline):
    model = AppointmentResponse
    extra = 0
    readonly_fields = ('created_at', 'updated_at')

@admin.register(AppointmentRequest)
class AppointmentRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'status', 'update_count', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('patient__email', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [AppointmentResponseInline]

@admin.register(AppointmentResponse)
class AppointmentResponseAdmin(admin.ModelAdmin):
    list_display = ('request', 'admin', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('admin__email', 'description')
    readonly_fields = ('created_at', 'updated_at')
