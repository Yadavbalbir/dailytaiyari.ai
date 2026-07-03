from django.db import migrations, models


class Migration(migrations.Migration):
    """Rename Post.exam -> course. Drop the exam index before the rename and
    re-add it on course after, since RenameField does not update Meta.indexes."""

    dependencies = [
        ('community', '0004_comment_answer_xp_awarded_and_more'),
        ('exams', '0007_rename_exam_to_course'),
    ]

    operations = [
        migrations.RemoveIndex(model_name='post', name='community_p_exam_id_4c4a08_idx'),
        migrations.RenameField(model_name='post', old_name='exam', new_name='course'),
        migrations.AddIndex(
            model_name='post',
            index=models.Index(fields=['course', '-created_at'], name='community_p_course__cbeb24_idx'),
        ),
    ]
