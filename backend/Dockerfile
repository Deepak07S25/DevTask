# Stage 1: Build & Generating Prisma Client
FROM node:18-alpine AS builder

WORKDIR /app

# Install openssl (Required by Prisma for Alpine images)
RUN apk add --no-cache openssl

# Copy package management files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies needed for Prisma generation)
RUN npm ci

# Generate Prisma Client specifically for the Alpine OS
RUN npx prisma generate

# Copy the rest of the application
COPY . .


# Stage 2: Production Execution Environment
FROM node:18-alpine

WORKDIR /app

# Install openssl again for the runtime environment
RUN apk add --no-cache openssl

# Copy ONLY the files required for production from the builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.js ./server.js
# Required for `prisma migrate deploy` at startup (migrations + schema)
COPY --from=builder /app/prisma ./prisma

# Hardcode the environment exactly to production for env.js resolution
ENV NODE_ENV=production
ENV PORT=5000

# Expose standard port
EXPOSE 5000

# Start server using the standard production alias
CMD ["npm", "run", "start:prod"]
