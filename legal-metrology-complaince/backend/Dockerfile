FROM python:3.12-slim
WORKDIR /app

# libglib2.0-0 and libgomp1 are required at runtime by opencv-python-headless
# and scikit-image (both pulled in by easyocr) on a slim/minimal base image.
# Without them, OCR silently fails to import and every scan falls back to
# "unreadable_fallback" with no text detected.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
ENV PYTHONPATH=/app
EXPOSE 4000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000"]
