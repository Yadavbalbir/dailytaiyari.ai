"""NEET syllabus: Physics + Chemistry (shared with JEE) + Biology."""
from ._jee_main_syllabus import SUBJECTS as _JEE

SUBJECTS = {
    'Physics': {**_JEE['Physics'], 'weightage': 25.0},
    'Chemistry': {**_JEE['Chemistry'], 'weightage': 25.0},
    'Biology': {
        'code': 'biology', 'color': '#059669', 'icon': 'leaf', 'weightage': 50.0,
        'chapters': [
            ('Diversity in Living World', ['The living world and taxonomy', 'Biological classification', 'Plant kingdom', 'Animal kingdom']),
            ('Structural Organisation', ['Morphology of flowering plants', 'Anatomy of flowering plants', 'Structural organisation in animals']),
            ('Cell Structure and Function', ['Cell theory and types', 'Cell organelles', 'Biomolecules', 'Cell cycle and division']),
            ('Plant Physiology', ['Transport in plants', 'Mineral nutrition', 'Photosynthesis', 'Respiration in plants', 'Plant growth and development']),
            ('Human Physiology', ['Digestion and absorption', 'Breathing and exchange of gases', 'Body fluids and circulation', 'Excretory products', 'Locomotion and movement', 'Neural control', 'Chemical coordination']),
            ('Reproduction', ['Sexual reproduction in plants', 'Human reproduction', 'Reproductive health']),
            ('Genetics and Evolution', ['Principles of inheritance', 'Molecular basis of inheritance', 'Evolution']),
            ('Biology and Human Welfare', ['Human health and disease', 'Microbes in human welfare']),
            ('Biotechnology', ['Biotechnology principles and processes', 'Biotechnology applications']),
            ('Ecology', ['Organisms and populations', 'Ecosystem', 'Biodiversity and conservation', 'Environmental issues']),
        ],
    },
}
