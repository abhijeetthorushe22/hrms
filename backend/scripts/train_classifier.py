#!/usr/bin/env python3
"""
Training script for the supervised resume scoring classifier.
This script trains a logistic regression model on resume-job pairs with labels.
"""
import sys
import os
import asyncio
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score
import joblib
from typing import List, Dict, Any

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.ai_service import AIService
from app.core.config import settings

async def create_sample_training_data(ai_service: AIService) -> pd.DataFrame:
    """
    Create sample training data for demonstration.
    In production, you would load real labeled data from your database.
    """
    
    # Sample job descriptions
    jobs = [
        {
            "text": "Senior Python Developer with 5+ years experience in FastAPI, Django, REST APIs, PostgreSQL, AWS",
            "type": "senior_python"
        },
        {
            "text": "Junior Frontend Developer with React, JavaScript, HTML, CSS, responsive design experience",
            "type": "junior_frontend"
        },
        {
            "text": "Data Scientist with Python, Machine Learning, TensorFlow, Pandas, SQL, statistics background",
            "type": "data_scientist"
        },
        {
            "text": "DevOps Engineer with Docker, Kubernetes, AWS, Jenkins, CI/CD, Infrastructure as Code",
            "type": "devops"
        },
    ]
    
    # Sample candidate profiles (simplified)
    candidates = [
        {
            "text": "Experienced Python developer with 8 years in web development. Expert in Django, FastAPI, PostgreSQL, AWS deployment.",
            "label_vs_senior_python": 1,  # Good match
            "label_vs_junior_frontend": 0,  # Poor match
            "label_vs_data_scientist": 0,   # Poor match
            "label_vs_devops": 0           # Poor match
        },
        {
            "text": "Frontend developer with 2 years React experience. Skilled in JavaScript, HTML5, CSS3, responsive design.",
            "label_vs_senior_python": 0,
            "label_vs_junior_frontend": 1,  # Good match
            "label_vs_data_scientist": 0,
            "label_vs_devops": 0
        },
        {
            "text": "Data scientist with PhD in Statistics. Expert in Python, TensorFlow, PyTorch, Pandas, SQL, machine learning.",
            "label_vs_senior_python": 0,
            "label_vs_junior_frontend": 0,
            "label_vs_data_scientist": 1,  # Good match
            "label_vs_devops": 0
        },
        {
            "text": "DevOps engineer with 6 years experience. Expert in Docker, Kubernetes, AWS, Jenkins, Terraform, CI/CD.",
            "label_vs_senior_python": 0,
            "label_vs_junior_frontend": 0,
            "label_vs_data_scientist": 0,
            "label_vs_devops": 1  # Good match
        },
        {
            "text": "Recent graduate with basic programming knowledge in Python and Java. Looking for entry-level position.",
            "label_vs_senior_python": 0,  # Poor match for senior role
            "label_vs_junior_frontend": 0,  # Some match for junior role but different tech
            "label_vs_data_scientist": 0,   # Poor match
            "label_vs_devops": 0           # Poor match
        }
    ]
    
    # Create training pairs
    training_data = []
    
    for job in jobs:
        for candidate in candidates:
            label_key = f"label_vs_{job['type']}"
            if label_key in candidate:
                
                # Get embeddings and compute similarity
                results = await ai_service.score_candidates_huggingface(
                    job["text"],
                    [{"id": "temp", "text": candidate["text"]}],
                    use_classifier=False
                )
                
                if results:
                    similarity_score = results[0]["similarity_score"]
                    
                    training_data.append({
                        "job_text": job["text"],
                        "job_type": job["type"],
                        "candidate_text": candidate["text"],
                        "similarity_score": similarity_score,
                        "label": candidate[label_key]
                    })
    
    return pd.DataFrame(training_data)

async def train_classifier():
    """Train and save the resume scoring classifier."""
    
    print("🚀 Starting Classifier Training")
    print(f"📋 Using model: {settings.EMBEDDING_MODEL_NAME}")
    print("=" * 60)
    
    # Initialize AI service
    ai_service = AIService()
    await ai_service.initialize()
    
    # Check if we have a real training dataset
    training_file = os.path.join(os.path.dirname(__file__), "training_data.csv")
    
    if os.path.exists(training_file):
        print(f"📂 Loading training data from {training_file}")
        df = pd.read_csv(training_file)
        print(f"📊 Loaded {len(df)} training examples")
        
        # Validate required columns
        required_cols = ["job_text", "candidate_text", "label"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            print(f"❌ Missing required columns: {missing_cols}")
            print("📝 Expected CSV format: job_text, candidate_text, label (0 or 1)")
            return
        
        # Compute embeddings for real data
        print("🔄 Computing embeddings for training data...")
        similarities = []
        
        for _, row in df.iterrows():
            results = await ai_service.score_candidates_huggingface(
                row["job_text"],
                [{"id": "temp", "text": row["candidate_text"]}],
                use_classifier=False
            )
            
            if results:
                similarities.append(results[0]["similarity_score"])
            else:
                similarities.append(0.5)  # Default similarity
        
        df["similarity_score"] = similarities
        
    else:
        print("📝 No training_data.csv found, creating sample data for demonstration")
        print("   To use real data, create a CSV file with columns: job_text, candidate_text, label")
        
        df = await create_sample_training_data(ai_service)
        
        # Save sample data for reference
        sample_file = os.path.join(os.path.dirname(__file__), "sample_training_data.csv")
        df.to_csv(sample_file, index=False)
        print(f"💾 Sample training data saved to {sample_file}")
    
    print(f"📊 Training dataset: {len(df)} examples")
    print(f"   Positive examples: {df['label'].sum()}")
    print(f"   Negative examples: {len(df) - df['label'].sum()}")
    
    # Prepare features
    print("🔄 Preparing features...")
    
    # Start with similarity score as primary feature
    X = df[["similarity_score"]].values
    y = df["label"].values
    
    # Add additional features if available
    additional_features = []
    
    # Job text length feature
    job_lengths = [len(text.split()) for text in df["job_text"]]
    additional_features.append(("job_length", job_lengths))
    
    # Candidate text length feature
    candidate_lengths = [len(text.split()) for text in df["candidate_text"]]
    additional_features.append(("candidate_length", candidate_lengths))
    
    # Combine features
    if additional_features:
        for feature_name, feature_values in additional_features:
            # Normalize feature values to 0-1 range
            feature_array = np.array(feature_values).reshape(-1, 1)
            feature_normalized = (feature_array - feature_array.min()) / (feature_array.max() - feature_array.min())
            X = np.hstack([X, feature_normalized])
            print(f"   Added feature: {feature_name}")
    
    print(f"📈 Feature matrix shape: {X.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"🔄 Training set: {len(X_train)} examples")
    print(f"🔄 Test set: {len(X_test)} examples")
    
    # Train classifier
    print("🧠 Training logistic regression classifier...")
    
    classifier = LogisticRegression(
        random_state=42,
        max_iter=1000,
        class_weight='balanced'  # Handle class imbalance
    )
    
    classifier.fit(X_train, y_train)
    
    # Evaluate model
    print("📊 Evaluating model performance...")
    
    # Cross-validation scores
    cv_scores = cross_val_score(classifier, X_train, y_train, cv=5, scoring='roc_auc')
    print(f"   Cross-validation AUC: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
    
    # Test set evaluation
    y_pred = classifier.predict(X_test)
    y_pred_proba = classifier.predict_proba(X_test)[:, 1]
    
    test_auc = roc_auc_score(y_test, y_pred_proba)
    print(f"   Test set AUC: {test_auc:.3f}")
    
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Feature importance
    print("🔍 Feature Importance:")
    feature_names = ["similarity_score"] + [name for name, _ in additional_features]
    
    for name, coef in zip(feature_names, classifier.coef_[0]):
        print(f"   {name}: {coef:.3f}")
    
    # Save model
    model_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, "scorer.joblib")
    joblib.dump(classifier, model_path)
    
    print(f"\n💾 Model saved to: {model_path}")
    
    # Save feature info
    feature_info = {
        "feature_names": feature_names,
        "model_type": "LogisticRegression",
        "training_examples": len(df),
        "test_auc": test_auc,
        "cv_auc_mean": cv_scores.mean(),
        "cv_auc_std": cv_scores.std()
    }
    
    info_path = os.path.join(model_dir, "scorer_info.json")
    import json
    with open(info_path, 'w') as f:
        json.dump(feature_info, f, indent=2)
    
    print(f"📋 Model info saved to: {info_path}")
    
    print("\n✅ Classifier training completed successfully!")
    print("\n📝 Next steps:")
    print("   1. The AI service will automatically use this classifier when use_classifier=True")
    print("   2. To retrain with new data, add labeled examples to training_data.csv")
    print("   3. Monitor model performance and retrain periodically")

def create_training_template():
    """Create a template CSV file for training data."""
    
    template_data = {
        "job_text": [
            "Senior Python Developer with 5+ years experience in FastAPI, Django, REST APIs",
            "Junior Frontend Developer with React, JavaScript, HTML, CSS experience", 
            "Data Scientist with Python, Machine Learning, TensorFlow, Pandas, SQL",
        ],
        "candidate_text": [
            "Experienced Python developer with 8 years in web development. Expert in Django, FastAPI.",
            "Frontend developer with 2 years React experience. Skilled in JavaScript, HTML5, CSS3.",
            "Recent graduate with basic programming knowledge in Python and Java.",
        ],
        "label": [1, 1, 0]  # 1 = good match, 0 = poor match
    }
    
    template_df = pd.DataFrame(template_data)
    template_path = os.path.join(os.path.dirname(__file__), "training_data_template.csv")
    template_df.to_csv(template_path, index=False)
    
    print(f"📝 Training data template created: {template_path}")
    print("   Edit this file with your labeled data and rename to 'training_data.csv'")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train resume scoring classifier")
    parser.add_argument("--create-template", action="store_true", 
                       help="Create a template CSV file for training data")
    
    args = parser.parse_args()
    
    if args.create_template:
        create_training_template()
    else:
        asyncio.run(train_classifier())