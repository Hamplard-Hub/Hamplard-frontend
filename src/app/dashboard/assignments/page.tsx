'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, CheckCircle, Clock, Star } from 'lucide-react';

type AssignmentStatus = 'todo' | 'submitted' | 'reviewed';

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseId: string;
  lessonId: string;
  dueDate?: string;
  status: AssignmentStatus;
  grade?: number;
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asn_001',
    title: 'Price your first product',
    course: 'Cake Pricing Mastery',
    courseId: 'course_001',
    lessonId: 'lesson_003',
    dueDate: '2025-01-15',
    status: 'todo',
  },
  {
    id: 'asn_002',
    title: 'Design a basic pattern',
    course: 'Introduction to Tailoring',
    courseId: 'course_003',
    lessonId: 'lesson_005',
    dueDate: '2025-01-20',
    status: 'todo',
  },
  {
    id: 'asn_003',
    title: 'Create a social media post',
    course: 'Social Media for Artisans',
    courseId: 'course_005',
    lessonId: 'lesson_002',
    status: 'submitted',
  },
  {
    id: 'asn_004',
    title: 'Write your business elevator pitch',
    course: 'Business Basics for Artisans',
    courseId: 'course_002',
    lessonId: 'lesson_007',
    status: 'reviewed',
    grade: 92,
  },
  {
    id: 'asn_005',
    title: 'Draft your first invoice',
    course: 'Business Basics for Artisans',
    courseId: 'course_002',
    lessonId: 'lesson_010',
    status: 'reviewed',
    grade: 88,
  },
];

const TABS: Array<{ key: AssignmentStatus; label: string; icon: typeof ClipboardList }> = [
  { key: 'todo', label: 'To do', icon: Clock },
  { key: 'submitted', label: 'Submitted', icon: ClipboardList },
  { key: 'reviewed', label: 'Reviewed', icon: CheckCircle },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState<AssignmentStatus>('todo');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAssignments(MOCK_ASSIGNMENTS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const filtered = assignments.filter((a) => a.status === activeTab);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-6 h-6 text-saffron-600" />
        <h1 className="section-heading">Assignments</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-100 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = assignments.filter((a) => a.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-saffron-500 text-saffron-600'
                  : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {!loading && (
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                  activeTab === key ? 'bg-saffron-100 text-saffron-700' : 'bg-ink-100 text-ink-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-ink-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-ink-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <ClipboardList className="w-10 h-10 text-saffron-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-700">
            {activeTab === 'todo' && 'All caught up! No pending assignments.'}
            {activeTab === 'submitted' && 'No submitted assignments yet.'}
            {activeTab === 'reviewed' && 'No reviewed assignments yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment) => (
            <Link
              key={assignment.id}
              href={`/dashboard/courses/${assignment.courseId}/learn?lesson=${assignment.lessonId}`}
              className="card p-4 flex items-start justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900 truncate">{assignment.title}</p>
                <p className="text-xs text-ink-400 mt-0.5">{assignment.course}</p>
                {assignment.dueDate && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due {formatDate(assignment.dueDate)}
                  </p>
                )}
              </div>

              <div className="ml-4 flex-shrink-0 text-right">
                {assignment.status === 'todo' && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    To do
                  </span>
                )}
                {assignment.status === 'submitted' && (
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Submitted
                  </span>
                )}
                {assignment.status === 'reviewed' && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Reviewed
                    </span>
                    {assignment.grade !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                        <Star className="w-3 h-3 text-saffron-500" />
                        {assignment.grade}/100
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
