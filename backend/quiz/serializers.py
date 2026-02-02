"""
Serializers for Quiz app.
"""
from rest_framework import serializers
from .models import (
    Question, QuestionOption, Quiz, QuizQuestion,
    MockTest, QuizAttempt, MockTestAttempt, Answer
)


class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer for question options."""
    
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'option_image', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for questions."""
    options = QuestionOptionSerializer(many=True, read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'question_text', 'question_html', 'question_image',
            'question_type', 'difficulty', 'topic', 'topic_name',
            'subject', 'subject_name', 'marks', 'negative_marks',
            'options', 'source', 'year', 'tags'
        ]


class QuestionWithAnswerSerializer(QuestionSerializer):
    """Serializer that includes correct answer and explanation."""
    options = serializers.SerializerMethodField()
    
    class Meta(QuestionSerializer.Meta):
        fields = QuestionSerializer.Meta.fields + [
            'correct_answer', 'explanation', 'explanation_image',
            'numerical_answer', 'accuracy_rate'
        ]
    
    def get_options(self, obj):
        options = obj.options.all()
        return [{
            'id': str(opt.id),
            'option_text': opt.option_text,
            'option_image': opt.option_image.url if opt.option_image else None,
            'order': opt.order,
            'is_correct': opt.is_correct
        } for opt in options]


class QuizSerializer(serializers.ModelSerializer):
    """Serializer for quiz listings."""
    questions_count = serializers.ReadOnlyField()
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'description', 'quiz_type', 'status',
            'exam', 'exam_name', 'subject', 'subject_name',
            'topic', 'topic_name', 'questions_count',
            'duration_minutes', 'total_marks', 'is_free',
            'is_daily_challenge', 'challenge_date',
            'total_attempts', 'average_score', 'created_at'
        ]


class QuizDetailSerializer(QuizSerializer):
    """Detailed serializer with questions."""
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + [
            'questions', 'shuffle_questions', 'shuffle_options',
            'show_answer_after_each', 'allow_skip', 'passing_marks'
        ]


class MockTestSerializer(serializers.ModelSerializer):
    """Serializer for mock test listings."""
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MockTest
        fields = [
            'id', 'title', 'description', 'exam', 'exam_name',
            'duration_minutes', 'total_marks', 'negative_marking',
            'status', 'is_free', 'sections', 'questions_count',
            'total_attempts', 'average_score', 'highest_score',
            'available_from', 'available_until', 'created_at'
        ]
    
    def get_questions_count(self, obj):
        return obj.questions.count()


class MockTestDetailSerializer(MockTestSerializer):
    """Detailed mock test serializer."""
    questions = QuestionSerializer(many=True, read_only=True)
    
    class Meta(MockTestSerializer.Meta):
        fields = MockTestSerializer.Meta.fields + ['questions']


class AnswerSerializer(serializers.ModelSerializer):
    """Serializer for answers."""
    question_data = QuestionWithAnswerSerializer(source='question', read_only=True)
    
    class Meta:
        model = Answer
        fields = [
            'id', 'question', 'question_data', 'selected_option',
            'answer_text', 'numerical_answer', 'is_correct',
            'marks_obtained', 'time_taken_seconds', 'is_marked_for_review'
        ]
        read_only_fields = ['id', 'is_correct', 'marks_obtained']


class AnswerSubmitSerializer(serializers.Serializer):
    """Serializer for submitting an answer."""
    question_id = serializers.UUIDField()
    selected_option = serializers.CharField(required=False, allow_blank=True)
    answer_text = serializers.CharField(required=False, allow_blank=True)
    numerical_answer = serializers.DecimalField(
        max_digits=20, decimal_places=10, required=False, allow_null=True
    )
    time_taken_seconds = serializers.IntegerField(default=0)
    is_marked_for_review = serializers.BooleanField(default=False)


class QuizAttemptSerializer(serializers.ModelSerializer):
    """Serializer for quiz attempts."""
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'started_at', 'completed_at',
            'time_taken_seconds', 'status', 'total_questions',
            'attempted_questions', 'correct_answers', 'wrong_answers',
            'skipped_questions', 'marks_obtained', 'total_marks',
            'percentage', 'xp_earned', 'answers'
        ]
        read_only_fields = [
            'id', 'started_at', 'total_questions', 'attempted_questions',
            'correct_answers', 'wrong_answers', 'skipped_questions',
            'marks_obtained', 'total_marks', 'percentage', 'xp_earned'
        ]


class MockTestAttemptSerializer(serializers.ModelSerializer):
    """Serializer for mock test attempts."""
    mock_test_title = serializers.CharField(source='mock_test.title', read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = MockTestAttempt
        fields = [
            'id', 'mock_test', 'mock_test_title', 'started_at',
            'completed_at', 'time_taken_seconds', 'status',
            'total_questions', 'attempted_questions', 'correct_answers',
            'wrong_answers', 'marks_obtained', 'percentage',
            'section_results', 'rank', 'percentile', 'xp_earned', 'answers'
        ]


class QuizStartSerializer(serializers.Serializer):
    """Serializer for starting a quiz."""
    quiz_id = serializers.UUIDField()


class QuizSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a complete quiz."""
    answers = AnswerSubmitSerializer(many=True)
    time_taken_seconds = serializers.IntegerField()

