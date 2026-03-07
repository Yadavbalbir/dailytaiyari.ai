# Backfill tenant from exam and make tenant required (no quiz/mock/PYP without tenant)

from django.db import migrations, models


def backfill_quiz_tenant(apps, schema_editor):
    Quiz = apps.get_model('quiz', 'Quiz')
    Tenant = apps.get_model('core', 'Tenant')
    default_tenant = Tenant.objects.filter(is_active=True).first()
    for quiz in Quiz.objects.filter(tenant_id__isnull=True).select_related('exam'):
        tid = getattr(quiz.exam, 'tenant_id', None) if quiz.exam_id else None
        if not tid and default_tenant:
            tid = default_tenant.id
        if tid:
            quiz.tenant_id = tid
            quiz.save(update_fields=['tenant_id'])


def backfill_mocktest_tenant(apps, schema_editor):
    MockTest = apps.get_model('quiz', 'MockTest')
    Tenant = apps.get_model('core', 'Tenant')
    default_tenant = Tenant.objects.filter(is_active=True).first()
    for mt in MockTest.objects.filter(tenant_id__isnull=True).select_related('exam'):
        tid = getattr(mt.exam, 'tenant_id', None) if mt.exam_id else None
        if not tid and default_tenant:
            tid = default_tenant.id
        if tid:
            mt.tenant_id = tid
            mt.save(update_fields=['tenant_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0006_mocktest_is_pyp_mocktest_pyp_date_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_quiz_tenant, migrations.RunPython.noop),
        migrations.RunPython(backfill_mocktest_tenant, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='quiz',
            name='tenant',
            field=models.ForeignKey(
                help_text='Required: no quiz without tenant.',
                on_delete=models.CASCADE,
                related_name='quizzes',
                to='core.tenant',
            ),
        ),
        migrations.AlterField(
            model_name='mocktest',
            name='tenant',
            field=models.ForeignKey(
                help_text='Required: no mock test or PYP without tenant.',
                on_delete=models.CASCADE,
                related_name='mock_tests',
                to='core.tenant',
            ),
        ),
    ]
