# leaderboards/api_urls.py

from django.urls import path

from . import views

urlpatterns = [
    path('global/<str:game_slug>/<int:difficulty>/', views.get_global_leaderboard, name='global_leaderboard'),
    path('personal/<str:game_slug>/', views.get_personal_records, name='personal_records'),
]
