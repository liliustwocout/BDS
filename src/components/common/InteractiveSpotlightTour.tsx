'use client';

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Filter,
  Building2,
  Box,
  PhoneCall,
  Sparkles,
  Compass,
} from 'lucide-react';
import { ROUTE_TO_TAB } from '@/types';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';

import { PAGE_TOUR_CONFIG, TourStep } from './tourConfig';

const STORAGE_KEY = 'spacevision_onboarding_dismissed';

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function InteractiveSpotlightTour() {
  const pathname = usePathname();
  const {
    showOnboardingGuide,
    closeOnboardingGuide,
    activeTab,
  } = useSpaceVisionStore();

  const currentTab = ROUTE_TO_TAB[pathname] || activeTab;
  const currentTourMeta = PAGE_TOUR_CONFIG[currentTab] || PAGE_TOUR_CONFIG.landing;
  const tourSteps = currentTourMeta.steps;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(250);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Reset step index whenever tour opens or tab changes
  useEffect(() => {
    if (showOnboardingGuide) {
      setCurrentStepIndex(0);
    }
  }, [showOnboardingGuide, currentTab]);

  // Dynamically measure actual tooltip height
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const h = tooltipRef.current.offsetHeight;
      if (h > 0 && Math.abs(h - tooltipHeight) > 4) {
        setTooltipHeight(h);
      }
    }
  });

  // Measure target element position smoothly
  const updateSpotlightPosition = useCallback(() => {
    if (!showOnboardingGuide) return;
    const step = tourSteps[currentStepIndex];
    if (!step) return;

    const el = document.querySelector(step.selector);
    if (!el) {
      requestAnimationFrame(() => {
        const retryEl = document.querySelector(step.selector);
        if (retryEl) {
          const rect = retryEl.getBoundingClientRect();
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [showOnboardingGuide, currentStepIndex, tourSteps]);

  // On step change or window scroll/resize, smoothly scroll target and update coordinates
  useEffect(() => {
    if (!showOnboardingGuide) return;

    const step = tourSteps[currentStepIndex];
    if (!step) return;

    const timer = setTimeout(() => {
      const el = document.querySelector(step.selector);
      if (el) {
        const elRect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const targetAbsY = window.scrollY + elRect.top;

        if (step.preferredPlacement === 'top') {
          // Scroll target so it rests in the lower portion (~65% of screen height)
          // Leaving ample room above for tooltip without overlapping
          const targetScroll = targetAbsY - (vh * 0.65 - elRect.height / 2);
          window.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth',
          });
        } else {
          // preferred 'bottom': Scroll target so it rests in the upper portion (~24% of screen height)
          // Leaving ample room below for tooltip without overlapping
          const targetScroll = targetAbsY - vh * 0.24;
          window.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: 'smooth',
          });
        }
      }
      updateSpotlightPosition();
    }, 60);

    const handleUpdate = () => {
      updateSpotlightPosition();
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, { passive: true });

    // Poll to track smooth scrolling until complete
    const interval = setInterval(updateSpotlightPosition, 50);
    const stopInterval = setTimeout(() => clearInterval(interval), 650);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearTimeout(stopInterval);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [showOnboardingGuide, currentStepIndex, updateSpotlightPosition]);

  // Keyboard controls: ArrowRight, ArrowLeft, Escape
  useEffect(() => {
    if (!showOnboardingGuide) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showOnboardingGuide, currentStepIndex]);

  const handleSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('spacevision_tour_seen_' + currentTab, 'true');
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    closeOnboardingGuide();
  }, [closeOnboardingGuide, currentTab]);

  const handleNext = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!showOnboardingGuide) return null;

  const currentStep = tourSteps[currentStepIndex];
  if (!currentStep) return null;

  const StepIcon = currentStep.icon;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === tourSteps.length - 1;
  const padding = currentStep.padding || 8;

  // Exact Clearance Geometry: Guarantees tooltip NEVER overlaps the highlighted target
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9995,
  };

  let placeAbove = false;
  let arrowLeftPercent = 50;

  if (targetRect) {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const tooltipWidth = Math.min(420, viewportWidth - 32);

    const GAP = 18; // Guaranteed gap between cutout border and tooltip box
    const targetTop = targetRect.top - padding;
    const targetBottom = targetRect.top + targetRect.height + padding;

    const spaceAbove = targetTop;
    const spaceBelow = viewportHeight - targetBottom;

    if (currentStep.preferredPlacement === 'top') {
      if (spaceAbove >= tooltipHeight + GAP + 12) {
        placeAbove = true;
      } else if (spaceBelow >= tooltipHeight + GAP + 12) {
        placeAbove = false;
      } else {
        placeAbove = spaceAbove >= spaceBelow;
      }
    } else {
      // Preferred 'bottom'
      if (spaceBelow >= tooltipHeight + GAP + 12) {
        placeAbove = false;
      } else if (spaceAbove >= tooltipHeight + GAP + 12) {
        placeAbove = true;
      } else {
        placeAbove = spaceAbove >= spaceBelow;
      }
    }

    let top = 0;
    if (placeAbove) {
      // Strictly ABOVE target: bottom edge of tooltip card is at (targetTop - GAP)
      top = targetTop - tooltipHeight - GAP;
      if (top < 12) top = 12;
    } else {
      // Strictly BELOW target: top edge of tooltip card is at (targetBottom + GAP)
      top = targetBottom + GAP;
      if (top + tooltipHeight > viewportHeight - 12) {
        top = Math.max(12, viewportHeight - tooltipHeight - 12);
      }
    }

    // Horizontal centering relative to target element
    let left = targetRect.left + (targetRect.width - tooltipWidth) / 2;
    if (left < 16) left = 16;
    if (left + tooltipWidth > viewportWidth - 16) {
      left = viewportWidth - tooltipWidth - 16;
    }

    // Arrow alignment pointing at target center
    const targetCenter = targetRect.left + targetRect.width / 2;
    const arrowX = targetCenter - left;
    arrowLeftPercent = Math.max(28, Math.min(tooltipWidth - 28, arrowX));

    tooltipStyle = {
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9995,
      transition: 'top 300ms cubic-bezier(0.16, 1, 0.3, 1), left 300ms cubic-bezier(0.16, 1, 0.3, 1)',
    };
  } else {
    // Fallback: center in screen if rect not measured yet
    tooltipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '420px',
      maxWidth: 'calc(100vw - 32px)',
      zIndex: 9995,
    };
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hướng dẫn tính năng tương tác"
      className="fixed inset-0 z-[9990] pointer-events-auto"
    >
      {/* 1. Backdrop Click Shield (prevents accidental clicks on underlying links during tour) */}
      <div
        className="fixed inset-0 z-[9991] bg-transparent"
      />

      {/* 2. Spotlight Cutout Box with 9999px Box Shadow (Illuminates target element, darkens surroundings) */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${Math.round(targetRect.top - padding)}px`,
            left: `${Math.round(targetRect.left - padding)}px`,
            width: `${Math.round(targetRect.width + padding * 2)}px`,
            height: `${Math.round(targetRect.height + padding * 2)}px`,
            borderRadius: '14px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.78), 0 0 30px rgba(56, 189, 248, 0.55)',
            border: '2.5px solid rgba(56, 189, 248, 0.95)',
            pointerEvents: 'none',
            zIndex: 9992,
            transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="ring-4 ring-sky-400/30"
        />
      )}

      {/* 3. Floating Tooltip Popover Card */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="relative rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xl text-slate-900 animate-fade-in"
      >
        {/* Downward pointer arrow (when tooltip is strictly above target) */}
        {targetRect && placeAbove && (
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: `${arrowLeftPercent}px`,
              transform: 'translateX(-50%) rotate(45deg)',
              width: '16px',
              height: '16px',
              backgroundColor: '#ffffff',
              borderRight: '1.5px solid #cbd5e1',
              borderBottom: '1.5px solid #cbd5e1',
              zIndex: 9996,
            }}
          />
        )}

        {/* Upward pointer arrow (when tooltip is strictly below target) */}
        {targetRect && !placeAbove && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: `${arrowLeftPercent}px`,
              transform: 'translateX(-50%) rotate(45deg)',
              width: '16px',
              height: '16px',
              backgroundColor: '#ffffff',
              borderLeft: '1.5px solid #cbd5e1',
              borderTop: '1.5px solid #cbd5e1',
              zIndex: 9996,
            }}
          />
        )}

        {/* Top Header of Card */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <StepIcon className="h-4 w-4" />
            </div>
            <span className="rounded bg-sky-50 px-2.5 py-1 font-mono text-xs font-bold text-sky-700 border border-sky-200">
              {currentStep.badge}
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Bỏ qua hướng dẫn"
          >
            <span>Bỏ qua</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-1.5 mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
            {currentStep.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Bottom Actions & Stepper Dots */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {tourSteps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-slate-900'
                    : idx < currentStepIndex
                    ? 'w-2.5 bg-slate-400'
                    : 'w-2.5 bg-slate-200'
                }`}
                title={`Bước ${idx + 1}: ${step.title}`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Quay lại</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition shadow-xs active:scale-[0.98]"
            >
              {isLastStep ? (
                <>
                  <span>Bắt đầu khám phá</span>
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Tiếp theo</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
