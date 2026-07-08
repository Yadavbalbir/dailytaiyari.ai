from django.db import migrations, models


def backfill_courses(apps, schema_editor):
    """Copy each post's legacy single ``course`` into the new ``courses`` M2M."""
    Post = apps.get_model('community', 'Post')
    for post in Post.objects.exclude(course__isnull=True).iterator():
        post.courses.add(post.course_id)


def unbackfill_courses(apps, schema_editor):
    Post = apps.get_model('community', 'Post')
    for post in Post.objects.iterator():
        post.courses.clear()


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0007_rename_exam_to_course'),
        ('community', '0006_alter_post_course_metadata'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='courses',
            field=models.ManyToManyField(
                blank=True,
                related_name='linked_community_posts',
                to='exams.course',
            ),
        ),
        migrations.RunPython(backfill_courses, unbackfill_courses),
    ]
