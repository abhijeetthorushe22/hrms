import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SkillGapCard } from '@/components/development/SkillGapCard';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { Brain, RefreshCw, TrendingUp, Target, Award, BookOpen, Users, ExternalLink } from 'lucide-react';

export default function MyDevelopment() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { 
    developmentPlans, 
    loading, 
    error, 
    getDevelopmentPlan, 
    generateDevelopmentPlan 
  } = useEmployeeStore();

  // Get current user's employee ID
  const employeeId = user?.employee_id;
  const currentPlan = employeeId ? developmentPlans[employeeId] : null;

  useEffect(() => {
    if (employeeId) {
      // Try to fetch existing development plan
      getDevelopmentPlan(employeeId).catch(() => {
        // If no plan exists, that's ok - user can generate one
        console.log('No existing development plan found');
      });
    }
  }, [employeeId, getDevelopmentPlan]);

  const handleGeneratePlan = async () => {
    if (!employeeId) {
      toast({
        title: "Error",
        description: "Employee ID not found. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateDevelopmentPlan(employeeId);
      toast({
        title: "Success",
        description: "Your personalized development plan has been generated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate development plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Development Plan</h1>
            <p className="text-muted-foreground">
              AI-powered personalized learning pathways for your career growth
            </p>
          </div>
          <Button
            onClick={handleGeneratePlan}
            disabled={isGenerating || loading}
            className="bg-primary transition-all hover:scale-105 hover:shadow-glow"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : currentPlan ? 'Regenerate Plan' : 'Generate Plan'}
          </Button>
        </div>

        {/* AI Insight Banner */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">AI-Powered Development Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes your performance reviews, career goals, and current skills to create 
                  a personalized development plan with specific learning resources and actionable steps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Plan Content */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Loading your development plan...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={handleGeneratePlan} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !currentPlan && !error && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Ready to Grow Your Career?</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Generate your personalized AI development plan based on your performance reviews, 
                  skills, and career goals.
                </p>
                <Button onClick={handleGeneratePlan} size="lg" className="bg-primary">
                  <Brain className="h-5 w-5 mr-2" />
                  Generate My Development Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentPlan && (
          <>
            {/* Plan Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Development Plan Overview
                    </CardTitle>
                    <CardDescription>
                      Generated on {formatDate(currentPlan.generatedAt)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {currentPlan.planJson.growthAreas.length} Growth Areas
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Growth Areas */}
            <div className="space-y-4">
              {currentPlan.planJson.growthAreas.map((area, index) => (
                <SkillGapCard
                  key={index}
                  area={area.area}
                  justification={area.justification}
                  learningResources={area.learningResources}
                  internalActions={area.internalActions}
                />
              ))}
            </div>

            {/* Action Items Summary */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-secondary" />
                    Learning Resources
                  </CardTitle>
                  <CardDescription>
                    External courses and materials recommended for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentPlan.planJson.growthAreas.flatMap(area => 
                    area.learningResources.map((resource, idx) => (
                      <div key={`${area.area}-${idx}`} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{resource}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-accent" />
                    Internal Actions
                  </CardTitle>
                  <CardDescription>
                    Actions you can take within your current role
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentPlan.planJson.growthAreas.flatMap(area => 
                    area.internalActions.map((action, idx) => (
                      <div key={`${area.area}-${idx}`} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{action}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Development Progress Simulation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Development Progress
                </CardTitle>
                <CardDescription>
                  Track your progress in key skill areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentPlan.planJson.growthAreas.map((area, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{area.area}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.floor(Math.random() * 30) + 20}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.floor(Math.random() * 30) + 20} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}