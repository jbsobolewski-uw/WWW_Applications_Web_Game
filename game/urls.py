# game/urls.py

from django.urls import path, include

from . import views

urlpatterns = [
    path('', views.game_board_view, name='game'),
    path('rules/', views.rules_view, name='rules'),
    path('api/', include('game.api_urls')),
]
