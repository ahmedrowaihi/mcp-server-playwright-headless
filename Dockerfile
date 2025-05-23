# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
# Use a Node.js image as the base for building
FROM node:20 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies without running prepare script
RUN npm install --production=false --ignore-scripts

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Use a smaller Node.js image for the final output
FROM node:20-slim AS release

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install only production dependencies
RUN npm install --production --ignore-scripts

# Define the entry point for the Docker container
ENTRYPOINT ["node", "dist/index.js"]
