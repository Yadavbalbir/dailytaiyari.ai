# Generated manually: backfill exam tenant and make tenant required

import uuid
from django.db import migrations, models
import django.db.models.deletion

TENANT_ID = 'e2990cc1-f62e-4dd8-b9e1-b9967a625041'


def backfill_exam_tenant(apps, schema_editor):
    Exam = apps.get_model('exams', 'Exam')
    Tenant = apps.get_model('core', 'Tenant')
    tenant, created = Tenant.objects.get_or_create(
        pk=uuid.UUID(TENANT_ID),
        defaults={'name': 'Default Tenant', 'subdomain': 'default', 'is_active': True},
    )
    updated = Exam.objects.filter(tenant__isnull=True).update(tenant_id=tenant.id)
    if updated:
        print(f'  Tagged {updated} exam(s) to tenant {tenant.name} ({TENANT_ID})')


class Migration(migrations.Migration):

    dependencies = [
        ('core', '__first__'),
        ('exams', '0005_subject_one_exam'),
    ]

    operations = [
        migrations.RunPython(backfill_exam_tenant, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='exam',
            name='tenant',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='exams',
                to='core.tenant',
            ),
        ),
    ]
