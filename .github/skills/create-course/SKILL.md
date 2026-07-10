---
name: create-course
description: How to author a complete DailyTaiyari course in a structured, idempotent way — Course → Subject → Chapter → Topic → Content, with beautifully formatted rich-HTML reading notes, per-topic quizzes, and optional assignments/coding problems. Use when building a new course or upgrading an existing one's curriculum and study material (as opposed to small field backfills, which use the populate-data skill).
---

# Create Course (DailyTaiyari)

Runbook + template for building a full course with **structured content**:
a real curriculum (chapters and topics) and, for every topic, a rich, styled
reading note plus a quiz — the way the Python Programming course was built.

This is the "heavy" sibling of the **populate-data** skill. Use populate-data
for small field patches; use this when you are authoring or rebuilding actual
learning material.

> Runs the same way as every data change: an **idempotent** Python script piped
> into the Django shell on the VM. Reuse the `dt_ssh` helper and `$DT_*`
> placeholders from the **deploy-backend** skill. No secrets in the repo.

## The content model (what you are building)

```
Tenant
  └─ Course            (code, name, description[HTML], pricing_*)
       └─ Subject      (code, name, color, weightage, order)
            └─ Chapter (code, name, order, estimated_hours)
                 └─ Topic         (code, name, difficulty, importance, order)
                      ├─ Content   (reading notes / videos)  content_type="notes"|"video"
                      ├─ Quiz + Question + QuestionOption + QuizQuestion
                      ├─ Assignment (optional)
                      └─ CodingProblem (optional; attaches to Topic directly)
```

Key relationships & rules:
- A **Chapter** links to its **Topics** through a `ChapterTopic` join row
  (`tenant`, `chapter`, `topic`, `order`). One topic can be reused across
  chapters via separate join rows.
- **Content**, **Quiz/Question**, **Assignment** are scoped by `topic`; also set
  `subject=` and add the `course` via the `.courses` M2M so they show in the
  course.
- **CodingProblem** references the `Topic` directly — so **never delete a Topic**
  that owns coding problems; reuse its `code`.
- Everything student-visible must be `status="published"`. Set `is_free=True` on
  free preview content.
- Everything must carry the correct `tenant`.

Imports you will typically need:

```python
from django.db import transaction
from core.models import Tenant
from exams.models import Course, Subject, Chapter, Topic, ChapterTopic
from content.models import Content
from quiz.models import Quiz, Question, QuestionOption, QuizQuestion
# optional:
# from exams.models import Assignment, CodingProblem   # confirm exact import paths in models
```

## Structured reading notes — the render helpers

Notes are stored as **self-contained HTML** in `Content.content_html` and render
through the viewer's raw-HTML + Tailwind `prose` path. To keep every note
consistent and beautiful, **don't hand-write tags** — describe each note as a
list of `(kind, payload)` blocks and let small helpers emit inline-styled HTML.
This is the proven pattern from the Python course.

```python
def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def lead(t):  # intro paragraph
    return '<p style="font-size:1.12rem;line-height:1.7;color:#334155;margin:0 0 18px">%s</p>' % t

def h(t):     # section heading with accent bar
    return ('<h3 style="font-size:1.25rem;font-weight:700;color:#0f172a;margin:26px 0 10px;'
            'padding-left:12px;border-left:4px solid #3776AB">%s</h3>' % t)

def p(t):
    return '<p style="line-height:1.75;color:#334155;margin:12px 0">%s</p>' % t

def ul(items):
    lis = "".join('<li style="margin:6px 0;line-height:1.65">%s</li>' % i for i in items)
    return '<ul style="margin:12px 0;padding-left:22px;color:#334155">%s</ul>' % lis

def code(snippet):  # dark code block
    return ('<pre style="background:#0f172a;color:#e2e8f0;padding:16px 18px;border-radius:12px;'
            'overflow-x:auto;font-size:0.9rem;line-height:1.65;margin:16px 0">'
            '<code style="background:none;color:inherit;padding:0;'
            'font-family:ui-monospace,Menlo,Consolas,monospace">%s</code></pre>' % esc(snippet))

_CALLOUT = {
    "key":     ("#4f46e5", "#eef2ff", "&#128204;", "Key idea"),
    "tip":     ("#059669", "#ecfdf5", "&#128161;", "Tip"),
    "warn":    ("#d97706", "#fffbeb", "&#9888;&#65039;", "Watch out"),
    "example": ("#0284c7", "#f0f9ff", "&#129504;", "Example"),
    "recap":   ("#7c3aed", "#f5f3ff", "&#127919;", "Recap"),
}

def callout(kind, body, title=None):
    accent, bg, emoji, default_title = _CALLOUT[kind]
    return ('<div style="border-left:4px solid %s;background:%s;padding:14px 16px;border-radius:10px;'
            'margin:20px 0"><div style="font-weight:700;color:%s;margin-bottom:6px">%s&nbsp;&nbsp;%s</div>'
            '<div style="color:#334155;line-height:1.7">%s</div></div>'
            % (accent, bg, accent, emoji, title or default_title, body))

def table(headers, rows):
    th = "".join('<th style="text-align:left;padding:10px 12px;background:#3776AB;color:#fff">%s</th>' % x for x in headers)
    trs = []
    for ri, row in enumerate(rows):
        bg = "#f8fafc" if ri % 2 else "#ffffff"
        tds = "".join('<td style="padding:9px 12px;border-top:1px solid #e2e8f0;color:#334155">%s</td>' % c for c in row)
        trs.append('<tr style="background:%s">%s</tr>' % (bg, tds))
    return ('<div style="overflow-x:auto;margin:16px 0"><table style="border-collapse:collapse;width:100%%;'
            'border-radius:10px;overflow:hidden"><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>'
            % (th, "".join(trs)))

def render(blocks):
    out = []
    for kind, payload in blocks:
        if   kind == "lead": out.append(lead(payload))
        elif kind == "h":    out.append(h(payload))
        elif kind == "p":    out.append(p(payload))
        elif kind == "ul":   out.append(ul(payload))
        elif kind == "code": out.append(code(payload))
        elif kind == "table":out.append(table(payload[0], payload[1]))
        elif kind == "callout":
            out.append(callout(payload[0], payload[1], payload[2] if len(payload) > 2 else None))
    return "".join(out)
```

## Describe the curriculum as data

Keep the whole course as one declarative structure. Each topic carries its note
(as blocks) and its quiz (as tuples), so the builder loop stays generic.

```python
CURRICULUM = [
    {
        "chapter": "Getting Started", "code": "unit-1",
        "topics": [
            {
                "name": "First Topic", "code": "first-topic", "difficulty": "easy",
                "note_title": "Understanding the First Topic",
                "note": [
                    ("lead", "A one-sentence hook that frames the topic."),
                    ("h", "A section heading"),
                    ("p", "Explanatory paragraph. Inline HTML like <code>x = 5</code> is fine."),
                    ("code", "x = 5\nprint(x)"),
                    ("callout", ("tip", "A helpful aside.")),
                    ("table", (["Col A", "Col B"], [["a1", "b1"], ["a2", "b2"]])),
                    ("callout", ("recap", "One-paragraph recap of the key points.")),
                ],
                # quiz: (question, options[], correct_index, explanation)
                "quiz": [
                    ("What is 2 + 3?", ["4", "5", "6", "7"], 1, "Basic arithmetic."),
                ],
            },
        ],
    },
]
```

## The idempotent builder loop

The critical part: **match by `(subject, code)`, update in place, rebuild only
what has no student data.** This is what makes the script safe to re-run.

```python
TENANT_NAME = "Test Academy"
COURSE_CODE = "your-course-code"

tenant = Tenant.objects.filter(name=TENANT_NAME).first(); assert tenant
course = Course.objects.filter(code=COURSE_CODE, tenant=tenant).first(); assert course

@transaction.atomic
def run():
    subject = course.subjects.first() or Subject.objects.create(
        tenant=tenant, course=course, name="Core", code="core", order=0)

    counts = {"chapters": 0, "topics": 0, "notes": 0, "quizzes": 0, "questions": 0}
    target_chapter_codes = {c["code"] for c in CURRICULUM}

    # Rebuild chapter->topic links cleanly (safe: does NOT cascade to coding problems).
    ChapterTopic.objects.filter(chapter__subject=subject).delete()

    for ci, ch in enumerate(CURRICULUM):
        chapter, _ = Chapter.objects.get_or_create(
            subject=subject, code=ch["code"],
            defaults={"tenant": tenant, "name": ch["chapter"], "order": ci})
        if chapter.name != ch["chapter"] or chapter.order != ci:
            chapter.name, chapter.order = ch["chapter"], ci
            chapter.save(update_fields=["name", "order"])
        counts["chapters"] += 1

        for ti, t in enumerate(ch["topics"]):
            topic, _ = Topic.objects.get_or_create(
                subject=subject, code=t["code"],
                defaults={"tenant": tenant, "name": t["name"],
                          "difficulty": t["difficulty"], "order": ti})
            ChapterTopic.objects.create(tenant=tenant, chapter=chapter, topic=topic, order=ti)
            counts["topics"] += 1

            # --- Reading note: update in place if it exists, else create
            html = render(t["note"])
            note = Content.objects.filter(topic=topic, content_type="notes").first()
            if note:
                note.title, note.content_html, note.status = t["note_title"], html, "published"
                note.save()
            else:
                note = Content.objects.create(
                    tenant=tenant, topic=topic, subject=subject, title=t["note_title"],
                    content_type="notes", material_kind="study", content_html=html,
                    status="published", is_free=True, order=0)
            note.courses.add(course)
            counts["notes"] += 1

            # --- Quiz: only rebuild when there are NO attempts (else you'd wipe history)
            if not Quiz.objects.filter(topic=topic).exists() or \
               not Question.objects.filter(topic=topic).exists():
                Question.objects.filter(topic=topic).delete()  # cascades options + links
                Quiz.objects.filter(topic=topic).delete()
                qd = t["quiz"]
                quiz = Quiz.objects.create(
                    tenant=tenant, course=course, subject=subject, topic=topic,
                    title="%s Quiz" % t["name"], quiz_type="topic", status="published",
                    duration_minutes=10, is_free=True)
                for qi, (qtext, opts, correct, expl) in enumerate(qd):
                    question = Question.objects.create(
                        tenant=tenant, topic=topic, subject=subject, question_text=qtext,
                        question_type="mcq", difficulty=t["difficulty"], status="published",
                        correct_answer=str(correct), explanation=expl)
                    question.courses.set([course])
                    for oi, otext in enumerate(opts):
                        QuestionOption.objects.create(
                            tenant=tenant, question=question, option_text=otext,
                            is_correct=(oi == correct), order=oi)
                    QuizQuestion.objects.create(tenant=tenant, quiz=quiz, question=question, order=qi)
                    counts["questions"] += 1
                counts["quizzes"] += 1

    # Remove stale empty chapters no longer in the curriculum.
    Chapter.objects.filter(subject=subject).exclude(code__in=target_chapter_codes).delete()
    print("OK", course.name, counts)

run()
```

## Workflow

1. **Confirm the course row exists** (create it via the admin UI or a small
   `populate-data` script first — set `code`, `name`, `description`, pricing).
2. **Write the builder script** in `files/` using the template above. Validate:
   `python3 -m py_compile build_<course>.py`.
3. **Run it on the VM** (idempotent):
   ```bash
   dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose exec -T web python manage.py shell" \
     < build_<course>.py 2>&1 | grep -vE 'objects imported'
   ```
   Read the printed `COUNTS`.
4. **Verify** the curriculum through the course-detail API (per-chapter
   content-type counts should reflect what you created):
   ```bash
   curl -s -H "X-Tenant-ID: $DT_TENANT_ID" "$DT_API_URL/api/v1/courses/<code>/" | head -c 600
   ```
5. **Re-run freely** — the script is idempotent; edit notes/quizzes and run
   again to update in place.

## Authoring guidance for great notes

- Open every note with a `lead` hook, then alternate `h` sections with `p`,
  `code`, `table`, and `callout` blocks. Close with a `recap` callout.
- Prefer **short paragraphs + one idea per section**. Use `table` for
  comparisons, `code` for anything runnable, callouts to break rhythm.
- Use the five callout kinds intentionally: `key`, `tip`, `warn`, `example`,
  `recap`.
- Keep inline HTML (`<code>`, `<b>`, `<i>`) inside block payloads — the helpers
  don't escape those (only `code()` escapes its snippet).
- Aim for a consistent note length across a course so the reading experience
  feels even.

## Guardrails

- **Never delete a Topic** that owns coding problems — reuse its `code`.
- **Don't wipe a quiz that has attempts.** The template only rebuilds quizzes
  with no existing attempts/questions; keep that guard.
- **Always set `tenant`** on every created row, and add `course` via
  `.courses.add()` / `.courses.set()`.
- **Wrap in `@transaction.atomic`** so a failure rolls back cleanly.
- Confirm exact model field names / import paths against the current
  `backend/*/models.py` before a first run — the platform evolves.
- No local DB; validate with `py_compile`, run on the VM. Never commit keys,
  hosts, or tenant IDs.
