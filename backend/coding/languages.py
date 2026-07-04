"""
Supported languages for coding problems.

Single source of truth mapping our internal language key -> the Piston runtime
(language + version) and the Monaco editor mode used on the frontend. Keep this
in sync with the language packages installed in the Piston container.
"""

# key: {label, piston language, piston version, monaco mode, default file name}
LANGUAGES = {
    'python': {
        'label': 'Python 3.12',
        'piston_language': 'python',
        'piston_version': '3.12.0',
        'monaco': 'python',
        'filename': 'main.py',
    },
    'cpp': {
        'label': 'C++ (GCC 10.2)',
        'piston_language': 'c++',
        'piston_version': '10.2.0',
        'monaco': 'cpp',
        'filename': 'main.cpp',
    },
    'java': {
        'label': 'Java 15',
        'piston_language': 'java',
        'piston_version': '15.0.2',
        'monaco': 'java',
        # Piston requires the public class name to match the file name.
        'filename': 'Main.java',
    },
}

LANGUAGE_KEYS = list(LANGUAGES.keys())


def language_choices():
    return [(k, v['label']) for k, v in LANGUAGES.items()]


def public_languages():
    """Serializable list for the frontend editor."""
    return [
        {'key': k, 'label': v['label'], 'monaco': v['monaco']}
        for k, v in LANGUAGES.items()
    ]
