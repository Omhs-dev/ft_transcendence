import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings.settings')
print("DJANGO_SETTINGS_MODULE is set to:", os.environ.get('DJANGO_SETTINGS_MODULE'))


# Print all environment variables
for key, value in os.environ.items():
    print(f'{key}={value}')
