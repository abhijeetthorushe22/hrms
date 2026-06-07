import { create } from "zustand";
import {
  jobsApi,
  candidatesApi,
  JobPosting,
  JobPostingCreate,
  Candidate,
} from "@/lib/api";

interface JobState {
  jobs: JobPosting[];
  candidates: { [jobId: string]: Candidate[] };
  loading: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
  createJob: (job: JobPostingCreate) => Promise<void>;
  uploadResume: (jobId: string, file: File) => Promise<void>;
  fetchJobCandidates: (jobId: string) => Promise<void>;
  clearError: () => void;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  candidates: {},
  loading: false,
  error: null,

  fetchJobs: async () => {
    set({ loading: true, error: null });
    try {
      const jobs = await jobsApi.getJobs();
      set({ jobs, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch jobs",
        loading: false,
      });
    }
  },

  createJob: async (job: JobPostingCreate) => {
    set({ loading: true, error: null });
    try {
      const newJob = await jobsApi.createJob(job);
      set((state) => ({
        jobs: [...state.jobs, newJob],
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to create job",
        loading: false,
      });
      throw error;
    }
  },

  uploadResume: async (jobId: string, file: File) => {
    set({ loading: true, error: null });
    try {
      await jobsApi.uploadResume(jobId, file);
      // Refresh candidates for this job after successful upload
      await get().fetchJobCandidates(jobId);
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to upload resume",
        loading: false,
      });
      throw error;
    }
  },

  fetchJobCandidates: async (jobId: string) => {
    set({ loading: true, error: null });
    try {
      const rawCandidates = await jobsApi.getJobCandidates(jobId);

      // Normalize backend response (snake_case) to camelCase used by frontend
      const candidates = rawCandidates.map((c: any) => ({
        _id: c._id || c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        jobPostingId: c.job_posting_id ?? c.jobPostingId ?? c.jobId,
        resumeS3Key: c.resume_s3_key ?? c.resumeS3Key ?? c.resumeKey,
        extractedText: c.extracted_text ?? c.extractedText,
        chromaVectorId: c.chroma_vector_id ?? c.chromaVectorId,
        matchScore:
          c.match_score !== undefined
            ? c.match_score
            : c.matchScore !== undefined
              ? c.matchScore
              : undefined,
        status: c.status,
        interviewSummary: c.interview_summary ?? c.interviewSummary,
        appliedAt: c.applied_at ?? c.appliedAt,
        skills: c.skills ?? c.extracted_skills ?? [],
      }));

      const normalizeScore = (v: any): number | undefined => {
        if (v === undefined || v === null) return undefined;
        const n = Number(v);
        if (Number.isNaN(n)) return undefined;
        return n > 1
          ? Math.max(0, Math.min(1, n / 100))
          : Math.max(0, Math.min(1, n));
      };

      // Fetch AI scores for all candidates (like recruiter profile does)
      const candidatesWithAiScores = await Promise.all(
        candidates.map(async (candidate) => {
          try {
            // Call the ai-score endpoint that the recruiter profile uses
            const aiScore = await candidatesApi.getAIScore(candidate._id);

            // Prefer the backend's resume-based score when available (resumeScore),
            // fall back to overallScore, then any existing candidate.matchScore.
            const preferredRaw =
              aiScore?.resumeScore ??
              aiScore?.overallScore ??
              candidate.matchScore;
            return {
              ...candidate,
              // expose the raw resumeScore (0-100 or 0-1 depending on backend)
              resumeScore: aiScore?.resumeScore ?? undefined,
              matchScore: normalizeScore(preferredRaw),
              aiInsights: aiScore.aiInsights || [],
              strengths: aiScore.strengths || [],
              weaknesses: aiScore.weaknesses || [],
            };
          } catch (error) {
            console.warn(
              `Failed to fetch AI score for candidate ${candidate._id}:`,
              error
            );

            return {
              ...candidate,
              matchScore: normalizeScore(candidate.matchScore),
            };
          }
        })
      );

      // Sort candidates by AI score in descending order (highest first)
      const sortedCandidates = candidatesWithAiScores.sort((a, b) => {
        // Use resumeScore if available, fallback to matchScore
        const scoreA = (a as any).resumeScore || a.matchScore || 0;
        const scoreB = (b as any).resumeScore || b.matchScore || 0;

        // Convert to percentage if needed (normalize to 0-100 scale for comparison)
        const normalizedScoreA = scoreA > 1 ? scoreA : scoreA * 100;
        const normalizedScoreB = scoreB > 1 ? scoreB : scoreB * 100;

        return normalizedScoreB - normalizedScoreA;
      });

      set((state) => ({
        candidates: {
          ...state.candidates,
          [jobId]: sortedCandidates,
        },
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch candidates",
        loading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
