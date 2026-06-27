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
