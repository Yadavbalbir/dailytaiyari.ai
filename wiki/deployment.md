# Deployment Guide

How the DailyTaiyari backend is deployed and operated. The frontend (student
app) and landing site deploy automatically via Netlify and are out of scope
here.

> **No secrets in this doc.** IPs, SSH keys, DB credentials, storage keys and
> passwords live only on the VMs / in the secrets store — never in the repo.
> Placeholders like `<prod-vm-ip>` are used below.

## Environments

DailyTaiyari runs two independent backend environments. They share **no data**
and live in **separate Azure accounts / resource groups**.

| Aspect         | Pre-prod (testing)            | Prod                              |
| -------------- | ----------------------------- | --------------------------------- |
| Branch         | `main`                        | `production`                      |
| API hostname   | `api.dailytaiyari.in`         | `api-prod.dailytaiyari.in`        |
| Purpose        | Validate every merge          | Live customer traffic             |
| Database       | Its own Azure PostgreSQL      | Its own Azure PostgreSQL          |
| Media storage  | Its own Azure Blob container  | Its own Azure Blob container      |

See [branching-strategy.md](./branching-strategy.md) for how code flows between
them and [environment-variables.md](./environment-variables.md) for the full
list of required env keys.

## Architecture (per environment)

Each VM runs the same Docker Compose stack:

| Service        | Role                                            |
| -------------- | ----------------------------------------------- |
| `web`          | Django + Gunicorn (API)                         |
| `nginx`        | TLS termination + reverse proxy                 |
| `redis`        | Celery broker / cache                           |
| `celery-worker`| Async tasks (email, async code judging, etc.)   |
| `piston`       | Sandboxed code execution engine                 |

- **Database:** managed **Azure PostgreSQL Flexible Server** (SSL required). The
  `db` service in `docker-compose.yml` is unused in cloud deploys.
- **Media:** **Azure Blob Storage**, served as public blob URLs.
- **TLS:** Let's Encrypt certs per hostname, auto-renewed via a certbot deploy
  hook that reloads nginx.

## Configuration

All config is via `backend/.env` on the VM (never committed). Each environment
has its own `.env` with its own `SECRET_KEY`, DB, storage, and `ALLOWED_HOSTS` /
`CORS_ALLOWED_ORIGINS`. See [environment-variables.md](./environment-variables.md).

## Which branch each VM tracks

Each VM's checkout is pinned to its environment's branch, so a plain
`git pull --ff-only` always pulls the right code:

| VM        | Tracks branch |
| --------- | ------------- |
| Pre-prod  | `main`        |
| Prod      | `production`  |

One-time pin on the prod VM:

```bash
git fetch origin
git checkout production
git branch --set-upstream-to=origin/production
```

## Deploy procedure

SSH to the target VM (use that environment's key), then in the repo root:

```bash
# 1. Pull the environment's branch
git pull --ff-only

# 2a. Code-only change (no new deps, no migration):
docker compose restart web

# 2b. Dependency change (requirements/Dockerfile):
docker compose up -d --build web

# 2c. Migration in the release:
#     entrypoint.sh auto-runs migrate + collectstatic on web start,
#     so a rebuild/restart applies them. To run manually:
docker compose exec -T web python manage.py migrate
```

Deploy **pre-prod from `main`** first; deploy **prod from `production`** only
after promotion (see branching doc). The canonical, secret-aware runbook lives
in the `deploy-backend` skill under `.github/skills/`.

## Verify a deploy

```bash
# API docs should return 200 over HTTPS
curl -s -o /dev/null -w '%{http_code}\n' https://<hostname>/api/docs/

# Containers healthy
docker compose ps

# Recent logs if anything is off
docker compose logs web --tail=50
```

For prod, `<hostname>` is `api-prod.dailytaiyari.in`; for pre-prod,
`api.dailytaiyari.in`.

## TLS certificates

- Issued per hostname via certbot (`--standalone`; nginx must be stopped briefly
  to free port 80 on first issuance).
- A deploy hook reloads nginx automatically on renewal; no manual action needed.

## Rollback

Every prod deploy is tagged `prod-YYYY.MM.DD`. To roll back, check out the
previous tag on the prod VM and restart:

```bash
git checkout prod-<previous-date>
docker compose up -d --build web
```

If the bad release included a migration, assess whether it is
backward-compatible before rolling back the code.

## First-time environment provisioning

Standing up a brand-new environment (VM + Azure PostgreSQL + Blob + TLS + first
tenant/admin) is documented step-by-step in the `deploy-backend` and
`manage-tenants` skills under `.github/skills/`. High level:

1. Create RG, VM (x64), open ports 22/80/443.
2. Install Docker + Compose, clone the repo, check out the env branch.
3. Create Azure PostgreSQL Flexible Server + database; allow the VM IP; SSL on.
4. Create Storage account + `media` container (Blob public read).
5. Write `backend/.env`; bring up app services (without nginx) so migrations run.
6. Point DNS at the VM, issue Let's Encrypt cert, bring up nginx.
7. Create the first tenant + admin (see `manage-tenants`).
