# ==========================================
# Stage 1: Build Image
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy dependency files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY . .

# Dummy DATABASE_URL for Prisma generate build step
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_starter_db?schema=public"

# Generate Prisma Client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Production Runner Image
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
USER node

# Copy build artifacts and dependencies
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node --from=builder /app/templates ./templates

EXPOSE 3000

# Run migrations and start app
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]