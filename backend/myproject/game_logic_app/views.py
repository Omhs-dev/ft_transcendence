# game_logic_app/views.py
from django.shortcuts import render

def game_ui(request):
    return render(request, 'game_logic_app/game_ui.htm')
