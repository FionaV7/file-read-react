import os
import warnings

# Suppress all warnings before any other imports
warnings.filterwarnings("ignore")
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Mock posthog to prevent telemetry errors on loading chroma
import sys
import types
try:
    import posthog
    posthog.capture = lambda *args, **kwargs: None
except ImportError:
    posthog = types.ModuleType("posthog")
    posthog.capture = lambda *args, **kwargs: None
    posthog.Posthog = type("Posthog", (), {"capture": lambda *a, **kw: None})
    sys.modules["posthog"] = posthog

# Now import the rest
from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

# Import services
from services.extractor import FileExtractor, chunk_text
from services.auth import (
    authenticate_user, create_access_token, verify_token,
    get_password_hash, fake_users_db, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Handle chromadb imports gracefully
CHROMADB_AVAILABLE = False
ChromaStore = None
RAGEngine = None
chroma_store = None
rag_engine = None

try:
    # Try using ChromaDB first
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        import chromadb
        from services.chroma_store import ChromaStore
        from services.rag_engine import RAGEngine
    CHROMADB_AVAILABLE = True
    print("✅ ChromaDB loaded successfully")
except Exception as e:
    # Fall back to simple vector store
    print(f"⚠️ ChromaDB not available ({e}), using simple vector store...")
    try:
        from services.simple_store import SimpleVectorStore
        from services.rag_engine import RAGEngine
        ChromaStore = SimpleVectorStore
        CHROMADB_AVAILABLE = True
        print("✅ Using SimpleVectorStore instead")
    except Exception as e2:
        print(f"⚠️ SimpleVectorStore also failed: {e2}")
        RAGEngine = None
        CHROMADB_AVAILABLE = False

# Initialize app
app = FastAPI(title="File Read AI", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
extractor = FileExtractor()
chroma_store = None
rag_engine = None

if CHROMADB_AVAILABLE:
    try:
        chroma_store = ChromaStore()
        rag_engine = RAGEngine()
        print("✅ ChromaDB and RAG Engine initialized successfully")
    except Exception as e:
        print(f"⚠️ Failed to initialize RAG services: {e}")
        CHROMADB_AVAILABLE = False

# Create upload directory
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    sources: list

# Routes

# Authentication Routes
@app.post("/api/auth/signup")
async def signup(request: SignupRequest):
    if request.email in fake_users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = get_password_hash(request.password)
    fake_users_db[request.email] = {
        "name": request.name,
        "email": request.email,
        "hashed_password": hashed_password
    }
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": request.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": request.email,
        "user": request.name
    }

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    print(f"Login attempt - Email: {request.email}")
    print(f"Users in DB: {list(fake_users_db.keys())}")
    
    # Auto-create user if doesn't exist
    if request.email not in fake_users_db:
        print(f"User {request.email} doesn't exist, creating...")
        fake_users_db[request.email] = {
            "name": request.email.split("@")[0],
            "email": request.email,
            "hashed_password": get_password_hash(request.password)
        }
    
    user = authenticate_user(request.email, request.password)
    if not user:
        print(f"Authentication failed for {request.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": request.email}, expires_delta=access_token_expires
    )
    
    print(f"Login successful for {request.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "email": request.email,
        "user": user.get("name", request.email.split("@")[0])
    }

# Helper function to get current user
async def get_current_user(authorization: Optional[str] = Header(None)):
    print(f"🔍 Authorization header: {authorization}")
    
    # Allow guests without authorization
    if not authorization:
        print("⚠️ No authorization header - allowing as guest")
        return "guest_default"
    
    token = authorization.replace("Bearer ", "")
    print(f"🔑 Token after removing Bearer: {token}")
    
    # Check if guest token (format: guest_timestamp_randomstring)
    if token.startswith('guest_'):
        # Return sanitized guest identifier for directory naming
        parts = token.split('_')
        print(f"👤 Guest token parts: {parts}")
        if len(parts) >= 2:
            user_id = f"guest_{parts[1]}"
            print(f"✅ Guest user identified: {user_id}")
            return user_id
        print("⚠️ Using guest_default")
        return "guest_default"
    
    # Regular JWT token
    try:
        email = verify_token(token)
        if not email:
            print("❌ Invalid JWT token")
            raise HTTPException(status_code=401, detail="Invalid token")
        print(f"✅ Regular user: {email}")
        return email
    except Exception as e:
        print(f"❌ Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

# File Routes
@app.post("/api/files/upload")
async def upload_file(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    try:
        # Create user-specific directory
        user_dir = os.path.join(UPLOAD_DIR, current_user.replace('@', '_').replace('.', '_'))
        os.makedirs(user_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(user_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Extract content
        content = extractor.extract_file(file_path)
        
        # Clean text
        clean_text = content.replace('\n\n\n', '\n').replace('  ', ' ').strip()
        
        # Create chunks
        chunks = chunk_text(clean_text, chunk_size=800, overlap=100)
        
        # Store in ChromaDB with embeddings
        if CHROMADB_AVAILABLE and chroma_store and rag_engine:
            try:
                collection_name = f"{current_user}_{file.filename}"
                
                # Generate embeddings
                embeddings = rag_engine.generate_embeddings(chunks[:40])
                
                ids = [f"{collection_name}_{i}" for i in range(len(chunks[:40]))]
                
                chroma_store.add_documents(
                    collection_name=collection_name,
                    ids=ids,
                    documents=chunks[:40],
                    embeddings=embeddings,
                    metadatas=[{"file": file.filename, "chunk": i} for i in range(len(chunks[:40]))]
                )
            except Exception as e:
                print(f"Warning: Could not store in ChromaDB: {e}")
        
        return {
            "id": file.filename,
            "name": file.filename,
            "size": len(content),
            "chunks": len(chunks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files")
async def get_files(current_user: str = Depends(get_current_user)):
    user_dir = os.path.join(UPLOAD_DIR, current_user.replace('@', '_').replace('.', '_'))
    if not os.path.exists(user_dir):
        return []
    
    files = []
    for filename in os.listdir(user_dir):
        filepath = os.path.join(user_dir, filename)
        if os.path.isfile(filepath):
            files.append({
                "id": filename,
                "name": filename,
                "size": os.path.getsize(filepath),
                "uploadedAt": datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
            })
    return files

@app.get("/api/files/{file_id}")
async def get_file(file_id: str, current_user: str = Depends(get_current_user)):
    user_dir = os.path.join(UPLOAD_DIR, current_user.replace('@', '_').replace('.', '_'))
    file_path = os.path.join(user_dir, file_id)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "id": file_id,
        "name": file_id,
        "size": os.path.getsize(file_path)
    }

@app.get("/api/files/{file_id}/content")
async def get_file_content(file_id: str, current_user: str = Depends(get_current_user)):
    user_dir = os.path.join(UPLOAD_DIR, current_user.replace('@', '_').replace('.', '_'))
    file_path = os.path.join(user_dir, file_id)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        content = extractor.extract_file(file_path)
        return {
            "name": file_id,
            "text": content.replace('\n\n\n', '\n').replace('  ', ' ').strip(),  # Return full content
            "tables": [],  # TODO: Extract tables
            "images": [],  # TODO: Extract images
            "metadata": {
                "size": os.path.getsize(file_path),
                "type": file_id.split('.')[-1] if '.' in file_id else 'unknown'
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/files/{file_id}")
async def delete_file(file_id: str, current_user: str = Depends(get_current_user)):
    user_dir = os.path.join(UPLOAD_DIR, current_user.replace('@', '_').replace('.', '_'))
    file_path = os.path.join(user_dir, file_id)
    
    if os.path.exists(file_path):
        os.remove(file_path)
    
    return {"message": "File deleted successfully"}

# Chat Routes
@app.post("/api/chat/{file_id}", response_model=ChatResponse)
async def chat(file_id: str, request: ChatRequest, current_user: str = Depends(get_current_user)):
    import re
    from datetime import datetime

    # Helper: get greeting based on time
    def get_greeting():
        hour = datetime.now().hour
        if 5 <= hour < 12:
            return "Good morning!"
        elif 12 <= hour < 18:
            return "Good afternoon!"
        elif 18 <= hour < 22:
            return "Good evening!"
        else:
            return "Hi!"

    # Helper: detect casual greetings
    casual_greetings = [
        r"^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening)[.! ]*$",
        r"how are you[?!. ]*$",
        r"what's up[?!. ]*$",
        r"who are you[?!. ]*$",
        r"are you a bot[?!. ]*$",
        r"help[?!. ]*$",
        r"can you help[?!. ]*$",
        r"your name[?!. ]*$",
        r"what can you do[?!. ]*$",
        r"tell me about yourself[?!. ]*$"
    ]
    user_query = request.query.strip().lower()
    for pattern in casual_greetings:
        if re.match(pattern, user_query):
            greeting = get_greeting()
            return ChatResponse(
                answer=f"{greeting} I am your helpful file-reading chatbot. You can upload files and ask me questions about them!",
                sources=[]
            )

    # Only allow ChromaDB mode
    if not CHROMADB_AVAILABLE or not rag_engine:
        return ChatResponse(
            answer="Sorry, the AI engine is not available. Please contact support.",
            sources=[]
        )

    user_dir = os.path.join(UPLOAD_DIR, current_user.replace('@', '_').replace('.', '_'))
    file_path = os.path.join(user_dir, file_id)
    if not os.path.exists(file_path):
        return ChatResponse(answer="File not found.", sources=[])

    # Extract file content
    full_text = extractor.extract_file(file_path)

    # Use RAG engine for all queries
    collection_name = f"{current_user}_{file_id}"
    result = rag_engine.chat(request.query, chroma_store, collection_name, full_text, file_id)
    answer = result['answer']
    
    return ChatResponse(
        answer=answer,
        sources=result['sources']
    )

@app.get("/api/chat/{file_id}/history")
async def get_conversation(file_id: str, current_user: str = Depends(get_current_user)):
    # In production, fetch from database
    return [
        {
            "role": "user",
            "content": "What is this document about?"
        },
        {
            "role": "assistant",
            "content": "This is a sample response..."
        }
    ]

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
