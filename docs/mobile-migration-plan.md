# Aloyz Expo SDK 54 migration plan

## Repository inventory

The maintained application is a Next.js 16.2.4 App Router project backed by PostgreSQL and Prisma 7.8. The ignored `salonappy/` directory is a compiled reference dump (bundled JavaScript, CSS, images, translations, logs, and screenshots), not maintained source. `.next/`, `node_modules/`, and generated Prisma output are build/dependency artifacts.

### Web routes

| Web route | Current responsibility | Mobile destination |
| --- | --- | --- |
| `/` | Marketing entry and authenticated redirect | Native session gate / welcome screen |
| `/login` | Auth.js Google sign-in | Native browser-based Google sign-in bridge |
| `/dashboard` | Business dashboard and all business workflows | Authenticated Expo Router tabs and stacks |
| `/admin` | Administrator console | Deferred admin stack; not mixed into the business tabs |
| `/invite/accept` | Authenticated invitation acceptance | Deep-link-capable invitation screen |
| `/randevu/[slug]` | Public appointment booking | `/booking/[slug]` native route |
| `/privacy` | Privacy policy | Native legal screen, with canonical web link |
| `/terms` | Terms of use | Native legal screen, with canonical web link |

### Server/API surface

- Authentication: Auth.js Google provider at `/api/auth/[...nextauth]`; JWT browser sessions; Prisma adapter; user role and approval status are attached to the session.
- Business: `/api/business` (GET/POST/PATCH), `/api/onboarding/business`, and `/api/business/invites`.
- Invitations: `/api/invites/pending` and `/api/invites/accept`.
- Scheduling: `/api/calendar/events`, `/api/appointments/[id]`, and public `/api/public/booking/[slug]`.
- WhatsApp instance operations: `/api/instances/list`, `/api/instances/create`, `/api/instances/qr`, and `/api/instances/delete`.
- Instagram: connect, callback, disconnect, deauthorization, data deletion, and webhook routes under `/api/integrations/instagram` and `/api/webhook/instagram`.
- Files: authenticated raw request-body upload to `/api/upload?filename=...`, stored through Vercel Blob.
- Admin: business/user/password/mail endpoints under `/api/admin`.
- External server integrations: Google Calendar, Resend, Evolution API, Vercel Blob, Meta/Instagram, PostgreSQL/Prisma.

The existing request and response shapes remain authoritative. Mobile-only authentication endpoints may be added because the cookie-only Auth.js contract cannot be used reliably by a native HTTP client.

### Reusable code and state

- Reusable domain types and normalization helpers currently live together with DOM components in `components/dashboard/app/shared.tsx`.
- Server-safe domain logic already exists in `lib/booking.ts`, `lib/access.ts`, `lib/businessAccess.ts`, `lib/contactDisplay.ts`, `lib/promptCompiler.ts`, and the integration helpers.
- UI state is local React state coordinated by `DashboardApp`; there is no Redux/Zustand/query-cache dependency.
- Server data is fetched directly from screen components and then passed through a large prop tree. The mobile client will replace this with typed services and small providers/hooks.

### Browser-only assumptions to replace

- `next/navigation`, `next/link`, `next/image`, browser URL/history/hash routing, and page redirects.
- `localStorage` for theme, language, and notification preferences.
- `document.documentElement`, DOM tree walking for translation, `querySelector`, and element lookup.
- `window.print`, `window.alert`, `window.confirm`, `window.open`, page reload/assign, and clipboard access.
- `Blob`, object URLs, and generated anchor clicks for CSV downloads.
- HTML inputs, tables, dialogs, scroll areas, Tailwind breakpoints, sticky positioning, and desktop/mobile sidebar CSS.
- Base64 `<img>` rendering for WhatsApp QR codes and remote `<img>` profile images.

There are no maintained client audio/video/camera recording flows. File selection is not currently wired to the upload endpoint. Media migration therefore covers images/QR rendering, document export/sharing, clipboard, external-link opening, and a typed upload service rather than inventing new media features.

### Responsive layout findings

The web dashboard uses Tailwind grids, breakpoint-specific columns, wide data tables, a fixed desktop sidebar, a mobile drawer, sticky headers/asides, and modal overlays. Native screens must use `FlatList`/`SectionList`, cards instead of wide tables on phones, stack/modal routes, Flexbox wrapping, and safe-area-aware bottom actions. Primary layout will not use absolute positioning.

## Target architecture

- Keep the Next.js application as the backend-for-frontend and web product.
- Add an isolated `mobile/` Expo SDK 54 workspace using strict TypeScript and Expo Router.
- Use `SafeAreaProvider` at the root and `SafeAreaView`/`useSafeAreaInsets` from `react-native-safe-area-context` in screens and bottom actions.
- Use React Native primitives and `StyleSheet` with shared color, spacing, radius, and typography tokens. NativeWind is intentionally omitted.
- Use Lucide React Native icons backed by `react-native-svg`.
- Store only the native session token in SecureStore. Store non-sensitive preferences and bounded cache data in AsyncStorage.
- Route all HTTP calls through one typed API client. Domain models, service functions, storage, state, components, and screens remain separate.
- Use Expo FileSystem's SDK 54 `File` API plus Expo Sharing for generated CSV files. Use Expo Clipboard and Linking/WebBrowser for the corresponding browser actions.
- Configure Android `softwareKeyboardLayoutMode` as `pan`; wrap form screens with `KeyboardAvoidingView`; cap multiline input height and keep focused fields scrollable.

## Authentication bridge

Auth.js currently authenticates a browser cookie jar, which is not a safe native session contract. The migration will add a narrowly scoped bridge:

1. The app opens the existing `/login` page in `expo-web-browser`, with a callback to a server route and an Expo deep-link return URI.
2. The authenticated callback creates a short-lived, single-use code in the existing Prisma `VerificationToken` table and redirects to the app.
3. The app exchanges the code for a prefixed opaque session token stored in the existing Prisma `Session` table.
4. The app stores that token in SecureStore and sends it as `Authorization: Bearer ...`.
5. A shared server helper resolves bearer sessions first and falls back to the existing Auth.js browser session, preserving web behavior.
6. Native logout deletes the server session and the SecureStore value.

Production allows only the configured `aloyz` scheme. Expo Go `exp:` callback URLs are a development-only fallback.

## Implementation phases

1. **Foundation**
   - Create the Expo SDK 54 workspace, scripts, app config, strict TypeScript config, root providers, design tokens, primitives, storage adapters, typed API client, and Router shells.
2. **Native authentication and session gate**
   - Add the one-time-code bridge, bearer-aware server auth helper, login/callback/logout flow, approval/no-business states, and business bootstrap.
3. **Core daily workflows**
   - Migrate overview, appointments/calendar list, appointment status changes, customers, checkouts, and public booking.
4. **Business setup and integrations**
   - Migrate profile/hours/staff/services/booking settings, invitations, WhatsApp QR lifecycle, Instagram browser connection, and Google Calendar sync.
5. **Sales, finance, reports, and exports**
   - Migrate product/package sales, expenses/payments/ledgers/commissions, report cards, and native CSV sharing/printing fallbacks.
6. **Secondary surfaces**
   - Migrate messaging lists, subscription/invoices, invite deep links, legal pages, then the separate admin stack.
7. **Hardening and release readiness**
   - Add focused service/domain tests, accessibility labels, empty/error/loading states, offline/cache policy, telemetry hooks, and emulator/device verification. Native builds/exports remain out of scope until explicitly requested.

## Verification gates

- After each meaningful code milestone: `pnpm exec tsc --noEmit` in the relevant workspace or an equivalent targeted TypeScript command.
- Focused service/domain tests when introduced.
- `git diff --check` is not run unless Git commands are explicitly authorized by the user; whitespace is checked without Git instead.
- No native build or export.
- Browser, Android, and iOS verification are reported separately and never inferred from TypeScript success.

## Known migration risks

- Native authentication requires the new bridge and deployment before protected mobile calls can work against production.
- The current dashboard persists many business workflows inside large JSON columns, so concurrent web/mobile edits can overwrite each other. Initial mobile mutations must refetch after writes; longer term, high-churn entities should become dedicated endpoints/tables.
- Several web screens derive export/report rows from the rendered DOM. Mobile must derive them from domain data instead.
- Integration callbacks and Expo deep links require production scheme/host allowlists and provider-console configuration.
- Existing source contains mojibake in some Turkish strings. New mobile copy will use correct UTF-8; broad web-copy cleanup is separate from this migration.
- Expo Go is suitable for the selected foundation modules, but production OAuth callback behavior and any future push notifications still require a development/production build for final verification.
