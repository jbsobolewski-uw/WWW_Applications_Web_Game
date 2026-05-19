# game/urls.py

from django.urls import path

from . import views

urlpatterns = [
    path('', views.sudoku, name='game'),
]
