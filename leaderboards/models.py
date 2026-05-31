# leaderboards/models.py

from django.contrib.auth.models import User
from django.db import models


class GameRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game_slug = models.CharField(max_length=50, db_index=True)
    difficulty = models.IntegerField(help_text="Numeric level or difficulty scale")
    time_in_seconds = models.FloatField()
    is_win = models.BooleanField(default=False)
    played_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Indexing together makes queries for a specific game's leaderboard lightning fast
        indexes = [
            models.Index(fields=['game_slug', 'difficulty', 'time_in_seconds']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.game_slug} (Diff: {self.difficulty}) - {self.time_in_seconds}s"
