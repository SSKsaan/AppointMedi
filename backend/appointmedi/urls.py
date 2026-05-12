from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import ReviewViewSet

router = DefaultRouter()
router.register(r'', ReviewViewSet, basename='review')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/reviews/', include(router.urls)),
]
