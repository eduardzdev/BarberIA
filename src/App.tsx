

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { LoginPage } from './features/auth';
import { BookingPage } from './features/booking';
import { DashboardPage } from './features/dashboard';
import { ClientsPage } from './features/clients';
import { FinancialPage } from './features/financial';
import { AppointmentsPage } from './features/appointments';
import { AgendaPage } from './features/agenda';
import { ProfilePage } from './features/profile';
import { ShopSettingsPage, ServicesSettingsPage, AppSettingsPage, WebsiteSettingsPage } from './features/settings';
import { HistoryPage } from './features/history';
import { Layout } from './components/Layout';
import { PublicShopPage } from '@/features/public-shop';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { BarbershopSetupModal } from './features/profile/components/BarbershopSetupModal';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from './store/auth.store';
import { useUIStore } from './store/ui.store';
import { useBarbershopStore } from './store/barbershop.store';

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
  '/profile': 'Perfil da Empresa',
  '/settings-shop': 'Configurações da Barbearia',
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
      <Outlet />
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

  // Efeito para carregar settings e verificar onboarding
  useEffect(() => {
    if (user && !settingsLoaded) {
      fetchSettings();
    }
  }, [user, settingsLoaded, fetchSettings]);

  // Efeito para mostrar modal de onboarding quando settings carregarem
  useEffect(() => {
    if (user && settingsLoaded) {
      // Mostra modal apenas se onboardingCompleted não for true
      const needsOnboarding = !shopInfo.onboardingCompleted;
      setShowSetupModal(needsOnboarding);
    } else {
      setShowSetupModal(false);
    }
  }, [user, settingsLoaded, shopInfo.onboardingCompleted]);

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

      <HashRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/booking" element={<BookingPage />} />

          {/* Rotas Internas Protegidas */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings-shop" element={<ShopSettingsPage />} />
            <Route path="/settings-services" element={<ServicesSettingsPage />} />
            <Route path="/settings-website" element={<WebsiteSettingsPage />} />
            <Route path="/settings-app" element={<AppSettingsPage />} />
            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Route>

          {/* Rota Pública da Barbearia (Slug) */}
          <Route path="/:slug" element={<PublicShopPage />} />
        </Routes>
      </HashRouter>
    </div>
  );
};

export default App;