# =====================================================
# CYNO Healthcare Backend - Production Dockerfile
# =====================================================
# Multi-stage build for optimized image size
# dhbhhhbhbhbhb
# =====================================================
# Stage 1: Builder - Install dependencies
# =====================================================
FROM python:3.11-slim-bookworm AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /app

# Copy requirements first for better layer caching
COPY requirements.txt .

# Create a virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -r requirements.txt

# =====================================================
# Stage 2: Runtime - Production image
# =====================================================
FROM python:3.11-slim-bookworm AS runtime

# Labels
LABEL maintainer="CYNO Healthcare Team" \
      version="1.0.0" \
      description="CYNO Healthcare Backend API"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    # Prisma settings
    PRISMA_PY_DEBUG_GENERATOR=0 \
    # PaddleOCR settings
    PADDLEOCR_HOME=/app/.paddleocr \
    # Application settings
    APP_HOME=/app \
    PATH="/opt/venv/bin:$PATH"

# Install runtime system dependencies
# - libpq5: PostgreSQL client library
# - poppler-utils: PDF to image conversion (pdf2image)
# - libgl1: OpenGL library (OpenCV dependency)
# - libglib2.0-0: GLib library (OpenCV dependency)
# - libgomp1: OpenMP runtime (PaddlePaddle dependency)
# - libsm6, libxext6, libxrender1: X11 libraries (PaddleOCR)
# - libatomic1: Required for Prisma CLI on ARM64
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libatomic1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create a non-root user for security
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Set working directory
WORKDIR $APP_HOME

# Copy virtual environment from builder
COPY --from=builder --chown=appuser:appgroup /opt/venv /opt/venv

# Copy application code
COPY --chown=appuser:appgroup . .

# Create necessary directories
RUN mkdir -p uploads .paddleocr && \
    chown -R appuser:appgroup $APP_HOME

# Switch to non-root user
USER appuser

# Generate Prisma client
RUN prisma generate

# Expose the application port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl --fail http://localhost:8000/api/health || exit 1

# Run database migrations and start the server
# Using shell form to allow environment variable expansion
CMD ["sh", "-c", "prisma db push --skip-generate && uvicorn main:app --host 0.0.0.0 --port 8000"]
