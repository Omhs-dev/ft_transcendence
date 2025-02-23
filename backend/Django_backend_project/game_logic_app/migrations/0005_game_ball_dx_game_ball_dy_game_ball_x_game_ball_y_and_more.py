# Generated by Django 5.1.4 on 2025-02-21 00:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_logic_app', '0004_remove_game_ball_dx_remove_game_ball_dy_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='game',
            name='ball_dx',
            field=models.FloatField(default=4),
        ),
        migrations.AddField(
            model_name='game',
            name='ball_dy',
            field=models.FloatField(default=4),
        ),
        migrations.AddField(
            model_name='game',
            name='ball_x',
            field=models.FloatField(default=400),
        ),
        migrations.AddField(
            model_name='game',
            name='ball_y',
            field=models.FloatField(default=200),
        ),
        migrations.AddField(
            model_name='game',
            name='player1_y',
            field=models.FloatField(default=150),
        ),
        migrations.AddField(
            model_name='game',
            name='player2_y',
            field=models.FloatField(default=150),
        ),
    ]
