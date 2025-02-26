# Generated by Django 5.1.4 on 2025-02-24 20:57

import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('game_app', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=150, unique=True)),
                ('description', models.TextField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('ongoing', 'Ongoing'), ('finished', 'Finished')], default='pending', max_length=10)),
                ('start_time', models.DateTimeField(default=django.utils.timezone.now)),
                ('end_time', models.DateTimeField(blank=True, null=True)),
                ('max_players', models.PositiveIntegerField(default=8)),
                ('games', models.ManyToManyField(blank=True, default=None, related_name='tournaments', to='game_app.game')),
                ('players', models.ManyToManyField(related_name='tournaments', to='game_app.player')),
            ],
        ),
        migrations.CreateModel(
            name='TournamentPlayer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alias', models.CharField(blank=True, max_length=150)),
                ('player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tournaments_played', to='game_app.player')),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tournament_players', to='tournament_app.tournament')),
            ],
            options={
                'unique_together': {('tournament', 'player')},
            },
        ),
    ]
