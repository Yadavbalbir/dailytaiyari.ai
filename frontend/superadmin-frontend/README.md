# DailyTaiyari — Super Admin

A dedicated, standalone frontend for the **platform super admin** (a Django
superuser). It is the only portal from which the whole platform can be
overseen: view every tenant, see a full picture of the platform, create new
tenants, and manage existing ones (branding, subdomain, theme, active status
and per-feature toggles).

> **Access is restricted to Django superusers** (`is_superuser=True`,
> tenant-less accounts). Tenant admins, faculty and students cannot log in here.
> The backend enforces this on every endpoint via `IsSuperAdmin`.

## Tech stack

React 18 · Vite · Tailwind CSS · Zustand · React Router · Axios ·
react-hot-toast · lucide-react.

## Local development

```bash
npm install
npm run dev          # http://localhost:3100
```

The dev server proxies `/api` to `http://localhost:8000` (the Django backend).
Make sure the backend is running and `localhost` is in its `ALLOWED_HOSTS`.

Create a super admin if you don't have one:

```bash
cd ../../backend
python manage.py createsuperuser
```

## Configuration

Copy `.env.example` to `.env` and set `VITE_API_URL` for non-proxied
deployments (e.g. `https://api.dailytaiyari.in/api/v1`). Leave it empty in local
dev to use the Vite proxy.

## Backend API

All endpoints live under `/api/v1/superadmin/` (tenant-exempt — no
`X-Tenant-ID` header needed):

| Method | Path | Purpose |
|--------|------|---------|
| POST   | `auth/login/`        | Super-admin login → JWT |
| GET    | `auth/me/`           | Current super admin |
| GET    | `stats/`             | Platform-wide roll-up numbers |
| GET    | `tenants/`           | List tenants (with counts); `?search=&is_active=` |
| POST   | `tenants/`           | Create a tenant |
| GET    | `tenants/{id}/`      | Tenant detail |
| PATCH  | `tenants/{id}/`      | Update a tenant |

## Build

```bash
npm run build        # outputs to dist/
```

Deploys as a static site (see `netlify.toml`).
