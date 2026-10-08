import WaitlistInitialFrame from "@/components/waitlist/WaitlistInitialFrame";

export default function HomePage() {
  const demo =
    process.env.NODE_ENV !== "production" &&
    process.env.WAITLIST_DEMO_MODE === "true";

  return (
    <WaitlistInitialFrame
      brandName="Your Brand"
      demo={demo}
    />
  );
}