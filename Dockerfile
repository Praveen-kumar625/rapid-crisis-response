# Unified Production Dockerfile for RCR Backend
FROM node:18-alpine

WORKDIR /app

# 1. Copy root and workspace package files
COPY RCR/package*.json ./
COPY RCR/backend/package*.json ./backend/
COPY RCR/frontend/package*.json ./frontend/

# 2. Install backend dependencies only
RUN npm install -w backend --omit=dev --no-audit --no-fund

# 3. Copy ONLY source code (SKIP LOCAL .ENV)
COPY RCR/backend/src ./backend/src
COPY RCR/backend/knexfile.js ./backend/

# Set environment
ENV NODE_ENV=production
EXPOSE 5000

# Use non-root user
USER node

# Start from backend directory
WORKDIR /app/backend

# 🚨 Auto-migrate and Start
CMD ["sh", "-c", "npm run migrate && npm start"]
