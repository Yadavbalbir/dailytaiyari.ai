# Tenant Setup Guide

## Creating a New Tenant

### Via Django Admin

1. Start the backend server: `python manage.py runserver`
2. Go to [http://localhost:8000/admin/](http://localhost:8000/admin/)
3. Log in with a superuser account
4. Navigate to **CORE → Tenants → Add Tenant**
5. Fill in the details:
   - **Name**: Display name (e.g., "Apex Coaching Institute")
   - **Subdomain**: Unique slug (e.g., "apex") — reserved for future subdomain routing
   - **Logo**: Upload a logo image (PNG/JPG recommended)
   - **Is active**: Check to enable
6. Click **Save**
7. Copy the generated **UUID** — this is the Tenant ID

### Via Django Shell

```python
python manage.py shell

from core.models import Tenant

tenant = Tenant.objects.create(
    name="Apex Coaching Institute",
    subdomain="apex",
    is_active=True
)
print(f"Tenant ID: {tenant.id}")
# Output: Tenant ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Deploying a Frontend for a Tenant

Each tenant gets its own frontend deployment with a unique `.env` file:

```bash
# frontend/.env (or .env.production)
VITE_API_URL=https://api.dailytaiyari.ai/api/v1
VITE_TENANT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Deployment Steps

1. Clone the frontend repository
2. Create `.env` with the tenant's UUID as `VITE_TENANT_ID`
3. Build: `npm run build`
4. Deploy the `dist/` folder to your hosting (Vercel, Netlify, S3, etc.)

> **Important**: `VITE_TENANT_ID` is baked into the build at compile time. Each tenant deployment requires its own build.

### Multiple Tenants on One Domain (Future)

If you want to serve multiple tenants from a single deployment (e.g., via subdomains), you'll need to:
1. Read the tenant from the URL (e.g., `apex.dailytaiyari.ai`)
2. Call the `/api/v1/tenant/` endpoint to resolve the tenant ID
3. This is not yet implemented but the architecture supports it

---

## Assigning Existing Data to a Tenant

When migrating from a single-tenant to multi-tenant setup, existing data needs to be assigned:

```python
python manage.py shell

from core.models import Tenant

tenant = Tenant.objects.get(name="Apex Coaching Institute")

# Assign all unassigned exams, questions, etc.
from exams.models import Exam, Subject, Topic, Chapter
Exam.objects.filter(tenant__isnull=True).update(tenant=tenant)
Subject.objects.filter(tenant__isnull=True).update(tenant=tenant)
Topic.objects.filter(tenant__isnull=True).update(tenant=tenant)
Chapter.objects.filter(tenant__isnull=True).update(tenant=tenant)

# Repeat for all other models...
```

See [Data Migration Guide](./data-migration.md) for a complete script.

---

## Tenant Model Reference

| Field | Type | Description |
|---|---|---|
| `id` | UUID (auto) | Primary key, used as `X-Tenant-ID` |
| `name` | CharField(255) | Display name |
| `subdomain` | CharField(100) | Unique slug (nullable) |
| `logo` | ImageField | Tenant logo file (nullable) |
| `is_active` | BooleanField | Whether tenant is active (default: True) |
| `created_at` | DateTimeField | Auto-set on creation |
| `updated_at` | DateTimeField | Auto-set on update |
