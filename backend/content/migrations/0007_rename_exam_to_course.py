from django.db import migrations


class Migration(migrations.Migration):
    """Rename Content.exams -> courses (M2M) and StudyPlan.exam -> course."""

    dependencies = [
        ('content', '0006_alter_content_content_type'),
        ('exams', '0007_rename_exam_to_course'),
    ]

    operations = [
        migrations.RenameField(model_name='content', old_name='exams', new_name='courses'),
        migrations.RenameField(model_name='studyplan', old_name='exam', new_name='course'),
    ]
