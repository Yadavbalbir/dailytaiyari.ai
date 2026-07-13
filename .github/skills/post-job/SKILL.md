---
name: post-job
description: How to add a job, internship or hackathon posting to the DailyTaiyari jobs portal via an idempotent Django-shell script run on the production VM. Use whenever someone shares a role (a company posting, an internship, a hackathon, or an internally-managed opening) to publish on the client's job board — as opposed to code/schema changes (migrations → deploy-backend), bulk field backfills (populate-data), or course authoring (create-course).
---

# Post Job (DailyTaiyari)

Runbook for adding a single opening to the **jobs portal**. A posting is one
`Job` row scoped to a tenant. Like all production data changes it is a small,
**idempotent** Python script piped into the Django shell inside the `web`
container on the VM — the production Postgres (Azure) is only reachable from the
VM, and there is no local database.

> This is a focused, job-specific variant of the **populate-data** skill. When
> you just need to publish a role someone pasted in chat, use this. For anything
> broader (bulk edits, other models) fall back to **populate-data**.

> This guide contains **no secrets**. Reuse the `dt_ssh` helper and connection
> placeholders (`$DT_SSH_KEY`, `$DT_VM_USER`, `$DT_VM_HOST`, `$DT_APP_DIR`) from
> the **deploy-backend** skill. Never commit keys, hosts or tenant IDs.

## The golden rules

1. **Idempotent.** Match on a stable key so re-running updates instead of
   duplicating. For **external** postings the natural key is `external_url`; use
   `Job.objects.update_or_create(tenant=tenant, external_url=URL, defaults=…)`.
   For **internal** postings (no URL) match on `(tenant, title)`.
2. **Tenant-scoped.** Every job belongs to a `Tenant`. The client's primary
   tenant is **`DailyTaiyari`** (`Tenant.objects.filter(name="DailyTaiyari")`).
   ⚠️ It was **renamed from "Test Academy"** — older scripts that hardcode
   `name="Test Academy"` will now fail with *tenant not found*. Always
   `assert tenant` before creating.
3. **Publish it.** Set `status='published'` so students actually see it. Drafts
   are invisible on the board.
4. **No company field — put the company in the title + description.** There is
   no `company` column. Convention: `"<Role> — <Company>"` for the title (e.g.
   `"Software Development Engineer (SDE) — Amazon"`), and repeat the company in
   the description's "Quick facts".
5. **Print a summary.** End the script by printing CREATED/UPDATED + id,
   category, type, status and URL, so a green run proves what it did.

## The Job model (what you're filling in)

`backend/jobs/models.py` → `Job`. Fields you'll set on a posting:

| Field             | Choices / notes |
|-------------------|-----------------|
| `title`           | `"<Role> — <Company>"`. Required. |
| `job_type`        | `internal` (full pipeline on-platform) or **`external`** (links out via `external_url`). Most shared roles are `external`. |
| `category`        | **`job`** · **`internship`** · **`hackathon`** — drives the board's tabs/filters. Default `job`. |
| `employment_type` | `full_time` · `part_time` · `internship` · `contract` · `temporary`. |
| `work_mode`       | `onsite` · `remote` · `hybrid`. Default `onsite`. |
| `location`        | Free text, e.g. `"Bengaluru, India"`. |
| `department`      | Optional free text. |
| `experience_min` / `experience_max` | Years (small ints), optional. |
| `salary_min` / `salary_max` | Ints, optional. `salary_currency` default `INR`, `salary_period` default `year`. |
| `description`     | **Rich HTML** — the same editor used across the app. See conventions below. |
| `requirements`    | **Rich HTML** — Requirements / Preferred lists. |
| `external_url`    | The apply link for external postings (also the idempotency key). |
| `openings`        | Default 1. |
| `deadline`        | Optional `DateTimeField`. |
| `status`          | `draft` · **`published`** · `closed` · `archived`. Publish to make it live. |

Pick the trio deliberately:

- **Company job** → `category='job'`, `employment_type='full_time'` (or the real type).
- **Internship** → `category='internship'`, `employment_type='internship'`.
- **Hackathon** → `category='hackathon'`.

## Rich-HTML conventions

Keep it clean and consistent with existing postings:

- `<h3>` for the "Company — Role" heading, `<h4>` for section headings.
- A **Quick facts** `<ul>` (Company, Role, Job ID, Compensation, Location).
- `<ul>` bullet lists for responsibilities / requirements / preferred.
- Escape entities: `&#8377;` for ₹, `&amp;` for &, `&mdash;` for —.
- End the description with a call to Apply (the button uses `external_url`).

Split content across the two fields: **`description`** = about/role/
responsibilities, **`requirements`** = Requirements + Preferred/Good-to-have.

## Template (idempotent, external posting)

Write it in the session `files/` folder (operational artifact, not app code) and
syntax-check locally — there is no local DB:

```bash
python3 -m py_compile post_job_<company>.py
```

```python
"""Publish a single external job posting. Idempotent; safe to re-run.

Run on the VM (see 'Run it' below):
    sudo docker compose exec -T web python manage.py shell < post_job_<company>.py
"""
from core.models import Tenant
from jobs.models import Job

tenant = Tenant.objects.filter(name="DailyTaiyari").first()
assert tenant, "tenant not found"

URL = "https://example.com/careers/12345"  # apply link + idempotency key

DESCRIPTION = """
<h3>Company &mdash; Role Title</h3>
<p><strong>Company</strong> is hiring a <strong>Role Title</strong> to …</p>
<h4>Quick facts</h4>
<ul>
  <li><strong>Company:</strong> Company</li>
  <li><strong>Role:</strong> Role Title</li>
  <li><strong>Job ID:</strong> 12345</li>
  <li><strong>Compensation:</strong> ~&#8377;20 LPA (varies by offer/location)</li>
  <li><strong>Location:</strong> City, India</li>
</ul>
<h4>Responsibilities</h4>
<ul>
  <li>…</li>
</ul>
<p>Click <strong>Apply</strong> to complete your application on the official careers site.</p>
"""

REQUIREMENTS = """
<h4>Requirements</h4>
<ul>
  <li>…</li>
</ul>
<h4>Preferred</h4>
<ul>
  <li>…</li>
</ul>
"""

defaults = {
    "title": "Role Title — Company",
    "job_type": "external",
    "category": "job",            # job | internship | hackathon
    "employment_type": "full_time",  # full_time | part_time | internship | contract | temporary
    "work_mode": "onsite",        # onsite | remote | hybrid
    "location": "City, India",
    "description": DESCRIPTION.strip(),
    "requirements": REQUIREMENTS.strip(),
    "experience_min": 1,          # omit if not stated
    "openings": 1,
    "status": "published",
}

job, created = Job.objects.update_or_create(
    tenant=tenant, external_url=URL, defaults=defaults,
)
print(("CREATED" if created else "UPDATED"), "job id=", job.id)
print("  title   :", job.title)
print("  category:", job.category, "| type:", job.job_type, "|", job.employment_type, "|", job.status)
print("  location:", job.location, "| exp_min:", job.experience_min)
print("  url     :", job.external_url)
print("  tenant  :", tenant.name)
```

### Internal posting (no external URL)

For a role whose hiring pipeline is managed on-platform, drop `external_url`,
set `job_type='internal'`, and match on `(tenant, title)`:

```python
job, created = Job.objects.update_or_create(
    tenant=tenant, title="Role Title — Company",
    defaults={..., "job_type": "internal", "status": "published"},
)
```

## Run it on the VM

Pipe the script straight into the shell (heredoc keeps it a one-liner; the
`grep -v` strips the shell's import banner):

```bash
dt_ssh 'cd $DT_APP_DIR/backend && sudo docker compose exec -T web python manage.py shell' \
  < post_job_<company>.py 2>&1 | grep -vE 'objects imported'
```

Or inline with a quoted heredoc when you don't want a file:

```bash
dt_ssh 'cd ~/dailytaiyari.ai/backend && sudo docker compose exec -T web python manage.py shell' <<'PY' 2>&1 | grep -vE 'objects imported'
from core.models import Tenant
from jobs.models import Job
tenant = Tenant.objects.filter(name="DailyTaiyari").first()
assert tenant, "tenant not found"
# … build defaults and update_or_create as above …
PY
```

> Use a literal `~` (or `$DT_APP_DIR`) **inside the single-quoted remote
> command** so it expands on the VM, not locally.

## Verify

- The summary line prints **CREATED** (first run) or **UPDATED** (re-run) — a
  re-run must never duplicate.
- Confirm it's on the board and in the right tab (its `category`). Quick count:

```bash
dt_ssh 'cd ~/dailytaiyari.ai/backend && sudo docker compose exec -T web python manage.py shell' <<'PY' 2>&1 | grep -vE 'objects imported'
from core.models import Tenant
from jobs.models import Job
t = Tenant.objects.get(name="DailyTaiyari")
for j in Job.objects.filter(tenant=t).order_by('-created_at')[:10]:
    print(j.status, j.category, "|", j.title)
PY
```

No deploy/restart is needed — this is data, not code. The change is live as soon
as the script commits.

## Guardrails

- **Never invent an apply link.** Use exactly the URL that was shared. If none
  was given, either make it `internal` or ask.
- **Don't downgrade a live posting.** `update_or_create` overwrites `defaults`
  on re-run, so keep `status='published'` (and any manual edits) in the script,
  or you'll silently revert them.
- **Categorise correctly** — an internship posted as `category='job'` won't show
  under the Internship tab. Match `category` to what the role actually is.
- **Sanitise pasted HTML/markdown.** Convert `**bold**`/`* bullets` from chat
  into real `<strong>` / `<ul><li>` so it renders, and escape `₹`, `&`, `<`.
