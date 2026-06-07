import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useJobStore } from "@/store/useJobStore";
import { useEmployeeStore } from "@/store/useEmployeeStore";
import { useCandidateStore } from "@/store/useCandidateStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, Briefcase, UserCheck } from "lucide-react";

export function DataManagementPanel() {
  const { user } = useAuthStore();
  const { createJob, fetchJobs, loading: jobsLoading } = useJobStore();
  const { fetchEmployees, loading: employeesLoading } = useEmployeeStore();
  const { fetchCandidates, loading: candidatesLoading } = useCandidateStore();
  const { toast } = useToast();

  // Only show for admin users
  if (user?.role !== "admin") {
    return null;
  }

  const handleCreateSampleJob = async () => {
    try {
      await createJob({
        title: "Senior Full Stack Developer",
        description:
          "We are looking for an experienced full stack developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies.",
        requirements: [
          "React",
          "Node.js",
          "TypeScript",
          "PostgreSQL",
          "Docker",
        ],
        location: "San Francisco, CA",
        department: "Engineering",
        salaryRange: "₹120,000 - ₹180,000",
        employmentType: "full-time",
      });

      await fetchJobs();

      toast({
        title: "Success",
        description: "Sample job posting created successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sample job",
        variant: "destructive",
      });
    }
  };

  const handleRefreshAllData = async () => {
    try {
      await Promise.all([fetchJobs(), fetchEmployees(), fetchCandidates()]);

      toast({
        title: "Success",
        description: "All data refreshed successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Database className="h-5 w-5" />
          Admin Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={handleCreateSampleJob}
            disabled={jobsLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {jobsLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Briefcase className="h-4 w-4 mr-2" />
            )}
            Create Sample Job
          </Button>

          <Button
            onClick={handleRefreshAllData}
            disabled={jobsLoading || employeesLoading || candidatesLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {jobsLoading || employeesLoading || candidatesLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Refresh All Data
          </Button>
        </div>

        <p className="text-xs text-orange-600">
          Use these tools to create sample data and test the application
          functionality.
        </p>
      </CardContent>
    </Card>
  );
}
