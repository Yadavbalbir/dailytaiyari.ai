"""
Backfill the ``tenant`` field on community records created before tenant
stamping was enforced in the API layer.

Historically ``PostViewSet``/``CommentViewSet`` saved records without a tenant,
so existing rows have ``tenant=NULL``. Once the read queries filter by tenant,
those rows would disappear from their rightful tenant's feed. We recover the
correct tenant from each record's author (``author.user.tenant``) and cascade it
to dependent rows (likes, poll options/votes, quizzes, events, attempts).
"""
from django.db import migrations


def backfill_tenant(apps, schema_editor):
    Post = apps.get_model('community', 'Post')
    Comment = apps.get_model('community', 'Comment')
    Like = apps.get_model('community', 'Like')
    PollOption = apps.get_model('community', 'PollOption')
    PollVote = apps.get_model('community', 'PollVote')
    CommunityQuiz = apps.get_model('community', 'CommunityQuiz')
    CommunityEvent = apps.get_model('community', 'CommunityEvent')
    QuizAttempt = apps.get_model('community', 'QuizAttempt')
    CommunityStats = apps.get_model('community', 'CommunityStats')

    # Posts & comments: tenant comes from the author's user.
    for post in Post.objects.filter(tenant__isnull=True).select_related('author__user'):
        tenant_id = getattr(post.author.user, 'tenant_id', None)
        if tenant_id:
            Post.objects.filter(pk=post.pk).update(tenant_id=tenant_id)

    for comment in Comment.objects.filter(tenant__isnull=True).select_related('author__user'):
        tenant_id = getattr(comment.author.user, 'tenant_id', None)
        if tenant_id:
            Comment.objects.filter(pk=comment.pk).update(tenant_id=tenant_id)

    # Dependent rows: derive tenant from their parent post.
    for opt in PollOption.objects.filter(tenant__isnull=True).select_related('post'):
        if opt.post.tenant_id:
            PollOption.objects.filter(pk=opt.pk).update(tenant_id=opt.post.tenant_id)

    for quiz in CommunityQuiz.objects.filter(tenant__isnull=True).select_related('post'):
        if quiz.post.tenant_id:
            CommunityQuiz.objects.filter(pk=quiz.pk).update(tenant_id=quiz.post.tenant_id)

    for event in CommunityEvent.objects.filter(tenant__isnull=True).select_related('post'):
        if event.post.tenant_id:
            CommunityEvent.objects.filter(pk=event.pk).update(tenant_id=event.post.tenant_id)

    for like in Like.objects.filter(tenant__isnull=True).select_related('post', 'comment'):
        tenant_id = None
        if like.post_id and like.post.tenant_id:
            tenant_id = like.post.tenant_id
        elif like.comment_id and like.comment.tenant_id:
            tenant_id = like.comment.tenant_id
        if tenant_id:
            Like.objects.filter(pk=like.pk).update(tenant_id=tenant_id)

    for vote in PollVote.objects.filter(tenant__isnull=True).select_related('option__post'):
        tenant_id = getattr(vote.option.post, 'tenant_id', None)
        if tenant_id:
            PollVote.objects.filter(pk=vote.pk).update(tenant_id=tenant_id)

    for attempt in QuizAttempt.objects.filter(tenant__isnull=True).select_related('quiz__post'):
        tenant_id = getattr(attempt.quiz.post, 'tenant_id', None)
        if tenant_id:
            QuizAttempt.objects.filter(pk=attempt.pk).update(tenant_id=tenant_id)

    for stats in CommunityStats.objects.filter(tenant__isnull=True).select_related('user__user'):
        tenant_id = getattr(stats.user.user, 'tenant_id', None)
        if tenant_id:
            CommunityStats.objects.filter(pk=stats.pk).update(tenant_id=tenant_id)


def noop_reverse(apps, schema_editor):
    # Non-reversible data backfill; nothing to undo.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0008_alter_post_post_type_communityevent'),
    ]

    operations = [
        migrations.RunPython(backfill_tenant, noop_reverse),
    ]
