# Production Dockerfile for RCR Backend (Workspace Root)
FROM node:18-alpine

# Set working directory to the workspace root inside the container
WORKDIR /app/RCR

# 1. Copy workspace root package files (includes package-lock.json)
COPY RCR/package*.json ./

# 2. Copy ALL workspace package files to satisfy workspace requirements
# Even if we only build backend, npm needs to see the directories defined in workspaces
COPY RCR/backend/package*.json ./backend/
COPY RCR/frontend/package*.json ./frontend/

# 3. Install production dependencies for the backend workspace
# We use npm ci here because we now have the root package-lock.json and all workspace package.json files
RUN npm ci -w backend --omit=dev

# 4. Copy the rest of the backend source code
COPY RCR/backend/ ./backend/

# Set environment to production
ENV NODE_ENV=production

# Expose the API port
EXPOSE 5000

# Use non-root user for security
USER node

# Start the application from the backend directory
WORKDIR /app/RCR/backend
CMD ["npm", "start"]
