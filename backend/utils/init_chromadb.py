#!/usr/bin/env python3
"""
ChromaDB Initialization Script
This script initializes ChromaDB with the necessary collections for AuraHR.
"""

import chromadb
from chromadb.config import Settings
import os
import asyncio
from app.services.ai_service import AIService

def init_chromadb():
    """Initialize ChromaDB collections."""
    print("🔧 Initializing ChromaDB...")
    
    # Create ChromaDB directory if it doesn't exist
    chroma_dir = "./chroma_db"
    os.makedirs(chroma_dir, exist_ok=True)
    
    # Initialize ChromaDB client
    client = chromadb.PersistentClient(
        path=chroma_dir,
        settings=Settings(anonymized_telemetry=False)
    )
    
    # Create collections
    try:
        # Resume collection for candidate matching
        resume_collection = client.get_or_create_collection(
            name="resumes",
            metadata={"hnsw:space": "cosine", "description": "Resume embeddings for candidate matching"}
        )
        print(f"✅ Resume collection created/verified: {resume_collection.count()} documents")
        
        # Job descriptions collection for similarity search
        job_collection = client.get_or_create_collection(
            name="job_descriptions", 
            metadata={"hnsw:space": "cosine", "description": "Job description embeddings"}
        )
        print(f"✅ Job descriptions collection created/verified: {job_collection.count()} documents")
        
        print("🎉 ChromaDB initialization completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing ChromaDB: {e}")
        return False

async def test_ai_service():
    """Test AI service initialization."""
    print("\n🧠 Testing AI Service initialization...")
    
    try:
        ai_service = AIService()
        await ai_service.initialize()
        print("✅ AI Service initialized successfully!")
        
        # Test embedding generation
        test_text = "Software Engineer with 5 years of Python experience"
        embedding = ai_service.generate_embedding(test_text)
        print(f"✅ Embedding generation test passed (dimension: {len(embedding)})")
        
        # Test entity extraction
        resume_text = """
        John Smith
        Software Engineer
        Email: john.smith@email.com
        Phone: (555) 123-4567
        
        Experience:
        - 5 years of Python development at Google
        - Machine Learning expertise with TensorFlow
        - Led a team of 3 developers
        """
        
        entities = ai_service.extract_entities_from_resume(resume_text)
        print(f"✅ Entity extraction test passed: Found {len(entities['skills'])} skills")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing AI Service: {e}")
        return False

if __name__ == "__main__":
    print("🚀 AuraHR AI Pipeline Initialization")
    print("=" * 50)
    
    # Initialize ChromaDB
    chromadb_success = init_chromadb()
    
    # Test AI Service
    ai_success = asyncio.run(test_ai_service())
    
    if chromadb_success and ai_success:
        print("\n🎉 All AI components initialized successfully!")
        print("You can now start the FastAPI server and test the AI endpoints.")
    else:
        print("\n❌ Some components failed to initialize. Please check the errors above.")