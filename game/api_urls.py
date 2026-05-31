# game/api_urls.py

from django.urls import path

from . import api_views

urlpatterns = [
    path("add_record/", api_views.add_record, name="game_add_record"),
    path("stats/",      api_views.stats,      name="game_stats"),

]
