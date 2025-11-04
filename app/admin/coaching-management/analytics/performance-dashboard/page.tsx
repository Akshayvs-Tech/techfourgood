"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Loader2, AlertCircle, Download, Percent, User, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import papaparse from "papaparse"; // For CSV Export

// 1. Data Structures for the Dashboard
interface PlayerAnalytics {
  id: string;
  name: string;
  attendanceCount: number;
  attendanceRate: number;
  averageScore: number;
  assessmentsCount: number;
}

interface SessionAnalytics {
  id: string;
  date: string;
  attendanceRate: number;
}

interface DashboardData {
  programName: string;
  totalPlayers: number;
  totalSessions: number;
  overallAttendanceRate: number;
  overallAverageScore: number;
  sessionAttendanceSummary: { date: string; attendance: number }[];
  playerPerformanceSummary: { name: string; avgScore: number }[];
  playerData: PlayerAnalytics[];
}

// 2. Main Component Logic
function PerformanceDashboard() {
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId");

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Fetch all dashboard data
  useEffect(() => {
    if (!programId) {
      setError("No program ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // --- THIS IS A NEW API ROUTE WE MUST BUILD ---
        const response = await fetch(
          `/api/admin/coaching/analytics?programId=${programId}`
        );
        if (!response.ok) {
          throw new Error("Failed to load dashboard data.");
        }
        const dashboardData: DashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [programId]);

  // 4. Handle CSV Export
  const handleExport = () => {
    if (!data) return;

    // We export the detailed individual player data
    const csvData = data.playerData.map(player => ({
      "Player Name": player.name,
      "Attendance Count": player.attendanceCount,
      "Attendance Rate (%)": (player.attendanceRate * 100).toFixed(1),
      "Assessments Count": player.assessmentsCount,
      "Average Score (1-5)": player.averageScore.toFixed(2),
    }));

    const csv = papaparse.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `${data.programName}_performance_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Render Loading/Error States
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700">An Error Occurred</h2>
        <p className="text-gray-600 mt-2">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>No data found for this program.</p>
      </div>
    );
  }

  // 6. Render Dashboard
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Performance Dashboard
            </h1>
            <p className="text-xl text-blue-700 font-medium">
              {data.programName}
            </p>
          </div>
          <Button onClick={handleExport} disabled={!data.playerData.length}>
            <Download className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
        </div>

        {/* Overall Team Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Overall Attendance"
            value={`${(data.overallAttendanceRate * 100).toFixed(0)}%`}
            icon={<Percent className="h-6 w-6 text-blue-600" />}
            desc={`${data.totalSessions} Sessions`}
          />
          <StatCard
            title="Avg. Player Score"
            value={data.overallAverageScore.toFixed(2)}
            icon={<ClipboardCheck className="h-6 w-6 text-green-600" />}
            desc="/ 5.0"
          />
          <StatCard
            title="Total Players"
            value={data.totalPlayers.toString()}
            icon={<User className="h-6 w-6 text-indigo-600" />}
            desc="on Roster"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.sessionAttendanceSummary}>
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip formatter={(val: number) => [`${val}%`, "Attendance"]} />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.playerPerformanceSummary}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" fill="#16a34a" name="Average Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Individual Player Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Player Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Sessions Attended</TableHead>
                  <TableHead>Avg. Score</TableHead>
                  <TableHead>Assessments Done</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.playerData.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{(player.attendanceRate * 100).toFixed(0)}%</TableCell>
                    <TableCell>{player.attendanceCount} / {data.totalSessions}</TableCell>
                    <TableCell>{player.assessmentsCount > 0 ? player.averageScore.toFixed(2) : "N/A"}</TableCell>
                    <TableCell>{player.assessmentsCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 7. Helper component for stat cards
function StatCard({ title, value, icon, desc }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  desc?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{value}</div>
        {desc && (
          <p className="text-xs text-gray-500">{desc}</p>
        )}
      </CardContent>
    </Card>
  );
}

// 8. Export with Suspense wrapper
export default function DashboardPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    }>
      <PerformanceDashboard />
    </Suspense>
  );
}