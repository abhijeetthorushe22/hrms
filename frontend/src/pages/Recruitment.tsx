import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Upload,
  Search,
  Brain,
  FileText,
  MessageSquare,
} from "lucide-react";
import { CandidateCard } from "@/components/recruitment/CandidateCard";
import { AIScreeningChat } from "@/components/screening/AIScreeningChat";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useJobStore } from "@/store/useJobStore";
import { useCandidateStore } from "@/store/useCandidateStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

export default function Recruitment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Form states
  const [jobTitle, setJobTitle] = useState("");
  const [jobDepartment, setJobDepartment] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobSalaryRange, setJobSalaryRange] = useState("");
  const [jobEmploymentType, setJobEmploymentType] = useState("full-time");
  const [jobRequirements, setJobRequirements] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedCandidateForChat, setSelectedCandidateForChat] = useState<{
    id: string;
    name: string;
    jobTitle: string;
  } | null>(null);

  const { toast } = useToast();
  const { user } = useAuthStore();
  const {
    jobs,
    candidates,
    loading,
    error,
    fetchJobs,
    createJob,
    uploadResume,
    fetchJobCandidates,
  } = useJobStore();

  const { startChat } = useCandidateStore();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (selectedJobId) {
      fetchJobCandidates(selectedJobId);
    }
  }, [selectedJobId, fetchJobCandidates]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    const requiredFields = [
      { value: jobTitle?.trim(), name: "Job Title" },
      { value: jobDepartment, name: "Department" },
      { value: jobDescription?.trim(), name: "Job Description" },
      { value: jobLocation?.trim(), name: "Location" },
      { value: jobSalaryRange?.trim(), name: "Salary Range" },
    ];

    const emptyField = requiredFields.find((field) => !field.value);
    if (emptyField) {
      toast({
        title: "Validation Error",
        description: `${emptyField.name} is required`,
        variant: "destructive",
      });
      return;
    }
    const salaryPattern =
      /^[₹$€£¥]?\s?(\d{1,3}(,\d{2,3})*|\d{1,3}(,\d{3})*|\d+)(\s*-\s*[₹$€£¥]?\s?(\d{1,3}(,\d{2,3})*|\d{1,3}(,\d{3})*|\d+))?(\s*[A-Za-z]*)?$/;
    if (!salaryPattern.test(jobSalaryRange.trim())) {
      toast({
        title: "Validation Error",
        description:
          "Please enter a valid salary range (e.g., ₹8,00,000, $80,000 - $120,000, ₹5,00,000 - ₹8,00,000)",
        variant: "destructive",
      });
      return;
    }

    try {
      const requirements = jobRequirements
        .split(",")
        .map((req) => req.trim())
        .filter((req) => req.length > 0);

      await createJob({
        title: jobTitle.trim(),
        department: jobDepartment,
        description: jobDescription.trim(),
        requirements: requirements,
        location: jobLocation.trim(),
        salaryRange: jobSalaryRange.trim(),
        employmentType: jobEmploymentType as
          | "full-time"
          | "part-time"
          | "contract"
          | "internship",
      });

      toast({
        title: "Success! 🎉",
        description: `Job posting "${jobTitle}" created successfully!`,
      });

      setShowCreateJob(false);
      setJobTitle("");
      setJobDepartment("");
      setJobDescription("");
      setJobLocation("");
      setJobSalaryRange("");
      setJobEmploymentType("full-time");
      setJobRequirements("");
    } catch (error: any) {
      console.error("Job creation error:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail ||
          "Failed to create job posting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedJobId) {
      toast({
        title: "Error",
        description: "Please select a job posting first",
        variant: "destructive",
      });
      return;
    }

    if (uploadFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload files one by one
      for (const file of uploadFiles) {
        await uploadResume(selectedJobId, file);
      }

      toast({
        title: "Success",
        description: `${uploadFiles.length} resume(s) uploaded successfully! AI processing started.`,
      });

      setShowUploadDialog(false);
      setUploadFiles([]);

      // Refresh candidates list
      setTimeout(() => {
        fetchJobCandidates(selectedJobId);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload resumes",
        variant: "destructive",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.endsWith(".docx") ||
        file.name.endsWith(".doc")
    );

    setUploadFiles((prev) => [...prev, ...files]);
  };

  const handleStartChat = async (candidateId: string) => {
    try {
      // Find the candidate details from the selected job's candidates
      const selectedJobCandidates = selectedJobId
        ? candidates[selectedJobId] || []
        : [];
      const candidate = selectedJobCandidates.find(
        (c) => c._id === candidateId
      );
      if (!candidate) {
        toast({
          title: "Error",
          description: "Candidate not found",
          variant: "destructive",
        });
        return;
      }

      // Find the job title
      const job = jobs.find((j) => j._id === selectedJobId);
      const jobTitle = job?.title || "Unknown Position";

      // Set candidate for chat and open dialog
      setSelectedCandidateForChat({
        id: candidateId,
        name: candidate.name,
        jobTitle: jobTitle,
      });
      setIsChatOpen(true);

      toast({
        title: "AI Chat Started",
        description: `Opening AI screening chat for ${candidate.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start chat session",
        variant: "destructive",
      });
    }
  };

  const handleViewResume = async (candidateId: string) => {
    try {
      // Prefer opening the original uploaded file by resumeS3Key if present in store
      const selectedJobCandidates = selectedJobId
        ? candidates[selectedJobId] || []
        : [];
      const candidate = selectedJobCandidates.find(
        (c) => c._id === candidateId
      );

      const token = localStorage.getItem("token");

      // If we have a resumeS3Key for this candidate, try static uploads first
      if (candidate?.resumeS3Key) {
        const uploadsUrl = `/uploads/${candidate.resumeS3Key}`;
        try {
          const headResp = await fetch(uploadsUrl, { method: "HEAD" });
          if (headResp.ok) {
            window.open(uploadsUrl, "_blank");
            toast({
              title: "Resume Opened",
              description: "Original resume opened in new tab",
            });
            return;
          }
        } catch (e) {
          // ignore and try legacy download
        }

        try {
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
            const blobUrl = window.URL.createObjectURL(blob);
            const win = window.open(blobUrl, "_blank");
            if (!win) {
              const viewer = window.open(
                "",
                "_blank",
                "width=900,height=700,scrollbars=yes"
              );
              if (viewer) {
                viewer.document.write(
                  `<!doctype html><html><head><title>Resume - Candidate ${candidateId}</title></head><body style="margin:0;padding:0;height:100vh;"><iframe src="${blobUrl}" style="width:100%;height:100vh;border:0"></iframe></body></html>`
                );
                viewer.document.close();
              }
            }

            toast({
              title: "Resume Opened",
              description: "Original uploaded resume opened in new tab",
            });
            return;
          }
        } catch (e) {
          console.warn("Failed to download resume by key, falling back", e);
        }
      }

      // Next, try the candidate resume-file endpoint (legacy/alternate)
      try {
        const fileResp = await fetch(
          `/api/candidates/${candidateId}/resume-file`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );

        if (fileResp.ok) {
          const blob = await fileResp.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const win = window.open(blobUrl, "_blank");
          if (!win) {
            const viewer = window.open(
              "",
              "_blank",
              "width=900,height=700,scrollbars=yes"
            );
            if (viewer) {
              viewer.document.write(
                `<!doctype html><html><head><title>Resume - Candidate ${candidateId}</title></head><body style="margin:0;padding:0;height:100vh;"><iframe src="${blobUrl}" style="width:100%;height:100vh;border:0"></iframe></body></html>`
              );
              viewer.document.close();
            }
          }

          toast({
            title: "Resume Opened",
            description: "Original resume file opened in new tab",
          });
          return;
        }
      } catch (e) {
        console.warn("candidate resume-file endpoint failed, falling back", e);
      }

      // If original file not available, fall back to showing extracted text
      const resumeData = await api.candidates.getResumeText(candidateId);

      // Create a modal or new window to display the extracted resume text
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
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .content { white-space: pre-wrap; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Candidate Resume</h1>
                <p>ID: ${candidateId}</p>
              </div>
              <div class="content">${resumeData.resume_text}</div>
            </body>
          </html>
        `);
        resumeWindow.document.close();
      }

      toast({
        title: "Resume Opened",
        description: "Extracted resume text opened in new window",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load resume text",
        variant: "destructive",
      });
    }
  };

  const selectedJobCandidates = selectedJobId
    ? candidates[selectedJobId] || []
    : [];
  const filteredCandidates = selectedJobCandidates
    .filter(
      (candidate) =>
        // Filter out rejected candidates and apply search query
        candidate.status !== "rejected" &&
        (candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
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

  // Check if user has permission to create jobs or upload resumes
  const canManageJobs = user?.role === "recruiter" || user?.role === "admin";

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">AI-Powered Recruitment</h1>
            <p className="text-muted-foreground">
              Intelligent resume screening and candidate ranking
            </p>
          </div>
          <div className="flex gap-2">
            {canManageJobs && (
              <>
                <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="transition-all hover:scale-105"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create New Job Posting</DialogTitle>
                      <DialogDescription>
                        Create a new job posting to start receiving
                        applications.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                      <form onSubmit={handleCreateJob} className="space-y-4">
                        <div>
                          <Label htmlFor="title">Job Title</Label>
                          <Input
                            id="title"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Senior Software Engineer"
                          />
                        </div>
                        <div>
                          <Label htmlFor="department">Department</Label>
                          <Select
                            value={jobDepartment}
                            onValueChange={setJobDepartment}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="engineering">
                                Engineering
                              </SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="design">Design</SelectItem>
                              <SelectItem value="marketing">
                                Marketing
                              </SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="hr">
                                Human Resources
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={jobLocation}
                            onChange={(e) => setJobLocation(e.target.value)}
                            placeholder="e.g. Remote, San Francisco, CA"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="salaryRange">Salary Range</Label>
                          <Input
                            id="salaryRange"
                            value={jobSalaryRange}
                            onChange={(e) => setJobSalaryRange(e.target.value)}
                            placeholder="e.g. ₹8,00,000 - ₹12,00,000 or $80,000 - $120,000"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="employmentType">
                            Employment Type
                          </Label>
                          <Select
                            value={jobEmploymentType}
                            onValueChange={setJobEmploymentType}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select employment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full-time">
                                Full-time
                              </SelectItem>
                              <SelectItem value="part-time">
                                Part-time
                              </SelectItem>
                              <SelectItem value="contract">Contract</SelectItem>
                              <SelectItem value="internship">
                                Internship
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="requirements">
                            Requirements (comma-separated)
                          </Label>
                          <Textarea
                            id="requirements"
                            value={jobRequirements}
                            onChange={(e) => setJobRequirements(e.target.value)}
                            placeholder="e.g. React, Node.js, TypeScript, 3+ years experience"
                            className="min-h-[80px]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Job Description</Label>
                          <Textarea
                            id="description"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Describe the role, responsibilities, and requirements..."
                            className="min-h-[120px]"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCreateJob(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Job"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={showUploadDialog}
                  onOpenChange={setShowUploadDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary transition-all hover:scale-105 hover:shadow-glow"
                      disabled={!selectedJobId}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Resumes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Upload Resumes</DialogTitle>
                      <DialogDescription>
                        Upload candidate resumes for AI-powered screening and
                        ranking.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div
                        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                          dragActive
                            ? "border-primary bg-primary/10"
                            : "border-muted-foreground/25"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          Drag and drop PDF or DOCX files here, or click to
                          select
                        </p>
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.doc"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setUploadFiles((prev) => [...prev, ...files]);
                          }}
                          className="mx-auto max-w-xs"
                        />
                      </div>

                      {uploadFiles.length > 0 && (
                        <div className="space-y-2">
                          <Label>Selected Files ({uploadFiles.length})</Label>
                          <div className="max-h-32 space-y-1 overflow-y-auto">
                            {uploadFiles.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded bg-muted p-2 text-sm"
                              >
                                <span>{file.name}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setUploadFiles((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowUploadDialog(false);
                            setUploadFiles([]);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleFileUpload}
                          disabled={loading || uploadFiles.length === 0}
                        >
                          {loading
                            ? "Uploading..."
                            : `Upload ${uploadFiles.length} file(s)`}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Job Selection and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Job Selection & Search
            </CardTitle>
            <CardDescription>
              Select a job posting to view candidates and their AI-generated
              match scores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="job-select">Job Posting</Label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job posting" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job._id} value={job._id}>
                        {job.title} - {job.department} (
                        {job.isActive ? "Active" : "Inactive"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="search">Search Candidates</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {selectedJobId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Candidates ({filteredCandidates.length})</span>
                <Badge variant="secondary">Ranked by AI Match Score</Badge>
              </CardTitle>
              <CardDescription>
                Candidates are automatically ranked based on their resume match
                with the job description
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">Loading candidates...</p>
                </div>
              )}

              {!loading && filteredCandidates.length === 0 && (
                <div className="py-8 text-center">
                  <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {selectedJobId
                      ? "No candidates found for this job. Upload some resumes to get started!"
                      : "Select a job posting to view candidates"}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate._id}
                    candidate={candidate}
                    onStartChat={() => handleStartChat(candidate._id)}
                    onViewResume={() => handleViewResume(candidate._id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Screening Chat Dialog */}
      {selectedCandidateForChat && (
        <AIScreeningChat
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setSelectedCandidateForChat(null);
            // Refresh candidates list after chat
            if (selectedJobId) {
              fetchJobCandidates(selectedJobId);
            }
          }}
          candidateId={selectedCandidateForChat.id}
          candidateName={selectedCandidateForChat.name}
          jobTitle={selectedCandidateForChat.jobTitle}
        />
      )}
    </MainLayout>
  );
}
