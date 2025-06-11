# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy built application
COPY --from=builder /app/dist ./dist


EXPOSE 5501
CMD ["node", "dist/src/server.js"]