# Use an official, lightweight Node.js image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install project dependencies
RUN npm ci --only=production

# Copy the rest of the backend application code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose the port that the API runs on
EXPOSE 5000

# Use non-root user for security
USER node

# Start the application
CMD ["npm", "start"]