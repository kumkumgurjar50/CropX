from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import generics, serializers as drf_serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import User, UserPreferences
from .permissions import IsVerifiedUser
from .serializers import (
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserProfileSerializer,
    UserSerializer,
)
from .utils import (
    send_email_change_verification,
    send_email_changed_notification,
    send_password_changed_notification,
    send_welcome_email,
)


# ── Register ──────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Send welcome email (non-blocking failure)
        try:
            send_welcome_email(user)
        except Exception:
            pass
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'message': 'Account created successfully.',
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'user':    UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ── Login / Logout ────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(
            {
                'message': 'Login successful',
                'access':  serializer.validated_data['access'],
                'refresh': serializer.validated_data['refresh'],
                'user':    UserSerializer(serializer.validated_data['user']).data,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


# ── Email verification ────────────────────────────────────────────────────────

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user    = get_user_model().objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
            return Response({'detail': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'Verification link is invalid or expired.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)


# ── Forgot / Reset password ───────────────────────────────────────────────────

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'message': 'If an account with that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        try:
            send_password_changed_notification(user, request)
        except Exception:
            pass
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'message': 'Password reset successfully.',
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_200_OK
        )


# ── Change password (authenticated) ──────────────────────────────────────────

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current  = request.data.get('current_password', '')
        new_pw   = request.data.get('new_password', '')
        confirm  = request.data.get('confirm_password', '')
        user     = request.user

        if not user.check_password(current):
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_pw) < 8:
            return Response({'detail': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_pw != confirm:
            return Response({'detail': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_pw == current:
            return Response({'detail': 'New password must be different from current password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_pw)
        user.save(update_fields=['password'])

        try:
            send_password_changed_notification(user, request)
        except Exception:
            pass

        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


# ── Request email change ──────────────────────────────────────────────────────

class ChangeEmailRequestView(APIView):
    """
    POST { new_email, current_password }
    → validates password, sends confirmation link to the NEW email.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get('new_email', '').strip().lower()
        password  = request.data.get('current_password', '')
        user      = request.user

        if not new_email:
            return Response({'detail': 'new_email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(password):
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_email == user.email.lower():
            return Response({'detail': 'New email is the same as your current email.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=new_email).exists():
            return Response({'detail': 'That email address is already in use.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            send_email_change_verification(user, new_email, request)
        except Exception as exc:
            return Response({'detail': f'Failed to send confirmation email: {exc}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({'message': f'A confirmation link has been sent to {new_email}.'}, status=status.HTTP_200_OK)


# ── Confirm email change ──────────────────────────────────────────────────────

class ConfirmEmailChangeView(APIView):
    """
    POST { token }  — token from the signed link in the confirmation email.
    On success:
      - updates user.email in the DB
      - sends a notification to the OLD email
      - returns { message, new_email } so the frontend can sync auth state
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import urllib.parse
        from django.core.signing import TimestampSigner, BadSignature, SignatureExpired

        raw = request.data.get('token', '')
        raw = urllib.parse.unquote(raw)

        signer = TimestampSigner()
        try:
            value = signer.unsign(raw, max_age=86400)  # 24 hours
        except SignatureExpired:
            return Response({'detail': 'This link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        except BadSignature:
            return Response({'detail': 'Invalid confirmation link.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id, new_email = value.rsplit(':', 1)
            user = User.objects.get(pk=user_id)
        except (ValueError, User.DoesNotExist):
            return Response({'detail': 'Invalid confirmation link.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
            return Response({'detail': 'That email is already in use.'}, status=status.HTTP_409_CONFLICT)

        old_email = user.email
        user.email = new_email
        user.save(update_fields=['email'])

        # Notify the OLD address that the email was changed
        try:
            from .utils import send_email_changed_notification
            send_email_changed_notification(user, old_email, new_email)
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'message': f'Email updated to {new_email}.',
                'new_email': new_email,
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_200_OK,
        )


# ── Resend email-change confirmation link ─────────────────────────────────────

class ResendEmailChangeView(APIView):
    """
    POST { new_email, current_password }
    Identical to ChangeEmailRequestView — lets the user get a fresh link
    if the first one expired (1 h window).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get('new_email', '').strip().lower()
        password  = request.data.get('current_password', '')
        user      = request.user

        if not new_email:
            return Response({'detail': 'new_email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(password):
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_email == user.email.lower():
            return Response({'detail': 'New email is the same as your current email.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=new_email).exists():
            return Response({'detail': 'That email address is already in use.'}, status=status.HTTP_400_BAD_REQUEST)

        from .utils import send_email_change_verification
        try:
            send_email_change_verification(user, new_email, request)
        except Exception as exc:
            return Response({'detail': f'Failed to send confirmation email: {exc}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({'message': f'A new confirmation link has been sent to {new_email}.'}, status=status.HTTP_200_OK)


# ── User preferences ──────────────────────────────────────────────────────────

class UserPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_or_create(self, user):
        prefs, _ = UserPreferences.objects.get_or_create(user=user)
        return prefs

    def get(self, request):
        prefs = self._get_or_create(request.user)
        return Response(self._serialize(prefs))

    def patch(self, request):
        prefs = self._get_or_create(request.user)
        ALLOWED = {
            'email_order_updates', 'email_booking_updates',
            'email_messages', 'email_marketing',
            'profile_visible', 'activity_status',
        }
        updated = []
        for field, value in request.data.items():
            if field in ALLOWED and isinstance(value, bool):
                setattr(prefs, field, value)
                updated.append(field)
        if updated:
            prefs.save(update_fields=updated + ['updated_at'])
        return Response(self._serialize(prefs))

    @staticmethod
    def _serialize(prefs):
        return {
            'email_order_updates':   prefs.email_order_updates,
            'email_booking_updates': prefs.email_booking_updates,
            'email_messages':        prefs.email_messages,
            'email_marketing':       prefs.email_marketing,
            'profile_visible':       prefs.profile_visible,
            'activity_status':       prefs.activity_status,
        }


# ── Current user ──────────────────────────────────────────────────────────────

class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserProfileSerializer
    permission_classes = [IsAuthenticated, IsVerifiedUser]
    http_method_names  = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user


class ProtectedView(APIView):
    permission_classes = [IsAuthenticated, IsVerifiedUser]

    def get(self, request):
        return Response({
            'message': 'You have access to protected resources.',
            'user':    UserSerializer(request.user).data,
        })


class CustomTokenRefreshView(TokenRefreshView):
    pass


class AdminUserListView(generics.ListAPIView):
    """
    GET /api/auth/users/
    Admin endpoint to view registered Farmers and Customers.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        role = self.request.query_params.get('role')
        qs = User.objects.all().order_by('-created_at')
        if role and role in ['FARMER', 'CUSTOMER', 'ADMIN']:
            qs = qs.filter(role=role)
        return qs
