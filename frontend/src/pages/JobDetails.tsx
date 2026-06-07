import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useJobStore } from "@/store/useJobStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  ArrowLeft,
  Edit,
  Eye,
  FileText,
  Star,
  Clock,
  Building,
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CandidateDisplay {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  matchScore?: number;
  resumeScore?: number;
  status: string;
  appliedAt: string;
  extractedText?: string;
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { jobs, fetchJobs, loading } = useJobStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<CandidateDisplay[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>("");

  const job = jobs.find((j) => j._id === id);

  useEffect(() => {
    if (!jobs.length) {
      fetchJobs();
    }
  }, [fetchJobs, jobs.length]);

  useEffect(() => {
    if (id && (user?.role === "admin" || user?.role === "recruiter")) {
      fetchCandidates();
    }
  }, [id, user?.role]);

  useEffect(() => {
    if (job) {
      // Determine job status based on isActive and other factors
      if (!job.isActive) {
        setJobStatus("closed");
      } else {
        setJobStatus("open");
      }
    }
  }, [job]);

  const fetchCandidates = async () => {
    if (!id) return;

    setLoadingCandidates(true);
    try {
      const candidatesData = await api.jobs.getJobCandidates(id);
      // Filter out rejected candidates for display
      const activeCandidates = candidatesData.filter(
        (c) => c.status !== "rejected"
      );
      setCandidates(activeCandidates);
    } catch (error) {
      console.error("Error fetching candidates:", error);
      toast({
        title: "Error",
        description: "Failed to load candidates",
        variant: "destructive",
      });
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleEditJob = () => {
    navigate(`/jobs/${id}/edit`);
  };

  const handleMarkAsFilled = async () => {
    if (!id) return;

    try {
      await api.jobs.markAsFilled(id);
      toast({
        title: "Success",
        description: "Job marked as filled successfully",
      });
      setJobStatus("filled");
      fetchJobs();
    } catch (error) {
      console.error("Error marking job as filled:", error);
      toast({
        title: "Error",
        description: "Failed to mark job as filled",
        variant: "destructive",
      });
    }
  };

  const handleReopenJob = async () => {
    if (!id) return;

    try {
      await api.jobs.reopenJob(id);
      toast({
        title: "Success",
        description: "Job reopened successfully",
      });
      setJobStatus("open");
      fetchJobs();
    } catch (error) {
      console.error("Error reopening job:", error);
      toast({
        title: "Error",
        description: "Failed to reopen job",
        variant: "destructive",
      });
    }
  };

  const handleCloseJob = async () => {
    if (!id) return;

    try {
      await api.jobs.updateStatus(id, "closed");
      toast({
        title: "Success",
        description: "Job closed successfully",
      });
      setJobStatus("closed");
      fetchJobs();
    } catch (error) {
      console.error("Error closing job:", error);
      toast({
        title: "Error",
        description: "Failed to close job",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async () => {
    if (!id) return;

    try {
      await api.jobs.deleteJob(id);
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      navigate("/jobs");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({
        title: "Error",
        description:
          "Failed to delete job. Make sure there are no active candidates.",
        variant: "destructive",
      });
    }
  };

  const handleViewAllCandidates = () => {
    navigate(`/candidates?jobId=${id}`);
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-2xl font-semibold">Job Not Found</h2>
          <p className="mb-4 text-muted-foreground">
            The job posting you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/jobs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />            
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
            <Button variant="ghost" onClick={() => navigate("/jobs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />              
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <p className="mt-1 flex items-center text-muted-foreground">
                <Building className="mr-1 h-4 w-4" />
                {job.department}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant={
                    jobStatus === "open"
                      ? "default"
                      : jobStatus === "filled"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {jobStatus === "open"
                    ? "Open"
                    : jobStatus === "filled"
                      ? "Filled"
                      : "Closed"}
                </Badge>
                <Badge variant="outline">
                  {candidates.length}{" "}
                  {candidates.length === 1 ? "Candidate" : "Candidates"}
                </Badge>
              </div>
            </div>
          </div>
          {(user?.role === "admin" || user?.role === "recruiter") && (
            <div className="flex items-center gap-2">
              <Button onClick={handleEditJob}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Job
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {jobStatus === "open" && (
                    <>
                      <DropdownMenuItem onClick={handleMarkAsFilled}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Filled
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCloseJob}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Close Job
                      </DropdownMenuItem>
                    </>
                  )}
                  {(jobStatus === "closed" || jobStatus === "filled") && (
                    <DropdownMenuItem onClick={handleReopenJob}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Reopen Job
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Job
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the job posting and all associated data. Make
                          sure there are no active candidates first.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteJob}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Job Details */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5" />
                  <span>Job Description</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-sm leading-relaxed">{job.description}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-3 font-semibold">Requirements</h4>
                  <ul className="space-y-2">
                    {job.requirements?.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></div>
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Candidates Section */}
            {(user?.role === "admin" || user?.role === "recruiter") && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Candidates ({candidates.length})</span>
                    </div>
                    {candidates.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewAllCandidates}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View All
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCandidates ? (
                    <div className="py-8 text-center">
                      <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading candidates...
                      </p>
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No candidates yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {candidates.slice(0, 5).map((candidate) => (
                        <div
                          key={candidate._id}
                          className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                          onClick={() =>
                            navigate(`/candidates/${candidate._id}`)
                          }
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                <span className="text-sm font-medium">
                                  {candidate.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{candidate.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {candidate.email}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {candidate.matchScore > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-current text-yellow-500" />
                                <span
                                  className={`text-sm font-medium ${getMatchScoreColor(
                                    candidate.matchScore
                                  )}`}
                                >
                                  {(candidate.matchScore * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                            <Badge className={getStatusColor(candidate.status)}>
                              {candidate.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {candidates.length > 5 && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={handleViewAllCandidates}
                        >
                          View {candidates.length - 5} more candidates
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Job Info Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{job.location || "Remote"}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Salary Range
                    </p>
                    <p className="font-medium">
                      {job.salaryRange || "Competitive"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Employment Type
                    </p>
                    <p className="font-medium">
                      {job.employmentType || "Full-time"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Posted</p>
                    <p className="font-medium">
                      {format(new Date(job.postedAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Applications
                    </p>
                    <p className="font-medium">
                      {candidates.length} candidates
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        jobStatus === "open"
                          ? "default"
                          : jobStatus === "filled"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {jobStatus === "open"
                        ? "Open"
                        : jobStatus === "filled"
                          ? "Filled"
                          : "Closed"}
                    </Badge>
                  </div>
                  {(user?.role === "admin" || user?.role === "recruiter") && (
                    <div className="space-y-2">
                      {jobStatus === "open" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleMarkAsFilled}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Filled
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={handleCloseJob}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Close Job
                          </Button>
                        </>
                      )}
                      {(jobStatus === "closed" || jobStatus === "filled") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleReopenJob}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Reopen Job
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
