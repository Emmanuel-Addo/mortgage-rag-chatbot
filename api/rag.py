from pypdf import PdfReader
from typing import Optional
from google import genai
import numpy as np
import json
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if api_key:
    os.environ["GOOGLE_API_KEY"] = api_key
    genai_client = genai.Client(api_key=api_key)
    print(f"Gemini API key loaded: {api_key[:8]}...{api_key[-4:]}")
else:
    print("WARNING: No Gemini API key found in environment. Set GEMINI_API_KEY in .env")
    genai_client = None


CHROMA_DIR = "/tmp/chroma_db"
VECTORS_FILE = os.path.join(CHROMA_DIR, "vectors.npy")
META_FILE = os.path.join(CHROMA_DIR, "metadata.json")
CHUNKS_FILE = os.path.join(CHROMA_DIR, "chunks.json")


class SimpleVectorStore:
    def __init__(self):
        os.makedirs(CHROMA_DIR, exist_ok=True)
        self.ids: list[str] = []
        self.texts: list[str] = []
        self.metadatas: list[dict] = []
        self.vectors: Optional[np.ndarray] = None
        self._load()

    def _load(self):
        if os.path.exists(VECTORS_FILE) and os.path.exists(META_FILE):
            self.vectors = np.load(VECTORS_FILE)
            with open(META_FILE, "r") as f:
                data = json.load(f)
                self.ids = data.get("ids", [])
                self.metadatas = data.get("metadatas", [])
            with open(CHUNKS_FILE, "r") as f:
                self.texts = json.load(f)
        else:
            self.ids = []
            self.texts = []
            self.metadatas = []
            self.vectors = np.empty((0, 768), dtype=np.float32)

    def _save(self):
        np.save(VECTORS_FILE, self.vectors)
        with open(META_FILE, "w") as f:
            json.dump({"ids": self.ids, "metadatas": self.metadatas}, f)
        with open(CHUNKS_FILE, "w") as f:
            json.dump(self.texts, f)

    def _embed(self, texts: list[str]) -> np.ndarray:
        result = genai_client.models.embed_content(
            model="models/text-embedding-004",
            contents=texts,
        )
        return np.array([e.values for e in result.embeddings], dtype=np.float32)

    def add(self, texts: list[str], metadatas: list[dict]) -> int:
        if not texts:
            return 0
        vectors = self._embed(texts)
        new_ids = [str(uuid.uuid4()) for _ in texts]
        if self.vectors.shape[0] == 0:
            self.vectors = vectors
        else:
            self.vectors = np.vstack([self.vectors, vectors])
        self.ids.extend(new_ids)
        self.texts.extend(texts)
        self.metadatas.extend(metadatas)
        self._save()
        return len(texts)

    def query(self, query_text: str, k: int = 5, filter_meta: Optional[dict] = None) -> list[dict]:
        if self.vectors.shape[0] == 0:
            return []
        q_vec = self._embed([query_text])[0]
        scores = self.vectors @ q_vec / (
            np.linalg.norm(self.vectors, axis=1) * np.linalg.norm(q_vec) + 1e-10
        )
        candidates = list(range(len(self.ids)))
        if filter_meta:
            candidates = [
                i for i in candidates
                if all(self.metadatas[i].get(k_) == v for k_, v in filter_meta.items())
            ]
        if not candidates:
            return []
        candidates.sort(key=lambda i: scores[i], reverse=True)
        results = []
        for i in candidates[:k]:
            results.append({
                "id": self.ids[i],
                "text": self.texts[i],
                "metadata": self.metadatas[i],
                "score": float(scores[i]),
            })
        return results

    def get_all(self) -> dict:
        return {
            "ids": self.ids,
            "texts": self.texts,
            "metadatas": self.metadatas,
        }

    def delete_by_filter(self, filter_meta: dict):
        keep = [
            i for i in range(len(self.ids))
            if not all(self.metadatas[i].get(k_) == v for k_, v in filter_meta.items())
        ]
        if len(keep) == len(self.ids):
            return
        self.ids = [self.ids[i] for i in keep]
        self.texts = [self.texts[i] for i in keep]
        self.metadatas = [self.metadatas[i] for i in keep]
        if keep:
            self.vectors = self.vectors[keep]
        else:
            self.vectors = np.empty((0, 768), dtype=np.float32)
        self._save()


vector_store = SimpleVectorStore()


def split_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


def add_document(file_path: str, filename: str) -> int:
    reader = PdfReader(file_path)
    all_chunks = []
    all_metas = []
    for page_num, page in enumerate(reader.pages, 1):
        page_text = page.extract_text()
        if not page_text or not page_text.strip():
            continue
        page_chunks = split_text(page_text)
        for chunk in page_chunks:
            all_chunks.append(chunk)
            all_metas.append({"filename": filename, "page": page_num})

    if not all_chunks:
        return 0

    num_added = vector_store.add(all_chunks, all_metas)
    print(f"Indexed {num_added} chunks from {filename}")
    return num_added


def ask_question(question: str, document_name: Optional[str] = None) -> dict:
    filter_meta = {"filename": document_name} if document_name else None
    results = vector_store.query(question, k=5, filter_meta=filter_meta)

    if not results:
        return {
            "answer": "I could not find any relevant information in the uploaded documents. Please upload a mortgage document first.",
            "sources": []
        }

    context = "\n\n".join([
        f"[Page {r['metadata'].get('page', 'N/A')} - {r['metadata'].get('filename', 'Unknown')}]\n{r['text']}"
        for r in results
    ])

    sources = list(set([
        f"{r['metadata'].get('filename', 'Unknown')} - Page {r['metadata'].get('page', 'N/A')}"
        for r in results
    ]))

    prompt = f"""You are a helpful and professional mortgage broker assistant.
Use ONLY the information from the mortgage documents provided below to answer the question.
If the answer is not clearly stated in the documents, say "I don't have enough information in the uploaded documents to answer that."
Be concise, clear and professional.

MORTGAGE DOCUMENTS:
{context}

QUESTION: {question}

ANSWER:"""

    try:
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        answer = response.text
    except Exception as e:
        error_str = str(e)
        if "API key" in error_str or "403" in error_str or "leaked" in error_str:
            raise Exception(
                "Gemini API key is invalid or has been reported as leaked. "
                "Please generate a new key at https://aistudio.google.com/app/apikey "
                "and update your backend/.env file."
            )
        elif "quota" in error_str.lower() or "429" in error_str:
            raise Exception(
                "Gemini API quota exceeded. Please wait a moment and try again."
            )
        else:
            raise Exception(f"Gemini API error: {error_str}")

    return {"answer": answer, "sources": sources}


def get_all_documents() -> list:
    try:
        data = vector_store.get_all()
        if not data["metadatas"]:
            return []
        filenames = list(set([
            meta.get("filename", "Unknown")
            for meta in data["metadatas"]
            if meta.get("filename")
        ]))
        return [{"name": name} for name in filenames]
    except Exception:
        return []


def delete_document(filename: str):
    try:
        vector_store.delete_by_filter({"filename": filename})
        print(f"Deleted chunks for {filename}")
    except Exception as e:
        print(f"Error deleting document: {e}")
        raise e
