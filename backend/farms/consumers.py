"""
NotificationConsumer — one persistent WebSocket per logged-in user.

Channel group name: notifications_<user_id>

The consumer:
  1. Authenticates via JWT middleware (token in query-string).
  2. Joins the user's personal group.
  3. Pushes any message sent to that group down to the browser in real time.
  4. Handles a client-sent { "type": "mark_read", "id": <pk> } message.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


def _group_name(user_id: int) -> str:
    return f'notifications_{user_id}'


class NotificationConsumer(AsyncWebsocketConsumer):

    # ── Connection lifecycle ──────────────────────────────────────────────────

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_id   = user.id
        self.group_name = _group_name(user.id)

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send unread count immediately on connect so the badge is correct
        count = await self._unread_count()
        await self.send(text_data=json.dumps({
            'type':   'unread_count',
            'count':  count,
        }))

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ── Messages from the browser ─────────────────────────────────────────────

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            return

        if data.get('type') == 'mark_read':
            pk = data.get('id')
            if pk == 'all':
                await self._mark_all_read()
            elif pk:
                await self._mark_one_read(int(pk))
            count = await self._unread_count()
            await self.send(text_data=json.dumps({
                'type':  'unread_count',
                'count': count,
            }))

    # ── Group message handlers (called by channel layer) ──────────────────────

    async def notification_message(self, event):
        """
        Called when send_notification() pushes a new notification to this group.
        event keys: type, id, title, message, notification_type, created_at
        """
        await self.send(text_data=json.dumps({
            'type':              'notification',
            'id':                event['id'],
            'title':             event['title'],
            'message':           event['message'],
            'notification_type': event['notification_type'],
            'is_read':           False,
            'created_at':        event['created_at'],
        }))

        # Also push an updated unread count
        count = await self._unread_count()
        await self.send(text_data=json.dumps({
            'type':  'unread_count',
            'count': count,
        }))

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def _unread_count(self):
        from farms.models import Notification
        return Notification.objects.filter(user_id=self.user_id, is_read=False).count()

    @database_sync_to_async
    def _mark_one_read(self, pk):
        from farms.models import Notification
        Notification.objects.filter(pk=pk, user_id=self.user_id).update(is_read=True)

    @database_sync_to_async
    def _mark_all_read(self):
        from farms.models import Notification
        Notification.objects.filter(user_id=self.user_id, is_read=False).update(is_read=True)
