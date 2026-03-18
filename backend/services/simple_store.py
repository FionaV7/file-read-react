"""Simple in-memory vector store as fallback for ChromaDB"""
import os
import json
from typing import List, Dict
from sentence_transformers import SentenceTransformer
import numpy as np

class SimpleVectorStore:
    """Lightweight vector store using sentence transformers"""
    
    def __init__(self, persist_directory: str = "./simple_store"):
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        self.collections = {}
        self.load_collections()
    
    def safe_collection_name(self, name: str) -> str:
        """Create safe collection name"""
        import re
        name = name.lower()
        name = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
        name = re.sub(r"^[^a-zA-Z0-9]+", "", name)
        name = re.sub(r"[^a-zA-Z0-9]+$", "", name)
        if len(name) < 3:
            name += "_doc"
        return name[:128]
    
    def load_collections(self):
        """Load existing collections from disk"""
        for filename in os.listdir(self.persist_directory):
            if filename.endswith('.json'):
                collection_name = filename[:-5]
                filepath = os.path.join(self.persist_directory, filename)
                try:
                    with open(filepath, 'r') as f:
                        self.collections[collection_name] = json.load(f)
                except:
                    pass
    
    def save_collection(self, name: str):
        """Save collection to disk"""
        filepath = os.path.join(self.persist_directory, f"{name}.json")
        with open(filepath, 'w') as f:
            json.dump(self.collections[name], f)
    
    def get_or_create_collection(self, name: str) -> Dict:
        """Get or create a collection"""
        safe_name = self.safe_collection_name(name)
        if safe_name not in self.collections:
            self.collections[safe_name] = {
                "name": safe_name,
                "documents": [],
                "embeddings": [],
                "ids": [],
                "metadatas": []
            }
        return self.collections[safe_name]
    
    def add_documents(self, collection_name: str, ids: List[str], documents: List[str], 
                     embeddings: List = None, metadatas: List[Dict] = None):
        """Add documents to collection"""
        collection = self.get_or_create_collection(collection_name)
        safe_name = self.safe_collection_name(collection_name)
        
        if metadatas is None:
            metadatas = [{"index": i} for i in range(len(documents))]
        
        # Generate embeddings if not provided
        if not embeddings:
            embeddings = self.embedder.encode(documents, convert_to_tensor=False)
        
        # Convert embeddings to lists for JSON compatibility
        embeddings_list = [emb.tolist() if hasattr(emb, 'tolist') else emb for emb in embeddings]
        
        collection["documents"].extend(documents)
        collection["embeddings"].extend(embeddings_list)
        collection["ids"].extend(ids)
        collection["metadatas"].extend(metadatas)
        
        # Save to disk
        self.save_collection(safe_name)
    
    def query(self, collection_name: str, query_embeddings: List, n_results: int = 4) -> Dict:
        """Query the collection"""
        safe_name = self.safe_collection_name(collection_name)
        if safe_name not in self.collections:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
        
        collection = self.collections[safe_name]
        if not collection["documents"]:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
        
        # Convert query embedding
        if query_embeddings and len(query_embeddings) > 0:
            query_emb = query_embeddings[0]
            if isinstance(query_emb, list):
                query_emb = np.array(query_emb)
        else:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
        
        # Calculate similarities
        stored_embeddings = np.array(collection["embeddings"])
        similarities = []
        
        for stored_emb in stored_embeddings:
            # Cosine similarity
            sim = np.dot(query_emb, stored_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(stored_emb) + 1e-8)
            similarities.append(sim)
        
        # Get top-k results
        top_indices = np.argsort(similarities)[::-1][:n_results]
        
        results_docs = [[collection["documents"][i] for i in top_indices]]
        results_meta = [[collection["metadatas"][i] for i in top_indices]]
        results_dist = [[1 - similarities[i] for i in top_indices]]  # Convert similarity to distance
        
        return {
            "documents": results_docs,
            "metadatas": results_meta,
            "distances": results_dist
        }
