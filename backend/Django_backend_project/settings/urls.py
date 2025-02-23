"""
URL configuration for myproject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from auth_app import views
from debug_toolbar.toolbar import debug_toolbar_urls
from django.conf import settings
from django.conf.urls.static import static

from django.views.generic.base import RedirectView
import debug_toolbar

favicon_view = RedirectView.as_view(url='/static/images/favicon.ico', permanent=True)

urlpatterns = [
	path('auth/', include('auth_app.urls')),
	path('chat/', include('chat_app.urls')),
    path('game/', include('game_logic_app.urls')),
    path('admin/', admin.site.urls),
    re_path(r'^favicon\.ico$', favicon_view),
]


# Serve media files during development
if settings.DEBUG:
    urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
	
