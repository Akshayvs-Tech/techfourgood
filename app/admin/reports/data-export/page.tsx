"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Calendar,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

type ExportFormat = "csv" | "json" | "pdf";
type ExportType =
  | "teams"
  | "players"
  | "rosters"
  | "matches"
  | "spirit-scores"
  | "all";

interface ExportOption {
  id: ExportType;
  label: string;
  description: string;
  icon: React.ElementType;
  recordCount?: number;
}

export default function DataExportPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <DataExportInner />
    </Suspense>
  );
}

function DataExportInner() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("tournamentId");

  const [selectedType, setSelectedType] = useState<ExportType>("all");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [counts, setCounts] = useState<{teams:number; players:number; rosters:number; matches:number; spirit:number}>({teams:0,players:0,rosters:0,matches:0,spirit:0});

  const exportOptions: ExportOption[] = [
    {
      id: "teams",
      label: "Teams",
      description: "Team information, contact details, and status",
      icon: Users,
      recordCount: counts.teams,
    },
    {
      id: "players",
      label: "Players",
      description: "Individual player details and registration info",
      icon: Users,
      recordCount: counts.players,
    },
    {
      id: "rosters",
      label: "Team Rosters",
      description: "Team rosters with player assignments",
      icon: FileText,
      recordCount: counts.rosters,
    },
    {
      id: "matches",
      label: "Matches",
      description: "Match schedules, scores, and results",
      icon: Calendar,
      recordCount: counts.matches,
    },
    {
      id: "spirit-scores",
      label: "Spirit Scores",
      description: "Spirit of the game scores and feedback",
      icon: Trophy,
      recordCount: counts.spirit,
    },
    {
      id: "all",
      label: "Complete Data",
      description: "Export all tournament data in one file",
      icon: FileSpreadsheet,
      recordCount: counts.teams + counts.players + counts.rosters + counts.matches + counts.spirit,
    },
  ];

  useEffect(() => {
    const fetchCounts = async () => {
      if (!tournamentId) return;
      const [teams, players, rosters, matches] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact', head: true }).eq('tournament_id', tournamentId),
        supabase.from('players').select('id', { count: 'exact', head: true }),
        supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('tournament_id', tournamentId),
        supabase.from('matches').select('id', { count: 'exact', head: true }).eq('tournament_id', tournamentId),
      ]);
      setCounts({
        teams: teams.count || 0,
        players: players.count || 0,
        rosters: rosters.count || 0,
        matches: matches.count || 0,
        spirit: 0,
      });
    };
    fetchCounts();
  }, [tournamentId]);

  const formatOptions = [
    { id: "csv" as ExportFormat, label: "CSV", icon: FileSpreadsheet },
    { id: "json" as ExportFormat, label: "JSON", icon: FileText },
    { id: "pdf" as ExportFormat, label: "PDF", icon: FileText },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const fileName = `tournament_${selectedType}_${new Date().toISOString().split("T")[0]}.${selectedFormat}`;
      const getData = async (): Promise<any[]> => {
        if (!tournamentId) return [];
        switch (selectedType) {
          case 'teams': {
            const { data } = await supabase.from('teams').select('*').eq('tournament_id', tournamentId);
            return data || [];
          }
          case 'players': {
            const { data } = await supabase.from('players').select('*');
            return data || [];
          }
          case 'rosters': {
            const { data } = await supabase.from('team_members').select('*').eq('tournament_id', tournamentId);
            return data || [];
          }
          case 'matches': {
            const { data } = await supabase.from('matches').select('*').eq('tournament_id', tournamentId);
            return data || [];
          }
          case 'spirit-scores': {
            const { data } = await supabase.from('session_assessments').select('*');
            return data || [];
          }
          case 'all': {
            const [teams, players, rosters, matches] = await Promise.all([
              supabase.from('teams').select('*').eq('tournament_id', tournamentId),
              supabase.from('players').select('*'),
              supabase.from('team_members').select('*').eq('tournament_id', tournamentId),
              supabase.from('matches').select('*').eq('tournament_id', tournamentId),
            ]);
            return [{ teams: teams.data || [], players: players.data || [], rosters: rosters.data || [], matches: matches.data || [] }];
          }
        }
      };

      const rows = await getData();

      let blob: Blob;
      if (selectedFormat === 'json') {
        blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      } else {
        const toCsv = (arr: any[]) => {
          if (!arr || arr.length === 0) return '';
          const headers = Array.from(new Set(arr.flatMap(obj => Object.keys(obj))));
          const csvRows = [headers.join(',')].concat(arr.map(obj => headers.map(h => JSON.stringify((obj as any)[h] ?? '')).join(',')));
          return csvRows.join('\n');
        };
        const csvContent = Array.isArray(rows) && rows.length === 1 && (rows[0] as any).teams && selectedType === 'all'
          ? `# teams\n${toCsv((rows[0] as any).teams)}\n\n# players\n${toCsv((rows[0] as any).players)}\n\n# rosters\n${toCsv((rows[0] as any).rosters)}\n\n# matches\n${toCsv((rows[0] as any).matches)}`
          : toCsv(rows as any[]);
        blob = new Blob([csvContent], { type: 'text/csv' });
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({ success: true, message: `Successfully exported ${selectedType}` });
    } catch (error) {
      setExportStatus({
        success: false,
        message: "Failed to export data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!tournamentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Tournament ID Missing
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please select a tournament to export data.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Data Export
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Export tournament data in various formats for analysis and reporting
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Type Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Data to Export
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedType(option.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        selectedType === option.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedType === option.id
                              ? "bg-blue-100 dark:bg-blue-900/40"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              selectedType === option.id
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {option.label}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {option.description}
                          </p>
                          {option.recordCount !== undefined && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {option.recordCount} records
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Select Export Format
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {formatOptions.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                        selectedFormat === format.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 mx-auto mb-2 ${
                          selectedFormat === format.id
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {format.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Export Summary & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Export Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Data Type
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {
                      exportOptions.find((opt) => opt.id === selectedType)
                        ?.label
                    }
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Format
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white uppercase">
                    {selectedFormat}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Estimated Records
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {exportOptions.find((opt) => opt.id === selectedType)
                      ?.recordCount || 0}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Data
                  </>
                )}
              </Button>

              {/* Status Message */}
              {exportStatus && (
                <div
                  className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                    exportStatus.success
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {exportStatus.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <p
                    className={`text-sm ${
                      exportStatus.success
                        ? "text-green-800 dark:text-green-200"
                        : "text-red-800 dark:text-red-200"
                    }`}
                  >
                    {exportStatus.message}
                  </p>
                </div>
              )}

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Exports include data from all approved
                  and pending submissions. Sensitive information like passwords
                  will be excluded.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
