'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { ROUTE_TO_TAB } from '@/types';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { PAGE_TOUR_CONFIG } from './tourConfig';

export function PageTourPromptToast() {
  const pathname = usePathname();
  const { activeTab, showOnboardingGuide, openOnboardingGuide } = useSpaceVisionStore();
  const [isVisible, setIsVisible] = useState(false);

  const currentTab = ROUTE_TO_TAB[pathname] || activeTab;
  const tourMeta = PAGE_TOUR_CONFIG[currentTab] || PAGE_TOUR_CONFIG.landing;

  useEffect(() => {
    // If tour is already open or on landing page (handled by main welcome), hide toast
    if (showOnboardingGuide || currentTab === 'landing') {
      setIsVisible(false);
      return;
    }

    if (typeof window === 'undefined') return;

    // Check if user has already dismissed or completed the tour for this page
    const seen = localStorage.getItem(`spacevision_tour_seen_${currentTab}`);
    if (!seen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [currentTab, showOnboardingGuide]);

  const handleStartTour = () => {
    setIsVisible(false);
    openOnboardingGuide();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`spacevision_tour_seen_${currentTab}`, 'true');
    }
  };

  if (!isVisible || showOnboardingGuide) return null;

  return (
    <div
      role="alert"
      className="no-print fixed bottom-14 right-4 z-40 max-w-sm rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-md animate-fade-in text-slate-900 pointer-events-auto"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              Hướng dẫn {tourMeta.pageTitle}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Khám phá {tourMeta.steps.length} công cụ cốt lõi trong 1 phút
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Bỏ qua nhắc nhở"
          aria-label="Đóng"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
        <button
          onClick={handleDismiss}
          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
        >
          Để sau
        </button>
        <button
          onClick={handleStartTour}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
        >
          <span>Khám phá ngay</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
