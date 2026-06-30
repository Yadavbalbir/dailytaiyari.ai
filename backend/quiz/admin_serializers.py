"""
Writable serializers for the admin Quiz Builder.

These power full CRUD over Quizzes and their Questions (with options) from the
Exam Content Builder. Question correctness is stored in the same format the quiz
player submits: for ``mcq``/``true_false`` the ``correct_answer`` is the string
index of the correct option (matching ``Answer.selected_option``); for
``fill_blank`` it is the expected text; for ``numerical`` the answer lives in
``numerical_answer`` (with ``correct_answer`` mirrored as a string for display).
"""
from rest_framework import serializers

from .models import Quiz, Question, QuestionOption, QuizQuestion


class AdminQuestionOptionSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct', 'order']
        extra_kwargs = {'order': {'required': False}}


class AdminQuestionSerializer(serializers.ModelSerializer):
    """Writable serializer for Question with nested options and quiz linking."""
    options = AdminQuestionOptionSerializer(many=True, required=False)
    quiz = serializers.PrimaryKeyRelatedField(
        queryset=Quiz.objects.all(), required=False, allow_null=True, write_only=True
    )
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'question_text', 'question_html', 'question_type',
            'difficulty', 'status', 'topic', 'topic_name', 'subject',
            'subject_name', 'exams', 'correct_answer', 'explanation',
            'numerical_answer', 'numerical_tolerance', 'marks', 'negative_marks',
            'source', 'year', 'tags', 'options', 'quiz',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'exams': {'required': False},
            'correct_answer': {'required': False, 'allow_blank': True},
        }

    def _sync_options(self, question, options):
        """Replace the question's options with the supplied list (ordered)."""
        question.options.all().delete()
        for index, opt in enumerate(options):
            QuestionOption.objects.create(
                question=question,
                option_text=opt.get('option_text', ''),
                is_correct=opt.get('is_correct', False),
                order=opt.get('order', index),
            )

    def _link_quiz(self, question, quiz):
        if quiz is None:
            return
        if QuizQuestion.objects.filter(quiz=quiz, question=question).exists():
            return
        next_order = QuizQuestion.objects.filter(quiz=quiz).count()
        QuizQuestion.objects.create(quiz=quiz, question=question, order=next_order)

    def create(self, validated_data):
        options = validated_data.pop('options', None)
        quiz = validated_data.pop('quiz', None)
        exams = validated_data.pop('exams', None)
        subject = validated_data.get('subject')

        question = Question.objects.create(**validated_data)

        if exams:
            question.exams.set(exams)
        elif subject is not None and getattr(subject, 'exam_id', None):
            question.exams.set([subject.exam])

        if options is not None:
            self._sync_options(question, options)
        self._link_quiz(question, quiz)
        return question

    def update(self, instance, validated_data):
        options = validated_data.pop('options', None)
        quiz = validated_data.pop('quiz', None)
        exams = validated_data.pop('exams', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if exams is not None:
            instance.exams.set(exams)
        if options is not None:
            self._sync_options(instance, options)
        self._link_quiz(instance, quiz)
        return instance


class AdminQuizSerializer(serializers.ModelSerializer):
    """Writable serializer for Quiz; derives exam/subject from topic when omitted."""
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'quiz_type', 'status',
            'exam', 'exam_name', 'subject', 'topic',
            'duration_minutes', 'total_marks', 'passing_marks',
            'shuffle_questions', 'shuffle_options', 'show_answer_after_each',
            'allow_skip', 'is_free', 'questions_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'exam': {'required': False},
            'quiz_type': {'required': False},
        }

    def validate(self, attrs):
        topic = attrs.get('topic')
        if topic is not None:
            attrs.setdefault('subject', topic.subject)
            if not attrs.get('exam'):
                attrs['exam'] = topic.subject.exam
        subject = attrs.get('subject')
        if subject is not None and not attrs.get('exam'):
            attrs['exam'] = subject.exam
        if not attrs.get('quiz_type'):
            if topic is not None:
                attrs['quiz_type'] = 'topic'
            elif subject is not None:
                attrs['quiz_type'] = 'subject'
            else:
                attrs['quiz_type'] = 'custom'
        return attrs
