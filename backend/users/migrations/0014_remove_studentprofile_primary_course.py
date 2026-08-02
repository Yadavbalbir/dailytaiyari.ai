from django.db import migrations


class Migration(migrations.Migration):
    """Drop StudentProfile.primary_course.

    Courses are now tracked solely through CourseEnrollment; every course a
    student is associated with is treated at the same level, so the single
    "primary" course is no longer a distinct concept.
    """

    dependencies = [
        ('users', '0013_alter_user_role'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='studentprofile',
            name='primary_course',
        ),
    ]
