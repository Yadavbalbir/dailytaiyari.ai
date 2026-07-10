---
name: deploy-backend
description: How to deploy the DailyTaiyari Django backend to the production VM (Azure VM running Docker Compose). Use whenever changes have been merged to main and the backend needs to go live — pulling latest code, applying migrations, rebuilding on dependency changes, restarting the web container, and verifying. Frontend/landing deploy automatically via Netlify and are out of scope.
---

# Deploy Backend (DailyTaiyari)

Step-by-step guide for deploying the Django backend to the production VM. The
backend runs in Docker Compose on an Azure VM; the student app and landing page
deploy automatically via Netlify on merge and are **not** covered here.

> This guide contains **no secrets**. Fill in the placeholders below from your
> own environment (a local `.env`, your password manager, or shell exports).
> Never commit the SSH key, key path, host, or tenant IDs into the repo.

## 0. Configuration (fill these in — keep them out of git)

| Placeholder        | Meaning                                          | Example / where to get it            |
|--------------------|--------------------------------------------------|--------------------------------------|
| `$DT_SSH_KEY`      | Path to the VM SSH private key (`.pem`)          | `~/keys/dt-vm-key.pem`|
| `$DT_VM_USER`      | SSH user on the VM                               | the deploy user configured on the VM |
| `$DT_VM_HOST`      | VM hostname or static IP                         | the Azure VM public IP               |
| `$DT_APP_DIR`      | Repo checkout path on the VM                     | `~/dailytaiyari.ai`                  |
| `$DT_API_URL`      | Public API base URL                              | `https://api.dailytaiyari.in`        |
| `$DT_TENANT_ID`    | A tenant UUID (only for verifying tenant routes) | from the tenants table               |

Export them once per shell so the commands below copy-paste cleanly:

```bash
export DT_SSH_KEY="$HOME/keys/dt-vm-key.pem"
export DT_VM_USER="<vm-user>"
export DT_VM_HOST="<vm-host-or-ip>"
export DT_APP_DIR="~/dailytaiyari.ai"
export DT_API_URL="https://api.dailytaiyari.in"
```

A convenience wrapper for running a command on the VM:

```bash
dt_ssh() {
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=10 \
    -i "$DT_SSH_KEY" "$DT_VM_USER@$DT_VM_HOST" "$@"
}
```

> **Note:** SSH to the VM occasionally times out on the first attempt. If a
> command fails with `Operation timed out`, just retry it — it is transient.

## 1. Pre-flight: make sure there is something to deploy

Deploy only merged code. Confirm no open PRs are still expected to land, and
check what the VM is missing.

```bash
# From your local repo checkout:
GH_PAGER="" gh pr list --state open --json number,title,mergeStateStatus

# Latest commit on origin/main vs. what the VM currently runs:
git fetch -q origin && git --no-pager log --oneline -1 origin/main
dt_ssh "cd $DT_APP_DIR && git --no-pager log --oneline -1"
```

If the two HEADs already match, the backend is up to date — stop here.

Otherwise, inspect **what** changed so you know whether migrations or an image
rebuild are needed (replace `<VM_HEAD>` with the VM's current commit):

```bash
git --no-pager diff --name-only <VM_HEAD>..origin/main | grep '^backend/'          # backend changes?
git --no-pager diff --name-only <VM_HEAD>..origin/main | grep 'migrations/'         # new migrations?
git --no-pager diff <VM_HEAD>..origin/main -- backend/requirements.txt              # dependency changes?
```

Decision guide:
- **No `backend/` changes** → nothing to deploy on the VM (it was a frontend/landing PR; Netlify handles it).
- **Backend code only, no migrations, no dep changes** → pull + restart (steps 2, 5, 6).
- **New migration files** → pull + migrate the affected app(s) + restart (steps 2, 3, 5, 6).
- **`requirements.txt` (or other dependency) changes** → pull + **rebuild image** + migrate if needed + restart (steps 2, 4, 3, 6).

## 2. Pull the latest code on the VM

```bash
dt_ssh "cd $DT_APP_DIR && git pull --ff-only origin main"
```

Always use `--ff-only`. If it refuses to fast-forward, the VM has diverging
local changes — investigate before forcing anything; do **not** hard-reset or
force-pull without understanding why.

## 3. Apply database migrations (only if new migrations landed)

Migrate the specific app(s) whose migration files changed (e.g. `exams`,
`core`, `users`, `content`). Running per-app keeps output readable:

```bash
dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose exec -T web python manage.py migrate <app>"
```

Then confirm nothing is left pending across all apps:

```bash
dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose exec -T web python manage.py showmigrations | grep -E '\[ \]' || echo 'none pending'"
```

> The production Postgres (Azure) is only reachable from the VM — never from a
> local machine. All `migrate` / `showmigrations` / shell commands must run on
> the VM via `dt_ssh`.

## 4. Rebuild the image (only if dependencies changed)

If `requirements.txt` (or the Dockerfile / system deps) changed, the running
image is stale and a plain restart is not enough:

```bash
dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose build web && sudo docker compose up -d web"
```

(When you rebuild + `up -d`, you do not also need the restart in step 5.)

## 5. Restart the web container

For code-only or migration deploys (no image rebuild):

```bash
dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose restart web"
```

## 6. Verify the deploy

```bash
# Container is up:
dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose ps web"

# API is serving (expect 200):
curl -s -o /dev/null -w '%{http_code}\n' "$DT_API_URL/api/docs/"
```

For tenant-scoped endpoints, the API requires an `X-Tenant-ID` header, so a
bare `curl` returns `{"error": "X-Tenant-ID header is required."}` — that means
the API is up, not broken. To smoke-test an actual endpoint:

```bash
curl -s -H "X-Tenant-ID: $DT_TENANT_ID" "$DT_API_URL/api/v1/courses/" | head -c 300
```

If you deployed a specific feature, spot-check its endpoint returns the new
shape/fields.

## Running a data/one-off script on the VM

To run a Python snippet against production data (e.g. a data backfill), pipe it
into the Django shell in the container. Always strip the noisy
`"N objects imported automatically"` banner:

```bash
dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose exec -T web python manage.py shell" \
  < your_script.py 2>&1 | grep -vE 'objects imported'
```

Keep such scripts idempotent so they are safe to re-run.

## Troubleshooting

- **SSH `Operation timed out`** → transient; retry the command.
- **`git pull` won't fast-forward** → the VM has local commits/changes; inspect
  with `git status` on the VM before doing anything destructive.
- **500s after deploy** → check logs: `dt_ssh "cd $DT_APP_DIR/backend && sudo docker compose logs --tail=100 web"`.
- **New model fields not showing** → a migration probably wasn't applied; re-run
  step 3's `showmigrations` check.
- **Feature still missing after a green deploy** → confirm the PR actually
  merged to `main` and the VM's HEAD matches `origin/main` (step 1).

## Notes / conventions

- **Local machine has no Django/Postgres access.** Validate code locally only
  with `python3 -m py_compile <file>`; run `check` / `migrate` on the VM.
- **Frontend & landing page deploy via Netlify automatically on merge** — no VM
  action needed for those.
- The Compose services on the VM are typically: `web`, a `db`/`nginx` proxy,
  `piston` (code execution), plus any others defined in `docker-compose.yml`.
- Never commit the SSH key, its path, host IPs, or tenant IDs to the repo.
