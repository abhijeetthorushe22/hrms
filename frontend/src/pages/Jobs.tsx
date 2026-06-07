import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useJobStore } from "@/store/useJobStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Plus,
  Edit,
  Eye,
  Loader2,
} from "lucide-react";

export default function Jobs() {
  const navigate = useNavigate();
  const { jobs, fetchJobs, loading, createJob } = useJobStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  // Dialog state
  const [showCreateJob, setShowCreateJob] = useState(false);

  // Form states
  const [jobTitle, setJobTitle] = useState("");
  const [jobDepartment, setJobDepartment] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobSalaryRange, setJobSalaryRange] = useState("");
  const [jobEmploymentType, setJobEmploymentType] = useState("full-time");
  const [jobRequirements, setJobRequirements] = useState("");

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Check if user has permission to create jobs
  const canManageJobs = user?.role === "recruiter" || user?.role === "admin";

  // Navigation handlers
  const handleViewJob = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleEditJob = (jobId: string) => {
    navigate(`/jobs/${jobId}/edit`);
  };

  const resetForm = () => {
    setJobTitle("");
    setJobDepartment("");
    setJobDescription("");
    setJobLocation("");
    setJobSalaryRange("");
    setJobEmploymentType("full-time");
    setJobRequirements("");
  };

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

    // Validate salary range format - supports multiple currencies and number formats
    // Supports: ₹8,00,000 (Indian), $80,000 (Western), ₹800000 (no commas), ranges, etc.
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
      resetForm();
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading job postings...</p>
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
            <Briefcase className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Job Postings</h1>
          </div>
          {canManageJobs && (
            <Dialog open={showCreateJob} onOpenChange={setShowCreateJob}>
              <DialogTrigger asChild>
                <Button className="transition-all hover:scale-105">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Job Posting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Job Posting</DialogTitle>
                  <DialogDescription>
                    Create a new job posting to start receiving applications.
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
                        required
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
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select
                        value={jobEmploymentType}
                        onValueChange={setJobEmploymentType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
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
                        onClick={() => {
                          setShowCreateJob(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="min-w-[100px]"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Job"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex h-48 items-center justify-center">
                <div className="text-center">
                  <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No job postings available.
                  </p>
                  {canManageJobs && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create your first job posting to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card
                key={job._id}
                className="border-l-4 border-l-primary/20 transition-all duration-200 hover:scale-[1.02] hover:border-l-primary hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-primary transition-colors hover:text-primary/80">
                        {job.title}
                      </CardTitle>
                      <p className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-1 h-3 w-3" />
                        {job.department}
                      </p>
                    </div>
                    <Badge
                      variant={job.isActive ? "default" : "secondary"}
                      className={
                        job.isActive
                          ? "border-green-200 bg-green-100 text-green-800"
                          : ""
                      }
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="font-medium">{job.location}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-700">
                        {job.salaryRange}
                      </span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                      <span>
                        Posted {new Date(job.postedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="mb-1 font-medium">Employment Type:</p>
                    <Badge variant="outline">
                      {job.employmentType.charAt(0).toUpperCase() +
                        job.employmentType.slice(1)}
                    </Badge>
                  </div>

                  <div className="text-sm">
                    <p className="mb-2 font-medium">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {job.requirements.slice(0, 3).map((req, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {req}
                        </Badge>
                      ))}
                      {job.requirements.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.requirements.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="line-clamp-3 text-muted-foreground">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 transition-all hover:scale-105"
                      onClick={() => handleViewJob(job._id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    {canManageJobs && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleEditJob(job._id)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
