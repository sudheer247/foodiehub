import time
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import OTP


class Command(BaseCommand):
    help = "Prints new OTP codes in this terminal (needs STORE_DEMO_OTP=1 on the server that sends them)"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Watching for new OTPs... press Ctrl+C to stop"))
        since = timezone.now() - timedelta(minutes=5)   # also show codes that are still valid
        seen = set()
        try:
            while True:
                rows = OTP.objects.filter(created_at__gt=since).exclude(demo_code="").order_by("created_at")
                for otp in rows:
                    if otp.id not in seen:
                        seen.add(otp.id)
                        when = timezone.localtime(otp.created_at).strftime("%H:%M:%S")
                        self.stdout.write(f"[{when}] {otp.purpose} OTP for {otp.target}: {otp.demo_code}  (valid for 5 minutes)")
                time.sleep(2)
        except KeyboardInterrupt:
            self.stdout.write("Stopped.")