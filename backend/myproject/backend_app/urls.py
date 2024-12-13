from django.urls import path
from . import views

urlpatterns = [
    path('', views.registration_page, name='register'),  # HTML registration page
    path('api/register/', views.register_user, name='register_user'),  # Registration API
]
