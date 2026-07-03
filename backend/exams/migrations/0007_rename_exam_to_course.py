from django.db import migrations


class Migration(migrations.Migration):
    """Rename Exam -> Course (and related fields). Data-preserving: uses
    RenameModel/RenameField which map to instant, non-destructive
    ALTER TABLE ... RENAME statements in Postgres."""

    dependencies = [
        ('exams', '0006_exam_tenant_required_backfill'),
        # Ensure the rename runs after every app's pre-rename migrations that
        # still reference 'exams.exam', so a fresh DB build applies those
        # historical FKs before the model is renamed to Course.
        ('analytics', '0004_dailyactivity_tenant_streak_tenant_and_more'),
        ('content', '0006_alter_content_content_type'),
        ('quiz', '0007_quiz_mocktest_tenant_required'),
        ('community', '0004_comment_answer_xp_awarded_and_more'),
        ('gamification', '0005_xp_transaction_types'),
        ('users', '0008_examenrollment_rejection_reason_and_more'),
    ]

    operations = [
        migrations.RenameModel(old_name='Exam', new_name='Course'),
        migrations.RenameModel(old_name='TopicExamRelevance', new_name='TopicCourseRelevance'),
        migrations.RenameField(model_name='course', old_name='exam_type', new_name='course_type'),
        migrations.RenameField(model_name='subject', old_name='exam', new_name='course'),
        migrations.RenameField(model_name='topiccourserelevance', old_name='exam', new_name='course'),
        migrations.RenameField(model_name='topic', old_name='exams', new_name='courses'),
    ]
