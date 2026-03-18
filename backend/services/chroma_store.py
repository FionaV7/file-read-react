import os
import re
from typing import List
import warnings

# Suppress all chromadb warnings
warnings.filterwarnings("ignore")

import chromadb

class ChromaStore:
    def __init__(self, persist_directory: str = "./chroma_store"):
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collections = {}

    def safe_collection_name(self, name: str) -> str:
        """Create safe collection name"""
        name = name.lower()
        name = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
        name = re.sub(r"^[^a-zA-Z0-9]+", "", name)
        name = re.sub(r"[^a-zA-Z0-9]+$", "", name)
        if len(name) < 3:
            name += "_doc"
        return name[:128]

    def create_or_get_collection(self, name: str) -> chromadb.Collection:
        """Create or get a ChromaDB collection"""
        safe_name = self.safe_collection_name(name)
        if safe_name not in self.collections:
            self.collections[safe_name] = self.client.get_or_create_collection(name=safe_name)
        return self.collections[safe_name]

    def add_documents(self, collection_name: str, ids: List[str], documents: List[str], embeddings: List = None, metadatas: List[dict] = None):
        """Add documents to collection with optional embeddings"""
        collection = self.create_or_get_collection(collection_name)
        
        if metadatas is None:
            metadatas = [{"index": i} for i in range(len(documents))]
        
        if embeddings:
            collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas
            )
        else:
            collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )

    def query(self, collection_name: str, query_text: str = None, query_embeddings: List = None, n_results: int = 5) -> dict:
        """Query documents from collection"""
        collection = self.create_or_get_collection(collection_name)
        
        if query_embeddings:
            results = collection.query(
                query_embeddings=query_embeddings,
                n_results=n_results
            )
        else:
            results = collection.query(
                query_texts=[query_text],
                n_results=n_results
            )
        return results

    def delete_collection(self, name: str):
        """Delete a collection"""
        safe_name = self.safe_collection_name(name)
        if safe_name in self.collections:
            del self.collections[safe_name]
        try:
            self.client.delete_collection(name=safe_name)
        except:
            pass

    def get_collection_stats(self, name: str) -> dict:
        """Get collection statistics"""
        try:
            collection = self.create_or_get_collection(name)
            count = collection.count()
            return {"collection": name, "document_count": count}
        except:
            return {"collection": name, "document_count": 0}
