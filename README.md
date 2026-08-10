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
```

Start Expo on the local network with the required SDK 54 command:

```sh
cd mobile
pnpm exec expo start --lan
```

The mobile app uses Expo Router, strict TypeScript, React Native primitives, SecureStore for the opaque session token, and AsyncStorage for non-sensitive preferences. Native Google login opens the existing web Auth.js flow and exchanges a short-lived one-time code for a revocable mobile session.

Production deep links use `aloyz://`. Set `MOBILE_AUTH_REDIRECT_SCHEMES` on the Next.js deployment only if an additional production scheme is required. Development accepts Expo Go's `exp:` callback scheme; production does not.

## Checks

```sh
pnpm exec tsc --noEmit
pnpm --dir mobile exec tsc --noEmit
pnpm --dir mobile exec expo install --check
```

The full migration inventory, architecture, phases, and known risks are documented in [`docs/mobile-migration-plan.md`](docs/mobile-migration-plan.md).
