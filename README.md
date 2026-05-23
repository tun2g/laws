# Laws

> Web app that lets non-technical Vietnamese lawyers run the
> [cclaws](../cclaws) legal-research workflow without installing Node, Codex
> CLI, or VS Code. Users sign in, connect their Codex (OpenAI) account, and
> the server runs every skill — research, review, translate, dual-language,
> docx export — on their behalf with their credit.

## Monorepo layout

```
laws/
├── apps/
│   ├── api/                   # NestJS 11 backend, TypeORM + Postgres
│   ├── web/                   # Next.js 15 public web app for end users
│   └── admin/                 # Vite + React + AntD admin panel
├── packages/
│   ├── shared/                # Types shared across all apps
│   └── skill-prompts/         # cclaws SKILL.md bundled as TS strings
├── docker-compose.yml         # Postgres + Redis for local dev
├── devops/                    # Docker + nginx deployment stack
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Stack

| Layer        | Tech                                                                 |
| ------------ | -------------------------------------------------------------------- |
| Backend      | NestJS 11, TypeORM, Postgres, JWT auth, Codex CLI integration, SSE     |
| Web          | Next.js 15 App Router, React 19, Tailwind v4, TanStack Query, Zustand |
| Admin        | Vite 6, React 19, Ant Design 5, TanStack Query                       |
| Shared       | pnpm workspaces + Turborepo, TypeScript 5.6                          |

## How the Codex integration works

Each user must connect their Codex / ChatGPT account before any skill is
usable. This is enforced both at the API (`UnauthorizedException` with
`code: 'CODEX_NOT_CONNECTED'`) and at the web (the `AppShell` redirects
unconnected users to `/onboarding/connect-codex`).

The flow:

1. User opens the onboarding screen and starts the device-code login.
2. API spawns `codex login --device-auth` under a per-user `CODEX_HOME`.
3. User completes the approval flow in ChatGPT/OpenAI on the verification page.
4. The API stores only the server-side paths for that user's isolated `CODEX_HOME`
   and workspace, and checks for `auth.json` to determine connected status.
5. Skill and chat runs execute with `codex exec --json`, scoped to the user's
   own workspace and sandbox settings, then stream events back to the browser via SSE.

The cclaws skills are bundled in `packages/skill-prompts/src/skills/` —
keep these files in sync with the canonical `cclaws/.claude/skills/*/SKILL.md`.

## Per-app config files

Each app loads env via its own typed config file:

- `apps/api/src/config/configuration.ts` — read with `configService.get('db.host')`
- `apps/web/src/config/env.ts` — `import { env } from '@/config/env'`
- `apps/admin/src/config/env.ts` — same idea, Vite-style `import.meta.env`

Never read `process.env` directly from feature code; always go through these
modules so default values, type narrowing, and validation live in one place.

## Local setup

```bash
# 1. Install
pnpm install

# 2. Copy env templates
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env

# 3. Bring up Postgres + Redis
docker compose up -d

# 4. Run TypeORM migrations
pnpm --filter @laws/api migration:generate
pnpm --filter @laws/api migration:run

# 5. Start everything
pnpm dev               # turbo runs api + web + admin
# or individually:
pnpm --filter @laws/api dev
pnpm --filter @laws/web dev
pnpm --filter @laws/admin dev
```

Default ports:

| App   | URL                          |
| ----- | ---------------------------- |
| Web   | http://localhost:4001        |
| Admin | http://localhost:4002        |
| API   | http://localhost:4000/api    |
| Swagger | http://localhost:4000/api/docs |

## Git setup

This repo is now initialized with Git locally. Typical first steps:

```bash
git status
git add .
git commit -m "Initial commit"
```

If you prefer `main` instead of the default `master` branch from `git init`:

```bash
git branch -m main
```

## Deployment

Production-oriented container deployment lives under `devops/`.

Key files:

- `devops/docker-compose.yml`
- `devops/.env.example`
- `devops/docker/Dockerfile`
- `devops/nginx/templates/default.conf.template`
- `devops/README.md`

Bring it up with:

```bash
cp devops/.env.example devops/.env
docker compose --env-file devops/.env -f devops/docker-compose.yml up -d --build
```

## Module map (API)

```
src/
├── app.module.ts                       # Wires everything together
├── main.ts                             # Bootstraps Nest, helmet, swagger, CORS
├── swagger.ts
├── config/
│   └── configuration.ts                # Typed env reader
├── database/
│   ├── data-source.ts                  # TypeORM CLI data source
│   ├── typeorm-config.service.ts       # Used by TypeOrmModule.forRootAsync
│   └── migrations/
├── shared/
│   ├── crypto.util.ts                  # AES-256-GCM for user keys
│   ├── decorators/                     # @CurrentUser, @Roles, @Public
│   ├── guards/                         # JwtAuthGuard, RolesGuard
│   └── modules/
│       └── codex/                      # OpenAI Responses API client
└── modules/
    ├── auth/                           # register, login, /me (passport-jwt)
    ├── users/                          # profile, PUT /users/me/codex
    ├── projects/                       # one per legal matter
    ├── skills/                         # single entry for all skill kinds
    │   ├── skills.controller.ts        # POST /skills/runs, SSE :id/stream
    │   ├── skills.service.ts
    │   ├── dto/start-skill.dto.ts
    │   └── entities/skill-run.entity.ts
    └── admin/                          # stats, user list, runs list
```

Adding a new skill: drop a SKILL.md → TS file under
`packages/skill-prompts/src/skills/`, register it in
`packages/skill-prompts/src/index.ts`, and it'll show up automatically in
`GET /api/skills` and the web's "Skills" page.

## Security notes

- Each user has an isolated `CODEX_HOME` and workspace on the server.
- Disconnecting Codex wipes the server-side login material for that user.
- The Codex endpoint requires `ADMIN` role only via the `RolesGuard`; the
  default Nest setup applies `JwtAuthGuard` globally — routes opt out with
  `@Public()`.
- SSE auth uses `?access_token=` because `EventSource` cannot set headers;
  rotate JWTs frequently and consider switching to fetch-based streaming
  (`Response.body.getReader()`) to keep the token in the `Authorization`
  header.
- Rate limiting: `@nestjs/throttler` set to 120 req/min globally — tune per
  route as you scale.

## What's intentionally NOT here yet

- DOCX rendering pipeline (the `docx` skill prepares Markdown, but the
  actual .docx file generation is left as a TODO — the `docx` npm package
  is in `apps/api/package.json` ready to use).
- BullMQ queue for very long runs — current MVP streams synchronously.
  Add a worker if any skill needs > 10 min.
- OAuth-based Codex login (the official Codex CLI uses ChatGPT device flow).
  Wire this in by adding a `/auth/codex/oauth/*` controller and storing the
  refresh token in the same `openaiKeyCipher` column.
- Audit log writes (entity exists, no service yet).
- E2E tests.

## Useful commands

```bash
pnpm --filter @laws/api dev               # nest start --watch
pnpm --filter @laws/api migration:generate  # after entity change
pnpm --filter @laws/web dev               # next dev
pnpm --filter @laws/admin dev             # vite dev

pnpm typecheck                            # turbo run typecheck across packages
pnpm build                                # production build of all apps
```
