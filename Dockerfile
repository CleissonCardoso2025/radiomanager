
# Use the official Node.js 18 image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port 3000
EXPOSE 3000

# Update vite.config.ts port configuration during build
RUN sed -i 's/port: 8080/port: 3000/' vite.config.ts

# Start the application
CMD ["npm", "run", "dev"]

