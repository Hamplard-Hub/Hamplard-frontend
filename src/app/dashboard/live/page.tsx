'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Video,
  Calendar,
  Clock,
  User,
  ExternalLink,
  Download,
  Play,
  X,
  Search,
  Sparkles,
  Globe,
  Radio,
  CheckCircle,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { liveSessionsApi } from '@/lib/api/services';
import {
  generateSingleEventIcs,
  generateGoogleCalendarUrlForSingleEvent,
  downloadIcsFile,
} from '@/lib/utils/ics';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { LiveSession, LiveSessionRecording } from '@/types';

type ActiveTab = 'upcoming' | 'recordings';

export default function LiveSessionsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming');
  const [upcomingSessions, setUpcomingSessions] = useState<LiveSession[]>([]);
  const [recordings, setRecordings] = useState<LiveSessionRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<LiveSessionRecording | null>(null);
  const [userTimeZone, setUserTimeZone] = useState<string>('UTC');

  // Detect local timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setUserTimeZone(tz);
    } catch {
      setUserTimeZone('Local Time');
    }
  }, []);

  // Timer to update current time every 15 seconds for accurate join button enabling
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Load upcoming sessions and recordings
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [sessionsData, recordingsData] = await Promise.all([
          liveSessionsApi.getUpcoming(),
          liveSessionsApi.getPastRecordings(),
        ]);
        if (isMounted) {
          setUpcomingSessions(sessionsData);
          setRecordings(recordingsData);
        }
      } catch (err) {
        console.error('Failed to load live sessions', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Format localized date/time
  const formatSessionTime = (isoString: string) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dateStr, timeStr };
  };

  // Check if session join button should be enabled (active within 10 minutes of start or ongoing)
  const getSessionJoinState = (session: LiveSession) => {
    const startMs = new Date(session.scheduledAt).getTime();
    const endMs = startMs + session.durationMinutes * 60 * 1000;
    const diffMs = startMs - currentTime;
    const tenMinutesMs = 10 * 60 * 1000;

    const isOngoing = currentTime >= startMs && currentTime <= endMs;
    const isLive = session.status === 'LIVE' || isOngoing;
    const isJoinable = isLive || (diffMs <= tenMinutesMs && currentTime <= endMs);

    let statusBadge = {
      text: 'Upcoming',
      className: 'bg-ink-100 text-ink-700',
    };

    if (isOngoing || session.status === 'LIVE') {
      statusBadge = {
        text: 'Live Now',
        className: 'bg-red-500 text-white animate-pulse',
      };
    } else if (diffMs <= tenMinutesMs && diffMs > 0) {
      const minsRemaining = Math.ceil(diffMs / 60000);
      statusBadge = {
        text: `Starts in ${minsRemaining}m`,
        className: 'bg-saffron-500 text-ink-950 font-bold',
      };
    } else if (currentTime > endMs) {
      statusBadge = {
        text: 'Ended',
        className: 'bg-ink-200 text-ink-600',
      };
    }

    return { isJoinable, isLive, diffMs, statusBadge };
  };

  // Handle joining a session
  const handleJoinSession = async (session: LiveSession) => {
    try {
      const response = await liveSessionsApi.joinSession(session.id);
      const url = response.joinUrl || session.joinUrl || `https://meet.hamplard.com/live/${session.id}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success({ title: 'Connecting', description: 'Joining live session room...' });
    } catch {
      if (session.joinUrl) {
        window.open(session.joinUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error({ title: 'Connection failed', description: 'Unable to connect to live room. Please try again.' });
      }
    }
  };

  // Export session to .ics calendar file
  const handleDownloadIcs = (session: LiveSession) => {
    try {
      const ics = generateSingleEventIcs({
        title: session.title,
        description: `${session.description}\n\nInstructor: ${session.instructorName}\nJoin URL: ${session.joinUrl || 'https://hamplard.com'}`,
        startDate: new Date(session.scheduledAt),
        durationMinutes: session.durationMinutes,
        location: 'Hamplard Live Classroom',
      });
      downloadIcsFile(`hamplard-session-${session.id}.ics`, ics);
      toast.success({ title: 'Calendar Exported', description: 'Calendar invite (.ics) downloaded' });
    } catch (err) {
      console.error(err);
      toast.error({ title: 'Export failed', description: 'Failed to generate calendar file' });
    }
  };

  // Open Google Calendar quick-add
  const handleGoogleCalendar = (session: LiveSession) => {
    try {
      const url = generateGoogleCalendarUrlForSingleEvent({
        title: session.title,
        description: `${session.description}\n\nInstructor: ${session.instructorName}\nCourse: ${session.courseTitle || 'Hamplard'}`,
        startDate: new Date(session.scheduledAt),
        durationMinutes: session.durationMinutes,
        location: 'Hamplard Live Classroom',
      });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
      toast.error({ title: 'Failed to open', description: 'Failed to open Google Calendar' });
    }
  };

  // Filtered upcoming sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return upcomingSessions;
    const q = searchQuery.toLowerCase();
    return upcomingSessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.instructorName.toLowerCase().includes(q) ||
        (s.courseTitle && s.courseTitle.toLowerCase().includes(q)),
    );
  }, [upcomingSessions, searchQuery]);

  // Filtered recordings
  const filteredRecordings = useMemo(() => {
    if (!searchQuery.trim()) return recordings;
    const q = searchQuery.toLowerCase();
    return recordings.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.instructorName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [recordings, searchQuery]);

  return (
    <div className="min-h-screen bg-ink-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-saffron-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/20 text-saffron-300 text-xs font-semibold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse text-saffron-400" />
                <span>Interactive Learning</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Live Sessions & Workshops
              </h1>
              <p className="text-ink-300 text-sm sm:text-base leading-relaxed">
                Connect directly with master craftsmen, attend hands-on technique demonstrations,
                and get real-time feedback on your practical projects.
              </p>
            </div>

            {/* Time zone indicator pill */}
            <div className="flex flex-col sm:items-end justify-center gap-1.5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm self-start md:self-auto">
              <div className="flex items-center gap-2 text-xs font-medium text-ink-300">
                <Globe className="w-4 h-4 text-saffron-400" />
                <span>Local Time Zone</span>
              </div>
              <div className="font-mono text-sm font-semibold text-white tracking-wide">
                {userTimeZone}
              </div>
              <span className="text-[11px] text-ink-400">All session times converted automatically</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-ink-200 pb-4">
          <div className="flex items-center gap-2 bg-ink-100 p-1 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'upcoming'
                  ? 'bg-white text-ink-900 shadow-sm font-semibold'
                  : 'text-ink-600 hover:text-ink-900',
              )}
            >
              <Calendar className="w-4 h-4 text-saffron-600" />
              <span>Upcoming Sessions</span>
              <span
                className={cn(
                  'ml-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                  activeTab === 'upcoming'
                    ? 'bg-saffron-100 text-saffron-800'
                    : 'bg-ink-200 text-ink-600',
                )}
              >
                {upcomingSessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recordings')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'recordings'
                  ? 'bg-white text-ink-900 shadow-sm font-semibold'
                  : 'text-ink-600 hover:text-ink-900',
              )}
            >
              <Video className="w-4 h-4 text-saffron-600" />
              <span>Past Recordings</span>
              <span
                className={cn(
                  'ml-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                  activeTab === 'recordings'
                    ? 'bg-saffron-100 text-saffron-800'
                    : 'bg-ink-200 text-ink-600',
                )}
              >
                {recordings.length}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search by topic, instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-2xl bg-white border border-ink-200 p-6 animate-pulse space-y-4"
              >
                <div className="h-6 w-1/3 bg-ink-200 rounded" />
                <div className="h-8 w-3/4 bg-ink-200 rounded" />
                <div className="h-16 w-full bg-ink-100 rounded" />
                <div className="h-10 w-full bg-ink-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : activeTab === 'upcoming' ? (
          /* Upcoming Sessions View */
          filteredSessions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-ink-200 p-8">
              <Calendar className="w-12 h-12 text-ink-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-ink-900">No upcoming sessions found</h3>
              <p className="text-sm text-ink-500 max-w-md mx-auto mt-1">
                {searchQuery
                  ? 'No sessions matched your search query. Try clearing the filter.'
                  : 'Check back soon! New live workshops and Q&A sessions are scheduled weekly.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredSessions.map((session) => {
                const { dateStr, timeStr } = formatSessionTime(session.scheduledAt);
                const { isJoinable, isLive, statusBadge } = getSessionJoinState(session);

                return (
                  <div
                    key={session.id}
                    className="flex flex-col justify-between rounded-3xl bg-white border border-ink-200/80 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="space-y-4">
                      {/* Top Row: Course Tag & Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-ink-500 bg-ink-100 px-3 py-1 rounded-full truncate max-w-[200px]">
                          {session.courseTitle || 'Live Masterclass'}
                        </span>
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5',
                            statusBadge.className,
                          )}
                        >
                          {isLive && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                          {statusBadge.text}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-display text-xl font-bold text-ink-900 leading-snug group-hover:text-saffron-700 transition-colors">
                          {session.title}
                        </h3>
                        <p className="mt-2 text-sm text-ink-600 line-clamp-3 leading-relaxed">
                          {session.description}
                        </p>
                      </div>

                      {/* Instructor & Schedule details */}
                      <div className="pt-2 border-t border-ink-100 flex flex-col gap-2.5 text-sm text-ink-700">
                        <div className="flex items-center gap-2.5">
                          {session.instructorAvatar ? (
                            <img
                              src={session.instructorAvatar}
                              alt={session.instructorName}
                              className="w-7 h-7 rounded-full object-cover border border-ink-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-saffron-100 text-saffron-800 flex items-center justify-center font-bold text-xs">
                              {session.instructorName.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-ink-800">{session.instructorName}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-600 bg-ink-50 p-3 rounded-2xl">
                          <div className="flex items-center gap-1.5 font-medium text-ink-800">
                            <Calendar className="w-4 h-4 text-saffron-600" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium text-ink-800">
                            <Clock className="w-4 h-4 text-saffron-600" />
                            <span>
                              {timeStr} ({session.durationMinutes} mins)
                            </span>
                          </div>
                          {session.registeredCount !== undefined && (
                            <div className="flex items-center gap-1.5 text-ink-500">
                              <User className="w-3.5 h-3.5" />
                              <span>{session.registeredCount} enrolled</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-ink-100 flex flex-col sm:flex-row items-center gap-3">
                      {/* Join Button */}
                      <button
                        onClick={() => handleJoinSession(session)}
                        disabled={!isJoinable}
                        className={cn(
                          'w-full sm:flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm',
                          isJoinable
                            ? 'bg-saffron-500 text-ink-950 hover:bg-saffron-400 active:scale-[0.98]'
                            : 'bg-ink-100 text-ink-400 cursor-not-allowed border border-ink-200/50',
                        )}
                        title={
                          isJoinable
                            ? 'Click to enter live session room'
                            : 'Join button activates 10 minutes prior to session start'
                        }
                      >
                        <Video className="w-4 h-4" />
                        <span>{isLive ? 'Join Live Now' : isJoinable ? 'Join Room' : 'Join Room'}</span>
                      </button>

                      {/* Add to Calendar Action */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleDownloadIcs(session)}
                          className="flex-1 sm:flex-none py-3 px-3.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          title="Download .ics calendar event file"
                        >
                          <Download className="w-3.5 h-3.5 text-saffron-600" />
                          <span>.ICS</span>
                        </button>

                        <button
                          onClick={() => handleGoogleCalendar(session)}
                          className="flex-1 sm:flex-none py-3 px-3.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          title="Add to Google Calendar"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-saffron-600" />
                          <span>Google Cal</span>
                        </button>
                      </div>
                    </div>

                    {!isJoinable && (
                      <p className="mt-2 text-center text-[11px] text-ink-400 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Join button enables automatically 10 minutes before start</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Past Session Recordings View */
          filteredRecordings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-ink-200 p-8">
              <Video className="w-12 h-12 text-ink-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-ink-900">No session recordings found</h3>
              <p className="text-sm text-ink-500 max-w-md mx-auto mt-1">
                {searchQuery
                  ? 'No past recordings matched your search.'
                  : 'Live session recordings will appear here shortly after broadcasts conclude.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-ink-200/80 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                  onClick={() => setSelectedRecording(recording)}
                >
                  {/* Thumbnail with duration badge and play icon */}
                  <div className="relative aspect-video w-full bg-ink-900 overflow-hidden">
                    {recording.thumbnailUrl ? (
                      <img
                        src={recording.thumbnailUrl}
                        alt={recording.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950 text-saffron-400 text-3xl font-bold">
                        Hamplard
                      </div>
                    )}
                    <div className="absolute inset-0 bg-ink-950/30 group-hover:bg-ink-950/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-saffron-500 text-ink-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>
                    <span className="absolute bottom-2.5 right-2.5 bg-ink-950/80 text-white text-xs font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm">
                      {recording.durationMinutes} mins
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-display text-base font-bold text-ink-900 group-hover:text-saffron-700 transition-colors line-clamp-2">
                        {recording.title}
                      </h3>
                      <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
                        {recording.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
                      <div className="flex items-center gap-2">
                        {recording.instructorAvatar ? (
                          <img
                            src={recording.instructorAvatar}
                            alt={recording.instructorName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-saffron-100 text-saffron-800 flex items-center justify-center font-bold text-[10px]">
                            {recording.instructorName.charAt(0)}
                          </div>
                        )}
                        <span className="font-medium text-ink-700">{recording.instructorName}</span>
                      </div>

                      {recording.viewsCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{recording.viewsCount} views</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Video Player Modal for Past Recordings */}
        {selectedRecording && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm animate-fadeIn"
            onClick={() => setSelectedRecording(null)}
          >
            <div
              className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-saffron-100 text-saffron-800 font-semibold text-xs">
                    Recording
                  </span>
                  <h3 className="font-display font-bold text-ink-900 truncate max-w-lg">
                    {selectedRecording.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRecording(null)}
                  className="rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition"
                  aria-label="Close recording"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video w-full bg-black">
                {selectedRecording.videoUrl.includes('youtube') ||
                selectedRecording.videoUrl.includes('embed') ? (
                  <iframe
                    src={selectedRecording.videoUrl}
                    title={selectedRecording.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={selectedRecording.videoUrl}
                    controls
                    autoPlay
                    className="h-full w-full"
                    poster={selectedRecording.thumbnailUrl || undefined}
                  />
                )}
              </div>

              {/* Modal Footer Description */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-900">
                      Instructor: {selectedRecording.instructorName}
                    </span>
                    <span>•</span>
                    <span>{selectedRecording.durationMinutes} minutes</span>
                  </div>
                  <span>
                    Recorded on{' '}
                    {new Date(selectedRecording.recordedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-ink-600 leading-relaxed">
                  {selectedRecording.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
