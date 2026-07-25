import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('coding', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='codingproblem',
            name='solve_mode',
            field=models.CharField(
                choices=[
                    ('in_app', 'Solve in app'),
                    ('external', 'Solve on external platform'),
                    ('both', 'Solve in app or external platform'),
                ],
                default='in_app',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='codingproblem',
            name='external_url',
            field=models.URLField(blank=True, max_length=1000),
        ),
        migrations.CreateModel(
            name='CodingProblemCompletion',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('method', models.CharField(choices=[('in_app', 'Solved in app'), ('external', 'Solved on external platform')], default='in_app', max_length=20)),
                ('completed_at', models.DateTimeField(auto_now=True)),
                ('problem', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='completions', to='coding.codingproblem')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='coding_completions', to='users.studentprofile')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='coding_completions', to='core.tenant')),
            ],
            options={
                'verbose_name': 'Coding Problem Completion',
                'verbose_name_plural': 'Coding Problem Completions',
            },
        ),
        migrations.AddIndex(
            model_name='codingproblemcompletion',
            index=models.Index(fields=['problem', 'student'], name='coding_completion_ps_idx'),
        ),
        migrations.AddConstraint(
            model_name='codingproblemcompletion',
            constraint=models.UniqueConstraint(fields=('problem', 'student'), name='uniq_problem_student_completion'),
        ),
    ]
