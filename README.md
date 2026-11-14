# Stack Dev Client Portal

A full-stack client and project management portal built for **Stack Dev** (Savar, Dhaka · `+880 1963-131282`).

Admins can manage clients, projects, timelines, milestones, files, real-time messages, and BDT (`৳`) invoices. Clients can sign in to track project progress, review/approve milestones, exchange files and chat messages, download PDF invoices, and pay online through **SSLCommerz**.

---

## Core Features

- **Role-Based Access Control (Admin & Client)**:
  - Firebase Authentication with role-based dashboards and strict client isolation (`clientId`).
  - Admin client onboarding creates both the Firestore client profile and a Firebase Auth login using a secondary auth instance with cryptographic temporary password generation.
- **Projects, Timeline & Milestones**:
  - Track project packages (`basic`, `premium`, `custom`), statuses (`Planning`, `Design`, `Development`, `Review`, `Delivered`), progress (`0–100%`), deadlines, and revision allowances.
  - Admin timeline updates with compressed image attachments, plus milestone workflows (`Pending`, `In Review`, `Approved`, `Changes Requested`) that automatically increment `revisionsUsed` when changes are requested.
- **Private File Sharing (Firebase Storage)**:
  - Drag-and-drop uploads up to 25 MB for allowed document/design/image formats (`png`, `jpg`, `jpeg`, `gif`, `webp`, `pdf`, `zip`, `doc`, `docx`, `xls`, `xlsx`, `fig`), with upload progress, in-app image/PDF preview, and scoped delete rules.
- **Real-Time Project Messaging**:
  - Firestore real-time chat threads between client and admin with file attachments and unread navigation badges.
- **Invoicing (`৳` BDT) & Online Payment (SSLCommerz)**:
  - Auto-numbered invoices (`SD-YYYY-NNNN`), line-item totals, automatic Overdue state, manual payment recording (`bKash`, `Nagad`, `Bank`, `Cash`), printable layout, and browser PDF generation (`jsPDF`).
  - Server-side SSLCommerz integration via Firebase Cloud Functions (v2) supporting Sandbox (default) and Live modes, redirect validation (`val_id`), IPN verification, per-session callback tokens, and idempotent Firestore transactions.
- **Notifications, Preferences & Localization**:
  - Real-time in-app notification bell, profile & password settings, dark/light theme, English / বাংলা (`en` / `bn`) language switcher, 404 page, and React Error Boundary.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, `react-hook-form` + `zod`, `lucide-react`, `jspdf`
- **Backend & Data**: Firebase Authentication, Cloud Firestore (named database), Firebase Storage, Firebase Cloud Functions (Node.js 20, TypeScript), Firebase Hosting
- **Payments**: SSLCommerz Hosted Payment Gateway (v4 API + Order Validation API)

---

## Project Structure

```text
.
├── src/                        # React SPA source
│   ├── components/             # Shared UI, tabs, modals, notification bell, error boundary
│   ├── context/                # AuthContext, ThemeContext, LanguageContext
│   ├── i18n/                   # English / Bengali translation dictionary
│   ├── lib/                    # Firebase SDK initialization
│   ├── pages/                  # Admin & Client portal pages + payment result routes
│   ├── types/                  # Portal TypeScript interfaces
│   └── utils/                  # Formatters, file validation/upload, invoicing, PDF, payments
├── functions/                  # Firebase Cloud Functions (v2) for SSLCommerz
│   ├── src/
│   │   ├── index.ts            # createPaymentSession, paymentSuccess, paymentFail, paymentCancel, paymentIpn
│   │   └── sslcommerz.ts       # SSLCommerz session creation & server-side validation API client
│   ├── .env.example            # Cloud Functions runtime config template
│   └── package.json
├── firebase-applet-config.json # Public Firebase Web SDK configuration
├── firebase-blueprint.json     # Firestore entity & collection schema blueprint
├── firebase.json               # Hosting SPA rewrites, security headers, rules, functions config
├── firestore.rules             # Firestore security rules (deployed to named DB)
├── storage.rules               # Firebase Storage security rules
└── .env.example                # Root environment variable template
```

---

## Prerequisites

- **Node.js 20+** and `npm`
- **Firebase CLI**: `npm install -g firebase-tools`
- An active **Firebase project** (`gen-lang-client-0463369998`) with Authentication (Email/Password), Cloud Firestore, Firebase Storage, Cloud Functions (Blaze plan required for Cloud Functions & outbound requests to SSLCommerz), and Firebase Hosting enabled.
- An **SSLCommerz** Sandbox or Live merchant account (`store_id` and `store_passwd`).

---

## Local Development Setup

1. **Install frontend dependencies**:
   ```bash
   npm install
   ```

2. **Install Cloud Functions dependencies** (when preparing or testing functions):
   ```bash
   cd functions
   npm install
   npm run build
   cd ..
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Copy `functions/.env.example` to `functions/.env` for Cloud Functions non-secret config.

4. **Start the local Vite dev server** (port `3000`):
   ```bash
   npm run dev
   ```

---

## Environment Variables & Secrets

### 1. Frontend Environment (`.env`)

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | — | Public Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Yes | — | Public Supabase anon/publishable key (never put private admin keys in `VITE_*`). |

> **Note**: Public Firebase Web SDK configuration (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `firestoreDatabaseId`) lives in `firebase-applet-config.json`. Never place SSLCommerz credentials or server secrets in any `VITE_*` variable or client file.

### 2. Cloud Functions Secrets (Google Secret Manager via Firebase CLI)

SSLCommerz merchant credentials are declared with `defineSecret(...)` and must **never** be committed to source control or placed in `.env` files for production:

| Secret Name | Required | Description |
| --- | --- | --- |
| `SSLCOMMERZ_STORE_ID` | Yes | Your SSLCommerz Store ID (Sandbox or Live). |
| `SSLCOMMERZ_STORE_PASSWD` | Yes | Your SSLCommerz Store Password (Sandbox or Live). |

Set them using the Firebase CLI:
```bash
firebase functions:secrets:set SSLCOMMERZ_STORE_ID
firebase functions:secrets:set SSLCOMMERZ_STORE_PASSWD
```

### 3. Cloud Functions Non-Secret Config (`functions/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `SSLCOMMERZ_IS_LIVE` | `"false"` | `"false"` uses `https://sandbox.sslcommerz.com`; set to `"true"` for `https://securepay.sslcommerz.com`. |
| `APP_BASE_URL` | `https://<project-id>.web.app` | Primary frontend origin used for post-payment redirects (`/payment/success`, `/payment/fail`, `/payment/cancel`). Update this to your custom domain or Firebase Hosting URL. |
| `ALLOWED_APP_ORIGINS` | `""` | Comma-separated explicit allowlist of additional trusted origins (e.g., staging or custom domains) allowed to initiate and receive payment redirects. |
| `FUNCTIONS_BASE_URL` | `https://<region>-<project-id>.cloudfunctions.net` | Optional override for Cloud Functions HTTPS callback URLs (`paymentSuccess`, `paymentFail`, `paymentCancel`, `paymentIpn`). |
| `FUNCTIONS_REGION` | `"us-central1"` | Region for Cloud Functions deployment. |
| `FIRESTORE_DATABASE_ID` | `"ai-studio-stackdevclientpo-b3b3af26-10ea-4e12-bf74-edad8cc612b4"` | Named Firestore database ID used across client and Cloud Functions. |

---

## Security Rules & Pre-Production Checklist

1. **Deploy Storage Rules** (required before file uploads work in production):
   ```bash
   firebase deploy --only storage
   ```
2. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```
   *(If deploying to a specific named Firestore database target in Firebase CLI, ensure `firebase.json` / CLI target matches database `ai-studio-stackdevclientpo-b3b3af26-10ea-4e12-bf74-edad8cc612b4`.)*
3. **Verify the Admin Account Email**:
   - In Firebase Authentication Console, ensure the bootstrap admin account (`ayonmasrurulislam@gmail.com`) has a verified email (`email_verified = true`). Once verified, tighten `isAdmin()` in `firestore.rules` and `storage.rules` to also require `request.auth.token.email_verified == true`.
4. **Configure SSLCommerz IPN URL**:
   - In your SSLCommerz Merchant Panel, set the IPN listener URL to:
     `https://<FUNCTIONS_REGION>-<PROJECT_ID>.cloudfunctions.net/paymentIpn`
   - Also keep `paymentSuccess` / `paymentIpn` protected by server-side `val_id` validation against SSLCommerz's Order Validation API (`VALID` / `VALIDATED`, matching `tran_id`, `BDT` currency, and invoice `amount`).

---

## Deployment Guide (Firebase Hosting + Cloud Functions)

1. **Authenticate & select the Firebase project**:
   ```bash
   firebase login
   firebase use gen-lang-client-0463369998
   ```

2. **Set SSLCommerz Secrets & `functions/.env`**:
   ```bash
   firebase functions:secrets:set SSLCOMMERZ_STORE_ID
   firebase functions:secrets:set SSLCOMMERZ_STORE_PASSWD
   ```
   Verify `functions/.env` has:
   - `SSLCOMMERZ_IS_LIVE="false"` (switch to `"true"` only with Live credentials)
   - `APP_BASE_URL="https://gen-lang-client-0463369998.web.app"` (or your custom domain)
   - `ALLOWED_APP_ORIGINS` containing any extra preview/custom domains.

3. **Build the Cloud Functions & Frontend SPA**:
   ```bash
   cd functions
   npm install
   npm run build
   cd ..

   npm install
   npm run lint
   npm run build
   ```
   `npm run build` outputs the production static bundle to `dist/`.

4. **Deploy everything to Firebase**:
   ```bash
   firebase deploy --only hosting,functions,firestore:rules,storage
   ```
   Or deploy services individually:
   - Hosting only: `firebase deploy --only hosting`
   - Functions only: `firebase deploy --only functions`
   - Storage rules only: `firebase deploy --only storage`

5. **Post-Deployment Verification**:
   - Open your hosted URL (`https://gen-lang-client-0463369998.web.app`), sign in as admin, create a test client and invoice (`Sent`), then sign in as the test client and run an end-to-end SSLCommerz Sandbox payment.
   - Confirm the invoice transitions to `Paid` with the recorded payment method and `payments/{tran_id}` logs `status: "paid"`.
