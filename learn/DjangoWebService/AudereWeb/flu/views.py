import json
from django.http import JsonResponse
from django.views import View
from django.middleware.csrf import get_token
from flu.models import ButtonPush


class Api(View):
    def get(self, request):
        return JsonResponse({
            'CsrfToken':  get_token(request),
            'Status': 'SUCCESS',
        })


class ApiButton(View):
    def post(self, request):
        data = json.loads(request.body.decode('utf-8', 'strict'))
        item = ButtonPush(
            device_id=data['DeviceId'],
            timestamp=data['Timestamp'],
            count=data['Count'],
        )
        item.save()
        return JsonResponse({
            'Status': 'SUCCESS',
        })
