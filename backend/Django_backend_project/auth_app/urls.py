from rest_framework_simplejwt import views as jwt_views
from django.urls import path
from . import views
# from .views import CustomTokenObtainPairView
from django.shortcuts import render


# urls.py
from .AuthII_utils import initiate_42_oauth, callback_42_auth

urlpatterns = [
    path('register/', views.registration_page, name='register'),  # HTML registration page
    path('', views.index, name='index'),  # HTML registration page
    path('api/register/', views.RegisterView.as_view(), name='RegisterView'),  # Registration API
    path('api/login/', views.LoginView.as_view(), name='LoginView'),  # Login API
    path('api/logout/', views.LogoutView.as_view(), name='LogoutView'),  # Logout API
    path('api/renew-access/', views.CustomTokenRefreshView.as_view(), name='custom_token_refresh'),
	path('api/profile/', views.ProfileView.as_view(), name='profile'),
	path('api/select-2fa-method/', views.Select2FAMethodView.as_view(), name='select-2fa-method'),
	path('api/verify-2fa-setup/', views.Verify2FASetupView.as_view(), name='verify-2fa-setup'),
	path('api/change-2fa-method/', views.change_2fa_method, name='change-2fa-method'),
	path('api/disable-2fa/', views.disable_2fa, name='disable-2fa'),
	path('api/debug-status/', views.debug_status, name='debug_status'),
    path('api/42/login/', initiate_42_oauth, name='initiate_42_auth'),
    path('api/42/callback/', callback_42_auth, name='callback_42_auth'),
]
