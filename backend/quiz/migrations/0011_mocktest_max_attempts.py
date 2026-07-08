from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0010_mocktest_courses_mocktest_fullscreen_required_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='mocktest',
            name='max_attempts',
            field=models.PositiveIntegerField(
                default=1,
                help_text='Total attempts allowed per student. 1 = no re-attempts (default).',
            ),
        ),
    ]
