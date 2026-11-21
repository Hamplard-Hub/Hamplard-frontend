import React from 'react';
import { QrCode, Award, CheckCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CertificateProps {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  instructorName: string;
  certificateId: string;
  className?: string;
}

const CertificateLogo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-hamplard-deep text-saffron-400">
      <Award size={32} />
    </div>
    <span className="text-3xl font-display font-bold text-hamplard-deep tracking-tight">
      Hamplard
    </span>
  </div>
);

export function PrintCertificate({
  studentName,
  courseTitle,
  completionDate,
  instructorName,
  certificateId,
  className,
}: CertificateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col bg-white overflow-hidden shadow-card",
        "w-[1123px] h-[794px]", // A4 landscape at 96 DPI
        className
      )}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Outer Border */}
      <div className="absolute inset-4 border-2 border-hamplard-deep/20 rounded-xl" />
      {/* Inner Decorative Border */}
      <div className="absolute inset-6 border-[8px] border-hamplard-deep rounded-lg" />
      
      {/* Corner Accents */}
      <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-saffron-400" />
      <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-saffron-400" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-saffron-400" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-saffron-400" />

      {/* Content Container */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-24 text-center z-10">
        <CertificateLogo className="mb-12 scale-125" />

        <div className="space-y-6 mb-12">
          <h1 className="text-6xl font-display font-bold text-hamplard-deep tracking-wide uppercase">
            Certificate of Completion
          </h1>
          <p className="text-xl text-ink-500 font-sans tracking-widest uppercase">
            This is proudly presented to
          </p>
        </div>

        <div className="mb-12 border-b-2 border-saffron-400 px-16 pb-4">
          <h2 className="text-7xl font-display font-bold text-hamplard-deep italic">
            {studentName}
          </h2>
        </div>

        <div className="space-y-4 mb-16 max-w-4xl">
          <p className="text-xl text-ink-700 font-sans">
            for successfully completing the rigorous requirements and mastering the skills in
          </p>
          <h3 className="text-4xl font-display font-bold text-hamplard-mid">
            {courseTitle}
          </h3>
        </div>

        {/* Footer info */}
        <div className="flex w-full justify-between items-end mt-auto px-12">
          {/* Date & ID */}
          <div className="flex flex-col items-start gap-4">
            <div className="text-left">
              <p className="text-lg font-bold text-hamplard-deep">{completionDate}</p>
              <div className="h-0.5 w-32 bg-ink-200 mt-1 mb-1" />
              <p className="text-sm text-ink-500 uppercase tracking-wider">Date</p>
            </div>
            <p className="text-xs text-ink-500 font-mono">ID: {certificateId}</p>
          </div>

          {/* Verification Badge / QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-ink-100 flex flex-col items-center gap-1">
              <QrCode size={64} className="text-hamplard-deep" />
              <span className="text-[10px] text-ink-500 uppercase tracking-widest">Verify</span>
            </div>
          </div>

          {/* Signature */}
          <div className="flex flex-col items-end">
            <div className="text-right">
              <p className="text-2xl font-display italic text-hamplard-deep pr-4">{instructorName}</p>
              <div className="h-0.5 w-64 bg-ink-200 mt-1 mb-1" />
              <p className="text-sm text-ink-500 uppercase tracking-wider">Lead Instructor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-saffron-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-hamplard-lilac/50 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

export function DigitalCertificate({
  studentName,
  courseTitle,
  completionDate,
  instructorName,
  certificateId,
  className,
}: CertificateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col bg-ink-50 overflow-hidden shadow-2xl",
        "w-[1200px] h-[900px]", // Digital specific size
        className
      )}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Side Decorative Panel */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-hamplard-deep" />
      <div className="absolute left-8 top-0 bottom-0 w-2 bg-saffron-400" />

      {/* Content Container */}
      <div className="relative flex-1 flex flex-col p-24 pl-32 z-10">
        <div className="flex justify-between items-start mb-20">
          <CertificateLogo className="scale-150 origin-top-left" />
          <div className="flex flex-col items-end text-right">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-ink-100 flex flex-col items-center gap-2">
              <QrCode size={80} className="text-hamplard-deep" />
              <span className="text-xs text-ink-500 font-mono">Verify Authenticity</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-16">
          <h1 className="text-7xl font-display font-bold text-hamplard-deep tracking-tight">
            Certificate of<br />Completion
          </h1>
        </div>

        <div className="space-y-2 mb-8">
          <p className="text-2xl text-ink-500 font-sans">Presented to</p>
          <h2 className="text-8xl font-display font-bold text-hamplard-deep leading-none">
            {studentName}
          </h2>
        </div>

        <div className="space-y-4 mb-20 max-w-3xl">
          <p className="text-2xl text-ink-700 font-sans leading-relaxed">
            For successfully mastering the curriculum and demonstrating practical proficiency in
            <strong className="block text-4xl text-hamplard-mid mt-2">{courseTitle}</strong>
          </p>
        </div>

        {/* Footer info */}
        <div className="flex items-end gap-24 mt-auto">
          {/* Date */}
          <div className="flex flex-col items-start gap-2">
            <p className="text-xl font-bold text-hamplard-deep">{completionDate}</p>
            <div className="h-1 w-16 bg-saffron-400" />
            <p className="text-base text-ink-500 uppercase tracking-wider">Date</p>
          </div>

          {/* Signature */}
          <div className="flex flex-col items-start gap-2">
            <p className="text-3xl font-display italic text-hamplard-deep">{instructorName}</p>
            <div className="h-1 w-48 bg-saffron-400" />
            <p className="text-base text-ink-500 uppercase tracking-wider">Lead Instructor</p>
          </div>

          <div className="ml-auto mt-auto">
             <p className="text-sm text-ink-500 font-mono bg-white px-4 py-2 rounded-full border border-ink-200">
               Credential ID: {certificateId}
             </p>
          </div>
        </div>
      </div>

      {/* Modern Background Accents */}
      <div className="absolute right-0 bottom-0 w-[600px] h-[600px] bg-gradient-to-tl from-hamplard-lilac to-transparent opacity-50 rounded-tl-full pointer-events-none" />
      <div className="absolute right-[-100px] top-[-100px] w-[400px] h-[400px] bg-gradient-to-bl from-saffron-100 to-transparent opacity-50 rounded-full pointer-events-none" />
    </div>
  );
}

export function BadgeCertificate({
  studentName,
  courseTitle,
  completionDate,
  className,
}: Omit<CertificateProps, 'instructorName' | 'certificateId'>) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-hamplard-deep overflow-hidden rounded-3xl shadow-xl",
        "w-[400px] h-[400px] p-8 text-center", // Profile badge size
        className
      )}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Outer Glow / Ring */}
      <div className="absolute inset-2 border-2 border-saffron-400/30 rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-saffron-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Award size={48} className="text-hamplard-deep" />
        </div>
        
        <h3 className="text-saffron-400 font-sans text-sm tracking-widest uppercase mb-2">
          Certified
        </h3>
        
        <h4 className="text-white font-display text-2xl font-bold mb-6 leading-tight">
          {courseTitle}
        </h4>
        
        <div className="w-12 h-1 bg-saffron-400/50 mb-6 rounded-full" />
        
        <p className="text-hamplard-lilac font-sans text-lg mb-2">
          {studentName}
        </p>
        
        <p className="text-white/50 font-mono text-sm">
          {completionDate}
        </p>
      </div>

      <div className="absolute top-4 right-4 text-saffron-400/20">
        <CheckCircle size={120} />
      </div>
    </div>
  );
}
