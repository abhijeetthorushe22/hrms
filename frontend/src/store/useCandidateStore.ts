import { create } from "zustand";
import { candidatesApi, Candidate, ChatStart } from "@/lib/api";

interface CandidateState {
  candidates: Candidate[];
  activeChats: { [candidateId: string]: string }; // candidateId -> chatId mapping
  loading: boolean;
  error: string | null;
  fetchCandidates: (jobId?: string) => Promise<void>;
  getCandidate: (id: string) => Promise<Candidate>;
  startChat: (candidateId: string) => Promise<ChatStart>;
  clearError: () => void;
}

export const useCandidateStore = create<CandidateState>((set, get) => ({
  candidates: [],
  activeChats: {},
  loading: false,
  error: null,

  fetchCandidates: async (jobId?: string) => {
    set({ loading: true, error: null });
    try {
      const rawCandidates = await candidatesApi.getCandidates(jobId);

      const normalizeScore = (v: any): number | undefined => {
        if (v === undefined || v === null) return undefined;
        const n = Number(v);
        if (Number.isNaN(n)) return undefined;
        return n > 1
          ? Math.max(0, Math.min(1, n / 100))
          : Math.max(0, Math.min(1, n));
      };

      // Fetch AI scores for all candidates to prefer resumeScore and set normalized matchScore
      const candidatesWithAi = await Promise.all(
        rawCandidates.map(async (c: any) => {
          const candidate: any = c;
          try {
            const ai = await candidatesApi.getAIScore(candidate._id);
            const preferredRaw =
              ai?.resumeScore ?? ai?.overallScore ?? candidate.matchScore;
            return {
              ...candidate,
              resumeScore: ai?.resumeScore ?? undefined,
              matchScore: normalizeScore(preferredRaw),
              aiInsights: ai?.aiInsights || [],
              strengths: ai?.strengths || [],
              weaknesses: ai?.weaknesses || [],
            };
          } catch (e) {
            console.warn(
              `Failed to fetch AI score for candidate ${candidate._id}`,
              e
            );
            return {
              ...candidate,
              matchScore: normalizeScore(candidate.matchScore),
            };
          }
        })
      );

      set({ candidates: candidatesWithAi, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch candidates",
        loading: false,
      });
    }
  },

  getCandidate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const candidate = await candidatesApi.getCandidate(id);
      // Try to fetch AI scoring and attach resumeScore/matchScore
      try {
        const ai = await candidatesApi.getAIScore(id);
        const normalize = (v: any) => {
          if (v === undefined || v === null) return undefined;
          const n = Number(v);
          if (Number.isNaN(n)) return undefined;
          return n > 1
            ? Math.max(0, Math.min(1, n / 100))
            : Math.max(0, Math.min(1, n));
        };
        const preferredRaw =
          ai?.resumeScore ?? ai?.overallScore ?? candidate.matchScore;
        const augmented = {
          ...candidate,
          resumeScore: ai?.resumeScore ?? undefined,
          matchScore: normalize(preferredRaw),
          aiInsights: ai?.aiInsights || [],
          strengths: ai?.strengths || [],
          weaknesses: ai?.weaknesses || [],
        };
        set({ loading: false });
        return augmented;
      } catch (e) {
        set({ loading: false });
        return candidate;
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch candidate",
        loading: false,
      });
      throw error;
    }
  },

  startChat: async (candidateId: string) => {
    set({ loading: true, error: null });
    try {
      const chatStart = await candidatesApi.startChat(candidateId);
      set((state) => ({
        activeChats: {
          ...state.activeChats,
          [candidateId]: chatStart.chatId,
        },
        loading: false,
      }));
      return chatStart;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to start chat",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
