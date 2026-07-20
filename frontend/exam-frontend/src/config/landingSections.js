/**
 * Landing-page section registry (frontend source of truth for the builder).
 *
 * Each section type declares: a label, description, lucide icon name, whether
 * it can be added more than once, and a `fields` schema the Home Page Builder
 * renders to edit that section's `data`. The default `data` shape here mirrors
 * backend `core/landing_defaults.py` so newly added sections are well-formed.
 *
 * Field types understood by the builder (see LandingBuilder):
 *   text | textarea | richtext | link | number | image | tags | list
 * A `list` field has `item: [ ...subfields ]` describing each row's shape.
 */

// Landing templates (visual skins). Keep keys in sync with backend
// landing_defaults.TEMPLATE_CHOICES.
export const LANDING_TEMPLATES = [
  { key: 'aurora', label: 'Aurora', description: 'Gradient, modern & vibrant.' },
  { key: 'spotlight', label: 'Spotlight', description: 'Bold, dark & premium.' },
  { key: 'classic', label: 'Classic', description: 'Clean, light & trustworthy.' },
  { key: 'minimal', label: 'Minimal', description: 'Editorial & understated.' },
]

// Icons offered for feature cards (lucide-react names).
export const FEATURE_ICONS = [
  'BookOpen', 'ClipboardCheck', 'Brain', 'BarChart3', 'Users', 'Trophy',
  'GraduationCap', 'Rocket', 'ShieldCheck', 'Clock', 'Video', 'MessageCircle',
  'Target', 'Award', 'Sparkles', 'Heart', 'Zap', 'Globe',
]

export const SECTION_SCHEMAS = {
  hero: {
    label: 'Hero',
    icon: 'Sparkles',
    description: 'The big first impression at the top of the page.',
    singleton: true,
    fields: [
      { key: 'eyebrow', label: 'Eyebrow text', type: 'text' },
      { key: 'title', label: 'Headline', type: 'text' },
      { key: 'subtitle', label: 'Sub-headline', type: 'textarea' },
      { key: 'primary_cta_label', label: 'Primary button text', type: 'text' },
      { key: 'primary_cta_link', label: 'Primary button link', type: 'link' },
      { key: 'secondary_cta_label', label: 'Secondary button text', type: 'text' },
      { key: 'secondary_cta_link', label: 'Secondary button link', type: 'link' },
      { key: 'image', label: 'Hero image', type: 'image' },
      { key: 'badges', label: 'Highlight badges', type: 'tags' },
    ],
    defaultData: {
      eyebrow: 'Welcome',
      title: 'Learn Smarter. Achieve More.',
      subtitle: 'A complete learning ecosystem built for results.',
      primary_cta_label: 'Explore Courses',
      primary_cta_link: '/courses',
      secondary_cta_label: 'Login',
      secondary_cta_link: '/login',
      image: '',
      badges: ['Expert Faculty', 'Live Classes', 'Proven Results'],
    },
  },

  stats: {
    label: 'Stats Bar',
    icon: 'BarChart3',
    description: 'Eye-catching numbers that build trust.',
    fields: [
      { key: 'title', label: 'Section title (optional)', type: 'text' },
      {
        key: 'items', label: 'Stats', type: 'list',
        item: [
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'label', label: 'Label', type: 'text' },
        ],
      },
    ],
    defaultData: {
      title: '',
      items: [
        { value: '10,000+', label: 'Students' },
        { value: '50+', label: 'Educators' },
        { value: '95%', label: 'Success Rate' },
        { value: '4.8/5', label: 'Rating' },
      ],
    },
  },

  features: {
    label: 'Features',
    icon: 'Zap',
    description: 'Highlight what makes you great.',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'subtitle', label: 'Section subtitle', type: 'text' },
      {
        key: 'items', label: 'Feature cards', type: 'list',
        item: [
          { key: 'icon', label: 'Icon', type: 'text', choices: FEATURE_ICONS },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
    defaultData: {
      title: 'Everything You Need to Succeed',
      subtitle: 'A complete learning ecosystem built for results.',
      items: [
        { icon: 'BookOpen', title: 'Structured Courses', description: 'Curriculum organised topic by topic.' },
        { icon: 'ClipboardCheck', title: 'Tests & Quizzes', description: 'Instant, detailed analysis.' },
        { icon: 'Brain', title: 'AI Doubt Solver', description: 'Step-by-step help, anytime.' },
      ],
    },
  },

  courses: {
    label: 'Courses (live)',
    icon: 'GraduationCap',
    description: 'Horizontally scrollable carousel of your live courses.',
    singleton: true,
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'subtitle', label: 'Section subtitle', type: 'text' },
      { key: 'cta_label', label: 'Button text', type: 'text' },
      { key: 'cta_link', label: 'Button link', type: 'link' },
      { key: 'limit', label: 'Max courses to show', type: 'number' },
    ],
    defaultData: {
      title: 'Popular Courses',
      subtitle: 'Handpicked programs to kickstart your preparation.',
      cta_label: 'View All Courses',
      cta_link: '/courses',
      limit: 12,
    },
  },

  achievers: {
    label: 'Achievers',
    icon: 'Award',
    description: 'Showcase toppers and results in a slider.',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'subtitle', label: 'Section subtitle', type: 'text' },
      {
        key: 'items', label: 'Achievers', type: 'list',
        item: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'achievement', label: 'Achievement', type: 'text' },
          { key: 'photo', label: 'Photo', type: 'image' },
          { key: 'quote', label: 'Quote (optional)', type: 'textarea' },
        ],
      },
    ],
    defaultData: {
      title: 'Our Achievers',
      subtitle: 'Real results from students who trusted us.',
      items: [
        { name: 'Aarav Sharma', achievement: 'AIR 42', photo: '', quote: '' },
        { name: 'Priya Verma', achievement: 'Top 1%', photo: '', quote: '' },
      ],
    },
  },

  testimonials: {
    label: 'Testimonials',
    icon: 'MessageCircle',
    description: 'What students say — auto-scrolling slider.',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'subtitle', label: 'Section subtitle', type: 'text' },
      {
        key: 'items', label: 'Testimonials', type: 'list',
        item: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'role', label: 'Role / Course', type: 'text' },
          { key: 'photo', label: 'Photo', type: 'image' },
          { key: 'rating', label: 'Rating (1-5)', type: 'number' },
          { key: 'quote', label: 'Quote', type: 'textarea' },
        ],
      },
    ],
    defaultData: {
      title: 'What Our Students Say',
      subtitle: '',
      items: [
        { name: 'Kabir Nair', role: 'Student', photo: '', rating: 5, quote: 'The best decision I made this year.' },
      ],
    },
  },

  about: {
    label: 'About / Why Us',
    icon: 'Heart',
    description: 'Tell your story with a bullet list.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'points', label: 'Key points', type: 'tags' },
    ],
    defaultData: {
      title: 'Why Choose Us',
      body: 'We make high-quality education accessible to every learner.',
      image: '',
      points: ['Personalised learning', 'Fast doubt resolution', 'Regular assessments'],
    },
  },

  faq: {
    label: 'FAQ',
    icon: 'MessageCircle',
    description: 'Answer common questions in an accordion.',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'subtitle', label: 'Section subtitle', type: 'text' },
      {
        key: 'items', label: 'Questions', type: 'list',
        item: [
          { key: 'question', label: 'Question', type: 'text' },
          { key: 'answer', label: 'Answer', type: 'textarea' },
        ],
      },
    ],
    defaultData: {
      title: 'Frequently Asked Questions',
      subtitle: '',
      items: [
        { question: 'How do I enrol?', answer: 'Browse courses and click Enrol.' },
      ],
    },
  },

  gallery: {
    label: 'Gallery',
    icon: 'Globe',
    description: 'A grid of images (campus, events, etc.).',
    fields: [
      { key: 'title', label: 'Section title', type: 'text' },
      { key: 'subtitle', label: 'Section subtitle', type: 'text' },
      {
        key: 'items', label: 'Images', type: 'list',
        item: [
          { key: 'image', label: 'Image', type: 'image' },
          { key: 'caption', label: 'Caption', type: 'text' },
        ],
      },
    ],
    defaultData: {
      title: 'Gallery',
      subtitle: '',
      items: [],
    },
  },

  cta: {
    label: 'Call to Action',
    icon: 'Rocket',
    description: 'A bold banner inviting visitors to act.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'button_label', label: 'Button text', type: 'text' },
      { key: 'button_link', label: 'Button link', type: 'link' },
    ],
    defaultData: {
      title: 'Ready to Start Your Journey?',
      subtitle: 'Join now and take the first step towards your goals.',
      button_label: 'Get Started',
      button_link: '/register',
    },
  },

  contact: {
    label: 'Contact',
    icon: 'MessageCircle',
    description: 'Show contact details and location.',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'map_embed', label: 'Google Maps embed URL (optional)', type: 'link' },
    ],
    defaultData: {
      title: 'Get in Touch',
      subtitle: 'We would love to hear from you.',
      email: '',
      phone: '',
      address: '',
      map_embed: '',
    },
  },
}

// Order in which "add section" options are offered.
export const SECTION_ORDER = [
  'hero', 'stats', 'features', 'courses', 'achievers',
  'testimonials', 'about', 'gallery', 'faq', 'cta', 'contact',
]

export const getSectionMeta = (type) => SECTION_SCHEMAS[type] || null
