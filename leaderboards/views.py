from django.contrib.auth.decorators import login_required
from django.db.models import Min
from django.http import JsonResponse

from .models import GameRecord


def get_global_leaderboard(request, game_slug, difficulty):
    top_records = GameRecord.objects.filter(
        game_slug=game_slug,
        difficulty=difficulty,
        is_win=True
    ).select_related('user').order_by('time_in_seconds')[:10]

    data = [
        {
            "rank": index + 1,
            "username": record.user.username,
            "time": round(record.time_in_seconds, 2),
            "date": record.played_at.strftime("%Y-%m-%d")
        }
        for index, record in enumerate(top_records)
    ]

    return JsonResponse({"game": game_slug, "difficulty": difficulty, "leaderboard": data})


@login_required
def get_personal_records(request, game_slug):
    personal_bests = GameRecord.objects.filter(
        user=request.user,
        game_slug=game_slug,
        is_win=True
    ).values('difficulty').annotate(
        best_time=Min('time_in_seconds')
    ).order_by('difficulty')

    data = [
        {
            "difficulty": record['difficulty'],
            "best_time": round(record['best_time'], 2)
        }
        for record in personal_bests
    ]

    return JsonResponse({"game": game_slug, "personal_bests": data})
