from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_grandfather_existing_users_verified'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('student', 'Student'), ('instructor', 'Faculty'), ('admin', 'Admin')], default='student', max_length=20),
        ),
    ]
