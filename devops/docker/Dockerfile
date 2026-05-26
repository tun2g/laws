FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/skill-prompts/package.json packages/skill-prompts/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG NEXT_PUBLIC_API_BASE_URL
ARG API_BASE_URL
ARG AUTH_COOKIE_NAME
ARG NEXT_PUBLIC_BRAND_NAME
ARG VITE_API_BASE_URL
ARG VITE_BRAND_NAME
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL
ENV AUTH_COOKIE_NAME=$AUTH_COOKIE_NAME
ENV NEXT_PUBLIC_BRAND_NAME=$NEXT_PUBLIC_BRAND_NAME
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BRAND_NAME=$VITE_BRAND_NAME
COPY . .
RUN pnpm build

FROM node:22-alpine AS api-runner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Python + python-docx for the vn-legal-* skills Codex runs in-container.
# lxml (a transitive dep) needs libxml2/libxslt; build deps are wiped after
# pip install to keep the final image slim.
RUN apk add --no-cache python3 py3-pip libxml2 libxslt \
 && apk add --no-cache --virtual .build-deps \
      build-base python3-dev libxml2-dev libxslt-dev \
 && python3 -m venv /opt/skills-venv \
 && /opt/skills-venv/bin/pip install --no-cache-dir python-docx==1.1.2 \
 && apk del .build-deps
ENV PATH="/opt/skills-venv/bin:$PATH"

RUN corepack enable
RUN npm install -g @openai/codex@0.133.0
WORKDIR /app
COPY --from=build /app /app
EXPOSE 4000
CMD ["pnpm", "--filter", "@laws/api", "start:prod"]

FROM node:22-alpine AS web-runner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY --from=build /app /app
EXPOSE 4001
CMD ["pnpm", "--filter", "@laws/web", "start"]

FROM nginx:1.27-alpine AS admin-runner
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY devops/nginx/admin.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
