from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
import shutil
from rag import add_document, ask_question, get_all_documents, delete_document

app = FastAPI(
    title="MortgageAI API",
    description="RAG powered chatbot for mortgage brokerage",
    version="1.0.0"
)

# Allow Next.js frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---- Request/Response Models ----

class QuestionRequest(BaseModel):
    question: str
    document_name: str | None = None


class QuestionResponse(BaseModel):
    answer: str
    sources: List[str]


# ---- Health Check ----

@app.get("/")
def health_check():
    return {
        "status": "running",
        "message": "MortgageAI API is live"
    }


# ---- Upload Document ----

@app.post("/upload", response_model=dict)
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a mortgage PDF document"""

    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Validate file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 10MB"
        )

    # Save file to disk
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Add to ChromaDB vector store
    try:
        num_chunks = add_document(file_path, file.filename)
        return {
            "success": True,
            "message": f"{file.filename} uploaded and indexed successfully",
            "chunks_indexed": num_chunks,
            "filename": file.filename
        }
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index document: {str(e)}"
        )


# ---- Ask Question ----

@app.post("/ask", response_model=QuestionResponse)
async def ask(request: QuestionRequest):
    """Ask a question about the uploaded mortgage documents"""

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    try:
        result = ask_question(request.question, request.document_name)
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
def get_documents():
    """Get list of all uploaded documents"""
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
def remove_document(filename: str):
    """Delete a document from the system"""

    file_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"{filename} not found"
        )

    try:
        delete_document(filename)
        os.remove(file_path)
        return {
            "success": True,
            "message": f"{filename} deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )