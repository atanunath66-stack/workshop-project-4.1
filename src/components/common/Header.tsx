import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  User as UserIcon,
  Shield,
  Store,
  UtensilsCrossed,
  ChevronDown,
  Lock,
  LogOut,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LocationSelectorModal } from './LocationSelectorModal';
import { AuthModal } from './AuthModal';
import { AdminLoginModal } from './AdminLoginModal';
import { UserRole } from '../../types';

interface Props {
  activeView: 'discover' | 'map' | 'bookings' | 'owner' | 'admin' | 'profile';
  setActiveView: (view: 'discover' | 'map' | 'bookings' | 'owner' | 'admin' | 'profile') => void;
}

export const Header: React.FC<Props> = ({ activeView, setActiveView }) => {
  const {
    isLoggedIn,
    currentUser,
    logoutUser,
    switchUserRole,
    currentLocation,
    notifications,
    markNotificationAsRead,
    setSelectedRestaurant,
    isAdminAuthenticated,
    adminLogout,
    isAdminLoginModalOpen,
    setIsAdminLoginModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalRole,
    setAuthModalRole,
    requireAuth,
  } = useApp();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const handleRoleSelect = (role: UserRole) => {
    setIsRoleDropdownOpen(false);

    if (role === 'admin') {
      if (!isAdminAuthenticated) {
        setIsAdminLoginModalOpen(true);
        return;
      }
      switchUserRole('admin');
      setActiveView('admin');
      return;
    }

    if (currentUser.role === 'admin') {
      adminLogout();
    }

    if (role === 'owner') {
      setActiveView('owner');
      return;
    }

    switchUserRole(role);
    setActiveView('discover');
  };

  const handleAdminLock = () => {
    setIsRoleDropdownOpen(false);
    adminLogout();
    setActiveView('discover');
  };

  const locationParts = currentLocation.split(',');
  const mainArea = locationParts[0]?.trim() || 'Koramangala';
  const cityPart = locationParts[1]?.trim() || 'Bengaluru';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0E1115]/95 backdrop-blur-md border-b border-stone-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 sm:gap-8 h-16">
            {/* Zone 1: Single Brand Wordmark & Location Selector */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <button
                onClick={() => {
                  setSelectedRestaurant(null);
                  setActiveView('discover');
                }}
                className="text-lg sm:text-xl font-extrabold tracking-tight text-white font-display flex items-center gap-2 whitespace-nowrap shrink-0 group cursor-pointer"
              >
                <span className="w-8 h-8 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-display text-sm font-black shadow-xs group-hover:scale-105 transition-transform">
                  🍲
                </span>
                <span>
                  ZA<span className="text-[#E8A0B5]">ikya</span>
                </span>
              </button>

              {/* Elevated Hyperlocal Area Button */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="group relative flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-[#25152F] bg-[#F7F2EA] hover:bg-[#EDE6DA] border border-[#DDD4E2] hover:border-[#A8B88A] rounded-2xl transition-all shadow-xs cursor-pointer"
                title="Change discovery neighborhood or city"
              >
                {/* Live GPS Radar Pulse Beacon */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A8B88A] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B96D79]" />
                </span>

                <div className="flex items-baseline gap-1 text-left">
                  <span className="font-bold text-[#25152F] max-w-[100px] sm:max-w-[130px] truncate text-[11px] sm:text-xs">
                    {mainArea}
                  </span>
                  <span className="hidden sm:inline text-[11px] text-[#5A4B63] font-medium">
                    · {cityPart}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-[#5A4B63] group-hover:translate-y-0.5 transition-transform shrink-0" />
              </button>
            </div>

            {/* Zone 2: Navigation Links with high contrast */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
              <button
                onClick={() => {
                  setSelectedRestaurant(null);
                  setActiveView('discover');
                }}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                  activeView === 'discover'
                    ? 'text-[#E9D8B5] border-b-2 border-[#A8B88A] font-bold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Discover Gems
              </button>

              <button
                onClick={() => {
                  setSelectedRestaurant(null);
                  setActiveView('map');
                }}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                  activeView === 'map'
                    ? 'text-[#E9D8B5] border-b-2 border-[#A8B88A] font-bold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                Interactive Map
              </button>

              <button
                onClick={() => {
                  requireAuth(() => setActiveView('bookings'), 'customer');
                }}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                  activeView === 'bookings'
                    ? 'text-[#E9D8B5] border-b-2 border-[#A8B88A] font-bold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                My Bookings & Receipts
              </button>

              <button
                onClick={() => {
                  requireAuth(() => setActiveView('profile'), 'customer');
                }}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                  activeView === 'profile'
                    ? 'text-[#E9D8B5] border-b-2 border-[#A8B88A] font-bold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                My Profile
              </button>

              <button
                onClick={() => {
                  setSelectedRestaurant(null);
                  setActiveView('discover');
                }}
                className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-stone-300 cursor-pointer"
              >
                Deals & Offers
              </button>
            </nav>

            {/* Zone 3: Portal Switcher, Notifications & Auth */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Role Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                    currentUser.role === 'admin'
                      ? 'bg-[#25152F] text-[#E9D8B5] border-[#B96D79]'
                      : currentUser.role === 'owner'
                      ? 'bg-[#F7F2EA] text-[#25152F] border-[#DDD4E2] hover:bg-[#EDE6DA]'
                      : 'bg-[#F7F2EA] text-[#25152F] border-[#DDD4E2] hover:bg-[#EDE6DA]'
                  }`}
                >
                  {currentUser.role === 'admin' ? (
                    <Shield className="w-3.5 h-3.5 text-[#E9D8B5]" />
                  ) : currentUser.role === 'owner' ? (
                    <Store className="w-3.5 h-3.5 text-[#B96D79]" />
                  ) : (
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#5A4B63]" />
                  )}
                  <span className="capitalize">
                    {currentUser.role === 'admin'
                      ? 'Super Admin'
                      : currentUser.role === 'owner'
                      ? 'Store Owner'
                      : 'Customer'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-[#DDD4E2] py-2 z-50 text-xs animate-in fade-in">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-[#5A4B63] uppercase tracking-wider">
                      Switch Portal Experience
                    </div>
                    <button
                      onClick={() => handleRoleSelect('customer')}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-[#F7F2EA] cursor-pointer ${
                        currentUser.role === 'customer'
                          ? 'font-bold text-[#25152F] bg-[#F7F2EA]'
                          : 'text-[#25152F]'
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4 text-[#B96D79]" />
                      <div>
                        <div className="font-bold text-[#25152F]">Customer Portal</div>
                        <div className="text-[10px] text-[#5A4B63]">Discover, pre-book dishes &amp; dine</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleRoleSelect('owner')}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-[#F7F2EA] cursor-pointer ${
                        currentUser.role === 'owner'
                          ? 'font-bold text-[#25152F] bg-[#F7F2EA]'
                          : 'text-[#25152F]'
                      }`}
                    >
                      <Store className="w-4 h-4 text-[#B96D79]" />
                      <div>
                        <div className="font-bold text-[#25152F]">Store Owner Portal</div>
                        <div className="text-[10px] text-[#5A4B63]">Orders, menu, tables &amp; revenue</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleRoleSelect('admin')}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[#F7F2EA] cursor-pointer ${
                        currentUser.role === 'admin'
                          ? 'font-bold text-[#25152F] bg-[#F7F2EA]'
                          : 'text-[#25152F]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="w-4 h-4 text-[#B96D79]" />
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-[#25152F]">
                            <span>Super Admin Portal</span>
                            {isAdminAuthenticated ? (
                              <span className="px-1.5 py-0.5 bg-[#A8B88A]/30 text-[#25152F] text-[9px] rounded font-mono font-bold">
                                UNLOCKED
                              </span>
                            ) : (
                              <Lock className="w-3 h-3 text-[#5A4B63]" />
                            )}
                          </div>
                          <div className="text-[10px] text-[#5A4B63]">
                            {isAdminAuthenticated
                              ? 'Governance & approvals'
                              : 'Authorized master credentials'}
                          </div>
                        </div>
                      </div>
                    </button>

                    {isAdminAuthenticated && (
                      <div className="pt-1 mt-1 border-t border-[#DDD4E2]">
                        <button
                          onClick={handleAdminLock}
                          className="w-full flex items-center gap-2 px-4 py-2 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Lock Super Admin Session</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  aria-label="View notifications"
                  className="p-2 rounded-2xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors relative cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B96D79] ring-2 ring-[#0A0C0E]" />
                  )}
                </button>

                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-xl border border-[#DDD4E2] py-2 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#DDD4E2] bg-[#F7F2EA]">
                      <span className="text-xs font-bold text-[#25152F] font-display">Notifications</span>
                      <span className="text-[11px] text-[#5A4B63] font-mono">{unreadNotifs.length} new</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-[#DDD4E2]">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationAsRead(n.id)}
                            className={`p-3 text-xs hover:bg-[#F7F2EA] cursor-pointer transition-colors ${
                              !n.isRead ? 'bg-[#E9D8B5]/20' : ''
                            }`}
                          >
                            <div className="font-bold text-[#25152F]">{n.title}</div>
                            <div className="text-[#5A4B63] text-[11px] mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-[#5A4B63] mt-1 font-mono">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-xs text-[#5A4B63] text-center">No notifications yet</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Account / Sign In Action */}
              {!isLoggedIn || currentUser.id === 'guest' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalRole(currentUser.role === 'owner' ? 'owner' : 'customer');
                    setIsAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#A8B88A] hover:bg-[#97A779] text-[#25152F] text-xs font-bold rounded-2xl transition-all shadow-sm cursor-pointer border border-[#8C9C6F]"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#25152F]" />
                  <span>Sign In</span>
                </button>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-[#F7F2EA] hover:bg-[#EDE6DA] text-[#25152F] text-xs font-bold rounded-2xl transition-all border border-[#DDD4E2] cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#E8A0B5] text-[#34343A] flex items-center justify-center text-[10px] font-bold">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                    </span>
                    <span className="hidden sm:inline max-w-[90px] truncate">
                      {currentUser.name ? currentUser.name.split(' ')[0] : 'Profile'}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#777781]" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-3xl shadow-xl border border-[#E8E8EC] py-2 z-50 text-xs animate-in fade-in">
                      <div className="px-4 py-2.5 border-b border-[#E8E8EC]">
                        <div className="font-bold text-[#34343A] truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-[#777781] truncate font-mono">
                          {currentUser.email || currentUser.phone || 'Verified User'}
                        </div>
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#FCE8EF] text-[#C96884] border border-[#F8D3DF] uppercase tracking-wider">
                          {currentUser.role === 'owner' ? 'Store Owner' : currentUser.role === 'admin' ? 'Super Admin' : 'Customer'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (currentUser.role === 'owner') setActiveView('owner');
                          else if (currentUser.role === 'admin') setActiveView('admin');
                          else setActiveView('profile');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[#F7F7F8] text-[#34343A] font-medium cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#777781]" />
                        <span>View My Profile</span>
                      </button>

                      {currentUser.role === 'customer' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setActiveView('bookings');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[#F7F7F8] text-[#34343A] font-medium cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#777781]" />
                          <span>My Bookings & Receipts</span>
                        </button>
                      )}

                      <div className="pt-1 mt-1 border-t border-[#E8E8EC]">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logoutUser();
                            setActiveView('discover');
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[#FCE8EF]/40 text-[#D95368] font-semibold cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={authModalRole}
      />
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          switchUserRole('admin');
          setActiveView('admin');
        }}
      />
    </>
  );
};
