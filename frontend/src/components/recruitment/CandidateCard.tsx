import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mail, Phone, FileText, MessageSquare, Brain } from "lucide-react";

import { Candidate as ApiCandidate } from "@/lib/api";

type Candidate = ApiCandidate;

interface CandidateCardProps {
  candidate: Candidate;
  onStartChat: (candidateId: string) => void;
  onViewResume: (candidateId: string) => void;
}

const statusColors = {
  new: "bg-blue-500",
  screening: "bg-yellow-500",
  interview: "bg-purple-500",
  hired: "bg-green-500",
  rejected: "bg-gray-500",
};

const statusLabels = {
  new: "New",
  screening: "AI Screening",
  interview: "Interview",
  hired: "Hired",
  rejected: "Rejected",
};

export function CandidateCard({
  candidate,
  onStartChat,
  onViewResume,
}: CandidateCardProps) {
  // Debug: Log candidate data to see what we're getting
  console.log("CandidateCard received candidate:", candidate);
  console.log("matchScore:", candidate.matchScore);
  console.log("resumeS3Key:", candidate.resumeS3Key);
  console.log("All candidate fields:", Object.keys(candidate));

  let matchPercentage = 0;
  let isProcessing = false;
  const rawScore =
    (candidate as any).matchScore ?? (candidate as any).match_score;

  if (rawScore !== undefined && rawScore !== null) {
    if (rawScore === 0 || rawScore === 0.0) {      
      isProcessing = true;
      matchPercentage = 0;
    } else {      
      matchPercentage =
        rawScore > 1 ? Math.round(rawScore) : Math.round(rawScore * 100);
    }
  } else {
    // No matchScore field at all
    isProcessing = true;
  }

  console.log(
    "Calculated matchPercentage:",
    matchPercentage,
    "isProcessing:",
    isProcessing
  );

  return (
    <Card
      className="card-hover glass-dark animate-scale-in transition-all hover:scale-105 hover:shadow-glow"
      role="article"
      aria-label={`Candidate: ${candidate.name}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary font-bold text-white shadow-glow transition-transform hover:scale-110">
              {candidate.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h3 className="font-semibold">{candidate.name}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{candidate.email}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{candidate.phone}</span>
              </div>
            </div>
          </div>
          <Badge className={`${statusColors[candidate.status]} text-white`}>
            {statusLabels[candidate.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Match Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 font-medium">
              <Brain className="h-4 w-4 text-primary" />
              AI Match Score
            </span>
            <span className="font-bold text-primary">
              {isProcessing ? "Processing..." : `${matchPercentage}%`}
            </span>
          </div>
          <Progress value={matchPercentage} className="h-2" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 transition-all hover:scale-105 hover:shadow-md"
            onClick={() => {
              console.log(
                "View Resume clicked for candidate:",
                candidate._id,
                "resumeS3Key:",
                candidate.resumeS3Key
              );
              onViewResume(candidate._id);
            }}
            aria-label={`View resume for ${candidate.name}`}
            disabled={!candidate.resumeS3Key}
          >
            <FileText className="mr-2 h-4 w-4" />
            {candidate.resumeS3Key ? "View Resume" : "No Resume"}
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-primary transition-all hover:scale-105 hover:shadow-glow"
            onClick={() => onStartChat(candidate._id)}
            aria-label={`Start AI screening for ${candidate.name}`}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            AI Screen
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Applied {new Date(candidate.appliedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
