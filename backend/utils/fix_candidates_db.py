#!/usr/bin/env python3
"""
Fix Candidates Database Issues
Automatically fixes known issues in the candidates collection
"""
import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to Python path  
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import connect_to_mongo, get_database

async def fix_candidates_issues():
    """Fix known issues in candidates collection."""
    print("🔧 Fixing Candidates Database Issues")
    print("=" * 50)
    
    # Connect to database
    await connect_to_mongo()
    db = get_database()
    
    # Fix 1: Update invalid status values
    print("1. Fixing invalid status values...")
    result1 = await db.candidates.update_many(
        {"status": "interviewing"},
        {"$set": {"status": "interview"}}
    )
    print(f"   ✅ Fixed {result1.modified_count} candidates with 'interviewing' status")
    
    # Fix 2: Add missing matchScore field (default to 0)
    print("2. Adding missing matchScore fields...")
    result2 = await db.candidates.update_many(
        {"matchScore": {"$exists": False}},
        {"$set": {"matchScore": 0.0}}
    )
    print(f"   ✅ Added matchScore to {result2.modified_count} candidates")
    
    # Fix 3: Add missing resumeS3Key field (set to null)
    print("3. Adding missing resumeS3Key fields...")
    result3 = await db.candidates.update_many(
        {"resumeS3Key": {"$exists": False}},
        {"$set": {"resumeS3Key": None}}
    )
    print(f"   ✅ Added resumeS3Key to {result3.modified_count} candidates")
    
    # Fix 4: Add missing extractedText field (set to null)
    print("4. Adding missing extractedText fields...")
    result4 = await db.candidates.update_many(
        {"extractedText": {"$exists": False}},
        {"$set": {"extractedText": None}}
    )
    print(f"   ✅ Added extractedText to {result4.modified_count} candidates")
    
    # Fix 5: Add missing chromaVectorId field (set to null)
    print("5. Adding missing chromaVectorId fields...")
    result5 = await db.candidates.update_many(
        {"chromaVectorId": {"$exists": False}},
        {"$set": {"chromaVectorId": None}}
    )
    print(f"   ✅ Added chromaVectorId to {result5.modified_count} candidates")
    
    # Fix 6: Add missing interviewSummary field (set to null)
    print("6. Adding missing interviewSummary fields...")
    result6 = await db.candidates.update_many(
        {"interviewSummary": {"$exists": False}},
        {"$set": {"interviewSummary": None}}
    )
    print(f"   ✅ Added interviewSummary to {result6.modified_count} candidates")
    
    print("\n🎉 All database fixes completed!")
    
    # Verify fixes
    print("\n📋 Verifying fixes...")
    candidates = await db.candidates.find({}).to_list(length=None)
    print(f"   Total candidates: {len(candidates)}")
    
    # Check for any remaining issues
    invalid_status = len([c for c in candidates if c.get('status') not in ['new', 'screening', 'interview', 'hired', 'rejected']])
    missing_match_score = len([c for c in candidates if 'matchScore' not in c])
    
    if invalid_status == 0 and missing_match_score == 0:
        print("   ✅ All validation issues resolved!")
    else:
        print(f"   ⚠️  Still have {invalid_status} invalid status and {missing_match_score} missing matchScore")

if __name__ == "__main__":
    asyncio.run(fix_candidates_issues())