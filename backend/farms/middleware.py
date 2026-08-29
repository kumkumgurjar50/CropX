"""
JWT authentication middleware for Django Channels WebSocket connections.

The frontend sends the access token as a query-string param:
    ws://localhost:8000/ws/notifications/?token=<access_token>
"""
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


@database_sync_to_async
def get_user_from_token(token_str):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
        token = AccessToken(token_str)
        return User.objects.get(id=token['user_id'])
    except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        qs = parse_qs(scope.get('query_string', b'').decode())
        token_str = qs.get('token', [None])[0]
        scope['user'] = await get_user_from_token(token_str) if token_str else AnonymousUser()
        return await super().__call__(scope, receive, send)
