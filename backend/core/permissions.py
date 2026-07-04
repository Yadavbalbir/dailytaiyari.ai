from rest_framework import permissions

class IsTenantAdmin(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role in the current tenant.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if the user has the 'admin' role
        # Note: We assume the user is already scoped to the tenant by the auth/middleware
        return request.user.role == 'admin'


def resolve_course_id(obj, course_lookup):
    """Walk ``course_lookup`` (``a__b__c``) from ``obj`` to the owning Course id.

    ``course_lookup`` of ``None`` means ``obj`` is itself a Course.
    Returns the Course id (or ``None`` if the chain breaks).
    """
    if course_lookup is None:
        return getattr(obj, 'id', None)
    cur = obj
    for part in course_lookup.split('__'):
        if cur is None:
            return None
        cur = getattr(cur, part, None)
    return getattr(cur, 'id', None)


class IsCourseEditor(permissions.BasePermission):
    """
    Allows tenant admins and assigned instructors to edit course content.

    - Admins: full access.
    - Instructors: may only touch objects belonging to a course they are
      assigned to. The owning course is resolved via ``view.course_lookup``
      (``None`` means the object is a Course). Object-level scoping is a
      belt-and-suspenders check on top of queryset filtering.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in ('admin', 'instructor')

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'admin':
            return True
        if user.role != 'instructor':
            return False
        course_id = resolve_course_id(obj, getattr(view, 'course_lookup', None))
        if course_id is None:
            return False
        return user.instructing_courses.filter(id=course_id).exists()
