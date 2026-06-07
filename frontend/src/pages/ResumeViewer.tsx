import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  Star,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface CandidateDisplay {
  _id: string;
  name: string;
  email: string;
  matchScore?: number;
  resumeScore?: number;
  status: string;
  extractedText?: string;
  resumeS3Key?: string;
}

export default function ResumeViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [candidate, setCandidate] = useState<CandidateDisplay | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchResumeData();
    }
  }, [id]);

  // Cleanup object URL when component unmounts or fileUrl changes
  useEffect(() => {
    return () => {
      if (fileUrl) {
        try {
          window.URL.revokeObjectURL(fileUrl);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [fileUrl]);

  const fetchResumeData = async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      // Import API from the lib
      const { api } = await import("@/lib/api");

      // Fetch candidate details
      const candidateData = await api.candidates.getCandidate(id);
      // Fetch AI scoring and prefer resumeScore when present
      try {
        const ai = await api.candidates.getAIScore(id);
        // Normalize matchScore to 0-1 where possible
        const normalize = (v: any) => {
          if (v === undefined || v === null) return undefined;
          const n = Number(v);
          if (Number.isNaN(n)) return undefined;
          return n > 1
            ? Math.max(0, Math.min(1, n / 100))
            : Math.max(0, Math.min(1, n));
        };
        candidateData.resumeScore =
          ai?.resumeScore ?? ai?.overallScore ?? candidateData.resumeScore;
        candidateData.matchScore = normalize(
          ai?.resumeScore ?? ai?.overallScore ?? candidateData.matchScore
        );
      } catch (e) {
        // Ignore AI score errors; continue with candidate data
        console.warn("Failed to fetch AI score for resume viewer", e);
      }
      setCandidate(candidateData);

      // If there is a stored S3 key for the original file, try to fetch it and create an object URL
      if (candidateData.resumeS3Key) {
        fetchOriginalFile(candidateData.resumeS3Key, candidateData._id).catch(
          (e) => console.warn("Failed to fetch original resume file:", e)
        );
      }

      // Set extracted text as fallback, but we'll primarily show the file
      setResumeText(candidateData.extractedText || "No resume text available");
    } catch (error) {
      console.error("Error fetching resume data:", error);
      setError("An error occurred while loading the resume");
    } finally {
      setLoading(false);
    }
  };

  const fetchOriginalFile = async (s3Key: string, candidateId: string) => {
    setFileLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Try static uploads path first (served by FastAPI StaticFiles at /uploads)
      const uploadsUrl = `/uploads/${s3Key}`;
      try {
        const head = await fetch(uploadsUrl, { method: "HEAD" });
        if (head.ok) {
          setFileUrl(uploadsUrl);
          return uploadsUrl;
        }
      } catch (e) {
        // ignore and continue
      }

      // Try legacy files download endpoint
      const resp = await fetch(`/api/files/download/${s3Key}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!resp.ok) {
        // fallback: try candidate-level resume endpoint
        const fallback = await fetch(
          `http://localhost:8000/api/v1/candidates/${candidateId}/resume-file`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!fallback.ok) throw new Error("Failed to download resume file");
        const blob = await fallback.blob();
        const url = window.URL.createObjectURL(blob);
        setFileUrl(url);
        return url;
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      setFileUrl(url);
      return url;
    } finally {
      setFileLoading(false);
    }
  };

  const downloadResume = async () => {
    if (!candidate) return;

    try {
      // If we already have a fetched object URL, use it
      let url = fileUrl;
      if (!url && candidate.resumeS3Key) {
        url = await fetchOriginalFile(candidate.resumeS3Key, candidate._id);
      }

      if (!url) return;

      const a = document.createElement("a");
      a.href = url;
      a.download = `${candidate.name}_Resume`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // keep object URL until component unmounts so iframe/open-in-new-tab can still use it
    } catch (error) {
      console.error("Error downloading resume:", error);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 0.4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
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

  const highlightKeywords = (text: string) => {
    const keywords = [
      "python",
      "javascript",
      "react",
      "node",
      "fastapi",
      "django",
      "flask",
      "experience",
      "years",
      "development",
      "software",
      "engineer",
      "developer",
      "project",
      "team",
      "lead",
      "senior",
      "junior",
      "manager",
      "aws",
      "azure",
      "docker",
      "kubernetes",
      "git",
      "ci/cd",
      "database",
      "sql",
      "mongodb",
      "postgresql",
      "mysql",
      "api",
      "rest",
      "graphql",
      "microservices",
      "agile",
      "scrum",
    ];

    let highlightedText = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$&</mark>`
      );
    });

    return highlightedText;
  };

  const handleStartScreening = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/candidates/${id}/start-screening`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chatId) {
          navigate(`/chat/${data.chatId}`);
        }
      }
    } catch (error) {
      console.error("Error starting screening:", error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading resume...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !candidate) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-2xl font-semibold">Unable to Load Resume</h2>
          <p className="mb-4 text-muted-foreground">
            {error || "The resume you're looking for doesn't exist."}
          </p>
          <Button onClick={() => navigate(`/candidates/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {/* Back to Candidate */}
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
            <Button
              variant="ghost"
              onClick={() => navigate(`/candidates/${id}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {/* Back to Candidate */}
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {candidate.name}'s Resume
                </h1>
                <p className="text-muted-foreground">{candidate.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {(() => {
              // Prefer resumeScore when available, fall back to matchScore
              const score =
                candidate.resumeScore !== undefined
                  ? Number(candidate.resumeScore)
                  : Number(candidate.matchScore);
              return !Number.isNaN(score) && score > 0;
            })() && (
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 fill-current text-yellow-500" />
                <span
                  className={`font-medium ${getMatchScoreColor(
                    candidate.matchScore
                  )}`}
                >
                  {(() => {
                    // Prefer resumeScore (raw) for display, else matchScore
                    const raw =
                      candidate.resumeScore !== undefined
                        ? Number(candidate.resumeScore)
                        : Number(candidate.matchScore);
                    if (Number.isNaN(raw)) return "N/A";
                    const pct = raw <= 1 ? raw * 100 : raw;
                    return `${pct.toFixed(1)}% Match`;
                  })()}
                </span>
              </div>
            )}
            <Badge className={getStatusColor(candidate.status)}>
              {candidate.status}
            </Badge>
            {candidate.resumeS3Key && (
              <Button onClick={downloadResume}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Resume Content */}
          <div className="lg:col-span-3">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Resume Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {candidate?.resumeS3Key ? (
                  <div className="space-y-4">                    
                    {/* Original Resume Viewer */}
                    <div className="overflow-hidden rounded-lg border bg-white">
                      <div
                        className="flex items-center justify-between border-b px-4 py-2"
                        style={{ background: "rgb(14 22 40 / 96%)" }}
                      >
                        <span className="text-sm font-medium">
                          Original Resume File
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadResume}
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `http://localhost:8000/api/v1/candidates/${candidate._id}/resume-file`,
                                "_blank"
                              )
                            }
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Open in New Tab
                          </Button>
                        </div>
                      </div>
                      <div className="h-96 bg-gray-100">
                        {fileLoading ? (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Loading original file...
                          </div>
                        ) : (
                          <iframe
                            src={
                              fileUrl
                                ? fileUrl
                                : `http://localhost:8000/api/v1/candidates/${candidate._id}/resume-file`
                            }
                            className="h-full w-full border-0"
                            title="Resume Viewer"
                            onLoad={() =>
                              console.log("Iframe loaded successfully")
                            }
                            onError={() => console.log("Iframe failed to load")}
                          />
                        )}
                      </div>
                    </div>

                    {/* Extracted Text Section */}
                    {resumeText && (
                      <div className="rounded-lg border">
                        <div
                          className="flex items-center justify-between rounded-t-lg px-4 py-2"
                          style={{ background: "rgb(14 22 40 / 96%)" }}
                        >
                          <span className="text-sm font-medium">
                            Extracted Text
                          </span>
                        </div>
                        <div className="p-4">
                          <div
                            className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: highlightKeywords(resumeText),
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No Resume File Available
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      The original resume file is not available for this
                      candidate.
                    </p>
                    {resumeText && (
                      <div className="mt-6 text-left">
                        <h4 className="mb-2 font-medium">Extracted Text:</h4>
                        <div
                          className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded border p-4 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeywords(resumeText),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Candidate Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Candidate</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{candidate.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {candidate.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/candidates/${id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Profile
                </Button>
              </CardContent>
            </Card>

            {/* Match Analysis */}
            {candidate.matchScore > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>AI Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        Match Score
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              candidate.matchScore >= 0.8
                                ? "bg-green-500"
                                : candidate.matchScore >= 0.6
                                  ? "bg-yellow-500"
                                  : candidate.matchScore >= 0.4
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                            }`}
                            style={{
                              width: `${(() => {
                                const v = Number(candidate.matchScore);
                                if (Number.isNaN(v)) return 0;
                                return v <= 1 ? v * 100 : v;
                              })()}%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${getMatchScoreColor(
                            candidate.matchScore
                          )}`}
                        >
                          {(() => {
                            const v = Number(candidate.matchScore);
                            if (Number.isNaN(v)) return "N/A";
                            const pct = v <= 1 ? v * 100 : v;
                            return `${pct.toFixed(1)}%`;
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Based on semantic analysis of resume content against job
                      requirements.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {(user?.role === "admin" || user?.role === "recruiter") && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleStartScreening}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Start Screening
                  </Button>
                  {candidate.resumeS3Key && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={downloadResume}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resume Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Format:</span>
                  <span>PDF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Text Length:</span>
                  <span>{resumeText.length.toLocaleString()} characters</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Word Count:</span>
                  <span>
                    {resumeText.split(/\s+/).length.toLocaleString()} words
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="text-xs">
                    Processed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
