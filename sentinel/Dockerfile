FROM python:3.11-slim

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/false appuser

WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create audit log directories with strict permissions, owned by appuser
RUN mkdir -p /var/log/process_autopilot/audit/hot && \
    mkdir -p /var/log/process_autopilot/audit/cold && \
    chown -R appuser:appuser /var/log/process_autopilot/audit && \
    chmod -R 750 /var/log/process_autopilot/audit

USER appuser

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
