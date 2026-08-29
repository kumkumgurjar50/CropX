"""
Django signals that fire realtime notifications when key model events occur.

Triggers:
  Order created      → notify farmer  (new order received)
  Order status update→ notify customer AND farmer appropriately
  Booking created    → notify farmer  (new booking request)
  Booking updated    → notify customer (farmer responded)
  Message created    → notify recipient (new message)
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

# Track previous status to avoid duplicate notifications on unrelated saves
_order_prev_status   = {}
_booking_prev_status = {}


# ── Order signals ─────────────────────────────────────────────────────────────

@receiver(pre_save, sender='farms.Order')
def order_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            _order_prev_status[instance.pk] = sender.objects.get(pk=instance.pk).status
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='farms.Order')
def order_saved(sender, instance, created, **kwargs):
    from farms.notifications import send_notification

    if created:
        # New order — notify the farmer
        send_notification(
            user=instance.farmer,
            title='New Order Received 📦',
            message=(
                f'{instance.customer.name} ordered {instance.quantity_kg} kg of '
                f'{instance.crop_name} for ₹{instance.total_price:,.0f}. '
                f'Order ID: {instance.order_id}'
            ),
            notification_type='ORDER',
        )
        # Also notify customer their order was placed
        send_notification(
            user=instance.customer,
            title='Order Placed Successfully ✅',
            message=(
                f'Your order for {instance.quantity_kg} kg of {instance.crop_name} '
                f'(₹{instance.total_price:,.0f}) has been placed. Order ID: {instance.order_id}'
            ),
            notification_type='ORDER',
        )
    else:
        prev = _order_prev_status.pop(instance.pk, None)
        if prev and prev != instance.status:
            # Status changed — notify the customer
            status_messages = {
                'ACCEPTED':   f'🤝 Your order {instance.order_id} for {instance.crop_name} has been accepted by the farmer.',
                'PACKED':     f'📦 Your order {instance.order_id} is packed and ready for dispatch.',
                'IN_TRANSIT': f'🚚 Your order {instance.order_id} is on the way!',
                'DELIVERED':  f'✅ Your order {instance.order_id} has been delivered. Enjoy your {instance.crop_name}!',
                'CANCELLED':  f'🚫 Your order {instance.order_id} for {instance.crop_name} has been cancelled.',
            }
            msg = status_messages.get(instance.status)
            if msg:
                send_notification(
                    user=instance.customer,
                    title=f'Order {instance.order_id} — {instance.status.replace("_", " ").title()}',
                    message=msg,
                    notification_type='ORDER',
                )
            # Also notify farmer on cancellation
            if instance.status == 'CANCELLED':
                send_notification(
                    user=instance.farmer,
                    title=f'Order {instance.order_id} Cancelled',
                    message=f'Order {instance.order_id} for {instance.crop_name} by {instance.customer.name} was cancelled.',
                    notification_type='ORDER',
                )
            # Also send email if the customer has email_order_updates enabled
            if msg:
                try:
                    from authentication.utils import send_order_notification
                    send_order_notification(
                        instance.customer,
                        f'Order {instance.order_id} — {instance.status.replace("_", " ").title()}',
                        msg,
                    )
                except Exception:
                    pass


# ── Booking signals ───────────────────────────────────────────────────────────

@receiver(pre_save, sender='farms.Booking')
def booking_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            _booking_prev_status[instance.pk] = sender.objects.get(pk=instance.pk).status
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='farms.Booking')
def booking_saved(sender, instance, created, **kwargs):
    from farms.notifications import send_notification

    if created:
        # New booking request — notify the farmer
        send_notification(
            user=instance.farmer,
            title='New Booking Request 🔖',
            message=(
                f'{instance.customer.name} wants to book {instance.quantity_kg} kg of '
                f'{instance.listing.crop_name}.'
                + (f' Message: "{instance.message}"' if instance.message else '')
            ),
            notification_type='ORDER',
        )
    else:
        prev = _booking_prev_status.pop(instance.pk, None)
        if prev and prev != instance.status:
            # Farmer responded — notify the customer
            status_messages = {
                'BOOKED':    f'✅ Your booking for {instance.listing.crop_name} has been confirmed by {instance.farmer.name}!'
                             + (f' Note: "{instance.farmer_note}"' if instance.farmer_note else ''),
                'REJECTED':  f'❌ Your booking for {instance.listing.crop_name} was declined.'
                             + (f' Reason: "{instance.farmer_note}"' if instance.farmer_note else ''),
                'CANCELLED': f'🚫 Your booking for {instance.listing.crop_name} was cancelled.',
                'COMPLETED': f'🏁 Your booking for {instance.listing.crop_name} is now complete.',
            }
            msg = status_messages.get(instance.status)
            if msg:
                send_notification(
                    user=instance.customer,
                    title=f'Booking {instance.status.title()} — {instance.listing.crop_name}',
                    message=msg,
                    notification_type='ORDER',
                )
                # Send email if the customer has email_booking_updates enabled
                try:
                    from authentication.utils import send_booking_notification
                    send_booking_notification(
                        instance.customer,
                        f'Booking {instance.status.title()} — {instance.listing.crop_name}',
                        msg,
                    )
                except Exception:
                    pass


# ── Message signals ───────────────────────────────────────────────────────────

@receiver(post_save, sender='farms.Message')
def message_saved(sender, instance, created, **kwargs):
    if not created:
        return
    from farms.notifications import send_notification

    preview = instance.body[:120] + ('…' if len(instance.body) > 120 else '')

    send_notification(
        user=instance.recipient,
        title=f'New message from {instance.sender.name} 💬',
        message=preview,
        notification_type='SYSTEM',
    )

    # Send email if the recipient has email_messages enabled
    try:
        from authentication.utils import send_message_notification
        send_message_notification(
            instance.recipient,
            sender_name=instance.sender.name or instance.sender.email,
            preview=preview,
        )
    except Exception:
        pass
