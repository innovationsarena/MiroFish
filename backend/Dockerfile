FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

WORKDIR /app/backend

# Copy dependency files first for layer caching
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy backend source
COPY backend/ ./

# Copy shared locales (locale.py resolves to /app/locales/)
COPY locales/ /app/locales/

EXPOSE 5001

CMD ["uv", "run", "python", "run.py"]
