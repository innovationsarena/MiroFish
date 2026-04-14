# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
COPY locales/ ./locales/

RUN cd frontend && npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
