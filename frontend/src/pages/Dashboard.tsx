import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/store/useAuthStore";
import { useEmployeeStore } from "@/store/useEmployeeStore";
import { useJobStore } from "@/store/useJobStore";
import { useCandidateStore } from "@/store/useCandidateStore";
import { DataManagementPanel } from "@/components/debug/DataManagementPanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Briefcase,
  TrendingUp,
  GraduationCap,
  Brain,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    employees,
    fetchEmployees,
    loading: employeesLoading,
  } = useEmployeeStore();
  const { jobs, fetchJobs, loading: jobsLoading } = useJobStore();
  const {
    candidates,
    fetchCandidates,
    loading: candidatesLoading,
  } = useCandidateStore();

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated && user) {
      fetchEmployees();
      fetchJobs();
      fetchCandidates();
    }
  }, [isAuthenticated, user, fetchEmployees, fetchJobs, fetchCandidates]);

  // Calculate real stats - filter out rejected candidates
  const totalEmployees = employees.length;
  const openJobs = jobs.filter((job) => job.isActive).length;

  // Only count active candidates (not rejected)
  const activeCandidates = candidates.filter((c) => c.status !== "rejected");
  const totalCandidates = activeCandidates.length;
  const recentCandidates = activeCandidates.filter((c) => {
    const appliedDate = new Date(c.appliedAt);
    const today = new Date();
    const daysDiff =
      (today.getTime() - appliedDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff <= 7;
  }).length;

  const stats = {
    admin: [
      {
        title: "Total Employees",
        value: totalEmployees.toString(),
        change: "active",
        icon: Users,
        color: "text-primary",
      },
      {
        title: "Open Positions",
        value: openJobs.toString(),
        change: "hiring",
        icon: Briefcase,
        color: "text-secondary",
      },
      {
        title: "Total Candidates",
        value: totalCandidates.toString(),
        change: "pipeline",
        icon: TrendingUp,
        color: "text-success",
      },
      {
        title: "Recent Applications",
        value: recentCandidates.toString(),
        change: "this week",
        icon: Brain,
        color: "text-accent",
      },
    ],
    recruiter: [
      {
        title: "Active Jobs",
        value: openJobs.toString(),
        change: "open",
        icon: Briefcase,
        color: "text-primary",
      },
      {
        title: "New Candidates",
        value: recentCandidates.toString(),
        change: "this week",
        icon: Users,
        color: "text-secondary",
      },
      {
        title: "Total Candidates",
        value: totalCandidates.toString(),
        change: "pipeline",
        icon: Brain,
        color: "text-accent",
      },
      {
        title: "Screening",
        value: activeCandidates
          .filter((c) => c.status === "screening")
          .length.toString(),
        change: "pending",
        icon: TrendingUp,
        color: "text-success",
      },
    ],
    manager: [
      {
        title: "Team Size",
        value: totalEmployees.toString(),
        change: "members",
        icon: Users,
        color: "text-primary",
      },
      {
        title: "Open Roles",
        value: openJobs.toString(),
        change: "hiring",
        icon: Briefcase,
        color: "text-secondary",
      },
      {
        title: "Applications",
        value: totalCandidates.toString(),
        change: "reviewing",
        icon: TrendingUp,
        color: "text-success",
      },
      {
        title: "Interviews",
        value: activeCandidates
          .filter((c) => c.status === "interviewing")
          .length.toString(),
        change: "scheduled",
        icon: AlertCircle,
        color: "text-warning",
      },
    ],
    employee: [
      {
        title: "My Profile",
        value: "100%",
        change: "complete",
        icon: TrendingUp,
        color: "text-success",
      },
      {
        title: "Open Jobs",
        value: openJobs.toString(),
        change: "available",
        icon: Briefcase,
        color: "text-primary",
      },
      {
        title: "Team Size",
        value: totalEmployees.toString(),
        change: "colleagues",
        icon: Users,
        color: "text-secondary",
      },
      {
        title: "Applications",
        value: totalCandidates.toString(),
        change: "pipeline",
        icon: Brain,
        color: "text-accent",
      },
    ],
  };

  const currentStats =
    stats[user?.role as keyof typeof stats] || stats.employee;

  // Show loading if any store is loading
  if (employeesLoading || jobsLoading || candidatesLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Welcome Header */}
        <div className="relative">
          <h1 className="mb-2 animate-fade-in text-3xl font-bold">
            Welcome back, {user?.email.split("@")[0]}! 👋
          </h1>
          <p
            className="animate-fade-in text-muted-foreground"
            style={{ animationDelay: "0.1s" }}
          >
            {user?.role === "admin" &&
              "Here's your company overview and AI-powered insights."}
            {user?.role === "recruiter" &&
              "Ready to find the perfect candidates with AI assistance."}
            {user?.role === "manager" &&
              "Track your team's performance and development."}
            {user?.role === "employee" &&
              "Your personalized career development dashboard."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {currentStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="card-hover glass-dark animate-scale-in transition-all hover:shadow-glow"
                style={{ animationDelay: `${index * 0.1}s` }}
                role="article"
                aria-label={`${stat.title}: ${stat.value}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon
                    className={`h-4 w-4 ${stat.color} transition-transform hover:scale-125`}
                  />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className="mt-2 transition-all hover:scale-105"
                    >
                      {stat.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Management Panel for Admin - Temporarily disabled */}
        {/* <DataManagementPanel /> */}

        {/* AI Insights Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="glass-dark animate-fade-in bg-gradient-card transition-all hover:shadow-glow"
            style={{ animationDelay: "0.4s" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Intelligent recommendations for your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.role === "recruiter" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">
                        High-match candidates detected
                      </p>
                      <p className="text-sm text-muted-foreground">
                        5 candidates scored 90%+ for Senior Developer role
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-secondary" />
                    <div>
                      <p className="font-medium">AI screening completed</p>
                      <p className="text-sm text-muted-foreground">
                        12 candidates interviewed via AI chat this week
                      </p>
                    </div>
                  </div>
                </>
              )}
              {user?.role === "manager" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-warning" />
                    <div>
                      <p className="font-medium">Skill gap identified</p>
                      <p className="text-sm text-muted-foreground">
                        Team needs training in system architecture
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-success" />
                    <div>
                      <p className="font-medium">Performance trending up</p>
                      <p className="text-sm text-muted-foreground">
                        Overall team productivity increased 15%
                      </p>
                    </div>
                  </div>
                </>
              )}
              {user?.role === "employee" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">New learning path available</p>
                      <p className="text-sm text-muted-foreground">
                        AI generated personalized development plan for you
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-2 w-2 rounded-full bg-accent" />
                    <div>
                      <p className="font-medium">Skill milestone reached</p>
                      <p className="text-sm text-muted-foreground">
                        You completed the Advanced React course!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card
            className="glass-dark animate-fade-in transition-all hover:shadow-glow"
            style={{ animationDelay: "0.5s" }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-secondary" />
                Development Progress
              </CardTitle>
              <CardDescription>
                {user?.role === "employee"
                  ? "Your learning journey"
                  : "Team development overview"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">System Design</span>
                  <span className="text-sm text-muted-foreground">65%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Leadership Skills</span>
                  <span className="text-sm text-muted-foreground">80%</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Technical Writing</span>
                  <span className="text-sm text-muted-foreground">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
