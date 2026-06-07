import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { api, TeamMemberWithInsights, TeamStats } from "@/lib/api";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

const getStatusColor = (status: TeamMemberWithInsights["status"]) => {
  const colors = {
    active: "bg-green-100 text-green-800",
    away: "bg-yellow-100 text-yellow-800",
    busy: "bg-red-100 text-red-800",
  };
  return colors[status];
};

const getRiskColor = (risk: "low" | "medium" | "high") => {
  const colors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };
  return colors[risk];
};

const getRiskIcon = (risk: "low" | "medium" | "high") => {
  const icons = {
    low: CheckCircle,
    medium: Clock,
    high: AlertTriangle,
  };
  return icons[risk];
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export default function Team() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithInsights[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch team data on component mount
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch members first
        console.log("Fetching team members...");
        const membersData = await api.team.getTeamMembers();
        setTeamMembers(membersData);
        console.log("Team members loaded:", membersData.length);

        // Try to fetch stats (optional, continue if it fails)
        try {
          console.log("Fetching team stats...");
          const statsData = await api.team.getTeamStats();
          setTeamStats(statsData);
          console.log("Team stats loaded:", statsData);
        } catch (statsError) {
          console.warn("Team stats failed to load:", statsError);
          // Use fallback stats
          setTeamStats({
            totalMembers: membersData.length,
            activeMembers: membersData.length,
            departments: [...new Set(membersData.map((m) => m.department))],
            averagePerformance: 75,
            averageCollaboration: 75,
            topPerformers: [],
            recentJoiners: [],
          });
        }
      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Failed to load team data. Please try again.");
        toast({
          title: "Error",
          description:
            "Failed to load team data. Please check your connection.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [toast]);

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleAddMember = () => {
    toast({
      title: "Add Team Member",
      description: "Team member addition functionality will be available soon.",
    });
  };

  const handleSendMessage = (member: TeamMemberWithInsights) => {
    toast({
      title: "Message Sent",
      description: `Message sent to ${member.name}`,
    });
  };

  const departments = [
    "all",
    ...Array.from(new Set(teamMembers.map((m) => m.department))),
  ];

  const departmentStats = departments.slice(1).map((dept) => ({
    name: dept,
    count: teamMembers.filter((m) => m.department === dept).length,
    avgPerformance: Math.round(
      teamMembers
        .filter((m) => m.department === dept)
        .reduce((sum, m) => sum + m.performanceScore, 0) /
        teamMembers.filter((m) => m.department === dept).length
    ),
  }));

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-muted-foreground">Loading team data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-600" />
            <p className="mb-4 text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
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
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">My Team</h1>
          </div>
          <Button onClick={handleAddMember}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>

        {/* Team Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {teamStats?.totalMembers || teamMembers.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {teamStats?.averagePerformance ||
                      (teamMembers.length > 0
                        ? Math.round(
                            teamMembers.reduce(
                              (sum, m) => sum + m.performanceScore,
                              0
                            ) / teamMembers.length
                          )
                        : 0)}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Avg Performance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {teamMembers.reduce(
                      (sum, m) => sum + (m.projectsCount || 0),
                      0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Active Projects
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {teamStats?.departments.length || departments.length - 1}
                  </p>
                  <p className="text-xs text-muted-foreground">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departmentStats.map((dept) => (
                <div key={dept.name} className="rounded-lg border p-4">
                  <h3 className="font-medium">{dept.name}</h3>
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>{dept.count} members</span>
                    <span>{dept.avgPerformance}% avg performance</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-[hsl(var(--primary))] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option
                    value="all"
                    className="bg-[hsl(var(--primary))] text-white"
                  >
                    All Departments
                  </option>
                  {departments.slice(1).map((dept) => (
                    <option
                      key={dept}
                      value={dept}
                      className="bg-[hsl(var(--primary))] text-white"
                    >
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMembers.map((member, index) => (
                <div key={member._id}>
                  <div className="group rounded-lg transition-colors hover:bg-[hsl(var(--primary))] hover:text-white">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="group-hover:!text-white">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium group-hover:text-white">
                              {member.name}
                            </h3>
                            <Badge
                              className={`${getStatusColor(member.status)} group-hover:bg-white/10 group-hover:!text-white`}
                            >
                              {member.status}
                            </Badge>
                            {member.insights?.riskLevel && (
                              <Badge
                                className={`${getRiskColor(member.insights.riskLevel)} group-hover:bg-white/10 group-hover:!text-white`}
                              >
                                {React.createElement(
                                  getRiskIcon(member.insights.riskLevel),
                                  {
                                    className:
                                      "h-3 w-3 mr-1 group-hover:fill-white group-hover:text-white",
                                  }
                                )}
                                {member.insights.riskLevel} risk
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground group-hover:!text-white">
                            {member.role} • {member.department}
                          </p>
                          <div className="mt-1 flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center group-hover:!text-white">
                              <Mail className="mr-1 h-3 w-3 group-hover:!text-white" />
                              {member.email}
                            </span>
                            <span className="flex items-center group-hover:!text-white">
                              <Calendar className="mr-1 h-3 w-3 group-hover:!text-white" />
                              Joined{" "}
                              {new Date(member.joinDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600 group-hover:!text-white">
                            {member.performanceScore}%
                          </p>
                          <p className="text-xs text-muted-foreground group-hover:!text-white">
                            Performance
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600 group-hover:!text-white">
                            {member.collaborationScore}%
                          </p>
                          <p className="text-xs text-muted-foreground group-hover:!text-white">
                            Collaboration
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold group-hover:!text-white">
                            {member.projectsCount || 0}
                          </p>
                          <p className="text-xs text-muted-foreground group-hover:!text-white">
                            Projects
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMessage(member)}
                          >
                            <MessageSquare className="h-4 w-4 group-hover:!text-white" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`mailto:${member.email}`)
                            }
                          >
                            <Mail className="h-4 w-4 group-hover:!text-white" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights Section */}
                    {member.insights && (
                      <div className="mt-4 px-4 pb-4">
                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                          {member.insights.strengths &&
                            member.insights.strengths.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-green-700 group-hover:text-white">
                                  Strengths
                                </h4>
                                <ul className="space-y-1">
                                  {member.insights.strengths.map(
                                    (strength, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start text-muted-foreground group-hover:text-white"
                                      >
                                        <CheckCircle className="mr-2 mt-0.5 h-3 w-3 text-green-600 group-hover:text-white" />
                                        <span className="text-xs">
                                          {strength}
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {member.insights.growthAreas &&
                            member.insights.growthAreas.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-orange-700 group-hover:text-white">
                                  Growth Areas
                                </h4>
                                <ul className="space-y-1">
                                  {member.insights.growthAreas.map(
                                    (area, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start text-muted-foreground group-hover:text-white"
                                      >
                                        <TrendingUp className="mr-2 mt-0.5 h-3 w-3 text-orange-600 group-hover:text-white" />
                                        <span className="text-xs">{area}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {member.insights.recommendations &&
                            member.insights.recommendations.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-blue-700 group-hover:text-white">
                                  Recommendations
                                </h4>
                                <ul className="space-y-1">
                                  {member.insights.recommendations.map(
                                    (rec, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start text-muted-foreground group-hover:text-white"
                                      >
                                        <Award className="mr-2 mt-0.5 h-3 w-3 text-blue-600 group-hover:text-white" />
                                        <span className="text-xs">{rec}</span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                  {index < filteredMembers.length - 1 && <Separator />}
                </div>
              ))}
              {filteredMembers.length === 0 && (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-muted-foreground">
                    No team members found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
