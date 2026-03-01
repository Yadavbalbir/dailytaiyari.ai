"""
Serializers for Exams app.
"""
from rest_framework import serializers
from .models import Exam, Subject, Topic, TopicExamRelevance, Chapter


class ExamSerializer(serializers.ModelSerializer):
    """Serializer for Exam model."""
    subjects_count = serializers.SerializerMethodField()
    mock_tests_count = serializers.SerializerMethodField()
    quizzes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'code', 'description', 'exam_type',
            'icon', 'color', 'status', 'is_featured',
            'duration_minutes', 'total_marks', 'negative_marking',
            'negative_marking_ratio', 'total_students', 'total_questions',
            'subjects_count', 'mock_tests_count', 'quizzes_count', 'created_at'
        ]
    
    def get_subjects_count(self, obj):
        return obj.subjects.count()

    def get_mock_tests_count(self, obj):
        return obj.mock_tests.count()

    def get_quizzes_count(self, obj):
        return obj.quizzes.count()


class ExamListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for exam listings."""
    
    class Meta:
        model = Exam
        fields = ['id', 'name', 'code', 'icon', 'color', 'status', 'is_featured']


class TopicSerializer(serializers.ModelSerializer):
    """Serializer for Topic model."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subtopics_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'code', 'description', 'subject', 'subject_name',
            'parent_topic', 'difficulty', 'importance',
            'estimated_study_hours', 'total_questions', 'total_content',
            'subtopics_count', 'order'
        ]
    
    def get_subtopics_count(self, obj):
        return obj.subtopics.count()


class TopicDetailSerializer(TopicSerializer):
    """Detailed serializer with subtopics."""
    subtopics = TopicSerializer(many=True, read_only=True)
    
    class Meta(TopicSerializer.Meta):
        fields = TopicSerializer.Meta.fields + ['subtopics']


class SubjectSerializer(serializers.ModelSerializer):
    """Serializer for Subject model."""
    topics_count = serializers.SerializerMethodField()
    quizzes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'code', 'description', 'icon', 'color',
            'weightage', 'total_topics', 'total_questions',
            'topics_count', 'quizzes_count', 'order'
        ]
    
    def get_topics_count(self, obj):
        return obj.topics.count()

    def get_quizzes_count(self, obj):
        return obj.quizzes.count()


class SubjectDetailSerializer(SubjectSerializer):
    """Detailed serializer with topics."""
    topics = TopicSerializer(many=True, read_only=True)
    
    class Meta(SubjectSerializer.Meta):
        fields = SubjectSerializer.Meta.fields + ['topics']


class ChapterSerializer(serializers.ModelSerializer):
    """Serializer for Chapter model."""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    topics_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chapter
        fields = [
            'id', 'name', 'code', 'description', 'subject', 'subject_name',
            'grade', 'book_reference', 'estimated_hours', 'topics_count', 'order'
        ]
    
    def get_topics_count(self, obj):
        return obj.topics.count()


class ChapterDetailSerializer(ChapterSerializer):
    """Detailed serializer with topics."""
    topics = TopicSerializer(many=True, read_only=True)
    
    class Meta(ChapterSerializer.Meta):
        fields = ChapterSerializer.Meta.fields + ['topics']


class ExamDetailSerializer(ExamSerializer):
    """Detailed exam serializer with subjects."""
    subjects = SubjectSerializer(many=True, read_only=True)
    
    class Meta(ExamSerializer.Meta):
        fields = ExamSerializer.Meta.fields + ['subjects']


class SubjectWithChaptersSerializer(SubjectSerializer):
    """Subject serializer with nested chapters."""
    chapters = ChapterSerializer(many=True, read_only=True)
    
    class Meta(SubjectSerializer.Meta):
        fields = SubjectSerializer.Meta.fields + ['chapters']


class ExamContentExplorerSerializer(ExamSerializer):
    """Hierarchical serializer for admin content explorer: Exam -> Subject -> Chapter."""
    subjects = SubjectWithChaptersSerializer(many=True, read_only=True)
    
    class Meta(ExamSerializer.Meta):
        fields = ExamSerializer.Meta.fields + ['subjects']

