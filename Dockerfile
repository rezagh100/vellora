FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --timeout 60 --retries 5 -i https://mirror-pypi.runflare.com/simple -r requirements.txt
COPY . .