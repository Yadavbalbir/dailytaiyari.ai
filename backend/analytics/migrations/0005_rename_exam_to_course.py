from django.db import migrations


class Migration(migrations.Migration):
    """Rename SubjectPerformance.exam -> course and Streak.exam -> course."""

    dependencies = [
        ('analytics', '0004_dailyactivity_tenant_streak_tenant_and_more'),
        ('exams', '0007_rename_exam_to_course'),
    ]

    operations = [
        migrations.RenameField(model_name='subjectperformance', old_name='exam', new_name='course'),
        migrations.RenameField(model_name='streak', old_name='exam', new_name='course'),
    ]
