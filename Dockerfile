# ------------------------------------------------------------------------------
# Multi-Stage Production Dockerfile for HireLens Full-Stack Application
# Stage 1: Build Frontend Assets with Vite
# Stage 2: Production Node.js Environment with Express REST API Server
# ------------------------------------------------------------------------------

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy application source code
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV SERVE_CLIENT=true

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets from builder
COPY --from=builder /app/dist ./dist

# Copy backend server code and data
COPY server/ ./server/
COPY prompts/ ./prompts/
COPY fixtures/ ./fixtures/

# Expose backend port
EXPOSE 5000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the full-stack server
CMD ["node", "server/index.js"]
