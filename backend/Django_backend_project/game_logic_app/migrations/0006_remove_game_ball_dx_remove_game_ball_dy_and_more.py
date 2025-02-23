# Generated by Django 5.1.4 on 2025-02-21 01:03

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_logic_app', '0005_game_ball_dx_game_ball_dy_game_ball_x_game_ball_y_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='game',
            name='ball_dx',
        ),
        migrations.RemoveField(
            model_name='game',
            name='ball_dy',
        ),
        migrations.RemoveField(
            model_name='game',
            name='ball_x',
        ),
        migrations.RemoveField(
            model_name='game',
            name='ball_y',
        ),
        migrations.RemoveField(
            model_name='game',
            name='player1_y',
        ),
        migrations.RemoveField(
            model_name='game',
            name='player2_y',
        ),
        migrations.AddField(
            model_name='game',
            name='loser',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='games_lost', to='game_logic_app.player'),
        ),
    ]
