from django.contrib import admin

from .models import Food, Order, OrderItem, OrderRating, Profile
from .views import tracking_info


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "price", "rating")
    list_filter = ("category",)
    search_fields = ("name",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class OrderRatingInline(admin.TabularInline):
    model = OrderRating
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "total", "method", "tracking_status", "created_at")
    list_filter = ("method",)
    search_fields = ("id", "name", "phone")
    inlines = [OrderItemInline, OrderRatingInline]

    @admin.display(description="Tracking status")
    def tracking_status(self, obj):
        return tracking_info(obj)["label"]


@admin.register(OrderRating)
class OrderRatingAdmin(admin.ModelAdmin):
    list_display = ("order", "kind", "food_id", "stars", "comment", "created_at")
    list_filter = ("kind", "stars")


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "phone_verified", "email_verified", "dob", "gender")
    search_fields = ("phone", "user__email", "user__first_name")