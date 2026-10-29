# Progress

## Current verified state
- Repository root: `C:\Desktop\not so active\aloyz`
- Branch: `main`
- Standard startup: `pnpm dev`
- Standard verification: `pnpm exec tsc --noEmit` plus targeted ESLint
- Last known green commit: `585b0c6` for typecheck; manual UI verification pending
- Highest priority unfinished feature: `package-session-usage`
- Current blocker: none.

## Session record

### 2026-10-29 — Package session usage, responsive customer list, staff columns
- Completed:
  - Fixed package-sale delete dialog rendering by moving it outside the table scroll container.
  - Added `used`, `remaining`, and `usedCheckoutIds` to package sale lines.
  - Added server-side checkout attendance diff logic: Geldi deducts one session, Gelmedi/deletion restores it.
  - Package sales table now shows used and remaining/quantity.
  - Web customer list hides email/Instagram/notes on small screens and shows name + phone + chevron.
  - Daily calendar view now uses colored staff columns; weekly/monthly appointment cards use staff colors.
  - Mobile web calendar now defaults to daily staff columns instead of the weekly day grid.
  - Added a mobile topbar customer search row; search matches both names and normalized phone digits.
  - Package sale modal now stays open if the server save fails instead of closing and losing the entry.
  - Customer detail now shows package total, paid amount, Kalan X/Y and Kullanılan X.
  - Confirmed the business had 0 package sales; the last manual sale was deleted.
  - Fetched 7,945 Salonappy package sales slowly (16 sequential pages, no block).
  - Imported 2,714 active 2025+ package sales (1.54 MB compact JSON) and linked them to existing customer IDs.
  - Added 100/page pagination to Paket satışları.
- Verification run:
  - `pnpm exec tsc --noEmit` passed.
  - Package usage performance test: 2,714 sales normalized in 44 ms; Seher's package 8 -> 7.
  - Package helper tests: apply, idempotent, restore, delete restore, cancelled, different customer.
  - Targeted ESLint: `lib/packageUsage.ts`, sales, customers, customer-picker, and shell are clean; calendar has only the pre-existing Google-sync errors.
- Evidence recorded: none yet; end-to-end UI verification pending.
- Commits: `72f7201`, `413724f`, `fbe7f36`, `585b0c6`.
- Known risks:
  - Server-side usage is applied through `/api/business`; admin-mode updates use a separate route and are not covered.
  - Package line with empty serviceId falls back to any remaining package for that customer.
  - Calendar daily staff columns and responsive customer table need manual visual verification.
- Next best action: verify the three UI flows manually, then commit and push.

### 2026-10-29 — Sevim Alan import follow-up: Turkish data, calendar UX, appointment editing
- Completed:
  - Imported all 65 previously missing booking details with a sequential, rate-limited fetch (no block).
  - Replaced the 74 summary appointment rows with exact service/staff lines.
  - Translated English service names and appointment descriptions to Turkish.
  - Added calendar defaults: weekly view, 60-minute slots, 80% width.
  - Compacted empty time rows and reduced calendar column widths.
  - Added per-appointment edit/cancel modal from calendar cards.
  - Extended PATCH `/api/appointments/[id]` with field validation, approval gate, and business-scoped service/staff validation.
  - Removed Kaynak/source columns from Randevular and overview.
  - Grouped multi-service Salonappy bookings in Randevular and overview.
  - Removed the calendar 80%-width cap that left a white gap; the grid now fills the panel while keeping compact rows.
- Verification run:
  - `pnpm exec tsc --noEmit` passed before and after commit `983c2dd`.
  - DB checks: 422 appointments, 0 summary rows, 0 English service titles/descriptions, 0 duplicate event IDs.
  - DB grouping check: 365 booking groups, 46 multi-service groups, 0 cross-customer/date merges.
  - DB settings check: calendarView=Haftalık görünüm, calendarWidth=80, calendarSlotInterval=60 Dakika.
  - Targeted ESLint still reports pre-existing errors in DashboardApp/Google-sync code; no new error was identified in the new modal/grouping code.
- Evidence recorded: `salonappy-data-translation` passing at `983c2dd`.
- Commits: `983c2dd`, `7108849`, `f6525a6`.
- Known risks:
  - Google Calendar cards remain read-only and fall back to the Randevular page instead of opening the local edit modal.
  - Manual UI verification is still required for defaults, compact rows, modal editing, and grouping.
  - The working tree still contains unrelated pre-existing mobile/dashboard changes.
- Next best action:
  - Manually test the calendar and appointment list, then mark `calendar-ux` and `appointment-list-cleanup` passing if the behavior is correct.
