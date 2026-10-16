# Frontend Dockerfile — Clearview Complaints Management
# Next.js 15 production build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and install all dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source files and build
COPY . .
RUN npm run build

# ── Production image ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only what's needed for runtime
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

EXPOSE 3000

CMD ["node", "server.js"]
