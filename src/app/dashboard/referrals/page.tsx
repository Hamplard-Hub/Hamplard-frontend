"use client";

import ReferralDashboard from "@/components/referral/ReferralDashboard";

export default function ReferralsPage() {
  return (
    <ReferralDashboard
      referralCode="student"
      stats={{
        sent: 0,
        enrolled: 0,
        rewardsEarned: 0,
      }}
      referrals={[]}
    />
  );
}
