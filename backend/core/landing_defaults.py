"""Generic, professional default content for a tenant's public landing page.

These defaults let a brand-new tenant have a complete, good-looking landing page
out of the box — before an admin has customised anything. The tenant admin can
then edit every field from the Home Page Builder.

The section ``type`` values here must stay in sync with the frontend section
registry (``src/config/landingSections.js`` and ``src/components/landing``).
"""
import uuid


# Canonical list of landing-page templates (visual designs). Keys are stable
# identifiers the frontend maps to a full layout/skin; values are labels shown
# in the builder. Keep in sync with the frontend template config.
TEMPLATE_CHOICES = {
    'aurora': 'Aurora — Gradient & Modern',
    'spotlight': 'Spotlight — Bold & Dark',
    'classic': 'Classic — Clean & Light',
    'minimal': 'Minimal — Editorial',
}
DEFAULT_TEMPLATE = 'aurora'


# Legal document types that a tenant can override. Platform ships generic
# defaults so these pages are never empty.
LEGAL_DOC_TYPES = {
    'refund': 'Refund & Cancellation Policy',
    'privacy': 'Privacy Policy',
    'terms': 'Terms & Conditions',
}


def _sid():
    """A short, stable-enough section id."""
    return uuid.uuid4().hex[:12]


def default_sections(tenant_name='Our Academy'):
    """Return the ordered list of default landing sections for a tenant.

    Each section: ``{id, type, enabled, data}``. Order is list order.
    """
    return [
        {
            'id': _sid(),
            'type': 'hero',
            'enabled': True,
            'data': {
                'eyebrow': 'Welcome to ' + tenant_name,
                'title': 'Learn Smarter. Achieve More.',
                'subtitle': (
                    'Join thousands of learners preparing with structured '
                    'courses, live doubt-solving, mock tests and personalised '
                    'analytics — all in one place.'
                ),
                'primary_cta_label': 'Explore Courses',
                'primary_cta_link': '/courses',
                'secondary_cta_label': 'Login',
                'secondary_cta_link': '/login',
                'image': '',
                'badges': ['Expert Faculty', 'Live Classes', 'Proven Results'],
            },
        },
        {
            'id': _sid(),
            'type': 'stats',
            'enabled': True,
            'data': {
                'title': '',
                'items': [
                    {'value': '10,000+', 'label': 'Students Enrolled'},
                    {'value': '50+', 'label': 'Expert Educators'},
                    {'value': '95%', 'label': 'Success Rate'},
                    {'value': '4.8/5', 'label': 'Average Rating'},
                ],
            },
        },
        {
            'id': _sid(),
            'type': 'features',
            'enabled': True,
            'data': {
                'title': 'Everything You Need to Succeed',
                'subtitle': 'A complete learning ecosystem built for results.',
                'items': [
                    {
                        'icon': 'BookOpen',
                        'title': 'Structured Courses',
                        'description': (
                            'Carefully designed curriculum with notes, videos '
                            'and practice — organised topic by topic.'
                        ),
                    },
                    {
                        'icon': 'ClipboardCheck',
                        'title': 'Tests & Quizzes',
                        'description': (
                            'Chapter quizzes, full-length mock tests and PYQs '
                            'with instant, detailed analysis.'
                        ),
                    },
                    {
                        'icon': 'Brain',
                        'title': 'AI Doubt Solver',
                        'description': (
                            'Stuck on a concept? Get clear, step-by-step help '
                            'from our AI tutor, anytime.'
                        ),
                    },
                    {
                        'icon': 'BarChart3',
                        'title': 'Performance Analytics',
                        'description': (
                            'Track accuracy, speed and mastery. Know exactly '
                            'where to focus next.'
                        ),
                    },
                    {
                        'icon': 'Users',
                        'title': 'Expert Faculty',
                        'description': (
                            'Learn from experienced educators who care about '
                            'your progress.'
                        ),
                    },
                    {
                        'icon': 'Trophy',
                        'title': 'Gamified Learning',
                        'description': (
                            'Earn XP, badges and climb the leaderboard while '
                            'you learn.'
                        ),
                    },
                ],
            },
        },
        {
            'id': _sid(),
            'type': 'courses',
            'enabled': True,
            'data': {
                'title': 'Popular Courses',
                'subtitle': 'Handpicked programs to kickstart your preparation.',
                'cta_label': 'View All Courses',
                'cta_link': '/courses',
                'limit': 12,
            },
        },
        {
            'id': _sid(),
            'type': 'achievers',
            'enabled': True,
            'data': {
                'title': 'Our Achievers',
                'subtitle': 'Real results from students who trusted us.',
                'items': [
                    {
                        'name': 'Aarav Sharma',
                        'achievement': 'AIR 42 — National Exam',
                        'photo': '',
                        'quote': 'The mock tests and analytics made all the difference.',
                    },
                    {
                        'name': 'Priya Verma',
                        'achievement': 'Top 1% — State Rank',
                        'photo': '',
                        'quote': 'Structured courses kept me consistent every single day.',
                    },
                    {
                        'name': 'Rohan Gupta',
                        'achievement': '99.2 Percentile',
                        'photo': '',
                        'quote': 'Doubt solving at midnight? The AI tutor was a lifesaver.',
                    },
                    {
                        'name': 'Ananya Iyer',
                        'achievement': 'Selected — Merit List',
                        'photo': '',
                        'quote': 'The faculty genuinely cared about my progress.',
                    },
                ],
            },
        },
        {
            'id': _sid(),
            'type': 'testimonials',
            'enabled': True,
            'data': {
                'title': 'What Our Students Say',
                'subtitle': '',
                'items': [
                    {
                        'name': 'Kabir Nair',
                        'role': 'Class 12 Student',
                        'photo': '',
                        'rating': 5,
                        'quote': (
                            'The best decision I made this year. The platform is '
                            'clean, fast and everything is in one place.'
                        ),
                    },
                    {
                        'name': 'Sneha Rao',
                        'role': 'Repeater',
                        'photo': '',
                        'rating': 5,
                        'quote': (
                            'The analytics showed me exactly what to fix. My scores '
                            'improved within weeks.'
                        ),
                    },
                    {
                        'name': 'Ishaan Mehta',
                        'role': 'Working Professional',
                        'photo': '',
                        'rating': 5,
                        'quote': (
                            'Flexible, well-structured and affordable. Perfect for '
                            'my busy schedule.'
                        ),
                    },
                ],
            },
        },
        {
            'id': _sid(),
            'type': 'about',
            'enabled': True,
            'data': {
                'title': 'Why Choose ' + tenant_name,
                'body': (
                    'We are on a mission to make high-quality education accessible '
                    'to every learner. With experienced educators, a modern '
                    'learning platform and a relentless focus on outcomes, we help '
                    'students turn their goals into achievements.'
                ),
                'image': '',
                'points': [
                    'Personalised learning paths',
                    'Doubt resolution within hours',
                    'Regular assessments & feedback',
                    'A supportive learning community',
                ],
            },
        },
        {
            'id': _sid(),
            'type': 'faq',
            'enabled': True,
            'data': {
                'title': 'Frequently Asked Questions',
                'subtitle': '',
                'items': [
                    {
                        'question': 'How do I enrol in a course?',
                        'answer': (
                            'Browse our courses, pick the one that fits your goals, '
                            'and click Enrol. You can start learning right away.'
                        ),
                    },
                    {
                        'question': 'Are there free courses?',
                        'answer': (
                            'Yes! We offer a mix of free and premium courses so you '
                            'can explore before you commit.'
                        ),
                    },
                    {
                        'question': 'Can I access classes on mobile?',
                        'answer': (
                            'Absolutely. The platform works seamlessly across mobile, '
                            'tablet and desktop.'
                        ),
                    },
                    {
                        'question': 'What if I need help with a doubt?',
                        'answer': (
                            'Use the AI Doubt Solver for instant help, or reach out '
                            'to our faculty and community.'
                        ),
                    },
                ],
            },
        },
        {
            'id': _sid(),
            'type': 'cta',
            'enabled': True,
            'data': {
                'title': 'Ready to Start Your Journey?',
                'subtitle': (
                    'Join now and take the first step towards your goals.'
                ),
                'button_label': 'Get Started',
                'button_link': '/register',
            },
        },
    ]


def default_footer(tenant_name='Our Academy'):
    """Return the default footer configuration for a tenant."""
    return {
        'about': (
            f'{tenant_name} is dedicated to helping learners achieve their '
            'goals through structured courses, expert guidance and modern '
            'learning tools.'
        ),
        'email': '',
        'phone': '',
        'address': '',
        'socials': [
            {'platform': 'facebook', 'url': ''},
            {'platform': 'instagram', 'url': ''},
            {'platform': 'youtube', 'url': ''},
            {'platform': 'twitter', 'url': ''},
            {'platform': 'linkedin', 'url': ''},
        ],
        'columns': [
            {
                'title': 'Explore',
                'links': [
                    {'label': 'Courses', 'url': '/courses'},
                    {'label': 'Login', 'url': '/login'},
                    {'label': 'Register', 'url': '/register'},
                ],
            },
            {
                'title': 'Legal',
                'links': [
                    {'label': 'Privacy Policy', 'url': '/privacy-policy'},
                    {'label': 'Refund Policy', 'url': '/refund-policy'},
                    {'label': 'Terms & Conditions', 'url': '/terms'},
                ],
            },
        ],
        'copyright': f'© {{year}} {tenant_name}. All rights reserved.',
    }


# ── Legal document generic defaults ────────────────────────────────────────
# These are provided by the platform as a professional starting point. Tenants
# are responsible for reviewing and adapting them to their business.

def default_legal(doc_type, tenant_name='Our Academy'):
    """Return ``{title, content}`` generic default for a legal ``doc_type``."""
    builders = {
        'refund': _default_refund,
        'privacy': _default_privacy,
        'terms': _default_terms,
    }
    builder = builders.get(doc_type)
    if not builder:
        return {'title': '', 'content': ''}
    return builder(tenant_name)


def _default_refund(name):
    return {
        'title': LEGAL_DOC_TYPES['refund'],
        'content': (
            f'<h2>Refund &amp; Cancellation Policy</h2>'
            f'<p>At {name}, we want you to be confident in your purchase. This '
            'policy explains when and how refunds are issued.</p>'
            '<h3>Eligibility</h3>'
            '<ul>'
            '<li>Refund requests must be raised within 7 days of purchase.</li>'
            '<li>Refunds apply only if you have accessed less than 20% of the '
            'course content.</li>'
            '<li>Free courses and one-time services are non-refundable.</li>'
            '</ul>'
            '<h3>How to Request a Refund</h3>'
            '<p>Email us with your registered email address and order details. '
            'Approved refunds are processed to the original payment method '
            'within 7–10 business days.</p>'
            '<h3>Cancellations</h3>'
            '<p>You may cancel a subscription anytime; access continues until '
            'the end of the current billing period.</p>'
            '<p><em>This is a generic template provided by the platform. Please '
            'review and adapt it to your business before publishing.</em></p>'
        ),
    }


def _default_privacy(name):
    return {
        'title': LEGAL_DOC_TYPES['privacy'],
        'content': (
            f'<h2>Privacy Policy</h2>'
            f'<p>{name} respects your privacy and is committed to protecting '
            'your personal data. This policy describes what we collect and how '
            'we use it.</p>'
            '<h3>Information We Collect</h3>'
            '<ul>'
            '<li>Account details such as your name, email and phone number.</li>'
            '<li>Learning activity, progress and assessment results.</li>'
            '<li>Payment information processed securely by our payment partners.</li>'
            '</ul>'
            '<h3>How We Use Your Information</h3>'
            '<ul>'
            '<li>To provide and personalise your learning experience.</li>'
            '<li>To communicate important updates and support.</li>'
            '<li>To improve our courses and platform.</li>'
            '</ul>'
            '<h3>Data Security</h3>'
            '<p>We use industry-standard measures to protect your data. We do '
            'not sell your personal information to third parties.</p>'
            '<h3>Your Rights</h3>'
            '<p>You may request access to, correction of, or deletion of your '
            'personal data by contacting us.</p>'
            '<p><em>This is a generic template provided by the platform. Please '
            'review and adapt it to your business before publishing.</em></p>'
        ),
    }


def _default_terms(name):
    return {
        'title': LEGAL_DOC_TYPES['terms'],
        'content': (
            f'<h2>Terms &amp; Conditions</h2>'
            f'<p>Welcome to {name}. By accessing or using our platform, you '
            'agree to these terms.</p>'
            '<h3>Use of the Platform</h3>'
            '<ul>'
            '<li>You must provide accurate registration information.</li>'
            '<li>Your account is personal and must not be shared.</li>'
            '<li>Course content is for personal learning use only and may not '
            'be redistributed.</li>'
            '</ul>'
            '<h3>Payments</h3>'
            '<p>Paid courses require payment through our supported gateways. '
            'Prices and features may change over time.</p>'
            '<h3>Conduct</h3>'
            '<p>You agree not to misuse the platform, attempt unauthorised '
            'access, or engage in any unlawful activity.</p>'
            '<h3>Limitation of Liability</h3>'
            '<p>The platform is provided on an "as is" basis. We are not liable '
            'for any indirect or incidental damages arising from its use.</p>'
            '<p><em>This is a generic template provided by the platform. Please '
            'review and adapt it to your business before publishing.</em></p>'
        ),
    }
