# Deployment stack

This folder contains a production-oriented Docker deployment for the monorepo:

- `nginx` as the public reverse proxy
- `web` on the main app domain
- `api` behind `https://APP_DOMAIN/api`
- `admin` on a separate admin domain
- `postgres` and `redis` as private internal services

## Files

- `docker-compose.yml` - full deployment stack
- `.env.example` - environment variables for deployment
- `docker/Dockerfile` - multi-stage build for API, web, and admin
- `nginx/templates/default.conf.template` - edge reverse proxy config
- `nginx/admin.conf` - static admin container config

## Expected domains

- App: `https://APP_DOMAIN`
- Admin: `https://ADMIN_DOMAIN`
- API: `https://APP_DOMAIN/api`

Using a separate admin domain avoids changing the Vite router basename just to
support a `/admin` path prefix.

## Deploy

1. Copy the deployment env file:

```bash
cp devops/.env.example devops/.env
```

2. Fill at minimum:

```bash
APP_DOMAIN=app.example.com
ADMIN_DOMAIN=admin.example.com
POSTGRES_PASSWORD=...
JWT_SECRET=...
USER_KEY_ENC_SECRET=...
```

3. Point DNS for both domains to the host that will run Docker.

4. Start the stack:

```bash
docker compose --env-file devops/.env -f devops/docker-compose.yml up -d --build
```

5. Check service status:

```bash
docker compose --env-file devops/.env -f devops/docker-compose.yml ps
docker compose --env-file devops/.env -f devops/docker-compose.yml logs -f nginx api web admin
```

## Notes

- The API container runs TypeORM production migrations before starting Nest.
- `WEB_INTERNAL_API_BASE_URL` defaults to the internal Docker service URL for
  server-side requests from Next.js.
- The `nginx` config is HTTP-only. Add TLS termination in front of it, or
  extend this stack with Let’s Encrypt / certbot before exposing it publicly.
- The Codex workspace is stored in the named volume `laws_codex_data`.
