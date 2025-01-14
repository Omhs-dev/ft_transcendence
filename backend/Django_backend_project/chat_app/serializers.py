from rest_framework import serializers
from .models import Profile

# class ProfileSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Profile
#         fields = ['bio', 'profile_picture']  # Include any other fields you'd like to allow updates


from django.contrib.auth.models import User
from rest_framework.validators import UniqueValidator

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source='user.username',
        required=False,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    email = serializers.EmailField(
        source='user.email',
        required=False,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=False)
    nickname = serializers.CharField(required=False)

    class Meta:
        model = Profile
        fields = ['nickname', 'bio', 'profile_picture', 'username', 'email', 'password']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        username = user_data.get('username')
        email = user_data.get('email')
        password = user_data.get('password')

        # Update related User model fields
        if username:
            instance.user.username = username
        if email:
            instance.user.email = email
        if password:
            instance.user.set_password(password)
        instance.user.save()

        # Update Profile model fields
        instance.nickname = validated_data.get('nickname', instance.nickname)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.save()
        return instance
