// src/types/index.ts

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

export type CourseStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ARCHIVED';

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'REFUNDED';

export type AssignmentStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';

export type QuizType = 'multiple_choice' | 'multi_select' | 'true_false';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: QuizOption[];
  explanation?: string;
}

export interface User {
  id: string;
  stellarAddress: string;
  email: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  type: LessonType;
  videoUrl: string | null;
  videoDuration: number | null; // seconds
  content: string | null;
  resourceUrl: string | null;
  quiz?: QuizQuestion[] | null;
  position: number;
  isFree: boolean;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  instructorAddress: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  language: string;
  thumbnailUrl: string | null;
  previewVideoUrl: string | null;
  price: number;
  platformFeePercent: number;
  status: CourseStatus;
  totalLessons: number;
  totalDuration: number;
  totalEnrollments: number;
  totalRevenue: number;
  txHash: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  instructor: {
    name: string | null;
    stellarAddress: string;
    avatarUrl: string | null;
    bio?: string | null;
  };
  modules: CourseModule[];
  _count: { enrollments: number };
  rating?: number;
  reviewCount?: number;
  originalPrice?: number;
  badge?: 'bestseller' | 'new' | 'hot';
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  watchedSecs: number;
  completedAt: string | null;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  amountPaid: number;
  txHash: string | null;
  status: EnrollmentStatus;
  progressPercent: number;
  completedAt: string | null;
  enrolledAt: string;
  course: Course;
  lessonProgress: LessonProgress[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionUrl: string | null;
  notes: string | null;
  status: AssignmentStatus;
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  instructorAddress: string;
  txHash: string | null;
  isRevoked: boolean;
  issuedAt: string;
  student?: { name: string | null; stellarAddress: string };
  course?: { title: string; instructor?: { name: string | null } };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  message: string;
  deliveryCount: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface Category {
  name: string;
  count: number;
}

// ── Review & Rating ────────────────────────────────────────────────

export type ReviewSortOption = 'most_recent' | 'most_helpful' | 'highest_rated' | 'lowest_rated';

export interface InstructorReply {
  /** Instructor's display name */
  name: string;
  /** Instructor avatar URL */
  avatarUrl: string | null;
  /** Reply body text */
  text: string;
  /** ISO timestamp of the reply */
  repliedAt: string;
}

export interface Review {
  id: string;
  courseId: string;
  /** Author display name */
  authorName: string;
  /** Author avatar URL — null falls back to initials avatar */
  authorAvatarUrl: string | null;
  /** 1–5 integer star rating */
  rating: number;
  /** Review body text */
  text: string;
  /** ISO timestamp */
  createdAt: string;
  /** Number of "helpful" votes */
  helpfulVotes: number;
  /** Whether the current viewer has voted this helpful */
  viewerVoted?: boolean;
  /** Optional instructor reply nested under this review */
  instructorReply?: InstructorReply;
}

export interface RatingDistribution {
  /** Star value (1–5) */
  stars: number;
  /** Number of reviews with this star value */
  count: number;
}

// ── Lesson Q&A ────────────────────────────────────────────────────

export type QnaSortOption = 'most_recent' | 'most_upvoted';
export type QnaFilterOption = 'all' | 'mine' | 'unanswered';

export interface QnaReply {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  /** Distinguishes instructor replies so they can carry a badge */
  isInstructor: boolean;
  text: string;
  /** ISO timestamp */
  createdAt: string;
}

export interface QnaQuestion {
  id: string;
  lessonId?: string;
  authorName: string;
  authorAvatarUrl: string | null;
  /** Whether the current viewer authored this question — powers "My Questions" */
  isViewerAuthor?: boolean;
  title: string;
  body: string;
  /** ISO timestamp */
  createdAt: string;
  upvotes: number;
  /** Whether the current viewer has upvoted this question */
  viewerUpvoted?: boolean;
  replies: QnaReply[];
}

// ── Bundles ───────────────────────────────────────────────────────────────

export interface Bundle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  totalValue: number;       // sum of individual course prices
  bundlePrice: number;      // discounted price
  courses: Course[];
  relatedBundles?: BundleSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface BundleSummary {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  bundlePrice: number;
  totalValue: number;
  courseCount: number;
}

// ── Gift ─────────────────────────────────────────────────────────────────

export type GiftStatus = 'PENDING' | 'CLAIMED' | 'EXPIRED';

export interface Gift {
  id: string;
  courseId: string;
  senderEmail: string | null;
  recipientEmail: string;
  message: string | null;
  deliveryDate: string;
  claimToken: string;
  status: GiftStatus;
  claimedAt: string | null;
  createdAt: string;
  course?: Course;
}

// ── Leaderboard ───────────────────────────────────────────────────────────

export type LeaderboardPeriod = 'week' | 'month' | 'all';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  avatarUrl: string | null;
  coursesCompleted: number;
  hoursLearned: number;
  streakDays: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  period: LeaderboardPeriod;
}

// ── Instructor Student Analytics ─────────────────────────────────────────

export interface StudentEnrollmentRow {
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  studentAvatarUrl: string | null;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  progressPercent: number;
  lastActiveAt: string | null;
}

export interface LessonProgressDetail {
  lessonId: string;
  lessonTitle: string;
  completed: boolean;
  watchedSecs: number;
  completedAt: string | null;
}

export interface StudentDetail {
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  studentAvatarUrl: string | null;
  enrollments: Array<{
    courseId: string;
    courseTitle: string;
    enrolledAt: string;
    progressPercent: number;
    lessonProgress: LessonProgressDetail[];
  }>;
}
