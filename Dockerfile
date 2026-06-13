FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV DATABASE_URL=mysql://placeholder:placeholder@placeholder:3306/placeholder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Create non-root user and ensure upload directory is writable.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    mkdir -p /app/public/uploads && \
    chown -R nodejs:nodejs /app

COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts

# Install production dependencies in runner stage for reliability.
RUN npm ci --omit=dev && \
    rm -rf /app/.cache && \
    ln -sf /app/node_modules/.bin/prisma /usr/local/bin/prisma

USER nodejs

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 4000) + '/api/health', (r) => r.resume() && process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["sh", "-c", "node scripts/migrate-deploy.mjs && node prisma/seed-if-empty.mjs && node server.js"]
