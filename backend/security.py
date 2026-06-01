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
        # Maps IP address to list of request timestamps
        self.requests = defaultdict(list)

    def check(self, request: Request):
        # Get client IP address
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Remove timestamps outside the sliding window
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] 
            if now - t < self.window_seconds
        ]
        
        # Check if limit is exceeded
        if len(self.requests[client_ip]) >= self.requests_limit:
            retry_after = int(self.window_seconds - (now - self.requests[client_ip][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Too many {self.action_name}. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )
        
        # Record the current request timestamp
        self.requests[client_ip].append(now)

# Instantiate rate limiters
# 20 questions per minute per IP
ask_limiter = InMemoryRateLimiter(requests_limit=20, window_seconds=60, action_name="questions")
# 5 document uploads per minute per IP
upload_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60, action_name="uploads")
# 30 general API requests per minute per IP (fallback/health/documents check)
general_limiter = InMemoryRateLimiter(requests_limit=40, window_seconds=60, action_name="API requests")


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes the filename to prevent path traversal and arbitrary file creation.
    Only allows letters, numbers, dashes, underscores, and dots.
    """
    # Extract only the base name (prevents dir/../../file structure)
    base = os.path.basename(filename)
    
    # Strip everything except alphanumeric, dots, underscores, dashes
    sanitized = re.sub(r"[^a-zA-Z0-9_\.\-]", "", base)
    
    # Ensure it's not empty and contains a single dot extension
    if not sanitized or sanitized.startswith("."):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename structure"
        )
        
    return sanitized


def verify_pdf_magic_bytes(content: bytes) -> bool:
    """
    Verifies if the uploaded file content actually starts with the %PDF- magic bytes.
    This prevents users from uploading renamed executable scripts or HTML files.
    """
    return content.startswith(b"%PDF-")
