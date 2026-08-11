import time
import re
import os
from collections import defaultdict
from fastapi import Request, HTTPException, status


class InMemoryRateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int, action_name: str = "requests"):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.action_name = action_name
        self.requests = defaultdict(list)

    def check(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        self.requests[client_ip] = [
            t for t in self.requests[client_ip]
            if now - t < self.window_seconds
        ]

        if len(self.requests[client_ip]) >= self.requests_limit:
            retry_after = int(self.window_seconds - (now - self.requests[client_ip][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Too many {self.action_name}. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

        self.requests[client_ip].append(now)


ask_limiter = InMemoryRateLimiter(requests_limit=20, window_seconds=60, action_name="questions")
upload_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60, action_name="uploads")
general_limiter = InMemoryRateLimiter(requests_limit=40, window_seconds=60, action_name="API requests")


def sanitize_filename(filename: str) -> str:
    base = os.path.basename(filename)
    sanitized = re.sub(r"[^a-zA-Z0-9_\.\-]", "", base)
    if not sanitized or sanitized.startswith("."):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename structure"
        )
    return sanitized


def verify_pdf_magic_bytes(content: bytes) -> bool:
    return content.startswith(b"%PDF-")
