# AppointMedi

Patients submit medical appointment requests. Admins review, claim, and respond. A fixed mediation fee is charged per request.

Built with Django REST Framework and React.

## Features

- JWT authentication with token refresh and blacklist
- Role system: patients submit requests, admins claim and respond
- Appointment lifecycle: submit → claim → respond → confirm/reject → complete/cancel
- Follow-up requests at half the mediation fee
- SSLCommerz payment gateway for balance top-up
- Refunds on cancellation, stored as deposits
- Platform reviews with admin moderation (hide from homepage)
- Responsive UI with dark/light theme
- Admin dashboard with charts and paginated request list

Full breakdown: [DOCS/feature_list.md](DOCS/feature_list.md)

## Getting Started

**Prerequisites:** Python 3.11+, Node.js 20+, PostgreSQL 16+

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # set DATABASE_URL and other env vars
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Project Layout

```
backend/
├── appointmedi/        settings, URLs, WSGI
└── apps/
    ├── users/          User model, auth, reviews
    ├── appointments/   Request lifecycle with status actions
    └── payments/       Transactions, SSLCommerz integration

frontend/
├── src/
│   ├── api/            API client and resource modules
│   ├── components/     UI primitives, layout, auth guards
│   ├── context/        Auth and theme state
│   └── pages/          Route pages
```

## API

| Group | Base | Purpose |
|---|---|---|
| Auth | `/api/auth/` | Register, login, profile |
| Appointments | `/api/appointments/` | CRUD + 8 status actions |
| Reviews | `/api/reviews/` | One per user, admin moderation |
| Payments | `/api/payments/` | Top-up via SSLCommerz, history |

Full reference: [DOCS/api_endpoints.md](DOCS/api_endpoints.md)

## Database

Five models: User, Review, AppointmentRequest, AppointmentResponse, Transaction.  
Schema: [DOCS/db_schema.md](DOCS/db_schema.md)
