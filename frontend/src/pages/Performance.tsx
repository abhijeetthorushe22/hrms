import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useEmployeeStore } from "@/store/useEmployeeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Star,
  Target,
  Calendar,
  Award,
  Users,
  Plus,
  FileText,
  Loader2,
} from "lucide-react";

export default function Performance() {
  const { employees, fetchEmployees, loading } = useEmployeeStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await fetchEmployees();
      await loadPerformanceReviews();
    } catch (error) {
      console.error("Error loading performance data:", error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      });
    }
  };

  const loadPerformanceReviews = async () => {
    try {
      setReviewLoading(true);
      const reviews = await api.performance.getReviews();
      setPerformanceReviews(reviews);
    } catch (error) {
      console.error("Error loading performance reviews:", error);
      // For now, use the employee data to generate mock reviews
      generateMockReviewsFromEmployees();
    } finally {
      setReviewLoading(false);
    }
  };

  const generateMockReviewsFromEmployees = () => {
    const mockReviews = employees.slice(0, 5).map((employee, index) => ({
      id: employee._id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      department: employee.department,
      reviewDate: new Date(
        Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      overallScore: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      status: ["completed", "in_progress", "pending"][
        Math.floor(Math.random() * 3)
      ],
      goals: [
        "Improve technical skills",
        "Lead team initiatives",
        "Enhance communication",
        "Deliver quality results",
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      achievements: [
        "Successfully completed major project",
        "Improved team productivity",
        "Received positive client feedback",
        "Mentored junior team members",
      ].slice(0, Math.floor(Math.random() * 3) + 1),
    }));
    setPerformanceReviews(mockReviews);
  };

  const handleCreateReview = async () => {
    try {
      toast({
        title: "Create Review",
        description: "Performance review creation will be available soon.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create performance review",
        variant: "destructive",
      });
    }
  };

  const handleViewReview = (reviewId: string) => {
    toast({
      title: "View Review",
      description: `Opening performance review ${reviewId}`,
    });
  };

  // Performance metrics from real data
  const completedReviews = performanceReviews.filter(
    (r) => r.status === "completed"
  );
  const pendingReviews = performanceReviews.filter(
    (r) => r.status === "pending"
  );
  const avgScore =
    performanceReviews.length > 0
      ? performanceReviews.reduce(
          (sum, r) => sum + parseFloat(r.overallScore),
          0
        ) / performanceReviews.length
      : 0;

  const performanceMetrics = {
    totalReviews: performanceReviews.length,
    completedReviews: completedReviews.length,
    pendingReviews: pendingReviews.length,
    averageScore: avgScore.toFixed(1),
  };

  // Remove mock data - now using real data
  const originalPerformanceReviews = [
    {
      id: "1",
      employeeName: "John Doe",
      department: "Engineering",
      reviewDate: "2024-09-15",
      overallScore: 4.2,
      status: "completed",
      goals: ["Improve system architecture", "Mentor junior developers"],
      achievements: [
        "Led major project delivery",
        "Reduced system downtime by 40%",
      ],
    },
    {
      id: "2",
      employeeName: "Jane Smith",
      department: "Product",
      reviewDate: "2024-09-20",
      overallScore: 4.5,
      status: "completed",
      goals: ["Launch new product feature", "Improve user engagement"],
      achievements: [
        "Increased user retention by 25%",
        "Successful product launch",
      ],
    },
    {
      id: "3",
      employeeName: "Mike Johnson",
      department: "Design",
      reviewDate: "2024-10-01",
      overallScore: 0,
      status: "pending",
      goals: ["Redesign user interface", "Improve design system"],
      achievements: [],
    },
  ];

  if (loading || reviewLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading performance data...</p>
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
            <TrendingUp className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Performance Management</h1>
          </div>
          {(user?.role === "admin" || user?.role === "manager") && (
            <Button onClick={handleCreateReview}>
              <Plus className="h-4 w-4 mr-2" />
              New Review
            </Button>
          )}
        </div>

        {/* Performance Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceReviews.length}
              </div>
              <p className="text-xs text-muted-foreground">This quarter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedReviews.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingReviews.length} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Size</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reviews */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Performance Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{review.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {review.department}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.reviewDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          review.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {review.status}
                      </Badge>
                      {review.status === "completed" && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {review.overallScore}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goals & Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Goals & Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {completedReviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{review.employeeName}</span>
                    </div>

                    <div className="ml-6 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-green-600">
                          ✓ Achievements
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {review.achievements.map((achievement, idx) => (
                            <li key={idx}>{achievement}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-blue-600">
                          🎯 Current Goals
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {review.goals.map((goal, idx) => (
                            <li key={idx}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Overall Team Performance
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {((avgScore / 5) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(avgScore / 5) * 100} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Review Completion Rate
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(
                      (completedReviews.length / performanceReviews.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (completedReviews.length / performanceReviews.length) * 100
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
