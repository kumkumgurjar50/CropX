"""
send_notification(user, title, message, notification_type)

Creates a Notification row and pushes it to the user's WebSocket group
so the browser receives it instantly — no polling needed.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def send_notification(user, title: str, message: str, notification_type: str = 'SYSTEM'):
    """
    Persist a Notification and push it over WebSocket to the target user.
    Safe to call from any sync Django view or signal handler.
    """
    from farms.models import Notification

    notif = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )

    channel_layer = get_channel_layer()
    group_name = f'notifications_{user.id}'

    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type':              'notification_message',   # maps to consumer method
                'id':                notif.id,
                'title':             title,
                'message':           message,
                'notification_type': notification_type,
                'created_at':        notif.created_at.isoformat(),
            },
        )
    except Exception:
        # Channel layer unavailable (e.g. during tests) — notification still saved to DB
        pass

    return notif
