<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->
# Project Rules

## Package Manager
This project uses **pnpm** exclusively. Never use `npm` or `yarn`.
- Install deps: `pnpm install`
- Run scripts: `pnpm dev`, `pnpm build`, `pnpm lint`
- Add packages: `pnpm add <pkg>`, `pnpm add -D <pkg>`
- Prisma: `pnpm prisma generate`, `pnpm prisma migrate dev`, `pnpm prisma migrate reset`

## Database
- Provider: PostgreSQL
- ORM: Prisma v7 — connection URL lives in `prisma.config.ts`, NOT in `schema.prisma`
- Migrations: `pnpm prisma migrate dev --name <description>`
- Reset DB: `pnpm prisma migrate reset`

## FAQ field shape
Business `faqs` JSON array uses `{ question: string, answer: string }` keys.

## Verification Discipline
- Keep verification lightweight and proportional to the change.
- Do not run `pnpm build` for routine checks unless explicitly requested or the change genuinely needs a production build.
- For syntax and TypeScript checks, prefer `pnpm exec tsc --noEmit`.
- Avoid running multiple redundant verification commands when one targeted check is enough.
- Do not use the in-app Browser or browser automation for routine local UI verification. The user will manually test visual/UI behavior unless they explicitly ask for browser-based verification.

## Git
- Do not run git commands unless the user explicitly asks for them.
- The user manages commits, pushes, and deploy-triggering changes through GitHub Desktop.
<!-- END:project-rules -->
