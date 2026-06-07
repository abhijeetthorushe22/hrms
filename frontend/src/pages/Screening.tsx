import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCandidateStore } from "@/store/useCandidateStore";
import { useJobStore } from "@/store/useJobStore";
import { api } from "@/lib/api";
import { api as axiosApi } from "@/lib/axios";
import { AIScreeningChat } from "@/components/screening/AIScreeningChat";
import {
  Eye,
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Loader2,
  Brain,
  Search,
  XCircle,
  MessageSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScreeningResult {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  resumeScore: number;
  skillsMatch: number;
  experienceMatch: number;
  overallScore: number;
  status: "pending" | "passed" | "rejected" | "reviewing";
  aiInsights: string[];
  screeningDate: string;
  strengths: string[];
  weaknesses: string[];
}

interface ScreeningMetrics {
  totalScreened: number;
  passed: number;
  failed: number;
  pending: number;
  averageScore: number;
}

const getStatusColor = (status: ScreeningResult["status"]) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    passed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    reviewing: "bg-blue-100 text-blue-800",
  } as Record<string, string>;
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

export default function Screening() {
  const navigate = useNavigate();
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>(
    []
  );
  const [filteredResults, setFilteredResults] = useState<ScreeningResult[]>([]);
  const [metrics, setMetrics] = useState<ScreeningMetrics>({
    totalScreened: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    id: string;
    name: string;
    jobTitle: string;
  } | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const { candidates, fetchCandidates } = useCandidateStore();
  const { jobs, fetchJobs } = useJobStore();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch jobs first to populate the dropdown
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    // Then fetch candidates based on the selected job
    loadScreeningData(selectedJob);
  }, [selectedJob]);

  const loadScreeningData = async (jobId: string) => {
    try {
      setLoading(true);
      // Pass jobId to fetchCandidates. If 'all', it will be undefined.
      await fetchCandidates(jobId === "all" ? undefined : jobId);

      // Jobs are already fetched, so we can proceed
    } catch (error) {
      console.error("Error loading screening data:", error);
      toast({
        title: "Error",
        description: "Failed to load screening data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This effect now only reacts to changes in the fetched candidates
    // to generate the screening results.
    const processCandidates = async () => {
      if (candidates.length > 0 || selectedJob !== "all") {
        setLoading(true);
        const results = await generateRealScreeningResults(candidates);
        setScreeningResults(results);
        setFilteredResults(results); // The filtering is now done at the fetch level
        const calculatedMetrics = calculateMetrics(results);
        setMetrics(calculatedMetrics);
        setLoading(false);
      } else if (selectedJob === "all") {
        // Handle the case where all candidates are fetched initially
        setLoading(true);
        const results = await generateRealScreeningResults(candidates);
        setScreeningResults(results);
        setFilteredResults(results);
        const calculatedMetrics = calculateMetrics(results);
        setMetrics(calculatedMetrics);
        setLoading(false);
      }
    };

    processCandidates();
  }, [candidates, jobs]);

  const generateRealScreeningResults = async (
    currentCandidates: typeof candidates
  ): Promise<ScreeningResult[]> => {
    const results: ScreeningResult[] = [];

    // Filter out rejected candidates from screening
    const activeCandidates = currentCandidates.filter(
      (candidate) => candidate.status !== "rejected"
    );

    for (const candidate of activeCandidates) {
      const job = jobs.find((j) => j._id === candidate.jobPostingId);
      let screeningResult: ScreeningResult;

      try {
        const aiScoring = await api.candidates.getAIScore(candidate._id);

        let status: "pending" | "passed" | "rejected" | "reviewing";

        // Prefer the resumeScore returned from the backend as the canonical
        // score for UI/status decisions. Fall back to overallScore if resumeScore
        // is not available.
        const selectedScore =
          (aiScoring &&
            (typeof aiScoring.resumeScore === "number"
              ? aiScoring.resumeScore
              : aiScoring.overallScore)) ||
          0;

        if (
          candidate.status === "interviewing" ||
          candidate.status === "hired"
        ) {
          status = "passed";
        } else if (candidate.status === "screening") {
          if (selectedScore >= 85) status = "passed";
          else if (selectedScore >= 70) status = "reviewing";
          else status = "pending";
        } else {
          if (selectedScore >= 85) status = "passed";
          else if (selectedScore >= 70) status = "reviewing";
          else if (selectedScore >= 60) status = "pending";
          else status = "rejected";
        }

        screeningResult = {
          id: candidate._id,
          candidateId: candidate._id,
          candidateName: candidate.name,
          jobTitle: job?.title || "Unknown Position",
          resumeScore: aiScoring?.resumeScore ?? selectedScore ?? 0,
          skillsMatch: aiScoring.skillsMatch || 0,
          experienceMatch: aiScoring.experienceMatch || 0,
          overallScore: selectedScore,
          status,
          aiInsights: aiScoring.aiInsights || [],
          screeningDate: new Date(candidate.appliedAt)
            .toISOString()
            .split("T")[0],
          strengths: aiScoring.strengths || [],
          weaknesses: aiScoring.weaknesses || [],
        };
      } catch (error) {
        console.warn(
          `AI scoring failed for candidate ${candidate._id}, using local scoring:`,
          error
        );
        const localScore = generateLocalAIScore(candidate, job);

        let status: "pending" | "passed" | "rejected" | "reviewing";

        const selectedLocal =
          typeof localScore.resumeScore === "number"
            ? localScore.resumeScore
            : localScore.overallScore;

        if (
          candidate.status === "interviewing" ||
          candidate.status === "hired"
        ) {
          status = "passed";
        } else if (candidate.status === "screening") {
          if (selectedLocal >= 85) status = "passed";
          else if (selectedLocal >= 70) status = "reviewing";
          else status = "pending";
        }
        // For new candidates, determine by local resume score
        else {
          if (selectedLocal >= 85) status = "passed";
          else if (selectedLocal >= 70) status = "reviewing";
          else if (selectedLocal >= 60) status = "pending";
          else status = "rejected";
        }

        screeningResult = {
          id: candidate._id,
          candidateId: candidate._id,
          candidateName: candidate.name,
          jobTitle: job?.title || "Unknown Position",
          resumeScore: localScore.resumeScore,
          skillsMatch: localScore.skillsMatch,
          experienceMatch: localScore.experienceMatch,
          // Align overallScore to the resumeScore to keep UI consistent
          overallScore: localScore.resumeScore,
          status,
          aiInsights: localScore.aiInsights,
          screeningDate: new Date(candidate.appliedAt)
            .toISOString()
            .split("T")[0],
          strengths: localScore.strengths,
          weaknesses: localScore.weaknesses,
        };
      }

      results.push(screeningResult);
    }

    return results;
  };

  const generateLocalAIScore = (candidate: any, job: any) => {
    let resumeScore = 60;
    let skillsMatch = 50;
    let experienceMatch = 50;

    if (candidate.extractedText) {
      const text = candidate.extractedText.toLowerCase();

      // Check for experience keywords
      if (text.includes("experience") || text.includes("years"))
        experienceMatch += 20;
      if (text.includes("senior") || text.includes("lead"))
        experienceMatch += 15;
      if (text.includes("project") || text.includes("team"))
        experienceMatch += 10;

      // Check for technical skills
      const techKeywords = [
        "javascript",
        "python",
        "react",
        "node",
        "sql",
        "api",
        "database",
      ];
      const foundTechSkills = techKeywords.filter((skill) =>
        text.includes(skill)
      );
      skillsMatch += foundTechSkills.length * 8;

      // Check for soft skills
      const softKeywords = [
        "communication",
        "leadership",
        "teamwork",
        "problem solving",
      ];
      const foundSoftSkills = softKeywords.filter((skill) =>
        text.includes(skill)
      );
      skillsMatch += foundSoftSkills.length * 5;

      // Resume completeness score
      if (text.length > 1000) resumeScore += 20;
      if (text.includes("education") || text.includes("degree"))
        resumeScore += 15;
      if (text.includes("certification")) resumeScore += 10;
    }

    // Cap scores at reasonable levels
    resumeScore = Math.min(resumeScore, 95);
    skillsMatch = Math.min(skillsMatch, 95);
    experienceMatch = Math.min(experienceMatch, 95);

    const overallScore = Math.round(
      (resumeScore + skillsMatch + experienceMatch) / 3
    );

    const strengths = [];
    const weaknesses = [];
    const aiInsights = [];

    if (overallScore >= 80) {
      strengths.push("Strong overall profile");
      aiInsights.push("Candidate shows excellent potential for this role");
    } else if (overallScore >= 60) {
      strengths.push("Decent qualifications");
      aiInsights.push(
        "Candidate meets basic requirements with room for growth"
      );
    } else {
      weaknesses.push("May need additional evaluation");
      aiInsights.push("Consider additional screening or training requirements");
    }

    if (skillsMatch >= 70) {
      strengths.push("Good technical skill match");
    } else {
      weaknesses.push("Skills may need development");
    }

    return {
      resumeScore,
      skillsMatch,
      experienceMatch,
      overallScore,
      strengths,
      weaknesses,
      aiInsights,
    };
  };

  const generateAIInsights = (candidate: any, score: number): string[] => {
    const insights = [];

    if (score >= 85) {
      insights.push(
        "Strong technical background and excellent fit for the role"
      );
      insights.push(
        "Demonstrates leadership potential and problem-solving skills"
      );
      insights.push("Good cultural alignment based on experience and values");
    } else if (score >= 70) {
      insights.push("Solid foundation with some areas for development");
      insights.push("Shows potential but may need additional training");
      insights.push("Good communication skills evident from application");
    } else {
      insights.push(
        "Basic qualifications but significant skill gaps identified"
      );
      insights.push("Would benefit from additional experience and training");
      insights.push("Consider for junior positions or with mentoring support");
    }

    return insights;
  };

  const generateWeaknesses = (skills: string[] = []): string[] => {
    const commonWeaknesses = [
      "Limited cloud platform experience",
      "Needs improvement in project management",
      "Could benefit from more industry certifications",
      "Limited experience with modern frameworks",
      "Needs development in soft skills",
    ];

    return commonWeaknesses.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const calculateMetrics = (results: ScreeningResult[]): ScreeningMetrics => {
    const total = results.length;
    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    const pending = results.filter((r) => r.status === "pending").length;
    const avgScore =
      total > 0
        ? Math.floor(
            results.reduce((sum, r) => sum + r.overallScore, 0) / total
          )
        : 0;

    return {
      totalScreened: total,
      passed,
      failed,
      pending,
      averageScore: avgScore,
    };
  };

  const handleViewDetails = async (result: ScreeningResult) => {
    try {
      // Navigate to candidate details page
      navigate(`/candidates/${result.candidateId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to navigate to candidate details.",
        variant: "destructive",
      });
    }
  };

  const handleStartScreening = async (result: ScreeningResult) => {
    const job = jobs.find(
      (j) =>
        j._id ===
        candidates.find((c) => c._id === result.candidateId)?.jobPostingId
    );

    setSelectedCandidate({
      id: result.candidateId,
      name: result.candidateName,
      jobTitle: job?.title || result.jobTitle,
    });
    setIsChatOpen(true);
  };

  const handleStatusChange = async (
    candidateId: string,
    newStatus: "passed" | "rejected" | "reviewing" | "pending"
  ) => {
    try {
      setLoading(true);

      // Map screening statuses to valid candidate statuses
      const statusMapping = {
        passed: "interviewing", // Passed screening -> move to interviewing
        rejected: "rejected", // Rejected -> rejected
        reviewing: "screening", // Under review -> still screening
        pending: "screening", // Pending -> still screening
      };

      const candidateStatus = statusMapping[newStatus];

      // Update candidate status via API
      await api.candidates.updateStatus(candidateId, candidateStatus);

      // Update the screening results to reflect the change
      setScreeningResults((prevResults) =>
        prevResults.map((result) =>
          result.candidateId === candidateId
            ? ({ ...result, status: newStatus } as ScreeningResult)
            : result
        )
      );

      // If candidate was rejected, remove them from screening results
      if (newStatus === "rejected") {
        setScreeningResults((prevResults) =>
          prevResults.filter((result) => result.candidateId !== candidateId)
        );
        setFilteredResults((prevResults) =>
          prevResults.filter((result) => result.candidateId !== candidateId)
        );
      }

      // Also refresh the candidates list in the store
      const { useCandidateStore } = await import("@/store/useCandidateStore");
      const { fetchCandidates } = useCandidateStore.getState();
      fetchCandidates();

      toast({
        title: "Status Updated",
        description: `Candidate status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating candidate status:", error);
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkScreening = async () => {
    try {
      setLoading(true);
      toast({
        title: "Bulk AI Screening",
        description: "Starting AI screening for all pending candidates...",
      });

      // Filter out rejected candidates and get only new candidates
      const pendingCandidates = candidates.filter((c) => c.status === "new");

      if (pendingCandidates.length === 0) {
        toast({
          title: "No Candidates",
          description: "No new candidates available for screening.",
          variant: "default",
        });
        return;
      }

      let successCount = 0;
      const maxCandidates = Math.min(pendingCandidates.length, 5);

      for (const candidate of pendingCandidates.slice(0, maxCandidates)) {
        try {
          await api.candidates.startScreening(candidate._id);
          successCount++;
        } catch (error) {
          console.error(`Failed to screen candidate ${candidate._id}:`, error);
        }
      }

      await loadScreeningData(selectedJob);

      toast({
        title: "Bulk Screening Complete",
        description: `AI screening initiated for ${successCount} out of ${maxCandidates} candidates.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start bulk screening.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = async (candidateId: string) => {
    try {
      // Try to open the original uploaded file by resumeS3Key first
      const candidate = candidates.find((c) => c._id === candidateId);
      const token = localStorage.getItem("token");

      if (candidate?.resumeS3Key) {
        try {
          // Try static uploads mount first (no auth required, served by backend StaticFiles)
          const uploadsUrl = `/uploads/${candidate.resumeS3Key}`;
          const uploadsResp = await fetch(uploadsUrl, { method: "HEAD" });
          if (uploadsResp.ok) {
            window.open(uploadsUrl, "_blank");
            toast({
              title: "Resume Opened",
              description: "Original resume file opened in new window",
            });
            return;
          }

          // Then try legacy /api/files/download path
          const downloadResp = await fetch(
            `/api/files/download/${candidate.resumeS3Key}`,
            {
              headers: {
                Authorization: token ? `Bearer ${token}` : undefined,
              },
            }
          );

          if (downloadResp.ok) {
            const blob = await downloadResp.blob();
            const blobUrl = URL.createObjectURL(blob);
            const newWindow = window.open(blobUrl, "_blank");
            setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
            toast({
              title: "Resume Opened",
              description: "Original resume file opened in new window",
            });
            return;
          }
        } catch (e) {
          console.warn("Failed to open resume by key, falling back", e);
        }
      }

      // Next, try candidate resume-file endpoint
      try {
        const loadingToast = toast({
          title: "Loading Resume...",
          description: "Fetching the resume file",
        });
        const response = await axiosApi.get(
          `/candidates/${candidateId}/resume-file`,
          { responseType: "blob" }
        );
        const blob = new Blob([response.data], {
          type: response.headers["content-type"] || "application/pdf",
        });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
        loadingToast.dismiss();
        toast({
          title: "Resume Opened",
          description: "Original resume file opened in new window",
        });
        return;
      } catch (e) {
        console.warn("candidate resume-file endpoint failed, falling back", e);
      }

      // Finally, show extracted text as fallback
      const resumeData = await api.candidates.getResumeText(candidateId);
      const resumeWindow = window.open(
        "",
        "_blank",
        "width=800,height=600,scrollbars=yes"
      );
      if (resumeWindow) {
        resumeWindow.document.write(`
          <html>
            <head>
              <title>Resume - Candidate ${candidateId}</title>
              <style>body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; } .content { white-space: pre-wrap; }</style>
            </head>
            <body>
              <h1>Candidate Resume</h1>
              <div class="content">${resumeData.resume_text}</div>
            </body>
          </html>
        `);
        resumeWindow.document.close();
      }
    } catch (error) {
      console.error("Error opening resume:", error);
      toast({
        title: "Error",
        description: "Failed to open resume file. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading screening data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Screening</h1>
            <p className="text-muted-foreground">
              Intelligent candidate screening powered by AI
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select onValueChange={setSelectedJob} defaultValue="all">
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Filter by job..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job._id} value={job._id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleBulkScreening} disabled={loading}>
              <Brain className="mr-2 h-4 w-4" />
              Bulk AI Screening
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Screened
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalScreened}</div>
              <p className="text-xs text-muted-foreground">
                Candidates processed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.passed}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for interview
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Under Review
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.pending}
              </div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageScore}%</div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {filteredResults.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {result.candidateName}
                    </CardTitle>
                    <CardDescription>{result.jobTitle}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        result.overallScore
                      )}`}
                    >
                      {result.overallScore}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Resume Score
                    </div>
                    <Progress value={result.resumeScore} className="mt-1" />
                    <div className="mt-1 text-sm font-medium">
                      {result.resumeScore}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Skills Match
                    </div>
                    <Progress value={result.skillsMatch} className="mt-1" />
                    <div className="mt-1 text-sm font-medium">
                      {result.skillsMatch}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Experience
                    </div>
                    <Progress value={result.experienceMatch} className="mt-1" />
                    <div className="mt-1 text-sm font-medium">
                      {result.experienceMatch}%
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center text-sm font-medium">
                    <Brain className="mr-2 h-4 w-4" />
                    AI Insights
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {result.aiInsights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(result)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewResume(result.candidateId)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Resume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartScreening(result)}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Start Chat
                  </Button>

                  {/* Status Action Buttons */}
                  {result.status !== "passed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() =>
                        handleStatusChange(result.candidateId, "passed")
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}

                  {result.status !== "rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() =>
                        handleStatusChange(result.candidateId, "rejected")
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  )}

                  {result.status !== "reviewing" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() =>
                        handleStatusChange(result.candidateId, "reviewing")
                      }
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResults.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Brain className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                No Screening Results
              </h3>
              <p className="mb-4 text-center text-muted-foreground">
                No candidates have been screened yet. Upload resumes and start
                the AI screening process.
              </p>
              <Button onClick={handleBulkScreening}>
                <Brain className="mr-2 h-4 w-4" />
                Start AI Screening
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Screening Chat Dialog */}
      {selectedCandidate && (
        <AIScreeningChat
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedCandidate(null);
            loadScreeningData(selectedJob); // Refresh data after chat
          }}
          candidateId={selectedCandidate.id}
          candidateName={selectedCandidate.name}
          jobTitle={selectedCandidate.jobTitle}
        />
      )}
    </MainLayout>
  );
}
