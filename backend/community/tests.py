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

