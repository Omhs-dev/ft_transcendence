from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator
from .models import Profile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        # Create the user with a hashed password
        return User.objects.create_user(**validated_data)



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


# The custom token serializer to make a possibility of adding the desired claim as 'is_admin'
# to check the user in front-end into recognize the admin type users.
# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)

#         # Add custom claims
#         token['is_admin'] = user.is_superuser

#         return token
