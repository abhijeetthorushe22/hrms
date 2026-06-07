import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Edit,
  FileText,
  MessageSquare,
  Star,
  Calendar,
  Briefcase,
  Download,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  jobPostingId: string;
  matchScore?: number;
  resumeScore?: number;
  status: string;
  appliedAt: string;
  extractedText?: string;
  resumeS3Key?: string;
  interviewSummary?: string;
}

interface Job {
  _id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
}

export default function CandidateDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCandidateDetails();
    }
  }, [id]);

  const fetchCandidateDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Import API from the lib
      const { api } = await import("@/lib/api");

      // Fetch candidate details
      const candidateData = await api.candidates.getCandidate(id);
      setCandidate(candidateData);

      // Fetch job details if candidate has a job posting
      if (candidateData.jobPostingId) {
        try {
          const jobData = await api.jobs.getJob(candidateData.jobPostingId);
          setJob(jobData);
        } catch (jobError) {
          console.error("Error fetching job details:", jobError);
          // Continue without job data
        }
      }
    } catch (error) {
      console.error("Error fetching candidate details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "screening":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "interview":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "hired":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 0.4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      // Import API from the lib
      const { api } = await import("@/lib/api");
      await api.candidates.updateStatus(id!, newStatus);

      // Refresh candidate details
      fetchCandidateDetails();

      // Also refresh the candidates list in the store
      const { useCandidateStore } = await import("@/store/useCandidateStore");
      const { fetchCandidates } = useCandidateStore.getState();
      fetchCandidates();

      // Show success notification
      toast({
        title: "Status Updated",
        description:
          newStatus === "rejected"
            ? `Candidate has been rejected and moved to the rejected candidates list`
            : `Candidate status successfully updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating candidate status:", error);

      // Show error notification
      toast({
        title: "Error",
        description: "Failed to update candidate status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartScreening = async () => {
    if (!id) return;

    try {
      // Import API from the lib
      const { api } = await import("@/lib/api");

      // Start chat with candidate
      const chatData = await api.candidates.startChat(id);

      // Navigate to chat page using returned chatId
      if (chatData?.chatId) {
        navigate(`/chat/${chatData.chatId}`);
      } else {
        navigate(`/chat/${id}`);
      }
    } catch (error) {
      console.error("Error starting screening:", error);
      // Fallback - just navigate to chat page
      navigate(`/chat/${id}`);
    }
  };

  const handleViewChat = () => {
    if (id) {
      // Attempt to resolve an existing chat session first by calling helper
      (async () => {
        try {
          const { api } = await import("@/lib/api");
          const chatInfo = await api.candidates.getChat(id);
          if (chatInfo?.chatId) {
            navigate(`/chat/${chatInfo.chatId}`);
            return;
          }
        } catch (e) {
          // ignore and fallback
        }

        navigate(`/chat/${id}`);
      })();
    }
  };

  const handleViewResume = () => {
    navigate(`/candidates/${id}/resume`);
  };

  const handleSendEmail = () => {
    if (candidate?.email) {
      window.open(`mailto:${candidate.email}`, "_blank");
    }
  };

  const handleDownloadResume = async () => {
    if (!candidate?.resumeS3Key) return;

    try {
      const uploadsUrl = `/uploads/${candidate.resumeS3Key}`;
      try {
        const head = await fetch(uploadsUrl, { method: "HEAD" });
        if (head.ok) {
          window.open(uploadsUrl, "_blank");
          return;
        }
      } catch (e) {
        // ignore
      }

      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/files/download/${candidate.resumeS3Key}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${candidate.name}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading resume:", error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">
              Loading candidate details...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!candidate) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">Candidate Not Found</h2>
          <p className="mb-4 text-muted-foreground">
            The candidate you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/candidates")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {/* Back to Candidates */}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/candidates")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {/* Back to Candidates */}
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{candidate.name}</h1>
                <p className="mt-1 flex items-center text-muted-foreground">
                  <Mail className="mr-1 h-4 w-4" />
                  {candidate.email}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(candidate.status)}>
              {candidate.status}
            </Badge>
            {(user?.role === "admin" || user?.role === "recruiter") && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleStartScreening}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Screening
                </Button>
                <Button onClick={() => handleStatusChange("interview")}>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Rejected Candidate Notice */}
        {candidate.status === "rejected" && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <p className="font-medium">This candidate has been rejected</p>
              </div>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                This candidate is no longer being considered for the position
                and has been moved to the rejected candidates list.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Candidate Profile */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{candidate.email}</p>
                    </div>
                  </div>

                  {candidate.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{candidate.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Applied</p>
                      <p className="font-medium">
                        {format(new Date(candidate.appliedAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  {candidate.matchScore != null && candidate.matchScore > 0 && (
                    <div className="flex items-center space-x-3">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Match Score
                        </p>
                        <p
                          className={`font-medium ${getMatchScoreColor(
                            candidate.matchScore
                          )}`}
                        >
                          {(() => {
                            const v = Number(candidate.matchScore);
                            if (Number.isNaN(v)) return "N/A";
                            const pct = v <= 1 ? v * 100 : v;
                            return `${pct.toFixed(1)}%`;
                          })()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resume Section */}
            {candidate.resumeS3Key && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Resume</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Resume.pdf</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded{" "}
                          {format(
                            new Date(candidate.appliedAt),
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/candidates/${id}/resume`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Resume
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewChat}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View Chat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadResume}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {candidate.extractedText && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-semibold">Resume Summary</h4>
                      <div className="max-h-32 overflow-y-auto rounded-lg bg-muted/50 p-3">
                        <p className="text-sm text-muted-foreground">
                          {candidate.extractedText.substring(0, 300)}...
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Interview Summary */}
            {candidate.interviewSummary && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Interview Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-sm leading-relaxed">
                      {candidate.interviewSummary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Information */}
            {job && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5" />
                    <span>Applied Position</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.department}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/jobs/${job._id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Job Details
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {(user?.role === "admin" || user?.role === "recruiter") && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={handleStartScreening}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Start AI Screening
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange("interview")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Interview
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSendEmail}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600"
                      onClick={() => handleStatusChange("hired")}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleStatusChange("rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Timeline */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium">
                        Application Submitted
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(candidate.appliedAt),
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </p>
                    </div>
                  </div>

                  {candidate.matchScore != null && candidate.matchScore > 0 && (
                    <div className="flex items-start space-x-3">
                      <div className="mt-2 h-2 w-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm font-medium">Resume Analyzed</p>
                        <p className="text-xs text-muted-foreground">
                          Match score:{" "}
                          {(() => {
                            const v = Number(candidate.matchScore);
                            if (Number.isNaN(v)) return "N/A";
                            const pct = v <= 1 ? v * 100 : v;
                            return pct.toFixed(1);
                          })()}
                          %
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-gray-400"></div>
                    <div>
                      <p className="text-sm font-medium">
                        Status: {candidate.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current status
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
