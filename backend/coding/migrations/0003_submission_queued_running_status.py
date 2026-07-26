from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('coding', '0002_solve_mode_external_completion'),
    ]

    operations = [
        migrations.AlterField(
            model_name='codingsubmission',
            name='status',
            field=models.CharField(
                choices=[
                    ('queued', 'Queued'),
                    ('running', 'Running'),
                    ('done', 'Evaluated'),
                    ('error', 'Engine error'),
                ],
                default='done',
                max_length=20,
            ),
        ),
    ]
