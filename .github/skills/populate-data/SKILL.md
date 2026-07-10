---
name: populate-data
description: How to populate, backfill or update DailyTaiyari production data safely (e.g. adding course descriptions, marking courses paid, seeding pricing/highlights, fixing field values in bulk). Use whenever data needs to change in the production database via a one-off, idempotent Django-shell script run on the VM — as opposed to code/schema changes (which go through migrations) or full course authoring (see the create-course skill).
---

# Populate Data (DailyTaiyari)

Runbook for making **data** changes to production — not schema, not code. Use it
when the model already supports what you need and you just have to set/patch
values (descriptions, pricing, flags, ordering, copy) across existing rows.

The production Postgres (Azure) is only reachable **from the VM**. So every data
change is a small, idempotent Python script piped into the Django shell inside
the `web` container. There is no local database.

> **When NOT to use this skill:**
> - Changing a model field / adding a column → that is a **migration** (code
>   change → PR → `deploy-backend` skill applies it).
> - Building a whole course with chapters, notes and quizzes → use the
>   **create-course** skill (a richer, structured variant of this pattern).

> This guide contains **no secrets**. Reuse the connection setup and the
> `dt_ssh` helper from the **deploy-backend** skill (`$DT_SSH_KEY`,
> `$DT_VM_USER`, `$DT_VM_HOST`, `$DT_APP_DIR`). Never commit keys, hosts or
> tenant IDs.

## The golden rules

1. **Idempotent.** A script must be safe to run twice. Use `get_or_create` /
   `update_or_create`, match rows by a stable key (code / slug), and set values
   rather than blindly appending. Re-running should produce the same end state.
2. **Match on stable keys, not display names.** Prefer `code` / `slug` /
   UUID `id`. Fall back to a name heuristic only as a safety net (see below) —
   names get edited, codes rarely do.
3. **Tenant-scoped.** This is multi-tenant. Almost every row belongs to a
   `Tenant`. When creating rows, always set `tenant=`; when querying, filter by
   tenant if the same code can exist under multiple tenants. Test Academy is the
   primary tenant (`Tenant.objects.filter(name="Test Academy")`).
4. **Print a summary.** End every script with a count + a list of what changed,
   so a green run visibly proves what it did.
5. **Dry-run first when unsure.** Wrap writes in a `DRY_RUN` flag and print the
   intended changes before committing (see the template).

## 1. Write the script locally

Put the script in the session `files/` folder (or anywhere out of the repo — it
is an operational artifact, not app code). Validate syntax without a database:

```bash
python3 -m py_compile my_backfill.py
```

### Template (idempotent, tenant-aware, dry-runnable)

```python
"""Short description of what this backfills. Idempotent; safe to re-run.

Run on the VM:
    sudo docker compose exec -T web python manage.py shell < my_backfill.py
"""
import os
from decimal import Decimal
from core.models import Tenant
from exams.models import Course

DRY_RUN = os.environ.get("DRY_RUN") == "1"

tenant = Tenant.objects.filter(name="Test Academy").first()
assert tenant, "tenant not found"

# Keyed by a STABLE key (course code), not the display name.
CHANGES = {
    "python-programming": {"pricing_type": "paid", "price": Decimal("2999")},
    "jee-mains":          {"pricing_type": "paid", "price": Decimal("4999")},
}

updated = []
for course in Course.objects.filter(tenant=tenant):
    key = (course.code or "").strip().lower()
    fields = CHANGES.get(key)
    if not fields:
        continue
    changed = [f for f, v in fields.items() if getattr(course, f) != v]
    if not changed:
        continue
    for f, v in fields.items():
        setattr(course, f, v)
    if not DRY_RUN:
        course.save(update_fields=changed)
    updated.append(f"{course.name} [{course.code}] -> {', '.join(changed)}")

print(("DRY-RUN " if DRY_RUN else "") + "Updated %d row(s):" % len(updated))
for line in updated:
    print("  -", line)
```

### Name-heuristic fallback (optional safety net)

Course codes sometimes differ from what you expect (hyphens vs underscores,
legacy codes). If matching by code can miss rows, add a fallback that infers the
target from the name — this is exactly what saved the pricing seed once:

```python
if fields is None:
    name = (course.name or "").lower()
    if "python" in name:
        fields = CHANGES["python-programming"]
    elif "jee" in name:
        fields = CHANGES["jee-mains"]
```

## 2. Dry-run on the VM (recommended for anything destructive)

```bash
dt_ssh "cd $DT_APP_DIR/backend && DRY_RUN=1 sudo docker compose exec -T -e DRY_RUN=1 web python manage.py shell" \
  < my_backfill.py 2>&1 | grep -vE 'objects imported'
```

Read the printed plan. If it matches your intent, run for real (next step).

## 3. Run for real on the VM

Pipe the script into the Django shell in the `web` container. Always strip the
noisy `"N objects imported automatically"` banner:

```bash
dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose exec -T web python manage.py shell" \
  < my_backfill.py 2>&1 | grep -vE 'objects imported'
```

The summary you printed in step 1 is your confirmation.

## 4. Verify via the API

Spot-check that the change is live through the public API (tenant header
required):

```bash
curl -s -H "X-Tenant-ID: $DT_TENANT_ID" "$DT_API_URL/api/v1/courses/" | head -c 400
```

Confirm the new values (price, description snippet, flag) appear in the payload.

## Common recipes

- **Bulk-set a flag / field** → the template above; list the target codes and
  the fields to set.
- **Rich HTML copy** (course/topic descriptions that render as HTML): store the
  HTML in a Python triple-quoted string keyed by code, `.strip()` it, assign to
  the field. The frontend renders it through the raw-HTML path. For heavily
  styled notes, use the inline-style helper approach from the **create-course**
  skill instead of hand-writing tags.
- **Pricing fields** on `Course`: `pricing_type` (`free`/`paid`), `price`,
  `original_price` (for the struck-through "was" price), `currency` (`INR`),
  plus `subtitle`, `highlights` (list), `refund_policy`.
- **Reordering** → set an integer `order` field per row and `save(update_fields=["order"])`.

## Guardrails

- **Never `.delete()` broadly.** Only delete rows you created and fully
  understand the cascade of. Deleting a `Topic` can orphan coding problems;
  deleting a `Question` cascades its options and quiz links. When in doubt,
  update instead of delete.
- **No local DB.** Validate only with `python3 -m py_compile`; all execution is
  on the VM.
- **One tenant at a time** unless the change is genuinely global — filter by
  tenant so you don't touch another academy's data.
- **Keep the script.** Save it under `files/` so the next backfill has a
  working, proven template to copy.
- Never commit the SSH key, host, or tenant IDs to the repo.
