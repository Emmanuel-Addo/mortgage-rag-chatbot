from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from typing import Optional
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if api_key:
    # Set GOOGLE_API_KEY in environment for langchain / google SDK internal usage
    os.environ["GOOGLE_API_KEY"] = api_key
    genai.configure(api_key=api_key)

gemini_model = genai.GenerativeModel("gemini-2.5-flash")

# Free HuggingFace embeddings — no API key needed
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# ChromaDB — stores your document chunks locally
vector_store = Chroma(
    collection_name="mortgage_docs",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)


# ---- Add Document ----

def add_document(file_path: str, filename: str) -> int:
    """
    Load PDF → split into chunks → store in ChromaDB
    Returns number of chunks indexed
    """

    # 1. Load the PDF
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    # 2. Split into smaller chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(pages)

    # 3. Add filename metadata to each chunk
    for chunk in chunks:
        chunk.metadata["filename"] = filename

    # 4. Store in ChromaDB
    vector_store.add_documents(chunks)
    vector_store.persist()

    print(f"✅ Indexed {len(chunks)} chunks from {filename}")
    return len(chunks)


# ---- Ask Question ----

def ask_question(question: str, document_name: Optional[str] = None) -> dict:
    """
    1. Search ChromaDB for relevant chunks
    2. Send chunks + question to Gemini
    3. Return answer + sources
    """

    # 1. Build search filter if specific document requested
    search_kwargs = {"k": 5}
    if document_name:
        search_kwargs["filter"] = {"filename": document_name}

    # 2. Find most relevant chunks
    relevant_chunks = vector_store.similarity_search(
        question,
        **search_kwargs
    )

    if not relevant_chunks:
        return {
            "answer": "I could not find any relevant information in the uploaded documents. Please upload a mortgage document first.",
            "sources": []
        }

    # 3. Build context from chunks
    context = "\n\n".join([
        f"[Page {chunk.metadata.get('page', 'N/A')} - {chunk.metadata.get('filename', 'Unknown')}]\n{chunk.page_content}"
        for chunk in relevant_chunks
    ])

    # 4. Extract sources for citation
    sources = list(set([
        f"{chunk.metadata.get('filename', 'Unknown')} - Page {chunk.metadata.get('page', 'N/A')}"
        for chunk in relevant_chunks
    ]))

    # 5. Build prompt for Gemini
    prompt = f"""You are a helpful and professional mortgage broker assistant.
Use ONLY the information from the mortgage documents provided below to answer the question.
If the answer is not clearly stated in the documents, say "I don't have enough information in the uploaded documents to answer that."
Be concise, clear and professional.

MORTGAGE DOCUMENTS:
{context}

QUESTION: {question}

ANSWER:"""

    # 6. Call Gemini API
    response = gemini_model.generate_content(prompt)

    return {
        "answer": response.text,
        "sources": sources
    }


# ---- Get All Documents ----

def get_all_documents() -> list:
    """Get list of all unique documents stored in ChromaDB"""
    try:
        results = vector_store.get()
        if not results or not results.get("metadatas"):
            return []

        # Get unique filenames
        filenames = list(set([
            meta.get("filename", "Unknown")
            for meta in results["metadatas"]
            if meta.get("filename")
        ]))

        return [{"name": name} for name in filenames]
    except Exception:
        return []


# ---- Delete Document ----

def delete_document(filename: str):
    """Delete all chunks of a document from ChromaDB"""
    try:
        results = vector_store.get()
        if not results or not results.get("metadatas"):
            return

        # Find IDs of chunks belonging to this document
        ids_to_delete = [
            results["ids"][i]
            for i, meta in enumerate(results["metadatas"])
            if meta.get("filename") == filename
        ]

        if ids_to_delete:
            vector_store.delete(ids=ids_to_delete)
            vector_store.persist()
            print(f"🗑️ Deleted {len(ids_to_delete)} chunks for {filename}")

    except Exception as e:
        print(f"Error deleting document: {e}")
        raise e