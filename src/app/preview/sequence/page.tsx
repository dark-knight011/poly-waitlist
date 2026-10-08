import type { Metadata } from "next";
import WaitlistSequenceFrame from "@/components/waitlist/WaitlistSequenceFrame";

export const metadata: Metadata = {
  title: "Complete handoff preview",
  robots: { index: false, follow: false },
};

export default function SequencePreviewPage() {
  return <WaitlistSequenceFrame brandName="Your Brand" />;
}
