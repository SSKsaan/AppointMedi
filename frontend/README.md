# AppointMedi — Frontend

React single-page application for a medical appointment mediation platform.  
Patients submit appointment requests; admins claim, review, and respond.

## Tech Stack

- **Framework:** React 18 with Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios (with JWT interceptor and automatic refresh)
- **UI:** Tailwind CSS with Radix UI primitives
- **Icons:** Lucide React
- **Charts:** Recharts (admin dashboard)
- **Notifications:** Sonner toast
- **Deployment:** Vercel (SPA routing via `vercel.json`)

## Project Structure

```
frontend/
├── public/
│   └── images/            # Static images (hero, etc.)
├── src/
│   ├── api/               # Axios client and endpoint modules
│   ├── components/
│   │   ├── auth/          # Route guards (ProtectedRoute, AdminRoute, PatientRoute)
│   │   ├── layout/        # App shell (Layout, Navbar, Footer)
│   │   ├── shared/        # Reusable components (StatusBadge, LoadingSpinner, etc.)
│   │   └── ui/            # Radix-based primitives (Button, Card, Avatar, etc.)
│   ├── context/           # Auth and theme providers
│   ├── lib/               # Utility functions (date formatting, constants)
│   └── pages/             # Route-level components
│       ├── appointments/  # List, detail, and create appointment
│       └── dashboard/     # Admin dashboard with stats and charts
├── .env.example
├── vercel.json            # SPA rewrite rules
└── package.json
```

## Setup

**Prerequisites:** Node.js 20+

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file:

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `/api` | Backend API base URL |
| `VITE_MEDIATION_FEE` | No | `100` | Fixed fee per appointment |
| `VITE_MAX_DEPOSIT` | No | `5000` | Maximum top-up amount |

Open `http://localhost:5173`.

## Build

```bash
npm run build     # Outputs to dist/
npm run preview   # Preview production build locally
```

## Features

- **Authentication** — Login, registration, password reset with JWT
- **Appointment Lifecycle** — Submit → claim → respond → confirm/reject → complete/cancel
- **Admin Dashboard** — Stats cards, pie chart, paginated pending requests with claim action
- **Payment Integration** — SSLCommerz-based top-up with balance display
- **Responsive Design** — Mobile-first layout with dark/light theme support
- **Review System** — Per-user reviews with admin moderation visibility toggle

## Dependencies

Key packages: `react`, `react-router-dom`, `axios`, `tailwindcss`, `lucide-react`, `recharts`, `sonner`, `radix-ui`, `clsx`, `tailwind-merge`, `class-variance-authority`.

Full list: [package.json](package.json)

## License

MIT
