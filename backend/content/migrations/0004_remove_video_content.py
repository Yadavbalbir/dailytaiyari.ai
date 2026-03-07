# Remove all video-type content from the platform

from django.db import migrations


def delete_video_content(apps, schema_editor):
    Content = apps.get_model('content', 'Content')
    ContentProgress = apps.get_model('content', 'ContentProgress')
    # Delete progress records for video content first (FK)
    video_ids = list(Content.objects.filter(content_type='video').values_list('id', flat=True))
    if video_ids:
        ContentProgress.objects.filter(content_id__in=video_ids).delete()
        Content.objects.filter(content_type='video').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0003_content_tenant_contentprogress_tenant_and_more'),
    ]

    operations = [
        migrations.RunPython(delete_video_content, migrations.RunPython.noop),
    ]
