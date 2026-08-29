"""
Email utilities for CropX authentication.

All outbound emails go through this module so there is one place to
change templates, styling, or the sending mechanism.

In development  → EMAIL_BACKEND = console (prints to terminal)
In production   → set SMTP_* env vars → emails are sent via SMTP
"""
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


# ── Helpers ──────────────────────────────────────────────────────────────────

def _frontend_base(request=None) -> str:
    """Return the frontend origin (used to build clickable links)."""
    frontend = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
    if frontend:
        return frontend
    if request is not None:
        origin = request.META.get('HTTP_ORIGIN', '')
        if origin:
            return origin.rstrip('/')
    return 'http://localhost:5173'


def _html(subject: str, greeting: str, body_lines: list[str], cta_label: str = None, cta_url: str = None) -> tuple[str, str]:
    """
    Returns (plain_text, html) tuple for a transactional email.
    Very simple — no external template engine needed.
    """
    plain = f"{greeting}\n\n" + "\n".join(body_lines)
    if cta_label and cta_url:
        plain += f"\n\n{cta_label}:\n{cta_url}"
    plain += "\n\n— CropX Team"

    button = (
        f'<p style="text-align:center;margin:28px 0">'
        f'<a href="{cta_url}" style="background:#2E7D32;color:#fff;padding:12px 28px;'
        f'border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">'
        f'{cta_label}</a></p>'
    ) if cta_label and cta_url else ''

    body_html = "".join(f"<p style='margin:0 0 10px 0;color:#374151'>{l}</p>" for l in body_lines)

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto">
  <tr><td style="background:#2E7D32;padding:20px 32px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:22px;font-weight:800">🌾 CropX</span>
  </td></tr>
  <tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
    <h2 style="margin:0 0 16px 0;color:#111827;font-size:20px">{subject}</h2>
    <p style="margin:0 0 16px 0;color:#374151">{greeting}</p>
    {body_html}
    {button}
    <p style="margin:24px 0 0 0;font-size:13px;color:#9ca3af">
      If you did not request this, you can safely ignore this email.<br>
      &copy; {__import__('datetime').date.today().year} CropX. All rights reserved.
    </p>
  </td></tr>
</table>
</body></html>"""
    return plain, html


def _send(subject: str, plain: str, html: str, to: str) -> None:
    """Send one email. Silently logs on failure in DEBUG mode."""
    from django.core.mail import EmailMultiAlternatives
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to],
        )
        msg.attach_alternative(html, 'text/html')
        msg.send(fail_silently=False)
    except Exception as exc:
        if settings.DEBUG:
            import logging
            logging.getLogger('cropx.email').warning('Email send failed: %s', exc)
        else:
            raise


# ── Token helpers ─────────────────────────────────────────────────────────────

def _make_uid_token(user) -> tuple[str, str]:
    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return uid, token


# ── Public send functions ─────────────────────────────────────────────────────

def send_verification_email(user, request=None) -> None:
    uid, token = _make_uid_token(user)
    link = f"{_frontend_base(request)}/verify-email?uidb64={uid}&token={token}"
    subject = 'Verify your CropX account'
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[
            "Welcome to CropX! Please verify your email address to activate your account.",
            "Click the button below — the link expires in 24 hours.",
        ],
        cta_label="Verify Email",
        cta_url=link,
    )
    _send(subject, plain, html, user.email)


def send_password_reset_email(user, request=None) -> None:
    uid, token = _make_uid_token(user)
    link = f"{_frontend_base(request)}/reset-password?uidb64={uid}&token={token}"
    subject = 'Reset your CropX password'
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[
            "We received a request to reset your CropX password.",
            "Click the button below. The link expires in 1 hour.",
        ],
        cta_label="Reset Password",
        cta_url=link,
    )
    _send(subject, plain, html, user.email)


def send_email_change_verification(user, new_email: str, request=None) -> None:
    """
    Sends a confirmation link to the NEW email address.
    The link carries a signed token so the backend can verify it.
    """
    from django.core.signing import TimestampSigner
    signer = TimestampSigner()
    signed = signer.sign(f"{user.pk}:{new_email}")
    import urllib.parse
    token = urllib.parse.quote(signed, safe='')
    link = f"{_frontend_base(request)}/confirm-email-change?token={token}"

    subject = 'Confirm your new CropX email address'
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[
            f"You requested to change your CropX email address to <strong>{new_email}</strong>.",
            "Click the button below to confirm. The link expires in 24 hours.",
        ],
        cta_label="Confirm New Email",
        cta_url=link,
    )
    _send(subject, plain, html, new_email)


def send_password_changed_notification(user, request=None) -> None:
    subject = 'Your CropX password was changed'
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[
            "Your CropX account password was just changed successfully.",
            "If you made this change, no action is needed.",
            "If you did <strong>NOT</strong> make this change, reset your password immediately.",
        ],
        cta_label="Reset Password Now",
        cta_url=f"{_frontend_base(request)}/forgot-password",
    )
    _send(subject, plain, html, user.email)


def send_email_changed_notification(user, old_email: str, new_email: str, request=None) -> None:
    """
    Sent to the OLD email address after a successful email change.
    Allows the user to detect unauthorised changes.
    """
    subject = 'Your CropX email address was changed'
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or old_email},",
        body_lines=[
            f"Your CropX account email address has been changed from "
            f"<strong>{old_email}</strong> to <strong>{new_email}</strong>.",
            "If you made this change, no action is needed.",
            "If you did <strong>NOT</strong> authorise this change, contact support immediately.",
        ],
        cta_label="Go to Settings",
        cta_url=f"{_frontend_base(request)}/settings",
    )
    _send(subject, plain, html, old_email)


def _get_prefs(user):
    """
    Always fetch preferences fresh from the DB.
    Using getattr(user, 'preferences') would return a cached descriptor
    that goes stale if the prefs row was updated after the user object
    was first loaded — this ensures we always read the current values.
    """
    from authentication.models import UserPreferences
    return UserPreferences.objects.filter(user=user).first()


def send_order_notification(user, title: str, message: str) -> None:
    """Send a transactional email for order status changes (respects email_order_updates pref)."""
    prefs = _get_prefs(user)
    if prefs and not prefs.email_order_updates:
        return
    subject = f'CropX: {title}'
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[message],
    )
    _send(subject, plain, html, user.email)


def send_booking_notification(user, title: str, message: str) -> None:
    """Send a transactional email for booking status changes (respects email_booking_updates pref)."""
    prefs = _get_prefs(user)
    if prefs and not prefs.email_booking_updates:
        return
    subject = f'CropX: {title}'
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[message],
    )
    _send(subject, plain, html, user.email)


def send_message_notification(user, sender_name: str, preview: str) -> None:
    """Send an email notification for a new message (respects email_messages pref)."""
    prefs = _get_prefs(user)
    if prefs and not prefs.email_messages:
        return
    subject = f'CropX: New message from {sender_name}'
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[
            f"You have a new message from <strong>{sender_name}</strong>:",
            f"<em>{preview}</em>",
        ],
        cta_label="View Message",
        cta_url=f"{_frontend_base()}/messages",
    )
    _send(subject, plain, html, user.email)


def send_marketing_email(user, subject_line: str, headline: str, body_lines: list[str], cta_label: str = None, cta_url: str = None) -> None:
    """Send a marketing/announcement email (respects email_marketing pref)."""
    prefs = _get_prefs(user)
    if prefs and not prefs.email_marketing:
        return
    plain, html = _html(
        subject_line,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[headline] + body_lines,
        cta_label=cta_label,
        cta_url=cta_url,
    )
    _send(subject_line, plain, html, user.email)


def send_welcome_email(user) -> None:
    subject = f'Welcome to CropX, {user.name or "there"}! 🌾'
    role_line = "Start by listing your first crop on the marketplace." if user.role == 'FARMER' else "Browse fresh produce listings from verified farmers."
    plain, html = _html(
        subject,
        greeting=f"Hi {user.name or user.email},",
        body_lines=[
            "Your CropX account is ready.",
            role_line,
        ],
        cta_label="Go to Dashboard",
        cta_url=f"{_frontend_base()}/{'farmer' if user.role == 'FARMER' else 'customer'}/dashboard",
    )
    _send(subject, plain, html, user.email)
