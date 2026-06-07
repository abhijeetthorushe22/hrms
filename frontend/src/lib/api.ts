import { api as axiosApi } from "./axios";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ScreeningResult {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  resumeScore: number;
  skillsMatch: number;
  experienceMatch: number;
  overallScore: number;
  status: "pending" | "passed" | "failed" | "reviewing";
  aiInsights: string[];
  screeningDate: string;
  strengths: string[];
  weaknesses: string[];
}

export interface ScreeningMetrics {
  totalScreened: number;
  passed: number;
  failed: number;
  pending: number;
  averageScore: number;
}
export interface User {
  _id: string;
  email: string;
  role: "admin" | "manager" | "recruiter" | "employee";
  employeeId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Job Posting Interfaces
export interface JobPosting {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  department: string;
  salaryRange: string;
  employmentType: "full-time" | "part-time" | "contract" | "internship";
  postedBy: string;
  postedAt: string;
  isActive: boolean;
}

export interface JobPostingCreate {
  title: string;
  description: string;
  requirements: string[];
  location: string;
  department: string;
  salaryRange: string;
  employmentType: "full-time" | "part-time" | "contract" | "internship";
}

// Candidate Interfaces
export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  jobPostingId: string;
  resumeS3Key?: string;
  extractedText?: string;
  chromaVectorId?: string;
  matchScore?: number;
  // AI scoring fields (optional) - may be populated by ai-score endpoint
  resumeScore?: number;
  status:
    | "new"
    | "screening"
    | "interviewing"
    | "offered"
    | "hired"
    | "rejected";
  interviewSummary?: string;
  appliedAt: string;
}

// Employee Interfaces
export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  hireDate: string;
  extractedSkills: string[];
  careerGoals?: string;
}

export interface EmployeeCreate {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  hireDate: string;
  extractedSkills?: string[];
  careerGoals?: string;
}

// Performance Review Interfaces
export interface PerformanceReview {
  _id: string;
  employeeId: string;
  reviewerId: string;
  reviewDate: string;
  ratings: {
    communication: number;
    technicalSkills: number;
    teamwork: number;
  };
  feedbackText: string;
}

export interface PerformanceReviewCreate {
  employee_id: string;
  reviewer_id: string;
  review_period_start: string;
  review_period_end: string;
  goals?: string[];
  self_assessment?: string;
  manager_assessment?: string;
  peer_feedback?: PeerFeedback[];
  development_areas?: string[];
  strengths?: string[];
  overall_rating?: number;
  status?: "draft" | "in_progress" | "completed";
}

// Chat Interfaces
export interface ChatSession {
  _id: string;
  candidateId: string;
  messages: ChatMessageDisplay[];
  isActive: boolean;
  createdAt: string;
}

export interface ChatMessageDisplay {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  success?: boolean;
}

// Team Management Interfaces
export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "away" | "busy";
  performanceScore: number;
  collaborationScore: number;
  joinDate: string;
  lastActive: string;
  skills: string[];
  careerGoals?: string;
  manager?: string;
  directReports?: number;
  projectsCount?: number;
}

export interface TeamMemberInsights {
  strengths: string[];
  growthAreas: string[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
}

export interface TeamMemberWithInsights extends TeamMember {
  insights: TeamMemberInsights;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  departments: string[];
  averagePerformance: number;
  averageCollaboration: number;
  topPerformers: TeamMember[];
  recentJoiners: TeamMember[];
}

// Auth API
export const authApi = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    axiosApi.post("/auth/login", data).then((res) => res.data),

  register: (data: RegisterRequest): Promise<User> =>
    axiosApi.post("/auth/register", data).then((res) => res.data),

  getProfile: (): Promise<User> =>
    axiosApi.get("/auth/me").then((res) => res.data),
};

// File Upload Response
export interface FileUploadResponse {
  message: string;
  candidateId: string;
}

export interface DevelopmentPlan {
  id: string;
  employeeId: string;
  generatedAt: string;
  planJson: {
    growthAreas: {
      area: string;
      justification: string;
      learningResources: string[];
      internalActions: string[];
    }[];
  };
}

export interface ChatStart {
  chatId: string;
  firstMessage: string;
  candidateToken?: string;
  candidateLink?: string;
}

export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  reply: string;
}

export interface PeerFeedback {
  peer_id: string;
  peer_name: string;
  feedback: string;
  rating?: number;
}

export interface PerformanceReviewUpdate {
  goals?: string[];
  self_assessment?: string;
  manager_assessment?: string;
  peer_feedback?: PeerFeedback[];
  development_areas?: string[];
  strengths?: string[];
  overall_rating?: number;
  status?: "draft" | "in_progress" | "completed";
}

// Jobs API - Following PRD specification
export const jobsApi = {  
  createJob: (data: JobPostingCreate): Promise<JobPosting> =>
    axiosApi.post("/jobs/", data).then((res) => res.data),

  // GET /jobs - Get all job postings
  getJobs: (): Promise<JobPosting[]> =>
    axiosApi.get("/jobs").then((res) => res.data),

  // GET /jobs/{job_id} - Get specific job posting
  getJob: (id: string): Promise<JobPosting> =>
    axiosApi.get(`/jobs/${id}`).then((res) => res.data),

  // POST /jobs/{job_id}/upload-resume - Upload resume for job
  uploadResume: (jobId: string, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosApi
      .post(`/jobs/${jobId}/upload-resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  // GET /jobs/{job_id}/candidates - Get candidates for job
  getJobCandidates: (jobId: string): Promise<Candidate[]> =>
    axiosApi.get(`/jobs/${jobId}/candidates`).then((res) => res.data),
};

// Employee Development API - Following PRD specification
export const employeesApi = {
  // GET /employees - Get all employees
  getEmployees: (): Promise<Employee[]> =>
    axiosApi.get("/employees").then((res) => res.data),

  // GET /employees/{employee_id} - Get specific employee
  getEmployee: (id: string): Promise<Employee> =>
    axiosApi.get(`/employees/${id}`).then((res) => res.data),

  // POST /employees - Create new employee
  createEmployee: (data: EmployeeCreate): Promise<Employee> =>
    axiosApi.post("/employees", data).then((res) => res.data),

  // PUT /employees/{employee_id} - Update employee
  updateEmployee: (
    id: string,
    data: Partial<EmployeeCreate>
  ): Promise<Employee> =>
    axiosApi.put(`/employees/${id}`, data).then((res) => res.data),

  // DELETE /employees/{employee_id} - Delete employee
  deleteEmployee: (id: string): Promise<void> =>
    axiosApi.delete(`/employees/${id}`).then((res) => res.data),

  // GET /employees/{employee_id}/development-plan - Get development plan
  getDevelopmentPlan: (employeeId: string): Promise<DevelopmentPlan> =>
    axiosApi
      .get(`/employees/${employeeId}/development-plan`)
      .then((res) => res.data),

  // POST /employees/{employee_id}/development-plan - Generate new development plan
  generateDevelopmentPlan: (employeeId: string): Promise<DevelopmentPlan> =>
    axiosApi
      .post(`/employees/${employeeId}/development-plan`)
      .then((res) => res.data),
};

// Candidates API
export const candidatesApi = {
  // GET /candidates - Get all candidates
  getCandidates: (jobId?: string): Promise<Candidate[]> => {
    const params = jobId ? { job_id: jobId } : {};
    return axiosApi.get("/candidates", { params }).then((res) => res.data);
  },

  // GET /candidates/{candidate_id} - Get specific candidate
  getCandidate: (id: string): Promise<Candidate> =>
    axiosApi.get(`/candidates/${id}`).then((res) => res.data),

  // POST /candidates/{candidate_id}/start-chat - Start screening chat
  startChat: (candidateId: string): Promise<ChatStart> =>
    axiosApi
      .post(`/candidates/${candidateId}/start-chat`)
      .then((res) => res.data),

  // GET /candidates/{candidate_id}/resume-text - Get resume text
  getResumeText: (candidateId: string): Promise<{ resume_text: string }> =>
    axiosApi
      .get(`/candidates/${candidateId}/resume-text`)
      .then((res) => res.data),

  // GET /candidates/{candidate_id}/resume-file - Get original resume file
  getResumeFileUrl: (candidateId: string): string =>
    `/api/candidates/${candidateId}/resume-file`,

  // PATCH /candidates/{candidate_id}/status - Update candidate status
  updateStatus: (
    candidateId: string,
    status: string
  ): Promise<{ message: string }> =>
    axiosApi
      .patch(`/candidates/${candidateId}/status`, { new_status: status })
      .then((res) => res.data),

  // POST /candidates/{candidate_id}/start-screening - Start AI screening
  startScreening: (candidateId: string): Promise<ChatStart> =>
    axiosApi
      .post(`/candidates/${candidateId}/start-screening`)
      .then((res) => res.data),

  // GET /candidates/{candidate_id}/ai-score - Get AI scoring
  getAIScore: (candidateId: string): Promise<ScreeningResult> =>
    axiosApi.get(`/candidates/${candidateId}/ai-score`).then((res) => res.data),

  // GET /chat/{chat_id}/messages - Get chat session metadata and messages
  // Note: parameter here is chatId (not candidateId). Caller should use the chat
  // id returned from startChat/startScreening endpoints.
  getChat: async (chatId: string): Promise<any> => {
    const resp = await axiosApi.get(`/chat/${chatId}/messages`);
    // resp.data expected shape from backend: { chat_id, candidate_id, job_posting_id, messages, status, created_at }
    const data = resp.data || {};

    // If candidate metadata exists, attempt to fetch candidate name; otherwise leave blank
    let candidateName = "";
    if (data.candidate_id) {
      try {
        const cand = await axiosApi.get(`/candidates/${data.candidate_id}`);
        candidateName = cand.data?.name || "";
      } catch (e) {
        candidateName = "";
      }
    }

    return {
      chatId: data.chat_id,
      candidateId: data.candidate_id,
      candidateName,
      jobId: data.job_posting_id,
      status: data.status,
      messages: data.messages || [],
      createdAt: data.created_at,
    };
  },
};

// Performance Reviews API - Following PRD specification
export const performanceApi = {
  // GET /performance/reviews - Get all performance reviews
  getReviews: (): Promise<PerformanceReview[]> =>
    axiosApi.get("/performance/reviews").then((res) => res.data),

  // GET /performance/reviews/{review_id} - Get specific review
  getReview: (id: string): Promise<PerformanceReview> =>
    axiosApi.get(`/performance/reviews/${id}`).then((res) => res.data),

  // POST /performance/reviews - Create performance review
  createReview: (data: PerformanceReviewCreate): Promise<PerformanceReview> =>
    axiosApi.post("/performance/reviews", data).then((res) => res.data),

  // PUT /performance/reviews/{review_id} - Update performance review
  updateReview: (
    id: string,
    data: PerformanceReviewUpdate
  ): Promise<PerformanceReview> =>
    axiosApi.put(`/performance/reviews/${id}`, data).then((res) => res.data),

  // DELETE /performance/reviews/{review_id} - Delete performance review
  deleteReview: (id: string): Promise<void> =>
    axiosApi.delete(`/performance/reviews/${id}`).then((res) => res.data),

  // GET /performance/employees/{employee_id}/reviews - Get employee reviews
  getEmployeeReviews: (employeeId: string): Promise<PerformanceReview[]> =>
    axiosApi
      .get(`/performance/employees/${employeeId}/reviews`)
      .then((res) => res.data),
};

// Chat API - Following PRD specification
export const chatApi = {
  // POST /chat/{chat_id} - Send message to chat
  sendMessage: (chatId: string, data: ChatMessage): Promise<ChatResponse> =>
    axiosApi.post(`/chat/${chatId}`, data).then((res) => res.data),

  // GET /chat/{chat_id}/messages - Get chat messages
  getChatMessages: (chatId: string) =>
    axiosApi.get(`/chat/${chatId}/messages`).then((res) => res.data),

  // POST /chat/{chat_id}/end - End chat and generate summary
  endChat: (chatId: string): Promise<{ message: string; summary: string }> =>
    axiosApi.post(`/chat/${chatId}/end`).then((res) => res.data),
};

// Admin/Analytics API
export const analyticsApi = {
  // GET /analytics/dashboard - Get dashboard analytics
  getDashboardStats: () =>
    axiosApi.get("/analytics/dashboard").then((res) => res.data),

  // GET /analytics/recruitment - Get recruitment analytics
  getRecruitmentStats: () =>
    axiosApi.get("/analytics/recruitment").then((res) => res.data),

  // GET /analytics/performance - Get performance analytics
  getPerformanceStats: () =>
    axiosApi.get("/analytics/performance").then((res) => res.data),

  // GET /analytics/development - Get development analytics
  getDevelopmentStats: () =>
    axiosApi.get("/analytics/development").then((res) => res.data),
};

// Documents API
export const documentsApi = {
  // GET /documents - Get all documents
  getDocuments: () => axiosApi.get("/documents").then((res) => res.data),

  // POST /documents/upload - Upload document
  uploadDocument: (file: File, metadata?: any) => {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) {
      formData.append("metadata", JSON.stringify(metadata));
    }
    return axiosApi
      .post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  // GET /documents/{document_id} - Get specific document
  getDocument: (id: string) =>
    axiosApi.get(`/documents/${id}`).then((res) => res.data),

  // DELETE /documents/{document_id} - Delete document
  deleteDocument: (id: string) =>
    axiosApi.delete(`/documents/${id}`).then((res) => res.data),

  // Employee-specific document management
  // GET /employees/{employee_id}/documents - Get employee documents
  getEmployeeDocuments: (employeeId: string) =>
    axiosApi.get(`/employees/${employeeId}/documents`).then((res) => res.data),

  // POST /employees/{employee_id}/documents - Upload document for employee
  uploadEmployeeDocument: (
    employeeId: string,
    file: File,
    documentType?: string,
    description?: string
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    if (documentType) {
      formData.append("document_type", documentType);
    }
    if (description) {
      formData.append("description", description);
    }
    return axiosApi
      .post(`/employees/${employeeId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  // GET /employees/{employee_id}/documents/{document_id}/download - Download employee document
  downloadEmployeeDocument: (employeeId: string, documentId: string) =>
    `/api/employees/${employeeId}/documents/${documentId}/download`,

  // DELETE /employees/{employee_id}/documents/{document_id} - Delete employee document
  deleteEmployeeDocument: (employeeId: string, documentId: string) =>
    axiosApi
      .delete(`/employees/${employeeId}/documents/${documentId}`)
      .then((res) => res.data),
};

// Settings API
export const settingsApi = {
  // GET /settings - Get user settings
  getSettings: () => axiosApi.get("/settings").then((res) => res.data),

  // PUT /settings - Update user settings
  updateSettings: (data: any) =>
    axiosApi.put("/settings", data).then((res) => res.data),

  // GET /settings/company - Get company settings (admin only)
  getCompanySettings: () =>
    axiosApi.get("/settings/company").then((res) => res.data),

  // PUT /settings/company - Update company settings (admin only)
  updateCompanySettings: (data: any) =>
    axiosApi.put("/settings/company", data).then((res) => res.data),
};

export const apiUtils = {
  // Handle file downloads
  downloadFile: async (url: string, filename: string) => {
    const response = await axiosApi.get(url, { responseType: "blob" });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Handle paginated requests
  getPaginated: async <T>(
    endpoint: string,
    page: number = 1,
    limit: number = 10,
    filters?: Record<string, any>
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await axiosApi.get(`${endpoint}?${params}`);
    return response.data;
  },

  // Batch API calls with proper error handling
  batchRequests: async <T>(
    requests: (() => Promise<T>)[]
  ): Promise<(T | Error)[]> => {
    return Promise.allSettled(requests.map((request) => request())).then(
      (results) =>
        results.map((result) =>
          result.status === "fulfilled" ? result.value : result.reason
        )
    );
  },
};

const mapTeamMemberInsights = (member: TeamMemberWithInsights & { aiInsights?: TeamMemberInsights }) => ({
  ...member,
  insights: member.insights ?? member.aiInsights,
});

// Team Management API
export const teamApi = {
  // Get all team members
  getTeamMembers: (): Promise<TeamMemberWithInsights[]> =>
    axiosApi
      .get("/team/members", { params: { include_ai_insights: true } })
      .then((res) => res.data.map(mapTeamMemberInsights)),

  // Get team statistics and overview
  getTeamStats: (): Promise<TeamStats> =>
    axiosApi.get("/team/stats").then((res) => res.data),

  // Get specific team member by ID
  getTeamMember: (memberId: string): Promise<TeamMemberWithInsights> =>
    axiosApi.get(`/team/members/${memberId}`).then((res) => res.data),

  // Update team member information
  updateTeamMember: (
    memberId: string,
    updates: Partial<TeamMember>
  ): Promise<TeamMember> =>
    axiosApi
      .patch(`/team/members/${memberId}`, updates)
      .then((res) => res.data),

  // Get team members by department
  getTeamMembersByDepartment: (
    department: string
  ): Promise<TeamMemberWithInsights[]> =>
    axiosApi
      .get(`/team/members`, {
        params: {
          department,
          include_ai_insights: true,
        },
      })
      .then((res) => res.data.map(mapTeamMemberInsights)),
};

// Export all APIs as a single object for easier imports
export const api = {
  auth: authApi,
  jobs: jobsApi,
  employees: employeesApi,
  candidates: candidatesApi,
  chat: chatApi,
  performance: performanceApi,
  analytics: analyticsApi,
  documents: documentsApi,
  settings: settingsApi,
  team: teamApi,
  utils: apiUtils,
};
