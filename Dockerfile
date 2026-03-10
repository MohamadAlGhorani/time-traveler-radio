# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Only copy what's needed for production
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev
COPY server.js ./
COPY --from=build /app/dist ./dist

# Run as non-root user
USER node

EXPOSE 3000
CMD ["node", "server.js"]
