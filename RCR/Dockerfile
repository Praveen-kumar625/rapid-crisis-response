# Simple Dockerfile for RCR Backend (skip monorepo complexity)
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./

# Install backend dependencies (reproducible)
RUN npm ci --only=production

# Copy backend project files
COPY backend/ ./

# Ensure we are using production .env from Render env vars (do not commit secrets)
# Expose port
EXPOSE 5000

# Start backend
CMD ["npm", "--prefix", "./", "start"]
