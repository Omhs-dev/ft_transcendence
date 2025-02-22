from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator
from django.core.validators import RegexValidator
from .models import Profile
from chat_app.models import BlockedUser

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
    id = serializers.IntegerField(
        source='user.id',
        read_only=True
    )  # Include user ID
    username = serializers.CharField(
        source='user.username',
        required=False,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    # id = serializers.IntegerField(
    # 	source='user.id',
    # 	read_only=True
    # )
    email = serializers.EmailField(
        source='user.email',
        required=False,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    profile_picture = serializers.ImageField(required=False)
    # password = serializers.CharField(write_only=True, required=False)
    nickname = serializers.CharField(required=False)


    friends = serializers.SerializerMethodField()
    blocked_users = serializers.SerializerMethodField()

    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )

    class Meta:
        model = Profile
        fields = ['id', 'nickname', 'bio', 'profile_picture', 'username', 'email',
                   'phone_number', 'is_2fa_enabled', 'friends', 'blocked_users']

    def get_friends(self, obj):
        """
        Return a list of friends with basic information.
        """
        friends = obj.friends.all()
        return [
            {
                "id": friend.user.id,
                "username": friend.user.username,
                "nickname": friend.nickname,
                "profile_picture": friend.profile_picture.url if friend.profile_picture else None
            }
            for friend in friends
        ]
    
    def get_blocked_users(self, obj):
        """Return list of blocked users with id, username, and profile_picture."""
        blocked_users = BlockedUser.objects.filter(blocker=obj.user).select_related('blocked')
        return [
            {
                "id": blocked.blocked.id,
                "username": blocked.blocked.username,
                "profile_picture": blocked.blocked.profile.profile_picture.url if blocked.blocked.profile.profile_picture else None
            }
            for blocked in blocked_users
        ]

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
        instance.id = validated_data.get('id', instance.id)
        instance.nickname = validated_data.get('nickname', instance.nickname)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)  # Update phone number
        instance.save()
        return instance
