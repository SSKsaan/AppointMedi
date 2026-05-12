from django.urls import path
from .views import PaymentInitiateView, PaymentCallbackView, PaymentHistoryView

urlpatterns = [
    path('initiate/', PaymentInitiateView.as_view(), name='payment-initiate'),
    path('callback/', PaymentCallbackView.as_view(), name='payment-callback'),
    path('history/', PaymentHistoryView.as_view(), name='payment-history'),
]