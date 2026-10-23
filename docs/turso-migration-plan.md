# Firebase Authentication + Turso Migration

## Current-state audit

- Next.js 16 App Router runs the website and Node.js API routes.
- Firebase phone authentication is the active identity provider.
- Firestore currently stores profiles, addresses, bookings, messages, tracking, notifications, reviews, earnings, and payouts.
- Firebase callable Functions currently own booking creation, assignment, transitions, OTP verification, worker availability, and worker location.
- Registration is disabled because trusted role provisioning is incomplete.
- Several legacy API routes contain disabled placeholder database calls.
- Chat and dashboard screens still subscribe directly to Firestore.
- Firebase Storage is referenced by worker settings, while Firestore rules also contain Cloudinary-specific URL constraints. Media is outside this migration.
- Razorpay and certificate verification must remain external integrations.

## Target architecture

- Firebase Authentication proves identity and issues ID tokens only.
- Next.js server routes verify Firebase tokens with Firebase Admin.
- Turso is authoritative for roles, profiles, bookings, chat, tracking, payments, and other application text records.
- Browser code never receives Turso credentials and never supplies a trusted UID.
- Existing media URLs remain references only. No new storage provider is introduced.

## Ownership boundaries

| Concern | System of record | Browser access |
| --- | --- | --- |
| Sign-in, phone/email verification, password reset, ID token | Firebase Authentication | Firebase client SDK |
| Roles, account state, profiles, addresses, services | Turso | Next.js APIs only |
| Bookings, assignment, status history, OTP hashes | Turso | Next.js APIs only |
| Chat messages, notifications, worker location | Turso | Next.js APIs plus a future polling/SSE transport |
| Payments, earnings, payouts, webhook idempotency | Turso | Server routes/webhooks only |
| Images and video | Existing media provider | Existing URLs and upload flow; not migrated here |
| Certificate verification | Existing personnel API | Public verification route only |

Firebase UID is the stable cross-system user key. Firebase custom claims are not the source of truth for application authorization; each protected server request verifies the ID token and then loads the current role and account status from Turso.

## Main request flows

### Login and session

1. The browser signs in through Firebase Authentication.
2. Firebase returns an ID token.
3. The browser sends `Authorization: Bearer <token>` to a Next.js API.
4. Firebase Admin verifies signature, expiry, and revocation.
5. The API loads `users.role` and `users.account_status` from Turso.
6. The API authorizes the requested action and returns only permitted fields.

### Customer registration

1. Firebase creates/verifies the identity.
2. `POST /api/auth/register-user` verifies that token; it never accepts a UID or role from the browser.
3. An idempotent Turso batch creates `users` with role `customer` and `customer_profiles`.
4. Worker/admin roles require a separate privileged approval flow; public registration cannot assign them.

### Booking lifecycle

1. An authenticated customer selects a service and address.
2. A server API validates ownership, price inputs, and service availability.
3. One Turso transaction inserts the booking, its first event, and any payment intent metadata.
4. Assignment uses a conditional update so two workers cannot accept the same booking.
5. Every status change appends `booking_events`; restricted secrets stay in `booking_secrets`.
6. Customer/worker/admin reads are filtered by the authenticated Turso user and role.

### Payment lifecycle

1. The server creates a Razorpay order using server-only credentials.
2. The browser receives the order ID and the publishable checkout key.
3. Razorpay completes checkout.
4. The server verifies the signature before changing payment or booking state.
5. Webhook event IDs are stored in `payment_webhook_events` to make retries idempotent.

### Chat, tracking, and notifications

Firestore currently supplies live listeners. Turso stores the replacement records, but it does not itself push browser updates. The cutover must add a transport such as authenticated polling or server-sent events. Until that transport is implemented and load-tested, these screens must not be switched to Turso in production.

## Dataset and sensitive-field map

- `users`: Firebase UID, contact fields, display name, role, status, timestamps.
- `customer_profiles`: customer preferences and profile metadata.
- `worker_profiles`: public worker identity, approval, availability, rating, service area.
- `worker_private`: government/tax/bank and other restricted worker data; admin/owner access only.
- `service_categories`, `services`, `worker_services`: catalogue and worker capability mapping.
- `addresses`: user-owned structured addresses and coordinates.
- `bookings`: customer, worker, service, price, address snapshot, schedule, and current status.
- `booking_secrets`: hashed OTP/verification material, never returned by normal booking reads.
- `booking_events`: immutable audit timeline for assignment and status transitions.
- `booking_messages`: participant-scoped text chat and media URL references.
- `worker_locations`: latest/recorded coordinates with timestamp.
- `reviews`: one customer review per completed booking.
- `notifications`: per-user delivery/read state and optional target URL.
- `payments`, `payment_webhook_events`: gateway references, verified state, and idempotency records.
- `worker_earnings`, `worker_payouts`: ledger-style financial records.
- `support_tickets`: customer/worker support workflow.
- `admin_audit_logs`: privileged mutations with actor, target, and metadata.
- `app_settings`: controlled operational settings.

## Required environment variables

Browser-safe Firebase configuration remains in `NEXT_PUBLIC_FIREBASE_*`. Server-only values are `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and payment/integration secrets. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` may be exposed for checkout; the Razorpay secret must never enter browser code.

## Acceptance gates

- Unauthorized, expired, revoked, suspended, and wrong-role requests are rejected.
- Public registration cannot create worker/admin users or choose another UID.
- Migration count checks and foreign-key checks pass for every dataset.
- Booking assignment and payment/webhook retries remain correct under concurrency.
- Customer, worker, and admin can access only their permitted records.
- Media URLs and certificate verification continue working unchanged.
- A tested feature flag can restore Firestore reads during the rollback window.

## Controlled migration phases

1. Deploy the normalized Turso schema to an isolated test database.
2. Configure Firebase Admin and Turso server secrets in the test deployment.
3. Validate token verification and idempotent customer bootstrap.
4. Export Firestore records without deleting or modifying them.
5. Transform records while preserving Firebase UIDs, booking IDs, status names, and timestamps.
6. Import in dependency order: users, profiles, services, addresses, bookings, events/messages, then financial/support records.
7. Compare per-collection/table counts and validate every foreign-key relationship.
8. Add Turso-backed APIs and switch one frontend feature at a time behind a server-side feature flag.
9. Run customer, worker, admin, concurrency, payment, and authorization tests.
10. Cut over only after acceptance checks pass; keep Firestore read-only fallback during the rollback window.

## Rollback

- Do not delete Firestore data.
- Disable the Turso feature flag and restore the previous Firestore deployment.
- Keep migration manifests and imported source IDs so retries remain idempotent.
- Reconcile writes created during any dual-run window before attempting a second cutover.

## Production blockers

- Turso URL/token and Firebase Admin credentials are not configured in the inspected environment.
- Existing source records and counts are unavailable for migration validation.
- Real-time replacement transport for Firestore listeners must be selected and tested on the target hosting platform.
- Existing media uploads remain dependent on their current provider and are intentionally not migrated.
