# AppointMedi — Backend

Django REST Framework API for a medical appointment mediation platform.  
Handles user authentication, appointment lifecycle, payments via SSLCommerz, and platform reviews.

## Tech Stack

- **Framework:** Django 6.0 + Django REST Framework 3.17
- **Auth:** JWT (SimpleJWT) with token refresh and blacklisting
- **Database:** PostgreSQL (production), via `dj-database-url`
- **File Storage:** Cloudinary (media uploads)
- **Payments:** SSLCommerz (sandbox and production)
- **Deployment:** Gunicorn + Whitenoise (static files), Render

## Project Structure

```
backend/
├── appointmedi/              # Project settings (base, dev, prod)
│   ├── settings/
│   │   ├── base.py           # Shared settings
│   │   ├── dev.py            # Development overrides
│   │   └── prod.py           # Production overrides
│   └── urls.py               # Root URL configuration
├── apps/
│   ├── users/                # User model, authentication, reviews
│   ├── appointments/         # Appointment request/response lifecycle
│   └── payments/             # Transactions and SSLCommerz integration
└── manage.py
```

## Setup

**Prerequisites:** Python 3.11+, PostgreSQL 16+

```bash
git clone <repo>
cd backend

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env — set DATABASE_URL, SECRET_KEY, CLOUDINARY_URL, etc.

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | Django secret key |
| `CLOUDINARY_URL` | Yes | Cloudinary API URL |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |
| `BACKEND_URL` | Yes | Backend base URL (for SSLCommerz callback) |
| `SSLCOMMERZ_STORE_ID` | Yes | SSLCommerz store ID |
| `SSLCOMMERZ_STORE_PASS` | Yes | SSLCommerz store password |
| `DEFAULT_FROM_EMAIL` | No | Sender email address |

## API Endpoints

| Group | Base Path | Purpose |
|---|---|---|
| Health | `/` | Server health check |
| Auth | `/api/auth/` | Registration, login, token refresh, password management |
| Appointments | `/api/appointments/` | CRUD and 8 status transitions |
| Reviews | `/api/reviews/` | Per-user review with admin moderation |
| Payments | `/api/payments/` | Balance top-up via SSLCommerz, transaction history |
| Admin | `/api/users/admin/` | Admin dashboard statistics |
| Django Admin | `/admin/` | Built-in admin interface |

Full API reference: [DOCS/api_endpoints.md](../DOCS/api_endpoints.md)

## Database Models

- **User** — Extends AbstractUser with role, balance, and Cloudinary photo
- **Review** — One review per user, with moderation status
- **AppointmentRequest** — Full lifecycle with status, timestamps, and mediator assignments
- **AppointmentResponse** — Admin replies linked to requests
- **Transaction** — All balance changes with type classification

Schema: [DOCS/db_schema.md](../DOCS/db_schema.md)

## License

MIT
