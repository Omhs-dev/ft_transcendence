from django.shortcuts import render, redirect, get_object_or_404
# from django.contrib.auth.decorators import login_required
from .models import Tournament
from .utils import create_tournament, register_player_to_tournament, organize_tournament
from django.http import JsonResponse
import logging

loggers = logging.getLogger('game_logic_app')



# @login_required
def game_ui(request):
    return render(request, 'game_logic_app/game_ui.htm')

# @login_required
def create_tournament_view(request):
    if request.method == "POST":
        name = request.POST.get("name")
        description = request.POST.get("description")
        max_players = request.POST.get("max_players", 8)
        tournament = create_tournament(name, description, max_players)
        return redirect('tournament_detail', tournament_id=tournament.id)
    return render(request, 'game_logic_app/create_tournament.html')

# @login_required
def tournament_detail_view(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    return render(request, 'game_logic_app/tournament_detail.html', {'tournament': tournament})

# @login_required
def register_player_view(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    player = request.user.player
    success = register_player_to_tournament(tournament, player)
    if success:
        return JsonResponse({"message": "Registered successfully."})
    return JsonResponse({"error": "Tournament is full."}, status=400)

# @login_required
def start_tournament_view(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    try:
        organize_tournament(tournament)
        return redirect('tournament_detail', tournament_id=tournament.id)
    except ValueError as e:
        return render(request, 'game_logic_app/tournament_detail.html', {'tournament': tournament, 'error': str(e)})
