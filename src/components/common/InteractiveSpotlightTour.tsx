'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';

const STORAGE_KEY = 'spacevision_onboarding_dismissed';

interface TourStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  selector: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preferredPlacement?: 'top' | 'bottom';
  padding?: number;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'search-input',
    stepNumber: 1,
    totalSteps: 5,
    selector: '#tour-search-input',
    badge: 'Bước 1/5 • AI Intent',
    title: 'Tìm kiếm bằng ý tưởng kinh doanh',
    description:
      'Gõ nhu cầu thực tế bằng ngôn ngữ tự nhiên (VD: "Tìm quán cafe acoustic Cầu Giấy dưới 30 triệu"). AI sẽ tự động phân tích ngành nghề, quận và ngân sách.',
    icon: Search,
    preferredPlacement: 'bottom',
    padding: 8,
  },
  {
    id: 'search-cta',
    stepNumber: 2,
    totalSteps: 5,
    selector: '#tour-search-cta',
    badge: 'Bước 2/5 • Bộ lọc & Chấm điểm',
    title: 'Bộ lọc nhanh & Nút Đề xuất AI',
    description:
      'Chọn nhanh mô hình kinh doanh, quận trung tâm hoặc mức giá, sau đó bấm "Tìm kiếm & Đề xuất AI" để hệ thống chấm điểm mức độ phù hợp (% Match).',
    icon: Filter,
    preferredPlacement: 'bottom',
    padding: 8,
  },
  {
    id: 'property-card',
    stepNumber: 3,
    totalSteps: 5,
    selector: '#tour-property-card',
    badge: 'Bước 3/5 • Mặt bằng thực tế',
    title: 'Thẻ mặt bằng & 4 chỉ số cốt lõi',
    description:
      'Mỗi mặt bằng hiển thị 4 chỉ số quan trọng nhất: Giá thuê (triệu/tháng), Diện tích (m²), Mặt tiền (m) và Số tầng, giúp bạn nắm bắt nhanh hiện trạng.',
    icon: Building2,
    preferredPlacement: 'top',
    padding: 8,
  },
  {
    id: '3d-actions',
    stepNumber: 4,
    totalSteps: 5,
    selector: '#tour-3d-actions',
    badge: 'Bước 4/5 • Khảo sát 3D',
    title: 'Khảo sát Bản đồ 3D & Không gian 3D Twin',
    description:
      'Bấm "Bản đồ 3D" để xem khối toà nhà lập thể và tiện ích quy hoạch; hoặc "Không gian 3D" để bóc tách từng tầng (Dollhouse) và đo kích thước phòng.',
    icon: Box,
    preferredPlacement: 'top',
    padding: 6,
  },
  {
    id: 'landlord-contact',
    stepNumber: 5,
    totalSteps: 5,
    selector: '#tour-landlord-contact',
    badge: 'Bước 5/5 • Liên hệ chính chủ',
    title: 'Kết nối Chủ nhà & Đặt lịch hẹn xem',
    description:
      'Gọi hotline trực tiếp, chat Zalo 1 chạm hoặc đặt lịch hẹn khảo sát thực địa với chủ nhà hoặc ban quản lý toà nhà mà không qua môi giới trung gian.',
    icon: PhoneCall,
    preferredPlacement: 'top',
    padding: 6,
  },
];

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function InteractiveSpotlightTour() {
  const {
    showOnboardingGuide,
    closeOnboardingGuide,
    activeTab,
    setActiveTab,
  } = useSpaceVisionStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // If tour is triggered but user is on another tab, switch to 'landing' first
  useEffect(() => {
    if (showOnboardingGuide && activeTab !== 'landing') {
      setActiveTab('landing');
    }
  }, [showOnboardingGuide, activeTab, setActiveTab]);

  // Measure and scroll target element into view smoothly
  const updateSpotlightPosition = useCallback(() => {
    if (!showOnboardingGuide) return;
    const step = TOUR_STEPS[currentStepIndex];
    if (!step) return;

    const el = document.querySelector(step.selector);
    if (!el) {
      // Element may not be rendered yet, retry in next frame
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
  }, [showOnboardingGuide, currentStepIndex]);

  // On step change or window scroll/resize, smoothly update coordinates
  useEffect(() => {
    if (!showOnboardingGuide) return;

    const step = TOUR_STEPS[currentStepIndex];
    if (!step) return;

    setIsTransitioning(true);

    const timer = setTimeout(() => {
      const el = document.querySelector(step.selector);
      if (el) {
        // Smooth scroll to target element
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
      updateSpotlightPosition();
      setIsTransitioning(false);
    }, 50);

    const handleUpdate = () => {
      updateSpotlightPosition();
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('scroll', handleUpdate, { passive: true });

    // Poll a few times after scroll to lock onto final position
    const interval = setInterval(updateSpotlightPosition, 100);
    const stopInterval = setTimeout(() => clearInterval(interval), 600);

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
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    closeOnboardingGuide();
  }, [closeOnboardingGuide]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
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

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;
  const padding = currentStep.padding || 8;

  // Compute Tooltip Popover Coordinates
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9995,
  };

  if (targetRect) {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const tooltipWidth = Math.min(420, viewportWidth - 32);

    // Prefer bottom placement unless target is near viewport bottom
    const spaceBelow = viewportHeight - (targetRect.top + targetRect.height + padding);
    const spaceAbove = targetRect.top - padding;

    let placeAbove = false;
    if (currentStep.preferredPlacement === 'top') {
      placeAbove = spaceAbove > 200 || spaceAbove > spaceBelow;
    } else {
      placeAbove = spaceBelow < 220 && spaceAbove > 220;
    }

    let top = 0;
    if (placeAbove) {
      top = Math.max(16, targetRect.top - padding - 210);
    } else {
      top = Math.min(viewportHeight - 220, targetRect.top + targetRect.height + padding + 14);
    }

    // Align left with target, clamp within screen
    let left = targetRect.left;
    if (left + tooltipWidth > viewportWidth - 16) {
      left = viewportWidth - tooltipWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    tooltipStyle = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9995,
      transition: 'all 350ms cubic-bezier(0.16, 1, 0.3, 1)',
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
        onClick={handleSkip}
        className="fixed inset-0 z-[9991] bg-transparent cursor-default"
        title="Bấm bên ngoài để bỏ qua hướng dẫn"
      />

      {/* 2. Spotlight Cutout Box with 9999px Box Shadow (Smoothly morphs to target element) */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top - padding}px`,
            left: `${targetRect.left - padding}px`,
            width: `${targetRect.width + padding * 2}px`,
            height: `${targetRect.height + padding * 2}px`,
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.78), 0 0 20px rgba(255, 255, 255, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            pointerEvents: 'none',
            zIndex: 9992,
            transition: 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="ring-4 ring-slate-900/40"
        />
      )}

      {/* 3. Floating Tooltip Popover Card */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xl text-slate-900 animate-fade-in"
      >
        {/* Top Header of Card */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <StepIcon className="h-4 w-4" />
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 border border-slate-200">
              {currentStep.badge}
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            title="Bỏ qua hướng dẫn (Để sau)"
          >
            <span>Bỏ qua (Để sau)</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-1.5 mb-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {currentStep.title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Bottom Actions & Stepper Dots */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-5 bg-slate-900'
                    : idx < currentStepIndex
                    ? 'w-2 bg-slate-400'
                    : 'w-2 bg-slate-200'
                }`}
                title={`Bước ${idx + 1}: ${step.title}`}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-1.5">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Quay lại</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
            >
              {isLastStep ? (
                <>
                  <span>Bắt đầu khám phá</span>
                  <Check className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Tiếp theo</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
