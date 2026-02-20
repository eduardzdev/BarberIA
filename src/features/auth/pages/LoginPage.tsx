import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/hooks/useAuth';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/firebase';
import { FaWhatsapp } from 'react-icons/fa';
import { PlanCards } from '@/features/billing/components/PlanCards';
import { BarberCountSelector } from '@/features/billing/components/BarberCountSelector';
import { CheckoutForm } from '@/features/billing/components/CheckoutForm';
import type { PlanType } from '@/types';

/**
 * LoginPage Component
 * 
 * Tela de autenticação com abas:
 * - Login: email/senha + Google OAuth
 * - Cadastro: vitrine de planos + checkout self-service + WhatsApp demo
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    login,
    loginWithGoogle,
    loading,
    error: authError
  } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isVerifyingRedirect, setIsVerifyingRedirect] = useState(true);

  // Register / Checkout state
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
  const [barberCount, setBarberCount] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);

  const whatsappPhone = import.meta.env.VITE_WHATSAPP_BUSINESS_PHONE || '5511999999999';

  // Check for Google OAuth redirect result on mount
  useEffect(() => {
    const verifyRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Login successful via Google redirect');
        }
      } catch (err) {
        console.error('Error checking redirect result:', err);
        setLocalError('Erro ao autenticar com Google. Tente novamente.');
      } finally {
        setIsVerifyingRedirect(false);
      }
    };
    verifyRedirect();
  }, []);

  // Clear errors when switching tabs
  useEffect(() => {
    setLocalError('');
    setShowCheckout(false);
  }, [activeTab]);

  // ─── Login Handlers ───────────────────────────────────────

  const handleLogin = async () => {
    setLocalError('');
    if (!email || !password) {
      setLocalError('Por favor, preencha email e senha.');
      return;
    }
    try {
      await login({ email, password });
    } catch (err) {
      console.error('Auth action error:', err);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  // ─── WhatsApp Demo Handler ────────────────────────────────

  const handleRequestDemo = () => {
    const planName = selectedPlan === 'premium' ? 'Premium' : 'Básico';
    const barberText = barberCount === 1 ? '1 barbeiro' : `${barberCount} barbeiros`;
    const message = `Olá! Tenho interesse no plano ${planName} do BarberIA para ${barberText}. Gostaria de solicitar uma demonstração.`;
    window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const displayError = authError || localError;

  // Loading State: Verifying redirect
  if (isVerifyingRedirect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-300 text-sm">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
      <Card className={`w-full transition-all duration-300 ${activeTab === 'register' ? 'max-w-md' : 'max-w-sm'}`}>
        {/* Logo and Title */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
            <Icon name="scissors" className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">BarberIA</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {activeTab === 'login'
              ? 'Acesse seu painel profissional'
              : 'Gerencie sua barbearia com inteligência'
            }
          </p>
        </div>

        {/* Tabs: Login / Cadastro */}
        <div className="px-4">
          <div className="flex border-b border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-300 ${activeTab === 'login'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-slate-400 hover:text-slate-300'
                }`}
              type="button"
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-300 ${activeTab === 'register'
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-slate-400 hover:text-slate-300'
                }`}
              type="button"
            >
              Cadastro
            </button>
          </div>
        </div>

        {/* ─── LOGIN TAB ─────────────────────────────────── */}
        {activeTab === 'login' && (
          <div className="px-4 pb-6 space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-slate-400" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="seu@email.com"
                disabled={loading}
                className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-slate-400" htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••"
                disabled={loading}
                className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {/* Error */}
            {displayError && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start space-x-2">
                <Icon name="alert" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{displayError}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors duration-300 shadow-lg shadow-violet-600/20 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-2"
            >
              {loading && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{loading ? 'Aguarde...' : 'Entrar'}</span>
            </button>

            {/* Divider */}
            <div className="flex items-center space-x-2">
              <div className="flex-grow h-px bg-slate-700"></div>
              <span className="text-slate-500 text-sm font-medium">ou</span>
              <div className="flex-grow h-px bg-slate-700"></div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-slate-100 text-slate-800 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              <Icon name="google" className="w-5 h-5" />
              <span>Continuar com Google</span>
            </button>
          </div>
        )}

        {/* ─── REGISTER TAB (Sales Landing + Checkout) ───── */}
        {activeTab === 'register' && (
          <div className="px-4 pb-6 space-y-4">
            {showCheckout ? (
              // ── Checkout Form ──────────────────────────────
              <CheckoutForm
                plan={selectedPlan}
                barberCount={barberCount}
                onCancel={() => setShowCheckout(false)}
              />
            ) : (
              // ── Sales Landing ──────────────────────────────
              <>
                {/* Plan Cards */}
                <PlanCards
                  selectedPlan={selectedPlan}
                  onSelectPlan={setSelectedPlan}
                />

                {/* Barber Count Selector */}
                <BarberCountSelector
                  plan={selectedPlan}
                  count={barberCount}
                  onChange={setBarberCount}
                />

                {/* CTA: Assinar Agora */}
                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-lg hover:bg-violet-700 transition-colors duration-300 shadow-lg shadow-violet-600/20 flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>Assinar Agora</span>
                </button>

                {/* Divider */}
                <div className="flex items-center space-x-2">
                  <div className="flex-grow h-px bg-slate-700"></div>
                  <span className="text-slate-500 text-xs">ainda na dúvida?</span>
                  <div className="flex-grow h-px bg-slate-700"></div>
                </div>

                {/* CTA: Solicitar Demo (WhatsApp) */}
                <button
                  type="button"
                  onClick={handleRequestDemo}
                  className="w-full bg-green-600 text-white font-bold py-3.5 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  <span>Solicitar Demonstração</span>
                </button>

                {/* Link to login */}
                <p className="text-center text-sm text-slate-500">
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                  >
                    Faça login
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

