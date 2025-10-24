"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  WelcomeSlide,
  HowItWorksSlide,
  FeaturesSlide,
  CallToActionSlide,
} from "./slides";

const ONBOARDING_KEY = "transcriptai-onboarding-completed";

const slides = [
  { component: WelcomeSlide, id: "welcome" },
  { component: HowItWorksSlide, id: "how-it-works" },
  { component: FeaturesSlide, id: "features" },
  { component: CallToActionSlide, id: "cta" },
];

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay to ensure smooth page load
      setTimeout(() => setIsOpen(true), 500);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentSlide]);

  // Don't render on server or before client hydration
  if (!isClient) {
    return null;
  }

  const CurrentSlideComponent = slides[currentSlide].component;
  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto p-0 sm:max-w-3xl"
        showCloseButton={false}
      >
        {/* Visually Hidden Title for Accessibility */}
        <DialogTitle className="sr-only">
          Welcome to TranscriptAI - Onboarding ({currentSlide + 1} of {slides.length})
        </DialogTitle>

        {/* Close/Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Skip onboarding"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Skip</span>
        </button>

        {/* Slide Content */}
        <div className="px-6 pt-6 sm:px-8">
          <div
            key={currentSlide}
            className="min-h-[450px] animate-in fade-in-0 slide-in-from-right-5 duration-300"
          >
            <CurrentSlideComponent />
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t bg-muted/50 px-6 py-4 sm:px-8">
          {/* Progress Dots */}
          <div className="mb-4 flex items-center justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all duration-500 ease-in-out ${
                  index === currentSlide
                    ? "w-8 bg-primary scale-110"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50 hover:scale-125"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstSlide}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Slide Counter */}
            <span className="text-sm text-muted-foreground">
              {currentSlide + 1} / {slides.length}
            </span>

            {/* Next/Get Started Button */}
            <Button onClick={handleNext} className="gap-2">
              {isLastSlide ? (
                <>
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
