from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile, ExamEnrollment


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'tenant', 'role', 'is_onboarded', 'is_active', 'created_at']
    list_filter = ['tenant', 'role', 'is_onboarded', 'is_active', 'is_staff']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Organization', {'fields': ('tenant', 'role')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        ('Preferences', {'fields': ('preferred_language', 'notification_enabled', 'dark_mode')}),
        ('Status', {'fields': ('is_onboarded', 'onboarded_at')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'primary_exam', 'total_xp', 'current_level']
    list_filter = ['primary_exam']
    search_fields = ['user__email', 'user__first_name']
    raw_id_fields = ['user', 'primary_exam']


@admin.register(ExamEnrollment)
class ExamEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'is_active', 'exam_xp', 'exam_rank', 'enrolled_at']
    list_filter = ['exam', 'is_active']
    raw_id_fields = ['student', 'exam']

