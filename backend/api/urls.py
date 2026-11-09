from django.urls import path
from . import views

urlpatterns = [
    path("health", views.health),
    path("foods", views.foods),
    path("auth/signup", views.signup),
    path("auth/login", views.login),
    path("orders", views.orders),
    path("otp/send", views.otp_send),
    path("otp/verify", views.otp_verify),
    path("account", views.account),
    path("assistant", views.assistant),
]