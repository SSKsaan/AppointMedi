# Feature List

## 1. Authentication & User Management

- **JWT-based login** with access and refresh tokens. Tokens are stored in localStorage and attached to every API request automatically.
- **Registration** creates a patient account and returns tokens immediately. New accounts start with a small demo balance.
- **Password reset** flow: user enters email on the forgot-password page, then sets a new password on the reset-password page.
- **Password change** from within the profile page (requires current password).
- **Profile page** lets users update their name, phone, bio, and profile photo. Email is read-only. Balance is displayed but not editable.
- **Role system** based on Django's `is_staff` flag. Patients (`is_staff=False`) submit requests and manage their appointments. Admins (`is_staff=True`) claim and respond to requests, moderate reviews, and access the admin dashboard.
- **Token blacklisting** on logout (uses SimpleJWT's `TokenBlacklistView`).

## 2. Appointment Request Lifecycle

The platform follows a structured workflow with eight possible statuses and eight admin/patient actions:

**Statuses:** `PENDING → PROCESSING → RESPONDED → CONFIRMED → COMPLETED`  
**Branches:** `RESPONDED → REJECTED`, `PROCESSING → INCOMPLETE`, `PENDING/INCOMPLETE → CANCELLED`

- **Submit** (Patient): Creates a new request. The mediation fee is deducted from the patient's prepaid balance atomically.
- **Claim** (Admin): Assigns the request to an admin. The admin's email is attached as a "claimed by" signature visible only to other admins.
- **Respond** (Admin): Sends a response to the patient. An email notification is sent.
- **Request More Info** (Admin): Marks the request as incomplete. The patient can edit their description, which reverts the status to pending.
- **Confirm** (Patient): Accepts the admin's response. An email notification is sent to the admin.
- **Reject** (Patient): Declines the response. The admin can respond again.
- **Complete** (Admin): Marks the appointment as done.
- **Cancel** (Patient): Cancels before completion. The mediation fee is refunded to the patient's balance. A confirmation dialog asks before cancelling.
- **Follow-up** (Patient): Creates a new request linked to a completed or confirmed appointment. The follow-up fee is half the regular mediation fee. The description placeholder clarifies that follow-ups are for the same doctor and hospital.

## 3. Admin Dashboard

- **Summary cards** showing total users, total requests, personal success count, and personal failure count.
- **Pie chart** visualizing requests grouped by status. Uses Recharts with a responsive container.
- **Pending requests list** with pagination (4 per page). Each row shows the patient name, date, status badge, and a claim button for pending items. Claimed items show who claimed them. The section has a fixed height so pagination stays in place.
- **Quick links** to view all appointments, manage reviews, and browse transactions.
- **Django Admin** link (the built-in Django interface) for advanced management.

## 4. Patient Dashboard

- Shows the patient's own appointments with filtering by status and search by keyword.
- Summary cards for quick status breakdowns (pending, processing, responded, etc.).
- Quick links to create a new request, top up balance, and view transaction history.

## 5. Appointment List & Detail

- **List view** supports filtering by status, searching by description or email, and pagination. Admins see all requests; patients see only their own. The description is truncated on mobile to keep the status badge visible.
- **Detail view** shows the full request with patient info, description, creation date, follow-up chain, and response card. Action buttons change based on the current status and user role. Admins see the "claimed by" signature next to the response label and card.

## 6. Payment System

- **Top-up** via SSLCommerz sandbox (Bangladesh payment gateway). The frontend sends the amount, the backend initiates a session, and redirects the user to the SSLCommerz checkout page.
- **Callback** handled by a plain Django view that validates the transaction with SSLCommerz's API before updating the user's balance.
- **Transaction history** with filters by type (Deposit, Refund, Charged) and status (Success, Failed, Pending). Refunds are stored as DEPOSIT transactions and identified visually by amount (100 or 50). Charged transactions use negative amounts.
- **Copy transaction ID** button for reference.

## 7. Review System

- Patients can submit one review (rating 1–5 with an optional comment).
- Reviews appear on the public homepage in an auto-scrolling ribbon with name anonymization (first name + asterisks).
- The homepage ribbon pauses on hover and uses a duplicate-set technique for seamless infinite scroll.
- Admins can hide reviews from the homepage (they remain visible to the author in their profile).

## 8. Admin Review Moderation

- Dedicated reviews page accessible to admins only.
- Each review shows the author, rating, comment, and date.
- Admins can toggle review visibility (hidden/visible) with a single click.
- Hidden reviews are dimmed in the admin list.

## 9. Homepage

- **Hero section** with tagline, CTA button (context-aware: logged-in users go to their dashboard, guests go to register), and an illustration that wiggles gently on hover.
- **Stats bar** with four metrics (doctors, patients, appointments, response time). Numbers light up with a glow effect on hover.
- **How It Works** section with four feature cards that scale up slightly on hover.
- **Reviews ribbon** with infinite auto-scroll, gradient edge fade, and pause-on-hover.
- **Footer** with navigation links, contact information, and logout option.

## 10. Profile Page

- Avatar with photo upload (Cloudinary), name, role badge, balance, and join date.
- Editable fields: full name, phone, bio. All non-bio inputs show a tooltip on hover with the full value.
- Password change dialog.
- Review editor (patients only): create, update, or delete their own review.
- Logout with confirmation dialog.

## 11. UI & UX

- **Responsive design** using Tailwind breakpoints. Works on large monitors, laptops, tablets, and phones.
- **Dark/light theme** toggle persisted in state. Uses CSS variables for theme colors.
- **Notifications** via sonner toasts. Close button is positioned on the right, vertically centered. Toast width adapts to content with a max-width cap.
- **Loading spinners** shown during all data fetches.
- **Error states** with retry buttons when API calls fail.
- **Empty states** with contextual messages when no data exists.
- **Pagination** on list pages (appointments, transactions, reviews, admin dashboard).
- **SPA routing** with React Router. Protected routes redirect unauthenticated users. Admin routes redirect patients. Patient routes redirect admins.

## 12. Accessibility & Professionalism

- Semantic HTML with proper heading hierarchy.
- ARIA attributes where appropriate (e.g., `aria-hidden` on duplicate scroll content).
- Keyboard-navigable forms and buttons.
- Consistent spacing, typography, and color palette.
- Status badges with color-coded labels for quick visual scanning.
