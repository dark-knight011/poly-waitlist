import type { Metadata } from "next";
import WaitlistFlipFrame from "@/components/waitlist/WaitlistFlipFrame";

export const metadata: Metadata = {
  title: "Paper flip preview",
  robots: { index: false, follow: false },
};

export default function PaperFlipPreviewPage() {
  return <WaitlistFlipFrame brandName="Your Brand" />;
}
