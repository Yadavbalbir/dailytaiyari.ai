from django.db import migrations


class Migration(migrations.Migration):
    """Rename ExamEnrollment -> CourseEnrollment and StudentProfile.primary_exam
    -> primary_course. Data-preserving (ALTER ... RENAME)."""

    dependencies = [
        ('users', '0008_examenrollment_rejection_reason_and_more'),
        ('exams', '0007_rename_exam_to_course'),
    ]

    operations = [
        migrations.RenameModel(old_name='ExamEnrollment', new_name='CourseEnrollment'),
        migrations.RenameField(model_name='studentprofile', old_name='primary_exam', new_name='primary_course'),
        migrations.RenameField(model_name='courseenrollment', old_name='exam', new_name='course'),
        migrations.RenameField(model_name='courseenrollment', old_name='exam_xp', new_name='course_xp'),
        migrations.RenameField(model_name='courseenrollment', old_name='exam_rank', new_name='course_rank'),
    ]
