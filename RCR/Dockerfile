# Root Dockerfile for Rapid Crisis Response Backend
# Render expects Dockerfile at root level

FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend code
COPY backend/src ./src
COPY backend/knexfile.js ./
COPY backend/.env ./

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
