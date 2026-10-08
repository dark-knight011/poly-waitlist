import type { Metadata } from "next";
import WaitlistHandoffFrame from "@/components/waitlist/WaitlistHandoffFrame";

export const metadata: Metadata = {
  title: "Handoff preview",
  robots: { index: false, follow: false },
};

export default function HandoffPreviewPage() {
  return <WaitlistHandoffFrame brandName="Your Brand" />;
}
