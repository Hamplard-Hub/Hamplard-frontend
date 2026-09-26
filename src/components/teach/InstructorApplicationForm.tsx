'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { instructorApplicationSchema, type InstructorApplicationValues } from '@/lib/validations/instructor-application';

export default function InstructorApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InstructorApplicationValues>({
    resolver: zodResolver(instructorApplicationSchema),
  });

  const onSubmit = async (data: InstructorApplicationValues) => {
    await new Promise((r) => setTimeout(r, 500));
    console.log(data);
    setSubmitted(true);
    reset();
  };

  if (submitted) {
    return (
      <div className="roundled-bg bg-green-50 p-8 text-center">
        <p className="text-2xl font-bold text-green-700">Application received!</p>
        <p className="mt-2 text-green-600">We will get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y4">
      <input placeholder="Name" {...register('name')} className="w-full rounded-border p-2" />
      {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      <input type="email" placeholder="Email" {...register('email')} className="w-full rounded-border p-2" />
      {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      <input type="text" placeholder="Expertise Area" {...register('expertiseArea')} className="w-full rounded-border p-2" />
      {errors.expertiseArea && <p className="text-sm text-red-600">{errors.expertiseArea.message}</p>}
      <input type="url" placeholder="Linkedin or Portfolio URL" {...register('portfolioUrl')} className="w-full rounded-border p-2" />
      {errors.portfolioUrl && <p className="text-sm text-red-600">{errors.portfolioUrl.message}</p>}
      <textarea placeholder="Brief bio" rows{4} {...register('bio')} className="w-full rounded-border p-2" />
      {errors.bio && <p className="text-sm text-red-600">{errors.bio.message}</p>}
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">Submit Application</button>
    </form>
  );
}
