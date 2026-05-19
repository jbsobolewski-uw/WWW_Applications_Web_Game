# game/urls.py

from django.urls import path

from . import views

urlpatterns = [
    path('', views.game_board_view, name='game'),
    path('rules/', views.rules_view, name='rules'),
]
