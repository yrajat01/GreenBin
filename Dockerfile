# ========================================================
# GreenBin Multi-Stage Fullstack Production Dockerfile
# ========================================================

# Stage 1: Build Vite React Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# Build production bundle
RUN npm run build

# Stage 2: Install Server Dependencies
FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy server dependencies and code
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/package*.json ./server/
COPY server/src ./server/src

# Copy built frontend assets to client/dist
COPY --from=client-builder /app/client/dist ./client/dist

# Expose port
EXPOSE 5000

# Run as unprivileged node user
USER node

WORKDIR /app/server
CMD ["node", "src/server.js"]
