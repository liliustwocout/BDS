'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  Search,
  MapPin,
  Box,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Layers,
  Compass,
  Check,
  Phone,
  MessageSquare,
  Calendar,
  SunMedium,
  Maximize2,
  Navigation,
} from 'lucide-react';
import { ActiveTab } from '@/types';
import { useSpaceVisionStore } from '@/store/useSpaceVisionStore';

const STORAGE_KEY = 'spacevision_onboarding_dismissed';

interface GuideStep {
  id: string;
  stepNumber: number;
  badge: string;
  title: string;
  shortTitle: string;
  description: string;
  targetTab?: ActiveTab;
  tabActionLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  keyBullets: {
    highlight: string;
    text: string;
  }[];
  visualType: 'search' | 'map' | 'twin' | 'setup_contact';
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'search',
    stepNumber: 1,
    badge: 'Bước 1 / 4 • AI Intent Discovery',
    title: 'Tìm kiếm thông minh bằng ý tưởng kinh doanh',
    shortTitle: '1. Tìm kiếm AI',
    description:
      'Chỉ cần gõ nhu cầu thực tế bằng ngôn ngữ tự nhiên. AI sẽ tự động bóc tách ngành nghề, quận, ngân sách và chấm điểm mức độ phù hợp (% Match) minh bạch.',
    targetTab: 'discovery',
    tabActionLabel: 'Đến trang Tìm kiếm & Đề xuất',
    icon: Search,
    keyBullets: [
      {
        highlight: 'Gõ tự nhiên:',
        text: '"Tìm quán cafe acoustic Cầu Giấy dưới 30 triệu" — AI tự phân tích và lọc nhanh.',
      },
      {
        highlight: 'Chấm điểm % phù hợp:',
        text: 'Đánh giá lưu lượng khách, chiều rộng vỉa hè và khả năng sinh lời cho từng mô hình.',
      },
      {
        highlight: 'Gợi ý từ khoá 1 chạm:',
        text: 'Có sẵn các mẫu tìm kiếm phổ biến cho Cafe, Showroom, Nhà hàng, Văn phòng.',
      },
    ],
    visualType: 'search',
  },
  {
    id: 'map3d',
    stepNumber: 2,
    badge: 'Bước 2 / 4 • 3D GIS & OSRM',
    title: 'Bản đồ toà nhà 3D & Khảo sát tiện ích quy hoạch',
    shortTitle: '2. Bản đồ 3D',
    description:
      'Khảo sát khối toà nhà 3D lập thể, xoay góc nghiêng (Pitch) để cảm nhận tầm nhìn đô thị và kiểm tra mật độ khách hàng, đối thủ xung quanh.',
    targetTab: 'location',
    tabActionLabel: 'Đến Bản đồ 3D toà nhà',
    icon: MapPin,
    keyBullets: [
      {
        highlight: 'Khối toà nhà 3D thực tế:',
        text: 'Dữ liệu không gian toạ độ thực Hà Nội, hiển thị chiều cao công trình lân cận.',
      },
      {
        highlight: '3 nhóm tiện ích phân tầng:',
        text: 'Bật/tắt nhanh Khách hàng mục tiêu (trường học, công sở), Đối thủ, Bãi xe & Giao thông.',
      },
      {
        highlight: 'Định tuyến OSRM thực tế:',
        text: 'Tính chính xác thời gian và lộ trình đi bộ, xe máy, ô tô không cần API key.',
      },
    ],
    visualType: 'map',
  },
  {
    id: 'twin',
    stepNumber: 3,
    badge: 'Bước 3 / 4 • Digital Twin 3D',
    title: 'Không gian 3D Digital Twin & Bóc tách tầng',
    shortTitle: '3. Không gian 3D',
    description:
      'Trải nghiệm mặt bằng từ xa chuẩn xác như đang có mặt tại hiện trường: xoay tự do 360 độ (Orbit), bóc tách từng tầng (Dollhouse) và xem mặt bằng 2D kỹ thuật.',
    targetTab: 'twin',
    tabActionLabel: 'Đến Không gian 3D Twin',
    icon: Box,
    keyBullets: [
      {
        highlight: 'Bóc tách tầng (Dollhouse):',
        text: 'Xem riêng biệt từng tầng hoặc toàn bộ toà nhà để đánh giá công năng từng phòng.',
      },
      {
        highlight: 'Thước đo kích thước thực:',
        text: 'Hiển thị chiều dài, chiều rộng từng phòng và thông số trần, tải trọng sàn, PCCC.',
      },
      {
        highlight: 'Mô phỏng ánh sáng mặt trời:',
        text: 'Kiểm tra hướng nắng và bóng đổ theo từng khung giờ trong ngày (Sáng, Trưa, Chiều, Tối).',
      },
    ],
    visualType: 'twin',
  },
  {
    id: 'setup_contact',
    stepNumber: 4,
    badge: 'Bước 4 / 4 • Setup & Kết nối',
    title: 'Thiết kế Setup & Liên hệ trực tiếp chủ nhà',
    shortTitle: '4. Setup & Chủ nhà',
    description:
      'Thử nghiệm phương án bố trí nội thất AI, xem bảng dự toán ngân sách đầu tư ban đầu và liên hệ trực tiếp chủ nhà để đặt lịch hẹn xem mặt bằng.',
    targetTab: 'studio',
    tabActionLabel: 'Đến Studio Thiết kế & Setup',
    icon: Sparkles,
    keyBullets: [
      {
        highlight: 'Bố trí nội thất tự động:',
        text: 'Chọn phong cách (Scandinavian, Industrial, Hiện đại) để AI xếp bàn ghế, thiết bị.',
      },
      {
        highlight: 'Dự toán chi phí đầu tư:',
        text: 'Bóc tách chi phí mua sắm và cải tạo ban đầu (triệu VNĐ) để dự trù vốn kinh doanh.',
      },
      {
        highlight: 'Liên hệ chính chủ xác thực:',
        text: 'Gọi hotline, chat Zalo 1 chạm và đặt lịch hẹn khảo sát thực tế (hỗ trợ 15-30 ngày setup).',
      },
    ],
    visualType: 'setup_contact',
  },
];

export function OnboardingGuideModal() {
  const {
    showOnboardingGuide,
    closeOnboardingGuide,
    setActiveTab,
  } = useSpaceVisionStore();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(STORAGE_KEY);
      if (isDismissed === 'true') {
        setDontShowAgain(true);
      }
    }
  }, []);

  // Keyboard navigation: ArrowRight (next), ArrowLeft (prev), Escape (close)
  useEffect(() => {
    if (!showOnboardingGuide) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
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

  const handleDismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    closeOnboardingGuide();
  }, [closeOnboardingGuide]);

  const handleNext = () => {
    if (currentStepIndex < GUIDE_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleJumpToStep = (index: number) => {
    if (index >= 0 && index < GUIDE_STEPS.length) {
      setCurrentStepIndex(index);
    }
  };

  const handleNavigateToFeature = (tab?: ActiveTab) => {
    if (tab) {
      setActiveTab(tab);
      handleDismiss();
    }
  };

  const handleToggleDontShowAgain = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDontShowAgain(checked);
    if (typeof window !== 'undefined') {
      if (checked) {
        localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  if (!showOnboardingGuide) return null;

  const currentStep = GUIDE_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === GUIDE_STEPS.length - 1;
  const progressPercent = Math.round(
    ((currentStepIndex + 1) / GUIDE_STEPS.length) * 100
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="guide-modal-title"
                  className="text-sm font-bold text-slate-900 truncate"
                >
                  Hướng dẫn sử dụng SpaceVision AI
                </h2>
                <span className="hidden sm:inline-flex rounded bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                  Bước {currentStep.stepNumber}/{GUIDE_STEPS.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                4 bước cốt lõi để tìm kiếm, thẩm định và setup mặt bằng kinh doanh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Prominent Skip Button */}
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
              title="Bỏ qua hướng dẫn (Để sau)"
            >
              <span>Bỏ qua (Để sau)</span>
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Top Progress Bar */}
        <div className="w-full bg-slate-100 h-1 shrink-0">
          <div
            className="bg-slate-900 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Indicator Pills (Clickable) */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar shrink-0">
          {GUIDE_STEPS.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isPassed = idx < currentStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => handleJumpToStep(idx)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1 text-xs transition whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : isPassed
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 font-medium'
                    : 'text-slate-500 hover:bg-slate-50 font-medium'
                }`}
                title={`Chuyển tới ${step.title}`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white text-slate-900'
                      : isPassed
                      ? 'bg-slate-300 text-slate-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isPassed ? <Check className="h-2.5 w-2.5" /> : idx + 1}
                </span>
                <span>{step.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Main Body: 2-Column Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
            {/* Left: Architectural Visual Mockup Card (5 cols) */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 flex flex-col justify-between shadow-xs min-h-[220px]">
              {/* Visual 1: Search Mockup */}
              {currentStep.visualType === 'search' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                      AI Intent Search
                    </span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      92% Match F&B
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs text-slate-800">
                      <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">
                        Quán cafe acoustic Cầu Giấy dưới 30tr
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>Mặt bằng CG-101 • Duy Tân</span>
                      <span className="text-emerald-700 font-bold">24 tr/th</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>120m²</span>
                      <span>•</span>
                      <span>Mặt tiền 6.5m</span>
                      <span>•</span>
                      <span>3 tầng</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">Lưu lượng văn phòng: Cao</span>
                      <span className="text-slate-700 font-semibold">Tỉ lệ sinh lời tốt</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 2: 3D Map Mockup */}
              {currentStep.visualType === 'map' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                      3D Extrusion & GIS
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
                      Tọa độ thực
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Building2 className="h-4 w-4 text-slate-700" />
                        <span>Khối toà nhà 3D (Pitch 50°)</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">MapLibre GL</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                      <div className="rounded border border-slate-100 bg-slate-50 p-1">
                        <span className="font-bold text-slate-900 block">4</span>
                        <span className="text-slate-500">Trường học</span>
                      </div>
                      <div className="rounded border border-slate-100 bg-slate-50 p-1">
                        <span className="font-bold text-slate-900 block">6</span>
                        <span className="text-slate-500">Văn phòng</span>
                      </div>
                      <div className="rounded border border-slate-100 bg-slate-50 p-1">
                        <span className="font-bold text-slate-900 block">3</span>
                        <span className="text-slate-500">Bãi đỗ xe</span>
                      </div>
                    </div>
                    <div className="rounded bg-slate-100 p-2 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Navigation className="h-3 w-3 text-slate-600" />
                        <span>Định tuyến OSRM:</span>
                      </span>
                      <span className="font-bold text-slate-900">4 phút xe máy</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 3: 3D Twin Mockup */}
              {currentStep.visualType === 'twin' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                      Digital Twin 3D
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-800">
                      Dollhouse & 2D
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>Mặt bằng bóc tách tầng</span>
                      <span className="text-slate-500 text-[10px]">Tầng 1 / 3 tầng</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between rounded bg-slate-50 px-2 py-1 border border-slate-100">
                        <span className="text-slate-600">Phòng kinh doanh:</span>
                        <strong className="text-slate-900">8.2m x 12.5m (102.5m²)</strong>
                      </div>
                      <div className="flex justify-between rounded bg-slate-50 px-2 py-1 border border-slate-100">
                        <span className="text-slate-600">Chiều cao trần:</span>
                        <strong className="text-slate-900">3.6m (Chuẩn thương mại)</strong>
                      </div>
                      <div className="flex justify-between rounded bg-slate-50 px-2 py-1 border border-slate-100">
                        <span className="text-slate-600">Hạ tầng kỹ thuật:</span>
                        <strong className="text-slate-900">Điện 3 pha, PCCC nghiệm thu</strong>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <SunMedium className="h-3 w-3 text-amber-600" />
                        <span>Mô phỏng nắng: 10:30 AM</span>
                      </span>
                      <span>Mặt tiền Đông Nam</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual 4: Setup & Landlord Contact Mockup */}
              {currentStep.visualType === 'setup_contact' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                      Setup & Liên hệ chủ nhà
                    </span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Chính chủ
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Anh Minh (Chủ nhà)</div>
                        <div className="text-[10px] text-slate-500">Hotline: 0912 345 678</div>
                      </div>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        Đang online
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <div className="rounded bg-slate-50 border border-slate-200 py-1 px-2 text-center text-[10px] font-semibold text-slate-700">
                        Gọi điện thoại
                      </div>
                      <div className="rounded bg-slate-50 border border-slate-200 py-1 px-2 text-center text-[10px] font-semibold text-slate-700">
                        Nhắn tin Zalo
                      </div>
                    </div>
                    <div className="rounded bg-slate-900 text-white py-1.5 px-2 text-center text-[11px] font-bold shadow-xs">
                      Đặt lịch khảo sát thực địa
                    </div>
                    <div className="text-[10px] text-slate-500 text-center">
                      Ưu đãi: Miễn phí 15 ngày setup ban đầu
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Quick Indicator */}
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>SpaceVision AI Platform</span>
                <span className="font-semibold text-slate-700">100% Light Theme</span>
              </div>
            </div>

            {/* Right: Detailed Explanation, Bullets & Direct CTA (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="inline-block rounded bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 border border-slate-200">
                  {currentStep.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {currentStep.title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

              {/* Key Highlights Bullet Points */}
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:p-3.5">
                {currentStep.keyBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 mr-1">{bullet.highlight}</strong>
                      {bullet.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature Jump Action */}
              {currentStep.targetTab && (
                <div className="pt-1">
                  <button
                    onClick={() => handleNavigateToFeature(currentStep.targetTab)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
                  >
                    <span>{currentStep.tabActionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-700" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
          {/* Checkbox: Don't show again */}
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={handleToggleDontShowAgain}
              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Không tự động hiển thị lại khi mở trang</span>
          </label>

          {/* Action Buttons: Skip, Prev, Next */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              Bỏ qua (Để sau)
            </button>

            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Quay lại</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
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
