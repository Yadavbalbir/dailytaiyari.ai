# Hand-authored: add pricing + details-page fields to Course.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0011_course_thumbnail'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='pricing_type',
            field=models.CharField(
                choices=[('free', 'Free'), ('paid', 'Paid')],
                default='free',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='course',
            name='price',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='course',
            name='original_price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='course',
            name='currency',
            field=models.CharField(default='INR', max_length=3),
        ),
        migrations.AddField(
            model_name='course',
            name='subtitle',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='course',
            name='highlights',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='course',
            name='refund_policy',
            field=models.TextField(blank=True, default=''),
        ),
    ]
