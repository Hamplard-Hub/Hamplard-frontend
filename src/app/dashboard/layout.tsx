import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar }  from '@/components/layout/TopBar';

// Authenticated area. robots.txt disallows /dashboard, and this noindexes any
// dashboard URL a crawler reaches by other means (a shared or linked one).
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-ink-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
