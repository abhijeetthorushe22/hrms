# 🚀 AuraHR - The Next-Generation AI-Powered HRMS

<div align="center">

![AuraHR Logo](https://img.shields.io/badge/AuraHR-AI%20Powered%20HRMS-blue?style=for-the-badge&logo=react)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20DB-purple?style=flat-square)](https://www.trychroma.com/)
[![HuggingFace](https://img.shields.io/badge/🤗%20HuggingFace-Transformers-yellow?style=flat-square)](https://huggingface.co/)

_Enterprise-grade Human Resource Management System powered by cutting-edge AI technologies_

</div>

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [💻 Tech Stack](#-tech-stack)
- [📖 API Documentation](#-api-documentation)
- [🔧 Configuration](#-configuration)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

## 🎬 Demo Video

A short product demo video is available to help you quickly understand AuraHR's core features (recruitment, AI screening, performance dashboards, and development plans).

- `AuraHR Demo Video.mp4` :- [View Demo Video](./AuraHR%20Demo%20Video.mp4)

<video width="800" controls>
  <source src="./AuraHR%20Demo%20Video.mp4" type="video/mp4">
  <p>Your browser does not support HTML5 video. You can download the demo: <a href="./AuraHR%20Demo%20Video.mp4">Download Demo Video</a> or watch it on <a href="https://drive.google.com/file/d/1D5WMNyfPaUsWGriTvKjdA-IWPIJPngoh/view?usp=sharing">Google Drive</a>.</p>
</video>

- Hosted demo (Google Drive): https://drive.google.com/file/d/1D5WMNyfPaUsWGriTvKjdA-IWPIJPngoh/view?usp=sharing

## 📸 Demo Screenshots

### 👩‍💼 Admin Dashboard

<div align="center">
  <img src="Demo Screenshots/AdminDashboard.png" alt="Admin Dashboard - System Overview" width="800"/>
  <p><em>Comprehensive admin dashboard with system-wide analytics, user management, and KPI tracking</em></p>
</div>

### 👩‍🎯 Recruiter Dashboard

<div align="center">
  <img src="Demo Screenshots/RecruiterDashboard.png" alt="Recruiter Dashboard" width="800"/>
  <p><em>AI-powered recruitment dashboard with candidate screening and matching insights</em></p>
</div>

### 👨‍💼 Manager Dashboard

<div align="center">
  <img src="Demo Screenshots/ManagerDashboard.png" alt="Manager Dashboard - Team Analytics" width="800"/>
  <p><em>Manager dashboard showing team performance metrics and department insights</em></p>
</div>

### 👩‍🎯 Recruiter Interface

#### Job Management

<div align="center">
  <img src="Demo Screenshots/JobsPageForRecruiter.png" alt="Jobs Page for Recruiter" width="800"/>
  <p><em>Recruiter job management interface with posting creation and candidate pipeline</em></p>
</div>

#### AI Screening Interface

<div align="center">
  <img src="Demo Screenshots/AIScreening.png" alt="AI Screening Interface" width="800"/>
  <p><em>Conversational AI screening interface for automated candidate interviews</em></p>
</div>

### 📊 Admin Interface

#### Recruitment Process (Admin View)

<div align="center">
  <img src="Demo Screenshots/RecruitmentPageForAdmin.png" alt="Recruitment Page for Admin" width="800"/>
  <p><em>Admin oversight of recruitment processes with system-wide metrics</em></p>
</div>

#### Employee Management (Admin View)

<div align="center">
  <img src="Demo Screenshots/EmployeePageForAdmin.png" alt="Employee Page for Admin" width="800"/>
  <p><em>Admin view of employee management with detailed profiles and analytics</em></p>
</div>

### 📊 Manager Interface

#### Team Analytics Dashboard

<div align="center">
  <img src="Demo Screenshots/TeamAnalyticsDashboard.png" alt="Team Analytics Dashboard" width="800"/>
  <p><em>Advanced team analytics with performance trends and skill gap analysis</em></p>
</div>

#### Team Development

<div align="center">
  <img src="Demo Screenshots/TeamDevelopement.png" alt="Team Development" width="800"/>
  <p><em>AI-powered learning and development planning interface</em></p>
</div>

#### Performance Management

<div align="center">
  <img src="Demo Screenshots/PerformanceManagement.png" alt="Performance Management" width="800"/>
  <p><em>Employee performance tracking with AI-generated insights and recommendations</em></p>
</div>

### 👩‍💻 Employee Experience Interface

#### Employee Dashboard

<div align="center">
  <img src="Demo Screenshots/EmployeeDashboard.png" alt="Employee Dashboard" width="800"/>
  <p><em>Personal employee dashboard with performance metrics and career goals</em></p>
</div>

#### Document Management

<div align="center">
  <img src="Demo Screenshots/EmployeeDocs.png" alt="Employee Documents" width="800"/>
  <p><em>Employee document management and file handling interface</em></p>
</div>

## 🌟 Overview

AuraHR is a comprehensive, production-ready Human Resource Management System that leverages cutting-edge AI technologies to automate recruitment processes, foster personalized employee growth, and provide data-driven insights for modern enterprises.

### 🎯 Key Benefits

- **🤖 AI-Powered Recruitment**: Automated resume screening with 90%+ accuracy using semantic matching
- **📊 Smart Analytics**: Real-time performance insights and predictive analytics
- **🎓 Personalized L&D**: AI-generated learning and development plans for each employee
- **💬 Conversational AI**: Interactive candidate screening through natural language processing
- **🔍 Vector Search**: Advanced candidate matching using ChromaDB embeddings
- **🚀 Production Ready**: Enterprise-grade security, scalability, and performance

## ✨ Key Features

### 🔍 AI-Powered Recruitment

- **Smart Resume Screening**: Automatic PDF/DOCX parsing with NLP-based entity extraction
- **Semantic Candidate Matching**: HuggingFace Sentence Transformers for precise job-candidate matching
- **AI Interview Screening**: Conversational AI with contextual follow-up questions
- **Automated Ranking**: ML-powered candidate scoring and recommendation engine

### 👥 Employee Management

- **360° Performance Tracking**: Comprehensive performance metrics and analytics
- **Skills Gap Analysis**: AI-driven identification of skill gaps and improvement areas
- **Career Path Planning**: Personalized development roadmaps using Google Gemini AI
- **Real-time Insights**: Dynamic dashboards for HR managers and employees

### 🔐 Enterprise Security

- **JWT Authentication**: Secure token-based authentication system
- **Role-Based Access**: Granular permissions for Admin, Manager, Recruiter, and Employee roles
- **Data Encryption**: bcrypt password hashing and secure data transmission
- **Audit Trails**: Complete activity logging for compliance and security

### 📊 Advanced Analytics

- **Performance Dashboards**: Real-time KPIs and metrics visualization
- **Predictive Analytics**: Turnover prediction and retention insights
- **Team Performance**: Department-wide and team-level performance tracking
- **Business Intelligence**: Data-driven decision making tools

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AuraHR Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                                        │
│  ├── UI Components (Material-UI + Radix UI)                     │
│  ├── State Management (Zustand)                                 │
│  ├── API Integration (React Query)                              │
│  └── Routing (React Router)                                     │
├─────────────────────────────────────────────────────────────────┤
│  Backend (FastAPI)                                              │
│  ├── REST API Endpoints                                         │
│  ├── Authentication & Authorization                             │
│  ├── Business Logic Services                                    │
│  └── AI Integration Layer                                       │
├─────────────────────────────────────────────────────────────────┤
│  AI Services                                                    │
│  ├── HuggingFace Transformers (Resume Analysis)                 │
│  ├── Sentence Transformers (Semantic Matching)                  │
│  ├── Google Gemini (Conversational AI)                          │
│  ├── spaCy (Entity Extraction)                                  │
│  └── ChromaDB (Vector Database)                                 │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ├── MongoDB (Primary Database)                                 │
│  ├── ChromaDB (Vector Embeddings)                               │
│  └── File Storage (Resume Upload)                               │
└─────────────────────────────────────────────────────────────────┘
```

### AI Pipeline

```
Resume Upload → Text Extraction → Entity Recognition →
Embedding Generation → Similarity Calculation →
Candidate Ranking → AI Screening → Interview Summary
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **MongoDB** 6.0+ (Atlas or local)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/abhijeetthorushe22/hrms.git
cd hrms
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
copy .env.example .env
# Edit .env with your configuration

# Start backend server
uvicorn app.main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 🔑 Default Test Credentials

```
Admin:     admin@example.com / admin123
Manager:   manager@example.com / manager123
Recruiter: recruiter@example.com / recruiter123
Employee:  employee@example.com / employee123
```

## 💻 Tech Stack

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (Lightning-fast builds)
- **UI Framework**: Radix UI + Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: React Query + Axios
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Backend

- **Framework**: FastAPI (High-performance Python API)
- **Database**: MongoDB with Motor (Async driver)
- **Authentication**: JWT with passlib + bcrypt
- **Validation**: Pydantic v2 with custom validators
- **File Processing**: PyPDF2, python-docx, Pillow
- **API Documentation**: OpenAPI 3.0 (Swagger)

### AI/ML Stack

- **Embedding Model**: HuggingFace Sentence Transformers
- **Vector Database**: ChromaDB for similarity search
- **NLP Processing**: spaCy for entity extraction
- **Conversational AI**: Google Gemini API
- **ML Framework**: scikit-learn for classification
- **Caching**: In-memory + file-based embedding cache

### Infrastructure

- **Containerization**: Docker with multi-stage builds
- **Development**: Hot reload, auto-restart
- **Production**: Gunicorn + Uvicorn workers
- **Monitoring**: Structured logging with Python logging

## 📖 API Documentation

### Core Endpoints

#### Authentication

```http
POST /api/v1/auth/login          # User login
POST /api/v1/auth/register       # User registration
POST /api/v1/auth/refresh        # Token refresh
```

#### Jobs & Recruitment

```http
GET    /api/v1/jobs                    # List all jobs
POST   /api/v1/jobs                    # Create new job
POST   /api/v1/jobs/{id}/upload-resume # Upload candidate resume
GET    /api/v1/jobs/{id}/candidates    # Get job candidates (AI-ranked)
```

#### AI-Powered Features

```http
GET  /api/v1/candidates/{id}/ai-score       # AI resume scoring
POST /api/v1/candidates/{id}/start-screening # AI interview screening
GET  /api/v1/employees/{id}/development-plan # AI learning plan
```

#### Employee Management

```http
GET    /api/v1/employees           # List employees
POST   /api/v1/employees           # Create employee
PUT    /api/v1/employees/{id}      # Update employee
DELETE /api/v1/employees/{id}      # Delete employee
```

### Interactive API Documentation

Visit `http://localhost:8000/docs` for complete interactive API documentation with request/response examples.

## 🔧 Configuration

### Environment Variables

#### Required Settings

```env
# Database
DATABASE_URL=your-mongodb-url

# Security
SECRET_KEY=your-super-secret-jwt-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Configuration
GOOGLE_API_KEY=your-gemini-api-key-here
EMBEDDING_MODEL_NAME=sentence-transformers/msmarco-distilbert-base-v4
SPACY_MODEL_NAME=en_core_web_sm
```

#### Optional Settings

```env
# AI Features (Enable/Disable)
INIT_AI_ON_STARTUP=true
ENABLE_SPACY_PROCESSING=true
ENABLE_GEMINI_FALLBACK=false
ENABLE_ML_CLASSIFIER=true
ENABLE_ENTITY_EXTRACTION=true

# Performance
CHROMA_PERSIST_DIRECTORY=./chroma_db
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Development
DEBUG=false
LOG_LEVEL=INFO
ENABLE_DOCS=true
```

## 🚢 Deployment

### Production Deployment Options

#### 1. **Render + Vercel** (Recommended)

- **Backend**: Deploy to Render using `render.yaml`
- **Frontend**: Deploy to Vercel using `vercel.json`
- **Database**: MongoDB Atlas (Free tier available)

#### 2. **Docker Containerization**

```bash
# Build and run with Docker Compose
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📊 Project Stats

- **✅ Production Ready**: Enterprise-grade security and performance
- **🤖 AI-First**: 5+ AI models integrated for intelligent automation
- **📱 Responsive**: Works seamlessly on desktop, tablet, and mobile
- **🔒 Secure**: JWT authentication, role-based access, encrypted data
- **⚡ Fast**: Optimized queries, caching, and lazy loading
- **📈 Scalable**: Microservices-ready architecture

<!-- ## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
--- -->

<div align="center">

**[⭐ Star this repo](https://github.com/abhijeetthorushe22/hrms) if you find it helpful!**

Built with ❤️ by Abhijeet Thorushe

</div>
