import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
loglevel = "info"
accesslog = "-"
errorlog = "-"
timeout = 120
keepalive = 5
capture_output = True
enable_stdio_inheritance = True
