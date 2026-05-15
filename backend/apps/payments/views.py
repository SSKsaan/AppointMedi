import uuid
from decimal import Decimal
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.conf import settings
from django.http import HttpResponseRedirect
from django.db import transaction as db_transaction
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.users.permissions import IsPatientUser
from .models import Transaction
from .serializers import TransactionSerializer
from .constants import MAX_DEPOSIT_AMOUNT
from sslcommerz_lib import SSLCOMMERZ


class PaymentInitiateView(APIView):
    permission_classes = [IsAuthenticated, IsPatientUser]

    def post(self, request):
        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(amount)
            if amount <= 0:
                return Response({'error': 'Amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
            if amount > MAX_DEPOSIT_AMOUNT:
                return Response({'error': f'Amount exceeds maximum limit of {MAX_DEPOSIT_AMOUNT}'}, status=status.HTTP_400_BAD_REQUEST)
        except:
            return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)

        transaction_id = uuid.uuid4()

        sslcz = SSLCOMMERZ({
            'store_id': settings.SSLCOMMERZ_STORE_ID,
            'store_pass': settings.SSLCOMMERZ_STORE_PASS,
            'issandbox': settings.SSLCOMMERZ_IS_SANDBOX
        })

        post_body = {
            'total_amount': amount,
            'currency': 'BDT',
            'tran_id': str(transaction_id),
            'success_url': f'{settings.BACKEND_URL}/api/payments/callback/',
            'fail_url': f'{settings.BACKEND_URL}/api/payments/callback/',
            'cancel_url': f'{settings.BACKEND_URL}/api/payments/callback/',
            'emi_mode': 0,
            'cus_name': request.user.full_name or request.user.email,
            'cus_email': request.user.email,
            'cus_phone': request.user.phone or '01700000000',
            'cus_add1': 'Dhaka',
            'cus_city': 'Dhaka',
            'cus_country': 'Bangladesh',
            'shipping_method': 'NO',
            'product_name': 'Appointment Medi Balance Topup',
            'product_category': 'Financial Service',
            'product_profile': 'general',
        }

        try:
            response = sslcz.createSession(post_body)
            if response.get('status') == 'SUCCESS' and response.get('GatewayPageURL'):
                txn = Transaction.objects.create(
                    user=request.user,
                    amount=amount,
                    type='DEPOSIT',
                    status='PENDING',
                    transaction_id=transaction_id
                )
                return Response({
                    'redirect_url': response['GatewayPageURL'],
                    'transaction_id': str(txn.transaction_id)
                })
            else:
                return Response({'error': 'Failed to initiate payment with gateway'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Payment gateway error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class PaymentCallbackView(View):
    def post(self, request):
        payment_data = request.POST.dict()
        tran_id = payment_data.get('tran_id')
        val_id = payment_data.get('val_id')

        if not tran_id or not val_id:
            return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment/failure?reason=missing_params')

        try:
            txn = Transaction.objects.get(transaction_id=tran_id, type='DEPOSIT')
        except Transaction.DoesNotExist:
            return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment/failure?reason=invalid_transaction')

        if txn.status != 'PENDING':
            return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment/failure?reason=already_processed')

        sslcz = SSLCOMMERZ({
            'store_id': settings.SSLCOMMERZ_STORE_ID,
            'store_pass': settings.SSLCOMMERZ_STORE_PASS,
            'issandbox': settings.SSLCOMMERZ_IS_SANDBOX
        })

        try:
            validation_response = sslcz.validationTransactionOrder(val_id)

            if validation_response.get('status') == 'VALID':
                with db_transaction.atomic():
                    txn.status = 'SUCCESS'
                    txn.gateway_ref = val_id
                    txn.save()

                    user = txn.user
                    user.balance += txn.amount
                    user.save()

                return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment/success?transaction_id={tran_id}')
            else:
                txn.status = 'FAILED'
                txn.gateway_ref = val_id
                txn.save()

                return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment/failure?reason=validation_failed')
        except Exception:
            txn.status = 'FAILED'
            txn.save()
            return HttpResponseRedirect(f'{settings.FRONTEND_URL}/payment/failure?reason=validation_error')


class PaymentHistoryView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            queryset = Transaction.objects.select_related('user').all()
        else:
            queryset = Transaction.objects.filter(user=user)

        transaction_type = self.request.query_params.get('type')
        transaction_status = self.request.query_params.get('status')
        visual_type = self.request.query_params.get('visual_type')
        ordering = self.request.query_params.get('ordering', '-created_at')

        if transaction_type:
            queryset = queryset.filter(type=transaction_type)
        if visual_type == 'REFUND':
            queryset = queryset.filter(type='DEPOSIT', amount__in=[Decimal('100.00'), Decimal('50.00')])
        elif visual_type == 'DEPOSIT':
            queryset = queryset.filter(type='DEPOSIT').exclude(amount__in=[Decimal('100.00'), Decimal('50.00')])
        if transaction_status:
            queryset = queryset.filter(status=transaction_status)

        valid_ordering_fields = ['created_at', '-created_at', 'amount', '-amount']
        if ordering in valid_ordering_fields:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-created_at')

        return queryset