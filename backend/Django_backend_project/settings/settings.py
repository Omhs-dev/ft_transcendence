from pathlib import Path
import os

# ***
BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATE_DIR = Path.joinpath(BASE_DIR, 'templates')
MEDIA_DIR = Path.joinpath(BASE_DIR, 'media')
STATIC_DIR = Path.joinpath(BASE_DIR, 'static')
print(f"static dir address:", STATIC_DIR)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = True
DEBUG = os.environ.get("DJANGO_DEBUG", False)
# ALLOWED_HOSTS = ['*']

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost").split(",")


# ALLOWED_HOSTS = ['transcendence.com', '0.0.0.0','192.168.65.1', "localhost", "django", intra_ip]

CSRF_TRUSTED_ORIGINS = [
    'https://localhost',
    'http://localhost',
    'http://0.0.0.0',
    'https://0.0.0.0',
    'http://localhost:8000',
    'http://django',
    'https://django',
    'http://192.168.0.206'
    'https://192.168.0.206'
    'https://192.168.0.135'
    'http://192.168.0.135'
]




# Define the base directory for log the project

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs.txt'),
            'formatter': 'simple',
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
        'chat_app': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'game_app': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': False,
            },
        'auth_app': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'tournament_app': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        # Add other loggers as needed
    },
}




# Application definition

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'auth_app',
    'chat_app',
    'game_app',
    'tournament_app',
    'rest_framework_simplejwt.token_blacklist',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'django_otp',
    'qrcode',
    'pyotp',
]



MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]



ROOT_URLCONF = 'settings.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [TEMPLATE_DIR,],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'settings.wsgi.application'
ASGI_APPLICATION = 'settings.asgi.application'

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get("DB_NAME"),
        'USER': os.environ.get("DB_USER"),
        'PASSWORD': os.environ.get("DB_PASSWORD"),
        'HOST': os.environ.get("DB_HOST"),
        'PORT': os.environ.get("DB_PORT"),
    }
}

# DB_NAME=django_db
# DB_USER=postgres
# DB_PASSWORD=postgres
# DB_HOST=postgres
# DB_PORT=5432

#channel_layer configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis_container", 6379)],
            "capacity": 1500,  # default 100
            "expiry": 10,  # default 60
        },
    },
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Paris'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

# Static files (CSS, JavaScript, Images)

# Email Settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Replace with your email provider's SMTP server
EMAIL_PORT = 587  # Port for TLS
EMAIL_USE_TLS = True  # Use TLS (secure connection)
EMAIL_HOST_USER = 'transcendence.42institute@gmail.com'  # Your email address
EMAIL_HOST_PASSWORD = 'tmsw qfws foxe xhbm'  # Your email password or app password
DEFAULT_FROM_EMAIL = 'Transcendence'


# twilio settings


# Auth2.0 settings
OAUTH_42_CLIENT_ID = 'u-s4t2ud-6a125e8a8b29cc39417deacce1ac474315d1b04f9f12a85e4a093c3b777b1da8'
# FRONTEND_URL = "http://localhost:8000"
FRONTEND_URL = "https://localhost"
OAUTH_42_CLIENT_SECRET = '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'
# OAUTH_42_REDIRECT_URI = 'http://localhost:8000/auth/api/42/callback/'  # or your deployed URL
OAUTH_42_REDIRECT_URI = 'https://localhost/auth/api/42/callback/'  # or your deployed domain
OAUTH_42_AUTHORIZE_URL = 'https://api.intra.42.fr/oauth/authorize'
OAUTH_42_TOKEN_URL = 'https://api.intra.42.fr/oauth/token'
OAUTH_42_USER_INFO_URL = 'https://api.intra.42.fr/v2/me'



STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / "static",  # Adjust this based on your project structure
]
# STATIC_ROOT = STATIC_DIR
# STATICFILES_DIRS = []

# Media files
MEDIA_ROOT = MEDIA_DIR
MEDIA_URL = '/media/'


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'auth_app.authenticate.CustomAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    )
}


from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    # custom
    'AUTH_COOKIE': 'access_token',  # Cookie name. Enables cookies if value is set.
    'AUTH_COOKIE_REFRESH': 'refresh_token',  # Name for the refresh token cookie.
    'AUTH_COOKIE_DOMAIN': None,     # A string like "example.com", or None for standard domain cookie.
    'AUTH_COOKIE_SECURE': False,    # Whether the auth cookies should be secure (https:// only).
    'AUTH_COOKIE_HTTP_ONLY' : True, # Http only cookie flag.It's not fetch by javascript.
    'AUTH_COOKIE_PATH': '/',        # The path of the auth cookie.
    'AUTH_COOKIE_SAMESITE': 'Lax',  # Whether to set the flag restricting cookie leaks on cross-site requests. This can be 'Lax', 'Strict', or None to disable the flag.
}

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:8000",  # Ensure this matches your frontend's origin
#     "http://localhost", 
# ]

# this allows all origins to access the backend
CORS_ALLOW_ALL_ORIGINS = True

# sends the cookies to the frontend
CORS_ALLOW_CREDENTIALS = False # here we are allowing the frontend to access the cookies


#-------- SECURITY SETTINGS --------
# Production settings (or conditional on DEBUG = False)

SESSION_COOKIE_HTTPONLY = True  	# This prevents client-side JavaScript from accessing the session cookie, which is a good security practice.
CSRF_COOKIE_HTTPONLY = True   		# This prevents client-side JavaScript from accessing the CSRF cookie, which is a good security practice.

if DEBUG.lower() == 'false':
    SESSION_COOKIE_SECURE = True  		# Important for local development (it should be True when using HTTPS)
    CSRF_COOKIE_SECURE = True			# Important for local development (it should be True when using HTTPS)
    SIMPLE_JWT['AUTH_COOKIE_SECURE'] = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https') 	# This ensures that Django knows to trust the X-Forwarded-Proto header that comes from the proxy server.
    SECURE_SSL_REDIRECT = True								  		# Usually handled by Nginx this redirects all HTTP traffic to HTTPS
    print(f"debug in setting.py is equsl to first${DEBUG}")

#-------- DEBUG TOOLBAR CONFIGURATION --------
if DEBUG.lower() == 'true':
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    # DEBUG TOOLBAR CONFIGURATION
    INTERNAL_IPS = [
        # ...
        "127.0.0.1",
        # ...
    ]
    print(f"debug  in setting.py is equsl to second${DEBUG}")
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
    }

    # import socket
    # hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
    # INTERNAL_IPS += [ip[:-1] + "1" for ip in ips]
