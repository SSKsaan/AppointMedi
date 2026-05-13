from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentRequestViewSet

router = DefaultRouter()
router.register(r'', AppointmentRequestViewSet, basename='appointment-request')

urlpatterns = [
    path('', include(router.urls)),
]