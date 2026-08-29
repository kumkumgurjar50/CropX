from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('FARMER', 'Farmer'),
        ('CUSTOMER', 'Customer'),
        ('ADMIN', 'Admin'),
    )

    name       = models.CharField(max_length=150, blank=True, default='')
    email      = models.EmailField(unique=True)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    is_verified = models.BooleanField(default=False)
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table     = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.name or self.email

    def get_short_name(self):
        return self.name or self.email


class UserPreferences(models.Model):
    """One-to-one preferences record for each user. Created on demand."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='preferences',
        primary_key=True,
    )

    # ── Notification prefs ────────────────────────────────────────────────
    email_order_updates   = models.BooleanField(default=True)
    email_booking_updates = models.BooleanField(default=True)
    email_messages        = models.BooleanField(default=False)
    email_marketing       = models.BooleanField(default=False)

    # ── Privacy ───────────────────────────────────────────────────────────
    profile_visible  = models.BooleanField(default=True)
    activity_status  = models.BooleanField(default=False)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_preferences'

    def __str__(self):
        return f'Preferences({self.user.email})'
