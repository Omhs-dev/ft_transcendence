from rest_framework_simplejwt import views as jwt_views
from django.urls import path
from . import views
# from .views import CustomTokenObtainPairView
from django.shortcuts import render



urlpatterns = [
    path('register/', views.registration_page, name='register'),  # HTML registration page
    path('', views.index, name='index'),  # HTML registration page
    path('api/register/', views.RegisterView.as_view(), name='RegisterView'),  # Registration API
    path('api/login/', views.LoginView.as_view(), name='LoginView'),  # Login API
    path('api/logout/', views.LogoutView.as_view(), name='LogoutView'),  # Logout API
    path('api/renew-access/', views.CustomTokenRefreshView.as_view(), name='custom_token_refresh'),
]

