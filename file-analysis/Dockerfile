FROM pytorch/pytorch:2.10.0-cuda12.9-cudnn9-runtime

WORKDIR /srv
COPY requirements.txt requirements-ocr.txt ./
# torch/torchvision kommen bereits aus dem Basis-Image
RUN pip install --no-cache-dir -r requirements.txt \
    && grep -Ev '^(torch|torchvision)==|^#' requirements-ocr.txt | pip install --no-cache-dir -r /dev/stdin

COPY app ./app
COPY cli.py .

ENV HF_HOME=/models
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
