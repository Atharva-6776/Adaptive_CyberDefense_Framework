FROM python:3.11-slim

WORKDIR /workspace

# Install system dependencies (build-essential, libpq-dev for postgres)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and database migrations config
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Expose server port
EXPOSE 8000

# Set environment variables defaults
ENV PORT=8000
ENV HOST=0.0.0.0

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
