"""
Serializers for Courses app.
"""
from rest_framework import serializers
from .models import Course, Subject, Topic, TopicCourseRelevance, Chapter


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model."""
    subjects_count = serializers.SerializerMethodField()
    mock_tests_count = serializers.SerializerMethodField()
    quizzes_count = serializers.SerializerMethodField()
    discount_percent = serializers.ReadOnlyField()
    is_free = serializers.ReadOnlyField()
    instructors = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'description', 'course_type',
            'icon', 'color', 'status', 'is_featured', 'thumbnail',
            'duration_minutes', 'total_marks', 'negative_marking',
            'negative_marking_ratio', 'total_students', 'total_questions',
            'subjects_count', 'mock_tests_count', 'quizzes_count',
            'pricing_type', 'price', 'original_price', 'currency',
            'is_free', 'discount_percent', 'subtitle', 'highlights',
            'refund_policy', 'instructors', 'created_at'
        ]

    def get_subjects_count(self, obj):
        return obj.subjects.count()

    def get_mock_tests_count(self, obj):
        return obj.mock_tests.count()

    def get_quizzes_count(self, obj):
        return obj.quizzes.count()

    def get_instructors(self, obj):
        return [
            {'id': str(u.id), 'name': u.full_name or u.first_name or u.email}
            for u in obj.instructors.all()
        ]


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for course listings."""
    
    class Meta:
        model = Course
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
            'id', 'name', 'code', 'description', 'icon', 'color', 'course',
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
    """Detailed serializer with topics in chapter order (via ChapterTopic)."""
    topics = serializers.SerializerMethodField()

    class Meta(ChapterSerializer.Meta):
        fields = ChapterSerializer.Meta.fields + ['topics']

    def get_topics(self, obj):
        qs = obj.chapter_topics.select_related('topic').order_by('order')
        return TopicSerializer([ct.topic for ct in qs], many=True).data


class CourseDetailSerializer(CourseSerializer):
    """Detailed course serializer with subjects."""
    subjects = SubjectSerializer(many=True, read_only=True)
    
    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['subjects']


class SubjectWithChaptersSerializer(SubjectSerializer):
    """Subject serializer with nested chapters."""
    chapters = ChapterSerializer(many=True, read_only=True)
    
    class Meta(SubjectSerializer.Meta):
        fields = SubjectSerializer.Meta.fields + ['chapters']


class CourseContentExplorerSerializer(CourseSerializer):
    """Hierarchical serializer for admin content explorer: Course -> Subject -> Chapter."""
    subjects = SubjectWithChaptersSerializer(many=True, read_only=True)
    
    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ['subjects']

