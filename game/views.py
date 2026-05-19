# game/views.py

from django.shortcuts import render


def sudoku(request):
    return render(request, 'sudoku/sudoku.html')
