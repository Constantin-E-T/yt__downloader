import type { Metadata } from "next";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";

export const metadata: Metadata = {
  title: "TranscriptAI - AI-Powered YouTube Transcript Analysis",
  description:
    "Transform YouTube videos into actionable insights with AI. Download transcripts instantly and analyze them with advanced AI. Get summaries, extract code snippets, quotes, and action items. Free during beta. By Conn.Digital.",
};

export default function Home() {
  return (
    <div className="flex flex-col">
      <OnboardingModal />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
