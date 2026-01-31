# WorldClass ERP Backend - Production Dockerfile
# Multi-stage build for security and efficiency

# ============================================
# STAGE 1: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY backend/package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

# ============================================
# STAGE 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache curl dumb-init

# Download AWS RDS SSL certificate
RUN curl -sS -o /app/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S erp -u 1001 -G nodejs

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set proper ownership
RUN chown -R erp:nodejs /app

# Switch to non-root user
USER erp

# Environment variables (defaults - override with .env or docker-compose)
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
