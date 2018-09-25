from django.urls import path
from . import views

urlpatterns = [
    path('api/', views.Api.as_view(), name='api'),
    path('api/button/', views.ApiButton.as_view(), name='button'),
]

app_name = 'flu'
