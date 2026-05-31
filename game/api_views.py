# game/api_views.py

import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from leaderboards.models import GameRecord

GAME_SLUG = "hex_minesweeper"
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 10


@login_required
@require_POST
def add_record(request) -> JsonResponse:
    """
    POST /game/api/add_record/

    Body (JSON):
        difficulty    int   1–10
        time_seconds  float seconds elapsed (>= 0)
        is_win        bool

    Returns 201 on success, 400 on validation error, 401 if not authenticated
    (login_required redirects to login for browser clients; for fetch() calls
    from JS the redirect will surface as a non-JSON response — handle it on
    the client by checking response.ok).
    """
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    # --- Validate fields ----------------------------------------------------

    difficulty = body.get("difficulty")
    time_seconds = body.get("time_seconds")
    is_win = body.get("is_win")

    if not isinstance(difficulty, int) or not (MIN_DIFFICULTY <= difficulty <= MAX_DIFFICULTY):
        return JsonResponse(
            {"error": f"difficulty must be an integer between {MIN_DIFFICULTY} and {MAX_DIFFICULTY}"},
            status=400,
        )

    if not isinstance(time_seconds, (int, float)) or time_seconds < 0:
        return JsonResponse(
            {"error": "time_seconds must be a non-negative number"},
            status=400,
        )

    if not isinstance(is_win, bool):
        return JsonResponse(
            {"error": "is_win must be a boolean"},
            status=400,
        )

    # --- Persist ------------------------------------------------------------

    record = GameRecord.objects.create(
        user=request.user,
        game_slug=GAME_SLUG,
        difficulty=difficulty,
        time_in_seconds=float(time_seconds),
        is_win=is_win,
    )

    return JsonResponse(
        {
            "id": record.pk,
            "username": request.user.username,
            "difficulty": record.difficulty,
            "time_seconds": record.time_in_seconds,
            "is_win": record.is_win,
            "played_at": record.played_at.isoformat(),
        },
        status=201,
    )


@login_required
def stats(request) -> JsonResponse:
    """
    GET /game/api/stats/

    Returns aggregate counts for the authenticated user across all
    difficulties of hex_minesweeper.
    """
    qs = GameRecord.objects.filter(user=request.user, game_slug=GAME_SLUG)
    total_played = qs.count()
    total_wins   = qs.filter(is_win=True).count()

    return JsonResponse({
        "total_played": total_played,
        "total_wins":   total_wins,
    })