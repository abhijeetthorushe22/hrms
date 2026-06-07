import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/useAuthStore";
import { EmployeeDocuments } from "@/components/employee/EmployeeDocuments";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  Award,
  Clock,
  Edit,
  Download,
  FileText,
  TrendingUp,
  Users,
  Briefcase,
  Loader2,
  AlertCircle,
  Star,
  Target,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  employeeId: string;
  hireDate: string;
  salary?: number;
  status: "active" | "inactive" | "terminated";
  manager?: string;
  location?: string;
  skills?: string[];
  bio?: string;
  avatar?: string;
}

interface PerformanceReview {
  _id: string;
  period: string;
  score: number;
  feedback: string;
  goals: string[];
  achievements: string[];
  reviewDate: string;
  reviewerId: string;
  reviewerName: string;
}

interface TimeOffRequest {
  _id: string;
  type: "vacation" | "sick" | "personal" | "other";
  startDate: string;
  endDate: string;
  days: number;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  requestDate: string;
}

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch employee details
      const employeeResponse = await fetch(`/api/employees/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (employeeResponse.ok) {
        const employeeData = await employeeResponse.json();
        setEmployee(employeeData);

        // Fetch performance reviews
        const reviewsResponse = await fetch(`/api/employees/${id}/reviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData);
        }

        // Fetch time off requests
        const timeOffResponse = await fetch(`/api/employees/${id}/time-off`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (timeOffResponse.ok) {
          const timeOffData = await timeOffResponse.json();
          setTimeOffRequests(timeOffData);
        }
      } else {
        setError("Failed to load employee information");
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setError("An error occurred while loading employee data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "terminated":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTimeOffStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const calculateTenure = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const years = now.getFullYear() - hire.getFullYear();
    const months = now.getMonth() - hire.getMonth();

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""} ${months} month${
        months !== 1 ? "s" : ""
      }`;
    }
    return `${months} month${months !== 1 ? "s" : ""}`;
  };

  const getAverageScore = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.score, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const handleEditProfile = () => {
    navigate(`/employees/${id}/edit`);
  };

  const handleSendEmail = () => {
    if (employee?.email) {
      window.open(`mailto:${employee.email}`, "_blank");
    }
  };

  const handleStartReview = () => {
    navigate(`/employees/${id}/review/new`);
  };

  const handleExportProfile = () => {
    if (!employee) return;

    const profileData = {
      name: employee.name,
      email: employee.email,
      position: employee.position,
      department: employee.department,
      hireDate: employee.hireDate,
      tenure: calculateTenure(employee.hireDate),
      averageScore: getAverageScore(),
      reviewCount: reviews.length,
      timeOffUsed: timeOffRequests
        .filter((req) => req.status === "approved")
        .reduce((acc, req) => acc + req.days, 0),
    };

    const blob = new Blob([JSON.stringify(profileData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${employee.name}_Profile.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading employee details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !employee) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-2xl font-semibold">
            Unable to Load Employee
          </h2>
          <p className="mb-4 text-muted-foreground">
            {error || "The employee you're looking for doesn't exist."}
          </p>
          <Button onClick={() => navigate("/employees")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
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
            <Button variant="ghost" onClick={() => navigate("/employees")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{employee.name}</h1>
                <p className="text-muted-foreground">
                  {employee.position} • {employee.department}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getStatusColor(employee.status)}>
              {employee.status}
            </Badge>
            {(user?.role === "admin" || user?.role === "manager") && (
              <Button onClick={handleEditProfile}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tenure</p>
                  <p className="font-semibold">
                    {calculateTenure(employee.hireDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avg Performance
                  </p>
                  <p className="font-semibold">{getAverageScore()}/5.0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time Off Used</p>
                  <p className="font-semibold">
                    {timeOffRequests
                      .filter((req) => req.status === "approved")
                      .reduce((acc, req) => acc + req.days, 0)}{" "}
                    days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                  <p className="font-semibold">{reviews.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="time-off">Time Off</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Personal Information */}
              <div className="space-y-6 lg:col-span-2">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Full Name
                        </p>
                        <p className="font-medium">{employee.name}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Employee ID
                        </p>
                        <p className="font-medium">{employee.employeeId}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Email
                        </p>
                        <p className="font-medium">{employee.email}</p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Phone
                        </p>
                        <p className="font-medium">
                          {employee.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Location
                        </p>
                        <p className="font-medium">
                          {employee.location || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Manager
                        </p>
                        <p className="font-medium">
                          {employee.manager || "Not assigned"}
                        </p>
                      </div>
                    </div>
                    {employee.bio && (
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Bio
                        </p>
                        <p className="text-sm">{employee.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills */}
                {employee.skills && employee.skills.length > 0 && (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Award className="h-5 w-5" />
                        <span>Skills</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {employee.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Work Information */}
              <div className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="h-5 w-5" />
                      <span>Work Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        Position
                      </p>
                      <p className="font-medium">{employee.position}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        Department
                      </p>
                      <p className="font-medium">{employee.department}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        Hire Date
                      </p>
                      <p className="font-medium">
                        {new Date(employee.hireDate).toLocaleDateString()}
                      </p>
                    </div>
                    {employee.salary &&
                      (user?.role === "admin" || user?.role === "manager") && (
                        <div>
                          <p className="mb-1 text-sm text-muted-foreground">
                            Salary
                          </p>
                          <p className="font-medium">
                            ${employee.salary.toLocaleString()}
                          </p>
                        </div>
                      )}
                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        Status
                      </p>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                {(user?.role === "admin" || user?.role === "manager") && (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleSendEmail}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleStartReview}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Start Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleExportProfile}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Profile
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Performance Reviews</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div
                            key={review._id}
                            className="rounded-lg border p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">
                                  {review.period}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Reviewed by {review.reviewerName} on{" "}
                                  {new Date(
                                    review.reviewDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {review.score}/5.0
                                </div>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.score
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="mb-1 text-sm font-medium">
                                  Feedback
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {review.feedback}
                                </p>
                              </div>
                              {review.achievements.length > 0 && (
                                <div>
                                  <p className="mb-1 text-sm font-medium">
                                    Key Achievements
                                  </p>
                                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                                    {review.achievements.map(
                                      (achievement, index) => (
                                        <li key={index}>{achievement}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                              {review.goals.length > 0 && (
                                <div>
                                  <p className="mb-1 text-sm font-medium">
                                    Goals
                                  </p>
                                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                                    {review.goals.map((goal, index) => (
                                      <li key={index}>{goal}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                          No Performance Reviews
                        </h3>
                        <p className="text-muted-foreground">
                          No performance reviews have been conducted yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="mb-2 text-3xl font-bold text-primary">
                        {getAverageScore()}/5.0
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Average Score
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Reviews:</span>
                        <span>{reviews.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Latest Review:</span>
                        <span>
                          {reviews.length > 0
                            ? new Date(
                                reviews[0].reviewDate
                              ).toLocaleDateString()
                            : "None"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="time-off" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Time Off Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeOffRequests.length > 0 ? (
                  <div className="space-y-4">
                    {timeOffRequests.map((request) => (
                      <div key={request._id} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge
                              className={getTimeOffStatusColor(request.status)}
                            >
                              {request.status}
                            </Badge>
                            <span className="font-medium capitalize">
                              {request.type}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.days} day{request.days !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Start Date</p>
                            <p>
                              {new Date(request.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">End Date</p>
                            <p>
                              {new Date(request.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {request.reason && (
                          <div className="mt-2">
                            <p className="mb-1 text-sm text-muted-foreground">
                              Reason
                            </p>
                            <p className="text-sm">{request.reason}</p>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground">
                          Requested on{" "}
                          {new Date(request.requestDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No Time Off Requests
                    </h3>
                    <p className="text-muted-foreground">
                      No time off requests have been submitted.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <EmployeeDocuments
              employeeId={employee._id}
              canManage={user?.role === "admin" || user?.role === "manager"}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
