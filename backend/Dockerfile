FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

WORKDIR /app

# Install Python dependencies first for layer caching
COPY backend/pyproject.toml backend/uv.lock ./backend/
RUN cd backend && uv sync --frozen

# Copy shared locales (backend loads from ../../../locales relative to app/utils/)
COPY locales/ ./locales/

# Copy backend source
COPY backend/ ./backend/

# Ensure uploads directory exists
RUN mkdir -p /app/backend/uploads

WORKDIR /app/backend

EXPOSE 5001

CMD ["uv", "run", "python", "run.py"]
