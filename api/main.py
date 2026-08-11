from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import os
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "https://mortgage-rag-chatbot.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/tmp/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class QuestionRequest(BaseModel):
    question: str = Field(..., max_length=1000, description="The user's question, max 1000 characters.")
    document_name: str | None = None


class QuestionResponse(BaseModel):
    answer: str
    sources: List[str]


@app.get("/")
def health_check(request: Request):
    general_limiter.check(request)
    return {
        "status": "running",
        "message": "MortgageAI API is live"
    }


@app.post("/upload", response_model=dict)
async def upload_document(request: Request, file: UploadFile = File(...)):
    upload_limiter.check(request)

    try:
        safe_filename = sanitize_filename(file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not safe_filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")

    if not verify_pdf_magic_bytes(contents):
        raise HTTPException(
            status_code=400,
            detail="Security Verification Failed: The uploaded file is not a valid PDF document."
        )

    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

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
        raise HTTPException(status_code=500, detail=f"Failed to index document: {str(e)}")


@app.post("/ask", response_model=QuestionResponse)
async def ask(request: Request, payload: QuestionRequest):
    ask_limiter.check(request)

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    safe_doc_name = None
    if payload.document_name:
        try:
            safe_doc_name = sanitize_filename(payload.document_name)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid document name")

    try:
        result = ask_question(payload.question, safe_doc_name)
        return QuestionResponse(
            answer=result["answer"],
            sources=result["sources"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get answer: {str(e)}")


@app.get("/documents", response_model=List[dict])
def get_documents(request: Request):
    general_limiter.check(request)
    try:
        documents = get_all_documents()
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get documents: {str(e)}")


@app.delete("/documents/{filename}")
def remove_document(filename: str, request: Request):
    general_limiter.check(request)

    try:
        safe_filename = sanitize_filename(filename)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"{safe_filename} not found")

    try:
        delete_document(safe_filename)
        os.remove(file_path)
        return {"success": True, "message": f"{safe_filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
