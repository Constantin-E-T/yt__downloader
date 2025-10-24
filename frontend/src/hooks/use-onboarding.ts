"use client";

import { useState, useEffect } from "react";

const ONBOARDING_KEY = "transcriptai-onboarding-completed";

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(completed === "true");
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setHasCompletedOnboarding(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
  };

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
    isClient,
  };
}
