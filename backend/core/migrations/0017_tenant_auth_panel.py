from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_tenant_allowed_origins_platformannouncement'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='auth_panel',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
