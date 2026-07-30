# Branching Strategy

DailyTaiyari runs **two long-lived environments** from a **single repository**.
Changes always flow one direction: feature → pre-prod → prod. This guarantees
nothing reaches production without first being tested on pre-prod.

```
feature/*  ─PR─►  main  ──promote──►  production
 (work)         (pre-prod)             (prod)
                api.dailytaiyari.in    api-prod.dailytaiyari.in
```

## Long-lived branches

| Branch        | Environment | Host                        | Deploys when            |
| ------------- | ----------- | --------------------------- | ----------------------- |
| `main`        | Pre-prod    | `api.dailytaiyari.in`       | every merge to `main`   |
| `production`  | Prod        | `api-prod.dailytaiyari.in`  | after a promotion merge |

Short-lived work branches (`feature/*`, `fix/*`, `chore/*`) exist only until
their PR is squash-merged into `main`, then are deleted.

## Everyday flow

1. **Branch** off `main`:
   ```bash
   git checkout main && git pull --ff-only
   git checkout -b feature/<short-name>
   ```
2. **Build**, commit, push, open a **PR into `main`**.
3. **Squash-merge** the PR once reviewed and CI is green.
4. **Deploy `main` to pre-prod** and test live on `api.dailytaiyari.in`
   (see [deployment.md](./deployment.md)).
5. When satisfied, **promote to production** (below).

## Promotion (main → production)

Production only ever moves forward to an already-tested `main`. Promote with a
fast-forward-only merge so `production` is always a subset of `main`:

```bash
git checkout production
git pull --ff-only
git merge --ff-only origin/main
git push origin production
git tag -a prod-$(date +%Y.%m.%d) -m "Prod deploy <summary>"
git push origin --tags
```

Then run the prod deploy (see [deployment.md](./deployment.md)).

> Tag every prod deploy (`prod-YYYY.MM.DD`). Tags are your rollback points —
> to roll back, deploy the previous tag.

## Hotfixes (urgent prod fix)

1. Branch off `production`: `git checkout -b fix/<name> production`.
2. Fix, PR **into `production`**, review, merge, deploy prod.
3. **Back-merge** so pre-prod doesn't regress:
   ```bash
   git checkout main && git pull --ff-only
   git merge origin/production   # or cherry-pick the fix commit
   git push origin main
   ```

## Migrations

A DB migration merged to `main` runs on **pre-prod first** (each environment has
its own separate database). Confirm it applied cleanly on pre-prod before
promoting to `production`. Never point a migration at prod that hasn't run on
pre-prod.

## Branch protection (configured)

Both branches block force-pushes, block deletion, and require **linear
history**. They differ on how commits land:

- **`main`** — **PR required** (all real development lands via PR). No direct
  pushes; force-push and deletion blocked.
- **`production`** — **no PR requirement, but updated by fast-forward-only
  promotion only.** Force-push, deletion, and non-linear history are blocked.

> Why `production` isn't PR-gated: it is a long-lived branch that must stay a
> *true fast-forward* of `main`. Merging into it via PR (squash/rebase) rewrites
> commit SHAs, causing `production` to diverge from `main` and producing
> duplicate-commit conflicts on every future promotion. A plain `--ff-only`
> promotion push keeps `production` byte-identical to a tested `main`, which is
> exactly what we want (and what makes tag-based rollback reliable). The review
> gate already happened on `main`.

`enforce_admins` is intentionally **off** on both, leaving the maintainer an
emergency escape hatch. Turn it on if the team grows.

## Rules of thumb

- Never commit directly to `main` — always via PR.
- Only ever update `production` with a **fast-forward** from `main` (promotion)
  or a reviewed hotfix PR; never force-push it.
- Never merge `production → main` except when back-merging a hotfix.
- `production` is always fast-forwardable from `main` (never diverges except for
  in-flight hotfixes, which are back-merged immediately).
- One change, one PR, squash-merged — keeps history and rollbacks clean.
