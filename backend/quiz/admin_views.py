"""
Admin CRUD views for the Quiz Builder.

Tenant-scoped, tenant-admin only. Quizzes scope via ``exam__tenant`` and
Questions via ``subject__exam__tenant`` (legacy rows may have a null tenant).
"""
from django.db.models import Case, When

from exams.admin_views import TenantAdminModelViewSet

from .models import Quiz, Question, QuizQuestion
from .admin_serializers import AdminQuizSerializer, AdminQuestionSerializer


class AdminQuizViewSet(TenantAdminModelViewSet):
    queryset = Quiz.objects.select_related('exam', 'subject', 'topic').all()
    serializer_class = AdminQuizSerializer
    search_fields = ['title']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    filterset_fields = ['exam', 'subject', 'topic', 'quiz_type', 'status']
    tenant_lookup = 'exam__tenant'


class AdminQuestionViewSet(TenantAdminModelViewSet):
    queryset = Question.objects.select_related('topic', 'subject').prefetch_related('options').all()
    serializer_class = AdminQuestionSerializer
    search_fields = ['question_text']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    filterset_fields = ['topic', 'subject', 'difficulty', 'status', 'question_type']
    tenant_lookup = 'subject__exam__tenant'

    def get_queryset(self):
        qs = super().get_queryset()
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            ordered_ids = list(
                QuizQuestion.objects.filter(quiz_id=quiz_id)
                .order_by('order')
                .values_list('question_id', flat=True)
            )
            if not ordered_ids:
                return qs.none()
            # Preserve the quiz's question order (IN does not guarantee order),
            # and stop the OrderingFilter default from re-sorting by created_at.
            self.ordering = None
            preserved = Case(*[When(id=pk, then=pos) for pos, pk in enumerate(ordered_ids)])
            qs = qs.filter(id__in=ordered_ids).order_by(preserved)
        return qs

    def perform_destroy(self, instance):
        QuizQuestion.objects.filter(question=instance).delete()
        instance.delete()
