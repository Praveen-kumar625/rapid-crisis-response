# Robust Workspace-aware Dockerfile for Backend
FROM node:22-alpine

WORKDIR /app

# 1. Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# 2. Install production dependencies for the backend workspace
RUN npm install -w backend --omit=dev --no-audit --no-fund

# 3. Copy the rest of the backend source
COPY backend/ ./backend/

# Set environment
ENV NODE_ENV=production
EXPOSE 3001

# Use non-root user
USER node

# Start from backend directory
WORKDIR /app/backend

# 🚨 AUTO-MIGRATE: Ensure database is ready before starting the API
CMD ["sh", "-c", "npm run migrate && npm start"]
