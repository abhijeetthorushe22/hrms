import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, User, BookOpen } from "lucide-react";

interface SkillGap {
  area: string;
  justification: string;
  learningResources: string[];
  internalActions: string[];
}

interface SkillGapCardProps {
  area: string;
  justification: string;
  learningResources: string[];
  internalActions: string[];
}

export function SkillGapCard({
  area,
  justification,
  learningResources,
  internalActions,
}: SkillGapCardProps) {
  return (
    <Card
      className="card-hover glass-dark animate-scale-in transition-all hover:scale-105 hover:shadow-glow"
      role="article"
      aria-label={`Skill gap: ${area}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20 transition-transform hover:scale-110 hover:shadow-md">
            <BookOpen className="h-4 w-4 text-secondary" />
          </div>
          {area}
        </CardTitle>
        <CardDescription>{justification}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Learning Resources */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ExternalLink className="h-4 w-4" />
            Recommended Courses
          </h4>
          <div className="space-y-2">
            {learningResources.map((resource, index) => (
              <a
                key={index}
                href="#"
                className="block text-sm text-primary transition-all hover:translate-x-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View course: ${resource}`}
              >
                {resource}
              </a>
            ))}
          </div>
        </div>

        {/* Internal Actions */}
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4" />
            Internal Actions
          </h4>
          <div className="space-y-2">
            {internalActions.map((action, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-accent" />
                <p className="text-sm text-muted-foreground">{action}</p>
              </div>
            ))}
          </div>
        </div>

        <Button
          className="w-full bg-secondary transition-all hover:scale-105 hover:shadow-glow"
          aria-label={`Start learning path for ${area}`}
        >
          Start Learning Path
        </Button>
      </CardContent>
    </Card>
  );
}
