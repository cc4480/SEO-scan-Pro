# SEO Scan Pro — production image. Chromium is installed from apt (with every shared library it
# needs) instead of letting Puppeteer download one, which fails at runtime on a slim base image.
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium fonts-liberation fonts-noto-color-emoji \
      openssl ca-certificates tini python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Dependencies first so this layer is cached until package files change.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --include=dev

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
RUN chown -R node:node /app
USER node

EXPOSE 3000
# tini reaps Chromium's child processes and forwards SIGTERM so the graceful shutdown runs.
# Migrations are applied before the server starts; a failed migration stops the boot.
CMD ["tini", "--", "sh", "-c", "npx prisma migrate deploy && exec node dist/server.mjs"]
