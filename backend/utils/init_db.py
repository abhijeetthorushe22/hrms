#!/usr/bin/env python3
"""
AuraHR Database Initialization Script
Creates sample users, employees, and job postings for demonstration
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from bson import ObjectId

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import connect_to_mongo, get_database
from app.core.security import get_password_hash

async def init_database():
    """Initialize database with sample data."""
    print("🚀 Initializing AuraHR database...")
    
    # Connect to database
    await connect_to_mongo()
    db = get_database()
    
    print("📊 Connected to database successfully!")
    
    # Clear existing data (optional - comment out for production)
    print("🧹 Clearing existing data...")
    await db.users.delete_many({})
    await db.employees.delete_many({})
    await db.job_postings.delete_many({})
    await db.candidates.delete_many({})
    await db.performance_reviews.delete_many({})
    await db.development_plans.delete_many({})
    
    # Create sample employees
    employees_data = [
        {
            "_id": ObjectId(),
            "firstName": "John",
            "lastName": "Doe",
            "jobTitle": "Senior Software Engineer",
            "department": "Engineering",
            "managerId": None,  # Will be set after creating manager
            "hireDate": datetime.utcnow() - timedelta(days=365),
            "contactInfo": {
                "phone": "+1-555-0101",
                "address": "123 Tech Street, San Francisco, CA"
            },
            "extractedSkills": ["Python", "JavaScript", "React", "Docker", "AWS"],
            "careerGoals": "Become a tech lead and mentor junior developers",
            "createdAt": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "firstName": "Jane",
            "lastName": "Smith",
            "jobTitle": "Product Manager",
            "department": "Product",
            "managerId": None,
            "hireDate": datetime.utcnow() - timedelta(days=500),
            "contactInfo": {
                "phone": "+1-555-0102",
                "address": "456 Innovation Ave, San Francisco, CA"
            },
            "extractedSkills": ["Product Strategy", "Agile", "Data Analysis", "User Research"],
            "careerGoals": "Lead product strategy for AI-powered features",
            "createdAt": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "firstName": "Alice",
            "lastName": "Johnson",
            "jobTitle": "Engineering Manager",
            "department": "Engineering",
            "managerId": None,
            "hireDate": datetime.utcnow() - timedelta(days=800),
            "contactInfo": {
                "phone": "+1-555-0103",
                "address": "789 Leadership Blvd, San Francisco, CA"
            },
            "extractedSkills": ["Leadership", "System Design", "Team Management", "Strategic Planning"],
            "careerGoals": "Scale engineering team and improve development processes",
            "createdAt": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "firstName": "Bob",
            "lastName": "Wilson",
            "jobTitle": "HR Manager",
            "department": "Human Resources",
            "managerId": None,
            "hireDate": datetime.utcnow() - timedelta(days=600),
            "contactInfo": {
                "phone": "+1-555-0104",
                "address": "321 People St, San Francisco, CA"
            },
            "extractedSkills": ["Recruitment", "Employee Relations", "HR Analytics", "Policy Development"],
            "careerGoals": "Implement AI-driven HR processes and improve employee experience",
            "createdAt": datetime.utcnow()
        }
    ]
    
    # Insert employees
    employee_result = await db.employees.insert_many(employees_data)
    employee_ids = list(employee_result.inserted_ids)
    print(f"👥 Created {len(employee_ids)} sample employees")
    
    # Set manager relationships
    await db.employees.update_one(
        {"_id": employee_ids[0]},  # John Doe
        {"$set": {"managerId": employee_ids[2]}}  # Reports to Alice (Engineering Manager)
    )
    
    # Create users for each employee
    users_data = [
        {
            "email": "john.doe@aurahr.com",
            "password": get_password_hash("password123"),
            "role": "employee",
            "employeeId": employee_ids[0],
            "createdAt": datetime.utcnow()
        },
        {
            "email": "jane.smith@aurahr.com",
            "password": get_password_hash("password123"),
            "role": "manager",
            "employeeId": employee_ids[1],
            "createdAt": datetime.utcnow()
        },
        {
            "email": "alice.johnson@aurahr.com",
            "password": get_password_hash("password123"),
            "role": "manager",
            "employeeId": employee_ids[2],
            "createdAt": datetime.utcnow()
        },
        {
            "email": "bob.wilson@aurahr.com",
            "password": get_password_hash("password123"),
            "role": "recruiter",
            "employeeId": employee_ids[3],
            "createdAt": datetime.utcnow()
        },
        {
            "email": "admin@aurahr.com",
            "password": get_password_hash("admin123"),
            "role": "admin",
            "employeeId": None,
            "createdAt": datetime.utcnow()
        }
    ]
    
    user_result = await db.users.insert_many(users_data)
    print(f"🔐 Created {len(user_result.inserted_ids)} user accounts")
    
    # Create sample job postings
    jobs_data = [
        {
            "title": "Senior Frontend Developer",
            "department": "Engineering",
            "description": """We're looking for a Senior Frontend Developer to join our growing engineering team. 
            
Responsibilities:
- Build responsive web applications using React, TypeScript, and modern CSS
- Collaborate with designers and backend engineers to deliver high-quality features
- Mentor junior developers and contribute to code reviews
- Optimize application performance and user experience

Requirements:
- 5+ years of experience with JavaScript and modern frontend frameworks
- Strong knowledge of React, TypeScript, and CSS-in-JS solutions
- Experience with state management libraries (Redux, Zustand, etc.)
- Familiarity with testing frameworks (Jest, React Testing Library)
- Knowledge of build tools and CI/CD pipelines
- Excellent communication and collaboration skills

Bonus:
- Experience with Next.js or other SSR frameworks
- Knowledge of design systems and component libraries
- Familiarity with GraphQL and REST APIs""",
            "status": "open",
            "descriptionVector": None,  # Will be generated when AI service is available
            "createdAt": datetime.utcnow()
        },
        {
            "title": "DevOps Engineer",
            "department": "Engineering",
            "description": """Join our Platform team as a DevOps Engineer to help scale our infrastructure and improve developer productivity.

Responsibilities:
- Design and maintain CI/CD pipelines
- Manage cloud infrastructure on AWS/Azure
- Implement monitoring, logging, and alerting systems
- Automate deployment and infrastructure provisioning
- Ensure security best practices across all systems

Requirements:
- 3+ years of experience in DevOps or Site Reliability Engineering
- Strong knowledge of containerization (Docker, Kubernetes)
- Experience with Infrastructure as Code (Terraform, CloudFormation)
- Proficiency in scripting languages (Python, Bash, PowerShell)
- Familiarity with monitoring tools (Prometheus, Grafana, ELK stack)
- Experience with cloud platforms (AWS, Azure, GCP)

Bonus:
- Kubernetes certification
- Experience with service mesh technologies
- Knowledge of security scanning and compliance tools""",
            "status": "open",
            "descriptionVector": None,
            "createdAt": datetime.utcnow()
        },
        {
            "title": "Product Designer",
            "department": "Design",
            "description": """We're seeking a talented Product Designer to help shape the future of our AI-powered HR platform.

Responsibilities:
- Design intuitive user interfaces for web and mobile applications
- Conduct user research and usability testing
- Create wireframes, prototypes, and high-fidelity designs
- Collaborate with product managers and engineers
- Maintain and evolve our design system

Requirements:
- 4+ years of product design experience
- Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)
- Strong understanding of user-centered design principles
- Experience with design systems and component libraries
- Knowledge of HTML/CSS and frontend development basics
- Excellent presentation and communication skills

Bonus:
- Experience designing AI/ML-powered products
- Knowledge of accessibility standards (WCAG)
- Experience with user research and analytics tools""",
            "status": "open",
            "descriptionVector": None,
            "createdAt": datetime.utcnow()
        }
    ]
    
    job_result = await db.job_postings.insert_many(jobs_data)
    print(f"💼 Created {len(job_result.inserted_ids)} sample job postings")
    
    # Create sample performance review for John Doe
    performance_review = {
        "employeeId": employee_ids[0],
        "reviewerId": employee_ids[2],  # Alice Johnson (his manager)
        "reviewDate": datetime.utcnow() - timedelta(days=30),
        "ratings": {
            "communication": 4,
            "technicalSkills": 4,
            "teamwork": 5
        },
        "feedbackText": """John has shown excellent technical skills and is always willing to help team members. 
        He consistently delivers high-quality code and meets deadlines. Areas for improvement include 
        taking more initiative in system design discussions and developing leadership skills for potential 
        tech lead role. Recommended for senior-level responsibilities and mentoring opportunities."""
    }
    
    await db.performance_reviews.insert_one(performance_review)
    print("📝 Created sample performance review")
    
    print("\n✅ Database initialization completed successfully!")
    print("\n🔑 Sample login credentials:")
    print("Admin: admin@aurahr.com / admin123")
    print("Employee: john.doe@aurahr.com / password123")
    print("Manager: alice.johnson@aurahr.com / password123")
    print("Recruiter: bob.wilson@aurahr.com / password123")
    print("\n🚀 You can now start the backend server with: uvicorn app.main:app --reload")

if __name__ == "__main__":
    asyncio.run(init_database())