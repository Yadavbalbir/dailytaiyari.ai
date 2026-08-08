"""Turn AI-supplied content *blocks* into the platform's house-style HTML.

The model is never asked for raw HTML. It returns a list of typed blocks::

    [{"type": "lead", "text": "..."},
     {"type": "callout", "variant": "tip", "text": "..."}]

and this module renders them with the same inline-styled markup the hand-built
courses use. Two reasons this beats "just ask for HTML":

* **Consistency** — every note across every course looks identical, because the
  styling lives here and not in a prompt.
* **Safety** — model text is escaped, so a generated note can never inject a
  ``<script>`` into the admin preview or a student's browser.

Light inline formatting the model may still use inside text (``**bold**``,
``*italic*``, `` `code` ``) is converted after escaping, so the markup is ours.
"""
from __future__ import annotations

import html as _html
import re

ACCENT = '#4f46e5'

_CALLOUTS = {
    'key': ('#4f46e5', '#eef2ff', '&#128204;', 'Key idea'),
    'tip': ('#059669', '#ecfdf5', '&#128161;', 'Tip'),
    'warn': ('#d97706', '#fffbeb', '&#9888;&#65039;', 'Watch out'),
    'example': ('#0284c7', '#f0f9ff', '&#129504;', 'Example'),
    'recap': ('#7c3aed', '#f5f3ff', '&#127919;', 'Recap'),
    'note': ('#0f766e', '#f0fdfa', '&#128221;', 'Note'),
}

# Blocks the renderer understands. Exposed so the prompt and the frontend
# preview/editor stay in lock-step with what can actually be rendered.
BLOCK_TYPES = (
    'lead', 'heading', 'paragraph', 'bullets', 'numbers',
    'code', 'callout', 'table', 'quote', 'divider',
)
CALLOUT_VARIANTS = tuple(_CALLOUTS)


def esc(value) -> str:
    """HTML-escape any model-supplied scalar."""
    return _html.escape('' if value is None else str(value), quote=False)


_BOLD = re.compile(r'\*\*(.+?)\*\*', re.DOTALL)
_ITALIC = re.compile(r'(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)', re.DOTALL)
_CODE = re.compile(r'`([^`]+?)`')


def rich(value) -> str:
    """Escape, then re-enable a tiny, safe subset of Markdown inline styling."""
    text = esc(value)
    text = _CODE.sub(
        r'<code style="background:#f1f5f9;color:#0f172a;padding:2px 6px;border-radius:6px;'
        r'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:0.92em">\1</code>',
        text,
    )
    text = _BOLD.sub(r'<strong style="color:#0f172a">\1</strong>', text)
    text = _ITALIC.sub(r'<em>\1</em>', text)
    return text


# ─────────────────────────────────────────────────────────────────────────────
# Individual block renderers
# ─────────────────────────────────────────────────────────────────────────────

def _lead(text):
    return (
        '<p style="font-size:1.12rem;line-height:1.7;color:#334155;margin:0 0 18px">'
        f'{rich(text)}</p>'
    )


def _heading(text, level=3):
    size = {2: '1.4rem', 3: '1.25rem', 4: '1.1rem'}.get(level, '1.25rem')
    return (
        f'<h{level} style="font-size:{size};font-weight:700;color:#0f172a;margin:26px 0 10px;'
        f'padding-left:12px;border-left:4px solid {ACCENT}">{rich(text)}</h{level}>'
    )


def _paragraph(text):
    return f'<p style="line-height:1.75;color:#334155;margin:12px 0">{rich(text)}</p>'


def _list(items, ordered=False):
    tag = 'ol' if ordered else 'ul'
    lis = ''.join(
        f'<li style="margin:6px 0;line-height:1.65">{rich(item)}</li>' for item in items or []
    )
    if not lis:
        return ''
    return f'<{tag} style="margin:12px 0;padding-left:22px;color:#334155">{lis}</{tag}>'


def _code(snippet, language=''):
    label = ''
    if language:
        label = (
            '<div style="font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;'
            f'color:#94a3b8;margin-bottom:6px">{esc(language)}</div>'
        )
    return (
        '<div style="margin:16px 0">' + label +
        '<pre style="background:#0f172a;color:#e2e8f0;padding:16px 18px;border-radius:12px;'
        'overflow-x:auto;font-size:0.9rem;line-height:1.65;margin:0">'
        '<code style="background:none;color:inherit;padding:0;'
        f'font-family:ui-monospace,Menlo,Consolas,monospace">{esc(snippet)}</code></pre></div>'
    )


def _callout(variant, text, title=None):
    accent, bg, emoji, default_title = _CALLOUTS.get(variant, _CALLOUTS['note'])
    return (
        f'<div style="border-left:4px solid {accent};background:{bg};padding:14px 16px;'
        'border-radius:10px;margin:20px 0">'
        f'<div style="font-weight:700;color:{accent};margin-bottom:6px">'
        f'{emoji}&nbsp;&nbsp;{esc(title or default_title)}</div>'
        f'<div style="color:#334155;line-height:1.7">{rich(text)}</div></div>'
    )


def _table(headers, rows):
    if not headers and not rows:
        return ''
    th = ''.join(
        '<th style="text-align:left;padding:10px 12px;background:#4f46e5;color:#fff;'
        f'font-weight:600">{rich(x)}</th>' for x in headers or []
    )
    trs = []
    for index, row in enumerate(rows or []):
        bg = '#f8fafc' if index % 2 else '#ffffff'
        tds = ''.join(
            '<td style="padding:9px 12px;border-top:1px solid #e2e8f0;color:#334155">'
            f'{rich(cell)}</td>' for cell in row or []
        )
        trs.append(f'<tr style="background:{bg}">{tds}</tr>')
    return (
        '<div style="overflow-x:auto;margin:16px 0">'
        '<table style="border-collapse:collapse;width:100%;border-radius:10px;overflow:hidden">'
        f'<thead><tr>{th}</tr></thead><tbody>{"".join(trs)}</tbody></table></div>'
    )


def _quote(text, attribution=''):
    cite = (
        f'<div style="margin-top:8px;font-size:0.85rem;color:#64748b">— {esc(attribution)}</div>'
        if attribution else ''
    )
    return (
        '<blockquote style="margin:18px 0;padding:14px 18px;border-left:4px solid #cbd5e1;'
        'background:#f8fafc;border-radius:0 10px 10px 0;color:#475569;font-style:italic;'
        f'line-height:1.7">{rich(text)}{cite}</blockquote>'
    )


def _divider():
    return '<hr style="border:0;border-top:1px solid #e2e8f0;margin:26px 0" />'


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def render_block(block) -> str:
    """Render one block dict; unknown/broken blocks render as nothing."""
    if not isinstance(block, dict):
        return ''
    kind = str(block.get('type') or '').strip().lower()
    text = block.get('text') or block.get('content') or ''

    if kind == 'lead':
        return _lead(text)
    if kind in ('heading', 'h', 'h3'):
        try:
            level = int(block.get('level') or 3)
        except (TypeError, ValueError):
            level = 3
        return _heading(text, min(4, max(2, level)))
    if kind in ('paragraph', 'p', 'text'):
        return _paragraph(text)
    if kind in ('bullets', 'ul', 'list'):
        return _list(block.get('items'), ordered=False)
    if kind in ('numbers', 'ol', 'steps'):
        return _list(block.get('items'), ordered=True)
    if kind in ('code', 'pre'):
        return _code(text, block.get('language') or '')
    if kind == 'callout':
        variant = str(block.get('variant') or 'note').strip().lower()
        return _callout(variant if variant in _CALLOUTS else 'note', text, block.get('title'))
    if kind == 'table':
        return _table(block.get('headers'), block.get('rows'))
    if kind in ('quote', 'blockquote'):
        return _quote(text, block.get('attribution') or '')
    if kind in ('divider', 'hr'):
        return _divider()
    # Unrecognised type but it carries prose — don't lose the content.
    return _paragraph(text) if text else ''


def render_blocks(blocks) -> str:
    """Render a list of blocks into one self-contained HTML string."""
    if not isinstance(blocks, list):
        return ''
    return ''.join(filter(None, (render_block(b) for b in blocks)))


def blocks_to_plain_text(blocks, limit=400) -> str:
    """A short plain-text summary of a note, for descriptions/previews."""
    parts = []
    for block in blocks or []:
        if not isinstance(block, dict):
            continue
        text = block.get('text') or ''
        if text:
            parts.append(str(text))
        for item in block.get('items') or []:
            parts.append(str(item))
        if sum(len(p) for p in parts) > limit:
            break
    joined = ' '.join(' '.join(parts).split())
    return joined[:limit].rstrip()


def estimate_reading_minutes(blocks) -> int:
    """Rough reading time (≈200 words/min), floored at 3 minutes."""
    words = len(blocks_to_plain_text(blocks, limit=100000).split())
    return max(3, round(words / 200) or 3)
