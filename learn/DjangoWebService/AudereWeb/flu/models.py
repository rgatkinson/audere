from django.db import models


class ButtonPush(models.Model):
    device_id = models.UUIDField()
    timestamp = models.DateTimeField()
    count = models.IntegerField()
