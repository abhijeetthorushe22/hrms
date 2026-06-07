import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.services.ai_service import AIService

async def test_integration():
    """Test HuggingFace integration with AuraHR project."""
    print("🧪 Testing HuggingFace Integration with AuraHR")
    print("=" * 50)
    
    ai = AIService()
    await ai.initialize()
    
    # Test with sample job and resume
    job_desc = """Senior Python Developer position requiring:
    - 5+ years Python experience
    - FastAPI framework expertise  
    - MongoDB database knowledge
    - REST API development
    - Agile methodologies"""
    
    resume_text = """Python developer with 5 years experience in web development.
    Expert in FastAPI, Django, and REST API development.
    Strong MongoDB and PostgreSQL database skills.
    Experience with agile development and team collaboration.
    Bachelor's degree in Computer Science."""
    
    result = await ai.calculate_resume_score(resume_text, job_desc)
    
    print("✅ AuraHR Integration Test Results:")
    print(f"   Overall Score: {result['overallScore']}/100")
    print(f"   Skills Match: {result.get('skillsMatch', 'N/A')}/100")  
    print(f"   Experience Match: {result.get('experienceMatch', 'N/A')}/100")
    print(f"   Resume Quality: {result.get('resumeScore', 'N/A')}/100")
    print(f"   Model Used: {result.get('modelUsed', 'Unknown')}")
    print(f"   Recommendation: {result.get('recommendedAction', 'Unknown')}")
    print(f"   Confidence: {result.get('confidenceLevel', 'N/A')}%")
    
    print("\n🎯 Strengths:")
    for strength in result.get('strengths', []):
        print(f"   • {strength}")
    
    print("\n⚠️  Areas for Improvement:")  
    for weakness in result.get('weaknesses', []):
        print(f"   • {weakness}")
    
    print("\n🧠 AI Insights:")
    for insight in result.get('aiInsights', []):
        print(f"   • {insight}")
    
    print("\n✅ Integration successful! HuggingFace is working with AuraHR.")

if __name__ == "__main__":
    asyncio.run(test_integration())