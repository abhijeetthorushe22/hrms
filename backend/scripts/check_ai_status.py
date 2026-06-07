#!/usr/bin/env python3
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.services.ai_service import ai_service
from app.core.config import settings


async def main():
    print("=== AI SERVICE STATUS ===")
    print(f"INIT_AI_ON_STARTUP: {settings.INIT_AI_ON_STARTUP}")
    print(f"ENABLE_GEMINI_FALLBACK: {settings.ENABLE_GEMINI_FALLBACK}")
    print(f"ENABLE_SPACY_PROCESSING: {settings.ENABLE_SPACY_PROCESSING}")
    print(f"ENABLE_ML_CLASSIFIER: {settings.ENABLE_ML_CLASSIFIER}")
    print(f"GOOGLE_API_KEY set: {bool(settings.GOOGLE_API_KEY)}")
    print(f"Classifier exists: {os.path.exists('models/scorer.joblib')}")
    print(f"ChromaDB dir exists: {os.path.exists(settings.CHROMA_PERSIST_DIRECTORY)}")
    print()
    print("Initializing AI service (may take 30-90s on first run)...")
    try:
        await asyncio.wait_for(ai_service.initialize(), timeout=180)
        print(f"Initialized: {ai_service._initialized}")
        print(f"Embedding model: {ai_service.embedding_model is not None}")
        print(f"ChromaDB collection: {ai_service.chroma_collection is not None}")
        print(f"spaCy NLP: {ai_service.nlp is not None}")
        print(f"Gemini model: {ai_service.gemini_model is not None}")
        print(f"ML classifier: {ai_service.scoring_classifier is not None}")
    except Exception as e:
        print(f"INIT FAILED: {type(e).__name__}: {e}")


if __name__ == "__main__":
    asyncio.run(main())
