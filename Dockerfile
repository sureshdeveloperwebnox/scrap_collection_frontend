# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose frontend port
EXPOSE 7002

# Start Next.js on port 7002
CMD ["npm", "start", "--", "-p", "7002"]
