FROM node:24-alpine AS base
RUN corepack enable

# --- Stage 1: turbo pruneでこのappに必要な部分だけ切り出す ---
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune web --docker

# --- Stage 2: 依存関係インストール + ビルド ---
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .

ARG KEYCLOAK_ISSUER=http://localhost:8080/realms/sample-app
ARG KEYCLOAK_CLIENT_ID=build-placeholder
ARG KEYCLOAK_CLIENT_SECRET=build-placeholder
ARG BETTER_AUTH_SECRET=build-placeholder
ARG BETTER_AUTH_URL=http://localhost:3000
ARG DATABASE_URL=postgres://user:pass@localhost:5432/app
ENV KEYCLOAK_ISSUER=$KEYCLOAK_ISSUER \
    KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID \
    KEYCLOAK_CLIENT_SECRET=$KEYCLOAK_CLIENT_SECRET \
    BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
    BETTER_AUTH_URL=$BETTER_AUTH_URL \
    DATABASE_URL=$DATABASE_URL

RUN pnpm turbo run build --filter=web


# --- Stage 3: 実行専用の最終イメージ ---
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
