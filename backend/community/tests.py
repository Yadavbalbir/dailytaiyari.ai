from rest_framework.test import APIRequestFactory, force_authenticate

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase

from core.models import Tenant
from exams.models import Course
from users.models import User, StudentProfile, CourseEnrollment
from community.models import Post, Like
from community.views import PostViewSet


class PostLikeXPTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='T', subdomain='t')
        self.author_user = User.objects.create_user(email='author@x.com', tenant=self.tenant, password='x')
        self.author, _ = StudentProfile.objects.get_or_create(user=self.author_user)
        self.liker_user = User.objects.create_user(email='liker@x.com', tenant=self.tenant, password='x')
        self.liker, _ = StudentProfile.objects.get_or_create(user=self.liker_user)
        self.post = Post.objects.create(
            author=self.author,
            tenant=self.tenant,
            post_type='question',
            title='A valid question title',
            content='Some sufficiently long content body.',
        )
        self.factory = APIRequestFactory()
        self.view = PostViewSet.as_view({'post': 'like'})

    def _like(self, user):
        request = self.factory.post(f'/posts/{self.post.id}/like/')
        force_authenticate(request, user=user)
        request.tenant = self.tenant
        return self.view(request, pk=str(self.post.id))

    def test_like_unlike_relike_awards_xp_once(self):
        self._like(self.liker_user)   # like
        self._like(self.liker_user)   # unlike
        self._like(self.liker_user)   # re-like
        self.author.refresh_from_db()
        self.assertEqual(self.author.total_xp, 2)  # receive_like_post once
        # The like row is soft-toggled, not duplicated.
        self.assertEqual(Like.objects.filter(post=self.post, user=self.liker).count(), 1)

    def test_self_like_awards_no_xp(self):
        self._like(self.author_user)
        self.author.refresh_from_db()
        self.assertEqual(self.author.total_xp, 0)


class PostTenantIsolationTests(TestCase):
    """Posts must never leak across tenants."""

    def setUp(self):
        self.tenant_a = Tenant.objects.create(name='A', subdomain='a')
        self.tenant_b = Tenant.objects.create(name='B', subdomain='b')

        self.user_a = User.objects.create_user(email='a@x.com', tenant=self.tenant_a, password='x')
        self.profile_a, _ = StudentProfile.objects.get_or_create(user=self.user_a)
        self.user_b = User.objects.create_user(email='b@x.com', tenant=self.tenant_b, password='x')
        self.profile_b, _ = StudentProfile.objects.get_or_create(user=self.user_b)

        self.post_a = Post.objects.create(
            author=self.profile_a, tenant=self.tenant_a, post_type='question',
            title='Tenant A only post title', content='Content body for tenant A only.',
        )
        self.factory = APIRequestFactory()
        self.list_view = PostViewSet.as_view({'get': 'list'})

    def _list(self, user, tenant):
        request = self.factory.get('/posts/')
        force_authenticate(request, user=user)
        request.tenant = tenant
        return self.list_view(request)

    def test_other_tenant_cannot_see_post(self):
        response = self._list(self.user_b, self.tenant_b)
        self.assertEqual(response.status_code, 200)
        ids = [p['id'] for p in response.data.get('results', response.data)]
        self.assertNotIn(str(self.post_a.id), ids)

    def test_same_tenant_sees_own_post(self):
        response = self._list(self.user_a, self.tenant_a)
        self.assertEqual(response.status_code, 200)
        ids = [p['id'] for p in response.data.get('results', response.data)]
        self.assertIn(str(self.post_a.id), ids)


class CoursePreviewTests(TestCase):
    """The course-level community teaser powering course landing pages."""

    def setUp(self):
        self.tenant = Tenant.objects.create(name='P', subdomain='p')
        self.other_tenant = Tenant.objects.create(name='Q', subdomain='q')
        self.course = Course.objects.create(
            tenant=self.tenant, name='Physics 101', code='PHY101',
        )

        self.author_user = User.objects.create_user(
            email='author@p.com', tenant=self.tenant, password='x'
        )
        self.author, _ = StudentProfile.objects.get_or_create(user=self.author_user)

        self.outsider_user = User.objects.create_user(
            email='outsider@p.com', tenant=self.tenant, password='x'
        )
        self.outsider, _ = StudentProfile.objects.get_or_create(user=self.outsider_user)

        self.post = Post.objects.create(
            author=self.author, tenant=self.tenant, post_type='question',
            title='How do I solve projectile motion?',
            content='<p>I keep getting the range formula wrong, any tips?</p>',
            comments_count=3,
        )
        self.post.courses.add(self.course)

        # Hidden posts must never surface in the teaser.
        hidden = Post.objects.create(
            author=self.author, tenant=self.tenant, post_type='question',
            title='This one was moderated away',
            content='Hidden content that should not be exposed.',
            status='hidden',
        )
        hidden.courses.add(self.course)

        self.factory = APIRequestFactory()
        self.view = PostViewSet.as_view({'get': 'course_preview'})

    def _preview(self, user, tenant=None):
        request = self.factory.get('/posts/course_preview/', {'course': str(self.course.id)})
        if user is not None:
            force_authenticate(request, user=user)
        request.tenant = tenant or self.tenant
        return self.view(request)

    def test_anonymous_visitor_gets_locked_teaser(self):
        response = self._preview(AnonymousUser())
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['can_participate'])
        self.assertEqual(response.data['stats']['posts'], 1)
        titles = [p['title'] for p in response.data['posts']]
        self.assertIn('How do I solve projectile motion?', titles)
        self.assertNotIn('This one was moderated away', titles)

    def test_excerpt_is_plain_text_and_body_is_not_exposed(self):
        response = self._preview(AnonymousUser())
        post = response.data['posts'][0]
        self.assertNotIn('content', post)
        self.assertNotIn('<p>', post['excerpt'])
        self.assertIn('range formula', post['excerpt'])

    def test_enrolled_student_can_participate(self):
        CourseEnrollment.objects.create(
            student=self.outsider, course=self.course, status='approved', is_active=True,
        )
        response = self._preview(self.outsider_user)
        self.assertTrue(response.data['is_enrolled'])
        self.assertTrue(response.data['can_participate'])
        self.assertEqual(response.data['stats']['members'], 1)

    def test_answers_are_not_double_counted_for_dual_linked_posts(self):
        # Legacy FK + M2M pointing at the same course must not inflate stats.
        self.post.course = self.course
        self.post.save(update_fields=['course'])
        response = self._preview(AnonymousUser())
        self.assertEqual(response.data['stats']['posts'], 1)
        self.assertEqual(response.data['stats']['answers'], 3)

    def test_course_from_another_tenant_is_not_found(self):
        response = self._preview(self.author_user, tenant=self.other_tenant)
        self.assertEqual(response.status_code, 404)
