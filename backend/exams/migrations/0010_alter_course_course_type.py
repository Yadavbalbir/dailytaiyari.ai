from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0009_course_instructors'),
    ]

    operations = [
        migrations.AlterField(
            model_name='course',
            name='course_type',
            field=models.CharField(
                choices=[
                    ('competitive', 'Competitive Course'),
                    ('board', 'Board Course'),
                    ('entrance', 'Entrance Course'),
                    ('government', 'Government Job Course'),
                    ('skill', 'Skill Development'),
                ],
                max_length=20,
            ),
        ),
    ]
