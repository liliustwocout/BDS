'use client';

import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Calendar,
  CalendarCheck,
  Clock,
  UserCheck,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import type { LandlordContact, PropertyItem } from '@/types';

// Role badge color scheme
const ROLE_BADGE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'Chính chủ': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'Đại diện ủy quyền': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  'Quản lý tòa nhà': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
};

const DEFAULT_TIME_SLOTS = [
  '09:00 - 10:30 (Buổi sáng)',
  '11:00 - 12:00 (Trưa)',
  '14:00 - 15:30 (Buổi chiều)',
  '17:00 - 18:30 (Cuối ngày)',
];

function cleanPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

export interface LandlordContactCardProps {
  contact?: LandlordContact;
  property?: PropertyItem;
  variant?: 'full' | 'compact' | 'inline';
  className?: string;
  onBookSuccess?: () => void;
}

export const LandlordContactCard: React.FC<LandlordContactCardProps> = ({
  contact: directContact,
  property,
  variant = 'full',
  className = '',
  onBookSuccess,
}) => {
  const contact = directContact || property?.contact || {
    name: 'Ban Quản lý Mặt bằng',
    phone: '0912 345 678',
    zaloPhone: '0912 345 678',
    role: 'Chính chủ' as const,
    responseSpeed: 'Phản hồi trong 15 phút',
    viewingAvailability: 'Xem mặt bằng các ngày trong tuần (8h - 18h)',
    handoverOffer: 'Hỗ trợ 15 ngày setup miễn phí & bàn giao thô hoàn thiện',
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form states
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDateStr);
  const [timeSlot, setTimeSlot] = useState(DEFAULT_TIME_SLOTS[0]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');

  const roleStyle = ROLE_BADGE_STYLE[contact.role] || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    if (onBookSuccess) onBookSuccess();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setIsSubmitted(false);
    }, 300);
  };

  // INLINE VARIANT
  if (variant === 'inline') {
    return (
      <>
        <div
          className={`flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm ${className}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0">
              {contact.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                <span>{contact.name}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                >
                  {contact.role}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-mono font-bold">
                {contact.phone}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`tel:${cleanPhone(contact.phone)}`}
              title="Gọi điện"
              className="p-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
            </a>
            <a
              href={`https://zalo.me/${cleanPhone(contact.zaloPhone || contact.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Nhắn Zalo"
              className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </a>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition"
            >
              Đặt lịch
            </button>
          </div>
        </div>

        {isModalOpen && renderModal()}
      </>
    );
  }

  // COMPACT VARIANT
  if (variant === 'compact') {
    return (
      <>
        <div
          className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5 ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xs">
                {contact.name.slice(0, 1)}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{contact.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                  >
                    {contact.role}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{contact.responseSpeed}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-mono font-bold text-slate-900 block">
                {contact.phone}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${cleanPhone(contact.phone)}`}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gọi điện</span>
            </a>
            <a
              href={`https://zalo.me/${cleanPhone(contact.zaloPhone || contact.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span>Zalo</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm transition"
          >
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <span>Đặt lịch xem mặt bằng</span>
          </button>
        </div>

        {isModalOpen && renderModal()}
      </>
    );
  }

  // FULL VARIANT
  return (
    <>
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
      >
        {/* Landlord Identity Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-sm shadow-xs">
                {contact.name
                  .split(' ')
                  .slice(-2)
                  .map((w) => w[0])
                  .join('') || 'NV'}
              </div>
              <div
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
                title="Sẵn sàng nhận cuộc gọi"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-slate-900">{contact.name}</h4>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                >
                  {contact.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs sm:text-sm text-slate-500">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>{contact.responseSpeed}</span>
              </div>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 font-medium">Hotline trực tiếp</div>
            <div className="text-base font-mono font-bold text-slate-900">{contact.phone}</div>
          </div>
        </div>

        {/* Viewing Availability Box */}
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-sm text-slate-700">
          <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900">Lịch xem mặt bằng:</span>{' '}
            <span className="text-slate-600">{contact.viewingAvailability}</span>
          </div>
        </div>

        {/* Handover Offer Banner */}
        {contact.handoverOffer && (
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/70 p-3.5 border border-amber-200/80 text-sm text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900">Chính sách ưu đãi:</span>{' '}
              <span className="text-amber-800">{contact.handoverOffer}</span>
            </div>
          </div>
        )}

        {/* Direct Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href={`tel:${cleanPhone(contact.phone)}`}
            className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition active:scale-[0.98]"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Gọi {contact.phone}</span>
          </a>
          <a
            href={`https://zalo.me/${cleanPhone(contact.zaloPhone || contact.phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition active:scale-[0.98]"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span>Nhắn qua Zalo</span>
          </a>
        </div>

        {/* Book Viewing Appointment Button */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition active:scale-[0.98]"
        >
          <CalendarCheck className="w-4 h-4 text-blue-600" />
          <span>Đặt lịch xem mặt bằng & Khảo sát thực địa</span>
        </button>
      </div>

      {isModalOpen && renderModal()}
    </>
  );

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden p-6 text-slate-900 space-y-4">
          <button
            type="button"
            onClick={handleCloseModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {!isSubmitted ? (
            <>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-1">
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Khảo sát thực địa</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Đặt lịch xem mặt bằng
                </h3>
                {property ? (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã mặt bằng: <strong className="text-slate-800">{property.code}</strong> —{' '}
                    {property.title} ({property.district})
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hẹn lịch xem thực tế cùng chủ nhà / ban quản lý tòa nhà
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm">
                    {contact.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{contact.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                      >
                        {contact.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono font-bold">{contact.phone}</div>
                  </div>
                </div>
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{contact.responseSpeed}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitBooking} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs sm:text-sm">
                      Ngày muốn xem *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs sm:text-sm">
                      Khung giờ thuận tiện *
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {DEFAULT_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs sm:text-sm">
                      Họ và tên của bạn *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Nam"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5 text-xs sm:text-sm">
                      Số điện thoại nhận xác nhận *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0912 888 999"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full rounded-lg bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 text-xs sm:text-sm">
                    Ghi chú khảo sát (không bắt buộc)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Cần đo đạc thực tế mặt tiền, kiểm tra nguồn điện 3 pha hoặc trao đổi thời gian hoàn thiện..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition"
                  >
                    Xác nhận đặt lịch
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Đã gửi yêu cầu đặt lịch khảo sát!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Chủ nhà <strong className="text-slate-800">{contact.name}</strong> ({contact.phone}) đã nhận được thông tin và sẽ liên hệ xác nhận trong vòng{' '}
                  <strong className="text-emerald-700">{contact.responseSpeed}</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Ngày hẹn:</span>
                  <strong className="text-slate-900">{date}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Khung giờ:</span>
                  <strong className="text-slate-900">{timeSlot}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Khách khảo sát:</span>
                  <strong className="text-slate-900">{clientName || 'Quý khách'} ({clientPhone})</strong>
                </div>
                {property && (
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span>Mặt bằng:</span>
                    <strong className="text-slate-900">{property.code} — {property.district}</strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full max-w-sm mx-auto py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
};

/**
 * Reusable Landlord Contact Modal for direct invocation
 */
export const LandlordContactModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  property: PropertyItem;
  contact?: LandlordContact;
}> = ({ isOpen, onClose, property, contact }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg">
        <LandlordContactCard
          property={property}
          contact={contact || property.contact}
          variant="full"
          onBookSuccess={() => {}}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Compact Landlord Contact Badge for Property Cards
 */
export const LandlordContactBadge: React.FC<{
  contact: LandlordContact;
  onClick?: () => void;
  className?: string;
}> = ({ contact, onClick, className = '' }) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-[11px] font-medium text-slate-700 transition cursor-pointer ${className}`}
      title="Nhấn để xem thông tin liên hệ và đặt lịch hẹn"
    >
      <UserCheck className="w-3 h-3 text-slate-500" />
      <span>
        Liên hệ: <strong className="text-slate-900 font-semibold">{contact.name}</strong> •{' '}
        <span className="font-mono text-slate-600">{contact.phone}</span>
      </span>
    </div>
  );
};
