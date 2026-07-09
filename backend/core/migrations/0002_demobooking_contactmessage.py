import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DemoBooking',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('status', models.CharField(choices=[('new', 'New'), ('contacted', 'Contacted'), ('closed', 'Closed')], db_index=True, default='new', max_length=20)),
                ('source', models.CharField(blank=True, default='landing', max_length=100)),
                ('internal_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('phone', models.CharField(blank=True, max_length=30)),
                ('organization', models.CharField(blank=True, max_length=255)),
                ('organization_type', models.CharField(blank=True, choices=[('coaching', 'Coaching Institute'), ('school', 'School'), ('college', 'College'), ('other', 'Other')], max_length=20)),
                ('message', models.TextField(blank=True)),
            ],
            options={
                'verbose_name': 'Demo Booking',
                'verbose_name_plural': 'Demo Bookings',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ContactMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('status', models.CharField(choices=[('new', 'New'), ('contacted', 'Contacted'), ('closed', 'Closed')], db_index=True, default='new', max_length=20)),
                ('source', models.CharField(blank=True, default='landing', max_length=100)),
                ('internal_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('subject', models.CharField(blank=True, max_length=255)),
                ('message', models.TextField()),
            ],
            options={
                'verbose_name': 'Contact Message',
                'verbose_name_plural': 'Contact Messages',
                'ordering': ['-created_at'],
            },
        ),
    ]
