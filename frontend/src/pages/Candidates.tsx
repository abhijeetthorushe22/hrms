import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCandidateStore } from "@/store/useCandidateStore";
import { useJobStore } from "@/store/useJobStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  FileText,
  Brain,
  MessageSquare,
  Eye,
  MapPin,
  Star,
} from "lucide-react";

interface CandidateLocal {
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

export default function Candidates() {
  const { candidates, fetchCandidates, loading } = useCandidateStore();
  const { jobs, fetchJobs } = useJobStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateLocal | null>(null);
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, [fetchCandidates, fetchJobs]);

  // Filter and sort candidates based on status and AI score
  const filteredCandidates = candidates
    .filter((candidate) => {
      if (showRejected) {
        return candidate.status === "rejected";
      } else {
        return candidate.status !== "rejected";
      }
    })
    .sort((a, b) => {
      // Sort by AI score in descending order (highest first)
      // Use resumeScore if available, fallback to matchScore
      const scoreA = (a as any).resumeScore || a.matchScore || 0;
      const scoreB = (b as any).resumeScore || b.matchScore || 0;

      // Convert to percentage if needed (normalize to 0-100 scale for comparison)
      const normalizedScoreA = scoreA > 1 ? scoreA : scoreA * 100;
      const normalizedScoreB = scoreB > 1 ? scoreB : scoreB * 100;

      return normalizedScoreB - normalizedScoreA;
    });

  const getJobTitle = (jobPostingId: string) => {
    const job = jobs.find((j) => j._id === jobPostingId);
    return job?.title || "Unknown Position";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "screening":
        return "bg-yellow-500";
      case "interviewing":
      case "interview":
        return "bg-purple-500";
      case "offered":
        return "bg-orange-500";
      case "hired":
        return "bg-green-500";
      case "rejected":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleViewProfile = (candidate: CandidateLocal) => {
    setSelectedCandidate(candidate);
    setIsViewDialogOpen(true);
  };

  const handleViewResume = async (candidateId: string) => {
    // Prefer directly opening uploaded resume file if available in store
    const candidate = candidates.find((c) => c._id === candidateId);
    const token = localStorage.getItem("token");
    if (candidate?.resumeS3Key) {
      // Try static uploads path first
      const uploadsUrl = `/uploads/${candidate.resumeS3Key}`;
      try {
        const headResp = await fetch(uploadsUrl, { method: "HEAD" });
        if (headResp.ok) {
          window.open(uploadsUrl, "_blank");
          return;
        }
      } catch (e) {
        // ignore and try legacy download
      }

      // Try legacy download endpoint
      try {
        const downloadResp = await fetch(
          `/api/files/download/${candidate.resumeS3Key}`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : undefined },
          }
        );
        if (!downloadResp.ok) throw new Error("Download failed");
        const blob = await downloadResp.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
        return;
      } catch (e) {
        // Fallback to route-based resume view
        navigate(`/candidates/${candidateId}/resume`);
        return;
      }
    }

    navigate(`/candidates/${candidateId}/resume`);
  };

  const handleStartChat = async (candidateId: string) => {
    try {
      const { api } = await import("@/lib/api");
      const resp = await api.candidates.startChat(candidateId);
      // Navigate to the actual chat session id returned by backend
      navigate(`/chat/${resp.chatId}`);
    } catch (e) {
      console.error(
        "Failed to start chat, falling back to candidate id route:",
        e
      );
      navigate(`/chat/${candidateId}`);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading candidates...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Candidates</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={!showRejected ? "default" : "outline"}
              onClick={() => setShowRejected(false)}
              size="sm"
            >
              Active ({candidates.filter((c) => c.status !== "rejected").length}
              )
            </Button>
            <Button
              variant={showRejected ? "default" : "outline"}
              onClick={() => setShowRejected(true)}
              size="sm"
            >
              Rejected (
              {candidates.filter((c) => c.status === "rejected").length})
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCandidates.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex h-48 items-center justify-center">
                <div className="text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {showRejected
                      ? "No rejected candidates found."
                      : "No active candidates found."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {showRejected
                      ? "Rejected candidates will appear here when applications are declined."
                      : "Candidates will appear here once they apply to job postings."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCandidates.map((candidate) => (
              <Card
                key={candidate._id}
                className="transition-shadow hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {candidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {candidate.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {getJobTitle(candidate.jobPostingId)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`text-white ${getStatusColor(
                        candidate.status
                      )}`}
                      variant="secondary"
                    >
                      {candidate.status.charAt(0).toUpperCase() +
                        candidate.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="mr-2 h-4 w-4" />
                      {candidate.email}
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-2 h-4 w-4" />
                        {candidate.phone}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      Applied{" "}
                      {new Date(candidate.appliedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {candidate.matchScore !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        AI Match Score:
                      </span>
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <Badge variant="outline" className="font-semibold">
                          {(() => {
                            const v = Number(candidate.matchScore);
                            if (Number.isNaN(v)) return "N/A";
                            // If stored as fraction 0-1, convert to percent
                            const pct = v <= 1 ? v * 100 : v;
                            return `${Math.round(pct)}%`;
                          })()}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {candidate.interviewSummary && (
                    <div className="text-sm">
                      <p className="mb-1 font-medium">Interview Summary:</p>
                      <p className="line-clamp-2 text-muted-foreground">
                        {candidate.interviewSummary}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProfile(candidate)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View Profile
                    </Button>
                    {candidate.resumeS3Key && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResume(candidate._id)}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Resume
                      </Button>
                    )}
                    {(user?.role === "admin" || user?.role === "recruiter") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartChat(candidate._id)}
                      >
                        <MessageSquare className="mr-1 h-4 w-4" />
                        Chat
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View Profile Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Candidate Profile</DialogTitle>
              <DialogDescription>
                Detailed information about the candidate.
              </DialogDescription>
            </DialogHeader>
            {selectedCandidate && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {selectedCandidate.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedCandidate.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {getJobTitle(selectedCandidate.jobPostingId)}
                    </p>
                    <Badge
                      className={`mt-2 text-white ${getStatusColor(
                        selectedCandidate.status
                      )}`}
                      variant="secondary"
                    >
                      {selectedCandidate.status.charAt(0).toUpperCase() +
                        selectedCandidate.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedCandidate.email}
                    </p>
                  </div>
                  {selectedCandidate.phone && (
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedCandidate.phone}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Applied Date</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(
                        selectedCandidate.appliedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedCandidate.matchScore !== undefined && (
                    <div>
                      <Label className="text-sm font-medium">
                        AI Match Score
                      </Label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <Badge variant="outline" className="font-semibold">
                          {(() => {
                            const v = Number(selectedCandidate.matchScore);
                            if (Number.isNaN(v)) return "N/A";
                            const pct = v <= 1 ? v * 100 : v;
                            return `${Math.round(pct)}%`;
                          })()}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {selectedCandidate.interviewSummary && (
                    <div>
                      <Label className="text-sm font-medium">
                        Interview Summary
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedCandidate.interviewSummary}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between gap-2">
                  <div className="flex gap-2">
                    {selectedCandidate.resumeS3Key && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResume(selectedCandidate._id)}
                      >
                        <FileText className="mr-1 h-4 w-4" />
                        Resume
                      </Button>
                    )}
                    {(user?.role === "admin" || user?.role === "recruiter") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartChat(selectedCandidate._id)}
                      >
                        <MessageSquare className="mr-1 h-4 w-4" />
                        Start Chat
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      navigate(`/candidates/${selectedCandidate!._id}`)
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
