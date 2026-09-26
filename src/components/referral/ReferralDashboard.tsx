"use client";

import { useState } from "react";

interface Referral {
  id: string;
  friendName: string;
  courseName: string;
  rewardAmount: number;
  payoutStatus: "PENDING" | "PAID" | "PROCESSING";
}

interface ReferralStats {
  sent: number;
  enrolled: number;
  rewardsEarned: number;
}

interface Props {
  referralCode: string;
  stats: ReferralStats;
  referrals: Referral[];
}

const statusStyles = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  PROCESSING: "bg-blue-50 text-blue-700",
};

export default function ReferralDashboard({
  referralCode,
  stats,
  referrals,
}: Props) {
  const [copied, setCopied] = useState(false);

  const referralLink = `https://hamplard.com/ref/${referralCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("Join me on Hamplard");
    const body = encodeURIComponent(
      `Hey! Join me on Hamplard and start learning today: ${referralLink}`,
    );

    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `Hey! Join me on Hamplard and start learning today: ${referralLink}`,
    );

    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareLinkedIn = () => {
    const url = encodeURIComponent(referralLink);

    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Refer & Earn</h1>
        <p className="text-sm text-ink-500 mt-1">
          Invite your friends to Hamplard and earn rewards when they enroll.
        </p>
      </div>

      {/* Referral link */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">Your referral link</h2>
        <p className="text-sm text-ink-500 mt-1">
          Share this link with your friends to invite them to Hamplard.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="flex-1 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm truncate">
            {referralLink}
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="btn-primary whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button type="button" onClick={shareEmail} className="btn-secondary">
            Email
          </button>

          <button
            type="button"
            onClick={shareWhatsApp}
            className="btn-secondary"
          >
            WhatsApp
          </button>

          <button
            type="button"
            onClick={shareLinkedIn}
            className="btn-secondary"
          >
            LinkedIn
          </button>
        </div>
      </section>

      {/* Stats */}
      <section>
        <h2 className="section-heading">Referral stats</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-sm text-ink-500">Referrals sent</p>
            <p className="text-2xl font-semibold mt-2">{stats.sent}</p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-ink-500">Referrals enrolled</p>
            <p className="text-2xl font-semibold mt-2">{stats.enrolled}</p>
          </div>

          <div className="card p-5">
            <p className="text-sm text-ink-500">Rewards earned</p>
            <p className="text-2xl font-semibold mt-2">
              {stats.rewardsEarned.toLocaleString()} XLM
            </p>
          </div>
        </div>
      </section>

      {/* Rewards */}
      <section>
        <h2 className="section-heading">Referral rewards</h2>

        <div className="card overflow-hidden">
          {referrals.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-ink-500">
                You haven&apos;t earned any referral rewards yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100">
                    <th className="text-left font-medium px-5 py-4">Friend</th>
                    <th className="text-left font-medium px-5 py-4">Course</th>
                    <th className="text-left font-medium px-5 py-4">Reward</th>
                    <th className="text-left font-medium px-5 py-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {referrals.map((referral) => (
                    <tr
                      key={referral.id}
                      className="border-b border-ink-100 last:border-0"
                    >
                      <td className="px-5 py-4">{referral.friendName}</td>
                      <td className="px-5 py-4">{referral.courseName}</td>
                      <td className="px-5 py-4">
                        {referral.rewardAmount.toLocaleString()} XLM
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyles[referral.payoutStatus]
                          }`}
                        >
                          {referral.payoutStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="section-heading">How it works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Share your link",
              description: "Send your unique referral link to friends.",
            },
            {
              step: "2",
              title: "Friend enrolls",
              description: "Your friend signs up and enrolls in a paid course.",
            },
            {
              step: "3",
              title: "Earn rewards",
              description: "You receive a reward when the referral qualifies.",
            },
          ].map((item) => (
            <div key={item.step} className="card p-5">
              <div className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center font-semibold">
                {item.step}
              </div>

              <h3 className="font-semibold mt-4">{item.title}</h3>
              <p className="text-sm text-ink-500 mt-2">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
