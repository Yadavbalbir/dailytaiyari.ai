---
name: post-job
description: How to add a job, internship or hackathon posting to the DailyTaiyari jobs portal. Two ways: the preferred HTTP admin API (no SSH — just an admin token), or an idempotent Django-shell script on the VM. Use whenever someone shares a role (a company posting, an internship, a hackathon, or an internally-managed opening) to publish on the client's job board — as opposed to code/schema changes (migrations → deploy-backend), bulk field backfills (populate-data), or course authoring (create-course).
---

# Post Job (DailyTaiyari)

Runbook for adding a single opening to the **jobs portal**. A posting is one
`Job` row scoped to a tenant.

There are **two ways** to do it — pick based on what you have:

| Method | Use when | Needs |
|--------|----------|-------|
| **A. HTTP admin API** (preferred) | You have a tenant-admin **token**. No server access required. | Admin JWT + tenant id + `curl`/`requests` |
| **B. Django shell on the VM** | You have SSH access to the VM (no token needed). | VM SSH key + `dt_ssh` |

Both create the same `Job` row and are idempotent when you match on the
`external_url`. **Method A (API) is the default now** — it needs no VM login.

> This is a focused, job-specific variant of the **populate-data** skill. When
> you just need to publish a role someone pasted in chat, use this. For anything
> broader (bulk edits, other models) fall back to **populate-data**.

> This guide contains **no secrets**. Fill the placeholders from your own
> environment. Never commit tokens, keys, hosts or tenant IDs.
>
> | Placeholder        | Meaning                                             |
> |--------------------|-----------------------------------------------------|
> | `$DT_API_URL`      | Public API base, e.g. `https://api.dailytaiyari.in` |
> | `$DT_TENANT_ID`    | Tenant UUID for **DailyTaiyari** (the client)       |
> | `$DT_ADMIN_TOKEN`  | A tenant-admin **JWT access token** (method A)       |
> | `$DT_SSH_KEY` / `$DT_VM_USER` / `$DT_VM_HOST` / `$DT_APP_DIR` | VM access for method B (see **deploy-backend**) |

## Method A — HTTP admin API (no VM login)

The tenant admin API can create a job over HTTPS, so you never touch the server.

**Endpoint:** `POST $DT_API_URL/api/v1/jobs/admin/jobs/`
(the same `AdminJobViewSet` the admin dashboard's job builder uses).

**Auth & tenant — two required headers on every call:**

- `Authorization: Bearer $DT_ADMIN_TOKEN` — a JWT **access** token for a user
  whose `role == 'admin'` (SimpleJWT). This is the token the user shares.
- `X-Tenant-ID: $DT_TENANT_ID` — the tenant UUID. **Every** API request is
  tenant-scoped by middleware; without this header you get
  `403 X-Tenant-ID header is required`.

The server sets `tenant` and `created_by` itself from the token + header — you
**must not** (and cannot) send `tenant` in the body.

> **Getting a token if the user didn't paste one:** `POST $DT_API_URL/api/v1/auth/login/`
> with the `X-Tenant-ID` header and `{"email": "...", "password": "..."}`; the
> response's `access` field is `$DT_ADMIN_TOKEN`. (Login also needs the tenant
> header — it is not exempt.) Access tokens are short-lived; if you get a `401`,
> ask for a fresh token or re-login. Never hardcode credentials into the repo.

### Writable fields (JSON body)

The `AdminJobSerializer` accepts: `title`, `job_type`, `category`,
`department`, `location`, `work_mode`, `employment_type`, `experience_min`,
`experience_max`, `salary_min`, `salary_max`, `salary_currency`,
`salary_period`, `description`, `requirements`, `external_url`, `openings`,
`deadline`, `status`, and `related_course_ids` (list of course UUIDs). See the
field table below for choices. **Validation:** an `external` job requires
`external_url` (400 otherwise).

### Create with curl

```bash
curl -sS -X POST "$DT_API_URL/api/v1/jobs/admin/jobs/" \
  -H "Authorization: Bearer $DT_ADMIN_TOKEN" \
  -H "X-Tenant-ID: $DT_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Role Title — Company",
    "job_type": "external",
    "category": "job",
    "employment_type": "full_time",
    "work_mode": "onsite",
    "location": "City, India",
    "experience_min": 1,
    "external_url": "https://example.com/careers/12345",
    "description": "<h3>Company — Role Title</h3><p>…</p>",
    "requirements": "<h4>Requirements</h4><ul><li>…</li></ul>",
    "openings": 1,
    "status": "published"
  }'
```

A `201` with the created job JSON (including its `id`) means success.

### Idempotent create-or-update over the API (recommended)

A bare `POST` makes a **new** row every time. To be safe to re-run, first look
for an existing posting with the same `external_url` and `PATCH` it; otherwise
`POST`. This little Python script does exactly that:

```python
"""Publish/refresh one external job via the admin API. Idempotent.

Env: DT_API_URL, DT_TENANT_ID, DT_ADMIN_TOKEN
"""
import os, requests

API   = os.environ["DT_API_URL"].rstrip("/")
H = {
    "Authorization": f"Bearer {os.environ['DT_ADMIN_TOKEN']}",
    "X-Tenant-ID":   os.environ["DT_TENANT_ID"],
    "Content-Type":  "application/json",
}
URL = "https://example.com/careers/12345"   # apply link + idempotency key

payload = {
    "title": "Role Title — Company",
    "job_type": "external",
    "category": "job",              # job | internship | hackathon
    "employment_type": "full_time", # full_time | part_time | internship | contract | temporary
    "work_mode": "onsite",          # onsite | remote | hybrid
    "location": "City, India",
    "experience_min": 1,            # omit if not stated
    "external_url": URL,
    "description": "<h3>Company — Role Title</h3><p>…</p>",
    "requirements": "<h4>Requirements</h4><ul><li>…</li></ul>",
    "openings": 1,
    "status": "published",
}

base = f"{API}/api/v1/jobs/admin/jobs/"
# Find an existing posting with this external_url (search + client-side match;
# the list is tenant-scoped by the X-Tenant-ID header).
existing = None
r = requests.get(base, headers=H, params={"page_size": 1000}); r.raise_for_status()
rows = r.json().get("results", r.json())
for j in rows:
    if j.get("external_url") == URL:
        existing = j; break

if existing:
    r = requests.patch(f"{base}{existing['id']}/", headers=H, json=payload)
    action = "UPDATED"
else:
    r = requests.post(base, headers=H, json=payload)
    action = "CREATED"
r.raise_for_status()
job = r.json()
print(action, job["id"], "|", job["category"], job["status"], "|", job["title"])
```

Run it locally — no VM, no Django, just network access to `$DT_API_URL`:

```bash
export DT_API_URL="https://api.dailytaiyari.in"
export DT_TENANT_ID="<dailytaiyari-tenant-uuid>"
export DT_ADMIN_TOKEN="<admin-jwt-access-token>"   # the token the user shares
python3 post_job_via_api.py
```

> **Tenant safety:** `$DT_TENANT_ID` must be the **DailyTaiyari** tenant (renamed
> from "Test Academy"). The token's admin user must belong to that tenant, or the
> API returns `403`. When unsure which UUID it is, method B can print it
> (`Tenant.objects.filter(name="DailyTaiyari")`), or read it from the admin app.

---

## The golden rules (both methods)

1. **Idempotent.** Match on a stable key so re-running updates instead of
   duplicating. For **external** postings the natural key is `external_url`
   (API: search the list + `PATCH`; shell: `update_or_create(external_url=…)`).
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

## Method B — Django shell on the VM

Use this when you have SSH access instead of a token. It is a small, idempotent
Python script piped into the Django shell inside the `web` container — the
production Postgres (Azure) is only reachable from the VM, and there is no local
database.

> Reuse the `dt_ssh` helper and connection placeholders (`$DT_SSH_KEY`,
> `$DT_VM_USER`, `$DT_VM_HOST`, `$DT_APP_DIR`) from the **deploy-backend** skill.

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

### Run it on the VM

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

- The result prints **CREATED** (first run) or **UPDATED** (re-run) — a re-run
  must never duplicate. (API: `201` = created, `200` = patched.)
- Confirm it's on the board and in the right tab (its `category`).

**Via API** (no VM):

```bash
curl -sS "$DT_API_URL/api/v1/jobs/admin/jobs/?page_size=10&ordering=-created_at" \
  -H "Authorization: Bearer $DT_ADMIN_TOKEN" -H "X-Tenant-ID: $DT_TENANT_ID" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); \
    [print(j["status"], j["category"], "|", j["title"]) for j in d.get("results", d)]'
```

**Via VM shell:**

```bash
dt_ssh 'cd ~/dailytaiyari.ai/backend && sudo docker compose exec -T web python manage.py shell' <<'PY' 2>&1 | grep -vE 'objects imported'
from core.models import Tenant
from jobs.models import Job
t = Tenant.objects.get(name="DailyTaiyari")
for j in Job.objects.filter(tenant=t).order_by('-created_at')[:10]:
    print(j.status, j.category, "|", j.title)
PY
```

No deploy/restart is needed either way — this is data, not code. The change is
live as soon as the request/script commits.

## Guardrails

- **Never invent an apply link.** Use exactly the URL that was shared. If none
  was given, either make it `internal` or ask.
- **Don't downgrade a live posting.** A re-run overwrites the fields you send, so
  keep `status='published'` (and any manual edits) in the payload, or you'll
  silently revert them. Send the full field set on an update, not a partial one
  that drops values.
- **Categorise correctly** — an internship posted as `category='job'` won't show
  under the Internship tab. Match `category` to what the role actually is.
- **Sanitise pasted HTML/markdown.** Convert `**bold**`/`* bullets` from chat
  into real `<strong>` / `<ul><li>` so it renders, and escape `₹`, `&`, `<`.
- **Treat the admin token as a secret.** Never commit `$DT_ADMIN_TOKEN`, never
  print it, and never paste it into the repo or a PR. Pass it via an env var for
  the single run. Tokens are short-lived — expect to refresh them.
