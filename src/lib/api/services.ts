import { apiClient } from './client';
import type {
  ApiResponse, PaginatedResponse, Course, Enrollment,
  Certificate, Notification, User, Category, Announcement,
} from '@/types';

const isBrowser = typeof window !== 'undefined';
const ANNOUNCEMENTS_STORAGE_KEY = 'hamplard_announcements';
const NOTIFICATIONS_STORAGE_KEY = 'hamplard_notifications';

const readStorage = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (isBrowser) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const currentUserKey = () => {
  if (!isBrowser) return 'anonymous';
  return localStorage.getItem('hamplard_address') ?? 'anonymous';
};

const emitNotificationsUpdated = () => {
  if (isBrowser) {
    window.dispatchEvent(new Event('hamplard:notifications-updated'));
  }
};

// ----------------------------------------------------------
// Auth
// ----------------------------------------------------------
export const authApi = {
  getNonce: async (address: string) => {
    const { data } = await apiClient.get<ApiResponse<{ nonce: string }>>(
      `/auth/nonce?address=${address}`,
    );
    return data.data.nonce;
  },
  login: async (payload: {
    stellarAddress: string;
    signedNonce: string;
    signature: string;
    role?: 'STUDENT' | 'INSTRUCTOR';
  }) => {
    const { data } = await apiClient.post<
      ApiResponse<{ accessToken: string; user: User }>
    >('/auth/login', payload);
    return data.data;
  },
  loginWithEmail: async (payload: { email: string; password: string }) => {
    const { data } = await apiClient.post<
      ApiResponse<{ accessToken: string; user: User }>
    >('/auth/email/login', payload);
    return data.data;
  },
};

// ----------------------------------------------------------
// Courses
// ----------------------------------------------------------
export const coursesApi = {
  list: async (params?: {
    category?: string;
    level?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Course>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Course>>>(
      '/courses', { params },
    );
    return data.data;
  },

  get: async (id: string): Promise<Course> => {
    const { data } = await apiClient.get<ApiResponse<Course>>(`/courses/${id}`);
    return data.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<ApiResponse<Category[]>>('/courses/categories');
    return data.data;
  },

  create: async (payload: {
    courseId: string;
    title: string;
    description?: string;
    category: string;
    level?: string;
    language?: string;
    thumbnailUrl?: string;
    price: number;
    platformFeePercent?: number;
  }): Promise<Course> => {
    const { data } = await apiClient.post<ApiResponse<Course>>('/courses', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Course>): Promise<Course> => {
    const { data } = await apiClient.patch<ApiResponse<Course>>(`/courses/${id}`, payload);
    return data.data;
  },

  submitForReview: async (id: string, txHash?: string): Promise<Course> => {
    const { data } = await apiClient.post<ApiResponse<Course>>(
      `/courses/${id}/submit`, { txHash },
    );
    return data.data;
  },

  approve: async (id: string): Promise<Course> => {
    const { data } = await apiClient.post<ApiResponse<Course>>(`/courses/${id}/approve`);
    return data.data;
  },

  getPending: async (): Promise<PaginatedResponse<Course>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Course>>>(
      '/courses/admin/pending',
    );
    return data.data;
  },
};

// ----------------------------------------------------------
// Enrollments
// ----------------------------------------------------------
export const enrollmentsApi = {
  create: async (payload: {
    courseId: string;
    txHash: string;
    amountPaid: number;
  }): Promise<Enrollment> => {
    const { data } = await apiClient.post<ApiResponse<Enrollment>>('/enrollments', payload);
    return data.data;
  },

  getMy: async (page = 1, limit = 20): Promise<PaginatedResponse<Enrollment>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Enrollment>>>(
      '/enrollments/my', { params: { page, limit } },
    );
    return data.data;
  },

  get: async (courseId: string): Promise<Enrollment> => {
    const { data } = await apiClient.get<ApiResponse<Enrollment>>(
      `/enrollments/${courseId}`,
    );
    return data.data;
  },

  isEnrolled: async (courseId: string): Promise<boolean> => {
    try {
      const { data } = await apiClient.get<ApiResponse<boolean>>(
        `/enrollments/${courseId}/check`,
      );
      return data.data;
    } catch { return false; }
  },
};

// ----------------------------------------------------------
// Lessons
// ----------------------------------------------------------
export const lessonsApi = {
  markComplete: async (lessonId: string, enrollmentId: string, watchedSecs?: number) => {
    const { data } = await apiClient.post(`/lessons/${lessonId}/complete`, {
      enrollmentId, watchedSecs,
    });
    return data.data;
  },

  updateProgress: async (lessonId: string, enrollmentId: string, watchedSecs: number) => {
    await apiClient.patch(`/lessons/${lessonId}/progress`, { enrollmentId, watchedSecs });
  },

  createModule: async (courseId: string, title: string, position: number) => {
    const { data } = await apiClient.post('/lessons/modules', { courseId, title, position });
    return data.data;
  },

  createLesson: async (payload: {
    moduleId: string;
    title: string;
    type?: string;
    videoUrl?: string;
    videoDuration?: number;
    content?: string;
    resourceUrl?: string;
    position: number;
    isFree?: boolean;
  }) => {
    const { data } = await apiClient.post('/lessons', payload);
    return data.data;
  },
};

// ----------------------------------------------------------
// Assignments
// ----------------------------------------------------------
export const assignmentsApi = {
  getByLesson: async (lessonId: string) => {
    const { data } = await apiClient.get(`/assignments/lesson/${lessonId}`);
    return data.data;
  },

  submit: async (assignmentId: string, submissionUrl: string, notes?: string) => {
    const { data } = await apiClient.post(`/assignments/${assignmentId}/submit`, {
      submissionUrl, notes,
    });
    return data.data;
  },

  review: async (submissionId: string, approved: boolean, feedback: string) => {
    const { data } = await apiClient.post(
      `/assignments/submissions/${submissionId}/review`,
      { approved, feedback },
    );
    return data.data;
  },

  getPending: async () => {
    const { data } = await apiClient.get('/assignments/instructor/pending');
    return data.data;
  },
};

// ----------------------------------------------------------
// Certificates
// ----------------------------------------------------------
export const certificatesApi = {
  getMy: async (): Promise<Certificate[]> => {
    const { data } = await apiClient.get<ApiResponse<Certificate[]>>('/certificates/my/all');
    return data.data;
  },

  verify: async (id: string) => {
    const { data } = await apiClient.get(`/certificates/verify/${id}`);
    return data.data;
  },

  get: async (id: string): Promise<Certificate> => {
    const { data } = await apiClient.get<ApiResponse<Certificate>>(`/certificates/${id}`);
    return data.data;
  },
};

// ----------------------------------------------------------
// Announcements
// ----------------------------------------------------------
export const announcementsApi = {
  list: async (params?: { courseId?: string }): Promise<PaginatedResponse<Announcement>> => {
    try {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Announcement>>>(
        '/announcements', { params },
      );
      return data.data;
    } catch {
      const stored = readStorage<Announcement[]>(ANNOUNCEMENTS_STORAGE_KEY, []);
      const filtered = params?.courseId
        ? stored.filter((item) => item.courseId === params.courseId)
        : stored;
      return {
        data: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        meta: { total: filtered.length, page: 1, limit: 20, totalPages: 1 },
      };
    }
  },

  create: async (payload: {
    courseId: string;
    courseTitle: string;
    subject: string;
    message: string;
    deliveryCount?: number;
  }): Promise<Announcement> => {
    try {
      const { data } = await apiClient.post<ApiResponse<Announcement>>('/announcements', payload);
      return data.data;
    } catch {
      const announcement: Announcement = {
        id: `announcement-${Date.now()}`,
        courseId: payload.courseId,
        courseTitle: payload.courseTitle,
        subject: payload.subject,
        message: payload.message,
        deliveryCount: payload.deliveryCount ?? 1,
        createdAt: new Date().toISOString(),
      };

      const stored = readStorage<Announcement[]>(ANNOUNCEMENTS_STORAGE_KEY, []);
      const next = [announcement, ...stored];
      writeStorage(ANNOUNCEMENTS_STORAGE_KEY, next);

      const notification: Notification = {
        id: `notification-${Date.now()}`,
        type: 'COURSE_ANNOUNCEMENT',
        title: payload.subject,
        message: payload.message,
        data: { announcementId: announcement.id, courseId: payload.courseId },
        read: false,
        createdAt: announcement.createdAt,
      };
      const existingNotifications = readStorage<Notification[]>(NOTIFICATIONS_STORAGE_KEY, []);
      const nextNotifications = [
        { ...notification, userKey: currentUserKey() },
        ...existingNotifications.filter((item) => item.id !== notification.id),
      ];
      writeStorage(NOTIFICATIONS_STORAGE_KEY, nextNotifications);
      emitNotificationsUpdated();
      return announcement;
    }
  },
};

// ----------------------------------------------------------
// Notifications
// ----------------------------------------------------------
export const notificationsApi = {
  list: async (params?: { unreadOnly?: boolean }) => {
    try {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>(
        '/notifications', { params },
      );
      return data.data;
    } catch {
      const stored = readStorage<Array<Notification & { userKey?: string }>>(NOTIFICATIONS_STORAGE_KEY, []);
      const forCurrentUser = stored.filter((item) => item.userKey === currentUserKey());
      const filtered = params?.unreadOnly ? forCurrentUser.filter((item) => !item.read) : forCurrentUser;
      return {
        data: filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        meta: { total: filtered.length, page: 1, limit: 20, totalPages: 1 },
      };
    }
  },
  markRead: async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {
      const stored = readStorage<Array<Notification & { userKey?: string }>>(NOTIFICATIONS_STORAGE_KEY, []);
      const updated = stored.map((item) => (item.id === id ? { ...item, read: true } : item));
      writeStorage(NOTIFICATIONS_STORAGE_KEY, updated);
      emitNotificationsUpdated();
    }
  },
  markAllRead: async () => {
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      const stored = readStorage<Array<Notification & { userKey?: string }>>(NOTIFICATIONS_STORAGE_KEY, []);
      const updated = stored.map((item) => ({ ...item, read: true }));
      writeStorage(NOTIFICATIONS_STORAGE_KEY, updated);
      emitNotificationsUpdated();
    }
  },
};

// ----------------------------------------------------------
// Users
// ----------------------------------------------------------
export const usersApi = {
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/users/me');
    return data.data;
  },
  updateMe: async (payload: { name?: string; email?: string; bio?: string }) => {
    const { data } = await apiClient.patch<ApiResponse<User>>('/users/me', payload);
    return data.data;
  },
  getInstructorStats: async () => {
    const { data } = await apiClient.get('/users/me/instructor-stats');
    return data.data;
  },
};

// ----------------------------------------------------------
// Uploads
// ----------------------------------------------------------
export const uploadsApi = {
  upload: async (file: File, type: 'thumbnail' | 'video' | 'resource' | 'assignment') => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post(`/uploads/${type}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data as { url: string; filename: string; size: number };
  },

  uploadAvatar: async (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);

    const token =
      typeof window !== 'undefined' ? localStorage.getItem('hamplard_token') : null;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        'POST',
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'}/uploads/avatar`,
      );
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const parsed = JSON.parse(xhr.responseText);
            resolve({ url: parsed?.data?.url ?? parsed?.url ?? '' });
          } catch {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error — please try again.'));
      xhr.send(form);
    });
  },
};

// ----------------------------------------------------------
// Bundles
// ----------------------------------------------------------
export const bundlesApi = {
  getBySlug: async (slug: string) => {
    const { data } = await apiClient.get<ApiResponse<Bundle>>(`/bundles/${slug}`);
    return data.data;
  },

  list: async (): Promise<Bundle[]> => {
    const { data } = await apiClient.get<ApiResponse<Bundle[]>>('/bundles');
    return data.data;
  },
};

// ----------------------------------------------------------
// Instructor Student Analytics
// ----------------------------------------------------------
export const instructorAnalyticsApi = {
  getStudents: async (params?: {
    courseId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StudentEnrollmentRow>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<StudentEnrollmentRow>>>(
      '/users/me/instructor-students', { params },
    );
    return data.data;
  },

  getStudentDetail: async (studentId: string): Promise<StudentDetail> => {
    const { data } = await apiClient.get<ApiResponse<StudentDetail>>(
      `/users/me/instructor-students/${studentId}`,
    );
    return data.data;
  },
};

// ----------------------------------------------------------
// Promo Codes
// ----------------------------------------------------------
export const promoCodesApi = {
  create: async (payload: {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    expiryDate: string;
    maxUses: number;
  }) => {
    const { data } = await apiClient.post('/promo-codes', payload);
    return data.data;
  },

  getMy: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<any>>>(
      '/promo-codes/my', { params },
    );
    return data.data;
  },

  toggleActive: async (promoCodeId: string, isActive: boolean) => {
    const { data } = await apiClient.patch(`/promo-codes/${promoCodeId}`, { isActive });
    return data.data;
  },

  validate: async (code: string, courseId: string) => {
    const { data } = await apiClient.post(`/promo-codes/validate`, { code, courseId });
    return data.data;
  },
};

// ----------------------------------------------------------
// Contact
// ----------------------------------------------------------
export const contactApi = {
  submitContactForm: async (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<{ id: string; createdAt: string }>>(
      '/contact',
      payload,
    );
    return data.data;
  },
};

