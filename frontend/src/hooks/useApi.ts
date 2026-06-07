import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  JobPosting,
  Candidate,
  Employee,
  PerformanceReview,
} from "@/lib/api";

// Custom hook for managing jobs with full CRUD operations
export const useJobs = () => {
  const queryClient = useQueryClient();

  const {
    data: jobs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: api.jobs.getJobs,
  });

  const createJobMutation = useMutation({
    mutationFn: api.jobs.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const uploadResumeMutation = useMutation({
    mutationFn: ({ jobId, file }: { jobId: string; file: File }) =>
      api.jobs.uploadResume(jobId, file),
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["job-candidates", jobId] });
    },
  });

  return {
    jobs,
    isLoading,
    error,
    refetch,
    createJob: createJobMutation.mutateAsync,
    uploadResume: uploadResumeMutation.mutateAsync,
    isCreating: createJobMutation.isPending,
    isUploading: uploadResumeMutation.isPending,
  };
};

// Custom hook for managing candidates with AI-powered screening
export const useCandidates = (jobId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: candidates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: jobId ? ["job-candidates", jobId] : ["candidates"],
    queryFn: () =>
      jobId ? api.jobs.getJobCandidates(jobId) : api.candidates.getCandidates(),
  });

  const startChatMutation = useMutation({
    mutationFn: api.candidates.startChat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });

  return {
    candidates,
    isLoading,
    error,
    startChat: startChatMutation.mutateAsync,
    isStartingChat: startChatMutation.isPending,
  };
};

// Custom hook for managing employee development plans
export const useEmployeeDevelopment = (employeeId?: string) => {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: api.employees.getEmployees,
  });

  const {
    data: developmentPlan,
    isLoading: isLoadingPlan,
    error: planError,
  } = useQuery({
    queryKey: ["development-plan", employeeId],
    queryFn: () =>
      employeeId ? api.employees.getDevelopmentPlan(employeeId) : null,
    enabled: !!employeeId,
  });

  const generatePlanMutation = useMutation({
    mutationFn: api.employees.generateDevelopmentPlan,
    onSuccess: (_, employeeId) => {
      queryClient.invalidateQueries({
        queryKey: ["development-plan", employeeId],
      });
    },
  });

  return {
    employees,
    developmentPlan,
    isLoading: isLoadingEmployees || isLoadingPlan,
    planError,
    generatePlan: generatePlanMutation.mutateAsync,
    isGenerating: generatePlanMutation.isPending,
  };
};

// Custom hook for managing performance reviews
export const usePerformanceReviews = (employeeId?: string) => {
  const queryClient = useQueryClient();

  const {
    data: reviews = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: employeeId
      ? ["employee-reviews", employeeId]
      : ["performance-reviews"],
    queryFn: () =>
      employeeId
        ? api.performance.getEmployeeReviews(employeeId)
        : api.performance.getReviews(),
  });

  const createReviewMutation = useMutation({
    mutationFn: api.performance.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
      if (employeeId) {
        queryClient.invalidateQueries({
          queryKey: ["employee-reviews", employeeId],
        });
      }
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.performance.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: api.performance.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews"] });
    },
  });

  return {
    reviews,
    isLoading,
    error,
    createReview: createReviewMutation.mutateAsync,
    updateReview: updateReviewMutation.mutateAsync,
    deleteReview: deleteReviewMutation.mutateAsync,
    isCreating: createReviewMutation.isPending,
    isUpdating: updateReviewMutation.isPending,
    isDeleting: deleteReviewMutation.isPending,
  };
};

// Custom hook for chat functionality with real-time updates
export const useChat = (chatId?: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const { data: chatMessages, isLoading } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: () => (chatId ? api.chat.getChatMessages(chatId) : null),
    enabled: !!chatId,
    refetchInterval: 2000, // Poll for new messages every 2 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, message }: { chatId: string; message: string }) =>
      api.chat.sendMessage(chatId, { message }),
    onSuccess: () => {
      // Refetch messages after sending
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
      }
    },
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  return {
    messages,
    isLoading,
    isConnected,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
};

// Custom hook for analytics dashboard
export const useAnalytics = () => {
  const { data: dashboardStats, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: api.analytics.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recruitmentStats, isLoading: isLoadingRecruitment } = useQuery({
    queryKey: ["recruitment-analytics"],
    queryFn: api.analytics.getRecruitmentStats,
  });

  const { data: performanceStats, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ["performance-analytics"],
    queryFn: api.analytics.getPerformanceStats,
  });

  const { data: developmentStats, isLoading: isLoadingDevelopment } = useQuery({
    queryKey: ["development-analytics"],
    queryFn: api.analytics.getDevelopmentStats,
  });

  return {
    dashboardStats,
    recruitmentStats,
    performanceStats,
    developmentStats,
    isLoading:
      isLoadingDashboard ||
      isLoadingRecruitment ||
      isLoadingPerformance ||
      isLoadingDevelopment,
  };
};

// Custom hook for document management
export const useDocuments = () => {
  const queryClient = useQueryClient();

  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["documents"],
    queryFn: api.documents.getDocuments,
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata?: any }) =>
      api.documents.uploadDocument(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: api.documents.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });

  return {
    documents,
    isLoading,
    error,
    uploadDocument: uploadDocumentMutation.mutateAsync,
    deleteDocument: deleteDocumentMutation.mutateAsync,
    isUploading: uploadDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
};

// Utility hook for batch operations
export const useBatchOperations = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const executeBatch = useCallback(
    async (operations: (() => Promise<any>)[]) => {
      setIsExecuting(true);
      try {
        const batchResults = await api.utils.batchRequests(operations);
        setResults(batchResults);
        return batchResults;
      } catch (error) {
        console.error("Batch operation failed:", error);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    []
  );

  return {
    executeBatch,
    isExecuting,
    results,
  };
};
