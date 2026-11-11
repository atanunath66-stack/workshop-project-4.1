import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { HeroSection } from './components/customer/HeroSection';
import { CategoryBar } from './components/customer/CategoryBar';
import { PromotionalBanners } from './components/customer/PromotionalBanners';
import { RestaurantGrid } from './components/customer/RestaurantGrid';
import { RestaurantDetailsPage } from './components/customer/RestaurantDetailsPage';
import { InteractiveMapModal } from './components/customer/InteractiveMapModal';
import { LocationSelectorModal } from './components/common/LocationSelectorModal';
import { CustomerBookingsView } from './components/customer/CustomerBookingsView';
import { CustomerProfileView } from './components/customer/CustomerProfileView';
import { OwnerPortal } from './components/owner/OwnerPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { Booking, Restaurant } from './types';
import { Utensils, Heart, Sparkles, ShieldCheck, Lock } from 'lucide-react';
import { AdminGatekeeperLock } from './components/admin/AdminGatekeeperLock';
import { GoogleSignInModal } from './components/common/GoogleSignInModal';

const MainContent: React.FC = () => {
  const {
    currentUser,
    selectedRestaurant,
    setSelectedRestaurant,
    setActiveBookingForTracking,
    isAdminAuthenticated,
    setIsAdminLoginModalOpen,
    isGoogleSignInModalOpen,
    setIsGoogleSignInModalOpen,
    googleSignInRole,
  } = useApp();

  const [activeView, setActiveView] = useState<'discover' | 'map' | 'bookings' | 'owner' | 'admin' | 'profile'>('discover');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Switch view if user changed role directly
  React.useEffect(() => {
    if (currentUser.role === 'admin' && activeView !== 'admin') {
      if (isAdminAuthenticated) {
        setActiveView('admin');
      } else {
        setIsAdminLoginModalOpen(true);
      }
    } else if (currentUser.role === 'owner' && activeView !== 'owner') {
      setActiveView('owner');
    }
  }, [currentUser.role, isAdminAuthenticated]);

  const handleSelectRestaurant = (rest: Restaurant) => {
    setSelectedRestaurant(rest);
  };

  const handleBookingCreated = (booking: Booking) => {
    setSelectedRestaurant(null);
    setActiveBookingForTracking(booking);
    setActiveView('bookings');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1C1917]">
      {/* Top Header */}
      <Header activeView={activeView} setActiveView={setActiveView} />

      {/* Main Body */}
      <main className="flex-1">
        {/* If Restaurant Details is opened */}
        {selectedRestaurant ? (
          <RestaurantDetailsPage
            restaurant={selectedRestaurant}
            onBack={() => setSelectedRestaurant(null)}
            onBookingCreated={handleBookingCreated}
          />
        ) : activeView === 'discover' ? (
          <div>
            <HeroSection
              onOpenMap={() => setIsMapModalOpen(true)}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
            />
            <CategoryBar />
            <PromotionalBanners />
            <RestaurantGrid
              onSelectRestaurant={handleSelectRestaurant}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
            />
          </div>
        ) : activeView === 'map' ? (
          <div>
            <CategoryBar />
            <div className="py-6">
              <InteractiveMapModal
                isOpen={true}
                onClose={() => setActiveView('discover')}
                onSelectRestaurant={handleSelectRestaurant}
              />
            </div>
            <RestaurantGrid
              onSelectRestaurant={handleSelectRestaurant}
              onOpenLocationModal={() => setIsLocationModalOpen(true)}
            />
          </div>
        ) : activeView === 'bookings' ? (
          <CustomerBookingsView onDiscoverMore={() => setActiveView('discover')} />
        ) : activeView === 'profile' ? (
          <CustomerProfileView
            onGoToBookings={() => setActiveView('bookings')}
            onDiscover={() => setActiveView('discover')}
          />
        ) : activeView === 'owner' ? (
          <OwnerPortal />
        ) : activeView === 'admin' ? (
          !isAdminAuthenticated ? (
            <AdminGatekeeperLock
              onUnlockSuccess={() => setActiveView('admin')}
              onCancel={() => setActiveView('discover')}
            />
          ) : (
            <AdminPortal />
          )
        ) : null}
      </main>

      {/* Global Interactive Map Modal */}
      <InteractiveMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSelectRestaurant={(rest) => {
          setIsMapModalOpen(false);
          setSelectedRestaurant(rest);
        }}
      />

      {/* Global Location Selector Modal */}
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Interactive Google Sign-In Account Chooser for Customers & Shop Owners */}
      <GoogleSignInModal
        isOpen={isGoogleSignInModalOpen}
        onClose={() => setIsGoogleSignInModalOpen(false)}
        targetRole={googleSignInRole}
      />

      {/* Footer */}
      <footer className="bg-stone-900 text-white border-t border-stone-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="text-xl font-extrabold font-display flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#E8A0B5] text-stone-900 flex items-center justify-center font-black text-sm shadow-xs">
                  🥔
                </span>
                <span>Aloo<span className="text-[#E8A0B5]">Khaoge</span></span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Empowering small local restaurants, food stalls, and hidden culinary gems to thrive with digital pre-booking, 50% advance payments, and transparent cancellations.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#238B68]">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Hyperlocal Platform</span>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
                Culinary Categories
              </div>
              <ul className="space-y-1.5 text-stone-400">
                <li>Street Food & Chaat</li>
                <li>Charcoal Kebabs & Kati Rolls</li>
                <li>South Indian Benne Dosa</li>
                <li>Artisanal Kulhad Chai & Bakeries</li>
                <li>Bengali Sweets & Delicacies</li>
              </ul>
            </div>

            <div className="text-xs space-y-2">
              <div className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
                Portals & Access
              </div>
              <ul className="space-y-1.5 text-stone-400">
                <li>
                  <button onClick={() => { setSelectedRestaurant(null); setActiveView('discover'); }} className="hover:text-white">
                    Customer Discovery
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedRestaurant(null); setActiveView('bookings'); }} className="hover:text-white">
                    Digital Invoices & Bookings
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedRestaurant(null); setActiveView('owner'); }} className="hover:text-white">
                    Restaurant Owner Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setSelectedRestaurant(null);
                      if (!isAdminAuthenticated) {
                        setIsAdminLoginModalOpen(true);
                      } else {
                        setActiveView('admin');
                      }
                    }}
                    className="hover:text-white inline-flex items-center gap-2 transition-colors"
                  >
                    <span>Super Admin Console</span>
                    {isAdminAuthenticated ? (
                      <span className="text-[9px] px-1.5 py-0.5 bg-[#238B68]/20 text-[#238B68] border border-[#238B68]/30 rounded font-mono font-semibold">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 bg-stone-800 text-stone-400 border border-stone-700 rounded font-mono font-medium flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-[#E8A0B5]" />
                        <span>Locked</span>
                      </span>
                    )}
                  </button>
                </li>
              </ul>
            </div>

            <div className="text-xs space-y-2">
              <div className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">
                Payment & Cancellation Guarantee
              </div>
              <p className="text-stone-400 leading-relaxed text-[11px]">
                Built with Razorpay checkout. 50% advance secures your table and fresh preparation. Upfront cancellation rules guarantee fair refunds without surprises.
              </p>
              <div className="pt-2 text-[10px] text-stone-500 font-mono">
                © 2026 AlooKhaoge Technologies Pvt Ltd.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
