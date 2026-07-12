from rest_framework.test import APIRequestFactory, force_authenticate

from django.test import TestCase

from core.models import Tenant
from users.models import User, StudentProfile
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

