# Aloyz

Aloyz consists of a Next.js 16 web application/API and an Expo SDK 54 mobile application. PostgreSQL is accessed through Prisma 7 by the Next.js server; the mobile app never connects to the database directly.

## Requirements

- Node.js 20.19 or newer (required by Expo SDK 54)
- pnpm
- PostgreSQL

This repository uses pnpm exclusively.

## Web application and API

Install dependencies and start Next.js:

```sh
pnpm install
pnpm dev
```

The Prisma connection URL is configured in `prisma.config.ts`. Generate the client after dependency or schema changes:

```sh
pnpm prisma generate
```

Do not expose server environment variables to the Expo app. Server integrations use the variables referenced by the route and helper modules, including the database, Auth.js/Google, Evolution API, Google Calendar, Instagram/Meta, Resend, and Vercel Blob credentials.

## Expo mobile application

Copy `mobile/.env.example` to `mobile/.env.local` and set the deployed or LAN-accessible Next.js origin:

```env
EXPO_PUBLIC_API_URL=https://www.aloyz.co
# Optional for a native Google account picker in an EAS development build.
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
# Optional iOS OAuth client URL scheme for native Google sign-in.
EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME=
```

Start Expo on the local network with the required SDK 54 command:

```sh
cd mobile
pnpm exec expo start --lan
```

The mobile app uses Expo Router, strict TypeScript, React Native primitives, SecureStore for the opaque session token, and AsyncStorage for non-sensitive preferences. Expo Go uses the existing web Auth.js flow and exchanges a short-lived one-time code for a revocable mobile session. EAS development/production builds can use the native Google account picker when `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and the Google Cloud Android/iOS client configuration are supplied; the native module is not available in Expo Go.

Production deep links use `aloyz://`. Expo Go uses an `exp://` callback, which is also allowed by the mobile callback route. Set `MOBILE_AUTH_REDIRECT_SCHEMES` on the Next.js deployment only when replacing the default `aloyz,exp` allow-list.

## Checks

```sh
pnpm exec tsc --noEmit
pnpm --dir mobile exec tsc --noEmit
pnpm --dir mobile exec expo install --check
```

The full migration inventory, architecture, phases, and known risks are documented in [`docs/mobile-migration-plan.md`](docs/mobile-migration-plan.md).
