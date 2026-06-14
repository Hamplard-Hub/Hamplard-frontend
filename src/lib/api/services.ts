import { apiClient } from './client';
import type {
  ApiResponse, PaginatedResponse, Course, Enrollment,
  Certificate, Notification, User, Category,
} from '@/types';

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
// Notifications
// ----------------------------------------------------------
export const notificationsApi = {
  list: async (params?: { unreadOnly?: boolean }) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>(
      '/notifications', { params },
    );
    return data.data;
  },
  markRead:    async (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: async ()           => apiClient.patch('/notifications/read-all'),
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
};
