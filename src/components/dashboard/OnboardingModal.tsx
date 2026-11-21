'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const ONBOARDING_KEY = 'hamplard_onboarding_completed';

const CATEGORIES = [
  'Tailoring',
  'Makeup Artistry',
  'Baking',
  'Hairstyling',
  'Photography',
  'Nail Technology',
  'Fashion Design',
  'Eyelash Extension',
  'Other',
];

interface OnboardingStep {
  id: number;
  title: string;
  description?: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Hamplard',
    description: "Let's get started on your learning journey",
  },
  {
    id: 2,
    title: 'Pick Your Interests',
    description: 'Select the categories you want to explore',
  },
  {
    id: 3,
    title: 'Set Your First Goal',
    description: 'What do you want to learn first?',
  },
  {
    id: 4,
    title: "You're All Set!",
    description: 'Ready to start browsing courses',
  },
];

interface OnboardingModalProps {
  onClose?: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [learningGoal, setLearningGoal] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Check if onboarding has been completed
  useEffect(() => {
    const isCompleted = localStorage.getItem(ONBOARDING_KEY);
    if (!isCompleted) {
      setShowModal(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    // Fire confetti
    fireConfetti();
    setTimeout(() => {
      setShowModal(false);
      onClose?.();
    }, 1500);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      if (Date.now() > end) return;

      confetti({
        particleCount: 2,
        angle: Math.random() * 360,
        spread: Math.random() * 360,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ['#7f77dd', '#26215c', '#eeedfe', '#3c3489'],
      });

      requestAnimationFrame(frame);
    };

    frame();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 p-1 hover:bg-ink-100 rounded-lg transition-colors"
          aria-label="Close onboarding"
        >
          <X className="w-5 h-5 text-ink-500" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎓</div>
              <h1 className="font-display text-3xl font-bold text-ink-900">
                Welcome to Hamplard
              </h1>
              <p className="text-lg text-ink-600">
                Let's get started on your learning journey
              </p>
              <p className="text-sm text-ink-500">
                Discover thousands of practical skills courses from expert instructors
              </p>
            </div>
          )}

          {/* Step 2: Pick Interests */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">
                  Pick Your Interests
                </h2>
                <p className="text-sm text-ink-600">
                  Select the categories you want to explore
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      'px-3 py-2 rounded-lg font-medium text-sm transition-all',
                      selectedCategories.includes(category)
                        ? 'bg-hamplard-primary text-white'
                        : 'bg-ink-100 text-ink-700 hover:bg-ink-200',
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <p className="text-xs text-ink-500">
                You can update this anytime in your settings
              </p>
            </div>
          )}

          {/* Step 3: Learning Goal */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink-900 mb-2">
                  Set Your First Goal
                </h2>
                <p className="text-sm text-ink-600">
                  What do you want to learn first?
                </p>
              </div>

              <textarea
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder="E.g., I want to learn tailoring to start my own business"
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-hamplard-primary focus:border-transparent resize-none text-sm"
                rows={4}
              />

              <p className="text-xs text-ink-500">
                This helps us personalize your learning experience
              </p>
            </div>
          )}

          {/* Step 4: Completion */}
          {currentStep === 4 && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h2 className="font-display text-3xl font-bold text-ink-900">
                You're All Set!
              </h2>
              <p className="text-lg text-ink-600">
                Get ready to discover amazing courses
              </p>
              <div className="bg-hamplard-lilac p-4 rounded-lg">
                <p className="text-sm text-hamplard-deep">
                  ✨ Your personalized dashboard is ready
                </p>
              </div>
            </div>
          )}

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 my-8">
            {STEPS.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  currentStep === step.id
                    ? 'bg-hamplard-primary w-8'
                    : 'bg-ink-200 hover:bg-ink-300',
                )}
                aria-label={`Go to step ${step.id}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {/* Back Button */}
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-ink-100 rounded-lg transition-colors"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-5 h-5 text-ink-600" />
              </button>
            )}

            {/* Skip Button */}
            {currentStep < 4 && (
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 rounded-lg transition-colors"
              >
                Skip
              </button>
            )}

            {/* Next/Finish Button */}
            <Button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2"
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
            >
              {currentStep === STEPS.length ? 'Start Browsing' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
