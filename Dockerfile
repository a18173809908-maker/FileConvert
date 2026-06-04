# syntax=docker/dockerfile:1.7
# 使用 debian-slim 而非 alpine，避免 sharp 的 musl/libvips 兼容问题

# ---------- 1) 依赖层 ----------
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---------- 2) 构建层 ----------
FROM node:20-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- 3) 运行层 ----------
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS="--max-old-space-size=2048" \
    CONVERT_CONCURRENCY=2 \
    CONVERT_ACQUIRE_TIMEOUT_MS=15000 \
    RATE_LIMIT_BURST=5 \
    RATE_LIMIT_PER_SEC=0.5

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone 产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# sharp 没有被 standalone 收集，单独复制
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
