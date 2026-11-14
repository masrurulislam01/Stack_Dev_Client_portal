# Stack Dev Client Portal: Design System (design.md)

> **INSTRUCTION TO THE AI BUILDER (read first):**
> Apply this design system to the ENTIRE existing app: every page, every component, every state, in light and dark mode.
> **Change visuals only.** Do NOT change any logic, data fetching, authentication, routing, database code, file upload code, permissions, form validation rules, function names, or feature behaviour. Everything must work exactly as before, but look premium.
> If a visual change would require changing logic, skip it and leave a TODO comment instead.
> Replace hard-coded colours, fonts, spacing and shadows with the tokens below. Remove any style that conflicts with this file.

---

## 1. Brand Personality

**Stack Dev** is a modern software agency from Dhaka, Bangladesh. The portal must feel: **premium, calm, precise, trustworthy**. Think high-end fintech/SaaS: lots of whitespace, quiet colour, sharp typography, confident details. Avoid: loud gradients everywhere, neon, heavy borders, cluttered cards, cartoonish icons, default browser/Tailwind look.

Design principles:
1. **Clarity first.** One primary action per screen. Clear hierarchy.
2. **Quiet luxury.** Neutral surfaces, a single refined accent colour, colour used for meaning.
3. **Consistency.** Same spacing, radius and component styles on every page.
4. **Mobile-first.** Most clients use phones. Large tap targets, no horizontal scroll.
5. **Both languages.** English and Bangla (বাংলা) must look equally polished.

---

## 2. Colour Tokens

Define as CSS variables on `:root` and `.dark`, and map them in the Tailwind theme (`bg-background`, `text-foreground`, `border-border`, etc.). Use NO raw hex values in components.

### 2.1 Light theme

```css
:root {
  /* Surfaces */
  --background: #F7F8FC;          /* app background, very light cool grey */
  --surface: #FFFFFF;             /* cards, modals, inputs */
  --surface-muted: #F1F3F9;       /* table headers, subtle blocks */
  --surface-raised: #FFFFFF;      /* popovers, dropdowns */

  /* Text */
  --foreground: #0B1220;          /* headings */
  --text: #1F2A44;                /* body */
  --text-muted: #667085;          /* secondary */
  --text-subtle: #98A2B3;         /* placeholders, captions */

  /* Lines */
  --border: #E4E7EF;
  --border-strong: #CBD1E0;
  --ring: rgba(79, 70, 229, 0.35);

  /* Brand (refined indigo) */
  --primary-50:  #EEF0FF;
  --primary-100: #E0E4FF;
  --primary-200: #C7CDFF;
  --primary-500: #5B5BF0;
  --primary-600: #4F46E5;         /* main brand colour */
  --primary-700: #4338CA;         /* hover */
  --primary-800: #3730A3;         /* pressed */
  --primary-foreground: #FFFFFF;

  /* Signature accent (use sparingly: highlights, active indicators) */
  --accent-gold: #C8A24A;
  --accent-gold-soft: #FBF5E3;

  /* Semantic */
  --success: #059669;  --success-soft: #E6F6EF;  --success-text: #047857;
  --warning: #D97706;  --warning-soft: #FEF3E2;  --warning-text: #B45309;
  --danger:  #DC2626;  --danger-soft:  #FDECEC;  --danger-text:  #B91C1C;
  --info:    #0284C7;  --info-soft:    #E5F3FB;  --info-text:    #0369A1;

  /* Gradients (limited use) */
  --gradient-brand: linear-gradient(135deg, #4F46E5 0%, #6D5CF6 55%, #8B5CF6 100%);
  --gradient-hero: radial-gradient(1200px 500px at 0% 0%, #E0E4FF 0%, transparent 60%),
                   radial-gradient(900px 400px at 100% 0%, #F3E8FF 0%, transparent 55%);
}
```

### 2.2 Dark theme

```css
.dark {
  --background: #0A0E1A;
  --surface: #11162A;
  --surface-muted: #161C33;
  --surface-raised: #1A2140;

  --foreground: #F4F6FB;
  --text: #D5DAE8;
  --text-muted: #9AA3BA;
  --text-subtle: #6B7490;

  --border: #222A47;
  --border-strong: #333D63;
  --ring: rgba(129, 140, 248, 0.45);

  --primary-50:  #1B1F4A;
  --primary-100: #242A63;
  --primary-200: #343C8F;
  --primary-500: #7C83F7;
  --primary-600: #818CF8;
  --primary-700: #A5B4FC;
  --primary-800: #C7D2FE;
  --primary-foreground: #0A0E1A;

  --accent-gold: #E0BC5E;
  --accent-gold-soft: #2A2412;

  --success: #34D399;  --success-soft: #0F2A22;  --success-text: #6EE7B7;
  --warning: #FBBF24;  --warning-soft: #2E2410;  --warning-text: #FCD34D;
  --danger:  #F87171;  --danger-soft:  #2E1416;  --danger-text:  #FCA5A5;
  --info:    #38BDF8;  --info-soft:    #0E2433;  --info-text:    #7DD3FC;

  --gradient-brand: linear-gradient(135deg, #5B5BF0 0%, #7C6CF8 55%, #9A6CFA 100%);
  --gradient-hero: radial-gradient(1200px 500px at 0% 0%, #1B1F4A 0%, transparent 60%),
                   radial-gradient(900px 400px at 100% 0%, #2A1B4A 0%, transparent 55%);
}
```

### 2.3 Status colour mapping (use everywhere, identical on all pages)

| Meaning | Values | Colour |
|---|---|---|
| Project status | Planning | info |
| | Design | primary |
| | Development | warning |
| | Review | accent-gold |
| | Delivered | success |
| Milestone | Pending | neutral (muted) |
| | In Review | warning |
| | Approved | success |
| | Changes Requested | danger |
| Invoice | Draft | neutral |
| | Sent | info |
| | Paid | success |
| | Overdue | danger |
| Payment submission | Pending | warning |
| | Verified | success |
| | Rejected | danger |

Badges: soft background (`*-soft`), text `*-text`, a 6px solid dot in the base colour, pill radius, 12px/600 text. Never use saturated solid fills for badges.

Contrast: all text must meet WCAG AA (4.5:1) in both themes.

---

## 3. Typography

Load from Google Fonts (`display=swap`):

- **Headings / numbers:** `Manrope` (weights 500, 600, 700, 800)
- **Body / UI:** `Inter` (weights 400, 500, 600)
- **Bangla (বাংলা):** `Noto Sans Bengali` (weights 400, 500, 600, 700). Fall back for any Bengali glyphs.
- **Mono (invoice numbers, transaction IDs):** `JetBrains Mono` (400, 500)

```css
:root {
  --font-heading: "Manrope", "Noto Sans Bengali", system-ui, sans-serif;
  --font-body: "Inter", "Noto Sans Bengali", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
body { font-family: var(--font-body); color: var(--text); background: var(--background);
       font-feature-settings: "cv11", "ss01"; -webkit-font-smoothing: antialiased; }
h1,h2,h3,h4 { font-family: var(--font-heading); color: var(--foreground); letter-spacing: -0.02em; }
.num, table td.amount, .kpi-value { font-variant-numeric: tabular-nums; }
```

### Type scale

| Token | Size / Line height | Weight | Use |
|---|---|---|---|
| display | 40 / 48 | 800 | Login hero headline |
| h1 | 30 / 38 | 700 | Page titles |
| h2 | 22 / 30 | 700 | Section titles |
| h3 | 18 / 26 | 600 | Card titles |
| body | 15 / 24 | 400 | Default text |
| body-sm | 14 / 22 | 400/500 | Tables, descriptions |
| caption | 12 / 18 | 500 | Labels, badges, meta |
| overline | 11 / 16 | 600, uppercase, +0.08em | Small section labels |
| kpi | 32 / 38 | 800 | Dashboard numbers |

Bangla text: use line-height +2px (Bangla needs more vertical space), never apply uppercase or negative letter-spacing to Bangla. Currency: `৳ 12,500` with thousand separators, tabular numbers, semibold.

---

## 4. Spacing, Radius, Shadow, Motion

**Spacing:** 4px base grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Page padding: 16px mobile, 24px tablet, 32px desktop. Max content width 1280px. Card padding 20–24px. Gap between cards 16–24px.

**Radius:** `--radius-sm: 8px` (inputs, badges small), `--radius-md: 12px` (buttons, inputs), `--radius-lg: 16px` (cards), `--radius-xl: 24px` (modals, hero panels), pill `9999px` (badges, chips).

**Shadows (soft, layered, never harsh):**

```css
--shadow-xs: 0 1px 2px rgba(16, 24, 40, 0.05);
--shadow-sm: 0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04);
--shadow-md: 0 8px 24px -8px rgba(16, 24, 40, 0.10), 0 2px 6px rgba(16, 24, 40, 0.05);
--shadow-lg: 0 24px 48px -12px rgba(16, 24, 40, 0.18);
--shadow-brand: 0 8px 24px -6px rgba(79, 70, 229, 0.45);
```
In dark mode reduce shadows and rely on 1px borders plus a faint inner top highlight (`inset 0 1px 0 rgba(255,255,255,0.04)`).

**Motion:** durations 150ms (hover), 200ms (tabs, dropdowns), 280ms (modals, drawers). Easing `cubic-bezier(0.22, 1, 0.36, 1)`. Page content fades in + 6px upward slide. Cards lift 2px on hover. Buttons scale to 0.98 on press. Skeletons shimmer. Respect `prefers-reduced-motion` (disable transforms and shimmer).

---

## 5. Iconography and Imagery

- Icon set: **Lucide**, 20px default, 1.75 stroke, colour `text-muted` (active: `primary-600`). Never mix icon sets.
- Icons inside soft rounded squares (40px, `primary-50` background, radius 12) for KPI cards and empty states.
- Avatars: circle with initials, soft tinted backgrounds generated from the name, 32/40px.
- File type icons: PDF = danger tint, image = info tint, doc = primary tint, sheet = success tint, zip = warning tint.
- Logo: wordmark **"Stack Dev"** in Manrope 800, with a small rounded square mark (gradient-brand) containing `SD` or a `</>` glyph.

---

## 6. Components

### Buttons
- Heights: 36 (sm), 44 (md, default), 52 (lg). Radius 12. Font 14/600.
- **Primary:** `gradient-brand` background (or `primary-600`), white text, `shadow-brand` on hover, slight brightness-up.
- **Secondary:** surface background, 1px `border-strong`, `foreground` text, hover `surface-muted`.
- **Ghost:** transparent, hover `surface-muted`.
- **Danger:** `danger-soft` background with `danger-text`, hover solid danger with white text.
- Loading state: spinner replaces icon, label stays, button disabled. Disabled: 50% opacity, no shadow.
- Focus: 3px `--ring` outline, offset 2px, on every interactive element.

### Inputs, Selects, Textareas
44px height, radius 12, 1px `border`, `surface` background, 14px text, placeholder `text-subtle`. Hover: `border-strong`. Focus: `primary-600` border + 3px ring. Error: `danger` border + helper text in `danger-text` with icon. Label above (13px/600). Prefix/suffix icons supported. Search input has a leading search icon and `⌘K`-style hint on desktop.

### Cards
`surface` background, 1px `border`, radius 16, `shadow-xs`. Interactive cards: hover `shadow-md`, border `primary-200`, lift 2px. Card header: title (h3) left, action right, divider only when needed.

### Tables
Sticky header on `surface-muted`, overline-style column labels, 56px rows, hairline row dividers (no zebra), hover row `surface-muted`, numeric columns right-aligned with tabular numbers. On mobile convert rows to stacked cards. Always include an empty state.

### Tabs
Underline tabs: 2px `primary-600` indicator that animates between tabs, label 14/600, count badge pill. Horizontal scroll on mobile with fade edges.

### Badges / Chips
See §2.3. Filter chips: pill, `surface` with border; selected = `primary-50` background, `primary-600` text and border.

### Progress
Linear bar: 8px height, `surface-muted` track, fill `gradient-brand`, radius pill, percentage label right in tabular numbers. Circular progress ring for project headers (stroke 8, rounded caps). Milestone stepper: connected dots, completed = filled success check, current = ringed primary, upcoming = muted.

### Modals, Drawers, Dropdowns, Toasts
Modal: radius 24, `shadow-lg`, backdrop `rgba(11,18,32,0.55)` with 6px blur, max-width 520 (forms) / 880 (previews); bottom sheet on mobile. Dropdown: `surface-raised`, radius 12, `shadow-md`, 4px padding, items 36px. Toasts: top-right (bottom on mobile), left colour bar by type, auto-dismiss 4s, close button.

### Skeletons and Empty states
Skeletons mimic the real layout (same radius and heights). Empty state: soft icon tile, h3 title, one-line muted description, one primary action button.

### Alerts / Banners
Soft semantic background, 1px matching border at 30% opacity, icon left, radius 12.

---

## 7. Layout and Navigation

**Desktop (≥1024px):** left sidebar 264px (collapsible to 76px with tooltips), `surface` background with right border. Logo on top; grouped nav sections with overline labels; item height 44, radius 12, icon + label; active item = `primary-50` background, `primary-700` text, 3px left accent bar in `primary-600`; user card pinned at the bottom with avatar, name, role and a menu. Top bar 64px, translucent `surface` with backdrop blur and bottom border: breadcrumbs left; search, language toggle (EN | বাং), dark-mode toggle, notification bell with unread dot, avatar menu right.

**Tablet (640–1023px):** sidebar collapsed to icons by default.

**Mobile (<640px):** top bar with logo and bell; **bottom navigation bar** (5 items max) with 64px height, safe-area padding, active item shows a filled icon and a small pill indicator; a floating action button for the main action (admin: New project, client: Message). Tap targets at least 44px. No horizontal scrolling anywhere.

Page structure: page header (h1, muted subtitle, right-aligned actions), then content in a 12-column grid with 24px gaps. Subtle `gradient-hero` wash behind the first 320px of dashboard pages.

---

## 8. Page-by-Page Specifications

### 8.1 Login, Forgot password, Reset password
Desktop split layout: **left 55%** brand panel using `gradient-brand` with a soft grid/noise overlay, the Stack Dev wordmark, display headline "Your projects, files and invoices, in one place.", three benefit rows with icons (Live project updates, Secure file sharing, Easy invoice payment), and a small footer line "Stack Dev · Savar, Dhaka". **Right 45%:** centred 400px form card on `background`, title, muted subtitle, email and password fields (show/hide toggle), full-width primary button, "Forgot password?" link. Mobile: form only, logo on top, brand gradient strip at the top. Inline errors, loading button state.

### 8.2 Admin Dashboard
Header: greeting + date + quick actions (New project, New invoice, Add client). Row of 4 KPI cards (Active projects, Clients, Unpaid invoices ৳, Payments to verify): icon tile, overline label, kpi number, small caption. Below: "Due in the next 7 days" table (project, client, status badge, progress bar, due date), "Recent activity" feed, and a "Needs attention" card (overdue invoices, pending payments, milestones in review) with coloured left bars.

### 8.3 Client Dashboard
Welcome header with client name and a short status sentence. Project cards: title, status badge, progress bar with %, due date, next milestone line, subtle `gradient-hero` corner. A highlighted **"Amount due"** card (gold accent border, large ৳ figure, Pay Now primary button) when unpaid invoices exist. "Latest updates" vertical timeline with avatars and relative timestamps.

### 8.4 Clients (Admin)
Toolbar: search, "Add client" primary button. Table (avatar initials, company, contact, phone, projects count, actions menu). Add/Edit in a modal form with grouped fields and clear helper text. Row click opens client detail with tabs (Projects, Invoices, Files).

### 8.5 Projects list
Toolbar: search, status filter chips with counts, client filter, grid/table toggle. Grid cards: title, client, status badge, package chip, progress bar, due date, avatar. Overdue due dates in `danger-text`.

### 8.6 Project Detail
Sticky header: back link, project title (h1), client name, status badge, circular progress, due date, actions menu. Tabs: Overview, Timeline, Files, Messages, Invoices (with count badges).
- **Overview:** horizontal stepper (Planning → Design → Development → Review → Delivered); milestones as cards with status badge, due date, Approve / Request Changes buttons; revisions meter (used / allowed) that turns warning then danger near the limit; key details side card (package, dates).
- **Timeline:** vertical line with avatar nodes, update cards, image thumbnails with lightbox, relative time.
- **Files:** large dashed drop zone (primary-50 tint on drag-over), file rows with type icon tiles, name, size, uploader, date, hover actions (preview, download, delete), upload progress bars.
- **Messages:** chat bubbles (own = `primary-600` text white, right; others = `surface-muted`, left), avatar initials, day separators, "New messages" divider, sticky composer with attach and send buttons, auto-grow textarea.
- **Invoices:** compact invoice list with status badges.

### 8.7 Invoices list and Invoice Detail
List: 4 summary cards (Total billed, Paid, Unpaid, Overdue in ৳), then a clean table with mono invoice numbers (`SD-2026-0001`), status badges, amount right-aligned. Detail: a document-style invoice sheet on a soft canvas: Stack Dev header (Savar, Dhaka · +880 1963-131282), bill-to block, items table, totals right-aligned with a bold grand total, large status stamp (PAID green / DUE blue / OVERDUE red, subtle rotation allowed), payment history timeline. **Print stylesheet:** white background, black text, hide navigation and buttons, A4 margins.

### 8.8 Payments
Client Pay Now panel: numbered step cards (1 Send money, 2 Enter details, 3 Wait for verification), copy-to-clipboard button next to bKash/Nagad numbers, neutral brand-agnostic styling, mono styling for transaction IDs. Admin verification page: two-column details card with Verify (success) and Reject (danger-soft) buttons and status badges.

### 8.9 Notifications and Settings
Notifications: grouped by day, unread items with a primary dot and tinted background, icon tile per type. Settings: sectioned cards (Profile, Security, Appearance, Language) with a segmented control for Light / Dark / System and for English / বাংলা.

### 8.10 404 and Error pages
Centred illustration-free layout: large soft "404" in `primary-200`, h1, muted text, primary "Back to dashboard" button.

---

## 9. States Checklist (apply on every page)

Loading (skeleton matching layout) · Empty (icon, text, action) · Error (banner with retry) · Success (toast) · Hover · Focus-visible · Active/pressed · Disabled · Selected · Dragging (file drop) · Offline/slow (subtle banner).

---

## 10. Accessibility and Responsiveness

- Contrast AA in light and dark. Focus rings always visible. Full keyboard navigation. Proper aria labels on icon buttons, tabs, modals.
- Minimum tap target 44×44px. Body text never below 14px.
- Test at 360px, 768px, 1024px, 1280px. No layout shift while loading. Images and avatars have fixed dimensions.
- Respect `prefers-reduced-motion` and `prefers-color-scheme` (default to system, allow manual override, remember choice).

---

## 11. Do / Don't

**Do:** use tokens everywhere · generous whitespace · one accent colour · soft shadows · consistent radius · tabular numbers for money · semantic colour only for status.

**Don't:** use pure black (#000) or pure white text on dark · more than one gradient per screen · heavy 2px borders · emoji as icons · random colours outside the tokens · change copy, logic, routes, data or permissions.

---

## 12. Final Acceptance Checklist

- [ ] Every page uses Manrope (headings), Inter (body), Noto Sans Bengali (Bangla), JetBrains Mono (codes).
- [ ] No hard-coded hex colours remain in components.
- [ ] Light and dark themes both complete and consistent.
- [ ] Buttons, inputs, cards, tables, tabs, badges, modals, toasts look identical across pages.
- [ ] Status colours follow §2.3 everywhere.
- [ ] Mobile bottom navigation and desktop sidebar match §7.
- [ ] App builds with zero errors and all features still work exactly as before.

---

**Stack Dev** | Savar, Dhaka | +880 1963-131282
