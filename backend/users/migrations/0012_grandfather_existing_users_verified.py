from django.db import migrations
from django.utils import timezone


def grandfather_existing_users(apps, schema_editor):
    """Mark all users that existed before email verification was introduced as
    verified, so they are not locked out of login by the new is_email_verified
    guard. Registration was previously broken (500 on duplicate email), so every
    current user is a legitimate pre-existing account that should be grandfathered.
    New users created after this migration start unverified as intended.
    """
    User = apps.get_model('users', 'User')
    User.objects.filter(is_email_verified=False).update(
        is_email_verified=True,
        email_verified_at=timezone.now(),
    )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_user_email_verified_at_user_is_email_verified_and_more'),
    ]

    operations = [
        migrations.RunPython(grandfather_existing_users, noop_reverse),
    ]
