'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Check,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { ActiveTab, TAB_ROUTES, ROUTE_TO_TAB } from '@/types';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { TopNav, NAV_TABS } from '@/components/layout/TopNav';
import { InteractiveSpotlightTour } from '@/components/common/InteractiveSpotlightTour';
import { PageTourPromptToast } from '@/components/common/PageTourPromptToast';

const TAB_ORDER: ActiveTab[] = [
  'landing',
  'discovery',
  'location',
  'twin',
  'environment',
  'studio',
  'comparison',
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    activeTab,
    setActiveTab,
    properties,
    selectedPropertyId,
    comparedPropertyIds,
    toggleCompareProperty,
    openOnboardingGuide,
  } = useSpaceVisionStore();

  const prevPathnameRef = useRef<string | null>(null);
  const prevActiveTabRef = useRef<ActiveTab>(activeTab);

  // Conflict-free bidirectional sync between URL pathname and Zustand activeTab
  useEffect(() => {
    const pathnameChanged = pathname !== prevPathnameRef.current;
    const activeTabChanged = activeTab !== prevActiveTabRef.current;

    if (pathnameChanged) {
      prevPathnameRef.current = pathname;
      const matchedTab = ROUTE_TO_TAB[pathname];
      if (matchedTab) {
        prevActiveTabRef.current = matchedTab;
        if (matchedTab !== activeTab) {
          setActiveTab(matchedTab);
        }
      }
      return;
    }

    if (activeTabChanged) {
      prevActiveTabRef.current = activeTab;
      const expectedRoute = TAB_ROUTES[activeTab];
      if (expectedRoute && pathname !== expectedRoute) {
        router.push(expectedRoute);
      }
    }
  }, [pathname, activeTab, setActiveTab, router]);

  // First-time visitor welcome prompt check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('spacevision_onboarding_dismissed');
      if (!isDismissed && pathname === '/') {
        const timer = setTimeout(() => {
          openOnboardingGuide();
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [openOnboardingGuide, pathname]);

  // Global Keyboard shortcuts: Alt+0 .. Alt+6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === '0') {
        e.preventDefault();
        router.push(TAB_ROUTES.landing);
        return;
      }
      const index = parseInt(e.key, 10);
      if (index >= 1 && index <= 6 && index < TAB_ORDER.length) {
        e.preventDefault();
        router.push(TAB_ROUTES[TAB_ORDER[index]]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const currentTab: ActiveTab = ROUTE_TO_TAB[pathname] || activeTab;

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [properties, selectedPropertyId]
  );

  const currentTabMeta = useMemo(() => {
    return NAV_TABS.find((t) => t.id === currentTab) || NAV_TABS[0];
  }, [currentTab]);

  const currentStepIndex = TAB_ORDER.indexOf(currentTab);
  const prevTab = currentStepIndex > 0 ? NAV_TABS[currentStepIndex - 1] : null;
  const nextTab =
    currentStepIndex < NAV_TABS.length - 1 ? NAV_TABS[currentStepIndex + 1] : null;

  const isSelectedCompared = selectedProperty
    ? comparedPropertyIds.includes(selectedProperty.id)
    : false;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Architectural Navigation System */}
      <TopNav />

      {/* Main Page View Slot */}
      <main className="relative flex-1 overflow-x-hidden">{children}</main>

      {/* Interactive Contextual Spotlight Tour for Current Page */}
      <InteractiveSpotlightTour />

      {/* Subtle First-Time Visit Prompt Toast for Each Specialized Page */}
      <PageTourPromptToast />

      {/* Bottom Contextual Workflow Bar (Active when exploring tools beyond landing) */}
      {pathname !== '/' && (
        <footer className="no-print sticky bottom-0 z-30 h-11 w-full border-t border-slate-200 bg-white/95 px-3 lg:px-5 backdrop-blur-md shadow-[0_-1px_3px_0_rgba(0,0,0,0.03)]">
          <div className="mx-auto flex h-full max-w-[1920px] items-center justify-between gap-3 text-xs">
            {/* Left: Current Step Progress & Active Property Context */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 border border-slate-200">
                  {currentTabMeta.step !== '00' ? `Bước ${currentTabMeta.step}/06` : 'Cổng thông tin'}
                </span>
                <span className="font-semibold text-slate-900 truncate">
                  {currentTabMeta.label}
                </span>
              </div>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:inline truncate text-[11px] text-slate-500">
                {currentTabMeta.description}
              </span>
            </div>

            {/* Center/Right: Compare Quick Toggle + Prev/Next Step Workflow Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedProperty && (
                <div className="hidden sm:flex items-center gap-2 mr-1">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Building2 className="h-3.5 w-3.5 text-slate-600" />
                    <strong className="text-slate-800">
                      {selectedProperty.code}
                    </strong>
                  </span>
                  <button
                    onClick={() => toggleCompareProperty(selectedProperty.id)}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                      isSelectedCompared
                        ? 'border-slate-300 bg-slate-100 text-slate-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    title="Thêm hoặc gỡ mặt bằng đang chọn khỏi danh sách So sánh (Tối đa 3)"
                  >
                    {isSelectedCompared ? (
                      <>
                        <Check className="h-3 w-3 text-slate-800" />
                        <span>Đã ghim so sánh ({comparedPropertyIds.length}/3)</span>
                      </>
                    ) : (
                      <>
                        <GitCompare className="h-3 w-3 text-slate-500" />
                        <span>+ Ghim so sánh ({comparedPropertyIds.length}/3)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {/* Contextual Help Guide Button for Current Page */}
                <button
                  onClick={() => openOnboardingGuide()}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                  title={`Xem hướng dẫn sử dụng cho ${currentTabMeta.label}`}
                >
                  <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                  <span className="hidden md:inline">Hướng dẫn trang này</span>
                </button>

                {prevTab && (
                  <button
                    onClick={() => router.push(TAB_ROUTES[prevTab.id])}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                    title={`Quay lại ${prevTab.label} (${prevTab.shortcut})`}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{prevTab.shortLabel}</span>
                  </button>
                )}

                {nextTab ? (
                  <button
                    onClick={() => router.push(TAB_ROUTES[nextTab.id])}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
                    title={`Tiếp tục sang ${nextTab.label} (${nextTab.shortcut})`}
                  >
                    <span>{nextTab.shortLabel}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(TAB_ROUTES.landing)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                    title="Hoàn tất quy trình khảo sát & Về trang chủ"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Hoàn tất khảo sát</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
