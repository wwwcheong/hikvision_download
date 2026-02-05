# Stage 1: Build the frontend
FROM node:20-alpine AS builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Run the backend and serve the frontend
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy backend package files and install production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source code
COPY backend/ ./

# Copy built frontend from builder stage to backend/public
COPY --from=builder /app/frontend/dist ./public

EXPOSE 5000

CMD ["node", "server.js"]
