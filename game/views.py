# game/views.py

from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def game_board_view(request):
    return render(request, 'game/game.html')


def rules_view(request):
    return render(request, 'game/rules.html')
