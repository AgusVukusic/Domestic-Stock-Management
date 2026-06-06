import multiprocessing
import os

bind = "0.0.0.0:8000"
# Limitar workers para evitar Out Of Memory en Render Free Tier (512MB)
workers = int(os.getenv("WEB_CONCURRENCY", 2))
worker_class = "uvicorn.workers.UvicornWorker"
accesslog = "-"
errorlog = "-"