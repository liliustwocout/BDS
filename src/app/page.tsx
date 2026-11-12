'use client';

import React, { useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Check,
  Building2,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { ActiveTab } from '@/types';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';
import { TopNav, NAV_TABS } from '@/components/layout/TopNav';
import { OnboardingGuideModal } from '@/components/common/OnboardingGuideModal';
import LandingPageView from '@/components/pages/LandingPageView';
import DiscoveryView from '@/components/pages/DiscoveryView';
import LocationIntelView from '@/components/pages/LocationIntelView';
import DigitalTwinView from '@/components/pages/DigitalTwinView';
import EnvironmentSimView from '@/components/pages/EnvironmentSimView';
import BusinessSetupView from '@/components/pages/BusinessSetupView';
import ComparisonReportView from '@/components/pages/ComparisonReportView';

const TAB_ORDER: ActiveTab[] = [
  'landing',
  'discovery',
  'location',
  'twin',
  'environment',
  'studio',
  'comparison',
];

export default function SpaceVisionAppPage() {
  const {
    activeTab,
    setActiveTab,
    properties,
    selectedPropertyId,
    comparedPropertyIds,
    toggleCompareProperty,
    openOnboardingGuide,
  } = useSpaceVisionStore();

  // First-time visitor onboarding welcome check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('spacevision_onboarding_dismissed');
      if (!isDismissed) {
        const timer = setTimeout(() => {
          openOnboardingGuide();
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [openOnboardingGuide]);

  // Keyboard shortcuts: Alt+0 .. Alt+6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === '0') {
        e.preventDefault();
        setActiveTab('landing');
        return;
      }
      const index = parseInt(e.key, 10);
      if (index >= 1 && index <= 6 && index < TAB_ORDER.length) {
        e.preventDefault();
        setActiveTab(TAB_ORDER[index]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  const selectedProperty = useMemo(
    () =>
      properties.find((p) => p.id === selectedPropertyId) || properties[0],
    [properties, selectedPropertyId]
  );

  const currentTabMeta = useMemo(() => {
    return NAV_TABS.find((t) => t.id === activeTab) || NAV_TABS[0];
  }, [activeTab]);

  const currentStepIndex = TAB_ORDER.indexOf(activeTab);
  const prevTab =
    currentStepIndex > 0 ? NAV_TABS[currentStepIndex - 1] : null;
  const nextTab =
    currentStepIndex < NAV_TABS.length - 1
      ? NAV_TABS[currentStepIndex + 1]
      : null;

  const isSelectedCompared = selectedProperty
    ? comparedPropertyIds.includes(selectedProperty.id)
    : false;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Architectural Navigation & Data Provenance System */}
      <TopNav />

      {/* Main Active Workspace View */}
      <main className="relative flex-1 overflow-x-hidden">
        {activeTab === 'landing' && <LandingPageView />}
        {activeTab === 'discovery' && <DiscoveryView />}
        {activeTab === 'location' && <LocationIntelView />}
        {activeTab === 'twin' && <DigitalTwinView />}
        {activeTab === 'environment' && <EnvironmentSimView />}
        {activeTab === 'studio' && <BusinessSetupView />}
        {activeTab === 'comparison' && <ComparisonReportView />}
      </main>

      {/* Interactive Step-by-Step Onboarding Walkthrough & Help Modal */}
      <OnboardingGuideModal />

      {/* Bottom Contextual Workflow Bar (Active when exploring tools beyond landing) */}
      {activeTab !== 'landing' && (
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
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
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
                {/* Quick Help Guide Button */}
                <button
                  onClick={() => openOnboardingGuide()}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                  title="Mở hướng dẫn sử dụng từng bước"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-slate-600" />
                  <span className="hidden md:inline">Hướng dẫn</span>
                </button>

                {prevTab && (
                  <button
                    onClick={() => setActiveTab(prevTab.id)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                    title={`Quay lại ${prevTab.label} (${prevTab.shortcut})`}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{prevTab.shortLabel}</span>
                  </button>
                )}

                {nextTab ? (
                  <button
                    onClick={() => setActiveTab(nextTab.id)}
                    className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1 text-[11px] font-bold text-white hover:bg-slate-800 transition shadow-sm"
                    title={`Tiếp tục sang ${nextTab.label} (${nextTab.shortcut})`}
                  >
                    <span>
                      Tiếp theo: {nextTab.shortLabel}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('landing')}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 transition"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Về Trang chủ</span>
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
