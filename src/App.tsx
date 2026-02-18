

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
// ... (omitting lines between imports and usage for brevity in thought, but tool needs exact match or separate edits. I will do separate edits to be safe or target carefully)
import { LoginPage } from './features/auth';
import { BookingPage } from './features/booking';
import { TermsPage, PrivacyPage } from './features/legal';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import PageSkeleton from './components/common/PageSkeleton';

// Lazy load features
const DashboardPage = React.lazy(() => import('./features/dashboard').then(m => ({ default: m.DashboardPage })));
const ClientsPage = React.lazy(() => import('./features/clients').then(m => ({ default: m.ClientsPage })));
const FinancialPage = React.lazy(() => import('./features/financial').then(m => ({ default: m.FinancialPage })));
const AppointmentsPage = React.lazy(() => import('./features/appointments').then(m => ({ default: m.AppointmentsPage })));
const AgendaPage = React.lazy(() => import('./features/agenda').then(m => ({ default: m.AgendaPage })));
const ProfilePage = React.lazy(() => import('./features/profile').then(m => ({ default: m.ProfilePage })));
const HistoryPage = React.lazy(() => import('./features/history').then(m => ({ default: m.HistoryPage })));
const PublicShopPage = React.lazy(() => import('@/features/public-shop').then(m => ({ default: m.PublicShopPage })));
const BillingPage = React.lazy(() => import('./features/billing').then(m => ({ default: m.BillingPage })));
const LandingPage = React.lazy(() => import('./features/landing').then(m => ({ default: m.LandingPage })));
// Settings
const ShopSettingsPage = React.lazy(() => import('./features/settings').then(m => ({ default: m.ShopSettingsPage })));
const ServicesSettingsPage = React.lazy(() => import('./features/settings').then(m => ({ default: m.ServicesSettingsPage })));
const AppSettingsPage = React.lazy(() => import('./features/settings').then(m => ({ default: m.AppSettingsPage })));
const WebsiteSettingsPage = React.lazy(() => import('./features/settings').then(m => ({ default: m.WebsiteSettingsPage })));
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { BarbershopSetupModal } from './features/profile/components/BarbershopSetupModal';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from './store/auth.store';
import { useUIStore } from './store/ui.store';
import { useBarbershopStore } from './store/barbershop.store';
import { useSubscriptionStore } from './store/subscription.store';
import { SubscriptionGuard } from './guards/SubscriptionGuard';

// Inicializa Firebase App Check para proteção contra abuso
import './lib/firebase-app-check';

import { ToastContainer } from './components/ToastContainer';
import { useFCM } from '@/hooks/useFCM';


const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
  '/appointments': 'Agendamentos',
  '/agenda': 'Agenda',
  '/clients': 'Clientes',
  '/financial': 'Financeiro',
  '/history': 'Histórico',
  '/profile': 'Perfil da Barberia',
  '/billing': 'Assinatura',
  '/settings-shop': 'Config. da Barbearia',
  '/settings-services': 'Serviços',
  '/settings-website': 'Site de Agendamento',
  '/settings-app': 'Configurações',
};

const AuthenticatedLayout = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [title, setTitle] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setTitle(pageTitles[location.pathname] || 'BarberIA');
  }, [location]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  if (!user) return <Navigate to="/login" />;

  return (
    <Layout
      header={<Header title={title} onMenuClick={() => setIsSidebarOpen(true)} />}
      bottomNav={<BottomNav />}
      sidebar={<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
    >
      <ErrorBoundary>
        <React.Suspense fallback={<PageSkeleton />}>
          <SubscriptionGuard>
            <Outlet />
          </SubscriptionGuard>
        </React.Suspense>
      </ErrorBoundary>
    </Layout>
  );
};


const App: React.FC = () => {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const { shopInfo, fetchSettings, settingsLoaded } = useBarbershopStore();
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Hook de Notificações
  const { requestPermissionAndGetToken } = useFCM();

  // Efeito para autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Show toast on login
      if (currentUser) {
        setShowLoginToast(true);
        setTimeout(() => setShowLoginToast(false), 3000);

        // Inicializa o sistema de notificações (solicita permissão e registra token)
        requestPermissionAndGetToken();
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  // Efeito para iniciar listener de subscription
  useEffect(() => {
    if (user) {
      const unsubscribe = useSubscriptionStore.getState().startListening(user.uid);
      return () => unsubscribe();
    } else {
      useSubscriptionStore.getState().setSubscription(null);
    }
  }, [user]);

  // Efeito para carregar settings e verificar onboarding
  useEffect(() => {
    if (user && !settingsLoaded) {
      fetchSettings();
    }
  }, [user, settingsLoaded, fetchSettings]);

  // Efeito para mostrar modal de onboarding quando settings carregarem
  // Só mostra se a assinatura estiver ativa (não para pending_payment, etc)
  const subscriptionStatus = useSubscriptionStore(s => s.subscription?.status);

  useEffect(() => {
    if (user && settingsLoaded) {
      // Só mostra onboarding se a subscription estiver ativa
      const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'demo_approved';
      const needsOnboarding = isActive && !shopInfo.onboardingCompleted;
      setShowSetupModal(needsOnboarding);
    } else {
      setShowSetupModal(false);
    }
  }, [user, settingsLoaded, shopInfo.onboardingCompleted, subscriptionStatus]);

  if (loading) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {showLoginToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-slate-700 text-white px-6 py-3 rounded-lg shadow-2xl shadow-violet-500/20 animate-fade-in-down">
          <p className="font-bold">Login realizado!</p>
          <p className="text-sm text-slate-400">Bem-vindo de volta!</p>
        </div>
      )}

      {/* Global Toasts */}
      <ToastContainer />

      {/* Setup Modal for New Users */}
      <BarbershopSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />

      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/precos" element={<React.Suspense fallback={<PageSkeleton />}><LandingPage /></React.Suspense>} />

            {/* Rotas Internas Protegidas */}
            <Route element={<AuthenticatedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/financial" element={<FinancialPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/settings-shop" element={<ShopSettingsPage />} />
              <Route path="/settings-services" element={<ServicesSettingsPage />} />
              <Route path="/settings-website" element={<WebsiteSettingsPage />} />
              <Route path="/settings-app" element={<AppSettingsPage />} />
              {/* Root Redirect */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Route>

            {/* Rota Pública da Barbearia (Slug) */}
            <Route
              path="/:slug"
              element={
                <React.Suspense fallback={<PageSkeleton />}>
                  <PublicShopPage />
                </React.Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
};

export default App;