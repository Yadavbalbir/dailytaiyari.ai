"""
URL patterns for Courses app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, SubjectViewSet, TopicViewSet, ChapterViewSet,
    StudyCoursesView, StudySubjectsView, StudyChaptersView, StudyChapterDetailView,
    StudyLeaderboardView, TenantContentExplorerView, AvailableCoursesForEnrollmentView
)
from .admin_views import (
    AdminCourseViewSet, AdminSubjectViewSet, AdminChapterViewSet, AdminTopicViewSet,
)

# Admin Content Builder router (full CRUD, tenant-admin only)
admin_router = DefaultRouter()
admin_router.register(r'courses', AdminCourseViewSet, basename='admin-course')
admin_router.register(r'subjects', AdminSubjectViewSet, basename='admin-subject')
admin_router.register(r'chapters', AdminChapterViewSet, basename='admin-chapter')
admin_router.register(r'topics', AdminTopicViewSet, basename='admin-topic')

router = DefaultRouter()
router.register(r'', CourseViewSet, basename='course')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'chapters', ChapterViewSet, basename='chapter')

urlpatterns = [
    path('admin/', include(admin_router.urls)),
    path('available-for-enrollment/', AvailableCoursesForEnrollmentView.as_view(), name='courses-available-for-enrollment'),
    path('study/courses/', StudyCoursesView.as_view(), name='study-courses'),
    path('study/subjects/', StudySubjectsView.as_view(), name='study-subjects'),
    path('study/chapters/<uuid:subject_id>/', StudyChaptersView.as_view(), name='study-chapters'),
    path('study/chapter/<uuid:chapter_id>/', StudyChapterDetailView.as_view(), name='study-chapter-detail'),
    path('study/leaderboard/', StudyLeaderboardView.as_view(), name='study-leaderboard'),
    path('explorer/', TenantContentExplorerView.as_view(), name='tenant-content-explorer'),
    path('', include(router.urls)),
]

