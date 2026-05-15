# API Reference — AppointMedi

**Base URL:** `/api/`  
**Auth header:** `Authorization: Bearer <access_token>`  
**Paginated responses:** `{ "count": int, "next": url|null, "previous": url|null, "results": [] }`  
**Validation errors:** `{ "field": ["message"] }` · **Permission/auth errors:** `{ "detail": "message" }`

---

## Users & Auth · `/api/auth/`

### `POST /api/auth/register/`
Register a new patient account. Returns tokens immediately on success.

**Auth:** Public

**Body**

| Field | Type | Required |
|---|---|---|
| email | string | yes |
| password | string | yes |
| full_name | string | no |

**Response `201`**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "balance": "0.00",
    "phone": "",
    "bio": "",
    "photo": null,
    "is_staff": false,
    "created_at": "2025-01-01T00:00:00Z"
  },
  "access": "<token>",
  "refresh": "<token>"
}
```

**Errors:** `400` email already registered, password too weak

---

### `POST /api/auth/token/`
Authenticate and receive tokens.

**Auth:** Public

**Body**

| Field | Type | Required |
|---|---|---|
| email | string | yes |
| password | string | yes |

**Response `200`**
```json
{ "access": "<token>", "refresh": "<token>" }
```

**Errors:** `401` invalid credentials

---

### `POST /api/auth/blacklist/`
Blacklist the refresh token.

**Auth:** Required

**Body**

| Field | Type | Required |
|---|---|---|
| refresh | string | yes |

**Response `205`** — no body

**Errors:** `400` invalid or already blacklisted token

---

### `POST /api/auth/token/refresh/`
Exchange a refresh token for a new access token.

**Auth:** Public

**Body**

| Field | Type | Required |
|---|---|---|
| refresh | string | yes |

**Response `200`**
```json
{ "access": "<token>" }
```

**Errors:** `401` token expired or invalid

---

### `GET /api/auth/profile/`
Retrieve the authenticated user's profile.

**Auth:** Required  
**Body:** —

**Response `200`** — User object (includes `is_active` field in admin responses)

---

### `PATCH /api/auth/profile/`
Update the authenticated user's profile. All fields optional.

**Auth:** Required

**Body**

| Field | Type |
|---|---|
| full_name | string |
| phone | string — format: `+8801XXXXXXXXX` |
| bio | string |
| photo | file (multipart) |

**Response `200`** — updated User object

**Errors:** `400` invalid phone format

---

## User Management · `/api/auth/`

Admin-only user management endpoints.

### `GET /api/auth/`
List all users with filtering and search.

**Auth:** Required (admin only)

**Query params:** `?is_staff=true|false` · `?is_active=true|false` · `?search=email,name` · `?ordering=created_at|-created_at`

**Body:** —

**Response `200`** — paginated list
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Jane Doe",
      "balance": "0.00",
      "is_staff": false,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### `GET /api/auth/{id}/`
Retrieve a specific user.

**Auth:** Required (admin only)
**Body:** —

**Response `200`** — User object

**Errors:** `404`

---

### `PATCH /api/auth/{id}/`
Update a user's fields.

**Auth:** Required (admin only)

**Body**

| Field | Type |
|---|---|
| full_name | string |
| is_active | boolean |
| is_staff | boolean |
| balance | decimal |

**Response `200`** — updated User object

**Errors:** `400` · `404`

---

### `DELETE /api/auth/{id}/`
Deactivate a user account (soft delete).

**Auth:** Required (admin only)
**Body:** —

**Response `204`** — no body

**Errors:** `404`

---

## Reviews · `/api/reviews/`

### `GET /api/reviews/`
List all platform reviews.

**Auth:** Public

**Query params:** `?rating=1-5` · `?ordering=created_at|-created_at`

**Body:** —

**Response `200`** — paginated list
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 1,
      "user_email": "user@example.com",
      "user_full_name": "Jane Doe",
      "rating": 5,
      "comment": "Great service.",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/reviews/`
Submit a platform review. One review per user.

**Auth:** Required (patient only)

**Body**

| Field | Type | Required |
|---|---|---|
| rating | integer 1–5 | yes |
| comment | string | no |

**Response `201`** — Review object

**Errors:** `400` rating out of range · `400` user has already submitted a review

---

### `GET /api/reviews/{id}/`
Retrieve a single review.

**Auth:** Public
**Body:** —

**Response `200`** — Review object

**Errors:** `404`

---

### `PATCH /api/reviews/{id}/`
Edit your own review.

**Auth:** Required (owner only)

**Body**

| Field | Type |
|---|---|
| rating | integer 1–5 |
| comment | string |

**Response `200`** — updated Review object

**Errors:** `403` not the owner · `404`

---

### `DELETE /api/reviews/{id}/`
Delete your own review.

**Auth:** Required (owner only)  
**Body:** —

**Response `204`** — no body

**Errors:** `403` not the owner · `404`

---

## Appointment Requests · `/api/appointments/`

The `response` field on a Request object is `null` until the admin calls
`respond` or `request_incomplete`. Once created, the Response record
persists through all subsequent statuses.

### `GET /api/appointments/`
List appointment requests.

**Auth:** Required  
**Behaviour:** Patients see only their own. Admins see all.

**Query params:** `?status=PENDING|PROCESSING|...` · `?search=<keyword>` · `?ordering=created_at|-created_at`

**Body:** —

**Response `200`** — paginated list of Request objects
```json
{
  "results": [
    {
      "id": 1,
      "patient": { "id": 1, "email": "user@example.com", "full_name": "Jane Doe" },
      "description": "I need a cardiologist near Dhanmondi...",
      "status": "PENDING",
      "parent_request": null,
      "claimed_by": null,
      "claimed_by_email": null,
      "response": null,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/appointments/`
Submit a new appointment request.

Charges `MEDIATION_FEE` from the patient's balance on success.
Creates a corresponding `DEDUCT` (Charged) Transaction record atomically.

**Auth:** Required (patient only)

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| description | string | yes | free-form |
| parent_request | integer | no | ID of a COMPLETED request; use only for follow-ups |

**Response `201`** — new Request object with `status: PENDING`

**Errors:** `400` insufficient balance · `400` referenced parent_request not COMPLETED · `403` admins cannot submit requests

---

### `GET /api/appointments/{id}/`
Retrieve a single request with its full response (if any).

**Auth:** Required (owner or admin)  
**Body:** —

**Response `200`**
```json
{
  "id": 1,
  "patient": { "id": 1, "email": "user@example.com", "full_name": "Jane Doe" },
  "description": "I need a cardiologist near Dhanmondi...",
  "status": "RESPONDED",
  "parent_request": null,
  "claimed_by": 2,
  "claimed_by_email": "admin@appointmedi.com",
  "response": {
    "id": 1,
    "admin_email": "admin@appointmedi.com",
    "admin_full_name": "Admin",
    "description": "We have matched you with Dr. Rahman...",
    "created_at": "2025-01-02T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z"
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-02T00:00:00Z"
}
```

**Errors:** `403` · `404`

---

### `PATCH /api/appointments/{id}/`
Edit a request's description.

Only allowed when `status` is `PENDING` or `INCOMPLETE`.
Editing while `INCOMPLETE` automatically reverts status to `PENDING`.
Blocked once `update_count` reaches `MAX_REQUEST_UPDATES`. (Note: `update_count` field has been removed from the model.)

**Auth:** Required (owner only)

**Body**

| Field | Type | Required |
|---|---|---|
| description | string | yes |

**Response `200`** — updated Request object

**Errors:** `400` update limit reached · `400` status does not permit editing · `403` · `404`

---

### `DELETE /api/appointments/{id}/`
Delete a request (admins only). Hard delete — use with caution.

**Auth:** Required (admin only)
**Body:** —

**Response `204`** — no body

**Errors:** `403` · `404`

---

## Appointment Request Actions · `/api/appointments/{id}/`

Action endpoints trigger status transitions and require no request body
unless stated otherwise. All return the updated Request object on `200`.

---

### `POST /api/appointments/{id}/claim/`
Admin takes ownership of a request.

**Auth:** Required (admin only)  
**Body:** —  
**Transition:** `PENDING` → `PROCESSING`

**Errors:** `400` wrong status · `403` · `404`

---

### `POST /api/appointments/{id}/respond/`
Admin sends a full response to the patient.

Creates or updates the linked Response record.
Sends an email notification to the patient.

**Auth:** Required (admin only)

**Body**

| Field | Type | Required |
|---|---|---|
| description | string | yes |

**Transition:** `PROCESSING` → `RESPONDED`

**Errors:** `400` wrong status · `403` · `404`

---

### `POST /api/appointments/{id}/request_incomplete/`
Admin flags the request as incomplete and asks the patient for more information.

Creates or updates the linked Response record with the clarification message.
Sends an email notification to the patient.

**Auth:** Required (admin only)

**Body**

| Field | Type | Required |
|---|---|---|
| description | string | yes — the clarifying question or instruction |

**Transition:** `PROCESSING` → `INCOMPLETE`

**Errors:** `400` wrong status · `403` · `404`

---

### `POST /api/appointments/{id}/confirm/`
Patient accepts the admin's response.

Sends an email notification to the admin.

**Auth:** Required (owner only)  
**Body:** —  
**Transition:** `RESPONDED` → `CONFIRMED`

**Errors:** `400` wrong status · `403` · `404`

---

### `POST /api/appointments/{id}/reject/`
Patient declines the admin's response.

Sends an email notification to the admin.

**Auth:** Required (owner only)  
**Body:** —  
**Transition:** `RESPONDED` → `REJECTED`

**Errors:** `400` wrong status · `403` · `404`

---

### `POST /api/appointments/{id}/cancel/`
Patient cancels their request before the admin has responded.

**Auth:** Required (owner only)  
**Body:** —  
**Transition:** `PENDING` or `PROCESSING` → `CANCELLED`

**Errors:** `400` wrong status — cannot cancel once admin has responded · `403` · `404`

---

### `POST /api/appointments/{id}/complete/`
Admin marks the appointment as completed.

**Auth:** Required (admin only)  
**Body:** —  
**Transition:** `CONFIRMED` → `COMPLETED`

**Errors:** `400` wrong status · `403` · `404`

---

### `POST /api/appointments/{id}/follow_up/`
Patient creates a follow-up request linked to a completed one.

Behaves identically to `POST /api/appointments/` — charges `MEDIATION_FEE` and
creates a new request — except `parent_request` is set automatically.
Only callable on requests the patient owns.

**Auth:** Required (owner only)

**Body**

| Field | Type | Required |
|---|---|---|
| description | string | yes |

**Transition:** — (creates a new Request with `status: PENDING`)

**Response `201`** — new Request object

**Errors:** `400` request not COMPLETED · `400` insufficient balance · `403` · `404`

---

## Payments · `/api/payments/`

### `POST /api/payments/initiate/`
Start a deposit. Creates a `PENDING` Transaction and returns the SSLCommerz redirect URL.

**Auth:** Required (patient only)

**Body**

| Field | Type | Required |
|---|---|---|
| amount | decimal | yes |

**Response `200`**
```json
{
  "redirect_url": "https://sandbox.sslcommerz.com/...",
  "transaction_id": "uuid"
}
```

Frontend redirects the user to `redirect_url` to complete payment on SSLCommerz.

**Errors:** `400` invalid amount

---

### `POST /api/payments/callback/`
SSLCommerz posts to this URL after payment is attempted.

Validates `val_id` against the SSLCommerz validation API before making any changes.
On validation success: sets Transaction `status` to `SUCCESS`, adds `amount` to `User.balance`.
On validation failure: sets Transaction `status` to `FAILED`.
Redirects to the appropriate frontend page on completion.

**Auth:** None — this endpoint is called by SSLCommerz, not the client  
**Body:** SSLCommerz POST fields (`val_id`, `tran_id`, `status`, etc.)  
**Response:** HTTP redirect to frontend success or failure URL

> This is a plain Django view, not a DRF endpoint. It does not return JSON.

---

### `GET /api/payments/history/`
List the authenticated user's transactions.

**Auth:** Required  
**Body:** —

**Query params:** `?type=DEPOSIT|DEDUCT` · `?visual_type=DEPOSIT|REFUND` · `?status=PENDING|SUCCESS|FAILED` · `?ordering=created_at|-created_at`  
`visual_type=REFUND` filters for DEPOSITs with amount 100 or 50 (cancellation refunds).  
`visual_type=DEPOSIT` filters for DEPOSITs with other amounts (top-ups).

**Response `200`** — paginated list
```json
{
  "results": [
    {
      "id": 1,
      "amount": "500.00",
      "type": "DEPOSIT",
      "transaction_id": "uuid",
      "gateway_ref": "val_id_from_sslcommerz",
      "status": "SUCCESS",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## Admin Dashboard · `/api/auth/admin/`

### `GET /api/auth/admin/`
Retrieve platform-wide statistics for the admin dashboard.

**Auth:** Required (admin only)  
**Body:** —

**Response `200`**
```json
{
  "total_users": 42,
  "requests_by_status": {
    "PENDING": 5,
    "PROCESSING": 2,
    "INCOMPLETE": 1,
    "RESPONDED": 3,
    "CONFIRMED": 4,
    "REJECTED": 1,
    "COMPLETED": 20,
    "CANCELLED": 6
  },
  "recent_requests": [
    {
      "id": 12,
      "patient_email": "user@example.com",
      "patient_full_name": "Jane Doe",
      "status": "PENDING",
      "created_at": "2025-01-01T00:00:00Z",
      "claimed_by_email": null
    }
  ],
  "total_deposited": "15000.00",
  "total_deducted": "4200.00"
}
```

**Errors:** `403` non-admin
