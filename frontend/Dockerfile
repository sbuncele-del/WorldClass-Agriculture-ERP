# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Increase Node.js memory limit for build
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package*.json ./
# Use npm install if no package-lock.json exists
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
