from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0017_tenant_auth_panel'),
    ]

    operations = [
        migrations.AlterField(
            model_name='demobooking',
            name='organization_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('creator', 'Independent Creator'),
                    ('coaching', 'Coaching Institute'),
                    ('school', 'School'),
                    ('college', 'College'),
                    ('edtech', 'EdTech / Online Academy'),
                    ('other', 'Other'),
                ],
                max_length=20,
            ),
        ),
    ]
