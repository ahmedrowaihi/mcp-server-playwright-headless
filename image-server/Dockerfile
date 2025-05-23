# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory with proper permissions
RUN mkdir -p uploads && \
    chown -R node:node uploads

# Use non-root user
USER node

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"] 