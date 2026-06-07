# 🎨 AuraHR Frontend - Modern React HR Dashboard

<div align="center">

![React](https://img.shields.io/badge/React-18+-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.0+-yellow?style=for-the-badge&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0+-teal?style=for-the-badge&logo=tailwindcss)

_Modern, responsive React application with TypeScript, optimized for enterprise HR management_

</div>

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📱 Features](#-features)
- [🎨 UI Components](#-ui-components)
- [📊 State Management](#-state-management)
- [🔧 Configuration](#-configuration)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)

## 🌟 Overview

The AuraHR frontend is a modern, responsive React application built with TypeScript and Vite, providing an intuitive interface for all HR management operations. It features a clean, professional design with advanced UI components and seamless API integration.

### 🎯 Key Features

- **⚡ Lightning Fast**: Vite-powered development and builds
- **🎨 Modern UI**: Radix UI components with Tailwind CSS styling
- **📱 Fully Responsive**: Mobile-first design that works on all devices
- **🔐 Secure Authentication**: JWT-based auth with role-based routing
- **📊 Real-time Data**: React Query for efficient data fetching and caching
- **🎭 Multi-persona Support**: Tailored experiences for different user roles

### 👥 User Personas & Features

#### 👩‍💼 **Adeline (System Administrator)**

- **Dashboard**: System-wide analytics and KPIs
- **User Management**: Create, edit, and manage user accounts
- **System Settings**: Configure system preferences and integrations
- **Audit Logs**: View system activity and security logs

#### 👨‍💼 **Mark (HR Manager)**

- **Team Analytics**: Department performance metrics and insights
- **Employee Overview**: Comprehensive employee management
- **Performance Reviews**: Track and manage performance evaluations
- **Reporting**: Generate detailed HR reports and analytics

#### 👩‍🎯 **Rachel (Recruiter)**

- **Job Management**: Create and manage job postings
- **Candidate Pipeline**: AI-powered candidate screening and ranking
- **Resume Viewer**: Advanced resume analysis with AI insights
- **Interview Scheduling**: Automated screening and interview management

#### 👩‍💻 **Eva (Employee)**

- **Personal Dashboard**: Performance metrics and career goals
- **Development Plans**: AI-generated learning recommendations
- **Performance Tracking**: View ratings, feedback, and progress
- **Goal Management**: Set and track personal and professional goals

## 🚀 Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **API Client**: Axios with React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

## 📦 Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 8000

## 🛠️ Installation

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Environment setup:**

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

3. **Start development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📋 Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run dev:debug` - Start with debug logging enabled

### Building

- `npm run build` - Production build
- `npm run build:staging` - Staging build
- `npm run build:analyze` - Build with bundle analysis
- `npm run preview` - Preview production build locally
- `npm run preview:build` - Build and preview

### Code Quality

- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Utilities

- `npm run clean` - Clean build cache and dist folder

## 🔧 Environment Configuration

### Required Variables

```env
VITE_API_URL=http://localhost:8000/api
```

### Optional Variables

```env
# Application Info
VITE_APP_NAME=AuraHR
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=AI-Powered HRMS
VITE_APP_AUTHOR=AuraHR Team

# Environment
VITE_NODE_ENV=development
VITE_DEV_MODE=true
VITE_DEBUG=true

# Features
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_NOTIFICATIONS=true

# Upload Settings
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=.pdf,.docx,.txt

# UI Settings
VITE_ENABLE_DARK_MODE=true
VITE_DEFAULT_THEME=light
VITE_PAGINATION_SIZE=10

# Security
VITE_SESSION_TIMEOUT=1800000
VITE_AUTO_LOGOUT_WARNING=300000

# Performance
VITE_ENABLE_SERVICE_WORKER=false
VITE_ENABLE_BUNDLE_ANALYZER=false
```

## 🏗️ Build Configuration

### Development Build

- Source maps enabled
- Hot module replacement
- Detailed error messages
- Debug logging

### Production Build

- Code minification (esbuild)
- Tree shaking
- Bundle splitting
- Asset optimization
- Console/debugger removal
- Gzip compression

### Bundle Splitting Strategy

- `react-vendor`: React and React DOM
- `router-vendor`: React Router
- `ui-vendor`: Radix UI components
- `query-vendor`: TanStack Query
- `form-vendor`: Form libraries
- `chart-vendor`: Recharts
- `utils-vendor`: Utility libraries

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── forms/         # Form components
│   │   ├── charts/        # Chart components
│   │   └── debug/         # Debug components
│   ├── pages/             # Route components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   │   ├── api.ts         # API client functions
│   │   ├── axios.ts       # Axios configuration
│   │   ├── config.ts      # App configuration
│   │   ├── utils.ts       # Utility functions
│   │   └── notifications.ts # Notification system
│   ├── store/             # Zustand stores
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
├── .env                   # Environment variables
├── .env.example          # Environment template
├── components.json       # shadcn/ui configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── vite.config.js        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── Dockerfile           # Docker build configuration
├── nginx.conf           # Nginx configuration for production
└── package.json         # Dependencies and scripts
```

## 🔌 API Integration

The frontend communicates with the backend through a well-defined REST API:

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user

### Jobs

- `GET /jobs` - List all jobs
- `POST /jobs` - Create new job
- `GET /jobs/:id` - Get job details
- `POST /jobs/:id/upload-resume` - Upload resume

### Candidates

- `GET /candidates` - List candidates
- `GET /candidates/:id` - Get candidate details
- `POST /candidates/:id/start-screening` - Start AI screening

### Employees

- `GET /employees` - List employees
- `GET /employees/:id/development-plan` - Get development plan

### Error Handling

- Automatic retry for network errors
- User-friendly error messages
- Error boundary for crash protection
- Comprehensive logging in debug mode

## 🎨 UI/UX Features

### Design System

- Consistent component library (shadcn/ui)
- Dark/light theme support
- Responsive design (mobile-first)
- Accessible components (ARIA compliant)

### User Experience

- Loading states and skeletons
- Optimistic updates
- Real-time notifications
- Keyboard navigation
- Form validation with instant feedback

### Performance

- Code splitting and lazy loading
- Image optimization
- Bundle analysis tools
- Memory leak prevention

## 🚢 Deployment

### Manual Deployment

```bash
# Build for production
npm run build

# Serve with any static file server
npx serve -s dist -l 3000
```

## 🔍 Debugging

### Debug Mode

Set `VITE_DEBUG=true` to enable:

- Detailed API request/response logging
- Component error boundaries with stack traces
- Redux DevTools integration
- Performance monitoring

### Common Issues

**API Connection Issues:**

```bash
# Check backend is running
curl http://localhost:8000/docs

# Verify environment variables
echo $VITE_API_URL
```

**Build Issues:**

```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

**Type Errors:**

```bash
# Run type checking
npm run type-check
```