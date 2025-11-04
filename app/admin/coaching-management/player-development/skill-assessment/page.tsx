"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Save } from "lucide-react";
import { format } from "date-fns";

// 1. Data Structures
interface Player {
  id: string;
  name: string;
}

interface Session {
  id: string;
  date: string;
  location: string;
  type: string;
}

// Based on ISkillAssessment.ts
interface SkillAssessment {
  skill1Score: number;
  skill2Score: number;
  skill3Score: number;
  skill4Score: number;
  skill5Score: number;
  comments: string;
}

// 2. Main Component Logic
function SkillAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");

  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [roster, setRoster] = useState<Player[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  const [assessment, setAssessment] = useState<SkillAssessment>({
    skill1Score: 3,
    skill2Score: 3,
    skill3Score: 3,
    skill4Score: 3,
    skill5Score: 3,
    comments: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. Fetch Sessions and Roster on load
  useEffect(() => {
    if (!programId) {
      setError("No program ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch sessions (API exists)
        const sessionRes = await fetch(
          `/api/admin/coaching/sessions?programId=${programId}`
        );
        if (!sessionRes.ok) throw new Error("Failed to fetch sessions.");
        setSessions(await sessionRes.json());

        // Fetch roster (API exists)
        const rosterRes = await fetch(
          `/api/admin/coaching/roster?programId=${programId}`
        );
        if (!rosterRes.ok) throw new Error("Failed to fetch program roster.");
        setRoster(await rosterRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [programId]);

  // 4. Fetch existing assessment when session/player changes
  useEffect(() => {
    if (!selectedSessionId || !selectedPlayerId) {
      setAssessment({
        skill1Score: 3, skill2Score: 3, skill3Score: 3, 
        skill4Score: 3, skill5Score: 3, comments: ""
      });
      return;
    }

    const fetchAssessment = async () => {
      setIsLoading(true);
      try {
        // --- THIS API DOES NOT EXIST YET ---
        const response = await fetch(
          `/api/admin/coaching/assessment?sessionId=${selectedSessionId}&playerId=${selectedPlayerId}`
        );
        if (response.ok) {
          const data = await response.json();
          setAssessment(data);
        } else {
          // No assessment found, reset to default
          setAssessment({
            skill1Score: 3, skill2Score: 3, skill3Score: 3, 
            skill4Score: 3, skill5Score: 3, comments: ""
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch assessment");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssessment();
  }, [selectedSessionId, selectedPlayerId]);

  // 5. Handle form changes
  const handleSliderChange = (skillName: string, value: number[]) => {
    setAssessment((prev) => ({
      ...prev,
      [skillName]: value[0],
    }));
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssessment((prev) => ({
      ...prev,
      comments: e.target.value,
    }));
  };

  // 6. Handle saving the assessment
  const handleSaveAssessment = async () => {
    if (!selectedSessionId || !selectedPlayerId) {
      setError("Please select both a session and a player.");
      return;
    }
    setError(null);
    setIsSaving(true);

    try {
      // --- THIS API DOES NOT EXIST YET ---
      const response = await fetch("/api/admin/coaching/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          playerId: selectedPlayerId,
          ...assessment,
        }),
      });

      if (!response.ok) throw new Error("Failed to save assessment.");

      alert("Assessment saved successfully!");
      // Optionally, clear selection to assess another player
      // setSelectedPlayerId("");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // 7. Calculate total performance
  const totalScore =
    assessment.skill1Score +
    assessment.skill2Score +
    assessment.skill3Score +
    assessment.skill4Score +
    assessment.skill5Score;
  const averageScore = (totalScore / 5).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Skill Assessment</h1>
          <p className="text-lg text-gray-600">
            Rate player performance on a 1-5 scale for a specific session.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Assessment Form</CardTitle>
            <CardDescription>
              Select a session and a player to begin assessment.
            </CardDescription>
            {/* Session and Player Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <Select onValueChange={setSelectedSessionId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="1. Select a Session..." />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {format(new Date(session.date), "PPP")} - {session.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                onValueChange={setSelectedPlayerId}
                disabled={isLoading || !selectedSessionId}
                value={selectedPlayerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="2. Select a Player..." />
                </SelectTrigger>
                <SelectContent>
                  {roster.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          {selectedSessionId && selectedPlayerId && (
            <>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <CardContent className="space-y-8 pt-6">
                  {/* Skill Sliders */}
                  <SkillSlider
                    label="Skill 1: Passing"
                    value={assessment.skill1Score}
                    onChange={(val) => handleSliderChange("skill1Score", val)}
                  />
                  <SkillSlider
                    label="Skill 2: Cutting"
                    value={assessment.skill2Score}
                    onChange={(val) => handleSliderChange("skill2Score", val)}
                  />
                  <SkillSlider
                    label="Skill 3: Defense"
                    value={assessment.skill3Score}
                    onChange={(val) => handleSliderChange("skill3Score", val)}
                  />
                  <SkillSlider
                    label="Skill 4: Spirit & Attitude"
                    value={assessment.skill4Score}
                    onChange={(val) => handleSliderChange("skill4Score", val)}
                  />
                  <SkillSlider
                    label="Skill 5: Game Sense"
                    value={assessment.skill5Score}
                    onChange={(val) => handleSliderChange("skill5Score", val)}
                  />
                  
                  {/* Summary */}
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold">Total Performance</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {averageScore} / 5.0
                    </p>
                    <p className="text-sm text-gray-500">
                      Total score: {totalScore} / 25
                    </p>
                  </div>

                  {/* Comments */}
                  <div>
                    <Label htmlFor="comments" className="text-base font-semibold">
                      Coach Comments
                    </Label>
                    <Textarea
                      id="comments"
                      placeholder="Add specific feedback for the player..."
                      rows={5}
                      value={assessment.comments}
                      onChange={handleCommentsChange}
                    />
                  </div>
                </CardContent>
              )}
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSaveAssessment}
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Assessment
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
        
        {/* Navigation */}
        <div className="flex justify-end mt-8">
           <Button
            onClick={() => router.push(
              `/admin/coaching-management/player-development/feedback?programId=${programId}`
            )}
          >
            Next: View All Feedback
          </Button>
        </div>
      </div>
    </div>
  );
}

// 8. Reusable Skill Slider Component
function SkillSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label htmlFor={label} className="text-base font-medium">
          {label}
        </Label>
        <span className="text-lg font-bold text-blue-600 w-10 text-center">
          {value}
        </span>
      </div>
      <Slider
        id={label}
        min={1}
        max={5}
        step={1}
        value={[value]}
        onValueChange={onChange}
      />
    </div>
  );
}

// 9. Export with Suspense wrapper
export default function SkillAssessmentPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <SkillAssessmentPage />
    </Suspense>
  )
}