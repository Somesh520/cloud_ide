# Use Node.js base image
FROM node:18-slim

# Install g++ and build essentials
RUN apt-get update && \
    apt-get install -y g++ build-essential && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create temp directory for code execution
RUN mkdir -p temp && chmod 777 temp

# Expose the backend port
EXPOSE 5001

# Start the application
CMD ["npm", "start"]
