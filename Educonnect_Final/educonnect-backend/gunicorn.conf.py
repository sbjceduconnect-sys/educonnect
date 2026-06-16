# gunicorn.conf.py — Optimized for Oracle Cloud 1 OCPU / 1 GB RAM VM
bind = "127.0.0.1:8000"
workers = 2          # Keep at 2 for 1GB RAM (rule: 2*CPUs + 1, but RAM is the bottleneck)
worker_class = "sync"
timeout = 120
keepalive = 5
max_requests = 500   # Restart workers after 500 requests to prevent memory leaks
max_requests_jitter = 50
preload_app = True   # Load app once, share memory across workers (saves RAM)
accesslog = "/home/ubuntu/logs/gunicorn-access.log"
errorlog = "/home/ubuntu/logs/gunicorn-error.log"
loglevel = "info"
