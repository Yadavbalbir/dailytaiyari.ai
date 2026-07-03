from django.db import migrations, models


class Migration(migrations.Migration):
    """Rename LeaderboardEntry.exam -> course and Challenge.exam -> course.
    Handle the leaderboard index around the rename (RenameField does not
    update Meta.indexes)."""

    dependencies = [
        ('gamification', '0005_xp_transaction_types'),
        ('exams', '0007_rename_exam_to_course'),
    ]

    operations = [
        migrations.RemoveIndex(model_name='leaderboardentry', name='gamificatio_period_6b2d61_idx'),
        migrations.RenameField(model_name='leaderboardentry', old_name='exam', new_name='course'),
        migrations.RenameField(model_name='challenge', old_name='exam', new_name='course'),
        migrations.AddIndex(
            model_name='leaderboardentry',
            index=models.Index(fields=['period', 'course', 'rank'], name='gamificatio_period_426cfb_idx'),
        ),
    ]
