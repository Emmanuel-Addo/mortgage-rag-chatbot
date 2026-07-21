# Mortgage RAG Chatbot

A RAG (Retrieval-Augmented Generation) powered chatbot application designed for mortgage brokerage. This project consists of a FastAPI backend and a Next.js frontend.

## Project Structure

- **[backend](file:///c:/Users/use/Desktop/projects/mortgage-rag-chatbot/backend)**: Python FastAPI service handling document upload, PDF parsing, embedding generation, semantic vector database storage (using ChromaDB), and RAG chat querying.
- **[frontend](file:///c:/Users/use/Desktop/projects/mortgage-rag-chatbot/frontend)**: Next.js frontend with Tailwind CSS/Vanilla CSS providing a user interface to upload mortgage PDFs and chat with the AI about those documents.

---

## Getting Started

### Backend Setup & Running

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Set up Python Environment:**
   We recommend using `uv` or creating a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install Dependencies:**
   If using `uv` (recommended):
   ```bash
   uv sync
   ```
   Or using `pip`:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file inside the `backend` folder and add your API keys:
   ```env
   OPENAI_API_KEY=your-api-key-here
   ```

5. **Run the FastAPI Server:**
   ```bash
   fastapi dev main.py
   # Or using uvicorn directly:
   uvicorn main:app --reload
   ```
   The backend will be running at [http://localhost:8000](http://localhost:8000). You can access the interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Frontend Setup & Running

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Dependencies:**
   ```bash
   yarn install
   ```

3. **Run the Next.js Development Server:**
   ```bash
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

---

## Features

- **Secure Document Upload**: Supports uploading mortgage PDF documents with sanitization, file-size limits (10MB), and magic byte verification.
- **Vector Embeddings & Search**: Uses ChromaDB to store vector embeddings for rapid semantic lookup of document chunks.
- **Context-Aware RAG Chatbot**: Chat with an LLM that references context extracted from your uploaded mortgage documents.
- **Interactive UI**: Elegant frontend for uploading files, viewing active documents, and chatting with the AI.
