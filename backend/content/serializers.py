"""
Serializers for Content app.
"""
from rest_framework import serializers
from .models import Content, ContentProgress, StudyPlan, StudyPlanItem


class ContentSerializer(serializers.ModelSerializer):
    """Serializer for Content model."""
    topic_name = serializers.CharField(source='topic.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    
    class Meta:
        model = Content
        fields = [
            'id', 'title', 'slug', 'description', 'content_type',
            'topic', 'topic_name', 'subject', 'subject_name',
            'video_url', 'video_duration_minutes', 'thumbnail',
            'difficulty', 'status', 'is_free', 'is_premium',
            'estimated_time_minutes', 'views_count', 'likes_count',
            'bookmarks_count', 'author_name', 'order', 'created_at'
        ]


class ContentDetailSerializer(ContentSerializer):
    """Detailed serializer with content body."""
    
    class Meta(ContentSerializer.Meta):
        fields = ContentSerializer.Meta.fields + ['content_html', 'pdf_file']


class ContentProgressSerializer(serializers.ModelSerializer):
    """Serializer for ContentProgress model."""
    content_title = serializers.CharField(source='content.title', read_only=True)
    content_type = serializers.CharField(source='content.content_type', read_only=True)
    
    class Meta:
        model = ContentProgress
        fields = [
            'id', 'content', 'content_title', 'content_type',
            'is_completed', 'completed_at', 'progress_percentage',
            'video_position_seconds', 'time_spent_minutes',
            'is_bookmarked', 'is_liked', 'personal_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudyPlanItemSerializer(serializers.ModelSerializer):
    """Serializer for StudyPlanItem model."""
    content_data = ContentSerializer(source='content', read_only=True)
    
    class Meta:
        model = StudyPlanItem
        fields = [
            'id', 'item_type', 'title', 'description',
            'content', 'content_data', 'topic', 'status',
            'completed_at', 'estimated_minutes', 'actual_minutes',
            'is_priority', 'is_revision', 'order'
        ]


class StudyPlanSerializer(serializers.ModelSerializer):
    """Serializer for StudyPlan model."""
    items = StudyPlanItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    completed_items_count = serializers.SerializerMethodField()
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    
    class Meta:
        model = StudyPlan
        fields = [
            'id', 'exam', 'exam_name', 'date', 'is_completed', 'completed_at',
            'target_study_minutes', 'actual_study_minutes',
            'target_questions', 'actual_questions', 'xp_earned',
            'items', 'items_count', 'completed_items_count',
            'created_at', 'updated_at'
        ]
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_completed_items_count(self, obj):
        return obj.items.filter(status='completed').count()


class DailyStudyPlanSerializer(serializers.Serializer):
    """Serializer for generating daily study plan."""
    exam_id = serializers.UUIDField()
    target_minutes = serializers.IntegerField(default=60)
    include_revision = serializers.BooleanField(default=True)
    focus_weak_topics = serializers.BooleanField(default=True)

