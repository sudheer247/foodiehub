from django.contrib import admin
from .models import Food, Order, OrderItem


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "price", "rating")
    list_filter = ("category",)
    search_fields = ("name",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "total", "method", "created_at")
    list_filter = ("method",)
    inlines = [OrderItemInline]
