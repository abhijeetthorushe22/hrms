import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useJobStore } from "@/store/useJobStore";
import { useEmployeeStore } from "@/store/useEmployeeStore";
import { useCandidateStore } from "@/store/useCandidateStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  TrendingUp,
  Users,
  Briefcase,
  UserCheck,
  Brain,
  ChartBar,
  Target,
} from "lucide-react";

export default function Analytics() {
  const { jobs, fetchJobs, loading: jobsLoading } = useJobStore();
  const {
    employees,
    fetchEmployees,
    loading: employeesLoading,
  } = useEmployeeStore();
  const {
    candidates,
    fetchCandidates,
    loading: candidatesLoading,
  } = useCandidateStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchJobs();
    fetchEmployees();
    fetchCandidates();
  }, [fetchJobs, fetchEmployees, fetchCandidates]);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.isActive).length;
  const totalEmployees = employees.length;
  const activeCandidates = candidates.filter((c) => c.status !== "rejected");
  const totalCandidates = activeCandidates.length;
  const hiringRate =
    totalCandidates > 0
      ? Math.round(
          (candidates.filter((c) => c.status === "hired").length /
            (totalCandidates +
              candidates.filter((c) => c.status === "hired").length)) *
            100
        )
      : 0;

  // Department breakdown
  const departmentStats = jobs.reduce(
    (acc, job) => {
      acc[job.department] = (acc[job.department] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Candidate status breakdown
  const candidateStatusStats = candidates.reduce(
    (acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const loading = jobsLoading || employeesLoading || candidatesLoading;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                {activeJobs} active positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Active workforce</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Candidates
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCandidates}</div>
              <p className="text-xs text-muted-foreground">
                In recruitment pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hiring Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hiringRate}%</div>
              <p className="text-xs text-muted-foreground">Successful hires</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Department Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBar className="h-5 w-5" />
                Jobs by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(departmentStats).map(([dept, count]) => (
                  <div key={dept} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {dept}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count} jobs
                      </span>
                    </div>
                    <Progress
                      value={(count / totalJobs) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Candidate Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Candidate Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(candidateStatusStats).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {status}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI-Powered Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Top Skills in Demand</h4>
                <div className="space-y-1">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Node.js</Badge>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Hiring Trends</h4>
                <p className="text-sm text-muted-foreground">
                  Engineering positions show highest demand with{" "}
                  {departmentStats["engineering"] || 0} open roles
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">Performance Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Average time to hire: 14 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
