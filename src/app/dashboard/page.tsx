import type { Metadata } from "next";

import { DashboardClient } from "@/app/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Merchant Console | PageControl",
  description: "Preview PageControl merchant keys, installation, and signing infrastructure.",
};

export default function DashboardPage() {
  return (
    <DashboardClient
      signingApiUrl={process.env.NEXT_PUBLIC_PAGECONTROL_API_URL || "Not connected"}
    />
  );
}
