from django.db import migrations


class Migration(migrations.Migration):
    """Rename Question.exams -> courses (M2M), Quiz.exam -> course,
    MockTest.exam -> course."""

    dependencies = [
        ('quiz', '0007_quiz_mocktest_tenant_required'),
        ('exams', '0007_rename_exam_to_course'),
    ]

    operations = [
        migrations.RenameField(model_name='question', old_name='exams', new_name='courses'),
        migrations.RenameField(model_name='quiz', old_name='exam', new_name='course'),
        migrations.RenameField(model_name='mocktest', old_name='exam', new_name='course'),
    ]
