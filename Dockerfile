# Build stage
FROM node:20.18.1-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20.18.1-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]