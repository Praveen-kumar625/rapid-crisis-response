# Dockerfile for Rapid Crisis Response Monorepo (Backend)
FROM node:18-alpine

WORKDIR /app

# Copy root package files (monorepo with workspaces)
COPY package*.json ./

# Copy backend and frontend package files (for workspace resolution)
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies (including both workspaces)
RUN npm install --production

# Copy backend source code
COPY backend/src ./backend/src
COPY backend/knexfile.js ./backend/
COPY backend/.env ./backend/

# Expose backend port
EXPOSE 5000

# Start backend from workspace
CMD ["npm", "--workspace=backend", "start"]
