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
  highlights: {
    title: string;
    detail: string;
  }[];
  quickTips: string[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    stepNumber: 1,
    badge: 'Giới thiệu tổng quan',
    title: 'Chào mừng bạn đến với SpaceVision AI',
    shortTitle: 'Tổng quan',
    description:
      'Nền tảng công nghệ bất động sản thương mại (PropTech) kết hợp Trí tuệ Nhân tạo và 3D Digital Twin, giúp bạn tìm kiếm, thẩm định vị trí và lập kế hoạch kinh doanh chỉ trong vài phút.',
    icon: Building2,
    highlights: [
      {
        title: 'Bản đồ 3D thực tế',
        detail:
          'Dữ liệu toạ độ thực tại các quận trung tâm Hà Nội, hiển thị khối toà nhà 3D và tiện ích xung quanh.',
      },
      {
        title: 'Đề xuất theo nhu cầu',
        detail:
          'Tìm kiếm bằng ngôn ngữ tự nhiên. AI tự động bóc tách ngân sách, diện tích và mô hình phù hợp.',
      },
      {
        title: 'Trực tiếp chính chủ',
        detail:
          'Mỗi mặt bằng đều có thông tin liên hệ chính chủ hoặc ban quản lý toà nhà, kèm nút gọi và chat Zalo.',
      },
    ],
    quickTips: [
      'Giao diện kiến trúc tối giản, không quảng cáo rườm rà',
      'Có thể sử dụng phím tắt Alt+0 đến Alt+6 để chuyển đổi nhanh giữa các công cụ',
      'Hoàn toàn miễn phí, không yêu cầu đăng ký hay thẻ tín dụng',
    ],
  },
  {
    id: 'search',
    stepNumber: 2,
    badge: 'Công cụ 01',
    title: 'Tìm kiếm thông minh bằng ngôn ngữ tự nhiên',
    shortTitle: 'Tìm kiếm AI',
    description:
      'Bạn không cần phải lọc từng thông số phức tạp. Chỉ cần nhập nhu cầu kinh doanh thực tế, AI sẽ tự động phân tích và chấm điểm độ phù hợp.',
    targetTab: 'discovery',
    tabActionLabel: 'Đến trang Tìm kiếm & Đề xuất',
    icon: Search,
    highlights: [
      {
        title: 'Nhận diện ý định kinh doanh',
        detail:
          'Ví dụ: "Tìm mặt bằng mở quán cafe acoustic Cầu Giấy dưới 30 triệu" — AI sẽ tự bóc tách ngành nghề, quận và ngân sách.',
      },
      {
        title: 'Chấm điểm mức độ phù hợp',
        detail:
          'Hệ thống hiển thị tỷ lệ % phù hợp (ví dụ: 92% Phù hợp F&B) dựa trên lưu lượng khách, mặt tiền và chi phí.',
      },
      {
        title: 'Gợi ý từ khoá 1 chạm',
        detail:
          'Chọn nhanh các mẫu tìm kiếm phổ biến cho Cafe, Showroom, Nhà hàng hoặc Văn phòng đại diện.',
      },
    ],
    quickTips: [
      'Nhấp vào thẻ kết quả để xem chi tiết thông số kỹ thuật và mặt tiền',
      'Bấm vào tỷ lệ % phù hợp để xem bảng phân tích 5 tiêu chí của AI',
    ],
  },
  {
    id: 'map3d',
    stepNumber: 3,
    badge: 'Công cụ 02',
    title: 'Bản đồ 3D toà nhà & Khảo sát quy hoạch',
    shortTitle: 'Bản đồ 3D',
    description:
      'Quan sát toà nhà dưới dạng khối 3D lập thể, xoay góc nghiêng (Pitch) và khảo sát mật độ dân cư, đối thủ xung quanh.',
    targetTab: 'location',
    tabActionLabel: 'Đến Bản đồ 3D toà nhà',
    icon: MapPin,
    highlights: [
      {
        title: 'Khối toà nhà 3D đô thị',
        detail:
          'Hiển thị độ cao thực tế của các công trình lân cận, giúp đánh giá tầm nhìn và mức độ nhận diện thương hiệu.',
      },
      {
        title: '3 nhóm tiện ích phân tầng',
        detail:
          'Dễ dàng bật/tắt: Khách hàng mục tiêu (trường học, công sở), Đối thủ & Dịch vụ, Giao thông & Bãi đỗ xe.',
      },
      {
        title: 'Định tuyến thực tế OSRM',
        detail:
          'Tính toán chính xác khoảng cách và thời gian di chuyển (đi bộ, xe máy, ô tô) từ mặt bằng đến các điểm quan trọng.',
      },
    ],
    quickTips: [
      'Nhấp chuột phải và kéo để xoay góc nghiêng 3D của bản đồ',
      'Nhấp vào điểm ghim tiện ích trên bản đồ để tự động vẽ lộ trình di chuyển',
    ],
  },
  {
    id: 'digital_twin',
    stepNumber: 4,
    badge: 'Công cụ 03',
    title: 'Không gian 3D Digital Twin & Bóc tách tầng',
    shortTitle: '3D Twin',
    description:
      'Trải nghiệm mặt bằng từ xa với mô hình Digital Twin 3D chuẩn xác. Xem bố cục tổng thể, bóc tách từng tầng và kiểm tra kích thước phòng.',
    targetTab: 'twin',
    tabActionLabel: 'Đến Không gian 3D Digital Twin',
    icon: Box,
    highlights: [
      {
        title: '3 chế độ quan sát chuyên nghiệp',
        detail:
          'Orbit 3D (xoay tự do 360 độ), Dollhouse (bóc tách riêng biệt từng tầng), và Mặt bằng 2D chuẩn kỹ thuật.',
      },
      {
        title: 'Thông số kỹ thuật minh bạch',
        detail:
          'Hiển thị chiều cao trần, tải trọng sàn, hệ thống PCCC, điều hoà âm trần và công suất nguồn điện 3 pha.',
      },
      {
        title: 'Kích thước phòng thực tế',
        detail:
          'Thước đo hiển thị trực tiếp chiều dài và chiều rộng của từng phân khu chức năng.',
      },
    ],
    quickTips: [
      'Nhấp vào từng phòng để xem gợi ý công năng kinh doanh',
      'Sử dụng thanh công cụ nổi bên dưới màn hình 3D để đổi chế độ xem nhanh',
    ],
  },
  {
    id: 'studio',
    stepNumber: 5,
    badge: 'Công cụ 04',
    title: 'Thiết kế Setup & Dự toán ngân sách đầu tư',
    shortTitle: 'Thiết kế Setup',
    description:
      'Thử nghiệm phương án bố trí mặt bằng kinh doanh theo từng phong cách thiết kế, kèm bảng dự toán chi phí đầu tư ban đầu.',
    targetTab: 'studio',
    tabActionLabel: 'Đến Studio Thiết kế Setup',
    icon: Sparkles,
    highlights: [
      {
        title: 'Bố trí nội thất tự động',
        detail:
          'Lựa chọn phong cách (Scandinavian, Industrial, Hiện đại, Tối giản) để AI tự động sắp xếp bàn ghế, quầy pha chế.',
      },
      {
        title: 'Dự toán chi phí đầu tư',
        detail:
          'Bảng bóc tách tổng kinh phí mua sắm trang thiết bị và thi công cải tạo ban đầu (triệu VNĐ).',
      },
      {
        title: 'So sánh đa mặt bằng',
        detail:
          'Ghim tối đa 3 mặt bằng để so sánh thông số, chi phí và xuất file báo cáo phân tích đầu tư.',
      },
    ],
    quickTips: [
      'Chuyển đổi linh hoạt giữa góc nhìn 3D và sơ đồ mặt phẳng 2D',
      'Bấm vào nút "So sánh" trên thanh điều hướng để xem bảng tổng hợp',
    ],
  },
  {
    id: 'contact',
    stepNumber: 6,
    badge: 'Bước cuối',
    title: 'Liên hệ chủ nhà & Đặt lịch khảo sát thực địa',
    shortTitle: 'Liên hệ chủ nhà',
    description:
      'Khi tìm thấy mặt bằng ưng ý, bạn có thể kết nối ngay với chủ nhà hoặc ban quản lý toà nhà mà không qua bất kỳ khâu trung gian nào.',
    icon: PhoneCall,
    highlights: [
      {
        title: 'Thông tin liên hệ xác thực',
        detail:
          'Tên chủ sở hữu/đại diện ủy quyền, số điện thoại hotline và đường dẫn nhắn tin Zalo trực tiếp.',
      },
      {
        title: 'Đặt lịch xem mặt bằng',
        detail:
          'Form đăng ký chọn ngày, giờ khảo sát mong muốn kèm ghi chú nhu cầu đo đạc thực địa.',
      },
      {
        title: 'Ưu đãi & Chính sách bàn giao',
        detail:
          'Nắm rõ thời gian miễn phí setup (15–30 ngày) và hiện trạng bàn giao thô hay hoàn thiện.',
      },
    ],
    quickTips: [
      'Nút "Đặt lịch xem" xuất hiện ở mọi màn hình chi tiết mặt bằng',
      'Bạn có thể mở lại bảng hướng dẫn này bất kỳ lúc nào bằng nút "Hướng dẫn" trên thanh điều hướng',
    ],
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

  // Initialize: if dismissed in localStorage, keep state
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
      // Completed last step
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="guide-modal-title"
                  className="text-sm sm:text-base font-bold text-slate-900 truncate"
                >
                  Hướng dẫn sử dụng SpaceVision AI
                </h2>
                <span className="hidden sm:inline-flex rounded bg-slate-200 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                  Bước {currentStep.stepNumber}/{GUIDE_STEPS.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Khám phá các tính năng cốt lõi cho khảo sát & setup mặt bằng thương mại
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Skip Button (Top) */}
            <button
              onClick={handleDismiss}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Bỏ qua hướng dẫn (Để sau)"
            >
              <span className="hidden xs:inline">Bỏ qua (Để sau)</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1 shrink-0">
          <div
            className="bg-slate-900 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Indicator Tabs (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-white overflow-x-auto no-scrollbar shrink-0">
          {GUIDE_STEPS.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const isPassed = idx < currentStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => handleJumpToStep(idx)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : isPassed
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
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
                <span className="hidden sm:inline">{step.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Main Body Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Step Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xs">
                <StepIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {currentStep.badge}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {currentStep.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Jump to Feature Tab (Optional Button) */}
            {currentStep.targetTab && (
              <button
                onClick={() => handleNavigateToFeature(currentStep.targetTab)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-slate-900 shrink-0 self-start transition shadow-xs"
              >
                <span>{currentStep.tabActionLabel || 'Thử ngay tính năng'}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-700" />
              </button>
            )}
          </div>

          {/* Highlights 3-Column Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Điểm nổi bật & Cách hoạt động
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentStep.highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-800 text-[11px] font-mono font-bold">
                        {idx + 1}
                      </div>
                      <h5 className="text-xs font-bold text-slate-900">
                        {item.title}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Mẹo sử dụng hiệu quả:</span>
            </div>
            <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-600">
              {currentStep.quickTips.map((tip, idx) => (
                <li key={idx} className="leading-relaxed">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
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
                  <span>Bắt đầu trải nghiệm ngay</span>
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Tiếp theo: Bước {currentStepIndex + 2}</span>
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
