import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  Award,
  Play,
  CheckCircle,
  TrendingUp,
  Calendar,
  Plus,
} from "lucide-react";

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: "technical" | "leadership" | "soft-skills" | "compliance";
  duration: string;
  progress: number;
  enrolledCount: number;
  status: "not-started" | "in-progress" | "completed";
  modules: number;
  completedModules: number;
}

interface TeamSkill {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  priority: "high" | "medium" | "low";
}

const mockLearningPaths: LearningPath[] = [
  {
    id: "1",
    title: "Leadership Fundamentals",
    description: "Essential leadership skills for emerging managers",
    category: "leadership",
    duration: "8 weeks",
    progress: 75,
    enrolledCount: 12,
    status: "in-progress",
    modules: 6,
    completedModules: 4,
  },
  {
    id: "2",
    title: "Advanced JavaScript",
    description: "Deep dive into modern JavaScript concepts and frameworks",
    category: "technical",
    duration: "12 weeks",
    progress: 30,
    enrolledCount: 8,
    status: "in-progress",
    modules: 10,
    completedModules: 3,
  },
  {
    id: "3",
    title: "Effective Communication",
    description: "Improve communication skills across all mediums",
    category: "soft-skills",
    duration: "6 weeks",
    progress: 100,
    enrolledCount: 15,
    status: "completed",
    modules: 5,
    completedModules: 5,
  },
  {
    id: "4",
    title: "Data Privacy & Security",
    description: "Compliance training for data handling and security",
    category: "compliance",
    duration: "4 weeks",
    progress: 0,
    enrolledCount: 20,
    status: "not-started",
    modules: 4,
    completedModules: 0,
  },
];

const mockSkillGaps: TeamSkill[] = [
  {
    skill: "React Development",
    currentLevel: 3,
    targetLevel: 5,
    gap: 2,
    priority: "high",
  },
  {
    skill: "Project Management",
    currentLevel: 2,
    targetLevel: 4,
    gap: 2,
    priority: "high",
  },
  {
    skill: "Cloud Architecture",
    currentLevel: 2,
    targetLevel: 5,
    gap: 3,
    priority: "medium",
  },
  {
    skill: "Data Analysis",
    currentLevel: 3,
    targetLevel: 4,
    gap: 1,
    priority: "low",
  },
  {
    skill: "UX Design",
    currentLevel: 2,
    targetLevel: 4,
    gap: 2,
    priority: "medium",
  },
];

const getCategoryColor = (category: LearningPath["category"]) => {
  const colors = {
    technical: "bg-blue-100 text-blue-800",
    leadership: "bg-purple-100 text-purple-800",
    "soft-skills": "bg-green-100 text-green-800",
    compliance: "bg-orange-100 text-orange-800",
  };
  return colors[category];
};

const getStatusColor = (status: LearningPath["status"]) => {
  const colors = {
    "not-started": "bg-gray-100 text-gray-800",
    "in-progress": "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
  };
  return colors[status];
};

const getPriorityColor = (priority: TeamSkill["priority"]) => {
  const colors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };
  return colors[priority];
};

export default function Development() {
  const [learningPaths] = useState<LearningPath[]>(mockLearningPaths);
  const [skillGaps] = useState<TeamSkill[]>(mockSkillGaps);
  const { toast } = useToast();

  const handleStartPath = (path: LearningPath) => {
    toast({
      title: "Learning Path Started",
      description: `Started "${path.title}" learning path.`,
    });
  };

  const handleCreatePath = () => {
    toast({
      title: "Create Learning Path",
      description:
        "Learning path creation functionality will be available soon.",
    });
  };

  const completedPaths = learningPaths.filter(
    (p) => p.status === "completed"
  ).length;
  const inProgressPaths = learningPaths.filter(
    (p) => p.status === "in-progress"
  ).length;
  const totalEnrollments = learningPaths.reduce(
    (sum, p) => sum + p.enrolledCount,
    0
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Team Development</h1>
          </div>
          <Button onClick={handleCreatePath}>
            <Plus className="h-4 w-4 mr-2" />
            Create Learning Path
          </Button>
        </div>

        {/* Development Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{learningPaths.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Learning Paths
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{totalEnrollments}</p>
                  <p className="text-xs text-muted-foreground">
                    Total Enrollments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{inProgressPaths}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{completedPaths}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Team Skill Gap Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skillGaps.map((skill, index) => (
                <div key={skill.skill}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{skill.skill}</h4>
                      <Badge className={getPriorityColor(skill.priority)}>
                        {skill.priority} priority
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {skill.currentLevel}/5 → {skill.targetLevel}/5
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Current Level</span>
                        <span>Target Level</span>
                      </div>
                      <Progress
                        value={(skill.currentLevel / 5) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-red-600">
                        Gap: {skill.gap}
                      </span>
                    </div>
                  </div>
                  {index < skillGaps.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Paths */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {learningPaths.map((path) => (
                <Card
                  key={path.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{path.title}</h3>
                          <Badge className={getStatusColor(path.status)}>
                            {path.status.replace("-", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {path.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <Badge className={getCategoryColor(path.category)}>
                            {path.category.replace("-", " ")}
                          </Badge>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {path.duration}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {path.enrolledCount} enrolled
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{path.progress}%</span>
                        </div>
                        <Progress value={path.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {path.completedModules} of {path.modules} modules
                          completed
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                          {path.status === "completed" ? (
                            <Button variant="outline" size="sm" disabled>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleStartPath(path)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {path.status === "not-started"
                                ? "Start"
                                : "Continue"}
                            </Button>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Development Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    Sarah Johnson completed "Effective Communication" course
                  </p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    New learning path "Advanced JavaScript" was assigned to
                    Engineering team
                  </p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    Michael Chen started "Leadership Fundamentals" program
                  </p>
                  <p className="text-xs text-muted-foreground">3 days ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    Compliance training deadline reminder sent to all employees
                  </p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
