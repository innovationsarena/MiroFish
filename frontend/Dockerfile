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
RUN cd frontend && npm run build

# --- Production stage ---
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
