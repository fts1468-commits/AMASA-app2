import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ToastNotification } from './components/ToastNotification';
import { CalendarTab } from './components/calendar/CalendarTab';
import { BookingsTab } from './components/bookings/BookingsTab';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { PropertiesTab } from './components/properties/PropertiesTab';
import { MarketersTab } from './components/marketers/MarketersTab';
import { MoreTab } from './components/more/MoreTab';
import { AuthModal } from './components/modals/AuthModal';
import { BookingModal } from './components/modals/BookingModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { PropertyModals } from './components/modals/PropertyModals';
import { LoginScreen } from './components/auth/LoginScreen';
import { STORAGE_KEYS, StorageService } from './lib/storage';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    templatesModalOpen,
    setTemplatesModalOpen,
    activeTemplateTab,
    canViewCalendar,
    canViewProperties,
    canViewDashboard,
    canViewMarketers,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useApp();

  // Enforce tab permissions: if current tab is hidden by permissions, fall back to accessible tab
  useEffect(() => {
    if (activeTab === 'calendar' && !canViewCalendar) {
      setActiveTab('bookings');
    } else if (activeTab === 'properties' && !canViewProperties) {
      setActiveTab('bookings');
    } else if (activeTab === 'dashboard' && !canViewDashboard) {
      setActiveTab('bookings');
    } else if (activeTab === 'marketers' && !canViewMarketers) {
      setActiveTab('bookings');
    }
  }, [activeTab, canViewCalendar, canViewProperties, canViewDashboard, canViewMarketers, setActiveTab]);

  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [propertyModalType, setPropertyModalType] = useState<'details' | 'photos' | 'location' | 'contract' | null>(null);

  return (
    <div className="h-screen overflow-hidden bg-[#F8F5FC] text-slate-900 flex flex-col font-['Tajawal',sans-serif]">
      {/* Header */}
      <Header
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        onOpenRoleSwitcher={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto w-full animate-in fade-in duration-200">
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'bookings' && <BookingsTab />}
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'properties' && <PropertiesTab />}
        {activeTab === 'marketers' && <MarketersTab />}
        {activeTab === 'more' && (
          <MoreTab
            onOpenRoleSwitcher={() => setIsAuthModalOpen(true)}
            onOpenContract={() => setPropertyModalType('contract')}
          />
        )}
      </main>

      {/* Persistent Bottom Nav */}
      <BottomNav />

      {/* Audio / Visual Toast Alerts */}
      <ToastNotification />

      {/* Modals */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <BookingModal />
      <NotificationsModal isOpen={notificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} />
      <PropertyModals type={propertyModalType} onClose={() => setPropertyModalType(null)} />
      <TemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        initialTab={activeTemplateTab}
      />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH) === '1';
    } catch {
      return false;
    }
  });

  const handleAuthenticated = () => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, '1');
    } catch {}
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginScreen onAuthed={handleAuthenticated} />;
  }

  return <MainAppContent />;
};

export default function App() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}
