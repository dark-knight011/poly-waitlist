import type { Metadata } from "next";
import WaitlistFinalFrame from "../../../components/waitlist/WaitlistFinalFrame";

export const metadata: Metadata = {
  title: "Final frame preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FinalFramePreviewPage() {
  return <WaitlistFinalFrame />;
}