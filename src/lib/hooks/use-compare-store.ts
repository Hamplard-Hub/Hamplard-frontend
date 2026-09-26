import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course } from '@/types';

interface CompareStore {
  courses: Course[];
  add: (course: Course) => void;
  remove: (courseId: string) => void;
  clear: () => void;
  isComparing: (courseId: string) => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      courses: [],
      
      add: (course) => {
        const { courses } = get();
        if (courses.length >= 3) return;
        if (courses.some((c) => c.id === course.id)) return;
        set({ courses: [...courses, course] });
      },
      
      remove: (courseId) => {
        set({ courses: get().courses.filter((c) => c.id !== courseId) });
      },
      
      clear: () => {
        set({ courses: [] });
      },
      
      isComparing: (courseId) => {
        return get().courses.some((c) => c.id === courseId);
      },
    }),
    {
      name: 'course-compare-storage',
    }
  )
);
