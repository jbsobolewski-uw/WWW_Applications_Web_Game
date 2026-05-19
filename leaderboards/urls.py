# leaderboards/urls.py

from django.urls import path, include

urlpatterns = [
    path('api/', include('leaderboards.api_urls')),
]
