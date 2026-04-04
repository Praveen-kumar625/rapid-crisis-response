# Production Dockerfile for RCR Backend (Root Proxy)
FROM node:18-alpine

WORKDIR /app

# Copy package files from the nested directory
COPY RCR/backend/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the backend source code
COPY RCR/backend/ ./

# Set environment to production
ENV NODE_ENV=production

# Expose the API port
EXPOSE 5000

# Use non-root user for security
USER node

# Start the application
CMD ["npm", "start"]
