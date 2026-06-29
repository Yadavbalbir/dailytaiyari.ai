"""Shared seeding logic for syllabus-based exams (JEE, NEET)."""
from django.utils.text import slugify
from django.db import transaction

from core.models import Tenant
from exams.models import Exam, Subject, Topic, Chapter, ChapterTopic
from content.models import Content
from quiz.models import Quiz, Question, QuestionOption, QuizQuestion, MockTest, MockTestQuestion

KEY_FACTS = {
    'Projectile motion': "Range $R=\\dfrac{u^2\\sin 2\\theta}{g}$, max height $H=\\dfrac{u^2\\sin^2\\theta}{2g}$, time of flight $T=\\dfrac{2u\\sin\\theta}{g}$.",
    "Newton's laws of motion": "$F=ma$; action-reaction pairs are equal and opposite; impulse $J=\\int F\\,dt=\\Delta p$.",
    'Kinetic and potential energy': "$KE=\\tfrac12 mv^2$, gravitational $PE=mgh$, spring $PE=\\tfrac12 kx^2$.",
    'Simple harmonic motion': "$x=A\\sin(\\omega t+\\phi)$, $T=2\\pi\\sqrt{m/k}$.",
    'Gauss law': "$\\oint \\vec E\\cdot d\\vec A=q_{enc}/\\varepsilon_0$.",
    "Ohm's law, resistance": "$V=IR$; $R=\\rho L/A$; power $P=VI=I^2R$.",
    'Photoelectric effect': "$h\\nu=\\phi+KE_{max}$; stopping potential $eV_0=h\\nu-\\phi$.",
    'Bohr model and spectra': "$E_n=-13.6/n^2\\,\\text{eV}$; $r_n\\propto n^2$.",
    'Mole concept and molar mass': "1 mole $=6.022\\times10^{23}$ particles; moles $=\\dfrac{\\text{mass}}{\\text{molar mass}}$.",
    'Photosynthesis': "$6CO_2+6H_2O\\xrightarrow{light}C_6H_{12}O_6+6O_2$; light and Calvin (dark) reactions.",
    'Principles of inheritance': "Mendel: law of dominance, segregation, independent assortment; 9:3:3:1 dihybrid ratio.",
}


def build_notes(topic, subject, chapter, exam_name):
    fact = KEY_FACTS.get(topic)
    kf = f"\n\n## Key Formula\n{fact}\n" if fact else ""
    return (
        f"# {topic}\n\n*{subject} · {chapter} ({exam_name})*\n\n"
        f"## Overview\n{topic} is a core part of the {exam_name} {subject} syllabus under "
        f"**{chapter}**. Master the definitions, governing equations and standard problem types, "
        f"then practise previous-year questions.\n\n"
        f"## Key Points\n"
        f"- Understand the fundamental definition and meaning of {topic}.\n"
        f"- Memorise the standard results and learn their derivations.\n"
        f"- Solve graded problems and review {exam_name} PYQs.\n{kf}"
    )


def build_formula(topic, subject, chapter, exam_name):
    fact = KEY_FACTS.get(topic, "Compile all standard formulas and results for this topic.")
    return f"# {topic} — Formula Sheet\n\n*{subject} · {chapter}*\n\n{fact}\n"


def build_questions(topic, subject, exam_name):
    """Return a list of 3 MCQ dicts for a topic. Each: text, options[4], correct idx, explanation."""
    return [
        {
            'text': f"Which statement best describes the central idea of \u201c{topic}\u201d in {subject}?",
            'options': [
                f"It is a fundamental concept of {topic} used across {subject}.",
                "It has no relevance to the syllabus.",
                "It only applies outside competitive exams.",
                "It is a deprecated topic.",
            ],
            'correct': 0,
            'explanation': f"{topic} is a core, frequently-tested concept in the {exam_name} {subject} syllabus.",
        },
        {
            'text': f"For {exam_name} preparation, the best strategy for mastering {topic} is to:",
            'options': [
                "Skip the derivations entirely.",
                "Memorise standard results and practise previous-year questions.",
                "Only read once before the exam.",
                "Ignore the formula sheet.",
            ],
            'correct': 1,
            'explanation': "Combining standard results with PYQ practice gives the best retention and accuracy.",
        },
        {
            'text': f"Which resource pair is most useful while studying {topic}?",
            'options': [
                "Unrelated subjects only.",
                "Complete Notes and Formula Sheet for the topic.",
                "No notes at all.",
                "Random social media posts.",
            ],
            'correct': 1,
            'explanation': f"The {topic} notes and formula sheet cover the definitions and key equations you need.",
        },
    ]


def seed_topic_quiz(topic, subject, exam, tenant, exam_name):
    quiz, _ = Quiz.objects.update_or_create(
        exam=exam, topic=topic, quiz_type='topic',
        defaults={'title': f"{topic.name} — Practice Quiz", 'tenant': tenant,
                  'subject': subject, 'status': 'published',
                  'description': f"Test your understanding of {topic.name}.",
                  'duration_minutes': 10, 'is_free': True, 'total_marks': 3})
    QuizQuestion.objects.filter(quiz=quiz).delete()
    for q_order, q in enumerate(build_questions(topic.name, subject.name, exam_name), 1):
        question, _ = Question.objects.update_or_create(
            topic=topic, subject=subject, question_text=q['text'],
            defaults={'question_type': 'mcq', 'status': 'published',
                      'correct_answer': str(q['correct']), 'explanation': q['explanation'],
                      'marks': 1, 'negative_marks': 0})
        question.exams.add(exam)
        question.options.all().delete()
        for o_order, opt in enumerate(q['options']):
            QuestionOption.objects.create(question=question, option_text=opt,
                                          is_correct=(o_order == q['correct']), order=o_order)
        QuizQuestion.objects.create(quiz=quiz, question=question, order=q_order)
    return 1


@transaction.atomic
def seed_mock_tests(exam, tenant, exam_name, count=2, per_subject=15):
    """Build full-length mock tests by sampling published questions across subjects."""
    subjects = list(Subject.objects.filter(exam=exam).order_by('order'))
    n_mock = 0
    for i in range(1, count + 1):
        sections, all_qs = [], []
        for s_idx, subj in enumerate(subjects):
            q_ids = list(Question.objects.filter(subject=subj, status='published')
                         .order_by('id').values_list('id', flat=True))
            if not q_ids:
                continue
            chunk = q_ids[(i - 1) * per_subject:(i - 1) * per_subject + per_subject] or q_ids[:per_subject]
            sections.append({'subject_id': str(subj.id), 'name': subj.name,
                             'questions_count': len(chunk), 'marks': len(chunk) * 4})
            all_qs.extend((s_idx, qid) for qid in chunk)
        total = len(all_qs)
        mock, _ = MockTest.objects.update_or_create(
            exam=exam, title=f"{exam_name} Full Mock Test {i}",
            defaults={'tenant': tenant, 'description': f"Full-length {exam_name} simulation #{i}.",
                      'sections': sections, 'duration_minutes': 180,
                      'total_marks': total * 4, 'negative_marking': True,
                      'status': 'published', 'is_free': True})
        MockTestQuestion.objects.filter(mock_test=mock).delete()
        for order, (sec, qid) in enumerate(all_qs):
            MockTestQuestion.objects.create(mock_test=mock, question_id=qid, section=sec,
                                            order=order, marks_override=4, negative_marks_override=1)
        n_mock += 1
    return n_mock


@transaction.atomic
def seed_syllabus(exam_code, exam_name, tenant_name, subjects, color='#f97316'):
    tenant = Tenant.objects.filter(name=tenant_name).first()
    if not tenant:
        raise ValueError(f"Tenant '{tenant_name}' not found")
    exam, _ = Exam.objects.update_or_create(
        code=exam_code,
        defaults={'name': exam_name, 'tenant': tenant, 'status': 'active',
                  'exam_type': 'competitive', 'color': color})
    n_sub = n_ch = n_top = n_cnt = n_quiz = 0
    for s_order, (sname, sdata) in enumerate(subjects.items(), 1):
        subject, _ = Subject.objects.update_or_create(
            code=sdata['code'], exam=exam,
            defaults={'name': sname, 'color': sdata['color'], 'icon': sdata['icon'],
                      'weightage': sdata['weightage'], 'order': s_order})
        n_sub += 1
        for c_order, (cname, topics) in enumerate(sdata['chapters'], 1):
            chapter, _ = Chapter.objects.update_or_create(
                code=slugify(cname)[:90], subject=subject,
                defaults={'name': cname, 'order': c_order})
            n_ch += 1
            for t_order, tname in enumerate(topics, 1):
                topic, _ = Topic.objects.update_or_create(
                    code=slugify(tname)[:90], subject=subject,
                    defaults={'name': tname, 'order': t_order})
                ChapterTopic.objects.update_or_create(
                    chapter=chapter, topic=topic, defaults={'order': t_order})
                n_top += 1
                for suffix, ctype, builder in [
                    ('Complete Notes', 'notes', build_notes),
                    ('Formula Sheet', 'formula', build_formula)]:
                    slug = slugify(f"{exam_code}-{tname}-{suffix}")[:200]
                    c, _ = Content.objects.update_or_create(
                        slug=slug,
                        defaults={'title': f"{tname} - {suffix}", 'topic': topic,
                                  'subject': subject, 'content_type': ctype,
                                  'tenant': tenant,
                                  'content_html': builder(tname, sname, cname, exam_name),
                                  'status': 'published', 'is_free': True,
                                  'estimated_time_minutes': 12, 'order': t_order})
                    c.exams.add(exam)
                    n_cnt += 1
                n_quiz += seed_topic_quiz(topic, subject, exam, tenant, exam_name)
    n_mock = seed_mock_tests(exam, tenant, exam_name)
    return n_sub, n_ch, n_top, n_cnt, n_quiz, n_mock
