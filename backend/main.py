from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import os
import shutil
from rag import add_document, ask_question, get_all_documents, delete_document
from security import (
    ask_limiter,
    upload_limiter,
    general_limiter,
    sanitize_filename,
    verify_pdf_magic_bytes
)

app = FastAPI(
    title="MortgageAI API",
    description="RAG powered chatbot for mortgage brokerage",
    version="1.0.0"
)

# Allow Next.js frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "https://your-vercel-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---- Request/Response Models ----

class QuestionRequest(BaseModel):
    question: str = Field(..., max_length=1000, description="The user's question, max 1000 characters.")
    document_name: str | None = None


class QuestionResponse(BaseModel):
    answer: str
    sources: List[str]


# ---- Health Check ----

@app.get("/")
def health_check(request: Request):
    general_limiter.check(request)
    return {
        "status": "running",
        "message": "MortgageAI API is live"
    }


# ---- Upload Document ----

@app.post("/upload", response_model=dict)
async def upload_document(request: Request, file: UploadFile = File(...)):
    """Upload and index a mortgage PDF document"""
    upload_limiter.check(request)

    # Sanitize the filename to prevent path traversal / directory escaping
    try:
        safe_filename = sanitize_filename(file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    # Validate file type extension
    if not safe_filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Read content to validate size and magic bytes
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 10MB"
        )

    # Verify that the file header corresponds to an actual PDF (magic bytes check)
    if not verify_pdf_magic_bytes(contents):
        raise HTTPException(
            status_code=400,
            detail="Security Verification Failed: The uploaded file is not a valid PDF document."
        )

    # Save file to disk
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Add to ChromaDB vector store
    try:
        num_chunks = add_document(file_path, safe_filename)
        return {
            "success": True,
            "message": f"{safe_filename} uploaded and indexed successfully",
            "chunks_indexed": num_chunks,
            "filename": safe_filename
        }
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index document: {str(e)}"
        )


# ---- Ask Question ----

@app.post("/ask", response_model=QuestionResponse)
async def ask(request: Request, payload: QuestionRequest):
    """Ask a question about the uploaded mortgage documents"""
    ask_limiter.check(request)

    print(f"🔍 Received question: '{payload.question}' for document: '{payload.document_name}'")

    if not payload.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    # Sanitize document name if provided
    safe_doc_name = None
    if payload.document_name:
        try:
            safe_doc_name = sanitize_filename(payload.document_name)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid document name"
            )

    try:
        result = ask_question(payload.question, safe_doc_name)
        return QuestionResponse(
            answer=result["answer"],
            sources=result["sources"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get answer: {str(e)}"
        )


# ---- Get All Documents ----

@app.get("/documents", response_model=List[dict])
def get_documents(request: Request):
    """Get list of all uploaded documents"""
    general_limiter.check(request)
    try:
        documents = get_all_documents()
        return documents
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get documents: {str(e)}"
        )


# ---- Delete Document ----

@app.delete("/documents/{filename}")
def remove_document(filename: str, request: Request):
    """Delete a document from the system"""
    general_limiter.check(request)

    try:
        safe_filename = sanitize_filename(filename)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename"
        )

    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"{safe_filename} not found"
        )

    try:
        delete_document(safe_filename)
        os.remove(file_path)
        return {
            "success": True,
            "message": f"{safe_filename} deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )