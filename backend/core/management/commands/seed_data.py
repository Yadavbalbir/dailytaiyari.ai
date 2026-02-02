"""
Comprehensive seed data for DailyTaiyari platform.
Run with: python manage.py seed_data
"""
import random
from datetime import datetime, timedelta, date
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from users.models import User, StudentProfile, ExamEnrollment
from exams.models import Exam, Subject, Topic, TopicExamRelevance, Chapter
from quiz.models import Question, QuestionOption, Quiz, QuizQuestion, MockTest, MockTestQuestion, QuizAttempt, Answer
from content.models import Content, ContentProgress, StudyPlan, StudyPlanItem
from gamification.models import Badge, StudentBadge, XPTransaction, LeaderboardEntry, Challenge
from analytics.models import TopicMastery, SubjectPerformance, DailyActivity, Streak, WeeklyReport


class Command(BaseCommand):
    help = 'Seeds the database with comprehensive test data'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Starting database seeding...\n')
        
        # Create data in order
        self.create_exams()
        self.create_subjects()
        self.create_topics()
        self.create_badges()
        self.create_questions()
        self.create_content()
        self.create_quizzes()
        self.create_mock_tests()
        self.create_sample_users()
        self.create_challenges()
        self.create_user_progress()
        
        self.stdout.write(self.style.SUCCESS('\n✅ Database seeding completed successfully!'))

    def create_exams(self):
        self.stdout.write('Creating exams...')
        
        exams_data = [
            {
                'name': 'NEET',
                'code': 'neet',
                'description': 'National Eligibility cum Entrance Test for medical admissions in India',
                'exam_type': 'entrance',
                'color': '#10B981',
                'is_featured': True,
                'duration_minutes': 200,
                'total_marks': 720,
                'negative_marking': True,
                'negative_marking_ratio': Decimal('0.25'),
            },
            {
                'name': 'JEE Main',
                'code': 'jee-main',
                'description': 'Joint Entrance Examination Main for engineering admissions',
                'exam_type': 'entrance',
                'color': '#3B82F6',
                'is_featured': True,
                'duration_minutes': 180,
                'total_marks': 300,
                'negative_marking': True,
                'negative_marking_ratio': Decimal('0.25'),
            },
            {
                'name': 'JEE Advanced',
                'code': 'jee-advanced',
                'description': 'Joint Entrance Examination Advanced for IIT admissions',
                'exam_type': 'entrance',
                'color': '#8B5CF6',
                'is_featured': True,
                'duration_minutes': 180,
                'total_marks': 360,
                'negative_marking': True,
                'negative_marking_ratio': Decimal('0.33'),
            },
            {
                'name': 'CBSE Class 12',
                'code': 'cbse-12',
                'description': 'Central Board of Secondary Education Class 12 Board Exam',
                'exam_type': 'board',
                'color': '#F59E0B',
                'is_featured': True,
                'duration_minutes': 180,
                'total_marks': 100,
                'negative_marking': False,
            },
            {
                'name': 'CBSE Class 11',
                'code': 'cbse-11',
                'description': 'Central Board of Secondary Education Class 11',
                'exam_type': 'board',
                'color': '#EC4899',
                'is_featured': False,
                'duration_minutes': 180,
                'total_marks': 100,
                'negative_marking': False,
            },
            {
                'name': 'NDA',
                'code': 'nda',
                'description': 'National Defence Academy entrance examination',
                'exam_type': 'competitive',
                'color': '#059669',
                'status': 'active',
                'duration_minutes': 150,
                'total_marks': 900,
                'negative_marking': True,
                'negative_marking_ratio': Decimal('0.33'),
            },
            {
                'name': 'CUET',
                'code': 'cuet',
                'description': 'Common University Entrance Test for UG admissions',
                'exam_type': 'entrance',
                'color': '#6366F1',
                'status': 'coming_soon',
                'duration_minutes': 195,
                'total_marks': 800,
                'negative_marking': True,
            },
        ]
        
        self.exams = {}
        for exam_data in exams_data:
            exam, created = Exam.objects.get_or_create(
                code=exam_data['code'],
                defaults=exam_data
            )
            self.exams[exam_data['code']] = exam
            if created:
                self.stdout.write(f'  ✓ Created exam: {exam.name}')

    def create_subjects(self):
        self.stdout.write('Creating subjects...')
        
        subjects_data = [
            # NEET/JEE subjects
            {'name': 'Physics', 'code': 'physics', 'color': '#3B82F6', 'icon': '⚡', 
             'exams': ['neet', 'jee-main', 'jee-advanced', 'cbse-12', 'cbse-11'], 'weightage': 25},
            {'name': 'Chemistry', 'code': 'chemistry', 'color': '#10B981', 'icon': '🧪',
             'exams': ['neet', 'jee-main', 'jee-advanced', 'cbse-12', 'cbse-11'], 'weightage': 25},
            {'name': 'Biology', 'code': 'biology', 'color': '#059669', 'icon': '🧬',
             'exams': ['neet', 'cbse-12', 'cbse-11'], 'weightage': 50},
            {'name': 'Mathematics', 'code': 'mathematics', 'color': '#8B5CF6', 'icon': '📐',
             'exams': ['jee-main', 'jee-advanced', 'cbse-12', 'cbse-11', 'nda'], 'weightage': 33},
            # Additional subjects
            {'name': 'English', 'code': 'english', 'color': '#EC4899', 'icon': '📚',
             'exams': ['cbse-12', 'cbse-11', 'nda', 'cuet'], 'weightage': 20},
            {'name': 'General Knowledge', 'code': 'gk', 'color': '#F59E0B', 'icon': '🌍',
             'exams': ['nda', 'cuet'], 'weightage': 25},
        ]
        
        self.subjects = {}
        for subj_data in subjects_data:
            exam_codes = subj_data.pop('exams')
            subject, created = Subject.objects.get_or_create(
                code=subj_data['code'],
                defaults=subj_data
            )
            # Add exam relationships
            for exam_code in exam_codes:
                if exam_code in self.exams:
                    subject.exams.add(self.exams[exam_code])
            self.subjects[subj_data['code']] = subject
            if created:
                self.stdout.write(f'  ✓ Created subject: {subject.name}')

    def create_topics(self):
        self.stdout.write('Creating topics...')
        
        topics_data = {
            'physics': [
                # Mechanics
                {'name': 'Units and Measurements', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Motion in a Straight Line', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Motion in a Plane', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Laws of Motion', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Work, Energy and Power', 'difficulty': 'medium', 'importance': 'critical', 'hours': 4},
                {'name': 'System of Particles & Rotational Motion', 'difficulty': 'hard', 'importance': 'high', 'hours': 6},
                {'name': 'Gravitation', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                # Thermodynamics
                {'name': 'Mechanical Properties of Solids', 'difficulty': 'medium', 'importance': 'medium', 'hours': 3},
                {'name': 'Mechanical Properties of Fluids', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Thermal Properties of Matter', 'difficulty': 'easy', 'importance': 'medium', 'hours': 3},
                {'name': 'Thermodynamics', 'difficulty': 'medium', 'importance': 'high', 'hours': 5},
                {'name': 'Kinetic Theory', 'difficulty': 'medium', 'importance': 'medium', 'hours': 3},
                # Waves & Oscillations
                {'name': 'Oscillations', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Waves', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                # Electromagnetism
                {'name': 'Electric Charges and Fields', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Electrostatic Potential and Capacitance', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Current Electricity', 'difficulty': 'medium', 'importance': 'critical', 'hours': 6},
                {'name': 'Moving Charges and Magnetism', 'difficulty': 'hard', 'importance': 'high', 'hours': 5},
                {'name': 'Magnetism and Matter', 'difficulty': 'medium', 'importance': 'medium', 'hours': 3},
                {'name': 'Electromagnetic Induction', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Alternating Current', 'difficulty': 'hard', 'importance': 'high', 'hours': 4},
                {'name': 'Electromagnetic Waves', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                # Optics
                {'name': 'Ray Optics and Optical Instruments', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Wave Optics', 'difficulty': 'hard', 'importance': 'high', 'hours': 4},
                # Modern Physics
                {'name': 'Dual Nature of Radiation and Matter', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Atoms', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Nuclei', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Semiconductor Electronics', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
            ],
            'chemistry': [
                # Physical Chemistry
                {'name': 'Some Basic Concepts of Chemistry', 'difficulty': 'easy', 'importance': 'high', 'hours': 3},
                {'name': 'Structure of Atom', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Classification of Elements', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Chemical Bonding and Molecular Structure', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'States of Matter', 'difficulty': 'medium', 'importance': 'medium', 'hours': 3},
                {'name': 'Thermodynamics', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Equilibrium', 'difficulty': 'hard', 'importance': 'critical', 'hours': 6},
                {'name': 'Redox Reactions', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Electrochemistry', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Chemical Kinetics', 'difficulty': 'medium', 'importance': 'critical', 'hours': 4},
                {'name': 'Surface Chemistry', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Solutions', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                # Inorganic Chemistry
                {'name': 'Hydrogen', 'difficulty': 'easy', 'importance': 'low', 'hours': 2},
                {'name': 's-Block Elements', 'difficulty': 'easy', 'importance': 'medium', 'hours': 3},
                {'name': 'p-Block Elements', 'difficulty': 'medium', 'importance': 'critical', 'hours': 6},
                {'name': 'd and f Block Elements', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Coordination Compounds', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                # Organic Chemistry
                {'name': 'Organic Chemistry - Basic Principles', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Hydrocarbons', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Haloalkanes and Haloarenes', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Alcohols, Phenols and Ethers', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Aldehydes, Ketones and Carboxylic Acids', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Amines', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Biomolecules', 'difficulty': 'easy', 'importance': 'high', 'hours': 3},
                {'name': 'Polymers', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Chemistry in Everyday Life', 'difficulty': 'easy', 'importance': 'low', 'hours': 2},
            ],
            'biology': [
                # Botany
                {'name': 'The Living World', 'difficulty': 'easy', 'importance': 'low', 'hours': 2},
                {'name': 'Biological Classification', 'difficulty': 'easy', 'importance': 'medium', 'hours': 3},
                {'name': 'Plant Kingdom', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Morphology of Flowering Plants', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Anatomy of Flowering Plants', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Cell: The Unit of Life', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Cell Cycle and Cell Division', 'difficulty': 'medium', 'importance': 'critical', 'hours': 4},
                {'name': 'Transport in Plants', 'difficulty': 'medium', 'importance': 'medium', 'hours': 3},
                {'name': 'Mineral Nutrition', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Photosynthesis in Higher Plants', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Respiration in Plants', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Plant Growth and Development', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                # Zoology
                {'name': 'Animal Kingdom', 'difficulty': 'medium', 'importance': 'high', 'hours': 5},
                {'name': 'Structural Organisation in Animals', 'difficulty': 'medium', 'importance': 'medium', 'hours': 3},
                {'name': 'Digestion and Absorption', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Breathing and Exchange of Gases', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Body Fluids and Circulation', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Excretory Products and their Elimination', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Locomotion and Movement', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Neural Control and Coordination', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Chemical Coordination and Integration', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                # Genetics & Evolution
                {'name': 'Reproduction in Organisms', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Sexual Reproduction in Flowering Plants', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Human Reproduction', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Reproductive Health', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Principles of Inheritance and Variation', 'difficulty': 'hard', 'importance': 'critical', 'hours': 6},
                {'name': 'Molecular Basis of Inheritance', 'difficulty': 'hard', 'importance': 'critical', 'hours': 6},
                {'name': 'Evolution', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                # Ecology & Environment
                {'name': 'Human Health and Disease', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Microbes in Human Welfare', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Biotechnology: Principles and Processes', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Biotechnology and its Applications', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Organisms and Populations', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Ecosystem', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Biodiversity and Conservation', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Environmental Issues', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
            ],
            'mathematics': [
                {'name': 'Sets', 'difficulty': 'easy', 'importance': 'medium', 'hours': 2},
                {'name': 'Relations and Functions', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Trigonometric Functions', 'difficulty': 'medium', 'importance': 'high', 'hours': 5},
                {'name': 'Complex Numbers', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Quadratic Equations', 'difficulty': 'medium', 'importance': 'critical', 'hours': 4},
                {'name': 'Permutations and Combinations', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Binomial Theorem', 'difficulty': 'medium', 'importance': 'high', 'hours': 3},
                {'name': 'Sequences and Series', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Straight Lines', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Conic Sections', 'difficulty': 'hard', 'importance': 'critical', 'hours': 6},
                {'name': '3D Geometry', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Limits and Derivatives', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Continuity and Differentiability', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Applications of Derivatives', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Integrals', 'difficulty': 'hard', 'importance': 'critical', 'hours': 6},
                {'name': 'Applications of Integrals', 'difficulty': 'hard', 'importance': 'high', 'hours': 4},
                {'name': 'Differential Equations', 'difficulty': 'hard', 'importance': 'critical', 'hours': 5},
                {'name': 'Vector Algebra', 'difficulty': 'medium', 'importance': 'high', 'hours': 4},
                {'name': 'Probability', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
                {'name': 'Statistics', 'difficulty': 'medium', 'importance': 'medium', 'hours': 3},
                {'name': 'Matrices and Determinants', 'difficulty': 'medium', 'importance': 'critical', 'hours': 5},
            ],
        }
        
        self.topics = {}
        order = 0
        for subj_code, topics in topics_data.items():
            if subj_code not in self.subjects:
                continue
            subject = self.subjects[subj_code]
            for topic_data in topics:
                order += 1
                topic, created = Topic.objects.get_or_create(
                    code=slugify(f"{subj_code}-{topic_data['name']}"),
                    defaults={
                        'name': topic_data['name'],
                        'subject': subject,
                        'difficulty': topic_data['difficulty'],
                        'importance': topic_data['importance'],
                        'estimated_study_hours': topic_data['hours'],
                        'order': order,
                    }
                )
                # Add to relevant exams
                for exam in subject.exams.all():
                    TopicExamRelevance.objects.get_or_create(
                        topic=topic,
                        exam=exam,
                        defaults={
                            'importance': topic_data['importance'],
                            'average_questions': random.randint(1, 5),
                        }
                    )
                self.topics[topic.code] = topic
        
        self.stdout.write(f'  ✓ Created {len(self.topics)} topics')

    def create_badges(self):
        self.stdout.write('Creating badges...')
        
        badges_data = [
            # Streak badges
            {'name': 'First Steps', 'description': 'Complete your first study session', 'category': 'streak', 
             'rarity': 'common', 'icon': '🌟', 'color': '#FFD700', 'xp_reward': 50, 'requirements': {'streak_days': 1}},
            {'name': 'Week Warrior', 'description': 'Maintain a 7-day study streak', 'category': 'streak',
             'rarity': 'uncommon', 'icon': '🔥', 'color': '#FF6B35', 'xp_reward': 200, 'requirements': {'streak_days': 7}},
            {'name': 'Fortnight Fighter', 'description': 'Maintain a 14-day study streak', 'category': 'streak',
             'rarity': 'rare', 'icon': '⚡', 'color': '#8B5CF6', 'xp_reward': 500, 'requirements': {'streak_days': 14}},
            {'name': 'Month Master', 'description': 'Maintain a 30-day study streak', 'category': 'streak',
             'rarity': 'epic', 'icon': '👑', 'color': '#F59E0B', 'xp_reward': 1000, 'requirements': {'streak_days': 30}},
            {'name': 'Century Champion', 'description': 'Maintain a 100-day study streak', 'category': 'streak',
             'rarity': 'legendary', 'icon': '🏆', 'color': '#10B981', 'xp_reward': 5000, 'requirements': {'streak_days': 100}},
            
            # Quiz badges
            {'name': 'Quiz Starter', 'description': 'Complete your first quiz', 'category': 'quiz',
             'rarity': 'common', 'icon': '📝', 'color': '#3B82F6', 'xp_reward': 50, 'requirements': {'quizzes_completed': 1}},
            {'name': 'Quiz Explorer', 'description': 'Complete 10 quizzes', 'category': 'quiz',
             'rarity': 'uncommon', 'icon': '🎯', 'color': '#06B6D4', 'xp_reward': 200, 'requirements': {'quizzes_completed': 10}},
            {'name': 'Quiz Champion', 'description': 'Complete 50 quizzes', 'category': 'quiz',
             'rarity': 'rare', 'icon': '🏅', 'color': '#8B5CF6', 'xp_reward': 500, 'requirements': {'quizzes_completed': 50}},
            {'name': 'Quiz Legend', 'description': 'Complete 100 quizzes', 'category': 'quiz',
             'rarity': 'epic', 'icon': '🎖️', 'color': '#F59E0B', 'xp_reward': 1000, 'requirements': {'quizzes_completed': 100}},
            {'name': 'Perfect Score', 'description': 'Score 100% in any quiz', 'category': 'quiz',
             'rarity': 'rare', 'icon': '💯', 'color': '#10B981', 'xp_reward': 300, 'requirements': {'perfect_quiz': 1}},
            {'name': 'Speed Demon', 'description': 'Complete a quiz in under 5 minutes with 80%+ accuracy', 'category': 'quiz',
             'rarity': 'rare', 'icon': '⚡', 'color': '#EF4444', 'xp_reward': 300, 'requirements': {'speed_quiz': 1}},
            
            # Mastery badges
            {'name': 'Topic Beginner', 'description': 'Master your first topic', 'category': 'mastery',
             'rarity': 'common', 'icon': '📖', 'color': '#10B981', 'xp_reward': 100, 'requirements': {'topics_mastered': 1}},
            {'name': 'Subject Scholar', 'description': 'Master 10 topics in a subject', 'category': 'mastery',
             'rarity': 'rare', 'icon': '📚', 'color': '#6366F1', 'xp_reward': 500, 'requirements': {'topics_mastered': 10}},
            {'name': 'Physics Prodigy', 'description': 'Master all Physics topics', 'category': 'mastery',
             'rarity': 'epic', 'icon': '⚛️', 'color': '#3B82F6', 'xp_reward': 2000, 'requirements': {'physics_mastery': 100}},
            {'name': 'Chemistry Wizard', 'description': 'Master all Chemistry topics', 'category': 'mastery',
             'rarity': 'epic', 'icon': '🧪', 'color': '#10B981', 'xp_reward': 2000, 'requirements': {'chemistry_mastery': 100}},
            {'name': 'Biology Expert', 'description': 'Master all Biology topics', 'category': 'mastery',
             'rarity': 'epic', 'icon': '🧬', 'color': '#059669', 'xp_reward': 2000, 'requirements': {'biology_mastery': 100}},
            
            # Milestone badges
            {'name': 'Question Hunter', 'description': 'Answer 100 questions', 'category': 'milestone',
             'rarity': 'uncommon', 'icon': '🎯', 'color': '#F97316', 'xp_reward': 200, 'requirements': {'questions_answered': 100}},
            {'name': 'Question Master', 'description': 'Answer 500 questions', 'category': 'milestone',
             'rarity': 'rare', 'icon': '🏹', 'color': '#8B5CF6', 'xp_reward': 500, 'requirements': {'questions_answered': 500}},
            {'name': 'Question God', 'description': 'Answer 1000 questions', 'category': 'milestone',
             'rarity': 'epic', 'icon': '⚔️', 'color': '#EC4899', 'xp_reward': 1000, 'requirements': {'questions_answered': 1000}},
            {'name': 'Mock Test Warrior', 'description': 'Complete 5 mock tests', 'category': 'milestone',
             'rarity': 'rare', 'icon': '📋', 'color': '#14B8A6', 'xp_reward': 500, 'requirements': {'mock_tests_completed': 5}},
            {'name': 'XP Collector', 'description': 'Earn 5000 XP', 'category': 'milestone',
             'rarity': 'rare', 'icon': '✨', 'color': '#FBBF24', 'xp_reward': 500, 'requirements': {'total_xp': 5000}},
            
            # Special badges
            {'name': 'Early Bird', 'description': 'Study before 6 AM', 'category': 'special',
             'rarity': 'uncommon', 'icon': '🌅', 'color': '#F59E0B', 'xp_reward': 100, 'requirements': {'early_study': 1}},
            {'name': 'Night Owl', 'description': 'Study after 11 PM', 'category': 'special',
             'rarity': 'uncommon', 'icon': '🦉', 'color': '#6366F1', 'xp_reward': 100, 'requirements': {'night_study': 1}},
            {'name': 'Weekend Warrior', 'description': 'Study on both Saturday and Sunday', 'category': 'special',
             'rarity': 'uncommon', 'icon': '🎮', 'color': '#EC4899', 'xp_reward': 150, 'requirements': {'weekend_study': 1}},
            {'name': 'Comeback King', 'description': 'Return after 7 days and complete a quiz', 'category': 'special',
             'rarity': 'rare', 'icon': '🔄', 'color': '#10B981', 'xp_reward': 200, 'requirements': {'comeback': 1}},
            {'name': 'Top 10', 'description': 'Reach top 10 in any leaderboard', 'category': 'special',
             'rarity': 'epic', 'icon': '🏆', 'color': '#FFD700', 'xp_reward': 1000, 'requirements': {'top_10': 1}},
        ]
        
        self.badges = {}
        for badge_data in badges_data:
            badge, created = Badge.objects.get_or_create(
                name=badge_data['name'],
                defaults=badge_data
            )
            self.badges[badge.name] = badge
        
        self.stdout.write(f'  ✓ Created {len(self.badges)} badges')

    def create_questions(self):
        self.stdout.write('Creating questions...')
        
        # Physics questions
        physics_questions = [
            # Laws of Motion
            {
                'topic': 'physics-laws-of-motion',
                'question_text': 'A block of mass 2 kg is placed on a frictionless horizontal surface. A force of 10 N is applied horizontally. What is the acceleration of the block?',
                'options': ['2 m/s²', '5 m/s²', '10 m/s²', '20 m/s²'],
                'correct': '1',
                'explanation': 'Using Newton\'s second law: F = ma, so a = F/m = 10/2 = 5 m/s²',
                'difficulty': 'easy',
            },
            {
                'topic': 'physics-laws-of-motion',
                'question_text': 'The coefficient of friction between a block and surface is 0.5. If the block weighs 100 N, what is the maximum static friction force?',
                'options': ['25 N', '50 N', '100 N', '200 N'],
                'correct': '1',
                'explanation': 'Maximum static friction = μN = 0.5 × 100 = 50 N',
                'difficulty': 'medium',
            },
            {
                'topic': 'physics-laws-of-motion',
                'question_text': 'A rocket of mass 1000 kg is ejecting gas at 2000 m/s. If the thrust required is 50000 N, what is the rate of mass ejection?',
                'options': ['10 kg/s', '25 kg/s', '50 kg/s', '100 kg/s'],
                'correct': '1',
                'explanation': 'Thrust = v × (dm/dt), so dm/dt = 50000/2000 = 25 kg/s',
                'difficulty': 'hard',
            },
            # Work, Energy and Power
            {
                'topic': 'physics-work-energy-and-power',
                'question_text': 'A 5 kg object is lifted to a height of 10 m. What is the potential energy gained? (g = 10 m/s²)',
                'options': ['50 J', '100 J', '250 J', '500 J'],
                'correct': '3',
                'explanation': 'PE = mgh = 5 × 10 × 10 = 500 J',
                'difficulty': 'easy',
            },
            {
                'topic': 'physics-work-energy-and-power',
                'question_text': 'A spring with spring constant 200 N/m is compressed by 0.1 m. What is the elastic potential energy stored?',
                'options': ['0.5 J', '1 J', '2 J', '10 J'],
                'correct': '1',
                'explanation': 'PE = ½kx² = ½ × 200 × (0.1)² = 1 J',
                'difficulty': 'medium',
            },
            # Current Electricity
            {
                'topic': 'physics-current-electricity',
                'question_text': 'Three resistors of 3Ω, 6Ω and 9Ω are connected in parallel. What is the equivalent resistance?',
                'options': ['1.64 Ω', '2 Ω', '6 Ω', '18 Ω'],
                'correct': '0',
                'explanation': '1/R = 1/3 + 1/6 + 1/9 = 6/18 + 3/18 + 2/18 = 11/18, so R = 18/11 ≈ 1.64 Ω',
                'difficulty': 'medium',
            },
            {
                'topic': 'physics-current-electricity',
                'question_text': 'The power dissipated in a 10Ω resistor carrying 2A current is:',
                'options': ['5 W', '20 W', '40 W', '80 W'],
                'correct': '2',
                'explanation': 'P = I²R = 2² × 10 = 40 W',
                'difficulty': 'easy',
            },
            # Optics
            {
                'topic': 'physics-ray-optics-and-optical-instruments',
                'question_text': 'An object is placed at 20 cm from a convex lens of focal length 10 cm. Where is the image formed?',
                'options': ['10 cm', '20 cm', '30 cm', '40 cm'],
                'correct': '1',
                'explanation': 'Using 1/f = 1/v - 1/u: 1/10 = 1/v - 1/(-20), solving gives v = 20 cm',
                'difficulty': 'medium',
            },
            {
                'topic': 'physics-wave-optics',
                'question_text': 'In Young\'s double slit experiment, the fringe width is 0.5 mm. If the distance between slits is halved, the new fringe width will be:',
                'options': ['0.25 mm', '0.5 mm', '1.0 mm', '2.0 mm'],
                'correct': '2',
                'explanation': 'Fringe width β = λD/d. If d is halved, β doubles. New β = 1.0 mm',
                'difficulty': 'hard',
            },
            # Modern Physics
            {
                'topic': 'physics-dual-nature-of-radiation-and-matter',
                'question_text': 'The work function of a metal is 4 eV. If light of energy 6 eV falls on it, the maximum kinetic energy of photoelectrons is:',
                'options': ['2 eV', '4 eV', '6 eV', '10 eV'],
                'correct': '0',
                'explanation': 'KE_max = hν - φ = 6 - 4 = 2 eV',
                'difficulty': 'easy',
            },
        ]
        
        # Chemistry questions
        chemistry_questions = [
            # Atomic Structure
            {
                'topic': 'chemistry-structure-of-atom',
                'question_text': 'The number of electrons in the outermost shell of an atom with atomic number 17 is:',
                'options': ['2', '5', '7', '8'],
                'correct': '2',
                'explanation': 'Cl (Z=17) has electronic configuration 2,8,7. So outermost shell has 7 electrons.',
                'difficulty': 'easy',
            },
            {
                'topic': 'chemistry-structure-of-atom',
                'question_text': 'The de Broglie wavelength of an electron accelerated through 100V is approximately:',
                'options': ['1.23 Å', '12.3 Å', '0.123 Å', '123 Å'],
                'correct': '0',
                'explanation': 'λ = h/√(2meV) = 12.27/√V Å = 12.27/10 = 1.227 ≈ 1.23 Å',
                'difficulty': 'hard',
            },
            # Chemical Bonding
            {
                'topic': 'chemistry-chemical-bonding-and-molecular-structure',
                'question_text': 'The hybridization of carbon in CO₂ is:',
                'options': ['sp', 'sp²', 'sp³', 'dsp²'],
                'correct': '0',
                'explanation': 'In CO₂, carbon forms two double bonds with oxygen atoms. The geometry is linear, requiring sp hybridization.',
                'difficulty': 'easy',
            },
            {
                'topic': 'chemistry-chemical-bonding-and-molecular-structure',
                'question_text': 'The bond angle in NH₃ is less than 109.5° because:',
                'options': ['Presence of lone pair', 'Electronegativity of N', 'Small size of H', 'Triple bond'],
                'correct': '0',
                'explanation': 'The lone pair on nitrogen repels the bonding pairs more, reducing the bond angle to about 107°.',
                'difficulty': 'medium',
            },
            # Electrochemistry
            {
                'topic': 'chemistry-electrochemistry',
                'question_text': 'The standard electrode potential of Zn²⁺/Zn is -0.76V and Cu²⁺/Cu is +0.34V. The EMF of the cell Zn|Zn²⁺||Cu²⁺|Cu is:',
                'options': ['0.42 V', '1.10 V', '-1.10 V', '-0.42 V'],
                'correct': '1',
                'explanation': 'E°cell = E°cathode - E°anode = 0.34 - (-0.76) = 1.10 V',
                'difficulty': 'medium',
            },
            # Organic Chemistry
            {
                'topic': 'chemistry-organic-chemistry-basic-principles',
                'question_text': 'The IUPAC name of CH₃-CH(CH₃)-CH₂-CH₃ is:',
                'options': ['2-methylbutane', 'Isopentane', 'Neopentane', 'n-pentane'],
                'correct': '0',
                'explanation': 'The longest chain has 4 carbons with a methyl group at position 2, making it 2-methylbutane.',
                'difficulty': 'easy',
            },
            {
                'topic': 'chemistry-aldehydes-ketones-and-carboxylic-acids',
                'question_text': 'Which reagent is used to distinguish between aldehydes and ketones?',
                'options': ['Tollens\' reagent', 'Na metal', 'PCl₅', 'Conc. H₂SO₄'],
                'correct': '0',
                'explanation': 'Tollens\' reagent (ammoniacal AgNO₃) gives silver mirror with aldehydes but not with ketones.',
                'difficulty': 'easy',
            },
            # p-Block Elements
            {
                'topic': 'chemistry-p-block-elements',
                'question_text': 'The element showing maximum oxidation state among halogens is:',
                'options': ['F', 'Cl', 'Br', 'I'],
                'correct': '3',
                'explanation': 'Iodine shows maximum oxidation state (+7) due to availability of d-orbitals and lower electronegativity.',
                'difficulty': 'medium',
            },
        ]
        
        # Biology questions  
        biology_questions = [
            # Cell Biology
            {
                'topic': 'biology-cell-the-unit-of-life',
                'question_text': 'Which organelle is called the "powerhouse of the cell"?',
                'options': ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'],
                'correct': '1',
                'explanation': 'Mitochondria produce ATP through cellular respiration, providing energy for cell activities.',
                'difficulty': 'easy',
            },
            {
                'topic': 'biology-cell-the-unit-of-life',
                'question_text': 'The fluid mosaic model of plasma membrane was proposed by:',
                'options': ['Watson and Crick', 'Singer and Nicolson', 'Schleiden and Schwann', 'Robert Brown'],
                'correct': '1',
                'explanation': 'Singer and Nicolson proposed the fluid mosaic model in 1972.',
                'difficulty': 'medium',
            },
            # Cell Division
            {
                'topic': 'biology-cell-cycle-and-cell-division',
                'question_text': 'During which phase of mitosis do chromosomes align at the cell equator?',
                'options': ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'],
                'correct': '1',
                'explanation': 'During metaphase, chromosomes align at the metaphase plate (equator) of the cell.',
                'difficulty': 'easy',
            },
            {
                'topic': 'biology-cell-cycle-and-cell-division',
                'question_text': 'The number of chromosomes in a human cell after meiosis I is:',
                'options': ['46', '23', '92', '12'],
                'correct': '1',
                'explanation': 'Meiosis I is reductional division, reducing chromosome number from 46 to 23.',
                'difficulty': 'medium',
            },
            # Genetics
            {
                'topic': 'biology-principles-of-inheritance-and-variation',
                'question_text': 'A cross between two heterozygous individuals (Aa × Aa) gives a phenotypic ratio of:',
                'options': ['1:2:1', '3:1', '1:1', '9:3:3:1'],
                'correct': '1',
                'explanation': 'Monohybrid cross Aa × Aa gives 3 dominant : 1 recessive phenotypic ratio.',
                'difficulty': 'easy',
            },
            {
                'topic': 'biology-molecular-basis-of-inheritance',
                'question_text': 'The process of copying genetic information from DNA to mRNA is called:',
                'options': ['Replication', 'Transcription', 'Translation', 'Transduction'],
                'correct': '1',
                'explanation': 'Transcription is the process of synthesizing mRNA from a DNA template.',
                'difficulty': 'easy',
            },
            {
                'topic': 'biology-molecular-basis-of-inheritance',
                'question_text': 'If the sequence of one strand of DNA is 5\'-ATGCATGC-3\', the complementary strand will be:',
                'options': ['5\'-ATGCATGC-3\'', '5\'-TACGTACG-3\'', '3\'-TACGTACG-5\'', '5\'-GCATGCAT-3\''],
                'correct': '2',
                'explanation': 'DNA strands are antiparallel. A pairs with T, G pairs with C.',
                'difficulty': 'medium',
            },
            # Human Physiology
            {
                'topic': 'biology-digestion-and-absorption',
                'question_text': 'Which enzyme initiates protein digestion in the stomach?',
                'options': ['Trypsin', 'Pepsin', 'Amylase', 'Lipase'],
                'correct': '1',
                'explanation': 'Pepsin, activated from pepsinogen by HCl, initiates protein digestion in the stomach.',
                'difficulty': 'easy',
            },
            {
                'topic': 'biology-breathing-and-exchange-of-gases',
                'question_text': 'The oxygen-carrying capacity of blood is mainly due to:',
                'options': ['Plasma proteins', 'Hemoglobin', 'White blood cells', 'Platelets'],
                'correct': '1',
                'explanation': 'Hemoglobin in RBCs binds oxygen to form oxyhemoglobin for transport.',
                'difficulty': 'easy',
            },
            {
                'topic': 'biology-human-reproduction',
                'question_text': 'Fertilization in humans normally occurs in the:',
                'options': ['Uterus', 'Vagina', 'Fallopian tube', 'Ovary'],
                'correct': '2',
                'explanation': 'Fertilization typically occurs in the ampullary region of the fallopian tube.',
                'difficulty': 'easy',
            },
            # Ecology
            {
                'topic': 'biology-ecosystem',
                'question_text': 'The 10% law of energy transfer was proposed by:',
                'options': ['Odum', 'Lindeman', 'Elton', 'Tansley'],
                'correct': '1',
                'explanation': 'Lindeman (1942) proposed that only 10% of energy is transferred between trophic levels.',
                'difficulty': 'medium',
            },
        ]
        
        all_questions = physics_questions + chemistry_questions + biology_questions
        question_count = 0
        
        for q_data in all_questions:
            topic_code = q_data['topic']
            if topic_code not in self.topics:
                continue
            
            topic = self.topics[topic_code]
            subject = topic.subject
            
            question, created = Question.objects.get_or_create(
                question_text=q_data['question_text'],
                defaults={
                    'topic': topic,
                    'subject': subject,
                    'question_type': 'mcq',
                    'difficulty': q_data['difficulty'],
                    'status': 'published',
                    'correct_answer': q_data['correct'],
                    'explanation': q_data['explanation'],
                    'marks': Decimal('4.0'),
                    'negative_marks': Decimal('1.0'),
                }
            )
            
            if created:
                # Add to exams
                for exam in subject.exams.all():
                    question.exams.add(exam)
                
                # Create options
                for i, opt_text in enumerate(q_data['options']):
                    QuestionOption.objects.create(
                        question=question,
                        option_text=opt_text,
                        is_correct=(str(i) == q_data['correct']),
                        order=i
                    )
                question_count += 1
        
        self.stdout.write(f'  ✓ Created {question_count} questions with options')

    def create_content(self):
        self.stdout.write('Creating content...')
        
        content_count = 0
        for topic_code, topic in list(self.topics.items())[:30]:  # Create content for first 30 topics
            subject = topic.subject
            
            # Create notes
            notes, created = Content.objects.get_or_create(
                slug=f"{topic_code}-notes",
                defaults={
                    'title': f'{topic.name} - Complete Notes',
                    'description': f'Comprehensive study notes covering all concepts of {topic.name}',
                    'content_type': 'notes',
                    'topic': topic,
                    'subject': subject,
                    'difficulty': topic.difficulty,
                    'status': 'published',
                    'is_free': True,
                    'estimated_time_minutes': int(topic.estimated_study_hours * 30),
                    'content_html': f'''
                    <h1>{topic.name}</h1>
                    <h2>Introduction</h2>
                    <p>This chapter covers the fundamental concepts of {topic.name}.</p>
                    <h2>Key Concepts</h2>
                    <ul>
                        <li>Important concept 1 with detailed explanation</li>
                        <li>Important concept 2 with examples</li>
                        <li>Important concept 3 with applications</li>
                    </ul>
                    <h2>Formulas & Equations</h2>
                    <p>Key formulas to remember for {topic.name}</p>
                    <h2>Solved Examples</h2>
                    <p>Practice problems with step-by-step solutions</p>
                    <h2>Summary</h2>
                    <p>Quick revision points for {topic.name}</p>
                    ''',
                    'author_name': 'DailyTaiyari Expert',
                    'order': content_count,
                }
            )
            if created:
                for exam in subject.exams.all():
                    notes.exams.add(exam)
                content_count += 1
            
            # Create video content
            video, created = Content.objects.get_or_create(
                slug=f"{topic_code}-video",
                defaults={
                    'title': f'{topic.name} - Video Lecture',
                    'description': f'Detailed video explanation of {topic.name} with examples',
                    'content_type': 'video',
                    'topic': topic,
                    'subject': subject,
                    'difficulty': topic.difficulty,
                    'status': 'published',
                    'is_free': random.choice([True, False]),
                    'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',  # Placeholder
                    'video_duration_minutes': random.randint(15, 45),
                    'estimated_time_minutes': random.randint(20, 50),
                    'author_name': 'DailyTaiyari Faculty',
                    'order': content_count,
                }
            )
            if created:
                for exam in subject.exams.all():
                    video.exams.add(exam)
                content_count += 1
            
            # Create revision notes for important topics
            if topic.importance in ['high', 'critical']:
                revision, created = Content.objects.get_or_create(
                    slug=f"{topic_code}-revision",
                    defaults={
                        'title': f'{topic.name} - Quick Revision',
                        'description': f'Quick revision notes for {topic.name} with all formulas',
                        'content_type': 'revision',
                        'topic': topic,
                        'subject': subject,
                        'difficulty': 'intermediate',
                        'status': 'published',
                        'is_free': True,
                        'estimated_time_minutes': 10,
                        'content_html': f'<h1>Quick Revision: {topic.name}</h1><p>Key points and formulas...</p>',
                        'author_name': 'DailyTaiyari Expert',
                        'order': content_count,
                    }
                )
                if created:
                    for exam in subject.exams.all():
                        revision.exams.add(exam)
                    content_count += 1
        
        self.stdout.write(f'  ✓ Created {content_count} content items')

    def create_quizzes(self):
        self.stdout.write('Creating quizzes...')
        
        quiz_count = 0
        
        # Create topic-wise quizzes
        for topic_code, topic in list(self.topics.items())[:20]:
            questions = Question.objects.filter(topic=topic, status='published')[:10]
            if not questions.exists():
                continue
            
            exam = topic.subject.exams.first()
            if not exam:
                continue
            
            quiz, created = Quiz.objects.get_or_create(
                title=f'{topic.name} Quiz',
                exam=exam,
                defaults={
                    'description': f'Test your knowledge of {topic.name}',
                    'quiz_type': 'topic',
                    'status': 'published',
                    'subject': topic.subject,
                    'topic': topic,
                    'duration_minutes': 15,
                    'total_marks': questions.count() * 4,
                    'passing_marks': questions.count() * 2,
                    'is_free': True,
                    'shuffle_questions': True,
                    'shuffle_options': True,
                }
            )
            
            if created:
                for i, question in enumerate(questions):
                    QuizQuestion.objects.create(quiz=quiz, question=question, order=i)
                quiz_count += 1
        
        # Create subject-wise quizzes
        for subj_code, subject in self.subjects.items():
            questions = Question.objects.filter(subject=subject, status='published')[:20]
            if not questions.exists():
                continue
            
            exam = subject.exams.first()
            if not exam:
                continue
            
            quiz, created = Quiz.objects.get_or_create(
                title=f'{subject.name} - Mixed Quiz',
                exam=exam,
                defaults={
                    'description': f'Practice quiz covering various topics in {subject.name}',
                    'quiz_type': 'subject',
                    'status': 'published',
                    'subject': subject,
                    'duration_minutes': 30,
                    'total_marks': questions.count() * 4,
                    'passing_marks': questions.count() * 2,
                    'is_free': True,
                }
            )
            
            if created:
                for i, question in enumerate(questions):
                    QuizQuestion.objects.create(quiz=quiz, question=question, order=i)
                quiz_count += 1
        
        # Create daily challenge quizzes
        today = date.today()
        for i in range(7):
            challenge_date = today - timedelta(days=i)
            exam = self.exams.get('neet')
            if not exam:
                continue
            
            questions = Question.objects.filter(exams=exam, status='published').order_by('?')[:10]
            
            quiz, created = Quiz.objects.get_or_create(
                title=f'Daily Challenge - {challenge_date.strftime("%b %d")}',
                challenge_date=challenge_date,
                defaults={
                    'description': f'Daily challenge quiz for {challenge_date.strftime("%B %d, %Y")}',
                    'quiz_type': 'daily',
                    'status': 'published',
                    'exam': exam,
                    'duration_minutes': 10,
                    'total_marks': 40,
                    'is_free': True,
                    'is_daily_challenge': True,
                }
            )
            
            if created:
                for j, question in enumerate(questions):
                    QuizQuestion.objects.create(quiz=quiz, question=question, order=j)
                quiz_count += 1
        
        self.stdout.write(f'  ✓ Created {quiz_count} quizzes')

    def create_mock_tests(self):
        self.stdout.write('Creating mock tests...')
        
        mock_count = 0
        
        # NEET Mock Tests
        neet = self.exams.get('neet')
        if neet:
            for i in range(5):
                questions = Question.objects.filter(exams=neet, status='published').order_by('?')[:45]
                
                mock, created = MockTest.objects.get_or_create(
                    title=f'NEET Mock Test {i+1}',
                    exam=neet,
                    defaults={
                        'description': f'Full-length NEET mock test #{i+1} with 45 questions',
                        'duration_minutes': 60,
                        'total_marks': Decimal('180'),
                        'negative_marking': True,
                        'status': 'published',
                        'is_free': i < 2,  # First 2 are free
                        'sections': [
                            {'name': 'Physics', 'questions': 15, 'marks': 60},
                            {'name': 'Chemistry', 'questions': 15, 'marks': 60},
                            {'name': 'Biology', 'questions': 15, 'marks': 60},
                        ]
                    }
                )
                
                if created:
                    for j, question in enumerate(questions):
                        section = j // 15  # 0, 1, or 2
                        MockTestQuestion.objects.create(
                            mock_test=mock, 
                            question=question, 
                            order=j,
                            section=section
                        )
                    mock_count += 1
        
        # JEE Mock Tests
        jee = self.exams.get('jee-main')
        if jee:
            for i in range(3):
                questions = Question.objects.filter(exams=jee, status='published').order_by('?')[:30]
                
                mock, created = MockTest.objects.get_or_create(
                    title=f'JEE Main Mock Test {i+1}',
                    exam=jee,
                    defaults={
                        'description': f'Full-length JEE Main mock test #{i+1}',
                        'duration_minutes': 90,
                        'total_marks': Decimal('300'),
                        'negative_marking': True,
                        'status': 'published',
                        'is_free': i == 0,
                        'sections': [
                            {'name': 'Physics', 'questions': 10, 'marks': 100},
                            {'name': 'Chemistry', 'questions': 10, 'marks': 100},
                            {'name': 'Mathematics', 'questions': 10, 'marks': 100},
                        ]
                    }
                )
                
                if created:
                    for j, question in enumerate(questions):
                        MockTestQuestion.objects.create(
                            mock_test=mock, 
                            question=question, 
                            order=j,
                            section=j // 10
                        )
                    mock_count += 1
        
        self.stdout.write(f'  ✓ Created {mock_count} mock tests')

    def create_sample_users(self):
        self.stdout.write('Creating sample users...')
        
        users_data = [
            {'email': 'rahul.kumar@example.com', 'first_name': 'Rahul', 'last_name': 'Kumar', 
             'grade': '12', 'city': 'Delhi', 'xp': 5200, 'level': 8},
            {'email': 'priya.sharma@example.com', 'first_name': 'Priya', 'last_name': 'Sharma',
             'grade': '12', 'city': 'Mumbai', 'xp': 7800, 'level': 12},
            {'email': 'amit.singh@example.com', 'first_name': 'Amit', 'last_name': 'Singh',
             'grade': '11', 'city': 'Bangalore', 'xp': 3400, 'level': 5},
            {'email': 'neha.patel@example.com', 'first_name': 'Neha', 'last_name': 'Patel',
             'grade': '12', 'city': 'Pune', 'xp': 9200, 'level': 15},
            {'email': 'vikram.verma@example.com', 'first_name': 'Vikram', 'last_name': 'Verma',
             'grade': '12', 'city': 'Chennai', 'xp': 4100, 'level': 6},
            {'email': 'anjali.gupta@example.com', 'first_name': 'Anjali', 'last_name': 'Gupta',
             'grade': '11', 'city': 'Kolkata', 'xp': 6500, 'level': 10},
            {'email': 'raj.malhotra@example.com', 'first_name': 'Raj', 'last_name': 'Malhotra',
             'grade': '12', 'city': 'Hyderabad', 'xp': 8100, 'level': 13},
            {'email': 'sanya.reddy@example.com', 'first_name': 'Sanya', 'last_name': 'Reddy',
             'grade': '12', 'city': 'Jaipur', 'xp': 2800, 'level': 4},
            {'email': 'arjun.nair@example.com', 'first_name': 'Arjun', 'last_name': 'Nair',
             'grade': '11', 'city': 'Kochi', 'xp': 5900, 'level': 9},
            {'email': 'ishita.joshi@example.com', 'first_name': 'Ishita', 'last_name': 'Joshi',
             'grade': '12', 'city': 'Lucknow', 'xp': 11000, 'level': 18},
        ]
        
        self.sample_users = []
        
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_onboarded': True,
                    'onboarded_at': timezone.now() - timedelta(days=random.randint(10, 60)),
                }
            )
            
            if created:
                user.set_password('test123')
                user.save()
            
            profile, _ = StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'grade': user_data['grade'],
                    'city': user_data['city'],
                    'primary_exam': self.exams.get('neet'),
                    'total_xp': user_data['xp'],
                    'current_level': user_data['level'],
                    'daily_study_goal_minutes': random.choice([30, 60, 90, 120]),
                    'total_questions_attempted': random.randint(100, 500),
                    'total_correct_answers': random.randint(50, 300),
                    'total_study_time_minutes': random.randint(500, 3000),
                }
            )
            
            # Enroll in exams
            for exam_code in ['neet', 'cbse-12']:
                exam = self.exams.get(exam_code)
                if exam:
                    ExamEnrollment.objects.get_or_create(
                        student=profile,
                        exam=exam,
                        defaults={'is_active': True}
                    )
            
            self.sample_users.append(profile)
        
        # Also update the main user's profile
        try:
            main_user = User.objects.get(email='balbir.ms24@gmail.com')
            profile, _ = StudentProfile.objects.get_or_create(
                user=main_user,
                defaults={
                    'grade': '12',
                    'city': 'Delhi',
                    'primary_exam': self.exams.get('neet'),
                    'total_xp': 1500,
                    'current_level': 3,
                    'daily_study_goal_minutes': 60,
                }
            )
            main_user.is_onboarded = True
            main_user.save()
            
            for exam_code in ['neet', 'jee-main', 'cbse-12']:
                exam = self.exams.get(exam_code)
                if exam:
                    ExamEnrollment.objects.get_or_create(
                        student=profile,
                        exam=exam,
                        defaults={'is_active': True}
                    )
            
            self.sample_users.append(profile)
        except User.DoesNotExist:
            pass
        
        self.stdout.write(f'  ✓ Created {len(users_data)} sample users')

    def create_challenges(self):
        self.stdout.write('Creating challenges...')
        
        now = timezone.now()
        
        challenges_data = [
            {
                'title': 'Weekend Physics Sprint',
                'description': 'Complete 50 physics questions this weekend with 70%+ accuracy',
                'challenge_type': 'weekly',
                'status': 'active',
                'start_time': now - timedelta(days=2),
                'end_time': now + timedelta(days=5),
                'goal': {'questions': 50, 'subject': 'physics', 'accuracy': 70},
                'xp_reward': 500,
            },
            {
                'title': 'Daily Quiz Champion',
                'description': 'Complete today\'s daily challenge quiz',
                'challenge_type': 'daily',
                'status': 'active',
                'start_time': now.replace(hour=0, minute=0),
                'end_time': now.replace(hour=23, minute=59),
                'goal': {'daily_quiz': 1},
                'xp_reward': 100,
            },
            {
                'title': 'Biology Blitz',
                'description': 'Master 5 biology topics this week',
                'challenge_type': 'weekly',
                'status': 'active',
                'start_time': now - timedelta(days=3),
                'end_time': now + timedelta(days=4),
                'goal': {'topics_mastered': 5, 'subject': 'biology'},
                'xp_reward': 750,
            },
            {
                'title': 'Mock Test Marathon',
                'description': 'Complete 3 full mock tests',
                'challenge_type': 'event',
                'status': 'upcoming',
                'start_time': now + timedelta(days=2),
                'end_time': now + timedelta(days=9),
                'goal': {'mock_tests': 3},
                'xp_reward': 1000,
            },
        ]
        
        for challenge_data in challenges_data:
            Challenge.objects.get_or_create(
                title=challenge_data['title'],
                defaults=challenge_data
            )
        
        self.stdout.write(f'  ✓ Created {len(challenges_data)} challenges')

    def create_user_progress(self):
        self.stdout.write('Creating user progress data...')
        
        if not self.sample_users:
            return
        
        today = date.today()
        
        for profile in self.sample_users:
            # Create streaks
            streak, _ = Streak.objects.get_or_create(
                student=profile,
                exam=None,
                defaults={
                    'current_streak': random.randint(1, 30),
                    'longest_streak': random.randint(10, 45),
                    'last_activity_date': today - timedelta(days=random.randint(0, 1)),
                    'total_active_days': random.randint(20, 60),
                }
            )
            
            # Create topic mastery for some topics
            topics = list(self.topics.values())[:15]
            for topic in random.sample(topics, min(10, len(topics))):
                mastery_level = random.randint(1, 5)
                TopicMastery.objects.get_or_create(
                    student=profile,
                    topic=topic,
                    defaults={
                        'mastery_level': mastery_level,
                        'mastery_score': Decimal(str(mastery_level * 20 + random.randint(-10, 10))),
                        'total_questions_attempted': random.randint(10, 50),
                        'total_correct_answers': random.randint(5, 40),
                        'accuracy_percentage': Decimal(str(random.randint(40, 95))),
                        'average_time_per_question': random.randint(30, 120),
                        'needs_revision': mastery_level <= 2,
                    }
                )
            
            # Create subject performance
            for subj_code, subject in self.subjects.items():
                for exam in subject.exams.all()[:1]:
                    SubjectPerformance.objects.get_or_create(
                        student=profile,
                        subject=subject,
                        exam=exam,
                        defaults={
                            'total_questions': random.randint(50, 200),
                            'correct_answers': random.randint(30, 150),
                            'accuracy': Decimal(str(random.randint(50, 90))),
                            'topics_attempted': random.randint(5, 15),
                            'topics_mastered': random.randint(1, 8),
                            'total_study_minutes': random.randint(100, 500),
                        }
                    )
            
            # Create daily activities for the last 14 days
            for i in range(14):
                activity_date = today - timedelta(days=i)
                if random.random() > 0.2:  # 80% chance of activity
                    DailyActivity.objects.get_or_create(
                        student=profile,
                        date=activity_date,
                        defaults={
                            'study_time_minutes': random.randint(15, 120),
                            'questions_attempted': random.randint(5, 50),
                            'questions_correct': random.randint(3, 40),
                            'notes_read': random.randint(0, 5),
                            'videos_watched': random.randint(0, 3),
                            'quizzes_completed': random.randint(0, 3),
                            'xp_earned': random.randint(50, 300),
                            'daily_goal_met': random.random() > 0.3,
                        }
                    )
            
            # Create leaderboard entries
            for period in ['daily', 'weekly', 'monthly']:
                if period == 'daily':
                    period_start = today
                    period_end = today
                elif period == 'weekly':
                    period_start = today - timedelta(days=today.weekday())
                    period_end = period_start + timedelta(days=6)
                else:
                    period_start = today.replace(day=1)
                    period_end = (period_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                for exam in self.exams.values():
                    if random.random() > 0.5:  # 50% chance
                        LeaderboardEntry.objects.get_or_create(
                            student=profile,
                            exam=exam,
                            period=period,
                            period_start=period_start,
                            defaults={
                                'period_end': period_end,
                                'xp_earned': random.randint(100, 1000),
                                'questions_answered': random.randint(20, 100),
                                'accuracy': Decimal(str(random.randint(50, 95))),
                                'rank': random.randint(1, 100),
                                'rank_change': random.randint(-10, 20),
                            }
                        )
            
            # Award some badges
            badges = list(self.badges.values())
            for badge in random.sample(badges, min(5, len(badges))):
                StudentBadge.objects.get_or_create(
                    student=profile,
                    badge=badge,
                    defaults={
                        'progress': {},
                        'is_complete': True,
                    }
                )
            
            # Create some quiz attempts
            quizzes = Quiz.objects.filter(status='published')[:5]
            for quiz in quizzes:
                if random.random() > 0.3:
                    total_q = max(quiz.questions.count(), 5)
                    skipped = random.randint(0, 2)
                    attempted = total_q - skipped
                    correct = random.randint(int(attempted * 0.4), attempted)
                    wrong = attempted - correct
                    
                    QuizAttempt.objects.create(
                        student=profile,
                        quiz=quiz,
                        status='completed',
                        completed_at=timezone.now() - timedelta(days=random.randint(0, 14)),
                        time_taken_seconds=random.randint(300, 900),
                        total_questions=total_q,
                        attempted_questions=attempted,
                        correct_answers=correct,
                        wrong_answers=wrong,
                        skipped_questions=skipped,
                        marks_obtained=Decimal(str(correct * 4 - wrong)),
                        total_marks=Decimal(str(total_q * 4)),
                        percentage=Decimal(str(round((correct / total_q) * 100, 2))),
                        xp_earned=random.randint(50, 150),
                    )
            
            # Create XP transactions
            for _ in range(random.randint(5, 15)):
                transaction_type = random.choice([
                    'quiz_complete', 'daily_goal', 'streak_bonus', 'badge_earned'
                ])
                xp = random.randint(25, 200)
                XPTransaction.objects.create(
                    student=profile,
                    transaction_type=transaction_type,
                    xp_amount=xp,
                    description=f'{transaction_type.replace("_", " ").title()}',
                    balance_after=profile.total_xp,
                )
        
        self.stdout.write(f'  ✓ Created progress data for {len(self.sample_users)} users')

