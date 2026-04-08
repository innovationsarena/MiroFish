FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies first for layer caching
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# Copy shared locales (i18n/index.js globs ../../../locales/)
COPY locales/ ./locales/

# Copy frontend source
COPY frontend/ ./frontend/

# Build the Vue SPA
# Use --outDir to write output to a known location
WORKDIR /app/frontend
RUN npx vite build 2>&1 || (echo "--- Build failed. Listing /app structure ---" && ls -la /app/ /app/locales/ /app/frontend/src/i18n/ && false)

# --- Production stage ---
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
