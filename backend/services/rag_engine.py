import google.genai as genai
from sentence_transformers import SentenceTransformer
import os
import re
from typing import List

class RAGEngine:
    def __init__(self, api_key: str = None):
        """Initialize RAG Engine with Gemini API and embeddings"""
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.5-flash'  # Latest and fastest model (2.5 series)
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        self.conversation_memory = []

    def rewrite_query(self, question: str) -> str:
        """Rewrite query with synonyms for better search"""
        q = question.lower()
        
        synonyms = {
            "advantages": "benefits",
            "advantage": "benefits",
            "disadvantages": "limitations",
            "disadvantage": "limitations",
            "explain": "describe",
            "what is": "define"
        }
        
        for k, v in synonyms.items():
            if k in q:
                return question + f" (related to {v})"
        
        return question

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for texts"""
        embeddings = self.embedder.encode(texts, convert_to_tensor=False, show_progress_bar=False)
        return embeddings.tolist()

    def hybrid_search(self, query: str, chroma_store, collection_name: str, full_text: str = None, top_k: int = 4) -> List[str]:
        """Hybrid search: keyword + vector"""
        
        # Keyword search
        keyword_hits = []
        if full_text:
            for sentence in full_text.split("."):
                if any(word in sentence.lower() for word in query.lower().split()):
                    keyword_hits.append(sentence.strip())
        
        # Vector search
        try:
            q_emb = self.generate_embeddings([query])
            results = chroma_store.query(
                collection_name, 
                query_embeddings=q_emb,
                n_results=top_k
            )
            vector_hits = results['documents'][0] if results['documents'] else []
        except:
            vector_hits = []
        
        # Combine and deduplicate
        docs = list(set(keyword_hits[:3] + vector_hits))
        return docs

    def detect_response_style(self, query: str) -> tuple:
        """Detect user's preferred response style from their query"""
        query_lower = query.lower()
        
        # Detect concise/brief requests
        brief_keywords = ['briefly', 'short', 'concise', 'summarize', 'summary', 'in a nutshell', 'tldr', 'quick', 'short version', 'compressed', 'condensed']
        is_brief = any(keyword in query_lower for keyword in brief_keywords)
        
        # Detect expand requests
        expand_keywords = ['elaborate', 'expand', 'detailed', 'in depth', 'comprehensive', 'thoroughly', 'explain more']
        is_expanded = any(keyword in query_lower for keyword in expand_keywords)
        
        # Detect specific format requests
        format_keywords = {
            'bullet': ['bullet', 'bullets', 'list', 'points'],
            'table': ['table', 'tabular', 'structured'],
            'step': ['step by step', 'steps', 'how to', 'process']
        }
        
        format_type = None
        for fmt, keywords in format_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                format_type = fmt
                break
        
        return is_brief, is_expanded, format_type

    def get_style_instructions(self, is_brief: bool, is_expanded: bool, format_type: str = None) -> str:
        """Generate style-specific instructions"""
        
        if is_brief:
            return """- Keep the response concise and to the point
- Use short, direct sentences
- Focus only on the most essential information
- Limit to 2-3 paragraphs maximum
- Minimize elaboration and examples
- Get straight to the answer"""
        
        if format_type == 'bullet':
            return """- Format the answer as a clear bulleted list
- Each bullet point should be concise but complete
- Use sub-bullets for supporting details
- Include 5-10 main points
- Make it easy to scan and understand"""
        
        if format_type == 'table':
            return """- If applicable, organize information in a structured table format
- Use clear headers and organize data logically
- Include relevant columns and rows
- Ensure data is easy to compare"""
        
        if format_type == 'step':
            return """- Format as numbered steps
- Make each step clear and actionable
- Use sequential numbering
- Include a brief description for each step"""
        
        if is_expanded:
            return """- Provide a comprehensive, detailed answer
- Use multiple paragraphs with clear structure
- Include specific facts, data, examples, and quotes from the document
- Include supporting details for each main point
- Maintain academic tone with professional terminology"""
        
        # Default style
        return """- Answer the user's question directly based on the document content
- Write in professional business language using complete paragraphs
- Organize information logically with clear topic sentences
- Include specific facts and data from the document
- Use professional terminology and maintain an academic tone
- Avoid excessive elaboration but be thorough"""

    def generate_answer(self, query: str, context: List[str], memory_context: str = "", file_name: str = "") -> str:
        """Generate answer using Gemini with retrieved context and original question"""
        
        if not context:
            return "There is no related content in the selected document."
        
        context_str = "\n\n".join(context)
        
        # Detect response style from query
        is_brief, is_expanded, format_type = self.detect_response_style(query)
        style_instructions = self.get_style_instructions(is_brief, is_expanded, format_type)
        
        # Add file name context if asking about it
        file_context = ""
        if file_name:
            file_context = f"\n\nDocument name/ID: {file_name}"
        
        prompt = f"""You are a professional document analyst and business communication expert.

Relevant document content:
{context_str}{file_context}

User's original question:
{query}

Instructions:
{style_instructions}
- Do not mention or reference how the information was processed or extracted
- If the provided content does not contain the answer, clearly state what information is unavailable

Provide your answer:"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Gemini API Error: {error_msg}")
            
            # Check for common API errors and provide helpful guidance
            if "404" in error_msg and "model" in error_msg.lower():
                return "API Error: The model is not available or the API key doesn't have access. Please verify your API key has the Generative AI API enabled."
            elif "401" in error_msg or "unauthenticated" in error_msg.lower():
                return "Authentication Error: Invalid or expired API key. Please update GEMINI_API_KEY in .env file."
            elif "quota" in error_msg.lower() or "rate" in error_msg.lower():
                return "Rate Limit: The API quota has been exceeded. Please try again later."
            elif "permission" in error_msg.lower():
                return "Permission Error: Your API key doesn't have permission to use this model. Enable Generative AI API in Google Cloud Console."
            else:
                return f"Error: {error_msg[:100]}"

    def chat(self, query: str, chroma_store, collection_name: str, full_text: str = None, file_name: str = "") -> dict:
        """Complete RAG pipeline with hybrid search and memory"""
        
        # Rewrite query
        enhanced_query = self.rewrite_query(query)
        
        # Update memory
        self.conversation_memory.append(enhanced_query)
        memory_context = " ".join(self.conversation_memory[-3:])
        
        # Hybrid search
        relevant_docs = self.hybrid_search(enhanced_query, chroma_store, collection_name, full_text)
        
        # Generate answer
        answer = self.generate_answer(enhanced_query, relevant_docs, memory_context, file_name)
        
        return {
            "query": query,
            "answer": answer,
            "sources": relevant_docs[:3]
        }
