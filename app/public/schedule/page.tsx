'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  Filter,
  Search,
  X,
  ChevronDown,
  Trophy,
  Loader2,
  AlertCircle,
  Download,
  Share2,
  RefreshCw,
  Grid3x3,
  List,
} from 'lucide-react';

interface Match {
  id: string;
  matchNumber: number;
  round: number;
  pool?: number;
  team1: string;
  team2: string;
  scheduledDate: string;
  scheduledTime: string;
  field: string;
  fieldLocation?: string;
  duration: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  score?: {
    team1Score?: number;
    team2Score?: number;
  };
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  format: string;
  status: string;
}

interface ScheduleFilters {
  dates: string[];
  rounds: number[];
  fields: string[];
  teams: string[];
}

export default function PublicSchedulePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PublicScheduleInner />
    </Suspense>
  );
}

function PublicScheduleInner() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId') || '';

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesByDate, setMatchesByDate] = useState<Record<string, Match[]>>({});
  const [filters, setFilters] = useState<ScheduleFilters>({
    dates: [],
    rounds: [],
    fields: [],
    teams: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [searchTeam, setSearchTeam] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    fetchSchedule();
  }, [tournamentId, selectedDate, selectedRound, selectedField, searchTeam]);

  const fetchSchedule = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (tournamentId) params.append('tournamentId', tournamentId);
      if (selectedDate) params.append('date', selectedDate);
      if (selectedRound) params.append('round', selectedRound);
      if (selectedField) params.append('field', selectedField);
      if (searchTeam) params.append('team', searchTeam);

      const response = await fetch(`/api/public/schedule?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      setTournament(data.tournament);
      setMatches(data.matches);
      setMatchesByDate(data.matchesByDate);
      setFilters(data.filters);
    } catch (err) {
      setError('Failed to load schedule. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedRound('');
    setSelectedField('');
    setSearchTeam('');
  };

  const hasActiveFilters = selectedDate || selectedRound || selectedField || searchTeam;

  const getStatusBadge = (status: Match['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'in-progress': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    const labels = {
      scheduled: 'Scheduled',
      'in-progress': 'Live',
      completed: 'Final',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament?.name || 'Tournament Schedule',
          text: `Check out the schedule for ${tournament?.name}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to copy link');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    setSuccess('PDF download feature coming soon!');
    setTimeout(() => setSuccess(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Schedule
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={fetchSchedule}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {tournament?.name || 'Tournament Schedule'}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {tournament?.startDate && new Date(tournament.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    -{' '}
                    {tournament?.endDate && new Date(tournament.endDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{tournament?.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  <span>{tournament?.format}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSchedule}
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showFilters ? 'rotate-180' : ''
                }`}
              />
              {hasActiveFilters && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                  Active
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Clear</span>
                </Button>
              )}
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-800 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-800 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Dates</option>
                  {filters.dates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Round
                </label>
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Rounds</option>
                  {filters.rounds.map((round) => (
                    <option key={round} value={round}>
                      Round {round}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field
                </label>
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Fields</option>
                  {filters.fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Team
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Team name..."
                    value={searchTeam}
                    onChange={(e) => setSearchTeam(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchTeam && (
                    <button
                      onClick={() => setSearchTeam('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{matches.length}</span>{' '}
            {matches.length === 1 ? 'match' : 'matches'}
          </p>
          {hasActiveFilters && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Filters applied
            </p>
          )}
        </div>

        {/* Matches Display */}
        {Object.keys(matchesByDate).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No matches found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Try adjusting your filters or check back later
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          // List View
          <div className="space-y-6">
            {Object.entries(matchesByDate).map(([date, dateMatches]) => (
              <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {dateMatches.length} {dateMatches.length === 1 ? 'match' : 'matches'}
                  </p>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dateMatches.map((match) => (
                    <div
                      key={match.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                              Match #{match.matchNumber}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Round {match.round}
                              {match.pool && ` • Pool ${match.pool}`}
                            </span>
                            {getStatusBadge(match.status)}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <span className="font-semibold text-gray-900 dark:text-white text-lg">
                                {match.team1}
                              </span>
                              {match.score && (
                                <span className="font-bold text-2xl text-gray-900 dark:text-white ml-4">
                                  {match.score.team1Score}
                                </span>
                              )}
                            </div>
                            <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                              vs
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <span className="font-semibold text-gray-900 dark:text-white text-lg">
                                {match.team2}
                              </span>
                              {match.score && (
                                <span className="font-bold text-2xl text-gray-900 dark:text-white ml-4">
                                  {match.score.team2Score}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 lg:text-right lg:min-w-[200px] border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6">
                          <div className="flex items-center lg:justify-end gap-2 text-gray-700 dark:text-gray-300">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="font-semibold text-lg">{match.scheduledTime}</span>
                          </div>
                          <div className="flex items-center lg:justify-end gap-2 text-gray-600 dark:text-gray-400">
                            <MapPin className="w-5 h-5" />
                            <div className="text-left lg:text-right">
                              <div className="font-medium">{match.field}</div>
                              {match.fieldLocation && (
                                <div className="text-sm text-gray-500 dark:text-gray-500">
                                  {match.fieldLocation}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 lg:text-right">
                            Duration: {match.duration} min
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-4 py-3">
                  <div className="flex items-center justify-between text-white">
                    <span className="text-sm font-semibold">Match #{match.matchNumber}</span>
                    {getStatusBadge(match.status)}
                  </div>
                  <div className="text-xs text-blue-100 mt-1">
                    Round {match.round}
                    {match.pool && ` • Pool ${match.pool}`}
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {match.team1}
                      </span>
                      {match.score && (
                        <span className="font-bold text-xl ml-2">{match.score.team1Score}</span>
                      )}
                    </div>
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">vs</div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {match.team2}
                      </span>
                      {match.score && (
                        <span className="font-bold text-xl ml-2">{match.score.team2Score}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {new Date(match.scheduledDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{match.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <div>{match.field}</div>
                        {match.fieldLocation && (
                          <div className="text-xs text-gray-500">{match.fieldLocation}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}