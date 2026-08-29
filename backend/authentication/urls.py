from django.urls import path

from .views import (
    AdminUserListView,
    ChangeEmailRequestView,
    ChangePasswordView,
    ConfirmEmailChangeView,
    CurrentUserView,
    CustomTokenRefreshView,
    ForgotPasswordView,
    LoginView,
    LogoutView,
    ProtectedView,
    RegisterView,
    ResendEmailChangeView,
    ResetPasswordView,
    UserPreferencesView,
    VerifyEmailView,
)

app_name = 'authentication'

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────
    path('register/',       RegisterView.as_view(),           name='register'),
    path('login/',          LoginView.as_view(),               name='login'),
    path('logout/',         LogoutView.as_view(),              name='logout'),
    path('refresh/',        CustomTokenRefreshView.as_view(),  name='token-refresh'),
    path('users/',          AdminUserListView.as_view(),       name='admin-users'),

    # ── Email verification ─────────────────────────────────────────────
    path('verify-email/<str:uidb64>/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),

    # ── Password ──────────────────────────────────────────────────────────
    path('forgot-password/',  ForgotPasswordView.as_view(),  name='forgot-password'),
    path('reset-password/',   ResetPasswordView.as_view(),   name='reset-password'),
    path('change-password/',  ChangePasswordView.as_view(),  name='change-password'),

    # ── Email change ──────────────────────────────────────────────────────
    path('change-email/',         ChangeEmailRequestView.as_view(),  name='change-email'),
    path('resend-email-change/',  ResendEmailChangeView.as_view(),   name='resend-email-change'),
    path('confirm-email-change/', ConfirmEmailChangeView.as_view(),  name='confirm-email-change'),

    # ── Profile & preferences ─────────────────────────────────────────────
    path('me/',          CurrentUserView.as_view(),      name='current-user'),
    path('preferences/', UserPreferencesView.as_view(),  name='preferences'),
    path('protected/',   ProtectedView.as_view(),        name='protected'),
]
