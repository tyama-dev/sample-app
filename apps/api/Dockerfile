FROM node:24-alpine AS base
RUN corepack enable

# --- Stage 1: turbo pruneでこのappに必要な部分だけ切り出す ---
FROM base AS pruner
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune api --docker

# --- Stage 2: ビルド(tscでTS→JSに変換するだけ) ---
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=api

# --- Stage 3: 実行専用の最終イメージ ---
FROM base AS runner
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/apps/api/dist ./apps/api/dist

RUN addgroup --system --gid 1001 hono
RUN adduser --system --uid 1001 hono
RUN chown -R hono:hono /app
USER hono

EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
