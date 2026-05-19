from django.contrib import admin

from .models import GameRecord


@admin.register(GameRecord)
class GameRecordAdmin(admin.ModelAdmin):
    # This instructs Django Admin on what columns to show
    list_display = ('user', 'game_slug', 'difficulty', 'time_in_seconds', 'is_win', 'played_at')
    list_filter = ('game_slug', 'difficulty', 'is_win')
    search_fields = ('user__username', 'game_slug')
