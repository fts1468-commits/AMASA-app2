import React from 'react';
import {
  CalendarDays,
  CalendarCheck,
  LayoutGrid,
  Building2,
  MoreHorizontal,
} from 'lucide-react';
import { ActiveTab, useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    bookings,
    isGuard,
    todayArrivals,
    todayDepartures,
    canViewCalendar,
    canViewProperties,
    canViewDashboard,
  } = useApp();

  const activeBookingsCount = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending_payment'
  ).length;

  const todayCount = todayArrivals.length + todayDepartures.length;

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    forGuard: boolean;
    hidden?: boolean;
  }

  const allItems: NavItem[] = [
    {
      id: 'dashboard',
      label: isGuard ? 'دخول وخروج اليوم' : 'لوحة التحكم',
      icon: LayoutGrid,
      badge: isGuard && todayCount > 0 ? todayCount : undefined,
      forGuard: true,
      hidden: !canViewDashboard,
    },
    {
      id: 'calendar',
      label: 'التقويم والأسعار',
      icon: CalendarDays,
      forGuard: false,
      hidden: !canViewCalendar,
    },
    {
      id: 'bookings',
      label: 'الحجوزات',
      icon: CalendarCheck,
      badge: !isGuard && activeBookingsCount > 0 ? activeBookingsCount : undefined,
      forGuard: false,
    },
    {
      id: 'properties',
      label: 'العقار',
      icon: Building2,
      forGuard: false,
      hidden: !canViewProperties,
    },
    {
      id: 'more',
      label: 'المزيد',
      icon: MoreHorizontal,
      forGuard: true,
    },
  ];

  // Filter based on guard rule
  // Rule: شاشة الحارس: الشريط السفلي: «دخول وخروج اليوم» و«المزيد» فقط
  const items = allItems
    .filter((item) => !item.hidden)
    .filter((item) => (isGuard ? item.forGuard : true));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-purple-100 shadow-lg pb-safe">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all relative cursor-pointer ${
                isActive ? 'text-purple-700 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div
                className={`relative px-3 py-1 rounded-xl transition-all ${
                  isActive ? 'bg-[#ECE5F8] text-[#6B2896]' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-[#6B2896] stroke-[2.3]' : 'text-slate-400 stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap ${
                  isActive ? 'text-[#6B2896] font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
