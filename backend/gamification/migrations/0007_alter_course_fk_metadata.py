import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0006_rename_exam_to_course'),
        ('exams', '0008_alter_course_options_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='challenge',
            name='course',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='challenges', to='exams.course'),
        ),
        migrations.AlterField(
            model_name='leaderboardentry',
            name='course',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='leaderboard_entries', to='exams.course'),
        ),
    ]
