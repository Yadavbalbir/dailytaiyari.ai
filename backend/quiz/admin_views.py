"""
Admin CRUD views for the Quiz Builder.

Tenant-scoped, tenant-admin only. Quizzes scope via ``course__tenant`` and
Questions via ``subject__course__tenant`` (legacy rows may have a null tenant).
"""
from django.db.models import Case, When

from exams.admin_views import TenantAdminModelViewSet

from .models import Quiz, Question, QuizQuestion
from .admin_serializers import AdminQuizSerializer, AdminQuestionSerializer


class AdminQuizViewSet(TenantAdminModelViewSet):
    queryset = Quiz.objects.select_related('course', 'subject', 'topic').all()
    serializer_class = AdminQuizSerializer
    search_fields = ['title']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    filterset_fields = ['course', 'subject', 'topic', 'quiz_type', 'status']
    tenant_lookup = 'course__tenant'
    course_lookup = 'course'


class AdminQuestionViewSet(TenantAdminModelViewSet):
    queryset = Question.objects.select_related('topic', 'subject').prefetch_related('options').all()
    serializer_class = AdminQuestionSerializer
    search_fields = ['question_text']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    filterset_fields = ['topic', 'subject', 'difficulty', 'status', 'question_type']
    tenant_lookup = 'subject__course__tenant'
    course_lookup = 'subject__course'

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


# ---------------------------------------------------------------------------
# Rich Mock Test builder (Phase 2)
# ---------------------------------------------------------------------------
from decimal import Decimal

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsTenantAdmin
from exams.admin_views import BuilderPagination
from .models import MockTest, MockTestItem, MockTestQuestion, Question
from .admin_serializers import (
    AdminMockTestSerializer, AdminMockTestItemSerializer,
    AdminMockTestQuestionSerializer,
)


def recompute_mock_total(mock_test):
    """Recompute and persist ``total_marks`` = inline items + linked bank questions."""
    items_total = sum((i.marks for i in mock_test.items.all()), Decimal('0'))
    bank_total = sum(
        (mtq.effective_marks for mtq in
         MockTestQuestion.objects.filter(mock_test=mock_test).select_related('question')),
        Decimal('0'),
    )
    mock_test.total_marks = items_total + bank_total
    mock_test.save(update_fields=['total_marks', 'updated_at'])
    return mock_test.total_marks


class AdminMockTestViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for rich mock tests (tenant-scoped)."""
    permission_classes = [IsTenantAdmin]
    serializer_class = AdminMockTestSerializer
    pagination_class = BuilderPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'title', 'status']
    ordering = ['-created_at']
    filterset_fields = ['status', 'is_pyp', 'is_free', 'result_visibility']
    queryset = MockTest.objects.all().prefetch_related('items', 'courses')

    def _tenant(self):
        return getattr(self.request, 'tenant', None)

    def get_queryset(self):
        tenant = self._tenant()
        if not tenant:
            return MockTest.objects.none()
        return super().get_queryset().filter(tenant=tenant)

    def perform_create(self, serializer):
        extra = {'tenant': self._tenant()}
        if serializer.validated_data.get('total_marks') is None:
            extra['total_marks'] = Decimal('0')
        serializer.save(**extra)

    # --- bank-question linking -------------------------------------------

    @action(detail=True, methods=['get'])
    def bank_questions(self, request, pk=None):
        mock_test = self.get_object()
        mtqs = (MockTestQuestion.objects.filter(mock_test=mock_test)
                .select_related('question').order_by('section', 'order'))
        return Response(AdminMockTestQuestionSerializer(mtqs, many=True).data)

    @action(detail=True, methods=['post'])
    def add_bank_questions(self, request, pk=None):
        mock_test = self.get_object()
        tenant = self._tenant()
        ids = request.data.get('question_ids', [])
        if not isinstance(ids, list) or not ids:
            raise ValidationError({'question_ids': 'Provide a non-empty list of question ids.'})
        section = request.data.get('section', 0)
        marks_override = request.data.get('marks_override')
        neg_override = request.data.get('negative_marks_override')
        # Only questions in this tenant (via subject->course) or already tenant-linked.
        valid = Question.objects.filter(id__in=ids).filter(
            subject__course__tenant=tenant
        )
        valid_ids = {str(q.id) for q in valid}
        base_order = MockTestQuestion.objects.filter(mock_test=mock_test).count()
        created = 0
        for qid in ids:
            if str(qid) not in valid_ids:
                continue
            if MockTestQuestion.objects.filter(mock_test=mock_test, question_id=qid).exists():
                continue
            MockTestQuestion.objects.create(
                mock_test=mock_test, question_id=qid, section=section,
                order=base_order + created,
                marks_override=marks_override, negative_marks_override=neg_override,
                tenant=tenant,
            )
            created += 1
        recompute_mock_total(mock_test)
        return Response({'added': created}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_bank_question(self, request, pk=None):
        mock_test = self.get_object()
        qid = request.data.get('question_id')
        if not qid:
            raise ValidationError({'question_id': 'Required.'})
        deleted, _ = MockTestQuestion.objects.filter(
            mock_test=mock_test, question_id=qid).delete()
        recompute_mock_total(mock_test)
        return Response({'removed': deleted})

    @action(detail=True, methods=['post'])
    def recompute_marks(self, request, pk=None):
        mock_test = self.get_object()
        total = recompute_mock_total(mock_test)
        return Response({'total_marks': float(total)})


class AdminMockTestItemViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for inline mock-test items. Filter by ``?mock_test=<id>``."""
    permission_classes = [IsTenantAdmin]
    serializer_class = AdminMockTestItemSerializer
    pagination_class = BuilderPagination
    queryset = MockTestItem.objects.all()

    def _tenant(self):
        return getattr(self.request, 'tenant', None)

    def get_queryset(self):
        tenant = self._tenant()
        if not tenant:
            return MockTestItem.objects.none()
        qs = MockTestItem.objects.filter(mock_test__tenant=tenant)
        mock_test_id = self.request.query_params.get('mock_test')
        if mock_test_id:
            qs = qs.filter(mock_test_id=mock_test_id)
        return qs.order_by('section', 'order')

    def _resolve_mock_test(self, serializer):
        mock_test = serializer.validated_data.get('mock_test')
        if mock_test is None or mock_test.tenant_id != self._tenant().id:
            raise ValidationError({'mock_test': 'Mock test not found for this tenant.'})
        return mock_test

    def perform_create(self, serializer):
        mock_test = self._resolve_mock_test(serializer)
        if not serializer.validated_data.get('order'):
            serializer.validated_data['order'] = MockTestItem.objects.filter(
                mock_test=mock_test).count()
        item = serializer.save(tenant=self._tenant())
        recompute_mock_total(item.mock_test)

    def perform_update(self, serializer):
        item = serializer.save()
        recompute_mock_total(item.mock_test)

    def perform_destroy(self, instance):
        mock_test = instance.mock_test
        instance.delete()
        recompute_mock_total(mock_test)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Body: {"order": [item_id, ...]}. Reorders items within the tenant."""
        ids = request.data.get('order', [])
        qs = self.get_queryset()
        lookup = {str(obj.id): obj for obj in qs.filter(id__in=ids)}
        updated = []
        for index, obj_id in enumerate(ids):
            obj = lookup.get(str(obj_id))
            if obj is not None:
                obj.order = index
                updated.append(obj)
        if updated:
            MockTestItem.objects.bulk_update(updated, ['order'])
        return Response({'updated': len(updated)})
