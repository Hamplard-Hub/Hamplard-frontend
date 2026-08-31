'use client';

import { Star, Quote } from 'lucide-react';

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  courseCategory: string;
  avatarUrl?: string;
  quote: string;
  rating: number;
};

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Amina Bello',
    role: 'Master Fashion Designer & Tailor',
    courseCategory: 'Tailoring & Garment Design',
    quote:
      'Teaching on Hamplard transformed my business. I went from training 5 apprentices locally in Lagos to reaching over 2,500 students across 12 countries.',
    rating: 5,
  },
  {
    id: '2',
    name: 'Chef David Okafor',
    role: 'Pastry Chef & Bakery Owner',
    courseCategory: 'Artisanal Baking',
    quote:
      'The platform made video course upload and student QA seamless. My passive income from course sales now funds my new bakery location.',
    rating: 5,
  },
  {
    id: '3',
    name: 'Kemi Adebayo',
    role: 'Celebrity Makeup Artist',
    courseCategory: 'Bridal & Editorial Makeup',
    quote:
      'The instructor support team helped me structure my curriculum professionally. Students love the step-by-step close-up video lessons!',
    rating: 5,
  },
];

export function InstructorTestimonials() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {TESTIMONIALS.map((t) => (
        <div
          key={t.id}
          className="flex flex-col justify-between rounded-3xl border border-[#D5D2F6] bg-white p-8 shadow-sm transition hover:shadow-md"
        >
          <div>
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400" />
              ))}
            </div>

            <Quote className="mt-4 h-8 w-8 text-[#7F77DD]/30" />

            <p className="mt-2 text-sm leading-relaxed text-[#26215C] font-normal italic">
              "{t.quote}"
            </p>
          </div>

          <div className="mt-8 border-t border-[#EEEDFE] pt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#7F77DD]/20 text-[#7F77DD] flex items-center justify-center font-bold text-base">
              {t.name[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-[#26215C]">{t.name}</p>
              <p className="text-xs text-[#5A5578]">{t.role}</p>
              <span className="mt-1 inline-block text-[10px] font-semibold text-[#7F77DD]">
                {t.courseCategory}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
