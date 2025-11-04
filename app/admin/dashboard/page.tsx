"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Settings,
  Users,
  Calendar,
  Trophy,
  FileText,
  Link as LinkIcon,
  Share2,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  maxTeams: number;
  registrationDeadline: string;
  status:
    | "draft"
    | "registration-open"
    | "registration-closed"
    | "in-progress"
    | "completed";
  spiritConfigured: boolean;
  teamsRegistered: number;
  teamsApproved: number;
  teamsPending: number;
  matchesScheduled: number;
  totalMatches: number;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: "completed" | "pending" | "locked";
  path: string;
  icon: React.ElementType;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");

  const [activeTab, setActiveTab] = useState<"tournaments" | "admins" | "coaches" | "programManagers" | "coaching">("tournaments");
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [admins, setAdmins] = useState<{ id: string; full_name: string; email: string; phone?: string | null; role: string }[]>([]);
  const [adminForm, setAdminForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<{ id: string; full_name: string; email: string; phone?: string | null }[]>([]);
  const [coachForm, setCoachForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [coachSaving, setCoachSaving] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [programManagers, setProgramManagers] = useState<{ id: string; full_name: string; email: string; phone?: string | null }[]>([]);
  const [pmForm, setPmForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [pmSaving, setPmSaving] = useState(false);
  const [pmError, setPmError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [upcomingSessions, setUpcomingSessions] = useState<{ id: string; program_id: string; date: string; location: string; type: string }[]>([]);
  const [pastSessions, setPastSessions] = useState<{ id: string; program_id: string; date: string; location: string; type: string }[]>([]);
  const [analytics, setAnalytics] = useState<{ programName?: string; totalPlayers?: number; totalSessions?: number; overallAttendanceRate?: number; overallAverageScore?: number } | null>(null);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const registrationUrl = tournamentId
    ? `${window.location.origin}/public/register/player?tournamentId=${tournamentId}`
    : "";

  useEffect(() => {
    const loadData = async () => {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Not authenticated:", authError);
        setError("Please login to access the admin dashboard");
        router.push("/login");
        return;
      }

      // Centralized dashboard tournaments
      const loadTournaments = async () => {
        const nowIso = new Date().toISOString();
        const { data: upcomingData, error: upcomingError } = await supabase
          .from("tournaments")
          .select("id,name,start_date,end_date,status")
          .gte("start_date", nowIso)
          .order("start_date", { ascending: true });
        if (upcomingError) {
          console.error("Error loading upcoming tournaments:", upcomingError);
        }
        
        const { data: pastData, error: pastError } = await supabase
          .from("tournaments")
          .select("id,name,start_date,end_date,status")
          .lt("start_date", nowIso)
          .order("start_date", { ascending: false });
        if (pastError) {
          console.error("Error loading past tournaments:", pastError);
        }
        
        setUpcoming(upcomingData || []);
        setPast(pastData || []);
      };
      
      const loadAdmins = async () => {
        const { data, error } = await supabase
          .from("admins")
          .select("id, full_name, email, phone, role")
          .order("full_name");
        if (error) {
          console.error("Error loading admins:", error);
          setError(`Failed to load admins: ${error.message}`);
        } else {
          setAdmins((data as any) || []);
        }
      };
      
      const loadCoaches = async () => {
        const { data, error } = await supabase
          .from("coaches")
          .select("id, full_name, email, phone")
          .order("full_name");
        if (error) {
          console.error("Error loading coaches:", error);
          setError(`Failed to load coaches: ${error.message}`);
        } else {
          setCoaches((data as any) || []);
        }
      };
      
      const loadPrograms = async () => {
        const { data, error } = await supabase
          .from("programs")
          .select("id,name")
          .order("name");
        if (error) {
          console.error("Error loading programs:", error);
        } else {
          setPrograms((data as any) || []);
        }
      };

      const loadProgramManagers = async () => {
        try {
          const res = await fetch("/api/admin/program-managers");
          if (!res.ok) throw new Error("Failed to load program managers");
          const j = await res.json();
          setProgramManagers(j.programManagers || []);
        } catch (e) {
          console.error(e);
        }
      };

      const loadSessions = async () => {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from("sessions")
          .select("id, program_id, date, location, type")
          .order("date", { ascending: true });
        if (error) {
          console.error("Error loading sessions:", error);
          return;
        }
        const all = (data as any) || [];
        setUpcomingSessions(all.filter((s: any) => s.date >= nowIso));
        setPastSessions(all.filter((s: any) => s.date < nowIso).reverse());
      };

      await Promise.all([
        loadTournaments(),
        loadAdmins(),
        loadCoaches(),
        loadPrograms(),
        loadSessions(),
        loadProgramManagers(),
      ]);
    };
    
    loadData();

    if (tournamentId) {
      fetchTournamentDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  // Load coaching analytics when a program is selected
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedProgramId) {
        setAnalytics(null);
        return;
      }
      try {
        const res = await fetch(`/api/admin/coaching/analytics?programId=${selectedProgramId}`);
        if (!res.ok) throw new Error("Failed to load analytics");
        const data = await res.json();
        setAnalytics({
          programName: data.programName,
          totalPlayers: data.totalPlayers,
          totalSessions: data.totalSessions,
          overallAttendanceRate: data.overallAttendanceRate,
          overallAverageScore: data.overallAverageScore,
        });
      } catch (e) {
        // Silent fail; keep UI usable
        setAnalytics(null);
      }
    };
    fetchAnalytics();
  }, [selectedProgramId]);

  const fetchTournamentDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load tournament and live stats directly via Supabase
      const { data: t, error: tErr } = await supabase
        .from('tournaments')
        .select('id,name,start_date,end_date,venue,max_teams,registration_deadline,status')
        .eq('id', tournamentId)
        .maybeSingle();
      if (tErr || !t) throw tErr || new Error('Not found');

      const { count: teamsRegistered } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId);
      const { count: teamsApproved } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .ilike('status', 'approved%');
      const teamsPending = Math.max((teamsRegistered || 0) - (teamsApproved || 0), 0);
      const { count: matchesScheduled } = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId);

      const mapped: Tournament = {
        id: t.id,
        name: t.name,
        startDate: t.start_date,
        endDate: t.end_date,
        venue: t.venue,
        maxTeams: t.max_teams || 0,
        registrationDeadline: t.registration_deadline,
        status: (String(t.status || 'draft').toLowerCase() as any),
        spiritConfigured: true,
        teamsRegistered: teamsRegistered || 0,
        teamsApproved: teamsApproved || 0,
        teamsPending,
        matchesScheduled: matchesScheduled || 0,
        totalMatches: matchesScheduled || 0,
      };
      setTournament(mapped);
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRegistrationLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const shareRegistrationLink = async () => {
    const shareData = {
      title: `Register for ${tournament?.name}`,
      text: `Join us for ${tournament?.name}! Register your team now.`,
      url: registrationUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      copyRegistrationLink();
    }
  };

  const openRegistrationInNewTab = () => {
    window.open(registrationUrl, "_blank");
  };

  const setupSteps: SetupStep[] = [
    {
      id: "spirit-config",
      title: "Spirit Score Configuration",
      description: "Configure spirit scoring categories and settings",
      status: tournament?.spiritConfigured ? "completed" : "pending",
      path: `/admin/setup/spirit-config?tournamentId=${tournamentId}`,
      icon: Trophy,
    },
    {
      id: "team-approval",
      title: "Team Approval",
      description: "Review and approve team registrations",
      status:
        tournament && tournament.teamsPending > 0 ? "pending" : "completed",
      path: `/admin/registration/roster-review?tournamentId=${tournamentId}`,
      icon: Users,
    },
    {
      id: "schedule-builder",
      title: "Schedule Builder",
      description: "Create tournament bracket and schedule matches",
      status:
        tournament && tournament.teamsApproved >= 4 ? "pending" : "locked",
      path: `/admin/scheduling/builder?tournamentId=${tournamentId}`,
      icon: Calendar,
    },
    {
      id: "match-assignment",
      title: "Match Assignment",
      description: "Assign fields and times to matches",
      status:
        tournament && tournament.matchesScheduled > 0 ? "completed" : "locked",
      path: `/admin/scheduling/assignment?tournamentId=${tournamentId}`,
      icon: Settings,
    },
  ];

  const quickActions = [
    {
      title: "View Schedule",
      description: "View published tournament schedule",
      icon: Calendar,
      path: `/public/schedule?tournamentId=${tournamentId}`,
      enabled: tournament && tournament.matchesScheduled > 0,
    },
    {
      title: "Data Export",
      description: "Export tournament data and reports",
      icon: FileText,
      path: `/admin/reports/data-export?tournamentId=${tournamentId}`,
      enabled: true,
    },
    {
      title: "Spirit Scores",
      description: "View submitted spirit scores",
      icon: Trophy,
      path: `/admin/reports/spirit-scores?tournamentId=${tournamentId}`,
      enabled: tournament && tournament.status !== "draft",
    },
  ];

  // Dashboard is always accessible - tournamentId is optional
  // If tournamentId is provided, show detailed tournament view
  // If not, show centralized dashboard with tabs only

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true);
    setAdminError(null);
    const res = await fetch("/api/admin/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: adminForm.fullName,
        email: adminForm.email,
        phone: adminForm.phone || null,
        password: adminForm.password || undefined,
      }),
    });
    setAdminSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setAdminError(j.message || "Failed to add admin");
      return;
    }
    setAdminForm({ fullName: "", email: "", phone: "", password: "" });
    const { data, error } = await supabase
      .from("admins")
      .select("id, full_name, email, phone, role")
      .order("full_name");
    if (!error) setAdmins((data as any) || []);
  };

  const addCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setCoachSaving(true);
    setCoachError(null);
    const res = await fetch("/api/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: coachForm.fullName,
        email: coachForm.email,
        phone: coachForm.phone || null,
        password: coachForm.password,
      }),
    });
    setCoachSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setCoachError(j.message || "Failed to add coach");
      return;
    }
    setCoachForm({ fullName: "", email: "", phone: "", password: "" });
    const { data, error } = await supabase
      .from("coaches")
      .select("id, full_name, email, phone")
      .order("full_name");
    if (!error) setCoaches((data as any) || []);
  };

  const addProgramManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setPmSaving(true);
    setPmError(null);
    const res = await fetch("/api/admin/program-managers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: pmForm.fullName,
        email: pmForm.email,
        phone: pmForm.phone || null,
        password: pmForm.password,
      }),
    });
    setPmSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setPmError(j.message || "Failed to add program manager");
      return;
    }
    setPmForm({ fullName: "", email: "", phone: "", password: "" });
    try {
      const list = await fetch("/api/admin/program-managers");
      const j = await list.json();
      setProgramManagers(j.programManagers || []);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header - hidden when viewing a specific tournament */}
        {!tournamentId && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage tournaments, admins, and coaches
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 dark:text-red-200 font-medium">Error</p>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
                <p className="text-red-600 dark:text-red-300 text-xs mt-2">
                  Tip: Make sure you've run the RLS policy fix SQL in Supabase. Check the browser console for more details.
                </p>
              </div>
              <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tabs - hidden when viewing a specific tournament */}
        {!tournamentId && (
        <div className="mb-6 flex gap-2">
          <button
            className={`px-4 py-2 rounded-md border ${activeTab === "tournaments" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"}`}
            onClick={() => setActiveTab("tournaments")}
          >
            Tournaments
          </button>
          <button
            className={`px-4 py-2 rounded-md border ${activeTab === "admins" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"}`}
            onClick={() => setActiveTab("admins")}
          >
            Admins
          </button>
          <button
            className={`px-4 py-2 rounded-md border ${activeTab === "coaches" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"}`}
            onClick={() => setActiveTab("coaches")}
          >
            Coaches
          </button>
          <button
            className={`px-4 py-2 rounded-md border ${activeTab === "programManagers" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"}`}
            onClick={() => setActiveTab("programManagers")}
          >
            Program Managers
          </button>
          <button
            className={`px-4 py-2 rounded-md border ${activeTab === "coaching" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"}`}
            onClick={() => setActiveTab("coaching")}
          >
            Coaching Sessions
          </button>
        </div>
        )}

        {!tournamentId && activeTab === "tournaments" && (
        /* Centralized Dashboard: Tournaments list */
        <div className="mb-8">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => router.push("/admin/setup/tournament-details")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Create New Tournament
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Tournaments</h2>
              </div>
            <div className="space-y-3">
              {upcoming.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-sm border rounded-md"
                      onClick={() => router.push(`/admin/setup/tournament-details?tournamentId=${t.id}`)}
                    >
                      Manage
                    </button>
                    <button
                      className="px-3 py-1 text-sm border rounded-md"
                      onClick={() => router.push(`/admin/registration/roster-review?tournamentId=${t.id}`)}
                    >
                      Roster Review
                    </button>
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="text-sm text-gray-500">No upcoming tournaments.</p>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Past Tournaments</h2>
            </div>
            <div className="space-y-3">
              {past.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium text-gray-900 dark:text:white">{t.name}</div>
                    <div className="text-xs text-gray-500">{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-sm border rounded-md"
                      onClick={() => router.push(`/admin/setup/tournament-details?tournamentId=${t.id}`)}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
              {past.length === 0 && (
                <p className="text-sm text-gray-500">No past tournaments.</p>
              )}
            </div>
          </div>
          </div>
        </div>
        )}

        {!tournamentId && activeTab === "programManagers" && (
          <div className="space-y-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Program Manager</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Program Managers can create matches and update live scores for assigned tournaments.
              </p>
              <form onSubmit={addProgramManager} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Full name"
                  value={pmForm.fullName}
                  onChange={(e) => setPmForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="border rounded-md px-3 py-2"
                  placeholder="Email"
                  value={pmForm.email}
                  onChange={(e) => setPmForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
                <input
                  type="password"
                  className="border rounded-md px-3 py-2"
                  placeholder="Password (required)"
                  value={pmForm.password}
                  onChange={(e) => setPmForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Phone (optional)"
                  value={pmForm.phone}
                  onChange={(e) => setPmForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <button type="submit" disabled={pmSaving} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  {pmSaving ? "Adding..." : "Add Program Manager"}
                </button>
              </form>
              {pmError && <p className="text-sm text-red-600 mt-2">{pmError}</p>}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {programManagers.length === 0 ? (
                <p className="p-4 text-gray-600">No program managers yet.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programManagers.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="p-3">{p.full_name}</td>
                        <td className="p-3">{p.email}</td>
                        <td className="p-3">{p.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {!tournamentId && activeTab === "admins" && (
          <div className="space-y-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Admin</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Admins are system administrators who manage the platform. They have full access to all features.
              </p>
              <form onSubmit={addAdmin} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Full name"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="border rounded-md px-3 py-2"
                  placeholder="Email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
                <input
                  type="password"
                  className="border rounded-md px-3 py-2"
                  placeholder="Password (required)"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Phone (optional)"
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <button type="submit" disabled={adminSaving} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  {adminSaving ? "Adding..." : "Add Admin"}
                </button>
              </form>
              {adminError && <p className="text-sm text-red-600 mt-2">{adminError}</p>}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {admins.length === 0 ? (
                <p className="p-4 text-gray-600">No admins yet.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="p-3">{a.full_name}</td>
                        <td className="p-3">{a.email}</td>
                        <td className="p-3">{a.phone || "-"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${a.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {a.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {!tournamentId && activeTab === "coaching" && (
          <div className="space-y-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Coaching Sessions</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">View upcoming and past sessions. Create and manage programs and sessions.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => supabase.auth.getUser().then(() => window.location.assign("/admin/coaching-management/program-setup/create-program"))}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    + Create Program
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Program (for managing sessions)</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
                    value={selectedProgramId}
                    onChange={(e) => setSelectedProgramId(e.target.value)}
                  >
                    <option value="">— Choose a program —</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 items-end">
                  <button
                    disabled={!selectedProgramId}
                    onClick={() => selectedProgramId && window.location.assign(`/admin/coaching-management/program-setup/manage-roles?programId=${selectedProgramId}`)}
                    className={`px-4 py-2 rounded-md border ${selectedProgramId ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700" : "opacity-50 cursor-not-allowed"}`}
                  >
                    Manage Roles
                  </button>
                  <button
                    disabled={!selectedProgramId}
                    onClick={() => selectedProgramId && window.location.assign(`/admin/coaching-management/training/session-scheduler?programId=${selectedProgramId}`)}
                    className={`px-4 py-2 rounded-md ${selectedProgramId ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600/50 text-white cursor-not-allowed"}`}
                  >
                    Open Scheduler
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedProgramId && (
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <p className="text-xs text-gray-500">Players</p>
                    <p className="text-2xl font-semibold">{analytics?.totalPlayers ?? '-'}</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <p className="text-xs text-gray-500">Sessions</p>
                    <p className="text-2xl font-semibold">{analytics?.totalSessions ?? '-'}</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <p className="text-xs text-gray-500">Avg Attendance</p>
                    <p className="text-2xl font-semibold">{analytics?.overallAttendanceRate != null ? `${Math.round(analytics.overallAttendanceRate*100)}%` : '-'}</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                    <p className="text-xs text-gray-500">Avg Score</p>
                    <p className="text-2xl font-semibold">{analytics?.overallAverageScore != null ? analytics.overallAverageScore.toFixed(1) : '-'}</p>
                  </div>
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Upcoming Sessions</h3>
                <div className="space-y-3">
                  {upcomingSessions.length === 0 && (
                    <p className="text-sm text-gray-500">No upcoming sessions.</p>
                  )}
                  {upcomingSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{new Date(s.date).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{s.location} • {s.type}</div>
                        <div className="text-xs text-gray-500">{programs.find((p) => p.id === s.program_id)?.name || "Program"}</div>
                      </div>
                      <button
                        className="px-3 py-1 text-sm border rounded-md"
                        onClick={() => window.location.assign(`/admin/coaching-management/training/manage-attendance?programId=${s.program_id}`)}
                      >
                        Attendance
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Past Sessions</h3>
                <div className="space-y-3">
                  {pastSessions.length === 0 && (
                    <p className="text-sm text-gray-500">No past sessions.</p>
                  )}
                  {pastSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border rounded-md p-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{new Date(s.date).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{s.location} • {s.type}</div>
                        <div className="text-xs text-gray-500">{programs.find((p) => p.id === s.program_id)?.name || "Program"}</div>
                      </div>
                      <button
                        className="px-3 py-1 text-sm border rounded-md"
                        onClick={() => window.location.assign(`/admin/coaching-management/training/manage-attendance?programId=${s.program_id}`)}
                      >
                        Attendance
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coaching Analytics & Player Development */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Player Development & Analytics</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  disabled={!selectedProgramId}
                  onClick={() => selectedProgramId && window.location.assign(`/admin/coaching-management/player-development/skill-assessment?programId=${selectedProgramId}`)}
                  className={`px-4 py-2 rounded-md border ${selectedProgramId ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700" : "opacity-50 cursor-not-allowed"}`}
                >
                  Skill Assessment
                </button>
                <button
                  disabled={!selectedProgramId}
                  onClick={() => selectedProgramId && window.location.assign(`/admin/coaching-management/player-development/feedback?programId=${selectedProgramId}`)}
                  className={`px-4 py-2 rounded-md border ${selectedProgramId ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700" : "opacity-50 cursor-not-allowed"}`}
                >
                  Feedback History
                </button>
                <button
                  disabled={!selectedProgramId}
                  onClick={() => selectedProgramId && window.location.assign(`/admin/coaching-management/analytics/performance-dashboard?programId=${selectedProgramId}`)}
                  className={`px-4 py-2 rounded-md ${selectedProgramId ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-600/50 text-white cursor-not-allowed"}`}
                >
                  Performance Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {!tournamentId && activeTab === "coaches" && (
          <div className="space-y-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Coach</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Coaches are people who coach teams in tournaments. Admins create coach accounts here.
                A user account is automatically created for each coach. Coaches will have a separate login and dashboard (to be implemented).
              </p>
              <form onSubmit={addCoach} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Full name"
                  value={coachForm.fullName}
                  onChange={(e) => setCoachForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
                <input
                  type="email"
                  className="border rounded-md px-3 py-2"
                  placeholder="Email"
                  value={coachForm.email}
                  onChange={(e) => setCoachForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
                <input
                  type="password"
                  className="border rounded-md px-3 py-2"
                  placeholder="Password (required)"
                  value={coachForm.password}
                  onChange={(e) => setCoachForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
                <input
                  className="border rounded-md px-3 py-2"
                  placeholder="Phone (optional)"
                  value={coachForm.phone}
                  onChange={(e) => setCoachForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <button type="submit" disabled={coachSaving} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                  {coachSaving ? "Adding..." : "Add Coach"}
                </button>
              </form>
              {coachError && <p className="text-sm text-red-600 mt-2">{coachError}</p>}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {coaches.length === 0 ? (
                <p className="p-4 text-gray-600">No coaches yet.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coaches.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="p-3">{c.full_name}</td>
                        <td className="p-3">{c.email}</td>
                        <td className="p-3">{c.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tournament-Specific Dashboard (only show if tournamentId is provided) */}
        {tournamentId && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Loading tournament details...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Tournament Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage your tournament setup and monitor progress
                  </p>
                </div>

                {/* Tournament Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {tournament?.name}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(tournament?.startDate || "").toLocaleDateString()}{" "}
                    - {new Date(tournament?.endDate || "").toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{tournament?.venue}</span>
                </div>
              </div>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tournament?.status === "registration-open"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : tournament?.status === "in-progress"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {(tournament?.status?.replace?.("-", " ")?.toUpperCase?.()) || ""}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Teams Registered
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tournament?.teamsRegistered} / {tournament?.maxTeams}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Teams Approved
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {tournament?.teamsApproved}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Pending Approval
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {tournament?.teamsPending}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Matches Scheduled
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {tournament?.matchesScheduled} / {tournament?.totalMatches}
              </p>
            </div>
          </div>
        </div>

        {/* Public Registration Link */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-6 mb-6 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <LinkIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Public Registration Link
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Share this link with teams to allow them to register for your
                tournament
              </p>

              {/* Link Display */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm break-all">
                  {registrationUrl}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyRegistrationLink}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>

                <button
                  onClick={shareRegistrationLink}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>

                <button
                  onClick={openRegistrationInNewTab}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </button>
              </div>

              {/* Registration Status */}
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Registration Deadline:</p>
                    <p>
                      {new Date(
                        tournament?.registrationDeadline || ""
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Tournament Setup Progress
          </h3>

          <div className="space-y-4">
            {setupSteps.map((step, index) => {
              const Icon = step.icon;
              const isLocked = step.status === "locked";
              const isCompleted = step.status === "completed";

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    isCompleted
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : isLocked
                      ? "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      isCompleted
                        ? "bg-green-600"
                        : isLocked
                        ? "bg-gray-400"
                        : "bg-blue-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className="w-6 h-6 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>

                  <button
                    onClick={() => !isLocked && router.push(step.path)}
                    disabled={isLocked}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                      isLocked
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : isCompleted
                        ? "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isCompleted ? "Review" : isLocked ? "Locked" : "Configure"}
                    {!isLocked && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={() => action.enabled && router.push(action.path)}
                  disabled={!action.enabled}
                  className={`flex flex-col items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                    action.enabled
                      ? "border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:shadow-md"
                      : "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      action.enabled ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
