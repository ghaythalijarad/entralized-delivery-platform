# Dockerfile for AWS App Runner
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY fastapi-template/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY fastapi-template/ .

# Expose the port
EXPOSE 8080

# Default command to run the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
