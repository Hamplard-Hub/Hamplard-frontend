'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'user-accounts', label: 'User Accounts' },
  { id: 'intellectual-property', label: 'Intellectual Property Rights' },
  { id: 'user-conduct', label: 'User Conduct' },
  { id: 'limitations', label: 'Limitations of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'modifications', label: 'Modifications to Service' },
  { id: 'termination', label: 'Termination' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'contact', label: 'Contact Us' },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] print:bg-white">
      <TopBar />
      <main className="mx-auto flex max-w-6xl gap-8 px-6 py-12 xl:px-10">
        {/* Left sidebar - Table of Contents */}
        <aside className="sticky top-24 hidden h-fit w-48 flex-shrink-0 lg:block print:hidden">
          <nav className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7F77DD]">
              On this page
            </p>
            <ul className="space-y-2">
              {sections.map(({ id, label }) => (
                <li key={id}>
                  <Link
                    href={`#${id}`}
                    className={`block rounded px-3 py-2 text-sm transition-colors ${
                      activeSection === id
                        ? 'bg-[#EEEDFE] font-semibold text-[#26215C]'
                        : 'text-[#5A5578] hover:text-[#26215C]'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <section className="rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7F77DD]">
              Terms of Service
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#26215C] sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-sm text-[#5A5578]">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </section>

          <div className="mt-8 space-y-12 rounded-[32px] border border-[#D5D2F6] bg-white p-8 shadow-sm prose prose-sm max-w-none print:rounded-none print:border-none print:p-0 print:shadow-none">
            {/* Overview Section */}
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Overview</h2>
              <p className="text-[#5A5578]">
                Welcome to Hamplard. These Terms of Service ("Terms") govern your access to and use of the Hamplard platform, website, and services (collectively, the "Service"). By accessing or using Hamplard, you agree to be bound by these Terms. If you do not agree to any part of these Terms, you may not use the Service.
              </p>
              <p className="text-[#5A5578]">
                Hamplard is an online learning platform that provides vocational courses in tailoring, makeup artistry, baking, photography, and other practical skills to learners across Africa.
              </p>
            </section>

            {/* User Accounts Section */}
            <section id="user-accounts" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">User Accounts</h2>
              <p className="text-[#5A5578]">
                To access certain features of Hamplard, you may be required to create an account. You agree to provide accurate, current, and complete information during the registration process and to maintain the confidentiality of your password and account information.
              </p>
              <p className="text-[#5A5578]">
                You are responsible for all activities that occur under your account. You agree to notify Hamplard immediately of any unauthorized use of your account or any other breach of security.
              </p>
              <p className="text-[#5A5578]">
                You must be at least 18 years old to create an account and use the Service. If you are under 18, you may only use the Service under the supervision of a parent or guardian who agrees to be bound by these Terms.
              </p>
            </section>

            {/* Intellectual Property Rights Section */}
            <section id="intellectual-property" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Intellectual Property Rights</h2>
              <p className="text-[#5A5578]">
                All course content, materials, designs, and intellectual property on Hamplard (including but not limited to videos, text, images, and code) are owned by Hamplard or its content providers and are protected by copyright and other intellectual property laws.
              </p>
              <p className="text-[#5A5578]">
                You are granted a limited, non-exclusive, non-transferable license to access and view the course materials for your personal learning purposes only. You may not reproduce, distribute, modify, or create derivative works of any course materials without prior written consent from Hamplard.
              </p>
              <p className="text-[#5A5578]">
                Any user-generated content you submit to Hamplard (including comments, reviews, and projects) may be used by Hamplard to improve the Service and may be shared with other users.
              </p>
            </section>

            {/* User Conduct Section */}
            <section id="user-conduct" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">User Conduct</h2>
              <p className="text-[#5A5578]">
                You agree to use Hamplard only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of the Service. Prohibited behavior includes:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-[#5A5578]">
                <li>Harassing or causing distress or inconvenience to any person</li>
                <li>Transmitting illegal or unauthorized content</li>
                <li>Attempting to gain unauthorized access to systems or networks</li>
                <li>Disrupting the normal flow of dialogue within Hamplard</li>
                <li>Reverse engineering or attempting to discover source code or algorithms</li>
                <li>Circumventing access controls or geographic restrictions</li>
              </ul>
            </section>

            {/* Limitations of Liability Section */}
            <section id="limitations" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Limitations of Liability</h2>
              <p className="text-[#5A5578]">
                To the fullest extent permitted by law, Hamplard shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, even if advised of the possibility of such damages.
              </p>
              <p className="text-[#5A5578]">
                Hamplard does not warrant that the Service will be uninterrupted, error-free, or free of viruses or malicious code. Your use of the Service is at your own risk.
              </p>
            </section>

            {/* Indemnification Section */}
            <section id="indemnification" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Indemnification</h2>
              <p className="text-[#5A5578]">
                You agree to indemnify and hold harmless Hamplard, its operators, instructors, and other users from any claims, damages, or costs (including legal fees) arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            {/* Modifications to Service Section */}
            <section id="modifications" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Modifications to Service</h2>
              <p className="text-[#5A5578]">
                Hamplard reserves the right to modify, suspend, or discontinue the Service or any features thereof at any time. We may also update these Terms from time to time. Continued use of the Service following any modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>

            {/* Termination Section */}
            <section id="termination" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Termination</h2>
              <p className="text-[#5A5578]">
                Hamplard may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including if you breach these Terms or engage in conduct that violates applicable laws.
              </p>
              <p className="text-[#5A5578]">
                You may terminate your account at any time by contacting Hamplard support. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            {/* Governing Law Section */}
            <section id="governing-law" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Governing Law</h2>
              <p className="text-[#5A5578]">
                These Terms and your use of Hamplard are governed by and construed in accordance with the laws of the jurisdiction in which Hamplard operates, without regard to its conflict of law provisions.
              </p>
              <p className="text-[#5A5578]">
                You agree to submit to the exclusive jurisdiction of the courts in that jurisdiction for the resolution of any disputes.
              </p>
            </section>

            {/* Contact Section */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#26215C]">Contact Us</h2>
              <p className="text-[#5A5578]">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 space-y-2 text-[#5A5578]">
                <p>
                  <span className="font-semibold">Email:</span>{' '}
                  <Link href="mailto:support@hamplard.app" className="text-[#7F77DD] hover:underline">
                    support@hamplard.app
                  </Link>
                </p>
                <p>
                  <span className="font-semibold">Website:</span>{' '}
                  <Link href="https://hamplard.app" className="text-[#7F77DD] hover:underline">
                    hamplard.app
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
