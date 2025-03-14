# Generated by Django 5.1.4 on 2025-02-26 00:30

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nickname', models.CharField(blank=True, max_length=50, null=True)),
                ('is_online', models.BooleanField(default=False)),
                ('bio', models.TextField(blank=True, null=True)),
                ('profile_picture', models.ImageField(blank=True, null=True, upload_to='profile_pics/')),
                ('phone_number', models.CharField(blank=True, max_length=15, null=True, validators=[django.core.validators.RegexValidator(message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')])),
                ('otp_secret', models.CharField(blank=True, max_length=32, null=True)),
                ('is_2fa_enabled', models.BooleanField(default=False)),
                ('two_fa_method', models.CharField(blank=True, choices=[('totp', 'Totp'), ('sms', 'SMS'), ('email', 'Email')], max_length=20, null=True)),
                ('last_otp_sent_at', models.DateTimeField(blank=True, null=True)),
                ('friends', models.ManyToManyField(blank=True, to='auth_app.profile')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
