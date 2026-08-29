from django.contrib import admin

from .models import (
    Booking,
    Crop,
    DiseaseRecord,
    Farm,
    Fertilizer,
    MarketListing,
    MarketPrice,
    Message,
    Notification,
    Order,
)


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'farm_code', 'owner', 'district', 'state', 'area_acres', 'soil_type', 'is_active', 'created_at')
    list_filter = ('soil_type', 'irrigation_type', 'is_active', 'state')
    search_fields = ('name', 'farm_code', 'owner__email', 'district', 'state')
    readonly_fields = ('farm_code', 'created_at', 'updated_at')


@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = ('name', 'variety', 'farm', 'current_stage', 'health_status', 'area_acres', 'is_active', 'created_at')
    list_filter = ('current_stage', 'health_status', 'is_active')
    search_fields = ('name', 'variety', 'farm__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(MarketListing)
class MarketListingAdmin(admin.ModelAdmin):
    list_display = ('crop_name', 'variety', 'farmer', 'quantity_kg', 'price_per_kg', 'status', 'is_organic', 'created_at')
    list_filter = ('status', 'is_organic')
    search_fields = ('crop_name', 'variety', 'farmer__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'crop_name', 'farmer', 'customer', 'quantity_kg', 'total_price', 'status', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status')
    search_fields = ('order_id', 'crop_name', 'farmer__email', 'customer__email')
    readonly_fields = ('order_id', 'created_at', 'updated_at')


@admin.register(DiseaseRecord)
class DiseaseRecordAdmin(admin.ModelAdmin):
    list_display = ('disease_name', 'farmer', 'crop', 'severity', 'confidence', 'scan_status', 'created_at')
    list_filter = ('severity', 'scan_status')
    search_fields = ('disease_name', 'farmer__email')
    readonly_fields = ('created_at',)


@admin.register(MarketPrice)
class MarketPriceAdmin(admin.ModelAdmin):
    list_display = ('crop_name', 'market_name', 'state', 'district', 'price_per_quintal', 'trend', 'change_percent', 'recorded_date')
    list_filter = ('trend', 'state')
    search_fields = ('crop_name', 'market_name', 'state', 'district')
    readonly_fields = ('recorded_date', 'created_at')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'body_preview', 'is_read', 'created_at')
    list_filter = ('is_read',)
    search_fields = ('sender__email', 'recipient__email', 'body')
    readonly_fields = ('created_at',)

    @admin.display(description='Message')
    def body_preview(self, obj):
        return obj.body[:60] + ('…' if len(obj.body) > 60 else '')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('title', 'user__email')
    readonly_fields = ('created_at',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'farmer', 'listing', 'quantity_kg', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('customer__email', 'farmer__email', 'listing__crop_name')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Fertilizer)
class FertilizerAdmin(admin.ModelAdmin):
    list_display  = ('name', 'brand', 'fertilizer_type', 'price', 'original_price', 'discount_percent', 'rating', 'review_count', 'stock', 'is_active', 'created_at')
    list_filter   = ('fertilizer_type', 'is_active', 'is_verified')
    search_fields = ('name', 'brand', 'crops', 'prevents')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('price', 'stock', 'is_active')
    ordering      = ('fertilizer_type', 'name')

    fieldsets = (
        ('Product Info', {
            'fields': ('name', 'brand', 'fertilizer_type', 'description', 'image', 'image_url', 'is_active', 'is_verified'),
        }),
        ('Targeting', {
            'fields': ('crops', 'prevents', 'dose', 'usage_notes'),
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'original_price', 'unit', 'stock'),
        }),
        ('Ratings', {
            'fields': ('rating', 'review_count'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Discount %')
    def discount_percent(self, obj):
        return f'{obj.discount_percent}%' if obj.discount_percent else '—'
