# Production Dockerfile for GreenBin Backend API
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy backend source files
COPY src/ ./src/

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Run as non-root user for security
USER node

CMD ["node", "src/server.js"]
