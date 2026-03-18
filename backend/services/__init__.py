# Initialize services package
from .auth import authenticate_user, create_access_token, verify_token
from .extractor import FileExtractor, chunk_text

# Handle chromadb import errors on Python 3.14+
try:
    from .chroma_store import ChromaStore
    from .rag_engine import RAGEngine
except Exception as e:
    print(f"Warning: Could not import ChromaStore/RAGEngine: {e}")
    ChromaStore = None
    RAGEngine = None

__all__ = [
    'authenticate_user',
    'create_access_token',
    'verify_token',
    'FileExtractor',
    'chunk_text',
    'ChromaStore',
    'RAGEngine'
]
