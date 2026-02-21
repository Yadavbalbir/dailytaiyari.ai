# Environment Variables

## Backend — `backend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | Yes | — | Django secret key |
| `DEBUG` | No | `True` | Enable debug mode |
| `ALLOWED_HOSTS` | No | `localhost,127.0.0.1` | Comma-separated allowed hosts |
| `DATABASE_URL` | No | `sqlite:///db.sqlite3` | Database connection URL |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed CORS origins |
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for AI chatbot |

**Example:**
```bash
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
OPENAI_API_KEY=sk-...
```

### CORS Headers

The following custom headers are allowed through CORS (configured in `settings.py`):

```python
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-tenant-id',          # Multi-tenant header
]
```

> **Important:** If you add any new custom headers, you must also add them to `CORS_ALLOW_HEADERS`.

---

## Frontend — `frontend/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `/api/v1` | Base URL for API requests |
| `VITE_TENANT_ID` | Yes | — | UUID of the tenant this frontend serves |

**Example:**
```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_TENANT_ID=405223b1-7738-4b01-b405-9cbfecdd63a1
```

### Production Deployments

For production, create environment-specific `.env` files:

```bash
# .env.production
VITE_API_URL=https://api.dailytaiyari.ai/api/v1
VITE_TENANT_ID=<tenant-uuid>
```

Build with:
```bash
npm run build
```

> **Note:** Vite injects `VITE_*` variables at build time. Each tenant deployment requires its own build with a unique `VITE_TENANT_ID`.

---

## Adding New Environment Variables

### Backend
1. Add the variable to `backend/.env`
2. Read it in `settings.py` using `config()`:
```python
from decouple import config
MY_NEW_VAR = config('MY_NEW_VAR', default='fallback')
```

### Frontend
1. Add the variable to `frontend/.env` with the `VITE_` prefix
2. Access it in code:
```javascript
const myVar = import.meta.env.VITE_MY_NEW_VAR
```
3. Restart the dev server
