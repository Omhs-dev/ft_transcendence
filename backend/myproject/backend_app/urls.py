from rest_framework_simplejwt import views as jwt_views
from django.urls import path
from . import views
from .views import CustomTokenObtainPairView

urlpatterns = [
    # path('register/', views.registration_page, name='register'),  # HTML registration page
    path('', views.index, name='index'),  # HTML registration page
    path('api/register/', views.RegisterView.as_view(), name='RegisterView'),  # Registration API
    # path('api/token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),  # for refreshing token
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
]

