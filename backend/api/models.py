from django.conf import settings
from django.db import models
from django.utils import timezone


class Food(models.Model):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    price = models.PositiveIntegerField()
    rating = models.FloatField(default=4.5)
    description = models.CharField(max_length=255, blank=True)
    image = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class Order(models.Model):
    id = models.CharField(primary_key=True, max_length=12)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    total = models.PositiveIntegerField()
    method = models.CharField(max_length=30)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=10)
    address = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.id


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    food_id = models.IntegerField()
    name = models.CharField(max_length=100)
    price = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name} x {self.quantity}"


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=10, unique=True, null=True, blank=True)
    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"Profile of {self.user}"


class OTP(models.Model):
    target = models.CharField(max_length=254)      # phone number or email
    purpose = models.CharField(max_length=10)      # login | phone | email
    code_hash = models.CharField(max_length=64)
    created_at = models.DateTimeField(default=timezone.now)
    attempts = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f"{self.purpose} OTP for {self.target}"