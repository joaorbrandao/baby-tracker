# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copy workspace manifests first so npm can install both client and server
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/

# Install all dependencies (including dev) needed for building
RUN npm ci

# Copy source and build
COPY client/ client/
COPY server/ server/

# Install openssl so Prisma can detect the libssl version in Alpine
RUN apk add --no-cache openssl

# Generate Prisma client for the SQLite schema
RUN npx prisma generate --schema server/prisma/schema.prisma

# Build the client, the server, and the utility scripts
RUN npm run build -w client && npm run build -w server && npm run build:scripts -w server

# Remove dev dependencies from node_modules for the runtime stage
RUN npm prune --omit=dev

# ---------- Runtime stage ----------
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Install dumb-init for proper signal handling and openssl for Prisma
RUN apk add --no-cache dumb-init openssl

# Use the existing node user and prepare the SQLite data directory
RUN mkdir -p /data && chown -R node:node /data
VOLUME /data

# Copy production artifacts
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/client/dist ./client/dist
COPY --from=build --chown=node:node /app/server/dist ./server/dist
COPY --from=build --chown=node:node /app/server/prisma ./server/prisma
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
