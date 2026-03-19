import os
from dotenv import load_dotenv

load_dotenv()

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"

# Judge
JUDGE_PASSWORD = os.getenv("JUDGE_PASSWORD", "")

# OpenRouter AI
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "minimax/minimax-m2.5")

# SMTP
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.163.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")

# Register service performance controls
REGISTER_DB_TIMEOUT_SECONDS = float(os.getenv("REGISTER_DB_TIMEOUT_SECONDS", "4.0"))
REGISTER_DB_MAX_RETRIES = int(os.getenv("REGISTER_DB_MAX_RETRIES", "2"))
REGISTER_DB_RETRY_BASE_DELAY = float(os.getenv("REGISTER_DB_RETRY_BASE_DELAY", "0.15"))
REGISTER_DB_RETRY_JITTER = float(os.getenv("REGISTER_DB_RETRY_JITTER", "0.15"))
REGISTER_DB_MAX_CONCURRENCY = int(os.getenv("REGISTER_DB_MAX_CONCURRENCY", "120"))
REGISTER_DB_QUEUE_WAIT_SECONDS = float(
    os.getenv("REGISTER_DB_QUEUE_WAIT_SECONDS", "0.35")
)

# Queue fallback (overload protection)
REGISTER_ASYNC_QUEUE_ENABLED = (
    os.getenv("REGISTER_ASYNC_QUEUE_ENABLED", "true").lower() == "true"
)
REGISTER_ASYNC_QUEUE_MAXSIZE = int(os.getenv("REGISTER_ASYNC_QUEUE_MAXSIZE", "3000"))
REGISTER_ASYNC_QUEUE_WORKERS = int(os.getenv("REGISTER_ASYNC_QUEUE_WORKERS", "24"))
REGISTER_ASYNC_QUEUE_RETRY_LIMIT = int(
    os.getenv("REGISTER_ASYNC_QUEUE_RETRY_LIMIT", "4")
)

# Registration cutoff
REGISTRATION_CLOSE_AT = os.getenv("REGISTRATION_CLOSE_AT", "2026-03-20T00:00:00+08:00")
REGISTRATION_FORCE_CLOSED = (
    os.getenv("REGISTRATION_FORCE_CLOSED", "false").lower() == "true"
)
REGISTRATION_CLOSED_FLAG_FILE = os.getenv(
    "REGISTRATION_CLOSED_FLAG_FILE", "./registration_closed.flag"
)
